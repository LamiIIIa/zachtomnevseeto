(function(global){
'use strict';
const TOPIC=361,PRICE=500,MAX=200,KEY='akatsuki-lottery361:',MARKER='LOTTERY361:';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>n.toLocaleString('ru-RU');
function count(value){if(!/^\d+$/.test(String(value).trim()))throw Error('Введите целое количество билетов от 1 до '+MAX+'.');const n=Number(value);if(!Number.isSafeInteger(n)||n<1||n>MAX)throw Error('Количество билетов: от 1 до '+MAX+'.');return n;}
function extract(text,user,pid){const rows=[];for(const m of text.matchAll(/LOTTERY361:(\{[^\n]*?\})/g)){try{const r=JSON.parse(m[1]);if(r.v===1&&r.user===String(user)&&typeof r.id==='string'&&Number.isInteger(r.count)&&r.count>0&&r.cost===r.count*PRICE)rows.push({...r,pid});}catch(_){}}return rows;}
function personalTopic(doc){
const fields=doc.querySelectorAll('#pa-fld2,#profile .pa-fld2'),ids=new Set();
for(const field of fields)for(const a of field.querySelectorAll('a[href]')){const u=new URL(a.getAttribute('href'),location.href);if(u.origin===location.origin&&u.pathname==='/viewtopic.php'&&/^[1-9]\d*$/.test(u.searchParams.get('id')||''))ids.add(u.searchParams.get('id'));}
if(ids.size!==1)throw Error('В профиле должна быть указана одна ссылка на тему личного дела в поле «Возраст, звание — ссылка на ЛД».');
return [...ids][0];
}
function walletFromPost(content){
const sections=Array.from(content.querySelectorAll('.custom_tag_shopsection,.akshop-section,.shopsection,[data-bbcode="shopsection"]')).filter(section=>{
const title=section.querySelector('.custom_tag_shoptitle,.akshop-title,.shoptitle,[data-bbcode="shoptitle"]');
return title&&/^кошел[её]к$/i.test(title.textContent.trim())&&!section.closest('.quote-box,blockquote,.spoiler-box,details');
});
if(sections.length!==1)throw Error('Не найден единственный блок «Кошелёк» в третьем посте личного дела.');
const tables=Array.from(sections[0].querySelectorAll('table')).filter(table=>!table.closest('.quote-box,blockquote,.spoiler-box,details'));
if(!tables.length)throw Error('В третьем посте личного дела не найден текущий баланс кошелька.');
const amount=tables[0].textContent.replace(/[\s\u00a0\u202f]+/g,' ').trim().match(/^(\d[\d ]*)\s+р[её]\.?$/i);
if(!amount)throw Error('Не удалось прочитать текущий баланс кошелька в третьем посте личного дела.');
const balance=Number(amount[1].replace(/ /g,''));if(!Number.isSafeInteger(balance)||balance<0)throw Error('Некорректный баланс кошелька.');return balance;
}
async function playerWallet(user){
const topic=personalTopic(await forumPage('/profile.php?id='+encodeURIComponent(user))),queue=[1],visited=new Set(),posts=new Map();
while(queue.length&&posts.size<3){const number=queue.shift();if(visited.has(number))continue;visited.add(number);if(visited.size>10)throw Error('Не удалось найти третий пост личного дела.');
const doc=await forumPage('/viewtopic.php?id='+topic+'&p='+number);
for(const post of doc.querySelectorAll('.post[id^="p"]')){const id=Number(post.id.slice(1)),content=post.querySelector('.post-content');if(Number.isSafeInteger(id)&&id>0&&content&&!post.closest('.post-content'))posts.set(id,content);}
doc.querySelectorAll('.pagelink a[href],.pages a[href],.pagination a[href]').forEach(a=>{const u=new URL(a.getAttribute('href'),location.href),next=Number(u.searchParams.get('p')||1);if(u.origin===location.origin&&u.pathname==='/viewtopic.php'&&u.searchParams.get('id')===topic&&Number.isInteger(next)&&next>0&&!visited.has(next)&&!queue.includes(next))queue.push(next);});queue.sort((a,b)=>a-b);
}
const third=Array.from(posts.entries()).sort((a,b)=>a[0]-b[0])[2];if(!third)throw Error('В теме личного дела не найден третий пост.');
return {balance:walletFromPost(third[1]),topic,post:String(third[0])};
}
// BUILD_TRANSPORT
function nativeRoll(win,field){const original=field.value,oldPrompt=win.prompt,hadSides=Object.prototype.hasOwnProperty.call(win,'defaultSideCount'),oldSides=win.defaultSideCount;try{field.focus();field.setSelectionRange(original.length,original.length);win.prompt=(()=>{const values=['1','100'];return ()=>values.shift()||'100';})();if(hadSides)win.defaultSideCount=100;const button=win.document.querySelector('#button-dice button,#button-dice');if(typeof win.dice==='function')win.dice();else if(button)button.click();else throw Error('Штатная функция «Кубики» не найдена в редакторе форума.');const appended=field.value.slice(original.length),tags=appended.match(/\[dice=[\d—-]+1:100\]/g)||[];if(!field.value.startsWith(original)||tags.length!==1||appended.replace(tags[0],'').trim())throw Error('Форум не создал отдельный 1d100. Проверьте настройку штатных кубиков.');return tags[0];}finally{win.prompt=oldPrompt;if(hadSides)win.defaultSideCount=oldSides;}}
function message(r){return `[b]Лотерея · билеты d100[/b]\nКоличество билетов: ${r.count} шт.\nЦена одного билета: 500 рё.\n[b]Итого к оплате: ${money(r.cost)} рё.[/b]\n\n[spoiler="Билеты: ${r.count} шт."]\n`+r.rolls.map((tag,i)=>`Билет № ${i+1}\n${tag}`).join('\n\n')+`\n[/spoiler]\n\n${MARKER}${JSON.stringify({v:1,user:r.user,id:r.id,count:r.count,cost:r.cost})}`;}
async function editor(topic=TOPIC){const frame=document.createElement('iframe');frame.hidden=true;frame.title='Отправка билетов лотереи';document.body.appendChild(frame);function navigate(start){return new Promise((resolve,reject)=>{const before=frame.contentDocument;let timer,poll;const end=(err,doc)=>{clearTimeout(timer);clearInterval(poll);err?reject(err):resolve(doc);};const check=()=>{try{const d=frame.contentDocument;if(d&&d!==before&&d.URL!=='about:blank'&&d.body&&['interactive','complete'].includes(d.readyState))end(null,d);}catch(_){end(Error('Форма перенаправлена на другой сайт.'));}};timer=setTimeout(()=>end(Error('Форум долго отвечает. Проверьте тему перед повторной отправкой.')),25000);poll=setInterval(check,40);try{start();}catch(e){end(e);}});}
try{const doc=await navigate(()=>frame.src='/post.php?tid='+topic);const field=doc.querySelector('textarea[name="req_message"]'),form=field?.form;if(!form)throw Error('Форма ответа недоступна. Войдите на форум; тема должна быть открыта.');const action=new URL(form.getAttribute('action')||frame.src,location.href),tid=action.searchParams.get('tid')||form.querySelector('[name="tid"]')?.value;if(action.origin!==location.origin||action.pathname!=='/post.php'||tid!==String(topic))throw Error('Не удалось подтвердить форму темы '+topic+'.');if(doc.querySelector('[name*="captcha"],iframe[src*="recaptcha"],.g-recaptcha'))throw Error('Форум требует CAPTCHA. Откройте штатную форму ответа.');return {frame,doc,field,form,async roll(n){const start=performance.now();while(typeof frame.contentWindow.dice!=='function'&&!doc.querySelector('#button-dice button,#button-dice')){if(performance.now()-start>10000)throw Error('Штатные кубики редактора не загрузились. Обновите страницу.');await new Promise(r=>setTimeout(r,50));}field.value='';const tags=[];for(let i=0;i<n;i++){tags.push(nativeRoll(frame.contentWindow,field));field.value+='\n';}return tags;},async send(text){Object.getOwnPropertyDescriptor(frame.contentWindow.HTMLTextAreaElement.prototype,'value').set.call(field,text);field.dispatchEvent(new frame.contentWindow.Event('input',{bubbles:true}));field.dispatchEvent(new frame.contentWindow.Event('change',{bubbles:true}));form.addEventListener('formdata',e=>e.formData.set('req_message',text));const submit=form.querySelector('input[type="submit"][name="submit"],button[type="submit"][name="submit"],input[type="submit"][name="send"],button[type="submit"][name="send"]');if(!submit)throw Error('Не найдена штатная кнопка отправки.');const reply=await navigate(()=>submit.click());const error=reply.querySelector('#post-errors,.error-info,.form-errors');if(error){const failure=Error(error.textContent.trim().slice(0,300));failure.rejected=true;throw failure;}return reply;},close(){frame.remove();}};}catch(e){frame.remove();throw e;}}
function debitMessage(r){return `Вычесть: ${r.cost}\nПоле: Кошелек\nКомментарий: Лотерея - покупка ${r.count} билетов`;}
function debitPublished(doc,r,minPid=0){
const normalize=text=>String(text).replace(/\s+/g,' ').trim();
return Array.from(doc.querySelectorAll('.post[id^="p"]')).some(post=>{
const pid=Number(post.id.slice(1));if(!Number.isSafeInteger(pid)||pid<=minPid)return false;
const authorLinks=Array.from(post.querySelectorAll('.pa-author a[href], .post-author a[href], .pl-profile a[href], .post-links a[href]'));
const author=authorLinks.map(a=>{try{const u=new URL(a.getAttribute('href'),location.href);return u.pathname==='/profile.php'?u.searchParams.get('id'):null;}catch(_){return null;}}).find(Boolean);
const uid=post.getAttribute('data-user-id')||author;
const body=post.querySelector('.post-content');if(!body||String(uid)!==r.user)return false;
const copy=body.cloneNode(true);copy.querySelectorAll('blockquote,.quote-box,script,style').forEach(n=>n.remove());
copy.querySelectorAll('br').forEach(n=>n.replaceWith(' '));copy.querySelectorAll('p,div,pre').forEach(n=>n.appendChild(doc.createTextNode(' ')));
return normalize(copy.textContent)===normalize(debitMessage(r));
});
}
async function findDebit(r,minPid){
if(!Number.isSafeInteger(minPid)||minPid<=0)return false;
const queue=['/viewtopic.php?id=550&action=last'],seen=new Set();
while(queue.length){const url=queue.shift();if(seen.has(url))continue;seen.add(url);if(seen.size>200)throw Error('Слишком большая история служебной темы для проверки.');
const doc=await forumPage(url);if(debitPublished(doc,r,minPid))return true;
if(!doc.querySelector('.post[id^="p"] .post-content'))throw Error('Не удалось прочитать служебную тему для подтверждения.');
doc.querySelectorAll('.pagelink a[href],.pages a[href],.pagination a[href]').forEach(a=>{const u=new URL(a.getAttribute('href'),location.href);if(u.origin===location.origin&&u.pathname==='/viewtopic.php'&&u.searchParams.get('id')==='550'){const next='/viewtopic.php?id=550&p='+(u.searchParams.get('p')||'1');if(!seen.has(next)&&!queue.includes(next))queue.push(next);}});
}
return false;
}
const css=`#lottery-d100#lottery-d100{box-sizing:border-box;clear:both;display:block;margin:20px 0;padding:clamp(16px,3vw,28px);border:1px solid var(--color-sub-border,#b19a9a);border-radius:12px;background:var(--color-forum,#f5f1f1);color:var(--color-txt1,#282627);font:15px/1.6 var(--font-g,Arial),sans-serif;text-align:left}#lottery-d100 *{box-sizing:border-box}#lottery-d100 .lot-title{display:block;font-size:24px;color:var(--color-link,#863030);margin-bottom:12px}#lottery-d100 .lot-row{display:flex;align-items:end;gap:12px;flex-wrap:wrap}#lottery-d100 label{display:grid;gap:5px;color:inherit}#lottery-d100 button,#lottery-d100 input{font:inherit;color:inherit;background:var(--color-forum,#f5f1f1);border:1px solid var(--color-sub-border,#b19a9a);border-radius:6px;padding:9px 13px;min-height:44px;max-width:100%;width:auto;text-transform:none;letter-spacing:normal}#lottery-d100 input{width:130px}#lottery-d100 button{cursor:pointer;color:var(--color-link,#863030)}#lottery-d100 button:disabled{opacity:.6;cursor:wait}#lottery-d100 p{font:inherit;color:inherit;margin:10px 0}#lottery-d100 .lot-total{padding:12px 16px;margin:16px 0;background:var(--color-lnthoverbg,#e9e0e0);border-left:3px solid var(--color-link,#863030)}#lottery-d100 pre{white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.5 monospace;max-height:300px;overflow:auto;color:inherit;background:transparent}#lottery-d100 a{color:var(--color-link,#863030)}`;
class Lottery{
constructor(root){this.root=root;this.local=root.dataset.mode==='local';this.user=this.local?'1':forumIdentity();this.busy=false;this.status='';this.error='';this.sent=null;try{this.pending=JSON.parse(localStorage.getItem(KEY+this.user)||'null');if(this.pending&&(this.pending.user!==this.user||this.pending.cost!==count(this.pending.count)*PRICE||this.pending.rolls?.length!==this.pending.count))throw Error('Некорректное сохранение билетов.');}catch(e){this.error='Не удалось прочитать сохранённую отправку: '+e.message;this.pending=null;this.blocked=true;}this.root.addEventListener('click',e=>{if(e.target.closest('[data-reset]'))this.reset();else if(e.target.closest('[data-send]'))this.send();});this.root.addEventListener('input',e=>{if(e.target.id==='lot-count')this.total();});this.render();}
render(){this.root.innerHTML=`<strong class="lot-title">Лотерея · d100</strong><p>Один билет — один отдельный бросок d100. Цена билета: 500 рё.</p><div class="lot-row"><label>Количество билетов<input id="lot-count" type="number" min="1" max="${MAX}" step="1" value="${this.pending?.count||this.number||20}" ${this.busy||this.pending?'disabled':''}></label><button type="button" data-send ${this.busy||!this.user||this.blocked?'disabled':''}>${this.busy?'Отправка…':this.pending?'Проверить и отправить те же билеты':'Купить билеты и бросить кубики'}</button>${this.pending||this.blocked?`<button type="button" data-reset ${this.busy?'disabled':''}>Сбросить сохранённую отправку</button>`:''}</div><div class="lot-total" data-total></div><p role="status">${esc(this.status||(!this.user?'Войдите в профиль форума для участия.':this.pending?'Есть подготовленная отправка. Повтор использует те же броски.':'Результаты будут опубликованы от вашего профиля в теме 361.'))}</p>${this.error?'<p role="alert">'+esc(this.error)+'</p>':''}${this.sent?`<p><a href="/viewtopic.php?id=361${this.sent.pid?'#p'+this.sent.pid:''}">Открыть опубликованные билеты</a></p>`:''}${this.pending?`<details><summary>Подготовленное сообщение</summary><pre>${esc(message(this.pending))}</pre></details>`:''}`;this.total();}
total(){const field=this.root.querySelector('#lot-count'),el=this.root.querySelector('[data-total]');try{this.number=count(field.value);el.textContent=`Билетов: ${this.number} · Кубиков: ${this.number} × d100 · Стоимость: ${money(this.number*PRICE)} рё`;}catch(e){el.textContent=e.message;}}
reset(){
if(this.busy||(!this.pending&&!this.blocked))return;
try{localStorage.removeItem(KEY+this.user);}catch(e){this.error='Не удалось сбросить сохранение: '+e.message;this.render();return;}
if(this.pending?.primary)this.sent=this.pending.primary;
if(this.pending)this.number=this.pending.count;
this.pending=null;this.blocked=false;this.error='';
this.status='Сохранённая отправка сброшена. Уже опубликованные сообщения остаются на форуме. Можно купить новые билеты.';
this.render();
}
save(){localStorage.setItem(KEY+this.user,JSON.stringify(this.pending));}
async checkWallet(cost){
if(this.local)return;
this.status='Проверяем кошелёк в третьем посте личного дела…';this.render();
const wallet=await playerWallet(this.user);
if(cost>wallet.balance)throw Error('Сумма покупки: '+money(cost)+' рё. Ваш баланс: '+money(wallet.balance)+' рё. Недостаточно средств для покупки билетов.');
}
async history(){return this.local?JSON.parse(localStorage.getItem(KEY+'demo-posts')||'[]'):forumHistory();}
async send(){if(this.busy||!this.user||this.blocked)return;let n;try{n=this.pending?this.pending.count:count(this.root.querySelector('#lot-count').value);}catch(e){this.error=e.message;this.render();return;}this.busy=true;this.error='';this.status=this.pending?'Проверяем предыдущую отправку…':'Готовим штатные броски 1d100…';this.render();let ed;try{if(this.pending?.primary){await this.finish(this.pending.primary);return;}if(this.pending){const existing=(await this.history()).find(r=>r.user===this.user&&r.id===this.pending.id);if(existing){await this.finish(existing);return;}await this.checkWallet(n*PRICE);}else{await this.checkWallet(n*PRICE);if(!this.local)ed=await editor();const rolls=this.local?Array.from({length:n},()=>`[dice=${(1+Math.floor(Math.random()*100))*1936}-1:100]`):await ed.roll(n);this.pending={v:1,user:this.user,id:global.crypto.randomUUID(),count:n,cost:n*PRICE,rolls};this.save();}this.status='Отправляем '+n+' билетов одним сообщением…';this.render();if(this.local){const posts=await this.history(),r={...this.pending,pid:'demo'};posts.push(r);localStorage.setItem(KEY+'demo-posts',JSON.stringify(posts));await this.finish(r);return;}if(!ed)ed=await editor();const reply=await ed.send(message(this.pending));this.status='Подтверждаем публикацию…';this.render();const found=readPosts(reply).find(r=>r.user===this.user&&r.id===this.pending.id)||(await this.history()).find(r=>r.user===this.user&&r.id===this.pending.id);if(!found)throw Error('Подтверждение пока не получено. Проверьте тему или повторите проверку: броски сохранятся.');await this.finish(found);}catch(e){this.error=e.message;this.status=this.pending?.primary?'Билеты уже опубликованы. Запись списания пока не подтверждена.':this.pending?'Билеты сохранены. Повторная отправка не меняет броски.':'Отправка не выполнена.';}finally{ed?.close();this.busy=false;this.render();}}
async finish(r){
this.pending.primary=r;this.save();
if(this.local){const key=KEY+'demo-debits',rows=JSON.parse(localStorage.getItem(key)||'[]');if(!rows.some(x=>x.id===r.id)){rows.push({id:r.id,text:debitMessage(r)});localStorage.setItem(key,JSON.stringify(rows));}this.complete(r);return;}
if(this.pending.debitConfirmed){this.complete(r);return;}
const minPid=Number(this.pending.debitAfterPid||r.pid);
if(this.pending.debitAttempted){this.status='Проверяем опубликованную запись списания…';this.render();if(await findDebit(r,minPid)){this.pending.debitConfirmed=true;this.save();this.complete(r);return;}throw Error('Запись списания пока не найдена. Повторная публикация остановлена, чтобы не списать сумму дважды. Можно повторить проверку или сбросить сохранение.');}
this.pending.debitAfterPid=minPid;this.save();
this.status='Билеты опубликованы. Отправляем запись списания…';this.render();
const debitEditor=await editor(550);
try{this.pending.debitAttempted=true;this.save();let reply,sendError;
try{reply=await debitEditor.send(debitMessage(r));}catch(e){if(e.rejected){delete this.pending.debitAttempted;this.save();throw e;}sendError=e;}
let confirmed=reply&&debitPublished(reply,r,minPid);
if(!confirmed){this.status='Проверяем запись списания в служебной теме…';this.render();for(let attempt=0;attempt<3&&!confirmed;attempt++){if(attempt)await new Promise(resolve=>setTimeout(resolve,700));confirmed=await findDebit(r,minPid);}}
if(!confirmed)throw Error(sendError?.message||'Запись отправлена, но её публикация пока не подтверждена. Повторите проверку: второе сообщение отправлено не будет.');
this.pending.debitConfirmed=true;this.save();this.complete(r);
}finally{debitEditor.close();}
}
complete(r){this.sent=r;this.number=r.count;this.status=(this.local?'Локальный тест: ':'Опубликовано: ')+r.count+' билетов, '+money(r.cost)+' рё. Запись списания отправлена.';this.pending=null;localStorage.removeItem(KEY+this.user);}
}
if(typeof module!=='undefined'&&module.exports){module.exports={personalTopic,walletFromPost,playerWallet,count,message,extract,nativeRoll,debitMessage,debitPublished,PRICE,MAX};return;}
function mount(){let root=document.getElementById('lottery-d100');if(!root){const u=new URL(location.href);if(u.pathname!=='/viewtopic.php'||u.searchParams.get('id')!=='361')return;const first=document.querySelector('.post .post-content');if(first){const w=document.createTreeWalker(first,NodeFilter.SHOW_TEXT);let node;while(node=w.nextNode()){if(node.parentElement.closest('script,style,pre,code,blockquote,.quote-box'))continue;const index=node.textContent.indexOf('[lottery-d100]');if(index<0)continue;const part=node.splitText(index);part.splitText(14);root=document.createElement('div');root.id='lottery-d100';part.replaceWith(root);break;}}if(!root){const target=document.querySelector('#post,#post-form,#pun-viewtopic .topic,.topic');if(!target)return;root=document.createElement('div');root.id='lottery-d100';target.before(root);}}if(root.dataset.mounted)return;root.dataset.mounted='1';const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);global.lotteryD100=new Lottery(root);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})(typeof window!=='undefined'?window:globalThis);
