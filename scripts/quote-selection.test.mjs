import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { chromium } from 'playwright'
const source = await readFile('src/components/post-components/quote-selection.js','utf8')
const browser = await chromium.launch({headless:true,...(process.env.FORUM_TEST_BROWSER ? {channel:process.env.FORUM_TEST_BROWSER} : {})})
try {
 for (const width of [390,1280]) {
  const page = await browser.newPage({viewport:{width,height:844}})
  await page.setContent(`<main id="main"><div class="post" id="p54247"><div class="post-content">проверено <b>опытным</b> путем</div><span class="pl-quote"><a href="javascript:quote('54247,100', 54247)">Цитировать</a></span></div><textarea></textarea></main>`)
  await page.addScriptTag({content:source.replace('export function','function')+';initQuoteSelection(document.querySelector("main"));window.insert=text=>document.querySelector("textarea").value+=text;window.quote=()=>{window.nativeQuote=true}'} )
  await page.evaluate(()=>{
   const node=document.querySelector('.post-content').firstChild, range=document.createRange();range.setStart(node,0);range.setEnd(node,9);const selection=getSelection();selection.removeAllRanges();selection.addRange(range);document.dispatchEvent(new Event('selectionchange'));
   // Extend the selection without waiting for the queued selectionchange.
   range.selectNodeContents(document.querySelector('.post-content'));selection.removeAllRanges();selection.addRange(range);
   const link=document.querySelector('.pl-quote a');link.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));
   // A focus/legacy handler replaces the browser range with just one word.
   range.setStart(node,0);range.setEnd(node,9);selection.removeAllRanges();selection.addRange(range);document.dispatchEvent(new Event('selectionchange'));
   link.click();
  })
  assert.equal(await page.locator('textarea').inputValue(),'[quote="54247,100"]проверено опытным путем[/quote]\n')
  assert.equal(await page.evaluate(()=>!!window.nativeQuote),false)
  await page.locator('textarea').fill('')
  await page.locator('.pl-quote a').click()
  await page.waitForFunction(()=>window.nativeQuote===true)
  assert.equal(await page.evaluate(()=>window.nativeQuote),true,'No selection must retain native full-post quoting')
  assert.equal(await page.locator('textarea').inputValue(),'')
  await page.close()
 }
 console.log('PASS: complete multi-node selection survives stale word and focus changes at mobile/desktop widths; native quoting remains available.')
} finally { await browser.close() }
