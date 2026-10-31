import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { Script } from 'node:vm'
import postcss from 'postcss'
import valueParser from 'postcss-value-parser'
import { bundleCss } from './package-forum-assets.mjs'
import { patchHeader, patchStyle, rewriteAssets } from './publish-forum-assets.mjs'

test('imports are flattened, quoted semicolons preserved, media and local font URLs retained', async () => {
  const server = createServer((req, res) => {
    if (req.url.startsWith('/child')) res.end('@font-face{font-family:"Test";src:url("/font.woff2") format("woff2")} .child{color:red}')
    else if (req.url === '/font.woff2') { res.setHeader('content-type', 'font/woff2'); res.end(Buffer.from('test-font')) }
    else { res.statusCode = 404; res.end() }
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  try {
    const base = `http://127.0.0.1:${server.address().port}/main.css`
    const css = await bundleCss('@import "child.css?weights=400;700" screen and (min-width:1px);.main{background:url(https://forumstatic.ru/a.png)}', base)
    assert.ok(!css.includes('@import'))
    assert.ok(css.includes('@media screen and (min-width:1px)'))
    assert.ok(css.includes('assets/fd-'))
    assert.ok(css.includes('font-display:swap') || css.includes('font-display: swap'))
    assert.ok(css.includes('https://forumstatic.ru/a.png'))
  } finally { await new Promise(resolve => server.close(resolve)) }
})

test('publication only changes managed references and preserves custom/private HTML', () => {
  const style = '/* forum-local:start */\n@import url("old");\n/* forum-local:end */\n.custom{color:blue}'
  assert.ok(patchStyle(style, 'https://forumstatic.ru/new.css').endsWith('.custom{color:blue}'))
  const header = '<script id="forum-local-loader" src="old"></script><div>private content</div>'
  assert.ok(patchHeader(header, 'https://forumstatic.ru/new.css', 'https://forumstatic.ru/new.js').endsWith('<div>private content</div>'))
  assert.throws(() => patchStyle('.custom{}', 'new'))
  assert.throws(() => patchHeader('<script>custom()</script>', 'new', 'new'))
  assert.throws(() => rewriteAssets('url(assets/fd-abcdef.woff2)', {}))
})

test('built package contains no external CSS/font dependency and ASCII JS is valid', async () => {
  const css = await readFile('dist/forum-local/forum-local.css', 'utf8')
  const manifest = JSON.parse(await readFile('dist/forum-local/manifest.json', 'utf8'))
  const root = postcss.parse(css)
  const imports = []; root.walkAtRules('import', rule => imports.push(rule))
  assert.equal(imports.length, 0)
  for (const asset of manifest.assets) assert.ok((await readFile(`dist/forum-local/${asset.file}`)).length > 0)
  root.walkDecls(decl => valueParser(decl.value).walk(node => {
    if (node.type === 'function' && node.value === 'url') {
      const url = node.nodes.map(child => child.value).join('')
      assert.ok(!url || /^(data:|#|assets\/|https:\/\/(forumstatic\.ru|forumavatars\.ru|upforme\.ru)\/)/.test(url), url)
    }
  }))
  const js = await readFile('dist/forum-local/forum-local.js', 'utf8')
  assert.ok(!/[^\x00-\x7f]/.test(js))
  new Script(js)
  for (const plugin of manifest.plugins) {
    const source = await readFile(`dist/forum-local/${plugin.file}`, 'utf8')
    assert.ok(!/[^\x00-\x7f]/.test(source))
    assert.ok(!/@import[^;]*github\.io/.test(source))
    new Script(source)
  }
})
