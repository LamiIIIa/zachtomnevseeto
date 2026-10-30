import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import { renderPrepaint } from './prepaint.mjs'
import { patchHeader } from './publish-forum-assets.mjs'

const js = await readFile('dist/forum-local/forum-local.js', 'utf8')
const css = await readFile('dist/forum-local/forum-local.css', 'utf8')
const fixture = (root = 'pun-index') => `<!doctype html><html class="shinobi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><style>:root{--forum-design-css-ready:1}body{margin:0}.punbb{padding:20px}#pun-main{min-height:800px}#pun-navlinks{min-height:40px}</style><div id="pun"><div class="punbb" id="${root}"><div id="html-header">${renderPrepaint()}<script src="/forum.js" defer></script></div><div id="pun-navlinks"><ul class="container"><li id="navindex"><a href="/">Forum</a></li></ul></div><div id="pun-main"><div class="category"><h2><span>Welcome</span></h2><div class="container"><table class="hasicon"><tbody><tr><td class="tcl"><div class="intd"><div class="tclcon"><h3><a href="/viewforum.php?id=3">Guest forum</a></h3><p>Questions</p></div></div></td><td class="tc2">1</td><td class="tc3">2</td><td class="tcr"><a href="/viewtopic.php?id=1">Last topic</a><br>Today 10:00 - PAIN</td></tr></tbody></table></div></div></div></div></div>`
const browser = await chromium.launch({ headless: true, ...(process.env.FORUM_TEST_BROWSER ? { channel: process.env.FORUM_TEST_BROWSER } : {}) })
try {
  for (const width of [360, 390, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 844 } })
    const errors = []; page.on('pageerror', e => errors.push(e.message))
    await page.addInitScript(() => {
      window.badNativeFrames = 0
      function inspect() {
        const root = document.querySelector('.punbb'), main = document.querySelector('#pun-main')
        if (main && main.querySelector('table:not(.fd-fast-table)') && !root.classList.contains('forum-design--ready') && getComputedStyle(main).opacity !== '0') window.badNativeFrames++
        requestAnimationFrame(inspect)
      }
      requestAnimationFrame(inspect)
    })
    await page.route('**/*', async route => {
      const pathname = new URL(route.request().url()).pathname
      if (pathname === '/forum.js') {
        await new Promise(resolve => setTimeout(resolve, 1200))
        return route.fulfill({ contentType: 'application/javascript', body: js })
      }
      if (pathname === '/') return route.fulfill({ contentType: 'text/html', body: fixture() })
      return route.abort()
    })
    await page.goto('https://fixture.test/', { waitUntil: 'commit' })
    await page.locator('.forum-card[data-forum-fast-row]').waitFor()
    assert.equal(await page.locator('.forum-design--ready').count(), 0)
    assert.equal(await page.locator('#pun-main').evaluate(e => getComputedStyle(e).opacity), '1')
    assert.equal(await page.locator('#forum-prepaint-placeholder').count(), 0)
    const fastCardWidth = await page.locator('.forum-card').evaluate(e => e.getBoundingClientRect().width)
    assert.ok(await page.locator('td.tcr').evaluate(e => e.getBoundingClientRect().width) > fastCardWidth * .65)
    assert.equal(await page.locator('#pun-navlinks').evaluate(e => getComputedStyle(e).opacity), '1')
    await page.locator('.forum-design--ready').waitFor()
    assert.equal(await page.locator('.forum-card').count(), 1)
    assert.equal(await page.locator('table.fd-fast-table').count(), 0)
    assert.equal(await page.locator('#forum-prepaint-placeholder').count(), 0)
    assert.equal(await page.locator('#pun-main').evaluate(e => getComputedStyle(e).opacity), '1')
    assert.equal(await page.evaluate(() => window.badNativeFrames), 0)
    assert.deepEqual(errors, [])
    await page.close()
  }
  const failure = await browser.newPage()
  await failure.route('**/*', route => new URL(route.request().url()).pathname === '/' ? route.fulfill({ contentType: 'text/html', body: fixture() }) : route.abort())
  await failure.goto('https://fixture.test/')
  assert.equal(await failure.locator('#pun-main').evaluate(e => getComputedStyle(e).opacity), '1')
  assert.equal(await failure.locator('.forum-card[data-forum-fast-row]').count(), 1)
  assert.equal(await failure.locator('#forum-prepaint-placeholder').count(), 0)
  const other = await browser.newPage()
  await other.route('**/*', route => new URL(route.request().url()).pathname === '/' ? route.fulfill({ contentType: 'text/html', body: fixture('pun-viewtopic') }) : route.abort())
  await other.goto('https://fixture.test/')
  assert.equal(await other.locator('#forum-prepaint-placeholder').count(), 0)
  assert.equal(await other.locator('[data-forum-prepaint]').count(), 0)
  assert.equal(await other.locator('#pun-main').evaluate(e => getComputedStyle(e).opacity), '1')
  const admin = await browser.newPage()
  await admin.route('**/*', route => route.fulfill({ contentType: 'text/html', body: fixture('pun-admin_index').replace('<script src="/forum.js" defer></script>', '') }))
  await admin.goto('https://fixture.test/')
  assert.equal(await admin.locator('[data-forum-prepaint]').count(), 0)
  const nojs = await browser.newPage({ javaScriptEnabled: false })
  await nojs.route('**/*', route => route.fulfill({ contentType: 'text/html', body: fixture() }))
  await nojs.goto('https://fixture.test/')
  assert.equal(await nojs.locator('#pun-main').evaluate(e => getComputedStyle(e).opacity), '1')
  assert.ok(!renderPrepaint().includes('Загрузка страницы'))
  assert.ok(!renderPrepaint().includes('opacity:0'))
  const original = '<script id="forum-local-loader" src="old"></script><div>custom</div>'
  const once = patchHeader(original, 'css1', 'js1'), twice = patchHeader(once, 'css2', 'js2')
  assert.equal((twice.match(/<!-- forum-prepaint:start -->/g) || []).length, 1)
  assert.ok(twice.endsWith('<div>custom</div>'))
  console.log('PASS: real cards visible before delayed forum.js at 360/390/1280px; full-width last message; no unstyled table frames; blocked script still shows cards; one card after full initialization; other-page content visible without JS or loading overlay; admin/no-JS; idempotent pipeline copy.')
} finally { await browser.close() }
