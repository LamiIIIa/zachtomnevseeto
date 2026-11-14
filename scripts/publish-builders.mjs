import { chromium } from 'playwright'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { readEditor, saveEditor } from './publish-forum-assets.mjs'
const origin='https://akatsukigood.forum.cool',file='84381.js'
if(process.env.GITHUB_REF!=='refs/heads/main')throw Error('Builders publication requires main')
if(!process.env.FORUM_USERNAME||!process.env.FORUM_PASSWORD)throw Error('Missing forum credentials')
const source=await readFile('src/plugins/akatsuki-builders.js','utf8')
const normalize=x=>x.replace(/^\uFEFF/,'').replace(/\r/g,'').trim(),hash=x=>createHash('sha256').update(normalize(x)).digest('hex')
const browser=await chromium.launch({headless:true})
try{
 const context=await browser.newContext(),editor=await context.newPage(),forms=await context.newPage()
 await editor.goto(origin+'/login.php',{waitUntil:'domcontentloaded'})
 const login=editor.locator('form').filter({has:editor.locator('#fld1')})
 await login.locator('[name=req_username]').fill(process.env.FORUM_USERNAME);await login.locator('[name=req_password]').fill(process.env.FORUM_PASSWORD)
 await login.locator('input[type=submit],button[type=submit]').first().click();await editor.waitForLoadState('domcontentloaded')
 await editor.goto(origin+'/admin_files.php?edit&file='+file,{waitUntil:'domcontentloaded'})
 const previous=await readEditor(editor,'content')
 if(!['be9946b5a41ec8ae33a0b8cf2def4bdb1cc6250cb7ed688a363d57e19295a76b',hash(source)].includes(hash(previous)))throw Error('Manual builder edit detected; import forum source before publication')
 await forms.goto(origin+'/admin_forms.php',{waitUntil:'domcontentloaded'})
 const oldFooter=await readEditor(forms,'form[o_html_footer]')
 const pattern=/https:\/\/forumstatic\.ru\/files\/001a\/12\/f3\/84381\.js(?:\?[^"'<>\s]*)?/g
 const matches=oldFooter.match(pattern)
 if(!matches?.length)throw Error('Existing builder footer connection not found')
 const nextFooter=oldFooter.replace(pattern,'https://forumstatic.ru/files/001a/12/f3/84381.js?v=16-'+hash(source).slice(0,10))
 try{
  if(normalize(previous)!==normalize(source))await saveEditor(editor,'content',source)
  await editor.goto(origin+'/admin_files.php?edit&file='+file+'&verify='+Date.now())
  if(hash(await readEditor(editor,'content'))!==hash(source))throw Error('Builders file verification failed')
  await saveEditor(forms,'form[o_html_footer]',nextFooter)
  await forms.goto(origin+'/admin_forms.php')
  if(!(await readEditor(forms,'form[o_html_footer]')).includes('84381.js?v=16-'+hash(source).slice(0,10)))throw Error('Builder footer verification failed')
  const check=await context.newPage();await check.goto(origin+'/viewtopic.php?id=71&builders_verify='+Date.now(),{waitUntil:'domcontentloaded'})
  await check.locator('.atb-parameter-output').waitFor({state:'attached',timeout:45000});await check.locator('.aab-parameter-output').waitFor({state:'attached',timeout:45000})
  console.log('Verified builders v16: existing file '+file+'; separate colored parameter links; no generated widepost')
 }catch(error){await editor.goto(origin+'/admin_files.php?edit&file='+file);await saveEditor(editor,'content',previous);await forms.goto(origin+'/admin_forms.php');await saveEditor(forms,'form[o_html_footer]',oldFooter);throw error}
}finally{await browser.close()}
