(function(){function createMissionModel() {
  const ranks=['E','D','C','B','A','S'];
  const statuses={open:'Доступна',in_progress:'В процессе',completed:'Выполнена'};
  const villages=['Коноха','Кири','Кумо','Ива','Суна','Ото','Аме','Таки','Куса','Юки'];
  const standardRules={D:{base:5000,xpMin:3,xpMax:10},C:{base:50000,xpMin:5,xpMax:20},B:{base:100000,xpMin:10,xpMax:40},A:{base:500000,xpMin:20,xpMax:80},S:{base:1000000,xpMin:40,xpMax:160}};
  const recipients={shinobi:'На 1 шиноби',team:'Команде / исполнителям',performer:'Исполнителю',organization:'Деревне / организации'};
  const fail=message=>{throw Object.assign(Error(message),{status:400});};
  function text(value,max,label,required=false) {
    if (typeof value!=='string'||value.length>max||required&&!value.trim()) fail('Проверьте поле «'+label+'»');
    return value.trim();
  }
  function number(value,max,label,min=0) {
    if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)fail('Проверьте поле «'+label+'»');
    return value;
  }
  function validateSettings(input={}) {
    const organizations=input.organizations??['Акацуки'];
    if(!Array.isArray(organizations)||organizations.length>80)fail('Допустимо не более 80 организаций');
    const names=[...new Set(['Акацуки',...organizations.map(value=>text(value,80,'Организация',true))])];
    if(names.some(name=>villages.includes(name)))fail('Деревня уже есть в списке');
    const rules={};
    for(const rank of Object.keys(standardRules)) {
      const item=input.rules?.[rank]??standardRules[rank];
      const base=number(item.base,1e12,'Стоимость миссии');
      const xpMin=number(item.xpMin,100000,'Опыт от'),xpMax=number(item.xpMax,100000,'Опыт до');
      if(xpMin>xpMax)fail('Минимальный опыт больше максимального');
      rules[rank]={base,xpMin,xpMax};
    }
    return {organizations:names,rules,rulesCheckedAt:text(input.rulesCheckedAt||'2026-11-12',40,'Дата сверки правил')};
  }
  function parseRules(xpText,moneyText) {
    const xpBlock=xpText.split('Количество опыта за миссию')[1]?.split('Цвет для кода')[0]||'';
    const moneyBlock=moneyText.split('Базовая награда за миссию')[1]?.split('Выплата шиноби')[0]||'';
    const xp=[...xpBlock.matchAll(/(\d+)\s*[-–—]\s*(\d+)/g)].map(match=>[+match[1],+match[2]]);
    const money=[...moneyBlock.matchAll(/([\d][\d\s'’]*)\s*р[её]/gi)].map(match=>Number(match[1].replace(/[^\d]/g,'')));
    if(xp.length!==5||money.length!==5)fail('Таблица наград в правилах изменилась. Проверьте её перед обновлением.');
    return Object.fromEntries(['D','C','B','A','S'].map((rank,index)=>[rank,{base:money[index],xpMin:xp[index][0],xpMax:xp[index][1]}]));
  }
  function validateReward(input) {
    if(input==null)input={mode:'text',text:''};
    const xpMin=input.xpMin==null?null:number(input.xpMin,100000,'Опыт от',1);
    const xpMax=input.xpMax==null?null:number(input.xpMax,100000,'Опыт до',1);
    if((xpMin==null)!==(xpMax==null)||xpMin!=null&&xpMin>xpMax)fail('Укажите корректный диапазон опыта');
    if(!['standard','custom','text'].includes(input.mode))fail('Выберите тип награды');
    if(input.mode==='text')return {mode:'text',text:text(input.text||'',4000,'Награда'),xpMin,xpMax};
    if(input.mode==='standard')return {mode:'standard',xpMin,xpMax};
    const teamSize=number(input.teamSize??4,100,'Число участников',1);
    if(!Number.isInteger(teamSize))fail('Число участников должно быть целым');
    const sharePercent=number(input.sharePercent??10,100,'Доля на 1 шиноби');
    if(!Array.isArray(input.parts)||!input.parts.length||input.parts.length>20)fail('Добавьте от 1 до 20 строк награды');
    const parts=input.parts.map(part=>{
      if(!Object.hasOwn(recipients,part.recipient)||!['fixed','range'].includes(part.type))fail('Проверьте получателя и вид выплаты');
      const min=number(part.min,1e12,'Сумма от'),max=part.type==='fixed'?min:number(part.max,1e12,'Сумма до');
      if(min>max)fail('Минимальная награда больше максимальной');
      const unit=text(part.unit||'',100,'За единицу');
      const quantity=unit&&part.quantity!=null?number(part.quantity,1000000,'Количество'):null;
      return {recipient:part.recipient,type:part.type,min,max,unit,quantity,condition:text(part.condition||'',300,'Условие бонуса'),shareEach:part.recipient==='organization'&&part.shareEach===true};
    });
    return {mode:'custom',teamSize,sharePercent,parts,xpMin,xpMax,notes:text(input.notes||'',4000,'Условия награды')};
  }
  function calculateReward(record,rules=standardRules) {
    const reward=validateReward(record.reward);
    const rule=rules[record.rank];
    const xp={xpMin:reward.xpMin??rule?.xpMin??null,xpMax:reward.xpMax??rule?.xpMax??null};
    if(reward.mode==='text')return {...reward,...xp};
    if(reward.mode==='standard') {
      return rule?{mode:'standard',base:rule.base,each:rule.base*.1,...xp}:{mode:'standard',missing:true,...xp};
    }
    return {...reward,...xp,parts:reward.parts.map(part=>{
      const quantity=part.unit?(part.quantity??1):1;
      const factor=part.recipient==='team'?1/reward.teamSize:part.recipient==='organization'?(part.shareEach?reward.sharePercent/100:0):1;
      return {...part,totalMin:part.min*quantity,totalMax:part.max*quantity,eachMin:part.min*quantity*factor,eachMax:part.max*quantity*factor,hasEach:part.recipient!=='organization'||part.shareEach,variable:!!part.unit&&part.quantity==null};
    })};
  }
  function validateRecord(input) {
    if (!input||typeof input!=='object'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.id||'')) fail('Неверный ID миссии');
    if (!ranks.includes(input.rank)||!Object.hasOwn(statuses,input.status)) fail('Проверьте ранг и статус миссии');
    const record={id:input.id,board:text(input.board,80,'Деревня или организация',true),rank:input.rank,name:text(input.name,160,'Название',true),description:text(input.description,6000,'Описание',true),status:input.status,participants:text(input.participants||'',1000,'Участники',input.status!=='open'),episode:text(input.episode||'',1000,'Ссылка'),reward:validateReward(input.reward)};
    if(record.episode) {
      let url;try{url=new URL(record.episode)}catch{fail('Укажите HTTPS-ссылку на эпизод или новость')}
      if(url.protocol!=='https:'||url.username||url.password)fail('Укажите HTTPS-ссылку на эпизод или новость');
    }
    if(record.reward.mode==='standard'&&!standardRules[record.rank])fail('Для ранга E стандартная награда не задана правилами. Выберите свою награду или текст.');
    return record;
  }
  function validateBoard(input) {
    if(!Array.isArray(input)||input.length>500)fail('Допустимо не более 500 миссий');
    const records=input.map(validateRecord);
    if(new Set(records.map(record=>record.id)).size!==records.length)fail('Повторный ID миссии');
    return records;
  }
  const emptyRecord=()=>({id:crypto.randomUUID(),board:'',rank:'D',name:'',description:'',status:'open',participants:'',episode:'',reward:{mode:'standard'}});
  return {ranks,statuses,villages,recipients,standardRules,validateSettings,parseRules,validateReward,calculateReward,validateRecord,validateBoard,emptyRecord};
}

window.AkatsukiMissionModel=createMissionModel();const style=document.createElement("style");style.textContent=".missions.missions.missions{--mission-accent:var(--color-link,#8f3131);--mission-panel:var(--color-qv,#fbf8f8);--mission-soft:var(--color-lnthoverbg,#e9e3e3);color:var(--color-txt1,#292627);font:14px/1.5 var(--font-g,Arial,sans-serif);text-indent:0;text-align:left;min-width:0;width:100%}\r\n.missions.missions.missions *{box-sizing:border-box;text-indent:0}\r\n.missions.missions.missions [hidden]{display:none!important}\r\n.missions.missions.missions h2{color:var(--mission-accent);font-family:var(--font-1,Arial,sans-serif);margin:5px 0 18px}\r\n.missions.missions.missions header{padding:18px 0;border-bottom:2px solid var(--mission-accent)}\r\n.missions.missions.missions header small{letter-spacing:2px;opacity:.7}\r\n.missions.missions.missions label{display:grid;gap:6px;min-width:0}\r\n.missions.missions.missions input,.missions.missions.missions select,.missions.missions.missions textarea{width:100%;max-width:100%;min-width:0;padding:10px 12px;border:1px solid var(--mission-soft);border-radius:7px;background:var(--mission-panel);color:inherit;font:inherit}\r\n.missions.missions.missions button,.missions.missions.missions .mission-link{min-height:42px;padding:9px 14px;border:1px solid var(--mission-accent);border-radius:6px 14px 6px 6px;background:var(--mission-panel);color:var(--mission-accent);font:inherit;cursor:pointer;text-decoration:none;overflow-wrap:anywhere}\r\n.missions.missions.missions button:hover,.missions.missions.missions button[aria-selected=true]{background:var(--mission-accent);color:var(--color-txt3,#fff)}\r\n.missions.missions.missions button:disabled{opacity:.5;cursor:default}\r\n.missions.missions.missions button:focus-visible,.missions.missions.missions summary:focus-visible{outline:2px solid var(--mission-accent);outline-offset:3px}\r\n.missions.missions.missions .mission-toolbar,.missions.missions.missions .mission-tabs,.missions.missions.missions .mission-pages{display:flex;align-items:end;flex-wrap:wrap;gap:10px;margin:16px 0}\r\n.missions.missions.missions .mission-toolbar label{flex:1 1 180px}\r\n.missions.missions.missions .mission-tabs{align-items:stretch}\r\n.missions.missions.missions .mission-tabs button{flex:0 1 auto}\r\n.missions.missions.missions .mission-list{display:grid;gap:12px}\r\n.missions.missions.missions .mission-card{border:1px solid var(--mission-soft);border-radius:7px 20px 7px 7px;background:var(--mission-panel);overflow:hidden}\r\n.missions.missions.missions .mission-card summary{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:16px;cursor:pointer;list-style:none}\r\n.missions.missions.missions .mission-card summary::-webkit-details-marker{display:none}\r\n.missions.missions.missions .mission-card summary:after{content:'+';margin-left:4px;color:var(--mission-accent);font-size:20px}\r\n.missions.missions.missions .mission-card[open] summary:after{content:'−'}\r\n.missions.missions.missions .mission-card summary strong{flex:1;min-width:90px;overflow-wrap:anywhere}\r\n.missions.missions.missions .mission-rank{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;flex:none;border:1px solid var(--mission-accent);color:var(--mission-accent);border-radius:6px;font-weight:bold}\r\n.missions.missions.missions .mission-status{padding:3px 9px;background:var(--mission-soft);border-radius:20px;font-size:12px}\r\n.missions.missions.missions .mission-status.is-completed{opacity:.65}\r\n.missions.missions.missions .mission-details{padding:0 16px 18px;border-top:1px solid var(--mission-soft);overflow-wrap:anywhere}\r\n.missions.missions.missions .mission-description{white-space:pre-wrap;text-align:left}\r\n.missions.missions.missions .mission-link{display:inline-block}\r\n.missions.missions.missions .mission-admin-layout{display:grid;grid-template-columns:220px minmax(0,1fr);gap:18px}\r\n.missions.missions.missions [data-mission-records] button{display:block;width:100%;text-align:left;margin-bottom:8px}\r\n.missions.missions.missions [data-mission-records] small{display:block}\r\n.missions.missions.missions .mission-form{display:grid;gap:14px;min-width:0}\r\n.missions.missions.missions .mission-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}\r\n.missions.missions.missions .mission-pages{justify-content:center;align-items:center}\r\n@media(max-width:700px){.missions.missions.missions .mission-admin-layout{grid-template-columns:1fr}.missions.missions.missions .mission-form-grid{grid-template-columns:1fr}.missions.missions.missions .mission-status{margin-left:auto}}\r\n\r\n.missions.missions.missions .mission-board-control{display:grid;gap:9px;min-width:0}\r\n.missions.missions.missions .mission-board-picker{border:1px solid var(--mission-soft);border-radius:8px;background:var(--mission-panel);min-width:0}\r\n.missions.missions.missions .mission-board-picker summary{cursor:pointer;padding:12px 14px;color:var(--mission-accent);overflow-wrap:anywhere}\r\n.missions.missions.missions .mission-board-picker [data-board-search]{margin:0 10px 10px;width:calc(100% - 20px)}\r\n.missions.missions.missions [data-board-options]{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;max-height:240px;overflow:auto;padding:0 10px 10px}\r\n.missions.missions.missions [data-board-options] button{border-color:var(--mission-soft);border-radius:5px;text-align:left}\r\n.missions.missions.missions [data-board-options] button[aria-pressed=true]{background:var(--mission-accent);color:var(--color-txt3,#fff)}\r\n.missions.missions.missions [data-org-create]{display:grid;gap:9px;padding:12px;border:1px solid var(--mission-soft);border-radius:8px}\r\n.missions.missions.missions fieldset{min-width:0;margin:0;padding:15px;border:1px solid var(--mission-soft);border-radius:10px}\r\n.missions.missions.missions legend{color:var(--mission-accent);font-weight:700;padding:0 6px}\r\n.missions.missions.missions .mission-reward-editor,.missions.missions.missions [data-reward-custom]{display:grid;gap:14px}\r\n.missions.missions.missions .mission-reward{background:var(--mission-soft);border-left:3px solid var(--mission-accent);padding:12px 15px;margin:16px 0;overflow-wrap:anywhere}\r\n.missions.missions.missions .mission-reward h4{margin:0 0 10px;color:var(--mission-accent)}\r\n.missions.missions.missions .mission-reward p{white-space:pre-wrap;text-align:left;margin:8px 0}\r\n.missions.missions.missions .mission-reward a{color:var(--mission-accent)}\r\n.missions.missions.missions .mission-reward-line{padding:10px 0;border-bottom:1px solid var(--mission-panel)}\r\n.missions.missions.missions .mission-reward-line small{display:block;margin-top:5px}\r\n.missions.missions.missions .mission-reward-condition{font-style:italic}\r\n.missions.missions.missions .mission-reward-row{display:grid;gap:12px;border:1px solid var(--mission-soft);border-radius:8px;padding:12px;margin-bottom:12px}\r\n.missions.missions.missions .mission-reward-row-title{display:flex;align-items:center;justify-content:space-between;gap:10px}\r\n.missions.missions.missions .mission-check{display:flex;align-items:center;gap:8px}\r\n.missions.missions.missions .mission-check input{appearance:auto;width:18px;height:18px;padding:0;flex:none;accent-color:var(--mission-accent)}\r\n.missions.missions.missions .mission-help{font-size:12px;opacity:.8;text-align:left}\r\n.missions.missions.missions [data-mission-records]{max-height:65vh;overflow-y:auto;overscroll-behavior:contain;scrollbar-gutter:stable;padding-right:6px;align-self:start}\r\n.missions.missions.missions .mission-experience{display:grid;gap:10px;padding-top:12px;border-top:1px solid var(--mission-soft)}\r\n\r\n.missions.missions.missions .mission-card.mission-in-progress{border-left:4px solid var(--mission-accent)}\r\n.missions.missions.missions .mission-card.mission-in-progress>summary{background:var(--mission-soft)}\r\n.missions.missions.missions .mission-status.is-in_progress{background:var(--mission-accent);color:var(--color-txt3,#fff);font-weight:700}\r\n.missions.missions.missions .mission-status.is-in_progress:before{content:'● ';font-size:10px}\r\n.missions.missions.missions .mission-card.mission-completed>summary{background:var(--mission-soft);color:var(--color-underava,#746b69)}\r\n.missions.missions.missions .mission-status.is-completed{opacity:1;background:var(--mission-panel);border:1px solid var(--mission-soft)}\r\n.missions.missions.missions .mission-status.is-completed:before{content:'✓ '}\r\n.missions.missions.missions [data-mission-record].mission-in-progress{border-left-width:4px;font-weight:700}\r\n.missions.missions.missions [data-mission-record].mission-completed{background:var(--mission-soft)}\r\n";document.head.appendChild(style);})();
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
  const money=value=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(value)+' рё';
  const range=(min,max)=>min===max?money(min):money(min)+' — '+money(max);
  function rewardHTML(record,rules) {
    const value=M.calculateReward(record,rules);
    const experience=value.xpMin!=null?'Опыт на 1 шиноби: '+value.xpMin+'–'+value.xpMax:'Для ранга E укажите опыт вручную';
    if(value.mode==='text')return '<section class="mission-reward"><h4>Награда</h4>'+(value.text?'<p>'+esc(value.text)+'</p>':'')+'<p>'+experience+'</p></section>';
    if(value.mode==='standard')return '<section class="mission-reward"><h4>Стандартная награда · ранг '+record.rank+'</h4>'+(value.missing?'<p>Для этого ранга награда не задана правилами.</p>':'<p><b>На 1 шиноби: '+money(value.each)+'</b><br>Опыт на 1 шиноби: '+value.xpMin+'–'+value.xpMax+'<br><small>Стоимость миссии: '+money(value.base)+'; выплата каждому — 10%.</small></p>')+'<a href="https://akatsukigood.forum.cool/viewtopic.php?id=91#p2815">Опыт по правилам</a> · <a href="https://akatsukigood.forum.cool/viewtopic.php?id=91#p3854">Денежная награда</a></section>';
    return '<section class="mission-reward"><h4>Награда</h4>'+value.parts.map(part=>{
      const suffix=part.variable?' × количество':part.unit?' · '+esc(part.unit)+' × '+part.quantity:'';
      return '<div class="mission-reward-line"><strong>'+M.recipients[part.recipient]+': '+range(part.totalMin,part.totalMax)+suffix+'</strong>'+(part.unit&&part.variable?'<small>За единицу: '+esc(part.unit)+'</small>':'')+(part.condition?'<small class="mission-reward-condition">Условный бонус: '+esc(part.condition)+'</small>':'')+(part.hasEach&&['organization','team'].includes(part.recipient)?'<small>На 1 шиноби: '+range(part.eachMin,part.eachMax)+suffix+(part.recipient==='organization'?' ('+value.sharePercent+'% каждому)':' (команда '+value.teamSize+' чел.)')+'</small>':'')+'</div>';
    }).join('')+('<p>'+experience+'</p>')+(value.notes?'<p>'+esc(value.notes)+'</p>':'')+'</section>';
  }
  const newPart=()=>({recipient:'team',type:'fixed',min:0,max:0,unit:'',quantity:null,condition:'',shareEach:false});
  function partHTML(part,index) {
    const input=(key,label,value,type='text')=>'<label>'+label+'<input data-reward-field="'+key+'" type="'+type+'" value="'+esc(value??'')+'"'+(type==='number'?' min="0" step="any"':' maxlength="300"')+'></label>';
    return '<div class="mission-reward-row" data-reward-row><div class="mission-reward-row-title"><b>Выплата '+(index+1)+'</b><button type="button" data-reward-remove="'+index+'">Убрать</button></div><div class="mission-form-grid"><label>Кому<select data-reward-field="recipient">'+options(M.recipients,part.recipient)+'</select></label><label>Сумма<select data-reward-field="type">'+options({fixed:'Фиксированная',range:'Диапазон'},part.type)+'</select></label>'+input('min','Сумма / от',part.min,'number')+'<div data-range-max>'+input('max','До',part.max,'number')+'</div>'+input('unit','За единицу — необязательно',part.unit)+input('quantity','Количество — можно не задавать',part.quantity,'number')+'</div>'+input('condition','Условие бонуса — необязательно',part.condition)+'<label class="mission-check" data-share-option><input type="checkbox" data-reward-field="shareEach"'+(part.shareEach?' checked':'')+'>Считать долю каждому шиноби от этой суммы</label></div>';
  }
  function rewardForm(input,rank,rules) {
    const reward=M.validateReward(input),custom=reward.mode==='custom'?reward:{teamSize:4,sharePercent:10,parts:[newPart()],notes:'',xpMin:null,xpMax:null};
    return '<fieldset class="mission-reward-editor"><legend>Награда</legend><label>Вариант награды<select name="reward-mode">'+options({standard:'Стандартная по правилам',custom:'Настраиваемая',text:'Только текст — без расчётов'},reward.mode)+'</select></label><div data-reward-custom><div class="mission-form-grid"><label>Участников в команде<input type="number" name="reward-team-size" min="1" max="100" value="'+custom.teamSize+'"></label><label>Доля на 1 шиноби, %<input type="number" name="reward-share-percent" min="0" max="100" step="any" value="'+custom.sharePercent+'"></label></div><p class="mission-help">Выплата команде делится на число участников. Доля от награды организации считается каждому отдельно, без повторного деления на команду.</p><div data-reward-parts>'+custom.parts.map(partHTML).join('')+'</div><button type="button" data-reward-add>Добавить выплату / бонус</button><label>Дополнительные условия<textarea name="reward-notes" rows="3" maxlength="4000">'+esc(custom.notes)+'</textarea></label></div><label data-reward-text>Текст награды<textarea name="reward-text" rows="4" maxlength="4000">'+esc(reward.text||'')+'</textarea></label><div class="mission-experience"><b>Опыт на 1 шиноби — всегда начисляется</b><div class="mission-form-grid"><label>От<input name="reward-xp-min" type="number" min="1" max="100000" required></label><label>До<input name="reward-xp-max" type="number" min="1" max="100000" required></label></div><button type="button" data-xp-default>Подставить из правил по рангу</button></div><div data-reward-preview aria-live="polite"></div></fieldset>';
  }
  function readReward(form) {
    const mode=form.elements['reward-mode'].value;
    const num=value=>value===''?null:Number(value);
    const xp=form.dataset.xpManual==='true'?{xpMin:num(form.elements['reward-xp-min'].value),xpMax:num(form.elements['reward-xp-max'].value)}:{xpMin:null,xpMax:null};
    if(mode==='standard')return {mode,...xp};
    if(mode==='text')return {mode,...xp,text:form.elements['reward-text'].value};
    return {mode,teamSize:num(form.elements['reward-team-size'].value),sharePercent:num(form.elements['reward-share-percent'].value),...xp,notes:form.elements['reward-notes'].value,parts:[...form.querySelectorAll('[data-reward-row]')].map(row=>{
      const get=field=>row.querySelector('[data-reward-field="'+field+'"]');
      return {recipient:get('recipient').value,type:get('type').value,min:num(get('min').value),max:num(get('max').value),unit:get('unit').value,quantity:num(get('quantity').value),condition:get('condition').value,shareEach:get('shareEach').checked};
    })};
  }
  const statusOrder={in_progress:0,open:1,completed:2};
  const statusClass=status=>status==='in_progress'?'mission-in-progress':status==='completed'?'mission-completed':'mission-open';
  function card(record,rules) {
    return '<details class="mission-card '+statusClass(record.status)+'"><summary><span class="mission-rank">'+record.rank+'</span><strong>'+esc(record.name)+'</strong><span class="mission-status is-'+record.status+'">'+M.statuses[record.status]+'</span></summary><div class="mission-details"><p class="mission-description">'+esc(record.description)+'</p>'+rewardHTML(record,rules)+(record.participants?'<p><b>Участники:</b> '+esc(record.participants)+'</p>':'')+(record.episode?'<a href="'+esc(record.episode)+'" class="mission-link">Эпизод / новость ↗</a>':'')+'</div></details>';
  }
  function mount(root) {
    root.classList.add('missions');
    root.innerHTML='<header><small>ЗАДАНИЯ ШИНОБИ</small><h2>Доска миссий</h2></header><div class="mission-toolbar"><label>Поиск<input type="search" data-mission-search placeholder="Название и описание"></label><label>Ранг<select data-mission-rank>'+options(Object.fromEntries(M.ranks.map(rank=>[rank,rank])),'','Все ранги')+'</select></label><label>Статус<select data-mission-status>'+options(M.statuses,'','Все статусы')+'</select></label><button type="button" data-mission-refresh>Обновить</button></div><div class="mission-tabs" role="tablist" aria-label="Деревни и организации"></div><p role="status" data-mission-notice></p><div class="mission-list" role="tabpanel"></div><nav class="mission-pages" aria-label="Страницы миссий"></nav>';
    let records=[],settings=M.validateSettings(),board='',page=1,busy=false,hasData=false;
    const notice=root.querySelector('[data-mission-notice]'),refreshButton=root.querySelector('[data-mission-refresh]');
    function render() {
      const boards=[...new Set(records.map(record=>record.board))].sort((a,b)=>a.localeCompare(b,'ru'));
      if(!boards.includes(board))board=boards[0]||'';
      root.querySelector('.mission-tabs').innerHTML=boards.map(name=>'<button type="button" role="tab" aria-selected="'+(name===board)+'" data-mission-board="'+esc(name)+'">'+esc(name)+'</button>').join('');
      const query=root.querySelector('[data-mission-search]').value.toLocaleLowerCase('ru').replace(/ё/g,'е').trim();
      const status=root.querySelector('[data-mission-status]').value;
      const rank=root.querySelector('[data-mission-rank]').value;
      const visible=records.filter(record=>record.board===board&&(!rank||record.rank===rank)&&(!status||record.status===status)&&(!query||(record.name+' '+record.description+' '+record.participants).toLocaleLowerCase('ru').replace(/ё/g,'е').includes(query)));
      visible.sort((a,b)=>statusOrder[a.status]-statusOrder[b.status]);
      const pages=Math.max(1,Math.ceil(visible.length/6));page=Math.min(page,pages);
      root.querySelector('.mission-list').innerHTML=visible.slice((page-1)*6,page*6).map(record=>card(record,settings.rules)).join('');
      const nav=root.querySelector('.mission-pages');nav.hidden=pages<=1;
      nav.innerHTML='<button type="button" data-mission-page="'+(page-1)+'"'+(page===1?' disabled':'')+'>← Назад</button><span>Страница '+page+' из '+pages+'</span><button type="button" data-mission-page="'+(page+1)+'"'+(page===pages?' disabled':'')+'>Далее →</button>';
      notice.textContent=visible.length?'Найдено миссий — '+visible.length:records.length?'По этим фильтрам миссий нет.':'Миссий пока нет.';
    }
    const cached=readSnapshot();
    if(cached){records=cached.data.saved.records;settings=M.validateSettings(cached.data.saved.settings||{});hasData=true;render();}
    async function refresh() {
      if(busy)return;busy=true;refreshButton.disabled=true;
      notice.textContent=hasData?'Показана сохранённая копия. Обновляем…':'Загрузка доски миссий…';
      try{const data=await load();records=data.saved.records;settings=M.validateSettings(data.saved.settings||{});hasData=true;render();}
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
    root.innerHTML='<h2>Доска миссий</h2><p>Тег для сообщения: <code>[mission-board]</code></p><div class="mission-toolbar"><button type="button" data-mission-new disabled>Добавить миссию</button><button type="button" data-mission-reload>Обновить список</button></div><p data-mission-rules-status role="status"></p><p data-mission-admin-notice role="status"></p><div class="mission-admin-layout"><div data-mission-records></div><div data-mission-form></div></div>';
    let saved={revision:0,records:[],settings:M.validateSettings()},editing=null,dirty=false,busy=false,pending=null,rulesPromise=null,latestRules=null;
    const notice=root.querySelector('[data-mission-admin-notice]'),host=root.querySelector('[data-mission-form]');
    const canLeave=()=>!dirty||window.confirm('Отменить несохранённые изменения миссии?');
    function list(){root.querySelector('[data-mission-records]').innerHTML=[...saved.records].sort((a,b)=>statusOrder[a.status]-statusOrder[b.status]).map(record=>'<button type="button" class="'+statusClass(record.status)+'" data-mission-record="'+record.id+'"><strong>'+esc(record.name)+'</strong><small>'+esc(record.board)+' · '+record.rank+' · '+M.statuses[record.status]+'</small></button>').join('')||'<p>Миссий пока нет.</p>';}
    async function ruleTable() {
      const label=root.querySelector('[data-mission-rules-status]');label.textContent='Сверяем стандартную награду с правилами…';
      try {
        const response=await fetch('/viewtopic.php?id=91',{credentials:'same-origin',signal:AbortSignal.timeout(12000)});
        if(!response.ok)throw Error('HTTP '+response.status);
        const charset=response.headers.get('content-type')?.match(/charset=([^;\s]+)/i)?.[1]||'windows-1251';
        const doc=new DOMParser().parseFromString(new TextDecoder(charset).decode(await response.arrayBuffer()),'text/html');
        const xp=doc.querySelector('#p2815 .post-content'),cash=doc.querySelector('#p3854 .post-content');
        if(!xp||!cash)throw Error('Не найдены сообщения правил');
        const rules=M.parseRules(xp.textContent,cash.textContent);
        saved.settings=M.validateSettings({...saved.settings,rules,rulesCheckedAt:new Date().toISOString()});
        latestRules={rules:saved.settings.rules,rulesCheckedAt:saved.settings.rulesCheckedAt};
        label.textContent='Стандартная награда сверена с правилами. Таблица сохраняется вместе с изменениями доски.';
        host.querySelector('form')?.dispatchEvent(new Event('mission-preview-update'));
      }catch{label.textContent='Используется последняя сохранённая таблица наград. Правила сейчас недоступны для сверки.';}
    }
    async function persist(records,{settings=saved.settings,keepDraft=false}={}) {
      settings=M.validateSettings({...settings,...(latestRules||{})});
      if(!pending)pending={records,settings,expectedRevision:saved.revision,requestId:crypto.randomUUID(),actor:String(window.UserID||window.uid||'admin')};
      const token=await adminKey();
      const result=await request({method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(pending)});
      saved={...result.saved,settings:M.validateSettings({...result.saved.settings,...(latestRules||{})})};remember({saved});pending=null;if(!keepDraft)dirty=false;list();notice.textContent='Сохранено на сервере. Версия '+saved.revision;
    }
    function open(record) {
      editing=structuredClone(record);dirty=false;pending=null;
      host.innerHTML='<form class="mission-form"><div class="mission-board-control"><label>Деревня / организация</label><input type="hidden" name="board" value="'+esc(record.board)+'"><details class="mission-board-picker"><summary data-board-label>'+esc(record.board||'Выберите деревню или организацию')+'</summary><input type="search" data-board-search placeholder="Найти в списке…" aria-label="Поиск деревни или организации"><div data-board-options></div></details><button type="button" data-org-show>Добавить организацию</button><div data-org-create hidden><label>Название организации<input data-org-name maxlength="80"></label><button type="button" data-org-add>Добавить в список</button><p data-org-status role="status"></p></div></div><div class="mission-form-grid"><label>Ранг<select name="rank">'+options(Object.fromEntries(M.ranks.map(rank=>[rank,rank])),record.rank)+'</select></label><label>Статус<select name="status">'+options(M.statuses,record.status)+'</select></label></div><label>Название<input name="name" value="'+esc(record.name)+'" required maxlength="160"></label><label>Описание<textarea name="description" rows="6" required maxlength="6000">'+esc(record.description)+'</textarea></label>'+rewardForm(record.reward,record.rank,saved.settings.rules)+'<label>Участники<textarea name="participants" rows="2" maxlength="1000" placeholder="Имена участников">'+esc(record.participants)+'</textarea><small>Обязательно для миссии в процессе или выполненной.</small></label><label>Эпизод / новость — необязательно<input name="episode" type="url" value="'+esc(record.episode)+'" maxlength="1000" placeholder="https://…"></label><div class="mission-toolbar"><button type="submit">Сохранить на сервер</button><button type="button" data-mission-close>Закрыть</button>'+(saved.records.some(item=>item.id===record.id)?'<button type="button" data-mission-delete>Удалить миссию</button>':'')+'</div><p data-mission-save-status role="status"></p></form>';
      const form=host.querySelector('form'),status=form.querySelector('[data-mission-save-status]');
      form.dataset.xpManual=String(record.reward?.xpMin!=null);
      if(record.reward?.xpMin!=null){form.elements['reward-xp-min'].value=record.reward.xpMin;form.elements['reward-xp-max'].value=record.reward.xpMax;}
      const controls=disabled=>form.querySelectorAll('button,input,select,textarea').forEach(field=>field.disabled=disabled);
      function boardChoices() {
        const query=form.querySelector('[data-board-search]').value.toLocaleLowerCase('ru');
        const names=[...saved.settings.organizations,...M.villages];
        form.querySelector('[data-board-options]').innerHTML=names.filter(name=>name.toLocaleLowerCase('ru').includes(query)).map(name=>'<button type="button" data-board-value="'+esc(name)+'" aria-pressed="'+(name===form.elements.board.value)+'">'+esc(name)+'</button>').join('')||'<p>Не найдено. Можно добавить организацию.</p>';
      }
      boardChoices();
      function update() {
        if(form.dataset.xpManual!=='true'){const rule=saved.settings.rules[form.elements.rank.value];form.elements['reward-xp-min'].value=rule?.xpMin??'';form.elements['reward-xp-max'].value=rule?.xpMax??'';}
        form.elements.participants.required=form.elements.status.value!=='open';
        const mode=form.elements['reward-mode'].value;
        form.querySelector('[data-reward-custom]').hidden=mode!=='custom';
        form.querySelector('[data-reward-text]').hidden=mode!=='text';
        for(const row of form.querySelectorAll('[data-reward-row]')) {
          row.querySelector('[data-range-max]').hidden=row.querySelector('[data-reward-field=type]').value!=='range';
          row.querySelector('[data-share-option]').hidden=row.querySelector('[data-reward-field=recipient]').value!=='organization';
        }
        try{form.querySelector('[data-reward-preview]').innerHTML=rewardHTML({rank:form.elements.rank.value,reward:readReward(form)},saved.settings.rules);}
        catch(error){form.querySelector('[data-reward-preview]').textContent=error.message;}
      }
      update();
      form.addEventListener('mission-preview-update',update);
      form.addEventListener('input',event=>{if(event.target.matches('[data-board-search]')){boardChoices();return;}if(event.target.matches('[data-org-name]'))return;if(event.target.matches('[name="reward-xp-min"],[name="reward-xp-max"]'))form.dataset.xpManual='true';dirty=true;pending=null;update();});
      form.addEventListener('change',()=>{dirty=true;pending=null;update();});
      form.addEventListener('click',event=>{
        const board=event.target.closest('[data-board-value]');
        if(board){form.elements.board.value=board.dataset.boardValue;form.querySelector('[data-board-label]').textContent=board.dataset.boardValue;form.querySelector('.mission-board-picker').open=false;dirty=true;pending=null;boardChoices();}
        const remove=event.target.closest('[data-reward-remove]');
        if(remove){const reward=readReward(form);reward.parts.splice(Number(remove.dataset.rewardRemove),1);form.querySelector('[data-reward-parts]').innerHTML=reward.parts.map(partHTML).join('');dirty=true;pending=null;update();}
      });
      form.querySelector('[data-xp-default]').addEventListener('click',()=>{form.dataset.xpManual='false';dirty=true;pending=null;update();});
      form.querySelector('[data-reward-add]').addEventListener('click',()=>{const reward=readReward(form);if(reward.parts.length>=20)return;reward.parts.push(newPart());form.querySelector('[data-reward-parts]').innerHTML=reward.parts.map(partHTML).join('');dirty=true;pending=null;update();});
      form.querySelector('[data-org-show]').addEventListener('click',()=>{form.querySelector('[data-org-create]').hidden=false;form.querySelector('[data-org-name]').focus();});
      form.querySelector('[data-org-add]').addEventListener('click',async()=>{
        if(busy)return;const name=form.querySelector('[data-org-name]').value.trim(),label=form.querySelector('[data-org-status]');
        try {
          const settings=M.validateSettings({...saved.settings,organizations:[...saved.settings.organizations,name]});
          busy=true;controls(true);pending=null;await persist(saved.records,{settings,keepDraft:true});
          form.elements.board.value=name;form.querySelector('[data-board-label]').textContent=name;form.querySelector('[data-org-create]').hidden=true;dirty=true;boardChoices();
        }catch(error){label.textContent=error.message;}finally{busy=false;controls(false);update();}
      });
      form.querySelector('[data-mission-close]').addEventListener('click',()=>{if(!busy&&canLeave()){host.replaceChildren();editing=null;dirty=false;pending=null;}});
      form.addEventListener('submit',async event=>{
        event.preventDefault();if(busy)return;
        try {
          busy=true;controls(true);status.textContent='Сохранение…';
          if(form.elements['reward-mode'].value==='standard'&&rulesPromise)await rulesPromise;
          controls(false);
          const fields=Object.fromEntries(new FormData(form));
          const next=M.validateRecord({...editing,...fields,reward:readReward(form)});
          controls(true);
          await persist(saved.records.filter(item=>item.id!==next.id).concat(next));open(next);host.querySelector('[data-mission-save-status]').textContent='Сохранено на сервере. Версия '+saved.revision;
        }catch(error){status.textContent=error.message;}finally{busy=false;controls(false);}
      });
      form.querySelector('[data-mission-delete]')?.addEventListener('click',async()=>{
        if(busy||!window.confirm('Удалить миссию «'+editing.name+'»?'))return;
        try{busy=true;if(pending?.records.some(item=>item.id===editing.id))pending=null;controls(true);await persist(saved.records.filter(item=>item.id!==editing.id));host.replaceChildren();editing=null;}
        catch(error){status.textContent=error.message;}finally{busy=false;controls(false);}
      });
    }
    async function refresh() {
      if(busy||!canLeave())return;busy=true;notice.textContent='Загрузка…';
      try{const data=await load();saved={...data.saved,settings:M.validateSettings(data.saved.settings||{})};list();host.replaceChildren();dirty=false;editing=null;pending=null;root.querySelector('[data-mission-new]').disabled=false;notice.textContent='Версия '+saved.revision+' · миссий '+saved.records.length;rulesPromise=ruleTable();}
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
