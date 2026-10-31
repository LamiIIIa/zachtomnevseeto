import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import { patchPluginFooter, pluginSources } from './background-plugins.mjs'

const manifest = JSON.parse(await readFile('dist/forum-local/manifest.json', 'utf8'))
const sources = Object.fromEntries(await Promise.all(manifest.plugins.map(async p => [p.id, await readFile(`dist/forum-local/${p.file}`, 'utf8')])))
const urls = Object.fromEntries(Object.keys(pluginSources).map(id => [id, `https://fixture.test/${id}.js`]))
const original = Object.entries(pluginSources).map(([id, file]) => `<script charset="utf-8" data-base-url="https://fixture.test" data-bridge-origins="https://bridge.test" src="https://forumstatic.ru/files/001a/12/f3/${file}.js?v=1"></script>`).join('\n') + '<div id="custom">Custom content</div>'
const footer = patchPluginFooter(original, urls, { requireAll: true })
assert.equal(patchPluginFooter(footer, urls, { requireAll: true }), footer)
assert.ok(footer.includes('<div id="custom">Custom content</div>'))
assert.throws(() => patchPluginFooter('', urls, { requireAll: true }))
assert.equal((footer.match(/data-forum-plugin="/g) || []).length, 4)
const fixture = (group, gallery = false, editor = false) => `<!doctype html><html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><script>window.GroupID=${group};window.__executed=[];window.AKATSUKI_SHOP_CONFIG={baseUrl:location.origin,mountTopicId:202,mountPostId:2235};window.AKATSUKI_BATTLE_ASSISTANT={baseUrl:location.origin};</script><div id="pun"><div class="punbb" id="${editor ? 'pun-viewtopic' : 'pun-index'}"><nav id="pun-navlinks"></nav><main id="pun-main"><p>Design content</p>${editor ? '<form action="post.php"><textarea name="req_message"></textarea><input name="submit" type="submit"><input name="preview" type="submit"></form>' : ''}<div id="p2235"><div class="post-content"></div></div>${gallery ? '<div style="height:2400px"></div><div id="forum_f8" style="width:360px;max-width:100%"><div class="tclcon"><a href="viewforum.php?id=8">Gallery</a></div></div>' : ''}</main>${footer}</div></div>`
const browser = await chromium.launch({ headless: true, ...(process.env.FORUM_TEST_BROWSER ? { channel: process.env.FORUM_TEST_BROWSER } : {}) })
try {
  async function open(group, pathname = '/', gallery = false, editor = false) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    const requested = [], errors = []
    page.on('pageerror', e => errors.push(e.message))
    await page.addInitScript(() => {
      sessionStorage.setItem('akatsuki-npc-gallery-v17-topic-214', JSON.stringify({marker:9999999999,cards:Array.from({length:10},(_,i)=>({id:i+1,name:'NPC '+i,image:location.origin+'/npc-'+i+'.png',url:location.origin+'/viewtopic.php?id=214',loyalty:'Konoha'}))}))
    })
    await page.route('**/*', async route => {
      const url = new URL(route.request().url())
      requested.push(url.pathname)
      const id = Object.keys(urls).find(id => url.pathname === `/${id}.js`)
      if (id) return route.fulfill({ contentType: 'application/javascript', body: `window.__executed.push({id:${JSON.stringify(id)},ready:!!document.querySelector('.forum-design--ready'),loaded:document.readyState});\n` + sources[id] })
      if (url.pathname.startsWith('/npc-')) return route.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aV1cAAAAASUVORK5CYII=', 'base64') })
      if (url.pathname === '/api.php') return route.fulfill({ contentType: 'application/json', body: '{"response":[]}' })
      if (url.href === `https://fixture.test${pathname}`) return route.fulfill({ contentType: 'text/html', body: fixture(group, gallery, editor) })
      return route.fulfill({ contentType: 'text/html', body: '<html><body></body></html>' })
    })
    await page.goto(`https://fixture.test${pathname}`)
    assert.equal(requested.filter(p=>p.endsWith('.js')).length, 0, 'No optional plugin before design ready')
    await page.evaluate(() => { document.querySelector('.punbb').classList.add('forum-design--ready');document.dispatchEvent(new Event('forum-design:ready')) })
    return { page, requested, errors }
  }
  for (const group of [1,2,5]) {
    const {page,requested,errors} = await open(group)
    await page.waitForFunction(() => window.ForumTechniqueSearch && window.ForumBattleAssistant)
    assert.equal(await page.locator('#forum-tools button').count(),2)
    await page.locator('[data-forum-tool="technique-search"]').click()
    assert.equal(await page.locator('.ats-overlay.is-open').count(),1)
    await page.evaluate(()=>document.querySelector('.ats-overlay').classList.remove('is-open'))
    await page.locator('[data-forum-tool="battle-assistant"]').click()
    assert.equal(await page.locator('.aba-overlay.is-open').count(),1)
    assert.ok(!requested.includes('/shop.js'))
    assert.equal(requested.filter(p=>p==='/technique-search.js').length,1)
    assert.ok((await page.evaluate(()=>window.__executed)).every(x=>x.ready&&x.loaded==='complete'))
    const attributes=await page.locator('script[data-forum-plugin-loaded="technique-search"]').getAttribute('data-bridge-origins')
    assert.equal(attributes,'https://bridge.test')
    assert.deepEqual(errors,[])
    await page.close()
  }
  for (const group of [3,4,6,7,8]) {
    const {page,requested} = await open(group)
    await page.waitForTimeout(200)
    assert.equal(await page.locator('#forum-tools button').count(),0)
    assert.ok(!requested.some(p=>p==='/technique-search.js'||p==='/battle-assistant.js'))
    await page.close()
  }
  const shop = await open(1,'/viewtopic.php?id=202')
  await shop.page.locator('[data-akatsuki-shop-started="1"]').waitFor()
  assert.ok(!await shop.page.locator('style').evaluateAll(nodes=>nodes.some(n=>n.textContent.includes('github.io'))))
  assert.deepEqual(shop.errors,[])
  await shop.page.close()
  const wrongPage = await open(1,'/profile.php?id=202')
  await wrongPage.page.waitForFunction(()=>window.ForumBattleAssistant)
  assert.ok(!wrongPage.requested.includes('/shop.js'))
  await wrongPage.page.close()
  const gallery=await open(1,'/',true)
  await gallery.page.locator('#akatsuki-npc-gallery').waitFor()
  assert.equal(gallery.requested.filter(p=>/^\/npc-\d/.test(p)).length,0)
  await gallery.page.locator('#akatsuki-npc-gallery').scrollIntoViewIfNeeded()
  await gallery.page.waitForFunction(()=>document.querySelectorAll('.ng-card img[src]').length>0)
  await gallery.page.waitForFunction(()=>Array.from(document.querySelectorAll('.ng-card img[src]')).some(image=>image.complete&&image.naturalWidth>0))
  const count=gallery.requested.filter(p=>/^\/npc-\d/.test(p)).length
  assert.ok(count>0&&count<10,`Only visible gallery images should load, got ${count}`)
  await gallery.page.locator('.ng-viewport').evaluate(el=>el.scrollLeft=el.scrollWidth)
  await gallery.page.waitForTimeout(150)
  assert.ok(gallery.requested.filter(p=>/^\/npc-\d/.test(p)).length>count)
  assert.deepEqual(gallery.errors,[])
  await gallery.page.close()
  const reply=await open(5,'/viewtopic.php?id=448',false,true)
  await reply.page.locator('.ats-launcher-button').waitFor()
  await reply.page.locator('.aba-launcher-button').waitFor()
  assert.deepEqual(reply.errors,[])
  await reply.page.close()
  console.log('PASS: plugins wait for design and window load; groups 1/2/5; global tools open; reply launchers retained; shop only topic 202 and no GitHub CSS; gallery fetches only visible images; idempotent footer and preserved bridge attributes.')
} finally { await browser.close() }
