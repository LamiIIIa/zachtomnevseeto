import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import postcss from 'postcss'
import valueParser from 'postcss-value-parser'
import { pluginDefinitions, pluginContentHash } from './plugin-config.mjs'
import { preparePlugin } from './prepare-plugins.mjs'

const FORUM_HOSTS = new Set(['forumstatic.ru', 'forumavatars.ru', 'upforme.ru'])
const cache = new Map()
const report = []
const assetFiles = new Map()
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'

async function download(url) {
  if (!cache.has(url)) cache.set(url, (async () => {
    const key = createHash('sha256').update(url + UA).digest('hex')
    const cacheFile = path.resolve('.forum-asset-cache', key)
    try { return { bytes: await readFile(cacheFile), type: await readFile(cacheFile + '.type', 'utf8') } } catch {}
    let response
    for (let attempt = 0; attempt < 3; attempt++) {
      try { response = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(60000) }); break }
      catch (error) { if (attempt === 2) throw error }
    }
    if (!response.ok) throw new Error(`Asset HTTP ${response.status}: ${url}`)
    const bytes = Buffer.from(await response.arrayBuffer())
    const type = response.headers.get('content-type')?.split(';')[0] ?? 'application/octet-stream'
    report.push({ url, bytes: bytes.length, type })
    await mkdir(path.dirname(cacheFile), { recursive: true })
    await writeFile(cacheFile, bytes)
    await writeFile(cacheFile + '.type', type)
    return { bytes, type }
  })())
  return cache.get(url)
}

function localAsset(bytes, type, source) {
  const ext = /woff2/i.test(type + source) ? 'woff2' : /woff/i.test(type + source) ? 'woff' : /ttf/i.test(type + source) ? 'ttf' : /otf/i.test(type + source) ? 'otf' : /svg/i.test(type) ? 'svg' : /png/i.test(type) ? 'png' : /jpe?g/i.test(type) ? 'jpg' : 'bin'
  if (ext === 'bin') throw new Error(`Unsupported asset type ${type}: ${source}`)
  const name = `fd-${createHash('sha256').update(bytes).digest('hex').slice(0, 20)}.${ext}`
  assetFiles.set(name, bytes)
  return `assets/${name}`
}

function decodeCss({ bytes }) {
  // Legacy forum styles use windows-1251; CSS syntax and URLs are ASCII.
  const utf8 = bytes.toString('utf8')
  return utf8.includes('\ufffd') ? new TextDecoder('windows-1251').decode(bytes) : utf8
}

export async function bundleCss(source, base, ancestors = new Set()) {
  const root = postcss.parse(source, { from: base })
  const imports = []
  root.walkAtRules('import', rule => imports.push(rule))
  for (const rule of imports) {
    const nodes = valueParser(rule.params).nodes.filter(n => n.type !== 'space' && n.type !== 'comment')
    const first = nodes[0]
    const ref = first?.type === 'function' && first.value === 'url'
      ? first.nodes.map(n => n.value).join('') : first?.value
    if (!ref) throw new Error(`Unsupported CSS import: ${rule.params}`)
    const url = new URL(ref, base).href
    if (ancestors.has(url)) throw new Error(`Circular CSS import: ${url}`)
    const next = new Set([...ancestors, url])
    const nested = await bundleCss(decodeCss(await download(url)), url, next)
    const media = rule.params.slice(first.sourceEndIndex).trim()
    if (media) {
      // Never silently flatten conditional imports.
      if (/\b(layer|supports)\b/.test(media)) throw new Error(`Unsupported conditional import: ${media}`)
      const wrapper = postcss.atRule({ name: 'media', params: media })
      wrapper.append(postcss.parse(nested).nodes)
      rule.replaceWith(wrapper)
    } else rule.replaceWith(postcss.parse(nested).nodes)
  }
  const declarations = []
  root.walkDecls(decl => declarations.push(decl))
  for (const decl of declarations) {
    if (decl.parent.type === 'atrule' && decl.parent.name === 'font-face' && decl.prop === 'src') {
      // One modern format avoids embedding four copies of the same font.
      const candidates = valueParser(decl.value).nodes
      const groups = [[]]
      for (const node of candidates) {
        if (node.type === 'div' && node.value === ',') groups.push([])
        else groups.at(-1).push(node)
      }
      const woff2 = groups.find(group => /woff2/.test(valueParser.stringify(group)))
      if (woff2) decl.value = valueParser.stringify(woff2)
    }
    const parsed = valueParser(decl.value)
    const jobs = []
    parsed.walk(node => {
      if (node.type !== 'function' || node.value !== 'url') return
      const raw = node.nodes.map(n => n.value).join('')
      if (!raw || raw.startsWith('#')) return
      if (raw.startsWith('data:')) {
        const match = raw.match(/^data:([^;,]+);base64,(.*)$/s)
        if (match && /font|woff|ttf|otf/.test(match[1])) {
          node.nodes = [{ type: 'string', quote: '"', value: localAsset(Buffer.from(match[2], 'base64'), match[1], '') }]
        }
        return
      }
      if (raw.startsWith('assets/fd-')) return
      jobs.push((async () => {
        const url = new URL(raw, base)
        const font = /\.(woff2?|ttf|otf|eot)(\?|$)/i.test(url.href)
        if (FORUM_HOSTS.has(url.hostname) && !font) {
          node.nodes = [{ type: 'string', quote: '"', value: url.href }]
          return
        }
        if (url.protocol === 'file:') throw new Error(`Unresolved local build asset: ${url.href}`)
        const asset = await download(url.href)
        const mime = font && /\.woff2(\?|$)/i.test(url.href) ? 'font/woff2' : asset.type
        node.nodes = [{ type: 'string', quote: '"', value: localAsset(asset.bytes, mime, url.href) }]
      })())
    })
    await Promise.all(jobs)
    decl.value = parsed.toString()
    if (decl.parent.type === 'atrule' && decl.parent.name === 'font-face' && !decl.parent.nodes.some(n => n.prop === 'font-display')) {
      decl.parent.append({ prop: 'font-display', value: 'swap' })
    }
  }
  root.walkAtRules('charset', rule => rule.remove())
  return root.toString()
}

export async function packageAssets(dir = 'dist') {
  const source = await readFile(path.join(dir, 'forum.css'), 'utf8')
  // MyBB serves uploaded text as windows-1251; keep CSS and JS ASCII-safe.
  const bundled = (await bundleCss(source, pathToFileURL(path.resolve(dir, 'forum.css')).href))
    .replace(/[^\x00-\x7f]/gu, char => `\\${char.codePointAt(0).toString(16)} `)
  if (/@import\s/i.test(bundled)) throw new Error('Unresolved CSS import remains')
  const cssBytes = Buffer.byteLength(bundled)
  if (cssBytes >= 10 * 1024 * 1024) throw new Error(`Portable CSS exceeds MyBB 10MB limit: ${cssBytes}`)
  const out = path.join(dir, 'forum-local')
  await mkdir(out, { recursive: true })
  await mkdir(path.join(out, 'assets'), { recursive: true })
  for (const [name, bytes] of assetFiles) await writeFile(path.join(out, 'assets', name), bytes)
  await writeFile(path.join(out, 'forum-local.css'), bundled)
  const js = Buffer.from((await readFile(path.join(dir, 'forum.js'), 'utf8'))
    .replace(/[^\x00-\x7f]/g, char => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`))
  await writeFile(path.join(out, 'forum-local.js'), js)
  // Public platform runtime used by compatibility tests only, never published.
  await writeFile(path.join(out, 'test-mybb-libs.js'), (await download('https://akatsukigood.forum.cool/js/libs.min.js?v=4')).bytes)
  const plugins = []
  for (const plugin of pluginDefinitions) {
    const source = preparePlugin(plugin.id, await readFile(`src/plugins/${plugin.filename}`, 'utf8'))
      .replace(/[^\x00-\x7f]/g, char => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`)
    const file = plugin.filename
    await writeFile(path.join(out, file), source)
    plugins.push({ ...plugin, file, bytes: Buffer.byteLength(source), sha256: createHash('sha256').update(source).digest('hex'), sourceHash: pluginContentHash(source) })
  }
  const extras = []
  for (const id of ['quote-avatars', 'post-preview', 'profile-masks']) {
    const source = (await readFile(`src/plugins/compat/${id}.js`, 'utf8'))
      .replace(/[^\x00-\x7f]/g, char => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`)
    const file = `fd-extra-${id}-${createHash('sha256').update(source).digest('hex').slice(0, 20)}.js`
    await writeFile(path.join(out, file), source)
    extras.push({ id, file, bytes: Buffer.byteLength(source) })
  }
  await writeFile(path.join(out, 'manifest.json'), JSON.stringify({
    revision: process.env.GITHUB_SHA || 'local',
    css: { file: 'forum-local.css', bytes: cssBytes, sha256: createHash('sha256').update(bundled).digest('hex') },
    js: { file: 'forum-local.js', bytes: js.length, sha256: createHash('sha256').update(js).digest('hex') },
    embedded: report,
    plugins,
    extras,
    assets: [...assetFiles].map(([file, bytes]) => ({ file: `assets/${file}`, bytes: bytes.length })),
  }, null, 2))
  console.log(`Portable assets: CSS ${cssBytes} bytes; JS ${js.length} bytes; ${report.length} external dependencies bundled.`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await packageAssets()
