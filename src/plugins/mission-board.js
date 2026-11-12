(function(){function createMissionModel() {
  const ranks=['E','D','C','B','A','S'];
  const statuses={open:'Доступна',in_progress:'В процессе',completed:'Выполнена'};
  const fail=message=>{throw Object.assign(Error(message),{status:400});};
  function text(value,max,label,required=false) {
    if (typeof value!=='string'||value.length>max||required&&!value.trim()) fail('Проверьте поле «'+label+'»');
    return value.trim();
  }
  function validateRecord(input) {
    if (!input||typeof input!=='object'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.id||'')) fail('Неверный ID миссии');
    if (!ranks.includes(input.rank)||!Object.hasOwn(statuses,input.status)) fail('Проверьте ранг и статус миссии');
    const record={id:input.id,board:text(input.board,80,'Деревня или организация',true),rank:input.rank,name:text(input.name,160,'Название',true),description:text(input.description,6000,'Описание',true),status:input.status,participants:text(input.participants||'',1000,'Участники',input.status!=='open'),episode:text(input.episode||'',1000,'Ссылка')};
    if(record.episode) {
      let url;try{url=new URL(record.episode)}catch{fail('Укажите HTTPS-ссылку на эпизод или новость')}
      if(url.protocol!=='https:'||url.username||url.password)fail('Укажите HTTPS-ссылку на эпизод или новость');
    }
    return record;
  }
  function validateBoard(input) {
    if(!Array.isArray(input)||input.length>500)fail('Допустимо не более 500 миссий');
    const records=input.map(validateRecord);
    if(new Set(records.map(record=>record.id)).size!==records.length)fail('Повторный ID миссии');
    return records;
  }
  const emptyRecord=()=>({id:crypto.randomUUID(),board:'',rank:'D',name:'',description:'',status:'open',participants:'',episode:''});
  return {ranks,statuses,validateRecord,validateBoard,emptyRecord};
}

window.AkatsukiMissionModel=createMissionModel();const style=document.createElement("style");style.textContent=".missions.missions.missions{--mission-accent:var(--color-link,#8f3131);--mission-panel:var(--color-qv,#fbf8f8);--mission-soft:var(--color-lnthoverbg,#e9e3e3);color:var(--color-txt1,#292627);font:14px/1.5 var(--font-g,Arial,sans-serif);text-indent:0;text-align:left;min-width:0;width:100%}\r\n.missions.missions.missions *{box-sizing:border-box;text-indent:0}\r\n.missions.missions.missions [hidden]{display:none!important}\r\n.missions.missions.missions h2{color:var(--mission-accent);font-family:var(--font-1,Arial,sans-serif);margin:5px 0 18px}\r\n.missions.missions.missions header{padding:18px 0;border-bottom:2px solid var(--mission-accent)}\r\n.missions.missions.missions header small{letter-spacing:2px;opacity:.7}\r\n.missions.missions.missions label{display:grid;gap:6px;min-width:0}\r\n.missions.missions.missions input,.missions.missions.missions select,.missions.missions.missions textarea{width:100%;max-width:100%;min-width:0;padding:10px 12px;border:1px solid var(--mission-soft);border-radius:7px;background:var(--mission-panel);color:inherit;font:inherit}\r\n.missions.missions.missions button,.missions.missions.missions .mission-link{min-height:42px;padding:9px 14px;border:1px solid var(--mission-accent);border-radius:6px 14px 6px 6px;background:var(--mission-panel);color:var(--mission-accent);font:inherit;cursor:pointer;text-decoration:none;overflow-wrap:anywhere}\r\n.missions.missions.missions button:hover,.missions.missions.missions button[aria-selected=true]{background:var(--mission-accent);color:var(--color-txt3,#fff)}\r\n.missions.missions.missions button:disabled{opacity:.5;cursor:default}\r\n.missions.missions.missions button:focus-visible,.missions.missions.missions summary:focus-visible{outline:2px solid var(--mission-accent);outline-offset:3px}\r\n.missions.missions.missions .mission-toolbar,.missions.missions.missions .mission-tabs,.missions.missions.missions .mission-pages{display:flex;align-items:end;flex-wrap:wrap;gap:10px;margin:16px 0}\r\n.missions.missions.missions .mission-toolbar label{flex:1 1 180px}\r\n.missions.missions.missions .mission-tabs{align-items:stretch}\r\n.missions.missions.missions .mission-tabs button{flex:0 1 auto}\r\n.missions.missions.missions .mission-list{display:grid;gap:12px}\r\n.missions.missions.missions .mission-card{border:1px solid var(--mission-soft);border-radius:7px 20px 7px 7px;background:var(--mission-panel);overflow:hidden}\r\n.missions.missions.missions .mission-card summary{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:16px;cursor:pointer;list-style:none}\r\n.missions.missions.missions .mission-card summary::-webkit-details-marker{display:none}\r\n.missions.missions.missions .mission-card summary:after{content:'+';margin-left:4px;color:var(--mission-accent);font-size:20px}\r\n.missions.missions.missions .mission-card[open] summary:after{content:'−'}\r\n.missions.missions.missions .mission-card summary strong{flex:1;min-width:90px;overflow-wrap:anywhere}\r\n.missions.missions.missions .mission-rank{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;flex:none;border:1px solid var(--mission-accent);color:var(--mission-accent);border-radius:6px;font-weight:bold}\r\n.missions.missions.missions .mission-status{padding:3px 9px;background:var(--mission-soft);border-radius:20px;font-size:12px}\r\n.missions.missions.missions .mission-status.is-completed{opacity:.65}\r\n.missions.missions.missions .mission-details{padding:0 16px 18px;border-top:1px solid var(--mission-soft);overflow-wrap:anywhere}\r\n.missions.missions.missions .mission-description{white-space:pre-wrap;text-align:left}\r\n.missions.missions.missions .mission-link{display:inline-block}\r\n.missions.missions.missions .mission-admin-layout{display:grid;grid-template-columns:220px minmax(0,1fr);gap:18px}\r\n.missions.missions.missions [data-mission-records] button{display:block;width:100%;text-align:left;margin-bottom:8px}\r\n.missions.missions.missions [data-mission-records] small{display:block}\r\n.missions.missions.missions .mission-form{display:grid;gap:14px;min-width:0}\r\n.missions.missions.missions .mission-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}\r\n.missions.missions.missions .mission-pages{justify-content:center;align-items:center}\r\n@media(max-width:700px){.missions.missions.missions .mission-admin-layout{grid-template-columns:1fr}.missions.missions.missions .mission-form-grid{grid-template-columns:1fr}.missions.missions.missions .mission-status{margin-left:auto}}\r\n";document.head.appendChild(style);})();
(function(){
  'use strict';
  if(window.AkatsukiMissions)return;
  const M=window.AkatsukiMissionModel;
  const endpoint='https://akatski-forum-app.vercel.app/api/v1/missions';
  const admin=()=>Number(window.GroupID||window.FORUM?.group_id)===1;
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const snapshotKey='akatsuki-missions-public-v1';
  function readSnapshot() {
    try {
      const cached=JSON.parse(localStorage.getItem(snapshotKey)||'null');
      if (!cached||Date.now()-cached.cachedAt>7*86400000||!Array.isArray(cached.data?.saved?.records)) return null;
      M.validateBoard(cached.data.saved.records);
      return cached;
    } catch {return null;}
  }
  function remember(data) {
    try {localStorage.setItem(snapshotKey,JSON.stringify({cachedAt:Date.now(),data}));} catch {}
  }
  async function request(options={}) {
    const read=!options.method||options.method==='GET';
    if(read&&window.AkatsukiPublicAPI)return window.AkatsukiPublicAPI.read('/api/v1/missions');
    for (let attempt=0;attempt<(read?3:1);attempt++) {
      try {
        const response=await fetch(endpoint,{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(read?15000:20000),...options});
        const result=await response.json();
        if (!response.ok) throw Object.assign(Error(result.error||'Сервер временно недоступен'),{status:response.status});
        return result;
      } catch(error) {
        if (!read||error.status&&error.status<500&&error.status!==429) throw error;
        if (attempt===2) throw Error('Не удалось связаться с сервером доски миссий. Попробуйте обновить позже.');
        await new Promise(resolve=>setTimeout(resolve,attempt?1500:500));
      }
    }
  }
  let sharedRequest;
  function load() {
    if (!sharedRequest) sharedRequest=request().then(data=>{remember(data);return data;}).finally(()=>{sharedRequest=null;});
    return sharedRequest;
  }
  async function adminKey() {
    if (!admin()) throw Error('Сохранение доступно администратору');
    function configured() {
      const token=window.MISSION_BOARD_CONFIG?.adminToken||window.BINGO_BOOK_CONFIG?.adminToken||window.LOTTERY_RESULTS_CONFIG?.adminToken;
      return typeof token==='string'&&token.trim().length>=32?token.trim():'';
    }
    const supplied=configured();
    if (supplied) return supplied;
    if (window.LotteryAdminKeys) {
      const key=await window.LotteryAdminKeys.load();
      if (key) return key;
    }
    const user=Number(window.UserID||window.uid||0);
    if (user<=1||!window.ForumAPITicket) throw Error('Войдите в форум администратором');
    const body=new URLSearchParams({method:'storage.get',user_id:String(user),key:'akatsuki_lottery_admin_key_v1',token:window.ForumAPITicket,format:'json',charset:'utf-8'});
    const response=await fetch('/api.php',{method:'POST',body,credentials:'same-origin',signal:AbortSignal.timeout(12000)});
    const data=await response.json();
    const key=configured()||data.response?.storage?.data?.akatsuki_lottery_admin_key_v1;
    if (typeof key!=='string'||key.length<32) throw Error('Для профиля не подключён серверный ключ администратора. Подключите ключ существующего серверного хранилища.');
    return key;
  }

  function options(values,value,empty='') {
    return (empty?'<option value="">'+esc(empty)+'</option>':'')+Object.entries(values).map(([key,label])=>'<option value="'+esc(key)+'"'+(key===value?' selected':'')+'>'+esc(label)+'</option>').join('');
  }
  function card(record) {
    return '<details class="mission-card"><summary><span class="mission-rank">'+record.rank+'</span><strong>'+esc(record.name)+'</strong><span class="mission-status is-'+record.status+'">'+M.statuses[record.status]+'</span></summary><div class="mission-details"><p class="mission-description">'+esc(record.description)+'</p>'+(record.participants?'<p><b>Участники:</b> '+esc(record.participants)+'</p>':'')+(record.episode?'<a href="'+esc(record.episode)+'" class="mission-link">Эпизод / новость ↗</a>':'')+'</div></details>';
  }
  function mount(root) {
    root.classList.add('missions');
    root.innerHTML='<header><small>ЗАДАНИЯ ШИНОБИ</small><h2>Доска миссий</h2></header><div class="mission-toolbar"><label>Поиск<input type="search" data-mission-search placeholder="Название и описание"></label><label>Статус<select data-mission-status>'+options(M.statuses,'','Все статусы')+'</select></label><button type="button" data-mission-refresh>Обновить</button></div><div class="mission-tabs" role="tablist" aria-label="Деревни и организации"></div><p role="status" data-mission-notice></p><div class="mission-list" role="tabpanel"></div><nav class="mission-pages" aria-label="Страницы миссий"></nav>';
    let records=[],board='',page=1,busy=false,hasData=false;
    const notice=root.querySelector('[data-mission-notice]'),refreshButton=root.querySelector('[data-mission-refresh]');
    function render() {
      const boards=[...new Set(records.map(record=>record.board))].sort((a,b)=>a.localeCompare(b,'ru'));
      if(!boards.includes(board))board=boards[0]||'';
      root.querySelector('.mission-tabs').innerHTML=boards.map(name=>'<button type="button" role="tab" aria-selected="'+(name===board)+'" data-mission-board="'+esc(name)+'">'+esc(name)+'</button>').join('');
      const query=root.querySelector('[data-mission-search]').value.toLocaleLowerCase('ru').replace(/ё/g,'е').trim();
      const status=root.querySelector('[data-mission-status]').value;
      const visible=records.filter(record=>record.board===board&&(!status||record.status===status)&&(!query||(record.name+' '+record.description+' '+record.participants).toLocaleLowerCase('ru').replace(/ё/g,'е').includes(query)));
      const pages=Math.max(1,Math.ceil(visible.length/6));page=Math.min(page,pages);
      root.querySelector('.mission-list').innerHTML=visible.slice((page-1)*6,page*6).map(card).join('');
      const nav=root.querySelector('.mission-pages');nav.hidden=pages<=1;
      nav.innerHTML='<button type="button" data-mission-page="'+(page-1)+'"'+(page===1?' disabled':'')+'>← Назад</button><span>Страница '+page+' из '+pages+'</span><button type="button" data-mission-page="'+(page+1)+'"'+(page===pages?' disabled':'')+'>Далее →</button>';
      notice.textContent=visible.length?'Найдено миссий — '+visible.length:records.length?'По этим фильтрам миссий нет.':'Миссий пока нет.';
    }
    const cached=readSnapshot();
    if(cached){records=cached.data.saved.records;hasData=true;render();}
    async function refresh() {
      if(busy)return;busy=true;refreshButton.disabled=true;
      notice.textContent=hasData?'Показана сохранённая копия. Обновляем…':'Загрузка доски миссий…';
      try{const data=await load();records=data.saved.records;hasData=true;render();}
      catch(error){notice.textContent=error.message+(hasData?' Показана последняя успешно загруженная копия.':' Нажмите «Обновить».');}
      finally{busy=false;refreshButton.disabled=false;}
    }
    refreshButton.addEventListener('click',refresh);
    root.querySelectorAll('input,select').forEach(input=>input.addEventListener(input.tagName==='INPUT'?'input':'change',()=>{page=1;render();}));
    root.addEventListener('click',event=>{
      const tab=event.target.closest('[data-mission-board]');if(tab){board=tab.dataset.missionBoard;page=1;render();}
      const next=event.target.closest('[data-mission-page]');if(next&&!next.disabled){page=Number(next.dataset.missionPage);render();}
    });
    refresh();
  }
  function editor(root) {
    if(!admin()||root.dataset.missionEditorReady)return;
    root.dataset.missionEditorReady='true';root.classList.add('missions');
    root.innerHTML='<h2>Доска миссий</h2><p>Тег для сообщения: <code>[mission-board]</code></p><div class="mission-toolbar"><button type="button" data-mission-new disabled>Добавить миссию</button><button type="button" data-mission-reload>Обновить список</button></div><p data-mission-admin-notice role="status"></p><div class="mission-admin-layout"><div data-mission-records></div><div data-mission-form></div></div>';
    let saved={revision:0,records:[]},editing=null,dirty=false,busy=false,pending=null;
    const notice=root.querySelector('[data-mission-admin-notice]'),host=root.querySelector('[data-mission-form]');
    const canLeave=()=>!dirty||window.confirm('Отменить несохранённые изменения миссии?');
    function list(){root.querySelector('[data-mission-records]').innerHTML=saved.records.map(record=>'<button type="button" data-mission-record="'+record.id+'"><strong>'+esc(record.name)+'</strong><small>'+esc(record.board)+' · '+record.rank+' · '+M.statuses[record.status]+'</small></button>').join('')||'<p>Миссий пока нет.</p>';}
    async function persist(records) {
      if(!pending)pending={records,expectedRevision:saved.revision,requestId:crypto.randomUUID(),actor:String(window.UserID||window.uid||'admin')};
      const token=await adminKey();
      const result=await request({method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(pending)});
      saved=result.saved;remember(result);pending=null;dirty=false;list();notice.textContent='Сохранено на сервере. Версия '+saved.revision;
      document.dispatchEvent(new Event('mission-board-updated'));
    }
    function open(record) {
      editing=structuredClone(record);dirty=false;pending=null;
      const names=[...new Set([...Object.values(window.AkatsukiBingoModel?.villages||{}),...saved.records.map(item=>item.board)])];
      host.innerHTML='<form class="mission-form"><label>Деревня / организация<input name="board" list="mission-board-names-'+record.id+'" value="'+esc(record.board)+'" required maxlength="80" placeholder="Коноха, Акацуки…"><datalist id="mission-board-names-'+record.id+'">'+names.map(name=>'<option value="'+esc(name)+'"></option>').join('')+'</datalist></label><div class="mission-form-grid"><label>Ранг<select name="rank">'+options(Object.fromEntries(M.ranks.map(rank=>[rank,rank])),record.rank)+'</select></label><label>Статус<select name="status">'+options(M.statuses,record.status)+'</select></label></div><label>Название<input name="name" value="'+esc(record.name)+'" required maxlength="160"></label><label>Описание<textarea name="description" rows="6" required maxlength="6000">'+esc(record.description)+'</textarea></label><label>Участники<textarea name="participants" rows="2" maxlength="1000" placeholder="Имена участников">'+esc(record.participants)+'</textarea><small>Обязательно для миссии в процессе или выполненной.</small></label><label>Эпизод / новость — необязательно<input name="episode" type="url" value="'+esc(record.episode)+'" maxlength="1000" placeholder="https://…"></label><div class="mission-toolbar"><button type="submit">Сохранить на сервер</button><button type="button" data-mission-close>Закрыть</button>'+(saved.records.some(item=>item.id===record.id)?'<button type="button" data-mission-delete>Удалить миссию</button>':'')+'</div><p data-mission-save-status role="status"></p></form>';
      const form=host.querySelector('form'),status=form.querySelector('[data-mission-save-status]');
      const update=()=>{form.elements.participants.required=form.elements.status.value!=='open';};update();
      form.addEventListener('input',()=>{dirty=true;pending=null;update();});form.addEventListener('change',()=>{dirty=true;pending=null;update();});
      form.querySelector('[data-mission-close]').addEventListener('click',()=>{if(!busy&&canLeave()){host.replaceChildren();editing=null;dirty=false;pending=null;}});
      form.addEventListener('submit',async event=>{
        event.preventDefault();if(busy)return;
        try {
          const fields=Object.fromEntries(new FormData(form));
          const next=M.validateRecord({...editing,...fields});
          const records=saved.records.filter(item=>item.id!==next.id).concat(next);
          busy=true;form.querySelectorAll('button,input,select,textarea').forEach(button=>button.disabled=true);status.textContent='Сохранение…';
          await persist(records);open(next);host.querySelector('[data-mission-save-status]').textContent='Сохранено на сервере. Версия '+saved.revision;
        } catch(error){status.textContent=error.message;}
        finally{busy=false;form.querySelectorAll('button,input,select,textarea').forEach(button=>button.disabled=false);}
      });
      form.querySelector('[data-mission-delete]')?.addEventListener('click',async()=>{
        if(busy||!window.confirm('Удалить миссию «'+editing.name+'»?'))return;
        try{busy=true;if(pending?.records.some(item=>item.id===editing.id))pending=null;form.querySelectorAll('button,input,select,textarea').forEach(button=>button.disabled=true);await persist(saved.records.filter(item=>item.id!==editing.id));host.replaceChildren();editing=null;}
        catch(error){status.textContent=error.message;}
        finally{busy=false;form.querySelectorAll('button,input,select,textarea').forEach(button=>button.disabled=false);}
      });
    }
    async function refresh() {
      if(busy||!canLeave())return;busy=true;notice.textContent='Загрузка…';
      try{const data=await load();saved=data.saved;list();host.replaceChildren();dirty=false;editing=null;pending=null;root.querySelector('[data-mission-new]').disabled=false;notice.textContent='Версия '+saved.revision+' · миссий '+saved.records.length;}
      catch(error){notice.textContent=error.message;}finally{busy=false;}
    }
    root.querySelector('[data-mission-new]').addEventListener('click',()=>{if(!busy&&canLeave())open(M.emptyRecord());});
    root.querySelector('[data-mission-reload]').addEventListener('click',refresh);
    root.querySelector('[data-mission-records]').addEventListener('click',event=>{const button=event.target.closest('[data-mission-record]');if(button&&!busy&&canLeave()){const record=saved.records.find(item=>item.id===button.dataset.missionRecord);if(record)open(record);}});
    refresh();
  }
  function attach(root) {
    if(!admin()||root.dataset.missionTabReady)return;
    const tabs=root.querySelector('[role="tablist"]');if(!tabs)return;
    root.dataset.missionTabReady='true';
    const button=document.createElement('button');button.type='button';button.role='tab';button.dataset.missionTab='';button.textContent='Доска миссий';button.setAttribute('aria-selected','false');
    const view=document.createElement('div');view.hidden=true;view.dataset.missionAdmin='';tabs.append(button);root.append(view);
    root.addEventListener('click',event=>{
      if(event.target.closest('[data-mission-tab]')) {
        event.preventDefault();event.stopImmediatePropagation();
        if(!view.hidden)return;
        root.querySelectorAll('[role="tablist"]>[role="tab"]').forEach(tab=>tab.setAttribute('aria-selected',String(tab===button)));
        root.querySelectorAll('#akcm-registry-view,#akcm-bulk-view,#akcm-events-view,#akcm-postcount-view,[data-bingo-admin]').forEach(node=>node.hidden=true);
        view.hidden=false;editor(view);
      } else if(event.target.closest('[data-action$="-tab"],[data-bingo-tab]')) {view.hidden=true;button.setAttribute('aria-selected','false');}
    },true);
  }
  function scan(scope=document) {
    scope.querySelectorAll?.('.akcm').forEach(attach);if(scope.matches?.('.akcm'))attach(scope);
    const contents=scope.matches?.('.post-content')?[scope]:Array.from(scope.querySelectorAll?.('.post-content')||[]);
    for(const content of contents) {
      const walker=document.createTreeWalker(content,NodeFilter.SHOW_TEXT),nodes=[];
      while(walker.nextNode()){const node=walker.currentNode;if(!node.parentElement.closest('.missions,pre,code,textarea,script,style')&&/\[mission-board\]/i.test(node.data))nodes.push(node);}
      for(const node of nodes) {
        const fragment=document.createDocumentFragment();let offset=0;
        for(const match of node.data.matchAll(/\[mission-board\]/gi)){fragment.append(document.createTextNode(node.data.slice(offset,match.index)));const widget=document.createElement('section');fragment.append(widget);mount(widget);offset=match.index+match[0].length;}
        fragment.append(document.createTextNode(node.data.slice(offset)));node.replaceWith(fragment);
      }
    }
  }
  window.AkatsukiMissions={scan,mount,mountAdmin:editor};
  function boot(){scan();let scheduled=false;new MutationObserver(mutations=>{if(scheduled||!mutations.some(mutation=>Array.from(mutation.addedNodes).some(node=>node.nodeType===1&&!node.closest?.('.missions'))))return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;scan();});}).observe(document.body,{childList:true,subtree:true});}
  if(window.forumDeferredExtras)window.forumDeferredExtras.onReady(boot);else if(document.readyState==='complete')boot();else window.addEventListener('load',boot,{once:true});
})();
