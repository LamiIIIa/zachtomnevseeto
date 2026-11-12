(function(){function createBingoModel() {
  const ranks = {D:20000,C:50000,B:200000,A:1000000,S:5000000};
  const books = {konoha:'Коноха',kiri:'Кири',kumo:'Кумо',iwa:'Ива',suna:'Суна',oto:'Ото',ame:'Аме',taki:'Таки',kusa:'Куса',yuki:'Юки',market:'Чёрный рынок'};
  const affiliations = {...books,akatsuki:'Акацуки',free:'Вольные шиноби'};
  delete affiliations.market;
  const factors = {
    strength:{label:'Боевая сила',options:[[0.8,'Слабый'],[1,'Обычный'],[1.3,'Сильный'],[1.6,'Очень сильный'],[2,'Элита ранга']]},
    reputation:{label:'Репутация',options:[[1,'Неизвестный'],[1.2,'Известен в одной стране'],[1.5,'Широко известный'],[2,'Знаменитый боец']]},
    danger:{label:'Опасность способностей',options:[[1,'Без особых факторов'],[1.2,'Опасные техники'],[1.5,'Редкие техники / кеккей генкай'],[2,'Исключительно смертоносные способности']]},
    value:{label:'Стратегическая ценность',options:[[1,'Нет особой ценности'],[1.2,'Служащий / носитель информации'],[1.5,'Элита / важный офицер'],[2,'Ключевая фигура / глава клана']]},
    wanted:{label:'Статус розыска',options:[[1,'Обычный противник'],[1.3,'Нукенин / дезертир'],[1.6,'Опасный преступник'],[2,'Международный розыск']]},
    capture:{label:'Сложность поимки',options:[[1,'Легко отследить'],[1.2,'Скрывается / мобильный'],[1.5,'Очень трудно выследить'],[2,'Почти неуловим']]}
  };
  function fail(message) { throw Object.assign(new Error(message),{status:400}); }
  function text(value,max,label,required=false) {
    if (typeof value!=='string' || value.length>max || required&&!value.trim()) fail('Проверьте поле «'+label+'»');
    return value.trim();
  }
  function dateParts(value) {
    if (typeof value!=='string') return null;
    const text=value.trim();
    let match=text.match(/^(\d{1,2})[./](\d{1,2})[./](\d{1,6})$/);
    let parts=match?{day:Number(match[1]),month:Number(match[2]),year:Number(match[3])}:null;
    match=text.match(/^(\d{1,6})-(\d{2})-(\d{2})$/);
    if (match) parts={year:Number(match[1]),month:Number(match[2]),day:Number(match[3])};
    if (/^\d{1,6}$/.test(text)) parts={year:Number(text),month:1,day:1,yearOnly:true};
    return parts&&parts.day>=1&&parts.day<=31&&parts.month>=1&&parts.month<=12?parts:null;
  }
  function date(value) {
    if (!value) return '';
    const parts=dateParts(value);
    if (!parts) fail('Введите игровую дату ДД.ММ.ГОД или число года');
    return parts.yearOnly?String(parts.year):String(parts.day).padStart(2,'0')+'.'+String(parts.month).padStart(2,'0')+'.'+parts.year;
  }
  function episode(value) {
    if (!value) return '';
    let url;try {url=new URL(value);} catch {fail('Укажите ссылку на эпизод');}
    if (url.protocol!=='https:'||url.username||url.password||url.hostname!=='akatsukigood.forum.cool'||url.pathname!=='/viewtopic.php'||!/^\d+$/.test(url.searchParams.get('id')||url.searchParams.get('pid')||'')) fail('Укажите ссылку на тему эпизода на форуме');
    return url.href;
  }
  function years(value) {
    if (!Number.isInteger(value)||value<0||value>1000) fail('Срок розыска должен быть целым числом от 0 до 1000');
    return value;
  }
  function elapsed(record,listing) {
    const since=record.timeMode==='shared'?record.wantedSince:listing.wantedSince;
    const manual=record.timeMode==='shared'?record.wantedYears:listing.wantedYears;
    if (!since) return manual;
    const end=listing.status==='inactive'&&listing.removedOn?listing.removedOn:record.status==='dead'?record.death.date:record.status==='captured'?record.capture.date:record.currentDate;
    const start=dateParts(since),finish=dateParts(end);
    if (!start||!finish) return manual;
    return Math.max(0,finish.year-start.year-(finish.month<start.month||finish.month===start.month&&finish.day<start.day?1:0));
  }
  function calculation(record,listing) {
    const time=1+0.2*elapsed(record,listing);
    const baseCoefficient=Object.keys(factors).reduce((total,key)=>total+record.factors[key],0);
    const market=listing.book==='market'?2:1;
    const coefficient=(baseCoefficient+time)*market;
    return {base:ranks[record.rank],baseCoefficient,time,market,coefficient,amount:Math.round(ranks[record.rank]*coefficient)};
  }
  function price(record,listing) {return calculation(record,listing).amount;}
  function event(value,label) {
    if (!value||typeof value!=='object') fail('Проверьте событие '+label);
    const selected=value.affiliations??[value.affiliation||'free'];
    if (!Array.isArray(selected)||!selected.length||selected.length>Object.keys(affiliations).length||selected.some(id=>!affiliations[id])) fail('Выберите принадлежность');
    return {by:text(value.by||'',160,label),date:date(value.date||''),affiliations:[...new Set(selected)],episode:episode(value.episode||'')};
  }
  function validateRecord(input) {
    if (!input||typeof input!=='object'||Array.isArray(input)) fail('Неверная запись');
    if (!/^[a-zA-Z0-9-]{8,80}$/.test(input.id||'')) fail('Неверный ID записи');
    if (!ranks[input.rank]) fail('Неизвестный ранг');
    if (!affiliations[input.affiliation]) fail('Неизвестная принадлежность');
    if (!['active','dead','captured','inactive'].includes(input.status)) fail('Неизвестный статус');
    if (!['shared','perBook'].includes(input.timeMode)) fail('Неизвестная настройка срока');
    const normalized={id:input.id,name:text(input.name,160,'Имя и фамилия',true),description:text(input.description||'',2000,'Описание'),photo:text(input.photo||'',1000,'Фото'),rank:input.rank,affiliation:input.affiliation,status:input.status,timeMode:input.timeMode,wantedYears:years(input.wantedYears),wantedSince:date(input.wantedSince||''),currentDate:date(input.currentDate||''),factors:{},death:event(input.death,'Кем убит'),capture:event(input.capture,'Кем захвачен')};
    if (normalized.photo) {
      let url;try {url=new URL(normalized.photo);} catch {fail('Укажите HTTPS-ссылку на фото');}
      if (url.protocol!=='https:'||url.username||url.password) fail('Укажите HTTPS-ссылку на фото');
    }
    for (const key of Object.keys(factors)) {
      const value=input.factors?.[key];
      if (!factors[key].options.some(option=>option[0]===value)) fail('Неверный коэффициент '+key);
      normalized.factors[key]=value;
    }
    if (!Array.isArray(input.listings)||!input.listings.length||input.listings.length>Object.keys(books).length) fail('Выберите книги розыска');
    const seen=new Set();
    normalized.listings=input.listings.map(item=>{
      if (!books[item.book]||seen.has(item.book)) fail('Неизвестная или повторная книга');
      seen.add(item.book);
      if (!['active','inactive'].includes(item.status)) fail('Неизвестный статус в книге');
      if (!Array.isArray(item.sources)||!item.sources.length||item.sources.some(source=>!books[source]||source==='market')) fail('Укажите деревни, внесшие запись');
      return {book:item.book,status:normalized.status==='dead'?'inactive':item.status,sources:[...new Set(item.sources)],wantedYears:years(item.wantedYears),wantedSince:date(item.wantedSince||''),removedOn:date(normalized.status==='dead'?normalized.death.date:item.removedOn||'')};
    });
    if (normalized.status==='dead'&&(!normalized.death.by||!normalized.death.date)) fail('Укажите, кем и когда убит');
    if (normalized.status==='captured'&&(!normalized.capture.by||!normalized.capture.date)) fail('Укажите, кем и когда захвачен');
    return normalized;
  }
  function validateBoard(input) {
    if (!Array.isArray(input)||input.length>500) fail('Список превышает 500 записей');
    const records=input.map(validateRecord);
    if (new Set(records.map(record=>record.id)).size!==records.length) fail('Повторный ID записи');
    return records;
  }
  function emptyRecord() {
    return {id:crypto.randomUUID(),name:'',description:'',photo:'',rank:'D',affiliation:'free',status:'active',timeMode:'shared',wantedYears:0,wantedSince:'',currentDate:'',factors:Object.fromEntries(Object.keys(factors).map(key=>[key,1])),death:{by:'',date:'',affiliations:['free'],episode:''},capture:{by:'',date:'',affiliations:['free'],episode:''},listings:[]};
  }
  return {ranks,books,affiliations,factors,elapsed,calculation,price,date,validateRecord,validateBoard,emptyRecord};
}

window.AkatsukiBingoModel=createBingoModel();const style=document.createElement("style");style.textContent=".bingo.bingo.bingo {\r\n  --bingo-accent:var(--color-link,#8f3131);\r\n  --bingo-panel:var(--color-qv,#fbf8f8);\r\n  --bingo-bg:var(--color-forum,#f5f1f1);\r\n  --bingo-soft:var(--color-lnthoverbg,#e9e3e3);\r\n  --bingo-text:var(--color-txt1,#292627);\r\n  --bingo-muted:var(--color-underava,#746b69);\r\n  box-sizing:border-box;\r\n  width:100%;\r\n  min-width:0;\r\n  color:var(--bingo-text);\r\n  font:14px/1.5 var(--font-g,\"Nunito Sans\"),Arial,sans-serif;\r\n}\r\n.bingo.bingo.bingo * {box-sizing:border-box}\r\n.bingo.bingo.bingo [hidden] {display:none!important}\r\n.bingo.bingo.bingo .bingo-heading {padding:20px;border-bottom:2px solid var(--bingo-accent);margin-bottom:16px}\r\n.bingo.bingo.bingo .bingo-heading small {letter-spacing:2px;color:var(--bingo-muted)}\r\n.bingo.bingo.bingo h2,.bingo.bingo.bingo h3 {color:var(--bingo-accent);margin:0 0 10px;font-family:var(--font-1,\"Russo One\"),Arial,sans-serif}\r\n.bingo.bingo.bingo .bingo-heading h2 {margin:4px 0;font-size:28px}\r\n.bingo.bingo.bingo .bingo-filters {display:grid;grid-template-columns:minmax(160px,2fr) repeat(2,minmax(110px,1fr)) auto;gap:12px;align-items:end;margin:12px 0}\r\n.bingo.bingo.bingo label {display:grid;gap:6px;min-width:0;margin:0;text-align:left}\r\n.bingo.bingo.bingo input:not([type=checkbox]),.bingo.bingo.bingo select,.bingo.bingo.bingo textarea {width:100%;min-width:0;max-width:100%;padding:10px 12px;border:1px solid var(--bingo-soft);border-radius:7px;background:var(--bingo-panel);color:var(--bingo-text);font:inherit}\r\n.bingo.bingo.bingo button {min-height:40px;padding:9px 15px;border:1px solid var(--bingo-accent);border-radius:8px 18px 8px 8px;background:var(--bingo-panel);color:var(--bingo-accent);font:inherit;cursor:pointer}\r\n.bingo.bingo.bingo button:hover,.bingo.bingo.bingo button.bingo-primary {background:var(--bingo-accent);color:var(--color-txt3,#fff)}\r\n.bingo.bingo.bingo button:disabled {opacity:.6;cursor:wait}\r\n.bingo.bingo.bingo button:focus-visible,.bingo.bingo.bingo input:focus-visible,.bingo.bingo.bingo select:focus-visible {outline:2px solid var(--bingo-accent);outline-offset:2px}\r\n.bingo.bingo.bingo .bingo-grid {display:grid;gap:18px;grid-template-columns:repeat(auto-fit,minmax(min(100%,440px),1fr))}\r\n.bingo.bingo.bingo .bingo-card {display:grid;grid-template-columns:130px minmax(0,1fr);border:1px solid var(--bingo-soft);border-radius:12px 30px 12px 12px;background:var(--bingo-panel);overflow:hidden}\r\n.bingo.bingo.bingo .bingo-portrait {position:relative;background:var(--bingo-soft);min-height:200px}\r\n.bingo.bingo.bingo .bingo-portrait img {display:block;width:100%;height:100%;max-height:400px;object-fit:cover}\r\n.bingo.bingo.bingo .is-dead .bingo-portrait img {filter:grayscale(1);opacity:.65}\r\n.bingo.bingo.bingo .bingo-no-photo {display:block;padding:20px;color:var(--bingo-muted)}\r\n.bingo.bingo.bingo .bingo-rank {position:absolute;bottom:0;left:0;right:0;min-width:32px;padding:7px 9px;background:var(--bingo-accent);color:var(--color-txt3,#fff);border-radius:0;text-align:center;font-weight:700}\r\n.bingo.bingo.bingo .bingo-card-main {padding:16px;min-width:0}\r\n.bingo.bingo.bingo .bingo-card-heading {display:flex;flex-wrap:wrap;align-items:start;justify-content:space-between;gap:8px}\r\n.bingo.bingo.bingo .bingo-card h3 {font-size:19px;overflow-wrap:anywhere}\r\n.bingo.bingo.bingo .bingo-status {padding:3px 8px;background:var(--bingo-soft);border-radius:5px;font-size:12px}\r\n.bingo.bingo.bingo .bingo-description {white-space:pre-line;overflow-wrap:anywhere;margin:10px 0}\r\n.bingo.bingo.bingo .bingo-emblem {display:inline-flex;align-items:center;gap:6px;color:var(--bingo-accent);font-size:12px}\r\n.bingo.bingo.bingo .bingo-emblem svg {width:25px;height:25px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;flex:none}\r\n.bingo.bingo.bingo .bingo-event {display:grid;gap:5px;border-left:3px solid var(--bingo-accent);padding:8px 10px;background:var(--bingo-soft);margin:10px 0}\r\n.bingo.bingo.bingo .bingo-prices {display:grid;gap:6px}\r\n.bingo.bingo.bingo .bingo-price {display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 9px;border-top:1px solid var(--bingo-soft);padding:8px 0}\r\n.bingo.bingo.bingo .bingo-price strong,.bingo.bingo.bingo .bingo-price small {display:block}\r\n.bingo.bingo.bingo .bingo-price b {color:var(--bingo-accent);font-variant-numeric:tabular-nums}\r\n.bingo.bingo.bingo .bingo-price small {color:var(--bingo-muted);font-size:11px}\r\n.bingo.bingo.bingo .bingo-source {grid-column:1/-1}\r\n.bingo.bingo.bingo .is-inactive {opacity:.65}\r\n.bingo.bingo.bingo .is-inactive b {text-decoration:line-through}\r\n.bingo.bingo.bingo .bingo-toolbar {display:flex;flex-wrap:wrap;gap:9px;margin:10px 0}\r\n.bingo.bingo.bingo .bingo-admin-layout {display:grid;grid-template-columns:190px minmax(0,1fr);gap:18px}\r\n.bingo.bingo.bingo .bingo-record {display:block;width:100%;margin-bottom:8px;text-align:left}\r\n.bingo.bingo.bingo .bingo-record small {display:block}\r\n.bingo.bingo.bingo .bingo-admin-form {display:grid;gap:15px;min-width:0}\r\n.bingo.bingo.bingo .bingo-form-grid {display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}\r\n.bingo.bingo.bingo fieldset {display:block;margin:0;padding:15px;border:1px solid var(--bingo-soft);border-radius:10px;min-width:0;background:var(--bingo-bg)}\r\n.bingo.bingo.bingo legend {padding:0 7px;font-weight:700;color:var(--bingo-accent)}\r\n.bingo.bingo.bingo .bingo-checks {display:flex;flex-wrap:wrap;gap:8px 16px;margin:8px 0}\r\n.bingo.bingo.bingo label.bingo-check {display:flex;align-items:center;gap:7px;min-height:28px}\r\n.bingo.bingo.bingo input[type=checkbox] {appearance:auto;width:17px;height:17px;margin:0;accent-color:var(--bingo-accent);flex:none}\r\n.bingo.bingo.bingo .bingo-listing {padding:10px 0;border-top:1px solid var(--bingo-soft)}\r\n.bingo.bingo.bingo .bingo-listing [data-listing-fields] {display:grid;gap:10px;padding:10px 0}\r\n.bingo.bingo.bingo output {font-weight:700;color:var(--bingo-accent)}\r\n.bingo.bingo.bingo summary {cursor:pointer;color:var(--bingo-accent)}\r\n@media(max-width:700px) {\r\n  .bingo.bingo.bingo .bingo-filters {grid-template-columns:repeat(2,minmax(0,1fr))}\r\n  .bingo.bingo.bingo .bingo-filters>label:first-child {grid-column:1/-1}\r\n  .bingo.bingo.bingo .bingo-admin-layout {grid-template-columns:1fr}\r\n  .bingo.bingo.bingo .bingo-admin-layout>[data-bingo-records] {display:flex;gap:8px;overflow:auto}\r\n  .bingo.bingo.bingo .bingo-record {flex:0 0 160px}\r\n  .bingo.bingo.bingo .bingo-card {grid-template-columns:90px minmax(0,1fr)}\r\n  .bingo.bingo.bingo .bingo-card-main {padding:12px}\r\n  .bingo.bingo.bingo .bingo-price {grid-template-columns:1fr}\r\n  .bingo.bingo.bingo .bingo-form-grid {grid-template-columns:1fr}\r\n}\r\n.bingo.bingo.bingo .bingo-episode {display:inline-flex;align-items:center;justify-content:center;padding:7px 12px;margin-top:5px;border:1px solid var(--bingo-accent);border-radius:6px 14px 6px 6px;color:var(--bingo-accent);text-decoration:none}\r\n.bingo.bingo.bingo .bingo-episode:hover {background:var(--bingo-accent);color:var(--color-txt3,#fff)}\r\n\r\n.bingo.bingo.bingo .bingo-calculation {margin-top:14px;padding:12px;border-left:3px solid var(--bingo-accent);background:var(--bingo-panel);font-variant-numeric:tabular-nums;overflow-wrap:anywhere}\r\n.bingo.bingo.bingo .bingo-calculation p {margin:6px 0 12px}\r\n";document.head.appendChild(style);})();
(function () {
  'use strict';
  if (window.AkatsukiBingo) return;
  const M = window.AkatsukiBingoModel;
  const endpoint = 'https://akatski-forum-app.vercel.app/api/v1/bingo';
  const statusNames = {active:'В розыске',dead:'Мёртв',captured:'Захвачен',inactive:'Неактуально'};
  const money = value => new Intl.NumberFormat('ru-RU').format(value) + ' рё';
  const esc = value => String(value ?? '').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const admin = () => Number(window.GroupID || window.FORUM?.group_id) === 1;
  const paths = {
    konoha:'M19 7c-6-6-15 0-12 6s11 3 8-2c-2-3-6 0-3 2M7 14l-4 5 7-2',
    kiri:'M7 3C5 8 2 10 2 14a5 5 0 0 0 10 0c0-4-3-6-5-11M17 6c-2 4-4 6-4 9a4 4 0 0 0 8 0c0-3-2-5-4-9',
    kumo:'M6 18a5 5 0 0 1-1-10 6 6 0 0 1 12-1 5 5 0 0 1 1 11H6',
    iwa:'M2 19 8 5l5 9 4-7 5 12H2M6 19l4-7',
    suna:'M6 3h12l-1 5-5 4 5 4 1 5H6l1-5 5-4-5-4-1-5',
    oto:'M9 18V5l10-2v12M9 7l10-2M9 18c0 4-6 4-6 1s6-4 6-1M19 15c0 4-6 4-6 1s6-4 6-1',
    akatsuki:'M6 18a4 4 0 0 1-1-8 5 5 0 0 1 9-3 4 4 0 0 1 7 5c4 5-1 9-6 6H6M8 18l-2 4M13 18l-2 4',
    free:'M3 7h11c6 0 6-6 2-5M3 12h16c5 0 5 7 0 7M3 17h8c4 0 4 5 1 5'
  };
  function emblem(id) {
    return '<span class="bingo-emblem" title="'+esc(M.affiliations[id])+'"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+(paths[id]||'M3 20V8l9-6 9 6v12H3M7 20v-9h10v9')+'"/></svg><span>'+esc(M.affiliations[id]||'')+'</span></span>';
  }
  async function request(options={}) {
    const response=await fetch(endpoint,{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(20000),...options});
    const result=await response.json();
    if (!response.ok) throw Error(result.error||'Сервер временно недоступен');
    return result;
  }
  let sharedRequest;
  function load() {
    if (!sharedRequest) sharedRequest=request().finally(()=>{sharedRequest=null;});
    return sharedRequest;
  }
  function selectOptions(values,value,empty='') {
    return (empty?'<option value="">'+esc(empty)+'</option>':'')+
      Object.entries(values).map(([key,label])=>'<option value="'+esc(key)+'"'+(String(value)===key?' selected':'')+'>'+esc(label)+'</option>').join('');
  }
  function priceLines(record,asOf) {
    return record.listings.map(listing=>{
      const result=M.calculation(record,listing);
      const coefficient=new Intl.NumberFormat('ru-RU',{maximumFractionDigits:8}).format(result.coefficient);
      const removed=listing.status==='inactive'||record.status==='inactive'||record.status==='dead';
      return '<div class="bingo-price'+(removed?' is-inactive':'')+'"><div><strong>'+esc(M.books[listing.book])+'</strong><small>'+esc(record.status==='dead'?'Снят с розыска (мёртв)':removed?'Снят с розыска':'В розыске')+' · '+M.elapsed(record,listing,asOf)+' лет</small><small>Итоговый коэффициент ×'+coefficient+'</small></div><b>'+money(M.price(record,listing,asOf))+'</b><small class="bingo-source">Внесли '+listing.sources.map(source=>esc(M.books[source])).join(', ')+(listing.removedOn?' · снят '+esc(listing.removedOn):'')+'</small></div>';
    }).join('');
  }
  function card(record,asOf) {
    const event=record.status==='dead'?record.death:record.status==='captured'?record.capture:null;
    return '<article class="bingo-card'+(record.status==='dead'?' is-dead':'')+'"><div class="bingo-portrait">'+
      (record.photo?'<img src="'+esc(record.photo)+'" alt="'+esc(record.name)+'" loading="lazy" decoding="async" referrerpolicy="no-referrer">':'<span class="bingo-no-photo">Фото не указано</span>')+
      '<span class="bingo-rank">Ранг '+record.rank+'</span></div><div class="bingo-card-main"><div class="bingo-card-heading"><h3>'+esc(record.name)+'</h3><span class="bingo-status">'+statusNames[record.status]+'</span></div>'+emblem(record.affiliation)+
      '<p class="bingo-description">'+esc(record.description)+'</p>'+
      (event?'<div class="bingo-event"><strong>'+(record.status==='dead'?'Убит':'Захвачен')+' '+esc(event.date)+'</strong><span>'+esc(event.by)+'</span>'+(event.affiliations||[event.affiliation||'free']).map(emblem).join(' ')+(event.episode?'<a class="bingo-episode" href="'+esc(event.episode)+'">Где почитать ↗</a>':'')+'</div>':'')+
      '<div class="bingo-prices">'+priceLines(record,asOf)+'</div></div></article>';
  }
  function publicWidget(root) {
    root.classList.add('bingo');
    root.innerHTML='<header class="bingo-heading"><small>ШИНОБИ · ДОСЬЕ</small><h2>Книга Бинго</h2></header><div class="bingo-filters"><label>Поиск<input type="search" data-bingo-search placeholder="Имя и описание"></label><label>Книга<select data-bingo-book>'+selectOptions(M.books,'','Все книги')+'</select></label><label>Статус<select data-bingo-status>'+selectOptions(statusNames,'','Все статусы')+'</select></label><button type="button" data-bingo-refresh>Обновить</button></div><p data-bingo-notice role="status">Загрузка Книги Бинго…</p><div class="bingo-grid"></div>';
    let records=[],asOf;
    const notice=root.querySelector('[data-bingo-notice]');
    function render() {
      const query=root.querySelector('[data-bingo-search]').value.toLocaleLowerCase('ru').replace(/ё/g,'е').trim();
      const book=root.querySelector('[data-bingo-book]').value;
      const status=root.querySelector('[data-bingo-status]').value;
      const visible=records.filter(record=>{
        const listing=record.listings.find(item=>item.book===book);
        const removed=record.status==='dead'||record.status==='inactive'||(book?listing?.status==='inactive':record.listings.some(item=>item.status==='inactive'));
        const matchesStatus=!status||(status==='inactive'?removed:status==='active'?record.status==='active'&&(!book||listing?.status==='active'):record.status===status);
        return (!query||(record.name+' '+record.description).toLocaleLowerCase('ru').replace(/ё/g,'е').includes(query))&&(!book||listing)&&matchesStatus;
      });
      root.querySelector('.bingo-grid').innerHTML=visible.map(record=>card(book?{...record,listings:record.listings.filter(item=>item.book===book)}:record,asOf)).join('');
      notice.textContent=visible.length?'Найдено записей — '+visible.length:records.length?'По этим фильтрам записей нет.':'В Книге Бинго пока нет записей.';
    }
    async function refresh() {
      notice.textContent='Обновление…';
      try {const data=await load();records=data.saved.records;asOf=data.asOf;render();}
      catch(error) {notice.textContent=error.message+'. Нажмите «Обновить».';}
    }
    root.querySelectorAll('input,select').forEach(input=>input.addEventListener(input.tagName==='INPUT'?'input':'change',render));
    root.querySelector('[data-bingo-refresh]').addEventListener('click',refresh);
    refresh();
  }
  async function adminKey() {
    if (!admin()) throw Error('Сохранение доступно администратору');
    if (window.BINGO_BOOK_CONFIG?.adminToken) return window.BINGO_BOOK_CONFIG.adminToken;
    if (window.LotteryAdminKeys) {
      const key=await window.LotteryAdminKeys.load();
      if (key) return key;
    }
    const user=Number(window.UserID||window.uid||0);
    if (user<=1||!window.ForumAPITicket) throw Error('Войдите в форум администратором');
    const body=new URLSearchParams({method:'storage.get',user_id:String(user),key:'akatsuki_lottery_admin_key_v1',token:window.ForumAPITicket,format:'json',charset:'utf-8'});
    const response=await fetch('/api.php',{method:'POST',body,credentials:'same-origin',signal:AbortSignal.timeout(12000)});
    const data=await response.json();
    const key=data.response?.storage?.data?.akatsuki_lottery_admin_key_v1;
    if (typeof key!=='string'||key.length<32) throw Error('Для профиля не подключён серверный ключ администратора. Подключите ключ существующего серверного хранилища.');
    return key;
  }
  function field(name,label,value,type='text',extra='') {
    if (type==='date') {type='text';extra+=' inputmode="numeric" placeholder="ДД.ММ.ГОД или год"';value=value?M.date(value):'';}
    return '<label>'+label+'<input name="'+name+'" type="'+type+'" value="'+esc(value)+'" '+extra+'></label>';
  }
  function checks(name,values,selected=[]) {
    return Object.entries(values).map(([key,label])=>'<label class="bingo-check"><input type="checkbox" name="'+name+'" value="'+key+'"'+(selected.includes(key)?' checked':'')+'>'+esc(label)+'</label>').join('');
  }
  function editor(root) {
    if (root.dataset.bingoEditorReady) return;
    root.dataset.bingoEditorReady='true';
    root.classList.add('bingo');
    let saved={revision:0,records:[]},asOf,editing=null,pendingSave=null,busy=false,dirty=false,loaded=false;
    root.innerHTML='<h2>Книга Бинго</h2><p>Тег для сообщения — <code>[bingo-book]</code>. Записи сохраняются в общем серверном реестре.</p><div class="bingo-toolbar"><button type="button" data-bingo-new>Добавить запись</button><button type="button" data-bingo-reload>Обновить список</button></div><p data-bingo-editor-status role="status">Загрузка…</p><div class="bingo-admin-layout"><div data-bingo-records></div><div data-bingo-form></div></div>';
    const notice=root.querySelector('[data-bingo-editor-status]');
    const host=root.querySelector('[data-bingo-form]');
    function list() {
      root.querySelector('[data-bingo-records]').innerHTML=saved.records.map(record=>'<button type="button" class="bingo-record" data-bingo-record="'+record.id+'"><strong>'+esc(record.name)+'</strong><small>'+record.rank+' · '+statusNames[record.status]+'</small></button>').join('')||'<p>Пока нет записей.</p>';
    }
    function clearForNavigation() {
      return !dirty||window.confirm('Отменить несохранённые изменения этой записи?');
    }
    function open(record) {
      editing=structuredClone(record);dirty=false;pendingSave=null;
      const sources=[...new Set(record.listings.flatMap(listing=>listing.sources))];
      host.innerHTML='<form class="bingo-admin-form"><div class="bingo-form-grid">'+field('name','Имя и фамилия',record.name,'text','required maxlength="160"')+
        '<label>Ранг<select name="rank">'+selectOptions(Object.fromEntries(Object.entries(M.ranks).map(([rank,base])=>[rank,rank+' · '+money(base)])),record.rank)+'</select></label>'+
        '<label>Принадлежность персонажа<select name="affiliation">'+selectOptions(M.affiliations,record.affiliation)+'</select></label>'+
        '<label>Статус цели<select name="status">'+selectOptions(statusNames,record.status)+'</select></label>'+
        field('photo','Фото — HTTPS-ссылка',record.photo,'url','maxlength="1000"')+
        '</div><label>Краткое описание<textarea name="description" maxlength="2000" rows="3">'+esc(record.description)+'</textarea></label>'+
        '<fieldset><legend>База и коэффициенты</legend><div class="bingo-form-grid">'+Object.entries(M.factors).map(([key,factor])=>'<label>'+factor.label+'<select name="factor-'+key+'">'+factor.options.map(([value,label])=>'<option value="'+value+'"'+(record.factors[key]===value?' selected':'')+'>'+label+' · +'+value+'</option>').join('')+'</select></label>').join('')+'</div><div class="bingo-calculation" data-bingo-calculation aria-live="polite"></div></fieldset>'+ 
        '<fieldset><legend>Срок розыска</legend><label>Учёт срока<select name="timeMode"><option value="shared"'+(record.timeMode==='shared'?' selected':'')+'>Общий для всех книг</option><option value="perBook"'+(record.timeMode==='perBook'?' selected':'')+'>Отдельно для каждой книги</option></select></label><div class="bingo-form-grid" data-shared-time>'+field('wantedYears','Полных лет в розыске',record.wantedYears,'number','min="0" max="1000" step="1"')+field('wantedSince','Либо дата начала розыска',record.wantedSince,'date')+'</div>'+field('currentDate','Текущая игровая дата',record.currentDate||'','date')+'<p>Для расчёта по датам укажите текущую игровую дату. Иначе используется введённое число лет. Каждый полный год добавляет 0,2 к множителю.</p></fieldset>'+
        '<fieldset><legend>Деревни, внесшие запись</legend><div class="bingo-checks">'+checks('sources',Object.fromEntries(Object.entries(M.books).filter(([key])=>key!=='market')),sources)+'</div><p>Общие источники используются для новых книг. В каждой книге можно указать собственные.</p></fieldset>'+
        '<fieldset><legend>Книги Бинго</legend><div class="bingo-toolbar"><button type="button" data-all-books>Все деревенские книги</button></div>'+Object.entries(M.books).map(([book,label])=>{
          const item=record.listings.find(listing=>listing.book===book)||{book,status:'active',sources:[],wantedYears:0,wantedSince:'',removedOn:''};
          return '<section class="bingo-listing" data-book="'+book+'"><label class="bingo-check"><input type="checkbox" name="book-'+book+'"'+(record.listings.some(listing=>listing.book===book)?' checked':'')+'><strong>'+label+'</strong></label><div data-listing-fields><div class="bingo-form-grid"><label>Статус в книге<select name="book-status-'+book+'"><option value="active"'+(item.status==='active'?' selected':'')+'>Актуально</option><option value="inactive"'+(item.status==='inactive'?' selected':'')+'>Снят с розыска</option></select></label>'+field('removed-'+book,'Дата снятия',item.removedOn,'date')+'</div><div class="bingo-form-grid" data-book-time>'+field('years-'+book,'Полных лет в этой книге',item.wantedYears,'number','min="0" max="1000" step="1"')+field('since-'+book,'Либо дата начала в этой книге',item.wantedSince,'date')+'</div><details><summary>Собственные источники этой книги</summary><div class="bingo-checks">'+checks('source-'+book,Object.fromEntries(Object.entries(M.books).filter(([key])=>key!=='market')),item.sources)+'</div></details><output data-book-price></output></div></section>';
        }).join('')+'</fieldset>'+
        ['death','capture'].map((kind)=>'<fieldset data-event="'+kind+'"><legend>'+(kind==='death'?'Гибель':'Захват')+'</legend><div class="bingo-form-grid">'+field(kind+'-by',kind==='death'?'Кем убит':'Кем захвачен',record[kind].by,'text','maxlength="160"')+field(kind+'-date','Игровая дата',record[kind].date,'date')+field(kind+'-episode','Ссылка на эпизод',record[kind].episode||'','url')+'</div><p>Принадлежность '+(kind==='death'?'убийц':'захвативших')+'</p><div class="bingo-checks">'+checks(kind+'-affiliations',M.affiliations,record[kind].affiliations||[record[kind].affiliation||'free'])+'</div></fieldset>').join('')+
        '<div class="bingo-toolbar"><button class="bingo-primary" type="submit">Сохранить на сервер</button><button type="button" data-bingo-cancel>Закрыть</button></div><p data-bingo-save-status role="status"></p></form>';
      const form=host.querySelector('form');
      function draft() {
        const data=new FormData(form);
        const string=name=>String(data.get(name)||'');
        const next={...editing,name:string('name'),description:string('description'),photo:string('photo'),rank:string('rank'),affiliation:string('affiliation'),status:string('status'),timeMode:string('timeMode'),wantedYears:Number(data.get('wantedYears')),wantedSince:string('wantedSince'),currentDate:string('currentDate'),factors:{},listings:[]};
        for (const key of Object.keys(M.factors)) next.factors[key]=Number(data.get('factor-'+key));
        for (const kind of ['death','capture']) next[kind]={by:string(kind+'-by'),date:string(kind+'-date'),affiliations:data.getAll(kind+'-affiliations'),episode:string(kind+'-episode')};
        for (const book of Object.keys(M.books)) if (data.has('book-'+book)) {
          const specific=data.getAll('source-'+book);
          next.listings.push({book,status:next.status==='dead'?'inactive':string('book-status-'+book),sources:specific.length?specific:data.getAll('sources'),wantedYears:Number(data.get('years-'+book)),wantedSince:string('since-'+book),removedOn:string('removed-'+book)});
        }
        return next;
      }
      function update() {
        const record=draft();
        form.querySelector('[data-shared-time]').hidden=record.timeMode!=='shared';
        const coefficientFormat=value=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:8}).format(value);
        const previews=record.timeMode==='shared'?[
          {book:'konoha',status:'active',wantedYears:0,wantedSince:'',removedOn:''},
          {book:'market',status:'active',wantedYears:0,wantedSince:'',removedOn:''}
        ]:record.listings;
        form.querySelector('[data-bingo-calculation]').innerHTML=previews.map(listing=>{
          const result=M.calculation(record,listing);
          const label=record.timeMode==='shared'?(listing.book==='market'?'Чёрный рынок':'Книга Бинго'):M.books[listing.book];
          return '<p><strong>'+label+' · ×'+coefficientFormat(result.coefficient)+'</strong><br>('+Object.values(record.factors).map(coefficientFormat).join(' + ')+' + 1 + '+M.elapsed(record,listing)+' × 0,2)'+(result.market===2?' × 2':'')+' = '+coefficientFormat(result.coefficient)+'<br>'+money(result.base)+' × '+coefficientFormat(result.coefficient)+' = <b>'+money(result.amount)+'</b></p>';
        }).join('')||'Выберите книги ниже, чтобы увидеть итог по каждой из них.';
        for (const section of form.querySelectorAll('[data-book]')) {
          const listing=record.listings.find(item=>item.book===section.dataset.book);
          const status=section.querySelector('[name="book-status-'+section.dataset.book+'"]');
          status.disabled=record.status==='dead';
          if (listing&&record.status==='dead') {
            status.value='inactive';
            listing.status='inactive';
            listing.removedOn=record.death.date;
            section.querySelector('[name="removed-'+section.dataset.book+'"]').value=record.death.date;
          }
          section.querySelector('[data-listing-fields]').hidden=!listing;
          section.querySelector('[data-book-time]').hidden=record.timeMode!=='perBook';
          const result=listing?M.calculation(record,listing):null;
          const number=value=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:8}).format(value);
          section.querySelector('[data-book-price]').textContent=result?
            'База '+money(result.base)+' × (коэффициенты '+number(result.baseCoefficient)+' + срок '+number(result.time)+')'+(result.market===2?' × чёрный рынок 2':'')+
            ' = '+money(result.amount)+' · Итоговый коэффициент ×'+number(result.coefficient):'';
        }
        form.querySelector('[data-event="death"]').hidden=record.status!=='dead';
        form.querySelector('[data-event="capture"]').hidden=record.status!=='captured';
      }
      form.addEventListener('input',()=>{dirty=true;pendingSave=null;update();});
      form.addEventListener('change',()=>{dirty=true;pendingSave=null;update();});
      form.querySelector('[data-all-books]').addEventListener('click',()=>{for(const book of Object.keys(M.books).filter(book=>book!=='market')) form.elements['book-'+book].checked=true;dirty=true;pendingSave=null;update();});
      form.querySelector('[data-bingo-cancel]').addEventListener('click',()=>{if(clearForNavigation()){host.replaceChildren();editing=null;dirty=false;}});
      form.addEventListener('submit',async event=>{
        event.preventDefault();
        if (busy) return;
        const status=form.querySelector('[data-bingo-save-status]');
        try {
          const next=M.validateRecord(draft());
          const records=saved.records.filter(record=>record.id!==next.id).concat(next).sort((a,b)=>a.name.localeCompare(b.name,'ru'));
          if (!pendingSave) pendingSave={expectedRevision:saved.revision,requestId:crypto.randomUUID(),records,actor:String(window.UserID||window.uid||'admin')};
          busy=true;form.querySelector('[type="submit"]').disabled=true;status.textContent='Сохранение…';
          const token=await adminKey();
          const result=await request({method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(pendingSave)});
          saved=result.saved;dirty=false;pendingSave=null;list();
          status.textContent='Сохранено на сервере. Версия '+saved.revision;
          notice.textContent='Книга обновлена. Записей — '+saved.records.length;
        } catch(error) {status.textContent=error.message;}
        finally {busy=false;form.querySelector('[type="submit"]').disabled=false;}
      });
      update();
    }
    async function refresh() {
      if (busy||!clearForNavigation()) return;
      notice.textContent='Обновление…';
      try {const data=await load();saved=data.saved;asOf=data.asOf;loaded=true;host.replaceChildren();editing=null;dirty=false;pendingSave=null;list();notice.textContent='Версия '+saved.revision+' · записей '+saved.records.length;}
      catch(error) {notice.textContent=error.message;}
    }
    root.querySelector('[data-bingo-new]').addEventListener('click',()=>{if(!busy&&loaded&&clearForNavigation())open(M.emptyRecord());});
    root.querySelector('[data-bingo-reload]').addEventListener('click',refresh);
    root.querySelector('[data-bingo-records]').addEventListener('click',event=>{
      const button=event.target.closest('[data-bingo-record]');
      if (!button||busy||!clearForNavigation()) return;
      const record=saved.records.find(record=>record.id===button.dataset.bingoRecord);
      if (record) open(record);
    });
    refresh();
  }
  function attachManager(root) {
    if (!admin()||root.dataset.bingoTabReady) return;
    const tabs=root.querySelector('[role="tablist"]');
    if (!tabs) return;
    root.dataset.bingoTabReady='true';
    const button=document.createElement('button');
    button.type='button';button.role='tab';button.textContent='Книга Бинго';button.setAttribute('aria-selected','false');button.dataset.bingoTab='';
    const view=document.createElement('div');
    view.hidden=true;view.dataset.bingoAdmin='';
    tabs.appendChild(button);root.appendChild(view);
    root.addEventListener('click',event=>{
      const selected=event.target.closest('[data-bingo-tab]');
      if (selected) {
        event.preventDefault();event.stopImmediatePropagation();
        root.querySelectorAll('[role="tablist"]>[role="tab"]').forEach(tab=>tab.setAttribute('aria-selected',String(tab===button)));
        ['akcm-registry-view','akcm-bulk-view','akcm-events-view','akcm-postcount-view'].forEach(id=>{const node=root.querySelector('#'+id);if(node)node.hidden=true;});
        view.hidden=false;editor(view);
      } else if (event.target.closest('[data-action$="-tab"]')) {
        view.hidden=true;button.setAttribute('aria-selected','false');
      }
    },true);
  }
  function scan(scope=document) {
    scope.querySelectorAll?.('.akcm').forEach(attachManager);
    if (scope.matches?.('.akcm')) attachManager(scope);
    const contents=scope.matches?.('.post-content')?[scope]:Array.from(scope.querySelectorAll?.('.post-content')||[]);
    for (const content of contents) {
      const walker=document.createTreeWalker(content,NodeFilter.SHOW_TEXT);
      const nodes=[];
      while(walker.nextNode()) {
        const node=walker.currentNode;
        if (node.parentElement?.closest('.bingo,pre,code,textarea,script,style')) continue;
        if (/\[bingo-book\]/i.test(node.data)) nodes.push(node);
      }
      for (const node of nodes) {
        const fragment=document.createDocumentFragment();
        let offset=0;
        for (const match of node.data.matchAll(/\[bingo-book\]/gi)) {
          fragment.append(document.createTextNode(node.data.slice(offset,match.index)));
          const widget=document.createElement('section');
          fragment.append(widget);publicWidget(widget);
          offset=match.index+match[0].length;
        }
        fragment.append(document.createTextNode(node.data.slice(offset)));
        node.replaceWith(fragment);
      }
    }
  }
  window.AkatsukiBingo={scan,mount:publicWidget,mountAdmin:editor};
  function boot() {
    scan();
    let scheduled=false;
    const observer=new MutationObserver(mutations=>{
      if (scheduled||!mutations.some(mutation=>Array.from(mutation.addedNodes).some(node=>node.nodeType===1&&!node.closest?.('.bingo')))) return;
      scheduled=true;
      requestAnimationFrame(()=>{scheduled=false;scan();});
    });
    observer.observe(document.body,{childList:true,subtree:true});
  }
  if (window.forumDeferredExtras) window.forumDeferredExtras.onReady(boot);
  else if (document.readyState==='complete') boot();
  else window.addEventListener('load',boot,{once:true});
})();
