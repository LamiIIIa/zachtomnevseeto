(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.AkatsukiCharacterManager = api; if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', api.boot); else api.boot(); }
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';

/* CHARACTER_TEMPLATE_START */
/* Shared personal-case template adapter. No network calls. */
function akcmLegacyCode(raw) {
  if (!/\[akcm\]/i.test(raw)) return raw;
  var text = String(raw), row = function (name, value) { return '[tr][td]' + name + '[/td][td]' + value + '[/td][/tr]'; };
  text = text.replace(/\[akcmhead\]([\s\S]*?)\[\/akcmhead\]/gi, function (_, body) {
    var level = body.match(/\[akcmtitle\]\s*Уровень\s+(\d+)\s*\[\/akcmtitle\]/i), sum = body.match(/\[akcmvalue\]([\s\S]*?)\[\/akcmvalue\]/i);
    return level ? '[table]' + row('Уровень', level[1]) + (sum ? row('Общая сумма', sum[1]) : '') + '[/table]' : '';
  });
  text = text.replace(/\[akcmskill\]([\s\S]*?)\[\/akcmskill\]/gi, function (_, body) {
    return row((body.match(/\[akcmname\]([\s\S]*?)\[\/akcmname\]/i) || [,''])[1], (body.match(/\[akcmvalue\]([\s\S]*?)\[\/akcmvalue\]/i) || [,''])[1]);
  });
  text = text.replace(/\[akcmrow\]([\s\S]*?)\[\/akcmrow\]/gi, function (_, body) {
    var name = (body.match(/\[akcmname\]([\s\S]*?)\[\/akcmname\]/i) || [,''])[1].replace('Атака: ближний', 'Атака ближний');
    var values = Array.from(body.matchAll(/\[akcmval\]([\s\S]*?)\[\/akcmval\]/gi)).map(function (m) { return (m[1].match(/\[akcmvalue\]([\s\S]*?)\[\/akcmvalue\]/i) || [,''])[1]; });
    if (!values.length) values = [(body.match(/\[akcmvalues?\]([\s\S]*?)\[\/akcmvalues?\]/i) || [,''])[1]];
    return '[tr][td]' + name + '[/td]' + values.map(function (v) { return '[td]' + v + '[/td]'; }).join('') + '[/tr]';
  });
  text = text.replace(/\[akcmrank\]([\s\S]*?)\[\/akcmrank\]/gi, function (_, body) { return row('Ранг: ' + (body.match(/\[akcmrankname\]([\s\S]*?)\[\/akcmrankname\]/i) || [,''])[1], (body.match(/\[akcmlist\]([\s\S]*?)\[\/akcmlist\]/i) || [,''])[1]); });
  text = text.replace(/\[akcmabilities\]([\s\S]*?)\[\/akcmabilities\]/gi, function (_, body) { return '[table]' + row('Способности', body) + '[/table]'; });
  text = text.replace(/\[akcmequipment\]([\s\S]*?)\[\/akcmequipment\]/gi, function (_, body) { return '[table][tr][td]' + body.replace(/\[akcmsection\]([\s\S]*?)\[\/akcmsection\]/gi, '[b]$1[/b]\n').replace(/\[akcmequiprow\]([\s\S]*?)\[\/akcmequiprow\]/gi, function (_, entry) { return '• ' + entry.replace(/\[\/akcmvalue\]\s*\[akcm(?:name|small)\]/gi, ': ') + '\n'; }) + '[/td][/tr][/table]'; });
  return text.replace(/\[\/?(?:akcmskills|akcmcombat|akcmtechniques)\]/gi, function (tag) { return tag.indexOf('[/') === 0 ? '[/table]' : '[table]'; }).replace(/\[akcmsection\][\s\S]*?\[\/akcmsection\]/gi, '').replace(/\[\/akcmitem\]/gi, '\n').replace(/\[\/?akcm\w*\]/gi, '').replace(/\[\/?widepost\]/gi, '');
}
function akcmTemplateCode(raw) {
  raw = String(raw).replace(/\[\/?widepost\]/gi, '').trim();
  if (/\[akcm\]/i.test(raw)) return '[widepost]\n' + raw;
  var plain = function (s) { return s.replace(/\[[^\]]*\]/g, '').trim(); }, skills = [], combat = [], ranks = [], ability = '', level = '', sum = '', remaining = raw;
  var skillNames = /^(Чакра|Сила|Скорость|Тактика|Ниндзюцу|Тайдзюцу|Гендзюцу|Фуиндзюцу|Здоровье|Знания)$/i;
  remaining = remaining.replace(/\[table[^\]]*\]([\s\S]*?)\[\/table\]/gi, function (table, body) {
    var handled = false, previous = '', unknown = [];
    body.replace(/\[tr[^\]]*\]([\s\S]*?)\[\/tr\]/gi, function (row, content) {
      var cells = Array.from(content.matchAll(/\[td[^\]]*\]([\s\S]*?)\[\/td\]/gi)).map(function (m) { return m[1]; });
      var label = plain(cells[0] || ''), value = cells.slice(1).join('\n');
      if (/^Уровень\s*:?$/i.test(label)) { level = plain(value); handled = true; }
      else if (skillNames.test(label)) { skills.push('[akcmskill][akcmname]' + label + '[/akcmname][akcmvalue]' + value + '[/akcmvalue][/akcmskill]'); handled = true; }
      else if (/^Общая сумма$/i.test(label)) { sum = value; handled = true; }
      else if (/^Общая сумма$/i.test(previous) && cells.length === 1) { sum = cells[0]; handled = true; }
      else if (/^Ранг\s*:/i.test(label)) { ranks.push('[akcmrank][akcmrankname]' + label.replace(/^Ранг\s*:\s*/i, '') + '[/akcmrankname][akcmlist]\n' + value.split(/\n+/).filter(function (s) { return s.trim(); }).map(function (s) { return '[akcmitem]' + s + '[/akcmitem]'; }).join('\n') + '\n[/akcmlist][/akcmrank]'); handled = true; }
      else if (/^Способности$/i.test(label)) { ability = value; handled = true; }
      else if (/^(Боеспособность|Запас\s+Чакры|Урон|Защита|Количество действий|Атака|Уклонение|Базовый крит)/i.test(label) && cells.length >= 2) {
        var labels = /^Запас/i.test(label) ? ['Общий', 'Сконцентрированной'] : ['Обычных', 'Техники'];
        value = cells.length === 3 ? '[akcmvalues]' + cells.slice(1).map(function (v, i) { return '[akcmval][akcmsmall]' + labels[i] + '[/akcmsmall][akcmvalue]' + v + '[/akcmvalue][/akcmval]'; }).join('') + '[/akcmvalues]' : '[akcmvalue]' + value + '[/akcmvalue]';
        combat.push('[akcmrow][akcmname]' + label + '[/akcmname]' + value + '[/akcmrow]'); handled = true;
      } else if (label && !/^(Скиллы персонажа|Техники персонажа)$/i.test(label)) unknown.push(row);
      previous = label;
    });
    return handled ? (unknown.length ? '[table]' + unknown.join('\n') + '[/table]' : '') : table;
  });
  if (!level || skills.length !== 10) throw new Error('Не найдены уровень и десять скиллов. Исходный пост оставлен без изменений.');
  remaining = remaining.replace(/\[table[^\]]*\]([\s\S]*?)\[\/table\]/gi, function (table, body) {
    if (!/ЭКИПИРОВКА ПЕРСОНАЖА/i.test(plain(body))) return table;
    var parts = Array.from(body.matchAll(/\[td[^\]]*\]([\s\S]*?)\[\/td\]/gi)).map(function (m) { return m[1]; });
    return '[akcmequipment][akcmhead][akcmheadpart][akcmcaption]Личное дело · снаряжение[/akcmcaption][akcmtitle]Экипировка[/akcmtitle][/akcmheadpart][/akcmhead]\n' + parts.slice(1).map(function (part) {
      var lines = part.split(/\n+/), title = plain(lines.shift()).replace(/^[◈⚔]\s*/, '');
      return '[akcmsection]' + title + '[/akcmsection][akcmequiplist]' + lines.filter(function (line) { return line.trim(); }).map(function (line) { var match = line.replace(/^•\s*/, '').split(/\s+—\s+|:\s+/); return '[akcmequiprow][akcmvalue]' + match.shift() + '[/akcmvalue][akcmname]' + match.join(' — ') + '[/akcmname][/akcmequiprow]'; }).join('\n') + '[/akcmequiplist]';
    }).join('\n') + '[/akcmequipment]';
  });
  return '[widepost]\n[akcm]\n[akcmhead][akcmheadpart][akcmcaption]Личное дело · характеристики[/akcmcaption][akcmtitle]Уровень ' + level + '[/akcmtitle][/akcmheadpart][akcmheadpart][akcmsmall]Общая сумма[/akcmsmall][akcmvalue]' + sum + '[/akcmvalue][/akcmheadpart][/akcmhead]\n[akcmsection]Скиллы персонажа[/akcmsection][akcmskills]\n' + skills.join('\n') + '\n[/akcmskills]\n[akcmsection]Боевые параметры[/akcmsection][akcmcombat]\n' + combat.join('\n') + '\n[/akcmcombat]\n[akcmsection]Техники персонажа[/akcmsection][akcmtechniques]\n' + ranks.join('\n') + '\n[/akcmtechniques]\n[akcmsection]Способности[/akcmsection][akcmabilities]' + ability + '[/akcmabilities]\n[/akcm]\n' + remaining.trim();
}
function akcmNormalizePost(post) {
  if (!post) return post;
  var clone = post.cloneNode(true), select = function (tag, scope) { return (scope || clone).querySelectorAll('.' + tag + ',.custom_tag_' + tag + ',.akcm-' + tag.slice(4) + ',.akcm__' + tag.slice(4) + ',[data-bbcode="' + tag + '"]'); };
  var skills = select('akcmskill');
  if (!skills.length) return post;
  var doc = post.ownerDocument, table = doc.createElement('table');
  function row(name, values) { var tr = table.insertRow(); tr.insertCell().textContent = name; values.forEach(function (value) { tr.insertCell().innerHTML = value; }); }
  var title = Array.from(select('akcmtitle')).find(function (n) { return /Уровень\s*\d+/i.test(n.textContent); });
  if (title) row('Уровень', [title.textContent.match(/\d+/)[0]]);
  var head = select('akcmhead')[0];
  if (head) { var sum = select('akcmvalue', head)[0]; if (sum) row('Общая сумма', [sum.innerHTML]); }
  Array.from(skills).concat(Array.from(select('akcmrow'))).forEach(function (node) {
    var name = select('akcmname', node)[0], vals = select('akcmval', node), values;
    if (!name) return;
    if (vals.length) values = Array.from(vals).map(function (v) { var value = select('akcmvalue', v)[0]; return value ? value.innerHTML : ''; });
    else { var value = select('akcmvalues', node)[0] || select('akcmvalue', node)[0]; values = [value ? value.innerHTML : '']; }
    var label = name.textContent.replace('Атака: ближний','Атака ближний');
    if (/^Защита от ядов/i.test(label)) label = 'Защита от ядов и болезней';
    row(label, values);
  });
  Array.from(select('akcmrank')).forEach(function (node) { var rank = select('akcmrankname', node)[0], list = select('akcmlist', node)[0]; if (rank && list) row('Ранг: ' + rank.textContent, [list.innerHTML]); });
  Array.from(select('akcmabilities')).forEach(function (node) { row('Способности', [node.innerHTML]); });
  var equipment = select('akcmequipment')[0];
  var scopedInventory = typeof akcmThirdSection === 'function' ? akcmThirdSection(clone, 'Инвентарь') : clone;
  var inventory = scopedInventory && scopedInventory !== clone ? scopedInventory : Array.from(clone.querySelectorAll('.spoiler-box,details')).find(function (node) { var title=node.querySelector(':scope > div:first-child,:scope > summary');return title&&/^инвентарь$/i.test(title.textContent.trim()); });
  var free = clone.textContent.match(/-?\s*свободный слот техники любого ранга/gi) || [];
  clone.innerHTML = ''; clone.appendChild(table);
  free.forEach(function (text) { var p=doc.createElement('p');p.textContent=text;clone.appendChild(p); });
  if (equipment) {
    Array.from(select('akcmequiprow', equipment)).forEach(function (entry) { var value=select('akcmvalue',entry)[0], name=select('akcmname',entry)[0]||select('akcmsmall',entry)[0];entry.textContent='• '+(value?value.textContent:'')+(name?' — '+name.textContent:''); });
    clone.appendChild(equipment);
  }
  if (inventory) clone.appendChild(inventory);
  return clone;
}

// Scope third-post readers to the requested shopcard section; legacy cards remain supported.
function akcmThirdSection(post, title) {
  if (!post) return post;
  var sections = post.querySelectorAll('.shopsection,.custom_tag_shopsection,.shop-section,.shop__section,[data-bbcode="shopsection"]');
  for (var i = 0; i < sections.length; i++) {
    var heading = sections[i].querySelector('.shoptitle,.custom_tag_shoptitle,.shop-title,.shop__title,[data-bbcode="shoptitle"]');
    if (heading && heading.textContent.trim().toLowerCase().replace(/ё/g,'е') === title.toLowerCase().replace(/ё/g,'е')) return sections[i];
  }
  return post;
}
/* Native MyBB second-post editor. One explicit save, no automatic retry. */
function akcmPostTarget(doc) {
  var content = doc.querySelectorAll('.post-content')[1], post = content && content.closest('.post');
  var id = post && (post.id.match(/^p(\d+)$/) || [])[1];
  var authorLink = post && post.querySelector('.pa-author a[href*="profile.php"]');
  var author = authorLink ? new URL(authorLink.getAttribute('href'), location.href).searchParams.get('id') : '';
  return id ? {id: id, author: author || ''} : null;
}
function akcmPostTargetById(doc, postId) {
  var content = doc.getElementById('p' + postId + '-content') || doc.querySelector('#p' + postId + ' .post-content');
  var post = content && content.closest('.post');
  if (!content) return null;
  var authorLink = post && post.querySelector('.pa-author a[href*="profile.php"]');
  var author = authorLink ? new URL(authorLink.getAttribute('href'), location.href).searchParams.get('id') : '';
  return {id: String(postId), author: author || ''};
}
function akcmCanEdit(target) {
  return !!target && [1, 2, 5].indexOf(Number(window.GroupID)) !== -1;
}
async function akcmReadTechnical(topicId) {
  if (!/^\d+$/.test(String(topicId))) throw new Error('Не выбрано личное дело.');
  var doc = await akatsukiNetwork().document('/viewtopic.php?id=' + topicId, true), target = akcmPostTarget(doc);
  if (!akcmCanEdit(target)) throw new Error('Обновить пост может только администратор или модератор.');
  var edit = await akatsukiNetwork().document('/edit.php?id=' + target.id, true), field = edit.querySelector('textarea[name="req_message"]');
  if (!field || !field.form) throw new Error('Форма редактирования второго поста недоступна.');
  return {target: target, raw: field.value, topicId: String(topicId)};
}
async function akcmReadPost(topicId, postId) {
  if (!/^\d+$/.test(String(topicId)) || !/^\d+$/.test(String(postId))) throw new Error('Не выбран пост для обновления.');
  var target = {id: String(postId), author: ''};
  var edit = await akatsukiNetwork().document('/edit.php?id=' + target.id, true), field = edit.querySelector('textarea[name="req_message"]');
  if (!field || !field.form) throw new Error('Форма редактирования поста недоступна для текущего аккаунта.');
  return {target: target, raw: field.value, topicId: String(topicId), postId: String(postId)};
}
async function akcmSavePost(snapshot, text) {
  if (!snapshot || !snapshot.target) throw new Error('Сначала заново загрузите пост НПС.');
  var fresh = await akcmReadPost(snapshot.topicId, snapshot.postId);
  if (fresh.target.id !== snapshot.target.id || fresh.raw !== snapshot.raw) throw new Error('Пост изменился после загрузки. Загрузите его заново перед сохранением.');
  var frame = document.createElement('iframe'); frame.hidden = true; frame.title = 'Сохранение поста НПС';
  function navigate(start) { return new Promise(function (resolve, reject) {
    var timer = setTimeout(function () { frame.onload = null; reject(new Error('Нет подтверждения сохранения. Проверьте пост перед повторной попыткой.')); }, 30000);
    frame.onload = function () { clearTimeout(timer); frame.onload = null; resolve(frame.contentDocument); };
    try { start(); } catch (e) { clearTimeout(timer); reject(e); }
  }); }
  try {
    var doc = await navigate(function () { frame.src = '/edit.php?id=' + fresh.target.id; document.body.appendChild(frame); });
    var field = doc.querySelector('textarea[name="req_message"]'), form = field && field.form;
    if (!form) throw new Error('Форма сохранения недоступна.');
    var action = new URL(form.getAttribute('action') || frame.src, location.href);
    if (action.origin !== location.origin || action.pathname !== '/edit.php' || action.searchParams.get('id') !== fresh.target.id) throw new Error('Некорректная форма сохранения.');
    if (field.value !== snapshot.raw) throw new Error('Пост уже изменён. Загрузите его заново.');
    var win = frame.contentWindow;
    Object.getOwnPropertyDescriptor(win.HTMLTextAreaElement.prototype, 'value').set.call(field, text);
    field.dispatchEvent(new win.Event('input', {bubbles:true})); field.dispatchEvent(new win.Event('change', {bubbles:true}));
    form.addEventListener('formdata', function (event) { event.formData.set('req_message', text); });
    var button = form.querySelector('[type="submit"][name="update"],[type="submit"][name="submit"]');
    if (!button) throw new Error('Кнопка сохранения формы не найдена.');
    await navigate(function () { button.click(); });
    var verified = await akcmReadPost(snapshot.topicId, snapshot.postId);
    if (verified.raw.replace(/\r\n/g,'\n').trim() !== text.replace(/\r\n/g,'\n').trim()) throw new Error('Форум не подтвердил новый текст. Проверьте пост.');
    return verified;
  } finally { frame.remove(); }
}
async function akcmSaveTechnical(snapshot, text) {
  if (!snapshot || !akcmCanEdit(snapshot.target)) throw new Error('Нет прав на обновление поста.');
  var fresh = await akcmReadTechnical(snapshot.topicId);
  if (fresh.target.id !== snapshot.target.id || fresh.raw !== snapshot.raw) throw new Error('Второй пост изменился после загрузки. Загрузите его заново перед сохранением.');
  var frame = document.createElement('iframe'); frame.hidden = true; frame.title = 'Сохранение личного дела';
  function navigate(start) { return new Promise(function (resolve, reject) {
    var timer = setTimeout(function () { frame.onload = null; reject(new Error('Нет подтверждения сохранения. Проверьте пост перед повторной попыткой.')); }, 30000);
    frame.onload = function () { clearTimeout(timer); frame.onload = null; resolve(frame.contentDocument); };
    try { start(); } catch (e) { clearTimeout(timer); reject(e); }
  }); }
  try {
    var doc = await navigate(function () { frame.src = '/edit.php?id=' + fresh.target.id; document.body.appendChild(frame); });
    var field = doc.querySelector('textarea[name="req_message"]'), form = field && field.form;
    if (!form) throw new Error('Форма сохранения недоступна.');
    var action = new URL(form.getAttribute('action') || frame.src, location.href);
    if (action.origin !== location.origin || action.pathname !== '/edit.php' || action.searchParams.get('id') !== fresh.target.id) throw new Error('Некорректная форма сохранения.');
    if (field.value !== snapshot.raw) throw new Error('Второй пост уже изменён. Загрузите его заново.');
    var win = frame.contentWindow;
    Object.getOwnPropertyDescriptor(win.HTMLTextAreaElement.prototype, 'value').set.call(field, text);
    field.dispatchEvent(new win.Event('input', {bubbles:true})); field.dispatchEvent(new win.Event('change', {bubbles:true}));
    form.addEventListener('formdata', function (event) { event.formData.set('req_message', text); });
    var button = form.querySelector('[type="submit"][name="update"],[type="submit"][name="submit"]');
    if (!button) throw new Error('Кнопка сохранения формы не найдена.');
    await navigate(function () { button.click(); });
    var verified = await akcmReadTechnical(snapshot.topicId);
    if (verified.raw.replace(/\r\n/g,'\n').trim() !== text.replace(/\r\n/g,'\n').trim()) throw new Error('Форум не подтвердил новый текст. Проверьте второй пост.');
    return verified;
  } finally { frame.remove(); }
}
/* CHARACTER_TEMPLATE_END */

/* NETWORK_HELPER_START */
/* Akatsuki request scheduler v2. No global fetch/XHR patching. */
function akatsukiNetwork() {
  var host = window;
  try { if (window.parent && window.parent.location.origin === window.location.origin) host = window.parent; } catch (_) {}
  if (host.AkatsukiNetworkV2) return host.AkatsukiNetworkV2;
  var queue = [], pending = new Map(), cache = new Map(), active = 0, timer = null, nextStart = 0, blockedUntil = 0;
  try { blockedUntil = Number(host.localStorage.getItem('akatsuki-network-pause')) || 0; } catch (_) {}
  var GAP = 200, CONCURRENCY = 3, MAX_QUEUE = 80, MAX_CACHE = 96;
  function pause(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function unavailable() { return new Error('Р—Р°РіСЂСѓР·РєР° РїСЂРёРѕСЃС‚Р°РЅРѕРІР»РµРЅР° РїРѕСЃР»Рµ РѕС€РёР±РєРё С„РѕСЂСѓРјР°. РџРѕРІС‚РѕСЂРёС‚Рµ РІСЂСѓС‡РЅСѓСЋ РїРѕР·Р¶Рµ.'); }
  function canonical(value) {
    var url = new URL(value, window.location.href);
    if (!/^https?:$/.test(url.protocol)) throw new Error('РќРµРґРѕРїСѓСЃС‚РёРјС‹Р№ Р°РґСЂРµСЃ Р·Р°РіСЂСѓР·РєРё');
    url.hash = ''; url.searchParams.delete('_'); url.searchParams.delete('_akcm');
    url.searchParams.sort();
    return url.href;
  }
  function stop(error) {
    var retry = error && error.retryAfter;
    var wait = retry ? Math.max(60000, retry) : /^(403|429|503)$/.test(String(error && error.status)) ? 300000 : 60000;
    blockedUntil = Math.max(blockedUntil, Date.now() + wait);
    // Notify same-origin tabs only on failure; no storage polling on page load.
    try { if (host.localStorage) host.localStorage.setItem('akatsuki-network-pause', String(blockedUntil)); } catch (_) {}
  }
  if (host.addEventListener) host.addEventListener('storage', function (event) {
    if (event.key === 'akatsuki-network-pause') blockedUntil = Math.max(blockedUntil, Number(event.newValue) || 0);
  });
  async function launch(job) {
    try {
      var locks = host.navigator && host.navigator.locks;
      // Coordinate start rate across tabs, never hold a lock for the response.
      if (locks) await locks.request('akatsuki-forum-network-v2-start', function () { return pause(GAP); });
      if (Date.now() < blockedUntil) throw unavailable();
      var value;
      try { value = await job.task(); }
      catch (error) { stop(error); throw error; }
      if (job.ttl) {
        cache.set(job.key, { value: value, expires: Date.now() + job.ttl });
        while (cache.size > MAX_CACHE) cache.delete(cache.keys().next().value);
      }
      job.resolve(value);
    } catch (error) { job.reject(error); }
    finally { pending.delete(job.key); active -= 1; drain(); }
  }
  function drain() {
    if (timer !== null || !queue.length || active >= CONCURRENCY) return;
    if (Date.now() < blockedUntil) {
      while (queue.length) { var stopped = queue.shift(); pending.delete(stopped.key); stopped.reject(unavailable()); }
      return;
    }
    var wait = nextStart - Date.now();
    if (wait > 0) { timer = setTimeout(function () { timer = null; drain(); }, wait); return; }
    var job = queue.shift();
    active += 1;
    nextStart = Date.now() + GAP;
    launch(job);
    drain();
  }
  function request(key, task, ttl) {
    if (pending.has(key)) return pending.get(key);
    var saved = cache.get(key);
    if (saved && saved.expires > Date.now()) return Promise.resolve(saved.value);
    cache.delete(key);
    if (Date.now() < blockedUntil) return Promise.reject(unavailable());
    if (queue.length >= MAX_QUEUE) return Promise.reject(new Error('РЎР»РёС€РєРѕРј РјРЅРѕРіРѕ СЃС‚СЂР°РЅРёС† РґР»СЏ РѕРґРЅРѕР№ Р·Р°РіСЂСѓР·РєРё. РЈС‚РѕС‡РЅРёС‚Рµ РІС‹Р±РѕСЂ.'));
    var promise = new Promise(function (resolve, reject) { queue.push({ key: key, task: task, ttl: ttl || 0, resolve: resolve, reject: reject }); });
    pending.set(key, promise); drain(); return promise;
  }
  function documentRequest(value, fresh) {
    var url;
    try { url = canonical(value); } catch (error) { return Promise.reject(error); }
    var key = 'document:' + url;
    if (fresh) cache.delete(key);
    return request(key, function () {
      return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true); xhr.responseType = 'document'; xhr.timeout = 30000;
        xhr.withCredentials = new URL(url).origin === window.location.origin;
        xhr.onload = function () {
          if (xhr.status < 200 || xhr.status >= 400) {
            var error = new Error('HTTP ' + xhr.status); error.status = xhr.status;
            var retry = xhr.getResponseHeader('Retry-After');
            error.retryAfter = /^\d+$/.test(retry || '') ? Number(retry) * 1000 : Math.max(0, Date.parse(retry) - Date.now()) || 0;
            reject(error); return;
          }
          var doc = xhr.responseXML || xhr.response;
          if (!doc || !doc.querySelector) { reject(new Error('РџСѓСЃС‚РѕР№ HTML-РґРѕРєСѓРјРµРЅС‚')); return; }
          resolve(doc);
        };
        xhr.onerror = xhr.ontimeout = xhr.onabort = function () { reject(new Error('РћС€РёР±РєР° СЃРµС‚Рё РёР»Рё С‚Р°Р№Рј-Р°СѓС‚ Р·Р°РіСЂСѓР·РєРё')); };
        xhr.send();
      });
    }, fresh ? 0 : (/^\/viewtopic\.php$/.test(new URL(url).pathname) && /^(73|74|75|76|77|78|79|82|83)$/.test(new URL(url).searchParams.get('id') || '') ? 600000 : 60000));
  }
  host.AkatsukiNetworkV2 = { request: request, document: documentRequest, canonical: canonical };
  return host.AkatsukiNetworkV2;
}

/* NETWORK_HELPER_END */
  const RANKS = ['E','D','C','B','A','S','ANY'];
  const SLOT_PRICES = {E:8,D:16,C:30,B:60,A:120,S:240};
  const LEVEL_SLOTS = [null,[5,2,1,0,0,0,0],[5,3,1,0,0,0,0],[5,4,1,0,0,0,0],[5,4,2,0,0,0,0],[5,5,2,1,0,0,0],[5,5,3,1,0,0,0],[5,5,4,1,0,0,0],[5,5,4,2,0,0,0],[5,5,4,3,1,0,0],[5,5,5,3,1,0,0],[5,5,5,4,1,0,0],[5,5,5,4,2,0,0],[5,5,5,4,3,1,0],[5,5,5,5,3,1,0],[5,5,5,5,4,1,0],[5,5,5,5,4,2,0],[5,5,5,5,5,3,0],[5,5,5,5,5,3,1],[5,5,5,5,5,3,2],[5,5,5,5,5,3,3]];
  const DEFAULT_KITS = [
    {id:'shinobi',title:'Стандартный набор шиноби',category:'Набор шиноби',description:'',items:[['Кунай',10,'шт.'],['Сюрикен',15,'шт.'],['Сенбон',30,'шт.'],['Дымовая бомба',3,'шт.'],['Взрывная печать',5,'шт.'],['Световая бомба',2,'шт.'],['Леска',10,'м'],['Свиток для хранения',8,'шт.'],['Медицинский набор',1,'шт.'],['Продовольственная пилюля',3,'шт.']]},
    {id:'medical',title:'Медицинский набор',category:'Медицинский набор',description:'',items:[['Комплект для перевязок',2,'шт.'],['Жгут кровоостанавливающий',4,'шт.'],['Обеззараживающий раствор',1,'шт.'],['Мазь заживляющая',1,'шт.'],['Пилюля, восстанавливающая чакру на 10%',5,'шт.'],['Инъекционная ампула пустая',5,'шт.'],['Инъекционная ампула с адреналином',2,'шт.'],['Инъекционная ампула со средством, стимулирующим кроветворение',2,'шт.'],['Инъекционная ампула с обезболивающим',3,'шт.']]},
    {id:'cosmetic',title:'Косметический набор куноичи',category:'Косметический набор куноичи',description:'Используя каждый из предметов в наборе по назначению, куноичи тратит на это 1 общее действие. Если будут использованы все предметы из набора подряд, ваша [b]тактика[/b] увеличится на [b]+1[/b], с масочкой для лица [b]+2[/b], до конца сюжетного дня.',items:[['Духи',1,'флакон (10 применений)'],['Масочка для лица',5,'шт.'],['Крем увлажняющий',1,'шт. (10 применений)'],['Тени',1,'палетка (10 применений)'],['Лак для ногтей',1,'флакон (10 применений)'],['Тональный крем',1,'шт. (10 применений)'],['Румяна',1,'шт. (10 применений)'],['Блеск для губ',1,'шт. (10 применений)'],['Помада',1,'шт. (10 применений)'],['Тушь для ресниц',1,'шт. (10 применений)'],['Массажер для лица',1,'шт. (многоразовый)']]},
    {id:'akatsuki',title:'Стандартный набор Акацуки',category:'Набор Акацуки',description:'',items:[['Кунаи',30,'шт.'],['Сюрикены',30,'шт.'],['Сенбоны',50,'шт.'],['Дымовые бомбы',10,'шт.'],['Взрывные печати',10,'шт.'],['Световые бомбы',10,'шт.'],['Леска',30,'м'],['Комплект нательной формы Акацуки - дизайн по выбору',1,'шт.'],['Комплект обмоток',10,'шт.'],['Соломенные шляпы',2,'шт.'],['Зимний плащ Акацуки',1,'шт.'],['Стандартный плащ Акацуки - дизайн по выбору',2,'шт.'],['Флакон лака - цвет по выбору',1,'шт.'],['Чистые свитки для хранения',10,'шт.'],['Карта черных рынков',1,'шт.'],['Карты без пометок, чистые',5,'шт.'],['Стандартный комплект поддельных документов',1,'шт.'],['Продовольственные пилюли',30,'шт.'],['Боевые пилюли',5,'шт.'],['Паралитический яд ранга C (флакон)',1,'шт.'],['Летальный яд ранга B (флакон)',1,'шт.'],['Травяной противоспалительный чай (пакет)',1,'шт.'],['Снотворное в порошке (флакон)',2,'шт.'],['Успокоительное в капсулах',10,'шт.'],['Комплект для перевязок',5,'шт.'],['Жгут кровоостанавливающий',4,'шт.'],['Обезболивающее в капсулах',20,'шт.'],['Обеззараживающий раствор',5,'шт.'],['Мазь заживляющая',5,'шт.'],['Пилюли, восстанавливающие чакру на 10%',10,'шт.'],['Инъекционная ампула пустая',5,'шт.'],['Инъекционная ампула с адреналином',5,'шт.'],['Инъекционная ампула со средством, стимулирующим кроветворение',5,'шт.'],['Инъекционная ампула с обезболивающим',10,'шт.'],['Инъекционная ампула с универсальным противоядием',6,'шт.'],['Инъекционная ампула со средством, снимающим интоксикацию',5,'шт.']]}
  ];
  const clone = x => JSON.parse(JSON.stringify(x));
  const stable = x => JSON.stringify(x&&typeof x==='object'&&!Array.isArray(x)?Object.keys(x).sort().reduce((a,k)=>(a[k]=stableValue(x[k]),a),{}):stableValue(x));
  const stableValue = x => Array.isArray(x)?x.map(stableValue):x&&typeof x==='object'?Object.keys(x).sort().reduce((a,k)=>(a[k]=stableValue(x[k]),a),{}):x;
  const num = (x, name, min = 0, max = Number.MAX_SAFE_INTEGER) => {
    if (x === '' || x === null || typeof x === 'boolean' || !Number.isSafeInteger(Number(x)) || Number(x) < min || Number(x) > max) throw Error('Некорректное значение: ' + name);
    return Number(x);
  };
  const plain = s => String(s || '').replace(/\[[^\]]*\]/g, '').trim();
  const bb = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\[/g,'&#91;').replace(/\]/g,'&#93;');
  const bbInline = s => bb(s).replace(/&#91;(\/?(?:b|i))&#93;/gi,'[$1]').replace(/&#91;color=([#\wа-яА-Я -]+)&#93;/gi,(m,c)=>/^(#[0-9a-f]{3,6}|[a-zа-я -]+)$/i.test(c.trim())?'[color='+c.trim()+']':m).replace(/&#91;\/color&#93;/gi,'[/color]');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const linkHtml = (url,text) => url?'<a href="'+esc(url)+'" target="_blank" rel="noopener">'+esc(text)+'</a>':esc(text);
  const actorText = actor => typeof actor==='object'&&actor?actor.name||'':String(actor||'');
  const actorUrl = actor => typeof actor==='object'&&actor?actor.url||'':'';
  const actorBb = actor => actorUrl(actor)?'[url='+cleanUrl(actorUrl(actor))+']'+bb(actorText(actor))+'[/url]':bb(actorText(actor));
  const reasonBb = entry => entry.url?'[url='+cleanUrl(entry.url)+']'+bb(entry.reason)+'[/url]':bb(entry.reason);
  const fmt = n => Number(n).toLocaleString('ru-RU');
  const cleanUrl = s => {
    const value=String(s||'').trim(); if(!value)return '';
    let u;try{u=new URL(value, typeof location==='object'?location.href:'https://akatsukigood.forum.cool/');}catch(_){throw Error('Некорректная ссылка: '+value);}
    if(!['http:','https:'].includes(u.protocol))throw Error('Ссылка должна начинаться с http:// или https://');
    return u.href;
  };
  const itemTitle = i => {
    const name=bbInline(i.name);
    return i.url?'[url='+cleanUrl(i.url)+']'+name+'[/url]':'[b]'+name+'[/b]';
  };
  function fresh(name = '') { return {schema:1,revision:0,name,level:1,age:null,currentPlayerId:'',topicId:'',post1:'',post2:'',post3:'',opening:{money:0,xp:0},job:{title:'',rank:'E',salary:0},specializations:[],specializationTechniques:[],inventory:[],property:[],missions:[],quests:[],details:'',privateNotes:'',history:[],legacy:'',pending:null}; }
  function artifactLink(value) {
    const m=String(value).trim().match(/^\[url=([^\]]+)\]([\s\S]*?)\[\/url\]$/i);
    return m?{url:cleanUrl(m[1]),name:m[2]}:{url:cleanUrl(value)};
  }
  function normalizeItemLink(item) {
    if(/^\s*\[url=/i.test(item.name||'')) {
      const link=artifactLink(item.name);
      if(!link.name)throw Error('Проверьте BBCode-ссылку предмета: [url=ссылка]Название[/url].');
      item.name=link.name;item.url=link.url;
    }
    if(item.url) {
      const link=artifactLink(item.url);
      item.url=link.url;
      if(link.name)item.name=link.name;
    }
    return item;
  }
  function firstPostDesign(raw) {
    raw=String(raw).replace(/\[widepost\]\s*/gi,'').trim();
    const imageIn=value=>(value.match(/\[img(?:=[^\]]*)?\]([\s\S]*?)\[\/img\]/i)||[])[0]||'';
    const cleanLegacyValue=value=>String(value)
      .replace(/\[\/?font(?:=[^\]]*)?\]/gi,'')
      .replace(/\[\/?(?:table|tr|td|align)\b[^\]]*\]/gi,'')
      .replace(/^(?:\s*\[\/?quote(?:=[^\]]*)?\]\s*)+/i,'')
      .replace(/(?:\s*\[\/?quote(?:=[^\]]*)?\]\s*)+$/i,'')
      .trim();
    const frame=(heading,text)=>'[anketaframe][anketainner][anketaheading]'+heading+'[/anketaheading][anketaprose]'+text+'[/anketaprose][/anketainner][/anketaframe]';
    const normalizeProse=prose=>{
      const descriptions=prose.filter(([key])=>/^(?:Описание персонажа|Внешность|Характер)$/i.test(key)).map(([,value])=>value.trim()).filter(Boolean);
      const result=[];if(descriptions.length)result.push(['Описание персонажа',descriptions.join('\n\n')]);
      prose.forEach(item=>{if(!/^(?:Описание персонажа|Внешность|Характер)$/i.test(item[0])&&item[1].trim())result.push([item[0],item[1].trim()]);});
      return result;
    };
    const compose=(cover,portrait,title,fields,prose,contacts)=>'[widepost][anketacard]\n[anketacover][anketacoverimg]'+cover+'[/anketacoverimg][anketacovertext][anketakicker]Анкета персонажа[/anketakicker][anketaname]'+title+'[/anketaname][/anketacovertext][/anketacover]\n[anketabody][anketaidentity][anketainner][anketaheading]Личное дело[/anketaheading][anketagrid][anketaportraitframe][anketaportrait]'+portrait+'[/anketaportrait][anketacaption]Портрет персонажа[/anketacaption][/anketaportraitframe][anketadetails]'+fields.map(([key,value])=>'[anketarow][anketalabel]'+key+':[/anketalabel][anketaanswer]'+value+'[/anketaanswer][/anketarow]').join('\n')+'[/anketadetails][/anketagrid][/anketainner][/anketaidentity]\n'+normalizeProse(prose).map(([key,value])=>frame(key,value)).join('\n')+'\n[/anketabody][/anketacard]'+(contacts.length?'\n\n'+contacts.join('\n'):'');
    const portraitBlock=(raw.match(/\[anketaportrait\]([\s\S]*?)\[\/anketaportrait\]/i)||[])[1];
    const image=imageIn(portraitBlock||raw);
    if(!image)throw Error('В первом посте не найдена основная картинка [img]. Добавьте её перед преобразованием.');
    if(/\[anketacard\]/i.test(raw)) {
      const cardBlock=(raw.match(/\[anketacard\]([\s\S]*?)\[\/anketacard\]/i)||[])[1];
      if(cardBlock===undefined)throw Error('В анкете не закрыт тег [anketacard].');
      const cover=imageIn((cardBlock.match(/\[anketacoverimg\]([\s\S]*?)\[\/anketacoverimg\]/i)||[])[1]||'')||image;
      const portrait=imageIn((cardBlock.match(/\[anketaportrait\]([\s\S]*?)\[\/anketaportrait\]/i)||[])[1]||'')||image;
      const fields=[],prose=[];
      for(const match of cardBlock.matchAll(/\[anketarow\]([\s\S]*?)\[\/anketarow\]/gi)){
        const label=(match[1].match(/\[anketalabel\]([\s\S]*?)\[\/anketalabel\]/i)||[])[1];
        const answer=(match[1].match(/\[anketaanswer\]([\s\S]*?)\[\/anketaanswer\]/i)||[])[1];
        if(label!==undefined&&answer!==undefined)fields.push([plain(label).trim().replace(/:$/,''),answer.trim()]);
      }
      for(const match of cardBlock.matchAll(/\[anketaframe\]([\s\S]*?)\[\/anketaframe\]/gi)){
        const heading=(match[1].match(/\[anketaheading\]([\s\S]*?)\[\/anketaheading\]/i)||[])[1];
        const text=(match[1].match(/\[anketaprose\]([\s\S]*?)\[\/anketaprose\]/i)||[])[1];
        if(heading!==undefined&&text!==undefined)prose.push([plain(heading).trim(),text.trim()]);
      }
      const titleBlock=(cardBlock.match(/\[anketaname\]([\s\S]*?)\[\/anketaname\]/i)||[])[1];
      const name=fields.find(([key])=>/^Имя$/i.test(key));
      const title=(titleBlock&&titleBlock.trim())||(name?bb(plain(name[1])):'Анкета персонажа');
      const tail=raw.slice(raw.search(/\[\/anketacard\]/i)+'[/anketacard]'.length).trim();
      const contacts=tail?[tail]:[];
      return compose(cover,portrait,title,fields,prose,contacts);
    }
    let body=raw.replace(image,'');
    const contacts=[];
    body=body.replace(/\[quote(?:=[^\]]*)?\]([\s\S]*?)\[\/quote\]/gi,(block,text)=>{if(/Связь\s*:/i.test(plain(text))){contacts.push(block.replace(/\[\/?font(?:=[^\]]*)?\]/gi,'').trim());return '';}return block;});
    const fields=[],prose=[],known=/^(?:Имя|Возраст|Пол|Место жительства|Стихии чакры|Инвентарь|Описание персонажа|Внешность|Характер|Биография|Пробный пост)\s*:?$/i;
    const add=(label,value)=>{label=plain(label).trim().replace(/:$/,'');value=cleanLegacyValue(value);if(!value)return;if(/^(Описание персонажа|Внешность|Характер|Биография|Пробный пост)$/i.test(label))prose.push([label,value]);else fields.push([label,value]);};
    // Extract only complete two-cell rows, leaving all unrecognised content intact.
    body=body.replace(/\[tr\]((?:(?!\[tr\])[\s\S])*?)\[\/tr\]/gi,(block,inside)=>{const cells=[...inside.matchAll(/\[td(?:[^\]]*)\]([\s\S]*?)\[\/td\]/gi)];if(cells.length!==2||!known.test(plain(cells[0][1]).trim()))return block;add(cells[0][1],cells[1][1]);return '';});
    body=body.replace(/\[table[^\]]*\]\s*\[\/table\]/gi,'');
    // Standard bold questionnaire headings. Preserve BBCode inside each answer.
    const headings=[...body.matchAll(/\[b\]((?:(?!\[\/b\])[\s\S])*?)\[\/b\]/gi)].filter(m=>known.test(plain(m[1]).trim()));
    if(headings.length){const prefix=body.slice(0,headings[0].index);headings.forEach((m,i)=>add(m[1],body.slice(m.index+m[0].length,i+1<headings.length?headings[i+1].index:body.length)));body=prefix;}
    body=cleanLegacyValue(body);if(plain(body).trim())prose.unshift(['Дополнительные сведения',body]);
    const name=fields.find(([key])=>/^Имя$/i.test(key));
    const title=name?bb(plain(name[1])):'Анкета персонажа';
    return compose(image,image,title,fields,prose,contacts);
  }
  function ageMatch(raw) {
    return /((?:\[b\])?Возраст(?:\s|&nbsp;|&#(?:160|x0*a0);|\[[^\]]*\]|<[^>]*>|[*:—–-])*)(\d{1,3})(?=\D|$)/i.exec(raw);
  }
  function readAge(raw) { const m=ageMatch(raw);return m?num(m[2],'возраст',0,300):null; }
  function patchAge(raw,age) {const m=ageMatch(raw);if(!m)throw Error('В первом посте не найден возраст. Укажите его в строке «Возраст: число».');age=num(age,'возраст',0,300);const tail=raw.slice(m.index+m[0].length).replace(/^(\s*)(лет|года|год)(?=\s|\[|[.,;)]|$)/,(_,space)=>space+(age%100>=11&&age%100<=14?'лет':age%10===1?'год':age%10>=2&&age%10<=4?'года':'лет'));return raw.slice(0,m.index)+m[1]+age+tail;}
  function artifactTitle(raw) {
    const usable=value=>{const name=plain(value).replace(/&nbsp;|&#160;/g,' ').trim();return name&&name.length<150&&!/^(?:примечание|описание|ранг|базовый тип|тип урона|материал|размер|урон|важно)(?:\s|:|$)/i.test(name)&&!name.endsWith(':');};
    const groups=[...String(raw).matchAll(/\[align=center\]([\s\S]*?)\[\/align\]/gi)].map(m=>m[1]);
    groups.push(...[...String(raw).matchAll(/\[size=\d+\]([\s\S]*?)\[\/size\]/gi)].map(m=>m[1]));
    for(const block of [...groups,String(raw)]){const titles=[...block.matchAll(/\[color=(#[0-9a-f]{3,8}|[a-z]+)\]([\s\S]*?)\[\/color\]/gi)].filter(m=>usable(m[2]));if(titles.length===1)return '[color='+titles[0][1]+']'+plain(titles[0][2])+'[/color]';if(groups.includes(block)&&usable(block))return plain(block);}
    throw Error('Не найден однозначный заголовок артефакта. Вставьте BBCode-ссылку с названием и цветом.');
  }
  const jobsOf=s=>Array.isArray(s.jobs)?s.jobs:(s.job?.title?[{...s.job,id:'legacy',rank:s.job.rank||s.job.title.match(/Ранг\s+([EDCBAS])/i)?.[1]||'E'}]:[]);
  function livingRate(age) {age=num(age,'возраст',0,300);return age<12?7000:age<18?10000:age<36?12000:age<60?15000:10000;}
  function purchaseReceipt(raw) {
    const rows=[...String(raw).matchAll(/(\d+)\s*[×xх]\s*\[url=([^\]]+)\]([\s\S]*?)\[\/url\]\s*[—–-]\s*([\d\s ]+)\s*[×xх]\s*(\d+)\s*=\s*([\d\s ]+)\s*р[ёе]/gi)];
    const number=s=>num(String(s).replace(/\s/g,''),'сумма покупки');
    if(!rows.length)throw Error('В чеке не найдены покупки. Вставьте исходный BBCode магазина.');
    if((String(raw).match(/\d+\s*[×xх]\s*\[url=/gi)||[]).length!==rows.length)throw Error('Не все строки чека распознаны. Проверьте количество, цену и сумму каждой позиции.');
    const items=rows.map(m=>{const quantity=number(m[1]),price=number(m[4]),sum=number(m[6]);if(!quantity||quantity!==number(m[5])||quantity*price!==sum)throw Error('Ошибка количества или суммы: '+plain(m[3]));const measure=shopItemMeasure(m[3],quantity);return {name:shopItemName(m[3]),url:cleanUrl(m[2]),quantity,price,sum,inventoryQuantity:measure.quantity,inventoryUnit:measure.unit};});
    const total=plain(raw).match(/(?:^|\n)\s*Итого:\s*([\d\s ]+)\s*р[ёе]/i);
    if(!total)throw Error('В чеке отсутствует строка «Итого».');
    const amount=number(total[1]);if(amount>items.reduce((a,i)=>a+i.sum,0))throw Error('Итог чека превышает сумму позиций.');
    return {items,amount};
  }
  const shopItemName=name=>String(name).replace(/\s*\([^)]*\d[^)]*\)/g,'').replace(/\s+/g,' ').trim();
  const shopItemMeasure=(name,purchased)=>{const meters=String(name).match(/\(\s*(\d+)\s*(?:м|метр(?:а|ов)?)\.?\s*\)/i);return meters?{quantity:num(Number(meters[1])*purchased,'количество метров'),unit:'м'}:{quantity:purchased,unit:'шт.'};};
  const itemKey=name=>plain(shopItemName(name)).toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/\s+/g,' ').trim();
  const KIT_ITEM_NAMES={'Кунаи':'Кунай','Сюрикены':'Сюрикен','Сенбоны':'Сенбон','Дымовые бомбы':'Дымовая бомба','Взрывные печати':'Взрывная печать','Световые бомбы':'Световая бомба','Свитки для хранения':'Свиток для хранения','Чистые свитки для хранения':'Свиток для хранения','Продовольственные пилюли':'Продовольственная пилюля','Боевые пилюли':'Боевая пилюля','Пилюли, восстанавливающие чакру на 10%':'Пилюля, восстанавливающая чакру на 10%','Соломенные шляпы':'Соломенная шляпа','Карты без пометок, чистые':'Карта без пометок, чистая'};
  const normalizeKitNames=kits=>kits.map(kit=>({...kit,items:(kit.items||[]).map(row=>Array.isArray(row)?[KIT_ITEM_NAMES[row[0]]||row[0],...row.slice(1)]:{...row,name:KIT_ITEM_NAMES[row.name]||row.name})}));
  const kitDescription=category=>(DEFAULT_KITS.find(k=>k.category===category||k.title===category)?.description||'');
  function totals(s) { return s.history.reduce((a,e) => ({money:num(a.money + num(e.money,'история денег',-Number.MAX_SAFE_INTEGER),'остаток денег'),xp:num(a.xp + num(e.xp,'история опыта',-Number.MAX_SAFE_INTEGER),'остаток опыта')}),{money:num(s.opening.money,'начальные деньги'),xp:num(s.opening.xp,'начальный опыт')}); }
  function validate(s) {
    if (!s || s.schema !== 1 || !s.name?.trim()) throw Error('Укажите имя персонажа; требуется формат данных версии 1.');
    s.currentPlayerId=playerId(s.currentPlayerId);
    num(s.revision,'версия'); num(s.level,'уровень',1,20); num(s.job.salary,'зарплата');if(s.jobs){const ids=new Set();for(const job of s.jobs){if(!job.title?.trim()||!job.id||ids.has(job.id))throw Error('Некорректная должность.');ids.add(job.id);num(job.salary,'ставка');if(!RANKS.slice(0,6).includes(job.rank))throw Error('Некорректный ранг работы.');}}
    for (const k of ['topicId','post2','post3']) if (s[k] && !/^\d+$/.test(String(s[k]))) throw Error('Неверный ID: '+k);
    delete s.elements;if(!Array.isArray(s.specializations))s.specializations=[];s.specializations=s.specializations.map(x=>String(x).trim()).filter(Boolean).slice(0,3);
    if(!Array.isArray(s.specializationTechniques))s.specializationTechniques=s.specializationTechnique?[typeof s.specializationTechnique==='string'?{name:s.specializationTechnique,url:''}:s.specializationTechnique]:[];delete s.specializationTechnique;s.specializationTechniques=s.specializationTechniques.filter(item=>item&&item.name?.trim()).slice(0,Math.max(0,3-s.specializations.length)).map(item=>({name:String(item.name).trim(),url:item.url?cleanUrl(item.url):''}));
    for (const k of ['inventory','property','missions','quests','history']) if (!Array.isArray(s[k])) throw Error('Неверный список: '+k);
    s.inventory.forEach(i => { normalizeItemLink(i); if (!i.name?.trim()) throw Error('У предмета нет названия.'); num(i.quantity,'количество предмета'); if(i.url)i.url=cleanUrl(i.url); });
    totals(s); return s;
  }
  function compactHistoryEntry(entry) {
    const out={id:String(entry.id||''),date:String(entry.date||''),reason:String(entry.reason||''),money:num(entry.money||0,'история денег',-Number.MAX_SAFE_INTEGER),xp:num(entry.xp||0,'история опыта',-Number.MAX_SAFE_INTEGER)};
    if(entry.url)out.url=cleanUrl(entry.url);
    return out;
  }
  function compactPlan(plan) {
    const out={id:String(plan.id||''),kind:String(plan.kind||'')};
    if(plan.from!==undefined)out.from=num(plan.from,'уровень до',1,20);
    if(plan.to!==undefined)out.to=num(plan.to,'уровень после',1,20);
    if(plan.age!==undefined&&plan.age!==null)out.age=num(plan.age,'возраст',0,300);
    if(Array.isArray(plan.slots))out.slots=RANKS.map((_,i)=>num(plan.slots[i]||0,'ячейки '+RANKS[i],0,100));
    return out;
  }
  function compactData(s) {
    const wire=clone(s);
    delete wire.lastBackup;delete wire._akcmWire;wire.legacy='';
    if(wire.pending?.plans?.length) {
      wire.pending={id:String(wire.pending.id||''),plans:wire.pending.plans.map(compactPlan).filter(plan=>plan.id)};
      if(!wire.pending.plans.length)wire.pending=null;
    } else wire.pending=null;
    wire.history=(wire.history||[]).map(compactHistoryEntry);
    return wire;
  }
  function parse(raw) {
    raw = String(raw || '');
    let m = raw.match(/AKCM_DATA_V1\s*([\s\S]*?)\s*AKCM_END_V1/);
    if (!m) m = decodeNumericEntities(raw).match(/AKCM_DATA_V1\s*([\s\S]*?)\s*AKCM_END_V1/);
    if (!m) return null;
    const data=JSON.parse(m[1]);
    if(data._akcmWire===1)delete data._akcmWire;
    delete data.lastBackup;data.legacy='';
    if(data.pending?.plans?.length)data.pending={id:String(data.pending.id||''),plans:data.pending.plans.map(compactPlan).filter(plan=>plan.id)};else data.pending=null;
    data.history=(data.history||[]).map(compactHistoryEntry);
    return validate(data);
  }
  function postLabelFromContent(post) {
    const text=decodeNumericEntities(post?.content?.innerText||post?.content?.textContent||'').replace(/\s+/g,' ').trim();
    const bold=text.match(/^\[b\]\s*([^\[]+?)\s*\[\/b\]/i);
    if(bold)return bold[1].trim();
    const beforeLevel=text.match(/^(.{1,80}?)(?:Уровень:|Опыт:|Кошел[её]к:|Версия:|Данные персонажа)/i);
    if(beforeLevel)return beforeLevel[1].trim();
    return (text.slice(0,80).trim()||'Пост '+post.id);
  }
  function decodeNumericEntities(text) {
    return String(text||'').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)));
  }
  function equivalentPost(expected,actual) {
    const norm=x=>decodeNumericEntities(x).replace(/\r\n/g,'\n').trim();
    if(norm(expected)===norm(actual))return true;
    try{const a=parse(expected),b=parse(actual);if(a&&b)return stable(a)===stable(b);if(a&&norm(actual).includes('AKCM_DATA_V1')&&norm(actual).includes('"revision": '+a.revision)&&a.history.at(-1)?.id&&norm(actual).includes(a.history.at(-1).id))return true;}catch(_){}
    return false;
  }
  function serialize(s) {
    validate(s);
    const wire=compactData(s);
    const json = JSON.stringify(wire).replace(/"(?:\\.|[^"\\])*"/g,token=>token.replace(/[<>&\[\]]/g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0')));
    const t = totals(s);
    return '[b]'+bb(s.name)+'[/b]\nУровень: '+s.level+' | Опыт: '+fmt(t.xp)+' | Кошелёк: '+fmt(t.money)+' рё\nВерсия: '+s.revision+(s.pending?' — требуется синхронизация':'')+'\n[spoiler="Данные персонажа — редактировать через панель"]\n[code]AKCM_DATA_V1\n'+json+'\nAKCM_END_V1[/code]\n[/spoiler]';
  }
  function transition(old, draft, op) {
    if (old.pending) throw Error('Сначала завершите предыдущую синхронизацию.');
    if (old.history.some(e=>e.id===op.id)) return clone(old);
    if (!op.reason?.trim()) throw Error('Укажите основание изменения.');
    const s = clone(draft); s.schema=1; s.revision=old.revision+1; s.history=clone(old.history); s.pending=null; s.legacy=old.legacy;
    const edits=[];
    for(const edit of op.historyEdits||[]) {const entry=s.history.find(e=>e.id===edit.id);if(!entry)throw Error('Запись истории не найдена.');const before=clone(entry);for(const k of ['money','xp'])entry[k]=num(edit[k],k,-Number.MAX_SAFE_INTEGER);entry.reason=String(edit.reason).trim();if(!entry.reason)throw Error('Укажите основание операции.');entry.url=cleanUrl(edit.url||'');if(entry.salary&&entry.money<0)throw Error('Зарплата не может быть отрицательной.');edits.push({field:'history',before,after:clone(entry)});}
    if (old.revision) s.opening=clone(old.opening);
    validate(s);
    if (s.level < old.level) throw Error('Понижение уровня не поддерживается.');
    const payJob=jobsOf(s).find(j=>j.id===op.jobId)||(!op.jobId?s.job:null);if(!payJob)throw Error('Выберите должность для зарплаты.');
    const months = num(op.months || 0,'число месяцев',0,120);
    if (months && (!payJob.title.trim() || !payJob.salary || !op.period?.trim())) throw Error('Для зарплаты укажите работу, ставку и период начисления.');
    if (months && s.history.some(e=>e.salary && (e.salary.jobId||'legacy')===(payJob.id||'legacy') && e.salary.period.trim().toLowerCase()===op.period.trim().toLowerCase())) throw Error('Зарплата за этот период уже начислена.');
    const signed = x => num(x,'изменение',-Number.MAX_SAFE_INTEGER);
    let money=signed(op.money||0), xp=signed(op.xp||0);
    money+=months*payJob.salary;
    const changes=edits;
    for (const key of ['name','level','age','currentPlayerId','topicId','post1','post2','post3','job','jobs','specializations','specializationTechniques','inventory','property','missions','quests','details']) if (stable(old[key])!==stable(s[key])) changes.push({field:key,before:clone(old[key]??null),after:clone(s[key]??null)});
    if(op.purchase) {const receipt=op.purchase;money-=num(receipt.amount,'сумма покупки');changes.push({field:'purchase',after:clone(receipt)});}
    if(op.living) {const months=num(op.living.months,'месяцы бытовых расходов',1,120),period=String(op.living.period||'').trim();if(!period)throw Error('Укажите период бытовых расходов.');if(s.history.some(e=>e.living?.period.toLowerCase()===period.toLowerCase()))throw Error('Бытовые расходы за этот период уже списаны.');op.living={months,period,rate:livingRate(s.age)};money-=months*op.living.rate;}
    if (old.privateNotes!==s.privateNotes) changes.push({field:'privateNotes'});
    const slots=RANKS.map((r,i)=>num((op.slots||[])[i]||0,'ячейки '+r,0,100));
    if(op.levelSlots) slots.forEach((_,i)=>slots[i]+=LEVEL_SLOTS[s.level][i]-LEVEL_SLOTS[old.level][i]);
    s.history.push({id:op.id,date:op.date||new Date().toISOString(),actor:typeof op.actor==='object'?{name:String(op.actor.name||'').trim(),url:cleanUrl(op.actor.url||'')}:String(op.actor||'').trim(),reason:op.reason.trim(),money,xp,levelFrom:old.level,levelTo:s.level,slots,salary:months?{months,rate:payJob.salary,period:op.period.trim(),jobId:payJob.id||'legacy',title:payJob.title}:null,changes});
    Object.assign(s.history.at(-1),{url:cleanUrl(op.url||''),living:op.living||null,purchase:op.purchase||null});
    validate(s); return s;
  }
  function transitionBatch(old,draft,operations) {
    if(!Array.isArray(operations)||!operations.length){const same=compactData(draft);same.revision=old.revision;validate(same);return same;}
    let current=old;
    operations.forEach((op,index)=>{current=transition(current,index?current:draft,op);});
    current.revision=old.revision+1;
    validate(current);return current;
  }
  function adminHistory(s) {
    const row=(a,b,c)=>'[tr][td]'+a+'[/td][td]'+b+'[/td][td]'+c+'[/td][/tr]',table=body=>'[table width=100%]'+body+'[/table]';
    const date=value=>{const parts=String(value).slice(0,10).split('-');return parts.length===3?parts.reverse().join('.'):value;};
    const ledger=(key,title,unit)=>{
      let balance=s.opening[key];const rows=[];
      s.history.forEach(e=>{balance+=e[key];if(!e[key])return;rows.push(row('[b]'+bb(date(e.date))+'[/b]\n'+(actorText(e.actor)?'Администратор: '+actorBb(e.actor)+'\n':'')+reasonBb(e),(e[key]>0?'+':'−')+fmt(Math.abs(e[key]))+' '+unit,fmt(balance)+' '+unit));});
      return '[spoiler="'+title+' · история операций"]\n'+table(row('[b]Дата и основание[/b]','[b]Изменение[/b]','[b]Итог[/b]')+row('Начальный остаток','',fmt(s.opening[key])+' '+unit)+rows.reverse().join(''))+'\n[/spoiler]';
    };
    return ledger('money','Кошелёк','рё')+'\n'+ledger('xp','Опыт','ед.');
  }
  function patchSecond(raw, from, to, slots) {
    const modern = /\[akcm\]/i.test(raw);
    if(modern){
      let count=0;
      let changed=raw.replace(/\[akcmtitle\]\s*Уровень\s+(\d+)\s*\[\/akcmtitle\]/gi,(_,level)=>{count++;if(Number(level)!==Number(from))throw Error('Уровень во втором посте отличается от хранилища.');return '[akcmtitle]Уровень '+to+'[/akcmtitle]';});
      if(count!==1)throw Error('Не найден единственный уровень во втором посте.');
      const seen=new Set();
      changed=changed.replace(/\[akcmrank\]([\s\S]*?)\[\/akcmrank\]/gi,(block,body)=>{
        const match=body.match(/\[akcmrankname\]\s*([EDCBASЕДСВА])\s*\[\/akcmrankname\]/i);if(!match)return block;
        const key=({'Е':'E','Д':'D','С':'C','В':'B','А':'A'})[match[1].toUpperCase()]||match[1].toUpperCase(),i=RANKS.indexOf(key);
        if(!slots[i])return block;if(seen.has(key))throw Error('Повторяется ранг '+key);seen.add(key);
        return block.replace(/\[\/akcmlist\]/i,Array(slots[i]).fill('[akcmitem][слот][/akcmitem]').join('\n')+'\n[/akcmlist]');
      });
      RANKS.slice(0,6).forEach((rank,i)=>{if(slots[i]&&!seen.has(rank))throw Error('Не найден ранг '+rank);});
      if(slots[6])changed+='\n'+Array(slots[6]).fill('- свободный слот техники любого ранга').join('\n');
      return akcmTemplateCode(changed);
    }
    let foundLevel=0;
    let output=raw.replace(/\[tr(?:[^\]]*)\][\s\S]*?\[\/tr\]/gi, row=>{
      const cells=[...row.matchAll(/\[td(?:[^\]]*)\]([\s\S]*?)\[\/td\]/gi)];
      if(cells.length!==2)return row;
      const label=plain(cells[0][1]);
      const replaceCell = value => row.slice(0,cells[1].index)+cells[1][0].replace(cells[1][1],()=>value)+row.slice(cells[1].index+cells[1][0].length);
      if(/^Уровень\s*:?$/i.test(label)) {
        foundLevel++;
        if(plain(cells[1][1])!==String(from))throw Error('Уровень во втором посте отличается от хранилища. Сначала согласуйте исходные данные.');
        return replaceCell(cells[1][1].replace(/\d+/,String(to)));
      }
      return row;
    });
    if(foundLevel!==1)throw Error('Не найдена единственная строка «Уровень» во втором посте.');
    const seen=new Set();
    output=output.replace(/\[tr(?:[^\]]*)\][\s\S]*?\[\/tr\]/gi,row=>{
      const cells=[...row.matchAll(/\[td(?:[^\]]*)\]([\s\S]*?)\[\/td\]/gi)];
      if(cells.length!==2)return row;
      const m=plain(cells[0][1]).match(/^Ранг\s*:?\s*([EDCBASЕДСВА])$/i); if(!m)return row;
      const rank=({'Е':'E','Д':'D','С':'C','В':'B','А':'A'})[m[1].toUpperCase()]||m[1].toUpperCase(),i=RANKS.indexOf(rank);
      if(!slots[i])return row;
      if(seen.has(rank))throw Error('Неоднозначная строка ранга '+rank); seen.add(rank);
      const insert='\n'+Array(slots[i]).fill('[слот]').join('\n');
      return row.slice(0,cells[1].index)+cells[1][0].replace(/\[\/td\]$/i,insert+'[/td]')+row.slice(cells[1].index+cells[1][0].length);
    });
    RANKS.slice(0,6).forEach((r,i)=>{if(slots[i]&&!seen.has(r))throw Error('Не найдена строка техник ранга '+r);});
    if(slots[6])output+='\n'+Array(slots[6]).fill('- свободный слот техники любого ранга').join('\n');
    return output;
  }
  function topicIdFromLink(value, base='https://akatsukigood.forum.cool') {
    if(!value.trim())return '';
    let u;try{u=new URL(value);}catch(_){throw Error('Укажите полную ссылку на тему личного дела.');}
    if(!['https:','http:'].includes(u.protocol)||u.origin!==new URL(base).origin||u.pathname!=='/viewtopic.php'||!/^\d+$/.test(u.searchParams.get('id')||''))throw Error('Нужна ссылка на тему личного дела этого форума: /viewtopic.php?id=…');
    num(u.searchParams.get('id'),'ID темы',1);return u.searchParams.get('id');
  }
  function card(s) {
    const t=totals(s),row=(a,b)=>'[tr][td]'+a+'[/td][td]'+b+'[/td][/tr]',table=body=>'[table width=100%]'+body+'[/table]',section=(title,body)=>'\n[shopsection]\n[shoptitle][align=center][size=18][b]'+title+'[/b][/size][/align][/shoptitle]\n[shopcontent]\n'+body+'\n[/shopcontent]\n[/shopsection]\n';
    const date=value=>{const parts=String(value).slice(0,10).split('-');return parts.length===3?parts.reverse().join('.'):value;};
    function ledger(key,title,unit) {
      let balance=s.opening[key];const entries=[];
      s.history.forEach(e=>{balance+=e[key];if(!e[key])return;
        const extra=key==='money'&&e.salary?'\n[i]Зарплата'+(e.salary.title?' — '+bb(e.salary.title):'')+': '+e.salary.months+' мес. × '+fmt(e.salary.rate)+' рё · '+bb(e.salary.period)+'[/i]':'';
        entries.push(row('[b]'+bb(date(e.date))+'[/b]\n'+reasonBb(e)+extra+'\n'+actorBb(e.actor),'[b][color='+(e[key]>0?'#28705a':'#a34c3f')+']'+(e[key]>0?'+':'−')+fmt(Math.abs(e[key]))+' '+unit+'[/color][/b]\n[i]Остаток: '+fmt(balance)+' '+unit+'[/i]'));
      });
      return section(title,table('[tr][td][align=center][size=22][b]'+fmt(t[key])+' '+unit+'[/b][/size][/align][/td][/tr]')+'\n[spoiler="История '+(key==='money'?'кошелька':'опыта')+' · '+entries.length+' операций"]\n'+table(row('[b]Начальный остаток[/b]',fmt(s.opening[key])+' '+unit)+entries.reverse().join(''))+'\n[/spoiler]\n');
    }
    let out='[widepost]\n[size=8]AKCM_CARD_V1[/size]\n[shopcard]\n';
    out+=ledger('money','Кошелёк','рё')+ledger('xp','Опыт','ед.');
    if(s.details)out+=section('Сведения',bb(s.details));
    if((s.specializations||[]).length||(s.specializationTechniques||[]).length){
      const specializationItems=(s.specializations||[]).map(name=>'◈ [b]'+bb(name)+'[/b]').concat((s.specializationTechniques||[]).map(item=>'✦ [i][b]'+(item.url?'[url='+cleanUrl(item.url)+']'+bb(item.name)+'[/url]':bb(item.name))+'[/b][/i]'));
      const specializationRows=[];for(let i=0;i<specializationItems.length;i+=3)specializationRows.push('[tr]'+specializationItems.slice(i,i+3).map(item=>'[td][align=center][size=14]'+item+'[/size][/align][/td]').join('')+'[/tr]');
      out+=section('Специализация','[table width=93%]'+specializationRows.join('')+'[/table]');
    }
    if(jobsOf(s).length)out+=section('Работа',jobsOf(s).map(j=>bb(j.title.replace(/\s*Ранг\s+[EDCBAS]\.?/gi,''))+' · ранг '+bb(j.rank||'E')+' · '+fmt(j.salary)+' рё / месяц').join('\n'));
    const groups=new Map();s.inventory.forEach(i=>{const key=i.category||'Личные вещи';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(i);});
    out+=section('Инвентарь',s.inventory.length?Array.from(groups,([category,items])=>{
      const artifact=/артефакт/i.test(category);
      const description=kitDescription(category);
      return '[spoiler="'+bb(category).replace(/"/g,'&quot;')+(artifact?'':' · '+items.length+' ед.')+'"]\n'+(description?bbInline(description)+'\n\n':'')+(artifact?items.map(itemTitle).join('\n\n'):table(row('[b]Предмет[/b]','[b]Кол-во / детали[/b]')+items.map(i=>row(itemTitle(i),fmt(i.quantity)+' '+bb(i.unit||'шт.')+(i.note?'\n'+bb(i.note):''))).join('')))+'\n[/spoiler]';
    }).join('\n'):'Пока пусто.');
    out+=section('Личное имущество',s.property.map(i=>'• '+itemTitle(i)+(i.note?' — '+bb(i.note):'')).join('\n')||'Не указано.');
    for(const [key,title]of [['missions','Выполненные миссии'],['quests','Выполненные квесты']]) {
      const rankColors={E:'#bd783d',D:'#008000',C:'#9370db',B:'#1e90ff',A:'#808080',S:'#ff0000'};
      const displayRanks=['D','C','B','A','S'];
      if(s[key].some(i=>i.rank==='E'))displayRanks.unshift('E');
      const counts=displayRanks.map(r=>'[color='+rankColors[r]+']ранг '+r+' - '+s[key].filter(i=>i.rank===r).length+'[/color]').join('  ‖  ');
      out+=section(title,(key==='missions'?'[align=center][b][i]'+counts+'[/i][/b][/align]\n':s[key].length?'[align=center][i]Завершено: '+s[key].length+'[/i][/align]\n':'')+(s[key].map(i=>{
        const rank='[b][i][color='+(rankColors[i.rank]||'#657675')+']'+(i.rank?'ранг '+bb(i.rank):'Квест')+'[/color][/i][/b]';
        return key==='missions'
          ?table(row('[size=16][b]'+bb(i.name)+'[/b][/size]\n'+rank,i.note?bb(i.note):'Награда не указана.'))
          :table(row('[size=16][b]'+bb(i.name)+'[/b][/size]'+(i.note?'\n'+bb(i.note):''),rank));
      }).join('\n')||'Пока нет.'));
    }
    return out+'[/shopcard]';
  }
  // The adapter reads the actual edit form, including its hidden tokens. No guessed CSRF fields.
  function forumAdapter(base = location.origin) {
    const origin=new URL(base).origin;
    if(origin!==location.origin)throw Error('Панель должна работать на основном домене форума.');
    const url=path=>{const u=new URL(path,base); if(u.origin!==origin)throw Error('Чужой домен запрещён.');return u.href;};
    async function page(path,init) {
      return akatsukiNetwork().request('manager:'+url(path),async()=>{
        const response=await fetch(url(path),{credentials:'same-origin',cache:'no-store',...init,signal:AbortSignal.timeout(30000)});
        if(!response.ok){const error=Error('Ошибка форума: HTTP '+response.status);error.status=response.status;const retry=response.headers.get('retry-after');error.retryAfter=/^\d+$/.test(retry||'')?Number(retry)*1000:Math.max(0,Date.parse(retry)-Date.now())||0;throw error;}
        if(new URL(response.url).origin!==origin)throw Error('Неожиданный адрес ответа.');
        const buffer=await response.arrayBuffer();
        const ascii=new TextDecoder('windows-1251').decode(buffer);
        const encoding=response.headers.get('content-type')?.match(/charset=([^;\s]+)/i)?.[1]||ascii.match(/charset\s*=\s*["']?([\w-]+)/i)?.[1]||'utf-8';
        const doc=new DOMParser().parseFromString(new TextDecoder(encoding).decode(buffer),'text/html');doc.akcmEncoding=encoding;return doc;
      },0);
    }

    async function edit(id) {
      num(id,'ID поста',1); const path='/edit.php?id='+id,doc=await page(path);
      const field=doc.querySelector('textarea[name="req_message"]');
      if(!field?.form)throw Error('Нет формы редактирования поста '+id+'. Проверьте вход и права администратора.');
      const action=url(field.form.getAttribute('action')||path);
      if(new URL(action).pathname!=='/edit.php'||new URL(action).searchParams.get('id')!==String(id))throw Error('Неожиданная форма редактирования.');
      return {id:String(id),raw:field.value,form:field.form,action,encoding:field.form.acceptCharset||doc.akcmEncoding};
    }
    async function prepareEdit(id,after) {
      const frame=document.createElement('iframe');
      frame.hidden=true;frame.setAttribute('aria-hidden','true');
      try {
        await new Promise((resolve,reject)=>{
          const timer=setTimeout(()=>reject(Error('Не загрузилась форма редактирования поста '+id)),30000);
          frame.onload=()=>{clearTimeout(timer);resolve();};
          frame.onerror=()=>{clearTimeout(timer);reject(Error('Ошибка загрузки редактора '+id));};
          frame.src=url('/edit.php?id='+id+'&_akcm='+Date.now());document.body.appendChild(frame);
        });
        const doc=frame.contentDocument,field=doc?.querySelector('textarea[name="req_message"]'),form=field?.form;
        if(!form)throw Error('Форма редактирования поста '+id+' недоступна.');
        const action=url(form.getAttribute('action'));
        if(new URL(action).pathname!=='/edit.php'||new URL(action).searchParams.get('id')!==String(id))throw Error('Неожиданная форма редактирования.');
        const raw=field.value;field.value=after;
        // MyBB creates per-form protection fields in its native submit handler.
        // Run it in the original document; never evaluate downloaded script text.
        return {raw,form,field,frame,action,encoding:form.acceptCharset||doc.characterSet,dispose:()=>frame.remove()};
      } catch(error){frame.remove();throw error;}
    }
    async function write(id,before,after,onWarn,strict=false) {
      const current=await edit(id);
      if(equivalentPost(after,current.raw))return {confirmed:true};
      if(strict&&!equivalentPost(before,current.raw))throw Error("Пост изменился после загрузки. Загрузите его заново.");
      const e=await prepareEdit(id,after);
      try {
      if(e.raw===after)return {confirmed:true};
      if(strict&&!equivalentPost(before,e.raw))throw Error("Пост изменился после загрузки. Загрузите его заново.");
      const submit=e.form.querySelector('input[type="submit"][name="update"],button[type="submit"][name="update"],input[type="submit"][name="submit"],button[type="submit"][name="submit"]');
      if(!submit)throw Error('В форме поста '+id+' не найдена кнопка сохранения update/submit. Пост не отправлен.');
      // Keep the editor's mirrored state in sync, then use the actual button's click handlers.
      const win=e.frame.contentWindow;
      Object.getOwnPropertyDescriptor(win.HTMLTextAreaElement.prototype,'value').set.call(e.field,after);
      e.field.dispatchEvent(new win.Event('input',{bubbles:true}));
      e.field.dispatchEvent(new win.Event('change',{bubbles:true}));
      let submittedText=null;const scriptErrors=[];win.addEventListener('error',event=>{if(event.message)scriptErrors.push(String(event.message).slice(0,180));});
      const formDataHandler=event=>{event.formData.set('req_message',after);submittedText=event.formData.get('req_message');};
      e.form.addEventListener('formdata',formDataHandler);
      // Native navigation preserves the editor's Referer, encoding and submit hooks.
      const result=await new Promise((resolve,reject)=>{
        const timer=setTimeout(()=>{e.frame.onload=null;reject(Error('Нет подтверждения отправки поста '+id+'. '+(scriptErrors.length?'Ошибка скрипта редактора: '+scriptErrors.join('; '):'Форма не завершила переход. Повторно загрузите данные перед новой попыткой.')));},30000);
        e.frame.onload=()=>{clearTimeout(timer);e.frame.onload=null;resolve(e.frame.contentDocument);};
        try {submit.click();}catch(error){clearTimeout(timer);reject(error);}
      });
      const redirect=result.querySelector('#pun-redirect');
      const acknowledged=redirect&&/Сообщение\s+отредактировано/i.test(redirect.textContent)&&Array.from(redirect.querySelectorAll('a[href]')).some(a=>{
        const target=new URL(a.getAttribute('href'),e.action);
        return target.origin===origin&&target.pathname==='/viewtopic.php'&&target.searchParams.get('pid')===String(id)&&target.hash==='#p'+id;
      });
      if(acknowledged)return {confirmed:true,confirmation:'forum-redirect'};
      const check=await edit(id);
      if(!equivalentPost(after,check.raw)) {
        const forumError=Array.from(result.querySelectorAll('#pun-main .info,#pun-main .error,#pun-main .message,.form-error,.warntext,.error,.notice')).map(x=>(x.textContent||'').replace(/\s+/g,' ').trim()).find(Boolean);
        const unchanged=equivalentPost(current.raw,check.raw);const feedback=forumError||result.querySelector('#pun-main h1')?.textContent?.trim()||result.title||'нет сообщения';throw Error('Не удалось подтвердить сохранение поста '+id+'. '+(unchanged?'После запроса остался прежний текст. ':'После запроса прочитан другой текст. ')+'Ответ форума: '+feedback.slice(0,700)+'. '+(submittedText===after?'Форма передала новый текст ('+after.length+' символов).':'Отправка через стандартную форму не зарегистрирована; возможно, её перехватил скрипт форума.'));
      }
      return {confirmed:true};
      } finally {e.dispose();}
    }
    async function posts(topicId, firstPageOnly=false) {
      num(topicId,'ID темы',1);const result=new Map(),queue=['/viewtopic.php?id='+topicId],visited=new Set();
      while(queue.length) {
        const path=queue.shift();if(visited.has(path))continue;visited.add(path);
        if(visited.size>200)throw Error('В теме больше 200 страниц.');
        const doc=firstPageOnly ? await akatsukiNetwork().document(url(path)) : await page(path);
        for(const content of doc.querySelectorAll('.post-content')) {
          const post=content.closest('.post'), id=post?.id?.match(/^p(\d+)$/)?.[1];
          if(id&&!result.has(id))result.set(id,{id,content});
        }
        if(firstPageOnly)break;
        for(const a of doc.querySelectorAll('.pagelink a[href],.pagination a[href]')) {
          const u=new URL(a.getAttribute('href'),base);u.hash='';
          if(u.origin===origin&&u.pathname==='/viewtopic.php'&&u.searchParams.get('id')===String(topicId))queue.push(u.pathname+u.search);
        }
      }
      if(!result.size)throw Error('Сообщения темы недоступны. Проверьте адрес и права.');
      return [...result.values()].sort((a,b)=>Number(a.id)-Number(b.id));
    }
    return {edit,write,posts,profile:id=>page('/profile.php?id='+playerId(id))};
  }
  function playerId(value) {
    const id=String(value??'').trim();
    if(!id)return '';
    if(!/^[1-9]\d*$/.test(id)||!Number.isSafeInteger(Number(id)))throw Error('Текущий игрок: укажите положительный ID профиля.');
    return id;
  }
  function serviceRequest(record,base='https://akatsukigood.forum.cool') {
    const content=record.content.cloneNode(true);
    content.querySelectorAll('blockquote,.quote-box,script,style,pre,code').forEach(n=>n.remove());
    content.querySelectorAll('br').forEach(n=>n.replaceWith('\n'));
    content.querySelectorAll('p,div').forEach(n=>n.appendChild(content.ownerDocument.createTextNode('\n')));
    const text=content.textContent.replace(/\u00a0/g,' ').trim();
    if(!/^Вычесть\s*:/im.test(text))return null;
    const match=/^\s*Вычесть:\s*([\d ]+)\s*\n\s*Поле:\s*([^\n]+)\s*\n\s*Комментарий:\s*([^\n]+)\s*$/i.exec(text);
    if(!match)throw Error('Неверный формат заявки p'+record.id+'.');
    if(!/^кошел[её]к$/i.test(match[2].trim()))throw Error('Поддерживается только поле «Кошелек».');
    const amount=Number(match[1].replace(/ /g,''));
    if(!Number.isSafeInteger(amount)||amount<=0)throw Error('Неверная сумма списания.');
    const pid=String(record.id).replace(/^p/,'');if(!/^[1-9]\d*$/.test(pid))throw Error('Не найден ID сообщения.');
    const post=record.content.closest('.post');
    let uid=post?.getAttribute('data-user-id')||'';
    if(!uid)for(const a of post?.querySelectorAll('.pa-author a[href],.post-author a[href],.pl-profile a[href],.post-links a[href]')||[]){const u=new URL(a.getAttribute('href'),base);if(u.origin===new URL(base).origin&&u.pathname==='/profile.php'&&u.searchParams.get('id')){uid=u.searchParams.get('id');break;}}
    if(!uid)throw Error('Не найден профиль автора p'+pid+'.');
    const comment=match[3].trim().replace(/\s+p\d+$/i,'');
    return {pid,userId:playerId(uid),amount,comment,reason:comment+' p'+pid,operationId:'service:550:p'+pid,url:new URL('/viewtopic.php?pid='+pid+'#p'+pid,base).href,record};
  }
  async function serviceRegistry(adapter,records) {
    const rows=[];
    for(const record of records){const current=await adapter.edit(record.id),state=parse(current.raw);if(!state)throw Error('Сначала перенесите запись p'+record.id+' в актуальный формат менеджера.');rows.push({id:String(record.id),state,raw:current.raw});}
    return rows;
  }
  async function serviceCharacter(adapter,request,registry,base='https://akatsukigood.forum.cool') {
    const explicit=registry.filter(r=>r.state.currentPlayerId===request.userId);
    if(explicit.length>1)throw Error('Профиль '+request.userId+' указан у нескольких персонажей.');
    if(explicit.length===1)return explicit[0];
    const authorField=request.record?.content.closest('.post')?.querySelector('.pa-fld2');
    const doc=authorField||await adapter.profile(request.userId);
    const scope=authorField||doc.querySelector('#profile')||doc.querySelector('#pun-main');
    if(!scope)throw Error('Не удалось прочитать ссылку на личное дело в профиле.');
    const topicIds=new Set();
    for(const a of scope.querySelectorAll('a[href]')){const u=new URL(a.getAttribute('href'),base);if(u.origin===new URL(base).origin&&u.pathname==='/viewtopic.php'&&u.searchParams.get('id'))topicIds.add(u.searchParams.get('id'));}
    const linked=registry.filter(r=>topicIds.has(String(r.state.topicId)));
    if(linked.length!==1)throw Error('По ссылке на личное дело не найден единственный персонаж. Укажите «Текущий игрок» в его записи.');
    if(linked[0].state.currentPlayerId&&linked[0].state.currentPlayerId!==request.userId)throw Error('У персонажа указан другой текущий игрок.');
    return linked[0];
  }
  function serviceExisting(registry,request) {
    const found=registry.flatMap(row=>row.state.history.filter(e=>e.id===request.operationId||e.reason===request.reason).map(event=>({row,event})));
    if(found.length>1)throw Error('Обнаружены несколько списаний для p'+request.pid+'.');
    if(found[0]&&(found[0].event.money!==-request.amount||found[0].event.reason!==request.reason))throw Error('Заявка изменена после списания. Требуется ручная проверка p'+request.pid+'.');
    return found[0]||null;
  }
  async function servicePreview(adapter,records,base) {
    const registry=await serviceRegistry(adapter,records),result=[];
    for(const record of await adapter.posts(550)){
      let request;
      try{request=serviceRequest(record,base);if(!request)continue;const existing=serviceExisting(registry,request);const target=existing?.row||await serviceCharacter(adapter,request,registry,base);result.push({request,targetId:target.id,name:target.state.name,repeated:!!existing&&!target.state.pending,resume:!!existing&&!!target.state.pending});}
      catch(error){result.push({request,pid:record.id,error:error.message});}
    }
    return result;
  }
  async function serviceDebit(adapter,records,request,actor,base,expectedTargetId) {
    // Reread source and persistent history before every write, including retries.
    const source=(await adapter.posts(550)).find(p=>String(p.id)===request.pid);
    if(!source)throw Error('Исходное сообщение удалено.');
    const latest=serviceRequest(source,base);
    if(!latest||latest.userId!==request.userId||latest.amount!==request.amount||latest.reason!==request.reason)throw Error('Заявка изменилась. Выполните разбор заново.');
    const registry=await serviceRegistry(adapter,records),existing=serviceExisting(registry,request);
    if(existing){if(existing.row.state.pending){if(existing.row.state.pending.id!==request.operationId)throw Error('Есть другая незавершённая операция.');await synchronize(adapter,existing.row.id,existing.row.raw,existing.row.state);}return {repeated:true,name:existing.row.state.name};}
    const target=await serviceCharacter(adapter,latest,registry,base),old=target.state;
    if(expectedTargetId&&target.id!==String(expectedTargetId))throw Error('Привязка персонажа изменилась. Выполните разбор заново.');
    if(old.pending)throw Error('Сначала завершите синхронизацию персонажа.');
    const next=transition(old,old,{id:request.operationId,actor,reason:request.reason,url:request.url,money:-request.amount,xp:0,slots:RANKS.map(()=>0),levelSlots:false});
    let firstWrite=true;
    const guarded={...adapter,write:async function(id,before,after,...args){if(String(id)===target.id&&firstWrite){const current=await adapter.edit(id);if(!equivalentPost(current.raw,target.raw))throw Error('Запись персонажа изменилась. Повторите разбор.');firstWrite=false;}return adapter.write(id,before,after,...args);}};
    await commit(guarded,target.id,target.raw,old,next);
    return {repeated:false,name:old.name};
  }

  function readLevel(raw) {const text=String(raw||'').replace(/\[[^\]]*\]|<[^>]*>/g,' ').replace(/&nbsp;|&#160;/gi,' '),match=/Уровень\s*:?\s*(\d+)/i.exec(text);if(!match)throw Error('Во втором посте ЛД не найден уровень.');return num(match[1],'уровень из второго поста ЛД',1,20);}
  async function activePersonalTopics(loadDoc,base){const queue=['/viewforum.php?id=144'],seen=new Set(),topics=new Set();while(queue.length){const path=queue.shift();if(seen.has(path))continue;seen.add(path);if(seen.size>100)throw Error('В разделе активных ЛД больше 100 страниц.');const doc=await loadDoc(path);if(!doc.querySelector('#pun-main,.main')||!doc.querySelector('.tclcon,.tcl,.forum-empty,.info'))throw Error('Не удалось прочитать раздел активных личных дел.');for(const a of doc.querySelectorAll('#pun-main .tcl a[href],.main .tcl a[href]')){if(a.closest('.imoved,.moved,.is-moved'))continue;const u=new URL(a.getAttribute('href'),base);if(u.origin===new URL(base).origin&&u.pathname==='/viewtopic.php'&&/^\d+$/.test(u.searchParams.get('id')||''))topics.add(u.searchParams.get('id'));}for(const a of doc.querySelectorAll('.pagelink a[href],.pagination a[href]')){const u=new URL(a.getAttribute('href'),base);if(u.origin===new URL(base).origin&&u.pathname==='/viewforum.php'&&u.searchParams.get('id')==='144'&&!seen.has(u.pathname+u.search))queue.push(u.pathname+u.search);}}return topics;}
  async function sourceLevel(adapter,state){if(!state.topicId)return null;const posts=await adapter.posts(state.topicId,true);if(posts.length<3)throw Error('В личном деле менее трёх сообщений.');if(state.post2&&String(state.post2)!==String(posts[1].id))throw Error('Второй пост ЛД не соответствует записи персонажа.');return readLevel((await adapter.edit(posts[1].id)).raw);}
  async function bulkExperience(adapter,ids,amount,comment,actor,batchId,onProgress,sourceRecords=[]){amount=num(amount,'сумма опыта',1,Number.MAX_SAFE_INTEGER);if(!Number.isSafeInteger(amount))throw Error('Опыт должен быть целым положительным числом.');comment=String(comment||'').trim();if(!comment)throw Error('Укажите общий комментарий.');if(!batchId||!ids.length)throw Error('Выберите персонажей.');const results=[];for(const id of [...new Set(ids.map(String))]){let name='Пост '+id;try{const current=await adapter.edit(id);let old=parse(current.raw);if(!old){const record=sourceRecords.find(p=>String(p.id)===id);if(!record?.content)throw Error('Сначала перенесите персонажа в актуальный формат реестра.');old=migrate(record.content,current.raw);}validate(old);name=old.name;const operationId='bulk:'+batchId+':'+id,existing=old.history.find(h=>h.id===operationId);if(existing){if(existing.xp!==amount||existing.reason!==comment)throw Error('Состав операции изменён. Начните новую массовую операцию.');if(old.pending){if(old.pending.id!==operationId)throw Error('Есть другая незавершённая операция.');await synchronize(adapter,id,current.raw,old);}results.push({id,name,ok:true,repeated:true});}else{if(old.pending)throw Error('Сначала завершите синхронизацию персонажа.');const level=await sourceLevel(adapter,old);if(level!==null)old={...old,level};const op={id:operationId,actor,money:0,xp:amount,reason:comment,slots:RANKS.map(()=>0),levelSlots:false};const next=transition(old,old,op);let firstWrite=true;const guarded={...adapter,write:async function(postId,before,after,step,...rest){if(String(postId)===id&&firstWrite){const latest=await adapter.edit(id);if(!equivalentPost(latest.raw,current.raw))throw Error('Запись изменилась во время начисления. Повторите операцию.');firstWrite=false;}return adapter.write(postId,before,after,step,...rest);}};await commit(guarded,id,current.raw,old,next);results.push({id,name,ok:true,repeated:false});}}catch(error){results.push({id,name,ok:false,error:error.message});}if(onProgress)onProgress(results.slice());}return results;}
  async function refreshCard(adapter,id,raw,state,onStep) {
    if(state.pending)throw Error('Сначала завершите синхронизацию операции.');
    if(!state.topicId)throw Error('Сначала сохраните ссылку на личное дело.');
    const current=await adapter.edit(id);
    if(!equivalentPost(raw,current.raw))throw Error('Данные менеджера изменились. Загрузите персонажа заново.');
    const posts=await adapter.posts(state.topicId,true),third=posts[2];
    if(!third||String(third.id)===String(id)||(state.post3&&String(state.post3)!==String(third.id)))throw Error('Третий пост не соответствует личному делу.');
    const existing=await adapter.edit(third.id);
    const actualLevel=await sourceLevel(adapter,state);await adapter.write(third.id,existing.raw,card(actualLevel===null?state:{...state,level:actualLevel}),onStep);
  }
  async function synchronize(adapter,id,raw,state,onStep) {
    if(!state.pending)return {raw,state};
    if(state.topicId){const posts=await adapter.posts(state.topicId),allowed=new Set(posts.slice(0,3).map(p=>String(p.id)));if(state.pending.plans.some(p=>!allowed.has(String(p.id))||String(p.id)===String(id)))throw Error('План синхронизации не соответствует личному делу. Проверьте ссылку и восстановите черновик из резервной копии.');}
    for(const plan of state.pending.plans){
      if(onStep)onStep('Записываю пост '+plan.id+'…');
      const current=await adapter.edit(plan.id);
      let after=plan.after;
      if(after===undefined) {
        if(plan.kind==='third'||String(plan.id)===String(state.post3))after=card(state);
        else if(plan.kind==='second'||String(plan.id)===String(state.post2)){
          try { patchSecond(current.raw,plan.to??state.level,plan.to??state.level,RANKS.map(()=>0)); after=current.raw; }
          catch(_) { after=patchSecond(current.raw,plan.from??state.level,plan.to??state.level,plan.slots||RANKS.map(()=>0)); }
        }
        else if(plan.kind==='age'||String(plan.id)===String(state.post1))after=patchAge(current.raw,plan.age??state.age);
        else throw Error('Не удалось восстановить компактный план синхронизации для поста '+plan.id+'.');
      }
      await adapter.write(plan.id,current.raw,after,onStep);
    }
    const done=clone(state);done.pending=null;delete done.lastBackup;
    const after=serialize(done);if(onStep)onStep('Подтверждаю версию в хранилище…');await adapter.write(id,raw,after,onStep);return {raw:after,state:done};
  }
  async function commit(adapter,id,raw,old,next,onStep) {
    if(onStep)onStep('Проверяю пост хранилища '+id+'…');
    const current=await adapter.edit(id);
    let storageRaw=current.raw;
    const plans=[];
    if(next.topicId) {
      if(onStep)onStep('Ищу посты темы личного дела '+next.topicId+'…');
      const posts=await adapter.posts(next.topicId);
      if(posts.length<3)throw Error('В личном деле должно быть не меньше трёх постов.');
      next.post1=posts[0].id;
      if(!next.post2)next.post2=posts[1].id;if(!next.post3)next.post3=posts[2].id;
      if(next.post2!==posts[1].id||next.post3!==posts[2].id)throw Error('ID не соответствуют второму и третьему постам выбранного личного дела.');
      if(new Set([String(id),next.post2,next.post3]).size!==3)throw Error('Нельзя использовать один пост для разных назначений.');
      const sourceSecond=await adapter.edit(next.post2),actualLevel=readLevel(sourceSecond.raw);next.level=actualLevel;
      const events=next.history.slice(old.history.length);events.forEach(event=>{event.levelFrom=actualLevel;event.levelTo=actualLevel;event.changes=(event.changes||[]).filter(change=>change.field!=='level');});
      const slots=RANKS.map((_,i)=>events.reduce((sum,event)=>sum+(event.slots?.[i]||0),0)),event=events.at(-1),needsSecond=slots.some(Boolean);
      if(next.age!==null&&next.age!==undefined&&next.age!==old.age){const first=await adapter.edit(next.post1),after=patchAge(first.raw,next.age);if(after!==first.raw)plans.push({id:next.post1,kind:'age',age:next.age,before:first.raw,after});}
      if(onStep)onStep('Готовлю изменения поста '+next.post3+(needsSecond?' и поста '+next.post2:'')+'…');
      if(needsSecond) {
        const second=sourceSecond;
        const after=patchSecond(second.raw,actualLevel,actualLevel,slots);
        if(after!==second.raw)plans.push({id:next.post2,kind:'second',from:actualLevel,to:actualLevel,slots,before:second.raw,after});
      }
      const third=await adapter.edit(next.post3);
      plans.push({id:next.post3,kind:'third',before:third.raw,after:card(next)});
    }
    delete next.lastBackup;
    next.pending=plans.length?{id:next.history.at(-1)?.id||('resave-'+Date.now()),plans}:null;
    const after=serialize(next);if(onStep)onStep('Записываю новую версию хранилища: '+fmt(after.length)+' символов…');await adapter.write(id,storageRaw,after,onStep);
    return synchronize(adapter,id,after,next,onStep);
  }
  function migrate(content,raw) {
    const text=content.innerText||content.textContent,s=fresh(text.split('\n').map(x=>x.trim()).find(Boolean)||'');s.legacy='Старый пост распознан при переносе; полный архив не хранится, чтобы не раздувать хранилище.';
    const amount=re=>Number((text.match(re)?.[1]||'0').replace(/\s/g,''));
    s.level=amount(/Уровень\s*:?\s*(\d+)/i)||1;
    s.opening.money=amount(/На данный момент в кошельке\s*([\d\s]+)/i);
    s.opening.xp=amount(/На данный момент у игрока\s*([\d\s]+)/i);
    s.job.salary=amount(/Зарплата[^\n]*?-\s*([\d\s]+)\s*рё/i);
    s.job.title=text.match(/Работа:\s*([^\n]+)/i)?.[1]||'';
    const link=Array.from(content.querySelectorAll('a[href]')).find(a=>/личное дело/i.test(a.textContent));
    if(link)s.topicId=new URL(link.getAttribute('href'),location.href).searchParams.get('id')||'';
    return s;
  }
  const themeFallbacks = {
    shinobi:{accent:'#de7444',hover:'#b66f4f',surface:'#fbf2e5',panel:'#fce6c8',soft:'#f7ebda',text:'#282627',muted:'#a29180',border:'#de7444',onAccent:'#fbf2e5'},
    oto:{accent:'#947faa',hover:'#a397b6',surface:'#e9e9e9',panel:'#fdfaf5',soft:'#e0dede',text:'#3c3b36',muted:'#565b68',border:'#e9e9e9',onAccent:'#e9e9e9'},
    akatsuki:{accent:'#863030',hover:'#b03b3b',surface:'#f5f1f1',panel:'#fbf8f8',soft:'#e8e3e3',text:'#282627',muted:'#6a5f5f',border:'#5b4c4c',onAccent:'#f5f1f1'},
    green:{accent:'#c86617',hover:'#ea7d00',surface:'#fcf4ed',panel:'#fbf8f8',soft:'#f9f0e1',text:'#282627',muted:'#6a5f5f',border:'#c86617',onAccent:'#fcf4ed'},
    kakashi:{accent:'#4ab9fe',hover:'#ace3fa',surface:'#363636',panel:'#474747',soft:'#414141',text:'#f1f4f4',muted:'#ace3fa',border:'#4ab9fe',onAccent:'#effdfd'}
  };
  function themeContext() {
    try {
      if(window.frameElement?.ownerDocument)return {win:window.frameElement.ownerDocument.defaultView||window.parent,doc:window.frameElement.ownerDocument};
      if(window.parent&&window.parent!==window&&window.parent.document)return {win:window.parent,doc:window.parent.document};
    } catch(_) {}
    return {win:window,doc:document};
  }
  function themeName(doc) {
    const names=Object.keys(themeFallbacks),html=doc.documentElement,body=doc.body,checked=doc.querySelector('input[name="switcher"]:checked');
    if(checked&&(checked.id||checked.value))return checked.id||checked.value;
    return names.find(n=>(html&&html.classList.contains(n))||(body&&body.classList.contains(n)))||'akatsuki';
  }
  function themeColor(ctx,property,fallback) {
    const mount=ctx.doc.body||ctx.doc.documentElement;if(!mount)return fallback;
    try{const direct=ctx.win.getComputedStyle(ctx.doc.documentElement).getPropertyValue(property).trim();if(direct&&!direct.includes('var('))return direct;}catch(_){}
    const probe=ctx.doc.createElement('span');probe.setAttribute('aria-hidden','true');probe.style.cssText='position:fixed;left:-9999px;top:-9999px;visibility:hidden;pointer-events:none;color:var('+property+','+fallback+')';mount.appendChild(probe);
    let value=fallback;try{value=ctx.win.getComputedStyle(probe).color||fallback;}catch(_){}probe.remove();return value;
  }
  function themeFont(ctx,property,fallback) {
    try{const value=ctx.win.getComputedStyle(ctx.doc.documentElement).getPropertyValue(property).trim();return value&&!value.includes('var(')?value:fallback;}catch(_){return fallback;}
  }
  function syncTheme(root) {
    if(!root||typeof window==='undefined')return;
    const ctx=themeContext(),name=themeName(ctx.doc),fallback=themeFallbacks[name]||themeFallbacks.akatsuki;
    const values={
      '--akcm-accent':themeColor(ctx,'--color-link',fallback.accent),
      '--akcm-hover':themeColor(ctx,'--color-hover',fallback.hover),
      '--akcm-surface':themeColor(ctx,'--color-forum',fallback.surface),
      '--akcm-panel':themeColor(ctx,'--color-qv',fallback.panel),
      '--akcm-soft':themeColor(ctx,'--color-lnthoverbg',fallback.soft),
      '--akcm-text':themeColor(ctx,'--color-txt1',fallback.text),
      '--akcm-muted':themeColor(ctx,'--color-txt2',fallback.muted),
      '--akcm-border':themeColor(ctx,'--color-sub-border',fallback.border),
      '--akcm-on-accent':themeColor(ctx,'--color-txt3',fallback.onAccent),
      '--akcm-shadow':themeColor(ctx,'--shedow1','rgba(0, 0, 0, .18)'),
      '--akcm-font-body':themeFont(ctx,'--font-g','Nunito Sans')+', Arial, sans-serif',
      '--akcm-font-heading':themeFont(ctx,'--font','Oswald')+', Arial, sans-serif'
    };
    Object.keys(values).forEach(k=>root.style.setProperty(k,values[k]));root.setAttribute('data-theme',name);
  }
  function watchTheme(root) {
    syncTheme(root);
    try{const ctx=themeContext(),observer=new MutationObserver(()=>syncTheme(root));observer.observe(ctx.doc.documentElement,{attributes:true,attributeFilter:['class','style']});if(ctx.doc.body)observer.observe(ctx.doc.body,{attributes:true,attributeFilter:['class','style']});}catch(_){}
  }
  function boot() {
    if(document.querySelector('#akcm-style'))return;
    const style=document.createElement('style');style.id='akcm-style';style.textContent=CSS;document.head.append(style);
    for(const content of document.querySelectorAll('.post-content')){
      const markers=Array.from(content.querySelectorAll('span')).filter(n=>n.textContent.trim()==='AKCM_CARD_V1'&&!n.closest('pre,code'));
      markers.forEach(marker=>marker.remove());
    }
    const config=window.AKATSUKI_CHARACTER_MANAGER||{};
    const current=new URL(location.href).searchParams.get('id');
    if(current!==String(config.storageTopicId||492))return;
    const mount=document.querySelector(config.mountSelector||'.post .post-content');if(!mount)return;
    const root=document.createElement('div');root.className='akcm';mount.replaceChildren(root);
    watchTheme(root);
    panel(root,config);
  }
  function panel(root,config,providedAdapter) {
    const forumBase=config.baseUrl||'https://akatsukigood.forum.cool';
    const categories=config.inventoryCategories||['Личные вещи','Набор шиноби','Медицинский набор','Косметический набор куноичи','Набор Акацуки','Артефакты','Броня и защита','Оружие','Метательное','Расходники'];
    const adapter=providedAdapter||forumAdapter();let selected=null,raw='',state=null,busy=false,records=[],draftOp=null,lists={},historyEdits=[],purchase=null,firstAge=null,jobs=[],artifactReads=new Map(),operationQueue=[],serviceRows=[],kits=normalizeKitNames(clone(config.inventoryKits||DEFAULT_KITS)),shopCatalog={items:[],loaded:false,promise:null},specializationCatalog={types:[],allTechniques:[],techniques:[],mastersLoaded:false,loaded:false};
    root.innerHTML='<header><small>АДМИНИСТРАТОРСКАЯ · РЕЕСТР ПЕРСОНАЖЕЙ</small><h2>Управление личными делами</h2><p>Все изменения сохраняются по кнопке «Применить».</p></header><div class="akcm-toolbar" role="tablist"><button type="button" role="tab" aria-selected="false" data-action="bulk-tab">Массовые операции</button><button type="button" role="tab" aria-selected="true" data-action="registry-tab">Реестр персонажей</button><button type="button" role="tab" aria-selected="false" data-action="events-tab">Ивенты и внимание</button><button type="button" role="tab" aria-selected="false" data-action="service-tab">Менеджер служебной темы</button><button type="button" role="tab" aria-selected="false" data-action="postcount-tab">Подсчёт постов</button></div><div id="akcm-registry-view"><div class="akcm-registry-controls"><div class="akcm-registry-filters"><label class="akcm-registry-search-label">Поиск персонажа<input type="search" id="akcm-registry-search" placeholder="Введите имя персонажа" autocomplete="off"></label><label class="akcm-registry-active"><input type="checkbox" id="akcm-active-only" checked><span>Только активные</span></label><button class="akcm-registry-refresh" type="button" data-action="list">Обновить список</button></div><div class="akcm-registry-picker"><label>Персонаж<select aria-label="Персонаж" id="akcm-character"><option value="">Выберите персонажа</option></select></label><button class="akcm-primary" type="button" data-action="load">Загрузить данные</button></div></div><p role="status" id="akcm-status">Один персонаж — один пост в теме хранилища.</p><p id="akcm-registry-filter-status" role="status"></p><div id="akcm-editor"></div></div><div id="akcm-bulk-view" hidden><h3>Начислить опыт</h3><p>Одна сумма и один комментарий будут записаны каждому выбранному персонажу.</p><label class="akcm-bulk-search">Поиск персонажа<input id="akcm-bulk-search" type="search" placeholder="Начните вводить имя" autocomplete="off"></label><p id="akcm-bulk-selection" role="status" aria-live="polite"></p><div id="akcm-bulk-characters"></div><p id="akcm-bulk-empty" hidden>Персонажи не найдены.</p><label>Сумма опыта<input id="akcm-bulk-amount" type="number" min="1" step="1"></label><label>Комментарий<textarea id="akcm-bulk-comment"></textarea></label><div class="akcm-toolbar"><button type="button" data-action="bulk-apply">Начислить опыт выбранным</button><button type="button" data-action="bulk-new">Новая массовая операция</button></div><p id="akcm-bulk-status" role="status"></p><div id="akcm-bulk-results"></div></div><div id="akcm-events-view" hidden><div data-ak-events-admin></div></div><div id="akcm-postcount-view" hidden></div>';
    root.insertAdjacentHTML('beforeend','<div id="akcm-service-view" hidden><h3>Менеджер служебной темы №550</h3><p>Разберите сообщения, проверьте персонажей и выберите списания. Уже записанные операции будут пропущены.</p><button type="button" data-action="service-scan">Разобрать тему 550</button><div id="akcm-service-rows"></div><button type="button" data-action="service-apply">Применить выбранные списания</button><p id="akcm-service-status" role="status"></p></div>');
    const q=sel=>root.querySelector(sel), val=id=>q('#akcm-'+id)?.value||'', message=(text,error=false)=>{q('#akcm-status').textContent=text;q('#akcm-status').classList.toggle('error',error);const local=q('#akcm-action-status');if(local){local.textContent=text;local.classList.toggle('error',error);}};
    let technicalSnapshot=null,firstSnapshot=null,levelLoaded=false,bulkBatch=null,activeTopics=null,activeRequest=null;const bulkCacheKey='akcm-bulk-xp:'+String(window.UserID||'');try{bulkBatch=JSON.parse(localStorage.getItem(bulkCacheKey)||'null');}catch(_){}
    const field=(id,label,value='',type='text')=>'<label>'+esc(label)+'<input id="akcm-'+id+'" type="'+type+'" value="'+esc(value)+'"></label>';
    const area=(id,label,value='')=>'<label>'+esc(label)+'<textarea id="akcm-'+id+'">'+esc(value)+'</textarea></label>';
    const widths={inventory:['250px','170px','120px','90px','240px','240px','42px'],property:['340px','520px','42px'],missions:['360px','90px','520px','42px'],quests:['360px','90px','520px','42px']};
    const table=(key,title,columns)=>'<section><h3>'+title+'</h3>'+(key==='inventory'?'<div class="akcm-shop-picker"><h4>Добавить из магазина</h4><div class="akcm-grid">'+field('shopSearch','Поиск товара')+'<label>Категория магазина<select id="akcm-shopCategory"><option value="">Все категории</option></select></label><label>Предмет<select id="akcm-shopItem"><option value="">Загрузка каталога…</option></select></label>'+field('shopQuantity','Количество',1,'number')+'</div><button type="button" data-add-shop-item>＋ Добавить товар в инвентарь</button><p id="akcm-shopStatus">Загрузка каталога магазина…</p></div><div class="akcm-grid">'+field('search','Поиск по имени')+'<label>Категория<select id="akcm-filter"><option value="">Все категории</option>'+inventoryCategories().map(c=>'<option>'+esc(c)+'</option>').join('')+'</select></label></div><div class="akcm-kitbar"><label>Добавить набор<select id="akcm-kit">'+kits.map(k=>'<option value="'+esc(k.id)+'">'+esc(k.title)+'</option>').join('')+'</select></label><button type="button" data-add-kit>＋ Добавить стандартный набор</button><p id="akcm-kit-description" class="akcm-kit-description"></p></div>':'')+'<div class="akcm-records" data-list="'+key+'"></div><button type="button" data-add="'+key+'">＋ Добавить вручную</button><div data-form="'+key+'"></div>'+(key==='inventory'?'<details class="akcm-kit-editor"><summary>Редактировать наборы</summary>'+area('kitsJson','Наборы JSON',JSON.stringify(kits,null,2))+'<button type="button" data-save-kits>Сохранить наборы в панели</button></details>':'')+'</section>';
    const columns={inventory:[['name','Предмет'],['category','Категория'],['quantity','Количество'],['unit','Ед.'],['note','Примечание'],['url','Ссылка']],property:[['name','Объект'],['note','Описание'],['url','Ссылка']],missions:[['name','Миссия'],['rank','Ранг'],['note','Результат / награда']],quests:[['name','Квест'],['rank','Ранг'],['note','Результат / награда']]};
    function specializationEditor(){
      const values=(state.specializations||[]).slice(0,3),techniques=(state.specializationTechniques||[]).slice(0,3);
      const allTypes=[...new Set(specializationCatalog.types.concat(values))];
      const allTechniques=specializationCatalog.techniques.concat(techniques.filter(saved=>!specializationCatalog.techniques.some(item=>item.url===saved.url)).map(saved=>({name:saved.name,url:saved.url,rank:''})));
      const typeList=allTypes.map(item=>'<label class="akcm-choice" data-specialization-search="'+esc(item.toLocaleLowerCase('ru'))+'"><input type="checkbox" class="akcm-specialization-check" value="'+esc(item)+'"'+(values.includes(item)?' checked':'')+'><span>'+esc(item)+'</span></label>').join('')||'<p>Типы ещё загружаются…</p>';
      const techniqueList=allTechniques.map(item=>'<label class="akcm-choice" data-technique-search="'+esc(item.name.toLocaleLowerCase('ru'))+'"><input type="checkbox" class="akcm-specialization-technique-check" value="'+esc(item.url)+'" data-name="'+esc(item.name)+'"'+(techniques.some(saved=>saved.url===item.url)?' checked':'')+'><span>'+(item.rank?'<small>'+esc(item.rank)+'</small> ':'')+esc(item.name)+'</span></label>').join('')||'<p>В личном деле не найдены техники.</p>';
      return '<details id="akcm-specialization"><summary>Специализация</summary><p><b>До трёх специализаций всего, включая конкретные техники.</b> Ниндзюцу, Тайдзюцу, Сендзюцу и Техники Животных исключены.</p><label>Поиск специализации<input id="akcm-specializationSearch" placeholder="Начните вводить название"></label><div class="akcm-choice-list" id="akcm-specializationList">'+typeList+'</div><h4>Специализация на определённых техниках</h4><label>Поиск техники персонажа<input id="akcm-specializationTechniqueSearch" placeholder="Начните вводить название"></label><div class="akcm-choice-list" id="akcm-specializationTechniqueList">'+techniqueList+'</div><p id="akcm-specializationStatus">'+(specializationCatalog.loaded?'Каталоги загружены.':'Каталог загрузится при открытии блока.')+'</p></details>';
    }
    async function preloadSpecializationCatalog(){
      if(specializationCatalog.mastersLoaded)return;
      const topics=await Promise.all([74,75,76,77,78,79].map(id=>adapter.posts(id,true)));
      const techniques=[];
      topics.forEach((posts,index)=>{const rank=RANKS[index];const master=posts[0]?.content;if(!master)return;for(const row of master.querySelectorAll('table tr')){const cells=row.querySelectorAll('td,th');if(cells.length<2)continue;const type=plain(cells[0].textContent).replace(/дзютсу/gi,'дзюцу').trim();if(!type)continue;for(const link of cells[1].querySelectorAll('a[href*="#p"]')){const postId=(link.getAttribute('href')||'').match(/#p(\d+)/)?.[1];const name=plain(link.textContent);if(postId&&name)techniques.push({postId,name,type,rank,url:new URL(link.getAttribute('href'),forumBase).href});}}});
      const blocked=/^(?:нин(?:дзю|джу)цу|тай(?:дзю|джу)цу|сен(?:дзю|джу)цу|техники\s+животных)$/i;
      specializationCatalog.types=[...new Set(techniques.map(item=>item.type).filter(type=>!blocked.test(type)))].sort((a,b)=>a.localeCompare(b,'ru'));
      specializationCatalog.allTechniques=techniques;
      specializationCatalog.mastersLoaded=true;
    }
    async function loadSpecializationCatalog(){
      const target=state,container=q('#akcm-specialization');
      await preloadSpecializationCatalog();
      if(state!==target||q('#akcm-specialization')!==container)return;
      specializationCatalog.techniques=[];
      if(target.topicId){const posts=await adapter.posts(target.topicId);if(state!==target||q('#akcm-specialization')!==container)return;const second=posts[1]?.content,owned=new Set();if(second)for(const link of second.querySelectorAll('a[href*="#p"]')){const id=(link.getAttribute('href')||'').match(/#p(\d+)/)?.[1];if(id)owned.add(id);}specializationCatalog.techniques=specializationCatalog.allTechniques.filter(item=>owned.has(item.postId));}
      specializationCatalog.loaded=true;
      const oldValues=Array.from(root.querySelectorAll('.akcm-specialization-check:checked')).map(input=>input.value),oldTechniques=Array.from(root.querySelectorAll('.akcm-specialization-technique-check:checked')).map(input=>input.value);
      if(q('#akcm-specialization')){const opened=q('#akcm-specialization').open;q('#akcm-specialization').outerHTML=specializationEditor();q('#akcm-specialization').open=opened;root.querySelectorAll('.akcm-specialization-check').forEach(input=>{if(oldValues.includes(input.value))input.checked=true;});root.querySelectorAll('.akcm-specialization-technique-check').forEach(input=>{if(oldTechniques.includes(input.value))input.checked=true;});updateSpecializationChecks();}
    }
    function updateSpecializationChecks(){const inputs=Array.from(root.querySelectorAll('.akcm-specialization-check,.akcm-specialization-technique-check')),count=inputs.filter(input=>input.checked).length;inputs.forEach(input=>input.disabled=!input.checked&&count>=3);}
    function currentAdmin() {
      if(config.actor&&typeof config.actor==='object')return config.actor;
      const bad=/^(профиль|profile|личные сообщения|сообщения|выход|выйти|logout|login|войти|регистрация|register)$/i;
      const selectors=['#pun-status a[href*="profile.php?id="]','#pun-status a[href*="/profile.php?id="]','.punbb a[href*="profile.php?id="]','a[href*="/profile.php?id="]'];
      const generic=Array.from(document.querySelectorAll(selectors.join(','))).find(node=>bad.test(node.textContent.trim()));
      const globals=[window.UserLogin,window.username,window.UserName,window.GroupUserName].map(x=>String(x||'').trim()).find(x=>x&&!bad.test(x));
      if(globals)return {name:globals,url:generic?new URL(generic.getAttribute('href')||'',location.href).href:(window.UserID?new URL('/profile.php?id='+window.UserID,location.href).href:'')};
      for(const sel of selectors)for(const node of document.querySelectorAll(sel)){
        const text=node.textContent.trim(),href=node.getAttribute('href')||'';
        if(text&&!bad.test(text))return {name:text,url:new URL(href,location.href).href};
      }
      const status=document.querySelector('#pun-status')?.textContent?.replace(/\s+/g,' ').trim()||'';
      const named=status.match(/(?:как|as)\s+([^.,;]+)/i)?.[1]?.trim();
      if(named&&!bad.test(named))return {name:named,url:generic?new URL(generic.getAttribute('href')||'',location.href).href:''};
      return typeof config.actor==='string'?{name:config.actor,url:''}:{name:'',url:''};
    }
    function listDiff(title,before,after,format=x=>x.name) {
      const oldMap=new Map(before.map(x=>[stable(x),x])),newMap=new Map(after.map(x=>[stable(x),x]));
      const added=after.filter(x=>!oldMap.has(stable(x))),removed=before.filter(x=>!newMap.has(stable(x)));
      if(!added.length&&!removed.length)return '';
      return '<details open><summary>'+esc(title)+'</summary>'+(added.length?'<h4>Добавлено</h4><ul>'+added.map(x=>'<li>'+titleHtml(x)+esc(format(x).slice(String(x.name||'').length))+'</li>').join('')+'</ul>':'')+(removed.length?'<h4>Удалено</h4><ul>'+removed.map(x=>'<li>'+titleHtml(x)+esc(format(x).slice(String(x.name||'').length))+'</li>').join('')+'</ul>':'')+'</details>';
    }
    function diffLayout(html){return html.replace(/<table>/g,'<div class="akcm-diff-table" role="table">').replace(/<\/table>/g,'</div>').replace(/<\/?(?:thead|tbody)>/g,'').replace(/<tr>/g,'<div class="akcm-diff-row" role="row">').replace(/<\/tr>/g,'</div>').replace(/<th>/g,'<div class="akcm-diff-cell akcm-diff-heading" role="columnheader">').replace(/<td>/g,'<div class="akcm-diff-cell" role="cell">').replace(/<\/(?:th|td)>/g,'</div>');}
    function previewDiff(old,next) {
      const events=next.history.slice(old.history.length),event=events.at(-1),parts=[],totalOld=totals(old),totalNext=totals(next);
      const push=(label,before,after)=>{if(JSON.stringify(before)!==JSON.stringify(after))parts.push('<tr><td>'+esc(label)+'</td><td>'+esc(before)+'</td><td>'+esc(after)+'</td></tr>');};
      push('Текущий игрок',old.currentPlayerId||'не указан',next.currentPlayerId||'не указан');push('Версия',old.revision,next.revision);push('Уровень',old.level,next.level);push('Кошелёк',fmt(totalOld.money)+' рё',fmt(totalNext.money)+' рё');push('Опыт',fmt(totalOld.xp)+' ед.',fmt(totalNext.xp)+' ед.');push('Тема личного дела',old.topicId?forumBase+'/viewtopic.php?id='+old.topicId:'не указана',next.topicId?forumBase+'/viewtopic.php?id='+next.topicId:'не указана');
      const allSlots=RANKS.map((_,i)=>events.reduce((sum,item)=>sum+(item.slots?.[i]||0),0));if(allSlots.some(Boolean))parts.push('<tr><td>Ячейки техник</td><td></td><td>'+esc(allSlots.map((n,i)=>n?RANKS[i]+' +'+n:'').filter(Boolean).join(', '))+'</td></tr>');
      push('Возраст',old.age??'не указан',next.age??'не указан');const jobText=j=>j.title?j.title+' · ранг '+(j.rank||j.title.match(/Ранг\s+([EDCBAS])/i)?.[1]||'E')+' · '+fmt(j.salary)+' рё / месяц':'Не указана';push('Работы',jobsOf(old).map(jobText).join('\n'),jobsOf(next).map(jobText).join('\n'));
      for(const change of events.flatMap(e=>e.changes||[]).filter(c=>c.field==='history'))push('Исправление истории',change.before.reason+' · '+fmt(change.before.money)+' рё · '+fmt(change.before.xp)+' опыта',change.after.reason+' · '+fmt(change.after.money)+' рё · '+fmt(change.after.xp)+' опыта');
      const tables=listDiff('Инвентарь',old.inventory,next.inventory,x=>x.name+' · '+(x.category||'Личные вещи')+' · '+fmt(x.quantity||0)+' '+(x.unit||'шт.'))+listDiff('Личное имущество',old.property,next.property,x=>x.name)+listDiff('Миссии',old.missions,next.missions,x=>x.name+' · ранг '+(x.rank||''))+listDiff('Квесты',old.quests,next.quests,x=>x.name+' · '+(x.rank||''));
      const actor=event?.actor||currentAdmin();
      return '<div class="akcm-diff"><h3>Предпросмотр изменений</h3><p>Операцию внесёт: <b>'+linkHtml(actorUrl(actor),actorText(actor)||'не определён')+'</b></p>'+(parts.length?'<table><thead><tr><th>Поле</th><th>Было</th><th>Станет</th></tr></thead><tbody>'+parts.join('')+'</tbody></table>':'<p>Списки и основные поля не изменятся, но операция всё равно добавит запись в историю и увеличит версию.</p>')+tables+'<details><summary>ID и план записи</summary><ul><li>Пост хранилища: '+esc(selected)+' — будет перезаписан всегда</li>'+(next.topicId?(next.age!==old.age?'<li>Пост 1: '+esc(next.post1||'определяется')+' — обновится возраст</li>':'')+'<li>Пост 2: '+esc(next.post2||'будет определён при применении')+' — изменится при уровне или ячейках</li><li>Пост 3: '+esc(next.post3||'будет определён при применении')+' — будет заменён публичной карточкой</li>':'<li>Личное дело не указано: обновится только хранилище.</li>')+'</ul></details><details><summary>Публичная карточка (BBCode)</summary><pre>'+esc(card(next))+'</pre></details></div>';
    }
    function adminHistoryView(s) {
      const t=totals(s),money=s.history.filter(e=>e.money),xp=s.history.filter(e=>e.xp),date=v=>String(v||'').slice(0,10).split('-').reverse().join('.');
      const rows=list=>list.slice().reverse().map(e=>'<tr><td>'+esc(date(e.date))+'</td><td>'+linkHtml(actorUrl(e.actor),actorText(e.actor))+'</td><td>'+esc(e.reason)+'</td><td>'+esc((e.money||e.xp)>0?'+':'−')+fmt(Math.abs(e.money||e.xp))+'</td></tr>').join('');
      return '<section class="akcm-admin-history"><h3>История изменений</h3><div class="akcm-grid"><div><b>Кошелёк:</b> '+fmt(t.money)+' рё</div><div><b>Опыт:</b> '+fmt(t.xp)+' ед.</div><div><b>Версия:</b> '+fmt(s.revision)+'</div></div><details><summary>История кошелька · '+money.length+' операций</summary><table><thead><tr><th>Дата</th><th>Админ</th><th>Основание</th><th>Сумма</th></tr></thead><tbody>'+rows(money)+'</tbody></table></details><details><summary>История опыта · '+xp.length+' операций</summary><table><thead><tr><th>Дата</th><th>Админ</th><th>Основание</th><th>Опыт</th></tr></thead><tbody>'+rows(xp)+'</tbody></table></details></section>';
    }
    function titleHtml(item) {let text=esc(plain(item.name)),color=String(item.name).match(/\[color=(#[0-9a-f]{3,6}|[a-z]+)\]/i)?.[1];if(color)text='<span style="color:'+esc(color)+'">'+text+'</span>';return item.url?'<a href="'+esc(cleanUrl(item.url))+'" target="_blank" rel="noopener">'+text+'</a>':text;}
    function inventoryCategories(){return [...new Set([...categories,...kits.map(k=>k.category).filter(Boolean),...(lists.inventory||[]).map(i=>i.category).filter(Boolean)])];}
    function shopInventoryCategory(section,type,topicId,name){
      const text=plain([section,type,name].join(' ')).toLocaleLowerCase('ru').replace(/ё/g,'е');
      if(topicId===83||/медицин|препарат|лекар|антидот|противояд/.test(text))return 'Медицинский набор';
      if(topicId===81||/кукл|марионет/.test(text))return 'Куклы';
      if(/артефакт|особенн/.test(text))return 'Артефакты';
      if(/щит/.test(text))return 'Щиты';
      if(/брон|защит|жилет|доспех/.test(text))return 'Броня и защита';
      if(/метательн/.test(text))return 'Метательное';
      if(/расход|боеприпас|снаряд|стрел[аы]|бомб|печать|сенбон|сюрикен|дополнительное оружие/.test(text))return 'Расходники';
      if(/оруж|вооруж|клин|меч|катан|лук|арбалет|копье|посох/.test(text))return 'Оружие';
      return 'Личные вещи';
    }
    function parseShopCatalogPost(post,source){
      const result=[],content=post.content,postUrl=forumBase+'/viewtopic.php?id='+source.id+'#p'+post.id;
      for(const box of content.querySelectorAll('.spoiler-box')){
        const heading=box.querySelector(':scope > div:first-child,.spoiler-title');
        const section=plain(heading?.textContent).replace(/^стандартн(?:ый|ая|ое|ые)\s+/i,'');
        if(!section||/шаблон|пример|образец|код для вставки|оформление/i.test(section))continue;
        for(const table of box.querySelectorAll('table')){
          if(!table.rows||table.rows.length<2)continue;
          const headers=Array.from(table.rows[0].cells,cell=>plain(cell.textContent));
          let nameIndex=headers.findIndex(header=>/^назван/i.test(header));
          const priceIndex=headers.findIndex(header=>/стоим/i.test(header));
          const puppetTemplate=source.id===81&&/марионет/i.test(section)&&headers.some(header=>/^ранг$/i.test(header));
          if((nameIndex<0&&!puppetTemplate)||priceIndex<0)continue;
          if(nameIndex<0)nameIndex=headers.findIndex(header=>/^ранг$/i.test(header));
          const typeIndex=headers.findIndex(header=>/^тип$/i.test(header)),descriptionIndex=headers.findIndex(header=>/^описание$/i.test(header));
          Array.from(table.rows).slice(1).forEach((row,index)=>{
            if(!row.cells[nameIndex])return;
            const name=puppetTemplate?'Стандартная марионетка '+plain(row.cells[nameIndex].textContent)+'-ранга':plain(row.cells[nameIndex].textContent);
            if(!name||name==='-')return;
            const type=typeIndex>=0&&row.cells[typeIndex]?plain(row.cells[typeIndex].textContent):'';
            const note=descriptionIndex>=0&&row.cells[descriptionIndex]?plain(row.cells[descriptionIndex].textContent):'';
            const link=row.cells[nameIndex].querySelector('a[href]');
            result.push({id:'shop-'+source.id+'-'+post.id+'-'+index+'-'+result.length,name,category:shopInventoryCategory(section,type,source.id,name),shopCategory:section,type,note,url:link?new URL(link.getAttribute('href'),postUrl).href:postUrl});
          });
        }
      }
      return result;
    }
    function renderShopCatalog(){
      const picker=q('#akcm-shopItem'),category=q('#akcm-shopCategory');if(!picker||!category)return;
      const chosen=category.value,allCategories=[...new Set(shopCatalog.items.map(item=>item.shopCategory).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ru'));
      category.innerHTML='<option value="">Все категории</option>'+allCategories.map(value=>'<option'+(value===chosen?' selected':'')+'>'+esc(value)+'</option>').join('');
      const search=plain(val('shopSearch')).toLocaleLowerCase('ru');
      const visible=shopCatalog.items.filter(item=>(!category.value||item.shopCategory===category.value)&&(!search||plain(item.name+' '+item.type+' '+item.shopCategory).toLocaleLowerCase('ru').includes(search)));
      const selected=picker.value;picker.innerHTML='<option value="">Выберите предмет</option>'+visible.map(item=>'<option value="'+esc(item.id)+'"'+(item.id===selected?' selected':'')+'>'+esc(item.name+' · '+item.shopCategory+(item.type?' · '+item.type:''))+'</option>').join('');
    }
    async function loadShopCatalog(){
      if(shopCatalog.loaded)return shopCatalog.items;if(shopCatalog.promise)return shopCatalog.promise;
      const status=q('#akcm-shopStatus');if(status)status.textContent='Загрузка каталога магазина…';
      shopCatalog.promise=Promise.all([{id:82,label:'Вооружение и защита'},{id:83,label:'Препараты'},{id:81,label:'Марионетки'}].map(async source=>(await adapter.posts(source.id)).flatMap(post=>parseShopCatalogPost(post,source)))).then(groups=>{
        const unique=new Map();groups.flat().forEach(item=>unique.set(plain(item.category+'|'+item.name+'|'+item.url).toLocaleLowerCase('ru'),item));
        shopCatalog.items=[...unique.values()].sort((a,b)=>a.name.localeCompare(b.name,'ru'));shopCatalog.loaded=true;renderShopCatalog();if(status)status.textContent='Доступно предметов: '+shopCatalog.items.length+'.';return shopCatalog.items;
      }).catch(error=>{if(status)status.textContent='Не удалось загрузить магазин: '+error.message;throw error;}).finally(()=>{shopCatalog.promise=null;});
      return shopCatalog.promise;
    }
    function addShopItem(){
      const item=shopCatalog.items.find(candidate=>candidate.id===val('shopItem'));if(!item)throw Error('Выберите предмет из магазина.');
      const quantity=num(val('shopQuantity'),'количество',1),unit='шт.';
      const existing=lists.inventory.find(entry=>itemKey(entry.name)===itemKey(item.name)&&String(entry.unit||'шт.')===unit);
      if(existing){existing.quantity=num(existing.quantity+quantity,'количество предмета');existing.category=item.category;existing.note=item.note||existing.note||'';existing.url=item.url||existing.url||'';}
      else lists.inventory.push({name:item.name,quantity,unit,category:item.category,note:item.note||'',url:item.url||''});
      drawList('inventory');q('#akcm-shopQuantity').value=1;message('Добавлено из магазина: '+item.name+' · '+item.category+'.');draftOp=null;
    }
    function applyKit(id){
      const kit=kits.find(k=>String(k.id)===String(id));if(!kit)throw Error('Выберите набор.');
      const category=kit.category||kit.title;
      for(const row of kit.items||[]){
        const item=Array.isArray(row)?{name:row[0],quantity:row[1],unit:row[2]||'шт.'}:row;
        if(!item.name)continue;
        const unit=item.unit||'шт.',quantity=num(item.quantity||1,'количество предмета');
        const existing=lists.inventory.find(i=>itemKey(i.name)===itemKey(item.name)&&String(i.unit||'шт.')===String(unit));
        if(existing){existing.quantity=num(existing.quantity+quantity,'количество предмета');if(!existing.category)existing.category=category;}
        else lists.inventory.push({name:item.name,quantity,unit,category,note:item.note||''});
      }
      drawList('inventory');
      message('Набор добавлен: '+kit.title+'. Одинаковые предметы суммированы.');
    }
    function drawKitDescription(){const box=q('#akcm-kit-description'),kit=kits.find(k=>String(k.id)===String(val('kit')));if(box)box.textContent=plain(kit?.description||'');}
    function toggleCustomCategory(box){const select=box.querySelector('[data-key="category"]'),custom=box.querySelector('[data-custom-category]');if(custom)custom.hidden=!select||select.value!=='__custom__';}
    function drawList(key) {
      if(key==='inventory'){const filter=q('#akcm-filter'),chosen=filter.value;filter.innerHTML='<option value="">Все категории</option>'+inventoryCategories().map(c=>'<option value="'+esc(c)+'">'+esc(c)+'</option>').join('');filter.value=chosen;}
      q('[data-list="'+key+'"]').innerHTML=(lists[key]||[]).map((item,index)=>{
        if(key==='inventory'&&((val('filter')&&item.category!==val('filter'))||!plain(item.name).toLowerCase().includes(val('search').toLowerCase())))return '';
        return '<article class="akcm-record"><div><strong>'+titleHtml(item)+'</strong><p>'+esc(key==='inventory'?(item.category||'Личные вещи')+' · '+fmt(item.quantity)+' '+(item.unit||'шт.'):(item.rank?'Ранг '+item.rank:''))+'</p><p>'+esc(item.note||'')+'</p></div><div><button type="button" data-edit="'+key+'" data-index="'+index+'" aria-label="Редактировать">✎</button> <button type="button" data-delete="'+key+'" data-index="'+index+'" aria-label="Удалить">×</button></div></article>';
      }).join('')||'<p>Нет записей.</p>';
    }
    function addRow(key,item={},index=-1) {
      const box=q('[data-form="'+key+'"]');box.dataset.index=index;
      box.innerHTML='<div class="akcm-entry"><h4>'+(index<0?'Добавление':'Редактирование')+'</h4><div class="akcm-grid">'+columns[key].map(([k,label])=>{
        const value=item[k]??(k==='quantity'?1:k==='unit'?'шт.':'');
        if(k==='category'||k==='rank'){const options=k==='rank'?RANKS.slice(0,6):inventoryCategories().concat(value&&!inventoryCategories().includes(value)?[value]:[]);return '<label>'+label+'<select data-key="'+k+'">'+options.map(v=>'<option'+(v===value?' selected':'')+'>'+esc(v)+'</option>').join('')+(k==='category'?'<option value="__custom__">Другая категория…</option>':'')+'</select></label>'+(k==='category'?'<label data-custom-category hidden>Новая категория<input data-key="customCategory" value=""></label>':'');}
        return '<label'+(k==='url'&&key==='inventory'?' data-artifact-link':'')+'>'+label+'<input data-key="'+k+'" value="'+esc(value)+'"'+(k==='quantity'?' type="number" min="0"':k==='url'?' type="url" placeholder="https://…"':'')+'>'+(k==='url'&&key==='inventory'?'<button type="button" data-load-artifact>Получить название и цвет</button>':'')+'</label>';
      }).join('')+'</div><button type="button" data-save-row="'+key+'">Сохранить запись в черновик</button> <button type="button" data-cancel-row="'+key+'">Отмена</button></div>';
      box.dataset.loadedUrl=item.url||'';toggleArtifact(box);toggleCustomCategory(box);box.scrollIntoView({block:'nearest',behavior:'smooth'});
    }
    function toggleArtifact(box){const category=box.querySelector('[data-key="category"]');if(!category)return;const artifact=/артефакт/i.test(category.value);box.querySelectorAll('[data-key]').forEach(input=>{if(input.dataset.key==='customCategory')return;input.closest('label').hidden=artifact&&!['url','category'].includes(input.dataset.key);});const load=box.querySelector('[data-load-artifact]');if(load){load.hidden=!artifact;box.querySelector('.akcm-entry').insertBefore(load,box.querySelector('[data-save-row]'));}toggleCustomCategory(box);}
    function render() {
      const t=totals(state);draftOp=null;operationQueue=[];lists=Object.fromEntries(Object.keys(columns).map(k=>[k,clone(state[k])]));historyEdits=[];purchase=null;jobs=clone(jobsOf(state));
      q('#akcm-editor').innerHTML='<div class="akcm-metrics"><div><small>ОПЫТ</small><strong>'+fmt(t.xp)+'</strong></div><div><small>КОШЕЛЁК · РЁ</small><strong>'+fmt(t.money)+'</strong></div></div>'+(state.pending?'<p class="error">Операция записана. Требуется завершить обновление личного дела.</p><button type="button" data-action="sync">Повторить синхронизацию</button>':'')+
        '<fieldset '+(state.pending?'disabled':'')+'><section><h3>Техническая информация</h3><div class="akcm-grid">'+field('name','Имя',state.name)+field('currentPlayerId','Текущий игрок (ID профиля)',state.currentPlayerId||'','number')+field('topicUrl','Ссылка на тему личного дела (необязательно)',state.topicId?forumBase+'/viewtopic.php?id='+state.topicId:'','url')+'</div><details><summary>ID постов личного дела</summary><div class="akcm-grid">'+field('post2','ID поста 2 (определяется автоматически)',state.post2)+field('post3','ID поста 3 (определяется автоматически)',state.post3)+'</div></details>'+area('details','Публичные сведения',state.details)+specializationEditor()+area('privateNotes','Заметки только для администрации',state.privateNotes)+'</section>'+adminHistoryView(state)+
        (!state.revision?'<section><h3>Первоначальный перенос</h3><p>Остатки берутся из загруженной версии 0. Старые награды повторно не начисляются. Поля ниже нужны только для ручной замены исходного остатка.</p><label><input type="checkbox" id="akcm-overrideOpening"> Изменить исходные остатки вручную</label><div class="akcm-grid">'+field('openingMoney','Текущие деньги',state.opening.money,'number')+field('openingXp','Текущий опыт',state.opening.xp,'number')+'</div><label><input type="checkbox" id="akcm-migrated"> Я проверил остатки и перенёс списки из старого поста</label><details><summary>Исходный пост (архив)</summary><pre>'+esc(state.legacy||'Новый персонаж')+'</pre></details></section>':'')+
        '<section id="akcm-operations"><h3>Операции</h3>'+area('reason','Основание / ссылка на эпизод')+field('operationUrl','Ссылка к операции','','url')+'<div class="akcm-operation-list"><div class="akcm-operation-card">'+field('money','Деньги: + начислить / − списать',0,'number')+'<button type="button" data-confirm-operation="money">Подтвердить операцию с деньгами</button></div><div class="akcm-operation-card">'+field('xp','Опыт: + начислить / − списать',0,'number')+'<button type="button" data-confirm-operation="xp">Подтвердить операцию с опытом</button></div></div><h4>Купить ячейки техник за опыт</h4><div class="akcm-slots">'+RANKS.slice(0,6).map(r=>field('slot'+r,r+' · '+SLOT_PRICES[r]+' опыта',0,'number')).join('')+'</div><p id="akcm-slot-cost">К списанию: 0 опыта</p><button type="button" data-confirm-slots>Подтвердить покупку ячеек</button><div id="akcm-operation-queue"></div></section>'+
        '<section><h3>Работа и зарплата</h3><div class="akcm-grid">'+field('job','Должность',state.job.title)+field('salary','Ставка за месяц, рё',state.job.salary,'number')+field('months','Добавить зарплату за месяцев',0,'number')+field('period','Период (например: сюжетные 01–03, 999 год)')+'</div></section>'+
        Object.entries(columns).map(([k,c])=>table(k,{inventory:'Инвентарь',property:'Личное имущество',missions:'Выполненные миссии',quests:'Выполненные квесты'}[k],c)).join('')+
        '<p>Добавление записи о миссии или квесте само по себе не начисляет награду. Внесите награду в поля денег и опыта выше: она попадёт в одну операцию.</p><div class="akcm-toolbar"><button type="button" data-action="preview">Предпросмотр изменений</button><button type="button" data-action="apply" class="akcm-primary">Применить</button><button type="button" data-action="export">Скачать резервную копию</button></div><p role="status" id="akcm-action-status"></p></fieldset><div id="akcm-preview"></div>';
      for(const key of Object.keys(columns))drawList(key);
      enhance();
      technicalSnapshot=null;firstSnapshot=null;
      const editor=q('#akcm-editor'), main=document.createElement('div');main.id='akcm-main-tab';
      while(editor.firstChild)main.appendChild(editor.firstChild);editor.appendChild(main);
      drawKitDescription();
      loadShopCatalog().catch(()=>{});

    }
    function enhance() {
      const input=q('#akcm-topicUrl'),label=input.parentElement;label.hidden=true;
      if(q('#akcm-overrideOpening')){const syncOpening=()=>['openingMoney','openingXp'].forEach(id=>q('#akcm-'+id).disabled=!q('#akcm-overrideOpening').checked);q('#akcm-overrideOpening').addEventListener('change',syncOpening);syncOpening();}
      label.insertAdjacentHTML('beforebegin','<div id="akcm-topic-link">'+linkHtml(input.value,'Личное дело ↗')+' <button type="button" data-action="edit-topic" aria-label="Изменить ссылку">✎</button></div>');
      label.insertAdjacentHTML('beforeend','<button type="button" data-action="resolve-topic">Обновить ссылку и ID</button>');
      q('#akcm-post2').parentElement.parentElement.insertAdjacentHTML('afterbegin',field('topicId','ID темы',state.topicId)+field('post1','ID первого поста',state.post1||''));
      for(const id of ['topicId','post1','post2','post3'])q('#akcm-'+id).readOnly=true;
      q('#akcm-job').closest('section').id='akcm-jobs-section';drawJobs();
      drawOperationQueue();
      q('#akcm-editor fieldset').insertAdjacentHTML('beforeend','<section><h3>Учесть покупки</h3>'+area('receipt','BBCode чека из магазина')+field('episode','Ссылка на эпизод (необязательно)','','url')+'<button type="button" data-action="purchase">Разобрать чек и добавить в черновик</button><p id="akcm-purchase-status"></p></section><section><h3>Возраст и бытовые потребности</h3><div class="akcm-grid">'+field('age','Текущий возраст',state.age??'','number')+'<div><button type="button" data-action="read-age">Определить из первого поста</button> <button type="button" data-action="birthday">＋ 1 год</button></div>'+field('livingMonths','Списать за месяцев',0,'number')+field('livingPeriod','За период')+'</div><p>До 12: 7 000; 12–17: 10 000; 18–35: 12 000; 36–59: 15 000; с 60 лет: 10 000 рё / месяц.</p></section>');
      q('#akcm-livingMonths').min='0';q('#akcm-age').min='0';q('[data-action=birthday]').parentElement.classList.add('akcm-actions');
      const history=q('.akcm-admin-history');history.innerHTML='<h3>История кошелька и опыта</h3><div id="akcm-history-entries"></div><div id="akcm-history-form"></div>';drawHistory();
      // Keep the commit controls after every draft form.
      const controls=q('[data-action="apply"]').parentElement,status=q('#akcm-action-status');q('#akcm-editor fieldset').append(controls,status);
    }
    function drawJobs(){
      const selected=val('salaryJob')||jobs[0]?.id||'',months=val('months')||0,period=val('period');
      q('#akcm-jobs-section').innerHTML='<h3>Работа и зарплата</h3>'+jobs.map(j=>'<article class="akcm-record"><div><strong>'+esc(j.title.replace(/\s*Ранг\s+[EDCBAS]\.?/gi,''))+'</strong><p>Ранг '+esc(j.rank)+' · '+fmt(j.salary)+' рё в месяц</p></div><button type="button" data-edit-job="'+esc(j.id)+'">✎ Изменить</button></article>').join('')+'<div class="akcm-actions"><button type="button" data-new-job>＋ Добавить работу</button></div><div id="akcm-job-form"></div><div class="akcm-grid akcm-payroll"><label>Начислить по должности<select id="akcm-salaryJob">'+jobs.map(j=>'<option value="'+esc(j.id)+'">'+esc(j.title)+'</option>').join('')+'</select></label>'+field('months','Добавить зарплату за месяцев',months,'number')+field('period','Период начисления',period)+'</div>';
      q('#akcm-salaryJob').value=selected;q('#akcm-months').min='0';
    }
    function editJob(id){const job=jobs.find(j=>j.id===id)||{title:'',salary:0,rank:'E'};q('#akcm-job-form').innerHTML='<div class="akcm-entry"><h4>'+(id?'Изменить работу':'Добавить работу')+'</h4><div class="akcm-grid">'+field('job','Должность',job.title)+field('salary','Ставка за месяц, рё',job.salary,'number')+'<label>Ранг<select id="akcm-jobRank">'+RANKS.slice(0,6).map(r=>'<option'+(r===job.rank?' selected':'')+'>'+r+'</option>').join('')+'</select></label></div><div class="akcm-actions"><button type="button" data-save-job="'+esc(id||'new')+'">Сохранить работу в черновик</button><button type="button" data-cancel-job>Отмена</button></div></div>';q('#akcm-salary').min='0';}
    function drawHistory(){q('#akcm-history-entries').innerHTML=[['money','История кошелька','рё'],['xp','История опыта','ед.']].map(([key,title,unit])=>{const entries=state.history.map(e=>historyEdits.find(i=>i.id===e.id)?{...e,...historyEdits.find(i=>i.id===e.id)}:e).filter(e=>e[key]);return '<details data-ledger="'+key+'"><summary>'+title+' · '+entries.length+'</summary>'+entries.slice().reverse().map(e=>'<article class="akcm-record"><div><b>'+esc(String(e.date).slice(0,10))+'</b> · '+linkHtml(actorUrl(e.actor),actorText(e.actor))+'<p>'+linkHtml(e.url,e.reason)+'</p><p>'+(e[key]>0?'+':'')+fmt(e[key])+' '+unit+'</p></div><button type="button" data-history="'+esc(e.id)+'" aria-label="Изменить операцию">✎</button></article>').join('')+'</details>';}).join('');}
    function slotDraft(){const slots=RANKS.map(r=>r==='ANY'?0:num(val('slot'+r)||0,'ячейки '+r,0,100)),cost=RANKS.slice(0,6).reduce((sum,r,i)=>sum+slots[i]*SLOT_PRICES[r],0);return {slots,cost};}
    function fieldError(id,text){const el=q('#akcm-'+id);if(!el)throw Error(text);let note=el.closest('label')?.querySelector('.akcm-field-error');if(!note){note=document.createElement('span');note.className='akcm-field-error';el.closest('label')?.append(note);}note.textContent=text;el.setAttribute('aria-invalid','true');el.focus();throw Error(text);}
    function clearFieldErrors(){root.querySelectorAll('.akcm-field-error').forEach(n=>n.remove());root.querySelectorAll('[aria-invalid]').forEach(n=>n.removeAttribute('aria-invalid'));}
    function operationBase(){const reason=val('reason').trim();if(!reason)fieldError('reason','Укажите основание операции.');return {id:crypto.randomUUID(),actor:currentAdmin(),reason,url:val('operationUrl')};}
    function drawOperationQueue(){const box=q('#akcm-operation-queue');if(!box)return;box.innerHTML='<h4>Подтверждённые операции · '+operationQueue.length+'</h4>'+(operationQueue.map((op,index)=>'<article class="akcm-record"><div><strong>'+esc(op.kind)+'</strong><p>'+esc(op.reason)+'</p><p>'+esc(op.summary)+'</p></div><button type="button" data-remove-operation="'+index+'">×</button></article>').join('')||'<p>Пока нет подтверждённых операций.</p>');}
    async function resolveTopic(){const id=topicIdFromLink(val('topicUrl'),forumBase);if(!id)throw Error('Укажите ссылку на личное дело.');const posts=await adapter.posts(id);if(posts.length<3)throw Error('В теме менее трёх постов.');q('#akcm-topicId').value=id;['post1','post2','post3'].forEach((k,i)=>q('#akcm-'+k).value=posts[i].id);q('#akcm-topic-link').innerHTML=linkHtml(val('topicUrl'),'Личное дело ↗')+' <button type="button" data-action="edit-topic">✎</button>';q('#akcm-topicUrl').parentElement.hidden=true;const second=await adapter.edit(posts[1].id);state.level=readLevel(second.raw);levelLoaded=true;const levelDisplay=q('#akcm-level-display');if(levelDisplay)levelDisplay.textContent=state.level;const first=await adapter.edit(posts[0].id);firstAge=readAge(first.raw);q('#akcm-age').value=firstAge??'';message('Ссылка, ID постов и возраст обновлены в черновике.');}
    async function loadArtifact(box){
      const input=box.querySelector('[data-key="url"]'),url=cleanUrl(input.value),u=new URL(url);if(u.origin!==new URL(forumBase).origin)throw Error('Нужна ссылка на артефакт этого форума.');
      const id=u.hash.replace(/^#p/,'')||u.searchParams.get('pid');if(!/^\d+$/.test(id||''))throw Error('В ссылке артефакта должен быть номер поста #p…');
      if(!artifactReads.has(url))artifactReads.set(url,adapter.edit(id).then(post=>artifactTitle(post.raw)).catch(error=>{artifactReads.delete(url);throw error;}));
      const title=await artifactReads.get(url);
      if(input.value===url){box.querySelector('[data-key="name"]').value=title;box.dataset.loadedUrl=url;}
    }
    async function importPurchase(){
      if(purchase)throw Error('Чек уже добавлен в текущий черновик. Сохраните операцию перед следующим чеком.');
      const receipt=purchaseReceipt(val('receipt')),next=clone(lists.inventory),cache=new Map(),fallback=[];
      for(const item of receipt.items){
        const u=new URL(item.url);if(u.origin!==new URL(forumBase).origin)throw Error('Мастер-пост должен находиться на этом форуме.');
        const topic=u.searchParams.get('id');if(!topic)throw Error('В ссылке товара нет ID темы.');
        if(!cache.has(topic))cache.set(topic,await adapter.posts(topic));
        const posts=cache.get(topic),post=posts.find(p=>p.id===u.hash.replace('#p',''));if(!post)throw Error('Не найден мастер-пост товара '+plain(item.name));
        const cells=[...post.content.querySelectorAll('tr')];let category='';
        for(const row of cells){const values=[...row.querySelectorAll('td')];if(!values.some(c=>itemKey(c.textContent)===itemKey(item.name)))continue;const heads=[...row.closest('table').querySelectorAll('tr:first-child th,tr:first-child td')].map(c=>c.textContent.trim().toLowerCase());const index=heads.indexOf('тип');if(index>=0)category=values[index]?.textContent.trim()||'';}
        if(!category){category='Набор шиноби';fallback.push(plain(item.name));}
        const incomingQuantity=item.inventoryQuantity||item.quantity,incomingUnit=item.inventoryUnit||'шт.';const existing=next.find(i=>itemKey(i.name)===itemKey(item.name)&&String(i.unit||'шт.')===incomingUnit);if(existing)existing.quantity+=incomingQuantity;else next.push({name:item.name,quantity:incomingQuantity,category,unit:incomingUnit,note:'',url:/артефакт/i.test(category)?item.url:''});
      }
      lists.inventory=next;purchase=receipt;drawList('inventory');q('#akcm-purchase-status').textContent='В черновик добавлено '+receipt.items.length+' позиций. Будет списано '+fmt(receipt.amount)+' рё.'+(fallback.length?' Без типа в мастер-посте: '+fallback.join(', ')+' — добавлено в «Набор шиноби».':'');
    }
    function collect(mode='apply') {
      if(!state.revision&&!q('#akcm-migrated').checked)throw Error('Подтвердите первоначальный перенос данных.');
      const draft=clone(state);
      for(const k of ['name','currentPlayerId','post2','post3','details','privateNotes'])draft[k]=val(k).trim();delete draft.elements;draft.specializations=Array.from(root.querySelectorAll('.akcm-specialization-check:checked')).map(input=>input.value);draft.specializationTechniques=Array.from(root.querySelectorAll('.akcm-specialization-technique-check:checked')).map(input=>({name:input.dataset.name,url:input.value}));if(draft.specializations.length+draft.specializationTechniques.length>3)throw Error('Можно выбрать не более трёх специализаций всего.');
      draft.topicId=topicIdFromLink(val('topicUrl').trim(),forumBase);
      if(draft.topicId!==val('topicId'))throw Error('Нажмите «Обновить ссылку и ID» перед применением.');
      draft.level=state.level;draft.jobs=clone(jobs);draft.job=clone(jobs.find(j=>j.id===val('salaryJob'))||{title:'',salary:0});
      if(!state.revision&&q('#akcm-overrideOpening')?.checked)draft.opening={money:num(val('openingMoney'),'начальные деньги'),xp:num(val('openingXp'),'начальный опыт')};
      if(!draft.topicId){draft.post2='';draft.post3='';}
      if(root.querySelector('.akcm-entry'))throw Error('Сохраните или отмените открытую форму записи.');
      for(const key of Object.keys(columns))draft[key]=clone(lists[key]);
      draft.age=val('age')===''?null:num(val('age'),'возраст',0,300);draft.post1=val('post1');
      const pendingSlots=slotDraft();
      if(Number(val('money')||0)||Number(val('xp')||0)||pendingSlots.slots.some(Boolean))throw Error('Подтвердите заполненную операцию или обнулите её поля.');
      const operations=operationQueue.map(entry=>clone(entry.op));
      const structuralChanged=['name','level','age','currentPlayerId','topicId','post1','post2','post3','jobs','specializations','specializationTechniques','inventory','property','missions','quests','details','privateNotes'].some(k=>stable(k==='jobs'?jobsOf(state):state[k])!==stable(draft[k]));
      const months=Number(val('months')||0),livingMonths=Number(val('livingMonths')||0);
      if(structuralChanged||months||purchase||livingMonths||historyEdits.length){
        const reason=val('reason').trim()||(mode==='preview'?'Предпросмотр изменений':'Административное изменение');
        const op={id:crypto.randomUUID(),actor:currentAdmin(),money:0,xp:0,reason,months:val('months'),period:val('period'),slots:RANKS.map(()=>0),levelSlots:false,jobId:val('salaryJob'),historyEdits,purchase,url:val('operationUrl')||(purchase?val('episode'):'')};
        if(months)op.reason+='; Зарплата: '+draft.job.title+' за '+op.period;
        if(purchase)op.reason+='; '+(val('episode')?'Покупка в магазине: '+cleanUrl(val('episode')):'Покупка в магазине во время простоя');
        if(livingMonths){op.living={months:val('livingMonths'),period:val('livingPeriod')};op.reason+='; Бытовые потребности за '+val('livingPeriod');}
        operations.push(op);
      }
      return transitionBatch(state,draft,operations);
    }
    function registryTopic(p){try{const data=parse(p.content?.textContent||'');if(data?.topicId)return String(data.topicId);const links=p.content?.querySelectorAll?.('a[href*="viewtopic.php"]')||[];for(const a of links)if(/личное дело|ссылка на лд|^лд$/i.test(a.textContent)){return String(topicIdFromLink(a.getAttribute('href'),forumBase)||'');}}catch(_){}return '';}
    async function drawRegistry(){const box=q('#akcm-registry-filter-status'),only=q('#akcm-active-only').checked;if(only&&!activeTopics){box.textContent='Читаем раздел активных личных дел…';if(!activeRequest)activeRequest=activePersonalTopics(path=>akatsukiNetwork().document(new URL(path,forumBase).href,true),forumBase).then(value=>activeTopics=value).finally(()=>activeRequest=null);try{await activeRequest;return drawRegistry();}catch(error){q('#akcm-character').innerHTML='<option value="">Не удалось проверить активность</option>';box.textContent=error.message;return;}}const previous=val('character'),term=q('#akcm-registry-search').value.trim().toLocaleLowerCase('ru').replace(/ё/g,'е'),filtered=records.filter(p=>postLabelFromContent(p).toLocaleLowerCase('ru').replace(/ё/g,'е').includes(term)&&(!only||activeTopics.has(registryTopic(p))));q('#akcm-character').innerHTML='<option value="">Выберите персонажа</option>'+filtered.map(p=>'<option value="'+esc(p.id)+'">'+esc(postLabelFromContent(p))+'</option>').join('');if(filtered.some(p=>String(p.id)===previous))q('#akcm-character').value=previous;box.textContent='Найдено: '+filtered.length+' из '+records.length;}
    function drawBulk(){const ids=bulkBatch?.ids||[];q('#akcm-bulk-characters').innerHTML=records.map(p=>'<label data-bulk-name="'+esc(postLabelFromContent(p).toLocaleLowerCase('ru').replace(/ё/g,'е'))+'"><input type="checkbox" data-bulk-character value="'+esc(p.id)+'" '+(ids.includes(String(p.id))?'checked ':'')+(bulkBatch?'disabled':'')+'>'+esc(postLabelFromContent(p))+'</label>').join('')||'<p>В реестре нет персонажей.</p>';q('#akcm-bulk-amount').value=bulkBatch?.amount||'';q('#akcm-bulk-comment').value=bulkBatch?.comment||'';q('#akcm-bulk-amount').disabled=!!bulkBatch;q('#akcm-bulk-comment').disabled=!!bulkBatch;q('[data-action="bulk-apply"]').textContent=bulkBatch?.complete?'Начисление завершено':bulkBatch?'Продолжить начисление':'Начислить опыт выбранным';q('[data-action="bulk-apply"]').disabled=!!bulkBatch?.complete;filterBulk();}
    function filterBulk(){const term=q('#akcm-bulk-search').value.trim().toLocaleLowerCase('ru').replace(/ё/g,'е'),rows=Array.from(root.querySelectorAll('[data-bulk-name]'));let shown=0;rows.forEach(row=>{row.hidden=!row.dataset.bulkName.includes(term);if(!row.hidden)shown++;});const selected=root.querySelectorAll('[data-bulk-character]:checked').length;q('#akcm-bulk-selection').textContent='Выбрано: '+selected+' · Найдено: '+shown+' из '+rows.length;q('#akcm-bulk-empty').hidden=shown>0;}
    function bulkReport(results){q('#akcm-bulk-results').innerHTML=results.map(r=>'<p>'+esc(r.name)+': '+(r.ok?(r.repeated?'уже начислено, повтор пропущен':'начислено'):'ошибка: '+esc(r.error))+'</p>').join('');}
    function drawService(){
      q('#akcm-service-rows').innerHTML=serviceRows.map((row,index)=>'<p>'+(row.error?'':row.repeated?'<b>Уже списано</b> ':row.done?'<b>Списано</b> ':'<label><input type="checkbox" data-service-row value="'+index+'" checked> '+(row.resume?'Завершить синхронизацию':'Списать')+'</label> ')+' <a href="'+forumBase+'/viewtopic.php?pid='+esc(row.request?.pid||row.pid)+'#p'+esc(row.request?.pid||row.pid)+'">p'+esc(row.request?.pid||row.pid)+'</a> · '+esc(row.name||'')+(row.request?' · '+fmt(row.request.amount)+' рё · '+esc(row.request.reason):'')+(row.error?' · '+esc(row.error):'')+'</p>').join('')||'<p>Заявок на списание нет.</p>';
    }
    async function action(name) {
      if(name==='service-scan'){
        if(Number(window.GroupID)!==1||!window.UserID)throw Error('Разбор доступен только администратору.');
        q('#akcm-service-status').textContent='Читаем заявки и историю персонажей…';
        records=(await adapter.posts(config.storageTopicId||492)).slice(1);
        serviceRows=await servicePreview(adapter,records,forumBase);drawService();
        q('#akcm-service-status').textContent='Разбор завершён. Проверьте выбранные списания.';return;
      }
      if(name==='service-apply'){
        if(Number(window.GroupID)!==1||!window.UserID)throw Error('Списание доступно только администратору.');
        const indices=Array.from(root.querySelectorAll('[data-service-row]:checked')).map(el=>Number(el.value));
        if(!indices.length)throw Error('Выберите списания после разбора темы.');
        for(const index of indices){const row=serviceRows[index];if(!row||row.error||row.repeated||row.done)continue;
          q('#akcm-service-status').textContent='Проверяем и списываем по p'+row.request.pid+'…';
          try{const result=await serviceDebit(adapter,records,row.request,currentAdmin(),forumBase,row.targetId);row.done=true;row.repeated=result.repeated;row.name=result.name;}catch(error){row.error=error.message;}
        }
        selected=null;state=null;raw='';q('#akcm-editor').innerHTML='<p>Загрузите данные персонажа заново после обработки заявок.</p>';
        drawService();q('#akcm-service-status').textContent='Обработка завершена. Для повторной проверки нажмите «Разобрать тему 550».';return;
      }

      if(name==='bulk-new'){bulkBatch=null;localStorage.removeItem(bulkCacheKey);drawBulk();q('#akcm-bulk-results').innerHTML='';q('#akcm-bulk-status').textContent='Выберите персонажей для новой операции.';return;}
      if(name==='bulk-apply'){if(Number(window.GroupID)!==1||!window.UserID)throw Error('Начисление доступно только администратору.');if(bulkBatch?.complete)return;if(!bulkBatch){const ids=Array.from(root.querySelectorAll('[data-bulk-character]:checked')).map(el=>el.value);if(!ids.length)throw Error('Выберите хотя бы одного персонажа.');const amount=num(q('#akcm-bulk-amount').value,'сумма опыта',1,Number.MAX_SAFE_INTEGER),comment=q('#akcm-bulk-comment').value.trim();if(!comment)throw Error('Укажите общий комментарий.');bulkBatch={id:crypto.randomUUID(),ids,amount,comment,complete:false};localStorage.setItem(bulkCacheKey,JSON.stringify(bulkBatch));drawBulk();}const results=await bulkExperience(adapter,bulkBatch.ids,bulkBatch.amount,bulkBatch.comment,currentAdmin(),bulkBatch.id,rows=>{bulkReport(rows);q('#akcm-bulk-status').textContent='Обработано: '+rows.length+' / '+bulkBatch.ids.length;},records);if(selected&&bulkBatch.ids.includes(String(selected))){selected=null;state=null;raw='';q('#akcm-editor').innerHTML='<p>Данные изменены массовой операцией. Загрузите персонажа заново перед редактированием.</p>';}bulkBatch.complete=results.every(r=>r.ok);localStorage.setItem(bulkCacheKey,JSON.stringify(bulkBatch));q('#akcm-bulk-status').textContent=bulkBatch.complete?'Опыт начислен всем выбранным персонажам.':'Часть записей не сохранена. Исправьте ошибки и продолжите ту же операцию — повторного начисления не будет.';drawBulk();return;}

      if(name==='registry-tab'||name==='events-tab'||name==='bulk-tab'||name==='postcount-tab'||name==='service-tab'){q('#akcm-service-view').hidden=name!=='service-tab';q('#akcm-postcount-view').hidden=name!=='postcount-tab';if(name==='postcount-tab'&&globalThis.AkatsukiPostCount)globalThis.AkatsukiPostCount.mount(q('#akcm-postcount-view'));q('#akcm-registry-view').hidden=name!=='registry-tab';q('#akcm-events-view').hidden=name!=='events-tab';q('#akcm-bulk-view').hidden=name!=='bulk-tab';root.querySelectorAll('[data-action="registry-tab"],[data-action="events-tab"],[data-action="bulk-tab"],[data-action="postcount-tab"],[data-action="service-tab"]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.action===name)));return;}

      if(name==='main-tab'||name==='technical-tab'||name==='first-tab'){
        q('#akcm-first-tab').hidden=name!=='first-tab';q('#akcm-main-tab').hidden=name!=='main-tab';q('#akcm-technical-tab').hidden=name!=='technical-tab';
        root.querySelectorAll('[role="tab"]').forEach(button=>button.setAttribute('aria-selected',String(button.dataset.action===name)));return;
      }
      if(name==='first-load'){
        if(!state?.topicId)throw Error('Сначала сохраните ссылку на личное дело.');
        const posts=await adapter.posts(state.topicId,true),post=posts[0];if(!post||String(post.id)===String(selected))throw Error('Первый пост не найден.');
        const loaded=await adapter.edit(post.id);firstSnapshot={id:post.id,raw:loaded.raw};q('#akcm-first-code').value=loaded.raw;message('Первый пост загружен.');return;
      }
      if(name==='first-design'){
        if(!firstSnapshot)throw Error('Сначала загрузите первый пост.');
        q('#akcm-first-code').value=firstPostDesign(val('first-code'));message('Дизайн преобразован. Проверьте BBCode и сохраните первый пост.');return;
      }
      if(name==='first-save'){
        if(!firstSnapshot)throw Error('Сначала загрузите первый пост.');
        const posts=await adapter.posts(state.topicId,true);if(String(posts[0]?.id)!==String(firstSnapshot.id))throw Error('Первый пост изменился. Загрузите анкету заново.');
        const text=val('first-code').trim();if(!text)throw Error('Анкета не может быть пустой.');
        await adapter.write(firstSnapshot.id,firstSnapshot.raw,text,message,true);firstSnapshot.raw=text;message('Первый пост обновлён.');return;
      }
      if(name==='technical-load'){
        if(!state?.topicId)throw Error('Сначала выберите личное дело.');
        technicalSnapshot=await akcmReadTechnical(state.topicId);q('#akcm-technical-code').value=technicalSnapshot.raw;
        q('[data-action="technical-design"]').disabled=false;q('[data-action="technical-save"]').disabled=!akcmCanEdit(technicalSnapshot.target);message('Второй пост загружен.');return;
      }
      if(name==='technical-design'){q('#akcm-technical-code').value=akcmTemplateCode(val('technical-code'));message('Новый шаблон готов к сохранению.');return;}
      if(name==='technical-save'){
        if(!technicalSnapshot)throw Error('Сначала загрузите второй пост.');
        const text=akcmTemplateCode(val('technical-code'));technicalSnapshot=await akcmSaveTechnical(technicalSnapshot,text);q('#akcm-technical-code').value=text;message('Второй пост обновлён.');return;
      }
      if(name==='edit-topic'){q('#akcm-topicUrl').parentElement.hidden=false;q('#akcm-topicUrl').focus();return;}
      if(name==='resolve-topic'||name==='read-age'){await resolveTopic();return;}
      
      if(name==='birthday'){q('#akcm-age').value=num(val('age'),'возраст',0,299)+1;return;}
      if(name==='purchase'){await importPurchase();return;}
      if(name==='list') {
        records=(await adapter.posts(config.storageTopicId||492)).slice(1);
        activeTopics=null;await drawRegistry();drawBulk();message('Список персонажей обновлён.');return;
      }
      if(name==='load') {
        const id=val('character');if(!id)throw Error('Выберите персонажа.');
        const e=await adapter.edit(id),loaded=parse(e.raw)||migrate(records.find(p=>p.id===id).content,e.raw);validate(loaded);selected=id;raw=e.raw;state=loaded;levelLoaded=false;specializationCatalog.techniques=[];specializationCatalog.loaded=false;render();if(state.topicId&&!state.pending)await resolveTopic();message('Данные загружены. Версия '+state.revision);return;
      }
      if(!state)throw Error('Сначала загрузите персонажа.');
      if(name==='refresh-card'){await refreshCard(adapter,selected,raw,state,message);message('Оформление третьего поста обновлено. Данные и версия не изменены.');return;}
      if(name==='sync') {const e=await adapter.edit(selected),s=parse(e.raw);if(!s)throw Error('Не найдены данные операции.');const r=await synchronize(adapter,selected,e.raw,s,message);raw=r.raw;state=r.state;render();message('Синхронизация завершена.');return;}
      if(name==='export') {const a=document.createElement('a'),u=URL.createObjectURL(new Blob([raw],{type:'text/plain;charset=utf-8'}));a.href=u;a.download='character-'+selected+'-v'+state.revision+'.txt';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);return;}
      const next=collect(name==='preview'?'preview':'apply');
      if(name==='preview') {q('#akcm-preview').innerHTML=diffLayout(previewDiff(state,next));message('Предпросмотр готов. Ничего не сохранено.');return;}
      if(name==='apply') {
        q('#akcm-preview').innerHTML=diffLayout(previewDiff(state,next));
        message('Применяю: сначала хранилище, затем посты личного дела, затем подтверждение версии…');
        try {const result=await commit(adapter,selected,raw,state,next,message);raw=result.raw;state=result.state;render();message('Сохранено. Версия '+state.revision+(state.topicId?' — личное дело обновлено.':' — только хранилище.'));}
        catch(error) {
          try {const e=await adapter.edit(selected),s=parse(e.raw),lastId=next.history.at(-1)?.id;if(s&&(!lastId||s.history.some(x=>x.id===lastId))){raw=e.raw;state=s;render();}}catch(_){/* Preserve the editor if the network is unavailable. */}
          throw error;
        }
      }
    }
    root.addEventListener('input',e=>{if(e.target.id==='akcm-registry-search'){drawRegistry();return;}if(e.target.id==='akcm-bulk-search'){filterBulk();return;}draftOp=null;if(e.target.id==='akcm-reason'||e.target.closest('label')?.querySelector('.akcm-field-error'))clearFieldErrors();if(/^akcm-slot(?:E|D|C|B|A|S)$/.test(e.target.id)){try{q('#akcm-slot-cost').textContent='К списанию: '+fmt(slotDraft().cost)+' опыта';}catch(_){q('#akcm-slot-cost').textContent='Проверьте количество ячеек';}}if(['akcm-search','akcm-filter'].includes(e.target.id))drawList('inventory');if(e.target.id==='akcm-shopSearch')renderShopCatalog();if(e.target.id==='akcm-specializationSearch'){const term=plain(e.target.value).toLocaleLowerCase('ru');root.querySelectorAll('[data-specialization-search]').forEach(label=>label.hidden=!label.dataset.specializationSearch.includes(term));}if(e.target.id==='akcm-specializationTechniqueSearch'){const term=plain(e.target.value).toLocaleLowerCase('ru');root.querySelectorAll('[data-technique-search]').forEach(label=>label.hidden=!label.dataset.techniqueSearch.includes(term));}if(e.target.dataset.key==='category'){toggleArtifact(e.target.closest('[data-form]'));toggleCustomCategory(e.target.closest('[data-form]'));}if(e.target.dataset.key==='url'&&e.target.value.trim().startsWith('[url=')){try{const item=artifactLink(e.target.value),box=e.target.closest('[data-form]');box.querySelector('[data-key="name"]').value=item.name;e.target.value=item.url;box.dataset.loadedUrl=item.url;}catch(error){message(error.message,true);}}});
    root.addEventListener('toggle',e=>{const block=e.target;if(block.id!=='akcm-specialization'||!block.open||specializationCatalog.loaded||block.dataset.loading)return;block.dataset.loading='true';q('#akcm-specializationStatus').textContent='Загрузка типов и техник…';loadSpecializationCatalog().catch(error=>{if(q('#akcm-specialization')===block)q('#akcm-specializationStatus').textContent='Не удалось загрузить каталог: '+error.message;}).finally(()=>{delete block.dataset.loading;});},true);
    root.addEventListener('change',async e=>{if(e.target.id==='akcm-active-only'){await drawRegistry();return;}if(e.target.hasAttribute('data-bulk-character'))filterBulk();if(e.target.id==='akcm-kit')drawKitDescription();if(e.target.id==='akcm-shopCategory')renderShopCatalog();if(e.target.classList.contains('akcm-specialization-check')||e.target.classList.contains('akcm-specialization-technique-check'))updateSpecializationChecks();if(e.target.dataset.key==='url'&&e.target.closest('[data-form]')&&e.target.closest('[data-form]').dataset.loadedUrl!==e.target.value){try{await loadArtifact(e.target.closest('[data-form]'));}catch(error){message(error.message,true);}}});
    root.addEventListener('click',async e=>{
      const button=e.target.closest('button');if(!button||busy)return;
      try {
        clearFieldErrors();
        if(button.hasAttribute('data-add-shop-item')){addShopItem();return;}
        if(button.dataset.confirmOperation){const key=button.dataset.confirmOperation,value=num(val(key),key,-Number.MAX_SAFE_INTEGER);if(!value)throw Error('Укажите ненулевое изменение.');const base=operationBase(),op={...base,money:key==='money'?value:0,xp:key==='xp'?value:0,slots:RANKS.map(()=>0),levelSlots:false};operationQueue.push({kind:key==='money'?'Деньги':'Опыт',summary:(value>0?'+':'')+fmt(value)+(key==='money'?' рё':' опыта'),op});q('#akcm-'+key).value=0;drawOperationQueue();message('Операция подтверждена и добавлена в очередь.');return;}
        if(button.hasAttribute('data-add-kit')){applyKit(val('kit'));return;}
        if(button.hasAttribute('data-save-kits')){try{kits=JSON.parse(val('kitsJson'));if(!Array.isArray(kits))throw Error('Нужен массив наборов.');render();message('Наборы обновлены в панели.');}catch(error){fieldError('kitsJson','JSON наборов не читается: '+error.message);}return;}
        if(button.hasAttribute('data-confirm-slots')){const draft=slotDraft();if(!draft.slots.some(Boolean))throw Error('Укажите количество покупаемых ячеек.');const base=operationBase(),op={...base,money:0,xp:-draft.cost,slots:draft.slots,levelSlots:false};operationQueue.push({kind:'Покупка ячеек',summary:draft.slots.map((n,i)=>n?RANKS[i]+' × '+n:'').filter(Boolean).join(', ')+'; −'+fmt(draft.cost)+' опыта',op});RANKS.slice(0,6).forEach(r=>q('#akcm-slot'+r).value=0);q('#akcm-slot-cost').textContent='К списанию: 0 опыта';drawOperationQueue();message('Покупка ячеек подтверждена и добавлена в очередь.');return;}
        if(button.dataset.removeOperation!==undefined){operationQueue.splice(Number(button.dataset.removeOperation),1);drawOperationQueue();message('Операция удалена из очереди.');return;}
        if(button.hasAttribute('data-new-job')){editJob();return;}
        if(button.dataset.editJob){editJob(button.dataset.editJob);return;}
        if(button.hasAttribute('data-cancel-job')){q('#akcm-job-form').innerHTML='';return;}
        if(button.dataset.saveJob){const job={id:button.dataset.saveJob==='new'?crypto.randomUUID():button.dataset.saveJob,title:val('job').trim(),salary:num(val('salary'),'ставка'),rank:val('jobRank')};if(!job.title)throw Error('Укажите должность.');const index=jobs.findIndex(j=>j.id===job.id);if(index<0)jobs.push(job);else jobs[index]=job;drawJobs();draftOp=null;return;}
        if(button.hasAttribute('data-load-artifact')){button.disabled=true;try{await loadArtifact(button.closest('[data-form]'));}finally{button.disabled=false;}return;}
        if(button.dataset.edit){const key=button.dataset.edit;addRow(key,lists[key][Number(button.dataset.index)],Number(button.dataset.index));return;}
        if(button.dataset.delete){const key=button.dataset.delete;lists[key].splice(Number(button.dataset.index),1);drawList(key);draftOp=null;return;}
        if(button.dataset.cancelRow){q('[data-form="'+button.dataset.cancelRow+'"]').innerHTML='';return;}
        if(button.dataset.saveRow){const key=button.dataset.saveRow,box=q('[data-form="'+key+'"]'),item={};box.querySelectorAll('[data-key]').forEach(el=>item[el.dataset.key]=el.value.trim());if(item.category==='__custom__')item.category=item.customCategory.trim();delete item.customCategory;if(key==='inventory')normalizeItemLink(item);if(key==='property'&&item.url)item.url=cleanUrl(item.url);if(key==='inventory'&&!item.category)throw Error('Укажите категорию.');if(key==='inventory'&&/артефакт/i.test(item.category)){const link=artifactLink(item.url);if(link.name){item.name=link.name;item.url=link.url;}else if(box.dataset.loadedUrl!==link.url){button.disabled=true;try{await loadArtifact(box);item.name=box.querySelector('[data-key="name"]').value;}finally{button.disabled=false;}}item.quantity=1;item.unit='шт.';item.note='';}if(!item.name)throw Error('Укажите название.');if(key==='inventory'){item.quantity=num(item.quantity,'количество');if(/артефакт/i.test(item.category)){if(!item.url)throw Error('Укажите ссылку артефакта.');Object.assign(item,artifactLink(item.url));}}const index=Number(box.dataset.index);if(index<0)lists[key].push(item);else lists[key][index]=item;box.innerHTML='';drawList(key);draftOp=null;return;}
        if(button.dataset.history){const entry=historyEdits.find(i=>i.id===button.dataset.history)||state.history.find(i=>i.id===button.dataset.history);q('#akcm-history-form').innerHTML='<div class="akcm-entry">'+field('historyMoney','Изменение кошелька',entry.money,'number')+field('historyXp','Изменение опыта',entry.xp,'number')+field('historyReason','Основание',entry.reason)+field('historyUrl','Ссылка',entry.url||'')+'<button type="button" data-save-history="'+esc(entry.id)+'">Сохранить исправление в черновик</button></div>';return;}
        if(button.dataset.saveHistory){const edit={id:button.dataset.saveHistory,money:num(val('historyMoney'),'деньги',-Number.MAX_SAFE_INTEGER),xp:num(val('historyXp'),'опыт',-Number.MAX_SAFE_INTEGER),reason:val('historyReason'),url:cleanUrl(val('historyUrl'))};historyEdits=historyEdits.filter(i=>i.id!==edit.id).concat(edit);q('#akcm-history-form').innerHTML='';drawHistory();draftOp=null;return;}
      }catch(error){message(error.message,true);return;}
      if(button.hasAttribute('data-remove')){button.closest('tr').remove();draftOp=null;return;}
      if(button.dataset.add){addRow(button.dataset.add);draftOp=null;return;}
      if(!button.dataset.action)return;
      busy=true;root.setAttribute('aria-busy','true');
      // Freeze all controls while a mutation is in flight to avoid lost edits.
      const disabled=Array.from(root.querySelectorAll('input,textarea,select,button')).map(el=>[el,el.disabled]);
      try {const work=action(button.dataset.action);disabled.forEach(([el])=>el.disabled=true);await work;}catch(error){message(error.message,true);if(button.dataset.action?.startsWith('service-'))q('#akcm-service-status').textContent=error.message;if(button.dataset.action?.startsWith('bulk-'))q('#akcm-bulk-status').textContent=error.message;const box=q('#akcm-preview');if(box){box.querySelectorAll('.akcm-errorbox').forEach(n=>n.remove());box.innerHTML='<div class="akcm-errorbox"><h3>Ошибка</h3><p>'+esc(error.message)+'</p></div>'+(box.innerHTML||'');}}finally{disabled.forEach(([el,was])=>el.disabled=was);busy=false;root.removeAttribute('aria-busy');q('[data-action="bulk-apply"]').disabled=!!bulkBatch?.complete;q('#akcm-bulk-amount').disabled=!!bulkBatch;q('#akcm-bulk-comment').disabled=!!bulkBatch;root.querySelectorAll('[data-bulk-character]').forEach(el=>el.disabled=!!bulkBatch);if(q('[data-action="technical-save"]')){q('[data-action="technical-design"]').disabled=!technicalSnapshot;q('[data-action="technical-save"]').disabled=!technicalSnapshot||!akcmCanEdit(technicalSnapshot.target);}}
    });
    action('list').catch(error=>message(error.message,true));
  }
  const CSS=`
  .akcm.akcm .akcm-registry-controls{display:grid!important;gap:16px;width:100%!important;min-width:0;margin:22px 0 10px;padding:18px;border:1px solid var(--line);border-radius:12px;background:var(--panel);box-sizing:border-box}.akcm.akcm .akcm-registry-filters{display:grid!important;grid-template-columns:minmax(0,1fr) auto auto;align-items:end;gap:14px;min-width:0}.akcm.akcm .akcm-registry-picker{display:grid!important;grid-template-columns:minmax(0,1fr) 190px;align-items:end;gap:14px;min-width:0}.akcm.akcm .akcm-registry-controls label{display:block!important;float:none!important;margin:0!important;width:auto!important;min-width:0!important;font-size:13px;line-height:1.4;text-transform:none!important;letter-spacing:normal!important}.akcm.akcm .akcm-registry-controls input[type=search],.akcm.akcm .akcm-registry-controls select{box-sizing:border-box!important;display:block!important;width:100%!important;min-width:0!important;max-width:100%!important;height:44px!important;padding:9px 12px!important;margin:6px 0 0!important;font:14px/1.4 var(--akcm-font-body,Arial,sans-serif)!important;text-transform:none!important;letter-spacing:normal!important;border:1px solid var(--line)!important;box-shadow:none!important;border-radius:7px!important}.akcm.akcm #akcm-character option{font:14px var(--akcm-font-body,Arial,sans-serif)!important;text-transform:none!important;letter-spacing:normal!important}.akcm.akcm .akcm-registry-controls .akcm-registry-active{display:flex!important;align-items:center;gap:8px;height:44px;white-space:nowrap}.akcm.akcm .akcm-registry-active input{flex:none;width:17px!important;height:17px!important;margin:0!important}.akcm.akcm .akcm-registry-controls button{box-sizing:border-box;min-height:44px;margin:0!important;padding:10px 16px!important;float:none!important;white-space:normal!important;font-size:13px!important;line-height:1.4!important;text-transform:none!important;letter-spacing:normal!important}.akcm.akcm #akcm-registry-filter-status{font-size:12px;color:var(--muted);margin:6px 0 14px}.akcm.akcm #akcm-status{font-size:13px;margin:8px 0}@media(max-width:700px){.akcm.akcm .akcm-registry-controls{padding:12px;gap:12px}.akcm.akcm .akcm-registry-filters{grid-template-columns:minmax(0,1fr) auto}.akcm.akcm .akcm-registry-search-label{grid-column:1/-1}.akcm.akcm .akcm-registry-picker{grid-template-columns:minmax(0,1fr)}.akcm.akcm .akcm-registry-picker button{width:100%!important}}

  .akcm #akcm-bulk-characters{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:6px 10px;max-height:300px;overflow:auto;padding:10px;border:1px solid var(--line);border-radius:10px;background:var(--panel);margin-bottom:16px;align-content:start}.akcm #akcm-bulk-characters label{display:flex!important;align-items:center;gap:8px;padding:7px 9px;margin:0!important;min-height:36px;font-size:13px;line-height:1.35;border-radius:6px;cursor:pointer;overflow-wrap:anywhere}.akcm #akcm-bulk-characters label:hover{background:var(--soft)}.akcm #akcm-bulk-characters label:has(input:checked){background:var(--soft);color:var(--accent)}.akcm #akcm-bulk-characters input{flex:none;margin:0!important}.akcm #akcm-bulk-characters label[hidden],.akcm #akcm-bulk-empty[hidden]{display:none!important}.akcm .akcm-bulk-search{max-width:460px}.akcm #akcm-bulk-selection{font-size:12px;color:var(--muted)}

  .akcm #akcm-first-code,.akcm #akcm-technical-code{min-height:360px;font-family:ui-monospace,Consolas,monospace!important;line-height:1.5!important}.akcm [role="tab"][aria-selected="true"]{background:var(--accent);color:var(--on-accent)}
  .akcm,.akcm-card{--ink:var(--akcm-text,#273d3e);--muted:var(--akcm-muted,#657675);--accent:var(--akcm-accent,#9e6147);--hover:var(--akcm-hover,#b47b50);--line:var(--akcm-border,#d8dfd9);--surface:var(--akcm-surface,#f5f3eb);--panel:var(--akcm-panel,#fffef9);--soft:var(--akcm-soft,#e9ede5);--on-accent:var(--akcm-on-accent,#fff);color:var(--ink);font:15px/1.6 var(--akcm-font-body,Arial,sans-serif);text-align:left;background:var(--surface);border:1px solid var(--line);border-radius:12px 36px 18px 18px;padding:clamp(16px,3vw,32px);box-sizing:border-box;max-width:1100px;margin:16px auto;box-shadow:-4px 6px 16px var(--akcm-shadow,rgba(0,0,0,.08))}
  .akcm *{box-sizing:border-box}.akcm header{border-bottom:1px solid var(--soft);padding-bottom:18px}.akcm small{font-size:11px;letter-spacing:1.5px;color:var(--muted)}.akcm h2{font:500 28px/1.25 var(--akcm-font-heading,Georgia,serif);margin:8px 0;color:var(--accent)}.akcm h3{font:500 18px/1.25 var(--akcm-font-heading,Arial,sans-serif);margin:0 0 15px;color:var(--accent);text-transform:uppercase}.akcm h4{font:500 14px/1.3 var(--akcm-font-heading,Arial,sans-serif);margin:14px 0 10px;color:var(--muted);text-transform:uppercase}.akcm p{margin:10px 0}.akcm section{padding:22px 0;border-bottom:1px solid var(--soft)}.akcm fieldset{border:0;padding:0;margin:0;min-width:0}.akcm details{border:1px solid var(--soft);border-radius:9px 22px 12px 12px;background:var(--panel);padding:10px 14px;margin:12px 0}.akcm summary{cursor:pointer;color:var(--accent);font-weight:600}
  .akcm input:not([type=checkbox]),.akcm select,.akcm textarea{display:block!important;width:100%!important;min-width:0!important;border:1px solid var(--soft)!important;background:var(--panel)!important;border-radius:9px 18px 9px 9px!important;padding:10px!important;color:var(--ink)!important;font:14px/1.4 var(--akcm-font-body,Arial,sans-serif)!important;letter-spacing:0!important;margin-top:5px}.akcm textarea{min-height:75px;resize:vertical}.akcm label{display:block;font-size:13px;margin-bottom:12px}.akcm input[type=checkbox]{width:auto;margin-right:7px}.akcm-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}.akcm-slots{display:grid;grid-template-columns:repeat(7,minmax(50px,1fr));gap:10px}
  .akcm-choice-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px;max-height:280px;overflow:auto;padding:10px;border:1px solid var(--soft);border-radius:10px 24px 12px 12px;background:var(--panel);margin:8px 0 20px}.akcm .akcm-choice{display:flex!important;align-items:center;gap:9px;margin:0!important;padding:10px 12px;border:1px solid transparent;border-radius:8px 18px 8px 8px;background:var(--soft);cursor:pointer}.akcm .akcm-choice:hover{border-color:var(--hover)}.akcm .akcm-choice:has(input:checked){border-color:var(--accent);color:var(--accent);background:var(--panel)}.akcm .akcm-choice input{flex:0 0 auto;margin:0!important}.akcm .akcm-choice small{display:inline-block;margin-right:5px;color:var(--accent)}
  .post-content.akcm-card,.akcm-card.akcm-card{display:block!important;float:none!important;clear:both!important;width:100%!important;max-width:100%!important;margin:0 auto!important;box-shadow:none!important}
  .akcm-card .custom_tag_shopcard,.akcm-card .shopcard,.akcm-card .shop-card{display:block!important;box-sizing:border-box!important;width:100%!important;max-width:none!important;margin:0!important;padding:12px!important;float:none!important;clear:both!important;border:0!important;border-radius:0!important;box-shadow:none!important;color:var(--ink)!important;background-color:var(--surface)!important;background-image:repeating-linear-gradient(45deg,color-mix(in srgb,var(--accent) 18%,transparent) 0 2px,transparent 2px 28px),repeating-linear-gradient(-45deg,color-mix(in srgb,var(--accent) 18%,transparent) 0 2px,transparent 2px 28px)!important;font:400 16px/1.55 var(--akcm-font-body,Arial,sans-serif)!important}
  .akcm-card .custom_tag_shopsection,.akcm-card .shopsection,.akcm-card .shop-section{display:block!important;box-sizing:border-box!important;width:100%!important;max-width:none!important;margin:0 0 20px!important;padding:0!important;border:1px solid var(--line)!important;border-radius:12px!important;background:var(--panel)!important;box-shadow:none!important;overflow:hidden!important}
  .akcm-card .custom_tag_shopsection:last-child,.akcm-card .shopsection:last-child,.akcm-card .shop-section:last-child{margin-bottom:0!important}
  .akcm-card .custom_tag_shoptitle,.akcm-card .shoptitle,.akcm-card .shop-title{display:block!important;box-sizing:border-box!important;width:100%!important;margin:0!important;padding:17px 26px!important;border:0!important;border-bottom:3px solid var(--accent)!important;border-radius:0!important;background:color-mix(in srgb,var(--ink) 78%,var(--accent))!important;color:var(--on-accent)!important;text-align:left!important;font:600 19px/1.25 var(--akcm-font-heading,Arial,sans-serif)!important;letter-spacing:.035em!important;text-transform:uppercase!important;box-shadow:none!important}
  .akcm-card .custom_tag_shoptitle *,.akcm-card .shoptitle *,.akcm-card .shop-title *{margin:0!important;color:inherit!important;font:inherit!important;letter-spacing:inherit!important;text-align:inherit!important}
  .akcm-card .custom_tag_shopcontent,.akcm-card .shopcontent,.akcm-card .shop-content{display:block!important;box-sizing:border-box!important;width:100%!important;max-width:none!important;margin:0!important;padding:20px 26px!important;border:0!important;border-radius:0!important;background:var(--panel)!important;color:var(--ink)!important;font:400 16px/1.55 var(--akcm-font-body,Arial,sans-serif)!important;box-shadow:none!important}
  .akcm-card .custom_tag_shopcontent table,.akcm-card .shopcontent table,.akcm-card .shop-content table{width:100%!important;max-width:none!important;margin:0 0 14px!important;font-family:var(--akcm-font-body,Arial,sans-serif)!important}
  @media(max-width:700px){.akcm-card .custom_tag_shopcard,.akcm-card .shopcard,.akcm-card .shop-card{padding:7px!important}.akcm-card .custom_tag_shoptitle,.akcm-card .shoptitle,.akcm-card .shop-title{padding:14px 16px!important;font-size:17px!important}.akcm-card .custom_tag_shopcontent,.akcm-card .shopcontent,.akcm-card .shop-content{padding:15px!important;font-size:14px!important}}
  .akcm-card .akcm,.akcm-card .akcm-card-inner,.akcm-card [data-bbcode="akcm"]{display:block!important;width:100%!important;max-width:100%!important;margin-right:auto!important;margin-left:auto!important;box-sizing:border-box!important}
  .akcm-card .akcmrankname,.akcm-card .custom_tag_akcmrankname,.akcm-card .akcm-rankname,.akcm-card .akcm__rankname,.akcm-card [data-bbcode="akcmrankname"]{display:flex!important;align-items:center!important;justify-content:center!important;text-align:center!important;line-height:1!important;padding:0!important}
  .akcm [aria-invalid="true"]{border-color:var(--hover)!important;box-shadow:0 0 0 2px color-mix(in srgb,var(--hover) 20%,transparent)}.akcm-field-error{display:block;margin-top:6px;color:var(--hover);font-weight:700}
  .akcm button{font:600 13px var(--akcm-font-body,Arial,sans-serif);background:var(--soft);color:var(--ink);border:1px solid var(--line);border-radius:8px 18px 8px 8px;padding:11px 15px;cursor:pointer}.akcm button:hover{border-color:var(--hover);color:var(--hover)}.akcm button.akcm-primary{background:var(--accent);border-color:var(--accent);color:var(--on-accent)}.akcm button.akcm-primary:hover{background:var(--hover);border-color:var(--hover);color:var(--on-accent)}.akcm button:disabled{opacity:.5;cursor:wait}.akcm :focus-visible{outline:3px solid var(--hover);outline-offset:2px}.akcm-toolbar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:20px 0}.akcm-toolbar select{flex:1;min-width:180px;width:auto}
  .akcm-metrics{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin:22px 0}.akcm-metrics>div{padding:18px;border-radius:9px 22px 12px 12px;background:var(--accent);color:var(--on-accent)}.akcm-metrics small{display:block;color:inherit;opacity:.76}.akcm-metrics strong{display:block;font-size:clamp(20px,3vw,30px);font-weight:500}.akcm-scroll{width:100%;max-height:430px;overflow:auto;padding:8px;border:1px solid var(--soft);border-radius:9px 22px 12px 12px;background:color-mix(in srgb,var(--panel) 82%,transparent);scrollbar-gutter:stable both-edges}.akcm table{width:100%;border-collapse:collapse;margin-bottom:10px;table-layout:fixed}.akcm th{padding:6px 8px;font:500 12px/1.25 var(--akcm-font-heading,Arial,sans-serif)!important;letter-spacing:.5px!important;text-align:left;color:var(--muted);text-transform:uppercase;white-space:nowrap!important;overflow-wrap:normal!important;word-break:normal!important;writing-mode:horizontal-tb!important}.akcm td{padding:4px;min-width:0;vertical-align:top;word-break:normal!important;writing-mode:horizontal-tb!important}.akcm-list{display:grid!important;gap:4px;width:max-content!important;border-collapse:separate!important}.akcm-list thead,.akcm-list tbody,.akcm-list tr{display:contents!important}.akcm-list colgroup{display:none!important}.akcm-list th,.akcm-list td{display:block!important;min-width:0!important}.akcm-list th{position:sticky;top:0;z-index:2;background:var(--surface)}.akcm-list input,.akcm-list select{margin:0!important}.akcm-list-inventory{grid-template-columns:250px 170px 120px 90px 240px 240px 42px}.akcm-list-property{grid-template-columns:340px 520px 42px}.akcm-list-missions,.akcm-list-quests{grid-template-columns:360px 90px 520px 42px}.akcm pre{white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.6 monospace;max-height:400px;overflow:auto;background:var(--panel);padding:16px}.akcm .error{color:var(--hover);font-weight:bold}
  .akcm-diff table{background:var(--panel);border:1px solid var(--soft)}.akcm-diff th,.akcm-diff td{border-bottom:1px solid var(--soft);padding:9px;text-align:left}.akcm-diff ul{margin:8px 0 0 18px;padding:0}.akcm-errorbox{margin:14px 0;padding:14px 16px;border:1px solid var(--hover);border-radius:9px 22px 12px 12px;background:color-mix(in srgb,var(--hover) 12%,var(--panel));color:var(--ink)}.akcm-errorbox h3{margin:0 0 8px!important;color:var(--hover)!important}.akcm-errorbox p{margin:0}
  .akcm-card table{table-layout:fixed;border-collapse:collapse;width:100%;margin:18px 0;background:var(--panel)}.akcm-card td:first-child{width:68%}.akcm-card td:last-child{width:32%}.akcm-card td{padding:14px 18px;border:1px solid var(--soft);vertical-align:top}.akcm-card>table:first-of-type,.akcm-card>table:nth-of-type(2){background:var(--accent);color:var(--on-accent)}.akcm-card details,.akcm-card .spoiler-box{border:1px solid var(--soft);border-radius:10px 26px 12px 12px;background:var(--panel);padding:12px 16px;margin:12px 0 24px}.akcm-card summary{color:var(--accent);cursor:pointer;font-weight:600}.akcm-card details table{margin:12px 0 0}.akcm-card td p{margin:0}.akcm-card>strong,.akcm-card>p>strong{color:var(--accent)}.akcm-card img{max-width:100%}.akcm-card{overflow-wrap:anywhere}.akcm-card .spoiler-box{margin-top:20px}.akcm-card pre{white-space:pre-wrap}
  .akcm-card table[width="72%"]{width:min(72%,760px)!important;margin:18px auto!important;background:var(--accent)!important;color:var(--on-accent)!important;border-radius:10px 28px 12px 12px!important;border-collapse:separate!important;overflow:hidden}.akcm-card table[width="72%"] td{width:auto!important;border:0!important;padding:13px 20px!important}.akcm-card table[width="72%"] a{color:inherit!important}.akcm-card .quote-box{max-width:920px;margin:14px auto 26px!important;border:1px solid var(--line)!important;border-radius:10px 26px 12px 12px!important;background:var(--panel)!important;padding:15px 20px!important}.akcm-card .quote-box .quote-box-head{display:none!important}.akcm-card .quote-box a{color:var(--accent)!important;font-weight:700}
  @media(max-width:760px){.akcm-metrics{grid-template-columns:1fr}.akcm-slots{grid-template-columns:repeat(3,1fr)}.akcm-grid{grid-template-columns:1fr}.akcm h2{font-size:24px}.akcm-toolbar{display:grid;grid-template-columns:1fr}.akcm-toolbar select,.akcm-toolbar button{width:100%}.akcm-card td{padding:8px;font-size:13px}.akcm-card td:last-child{width:35%}.akcm-card>table:nth-of-type(-n+2) td{display:block;width:auto!important}.akcm-card>table:nth-of-type(-n+2) td:last-child{white-space:nowrap}.akcm-card>table:nth-of-type(-n+2){display:table;width:100%}}
  .akcm.akcm .akcm-actions{display:flex!important;flex-wrap:wrap!important;align-items:center!important;gap:12px!important;margin:14px 0!important;min-width:0}
  .akcm.akcm button{position:static!important;float:none!important;transform:none!important;height:auto!important;line-height:1.4!important;white-space:normal!important;max-width:100%!important}
  .akcm.akcm .akcm-entry>button{margin:12px 12px 0 0!important}.akcm.akcm label>button{margin-top:12px!important}.akcm.akcm .akcm-actions>button{margin:0!important}
  .akcm.akcm .akcm-grid{align-items:end!important;gap:20px!important}.akcm.akcm .akcm-grid>label{display:flex!important;flex-direction:column!important;justify-content:flex-end!important;margin:0!important;align-self:stretch!important;min-width:0}.akcm.akcm .akcm-grid>label>input,.akcm.akcm .akcm-grid>label>select{margin:10px 0 0!important;min-height:44px!important}
  .akcm.akcm .akcm-payroll{margin-top:20px!important}.akcm.akcm .akcm-record>button{flex-shrink:0;align-self:center}.akcm.akcm .akcm-grid>.akcm-actions{margin:0!important;align-self:end}
  .akcm-operation-list{display:grid;grid-template-columns:1fr;gap:14px;margin:18px 0 26px}.akcm-operation-card{display:grid;grid-template-columns:minmax(0,1fr) minmax(220px,320px);align-items:end;gap:18px;padding:18px;border:1px solid var(--soft);border-radius:10px 24px 10px 10px;background:color-mix(in srgb,var(--panel) 88%,var(--soft))}.akcm-operation-card label{margin:0}.akcm-operation-card button{min-height:44px;width:100%}
  .akcm-card table:has(td:only-child){background:var(--accent)!important;color:var(--on-accent)!important;border-radius:12px;overflow:hidden;margin:16px 0 24px!important}
  .akcm-card table td:only-child{width:100%!important;text-align:center!important;padding:20px!important;border:0!important;background:var(--accent)!important;color:var(--on-accent)!important;font-variant-numeric:tabular-nums}
  .akcm.akcm [hidden],.akcm.akcm #akcm-editor [hidden]{display:none!important}
  .akcm.akcm .akcm-diff-table{border:1px solid var(--line);background:var(--panel)}.akcm.akcm .akcm-diff-row{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;border-bottom:1px solid var(--line)}.akcm.akcm .akcm-diff-cell{padding:10px;overflow-wrap:anywhere;min-width:0;font:14px/1.5 var(--akcm-font-body,Arial,sans-serif);text-align:left}.akcm.akcm .akcm-diff-heading{font-weight:700;background:var(--soft)}
  .akcm.akcm h3{text-align:center!important;clear:both!important}
  .akcm.akcm .akcm-records,.akcm.akcm #akcm-history-entries{max-height:520px;overflow:auto;scrollbar-gutter:stable;scrollbar-width:auto}
  .akcm.akcm .akcm-record{display:flex!important;justify-content:space-between;gap:16px;padding:14px!important;margin:8px 0!important;background:var(--panel);border:1px solid var(--line);border-radius:10px;min-width:0}
  .akcm.akcm .akcm-record>div:first-child{flex:1;min-width:0;overflow-wrap:anywhere}.akcm.akcm .akcm-record>div:last-child{flex-shrink:0}.akcm.akcm .akcm-record p{margin:3px 0!important;font:14px/1.5 var(--akcm-font-body,Arial,sans-serif)!important}.akcm.akcm .akcm-record strong{font-size:16px!important}
  .akcm.akcm .akcm-entry{padding:18px;margin:15px 0;background:var(--panel);border:2px solid var(--accent);border-radius:10px}.akcm.akcm .akcm-entry label:first-child{grid-column:1/-1}
  .akcm.akcm table{display:table!important;width:100%!important;table-layout:fixed!important;border-collapse:collapse!important}.akcm.akcm thead{display:table-header-group!important}.akcm.akcm tbody{display:table-row-group!important}.akcm.akcm tr{display:table-row!important}.akcm.akcm th,.akcm.akcm td{display:table-cell!important;position:static!important;float:none!important;width:auto!important;max-width:none!important;min-width:0!important;white-space:normal!important;overflow-wrap:anywhere!important;padding:10px!important;text-align:left!important;font:14px/1.5 var(--akcm-font-body,Arial,sans-serif)!important;letter-spacing:normal!important}.akcm.akcm th{font-weight:700!important;background:var(--soft)!important}
  .akcm.akcm .akcm-metrics{text-align:center;font-variant-numeric:tabular-nums}.akcm.akcm #akcm-topic-link{padding:12px 0;overflow-wrap:anywhere}.akcm.akcm label{float:none!important;width:auto!important}.akcm-card{font-variant-numeric:tabular-nums}.akcm-card>.post-sig,.akcm-card .post-sig{display:none!important}.akcm-card>table:first-of-type,.akcm-card>table:nth-of-type(2){background:var(--panel);color:var(--ink)}
  .akcm.akcm .akcm-card table[width="72%"]{width:min(64%,720px)!important;margin:16px auto 20px!important;background:var(--accent)!important;color:var(--on-accent)!important;border:0!important;border-radius:10px 26px 12px 12px!important;border-collapse:separate!important;overflow:hidden}
  .akcm.akcm .akcm-card table[width="72%"] td{display:table-cell!important;width:100%!important;padding:13px 20px!important;border:0!important;text-align:center!important;background:transparent!important;color:inherit!important}
  .akcm.akcm .akcm-card .quote-box{max-width:920px;margin:14px auto 26px!important;border:1px solid var(--line)!important;border-radius:10px 26px 12px 12px!important;background:var(--panel)!important;padding:15px 20px!important;color:var(--ink)!important}
  .akcm.akcm .akcm-card table[width="64%"]{width:min(64%,720px)!important;margin:18px auto 14px!important;background:var(--accent)!important;color:var(--on-accent)!important;border:0!important;border-radius:10px 26px 12px 12px!important;border-collapse:separate!important;overflow:hidden}
  .akcm.akcm .akcm-card table[width="64%"] td{width:100%!important;padding:15px 20px!important;border:0!important;text-align:center!important;background:transparent!important;color:inherit!important}
  .akcm.akcm .akcm-card table[width="93%"]{width:min(93%,1080px)!important;margin:0 auto 28px!important;background:var(--panel)!important;color:var(--ink)!important;border:1px solid var(--accent)!important;border-radius:10px 26px 12px 12px!important;border-collapse:separate!important;overflow:hidden}
  .akcm.akcm .akcm-card table[width="93%"] td{width:33.333%!important;padding:17px 14px!important;border:0!important;text-align:center!important;background:transparent!important;color:var(--ink)!important;vertical-align:middle!important}
  .akcm.akcm .akcm-card table[width="93%"] a{color:var(--accent)!important;font-weight:700}  @media(max-width:600px){.akcm-operation-card{grid-template-columns:1fr;padding:13px;gap:10px}.akcm.akcm .akcm-record{gap:8px}.akcm.akcm .akcm-entry{padding:10px}.akcm.akcm th,.akcm.akcm td{font-size:12px!important;padding:6px!important}.akcm.akcm .akcm-card table[width="72%"],.akcm.akcm .akcm-card table[width="64%"],.akcm.akcm .akcm-card table[width="93%"]{width:100%!important}}
  .akcm-card.akcm-card.akcm-card .akcm-specialization-heading{display:table!important;width:100%!important;max-width:100%!important;height:auto!important;min-height:0!important;margin:18px auto 14px!important;border:0!important;border-radius:12px 26px 12px 12px!important;background:var(--accent)!important;color:var(--on-accent)!important;overflow:hidden}
  .akcm-card.akcm-card.akcm-card .akcm-specialization-heading td{width:100%!important;height:auto!important;padding:20px!important;border:0!important;text-align:center!important;background:transparent!important;color:inherit!important}
  .akcm-card.akcm-card.akcm-card .akcm-specialization-items{display:block!important;box-sizing:border-box!important;width:100%!important;max-width:100%!important;height:auto!important;min-height:0!important;margin:0 auto 26px!important;padding:16px!important;border:1px solid var(--accent)!important;border-radius:12px 26px 12px 12px!important;background:var(--panel)!important;color:var(--ink)!important;overflow:visible!important}
  .akcm-card.akcm-card.akcm-card .akcm-specialization-items tbody,.akcm-card.akcm-card.akcm-card .akcm-specialization-items tr{display:contents!important;height:auto!important}
  .akcm-card.akcm-card.akcm-card .akcm-specialization-items{display:flex!important;flex-wrap:wrap!important;justify-content:center!important;align-items:center!important;gap:12px 24px!important}
  .akcm-card.akcm-card.akcm-card .akcm-specialization-items td{display:block!important;flex:0 1 auto!important;box-sizing:border-box!important;width:auto!important;max-width:100%!important;min-width:0!important;height:auto!important;min-height:0!important;padding:8px 12px!important;border:0!important;background:transparent!important;color:var(--ink)!important;text-align:center!important;white-space:normal!important;overflow-wrap:anywhere!important}
  .akcm-card.akcm-card.akcm-card .akcm-specialization-items td p{margin:0!important;text-align:center!important}
  .akcm-card.akcm-card.akcm-card .akcm-specialization-items a{color:var(--accent)!important}
  :where(.custom_tag_shopcard,.shopcard,.shop-card) :is(.quote-box,.spoiler-box)>:first-child{font-family:var(--font-g,"Nunito Sans",Arial,sans-serif)!important;font-style:normal!important;font-weight:600!important;letter-spacing:normal!important;text-transform:none!important}
`;
  return {playerId,serviceRequest,serviceRegistry,serviceCharacter,serviceExisting,servicePreview,serviceDebit,RANKS,SLOT_PRICES,topicIdFromLink,fresh,totals,validate,parse,serialize,transition,transitionBatch,patchSecond,readAge,patchAge,firstPostDesign,artifactTitle,livingRate,purchaseReceipt,artifactLink,normalizeItemLink,card,forumAdapter,readLevel,activePersonalTopics,sourceLevel,bulkExperience,commit,refreshCard,synchronize,migrate,boot,panel,CSS};
});




