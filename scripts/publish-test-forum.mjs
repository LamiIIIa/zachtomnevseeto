import { chromium } from 'playwright'
import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { readEditor, saveEditor, fileMapping, upload, rewriteAssets, patchHeader } from './publish-forum-assets.mjs'
const origin='https://zachtomnewseeto.mybb.ru'
if(process.env.GITHUB_REF!=='refs/heads/test')throw Error('Test deployment requires the test branch')
if(!process.env.FORUM_USERNAME_TEST||!process.env.FORUM_PASSWORD_TEST)throw Error('Missing FORUM_USERNAME_TEST / FORUM_PASSWORD_TEST secrets')
const dir=path.resolve('dist/forum-local'),manifest=JSON.parse(await readFile(path.join(dir,'manifest.json'),'utf8'))
const hash=x=>createHash('sha256').update(x).digest('hex').slice(0,20)
const browser=await chromium.launch({headless:true})
try{
 const context=await browser.newContext()
 const page=await context.newPage()
 await page.goto(origin+'/login.php',{waitUntil:'domcontentloaded'})
 const login=page.locator('form').filter({has:page.locator('#fld1')})
 await login.locator('[name=req_username]').fill(process.env.FORUM_USERNAME_TEST)
 await login.locator('[name=req_password]').fill(process.env.FORUM_PASSWORD_TEST)
 await login.locator('input[type=submit],button[type=submit]').first().click()
 await page.waitForLoadState('domcontentloaded')
 await page.goto(origin+'/admin_files.php',{waitUntil:'domcontentloaded'})
 if(!await page.locator('#filetable').count())throw Error('Test forum administrator login failed')
 const style=await context.newPage(),forms=await context.newPage()
 await style.goto(origin+'/admin_style.php',{waitUntil:'domcontentloaded'})
 await forms.goto(origin+'/admin_forms.php',{waitUntil:'domcontentloaded'})
 const originalStyle=await readEditor(style,'form[content1]'),originalHeader=await readEditor(forms,'form[o_html_header]')
 let mapping=await fileMapping(page)
 mapping=await upload(page,manifest.assets.map(a=>path.join(dir,a.file)),mapping)
 const css=rewriteAssets(await readFile(path.join(dir,'forum-local.css'),'utf8'),mapping),js=await readFile(path.join(dir,'forum-local.js'),'utf8')
 const cssName=`fd-test-style-${hash(css)}.css`,jsName=`fd-test-script-${hash(js)}.js`
 await writeFile(path.join(dir,cssName),css);await writeFile(path.join(dir,jsName),js)
 mapping=await upload(page,[path.join(dir,cssName),path.join(dir,jsName)],mapping)
 const cssUrl=mapping[cssName],jsUrl=mapping[jsName]
 const marker=/\/\* forum-local:start \*\/[\s\S]*?\/\* forum-local:end \*\//
 const block=`/* forum-local:start */\n@import url("${cssUrl}");\n/* forum-local:end */`
 const nextStyle=marker.test(originalStyle)?originalStyle.replace(marker,block):originalStyle+'\n'+block
 const baseHeader=originalHeader.includes('id="forum-local-loader"')?originalHeader:originalHeader+'\n<script id="forum-local-loader"></script>'
 const nextHeader=patchHeader(baseHeader,cssUrl,jsUrl,(manifest.criticalFonts||[]).map(f=>mapping[f]).filter(Boolean))
 try{
  await saveEditor(style,'form[content1]',nextStyle)
  await saveEditor(forms,'form[o_html_header]',nextHeader)
  await forms.goto(origin+'/admin_forms.php',{waitUntil:'domcontentloaded'})
  const savedHeader=await readEditor(forms,'form[o_html_header]')
  if(!savedHeader.includes(new URL(jsUrl).pathname)||!savedHeader.includes(new URL(cssUrl).pathname))throw Error('Test header readback missing published file paths')
  const check=await context.newPage(),loadedScripts=[]
  check.on('request',request=>{if(request.resourceType()==='script')loadedScripts.push(request.url())})
  await check.goto(origin+'/?fd_verify='+manifest.revision+'-'+Date.now(),{waitUntil:'domcontentloaded'})
  await check.locator('.punbb.forum-design--ready').waitFor({timeout:60000})
  if(!loadedScripts.some(url=>new URL(url).origin===new URL(jsUrl).origin&&new URL(url).pathname===new URL(jsUrl).pathname))throw Error('Published test JS was not requested; observed CDN scripts: '+loadedScripts.filter(url=>url.includes('forumstatic.ru')).join(', '))
  for(const width of [390,1280]){await check.setViewportSize({width,height:844});await check.waitForTimeout(300);if(!await check.locator('#pun-main').isVisible())throw Error('Test forum content is hidden');await check.screenshot({path:path.join(dir,`test-forum-${width}.png`)})}
 }catch(error){await style.goto(origin+'/admin_style.php');await saveEditor(style,'form[content1]',originalStyle);await forms.goto(origin+'/admin_forms.php');await saveEditor(forms,'form[o_html_header]',originalHeader);throw error}
 await writeFile(path.join(dir,'test-deployment.json'),JSON.stringify({origin,revision:manifest.revision,cssUrl,jsUrl,verified:true},null,2))
 console.log('Test forum published and verified: '+JSON.stringify({origin,cssUrl,jsUrl,revision:manifest.revision}))
}finally{await browser.close()}
