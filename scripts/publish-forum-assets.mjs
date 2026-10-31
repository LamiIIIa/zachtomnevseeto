import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from 'playwright'
import { renderPrepaint } from './prepaint.mjs'
import { patchPluginFooter, stripHeaderPluginCopies } from './background-plugins.mjs'
import { patchExtras } from './deferred-extras.mjs'
import { auditDesignFiles } from './design-file-audit.mjs'
import { updateManagedPlugins, labelManagedPlugins, restoreManagedPlugins } from './managed-plugin-files.mjs'

const origin = 'https://akatsukigood.forum.cool'
const hash = value => createHash('sha256').update(value).digest('hex').slice(0, 20)
const markers = /\/\* forum-local:start \*\/[\s\S]*?\/\* forum-local:end \*\//

export function patchStyle(source, cssUrl) {
  if (!markers.test(source)) throw new Error('Managed CSS markers are missing; refusing to replace custom styles')
  return source.replace(markers, `/* forum-local:start */\n@import url("${cssUrl}");\n/* forum-local:end */`)
}

export function patchHeader(source, cssUrl, jsUrl) {
  const pattern = /<script\b[^>]*\bid="forum-local-loader"[^>]*>[\s\S]*?<\/script>/
  if (!pattern.test(source)) throw new Error('Managed JS loader is missing; refusing to replace HTML')
  // Regenerate the inline first-paint copy on every publication, from the repo.
  const withoutOldPrepaint = source
    .replace(/<!-- forum-prepaint:start -->[\s\S]*?<!-- forum-prepaint:end -->\s*/g, '')
    .replace(/<style\b[^>]*\bid="forum-early-render-style"[^>]*>[\s\S]*?<\/style>\s*/g, '')
    .replace(/<link\b[^>]*\bid="forum-style-hint"[^>]*>\s*/g, '')
  const updated = withoutOldPrepaint.replace(pattern, `<script id="forum-local-loader" src="${jsUrl}" charset="utf-8" data-forum-css="${cssUrl}" fetchpriority="high" defer></script>`)
  return renderPrepaint() + `\n<link id="forum-style-hint" rel="preload" as="style" href="${cssUrl}" fetchpriority="high">\n` + updated
}

export function rewriteAssets(css, mapping) {
  return css.replace(/assets\/(fd-[a-f0-9]+\.[a-z0-9]+)/g, (full, name) => {
    if (!mapping[name]) throw new Error(`Unpublished asset: ${name}`)
    return mapping[name]
  })
}

async function readEditor(page, name) {
  return page.locator(`textarea[name="${name}"]`).inputValue()
}

async function saveEditor(page, name, content) {
  await page.evaluate(({ name, content }) => {
    const field = document.querySelector(`textarea[name="${name}"]`)
    if (!field) throw new Error('Expected editor is missing')
    const editor = field.nextElementSibling
    if (editor?.classList.contains('ace_editor') && window.ace) window.ace.edit(editor).setValue(content, -1)
    field.value = content
    field.dispatchEvent(new Event('input', { bubbles: true }))
    field.dispatchEvent(new Event('change', { bubbles: true }))
  }, { name, content })
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    page.getByRole('button', { name: 'Сохранить', exact: true }).first().click(),
  ])
}

async function fileMapping(page) {
  return page.locator('#filetable tr').evaluateAll(rows => Object.fromEntries(rows.map(row => {
    const name = row.querySelector('input[type="text"]')?.value
    const url = row.querySelector('a[href*="forumstatic.ru/files/"]')?.href
    return [name, url]
  }).filter(([name, url]) => name && url)))
}

async function upload(page, files, mapping) {
  const missing = files.filter(file => !mapping[path.basename(file)])
  if (!missing.length) return mapping
  await page.locator('input[type="file"]').setInputFiles(missing)
  for (const file of missing) {
    await page.waitForFunction(name => [...document.querySelectorAll('#filetable input[type="text"]')].some(el => el.value === name), path.basename(file), { timeout: 180000 })
  }
  return { ...mapping, ...await fileMapping(page) }
}

async function instrument(page) {
  const session = await page.context().newCDPSession(page)
  await session.send('Network.enable')
  await session.send('Network.setCacheDisabled', { cacheDisabled: true })
  await page.addInitScript(() => {
    document.addEventListener('forum-design:ready', () => { window.__forumDesignReadyAt = performance.now() }, { once: true })
  })
}
async function timings(page) {
  return page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0]
    return { dcl: Math.round(nav.domContentLoadedEventEnd), load: Math.round(nav.loadEventEnd), design: Math.round(window.__forumDesignReadyAt || 0) }
  })
}

export async function publish() {
  if (!process.env.FORUM_USERNAME || !process.env.FORUM_PASSWORD) throw new Error('Set FORUM_USERNAME and FORUM_PASSWORD in repository Actions Secrets')
  const dir = path.resolve('dist/forum-local')
  const manifest = JSON.parse(await readFile(path.join(dir, 'manifest.json'), 'utf8'))
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  // Admin pages do not need public plugins, ads, or the current design JS.
  await context.route('**/*', route => {
    const host = new URL(route.request().url()).hostname
    return host === new URL(origin).hostname || host === 'forumstatic.ru' ? route.continue() : route.abort()
  })
  try {
    const login = await context.newPage()
    await login.goto(`${origin}/login.php`)
    // The header also contains a PR login form with the same input names.
    const loginForm = login.locator('form').filter({ has: login.locator('#fld1') })
    await loginForm.locator('input[name="req_username"]').fill(process.env.FORUM_USERNAME)
    await loginForm.locator('input[name="req_password"]').fill(process.env.FORUM_PASSWORD)
    await loginForm.locator('input[type="submit"], button[type="submit"]').first().click()
    await login.waitForLoadState('domcontentloaded')
    const files = await context.newPage(), style = await context.newPage(), forms = await context.newPage(), pluginEditor = await context.newPage()
    await Promise.all([files.goto(`${origin}/admin_files.php`), style.goto(`${origin}/admin_style.php`), forms.goto(`${origin}/admin_forms.php`)])
    const originalStyle = await readEditor(style, 'form[content1]')
    const originalHeader = await readEditor(forms, 'form[o_html_header]')
    const originalFooter = await readEditor(forms, 'form[o_html_footer]')
    const baseline = await context.newPage()
    await instrument(baseline)
    await baseline.setViewportSize({ width: 390, height: 844 })
    await baseline.goto(`${origin}/?fd_bench_before=${Date.now()}`)
    await baseline.locator('.punbb.forum-design--ready').waitFor({ timeout: 45000 })
    const beforeTimings = await timings(baseline)
    await baseline.close()
    // Validate both targets before uploading anything.
    patchStyle(originalStyle, 'https://forumstatic.ru/placeholder.css')
    patchHeader(originalHeader, 'https://forumstatic.ru/placeholder.css', 'https://forumstatic.ru/placeholder.js')
    const placeholderPlugins = Object.fromEntries(manifest.plugins.map(plugin => [plugin.id, `https://forumstatic.ru/${plugin.file}`]))
    patchPluginFooter(originalFooter, placeholderPlugins, { requireAll: true })
    let mapping = await fileMapping(files)
    mapping = await upload(files, manifest.assets.map(asset => path.join(dir, asset.file)), mapping)
    mapping = await upload(files, manifest.extras.map(extra => path.join(dir, extra.file)), mapping)
    const extraUrls = Object.fromEntries(manifest.extras.map(extra => [extra.id, mapping[extra.file]]))
    const css = rewriteAssets(await readFile(path.join(dir, 'forum-local.css'), 'utf8'), mapping)
    const js = await readFile(path.join(dir, 'forum-local.js'), 'utf8')
    const cssName = `fd-style-${hash(css)}.css`, jsName = `fd-script-${hash(js)}.js`
    await writeFile(path.join(dir, cssName), css)
    await writeFile(path.join(dir, jsName), js)
    mapping = await upload(files, [path.join(dir, cssName), path.join(dir, jsName)], mapping)
    const cssUrl = mapping[cssName], jsUrl = mapping[jsName]
    let styleChanged = false, headerChanged = false, footerChanged = false
    const pluginBackups = []
    let pluginPublication
    try {
      pluginPublication = await updateManagedPlugins({ files, editor: pluginEditor, dir, manifest, footer: originalFooter, saveEditor, backups: pluginBackups })
      const pluginUrls = pluginPublication.urls
      const legacyUrls = Object.fromEntries(manifest.plugins.map(plugin => [plugin.id, pluginPublication.retired.filter(row => row.id === plugin.id).map(row => row.url)]))
      const sourceHashes = Object.fromEntries(manifest.plugins.map(plugin => [plugin.id, plugin.sourceHash]))
      styleChanged = true
      await saveEditor(style, 'form[content1]', patchStyle(originalStyle, cssUrl))
      headerChanged = true
      await saveEditor(forms, 'form[o_html_header]', patchExtras(patchHeader(stripHeaderPluginCopies(originalHeader, legacyUrls), cssUrl, jsUrl), 'header', extraUrls))
      footerChanged = true
      await saveEditor(forms, 'form[o_html_footer]', patchExtras(patchPluginFooter(originalFooter, pluginUrls, { requireAll: true, legacyUrls, sourceHashes }), 'footer', extraUrls))
      const check = await context.newPage()
      await instrument(check)
      await check.setViewportSize({ width: 390, height: 844 })
      // Login can cache the index with the previous footer. Verify freshly
      // rendered HTML rather than that pre-publication navigation response.
      const verification = `${manifest.revision}-${Date.now()}`
      await check.goto(`${origin}/?fd_verify=${verification}`)
      await check.locator('.punbb.forum-design--ready').waitFor({ timeout: 45000 })
      await check.waitForFunction(() => window.forumDeferredExtras?.ready, null, { timeout: 45000 })
      await check.waitForFunction(() => typeof window.notifications === 'object' && typeof window.realtime === 'object')
      const afterTimings = await timings(check)
      const extrasErrors = await check.evaluate(() => window.forumDeferredExtras.errors)
      console.log('Verified cold index timings, same CI runner/route filter: ' + JSON.stringify({ before: beforeTimings, after: afterTimings, extrasErrors }))
      if (extrasErrors.length) throw new Error('Optional script execution failed')
      const visible = await check.locator('#pun').evaluate(el => getComputedStyle(el).opacity !== '0')
      if (!visible) throw new Error('Forum remained hidden after publication')
      for (const width of [390, 1280]) {
        await check.setViewportSize({ width, height: 844 })
        const mainVisible = await check.locator('#pun-main').evaluate(el => getComputedStyle(el).opacity !== '0')
        if (!mainVisible || await check.locator('#forum-prepaint-placeholder').count()) throw new Error(`First-paint gate did not release at ${width}px`)
      }
      if (await check.locator('#forum-tools').count()) throw new Error('Unexpected global tools outside reply form')
      if (await check.locator('script[data-forum-plugin-loaded="technique-search"],script[data-forum-plugin-loaded="battle-assistant"]').count()) throw new Error('Editor tools loaded on index without reply form')
      if (await check.locator('script[src*="/11008.js"]').count() || await check.locator('script[data-forum-plugin-loaded="shop"]').count()) throw new Error('Shop loaded outside its topic')
      if (await check.locator('script[src*="/24002.js"]:not([data-forum-plugin-loaded]),script[src*="/28054.js"]:not([data-forum-plugin-loaded]),script[src*="/80230.js"]:not([data-forum-plugin-loaded])').count()) throw new Error('Old blocking plugin reference remains')
      await check.goto(`${origin}/viewtopic.php?id=448&fd_verify=${verification}`)
      await check.locator('form .ats-launcher-button').waitFor({ timeout: 45000 })
      await check.locator('form .aba-launcher-button').waitFor({ timeout: 45000 })
      const topicErrors = await check.evaluate(() => window.forumDeferredExtras.errors)
      console.log('Verified topic extras: ' + JSON.stringify(topicErrors))
      if (topicErrors.length) throw new Error('Topic enhancements failed')
      if (await check.locator('#forum-tools').count()) throw new Error('Unexpected global tools on topic')
    } catch (error) {
      if (styleChanged) {
        await style.goto(`${origin}/admin_style.php`)
        await saveEditor(style, 'form[content1]', originalStyle)
      }
      if (headerChanged) {
        await forms.goto(`${origin}/admin_forms.php`)
        await saveEditor(forms, 'form[o_html_header]', originalHeader)
      }
      if (footerChanged) {
        await forms.goto(`${origin}/admin_forms.php`)
        await saveEditor(forms, 'form[o_html_footer]', originalFooter)
      }
      await restoreManagedPlugins(pluginEditor, pluginBackups, saveEditor)
      throw error
    }
    // Tagging is metadata-only. If it fails, do not reconnect already-retired
    // copies by rolling a fully verified functional release back to old HTML.
    await labelManagedPlugins(files, pluginPublication)
    await auditDesignFiles(files, forms, style, css + '\n' + js, dir)
    console.log('Managed plugin files: ' + JSON.stringify(pluginPublication.urls))
    console.log('Archived generated plugin copies (not deleted): ' + pluginPublication.retired.map(row => row.file).join(', '))
    console.log(`Published ${manifest.revision}: ${cssUrl} ${jsUrl}`)
  } finally { await browser.close() }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await publish()
