import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import { patchExtras } from './deferred-extras.mjs'
import { choosePluginFile } from './managed-plugin-files.mjs'
import { pluginDefinitions } from './plugin-config.mjs'

const url = 'https://forumstatic.ru/files/001a/12/f3/'
const critical = '<script src="https://forumstatic.ru/f/ru/bestbb/notifications.js"></script><script>notifications.load("mentions");notifications.load("subscriptions");</script><script src="'+url+'37690.js"></script><script src="https://forumstatic.ru/files/0015/c4/3f/52361.js"></script><script>HTMLinPost.groups=[1,2,5];HTMLinPost.parseHTMLinPosts();</script>'
const optional = '<script src="'+url+'67329.js"></script><script src="'+url+'74246.js"></script><script src="https://forumstatic.ru/files/0015/c4/3f/26781.js"></script><script>PR.nick="fixture";PR.pass="not-a-real-password";PR.set();</script>'
const commented = '<!-- <script src="'+url+'19286.js"></script> -->'
const header = patchExtras(critical + optional + commented, 'header')
assert.ok(header.includes(critical), 'Notification/visibility/HTML parser code must remain unchanged')
assert.ok(header.includes('<script src="https://forumstatic.ru/files/0015/c4/3f/26781.js"></script><script>PR.nick='), 'PR remains parser-executed in HTML header')
assert.ok(header.includes(commented), 'Commented-out scripts must stay commented out')
assert.equal(patchExtras(header,'header'),header)
assert.equal((header.match(/data-forum-extra="/g)||[]).length,2)
const footer=patchExtras('<img src="/banner.png"><script src="'+url+'84381.js"></script>','footer')
assert.ok(footer.includes('loading="lazy"'))
assert.equal(patchExtras(footer,'footer'),footer)
for(const plugin of pluginDefinitions){
  const canonical={file:plugin.forumFile,comment:plugin.filename,url:url+plugin.forumFile}
  const temporary={file:'12345.js',comment:`fd-plugin-${plugin.id}-old.js`}
  assert.equal(choosePluginFile(plugin,[temporary,canonical],''),canonical)
  assert.throws(()=>choosePluginFile(plugin,[],''))
}

const manifest=JSON.parse(await readFile('dist/forum-local/manifest.json','utf8'))
const compat=Object.fromEntries(await Promise.all(manifest.extras.map(async item=>[item.id,await readFile('dist/forum-local/'+item.file,'utf8')])))
const libs=await readFile('dist/forum-local/test-mybb-libs.js','utf8')
const browser=await chromium.launch({headless:true,...(process.env.FORUM_TEST_BROWSER?{channel:process.env.FORUM_TEST_BROWSER}:{})})
try{
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:844}}),errors=[],requested=[]
  page.on('pageerror',e=>errors.push(e.message))
  await page.route('**/*',route=>{
   const u=new URL(route.request().url());requested.push(u.pathname)
   if(u.pathname==='/')return route.fulfill({contentType:'text/html',body:`<!doctype html><html><meta charset="utf-8"><script>window.GroupID=1;window.RequestTime=1793410000;window.order=[];</script><div class="punbb" id="pun-index"><div id="html-header">${header}<script src="/design.js" defer></script></div><main id="pun-main">Main content</main><div id="html-footer">${footer}</div></div>`})
   if(u.pathname==='/design.js')return route.fulfill({contentType:'application/javascript',body:'setTimeout(()=>{window.order.push("design");document.querySelector(".punbb").classList.add("forum-design--ready");document.dispatchEvent(new Event("forum-design:ready"))},200)'})
   if(u.pathname.endsWith('/notifications.js'))return route.fulfill({contentType:'application/javascript',body:'window.notifications={load:id=>window.order.push("notification:"+id)}'})
   if(u.pathname.endsWith('/37690.js'))return route.fulfill({contentType:'application/javascript',body:'window.order.push("visibility")'})
   if(u.pathname.endsWith('/52361.js'))return route.fulfill({contentType:'application/javascript',body:'window.HTMLinPost={parseHTMLinPosts:()=>window.order.push("html-parser")}'})
   if(u.pathname.endsWith('/26781.js'))return route.fulfill({contentType:'application/javascript',body:'window.order.push("pr-code");window.PR={set:()=>window.order.push("pr-config")}'})
   if(u.pathname.endsWith('/74246.js'))return route.fulfill({contentType:'application/javascript',body:'window.order.push("chronology");window.forumDeferredExtras.onReady(()=>window.order.push("finalizer"))'})
   return route.fulfill({contentType:u.pathname.endsWith('.css')?'text/css':'application/javascript',body:''})
  })
  await page.goto('https://fixture.test/')
  assert.ok(!requested.some(p=>/67329|74246|84381|37000/.test(p)))
  await page.waitForFunction(()=>window.forumDeferredExtras?.ready)
  const order=await page.evaluate(()=>window.order)
  assert.ok(order.indexOf('notification:mentions')<order.indexOf('design'))
  assert.ok(order.indexOf('pr-code')<order.indexOf('design'))
  assert.ok(order.indexOf('pr-config')>order.indexOf('pr-code'))
  assert.ok(!requested.some(p=>/67329|74246|84381/.test(p)))
  assert.equal(await page.locator('link[data-forum-critical-hint]').count(),10)
  await page.evaluate(()=>document.querySelector('#pun-main').insertAdjacentHTML('beforeend','<div class="bbchron">Chronology</div>'))
  await page.waitForFunction(()=>window.order.includes('finalizer'))
  assert.deepEqual(errors,[])
  await page.close()
 }
 // Actual old forum jQuery + actual quote/preview files: no late document.write,
 // no lost DOMContentLoaded handlers, native form survives and preview works.
 const page=await browser.newPage(),errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 const urls={'quote-avatars':'https://fixture.test/compat/quote-avatars.js','post-preview':'https://fixture.test/compat/post-preview.js'}
 const h=patchExtras('<script src="https://forumstatic.ru/files/0015/c4/3f/77306.js"></script>','header',urls)
 const f=patchExtras('<script>var PPREV={position:0,quote_cite:"said"};</script><script src="https://forumstatic.ru/files/001b/d5/6a/90542.js"></script><script>setLinkAndAva()</script>','footer',urls)
 await page.route('**/*',route=>{
  const u=new URL(route.request().url())
  if(u.pathname==='/')return route.fulfill({contentType:'text/html',body:`<!doctype html><meta charset="utf-8"><script>window.FORUM={topic:448,editor:true,get:function(){return {}}};window.UserLogin='Player';window.GroupID=1;window.UserID=67;window.StaticURL='https://forumstatic.ru';window.smiles=[];window.HTMLinPost={parseTags:function(){}};</script><script src="/libs.js"></script><div class="punbb forum-design--ready" id="pun-viewtopic"><div id="html-header">${h}</div><main id="pun-main"><div class="post" id="p1"><h3><span><a href="#p1">date</a></span></h3><div class="pa-author"><a href="profile.php?id=67">Player</a></div><div class="pl-email"><a href="profile.php?id=67">profile</a></div><div class="pl-quote"><a href="javascript:quote('Player',1)">Quote</a></div><div class="post-content">Post</div></div><form action="post.php" id="post"><fieldset id="post-form"><textarea name="req_message" id="main-reply"></textarea></fieldset><p><input type="submit" name="submit"><input type="submit" name="preview"></p></form></main><div id="html-footer">${f}</div></div>`})
  if(u.pathname==='/libs.js')return route.fulfill({contentType:'application/javascript',body:libs})
  const name=u.pathname.match(/\/compat\/(.+)\.js$/)?.[1]
  if(name)return route.fulfill({contentType:'application/javascript',body:compat[name]})
  return route.fulfill({contentType:'application/json',body:'{"response":[]}'})
 })
 await page.goto('https://fixture.test/')
 await page.waitForFunction(()=>window.forumDeferredExtras?.ready)
 assert.equal(await page.locator('form textarea[name="req_message"]').count(),1)
 assert.equal(await page.locator('.pl-quote a.with-ava').count(),1)
 assert.deepEqual(errors,[])
 assert.equal(await page.locator('#post-preview').count(),1)
 await page.locator('#main-reply').fill('Plain reply text')
 await page.waitForTimeout(100)
 assert.ok((await page.locator('#post-preview').textContent()).includes('Plain reply text'))
 assert.deepEqual(await page.evaluate(()=>window.forumDeferredExtras.errors),[])
 assert.deepEqual(errors,[])
 await page.close()
 console.log('PASS: notifications unchanged and prioritized; optional scripts wait for design; source order and private inline config preserved; conditional/late widgets; lazy footer images; quote/preview compatibility; canonical file selection.')
}finally{await browser.close()}
