// mubb-battle-assistant ver 69
(function () {
  'use strict';
  if ([1, 2, 5].indexOf(Number(window.GroupID || (window.FORUM && window.FORUM.group_id))) === -1) return;
/* CHARACTER_TEMPLATE_START */
/* Shared personal-case template adapter. No network calls. */
function akcmLegacyCode(raw) {
  if (!/\[akcm\]/i.test(raw)) return raw;
  var text = String(raw), row = function (name, value) { return '[tr][td]' + name + '[/td][td]' + value + '[/td][/tr]'; };
  text = text.replace(/\[akcmhead\]([\s\S]*?)\[\/akcmhead\]/gi, function (_, body) {
    var level = body.match(/\[akcmtitle\]\s*\u0423\u0440\u043e\u0432\u0435\u043d\u044c\s+(\d+)\s*\[\/akcmtitle\]/i), sum = body.match(/\[akcmvalue\]([\s\S]*?)\[\/akcmvalue\]/i);
    return level ? '[table]' + row('\u0423\u0440\u043e\u0432\u0435\u043d\u044c', level[1]) + (sum ? row('\u041e\u0431\u0449\u0430\u044f \u0441\u0443\u043c\u043c\u0430', sum[1]) : '') + '[/table]' : '';
  });
  text = text.replace(/\[akcmskill\]([\s\S]*?)\[\/akcmskill\]/gi, function (_, body) {
    return row((body.match(/\[akcmname\]([\s\S]*?)\[\/akcmname\]/i) || [,''])[1], (body.match(/\[akcmvalue\]([\s\S]*?)\[\/akcmvalue\]/i) || [,''])[1]);
  });
  text = text.replace(/\[akcmrow\]([\s\S]*?)\[\/akcmrow\]/gi, function (_, body) {
    var name = (body.match(/\[akcmname\]([\s\S]*?)\[\/akcmname\]/i) || [,''])[1].replace('\u0410\u0442\u0430\u043a\u0430: \u0431\u043b\u0438\u0436\u043d\u0438\u0439', '\u0410\u0442\u0430\u043a\u0430 \u0431\u043b\u0438\u0436\u043d\u0438\u0439');
    var values = Array.from(body.matchAll(/\[akcmval\]([\s\S]*?)\[\/akcmval\]/gi)).map(function (m) { return (m[1].match(/\[akcmvalue\]([\s\S]*?)\[\/akcmvalue\]/i) || [,''])[1]; });
    if (!values.length) values = [(body.match(/\[akcmvalues?\]([\s\S]*?)\[\/akcmvalues?\]/i) || [,''])[1]];
    return '[tr][td]' + name + '[/td]' + values.map(function (v) { return '[td]' + v + '[/td]'; }).join('') + '[/tr]';
  });
  text = text.replace(/\[akcmrank\]([\s\S]*?)\[\/akcmrank\]/gi, function (_, body) { return row('\u0420\u0430\u043d\u0433: ' + (body.match(/\[akcmrankname\]([\s\S]*?)\[\/akcmrankname\]/i) || [,''])[1], (body.match(/\[akcmlist\]([\s\S]*?)\[\/akcmlist\]/i) || [,''])[1]); });
  text = text.replace(/\[akcmabilities\]([\s\S]*?)\[\/akcmabilities\]/gi, function (_, body) { return '[table]' + row('\u0421\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u0438', body) + '[/table]'; });
  text = text.replace(/\[akcmequipment\]([\s\S]*?)\[\/akcmequipment\]/gi, function (_, body) { return '[table][tr][td]' + body.replace(/\[akcmsection\]([\s\S]*?)\[\/akcmsection\]/gi, '[b]$1[/b]\n').replace(/\[akcmequiprow\]([\s\S]*?)\[\/akcmequiprow\]/gi, function (_, entry) { return '\u2022 ' + entry.replace(/\[\/akcmvalue\]\s*\[akcm(?:name|small)\]/gi, ': ') + '\n'; }) + '[/td][/tr][/table]'; });
  return text.replace(/\[\/?(?:akcmskills|akcmcombat|akcmtechniques)\]/gi, function (tag) { return tag.indexOf('[/') === 0 ? '[/table]' : '[table]'; }).replace(/\[akcmsection\][\s\S]*?\[\/akcmsection\]/gi, '').replace(/\[\/akcmitem\]/gi, '\n').replace(/\[\/?akcm\w*\]/gi, '').replace(/\[\/?widepost\]/gi, '');
}
function akcmTemplateCode(raw) {
  raw = String(raw).replace(/\[\/?widepost\]/gi, '').trim();
  if (/\[akcm\]/i.test(raw)) return '[widepost]\n' + raw;
  var plain = function (s) { return s.replace(/\[[^\]]*\]/g, '').trim(); }, skills = [], combat = [], ranks = [], ability = '', level = '', sum = '', remaining = raw;
  var skillNames = /^(\u0427\u0430\u043a\u0440\u0430|\u0421\u0438\u043b\u0430|\u0421\u043a\u043e\u0440\u043e\u0441\u0442\u044c|\u0422\u0430\u043a\u0442\u0438\u043a\u0430|\u041d\u0438\u043d\u0434\u0437\u044e\u0446\u0443|\u0422\u0430\u0439\u0434\u0437\u044e\u0446\u0443|\u0413\u0435\u043d\u0434\u0437\u044e\u0446\u0443|\u0424\u0443\u0438\u043d\u0434\u0437\u044e\u0446\u0443|\u0417\u0434\u043e\u0440\u043e\u0432\u044c\u0435|\u0417\u043d\u0430\u043d\u0438\u044f)$/i;
  remaining = remaining.replace(/\[table[^\]]*\]([\s\S]*?)\[\/table\]/gi, function (table, body) {
    var handled = false, previous = '', unknown = [];
    body.replace(/\[tr[^\]]*\]([\s\S]*?)\[\/tr\]/gi, function (row, content) {
      var cells = Array.from(content.matchAll(/\[td[^\]]*\]([\s\S]*?)\[\/td\]/gi)).map(function (m) { return m[1]; });
      var label = plain(cells[0] || ''), value = cells.slice(1).join('\n');
      if (/^\u0423\u0440\u043e\u0432\u0435\u043d\u044c\s*:?$/i.test(label)) { level = plain(value); handled = true; }
      else if (skillNames.test(label)) { skills.push('[akcmskill][akcmname]' + label + '[/akcmname][akcmvalue]' + value + '[/akcmvalue][/akcmskill]'); handled = true; }
      else if (/^\u041e\u0431\u0449\u0430\u044f \u0441\u0443\u043c\u043c\u0430$/i.test(label)) { sum = value; handled = true; }
      else if (/^\u041e\u0431\u0449\u0430\u044f \u0441\u0443\u043c\u043c\u0430$/i.test(previous) && cells.length === 1) { sum = cells[0]; handled = true; }
      else if (/^\u0420\u0430\u043d\u0433\s*:/i.test(label)) { ranks.push('[akcmrank][akcmrankname]' + label.replace(/^\u0420\u0430\u043d\u0433\s*:\s*/i, '') + '[/akcmrankname][akcmlist]\n' + value.split(/\n+/).filter(function (s) { return s.trim(); }).map(function (s) { return '[akcmitem]' + s + '[/akcmitem]'; }).join('\n') + '\n[/akcmlist][/akcmrank]'); handled = true; }
      else if (/^\u0421\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u0438$/i.test(label)) { ability = value; handled = true; }
      else if (/^(\u0411\u043e\u0435\u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u044c|\u0417\u0430\u043f\u0430\u0441\s+\u0427\u0430\u043a\u0440\u044b|\u0423\u0440\u043e\u043d|\u0417\u0430\u0449\u0438\u0442\u0430|\u041a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439|\u0410\u0442\u0430\u043a\u0430|\u0423\u043a\u043b\u043e\u043d\u0435\u043d\u0438\u0435|\u0411\u0430\u0437\u043e\u0432\u044b\u0439 \u043a\u0440\u0438\u0442)/i.test(label) && cells.length >= 2) {
        var labels = /^\u0417\u0430\u043f\u0430\u0441/i.test(label) ? ['\u041e\u0431\u0449\u0438\u0439', '\u0421\u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u043e\u0439'] : ['\u041e\u0431\u044b\u0447\u043d\u044b\u0445', '\u0422\u0435\u0445\u043d\u0438\u043a\u0438'];
        value = cells.length === 3 ? '[akcmvalues]' + cells.slice(1).map(function (v, i) { return '[akcmval][akcmsmall]' + labels[i] + '[/akcmsmall][akcmvalue]' + v + '[/akcmvalue][/akcmval]'; }).join('') + '[/akcmvalues]' : '[akcmvalue]' + value + '[/akcmvalue]';
        combat.push('[akcmrow][akcmname]' + label + '[/akcmname]' + value + '[/akcmrow]'); handled = true;
      } else if (label && !/^(\u0421\u043a\u0438\u043b\u043b\u044b \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0430|\u0422\u0435\u0445\u043d\u0438\u043a\u0438 \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0430)$/i.test(label)) unknown.push(row);
      previous = label;
    });
    return handled ? (unknown.length ? '[table]' + unknown.join('\n') + '[/table]' : '') : table;
  });
  if (!level || skills.length !== 10) throw new Error('\u041d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u044b \u0443\u0440\u043e\u0432\u0435\u043d\u044c \u0438 \u0434\u0435\u0441\u044f\u0442\u044c \u0441\u043a\u0438\u043b\u043b\u043e\u0432. \u0418\u0441\u0445\u043e\u0434\u043d\u044b\u0439 \u043f\u043e\u0441\u0442 \u043e\u0441\u0442\u0430\u0432\u043b\u0435\u043d \u0431\u0435\u0437 \u0438\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u0439.');
  remaining = remaining.replace(/\[table[^\]]*\]([\s\S]*?)\[\/table\]/gi, function (table, body) {
    if (!/\u042d\u041a\u0418\u041f\u0418\u0420\u041e\u0412\u041a\u0410 \u041f\u0415\u0420\u0421\u041e\u041d\u0410\u0416\u0410/i.test(plain(body))) return table;
    var parts = Array.from(body.matchAll(/\[td[^\]]*\]([\s\S]*?)\[\/td\]/gi)).map(function (m) { return m[1]; });
    return '[akcmequipment][akcmhead][akcmheadpart][akcmcaption]\u041b\u0438\u0447\u043d\u043e\u0435 \u0434\u0435\u043b\u043e \u00b7 \u0441\u043d\u0430\u0440\u044f\u0436\u0435\u043d\u0438\u0435[/akcmcaption][akcmtitle]\u042d\u043a\u0438\u043f\u0438\u0440\u043e\u0432\u043a\u0430[/akcmtitle][/akcmheadpart][/akcmhead]\n' + parts.slice(1).map(function (part) {
      var lines = part.split(/\n+/), title = plain(lines.shift()).replace(/^[\u25c8\u2694]\s*/, '');
      return '[akcmsection]' + title + '[/akcmsection][akcmequiplist]' + lines.filter(function (line) { return line.trim(); }).map(function (line) { var match = line.replace(/^\u2022\s*/, '').split(/\s+\u2014\s+|:\s+/); return '[akcmequiprow][akcmvalue]' + match.shift() + '[/akcmvalue][akcmname]' + match.join(' \u2014 ') + '[/akcmname][/akcmequiprow]'; }).join('\n') + '[/akcmequiplist]';
    }).join('\n') + '[/akcmequipment]';
  });
  return '[widepost]\n[akcm]\n[akcmhead][akcmheadpart][akcmcaption]\u041b\u0438\u0447\u043d\u043e\u0435 \u0434\u0435\u043b\u043e \u00b7 \u0445\u0430\u0440\u0430\u043a\u0442\u0435\u0440\u0438\u0441\u0442\u0438\u043a\u0438[/akcmcaption][akcmtitle]\u0423\u0440\u043e\u0432\u0435\u043d\u044c ' + level + '[/akcmtitle][/akcmheadpart][akcmheadpart][akcmsmall]\u041e\u0431\u0449\u0430\u044f \u0441\u0443\u043c\u043c\u0430[/akcmsmall][akcmvalue]' + sum + '[/akcmvalue][/akcmheadpart][/akcmhead]\n[akcmsection]\u0421\u043a\u0438\u043b\u043b\u044b \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0430[/akcmsection][akcmskills]\n' + skills.join('\n') + '\n[/akcmskills]\n[akcmsection]\u0411\u043e\u0435\u0432\u044b\u0435 \u043f\u0430\u0440\u0430\u043c\u0435\u0442\u0440\u044b[/akcmsection][akcmcombat]\n' + combat.join('\n') + '\n[/akcmcombat]\n[akcmsection]\u0422\u0435\u0445\u043d\u0438\u043a\u0438 \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0430[/akcmsection][akcmtechniques]\n' + ranks.join('\n') + '\n[/akcmtechniques]\n[akcmsection]\u0421\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u0438[/akcmsection][akcmabilities]' + ability + '[/akcmabilities]\n[/akcm]\n' + remaining.trim();
}
function akcmNormalizePost(post) {
  if (!post) return post;
  var clone = post.cloneNode(true), select = function (tag, scope) { return (scope || clone).querySelectorAll('.' + tag + ',.custom_tag_' + tag + ',.akcm-' + tag.slice(4) + ',.akcm__' + tag.slice(4) + ',[data-bbcode="' + tag + '"]'); };
  var skills = select('akcmskill');
  if (!skills.length) return post;
  var doc = post.ownerDocument, table = doc.createElement('table');
  function row(name, values) { var tr = table.insertRow(); tr.insertCell().textContent = name; values.forEach(function (value) { tr.insertCell().innerHTML = value; }); }
  var title = Array.from(select('akcmtitle')).find(function (n) { return /\u0423\u0440\u043e\u0432\u0435\u043d\u044c\s*\d+/i.test(n.textContent); });
  if (title) row('\u0423\u0440\u043e\u0432\u0435\u043d\u044c', [title.textContent.match(/\d+/)[0]]);
  var head = select('akcmhead')[0];
  if (head) { var sum = select('akcmvalue', head)[0]; if (sum) row('\u041e\u0431\u0449\u0430\u044f \u0441\u0443\u043c\u043c\u0430', [sum.innerHTML]); }
  Array.from(skills).concat(Array.from(select('akcmrow'))).forEach(function (node) {
    var name = select('akcmname', node)[0], vals = select('akcmval', node), values;
    if (!name) return;
    if (vals.length) values = Array.from(vals).map(function (v) { var value = select('akcmvalue', v)[0]; return value ? value.innerHTML : ''; });
    else { var value = select('akcmvalues', node)[0] || select('akcmvalue', node)[0]; values = [value ? value.innerHTML : '']; }
    var label = name.textContent.replace('\u0410\u0442\u0430\u043a\u0430: \u0431\u043b\u0438\u0436\u043d\u0438\u0439','\u0410\u0442\u0430\u043a\u0430 \u0431\u043b\u0438\u0436\u043d\u0438\u0439');
    if (/^\u0417\u0430\u0449\u0438\u0442\u0430 \u043e\u0442 \u044f\u0434\u043e\u0432/i.test(label)) label = '\u0417\u0430\u0449\u0438\u0442\u0430 \u043e\u0442 \u044f\u0434\u043e\u0432 \u0438 \u0431\u043e\u043b\u0435\u0437\u043d\u0435\u0439';
    row(label, values);
  });
  Array.from(select('akcmrank')).forEach(function (node) { var rank = select('akcmrankname', node)[0], list = select('akcmlist', node)[0]; if (rank && list) row('\u0420\u0430\u043d\u0433: ' + rank.textContent, [list.innerHTML]); });
  Array.from(select('akcmabilities')).forEach(function (node) { row('\u0421\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u0438', [node.innerHTML]); });
  var equipment = select('akcmequipment')[0];
  var scopedInventory = typeof akcmThirdSection === 'function' ? akcmThirdSection(clone, '\u0418\u043d\u0432\u0435\u043d\u0442\u0430\u0440\u044c') : clone;
  var inventory = scopedInventory && scopedInventory !== clone ? scopedInventory : Array.from(clone.querySelectorAll('.spoiler-box,details')).find(function (node) { var title=node.querySelector(':scope > div:first-child,:scope > summary');return title&&/^\u0438\u043d\u0432\u0435\u043d\u0442\u0430\u0440\u044c$/i.test(title.textContent.trim()); });
  var free = clone.textContent.match(/-?\s*\u0441\u0432\u043e\u0431\u043e\u0434\u043d\u044b\u0439 \u0441\u043b\u043e\u0442 \u0442\u0435\u0445\u043d\u0438\u043a\u0438 \u043b\u044e\u0431\u043e\u0433\u043e \u0440\u0430\u043d\u0433\u0430/gi) || [];
  clone.innerHTML = ''; clone.appendChild(table);
  free.forEach(function (text) { var p=doc.createElement('p');p.textContent=text;clone.appendChild(p); });
  if (equipment) {
    Array.from(select('akcmequiprow', equipment)).forEach(function (entry) { var value=select('akcmvalue',entry)[0], name=select('akcmname',entry)[0]||select('akcmsmall',entry)[0];entry.textContent='\u2022 '+(value?value.textContent:'')+(name?' \u2014 '+name.textContent:''); });
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
    if (heading && heading.textContent.trim().toLowerCase().replace(/\u0451/g,'\u0435') === title.toLowerCase().replace(/\u0451/g,'\u0435')) return sections[i];
  }
  return post;
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
  function unavailable() { return new Error('\u0420\u2014\u0420\u00b0\u0420\u0456\u0421\u0402\u0421\u0453\u0420\u00b7\u0420\u0454\u0420\u00b0 \u0420\u0457\u0421\u0402\u0420\u0451\u0420\u0455\u0421\u0403\u0421\u201a\u0420\u00b0\u0420\u0405\u0420\u0455\u0420\u0406\u0420\u00bb\u0420\u00b5\u0420\u0405\u0420\u00b0 \u0420\u0457\u0420\u0455\u0421\u0403\u0420\u00bb\u0420\u00b5 \u0420\u0455\u0421\u20ac\u0420\u0451\u0420\u00b1\u0420\u0454\u0420\u0451 \u0421\u201e\u0420\u0455\u0421\u0402\u0421\u0453\u0420\u0458\u0420\u00b0. \u0420\u045f\u0420\u0455\u0420\u0406\u0421\u201a\u0420\u0455\u0421\u0402\u0420\u0451\u0421\u201a\u0420\u00b5 \u0420\u0406\u0421\u0402\u0421\u0453\u0421\u2021\u0420\u0405\u0421\u0453\u0421\u040b \u0420\u0457\u0420\u0455\u0420\u00b7\u0420\u00b6\u0420\u00b5.'); }
  function canonical(value) {
    var url = new URL(value, window.location.href);
    if (!/^https?:$/.test(url.protocol)) throw new Error('\u0420\u045c\u0420\u00b5\u0420\u0491\u0420\u0455\u0420\u0457\u0421\u0453\u0421\u0403\u0421\u201a\u0420\u0451\u0420\u0458\u0421\u2039\u0420\u2116 \u0420\u00b0\u0420\u0491\u0421\u0402\u0420\u00b5\u0421\u0403 \u0420\u00b7\u0420\u00b0\u0420\u0456\u0421\u0402\u0421\u0453\u0420\u00b7\u0420\u0454\u0420\u0451');
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
    if (queue.length >= MAX_QUEUE) return Promise.reject(new Error('\u0420\u040e\u0420\u00bb\u0420\u0451\u0421\u20ac\u0420\u0454\u0420\u0455\u0420\u0458 \u0420\u0458\u0420\u0405\u0420\u0455\u0420\u0456\u0420\u0455 \u0421\u0403\u0421\u201a\u0421\u0402\u0420\u00b0\u0420\u0405\u0420\u0451\u0421\u2020 \u0420\u0491\u0420\u00bb\u0421\u040f \u0420\u0455\u0420\u0491\u0420\u0405\u0420\u0455\u0420\u2116 \u0420\u00b7\u0420\u00b0\u0420\u0456\u0421\u0402\u0421\u0453\u0420\u00b7\u0420\u0454\u0420\u0451. \u0420\u0408\u0421\u201a\u0420\u0455\u0421\u2021\u0420\u0405\u0420\u0451\u0421\u201a\u0420\u00b5 \u0420\u0406\u0421\u2039\u0420\u00b1\u0420\u0455\u0421\u0402.'));
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
          if (!doc || !doc.querySelector) { reject(new Error('\u0420\u045f\u0421\u0453\u0421\u0403\u0421\u201a\u0420\u0455\u0420\u2116 HTML-\u0420\u0491\u0420\u0455\u0420\u0454\u0421\u0453\u0420\u0458\u0420\u00b5\u0420\u0405\u0421\u201a')); return; }
          resolve(doc);
        };
        xhr.onerror = xhr.ontimeout = xhr.onabort = function () { reject(new Error('\u0420\u045b\u0421\u20ac\u0420\u0451\u0420\u00b1\u0420\u0454\u0420\u00b0 \u0421\u0403\u0420\u00b5\u0421\u201a\u0420\u0451 \u0420\u0451\u0420\u00bb\u0420\u0451 \u0421\u201a\u0420\u00b0\u0420\u2116\u0420\u0458-\u0420\u00b0\u0421\u0453\u0421\u201a \u0420\u00b7\u0420\u00b0\u0420\u0456\u0421\u0402\u0421\u0453\u0420\u00b7\u0420\u0454\u0420\u0451')); };
        xhr.send();
      });
    }, fresh ? 0 : (/^\/viewtopic\.php$/.test(new URL(url).pathname) && /^(73|74|75|76|77|78|79|82|83)$/.test(new URL(url).searchParams.get('id') || '') ? 600000 : 60000));
  }
  host.AkatsukiNetworkV2 = { request: request, document: documentRequest, canonical: canonical };
  return host.AkatsukiNetworkV2;
}

/* NETWORK_HELPER_END */
/* NPC_HELPER_START */
/* Shared NPC master-post adapter. All network calls use the existing scheduler. */
function npcCatalog(doc, base, topicId) {
  var master = doc.querySelector('.post-content'), items = [], seen = {};
  if (!master) throw new Error('\u041c\u0430\u0441\u0442\u0435\u0440-\u043f\u043e\u0441\u0442 \u041d\u041f\u0421 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d');
  Array.prototype.forEach.call(master.querySelectorAll('table tr'), function (row) {
    if (row.cells.length < 2) return;
    var type = row.cells[0].textContent.replace(/\s+/g, ' ').trim();
    if (!type || /\u0430\u0440\u0445\u0438\u0432/i.test(type)) return;
    Array.prototype.forEach.call(row.cells[1].querySelectorAll('a[href]'), function (link) {
      var url; try { url = new URL(link.getAttribute('href'), base); } catch (_) { return; }
      var match = url.hash.match(/^#p(\d+)$/);
      if (url.origin !== new URL(base).origin || url.searchParams.get('id') !== String(topicId) || !match || seen[match[1]]) return;
      var name = link.textContent.replace(/\s+/g, ' ').trim();
      if (!name) return;
      seen[match[1]] = true;
      items.push({ id: 'npc:' + match[1], postId: match[1], topicId: String(topicId), name: name, type: type, npc: true, url: url.href });
    });
  });
  return items;
}
function npcLines(node) {
  var clone = node.cloneNode(true);
  Array.prototype.forEach.call(clone.querySelectorAll('br,p,div,li,tr'), function (entry) { entry.appendChild(clone.ownerDocument.createTextNode('\n')); });
  return clone.textContent.split(/\n+/).map(function (text) { return text.replace(/\s+/g, ' ').replace(/^[\u2022\u00b7]\s*/, '').trim(); }).filter(Boolean);
}
function npcDocument(doc, item) {
  var source = doc.getElementById('p' + item.postId + '-content') || doc.querySelector('#p' + item.postId + ' .post-content');
  if (!source) throw new Error('\u0421\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435 \u041d\u041f\u0421 #' + item.postId + ' \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u043e');
  var result = new DOMParser().parseFromString('<div class="post-content"></div><div class="post-content"></div><div class="post-content"></div>', 'text/html');
  var posts = result.querySelectorAll('.post-content'), post = posts[1];
  post.innerHTML = (typeof akcmNormalizePost === 'function' ? akcmNormalizePost(source) : source).innerHTML;
  Array.prototype.forEach.call(post.querySelectorAll('.post-sig,script,style,pre,.code-box'), function (node) { node.remove(); });
  var inventoryCandidate = typeof akcmThirdSection === 'function' ? akcmThirdSection(post, '\u0418\u043d\u0432\u0435\u043d\u0442\u0430\u0440\u044c') : null;
  var inventorySection = inventoryCandidate && inventoryCandidate !== post ? inventoryCandidate : null;
  var inventory = inventorySection || Array.prototype.find.call(post.querySelectorAll('.spoiler-box,details'), function (node) {
    var title = node.querySelector(':scope > div:first-child,:scope > summary');
    return title && /^\u0438\u043d\u0432\u0435\u043d\u0442\u0430\u0440\u044c$/i.test(title.textContent.trim());
  });
  var third = posts[2];
  if (inventory) {
    var body = inventorySection ? inventory : (inventory.querySelector('blockquote,:scope > div:nth-child(2)') || inventory);
    third.innerHTML = inventorySection ? inventory.outerHTML : body.innerHTML;
    if (!third.querySelector('.quote-box') && third.querySelector('table')) {
      var tableBox = result.createElement('div'); tableBox.className = 'quote-box';
      tableBox.innerHTML = '<div>\u0418\u043d\u0432\u0435\u043d\u0442\u0430\u0440\u044c</div>' + third.innerHTML;
      third.innerHTML = ''; third.appendChild(tableBox);
    }
    if (!third.querySelector('.quote-box')) {
      var lines = npcLines(body); third.innerHTML = '';
      if (lines.length) {
        var box = result.createElement('div'); box.className = 'quote-box';
        box.innerHTML = '<div>\u0418\u043d\u0432\u0435\u043d\u0442\u0430\u0440\u044c</div><table><tr><th>\u041f\u0440\u0435\u0434\u043c\u0435\u0442</th><th>\u041a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e / \u043e\u043f\u0438\u0441\u0430\u043d\u0438\u0435</th></tr></table>';
        lines.forEach(function (line) {
          var match = line.match(/^(.+?)\s*(?:[\u2014\u2013:]|\s-\s|\s[\u00d7x]\s*)\s*(.*)$/);
          var row = box.querySelector('table').insertRow(); row.insertCell().textContent = match ? match[1] : line; row.insertCell().textContent = match ? (/^\d+$/.test(match[2].trim()) ? match[2].trim() + ' \u0448\u0442.' : match[2]) : '1 \u0448\u0442.';
        }); third.appendChild(box);
      }
    }
    inventory.remove();
  }
  var weapons = [];
  Array.prototype.forEach.call(post.querySelectorAll('tr'), function (row) {
    if (row.cells.length < 2 || !/^\u0423\u0440\u043e\u043d \u043e\u0442 \u0430\u0442\u0430\u043a\u0438 \u0441 \u043e\u0440\u0443\u0436\u0438\u0435\u043c|^\u0423\u0440\u043e\u043d \u0441 \u043e\u0440\u0443\u0436\u0438\u0435\u043c/i.test(row.cells[0].textContent.trim())) return;
    npcLines(row.cells[row.cells.length - 1]).forEach(function (line) {
      var match = line.match(/^([^:]+):\s*(.+)$/);
      if (match) weapons.push({ name: match[1].trim(), expression: match[2].trim() });
    });
  });
  result.npcWeapons = weapons;
  result.npcInventoryCode = npcHtmlCode(third).trim();
  return result;
}
function npcHtmlCode(node) {
  if (node.nodeType === 3) return node.nodeValue;
  if (node.nodeType !== 1) return '';
  var inner = Array.prototype.map.call(node.childNodes, npcHtmlCode).join(''), tag = node.tagName.toLowerCase();
  if (tag === 'br') return '\n';
  if (tag === 'a') return '[url=' + node.getAttribute('href') + ']' + inner + '[/url]';
  if (tag === 'strong' || tag === 'b') return '[b]' + inner + '[/b]';
  if (node.classList.contains('custom_tag_shopsection') || node.classList.contains('shopsection')) return '[shopsection]' + inner + '[/shopsection]\n';
  if (node.classList.contains('custom_tag_shoptitle') || node.classList.contains('shoptitle')) return '[shoptitle]' + inner + '[/shoptitle]\n';
  if (node.classList.contains('custom_tag_shopcontent') || node.classList.contains('shopcontent')) return '[shopcontent]' + inner + '[/shopcontent]\n';
  if (/^(table|tr|td|th)$/.test(tag)) { tag = tag === 'th' ? 'td' : tag; return '[' + tag + ']' + inner + '[/' + tag + ']\n'; }
  if (node.classList.contains('quote-box')) {
    var heading = node.querySelector(':scope > div:first-child');
    return '[spoiler="' + (heading ? heading.textContent.replace(/"/g, '') : '\u041f\u0440\u0435\u0434\u043c\u0435\u0442\u044b') + '"]\n' + Array.prototype.filter.call(node.children, function (child) { return child !== heading; }).map(npcHtmlCode).join('') + '[/spoiler]\n';
  }
  return inner + (/^(p|div|li)$/.test(tag) ? '\n' : '');
}
/* NPC_HELPER_END */



  var CONFIG = window.AKATSUKI_BATTLE_ASSISTANT || {};
  var BASE_URL = String(CONFIG.baseUrl || 'https://akatsukigood.forum.cool').replace(/\/+$/, '');
  var CHARACTER_FORUM_ID = Number(CONFIG.characterForumId || 144);
  var EQUIPMENT_TOPIC_ID = Number(CONFIG.equipmentTopicId || 82);
  var MEDICINE_TOPIC_ID = Number(CONFIG.medicineTopicId || 83);
  var ABILITY_TOPIC_ID = Number(CONFIG.abilityTopicId || 73);
  var SUMMON_TOPIC_ID = Number(CONFIG.summonTopicId || 80);
  var PUPPET_TOPIC_ID = Number(CONFIG.puppetTopicId || 81);
  var RANK_TOPICS = { E: 74, D: 75, C: 76, B: 77, A: 78, S: 79 };
  var RANK_COSTS = { E: 1, D: 1, C: 2, B: 3, A: 4, S: 5 };
  var RANKS = ['E', 'D', 'C', 'B', 'A', 'S'];
  var SUMMON_TECHNIQUE = {
    rank: 'C',
    postId: '373',
    name: '\u0422\u0435\u0445\u043d\u0438\u043a\u0430 \u043f\u0440\u0438\u0437\u044b\u0432\u0430',
    url: BASE_URL + '/viewtopic.php?id=76&p=2#p373'
  };
  var BODY_FLICKER_TECHNIQUE = {
    rank: 'D',
    postId: '320',
    name: '\u0422\u0435\u0445\u043d\u0438\u043a\u0430 \u041c\u0435\u0440\u0446\u0430\u044e\u0449\u0435\u0433\u043e \u0422\u0435\u043b\u0430',
    url: BASE_URL + '/viewtopic.php?id=75#p320',
    focusedChakra: 2,
    generalChakra: 2
  };
  var SUBSTITUTION_TECHNIQUE = {
    rank: 'E',
    postId: '279',
    name: '\u0422\u0435\u0445\u043d\u0438\u043a\u0430 \u0417\u0430\u043c\u0435\u043d\u044b',
    url: BASE_URL + '/viewtopic.php?id=74#p279',
    color: '#c46f33'
  };
  var SURFACE_TECHNIQUES = {
    solid: {
      rank: 'D',
      postId: '290',
      name: '\u0422\u0435\u0445\u043d\u0438\u043a\u0430 \u0425\u043e\u0436\u0434\u0435\u043d\u0438\u044f \u043f\u043e \u0414\u0435\u0440\u0435\u0432\u044c\u044f\u043c',
      url: BASE_URL + '/viewtopic.php?id=75#p290',
      color: '#377e22'
    },
    liquid: {
      rank: 'D',
      postId: '289',
      name: '\u0422\u0435\u0445\u043d\u0438\u043a\u0430 \u0425\u043e\u0436\u0434\u0435\u043d\u0438\u044f \u041f\u043e \u0412\u043e\u0434\u0435',
      url: BASE_URL + '/viewtopic.php?id=75#p289',
      color: '#377e22'
    }
  };
  var SUMMON_CHAKRA = {
    E: { focused: 2, general: 4 },
    D: { focused: 2, general: 6 },
    C: { focused: 4, general: 8 },
    B: { focused: 6, general: 12 },
    A: { focused: 8, general: 20 },
    S: { focused: 10, general: 30 }
  };
  var state = {
    textarea: null,
    characters: [],
    character: null,
    actions: [],
    equipment: { armors: [], standard: [], artifacts: [] },
    medicines: [],
    detailCache: {},
    namedSummons: [],
    summonDetails: {},
    puppetDetails: {},
    combat: null,
    nodes: {},
    uiBuilt: false,
    formCheckScheduled: false,
    observer: null
  };

  var cloneSequence = 0;

  function cloneTechniqueMatches(item) {
    return /\u043a\u043b\u043e\u043d/i.test(clean(item && item.name));
  }

  function cloneTechniqueRules(item) {
    var detail = item.detail || {};
    var text = clean(detail.notes + ' ' + detail.text).toLowerCase().replace(/\u0451/g, '\u0435');
    var mass = String(item.postId) === '37403' || /\u043c\u043d\u043e\u0436\u0435\u0441\u0442\u0432\u0435\u043d\u043d.{0,35}(?:\u0442\u0435\u043d\u0435\u0432.{0,20})?\u043a\u043b\u043e\u043d\u0438\u0440/.test(item.name.toLowerCase());
    var illusory = item.rank === 'E';
    var hp = text.match(/(\d+(?:[.,]\d+)?)\s*%\s*(?:\u043e\u0442\s+)?(?:\u0437\u0430\u043f\u0430\u0441\u0430\s+|\u043c\u0430\u043a\u0441\u0438\u043c\u0430\u043b\u044c\u043d\u043e\u0439\s+|\u043a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u0430\s+|\u043e\u0447\u043a\u043e\u0432\s+)?(?:hp|\u0436\u0438\u0437\u043d|\u0431\u043e\u0435\u0441\u043f\u043e\u0441\u043e\u0431)/i) || text.match(/(?:\u0437\u0434\u043e\u0440\u043e\u0432\u044c\u0435 \u043a\u043b\u043e\u043d\u0430|\u043a\u043b\u043e\u043d.{0,35}(?:\u0436\u0438\u0437\u043d|hp)|\u043a\u0430\u0436\u0434\u044b\u0439 \u043a\u043b\u043e\u043d.{0,35}(?:\u0436\u0438\u0437\u043d|hp))\s*:?\s*(\d+(?:[.,]\d+)?)\s*%/i) || text.match(/(\d+(?:[.,]\d+)?)\s*%\s*(?:hp|\u043e\u0442\s+(?:\u0437\u0430\u043f\u0430\u0441\u0430\s+)?(?:\u0436\u0438\u0437\u043d|\u0436\u0438\u0437\u043d\u0435\u043d\u043d\u044b\u0445))/i);
    var fixedHp = text.match(/(?:\u043f\u0440\u043e\u0447\u043d\u043e\u0441\u0442\u044c|\u0437\u0434\u043e\u0440\u043e\u0432\u044c\u0435|\u0431\u043e\u0435\u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u044c)\s+\u043a\u043b\u043e\u043d\u0430\s*(?:\u0441\u043e\u0441\u0442\u0430\u0432\u043b\u044f\u0435\u0442|\u0440\u0430\u0432\u043d\u0430|:)?\s*(\d+(?:[.,]\d+)?)\s*(?:\u0435\u0434\u0438\u043d\u0438\u0446|\u0435\u0434\.|HP)/i);
    var minimum = text.match(/\u043d\u0435 (?:\u043c\u0435\u043d\u0435\u0435|\u043c\u0435\u043d\u044c\u0448\u0435)\s*(\d+(?:[.,]\d+)?)/i);
    var chargeable = /(?:\u0440\u0430\u0437\u043c\u0435\u0441\u0442\u0438\u0442\u044c|\u0432\u043b\u043e\u0436\u0438\u0442\u044c|\u043f\u043e\u043c\u0435\u0441\u0442\u0438\u0442\u044c).{0,60}\u0447\u0430\u043a\u0440|\u0447\u0430\u0441\u0442\u044c \u0441\u0432\u043e\u0435\u0439 \u0447\u0430\u043a\u0440\u044b|\u0443\u0432\u0435\u043b\u0438\u0447.{0,80}(?:2\s*\u0447\u0430\u043a\u0440\u044b|2\s*\u0435\u0434)/i.test(text);
    var hpBoost = text.match(/(\d+(?:[.,]\d+)?)\s*(?:\u0447\u0430\u043a\u0440\u044b|\u0435\u0434(?:\u0438\u043d\u0438\u0446[\u0430-\u044f]*)?\.?\s*\u0447\u0430\u043a\u0440\u044b)\s*(?:=|\u0437\u0430|[:\u2013-])\s*(\d+(?:[.,]\d+)?)\s*(?:\u0435\u0434(?:\u0438\u043d\u0438\u0446[\u0430-\u044f]*)?\.?)?\s*\u0437\u0434\u043e\u0440\u043e\u0432/i);
    var supportRates = [];
    clean(detail.support).replace(/(\d+(?:[.,]\d+)?)\s*(?:\u0435\u0434\u0438\u043d\u0438\u0446[\u0430-\u044f]*|\u0435\u0434\.?)/gi, function (_, number) { number = Number(number.replace(',', '.')); if (supportRates.indexOf(number) === -1) supportRates.push(number); });
    if (!supportRates.length) supportRates.push(illusory || mass ? 1 : supportChakraCost(detail) || techniqueChakraCost(detail.chakra).support);
    var max = text.match(/\u043c\u0430\u043a\u0441\u0438\u043c\u0443\u043c.{0,25}(\d+)\s*\u043a\u043b\u043e\u043d\u0430|\u0434\u043e\s+(\d+)\s*(?:\u0438\u043b\u043b\u044e\u0437\u043e\u0440\u043d\u044b\u0445\s+)?(?:\u043a\u043e\u043f\u0438\u0439|\u043a\u043b\u043e\u043d\u043e\u0432)/i);
    return { mass: mass, illusory: illusory, divide: /\u0437\u0430\u043f\u0430\u0441 \u0447\u0430\u043a\u0440\u044b \u043e\u0440\u0438\u0433\u0438\u043d\u0430\u043b\u0430 \u0434\u0435\u043b\u0438\u0442\u0441\u044f|\u0434\u0435\u043b\u0438\u0442 \u0441\u043e\u0431\u0441\u0442\u0432\u0435\u043d\u043d\u044b\u0439 \u0437\u0430\u043f\u0430\u0441 \u0447\u0430\u043a\u0440\u044b|\u0447\u0430\u043a\u0440[\u0430\u044b].{0,50}\u0434\u0435\u043b\u0438\u0442\u0441\u044f \u043c\u0435\u0436\u0434\u0443|\u043f\u043e\u043b\u0443\u0447\u0430\u0435\u0442 \u0440\u0430\u0432\u043d\u0443\u044e \u0434\u043e\u043b\u044e \u0447\u0430\u043a\u0440\u044b|\u0440\u0430\u0441\u043f\u0440\u0435\u0434\u0435\u043b\u044f\u0435\u0442 \u0447\u0430\u043a\u0440\u0443 \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044f \u043c\u0435\u0436\u0434\u0443|\u0447\u0430\u043a\u0440\u0430.{0,20}\u0440\u0430\u0441\u043f\u0440\u0435\u0434\u0435\u043b\u044f\u0435\u0442\u0441\u044f \u043c\u0435\u0436\u0434\u0443/.test(text),
      supportRates: supportRates, support: illusory || mass ? 1 : supportChakraCost(detail) || techniqueChakraCost(detail.chakra).support,
      fixedHp: fixedHp ? Number(fixedHp[1].replace(',', '.')) : null, noTechniques: /\u043a\u043b\u043e\u043d \u043d\u0435 \u043c\u043e\u0436\u0435\u0442 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u044c \u0442\u0435\u0445\u043d\u0438\u043a\u0438/.test(text), noArtifacts: /\u0430\u0440\u0442\u0435\u0444\u0430\u043a\u0442|\u0430\u0440\u0442\u0435\u0444\u0430\u043a\u0442\u044b/.test(text), hpPercent: mass ? 10 : hp ? Number(hp[1].replace(',', '.')) : 1, minimumHp: minimum ? Number(minimum[1].replace(',', '.')) : 1,
      chargeable: chargeable, hpPerChakra: hpBoost ? Number(hpBoost[2].replace(',', '.')) / Number(hpBoost[1].replace(',', '.')) : /2\s*\u0447\u0430\u043a\u0440\u044b\s*=\s*20/.test(text) ? 10 : 0,
      maxCount: max ? Number(max[1] || max[2]) : illusory ? 2 : 0, multiple: mass ? 10 : 1 };
  }

  function cloneTechniqueCost(item) {
    var value = clean(item.detail && item.detail.chakra).replace(',', '.');
    var pair = value.match(/(\d+(?:\.\d+)?)[^/]*\/\/?\s*(\d+(?:\.\d+)?)/);
    var cost = techniqueChakraCost(value);
    if (pair) { cost.focused = Number(pair[1]); cost.general = Number(pair[2]); }
    if (item.rank === 'E' && /\u0432 \u0445\u043e\u0434/i.test(value)) cost.general = 0;
    return cost;
  }

  function cloneCreationPlan(item, options, resources, originalHp) {
    var rules = cloneTechniqueRules(item);
    var count = Number(options.count);
    if (!Number.isSafeInteger(count) || count < 1 || count > 100000) throw new Error('\u041a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e \u043a\u043b\u043e\u043d\u043e\u0432 \u0434\u043e\u043b\u0436\u043d\u043e \u0431\u044b\u0442\u044c \u0446\u0435\u043b\u044b\u043c \u0447\u0438\u0441\u043b\u043e\u043c \u043e\u0442 1 \u0434\u043e 100000.');
    var mode = rules.mass ? options.mode || 'divide' : rules.illusory ? 'illusion' : 'single';
    if (['divide', 'allocate', 'illusion', 'single'].indexOf(mode) === -1) throw new Error('\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0432\u0430\u0440\u0438\u0430\u043d\u0442 \u0441\u043e\u0437\u0434\u0430\u043d\u0438\u044f \u043a\u043b\u043e\u043d\u043e\u0432.');
    if (rules.mass && mode === 'divide' && count % 10) throw new Error('\u0427\u0438\u0441\u043b\u043e \u043c\u0430\u0442\u0435\u0440\u0438\u0430\u043b\u044c\u043d\u044b\u0445 \u043c\u0430\u0441\u0441\u043e\u0432\u044b\u0445 \u043a\u043b\u043e\u043d\u043e\u0432 \u0434\u043e\u043b\u0436\u043d\u043e \u0431\u044b\u0442\u044c \u043a\u0440\u0430\u0442\u043d\u043e 10.');
    if (rules.maxCount && !rules.mass && count > rules.maxCount) throw new Error('\u041f\u043e \u043f\u0440\u0430\u0432\u0438\u043b\u0430\u043c \u0442\u0435\u0445\u043d\u0438\u043a\u0438 \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u043e \u043d\u0435 \u0431\u043e\u043b\u044c\u0448\u0435 ' + rules.maxCount + ' \u043a\u043b\u043e\u043d\u043e\u0432 \u0437\u0430 \u043e\u0434\u043d\u043e \u043f\u0440\u0438\u043c\u0435\u043d\u0435\u043d\u0438\u0435.');
    var placement = Number(options.placement || 0);
    if (!isFinite(placement) || placement < 0 || (!rules.chargeable && placement)) throw new Error('\u041d\u0435\u0434\u043e\u043f\u0443\u0441\u0442\u0438\u043c\u043e\u0435 \u043a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e \u0434\u043e\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044c\u043d\u043e\u0439 \u0447\u0430\u043a\u0440\u044b.');
    var chakraPerClone = Number(options.chakraPerClone || 0);
    if (mode === 'allocate' && (!isFinite(chakraPerClone) || chakraPerClone < 1)) throw new Error('\u0412\u044b\u0434\u0435\u043b\u0438\u0442\u0435 \u043a\u0430\u0436\u0434\u043e\u043c\u0443 \u043a\u043b\u043e\u043d\u0443 \u043d\u0435 \u043c\u0435\u043d\u0435\u0435 1 \u0435\u0434\u0438\u043d\u0438\u0446\u044b \u0447\u0430\u043a\u0440\u044b.');
    var cost = cloneTechniqueCost(item);
    if (/\u0437\u0430\s+(?:\u043e\u0434\u043d\u043e\u0433\u043e\s+)?\u043a\u043b\u043e\u043d\u0430|\u043d\u0430\s+(?:\u043e\u0434\u043d\u043e\u0433\u043e\s+)?\u043a\u043b\u043e\u043d\u0430/i.test(item.detail.chakra)) cost.general *= count;
    var separateAllocation = mode === 'single' && !rules.divide && !rules.chargeable;
    if (separateAllocation && (!isFinite(chakraPerClone) || chakraPerClone < 0)) throw new Error('\u0423\u043a\u0430\u0436\u0438\u0442\u0435 \u043d\u0435\u043e\u0442\u0440\u0438\u0446\u0430\u0442\u0435\u043b\u044c\u043d\u0443\u044e \u0447\u0430\u043a\u0440\u0443 \u043a\u0430\u0436\u0434\u043e\u0433\u043e \u043a\u043b\u043e\u043d\u0430.');
    var generalSpend = mode === 'allocate' ? Math.max(cost.general, count * chakraPerClone) : cost.general + placement * count + (separateAllocation ? chakraPerClone * count : 0);
    if (generalSpend > resources.general || cost.focused > resources.focused) throw new Error('\u041d\u0435\u0434\u043e\u0441\u0442\u0430\u0442\u043e\u0447\u043d\u043e \u0447\u0430\u043a\u0440\u044b \u0434\u043b\u044f \u0441\u043e\u0437\u0434\u0430\u043d\u0438\u044f \u043a\u043b\u043e\u043d\u043e\u0432.');
    var pool = resources.general - generalSpend;
    var divided = mode === 'divide' || (mode === 'single' && rules.divide);
    var share = divided ? Math.floor(pool / (count + 1)) : mode === 'allocate' || separateAllocation ? chakraPerClone : 0;
    if (divided && share < 1) throw new Error('\u041f\u043e\u0441\u043b\u0435 \u0440\u0430\u0437\u0434\u0435\u043b\u0435\u043d\u0438\u044f \u043a\u0430\u0436\u0434\u043e\u043c\u0443 \u043a\u043b\u043e\u043d\u0443 \u0434\u043e\u043b\u0436\u043d\u0430 \u043e\u0441\u0442\u0430\u0442\u044c\u0441\u044f \u0445\u043e\u0442\u044f \u0431\u044b 1 \u0435\u0434\u0438\u043d\u0438\u0446\u0430 \u0447\u0430\u043a\u0440\u044b.');
    return { id: options.id || 'clone-' + (++cloneSequence), postId: String(item.postId), name: item.name, url: item.url, rank: item.rank, mode: mode,
      count: count, divide: divided, returnChakra: mode !== 'allocate', placement: placement, generalSpend: generalSpend, focusedSpend: cost.focused,
      general: share + placement, focused: resources.focused - cost.focused, ownerGeneral: divided ? pool - share * count : pool,
      hp: (rules.fixedHp === null ? Math.max(rules.minimumHp, originalHp * rules.hpPercent / 100) : rules.fixedHp) + placement * rules.hpPerChakra,
      noTechniques: rules.noTechniques, noArtifacts: rules.noArtifacts,
      support: mode === 'illusion' ? 1 : rules.support, illusory: mode === 'illusion', mass: rules.mass, createdNow: true };
  }

  function cloneGroupFromPlan(plan, general, focused) {
    return { id: plan.id, postId: plan.postId, name: plan.name, url: plan.url, rank: plan.rank, mode: plan.mode, mass: plan.mass,
      noTechniques: plan.noTechniques, noArtifacts: plan.noArtifacts, count: plan.count, returnChakra: plan.returnChakra, support: plan.support, baseSupport: plan.baseSupport === undefined ? plan.support : plan.baseSupport, extraSupport: plan.extraSupport || 0, createdNow: plan.createdNow,
      hp: plan.hp, maxHp: plan.maxHp || plan.hp, general: general, focused: focused,
      startGeneral: general, startFocused: focused, startHp: plan.hp, actions: [], od: state.character.ordinaryTotal, ot: state.character.techniqueTotal };
  }

  function cloneActorSnapshot(group) {
    var character = Object.assign({}, state.character, { name: group.name + ' \u2014 \u043a\u043b\u043e\u043d', stats: Object.assign({}, state.character.stats) });
    character.stats.life = { value: group.maxHp, text: String(group.maxHp) };
    character.stats.chakraTotal = { value: group.startGeneral, text: String(group.startGeneral) };
    character.stats.chakraFocused = { value: group.startFocused, max: focusedChakraAbsoluteLimit(), text: String(group.startFocused) };
    var combat = Object.assign({}, state.combat, { hp: group.startHp, general: group.startGeneral, focused: group.startFocused,
      firstTurn: false, effects: [], activeEffects: [], cooldowns: { speed: 3, strength: 3, defense: 3, critical: 3 }, criticalEnabled: false, sacrificeUsed: false, counterAttack: false });
    return { character: character, combat: combat, actions: group.actions.slice() };
  }

  function withCloneSnapshot(group, callback, spec) {
    var saved = { character: state.character, combat: state.combat, actions: state.actions, actorScope: state.actorScope, captured: state.cloneCapturedActions, builder: state.nodes.builder };
    var snapshot = cloneActorSnapshot(group);
    state.character = snapshot.character; state.combat = snapshot.combat; state.actions = snapshot.actions;
    state.actorScope = spec || { simulation: true }; state.cloneCapturedActions = [];
    if (spec && spec.builder) state.nodes.builder = spec.builder;
    var result, captured;
    try { result = callback(); captured = state.cloneCapturedActions.filter(function (action) { return state.actions.indexOf(action) !== -1; }); }
    finally { state.character = saved.character; state.combat = saved.combat; state.actions = saved.actions; state.actorScope = saved.actorScope; state.cloneCapturedActions = saved.captured; state.nodes.builder = saved.builder; }
    if (spec && !spec.simulation && captured && captured.length) {
      var targetGroupId = spec.groupId;
      captured.forEach(function (action) {
        var resultGroupId = 'clone-' + (++cloneSequence);
        state.actions.push({ label: '\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044f \u043a\u043b\u043e\u043d\u043e\u0432 \u00d7' + spec.count + ': ' + action.label, summary: group.name + ' \u2014 ' + action.summary,
          code: '\u041a\u043b\u043e\u043d\u044b \u00d7' + spec.count + ' (' + group.name + '): ' + action.code, od: 0, ot: 0,
          cloneOperation: 'act', cloneGroupId: targetGroupId, cloneCount: spec.count, cloneResultId: resultGroupId, actorAction: action });
        targetGroupId = resultGroupId;
      });
      rebalanceActions(); renderResources(); renderQueue();
      if (state.builderTab === 'clones') renderActiveClones();
    }
    return result;
  }

  function withCloneActor(spec, callback) {
    if (spec.simulation) return callback();
    var group = chakraLedger().cloneGroups.find(function (item) { return item.id === spec.groupId; });
    if (!group || spec.count > group.count) { setBuilderMessage('\u0413\u0440\u0443\u043f\u043f\u0430 \u043a\u043b\u043e\u043d\u043e\u0432 \u0438\u0437\u043c\u0435\u043d\u0438\u043b\u0430\u0441\u044c. \u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0443\u044e\u0449\u0438\u0445 \u043a\u043b\u043e\u043d\u043e\u0432 \u0435\u0449\u0451 \u0440\u0430\u0437.', 'error'); return; }
    return withCloneSnapshot(group, callback, spec);
  }

  function actorCallback(callback) {
    var spec = arguments.length > 1 ? arguments[1] : state.actorScope;
    return spec && !spec.simulation ? function () { var args = arguments, receiver = this; return withCloneActor(spec, function () { return callback.apply(receiver, args); }); } : callback;
  }

  function on(node, event, callback, options) { node.addEventListener(event, actorCallback(callback), options); }

  function actorPromise(promise, inherited) {
    var spec = inherited || state.actorScope;
    if (!spec || spec.simulation) return promise;
    return { then: function (success, failure) { return actorPromise(promise.then(success ? actorCallback(success, spec) : undefined, failure ? actorCallback(failure, spec) : undefined), spec); },
      catch: function (failure) { return actorPromise(promise.catch(actorCallback(failure, spec)), spec); } };
  }

  function actorAll(values) { return actorPromise(Promise.all(values)); }
  function actorResolve(value) { return actorPromise(Promise.resolve(value)); }

  function applyCloneActorAction(groups, event) {
    var group = groups.find(function (item) { return item.id === event.cloneGroupId; });
    if (!group || event.cloneCount > group.count) return { error: '\u041d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u043d\u0430\u044f \u0433\u0440\u0443\u043f\u043f\u0430 \u043a\u043b\u043e\u043d\u043e\u0432' };
    var part = Object.assign({}, group, { id: event.cloneResultId, count: event.cloneCount, actions: group.actions.slice() });
    part.actions.push(event.actorAction);
    var resources = withCloneSnapshot(part, function () {
      rebalanceFullConcentration(); rebalanceSequentialRules();
      return { chakra: chakraLedger(), health: healthLedger(), points: remaining() };
    });
    part.general = resources.chakra.general; part.focused = resources.chakra.focused; part.hp = resources.health.current;
    part.od = resources.points.od; part.ot = resources.points.ot;
    if (event.actorAction.cloneCreation && event.actorAction.cloneCreation.illusory) { part.extraSupport = (part.extraSupport || 0) + 1; part.support = part.baseSupport + part.extraSupport; }
    resources.chakra.cloneGroups.forEach(function (child) { if (!groups.some(function (existing) { return existing.id === child.id; })) groups.push(Object.assign({}, child, { count: child.count * event.cloneCount })); });
    group.count -= part.count;
    if (part.general > 0 && part.hp > 0) groups.push(part);
    return resources.chakra.entries[resources.chakra.entries.length - 1] || {};
  }

  function cloneCreationAction(item, options) {
    var plan = cloneCreationPlan(item, options, chakraLedger(), statValue('life'));
    var code = '[url=' + item.url + ']' + item.name + '[/url] \u2014 \u0441\u043e\u0437\u0434\u0430\u043d\u043e \u043a\u043b\u043e\u043d\u043e\u0432: ' + plan.count + '; \u0432\u0430\u0440\u0438\u0430\u043d\u0442: ' + plan.mode;
    if (!plan.illusory) code += '; HP \u043a\u0430\u0436\u0434\u043e\u0433\u043e: ' + plan.hp + '; \u043e\u0431\u0449\u0430\u044f \u0447\u0430\u043a\u0440\u0430 \u043a\u0430\u0436\u0434\u043e\u0433\u043e: ' + plan.general + '; \u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u0430\u044f: ' + plan.focused;
    if (plan.illusory) code += '; \u041f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430 \u0438\u043b\u043b\u044e\u0437\u043e\u0440\u043d\u044b\u0445 \u043a\u043b\u043e\u043d\u043e\u0432 #' + item.postId + ': \u043a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e ' + plan.count + '; \u0440\u0430\u0441\u0445\u043e\u0434 1';
    if (plan.placement) code += '; \u0440\u0430\u0437\u043c\u0435\u0449\u0435\u043d\u043e \u0434\u043e\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044c\u043d\u043e\u0439 \u0447\u0430\u043a\u0440\u044b: ' + plan.placement + ' \u043d\u0430 \u043a\u043b\u043e\u043d\u0430';
    return { label: '\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u043a\u043b\u043e\u043d\u0430', summary: item.name + ' \u00d7' + plan.count + (plan.illusory ? ' \u2014 \u043d\u0435\u043c\u0430\u0442\u0435\u0440\u0438\u0430\u043b\u044c\u043d\u044b\u0435' : '; \u043e\u0441\u0442\u0430\u0442\u043e\u043a \u0447\u0430\u043a\u0440\u044b \u043e\u0440\u0438\u0433\u0438\u043d\u0430\u043b\u0430: ' + plan.ownerGeneral),
      code: code, od: 0, ot: Math.max(1, RANK_COSTS[item.rank] - item.detail.discount),
      chakraSpend: plan.generalSpend, focusedChakraSpend: plan.focusedSpend, cloneCreation: plan, link: item.url,
      techniqueUseKey: 'technique:' + item.postId, techniqueTurnLimit: techniqueTurnLimit(item.detail) };
  }

  function removeBattleAction(index) {
    state.actions.splice(index, 1);
    var valid = {};
    state.actions = state.actions.filter(function (action) {
      if (action.cloneCreation && !action.cloneCreation.illusory) valid[action.cloneCreation.id] = action.cloneCreation.count;
      if (action.cloneImport) valid[action.cloneImport.id] = action.cloneImport.count;
      if (action.cloneOperation) {
        if (!valid[action.cloneGroupId] || action.cloneCount > valid[action.cloneGroupId]) return false;
        valid[action.cloneGroupId] -= action.cloneCount;
        if (action.cloneOperation === 'act') {
          valid[action.cloneResultId] = action.cloneCount;
          if (action.actorAction.cloneCreation && !action.actorAction.cloneCreation.illusory) valid[action.actorAction.cloneCreation.id] = action.actorAction.cloneCreation.count * action.cloneCount;
        }
      }
      return true;
    });
  }

  function cloneNumberField(container, name, fallback) {
    var node = container.querySelector('[data-clone-field="' + name + '"]');
    return node ? Number(node.value) : fallback;
  }

  function renderCloneCreationEditor(editor) {
    var techniques = state.character.techniques.filter(cloneTechniqueMatches);
    var ranks = RANKS.filter(function (rank) { return techniques.some(function (item) { return item.rank === rank; }); });
    editor.innerHTML = '<h4>\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u043a\u043b\u043e\u043d\u0430</h4><div class="aba-inline"><label>\u0420\u0430\u043d\u0433<select data-clone-rank><option value="">\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0440\u0430\u043d\u0433</option>' + ranks.map(function (rank) { return '<option>' + rank + '</option>'; }).join('') + '</select></label><label>\u041f\u043e\u0438\u0441\u043a<input type="search" data-clone-search placeholder="\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u043a\u043b\u043e\u043d\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u044f"></label></div><div class="aba-clone-techniques"></div><div class="aba-clone-create-detail"></div>';
    function choices() {
      var rank = editor.querySelector('[data-clone-rank]').value;
      var search = normalize(editor.querySelector('[data-clone-search]').value);
      var list = techniques.filter(function (item) { return item.rank === rank && item.detail && techniqueAllowed(item.detail, 'support', item) && (!search || normalize(item.name).indexOf(search) !== -1); });
      editor.querySelector('.aba-clone-create-detail').innerHTML = '';
      var node = editor.querySelector('.aba-clone-techniques');
      node.innerHTML = list.length ? '<label>\u0422\u0435\u0445\u043d\u0438\u043a\u0430<select data-clone-technique><option value="">\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0442\u0435\u0445\u043d\u0438\u043a\u0443</option>' + list.map(function (item) { return '<option value="' + item.postId + '">' + escapeHtml(item.name) + '</option>'; }).join('') + '</select></label>' : '<p class="aba-note">' + (rank ? '\u041f\u043e\u0434\u0445\u043e\u0434\u044f\u0449\u0438\u0445 \u0442\u0435\u0445\u043d\u0438\u043a \u043d\u0435\u0442.' : '\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0440\u0430\u043d\u0433.') + '</p>';
      var select = node.querySelector('[data-clone-technique]');
      if (select) on(select, 'change', function () {
        var item = list.find(function (candidate) { return candidate.postId === select.value; });
        var detail = editor.querySelector('.aba-clone-create-detail');
        if (!item) { detail.innerHTML = ''; return; }
        detail.innerHTML = '<div class="aba-loading">\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u043f\u0440\u0430\u0432\u0438\u043b \u043a\u043b\u043e\u043d\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u044f\u2026</div>';
        loadTechniqueDetail(item).then(function () {
          if (select.value !== item.postId || !detail.isConnected) return;
          renderCloneCreationOptions(detail, item);
        }).catch(function (error) { detail.textContent = '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u0442\u0435\u0445\u043d\u0438\u043a\u0443: ' + error.message; });
      });
    }
    actorAll(techniques.map(function (item) { return loadTechniqueDetail(item).catch(function () { return null; }); })).then(choices);
    on(editor.querySelector('[data-clone-rank]'), 'change', choices);
    on(editor.querySelector('[data-clone-search]'), 'input', choices);
    choices();
  }

  function renderCloneCreationOptions(container, item) {
    var rules = cloneTechniqueRules(item);
    var notes = item.detail.notes || '';
    if (rules.mass) notes = notes.replace(/\b1\s*%/g, '10%');
    var ruleItems = notes.replace(/(\u041e\u043f\u0446\u0438\u044f\s*[12]\s*:)/gi, '\u25cf $1').split(/[\u25cf\u2022]/).map(function (text) { return clean(text); }).filter(Boolean);
    container.innerHTML = '<div class="aba-clone-settings">' +
      (rules.mass ? '<label>\u0412\u0430\u0440\u0438\u0430\u043d\u0442 \u0441\u043e\u0437\u0434\u0430\u043d\u0438\u044f<select data-clone-field="mode"><option value="divide">1. \u0420\u0430\u0437\u0434\u0435\u043b\u0438\u0442\u044c \u0437\u0430\u043f\u0430\u0441 \u0447\u0430\u043a\u0440\u044b \u2014 \u043e\u0441\u0442\u0430\u0442\u043e\u043a \u0432\u043e\u0437\u0432\u0440\u0430\u0449\u0430\u0435\u0442\u0441\u044f \u043f\u0440\u0438 \u0440\u0430\u0441\u0441\u0435\u0438\u0432\u0430\u043d\u0438\u0438</option><option value="allocate">2. \u0412\u044b\u0434\u0435\u043b\u0438\u0442\u044c \u0447\u0430\u043a\u0440\u0443 \u043a\u0430\u0436\u0434\u043e\u043c\u0443 \u2014 \u0431\u0435\u0437 \u0432\u043e\u0437\u0432\u0440\u0430\u0442\u0430</option><option value="illusion">3. \u041d\u0435\u043c\u0430\u0442\u0435\u0440\u0438\u0430\u043b\u044c\u043d\u044b\u0435 \u043a\u043b\u043e\u043d\u044b \u2014 \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430 \u043e\u0440\u0438\u0433\u0438\u043d\u0430\u043b\u043e\u043c</option></select></label>' : '') +
      '<label>\u041a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e \u043a\u043b\u043e\u043d\u043e\u0432<input type="number" min="1" max="100000" value="' + (rules.mass ? 10 : 1) + '" data-clone-field="count"></label>' +
      (rules.mass ? '<label class="aba-clone-allocation" hidden>\u0427\u0430\u043a\u0440\u0430 \u043d\u0430 \u043e\u0434\u043d\u043e\u0433\u043e \u043a\u043b\u043e\u043d\u0430<input type="number" min="1" step="any" value="1" data-clone-field="per-clone"></label>' : '') +
      (!rules.mass && !rules.illusory && !rules.divide && !rules.chargeable ? '<label>\u0412\u044b\u0434\u0435\u043b\u0438\u0442\u044c \u0447\u0430\u043a\u0440\u0443 \u043a\u0430\u0436\u0434\u043e\u043c\u0443 \u043a\u043b\u043e\u043d\u0443<input type="number" min="0" step="any" value="1" data-clone-field="per-clone"></label><p class="aba-note">\u0412 \u0442\u0435\u0445\u043d\u0438\u043a\u0435 \u043d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d\u043e \u0440\u0430\u0437\u0434\u0435\u043b\u0435\u043d\u0438\u0435 \u0437\u0430\u043f\u0430\u0441\u0430. \u0412\u044b\u0434\u0435\u043b\u0435\u043d\u043d\u0430\u044f \u0447\u0430\u043a\u0440\u0430 \u0434\u043e\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044c\u043d\u043e \u0441\u043f\u0438\u0441\u044b\u0432\u0430\u0435\u0442\u0441\u044f \u0441 \u043e\u0440\u0438\u0433\u0438\u043d\u0430\u043b\u0430.</p>' : '') +
      (rules.chargeable ? '<label>\u0420\u0430\u0437\u043c\u0435\u0441\u0442\u0438\u0442\u044c \u0434\u043e\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044c\u043d\u0443\u044e \u0447\u0430\u043a\u0440\u0443 \u0432 \u043a\u0430\u0436\u0434\u043e\u043c \u043a\u043b\u043e\u043d\u0435<input type="number" min="0" step="any" value="0" data-clone-field="placement"></label>' : '') +
      '</div><div class="aba-clone-create-preview"></div><button type="button" class="aba-primary" data-create-clone>\u0421\u043e\u0437\u0434\u0430\u0442\u044c</button>' +
      (ruleItems.length ? '<section class="aba-clone-rules"><h5>\u041f\u0440\u0430\u0432\u0438\u043b\u0430 \u0442\u0435\u0445\u043d\u0438\u043a\u0438</h5><ul>' + ruleItems.map(function (text) { return '<li>' + escapeHtml(text) + '</li>'; }).join('') + '</ul></section>' : '');
    var button = container.querySelector('[data-create-clone]');
    function options() { return { count: cloneNumberField(container, 'count', 1), mode: (container.querySelector('[data-clone-field="mode"]') || {}).value,
      chakraPerClone: cloneNumberField(container, 'per-clone', 0), placement: cloneNumberField(container, 'placement', 0) }; }
    function update() {
      var allocation = container.querySelector('.aba-clone-allocation');
      if (allocation) allocation.hidden = options().mode !== 'allocate';
      var preview = container.querySelector('.aba-clone-create-preview');
      try {
        var plan = cloneCreationPlan(item, Object.assign({ id: 'preview' }, options()), chakraLedger(), statValue('life'));
        preview.innerHTML = '<p>\u0420\u0430\u0441\u0445\u043e\u0434: ' + plan.focusedSpend + ' \u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u043e\u0439 / ' + plan.generalSpend + ' \u043e\u0431\u0449\u0435\u0439 \u0447\u0430\u043a\u0440\u044b; ' + Math.max(1, RANK_COSTS[item.rank] - item.detail.discount) + ' \u041e\u0422.</p><p class="' + (rules.mass && !plan.illusory ? 'aba-clone-owner-warning' : '') + '">\u0427\u0430\u043a\u0440\u0430 \u043e\u0440\u0438\u0433\u0438\u043d\u0430\u043b\u0430 \u043f\u043e\u0441\u043b\u0435 \u0441\u043e\u0437\u0434\u0430\u043d\u0438\u044f: ' + plan.ownerGeneral + '</p>' +
          (plan.illusory ? '<p>\u041d\u0435\u043c\u0430\u0442\u0435\u0440\u0438\u0430\u043b\u044c\u043d\u044b\u0435 \u043a\u043b\u043e\u043d\u044b: \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430 1 \u043e\u0431\u0449\u0435\u0439 \u0447\u0430\u043a\u0440\u044b \u043e\u0440\u0438\u0433\u0438\u043d\u0430\u043b\u0430 \u0432 \u0445\u043e\u0434. \u041e\u0442\u0434\u0435\u043b\u044c\u043d\u044b\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044f \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u043d\u044b.' : '<p>\u041a\u0430\u0436\u0434\u044b\u0439 \u043a\u043b\u043e\u043d: HP ' + plan.hp + '; \u0447\u0430\u043a\u0440\u0430 ' + plan.general + ', \u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u0430\u044f ' + plan.focused + '; \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430 ' + plan.support + ' \u0432 \u0445\u043e\u0434. \u0412 \u0445\u043e\u0434 \u0441\u043e\u0437\u0434\u0430\u043d\u0438\u044f \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430 \u043d\u0435 \u0441\u043f\u0438\u0441\u044b\u0432\u0430\u0435\u0442\u0441\u044f.</p>');
        button.disabled = !canSpend(0, Math.max(1, RANK_COSTS[item.rank] - item.detail.discount));
      } catch (error) { preview.innerHTML = '<p class="aba-error">' + escapeHtml(error.message) + '</p>'; button.disabled = true; }
    }
    Array.prototype.forEach.call(container.querySelectorAll('[data-clone-field]'), function (node) { on(node, 'input', update); on(node, 'change', update); });
    on(button, 'click', function () {
      try {
        var action = cloneCreationAction(item, options());
        if (addAction(action) && !state.actorScope && !action.cloneCreation.illusory) { state.builderTab = 'clones'; renderActionMenu(); }
      } catch (error) { setBuilderMessage(error.message, 'error'); }
    });
    update();
  }

  function cloneImportAction(item, options) {
    var rules = cloneTechniqueRules(item);
    var incomingCount = Number(options.count);
    if (!Number.isSafeInteger(incomingCount) || incomingCount < 1 || incomingCount > 100000) throw new Error('\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043f\u043e\u043b\u043e\u0436\u0438\u0442\u0435\u043b\u044c\u043d\u043e\u0435 \u0446\u0435\u043b\u043e\u0435 \u043a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e \u043a\u043b\u043e\u043d\u043e\u0432.');
    if (rules.illusory || options.mode === 'illusion') {
      return { label: '\u041f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430 \u043d\u0435\u043c\u0430\u0442\u0435\u0440\u0438\u0430\u043b\u044c\u043d\u044b\u0445 \u043a\u043b\u043e\u043d\u043e\u0432', summary: item.name + ' \u00d7' + options.count, code: '[url=' + item.url + ']' + item.name + '[/url] \u2014 \u043d\u0435\u043c\u0430\u0442\u0435\u0440\u0438\u0430\u043b\u044c\u043d\u044b\u0435 \u043a\u043b\u043e\u043d\u044b \u00d7' + options.count + '; \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430 \u0442\u0435\u043a\u0443\u0449\u0435\u0433\u043e \u0445\u043e\u0434\u0430; \u041f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430 \u0438\u043b\u043b\u044e\u0437\u043e\u0440\u043d\u044b\u0445 \u043a\u043b\u043e\u043d\u043e\u0432 #' + item.postId + ': \u043a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e ' + options.count + '; \u0440\u0430\u0441\u0445\u043e\u0434 1', od: 0, ot: 0, chakraSpend: 1, cloneIllusion: { postId: item.postId, count: options.count }, autoImported: !!options.autoImported };
    }
    var count = Number(options.count), general = Number(options.general), focused = Number(options.focused), hp = Number(options.hp);
    if (!Number.isSafeInteger(count) || count < 1 || count > 100000 || !isFinite(general) || general < 0 || !isFinite(focused) || focused < 0 || !isFinite(hp) || hp <= 0) throw new Error('\u041f\u0440\u043e\u0432\u0435\u0440\u044c\u0442\u0435 \u043a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e, HP \u0438 \u043e\u0441\u0442\u0430\u0442\u043a\u0438 \u0447\u0430\u043a\u0440\u044b \u043a\u043b\u043e\u043d\u043e\u0432.');
    var mode = rules.mass ? options.mode || 'divide' : 'single';
    if (rules.mass && ['divide', 'allocate'].indexOf(mode) === -1) throw new Error('\u0423\u043a\u0430\u0436\u0438\u0442\u0435 \u0432\u0430\u0440\u0438\u0430\u043d\u0442 \u043c\u0430\u0441\u0441\u043e\u0432\u043e\u0433\u043e \u043a\u043b\u043e\u043d\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u044f.');
    var maintenance = rules.mass ? 1 : options.support !== undefined ? Number(options.support) : rules.support;
    if (rules.supportRates.indexOf(maintenance) === -1) throw new Error('\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0440\u0430\u0441\u0445\u043e\u0434 \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0438 \u043f\u043e \u043f\u0440\u0430\u0432\u0438\u043b\u0430\u043c \u0442\u0435\u0445\u043d\u0438\u043a\u0438.');
    var sourceHp = rules.fixedHp === null ? Math.max(rules.minimumHp, statValue('life') * rules.hpPercent / 100) : rules.fixedHp;
    var extraSupport = Number(options.extraSupport || 0);
    if (!Number.isSafeInteger(extraSupport) || extraSupport < 0 || extraSupport > 100000) throw new Error('\u041d\u0435\u0434\u043e\u043f\u0443\u0441\u0442\u0438\u043c\u0430\u044f \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430 \u0434\u043e\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044c\u043d\u044b\u0445 \u0438\u043b\u043b\u044e\u0437\u0438\u0439.');
    var maxHp = rules.chargeable ? Number(options.maxHp || Math.max(hp, sourceHp)) : sourceHp;
    if (!isFinite(maxHp) || maxHp < hp) throw new Error('\u041c\u0430\u043a\u0441\u0438\u043c\u0430\u043b\u044c\u043d\u043e\u0435 HP \u043d\u0435 \u043c\u043e\u0436\u0435\u0442 \u0431\u044b\u0442\u044c \u043c\u0435\u043d\u044c\u0448\u0435 \u0442\u0435\u043a\u0443\u0449\u0435\u0433\u043e.');
    var plan = { id: options.id || 'clone-' + (++cloneSequence), postId: String(item.postId), name: item.name, url: item.url, rank: item.rank, mode: mode, mass: rules.mass,
      count: count, general: general, focused: Math.min(focusedChakraAbsoluteLimit(), focused), hp: hp, maxHp: maxHp,
      noTechniques: rules.noTechniques, noArtifacts: rules.noArtifacts, baseSupport: maintenance, extraSupport: extraSupport, support: maintenance + extraSupport, returnChakra: rules.mass ? mode === 'divide' : true, createdNow: false };
    return { label: '\u0420\u0430\u043d\u0435\u0435 \u0441\u043e\u0437\u0434\u0430\u043d\u043d\u044b\u0435 \u043a\u043b\u043e\u043d\u044b \u00d7' + count, summary: item.name + '; \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430: ' + plan.support + ' \u0441 \u043a\u0430\u0436\u0434\u043e\u0433\u043e \u043a\u043b\u043e\u043d\u0430', code: '[url=' + item.url + ']' + item.name + '[/url] \u2014 \u0440\u0430\u043d\u0435\u0435 \u0441\u043e\u0437\u0434\u0430\u043d\u043d\u044b\u0435 \u043a\u043b\u043e\u043d\u044b \u00d7' + count,
      od: 0, ot: 0, cloneImport: plan, autoImported: !!options.autoImported };
  }

  function inuzukaNinkenCount() {
    var ability = state.character && (state.character.abilities || []).find(function (item) { return String(item.postId) === String(PASSIVE_ABILITIES.inuzuka); });
    var text = clean(ability && (ability.name + ' ' + (ability.comment || ability.note || '')));
    var match = text.match(/(\d+)\s*\u043d\u0438\u043d\u043a\u0435\u043d/i);
    return match ? Math.max(1, Number(match[1])) : 1;
  }

  function activeSummonedCompanions() {
    var result = [];
    state.actions.forEach(function (action, actionIndex) {
      (action.summonedCompanions || []).forEach(function (entry, entryIndex) {
        result.push(Object.assign({}, entry, { companionId: (action.summonGroupId || 'summon-' + actionIndex) + '-' + entryIndex }));
      });
    });
    return result;
  }

  function companionActionUsage(companionId, point) {
    return state.actions.filter(function (action) { return action.companionId === companionId && action.companionPoint === point; }).length;
  }

  function companionOrdinaryAttack(companion) {
    var stats = companion.stats || {};
    var attack = (stats.speed || 0) + (stats.taijutsu || 0);
    var damageMatch = clean(companion.text || companion.description).match(/(?:\u043e\u0431\u044b\u0447\u043d[\u0430-\u044f ]*\u0430\u0442\u0430\u043a[\u0430-\u044f]*|\u0443\u0434\u0430\u0440[\u0430-\u044f ]*|\u0443\u043a\u0443\u0441)\s*:?[\u0430-\u044f ]*(\d+)\s*(?:\u0435\u0434|\u0443\u0440\u043e\u043d)/i);
    var damage = damageMatch ? Number(damageMatch[1]) : Math.max(0, (stats.taijutsu || 0) + (stats.strength || 0));
    return { attack: attack, damage: damage };
  }

  function addCompanionOrdinaryAction(companion) {
    var maximum = Math.max(1, Number(companion.ordinaryTotal) || Math.ceil(actionTotal('ordinary') / 2));
    if (companionActionUsage(companion.companionId, 'od') >= maximum) throw new Error('\u0423 \u0441\u043f\u0443\u0442\u043d\u0438\u043a\u0430 \u0437\u0430\u043a\u043e\u043d\u0447\u0438\u043b\u0438\u0441\u044c \u041e\u0414.');
    var values = companionOrdinaryAttack(companion);
    return addAction({ label: companion.name + ' \u2014 \u043e\u0431\u044b\u0447\u043d\u0430\u044f \u0430\u0442\u0430\u043a\u0430', od: 0, ot: 0, summary: '\u0410\u0442\u0430\u043a\u0430 ' + values.attack + ', \u0443\u0440\u043e\u043d ' + values.damage, code: (companion.url ? '[url=' + companion.url + ']' + companion.name + '[/url]' : companion.name) + ': \u043e\u0431\u044b\u0447\u043d\u0430\u044f \u0430\u0442\u0430\u043a\u0430; \u0410\u0442\u0430\u043a\u0430 \u0431\u043b\u0438\u0436\u043d\u0438\u0439 \u0431\u043e\u0439: ' + values.attack + '; \u0443\u0440\u043e\u043d: ' + values.damage, companionId: companion.companionId, companionPoint: 'od' });
  }
  function addCompanionTechniqueAction(companion, postId) {
    var technique = (companion.techniques || []).find(function (item) { return String(item.postId) === String(postId); });
    if (!technique) throw new Error('\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0442\u0435\u0445\u043d\u0438\u043a\u0443 \u043f\u0440\u0438\u0437\u044b\u0432\u0430.');
    var maximum = Math.max(0, Number(companion.techniqueTotal) || 0);
    if (companionActionUsage(companion.companionId, 'ot') >= maximum) throw new Error('\u0423 \u0441\u043f\u0443\u0442\u043d\u0438\u043a\u0430 \u0437\u0430\u043a\u043e\u043d\u0447\u0438\u043b\u0438\u0441\u044c \u041e\u0422.');
    var stats = companion.stats || {}, attack = (stats.ninjutsu || 0) + (stats.chakra || 0);
    return addAction({ label: companion.name + ' \u2014 \u0442\u0435\u0445\u043d\u0438\u043a\u0430', od: 0, ot: 0, summary: technique.name + ', \u0430\u0442\u0430\u043a\u0430 ' + attack, code: (companion.url ? '[url=' + companion.url + ']' + companion.name + '[/url]' : companion.name) + ': [url=' + technique.url + ']' + technique.name + '[/url]; \u041d\u0438\u043d\u0434\u0437\u044e\u0446\u0443 + \u0427\u0430\u043a\u0440\u0430 \u043f\u0440\u0438\u0437\u044b\u0432\u0430: ' + attack, companionId: companion.companionId, companionPoint: 'ot' });
  }

  function puppetInventoryItems() {
    return (state.character && state.character.inventory || []).filter(function (item) { return /\u043a\u0443\u043a\u043b|\u043c\u0430\u0440\u0438\u043e\u043d\u0435\u0442/i.test(item.category + ' ' + item.name) || /[?&]id=81(?:[&#]|$)/.test(item.url || ''); });
  }

  function puppetControlActive() {
    return state.actions.some(function (action) { return action.activeEffectKey === 'technique:17352' || /#p17352/.test(action.code || ''); }) || !!(combatState().activeEffects || []).find(function (effect) { return effect.key === 'technique:17352'; });
  }

  function parsePuppetCard(region, item) {
    var text = clean(region && region.textContent), ordinary = text.match(/\u0423\u0440\u043e\u043d \u043e\u0442 \u043e\u0431\u044b\u0447\u043d\u043e\u0439 \u0430\u0442\u0430\u043a\u0438 \u043c\u0430\u0440\u0438\u043e\u043d\u0435\u0442\u043a\u0438\s*:?\s*(\d+)/i), body = text.match(/\u0423\u0440\u043e\u043d \u043e\u0442 \u0430\u0442\u0430\u043a \u043a\u043e\u0440\u043f\u0443\u0441\u043e\u043c\s*:?\s*(\d+)/i), chakra = text.match(/\u0427\u0430\u043a\u0440\u0430 \u043c\u0430\u0440\u0438\u043e\u043d\u0435\u0442\u043a\u0438\s*:?\s*(\d+)/i);
    var mechanismText = (text.match(/\u041c\u0435\u0445\u0430\u043d\u0438\u0437\u043c\u044b\s*:?([\s\S]*?)(?:\u041e\u043f\u0438\u0441\u0430\u043d\u0438\u0435\s*:|\u041f\u0440\u0438\u043c\u0435\u0447\u0430\u043d\u0438\u0435\s*:)/i) || [])[1] || '';
    var mechanisms = mechanismText.split(/\u25cf/).map(clean).filter(function (line) { return line && !/\u0423\u0440\u043e\u043d \u043e\u0442 \u043e\u0431\u044b\u0447\u043d\u043e\u0439 \u0430\u0442\u0430\u043a\u0438 \u043c\u0430\u0440\u0438\u043e\u043d\u0435\u0442\u043a\u0438/i.test(line); }).map(function (line, index) { var damage = line.match(/(?:\u0443\u0440\u043e\u043d[^:]*:?\s*|:\s*)(\d+)\s*(?:\u0435\u0434\u0438\u043d\u0438\u0446|\u0435\u0434\.|\u0443\u0440\u043e\u043d)/i); return { id: index, name: line.slice(0, 90), text: line, damage: damage ? Number(damage[1]) : 0 }; });
    var techniques = [];
    if (/\u0427\u0435\u043b\u043e\u0432\u0435\u0447\u0435\u0441\u043a\u0430\u044f \u043c\u0430\u0440\u0438\u043e\u043d\u0435\u0442\u043a\u0430/i.test(text)) Array.prototype.forEach.call(region.querySelectorAll('a[href*="#p"]'), function (link) { var href = absoluteUrl(link.getAttribute('href'), BASE_URL), post = href.match(/#p(\d+)/i); if (post && !/[?&]id=81(?:[&#]|$)/.test(href)) techniques.push({ postId: post[1], name: clean(link.textContent), url: href, rank: summonRankFromNode(link) }); });
    return { name: item.name, url: item.url, ordinaryDamage: ordinary ? Number(ordinary[1]) : statValue('unarmedDamage'), bodyDamage: body ? Number(body[1]) : 0, chakra: chakra ? Number(chakra[1]) : 0, human: /\u0427\u0435\u043b\u043e\u0432\u0435\u0447\u0435\u0441\u043a\u0430\u044f \u043c\u0430\u0440\u0438\u043e\u043d\u0435\u0442\u043a\u0430/i.test(text), mechanisms: mechanisms, techniques: techniques };
  }

  function loadPuppetDetail(item) {
    if (state.puppetDetails[item.inventoryId]) return actorResolve(state.puppetDetails[item.inventoryId]);
    var postId = ((item.url || '').match(/#p(\d+)/i) || [])[1];
    if (!postId) return actorResolve(null);
    return loadDocument(item.url.split('#')[0]).then(function (doc) { var region = findPostContent(doc, postId); if (!region) throw new Error('\u041a\u0430\u0440\u0442\u043e\u0447\u043a\u0430 \u043c\u0430\u0440\u0438\u043e\u043d\u0435\u0442\u043a\u0438 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u0430.'); state.puppetDetails[item.inventoryId] = parsePuppetCard(region, item); return state.puppetDetails[item.inventoryId]; });
  }

  function puppetActionLimit() { var left = remaining(); return Math.round(left.od / 2 + left.ot); }

  function addPuppetAction(item, detail, point, mechanismId) {
    if (!puppetControlActive()) throw new Error('\u0421\u043d\u0430\u0447\u0430\u043b\u0430 \u0430\u043a\u0442\u0438\u0432\u0438\u0440\u0443\u0439\u0442\u0435 \u0438\u043b\u0438 \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u0438\u0442\u0435 \u0422\u0435\u0445\u043d\u0438\u043a\u0443 \u0443\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u044f \u043c\u0430\u0440\u0438\u043e\u043d\u0435\u0442\u043a\u043e\u0439.');
    if (!detail || puppetActionLimit() <= 0) throw new Error('\u0423 \u043c\u0430\u0440\u0438\u043e\u043d\u0435\u0442\u043a\u0438 \u043d\u0435\u0442 \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u044b\u0445 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439.');
    point = point === 'ot' ? 'ot' : 'od';
    var bodyAttack = mechanismId === 'body';
    var mechanism = mechanismId === '' || bodyAttack ? null : detail.mechanisms.find(function (entry) { return String(entry.id) === String(mechanismId); });
    var attack = mechanism ? statValue('knowledge') + statValue('fuinjutsu') : statValue('fuinjutsu') + statValue('ninjutsu');
    var damage = bodyAttack ? detail.bodyDamage : mechanism ? mechanism.damage : detail.ordinaryDamage;
    var name = bodyAttack ? '\u0410\u0442\u0430\u043a\u0430 \u043a\u043e\u0440\u043f\u0443\u0441\u043e\u043c' : mechanism ? mechanism.name : '\u041e\u0431\u044b\u0447\u043d\u0430\u044f \u0430\u0442\u0430\u043a\u0430';
    return addAction({ label: item.name + ' \u2014 ' + name, od: point === 'od' ? 1 : 0, ot: point === 'ot' ? 1 : 0, summary: '\u041f\u0440\u043e\u0432\u0435\u0440\u043a\u0430 ' + attack + ', \u0443\u0440\u043e\u043d ' + damage, code: '[url=' + item.url + ']' + item.name + '[/url] \u2014 ' + name + '; ' + (mechanism ? '\u0417\u043d\u0430\u043d\u0438\u044f + \u0424\u0443\u0438\u043d\u0434\u0437\u044e\u0446\u0443' : '\u0424\u0443\u0438\u043d\u0434\u0437\u044e\u0446\u0443 + \u041d\u0438\u043d\u0434\u0437\u044e\u0446\u0443') + ': ' + attack + '; \u0443\u0440\u043e\u043d: ' + damage, companionId: 'puppet:' + item.inventoryId, companionPoint: point });
  }

  function addPuppetTechniqueAction(item, detail, point, postId) {
    if (!puppetControlActive()) throw new Error('\u0421\u043d\u0430\u0447\u0430\u043b\u0430 \u0430\u043a\u0442\u0438\u0432\u0438\u0440\u0443\u0439\u0442\u0435 \u0438\u043b\u0438 \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u0438\u0442\u0435 \u0422\u0435\u0445\u043d\u0438\u043a\u0443 \u0443\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u044f \u043c\u0430\u0440\u0438\u043e\u043d\u0435\u0442\u043a\u043e\u0439.');
    var technique = detail.techniques.find(function (entry) { return String(entry.postId) === String(postId); });
    if (!technique) throw new Error('\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0442\u0435\u0445\u043d\u0438\u043a\u0443 \u0447\u0435\u043b\u043e\u0432\u0435\u0447\u0435\u0441\u043a\u043e\u0439 \u043c\u0430\u0440\u0438\u043e\u043d\u0435\u0442\u043a\u0438.');
    if (puppetActionLimit() <= 0) throw new Error('\u0423 \u043c\u0430\u0440\u0438\u043e\u043d\u0435\u0442\u043a\u0438 \u043d\u0435\u0442 \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u044b\u0445 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439.');
    point = point === 'ot' ? 'ot' : 'od';
    var attack = statValue('ninjutsu') + detail.chakra;
    return addAction({ label: item.name + ' \u2014 \u0442\u0435\u0445\u043d\u0438\u043a\u0430', od: point === 'od' ? 1 : 0, ot: point === 'ot' ? 1 : 0, summary: technique.name + ', \u0430\u0442\u0430\u043a\u0430 ' + attack, code: '[url=' + item.url + ']' + item.name + '[/url]: [url=' + technique.url + ']' + technique.name + '[/url]; \u041d\u0438\u043d\u0434\u0437\u044e\u0446\u0443 \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0430 + \u0427\u0430\u043a\u0440\u0430 \u043c\u0430\u0440\u0438\u043e\u043d\u0435\u0442\u043a\u0438: ' + statValue('ninjutsu') + ' + ' + detail.chakra + ' = ' + attack, companionId: 'puppet:' + item.inventoryId, companionPoint: point });
  }

  function hasAvailableCompanions() {
    return hasPassiveAbility('inuzuka') || activeSummonedCompanions().length > 0 || chakraLedger().cloneGroups.length > 0 || puppetInventoryItems().length > 0;
  }

  function renderActiveClones() {
    var panel = state.nodes.builder.querySelector('.aba-builder-panel');
    var groups = chakraLedger().cloneGroups;
    var cards = [], cloneNumbers = {};
    groups.forEach(function (group) { for (var i = 0; i < (group.mass ? 1 : group.count); i++) { cloneNumbers[group.postId] = (cloneNumbers[group.postId] || 0) + 1; cards.push({ group: group, number: cloneNumbers[group.postId] }); } });
    var ninkenCount = hasPassiveAbility('inuzuka') ? inuzukaNinkenCount() : 0;
    var ninkenCard = ninkenCount ? '<section class="aba-clone-card" data-innate-ninken><strong>\u041d\u0438\u043d\u043a\u0435\u043d \u00d7' + ninkenCount + ' \u2014 \u043f\u043e\u0441\u0442\u043e\u044f\u043d\u043d\u044b\u0435 \u0441\u043f\u0443\u0442\u043d\u0438\u043a\u0438</strong><p>\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u0439: \u041e\u0414 ' + actionTotal('ordinary') + '; \u041e\u0422 ' + Math.ceil(actionTotal('technique') / 2) + '. \u0410\u0442\u0430\u043a\u0430 \u0431\u043b\u0438\u0436\u043d\u0438\u0439 \u0431\u043e\u0439: ' + statValue('meleeAttack') + '; \u043e\u0431\u044b\u0447\u043d\u044b\u0439 \u0443\u0440\u043e\u043d: ' + (statValue('taijutsu') + statValue('strength')) + '; \u0423\u043a\u0443\u0441: ' + damageText('unarmedDamage') + ' \u0438 \u041a\u0440\u043e\u0432\u043e\u0442\u0435\u0447\u0435\u043d\u0438\u0435 5 \u0443\u0440\u043e\u043d\u0430 \u0432 \u0445\u043e\u0434, 3 \u0445\u043e\u0434\u0430.</p><div class="aba-inline aba-clone-buttons"><button type="button" class="aba-primary" data-ninken-attack>\u041e\u0431\u044b\u0447\u043d\u0430\u044f \u0430\u0442\u0430\u043a\u0430</button><button type="button" class="aba-refresh" data-ninken-bite>\u0423\u043a\u0443\u0441</button></div></section>' : '';
    var summoned = activeSummonedCompanions();
    var summonCards = summoned.map(function (companion) { var used = companionActionUsage(companion.companionId, 'od'), maximum = Math.max(1, Number(companion.ordinaryTotal) || Math.ceil(actionTotal('ordinary') / 2)), usedOt = companionActionUsage(companion.companionId, 'ot'), maximumOt = Math.max(0, Number(companion.techniqueTotal) || 0); return '<section class="aba-clone-card" data-summoned-companion="' + companion.companionId + '"><strong>' + escapeHtml(companion.name) + ' \u00b7 \u0440\u0430\u043d\u0433 ' + escapeHtml(companion.rank || '') + '</strong><p>' + escapeHtml(companion.category || '\u041e\u0431\u044b\u0447\u043d\u044b\u0439 \u043f\u0440\u0438\u0437\u044b\u0432') + '; \u041e\u0414 ' + used + '/' + maximum + '; \u041e\u0422 ' + usedOt + '/' + maximumOt + '</p><div class="aba-inline aba-clone-buttons"><button type="button" class="aba-primary" data-companion-attack' + (used >= maximum ? ' disabled' : '') + '>\u041e\u0431\u044b\u0447\u043d\u0430\u044f \u0430\u0442\u0430\u043a\u0430</button>' + ((companion.techniques || []).length ? '<select data-companion-technique><option value="">\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0442\u0435\u0445\u043d\u0438\u043a\u0443</option>' + companion.techniques.map(function (technique) { return '<option value="' + technique.postId + '">' + escapeHtml(technique.name) + ' \u00b7 ' + technique.rank + '</option>'; }).join('') + '</select><button type="button" class="aba-refresh" data-companion-technique-use' + (usedOt >= maximumOt ? ' disabled' : '') + '>\u041f\u0440\u0438\u043c\u0435\u043d\u0438\u0442\u044c \u0442\u0435\u0445\u043d\u0438\u043a\u0443</button>' : '') + '</div></section>'; }).join('');
    var puppetActive = puppetControlActive(), puppets = puppetInventoryItems();
    var puppetCards = puppets.map(function (item) { var detail = state.puppetDetails[item.inventoryId], disabled = puppetActive ? '' : ' disabled'; return '<section class="aba-clone-card" data-puppet="' + item.inventoryId + '"><strong>' + escapeHtml(item.name) + ' \u2014 \u043c\u0430\u0440\u0438\u043e\u043d\u0435\u0442\u043a\u0430</strong>' + (!puppetActive ? '<p class="aba-error">\u0414\u043b\u044f \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439 \u0430\u043a\u0442\u0438\u0432\u0438\u0440\u0443\u0439\u0442\u0435 \u0438\u043b\u0438 \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u0438\u0442\u0435 \u0422\u0435\u0445\u043d\u0438\u043a\u0443 \u0443\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u044f \u043c\u0430\u0440\u0438\u043e\u043d\u0435\u0442\u043a\u043e\u0439.</p>' : '') + (!detail ? '<p class="aba-loading">\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u043a\u0430\u0440\u0442\u043e\u0447\u043a\u0438\u2026</p>' : '<p>\u0414\u043e\u0441\u0442\u0443\u043f\u043d\u043e \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439: ' + puppetActionLimit() + '; \u043e\u0431\u044b\u0447\u043d\u0430\u044f \u0430\u0442\u0430\u043a\u0430: ' + detail.ordinaryDamage + (detail.bodyDamage ? '; \u0430\u0442\u0430\u043a\u0430 \u043a\u043e\u0440\u043f\u0443\u0441\u043e\u043c: ' + detail.bodyDamage : '') + '</p><label>\u0421\u043f\u0438\u0441\u0430\u0442\u044c \u043e\u0447\u043a\u043e<select data-puppet-point' + disabled + '><option value="od">\u041e\u0414</option><option value="ot">\u041e\u0422</option></select></label><div class="aba-inline aba-clone-buttons"><button type="button" class="aba-primary" data-puppet-ordinary' + disabled + '>\u041e\u0431\u044b\u0447\u043d\u0430\u044f \u0430\u0442\u0430\u043a\u0430</button>' + (detail.bodyDamage ? '<button type="button" class="aba-refresh" data-puppet-body' + disabled + '>\u0410\u0442\u0430\u043a\u0430 \u043a\u043e\u0440\u043f\u0443\u0441\u043e\u043c</button>' : '') + (detail.mechanisms.length ? '<select data-puppet-mechanism' + disabled + '><option value="">\u041c\u0435\u0445\u0430\u043d\u0438\u0437\u043c</option>' + detail.mechanisms.map(function (entry) { return '<option value="' + entry.id + '">' + escapeHtml(entry.name) + '</option>'; }).join('') + '</select><button type="button" class="aba-refresh" data-puppet-fire' + disabled + '>\u0412\u044b\u0441\u0442\u0440\u0435\u043b \u043c\u0435\u0445\u0430\u043d\u0438\u0437\u043c\u043e\u043c</button>' : '') + (detail.human && detail.techniques.length ? '<label>\u0422\u0435\u0445\u043d\u0438\u043a\u0430 \u0447\u0435\u043b\u043e\u0432\u0435\u0447\u0435\u0441\u043a\u043e\u0439 \u043c\u0430\u0440\u0438\u043e\u043d\u0435\u0442\u043a\u0438<select data-puppet-technique' + disabled + '><option value="">\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0442\u0435\u0445\u043d\u0438\u043a\u0443</option>' + detail.techniques.map(function (technique) { return '<option value="' + technique.postId + '">' + escapeHtml(technique.name) + ' \u00b7 ' + technique.rank + '</option>'; }).join('') + '</select></label><button type="button" class="aba-refresh" data-puppet-technique-use' + disabled + '>\u041f\u0440\u0438\u043c\u0435\u043d\u0438\u0442\u044c \u0442\u0435\u0445\u043d\u0438\u043a\u0443</button>' : '') + '</div>') + '</section>'; }).join('');
    panel.innerHTML = '<h4>\u0421\u043f\u0443\u0442\u043d\u0438\u043a\u0438 \u0438 \u043a\u043b\u043e\u043d\u044b</h4>' + (groups.some(function (group) { return group.mass; }) ? '<p class="aba-clone-owner-warning">\u041e\u0441\u0442\u0430\u0442\u043e\u043a \u043e\u0431\u0449\u0435\u0439 \u0447\u0430\u043a\u0440\u044b \u043e\u0440\u0438\u0433\u0438\u043d\u0430\u043b\u0430: ' + chakraLedger().general + '</p>' : '') + '<p class="aba-note">\u0423 \u043a\u0430\u0436\u0434\u043e\u0433\u043e \u043a\u043b\u043e\u043d\u0430 \u0441\u0432\u043e\u0438 \u0440\u0435\u0441\u0443\u0440\u0441\u044b \u0438 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044f. \u041d\u0438\u043d\u043a\u0435\u043d \u0418\u043d\u0443\u0437\u0443\u043a\u0430 \u0434\u043e\u0431\u0430\u0432\u043b\u044f\u0435\u0442\u0441\u044f \u0430\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0447\u0435\u0441\u043a\u0438 \u0438 \u0434\u0435\u0439\u0441\u0442\u0432\u0443\u0435\u0442 \u0431\u0435\u0437 \u0440\u0430\u0441\u0445\u043e\u0434\u0430 \u041e\u0414/\u041e\u0422 \u0432\u043b\u0430\u0434\u0435\u043b\u044c\u0446\u0430.</p><div class="aba-clone-groups">' + ninkenCard +
      (groups.length ? cards.map(function (entry) { var group = entry.group; return '<section class="aba-clone-card" data-clone-group="' + group.id + '"><strong>' + escapeHtml(group.name) + (group.mass ? ' \u00d7' + group.count : ' \u2014 \u043a\u043b\u043e\u043d ' + entry.number) + '</strong><p>HP ' + group.hp + '/' + group.maxHp + '; \u0447\u0430\u043a\u0440\u0430 ' + group.general + '; \u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u0430\u044f ' + group.focused + '; \u041e\u0414 ' + group.od + '/' + state.character.ordinaryTotal + '; \u041e\u0422 ' + group.ot + '/' + state.character.techniqueTotal + '</p><p class="aba-note">' + (group.createdNow ? '\u0421\u043e\u0437\u0434\u0430\u043d\u044b \u0432 \u044d\u0442\u043e\u043c \u0445\u043e\u0434\u0443' : '\u041f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430 \u044d\u0442\u043e\u0433\u043e \u0445\u043e\u0434\u0430 \u0441\u043f\u0438\u0441\u0430\u043d\u0430') + '; ' + (group.returnChakra ? '\u043e\u0441\u0442\u0430\u0442\u043e\u043a \u0447\u0430\u043a\u0440\u044b \u0432\u043e\u0437\u0432\u0440\u0430\u0449\u0430\u0435\u0442\u0441\u044f \u043e\u0440\u0438\u0433\u0438\u043d\u0430\u043b\u0443' : '\u0431\u0435\u0437 \u0432\u043e\u0437\u0432\u0440\u0430\u0442\u0430 \u0447\u0430\u043a\u0440\u044b') + '</p>' + (group.mass ? '<label>\u041a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e \u0434\u043b\u044f \u043e\u043f\u0435\u0440\u0430\u0446\u0438\u0438<input type="number" min="1" max="' + group.count + '" value="1" data-clone-operation-count></label>' : '') + '<div class="aba-inline aba-clone-buttons"><button type="button" class="aba-primary" data-clone-act>\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044f \u043a\u043b\u043e\u043d\u0430</button><button type="button" class="aba-refresh" data-clone-dismiss>\u0420\u0430\u0441\u0441\u0435\u044f\u043d</button></div></section>'; }).join('') : (ninkenCard ? '' : '<p class="aba-note">\u041c\u0430\u0442\u0435\u0440\u0438\u0430\u043b\u044c\u043d\u044b\u0445 \u043a\u043b\u043e\u043d\u043e\u0432 \u043f\u043e\u043a\u0430 \u043d\u0435\u0442.</p>')) + summonCards + puppetCards +
      '</div><details class="aba-modifiers"><summary>\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0440\u0430\u043d\u0435\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u043e\u0432\u0430\u0432\u0448\u0438\u0445 \u043a\u043b\u043e\u043d\u043e\u0432</summary><div class="aba-modifiers-body aba-clone-import-form aba-action-editor"></div></details><div class="aba-clone-action-host"></div><div class="aba-builder-message" aria-live="polite"></div>';
    var ninkenAttack = panel.querySelector('[data-ninken-attack]'), ninkenBite = panel.querySelector('[data-ninken-bite]');
    Array.prototype.forEach.call(panel.querySelectorAll('[data-puppet]'), function (card) { var item = puppets.find(function (entry) { return entry.inventoryId === card.dataset.puppet; }), detail = state.puppetDetails[item.inventoryId]; if (!detail) { loadPuppetDetail(item).then(function () { if (state.builderTab === 'clones') renderActiveClones(); }).catch(function (error) { setBuilderMessage(error.message, 'error'); }); return; } var point = card.querySelector('[data-puppet-point]'); var ordinary = card.querySelector('[data-puppet-ordinary]'); if (ordinary) on(ordinary, 'click', function () { try { addPuppetAction(item, detail, point.value, ''); renderActiveClones(); } catch (error) { setBuilderMessage(error.message, 'error'); } }); var body = card.querySelector('[data-puppet-body]'); if (body) on(body, 'click', function () { try { addPuppetAction(item, detail, point.value, 'body'); renderActiveClones(); } catch (error) { setBuilderMessage(error.message, 'error'); } }); var useTechnique = card.querySelector('[data-puppet-technique-use]'), technique = card.querySelector('[data-puppet-technique]'); if (useTechnique) on(useTechnique, 'click', function () { try { addPuppetTechniqueAction(item, detail, point.value, technique.value); renderActiveClones(); } catch (error) { setBuilderMessage(error.message, 'error'); } }); var fire = card.querySelector('[data-puppet-fire]'), mechanism = card.querySelector('[data-puppet-mechanism]'); if (fire) on(fire, 'click', function () { try { if (!mechanism.value) throw new Error('\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043c\u0435\u0445\u0430\u043d\u0438\u0437\u043c.'); addPuppetAction(item, detail, point.value, mechanism.value); renderActiveClones(); } catch (error) { setBuilderMessage(error.message, 'error'); } }); });
    Array.prototype.forEach.call(panel.querySelectorAll('[data-summoned-companion]'), function (card) { var companion = summoned.find(function (item) { return item.companionId === card.dataset.summonedCompanion; }); var attack = card.querySelector('[data-companion-attack]'); if (attack) on(attack, 'click', function () { try { addCompanionOrdinaryAction(companion); renderActiveClones(); } catch (error) { setBuilderMessage(error.message, 'error'); } }); var useTechnique = card.querySelector('[data-companion-technique-use]'), technique = card.querySelector('[data-companion-technique]'); if (useTechnique) on(useTechnique, 'click', function () { try { addCompanionTechniqueAction(companion, technique.value); renderActiveClones(); } catch (error) { setBuilderMessage(error.message, 'error'); } }); });
    if (ninkenAttack) on(ninkenAttack, 'click', function () { if (companionActionUsage('inuzuka-ninken', 'od') >= actionTotal('ordinary')) return setBuilderMessage('\u0423 \u043d\u0438\u043d\u043a\u0435\u043d \u0437\u0430\u043a\u043e\u043d\u0447\u0438\u043b\u0438\u0441\u044c \u041e\u0414.', 'error'); addAction({ label: '\u041d\u0438\u043d\u043a\u0435\u043d \u2014 \u0430\u0442\u0430\u043a\u0430', od: 0, ot: 0, summary: '\u0410\u0442\u0430\u043a\u0430 \u0431\u043b\u0438\u0436\u043d\u0438\u0439 \u0431\u043e\u0439 ' + statValue('meleeAttack') + ', \u0443\u0440\u043e\u043d ' + (statValue('taijutsu') + statValue('strength')), code: '\u041d\u0438\u043d\u043a\u0435\u043d: \u0410\u0442\u0430\u043a\u0430 \u0431\u043b\u0438\u0436\u043d\u0438\u0439 \u0431\u043e\u0439 ' + statValue('meleeAttack') + '; \u0443\u0440\u043e\u043d: \u0422\u0430\u0439\u0434\u0437\u044e\u0446\u0443 + \u0421\u0438\u043b\u0430 = ' + (statValue('taijutsu') + statValue('strength')) + ' (\u0431\u0435\u0437 \u0440\u0430\u0441\u0445\u043e\u0434\u0430 \u041e\u0414/\u041e\u0422 \u0432\u043b\u0430\u0434\u0435\u043b\u044c\u0446\u0430)', companionId: 'inuzuka-ninken', companionPoint: 'od' }); renderActiveClones(); });
    if (ninkenBite) on(ninkenBite, 'click', function () { if (companionActionUsage('inuzuka-ninken', 'od') >= actionTotal('ordinary')) return setBuilderMessage('\u0423 \u043d\u0438\u043d\u043a\u0435\u043d \u0437\u0430\u043a\u043e\u043d\u0447\u0438\u043b\u0438\u0441\u044c \u041e\u0414.', 'error'); addAction({ label: '\u041d\u0438\u043d\u043a\u0435\u043d \u2014 \u0423\u043a\u0443\u0441', od: 0, ot: 0, summary: '\u0410\u0442\u0430\u043a\u0430 \u0431\u043b\u0438\u0436\u043d\u0438\u0439 \u0431\u043e\u0439 ' + statValue('meleeAttack') + ', \u0443\u0440\u043e\u043d ' + damageText('unarmedDamage'), code: '\u041d\u0438\u043d\u043a\u0435\u043d \u2014 \u0423\u043a\u0443\u0441: \u0410\u0442\u0430\u043a\u0430 \u0431\u043b\u0438\u0436\u043d\u0438\u0439 \u0431\u043e\u0439 ' + statValue('meleeAttack') + '; \u0443\u0440\u043e\u043d: ' + damageText('unarmedDamage') + '; \u041a\u0440\u043e\u0432\u043e\u0442\u0435\u0447\u0435\u043d\u0438\u0435 5 \u0443\u0440\u043e\u043d\u0430 \u0432 \u0445\u043e\u0434, 3 \u0445\u043e\u0434\u0430 (\u0431\u0435\u0437 \u0440\u0430\u0441\u0445\u043e\u0434\u0430 \u041e\u0414/\u041e\u0422 \u0432\u043b\u0430\u0434\u0435\u043b\u044c\u0446\u0430)', companionId: 'inuzuka-ninken', companionPoint: 'od' }); renderActiveClones(); });
    Array.prototype.forEach.call(panel.querySelectorAll('[data-clone-group]'), function (card) {
      var group = groups.find(function (item) { return item.id === card.dataset.cloneGroup; });
      function quantity() { var input = card.querySelector('[data-clone-operation-count]'); var value = input ? Number(input.value) : 1; if (!Number.isSafeInteger(value) || value < 1 || value > group.count) throw new Error('\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043e\u0442 1 \u0434\u043e ' + group.count + ' \u043a\u043b\u043e\u043d\u043e\u0432.'); return value; }
      on(card.querySelector('[data-clone-dismiss]'), 'click', function () {
        try { addAction({ label: '\u041a\u043b\u043e\u043d \u0440\u0430\u0441\u0441\u0435\u044f\u043d', summary: group.name + ' \u00d7' + quantity(), code: '\u0420\u0430\u0441\u0441\u0435\u044f\u043d\u044b \u043a\u043b\u043e\u043d\u044b: ' + group.name + ' \u00d7' + quantity(), od: 0, ot: 0, cloneOperation: 'dismiss', cloneGroupId: group.id, cloneCount: quantity() }); renderActiveClones(); }
        catch (error) { setBuilderMessage(error.message, 'error'); }
      });
      on(card.querySelector('[data-clone-act]'), 'click', function () {
        try { renderCloneActorEditor(panel.querySelector('.aba-clone-action-host'), group, quantity()); }
        catch (error) { setBuilderMessage(error.message, 'error'); }
      });
    });
    renderCloneImportForm(panel.querySelector('.aba-clone-import-form'));
  }

  function renderCloneActorEditor(host, group, count) {
    var spec = { groupId: group.id, count: count, noTechniques: group.noTechniques, noArtifacts: group.noArtifacts };
    host.innerHTML = '<h4>' + escapeHtml(group.name) + (group.mass ? ' \u2014 \u0434\u0435\u0439\u0441\u0442\u0432\u0443\u044e\u0442 ' + count + ' \u043a\u043b\u043e\u043d(\u0430)' : ' \u2014 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044f \u043a\u043b\u043e\u043d\u0430') + '</h4><div class="aba-inline"><label>\u0420\u0430\u0437\u0434\u0435\u043b<select data-clone-action-type><option value="attack">\u0410\u0442\u0430\u043a\u043e\u0432\u0430\u0442\u044c</option><option value="defense">\u0417\u0430\u0449\u0438\u0442\u0438\u0442\u044c\u0441\u044f</option><option value="support">\u041f\u043e\u0434\u0433\u043e\u0442\u043e\u0432\u0438\u0442\u044c\u0441\u044f</option><option value="move">\u0414\u0432\u0438\u0433\u0430\u0442\u044c\u0441\u044f</option><option value="special">\u041e\u0441\u043e\u0431\u043e\u0435 \u0432\u0437\u0430\u0438\u043c\u043e\u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435</option><option value="situations">\u0411\u043e\u0435\u0432\u044b\u0435 \u0441\u0438\u0442\u0443\u0430\u0446\u0438\u0438</option></select></label></div><div class="aba-clone-actor-builder"><div class="aba-builder-panel"></div></div>';
    var builder = host.querySelector('.aba-clone-actor-builder');
    function update() {
      withCloneActor(spec, function () {
        var savedBuilder = state.nodes.builder;
        state.nodes.builder = builder;
        try { renderActionType(host.querySelector('[data-clone-action-type]').value); }
        finally { state.nodes.builder = savedBuilder; }
      });
    }
    on(host.querySelector('[data-clone-action-type]'), 'change', update);
    // Clone callbacks use this compact builder rather than the owner's panel.
    spec.builder = builder;
    update();
  }

  function renderCloneImportForm(container) {
    var techniques = state.character.techniques.filter(function (item) { return cloneTechniqueMatches(item) && item.rank !== 'E'; });
    container.innerHTML = '<label>\u0414\u043e\u0431\u0430\u0432\u043b\u0435\u043d\u0438\u0435<select data-clone-import-kind><option value="single">\u0415\u0434\u0438\u043d\u0438\u0447\u043d\u044b\u0435 \u043a\u043b\u043e\u043d\u044b</option><option value="mass">\u041c\u0430\u0441\u0441\u043e\u0432\u043e\u0435 \u043a\u043b\u043e\u043d\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435</option></select></label><label>\u0422\u0438\u043f \u043a\u043b\u043e\u043d\u0430 (\u0442\u0435\u0445\u043d\u0438\u043a\u0430)<select data-clone-import-technique></select></label><label>\u0412\u0430\u0440\u0438\u0430\u043d\u0442 \u043c\u0430\u0441\u0441\u043e\u0432\u044b\u0445 \u043a\u043b\u043e\u043d\u043e\u0432<select data-clone-import-mode><option value="divide">1. \u0421 \u0440\u0430\u0437\u0434\u0435\u043b\u0435\u043d\u0438\u0435\u043c \u0438 \u0432\u043e\u0437\u0432\u0440\u0430\u0442\u043e\u043c \u0447\u0430\u043a\u0440\u044b</option><option value="allocate">2. \u0421 \u0432\u044b\u0434\u0435\u043b\u0435\u043d\u0438\u0435\u043c, \u0431\u0435\u0437 \u0432\u043e\u0437\u0432\u0440\u0430\u0442\u0430</option></select></label><div class="aba-inline"><label>\u041a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e<input type="number" min="1" value="1" data-clone-field="count"></label><label>\u041e\u0441\u0442\u0430\u0442\u043e\u043a \u043e\u0431\u0449\u0435\u0439 \u0447\u0430\u043a\u0440\u044b \u043a\u0430\u0436\u0434\u043e\u0433\u043e<input type="number" min="0" step="any" value="1" data-clone-field="general"></label><label>\u041e\u0441\u0442\u0430\u0442\u043e\u043a \u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u043e\u0439 \u0447\u0430\u043a\u0440\u044b \u043a\u0430\u0436\u0434\u043e\u0433\u043e<input type="number" min="0" step="any" value="' + chakraLedger().focused + '" data-clone-field="focused"></label><label>\u0422\u0435\u043a\u0443\u0449\u0435\u0435 HP \u043a\u0430\u0436\u0434\u043e\u0433\u043e<input type="number" min="1" step="1" value="1" data-clone-field="hp"></label><label>\u041c\u0430\u043a\u0441\u0438\u043c\u0430\u043b\u044c\u043d\u043e\u0435 HP \u043a\u0430\u0436\u0434\u043e\u0433\u043e<input type="number" min="0.01" step="any" value="1" data-clone-field="max-hp"></label></div><label>\u041f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430 \u043a\u0430\u0436\u0434\u043e\u0433\u043e \u043a\u043b\u043e\u043d\u0430 \u0432 \u044d\u0442\u043e\u043c \u0445\u043e\u0434\u0443<select data-clone-import-support></select></label><button type="button" class="aba-primary" data-clone-import>\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0432\u0440\u0443\u0447\u043d\u0443\u044e</button><label>\u0421\u0441\u044b\u043b\u043a\u0430 \u043d\u0430 \u043f\u043e\u0441\u0442 \u0441 \u043e\u0441\u0442\u0430\u0442\u043a\u0430\u043c\u0438 \u043a\u043b\u043e\u043d\u043e\u0432<input type="url" data-clone-import-url placeholder="https://\u2026#p123"></label><button type="button" class="aba-refresh" data-clone-import-link>\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u043f\u043e \u0441\u0441\u044b\u043b\u043a\u0435</button><p class="aba-note">\u0423 \u0440\u0430\u043d\u0435\u0435 \u0441\u043e\u0437\u0434\u0430\u043d\u043d\u044b\u0445 \u043c\u0430\u0442\u0435\u0440\u0438\u0430\u043b\u044c\u043d\u044b\u0445 \u043a\u043b\u043e\u043d\u043e\u0432 \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430 \u0441\u043f\u0438\u0441\u044b\u0432\u0430\u0435\u0442\u0441\u044f \u0438\u0437 \u0443\u043a\u0430\u0437\u0430\u043d\u043d\u043e\u0433\u043e \u043e\u0441\u0442\u0430\u0442\u043a\u0430 \u043a\u0430\u0436\u0434\u043e\u0433\u043e \u043a\u043b\u043e\u043d\u0430. \u0418\u043b\u043b\u044e\u0437\u043e\u0440\u043d\u044b\u0435 \u043a\u043b\u043e\u043d\u044b E \u0440\u0430\u043d\u0433\u0430 \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u044e\u0442\u0441\u044f \u043e\u0440\u0438\u0433\u0438\u043d\u0430\u043b\u043e\u043c \u0438 \u043d\u0435 \u043f\u043e\u043b\u0443\u0447\u0430\u044e\u0442 \u043e\u0442\u0434\u0435\u043b\u044c\u043d\u044b\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044f.</p>';
    var type = container.querySelector('[data-clone-import-kind]'), select = container.querySelector('[data-clone-import-technique]');
    function choices() {
      var list = techniques.filter(function (item) { return (String(item.postId) === '37403' || /\u043c\u043d\u043e\u0436\u0435\u0441\u0442\u0432\u0435\u043d\u043d/i.test(item.name)) === (type.value === 'mass'); });
      select.innerHTML = list.map(function (item) { return '<option value="' + item.postId + '">' + item.rank + ' \u2014 ' + escapeHtml(item.name) + '</option>'; }).join('');
      var countInput = container.querySelector('[data-clone-field="count"]');
      countInput.parentNode.style.setProperty('display', type.value === 'mass' ? 'flex' : 'none', 'important');
      if (type.value !== 'mass') countInput.value = 1;
      var modeLabel = container.querySelector('[data-clone-import-mode]').parentNode;
      modeLabel.hidden = type.value !== 'mass';
      modeLabel.style.setProperty('display', type.value === 'mass' ? 'flex' : 'none', 'important');
      updateHp();
    }
    function updateHp() {
      var item = techniques.find(function (candidate) { return candidate.postId === select.value; });
      if (item) loadTechniqueDetail(item).then(function () {
        var rules = cloneTechniqueRules(item);
        container.querySelector('[data-clone-import-support]').innerHTML = rules.supportRates.map(function (value) { return '<option value="' + value + '">' + value + ' \u043e\u0431\u0449\u0435\u0439 \u0447\u0430\u043a\u0440\u044b</option>'; }).join('');
        container.querySelector('[data-clone-field="hp"]').value = rules.fixedHp === null ? Math.max(rules.minimumHp, statValue('life') * rules.hpPercent / 100) : rules.fixedHp;
        container.querySelector('[data-clone-field="max-hp"]').value = container.querySelector('[data-clone-field="hp"]').value;
        container.querySelector('[data-clone-field="max-hp"]').readOnly = !rules.chargeable;
      });
    }
    on(type, 'change', choices); on(select, 'change', updateHp);
    on(container.querySelector('[data-clone-import]'), 'click', function () {
      var item = techniques.find(function (candidate) { return candidate.postId === select.value; });
      if (!item) return setBuilderMessage('\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0442\u0435\u0445\u043d\u0438\u043a\u0443 \u043a\u043b\u043e\u043d\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u044f.', 'error');
      loadTechniqueDetail(item).then(function () {
        try {
          var action = cloneImportAction(item, { count: cloneNumberField(container, 'count', 1), general: cloneNumberField(container, 'general', 0), focused: cloneNumberField(container, 'focused', 0), hp: cloneNumberField(container, 'hp', 1), maxHp: cloneNumberField(container, 'max-hp', 1), support: Number(container.querySelector('[data-clone-import-support]').value), mode: container.querySelector('[data-clone-import-mode]').value });
          if (addAction(action)) renderActiveClones();
        } catch (error) { setBuilderMessage(error.message, 'error'); }
      }).catch(function (error) { setBuilderMessage(error.message, 'error'); });
    });
    on(container.querySelector('[data-clone-import-link]'), 'click', function () { loadCloneGroupsFromUrl(container.querySelector('[data-clone-import-url]').value); });
    choices();
  }

  function cloneGroupsBbcode(groups) {
    var modes = { divide: '\u0440\u0430\u0437\u0434\u0435\u043b\u0435\u043d\u0438\u0435', allocate: '\u0432\u044b\u0434\u0435\u043b\u0435\u043d\u0438\u0435', single: '\u043e\u0431\u044b\u0447\u043d\u044b\u0439' };
    return groups.map(function (group) { return '[b]\u0421\u043e\u0441\u0442\u043e\u044f\u043d\u0438\u0435 \u043a\u043b\u043e\u043d\u043e\u0432:[/b] [url=' + group.url + ']' + group.name + '[/url]\n\u0422\u0435\u0445\u043d\u0438\u043a\u0430 \u043a\u043b\u043e\u043d\u0430 #' + group.postId + ': \u043a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e ' + group.count + '; \u0432\u0430\u0440\u0438\u0430\u043d\u0442 ' + modes[group.mode] + '; HP ' + group.hp + '/' + group.maxHp + '; \u043e\u0431\u0449\u0430\u044f \u0447\u0430\u043a\u0440\u0430 ' + group.general + '; \u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u0430\u044f \u0447\u0430\u043a\u0440\u0430 ' + group.focused + '; \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430 ' + group.baseSupport + '/\u0445\u043e\u0434' + (group.extraSupport ? '; \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430 \u0438\u043b\u043b\u044e\u0437\u0438\u0439 ' + group.extraSupport : ''); });
  }

  function parseCloneGroups(region) {
    var text = region.textContent || String(region);
    var expression = /\u0422\u0435\u0445\u043d\u0438\u043a\u0430 \u043a\u043b\u043e\u043d\u0430 #(\d+): \u043a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e (\d+); \u0432\u0430\u0440\u0438\u0430\u043d\u0442 (\u0440\u0430\u0437\u0434\u0435\u043b\u0435\u043d\u0438\u0435|\u0432\u044b\u0434\u0435\u043b\u0435\u043d\u0438\u0435|\u043e\u0431\u044b\u0447\u043d\u044b\u0439); HP ([\d.]+)\/([\d.]+); \u043e\u0431\u0449\u0430\u044f \u0447\u0430\u043a\u0440\u0430 ([\d.]+); \u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u0430\u044f \u0447\u0430\u043a\u0440\u0430 ([\d.]+); \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430 ([\d.]+)\/\u0445\u043e\u0434(?:; \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430 \u0438\u043b\u043b\u044e\u0437\u0438\u0439 (\d+))?/g;
    var result = [], match, modes = { \u0440\u0430\u0437\u0434\u0435\u043b\u0435\u043d\u0438\u0435: 'divide', \u0432\u044b\u0434\u0435\u043b\u0435\u043d\u0438\u0435: 'allocate', \u043e\u0431\u044b\u0447\u043d\u044b\u0439: 'single' };
    while ((match = expression.exec(text))) result.push({ postId: match[1], count: Number(match[2]), mode: modes[match[3]], hp: Number(match[4]), maxHp: Number(match[5]), general: Number(match[6]), focused: Number(match[7]), support: Number(match[8]), extraSupport: Number(match[9] || 0) });
    return result;
  }

  function importCloneGroups(region, autoImported) {
    var values = parseCloneGroups(region);
    return actorAll(values.map(function (value) {
      var item = state.character.techniques.find(function (candidate) { return String(candidate.postId) === String(value.postId) && cloneTechniqueMatches(candidate); });
      if (!item) throw new Error('\u0422\u0435\u0445\u043d\u0438\u043a\u0430 \u043a\u043b\u043e\u043d\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u044f #' + value.postId + ' \u043e\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u0435\u0442 \u0432 \u043b\u0438\u0447\u043d\u043e\u043c \u0434\u0435\u043b\u0435.');
      return loadTechniqueDetail(item).then(function () { return cloneImportAction(item, Object.assign({}, value, { autoImported: autoImported })); });
    }));
  }

  function loadCloneGroupsFromUrl(url) {
    var absolute = absoluteUrl(url, BASE_URL);
    var postId = (absolute.match(/#p(\d+)/) || [])[1];
    if (!postId) return setBuilderMessage('\u0423\u043a\u0430\u0436\u0438\u0442\u0435 \u0441\u0441\u044b\u043b\u043a\u0443 \u043d\u0430 \u043a\u043e\u043d\u043a\u0440\u0435\u0442\u043d\u044b\u0439 \u043f\u043e\u0441\u0442 \u0441 #p.', 'error');
    return loadDocument(absolute.split('#')[0]).then(function (doc) {
      var region = findPostContent(doc, postId);
      if (!region) throw new Error('\u041f\u043e\u0441\u0442 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d.');
      return importCloneGroups(region, false);
    }).then(function (actions) {
      if (!actions.length) throw new Error('\u0412 \u043f\u043e\u0441\u0442\u0435 \u043d\u0435\u0442 \u0441\u043e\u0445\u0440\u0430\u043d\u0451\u043d\u043d\u044b\u0445 \u0433\u0440\u0443\u043f\u043f \u043a\u043b\u043e\u043d\u043e\u0432 \u0431\u043e\u0435\u0432\u043e\u0433\u043e \u043f\u043e\u043c\u043e\u0449\u043d\u0438\u043a\u0430.');
      actions.forEach(function (action) { state.actions.push(action); });
      renderResources(); renderQueue(); renderActiveClones();
      setBuilderMessage('\u041a\u043b\u043e\u043d\u044b \u0434\u043e\u0431\u0430\u0432\u043b\u0435\u043d\u044b. \u041f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430 \u0441\u043f\u0438\u0441\u0430\u043d\u0430 \u0438\u0437 \u0438\u0445 \u043e\u0441\u0442\u0430\u0442\u043a\u043e\u0432.', 'success');
    }).catch(function (error) { setBuilderMessage(error.message, 'error'); });
  }

  function clean(value) {
    return String(value || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function normalize(value) {
    return clean(value).toLocaleLowerCase('ru').replace(/\u0451/g, '\u0435').replace(/[^a-z\u0430-\u044f0-9]+/gi, '');
  }

  function normalizeText(value) {
    return clean(value).toLocaleLowerCase('ru').replace(/\u0451/g, '\u0435').replace(/\s+/g, ' ');
  }

  var PASSIVE_ABILITIES = { fogChildren: '691', snakeEye: '712', byakugan: '2172', kaguraEye: '30065', inuzuka: '36822' };
  function hasPassiveAbility(key) {
    var id = PASSIVE_ABILITIES[key];
    return !!(state.character && (state.character.abilities || []).some(function (ability) { return String(ability.postId) === String(id); }));
  }

  function passiveAbilityNotes() {
    var notes = [];
    if (hasPassiveAbility('fogChildren')) notes.push('\u0414\u0435\u0442\u0438 \u0422\u0443\u043c\u0430\u043d\u0430: \u0448\u0442\u0440\u0430\u0444\u044b \u0442\u0443\u043c\u0430\u043d\u0430 \u0438 \u043f\u043e\u0445\u043e\u0436\u0438\u0445 \u0441\u0440\u0435\u0434 \u0441\u043d\u0438\u0436\u0435\u043d\u044b \u043d\u0430 50%.');
    if (hasPassiveAbility('snakeEye')) notes.push('\u0417\u043c\u0435\u0438\u043d\u044b\u0439 \u0413\u043b\u0430\u0437: \u0437\u0440\u0438\u0442\u0435\u043b\u044c\u043d\u044b\u0435 \u0448\u0442\u0440\u0430\u0444\u044b \u0441\u043d\u0438\u0436\u0435\u043d\u044b \u043d\u0430 50%; \u043f\u0440\u0438 \u0413\u0435\u043d\u0434\u0437\u044e\u0446\u0443 5 \u0430\u0442\u0430\u043a\u0430 \u0413\u0435\u043d\u0434\u0437\u044e\u0446\u0443 +1, \u043f\u0440\u0438 \u0413\u0435\u043d\u0434\u0437\u044e\u0446\u0443 8 \u0437\u0430\u0449\u0438\u0442\u0430 \u043e\u0442 \u0413\u0435\u043d\u0434\u0437\u044e\u0446\u0443 +2.');
    if (hasPassiveAbility('byakugan')) notes.push('\u0411\u044c\u044f\u043a\u0443\u0433\u0430\u043d: \u0442\u0443\u043c\u0430\u043d, \u0442\u0435\u043c\u043d\u043e\u0442\u0430 \u0438 \u0434\u044b\u043c \u0438\u0433\u043d\u043e\u0440\u0438\u0440\u0443\u044e\u0442\u0441\u044f; \u0438\u043c\u043c\u0443\u043d\u0438\u0442\u0435\u0442 \u043a \u0441\u043a\u0440\u044b\u0442\u044b\u043c \u0430\u0442\u0430\u043a\u0430\u043c, \u0437\u0430\u0441\u0430\u0434\u0430\u043c \u0438 \u0430\u0442\u0430\u043a\u0430\u043c \u0432 \u0441\u043f\u0438\u043d\u0443.');
    if (hasPassiveAbility('kaguraEye')) notes.push('\u0422\u0440\u0435\u0442\u0438\u0439 \u0413\u043b\u0430\u0437 \u041a\u0430\u0433\u0443\u0440\u044b: \u0432\u043d\u0435\u0437\u0430\u043f\u043d\u0430\u044f \u0430\u0442\u0430\u043a\u0430 \u0441 \u0447\u0430\u043a\u0440\u043e\u0439 \u043f\u0440\u0430\u043a\u0442\u0438\u0447\u0435\u0441\u043a\u0438 \u043d\u0435\u0432\u043e\u0437\u043c\u043e\u0436\u043d\u0430; \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u044b \u0441\u0438\u0442\u0443\u0430\u0446\u0438\u043e\u043d\u043d\u044b\u0435 \u0431\u043e\u043d\u0443\u0441\u044b \u0443\u043a\u043b\u043e\u043d\u0435\u043d\u0438\u044f \u0438 \u0442\u043e\u0447\u043d\u043e\u0441\u0442\u0438.');
    if (hasPassiveAbility('inuzuka')) notes.push('\u0421\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u044c \u043a\u043b\u0430\u043d\u0430 \u0418\u043d\u0443\u0437\u0443\u043a\u0430: \u043e\u0431\u043e\u043d\u044f\u043d\u0438\u0435 \u0432 \u0443\u0441\u043b\u043e\u0432\u0438\u044f\u0445 \u043d\u0438\u0437\u043a\u043e\u0439 \u0432\u0438\u0434\u0438\u043c\u043e\u0441\u0442\u0438; \u0441 11 \u0443\u0440\u043e\u0432\u043d\u044f +10% \u043a \u0440\u0435\u0430\u043a\u0446\u0438\u044f\u043c; \u0434\u043e\u0441\u0442\u0443\u043f\u0435\u043d \u0423\u043a\u0443\u0441 \u0438 \u043e\u0434\u0438\u043d \u043d\u0438\u043d\u043a\u0435\u043d.');
    return notes;
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function (symbol) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[symbol];
    });
  }

  function absoluteUrl(value, fallback) {
    try { return new URL(value, fallback || BASE_URL).href; } catch (error) { return ''; }
  }

  function asDocument(value) {
    if (value && value.querySelector) return value;
    return new DOMParser().parseFromString(String(value || ''), 'text/html');
  }

  function loadDocument(url, force) {
    if (typeof CONFIG.documentLoader === 'function') return actorResolve(CONFIG.documentLoader(url)).then(asDocument);
    return akatsukiNetwork().document(url, force);
  }


  function forumUrl(page) {
    return BASE_URL + '/viewforum.php?id=' + CHARACTER_FORUM_ID + (page > 1 ? '&p=' + page : '');
  }

  function topicUrl(id) {
    return BASE_URL + '/viewtopic.php?id=' + id;
  }

  function parseTopicLinks(doc) {
    var result = [];
    var seen = {};
    var selectors = [
      '#pun-main td.tcl .tclcon > a[href*="viewtopic.php?id="]',
      '#pun-viewforum td.tcl .tclcon > a[href*="viewtopic.php?id="]',
      'td.tcl .tclcon > a[href*="viewtopic.php?id="]',
      '#pun-main .main-item a[href*="viewtopic.php?id="]',
      '#pun-viewforum .main-item a[href*="viewtopic.php?id="]'
    ].join(',');
    var links = doc.querySelectorAll(selectors);
    if (!links.length) links = doc.querySelectorAll('a[href*="viewtopic.php?id="]');
    Array.prototype.forEach.call(links, function (link) {
      var href = link.getAttribute('href') || '';
      var match = href.match(/[?&]id=(\d+)/);
      if (!match) return;
      var rawName = clean(link.textContent || link.getAttribute('title') || '');
      var parentName = link.closest && link.closest('.tclcon') ? clean(link.closest('.tclcon').textContent || '') : rawName;
      var nameText = rawName || parentName;
      if (!nameText || !/\u043b\u0438\u0447\u043d\u043e\u0435\s+\u0434\u0435\u043b\u043e/i.test(nameText)) return;
      var nameMatch = nameText.match(/\u043b\u0438\u0447\u043d\u043e\u0435\s+\u0434\u0435\u043b\u043e\s*(?:[:\u2014\u2013-]\s*)?(.*)/i);
      var name = nameMatch && nameMatch[1] ? clean(nameMatch[1]) : clean(nameText.replace(/.*\u043b\u0438\u0447\u043d\u043e\u0435\s+\u0434\u0435\u043b\u043e\s*(?:[:\u2014\u2013-]\s*)?/i, ''));
      if (!name || seen[match[1]]) return;
      seen[match[1]] = true;
      result.push({ id: match[1], name: name, url: topicUrl(match[1]) });
    });
    return result;
  }

  function lastForumPage(doc) {
    var last = 1;
    Array.prototype.forEach.call(doc.querySelectorAll('a[href*="viewforum.php"]'), function (link) {
      var match = (link.getAttribute('href') || '').match(/[?&]p=(\d+)/);
      if (match) last = Math.max(last, parseInt(match[1], 10) || 1);
    });
    return Math.min(last, 50);
  }

  function loadCharacters(force) {
    if (force) {
      state.characters = [];
    }
    setStatus('\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u0441\u043f\u0438\u0441\u043a\u0430 \u043b\u0438\u0447\u043d\u044b\u0445 \u0434\u0435\u043b\u2026', 'loading');
    return loadDocument(forumUrl(1), force).then(function (first) {
      var requests = [actorResolve(first)];
      var pages = lastForumPage(first);
      for (var page = 2; page <= Math.min(pages, 50); page += 1) requests.push(loadDocument(forumUrl(page), force));
      return actorAll(requests);
    }).then(function (documents) {
      var items = {};
      documents.forEach(function (doc) {
        parseTopicLinks(doc).forEach(function (item) { items[item.id] = item; });
      });
      state.characters = Object.keys(items).map(function (key) { return items[key]; }).sort(function (a, b) {
        return a.name.localeCompare(b.name, 'ru');
      });
      fillCharacters();
      setStatus('\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043b\u0438\u0447\u043d\u043e\u0435 \u0434\u0435\u043b\u043e \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0430.', '');
      return state.characters;
    }).catch(function (error) {
      setStatus('\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u043b\u0438\u0447\u043d\u044b\u0435 \u0434\u0435\u043b\u0430: ' + error.message, 'error');
      return [];
    });
  }

  function rowsFromPost(post) {
    var rows = [];
    Array.prototype.forEach.call(post.querySelectorAll('table tr'), function (row) {
      var cells = Array.prototype.slice.call(row.cells || []);
      if (cells.length >= 2) rows.push({ label: clean(cells[0].textContent), key: normalize(cells[0].textContent), cells: cells });
    });
    return rows;
  }

  function findRow(rows, labels) {
    var keys = labels.map(normalize);
    return rows.find(function (row) {
      return keys.some(function (key) { return row.key === key || row.key.indexOf(key) === 0; });
    }) || null;
  }

  function cellText(row, dataIndex) {
    if (!row) return '';
    if (typeof dataIndex === 'number') return row.cells[dataIndex + 1] ? clean(row.cells[dataIndex + 1].textContent) : '';
    return clean(row.cells.slice(1).map(function (cell) { return cell.textContent; }).join(' '));
  }

  function arithmeticExpressionNumber(value, fallback) {
    var text = clean(value).replace(/[\u2212\u2013\u2014]/g, '-').replace(/\u00d7/g, '*').replace(/\s*x\s*/gi, ' * ');
    if (!text) return fallback || 0;
    var equals = text.match(/=\s*(-?\d+)/);
    if (equals) return parseInt(equals[1], 10);
    var sanitized = text.replace(/,/g, '.').replace(/[^0-9+\-*/().\s]/g, ' ');
    if (!/[+\-*/]/.test(sanitized)) return firstNumber(sanitized, fallback || 0);
    try {
      var total = Function('"use strict"; return (' + sanitized.replace(/\s+/g, ' ').trim() + ');')();
      if (Number.isFinite(total)) return Number(total);
    } catch (error) {
      // Fall back to the first numeric token for malformed expressions.
    }
    return firstNumber(text, fallback || 0);
  }

  function firstNumber(value, fallback) {
    var match = String(value || '').replace(/[\u2212\u2013\u2014]/g, '-').match(/-?\d+/);
    return match ? parseInt(match[0], 10) : (fallback || 0);
  }

  function calculatedNumber(value, fallback) {
    var text = clean(value).replace(/[\u2212\u2013\u2014]/g, '-');
    var result = text.match(/=\s*(-?\d+)/);
    if (result) return parseInt(result[1], 10);
    return arithmeticExpressionNumber(text, fallback);
  }

  function focusedChakraNumber(value, fallback) {
    var text = clean(value).replace(/[\u2212\u2013\u2014]/g, '-');
    var result = text.match(/=\s*(-?\d+)/);
    if (result) return parseInt(result[1], 10);
    var parenthesized = text.match(/\(\s*(-?\d+)\s*\)(?!.*\(\s*-?\d+\s*\))/);
    if (parenthesized) return parseInt(parenthesized[1], 10);
    var expression = text.match(/^\s*(-?\d+)\s*([+-])\s*(\d+)/);
    if (expression) return parseInt(expression[1], 10) + (expression[2] === '-' ? -1 : 1) * parseInt(expression[3], 10);
    var arithmetic = arithmeticExpressionNumber(text, fallback);
    if (arithmetic !== undefined && arithmetic !== null && text.indexOf('/') === -1) return arithmetic;
    return firstNumber(text, fallback);
  }

  function focusedChakraMaximumNumber(value, fallback) {
    var text = clean(value).replace(/[\u2212\u2013\u2014]/g, '-');
    var equals = text.match(/=\s*(-?\d+)/);
    if (equals) return Math.max(0, parseInt(equals[1], 10));
    var pair = text.match(/(-?\d+)\s*\/\s*(-?\d+)/);
    if (pair) return Math.max(0, parseInt(pair[2], 10));
    var arithmetic = arithmeticExpressionNumber(text, fallback);
    if (text.indexOf('/') === -1 && arithmetic !== undefined && arithmetic !== null) return Math.max(0, arithmetic);
    return Math.max(0, focusedChakraNumber(text, fallback));
  }

  function rankFromLabel(value) {
    var match = String(value || '').toUpperCase().match(/\u0420\u0410\u041d\u0413\s*[:.]?\s*([E\u0415D\u0414\u0421C\u0412B\u0410AS])/i);
    if (!match) return '';
    return { '\u0415': 'E', E: 'E', '\u0414': 'D', D: 'D', '\u0421': 'C', C: 'C', '\u0412': 'B', B: 'B', '\u0410': 'A', A: 'A', S: 'S' }[match[1].toUpperCase()] || '';
  }

  function linkedTechniques(cell, rank) {
    var result = [];
    var seen = {};
    Array.prototype.forEach.call(cell.querySelectorAll('a[href*="#p"]'), function (link) {
      var href = absoluteUrl(link.getAttribute('href'), BASE_URL);
      var post = href.match(/#p(\d+)/i);
      var name = clean(link.textContent);
      if (!post || !name || seen[post[1]]) return;
      seen[post[1]] = true;
      result.push({ rank: rank, postId: post[1], name: name, url: href, detail: null });
    });
    return result;
  }

  function parseCharacter(doc, item) {
    if (item.npc) doc = npcDocument(doc, item);
    var posts = doc.querySelectorAll('.post-content');
    if (posts.length < 2) throw new Error('\u0412\u043e \u0432\u0442\u043e\u0440\u043e\u043c \u0441\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0438 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u043e \u043b\u0438\u0447\u043d\u043e\u0435 \u0434\u0435\u043b\u043e');
    var post = akcmNormalizePost(posts[1]);
    var rows = rowsFromPost(post);
    var stats = {};
    function read(key, labels, index) {
      var text = cellText(findRow(rows, labels), index);
      stats[key] = { value: calculatedNumber(text, 0), text: text || '0' };
    }
    read('level', ['\u0423\u0440\u043e\u0432\u0435\u043d\u044c']);
    read('chakra', ['\u0427\u0430\u043a\u0440\u0430']);
    read('strength', ['\u0421\u0438\u043b\u0430']);
    read('speed', ['\u0421\u043a\u043e\u0440\u043e\u0441\u0442\u044c']);
    read('strategy', ['\u0422\u0430\u043a\u0442\u0438\u043a\u0430']);
    read('ninjutsu', ['\u041d\u0438\u043d\u0434\u0437\u044e\u0446\u0443']);
    read('taijutsu', ['\u0422\u0430\u0439\u0434\u0437\u044e\u0446\u0443']);
    read('genjutsu', ['\u0413\u0435\u043d\u0434\u0437\u044e\u0446\u0443']);
    read('fuinjutsu', ['\u0424\u0443\u0438\u043d\u0434\u0437\u044e\u0446\u0443']);
    read('health', ['\u0417\u0434\u043e\u0440\u043e\u0432\u044c\u0435']);
    read('knowledge', ['\u0417\u043d\u0430\u043d\u0438\u044f']);
    read('life', ['\u0411\u043e\u0435\u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u044c(\u0436\u0438\u0437\u043d\u044c)(HP)', '\u0411\u043e\u0435\u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u044c']);
    read('chakraTotal', ['\u0417\u0430\u043f\u0430\u0441 \u0427\u0430\u043a\u0440\u044b'], 0);
    read('chakraFocused', ['\u0417\u0430\u043f\u0430\u0441 \u0427\u0430\u043a\u0440\u044b'], 1);
    stats.chakraFocused.value = focusedChakraNumber(stats.chakraFocused.text, 0);
    stats.chakraFocused.max = focusedChakraMaximumNumber(stats.chakraFocused.text, stats.chakraFocused.value);
    read('unarmedDamage', ['\u0423\u0440\u043e\u043d \u043e\u0442 \u043e\u0431\u044b\u0447\u043d\u043e\u0439 \u0430\u0442\u0430\u043a\u0438 \u0431\u0435\u0437 \u043e\u0440\u0443\u0436\u0438\u044f', '\u0423\u0440\u043e\u043d \u0431\u0435\u0437 \u043e\u0440\u0443\u0436\u0438\u044f']);
    read('weaponDamage', ['\u0423\u0440\u043e\u043d \u043e\u0442 \u0430\u0442\u0430\u043a\u0438 \u0441 \u043e\u0440\u0443\u0436\u0438\u0435\u043c \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0430', '\u0423\u0440\u043e\u043d \u0441 \u043e\u0440\u0443\u0436\u0438\u0435\u043c']);
    read('defense', ['\u0417\u0430\u0449\u0438\u0442\u0430(\u0435\u0441\u043b\u0438 \u0435\u0441\u0442\u044c)', '\u0417\u0430\u0449\u0438\u0442\u0430']);
    read('ordinaryActions', ['\u041a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439 \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0430'], 0);
    read('techniqueActions', ['\u041a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439 \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0430'], 1);
    read('rangedAttack', ['\u0410\u0442\u0430\u043a\u0430 \u043d\u0430 \u0434\u0438\u0441\u0442\u0430\u043d\u0446\u0438\u0438']);
    read('meleeAttack', ['\u0410\u0442\u0430\u043a\u0430 \u0431\u043b\u0438\u0436\u043d\u0438\u0439 \u0431\u043e\u0439', '\u0410\u0442\u0430\u043a\u0430 \u0432 \u0431\u043b\u0438\u0436\u043d\u0435\u043c \u0431\u043e\u044e']);
    read('ninjutsuAttack', ['\u0410\u0442\u0430\u043a\u0430 \u0442\u0435\u0445\u043d\u0438\u043a\u043e\u0439 \u041d\u0438\u043d\u0434\u0437\u044e\u0446\u0443', '\u0410\u0442\u0430\u043a\u0430 \u041d\u0438\u043d\u0434\u0437\u044e\u0446\u0443']);
    read('genjutsuAttack', ['\u0410\u0442\u0430\u043a\u0430 \u0442\u0435\u0445\u043d\u0438\u043a\u043e\u0439 \u0413\u0435\u043d\u0434\u0437\u044e\u0446\u0443', '\u0410\u0442\u0430\u043a\u0430 \u0413\u0435\u043d\u0434\u0437\u044e\u0446\u0443']);
    read('dodge', ['\u0423\u043a\u043b\u043e\u043d\u0435\u043d\u0438\u0435']);
    read('genjutsuDefense', ['\u0417\u0430\u0449\u0438\u0442\u0430 \u043e\u0442 \u0433\u0435\u043d\u0434\u0437\u044e\u0446\u0443']);
    read('resistance', ['\u0417\u0430\u0449\u0438\u0442\u0430 \u043e\u0442 \u044f\u0434\u043e\u0432, \u0431\u043e\u043b\u0435\u0437\u043d\u0435\u0439, \u0438.\u0442.\u0434', '\u0417\u0430\u0449\u0438\u0442\u0430 \u043e\u0442 \u044f\u0434\u043e\u0432 \u0438 \u0431\u043e\u043b\u0435\u0437\u043d\u0435\u0439']);
    read('baseCritical', ['\u0411\u0430\u0437\u043e\u0432\u044b\u0439 \u043a\u0440\u0438\u0442', '\u0411\u0430\u0437\u043e\u0432\u044b\u0439 \u043a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u0448\u0430\u043d\u0441']);
    if (!findRow(rows, ['\u0411\u0430\u0437\u043e\u0432\u044b\u0439 \u043a\u0440\u0438\u0442', '\u0411\u0430\u0437\u043e\u0432\u044b\u0439 \u043a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u0448\u0430\u043d\u0441'])) {
      stats.baseCritical = { value: 0, text: '0' };
    }
    var techniques = [];
    var abilities = [];
    var thirdPost = posts[2] || null;
    var thirdRows = rowsFromPost(thirdPost || post);
    function specializationValues(label) {
      var row = findRow(thirdRows, [label]);
      var value = cellText(row);
      return value ? value.split(/[,;\u2022]/).map(clean).filter(function (entry) { return entry && !/\u043d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d/i.test(entry); }).slice(0, 3) : [];
    }
    var elements = specializationValues('\u0421\u0442\u0438\u0445\u0438\u0438 \u0447\u0430\u043a\u0440\u044b');
    var specializations = specializationValues('\u0421\u043f\u0435\u0446\u0438\u0430\u043b\u0438\u0437\u0430\u0446\u0438\u0438');
    var specializationTechniques = [];
    var specializationRow = findRow(thirdRows, ['\u0421\u043f\u0435\u0446\u0438\u0430\u043b\u0438\u0437\u0430\u0446\u0438\u044f \u043d\u0430 \u0442\u0435\u0445\u043d\u0438\u043a\u0435']);
    if (specializationRow) {
      var specializationCell = specializationRow.cells[specializationRow.cells.length - 1];
      Array.prototype.forEach.call(specializationCell ? specializationCell.querySelectorAll('a[href*="#p"]') : [], function (specializationLink) {
        specializationTechniques.push({ name: clean(specializationLink.textContent), url: absoluteUrl(specializationLink.getAttribute('href'), BASE_URL), postId: (specializationLink.getAttribute('href') || '').match(/#p(\d+)/i)?.[1] || '' });
      });
    }
    // New compact card: decorative markers preserve the kind without visible service labels.
    Array.prototype.forEach.call(thirdPost ? thirdPost.querySelectorAll('table tr') : [], function (row) {
      Array.prototype.forEach.call(row.cells || [], function (cell) {
        var text = clean(cell.textContent), link = cell.querySelector('a[href*="#p"]');
        if (/^\u25c6/.test(text)) elements.push(clean(text.replace(/^\u25c6\s*/, '')));
        if (/^\u25c8/.test(text)) specializations.push(clean(text.replace(/^\u25c8\s*/, '')));
        if (/^\u2726/.test(text) && link) specializationTechniques.push({ name: clean(link.textContent), url: absoluteUrl(link.getAttribute('href'), BASE_URL), postId: (link.getAttribute('href') || '').match(/#p(\d+)/i)?.[1] || '' });
      });
    });
    Array.prototype.forEach.call(thirdPost ? thirdPost.querySelectorAll('a[href*="#p"]') : [], function (link) {
      var parentText = clean((link.parentElement || {}).textContent || '');
      if (!/^\u2726/.test(parentText)) return;
      specializationTechniques.push({ name: clean(link.textContent), url: absoluteUrl(link.getAttribute('href'), BASE_URL), postId: (link.getAttribute('href') || '').match(/#p(\d+)/i)?.[1] || '' });
    });
    elements = elements.filter(function (value, index, list) { return list.indexOf(value) === index; }).slice(0, 3);
    specializations = specializations.filter(function (value, index, list) { return list.indexOf(value) === index; }).slice(0, 3);
    specializationTechniques = specializationTechniques.filter(function (value, index, list) { return list.findIndex(function (item) { return item.postId === value.postId; }) === index; }).slice(0, 3);
    rows.forEach(function (row) {
      var rank = rankFromLabel(row.label);
      if (rank) techniques = techniques.concat(linkedTechniques(row.cells[row.cells.length - 1], rank));
      if (row.key.indexOf(normalize('\u0421\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u0438')) === 0) {
        var abilityCell = row.cells[row.cells.length - 1];
        var abilityComment = clean(abilityCell && abilityCell.textContent);
        abilities = abilities.concat(linkedTechniques(abilityCell, '').map(function (ability) {
          ability.comment = abilityComment;
          return ability;
        }));
      }
    });
    var equipmentLinks = [];
    Array.prototype.forEach.call((posts[2] || post).querySelectorAll('a[href*="viewtopic.php?id=' + EQUIPMENT_TOPIC_ID + '"][href*="#p"]'), function (link) {
      equipmentLinks.push({ name: clean(link.textContent), url: absoluteUrl(link.getAttribute('href'), BASE_URL) });
    });
    return {
      id: item.id,
      npc: !!item.npc, npcType: item.type || '', npcWeapons: doc.npcWeapons || [],
      name: item.name,
      url: item.url,
      post: post,
      postText: clean(post.textContent),
      stats: stats,
      techniques: techniques,
      abilities: abilities,
      elements: elements,
      specializations: specializations,
      specializationTechniques: specializationTechniques.slice(0, 3),
      equipmentLinks: equipmentLinks,
      inventoryPost: posts[2] || null,
      inventory: [],
      ordinaryTotal: Math.max(0, stats.ordinaryActions.value),
      techniqueTotal: Math.max(0, stats.techniqueActions.value)
    };
  }

  function loadCharacter(item) {
    setStatus('\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u043b\u0438\u0447\u043d\u043e\u0433\u043e \u0434\u0435\u043b\u0430 \u00ab' + item.name + '\u00bb\u2026', 'loading');
    return actorAll([loadDocument(item.url), loadEquipment(), loadMedicines()]).then(function (results) {
      state.character = parseCharacter(results[0], item);
      reconcileCharacterEquipment();
      return actorAll(state.character.artifacts.map(loadArtifactDetail));
    }).then(function () {
      state.actions = [];
      state.combat = createCombatState();
      renderCharacter();
      renderTurnSetup();
      renderActionMenu();
      setStatus('\u041b\u0438\u0447\u043d\u043e\u0435 \u0434\u0435\u043b\u043e \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043d\u043e. \u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435.', '');
    }).catch(function (error) {
      state.character = null;
      state.combat = null;
      renderCharacter();
      renderTurnSetup();
      setStatus('\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u043b\u0438\u0447\u043d\u043e\u0435 \u0434\u0435\u043b\u043e: ' + error.message, 'error');
    });
  }

  function equipmentBlock(master, headingText) {
    var wanted = normalize(headingText);
    var quote = Array.prototype.find.call(master.querySelectorAll('.quote-box'), function (block) {
      var heading = block.querySelector(':scope > div:first-child, :scope > blockquote > p:first-child strong, :scope > blockquote > p:first-child');
      return heading && normalize(heading.textContent).indexOf(wanted) !== -1;
    });
    if (quote) return quote;
    var heading = Array.prototype.find.call(master.querySelectorAll('h1,h2,h3,h4,h5,h6,strong,b'), function (node) {
      return normalize(node.textContent).indexOf(wanted) !== -1;
    });
    return heading && (heading.closest('blockquote,.quote-box') || heading.parentElement) || null;
  }

  function headerMap(table) {
    var map = {};
    if (!table || !table.rows || !table.rows[0]) return map;
    Array.prototype.forEach.call(table.rows[0].cells, function (cell, index) { map[normalize(cell.textContent)] = index; });
    return map;
  }

  function columnIndex(map, names) {
    var keys = Object.keys(map);
    for (var i = 0; i < names.length; i += 1) {
      var wanted = normalize(names[i]);
      var found = keys.find(function (key) { return key.indexOf(wanted) !== -1; });
      if (found !== undefined) return map[found];
    }
    return -1;
  }

  function parseEquipment(doc) {
    var master = doc.getElementById('p269-content') || doc.querySelector('.post-content');
    if (!master) throw new Error('\u041c\u0430\u0441\u0442\u0435\u0440-\u043f\u043e\u0441\u0442 \u0441\u043d\u0430\u0440\u044f\u0436\u0435\u043d\u0438\u044f \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d');
    var result = { armors: [], standard: [], artifacts: [] };
    var armorBlock = equipmentBlock(master, '\u0421\u0442\u0430\u043d\u0434\u0430\u0440\u0442\u043d\u0430\u044f \u0437\u0430\u0449\u0438\u0442\u0430') || master;
    var armorTable = armorBlock.querySelector('table');
    if (armorTable) {
      var armorColumns = headerMap(armorTable);
      var armorName = columnIndex(armorColumns, ['\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435']);
      var armorValue = columnIndex(armorColumns, ['\u0417\u0430\u0449\u0438\u0442\u0430 \u043e\u0442 \u0444\u0438\u0437. \u0443\u0440\u043e\u043d\u0430', '\u0417\u0430\u0449\u0438\u0442\u0430']);
      Array.prototype.forEach.call(armorTable.rows, function (row, index) {
        if (!index || armorName < 0 || armorValue < 0 || !row.cells[armorName]) return;
        var name = clean(row.cells[armorName].textContent);
        var value = clean(row.cells[armorValue].textContent);
        if (name && value && /\d/.test(value)) result.armors.push({ name: name, value: value });
      });
    }
    var standardBlock = equipmentBlock(master, '\u0421\u0442\u0430\u043d\u0434\u0430\u0440\u0442\u043d\u043e\u0435 \u0432\u043e\u043e\u0440\u0443\u0436\u0435\u043d\u0438\u0435') || master;
    var standardTable = standardBlock.querySelector('table');
    if (standardTable) {
      var columns = headerMap(standardTable);
      var nameIndex = columnIndex(columns, ['\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435']);
      var damageIndex = columnIndex(columns, ['\u0423\u0440\u043e\u043d']);
      var typeIndex = columnIndex(columns, ['\u0422\u0438\u043f']);
      Array.prototype.forEach.call(standardTable.rows, function (row, index) {
        if (!index || nameIndex < 0 || damageIndex < 0 || !row.cells[nameIndex]) return;
        var name = clean(row.cells[nameIndex].textContent);
        var damage = clean(row.cells[damageIndex].textContent);
        var type = typeIndex >= 0 && row.cells[typeIndex] ? clean(row.cells[typeIndex].textContent) : '';
        if (name && damage && damage !== '-') result.standard.push({ id: 'standard-' + index, name: name, damage: damage, type: type });
      });
    }
    result.items = [];
    ['\u0421\u0442\u0430\u043d\u0434\u0430\u0440\u0442\u043d\u043e\u0435 \u0432\u043e\u043e\u0440\u0443\u0436\u0435\u043d\u0438\u0435', '\u0414\u043e\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044c\u043d\u043e\u0435 \u043e\u0440\u0443\u0436\u0438\u0435', '\u0421\u0442\u0430\u043d\u0434\u0430\u0440\u0442\u043d\u0430\u044f \u0437\u0430\u0449\u0438\u0442\u0430', '\u0421\u0442\u0430\u043d\u0434\u0430\u0440\u0442\u043d\u043e\u0435 \u0441\u043d\u0430\u0440\u044f\u0436\u0435\u043d\u0438\u0435', '\u041e\u0441\u043e\u0431\u0435\u043d\u043d\u044b\u0435 \u043f\u0440\u0435\u0434\u043c\u0435\u0442\u044b'].forEach(function (section) {
      var block = equipmentBlock(master, section), table = block && block.querySelector('table');
      if (!table) return;
      var columns = headerMap(table), nameIndex = columnIndex(columns, ['\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435', '\u0422\u0438\u043f']);
      function cell(row, names) { var index = columnIndex(columns, names); return index >= 0 && row.cells[index] ? clean(row.cells[index].textContent) : ''; }
      Array.prototype.forEach.call(table.rows, function (row, index) {
        if (!index || nameIndex < 0 || !row.cells[nameIndex]) return;
        var name = clean(row.cells[nameIndex].textContent);
        if (!name) return;
        result.items.push({ id: 'equipment-' + result.items.length, name: name, section: section,
          damage: cell(row, ['\u0423\u0440\u043e\u043d \u043e\u0442 \u0443\u0434\u0430\u0440\u0430 \u0449\u0438\u0442\u043e\u043c', '\u0423\u0440\u043e\u043d']), defense: cell(row, ['\u0417\u0430\u0449\u0438\u0442\u0430 \u043e\u0442 \u0444\u0438\u0437. \u0443\u0440\u043e\u043d\u0430']),
          critical: cell(row, ['\u041a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u0443\u0440\u043e\u043d']), type: cell(row, ['\u0422\u0438\u043f']),
          description: cell(row, ['\u042d\u0444\u0444\u0435\u043a\u0442 / \u0431\u043e\u043d\u0443\u0441\u044b', '\u041e\u043f\u0438\u0441\u0430\u043d\u0438\u0435']) + ' ' + cell(row, ['\u041f\u0440\u0438\u043c\u0435\u0447\u0430\u043d\u0438\u0435']), bonuses: cell(row, ['\u0411\u043e\u043d\u0443\u0441\u044b']), url: topicUrl(EQUIPMENT_TOPIC_ID) });
      });
    });
    var seen = {};
    Array.prototype.forEach.call(master.querySelectorAll('a[href*="#p"]'), function (link) {
      var href = absoluteUrl(link.getAttribute('href'), topicUrl(EQUIPMENT_TOPIC_ID));
      var post = href.match(/#p(\d+)/i);
      var name = clean(link.textContent);
      if (!post || !name || seen[post[1]]) return;
      var rowText = clean((link.closest('tr') || link.parentElement || link).textContent);
      if (!/\u0430\u0440\u0442\u0435\u0444\u0430\u043a\u0442|\u0440\u0430\u043d\u0433\s*[edcbas\u0435\u0434\u0441\u0432\u0430]/i.test(rowText)) return;
      seen[post[1]] = true;
      result.artifacts.push({ id: post[1], name: name, url: href, damage: '', type: '\u0410\u0440\u0442\u0435\u0444\u0430\u043a\u0442', weapon: !!link.closest('.quote-box') && /\u0410\u0440\u0442\u0435\u0444\u0430\u043a\u0442\u043d\u043e\u0435 \u043e\u0440\u0443\u0436\u0438\u0435/.test(link.closest('.quote-box').textContent) });
    });
    return result;
  }

  function loadEquipment() {
    if (state.equipment.standard.length || state.equipment.artifacts.length) return actorResolve(state.equipment);
    return loadDocument(topicUrl(EQUIPMENT_TOPIC_ID)).then(function (doc) {
      state.equipment = parseEquipment(doc);
      return state.equipment;
    });
  }

  function postLines(post) {
    var clone = post.cloneNode(true);
    Array.prototype.forEach.call(clone.querySelectorAll('br,p,div,tr,li,table'), function (node) {
      node.appendChild(document.createTextNode('\n'));
    });
    return clone.textContent.split(/\n+/).map(clean).filter(Boolean);
  }

  function lineMentionsName(line, itemName, atStart) {
    var source = clean(line).toLocaleLowerCase('ru').replace(/\u0451/g, '\u0435');
    var target = clean(itemName).toLocaleLowerCase('ru').replace(/\u0451/g, '\u0435');
    if (!source || !target) return false;
    var index = source.indexOf(target);
    while (index !== -1) {
      var before = index === 0 || !/[a-z\u0430-\u044f0-9]/i.test(source.charAt(index - 1));
      var afterIndex = index + target.length;
      var after = afterIndex === source.length || !/[a-z\u0430-\u044f0-9]/i.test(source.charAt(afterIndex));
      if (before && after && (!atStart || index === 0)) return true;
      index = source.indexOf(target, index + 1);
    }
    return false;
  }

  function reconcileCharacterEquipment() {
    if (!state.character) return;
    state.character.inventory = parseInventory(state.character.inventoryPost);
    var inventory = state.character.inventory;
    if (state.character.npc) {
      inventory.forEach(function (item) {
        if (item.category === '\u0418\u043d\u0432\u0435\u043d\u0442\u0430\u0440\u044c') item.category = /\u0437\u0430\u0449\u0438\u0442/i.test(item.section || '') ? '\u0411\u0440\u043e\u043d\u044f \u0438 \u0437\u0430\u0449\u0438\u0442\u0430' : /\u0432\u043e\u043e\u0440\u0443\u0436\u0435\u043d\u0438\u0435|\u043e\u0440\u0443\u0436\u0438\u0435/i.test(item.section || '') ? '\u041e\u0440\u0443\u0436\u0438\u0435' : '\u0420\u0430\u0441\u0445\u043e\u0434\u043d\u0438\u043a\u0438';
      });
      state.character.npcWeapons.forEach(function (weapon) {
        if (inventory.some(function (item) { return inventoryName(item.name) === inventoryName(weapon.name); })) return;
        var master = (state.equipment.standard || []).find(function (item) { return inventoryName(item.name) === inventoryName(weapon.name); });
        var total = arithmeticExpressionNumber(weapon.expression, NaN);
        inventory.push(Object.assign({}, master || {}, { inventoryId: 'npc-weapon-' + inventory.length, name: weapon.name, category: '\u041e\u0440\u0443\u0436\u0438\u0435', quantity: 1, unit: '\u0448\u0442.', damage: String(total - 2 * state.character.stats.strength.value), description: '\u0410\u043a\u0442\u0438\u0432\u043d\u043e\u0435 \u043e\u0440\u0443\u0436\u0438\u0435 \u0438\u0437 \u043f\u043e\u0441\u0442\u0430 \u041d\u041f\u0421', artifact: false }));
      });
    }
    state.character.standardWeapons = inventory.filter(function (item) { return inventoryAllows(item, 'weapon') && !item.artifact; });
    state.character.artifacts = inventory.filter(function (item) { return item.artifact; });
  }

  function inventoryName(name) {
    var text = normalize(clean(name).replace(/\([^)]*\)/g, ''));
    var aliases = { \u043a\u0443\u043d\u0430\u0438: '\u043a\u0443\u043d\u0430\u0439', \u0441\u044e\u0440\u0438\u043a\u0435\u043d\u044b: '\u0441\u044e\u0440\u0438\u043a\u0435\u043d', \u0441\u0435\u043d\u0431\u043e\u043d\u044b: '\u0441\u0435\u043d\u0431\u043e\u043d', \u0434\u044b\u043c\u043e\u0432\u044b\u0435\u0431\u043e\u043c\u0431\u044b: '\u0434\u044b\u043c\u043e\u0432\u0430\u044f\u0431\u043e\u043c\u0431\u0430', \u0434\u044b\u043c\u043e\u0432\u044b\u0435\u0448\u0430\u0448\u043a\u0438: '\u0434\u044b\u043c\u043e\u0432\u0430\u044f\u0431\u043e\u043c\u0431\u0430', \u0434\u044b\u043c\u043e\u0432\u0430\u044f\u0448\u0430\u0448\u043a\u0430: '\u0434\u044b\u043c\u043e\u0432\u0430\u044f\u0431\u043e\u043c\u0431\u0430', \u0432\u0437\u0440\u044b\u0432\u043d\u044b\u0435\u043f\u0435\u0447\u0430\u0442\u0438: '\u0432\u0437\u0440\u044b\u0432\u043d\u0430\u044f\u043f\u0435\u0447\u0430\u0442\u044c', \u0432\u0437\u0440\u044b\u0432\u043d\u0430\u044f\u043f\u0435\u0447\u0430\u0442\u044c: '\u0432\u0437\u0440\u044b\u0432\u043d\u0430\u044f\u043f\u0435\u0447\u0430\u0442\u044c', \u0441\u0432\u0435\u0442\u043e\u0432\u044b\u0435\u0431\u043e\u043c\u0431\u044b: '\u0441\u0432\u0435\u0442\u043e\u0432\u0430\u044f\u0431\u043e\u043c\u0431\u0430', \u043f\u0440\u043e\u0434\u043e\u0432\u043e\u043b\u044c\u0441\u0442\u0432\u0435\u043d\u043d\u044b\u0435\u043f\u0438\u043b\u044e\u043b\u0438: '\u043f\u0440\u043e\u0434\u043e\u0432\u043e\u043b\u044c\u0441\u0442\u0432\u0435\u043d\u043d\u0430\u044f\u043f\u0438\u043b\u044e\u043b\u044f', \u0436\u0438\u043b\u0435\u0442\u0447\u0443\u0443\u043d\u0438\u043d\u0430: '\u0441\u0440\u0435\u0434\u043d\u044f\u044f\u0431\u0440\u043e\u043d\u044f' };
    return aliases[text] || text;
  }

  function parseInventory(post) {
    post = akcmThirdSection(post, "\u0418\u043d\u0432\u0435\u043d\u0442\u0430\u0440\u044c");
    if (!post) return [];
    var items = [], catalog = state.equipment.items || [];
    function add(name, details, category, link) {
      var master = catalog.find(function (item) { return inventoryName(item.name) === inventoryName(name); });
      var artifact = state.equipment.artifacts.find(function (item) { return link && link.indexOf('#p' + item.id) !== -1 || inventoryName(item.name) === inventoryName(name); });
      var count = clean(details).match(/(\d+(?:[.,]\d+)?)\s*(\u0448\u0442\.?|\u043c(?:\u0435\u0442\u0440[\u0430-\u044f]*)?|\u0444\u043b\u0430\u043a\u043e\u043d|\u043f\u0430\u043b\u0435\u0442\u043a[\u0430-\u044f]*|\u043f\u0440\u0438\u043c\u0435\u043d\u0435\u043d\u0438[\u0430-\u044f]*)/i);
      items.push(Object.assign({}, master || {}, artifact || {}, { inventoryId: 'inventory-' + items.length, name: name, category: category, url: link || (master && master.url) || '',
        quantity: count ? Number(count[1].replace(',', '.')) : 1, unit: count ? count[2] : '\u0448\u0442.', details: details,
        artifact: !!artifact || normalize(category) === '\u0430\u0440\u0442\u0435\u0444\u0430\u043a\u0442\u044b', damage: (clean(details).match(/(?:^|[;.,]\s*)\u0443\u0440\u043e\u043d\s*:\s*([^;]+)/i) || [])[1] || (artifact && artifact.damage) || (master && master.damage) || '', description: (master && master.description || '') + ' ' + details }));
    }
    Array.prototype.forEach.call(post.querySelectorAll('.quote-box'), function (block) {
      var heading = block.querySelector(':scope > div:first-child');
      var category = clean(heading && heading.textContent).split('\u00b7')[0].trim().replace(/^(?:\u0441\u0442\u0430\u043d\u0434\u0430\u0440\u0442\u043d\u044b\u0439\s+)?\u043d\u0430\u0431\u043e\u0440\s+\u0448\u0438\u043d\u043e\u0431\u0438$/i, '\u0421\u0442\u0430\u043d\u0434\u0430\u0440\u0442\u043d\u044b\u0439 \u043d\u0430\u0431\u043e\u0440 \u0448\u0438\u043d\u043e\u0431\u0438');
      if (!category || /\u0438\u0441\u0442\u043e\u0440\u0438\u044f|\u043a\u043e\u0448\u0435\u043b|\u043e\u043f\u044b\u0442|\u043c\u0438\u0441\u0441\u0438|\u043a\u0432\u0435\u0441\u0442/i.test(category)) return;
      Array.prototype.forEach.call(block.querySelectorAll('table'), function (table) {
        if (!table.rows[0] || !/\u043f\u0440\u0435\u0434\u043c\u0435\u0442/i.test(table.rows[0].textContent)) return;
        Array.prototype.forEach.call(table.rows, function (row, index) {
          if (!index || row.cells.length < 2) return;
          var link = row.cells[0].querySelector('a[href*="#p"]');
          add(clean(row.cells[0].textContent), clean(row.cells[1].textContent), category, link && link.href);
        });
      });
      if (/\u0430\u0440\u0442\u0435\u0444\u0430\u043a\u0442/i.test(category)) Array.prototype.forEach.call(block.querySelectorAll('a[href*="#p"]'), function (link) {
        if (!link.closest('table')) add(clean(link.textContent), '', category, link.href);
      });
    });
    return items;
  }

  function inventoryWeaponCategory(item) {
    var category = normalizeText(item.category).split('\u00b7')[0].trim();
    if (/\u043b\u0438\u0447\u043d\u044b\u0435 \u0432\u0435\u0449\u0438/.test(category)) return false;
    if (/^(?:\u0441\u0442\u0430\u043d\u0434\u0430\u0440\u0442\u043d\u044b\u0439\s+)?\u043d\u0430\u0431\u043e\u0440\s+\u0448\u0438\u043d\u043e\u0431\u0438$/.test(category)) return false;
    if (/\u043c\u0435\u0442\u0430\u0442\u0435\u043b\u044c\u043d\u043e\u0435|^\u043e\u0440\u0443\u0436\u0438\u0435$|\u0430\u0440\u0442\u0435\u0444\u0430\u043a\u0442\u044b|\u0443\u0434\u0430\u0440\u043d\u043e[-\s]*\u0440\u0430\u0437\u0434\u0440\u043e\u0431\u043b\u044f\u044e\u0449\u0435\u0435|\u043a\u043e\u043b\u044e\u0449\u0435[-\s]*\u0440\u0435\u0436\u0443\u0449\u0435\u0435/.test(category)) return true;
    if (item.section === '\u0421\u0442\u0430\u043d\u0434\u0430\u0440\u0442\u043d\u043e\u0435 \u0432\u043e\u043e\u0440\u0443\u0436\u0435\u043d\u0438\u0435' || item.section === '\u0414\u043e\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044c\u043d\u043e\u0435 \u043e\u0440\u0443\u0436\u0438\u0435') return true;
    var types = (state.equipment.standard || []).map(function (weapon) { return normalizeText(weapon.type); }).filter(Boolean);
    return types.some(function (type) { return type === category; });
  }

  function inventoryAllows(item, purpose) {
    var category = normalizeText(item.category);
    var kit = /^(?:\u0441\u0442\u0430\u043d\u0434\u0430\u0440\u0442\u043d\u044b\u0439)?\u043d\u0430\u0431\u043e\u0440\u0448\u0438\u043d\u043e\u0431\u0438$/.test(category.replace(/\s/g, ''));
    if (purpose === 'weapon') return inventoryWeaponCategory(item);
    if (purpose === 'attack-item') return /\u0440\u0430\u0441\u0445\u043e\u0434\u043d\u0438\u043a\u0438/.test(category) || item.section === '\u0414\u043e\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044c\u043d\u043e\u0435 \u043e\u0440\u0443\u0436\u0438\u0435' || weaponIsShooting(item);
    if (purpose === 'medicine') return /\u043f\u0438\u043b\u044e\u043b|\u044f\u0434|\u043f\u0440\u043e\u0442\u0438\u0432\u043e\u044f/.test(normalizeText(item.name)) || /\u043c\u0435\u0434\u0438\u0446\u0438\u043d\u0441\u043a\u0438\u0439 \u043d\u0430\u0431\u043e\u0440|\u043c\u0435\u0434 \u043d\u0430\u0431\u043e\u0440/.test(category);
    if (purpose === 'prepared-item') return /\u0440\u0430\u0441\u0445\u043e\u0434\u043d\u0438\u043a\u0438/.test(category) || kit || item.section === '\u0414\u043e\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044c\u043d\u043e\u0435 \u043e\u0440\u0443\u0436\u0438\u0435' || item.section === '\u0421\u0442\u0430\u043d\u0434\u0430\u0440\u0442\u043d\u043e\u0435 \u0441\u043d\u0430\u0440\u044f\u0436\u0435\u043d\u0438\u0435';
    if (purpose === 'defense-object') return /\u0431\u0440\u043e\u043d\u044f \u0438 \u0437\u0430\u0449\u0438\u0442\u0430/.test(category) || kit || weaponIsShooting(item);
    if (purpose === 'trap') return !item.artifact;
    return !item.artifact && !/\u0431\u0440\u043e\u043d\u044f \u0438 \u0437\u0430\u0449\u0438\u0442\u0430/.test(category) && !inventoryWeaponCategory(item);
  }

  function inventoryUsage(actions) {
    var used = {};
    (actions || state.actions).forEach(function (action) {
      var source = action.actorAction || action, multiplier = action.actorAction ? action.cloneCount : 1;
      (source.inventoryUse || []).forEach(function (entry) { if (entry.consume) used[entry.id] = (used[entry.id] || 0) + entry.count * multiplier; });
    });
    return used;
  }

  function inventoryRemaining(item) { return Math.max(0, item.quantity - (inventoryUsage()[item.inventoryId] || 0)); }

  function inventoryUse(item, count, thrown, trap) {
    return { id: item.inventoryId, count: count, consume: !item.artifact && (thrown || trap || /\u0440\u0430\u0441\u0445\u043e\u0434\u043d\u0438\u043a\u0438|\u043c\u0435\u0434\u0438\u0446\u0438\u043d\u0441\u043a\u0438\u0439 \u043d\u0430\u0431\u043e\u0440/i.test(item.category)) };
  }

  function inventoryFields(purpose, multiple) {
    var items = (state.character.inventory || []).filter(function (item) { return inventoryAllows(item, purpose); });
    return '<div class="aba-inventory-picker" data-inventory-purpose="' + purpose + '"><label>\u041f\u0440\u0435\u0434\u043c\u0435\u0442 \u0438\u0437 \u0438\u043d\u0432\u0435\u043d\u0442\u0430\u0440\u044f<select data-inventory-select><option value="">\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043f\u0440\u0435\u0434\u043c\u0435\u0442</option>' + items.map(function (item) { return '<option value="' + item.inventoryId + '">' + escapeHtml(item.category + ' \u2014 ' + item.name + ' (' + inventoryRemaining(item) + ' ' + item.unit + ')') + '</option>'; }).join('') + (purpose === 'trap' ? '' : '<option value="other">\u0414\u0440\u0443\u0433\u043e\u0435 \u2014 \u043f\u043e\u0434\u0440\u0443\u0447\u043d\u044b\u0439 \u043f\u0440\u0435\u0434\u043c\u0435\u0442</option>') + '</select></label><label>\u041a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e<input type="number" min="0.01" step="any" value="1" data-inventory-count></label><div class="aba-inventory-description"></div>' + (multiple ? '<button type="button" class="aba-refresh" data-inventory-add>\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0432 \u043b\u043e\u0432\u0443\u0448\u043a\u0443</button><div class="aba-trap-items"></div>' : '') + '</div>';
  }

  function parseMedicineCatalog(doc) {
    var result = [];
    Array.prototype.forEach.call(doc.querySelectorAll('table'), function (table) {
      var columns = headerMap(table);
      var nameIndex = columnIndex(columns, ['\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435', '\u041d\u0430\u0438\u043c\u0435\u043d\u043e\u0432\u0430\u043d\u0438\u0435', '\u041f\u0440\u0435\u043f\u0430\u0440\u0430\u0442']);
      var effectIndex = columnIndex(columns, ['\u042d\u0444\u0444\u0435\u043a\u0442', '\u041e\u043f\u0438\u0441\u0430\u043d\u0438\u0435', '\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u0435']);
      if (nameIndex < 0) return;
      Array.prototype.forEach.call(table.rows, function (row, index) {
        if (!index || !row.cells[nameIndex]) return;
        var name = clean(row.cells[nameIndex].textContent);
        var effect = effectIndex >= 0 && row.cells[effectIndex] ? clean(row.cells[effectIndex].textContent) : clean(row.textContent).replace(name, '').trim();
        if (name) result.push({ name: name, effect: effect });
      });
    });
    return result;
  }

  function loadMedicines() {
    if (state.medicines.length) return actorResolve(state.medicines);
    return loadDocument(topicUrl(MEDICINE_TOPIC_ID)).then(function (doc) {
      state.medicines = parseMedicineCatalog(doc);
      return state.medicines;
    }).catch(function () { state.medicines = []; return state.medicines; });
  }

  function medicineEffect(item) {
    var found = state.medicines.find(function (entry) { return inventoryName(entry.name) === inventoryName(item.name); });
    var text = clean((found && found.effect || '') + ' ' + (item.description || '') + ' ' + (item.details || ''));
    var normalized = normalizeText(text);
    var result = { text: text, hp: 0, focused: 0, stat: '', modifier: 0, duration: 0 };
    var hp = normalized.match(/\+(\d+)\s*(?:\u0435\u0434\u0438\u043d\u0438\u0446[\u0430-\u044f]*\s*)?(?:\u0436\u0438\u0437\u043d\u0438|hp|\u0437\u0434\u043e\u0440\u043e\u0432\u044c\u044f|\u0431\u043e\u0435\u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u0438)/i);
    var focused = normalized.match(/\+(\d+)\s*(?:\u0435\u0434\u0438\u043d\u0438\u0446[\u0430-\u044f]*\s*)?(?:\u0441\u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u043e\u0439|\u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u043e\u0439)\s*\u0447\u0430\u043a\u0440\u044b/i);
    var strength = normalized.match(/\+(\d+)\s*\u043a\s*\u0441\u0438\u043b\u0435/i);
    var duration = normalized.match(/(?:\u043d\u0430|\u0432 \u0442\u0435\u0447\u0435\u043d\u0438\u0435)\s*(\d+)\s*\u0445\u043e\u0434/i);
    if (hp) result.hp = Number(hp[1]);
    if (focused) result.focused = Number(focused[1]);
    if (strength) { result.stat = 'strength'; result.modifier = Number(strength[1]); }
    if (duration) result.duration = Number(duration[1]);
    if (/\u0431\u043e\u0435\u0432\u0430\u044f \u043f\u0438\u043b\u044e\u043b\u044f/i.test(item.name)) {
      result.stat = 'strength'; result.modifier = 2; result.duration = 5; result.focused = 10;
      if (!result.text) result.text = '+2 \u043a \u0421\u0438\u043b\u0435 \u043d\u0430 5 \u0445\u043e\u0434\u043e\u0432; +10 \u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u043e\u0439 \u0447\u0430\u043a\u0440\u044b, \u043d\u0435 \u0432\u044b\u0448\u0435 \u0437\u0430\u043f\u0430\u0441\u0430';
    }
    if (/\u0446\u0435\u043b\u0435\u0431\u043d\u0430\u044f \u0432\u043e\u0434\u0430/i.test(item.name)) {
      result.hp = 25;
      if (!result.text) result.text = '+25 \u0435\u0434\u0438\u043d\u0438\u0446 \u0436\u0438\u0437\u043d\u0438, \u043d\u0435 \u0432\u044b\u0448\u0435 \u043c\u0430\u043a\u0441\u0438\u043c\u0430\u043b\u044c\u043d\u043e\u0433\u043e \u0437\u0430\u043f\u0430\u0441\u0430 \u0437\u0434\u043e\u0440\u043e\u0432\u044c\u044f';
    }
    return result;
  }

  function bindSearchPicker(select) {
    if (!select || select.dataset.searchPicker) return;
    select.dataset.searchPicker = 'true';
    var isTechnique = /^(technique|clone|hide)$/.test(select.dataset.situation || '');
    var inventory = state.character.inventory || [];
    var options = Array.prototype.slice.call(select.options).filter(function (option) { return option.value; }).map(function (option) {
      var value = option.value, item = inventory.find(function (item) { return item.inventoryId === value || 'standard:' + item.inventoryId === value || item.artifact && 'artifact:' + item.id === value; });
      var technique = isTechnique && (state.character.techniques || []).find(function (entry) { return String(entry.postId) === value; });
      return { value: value, text: option.textContent, category: isTechnique ? clean(technique && technique.detail && technique.detail.effect) || '\u0411\u0435\u0437 \u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u0438' : item ? item.category : value === 'other' ? '\u0414\u0440\u0443\u0433\u043e\u0435' : '\u041e\u0440\u0443\u0436\u0438\u0435' };
    });
    var categories = options.map(function (option) { return option.category; }).filter(function (value, index, all) { return all.indexOf(value) === index; });
    var picker = document.createElement('details'); picker.className = 'aba-search-picker';
    picker.innerHTML = '<summary></summary><div class="aba-search-picker-body"><input type="search" data-picker-search aria-label="' + (isTechnique ? '\u041f\u043e\u0438\u0441\u043a \u0442\u0435\u0445\u043d\u0438\u043a\u0438' : '\u041f\u043e\u0438\u0441\u043a \u043f\u0440\u0435\u0434\u043c\u0435\u0442\u0430') + '" placeholder="\u041f\u043e\u0438\u0441\u043a \u043f\u043e \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u044e\u2026"><select data-picker-category aria-label="' + (isTechnique ? '\u041a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u0438 \u0442\u0435\u0445\u043d\u0438\u043a' : '\u041a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u0438 \u043f\u0440\u0435\u0434\u043c\u0435\u0442\u043e\u0432') + '"><option value="">' + (isTechnique ? '\u041a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u0438 \u0442\u0435\u0445\u043d\u0438\u043a' : '\u0412\u0441\u0435 \u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u0438') + '</option>' + categories.map(function (category) { return '<option value="' + escapeHtml(category) + '">' + escapeHtml(category) + '</option>'; }).join('') + '</select><div class="aba-search-picker-results"></div></div>';
    select.style.setProperty('display', 'none', 'important'); select.setAttribute('aria-hidden', 'true'); select.tabIndex = -1;
    select.parentNode.insertBefore(picker, select.nextSibling);
    var search = picker.querySelector('[data-picker-search]'), category = picker.querySelector('[data-picker-category]'), results = picker.querySelector('.aba-search-picker-results');
    function render() {
      var words = normalizeText(search.value).split(' ').filter(Boolean);
      var filtered = options.filter(function (option) { return (!category.value || category.value === option.category) && words.every(function (word) { return normalizeText(option.text).indexOf(word) !== -1; }); });
      results.innerHTML = filtered.length ? filtered.map(function (option) { return '<button type="button" data-picker-value="' + escapeHtml(option.value) + '" aria-pressed="' + (select.value === option.value) + '"><span>' + escapeHtml(option.text) + '</span></button>'; }).join('') : '<p class="aba-note">\u041d\u0438\u0447\u0435\u0433\u043e \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u043e</p>';
      Array.prototype.forEach.call(results.querySelectorAll('[data-picker-value]'), function (button) { on(button, 'click', function (event) { event.preventDefault(); select.value = button.dataset.pickerValue; select.dispatchEvent(new Event('change', { bubbles: true })); picker.open = false; picker.querySelector('summary').focus(); }); });
    }
    function update() { var selected = options.find(function (option) { return option.value === select.value; }); picker.querySelector('summary').textContent = selected ? selected.text : isTechnique ? '\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0442\u0435\u0445\u043d\u0438\u043a\u0443' : '\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043f\u0440\u0435\u0434\u043c\u0435\u0442'; render(); }
    on(search, 'input', render); on(category, 'change', render); on(select, 'change', update);
    update();
  }

  function attackItemCost(count) {
    if (!Number.isInteger(count) || count < 1) throw new Error('\u0423\u043a\u0430\u0436\u0438\u0442\u0435 \u0446\u0435\u043b\u043e\u0435 \u043a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e \u043f\u0440\u0435\u0434\u043c\u0435\u0442\u043e\u0432 \u043e\u0442 1.');
    return Math.ceil(count / 2);
  }

  function bindInventoryEditor(editor) {
    var picker = editor.querySelector('[data-inventory-select]');
    if (!picker) return;
    editor.inventorySelection = [];
    var attackButton = editor.querySelector('[data-add="attack-item"]');
    if (attackButton) {
      var countInput = editor.querySelector('[data-inventory-count]');
      countInput.min = '1'; countInput.step = '1';
      function updateAttackCost() {
        try { attackButton.textContent = '\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u00b7 ' + attackItemCost(Number(countInput.value)) + ' \u041e\u0414'; attackButton.disabled = false; }
        catch (error) { attackButton.textContent = '\u0423\u043a\u0430\u0436\u0438\u0442\u0435 \u043a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e \u043f\u0440\u0435\u0434\u043c\u0435\u0442\u043e\u0432'; attackButton.disabled = true; }
      }
      on(countInput, 'input', updateAttackCost);
      on(countInput, 'change', updateAttackCost);
      updateAttackCost();
    }
    function selection() { return (state.character.inventory || []).find(function (item) { return item.inventoryId === picker.value; }); }
    on(picker, 'change', function () {
      var item = selection(), info = editor.querySelector('.aba-inventory-description');
      var medicine = item && picker.closest('[data-inventory-purpose="medicine"]') ? medicineEffect(item) : null;
      info.textContent = item ? (medicine && medicine.text || item.description || item.damage || '\u042d\u0444\u0444\u0435\u043a\u0442 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d: \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442 \u043e\u043f\u0440\u0435\u0434\u0435\u043b\u044f\u0435\u0442 \u0413\u041c.') : picker.value === 'other' ? '\u041f\u043e\u0434\u0440\u0443\u0447\u043d\u044b\u0439 \u043f\u0440\u0435\u0434\u043c\u0435\u0442: \u0443\u043a\u0430\u0436\u0438\u0442\u0435, \u0447\u0442\u043e \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u0435\u0442\u0441\u044f.' : '';
      var text = editor.querySelector('[data-field="description"], [data-field="object"]');
      if (text && item && !editor.querySelector('[data-inventory-add]')) text.value = item.name;
    });
    bindSearchPicker(picker);
    var add = editor.querySelector('[data-inventory-add]');
    if (add) on(add, 'click', function () {
      var item = selection(), count = Number(editor.querySelector('[data-inventory-count]').value);
      if (!item || !isFinite(count) || count <= 0) return setBuilderMessage('\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043f\u0440\u0435\u0434\u043c\u0435\u0442 \u0438 \u043a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e.', 'error');
      editor.inventorySelection.push({ item: item, count: count });
      var list = editor.querySelector('.aba-trap-items');
      function renderList() { list.innerHTML = editor.inventorySelection.map(function (entry, index) { return '<p>' + escapeHtml(entry.item.name + ' \u00d7' + entry.count + ' ' + entry.item.unit) + ' <button type="button" data-remove-trap="' + index + '">\u00d7</button></p>'; }).join('');
      Array.prototype.forEach.call(list.querySelectorAll('[data-remove-trap]'), function (node) { on(node, 'click', function () { editor.inventorySelection.splice(Number(node.dataset.removeTrap), 1); renderList(); }); }); }
      renderList();
    });
  }

  function attachInventoryAction(action, editor, kind) {
    var picker = editor.querySelector('[data-inventory-select]');
    if (!picker) return action;
    var selected = editor.inventorySelection || [];
    if (kind !== 'trap') {
      if (picker.value === 'other') { action.code += '; \u043f\u043e\u0434\u0440\u0443\u0447\u043d\u044b\u0439 \u043f\u0440\u0435\u0434\u043c\u0435\u0442'; return action; }
      var item = (state.character.inventory || []).find(function (candidate) { return candidate.inventoryId === picker.value; });
      if (!item) throw new Error('\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043f\u0440\u0435\u0434\u043c\u0435\u0442 \u0438\u0437 \u0438\u043d\u0432\u0435\u043d\u0442\u0430\u0440\u044f \u0438\u043b\u0438 \u00ab\u0414\u0440\u0443\u0433\u043e\u0435\u00bb.');
      selected = [{ item: item, count: Number(editor.querySelector('[data-inventory-count]').value) }];
    }
    if (!selected.length) throw new Error('\u0414\u043e\u0431\u0430\u0432\u044c\u0442\u0435 \u043f\u0440\u0435\u0434\u043c\u0435\u0442\u044b \u0438\u0437 \u0438\u043d\u0432\u0435\u043d\u0442\u0430\u0440\u044f \u0432 \u043b\u043e\u0432\u0443\u0448\u043a\u0443.');
    action.inventoryUse = selected.map(function (entry) {
      if (!isFinite(entry.count) || entry.count <= 0 || !/^\u043c(?:\u0435\u0442\u0440[\u0430-\u044f]*)?$/i.test(entry.item.unit) && !Number.isInteger(entry.count)) throw new Error('\u041f\u0440\u043e\u0432\u0435\u0440\u044c\u0442\u0435 \u043a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e \u043f\u0440\u0435\u0434\u043c\u0435\u0442\u043e\u0432.');
      return inventoryUse(entry.item, entry.count, false, kind === 'trap');
    });
    action.code += '; \u0438\u043d\u0432\u0435\u043d\u0442\u0430\u0440\u044c: ' + selected.map(function (entry) { return entry.item.name + ' \u00d7' + entry.count + ' ' + entry.item.unit + (entry.item.description ? ' \u2014 ' + entry.item.description : ''); }).join('; ');
    if (kind === 'defense-object' && selected[0].item.defense) action.code += '; \u0437\u0430\u0449\u0438\u0442\u0430 \u043f\u0440\u0435\u0434\u043c\u0435\u0442\u0430: ' + selected[0].item.defense;
    return action;
  }

  function findPostContent(doc, postId) {
    var marker = doc.getElementById('p' + postId) || doc.getElementById('p' + postId + '-content') || doc.querySelector('[data-post-id="' + postId + '"]');
    var post = marker && marker.closest ? marker.closest('.post') : null;
    return (post && post.querySelector('.post-content')) || (marker && marker.classList && marker.classList.contains('post-content') ? marker : null);
  }

  function labeledValue(text, label, stops) {
    var expression = new RegExp(label + '\\s*:\\s*([\\s\\S]*?)(' + stops.join('|') + '|$)', 'i');
    var match = text.match(expression);
    return match ? clean(match[1]) : '';
  }

  function parseTechniqueDetail(content, technique) {
    var text = clean(content.textContent).replace(/[\u2212\u2013\u2014]/g, '-');
    var effect = labeledValue(text, '\u0422\u0438\u043f \u044d\u0444\u0444\u0435\u043a\u0442\u0430', ['\u0423\u0440\u043e\u043d\\s*\\/\\s*\u0417\u0430\u0449\u0438\u0442\u0430\\s*\\/\\s*\u041b\u0435\u0447\u0435\u043d\u0438\u0435', '\u0414\u0430\u043b\u044c\u043d\u043e\u0441\u0442\u044c', '\u041e\u043f\u0438\u0441\u0430\u043d\u0438\u0435', '\u041f\u0440\u0438\u043c\u0435\u0447\u0430\u043d\u0438\u0435', '\u041f\u0440\u043e\u0432\u0435\u0440\u043a\u0430', '\u0422\u0440\u0435\u0431\u043e\u0432\u0430\u043d\u0438\u044f', '\u041f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u0438']);
    var check = labeledValue(text, '\u041f\u0440\u043e\u0432\u0435\u0440\u043a\u0430(?: \u043f\u0430\u0440\u0430\u043c\u0435\u0442\u0440\u0430)?', ['\u041e\u043f\u0438\u0441\u0430\u043d\u0438\u0435', '\u041f\u0440\u0438\u043c\u0435\u0447\u0430\u043d\u0438\u0435', '\u0422\u0440\u0435\u0431\u043e\u0432\u0430\u043d\u0438\u044f', '\u041f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u0438', '\u041a\u043e\u0434 \u0434\u043b\u044f \u0432\u0441\u0442\u0430\u0432\u043a\u0438']);
    var notes = labeledValue(text, '\u041f\u0440\u0438\u043c\u0435\u0447\u0430\u043d\u0438[\u0435\u044f]', ['\u0422\u0440\u0435\u0431\u043e\u0432\u0430\u043d\u0438\u044f', '\u041f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u0438', '\u041a\u043e\u0434 \u0434\u043b\u044f \u0432\u0441\u0442\u0430\u0432\u043a\u0438']);
    var chakra = labeledValue(text, '\u0420\u0430\u0441\u0445\u043e\u0434 \u0447\u0430\u043a\u0440\u044b', ['\u041f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430', '\u0422\u0438\u043f \u044d\u0444\u0444\u0435\u043a\u0442\u0430', '\u0423\u0440\u043e\u043d', '\u0414\u0430\u043b\u044c\u043d\u043e\u0441\u0442\u044c', '\u041e\u043f\u0438\u0441\u0430\u043d\u0438\u0435']) ||
      labeledValue(text, '\u041a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e \u0447\u0430\u043a\u0440\u044b \u043d\u0430 \u0430\u043a\u0442\u0438\u0432\u0430\u0446\u0438\u044e', ['\u041f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430', '\u0422\u0438\u043f \u044d\u0444\u0444\u0435\u043a\u0442\u0430', '\u0423\u0440\u043e\u043d', '\u0414\u0430\u043b\u044c\u043d\u043e\u0441\u0442\u044c', '\u041e\u043f\u0438\u0441\u0430\u043d\u0438\u0435']) ||
      labeledValue(text, '\u041a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e \u0447\u0430\u043a\u0440\u044b', ['\u041f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430', '\u0422\u0438\u043f \u044d\u0444\u0444\u0435\u043a\u0442\u0430', '\u0423\u0440\u043e\u043d', '\u0414\u0430\u043b\u044c\u043d\u043e\u0441\u0442\u044c', '\u041e\u043f\u0438\u0441\u0430\u043d\u0438\u0435']) ||
      labeledValue(text, '\u0427\u0430\u043a\u0440\u0430', ['\u041f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430', '\u0422\u0438\u043f \u044d\u0444\u0444\u0435\u043a\u0442\u0430', '\u0423\u0440\u043e\u043d', '\u0414\u0430\u043b\u044c\u043d\u043e\u0441\u0442\u044c', '\u041e\u043f\u0438\u0441\u0430\u043d\u0438\u0435', '\u041f\u0440\u0438\u043c\u0435\u0447\u0430\u043d\u0438\u0435']);
    var support = labeledValue(text, '\u041f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430 \u0442\u0435\u0445\u043d\u0438\u043a\u0438', ['\u0422\u0438\u043f \u044d\u0444\u0444\u0435\u043a\u0442\u0430', '\u0423\u0440\u043e\u043d', '\u0414\u0430\u043b\u044c\u043d\u043e\u0441\u0442\u044c', '\u041e\u043f\u0438\u0441\u0430\u043d\u0438\u0435', '\u041f\u0440\u0438\u043c\u0435\u0447\u0430\u043d\u0438\u0435', '\u041f\u0440\u043e\u0432\u0435\u0440\u043a\u0430', '\u0422\u0440\u0435\u0431\u043e\u0432\u0430\u043d\u0438\u044f', '\u041f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u0438']) ||
      labeledValue(text, '\u041f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430', ['\u0422\u0438\u043f \u044d\u0444\u0444\u0435\u043a\u0442\u0430', '\u0423\u0440\u043e\u043d', '\u0414\u0430\u043b\u044c\u043d\u043e\u0441\u0442\u044c', '\u041e\u043f\u0438\u0441\u0430\u043d\u0438\u0435', '\u041f\u0440\u0438\u043c\u0435\u0447\u0430\u043d\u0438\u0435', '\u041f\u0440\u043e\u0432\u0435\u0440\u043a\u0430', '\u0422\u0440\u0435\u0431\u043e\u0432\u0430\u043d\u0438\u044f', '\u041f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u0438']);
    var block = labeledValue(text, '\u0412\u0438\u0434', ['\u0420\u0430\u043d\u0433', '\u0421\u0442\u0438\u0445\u0438\u044f \u0447\u0430\u043a\u0440\u044b', '\u041a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e \u0447\u0430\u043a\u0440\u044b', '\u041f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430', '\u0422\u0438\u043f \u044d\u0444\u0444\u0435\u043a\u0442\u0430']);
    var normalizedText = text.toLocaleLowerCase('ru').replace(/\u0451/g, '\u0435');
    return {
      text: text,
      effect: effect || '\u041d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d',
      check: check,
      notes: notes,
      element: labeledValue(text, '\u0421\u0442\u0438\u0445\u0438\u044f(?: \u0447\u0430\u043a\u0440\u044b)?', ['\u041a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e \u0447\u0430\u043a\u0440\u044b', '\u041f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430', '\u0422\u0438\u043f \u044d\u0444\u0444\u0435\u043a\u0442\u0430']),
      range: labeledValue(text, '\u0414\u0430\u043b\u044c\u043d\u043e\u0441\u0442\u044c(?: \u043f\u0440\u0438\u043c\u0435\u043d\u0435\u043d\u0438\u044f)?', ['\u041e\u043f\u0438\u0441\u0430\u043d\u0438\u0435', '\u041f\u0440\u0438\u043c\u0435\u0447\u0430\u043d\u0438[\u0435\u044f]', '\u041f\u0440\u043e\u0432\u0435\u0440\u043a\u0430', '\u0422\u0440\u0435\u0431\u043e\u0432\u0430\u043d\u0438\u044f']),
      power: labeledValue(text, '(?:\u0423\u0440\u043e\u043d\\s*/\\s*\u0417\u0430\u0449\u0438\u0442\u0430\\s*/\\s*\u041b\u0435\u0447\u0435\u043d\u0438\u0435|\u0423\u0440\u043e\u043d\\s*/\\s*\u0417\u0430\u0449\u0438\u0442\u0430|\u0423\u0440\u043e\u043d|\u0417\u0430\u0449\u0438\u0442\u0430|\u0412\u043e\u0441\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d\u0438\u0435 \u0431\u043e\u0435\u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u0438|\u0412\u043e\u0441\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d\u0438\u0435|\u041b\u0435\u0447\u0435\u043d\u0438\u0435)', ['\u0414\u0430\u043b\u044c\u043d\u043e\u0441\u0442\u044c', '\u041e\u043f\u0438\u0441\u0430\u043d\u0438\u0435', '\u041f\u0440\u0438\u043c\u0435\u0447\u0430\u043d\u0438[\u0435\u044f]', '\u041f\u0440\u043e\u0432\u0435\u0440\u043a\u0430', '\u0422\u0440\u0435\u0431\u043e\u0432\u0430\u043d\u0438\u044f']),
      chakra: chakra,
      support: support,
      block: block,
      discount: /(?:^|[^\d])[-]\s*1\s*\u043e\u0442(?=$|[^a-z\u0430-\u044f0-9])/i.test(normalizedText) ? 1 : 0,
      html: content.innerHTML,
      technique: technique
    };
  }

  function loadTechniqueDetail(technique) {
    if (technique.detail) return actorResolve(technique.detail);
    if (state.detailCache[technique.postId]) return actorPromise(state.detailCache[technique.postId]).then(function (detail) {
      technique.detail = Object.assign({}, detail, { technique: technique });
      return technique.detail;
    });
    var pageUrl = technique.url.split('#')[0];
    state.detailCache[technique.postId] = loadDocument(pageUrl).then(function (doc) {
      var content = findPostContent(doc, technique.postId);
      if (content) return content;
      return loadDocument(BASE_URL + '/viewtopic.php?pid=' + encodeURIComponent(technique.postId)).then(function (postDoc) {
        var resolved = findPostContent(postDoc, technique.postId);
        if (!resolved) throw new Error('\u0421\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435 \u0442\u0435\u0445\u043d\u0438\u043a\u0438 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u043e');
        return resolved;
      });
    }).then(function (content) {
      technique.detail = parseTechniqueDetail(content, technique);
      return technique.detail;
    }).catch(function (error) {
      delete state.detailCache[technique.postId];
      throw error;
    });
    return actorPromise(state.detailCache[technique.postId]);
  }

  function loadAbilityDetail(ability) {
    if (ability.detail) return actorResolve(ability.detail);
    var cacheKey = 'ability-' + ability.postId;
    if (state.detailCache[cacheKey]) return actorPromise(state.detailCache[cacheKey]);
    state.detailCache[cacheKey] = loadDocument(ability.url.split('#')[0]).then(function (doc) {
      var content = findPostContent(doc, ability.postId);
      if (!content) throw new Error('\u0421\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435 \u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u0438 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u043e');
      ability.detail = parseTechniqueDetail(content, ability);
      return ability.detail;
    }).catch(function (error) {
      delete state.detailCache[cacheKey];
      throw error;
    });
    return actorPromise(state.detailCache[cacheKey]);
  }

  function baseStatValue(key) {
    var stat = state.character && state.character.stats[key];
    return stat ? Number(stat.value || 0) : 0;
  }

  function requiredAbilitiesFor(detail) {
    if (!detail || !state.character || !state.character.abilities || !state.character.abilities.length) return [];
    var source = String(detail.html || detail.text || '');
    var text = String(detail.text || '');
    var result = [];
    var seen = {};
    function addCandidate(rawValue) {
      if (!rawValue) return;
      var normalized = String(rawValue).replace(/^\[\/url\]/i, '').replace(/\[\/url\]$/i, '').trim();
      if (!normalized) return;
      var idMatch = normalized.match(/#p(\d+)/i) || normalized.match(/[?&]id=(\d+)/i);
      var item = state.character.abilities.find(function (ability) {
        if (idMatch && String(ability.postId) === String(idMatch[1])) return true;
        var name = clean(ability.name || '');
        return normalize(name).indexOf(normalize(normalized)) !== -1 || normalize(normalized).indexOf(normalize(name)) !== -1;
      });
      if (item && !seen[item.postId]) {
        seen[item.postId] = true;
        result.push(item);
      }
    }
    var urlPattern = /\[[^\]]+\]\((https?:\/\/[^)]+)\)|(?:href|url)=(?:"|')?([^"'\s>]+)(?:"|')?/gi;
    var match;
    while ((match = urlPattern.exec(source + ' ' + text))) {
      addCandidate(match[1] || match[2]);
    }
    var namePattern = /(?:\u0442\u0440\u0435\u0431\u0443\u0435\u0442|\u043d\u0443\u0436\u0435\u043d|\u043d\u0443\u0436\u043d\u0430|\u043d\u0443\u0436\u043d\u044b)\s*(?:[:\-\u2013\u2014]\s*)?(?:\[[^\]]+\]\([^)]+\)|\[url=[^\]]+\])?([^\[\]\r\n;,.]+?)(?=(?:\s*(?:,|\u0438|;|\.|$)))/gi;
    while ((match = namePattern.exec(text + ' ' + source))) {
      addCandidate(match[1]);
    }
    return result;
  }

  function requiredAbilityFor(detail) {
    return requiredAbilitiesFor(detail)[0] || null;
  }

  function abilityStatModifiers(detail, seen) {
    var normalizedDetail = detail || {};
    var modifierText = normalizedDetail.text || normalizedDetail.notes || normalizedDetail.html || '';
    modifierText = String(modifierText).replace(/<[^>]*>|\[\/?(?:b|i|u|color|size)(?:=[^\]]*)?\]/gi, ' ').replace(/&nbsp;|&#160;/gi, ' ').replace(/[\u200b-\u200d\ufeff]/g, '');
    var source = clean(modifierText).replace(/[\u2212\u2013\u2014]/g, '-').toLocaleLowerCase('ru').replace(/\u0451/g, '\u0435');
    var result = {};
    var seenMap = seen || {};
    var keySource = (normalizedDetail.technique && normalizedDetail.technique.postId) || normalizedDetail.postId || clean(normalizedDetail.text || normalizedDetail.html || '').slice(0, 200) || 'ability-inline';
    var key = String(keySource);
    if (seenMap[key]) return result;
    seenMap[key] = true;
    function add(keys, value) {
      (Array.isArray(keys) ? keys : [keys]).forEach(function (keyName) {
        result[keyName] = (result[keyName] || 0) + value;
      });
    }
    function collect(text, expression, keys, requirementKey) {
      var match;
      expression.lastIndex = 0;
      var sawMatch = false;
      while ((match = expression.exec(text))) {
        sawMatch = true;
        var requirement = match[3] ? parseInt(match[3], 10) : 0;
        if (requirement && baseStatValue(requirementKey) < requirement) continue;
        var value = (match[1] === '-' ? -1 : 1) * parseInt(match[2], 10);
        add(keys, value);
      }
      if (!sawMatch && text && /[.;\n]/.test(text)) {
        text.split(/[.;\n]+/).forEach(function (segment) {
          if (!segment || !/[\u0430-\u044f]/i.test(segment)) return;
          collect(segment, expression, keys, requirementKey);
        });
      }
    }
    var ninjutsuName = '\u043d\u0438\u043d\u0434(?:\u0437|\u0436)?(?:\u044e|\u0443)?(?:\u0442)?(?:\u0441\u0443|\u0446\u0443)';
    var genjutsuName = '\u0433\u0435\u043d\u0434(?:\u0437|\u0436)?(?:\u044e|\u0443)?(?:\u0442)?(?:\u0441\u0443|\u0446\u0443)';
    var explicitPatterns = [
      /\u0443\u043a\u043b\u043e\u043d\u0435\u043d\u0438[\u0435\u044f]\s*:?[ ]*([+-])\s*(\d+)(?:\s*\u043f\u0440\u0438\s*\u0442\u0430\u043a\u0442\u0438\u043a[\u0430-\u044f]*\s*(\d+)\s*(?:\u0438\s*)?\u0432\u044b\u0448\u0435)?/gi,
      /(?:\u0430\u0442\u0430\u043a\u0430|\u0430\u0442\u0430\u0442\u043a\u0430)\s+(?:\u043d\u0430\s+)?(?:\u0434\u0438\u0441\u0442\u0430\u043d\u0446\u0438[\u0438\u044f\u044e]|\u0434\u0430\u043b\u044c\u043d(?:\u0438\u0439|\u0435\u0433\u043e)?\s+\u0431\u043e\u0439)\s*:?[ ]*([+-])\s*(\d+)(?:\s*\u043f\u0440\u0438\s*\u0441\u043a\u043e\u0440\u043e\u0441\u0442[\u0430-\u044f]*\s*(\d+)\s*(?:\u0438\s*)?\u0432\u044b\u0448\u0435)?/gi,
      /\u0430\u0442\u0430\u043a\u0430\s*:?\s+(?:\u0432\s+)?\u0431\u043b\u0438\u0436\u043d(?:\u0435\u043c|\u0438\u0439|\u0435\u0433\u043e)?\s+\u0431\u043e[\u044e\u044f\u0439]\s*:?[ ]*([+-])\s*(\d+)(?:\s*\u043f\u0440\u0438\s*\u0442\u0430\u0439\u0434\u0437\u044e\u0446[\u0430-\u044f]*\s*(\d+)\s*(?:\u0438\s*)?\u0432\u044b\u0448\u0435)?/gi,
      new RegExp('\u0430\u0442\u0430\u043a\u0430\\s+(?:\u0442\u0435\u0445\u043d\u0438\u043a(?:\u043e\u0439|\u0438)\\s+)?(?:' + ninjutsuName + ')\\s*:?[ ]*([+-])\\s*(\\d+)(?:\\s*\u043f\u0440\u0438\\s*(?:' + ninjutsuName + ')[\u0430-\u044f]*\\s*(\\d+)\\s*(?:\u0438\\s*)?\u0432\u044b\u0448\u0435)?', 'gi'),
      new RegExp('\u0430\u0442\u0430\u043a\u0430\\s+(?:\u0442\u0435\u0445\u043d\u0438\u043a(?:\u043e\u0439|\u0438)\\s+)?(?:' + genjutsuName + ')\\s*:?[ ]*([+-])\\s*(\\d+)(?:\\s*\u043f\u0440\u0438\\s*(?:' + genjutsuName + ')[\u0430-\u044f]*\\s*(\\d+)\\s*(?:\u0438\\s*)?\u0432\u044b\u0448\u0435)?', 'gi'),
      /(?:^|[^a-z\u0430-\u044f0-9])\u0430\u0442\u0430\u043a\u0430\s*:?[ ]*([+-])\s*(\d+)(?:\s*\u043f\u0440\u0438\s*\u0442\u0430\u043a\u0442\u0438\u043a[\u0430-\u044f]*\s*(\d+)\s*(?:\u0438\s*)?\u0432\u044b\u0448\u0435)?/gi
    ];

    collect(source, explicitPatterns[0], 'dodge', 'strategy');
    collect(source, explicitPatterns[1], 'rangedAttack', 'speed');
    collect(source, explicitPatterns[2], 'meleeAttack', 'taijutsu');
    collect(source, explicitPatterns[3], 'ninjutsuAttack', 'ninjutsu');
    collect(source, explicitPatterns[4], 'genjutsuAttack', 'genjutsu');
    collect(source, explicitPatterns[5], ['meleeAttack', 'rangedAttack', 'ninjutsuAttack', 'genjutsuAttack'], 'strategy');

    var baseSource = explicitPatterns.reduce(function (text, expression) {
      expression.lastIndex = 0;
      return text.replace(expression, ' ');
    }, source);
    collect(baseSource, new RegExp('(?:^|[^a-z\u0430-\u044f0-9])(?:' + ninjutsuName + ')\\s*:?[ ]*([+-])\\s*(\\d+)(?:\\s*\u043f\u0440\u0438\\s*(?:' + ninjutsuName + ')[\u0430-\u044f]*\\s*(\\d+)\\s*(?:\u0438\\s*)?\u0432\u044b\u0448\u0435)?', 'gi'), ['ninjutsu', 'ninjutsuAttack'], 'ninjutsu');
    collect(baseSource, new RegExp('(?:^|[^a-z\u0430-\u044f0-9])(?:' + genjutsuName + ')\\s*:?[ ]*([+-])\\s*(\\d+)(?:\\s*\u043f\u0440\u0438\\s*(?:' + genjutsuName + ')[\u0430-\u044f]*\\s*(\\d+)\\s*(?:\u0438\\s*)?\u0432\u044b\u0448\u0435)?', 'gi'), ['genjutsu', 'genjutsuAttack'], 'genjutsu');
    collect(baseSource, /(?:^|[^a-z\u0430-\u044f0-9])\u0442\u0430\u0439\u0434\u0437\u044e(?:\u0446|\u0442\u0441)\u0443\s*:?[ ]*([+-])\s*(\d+)(?:\s*\u043f\u0440\u0438\s*\u0442\u0430\u0439\u0434\u0437\u044e\u0446[\u0430-\u044f]*\s*(\d+)\s*(?:\u0438\s*)?\u0432\u044b\u0448\u0435)?/gi, ['taijutsu', 'meleeAttack', 'rangedAttack'], 'taijutsu');
    collect(baseSource, /(?:^|[^a-z\u0430-\u044f0-9])\u0441\u043a\u043e\u0440\u043e\u0441\u0442[\u044c\u0438]\s*:?[ ]*([+-])\s*(\d+)(?:\s*\u043f\u0440\u0438\s*\u0441\u043a\u043e\u0440\u043e\u0441\u0442[\u0430-\u044f]*\s*(\d+)\s*(?:\u0438\s*)?\u0432\u044b\u0448\u0435)?/gi, ['speed', 'rangedAttack', 'dodge'], 'speed');
    collect(baseSource, /(?:^|[^a-z\u0430-\u044f0-9])\u0441\u0438\u043b[\u0430\u044b]\s*:?[ ]*([+-])\s*(\d+)(?:\s*\u043f\u0440\u0438\s*\u0441\u0438\u043b[\u0430-\u044f]*\s*(\d+)\s*(?:\u0438\s*)?\u0432\u044b\u0448\u0435)?/gi, ['strength', 'meleeAttack'], 'strength');
    collect(baseSource, /(?:^|[^a-z\u0430-\u044f0-9])\u0442\u0430\u043a\u0442\u0438\u043a[\u0430\u0438]\s*:?[ ]*([+-])\s*(\d+)(?:\s*\u043f\u0440\u0438\s*\u0442\u0430\u043a\u0442\u0438\u043a[\u0430-\u044f]*\s*(\d+)\s*(?:\u0438\s*)?\u0432\u044b\u0448\u0435)?/gi, ['strategy', 'dodge'], 'strategy');
    collect(baseSource, /(?:^|[^a-z\u0430-\u044f0-9])\u0447\u0430\u043a\u0440[\u0430\u044b]\s*:?[ ]*([+-])\s*(\d+)(?:\s*\u043f\u0440\u0438\s*\u0447\u0430\u043a\u0440[\u0430-\u044f]*\s*(\d+)\s*(?:\u0438\s*)?\u0432\u044b\u0448\u0435)?/gi, ['chakra', 'ninjutsuAttack', 'genjutsuAttack'], 'chakra');
    collect(baseSource, /(?:^|[^a-z\u0430-\u044f0-9])\u0444\u0443\u0438\u043d\u0434\u0437\u044e(?:\u0446|\u0442\u0441)\u0443\s*:?[ ]*([+-])\s*(\d+)(?:\s*\u043f\u0440\u0438\s*\u0444\u0443\u0438\u043d\u0434\u0437\u044e\u0446[\u0430-\u044f]*\s*(\d+)\s*(?:\u0438\s*)?\u0432\u044b\u0448\u0435)?/gi, 'fuinjutsu', 'fuinjutsu');

    requiredAbilitiesFor(normalizedDetail).forEach(function (requiredAbility) {
      var requiredDetail = requiredAbility && requiredAbility.detail ? requiredAbility.detail : (
        requiredAbility && requiredAbility.postId && state.detailCache && state.detailCache['ability-' + requiredAbility.postId]
          ? state.detailCache['ability-' + requiredAbility.postId]
          : requiredAbility
      );
      if (!requiredDetail || (!requiredDetail.text && !requiredDetail.html && !requiredDetail.effect && !requiredDetail.technique)) return;
      var requiredModifiers = abilityStatModifiers(requiredDetail, seenMap);
      Object.keys(requiredModifiers).forEach(function (keyName) {
        add(keyName, requiredModifiers[keyName]);
      });
    });
    return result;
  }

  function enhancementDamageModifiers(detail) {
    var source = clean(detail && detail.text).replace(/[\u2212\u2013\u2014]/g, '-').toLocaleLowerCase('ru').replace(/\u0451/g, '\u0435');
    var result = {};
    function collect(expression, key) {
      var match;
      expression.lastIndex = 0;
      while ((match = expression.exec(source))) {
        var value = (match[1] === '-' ? -1 : 1) * parseInt(match[2], 10);
        result[key] = (result[key] || 0) + value;
      }
    }
    collect(/(?:\u0443\u0440\u043e\u043d\s+\u043e\u0442\s+(?:\u043e\u0431\u044b\u0447\u043d[\u0430-\u044f]*\s+)?\u0430\u0442\u0430\u043a[\u0430-\u044f]*\s+\u0431\u0435\u0437\s+\u043e\u0440\u0443\u0436\u0438[\u044f\u044e]|\u0443\u0440\u043e\u043d\s+\u0431\u0435\u0437\s+\u043e\u0440\u0443\u0436\u0438[\u044f\u044e])\s*:?\s*([+-])\s*(\d+)/gi, 'unarmedDamage');
    collect(/(?:\u0443\u0440\u043e\u043d\s+\u043e\u0442\s+(?:\u043e\u0431\u044b\u0447\u043d[\u0430-\u044f]*\s+)?\u0430\u0442\u0430\u043a[\u0430-\u044f]*\s+(?:\u0441\s+\u043e\u0440\u0443\u0436\u0438[\u0430-\u044f]*|\u043e\u0440\u0443\u0436\u0438[\u0430-\u044f]*\s+\u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436[\u0430-\u044f]*)|\u0443\u0440\u043e\u043d\s+\u0441\s+\u043e\u0440\u0443\u0436\u0438[\u0430-\u044f]*|\u0443\u0440\u043e\u043d\s+\u043e\u0440\u0443\u0436\u0438[\u0430-\u044f]*)\s*:?\s*([+-])\s*(\d+)/gi, 'weaponDamage');
    // The master post may describe the bonus before the weapon damage label.
    var weaponBonus = source.match(/([+-])\s*(\d+)\s*(?:\u0435\u0434\u0438\u043d\u0438\u0446[\u0430-\u044f]*|\u0435\u0434\.?)?\s*\u043a\s*\u0443\u0440\u043e\u043d\u0443\s*(?:\u043e\u0442\s*)?(?:\u0430\u0442\u0430\u043a[\u0430-\u044f]*\s*)?(?:\u0441\s*)?\u043e\u0440\u0443\u0436\u0438[\u0430-\u044f]*/i);
    if (weaponBonus && !result.weaponDamage) result.weaponDamage = (weaponBonus[1] === '-' ? -1 : 1) * Number(weaponBonus[2]);
    return result;
  }

  function signedModifier(value) {
    value = Number(value || 0);
    return (value >= 0 ? '+' : '\u2212') + Math.abs(value);
  }

  function enhancementModifierSummary(detail) {
    var stats = abilityStatModifiers(detail);
    var damage = enhancementDamageModifiers(detail);
    return Object.keys(stats).map(function (key) {
      return statLabel(key) + ' ' + signedModifier(stats[key]);
    }).concat(Object.keys(damage).map(function (key) {
      return (key === 'unarmedDamage' ? '\u0423\u0440\u043e\u043d \u0431\u0435\u0437 \u043e\u0440\u0443\u0436\u0438\u044f' : '\u0423\u0440\u043e\u043d \u0441 \u043e\u0440\u0443\u0436\u0438\u0435\u043c') + ' ' + signedModifier(damage[key]);
    })).join('; ');
  }

  function techniqueEnhancementPayload(item, disabled) {
    var detail = item && item.detail;
    var applies = !!detail && !disabled && techniqueCategory(detail).enhancement;
    return {
      statModifiers: applies ? abilityStatModifiers(detail) : null,
      expandedStatModifiers: true,
      damageModifiers: applies ? enhancementDamageModifiers(detail) : null,
      modifierSourceKey: '',
      summary: applies ? enhancementModifierSummary(detail) : ''
    };
  }

  function techniqueTurnLimit(detail) {
    var source = clean(detail && ((detail.text || '') + ' ' + (detail.notes || '') + ' ' + (detail.html || '')))
      .replace(/<[^>]*>|\[\/?(?:i|b|u|color|size)(?:=[^\]]*)?\]/gi, ' ')
      .replace(/&nbsp;|&#160;/gi, ' ').replace(/[\u2212\u2013\u2014]/g, '-').toLocaleLowerCase('ru').replace(/\u0451/g, '\u0435');
    var expression = /(?:\u043d\u0435\s+(?:\u0431\u043e\u043b\u044c\u0448\u0435|\u0431\u043e\u043b\u0435\u0435|\u0447\u0430\u0449\u0435)|\u043c\u0430\u043a\u0441\u0438\u043c\u0443\u043c|\u043d\u0435\s+\u043c\u043e\u0436\u0435\u0442\s+(?:\u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u044c\u0441\u044f|\u043f\u0440\u0438\u043c\u0435\u043d\u044f\u0442\u044c\u0441\u044f)\s+(?:\u0431\u043e\u043b\u0435\u0435|\u0447\u0430\u0449\u0435))\s*(\d+\s*(?:-?\s*[\u0445x])?|\u043e\u0434\u0438\u043d|\u043e\u0434\u043d\u043e\u0433\u043e|\u0434\u0432\u0430|\u0434\u0432\u0443\u0445|\u0442\u0440\u0438|\u0442\u0440\u0435\u0445|\u0447\u0435\u0442\u044b\u0440\u0435|\u0447\u0435\u0442\u044b\u0440\u0435\u0445|\u043f\u044f\u0442\u044c|\u043f\u044f\u0442\u0438)\s*\u0440\u0430\u0437(?:\u0430|\u043e\u0432)?\s*(?:\u0437\u0430|\u0432)\s*(?:\u043e\u0434\u0438\u043d\s+)?\u0445\u043e\u0434/gi;
    var words = { \u043e\u0434\u0438\u043d: 1, \u043e\u0434\u043d\u043e\u0433\u043e: 1, \u0434\u0432\u0430: 2, \u0434\u0432\u0443\u0445: 2, \u0442\u0440\u0438: 3, \u0442\u0440\u0435\u0445: 3, \u0447\u0435\u0442\u044b\u0440\u0435: 4, \u0447\u0435\u0442\u044b\u0440\u0435\u0445: 4, \u043f\u044f\u0442\u044c: 5, \u043f\u044f\u0442\u0438: 5 };
    var limit = 0, match;
    while ((match = expression.exec(source))) {
      var number = parseInt(match[1], 10) || words[match[1]] || 0;
      if (Number.isSafeInteger(number) && number > 0) limit = limit ? Math.min(limit, number) : number;
    }
    return limit;
  }

  function loadArtifactDetail(artifact) {
    if (artifact.detailLoaded) return actorResolve(artifact);
    return loadDocument(artifact.url.split('#')[0]).then(function (doc) {
      var content = findPostContent(doc, artifact.id);
      if (!content) throw new Error('\u0421\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435 \u0430\u0440\u0442\u0435\u0444\u0430\u043a\u0442\u0430 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u043e');
      var text = clean(content.textContent);
      artifact.damage = labeledValue(text, '\u0423\u0440\u043e\u043d', ['\u041a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u0443\u0440\u043e\u043d', '\u041c\u0430\u0442\u0435\u0440\u0438\u0430\u043b', '\u041e\u043f\u0438\u0441\u0430\u043d\u0438\u0435', '\u041f\u0440\u0438\u043c\u0435\u0447\u0430\u043d\u0438\u0435', '\u0422\u0440\u0435\u0431\u043e\u0432\u0430\u043d\u0438\u044f', '\u041f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u0438', '\u041a\u043e\u0434 \u0434\u043b\u044f \u0432\u0441\u0442\u0430\u0432\u043a\u0438']) || '\u0443\u0440\u043e\u043d \u043d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d';
      parseArtifactEffects(artifact, content);
      return artifact;
    });
  }

  function techniqueCategory(detail) {
    var effect = clean(detail.effect).toLocaleLowerCase('ru').replace(/\u0451/g, '\u0435');
    return {
      attack: effect.indexOf('\u0430\u0442\u0430\u043a\u0430') !== -1,
      defense: effect.indexOf('\u0437\u0430\u0449\u0438\u0442') !== -1,
      support: effect.indexOf('\u043f\u043e\u0434\u0434\u0435\u0440\u0436') !== -1,
      enhancement: effect.indexOf('\u0443\u0441\u0438\u043b\u0435\u043d') !== -1
    };
  }

  function techniqueAllowed(detail, mode, technique) {
    var category = techniqueCategory(detail);
    if (mode === 'attack') return category.attack;
    if (mode === 'defense') return category.defense;
    if (mode === 'support') {
      if (technique && (technique.postId === SUMMON_TECHNIQUE.postId || normalize(technique.name) === normalize(SUMMON_TECHNIQUE.name))) return false;
      if (category.attack && category.defense && !category.support && !category.enhancement) return false;
      if (category.attack && !category.defense && !category.support && !category.enhancement) return false;
      return true;
    }
    return true;
  }

  function techniqueRanksForMode(mode) {
    return RANKS.filter(function (rank) {
      return state.character.techniques.some(function (item) {
        return item.rank === rank && item.detail && techniqueAllowed(item.detail, mode, item);
      });
    });
  }

  function techniqueCheck(detail) {
    var character = state.character;
    var direct = clean(detail.check);
    var source = clean(direct + ' ' + (detail.notes || '') + ' ' + (detail.text || '')).toLocaleLowerCase('ru').replace(/\u0451/g, '\u0435');
    var ninjutsuWord = '\u043d\u0438\u043d\u0434(?:\u0437|\u0436)?(?:\u044e|\u0443)?(?:\u0442)?(?:\u0441\u0443|\u0446\u0443)';
    var genjutsuWord = '\u0433\u0435\u043d\u0434(?:\u0437|\u0436)?(?:\u044e|\u0443)?(?:\u0442)?(?:\u0441\u0443|\u0446\u0443)';
    var ninjutsuPattern = new RegExp('\u0430\u0442\u0430\u043a\u0430\\s+(?:\u0442\u0435\u0445\u043d\u0438\u043a(?:\u043e\u0439|\u0438)\\s+)?(?:' + ninjutsuWord + ')|\u0430\u0442\u0430\u043a\u0430\\s+(?:\u0442\u0435\u0445\u043d\u0438\u043a(?:\u043e\u0439|\u0438)\\s+)?(?:' + genjutsuWord + ')|\u0430\u0442\u0430\u043a\u0430\\s+(?:(?:\u0432|\u043d\u0430)\\s+)?\u0431\u043b\u0438\u0436\u043d(?:\u0438\u0439|\u0435\u0433\u043e)?\\s+\u0431\u043e\u0439|\u0430\u0442\u0430\u043a\u0430\\s+(?:\u043d\u0430\\s+)?(?:\u0434\u0438\u0441\u0442\u0430\u043d\u0446\u0438[\u0438\u044f\u044e]|\u0434\u0430\u043b\u044c\u043d(?:\u0438\u0439|\u0435\u0433\u043e)?\\s+\u0431\u043e\u0439)|\u0443\u043a\u043b\u043e\u043d\u0435\u043d\u0438[\u0435\u044f]', 'i');
    var explicitMatch = source.match(ninjutsuPattern);
    var explicit = explicitMatch ? explicitMatch[0] : '';
    var block = clean(detail.block).toLocaleLowerCase('ru').replace(/\u0451/g, '\u0435');
    var key = 'ninjutsuAttack';
    var label = '\u0410\u0442\u0430\u043a\u0430 \u041d\u0438\u043d\u0434\u0437\u044e\u0446\u0443';
    if (new RegExp(genjutsuWord, 'i').test(explicit)) { key = 'genjutsuAttack'; label = '\u0410\u0442\u0430\u043a\u0430 \u0413\u0435\u043d\u0434\u0437\u044e\u0446\u0443'; }
    else if (/\u0431\u043b\u0438\u0436\u043d/.test(explicit)) { key = 'meleeAttack'; label = '\u0410\u0442\u0430\u043a\u0430 \u0431\u043b\u0438\u0436\u043d\u0438\u0439 \u0431\u043e\u0439'; }
    else if (/\u0434\u0430\u043b\u044c\u043d|\u0434\u0438\u0441\u0442\u0430\u043d\u0446/.test(explicit)) { key = 'rangedAttack'; label = '\u0410\u0442\u0430\u043a\u0430 \u043d\u0430 \u0434\u0438\u0441\u0442\u0430\u043d\u0446\u0438\u0438'; }
    else if (/\u0443\u043a\u043b\u043e\u043d/.test(explicit)) { key = 'dodge'; label = '\u0423\u043a\u043b\u043e\u043d\u0435\u043d\u0438\u0435'; }
    else if (new RegExp(ninjutsuWord, 'i').test(explicit)) { key = 'ninjutsuAttack'; label = '\u0410\u0442\u0430\u043a\u0430 \u041d\u0438\u043d\u0434\u0437\u044e\u0446\u0443'; }
    else if (new RegExp(genjutsuWord, 'i').test(block)) { key = 'genjutsuAttack'; label = '\u0410\u0442\u0430\u043a\u0430 \u0413\u0435\u043d\u0434\u0437\u044e\u0446\u0443'; }
    else if (block.indexOf('\u0442\u0430\u0439\u0434\u0437\u044e\u0446\u0443') !== -1) { key = 'meleeAttack'; label = '\u0410\u0442\u0430\u043a\u0430 \u0431\u043b\u0438\u0436\u043d\u0438\u0439 \u0431\u043e\u0439'; }
    var bonusSource = clean((detail.check || '') + ' ' + (detail.notes || '') + ' ' + (detail.text || '')).toLocaleLowerCase('ru').replace(/\u0451/g, '\u0435');
    var bonusPatterns = {
      meleeAttack: /\u0430\u0442\u0430\u043a\u0430\s*:?\s+(?:\u0432\s+)?\u0431\u043b\u0438\u0436\u043d(?:\u0438\u0439|\u0435\u0433\u043e)?\s+\u0431\u043e\u0439\s*([+-])\s*(\d+)/i,
      rangedAttack: /\u0430\u0442\u0430\u043a\u0430\s+(?:\u043d\u0430\s+)?(?:\u0434\u0438\u0441\u0442\u0430\u043d\u0446\u0438[\u0438\u044f\u044e]|\u0434\u0430\u043b\u044c\u043d(?:\u0438\u0439|\u0435\u0433\u043e)?\s+\u0431\u043e\u0439)\s*([+-])\s*(\d+)/i,
      ninjutsuAttack: new RegExp('\u0430\u0442\u0430\u043a\u0430\\s+(?:\u0442\u0435\u0445\u043d\u0438\u043a(?:\u043e\u0439|\u0438)\\s+)?(?:' + ninjutsuWord + ')\\s*([+-])\\s*(\\d+)', 'i'),
      genjutsuAttack: new RegExp('\u0430\u0442\u0430\u043a\u0430\\s+(?:\u0442\u0435\u0445\u043d\u0438\u043a(?:\u043e\u0439|\u0438)\\s+)?(?:' + genjutsuWord + ')\\s*([+-])\\s*(\\d+)', 'i'),
      dodge: /\u0443\u043a\u043b\u043e\u043d\u0435\u043d\u0438[\u0435\u044f]\s*([+-])\s*(\d+)/i
    };
    var bonusMatch = bonusSource.match(bonusPatterns[key]);
    var bonus = bonusMatch ? (bonusMatch[1] === '-' ? -1 : 1) * parseInt(bonusMatch[2], 10) : 0;
    return { label: label, value: statValue(key) + bonus, bonus: bonus };
  }

  function ordinaryActionFormula(taijutsu) {
    return 1 + (taijutsu >= 2 ? 1 : 0) + (taijutsu >= 7 ? 1 : 0) + (taijutsu >= 9 ? 1 : 0);
  }

  function techniqueActionFormula(taijutsu, ninjutsu) {
    return ordinaryActionFormula(taijutsu) + (ninjutsu >= 4 ? 1 : 0) + (ninjutsu >= 9 ? 1 : 0);
  }

  function actionTotal(type) {
    if (!state.character) return 0;
    var baseT = baseStatValue('taijutsu'), baseN = baseStatValue('ninjutsu');
    var base = type === 'ordinary' ? ordinaryActionFormula(baseT) : techniqueActionFormula(baseT, baseN);
    var current = type === 'ordinary' ? ordinaryActionFormula(statValue('taijutsu')) : techniqueActionFormula(statValue('taijutsu'), statValue('ninjutsu'));
    var imported = type === 'ordinary' ? state.character.ordinaryTotal : state.character.techniqueTotal;
    return Math.max(0, (imported === undefined ? base : imported) + current - base);
  }

  function remaining() {
    var spentOD = state.actions.reduce(function (sum, item) { return sum + item.od; }, 0);
    var spentOT = state.actions.reduce(function (sum, item) { return sum + item.ot; }, 0);
    return {
      od: Math.max(0, (state.character ? actionTotal('ordinary') : 0) - spentOD),
      ot: Math.max(0, (state.character ? actionTotal('technique') : 0) - spentOT),
      spentOD: spentOD,
      spentOT: spentOT
    };
  }

  function focusedChakraModifier() {
    var text = statText('chakraFocused').replace(/[\u2212\u2013\u2014]/g, '-');
    if (!text) return 0;
    if (/[=()]/.test(text)) return 0;
    var source = text.match(/^([^()=]+)/) ? text.match(/^([^()=]+)/)[1] : text;
    return (source.match(/[+-]\s*\d+/g) || []).reduce(function (sum, value) {
      return sum + parseInt(value.replace(/\s+/g, ''), 10);
    }, 0);
  }

  function hasPermanentFocusedChakraDebuff() {
    var text = statText('chakraFocused').replace(/[\u2212\u2013\u2014]/g, '-');
    var expression = text.match(/\(([^)]+)\)\s*=\s*-?\d+/);
    var source = expression ? expression[1] : (text.match(/^([^()=]+)/) || [null, ''])[1];
    return /-\s*\d+/.test(source);
  }

  function focusedChakraLimit() {
    var stat = state.character && state.character.stats.chakraFocused;
    if (!stat) return 0;
    return Math.max(0, (Number(stat.max !== undefined ? stat.max : focusedChakraMaximumNumber(stat.text, stat.value)) || 0) + 2 * (statValue('chakra') - baseStatValue('chakra')));
  }

  function focusedChakraAbsoluteLimit() {
    if (!state.character) return 0;
    return Math.max(0, 2 * statValue('chakra') + statValue('fuinjutsu') + focusedChakraModifier());
  }

  function chakraLedger(actions) {
    var general = Math.max(0, combatNumber('general', statValue('chakraTotal')));
    var focused = Math.max(0, combatNumber('focused', statValue('chakraFocused')));
    var limit = focusedChakraLimit();
    var absoluteLimit = focusedChakraAbsoluteLimit();
    var entries = [];
    var cloneGroups = [];
    var attackFocusGranted = false;
    var healingTurn = (actions || state.actions).some(function (action) { return action.techniqueCalculation && action.techniqueCalculation.healing; });
    var concentration = combatRound(statValue('fuinjutsu') * (healingTurn ? 0.5 : 1));
    (actions || state.actions).forEach(function (action) {
      var entry = { generalSpent: 0, generalGained: 0, generalBeforeGain: general, generalAfterGain: general, focusedSpent: 0, focusedGained: 0, transfer: 0 };
      if (action.cloneOperation === 'act') {
        entries.push(applyCloneActorAction(cloneGroups, action));
        cloneGroups = cloneGroups.filter(function (group) { return group.count > 0; });
        return;
      }
      if (action.cloneOperation === 'dismiss') {
        var dismissed = cloneGroups.find(function (group) { return group.id === action.cloneGroupId; });
        if (dismissed && action.cloneCount <= dismissed.count) {
          if (dismissed.returnChakra) {
            entry.generalBeforeGain = general; entry.generalGained = dismissed.general * action.cloneCount;
            general += entry.generalGained; entry.generalAfterGain = general;
            entry.focusedGained = Math.min(Math.max(0, absoluteLimit - focused), dismissed.focused * action.cloneCount); focused += entry.focusedGained;
          }
          dismissed.count -= action.cloneCount;
          cloneGroups = cloneGroups.filter(function (group) { return group.count > 0; });
        }
        entries.push(entry); return;
      }
      if (action.cloneImport) {
        var imported = action.cloneImport;
        var maintainedGeneral = Math.max(0, imported.general - imported.support);
        if (maintainedGeneral > 0 && imported.hp > 0) cloneGroups.push(cloneGroupFromPlan(imported, maintainedGeneral, imported.focused));
        entry.cloneSupport = imported.support * imported.count;
        entries.push(entry); return;
      }
      var spend = combatRound(Math.max(0, action.chakraSpend || 0));
      entry.generalSpent = Math.min(general, spend);
      general -= entry.generalSpent;
      var focusedSpend = combatRound(Math.max(0, action.focusedChakraSpend || 0));
      entry.focusedSpent = Math.min(focused, focusedSpend);
      focused -= entry.focusedSpent;
      if (action.chakraMode === 'rest') {
        entry.focusedGained = Math.min(Math.max(0, absoluteLimit - focused), concentration);
        focused += entry.focusedGained;
      } else if (action.chakraMode === 'battle') {
        entry.transfer = Math.min(general, Math.max(0, absoluteLimit - focused), concentration);
        general -= entry.transfer;
        focused += entry.transfer;
      }
      if (action.attackFocus && !attackFocusGranted) {
        var attackGain = Math.min(1, Math.max(0, absoluteLimit - focused));
        entry.focusedGained += attackGain;
        focused += attackGain;
        entry.attackFocusGranted = true;
        attackFocusGranted = true;
      }
      var gain = combatRound(Math.max(0, Number(action.chakraGain || 0)));
      if (gain) {
        entry.generalBeforeGain = general;
        entry.generalGained = gain;
        general += gain;
        entry.generalAfterGain = general;
      }
      var focusedGain = combatRound(Math.max(0, Number(action.focusedChakraGain || 0)));
      if (focusedGain) {
        var actualFocusedGain = Math.min(focusedGain, Math.max(0, limit - focused));
        entry.focusedGained += actualFocusedGain;
        focused += actualFocusedGain;
      }
      if (action.cloneCreation && !action.cloneCreation.illusory) {
        var created = action.cloneCreation;
        var createdShare = created.divide ? Math.floor(general / (created.count + 1)) : created.general - created.placement;
        if (created.divide) general -= createdShare * created.count;
        var cloneGeneral = createdShare + created.placement;
        entry.cloneAllocated = createdShare * created.count;
        cloneGroups.push(cloneGroupFromPlan(created, cloneGeneral, focused));
      }
      entries.push(entry);
    });
    return { general: general, focused: focused, limit: limit, absoluteLimit: absoluteLimit, entries: entries, cloneGroups: cloneGroups };
  }

  function canSpend(od, ot) {
    var left = remaining();
    return left.od >= od && left.ot >= ot;
  }

  function actionTurnLimitError(action) {
    if (action.oncePerTurnKey && state.actions.some(function (item) { return item.oncePerTurnKey === action.oncePerTurnKey; })) {
      return '\u042d\u0442\u0443 \u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u044c \u043c\u043e\u0436\u043d\u043e \u0430\u043a\u0442\u0438\u0432\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u0442\u043e\u043b\u044c\u043a\u043e \u043e\u0434\u0438\u043d \u0440\u0430\u0437 \u0437\u0430 \u0445\u043e\u0434.';
    }
    if (action.techniqueUseKey && action.techniqueTurnLimit) {
      var used = state.actions.filter(function (item) { return item.techniqueUseKey === action.techniqueUseKey; }).length;
      if (used >= action.techniqueTurnLimit) return '\u042d\u0442\u0443 \u0442\u0435\u0445\u043d\u0438\u043a\u0443 \u043c\u043e\u0436\u043d\u043e \u043f\u0440\u0438\u043c\u0435\u043d\u0438\u0442\u044c \u043d\u0435 \u0431\u043e\u043b\u044c\u0448\u0435 ' + action.techniqueTurnLimit + ' \u0440\u0430\u0437 \u0437\u0430 \u0445\u043e\u0434.';
    }
    return '';
  }

  function rebalanceFullConcentration() {
    if (!state.character) return;
    var spent = 0;
    state.actions.forEach(function (action) {
      if (action.usesAllOd) action.od = Math.max(0, actionTotal('ordinary') - spent);
      spent += action.od || 0;
    });
  }

  function repeatedDodgePenalty() {
    var tactics = statValue('strategy');
    if (tactics <= 4) return 4;
    if (tactics <= 6) return 3;
    if (tactics <= 8) return 2;
    return 1;
  }

  function rebalanceSequentialRules() {
    var dodgeCount = 0;
    var unarmedCount = 0;
    state.actions.forEach(function (action) {
      if (action.ruleType === 'dodge') {
        var dodgePenalty = repeatedDodgePenalty() * dodgeCount;
        var dodgeValue = (action.dodgeModifier !== undefined ? statValue('dodge') + action.dodgeModifier : action.baseCheck) - dodgePenalty;
        action.summary = '\u0423\u043a\u043b\u043e\u043d\u0435\u043d\u0438\u0435 ' + dodgeValue + (dodgePenalty ? ' (\u043f\u043e\u0432\u0442\u043e\u0440\u043d\u043e\u0435: \u2212' + dodgePenalty + ')' : '');
        action.code = '\u0423\u043a\u043b\u043e\u043d\u0435\u043d\u0438\u0435: ' + dodgeValue + (dodgePenalty ? '; \u0448\u0442\u0440\u0430\u0444 \u043f\u043e\u0432\u0442\u043e\u0440\u043d\u043e\u0433\u043e \u0443\u043a\u043b\u043e\u043d\u0435\u043d\u0438\u044f: \u2212' + dodgePenalty : '') + (action.ruleSuffix || '');
        dodgeCount += 1;
      }
      if (action.ruleType === 'unarmedAttack') {
        var sequencePenalty = statValue('speed') >= 8 ? unarmedCount : 0;
        action.summary = action.baseSummary + (sequencePenalty ? ', \u0443\u043a\u043b\u043e\u043d\u0435\u043d\u0438\u0435 \u0446\u0435\u043b\u0438 \u2212' + sequencePenalty : '');
        action.code = action.baseCode + (sequencePenalty ? '; \u043f\u043e\u0441\u043b\u0435\u0434\u043e\u0432\u0430\u0442\u0435\u043b\u044c\u043d\u0430\u044f \u0440\u0443\u043a\u043e\u043f\u0430\u0448\u043d\u0430\u044f \u0430\u0442\u0430\u043a\u0430: \u2212' + sequencePenalty + ' \u043a \u0443\u043a\u043b\u043e\u043d\u0435\u043d\u0438\u044e \u0446\u0435\u043b\u0438' : '');
        unarmedCount += 1;
      }
    });
  }

  function rebalanceActions() {
    rebalanceFullConcentration();
    updateArtifactActionChecks();
    updateTurnEnhancementDamage();
    rebalanceSequentialRules();
    var combat = combatState();
    if (combat && !combat.firstTurn) {
      combat.activeEffects = state.actions.filter(function (action) { return action.startActiveEffect && action.activeEffectKey; }).map(function (action) { return action.activeEffectKey; }).filter(function (key, index, all) { return all.indexOf(key) === index; });
    }
  }

  function addAction(action) {
    if (!state.character) return false;
    if (state.actorScope && state.actorScope.noTechniques && (action.techniqueUseKey || action.cloneCreation)) { setBuilderMessage('\u041f\u043e \u043f\u0440\u0430\u0432\u0438\u043b\u0430\u043c \u044d\u0442\u043e\u0439 \u0442\u0435\u0445\u043d\u0438\u043a\u0438 \u043a\u043b\u043e\u043d \u043d\u0435 \u043c\u043e\u0436\u0435\u0442 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u044c \u0442\u0435\u0445\u043d\u0438\u043a\u0438.', 'error'); return false; }
    var combat = combatState();
    if (combat.hp === '' || !isFinite(Number(combat.hp))) {
      setBuilderMessage('\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0442\u0435\u043a\u0443\u0449\u0435\u0435 HP \u043d\u0430 \u043d\u0430\u0447\u0430\u043b\u043e \u0445\u043e\u0434\u0430.', 'error');
      return false;
    }
    var turnLimitError = actionTurnLimitError(action);
    if (turnLimitError) {
      setBuilderMessage(turnLimitError, 'error');
      return false;
    }
    if (action.enhancementType && !enhancementAvailable(action.enhancementType)) {
      setBuilderMessage('\u042d\u0442\u043e\u0442 \u0432\u0438\u0434 \u0443\u0441\u0438\u043b\u0435\u043d\u0438\u044f \u043c\u043e\u0436\u043d\u043e \u043f\u0440\u0438\u043c\u0435\u043d\u044f\u0442\u044c \u043d\u0435 \u0447\u0430\u0449\u0435 \u043e\u0434\u043d\u043e\u0433\u043e \u0440\u0430\u0437\u0430 \u0432 \u0442\u0440\u0438 \u0445\u043e\u0434\u0430.', 'error');
      return false;
    }
    if (isImmobilized() && (action.ruleType === 'dodge' || action.ruleType === 'movement')) {
      setBuilderMessage('\u041f\u0435\u0440\u0441\u043e\u043d\u0430\u0436 \u043e\u0431\u0435\u0437\u0434\u0432\u0438\u0436\u0435\u043d: \u043f\u0435\u0440\u0435\u0434\u0432\u0438\u0436\u0435\u043d\u0438\u0435 \u0438 \u0443\u043a\u043b\u043e\u043d\u0435\u043d\u0438\u0435 \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u043d\u044b.', 'error');
      return false;
    }
    if (!canSpend(action.od, action.ot)) {
      setBuilderMessage('\u041d\u0435\u0434\u043e\u0441\u0442\u0430\u0442\u043e\u0447\u043d\u043e \u043e\u0447\u043a\u043e\u0432 \u0434\u043b\u044f \u044d\u0442\u043e\u0433\u043e \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044f.', 'error');
      return false;
    }
    var chakra = chakraLedger();
    if (action.cloneOperation) {
      var activeGroup = chakra.cloneGroups.find(function (group) { return group.id === action.cloneGroupId; });
      if (!activeGroup || !Number.isSafeInteger(action.cloneCount) || action.cloneCount < 1 || action.cloneCount > activeGroup.count) { setBuilderMessage('\u0423\u043a\u0430\u0437\u0430\u043d\u043d\u0430\u044f \u0433\u0440\u0443\u043f\u043f\u0430 \u0438\u043b\u0438 \u043a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e \u043a\u043b\u043e\u043d\u043e\u0432 \u0431\u043e\u043b\u044c\u0448\u0435 \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u043d\u044b.', 'error'); return false; }
    }
    if ((action.chakraSpend || 0) > chakra.general) {
      setBuilderMessage('\u041d\u0435\u0434\u043e\u0441\u0442\u0430\u0442\u043e\u0447\u043d\u043e \u0447\u0430\u043a\u0440\u044b \u0432 \u043e\u0431\u0449\u0435\u043c \u0437\u0430\u043f\u0430\u0441\u0435.', 'error');
      return false;
    }
    if ((action.focusedChakraSpend || 0) > chakra.focused) {
      setBuilderMessage('\u041d\u0435\u0434\u043e\u0441\u0442\u0430\u0442\u043e\u0447\u043d\u043e \u0441\u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u043e\u0439 \u0447\u0430\u043a\u0440\u044b.', 'error');
      return false;
    }
    if (action.chakraMode === 'rest' && (chakra.focused >= chakra.absoluteLimit || statValue('fuinjutsu') < 1)) {
      setBuilderMessage('\u0414\u043e\u0441\u0442\u0438\u0433\u043d\u0443\u0442 \u0430\u0431\u0441\u043e\u043b\u044e\u0442\u043d\u044b\u0439 \u043f\u0440\u0435\u0434\u0435\u043b \u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u043e\u0439 \u0447\u0430\u043a\u0440\u044b \u0438\u043b\u0438 \u0424\u0443\u0438\u043d\u0434\u0437\u044e\u0446\u0443 \u0440\u0430\u0432\u043d\u043e \u043d\u0443\u043b\u044e.', 'error');
      return false;
    }
    if (action.chakraMode === 'battle' && (chakra.general < 1 || chakra.focused >= chakra.absoluteLimit || statValue('fuinjutsu') < 1)) {
      setBuilderMessage('\u0411\u043e\u0435\u0432\u0430\u044f \u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0430\u0446\u0438\u044f \u0441\u0435\u0439\u0447\u0430\u0441 \u043d\u0435 \u043c\u043e\u0436\u0435\u0442 \u0434\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0447\u0430\u043a\u0440\u0443.', 'error');
      return false;
    }
    var inventory = state.character.inventory || [], existingUsage = inventoryUsage(), requested = {};
    var inventoryAction = action.actorAction || action, inventoryMultiplier = action.actorAction ? action.cloneCount : 1;
    var inventoryError = '';
    (inventoryAction.inventoryUse || []).forEach(function (entry) {
      var item = inventory.find(function (candidate) { return candidate.inventoryId === entry.id; });
      requested[entry.id] = (requested[entry.id] || 0) + entry.count * inventoryMultiplier;
      if (!item || !isFinite(entry.count) || entry.count <= 0 || (existingUsage[entry.id] || 0) + requested[entry.id] > item.quantity) inventoryError = '\u041d\u0435\u0434\u043e\u0441\u0442\u0430\u0442\u043e\u0447\u043d\u043e \u043f\u0440\u0435\u0434\u043c\u0435\u0442\u043e\u0432 \u0432 \u0438\u043d\u0432\u0435\u043d\u0442\u0430\u0440\u0435: ' + (item ? item.name : entry.id);
    });
    if (inventoryError) { setBuilderMessage(inventoryError, 'error'); return false; }
    if (!action.actorAction) action.artifactSnapshot = { disabled: !!(state.actorScope && state.actorScope.noArtifacts), meleeAttack: artifactBonus('meleeAttack'), rangedAttack: artifactBonus('rangedAttack'), dodge: artifactBonus('dodge'), defense: artifactBonus('defense'), critical: artifactBonus('critical') };
    if (!action.actorAction) action.checkSnapshot = { meleeAttack: statValue('meleeAttack'), rangedAttack: statValue('rangedAttack'), dodge: statValue('dodge'), defense: statValue('defense'), ninjutsuAttack: statValue('ninjutsuAttack'), genjutsuAttack: statValue('genjutsuAttack') };
    if (action.checkSnapshot && action.enhancementType) {
      var added = Number(action.enhancementAmount || action.chakraSpend || 0);
      if (action.enhancementType === 'strength') action.checkSnapshot.meleeAttack += added;
      if (action.enhancementType === 'speed') { action.checkSnapshot.rangedAttack += added; action.checkSnapshot.dodge += added; }
      if (action.ruleType === 'dodge' && action.enhancementType === 'speed') action.dodgeModifier = Number(action.dodgeModifier || 0) - added;
    }
    state.actions.push(action);
    rebalanceActions();
    if (state.actorScope && !state.actorScope.simulation) { state.cloneCapturedActions.push(action); return true; }
    renderTurnSetup();
    renderCharacter();
    setBuilderMessage('\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u0434\u043e\u0431\u0430\u0432\u043b\u0435\u043d\u043e.', 'success');
    return true;
  }

  function statText(key) {
    var stat = state.character && state.character.stats[key];
    return stat ? stat.text : '0';
  }

  function statValue(key) {
    var stat = state.character && state.character.stats[key];
    var value = stat ? stat.value : 0;
    var dependencies = { meleeAttack: ['strength', 'taijutsu'], rangedAttack: ['speed', 'taijutsu'], ninjutsuAttack: ['ninjutsu', 'chakra'], genjutsuAttack: ['genjutsu', 'chakra'], dodge: ['speed', 'strategy'], genjutsuDefense: ['genjutsu', 'strategy'], resistance: ['health', 'strength'] }[key] || [];
    if (state.character) dependencies.forEach(function (dependency) {
      var base = state.character.stats[dependency];
      value += statValue(dependency) - (base ? base.value : 0);
    });
    if (state.character) {
      if (key === 'life') value += 20 * (statValue('health') - baseStatValue('health'));
      if (key === 'chakraFocused') value += 2 * (statValue('chakra') - baseStatValue('chakra'));
      if (key === 'chakraTotal') value += 4 * (Math.pow(Math.max(0, statValue('chakra')), 2) - Math.pow(baseStatValue('chakra'), 2));
    }
    var modifierSources = {};
    var actionBonus = state.actions.reduce(function (bonus, action) {
      var abilityBonus = 0;
      if (action.statModifiers && action.statModifiers[key]) {
        if (!action.modifierSourceKey || !modifierSources[action.modifierSourceKey]) {
          abilityBonus = Number(action.statModifiers[key] || 0);
          if (action.expandedStatModifiers || /^(?:ability|technique):/.test(action.modifierSourceKey || '')) dependencies.forEach(function (dependency) { abilityBonus -= Number(action.statModifiers[dependency] || 0); });
          if (action.modifierSourceKey) modifierSources[action.modifierSourceKey] = true;
        }
      }
      return bonus + abilityBonus + (action.sacrificeStat === key ? 2 : 0) + (action.buffKey === key ? Number(action.buffModifier || 0) : 0);
    }, 0);
    var startBonus = state.combat && Array.isArray(state.combat.effects) ? state.combat.effects.reduce(function (bonus, effect) {
      return bonus + (effect && effect.type === 'buff' && effect.stat === key ? Number(effect.modifier || 0) : 0);
    }, 0) : 0;
    var enhancement = key === 'strength' || key === 'speed' ? turnEnhancementAmount(key) : 0;
    var passiveBonus = 0;
    if (hasPassiveAbility('snakeEye')) {
      if (key === 'genjutsuAttack' && statValue('genjutsu') >= 5) passiveBonus += 1;
      if (key === 'genjutsuDefense' && statValue('genjutsu') >= 8) passiveBonus += 2;
    }
    return value + actionBonus + startBonus + artifactBonus(key) + enhancement + passiveBonus;
  }

  function damageModifierValue(key) {
    var modifierSources = {};
    return state.actions.reduce(function (total, action) {
      if (!action.damageModifiers || !action.damageModifiers[key]) return total;
      if (action.modifierSourceKey && modifierSources[action.modifierSourceKey]) return total;
      if (action.modifierSourceKey) modifierSources[action.modifierSourceKey] = true;
      return total + Number(action.damageModifiers[key] || 0);
    }, 0);
  }

  function appendDamageModifier(value, key) {
    var modifier = damageModifierValue(key);
    return clean(value) + (modifier ? ' ' + signedModifier(modifier) : '');
  }

  function damageText(key) {
    var base = statText(key);
    if (key === 'unarmedDamage' && state.character) {
      var strength = state.character.stats.strength;
      var change = 2 * (statValue('strength') - (strength ? strength.value : 0));
      if (change) base = String(Math.max(0, arithmeticExpressionNumber(base, 0) + change));
    }
    return appendDamageModifier(base, key);
  }

  function statLabel(key) {
    return {
      chakra: '\u0427\u0430\u043a\u0440\u0430',
      fuinjutsu: '\u0424\u0443\u0438\u043d\u0434\u0437\u044e\u0446\u0443',
      ninjutsu: '\u041d\u0438\u043d\u0434\u0437\u044e\u0446\u0443',
      genjutsu: '\u0413\u0435\u043d\u0434\u0437\u044e\u0446\u0443',
      taijutsu: '\u0422\u0430\u0439\u0434\u0437\u044e\u0446\u0443',
      strategy: '\u0422\u0430\u043a\u0442\u0438\u043a\u0430',
      speed: '\u0421\u043a\u043e\u0440\u043e\u0441\u0442\u044c',
      strength: '\u0421\u0438\u043b\u0430',
      meleeAttack: '\u0410\u0442\u0430\u043a\u0430 \u0431\u043b\u0438\u0436\u043d\u0438\u0439 \u0431\u043e\u0439',
      rangedAttack: '\u0410\u0442\u0430\u043a\u0430 \u043d\u0430 \u0434\u0438\u0441\u0442\u0430\u043d\u0446\u0438\u0438',
      ninjutsuAttack: '\u0410\u0442\u0430\u043a\u0430 \u041d\u0438\u043d\u0434\u0437\u044e\u0446\u0443',
      genjutsuAttack: '\u0410\u0442\u0430\u043a\u0430 \u0413\u0435\u043d\u0434\u0437\u044e\u0446\u0443',
      dodge: '\u0423\u043a\u043b\u043e\u043d\u0435\u043d\u0438\u0435',
      defense: '\u0417\u0430\u0449\u0438\u0442\u0430',
      knowledge: '\u0417\u043d\u0430\u043d\u0438\u044f',
      life: '\u0416\u0438\u0437\u043d\u044c',
      health: '\u0417\u0434\u043e\u0440\u043e\u0432\u044c\u0435'
    }[key] || key;
  }

  function createCombatState() {
    return {
      firstTurn: true,
      sourceUrl: '',
      maxHp: Math.max(0, statValue('life')),
      hp: Math.max(0, statValue('life')),
      general: Math.max(0, statValue('chakraTotal')),
      focused: Math.max(0, statValue('chakraFocused')),
      cooldowns: { speed: 3, strength: 3, defense: 3, critical: 3 },
      criticalEnabled: false,
      effects: [],
      activeEffects: [],
      preparedReplacement: false,
      counterAttack: false,
      environmentPenalty: 0,
      environmentAbilityReduction: false,
      sacrificeUsed: false,
      sourceMessage: '\u0421\u0442\u0430\u0440\u0442\u043e\u0432\u044b\u0435 \u0437\u043d\u0430\u0447\u0435\u043d\u0438\u044f \u0432\u0437\u044f\u0442\u044b \u0438\u0437 \u043b\u0438\u0447\u043d\u043e\u0433\u043e \u0434\u0435\u043b\u0430.'
    };
  }

  function combatState() {
    if (!state.combat && state.character) state.combat = createCombatState();
    return state.combat;
  }

  function combatNumber(key, fallback) {
    var combat = combatState();
    var value = combat && combat[key];
    return Math.round(value === '' || value === null || value === undefined || !isFinite(Number(value)) ? Number(fallback || 0) : Number(value));
  }

  function combatRound(value) {
    return Math.round(Number(value || 0));
  }

  function unconsciousHpThreshold() {
    return statValue('taijutsu') >= 7 ? -(25 + Math.max(0, statValue('health'))) : 0;
  }

  function turnStartHp() {
    var maximum = Math.max(0, statValue('life'));
    var minimum = unconsciousHpThreshold();
    var current = Math.max(minimum, Math.min(maximum, combatNumber('hp', maximum)));
    if (!combatState().firstTurn && statValue('taijutsu') >= 5 && current > minimum && current < maximum) current = Math.min(maximum, current + 1);
    return combatRound(current);
  }

  function environmentPenaltyData() {
    var combat = combatState();
    var base = Math.max(0, Number(combat && combat.environmentPenalty || 0));
    var reducedByTaijutsu = statValue('taijutsu') >= 8;
    var ignoredByAbility = hasPassiveAbility('byakugan');
    var automaticReduction = hasPassiveAbility('fogChildren') || hasPassiveAbility('snakeEye');
    var reducedByAbility = ignoredByAbility || automaticReduction || !!(combat && combat.environmentAbilityReduction);
    var multiplier = ignoredByAbility ? 0 : (reducedByTaijutsu || reducedByAbility ? 0.5 : 1);
    return { base: base, effective: combatRound(base * multiplier), reduced: multiplier < 1, ignored: ignoredByAbility, reducedByTaijutsu: reducedByTaijutsu, reducedByAbility: reducedByAbility };
  }

  function incomingDamageCalculation(amount, options) {
    options = options || {};
    var taijutsu = statValue('taijutsu');
    var type = options.type || 'technique';
    var damage = combatRound(Math.max(0, Number(amount || 0)));
    var notes = [];
    if (hasPassiveAbility('byakugan') && options.hidden && !options.extraFactors) {
      return { incoming: damage, afterTaijutsu: 0, protection: 0, final: 0, notes: ['\u0411\u044c\u044f\u043a\u0443\u0433\u0430\u043d: \u0441\u043a\u0440\u044b\u0442\u0430\u044f \u0430\u0442\u0430\u043a\u0430, \u0437\u0430\u0441\u0430\u0434\u0430 \u0438\u043b\u0438 \u0430\u0442\u0430\u043a\u0430 \u0432 \u0441\u043f\u0438\u043d\u0443 \u043d\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0443\u0435\u0442'] };
    }
    if (hasPassiveAbility('kaguraEye') && type === 'technique' && options.hidden && !options.extraFactors) {
      return { incoming: damage, afterTaijutsu: 0, protection: 0, final: 0, notes: ['\u0422\u0440\u0435\u0442\u0438\u0439 \u0413\u043b\u0430\u0437 \u041a\u0430\u0433\u0443\u0440\u044b: \u0432\u043d\u0435\u0437\u0430\u043f\u043d\u0430\u044f \u0430\u0442\u0430\u043a\u0430 \u0441 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u0435\u043c \u0447\u0430\u043a\u0440\u044b \u043e\u0431\u043d\u0430\u0440\u0443\u0436\u0435\u043d\u0430'] };
    }
    if (taijutsu >= 8 && type === 'unarmed' && options.hidden && !options.extraFactors) {
      return { incoming: damage, afterTaijutsu: 0, protection: 0, final: 0, notes: ['\u0422\u0430\u0439\u0434\u0437\u044e\u0446\u0443 8: \u0441\u043a\u0440\u044b\u0442\u0430\u044f \u0440\u0443\u043a\u043e\u043f\u0430\u0448\u043d\u0430\u044f \u0430\u0442\u0430\u043a\u0430 \u0431\u0435\u0437 \u0434\u043e\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044c\u043d\u044b\u0445 \u0444\u0430\u043a\u0442\u043e\u0440\u043e\u0432 \u043d\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0443\u0435\u0442'] };
    }
    if (taijutsu >= 9 && type === 'unarmed' && options.critical) {
      var criticalDamage = Math.max(0, Number(options.criticalDamage || 0));
      damage = Math.max(0, damage - criticalDamage);
      notes.push('\u0422\u0430\u0439\u0434\u0437\u044e\u0446\u0443 9: \u043a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u043a\u043e\u043c\u043f\u043e\u043d\u0435\u043d\u0442 \u2212' + combatRound(criticalDamage));
    }
    if (taijutsu >= 9 && ['unarmed', 'weapon', 'ranged'].indexOf(type) !== -1) {
      var reduced = combatRound(damage * 0.1);
      damage = combatRound(damage - reduced);
      notes.push('\u0422\u0430\u0439\u0434\u0437\u044e\u0446\u0443 9: \u0443\u0440\u043e\u043d \u043e\u0431\u044b\u0447\u043d\u043e\u0439 \u0430\u0442\u0430\u043a\u0438 \u0441\u043d\u0438\u0436\u0435\u043d \u043d\u0430 10% (\u2212' + reduced + ')');
    }
    var protection = options.applyProtection ? combatRound(Math.max(0, Number(options.protection || 0))) : 0;
    return { incoming: combatRound(Math.max(0, Number(amount || 0))), afterTaijutsu: damage, protection: protection, final: combatRound(Math.max(0, damage - protection)), notes: notes };
  }

  function healthLedger(actions) {
    var maximum = Math.max(0, statValue('life'));
    var minimum = unconsciousHpThreshold();
    var health = turnStartHp();
    var start = health;
    var entries = [];
    (actions || state.actions).forEach(function (action) {
      var before = health;
      health = combatRound(Math.max(minimum, Math.min(maximum, health + Number(action.hpDelta || 0))));
      entries.push({ before: before, after: health, delta: health - before });
    });
    return { start: start, current: health, max: maximum, minimum: minimum, unconscious: health <= minimum, regenerated: !combatState().firstTurn && statValue('taijutsu') >= 5 && combatNumber('hp', maximum) > minimum && combatNumber('hp', maximum) < maximum, entries: entries };
  }

  function isImmobilized() {
    var combat = combatState();
    if (combat && combat.effects.some(function (effect) { return effect === 'immobilized' || effect && effect.type === 'immobilized'; })) return true;
    return state.actions.some(function (action) { return action.effectType === 'immobilized'; });
  }

  function sacrificeAlreadyUsed() {
    var combat = combatState();
    return !!(combat && combat.sacrificeUsed) || state.actions.some(function (action) { return action.ruleType === 'sacrifice'; });
  }

  function turnEnhancementAmount(type) {
    var action = state.actions.find(function (item) { return item.enhancementType === type; });
    return action ? Number(action.enhancementAmount || action.chakraSpend || 0) : 0;
  }

  function updateTurnEnhancementDamage() {
    state.actions.forEach(function (action) {
      if (!action.turnDamageType) return;
      var damage = action.damageWeapon ? weaponAttackDamage(action.damageWeapon) : damageText('unarmedDamage');
      var strengthBonus = action.turnDamageType === 'strength' ? turnEnhancementAmount('strength') * 10 : 0;
      if (strengthBonus) damage += ' +' + strengthBonus;
      ['code', 'baseCode', 'summary', 'baseSummary'].forEach(function (field) {
        if (!action[field]) return;
        action[field] = action[field].replace(/((?:\u0443\u0440\u043e\u043d \u0431\u0435\u0437 \u043e\u0440\u0443\u0436\u0438\u044f|\u0443\u0440\u043e\u043d \u043e\u0442 \u0430\u0442\u0430\u043a\u0438 \u043e\u0440\u0443\u0436\u0438\u0435\u043c|\u0443\u0440\u043e\u043d)\s*:\s*|, \u0443\u0440\u043e\u043d )([^;]*)/i, function (_, label) { return label + damage; });
      });
    });
  }

  function enhancementTurnsAgo(type) {
    if (state.actions.some(function (action) { return action.enhancementType === type; })) return 0;
    var combat = combatState();
    return Math.max(0, parseInt(combat && combat.cooldowns[type], 10) || 0);
  }

  function enhancementAvailable(type) {
    return enhancementTurnsAgo(type) >= 3;
  }

  function weaponIsThrowing(item) {
    var text = normalize((item.type || '') + ' ' + item.name);
    return /\u0432\u043e\u0437\u043c\u043e\u0436\u043d\u043e\u0441\u0442\u044c \u043c\u0435\u0442\u0430\u043d\u0438\u044f/i.test(item.bonuses || '') || /\u043c\u0435\u0442\u0430\u0442\u0435\u043b\u044c|\u043a\u0443\u043d\u0430\u0439|\u043a\u0443\u043d\u0430\u0438|\u0441\u044e\u0440\u0438\u043a\u0435\u043d|\u0441\u0435\u043d\u0431\u043e\u043d|\u0438\u0433\u043b|\u0444\u0443+\u043c\u0430/.test(text);
  }

  function weaponIsFirearm(item) {
    return /\u043e\u0433\u043d\u0435\u0441\u0442\u0440\u0435\u043b\u044c\u043d/.test(normalize((item && item.type || '') + ' ' + (item && item.category || '')));
  }

  function weaponIsShooting(item) {
    return /\u0441\u0442\u0440\u0435\u043b\u043a\u043e\u0432/.test(normalize((item && item.type || '') + ' ' + (item && item.category || '')));
  }

  function shootingWeaponRules(item) {
    var text = clean((item && item.bonuses || '') + ' ' + (item && item.description || '') + ' ' + (item && item.details || ''));
    var ammoMatch = text.match(/\u0440\u0430\u0441\u0445\u043e\u0434\u043d\u0438\u043a\u0438\s*:\s*([^;]+)/i);
    var perOdMatch = text.match(/\u043a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e\s+\u0432\s+\u043e\u0434\s*:\s*(\d+)/i);
    var parts = ammoMatch ? ammoMatch[1].split(',').map(clean).filter(Boolean) : [];
    var perShot = parts.length && /^\d+$/.test(parts[parts.length - 1]) ? Number(parts.pop()) : 1;
    return { ammoNames: parts, ammoPerShot: Math.max(1, perShot || 1), shotsPerOd: Math.max(1, Number(perOdMatch && perOdMatch[1]) || 1) };
  }

  function shootingAmmoOptions(weapon) {
    var rules = shootingWeaponRules(weapon && weapon.source || weapon);
    return (state.character && state.character.inventory || []).filter(function (item) {
      return rules.ammoNames.some(function (name) { return inventoryName(name) === inventoryName(item.name); });
    });
  }

  function shootingActionCost(count, shotsPerOd) {
    if (!Number.isInteger(count) || count < 1) throw new Error('\u0423\u043a\u0430\u0436\u0438\u0442\u0435 \u0446\u0435\u043b\u043e\u0435 \u043a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e \u0441\u043d\u0430\u0440\u044f\u0434\u043e\u0432 \u043e\u0442 1.');
    return Math.ceil(count / Math.max(1, Number(shotsPerOd) || 1));
  }

  function shootingAmmoDamage(item) {
    var formula = String(item && (item.damage || item.details) || '').replace(/(?:\u0441\u0438\u043b\u0430|\u0441\u0438\u043b\u044b|\u0441\u043a\u043e\u0440\u043e\u0441\u0442\u044c|\u0441\u043a\u043e\u0440\u043e\u0441\u0442\u0438|\u0442\u0430\u043a\u0442\u0438\u043a\u0430|\u0442\u0430\u043a\u0442\u0438\u043a\u0438|\u0442\u0430\u0439\u0434\u0437\u044e(?:\u0446\u0443|\u0442\u0441\u0443)|\u043d\u0438\u043d\u0434\u0437\u044e(?:\u0446\u0443|\u0442\u0441\u0443)|\u0437\u043d\u0430\u043d\u0438\u044f|\u0437\u043d\u0430\u043d\u0438\u0439)/gi, function (label) {
      var normalized = normalizeText(label);
      var key = /\u0441\u0438\u043b/.test(normalized) ? 'strength' : /\u0441\u043a\u043e\u0440/.test(normalized) ? 'speed' : /\u0442\u0430\u043a\u0442\u0438\u043a/.test(normalized) ? 'strategy' : /\u0442\u0430\u0439\u0434\u0437/.test(normalized) ? 'taijutsu' : /\u043d\u0438\u043d\u0434\u0437/.test(normalized) ? 'ninjutsu' : 'knowledge';
      return statValue(key);
    });
    formula = formula.replace(/\u0435\u0434(?:\u0438\u043d\u0438\u0446[\u0430-\u044f]*)?\.?/gi, ' ');
    return String(Math.max(0, combatRound(arithmeticExpressionNumber(formula, 0))));
  }

  function weaponCanMelee(item) {
    if (weaponIsFirearm(item) || weaponIsShooting(item)) return false;
    var type = normalizeText(item && item.type || '');
    if (/\u043c\u0435\u0442\u0430\u0442\u0435\u043b\u044c/.test(type) && !/\u043a\u043e\u043b\u044e\u0449\u0435[-\s]*\u0440\u0435\u0436\u0443\u0449/.test(type)) return false;
    if (/\u043a\u043e\u043b\u044e\u0449\u0435[-\s]*\u0440\u0435\u0436\u0443\u0449/.test(type)) return true;
    var text = normalize((item.type || '') + ' ' + item.name);
    if (/\u043a\u043e\u043b\u044e\u0449|\u0440\u0435\u0436\u0443\u0449|\u043a\u0443\u043d\u0430\u0439|\u043a\u0443\u043d\u0430\u0438|\u0444\u0443+\u043c\u0430.*\u0441\u044e\u0440\u0438\u043a\u0435\u043d/.test(text)) return true;
    return !weaponIsThrowing(item);
  }

  function weaponOptions(mode) {
    var items = (state.character.standardWeapons || []).filter(function (item) {
      if (mode === 'firearm') return weaponIsFirearm(item);
      if (mode === 'shooting') return weaponIsShooting(item);
      return mode === 'ranged' ? !weaponIsFirearm(item) && !weaponIsShooting(item) && item.section !== '\u0414\u043e\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044c\u043d\u043e\u0435 \u043e\u0440\u0443\u0436\u0438\u0435' && weaponIsThrowing(item) : weaponCanMelee(item);
    }).map(function (item) {
      return { kind: 'standard', id: item.inventoryId || item.id, name: item.name, damage: item.damage || item.details || '\u0443\u0440\u043e\u043d \u043d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d', url: item.url || '', source: item };
    });
    if (state.character && !(state.actorScope && state.actorScope.noArtifacts)) {
      state.character.artifacts.forEach(function (item) {
        if (/\u043b\u0438\u0447\u043d\u044b\u0435 \u0432\u0435\u0449\u0438/i.test(item.category || '')) return;
        if (!item.weapon || mode === 'firearm' && !weaponIsFirearm(item) || mode === 'shooting' && !weaponIsShooting(item) || mode === 'ranged' && (weaponIsFirearm(item) || weaponIsShooting(item) || !/\u043c\u0435\u0442\u0430\u0442\u0435\u043b\u044c|\u0434\u0438\u0441\u0442\u0430\u043d\u0446\u0438/i.test(item.text || '')) || mode === 'melee' && (weaponIsFirearm(item) || weaponIsShooting(item))) return;
        items.unshift({ kind: 'artifact', id: item.id, name: item.name, damage: item.damage, url: item.url, source: item });
      });
    }
    return items;
  }

  function optionList(items, placeholder) {
    return '<option value="">' + escapeHtml(placeholder) + '</option>' + items.map(function (item) {
      return '<option value="' + escapeHtml(item.kind + ':' + item.id) + '">' + escapeHtml(item.name + (item.damage ? ' \u2014 ' + item.damage : '')) + '</option>';
    }).join('');
  }

  function findWeapon(value, mode) {
    return weaponOptions(mode).find(function (item) { return item.kind + ':' + item.id === value; }) || null;
  }

  function isImportedCharacterWeapon(weapon) {
    if (!state.character || !weapon) return false;
    if (weapon.kind === 'artifact') return state.character.artifacts.some(function (item) { return String(item.id) === String(weapon.id); });
    return state.character.standardWeapons.some(function (item) { return String(item.id) === String(weapon.id); });
  }

  function meleeWeaponDamage(weapon) {
    if (!state.character || !weapon) return '';
    return weaponAttackDamage(weapon.damage || '\u0443\u0440\u043e\u043d \u043d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d');
  }

  function elementalWeaponDamageBonus(calculation) {
    var power = Number(calculation && calculation.power);
    return isFinite(power) ? combatRound(power / 2) : 0;
  }

  function weaponAttackDamage(text) {
    var weapon = equipmentDamage(text);
    if (!/\d/.test(weapon)) return weapon;
    var value = arithmeticExpressionNumber(weapon, 0) + 2 * statValue('strength');
    return appendDamageModifier(String(Math.max(0, value)), 'weaponDamage');
  }

  function selectedWeaponVariant(weapon, editor) {
    var select = editor.querySelector('[data-field="weapon-variant"]');
    if (!select) return weapon;
    var index = Number(select.value), damage = String(weapon.damage).split('/')[index];
    var source = Object.assign({}, weapon.source, { critical: String(weapon.source.critical || '').split('/')[index] || weapon.source.critical });
    return Object.assign({}, weapon, { damage: damage, source: source });
  }

  function equipmentDamage(text, withoutTurnEnhancement) {
    return String(text).replace(/(?:\u0441\u0438\u043b\u0430|\u0441\u0438\u043b\u044b|\u0441\u043a\u043e\u0440\u043e\u0441\u0442\u044c|\u0441\u043a\u043e\u0440\u043e\u0441\u0442\u0438|\u0442\u0430\u0439\u0434\u0437\u044e(?:\u0446\u0443|\u0442\u0441\u0443))/gi, function (label) {
      var key = /\u0441\u0438\u043b/i.test(label) ? 'strength' : /\u0441\u043a\u043e\u0440/i.test(label) ? 'speed' : 'taijutsu';
      return statValue(key) - (withoutTurnEnhancement ? turnEnhancementAmount(key) : 0);
    }).replace(/(\d+(?:[.,]\d+)?)\s*(?:\u0435\u0434(?:\u0438\u043d\u0438\u0446[\u0430-\u044f]*)?\.?)?\s*\+\s*(\d+(?:[.,]\d+)?)/gi, function (expression, base, stat) { return expression + ' = ' + (Number(base.replace(',', '.')) + Number(stat.replace(',', '.'))); });
  }

  function artifactModifiers(text) {
    var result = {};
    var labels = { meleeAttack: '\u0430\u0442\u0430\u043a[\u0430\u0435\u0443] (?:\u0432 )?\u0431\u043b\u0438\u0436\u043d[\u0430-\u044f]* \u0431\u043e[\u0439\u044e]', rangedAttack: '\u0430\u0442\u0430\u043a[\u0430\u0435\u0443] (?:\u0432 )?(?:\u0434\u0430\u043b\u044c\u043d[\u0430-\u044f]* \u0431\u043e[\u0439\u044e]|\u043d\u0430 \u0434\u0438\u0441\u0442\u0430\u043d\u0446\u0438\u0438|\u043c\u0435\u0442\u0430\u0442\u0435\u043b\u044c\u043d\u044b\u043c \u043e\u0440\u0443\u0436\u0438\u0435\u043c)', dodge: '\u0443\u043a\u043b\u043e\u043d\u0435\u043d\u0438[\u0430-\u044f]*', defense: '\u0437\u0430\u0449\u0438\u0442[\u0430\u0435\u0443]', strength: '\u0441\u0438\u043b[\u0430\u0435\u0443]', speed: '\u0441\u043a\u043e\u0440\u043e\u0441\u0442[\u044c\u0438]', strategy: '\u0442\u0430\u043a\u0442\u0438\u043a[\u0430\u0435\u0443]', critical: '(?:\u0448\u0430\u043d\u0441\u0443 )?\u043a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a[\u0430-\u044f]* (?:\u0443\u0434\u0430\u0440[\u0430-\u044f]*|\u043f\u043e\u043f\u0430\u0434\u0430\u043d\u0438[\u0430-\u044f]*)' };
    Object.assign(labels, { ninjutsu: '\u043d\u0438\u043d\u0434\u0437\u044e(?:\u0446\u0443|\u0442\u0441\u0443)', genjutsu: '\u0433\u0435\u043d\u0434\u0437\u044e(?:\u0446\u0443|\u0442\u0441\u0443)', taijutsu: '\u0442\u0430\u0439\u0434\u0437\u044e(?:\u0446\u0443|\u0442\u0441\u0443)', fuinjutsu: '\u0444\u0443\u0438\u043d\u0434\u0437\u044e(?:\u0446\u0443|\u0442\u0441\u0443)', chakra: '\u0447\u0430\u043a\u0440[\u0430\u0435\u0443]', health: '\u0437\u0434\u043e\u0440\u043e\u0432\u044c[\u044e\u044f\u0435]', knowledge: '\u0437\u043d\u0430\u043d\u0438[\u044f\u044e\u044f\u043c]' });
    Object.keys(labels).forEach(function (key) {
      var expression = new RegExp('([+-])\\s*(\\d+(?:[.,]\\d+)?)\\s*%?\\s*(?:\u043a|\u043a\u043e)\\s+' + labels[key], 'gi'), match;
      while ((match = expression.exec(text))) result[key] = (result[key] || 0) + (match[1] === '-' ? -1 : 1) * Number(match[2].replace(',', '.'));
    });
    return result;
  }

  function parseArtifactEffects(artifact, content) {
    var text = clean(content.textContent), notes = labeledValue(text, '\u041f\u0440\u0438\u043c\u0435\u0447\u0430\u043d\u0438\u0435', ['\u041f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u0438', '\u041a\u043e\u0434 \u0434\u043b\u044f \u0432\u0441\u0442\u0430\u0432\u043a\u0438']);
    artifact.text = text;
    var defense = notes.match(/\u0437\u0430\u0449\u0438\u0442[\u0430\u0443] (?:\u0432 \u0440\u0430\u0437\u043c\u0435\u0440\u0435|\u0441\u043e\u0441\u0442\u0430\u0432\u043b\u044f\u0435\u0442)\s*(\d+)/i);
    artifact.defense = defense ? defense[1] : '';
    artifact.critical = labeledValue(text, '\u041a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u0443\u0440\u043e\u043d', ['\u041c\u0430\u0442\u0435\u0440\u0438\u0430\u043b', '\u041e\u043f\u0438\u0441\u0430\u043d\u0438\u0435']);
    artifact.passive = {}; artifact.effects = [];
    notes.split(/[\u25cf\u2022]/).map(clean).filter(Boolean).forEach(function (part) {
      var slash = part.match(/(?:\u0440\u0430\u0441\u0445\u043e\u0434\u0443\u0435\u0442|\u0440\u0430\u0441\u0445\u043e\u0434\s+\u0447\u0430\u043a\u0440\u044b)\s*:?\s*(\d+)\s*\/\/\s*(\d+)/i);
      var chakra = part.match(/(?:\u0440\u0430\u0441\u0445\u043e\u0434\s+\u0447\u0430\u043a\u0440\u044b|\u0440\u0430\u0441\u0445\u043e\u0434\u0443\u0435\u0442|\u0442\u0440\u0430\u0442\u0438\u0442)\s*:?\s*(\d+(?:[.,]\d+)?)\s*(?:\u0435\u0434(?:\u0438\u043d\u0438\u0446[\u0430-\u044f]*)?\.?\s*\u0447\u0430\u043a\u0440\u044b|\u0447\u0430\u043a\u0440\u044b|\u0435\u0434\.?)/i);
      var ordinary = part.match(/(?:\u0442\u0440\u0430\u0442\u0438\u0442|\u0440\u0430\u0441\u0445\u043e\u0434\u0443\u0435\u0442)\s*(\d+)\s*(?:\u043e\u0431\u0449\u0435\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435|\u041e\u0414)/i);
      var modifiers = artifactModifiers(part);
      if (slash || chakra || ordinary) {
        artifact.effects.push({ description: part, focused: slash ? Number(slash[1]) : 0, general: slash ? Number(slash[2]) : chakra ? Number(chakra[1].replace(',', '.')) : 0,
          od: ordinary ? Number(ordinary[1]) : 1, modifiers: modifiers, choices: /\u0432 \u0437\u0430\u0432\u0438\u0441\u0438\u043c\u043e\u0441\u0442\u0438 \u043e\u0442/.test(part) });
      } else if (/\u043f\u0430\u0441\u0441\u0438\u0432\u043d\u044b\u0439 \u044d\u0444\u0444\u0435\u043a\u0442\s*:/i.test(part)) Object.keys(modifiers).forEach(function (key) { artifact.passive[key] = (artifact.passive[key] || 0) + modifiers[key]; });
    });
    artifact.description = notes || artifact.description;
    artifact.passiveEnabled = artifact.passiveEnabled !== false;
    artifact.detailLoaded = true;
  }

  function artifactBonus(key) {
    if (state.actorScope && state.actorScope.noArtifacts) return 0;
    return (state.character && state.character.artifacts || []).reduce(function (sum, artifact) { return sum + (artifact.passiveEnabled !== false ? Number((artifact.passive || {})[key] || 0) : 0); }, 0);
  }

  function criticalNote(item) {
    if (!combatState().criticalEnabled) return '';
    var base = statValue('baseCritical'), bonus = statValue('critical');
    return (item.critical ? '; \u043a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u0443\u0440\u043e\u043d \u043e\u0440\u0443\u0436\u0438\u044f: ' + equipmentDamage(item.critical) : '') + '; \u0431\u0430\u0437\u043e\u0432\u044b\u0439 \u0448\u0430\u043d\u0441 \u043a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u043e\u0433\u043e \u043f\u043e\u043f\u0430\u0434\u0430\u043d\u0438\u044f: ' + base + '% + ' + bonus + '%';
  }

  function criticalPercent(text) {
    var match = clean(text).match(/(?:\u0432\u0435\u0440\u043e\u044f\u0442\u043d\u043e\u0441\u0442[\u044c\u0438]|\u0448\u0430\u043d\u0441[\u0430\u0443]?|\u043a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a[\u0430-\u044f]*\s+\u043f\u043e\u043f\u0430\u0434\u0430\u043d\u0438[\u0430-\u044f]*)[^%\d]{0,30}(\d+(?:[.,]\d+)?)\s*%/i);
    return match ? Number(match[1].replace(',', '.')) : 0;
  }

  function currentCriticalChakraBoost() {
    var action = state.actions.find(function (item) { return item.criticalChakraBoost; });
    return action ? Number(action.criticalChakraBoost) * 10 : 0;
  }

  function criticalPointChance(chance) {
    var taijutsu = statValue('taijutsu'), divisor = taijutsu >= 10 ? 2 : taijutsu >= 9 ? 3 : taijutsu >= 8 ? 4 : 0;
    return divisor && chance > 0 ? Math.max(1, Math.floor(chance / divisor)) : 0;
  }

  function criticalAttackData(type, source, detail, damage, count, conditions) {
    if (!combatState().criticalEnabled) return null;
    var taijutsu = statValue('taijutsu'), ninjutsu = statValue('ninjutsu');
    var techniqueText = detail ? Object.keys(detail).map(function (key) { return typeof detail[key] === 'string' ? detail[key] : ''; }).join(' ') : '';
    var isTaijutsuTechnique = type === 'technique' && /\u0442\u0430\u0439\u0434\u0437\u044e(?:\u0446\u0443|\u0442\u0441\u0443)/i.test(techniqueText);
    var eligible = type === 'unarmed' ? taijutsu >= 5 : type === 'weapon' ? taijutsu >= 6 : type === 'technique' ? (isTaijutsuTechnique ? taijutsu >= 5 : ninjutsu >= 7) : false;
    if (!eligible) return { eligible: false, reason: type === 'weapon' ? '\u0434\u043b\u044f \u043a\u0440\u0438\u0442\u0430 \u043e\u0440\u0443\u0436\u0438\u0435\u043c \u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044f \u0422\u0430\u0439\u0434\u0437\u044e\u0446\u0443 6' : type === 'unarmed' || isTaijutsuTechnique ? '\u0434\u043b\u044f \u044d\u0442\u043e\u0433\u043e \u043a\u0440\u0438\u0442\u0430 \u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044f \u0422\u0430\u0439\u0434\u0437\u044e\u0446\u0443 5' : '\u0434\u043b\u044f \u043a\u0440\u0438\u0442\u0430 \u0442\u0435\u0445\u043d\u0438\u043a\u043e\u0439 \u041d\u0438\u043d\u0434\u0437\u044e\u0446\u0443 \u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044f \u041d\u0438\u043d\u0434\u0437\u044e\u0446\u0443 7' };
    var base = Math.max(0, statValue('baseCritical'));
    var effects = Math.max(0, statValue('critical'));
    var chakra = currentCriticalChakraBoost();
    var sourceChance = type === 'weapon' ? criticalPercent(source && source.critical) : type === 'technique' ? criticalPercent(techniqueText) : 0;
    var chance = Math.max(0, Math.min(100, base + effects + chakra + sourceChance));
    if (!chance) return { eligible: true, chance: 0, reason: '\u0448\u0430\u043d\u0441 \u043a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u043e\u0433\u043e \u043f\u043e\u043f\u0430\u0434\u0430\u043d\u0438\u044f \u0440\u0430\u0432\u0435\u043d 0%' };
    var normalDamage = Math.max(0, arithmeticExpressionNumber(String(damage || 0), Number(damage) || 0));
    var criticalDamage;
    if (type === 'weapon') {
      var explicit = clean(source && source.critical).replace(/\([^)]*(?:\u0432\u0435\u0440\u043e\u044f\u0442\u043d\u043e\u0441\u0442|\u0448\u0430\u043d\u0441)[^)]*\)/gi, '');
      var extra = explicit && /\d/.test(explicit) ? arithmeticExpressionNumber(equipmentDamage(explicit), 0) : 0;
      criticalDamage = extra > 0 ? combatRound(normalDamage + extra) : combatRound(normalDamage * 1.5);
    } else if (type === 'unarmed') criticalDamage = combatRound(normalDamage * (taijutsu >= 8 ? 2 : 1.5));
    else {
      var ownFormula = techniqueText.match(/\u043a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a[\u0430-\u044f]*\s+\u0443\u0440\u043e\u043d[^\d]{0,20}(\d+(?:[.,]\d+)?)\s*%/i);
      var ownMultiplier = techniqueText.match(/\u043a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a[\u0430-\u044f]*\s+\u0443\u0440\u043e\u043d[^\u00d7x\u0445\d]{0,20}[\u00d7x\u0445]\s*(\d+(?:[.,]\d+)?)/i);
      criticalDamage = ownFormula ? combatRound(normalDamage * Number(ownFormula[1].replace(',', '.')) / 100) : ownMultiplier ? combatRound(normalDamage * Number(ownMultiplier[1].replace(',', '.'))) : combatRound(normalDamage * 1.5);
    }
    var pointAllowed = taijutsu >= 8 && (type === 'weapon' || isTaijutsuTechnique);
    var point = pointAllowed && conditions && conditions.criticalPointTarget ? criticalPointChance(chance) : 0;
    return { eligible: true, chance: chance, threshold: 101 - chance, criticalDamage: criticalDamage, count: Math.max(1, Number(count) || 1), pointChance: point, pointThreshold: point ? 101 - point : 0, target: conditions && conditions.criticalPointTarget || '', base: base, effects: effects, chakra: chakra, sourceChance: sourceChance };
  }

  var CRITICAL_DICE_MARKER = '__ABA_NATIVE_CRITICAL_DICE__';

  function attachCriticalAction(action, type, source, detail, damage, count, conditions) {
    var critical = criticalAttackData(type, source, detail, damage, count, conditions);
    action.criticalData = critical;
    if (!critical) return action;
    if (!critical.eligible || !critical.chance) {
      action.code += '; \u043a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u0443\u0440\u043e\u043d \u043d\u0435 \u0440\u0430\u0441\u0441\u0447\u0438\u0442\u044b\u0432\u0430\u0435\u0442\u0441\u044f: ' + critical.reason;
      return action;
    }
    var sources = ['\u0431\u0430\u0437\u043e\u0432\u044b\u0439 ' + critical.base + '%'];
    if (critical.effects) sources.push('\u044d\u0444\u0444\u0435\u043a\u0442\u044b +' + critical.effects + '%');
    if (critical.chakra) sources.push('\u0447\u0430\u043a\u0440\u0430 +' + critical.chakra + '%');
    if (critical.sourceChance) sources.push('\u0438\u0441\u0442\u043e\u0447\u043d\u0438\u043a \u0430\u0442\u0430\u043a\u0438 +' + critical.sourceChance + '%');
    action.code += '; \u0438\u0442\u043e\u0433\u043e\u0432\u044b\u0439 \u0448\u0430\u043d\u0441 \u043a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u043e\u0433\u043e \u043f\u043e\u043f\u0430\u0434\u0430\u043d\u0438\u044f: ' + critical.chance + '% (' + sources.join('; ') + ')' +
      '; \u0434\u0438\u0430\u043f\u0430\u0437\u043e\u043d \u0443\u0441\u043f\u0435\u0445\u0430 \u043a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u043e\u0433\u043e \u043f\u043e\u043f\u0430\u0434\u0430\u043d\u0438\u044f: ' + critical.threshold + '\u2013100' +
      '; \u043a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u0443\u0440\u043e\u043d: ' + critical.criticalDamage + '; \u0431\u0440\u043e\u0441\u043e\u043a \u043a\u0440\u0438\u0442\u0430: ' + CRITICAL_DICE_MARKER;
    if (critical.pointChance) action.code += '; \u043a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u0430\u044f \u0442\u043e\u0447\u043a\u0430 \u00ab' + critical.target + '\u00bb: \u0438\u0442\u043e\u0433\u043e\u0432\u044b\u0439 \u0448\u0430\u043d\u0441 ' + critical.pointChance + '%; \u0434\u0438\u0430\u043f\u0430\u0437\u043e\u043d \u0443\u0441\u043f\u0435\u0445\u0430 ' + critical.pointThreshold + '\u2013100; \u043f\u043e\u0441\u043b\u0435\u0434\u0441\u0442\u0432\u0438\u0435 \u043e\u043f\u0440\u0435\u0434\u0435\u043b\u044f\u0435\u0442 \u0413\u041c, \u0437\u0430\u0449\u0438\u0442\u0430 \u043e\u0431\u043b\u0430\u0441\u0442\u0438 \u0443\u0447\u0438\u0442\u044b\u0432\u0430\u0435\u0442\u0441\u044f \u043f\u0435\u0440\u0432\u043e\u0439';
    action.summary += ' \u00b7 \u043a\u0440\u0438\u0442 ' + critical.chance + '%';
    return action;
  }

  function updateArtifactActionChecks() {
    var labels = { meleeAttack: '\u0410\u0442\u0430\u043a\u0430 \u0431\u043b\u0438\u0436\u043d\u0438\u0439 \u0431\u043e\u0439', rangedAttack: '\u0410\u0442\u0430\u043a\u0430 \u043d\u0430 \u0434\u0438\u0441\u0442\u0430\u043d\u0446\u0438\u0438', dodge: '\u0423\u043a\u043b\u043e\u043d\u0435\u043d\u0438\u0435', defense: '\u043f\u043e\u0441\u0442\u043e\u044f\u043d\u043d\u0430\u044f \u0437\u0430\u0449\u0438\u0442\u0430', ninjutsuAttack: '\u0410\u0442\u0430\u043a\u0430 \u041d\u0438\u043d\u0434\u0437\u044e\u0446\u0443', genjutsuAttack: '\u0410\u0442\u0430\u043a\u0430 \u0413\u0435\u043d\u0434\u0437\u044e\u0446\u0443' };
    state.actions.forEach(function (wrapper) {
      if (wrapper.actorAction) return;
      var action = wrapper.actorAction || wrapper, snapshot = action.checkSnapshot;
      if (!snapshot) return;
      Object.keys(labels).forEach(function (key) {
        var difference = statValue(key) - snapshot[key];
        if (!difference) return;
        ['code', 'baseCode', 'summary', 'baseSummary'].forEach(function (field) { if (action[field]) action[field] = action[field].replace(new RegExp('(' + labels[key] + '\\s*:?\\s*)(-?\\d+(?:[.,]\\d+)?)', 'gi'), function (_, label, value) { return label + (Number(value.replace(',', '.')) + difference); }); });
        if (key === 'dodge' && action.baseCheck !== undefined) action.baseCheck += difference;
        if (action.artifactCheckKey === key) ['summary', 'baseSummary'].forEach(function (field) { if (action[field]) action[field] = action[field].replace(/((?:\u043f\u0440\u043e\u0432\u0435\u0440\u043a\u0430|\u0430\u0442\u0430\u043a\u0430)\s+)(-?\d+(?:[.,]\d+)?)/i, function (_, label, value) { return label + (Number(value.replace(',', '.')) + difference); }); });
        snapshot[key] = statValue(key);
      });
      if (action.criticalSource) ['code', 'baseCode'].forEach(function (field) {
        if (!action[field]) return;
        action[field] = action[field]
          .replace(/;\s*(?:\u043a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u0443\u0440\u043e\u043d \u043e\u0440\u0443\u0436\u0438\u044f|\u043a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u0443\u0440\u043e\u043d|\u0431\u043e\u043d\u0443\u0441 \u043a \u043a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u043e\u043c\u0443 \u0443\u0434\u0430\u0440\u0443):[^;]*/gi, '')
          .replace(/;\s*\u0431\u0430\u0437\u043e\u0432\u044b\u0439 \u0448\u0430\u043d\u0441 \u043a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u043e\u0433\u043e \u043f\u043e\u043f\u0430\u0434\u0430\u043d\u0438\u044f:[^;]*/gi, '')
          .replace(/;\s*\u0434\u0435\u0439\u0441\u0442\u0432\u0443\u044e\u0449\u0438\u0435 \u043c\u043e\u0434\u0438\u0444\u0438\u043a\u0430\u0442\u043e\u0440\u044b:[^;]*/gi, '') + criticalNote(action.criticalSource);
      });
      snapshot.critical = artifactBonus('critical');
    });
  }

  function renderArtifactEffectEditor(editor) {
    var artifacts = state.character.artifacts.filter(function (item) { return item.effects && item.effects.length; });
    editor.innerHTML = '<h4>\u0418\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u044c \u044d\u0444\u0444\u0435\u043a\u0442 \u0430\u0440\u0442\u0435\u0444\u0430\u043a\u0442\u0430</h4><label>\u042d\u0444\u0444\u0435\u043a\u0442<select data-artifact-effect><option value="">\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u044d\u0444\u0444\u0435\u043a\u0442</option>' + artifacts.map(function (artifact) { return artifact.effects.map(function (effect, index) { return '<option value="' + artifact.inventoryId + ':' + index + '">' + escapeHtml(artifact.name + ' \u2014 ' + effect.description.slice(0,100)) + '</option>'; }).join(''); }).join('') + '</select></label><div class="aba-artifact-effect-info"></div><button type="button" class="aba-primary" data-use-artifact>\u0418\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u044c \u044d\u0444\u0444\u0435\u043a\u0442</button>';
    function selected() { var value = editor.querySelector('[data-artifact-effect]').value.split(':'); var artifact = artifacts.find(function (item) { return item.inventoryId === value[0]; }); return artifact && { artifact: artifact, effect: artifact.effects[Number(value[1])] }; }
    on(editor.querySelector('[data-artifact-effect]'), 'change', function () { var entry = selected(); editor.querySelector('.aba-artifact-effect-info').textContent = entry ? entry.effect.description + ' \u0417\u0430\u0442\u0440\u0430\u0442\u044b: ' + entry.effect.od + ' \u041e\u0414; ' + entry.effect.focused + '/' + entry.effect.general + ' \u0447\u0430\u043a\u0440\u044b.' : '';
      if (entry && entry.effect.choices) editor.querySelector('.aba-artifact-effect-info').innerHTML += '<label>\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u044d\u0444\u0444\u0435\u043a\u0442<select data-artifact-choice>' + Object.keys(entry.effect.modifiers).map(function (key) { return '<option value="' + key + '">' + (key === 'critical' ? '\u041a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u043e\u0435 \u043f\u043e\u043f\u0430\u0434\u0430\u043d\u0438\u0435' : statLabel(key)) + ' +' + entry.effect.modifiers[key] + '</option>'; }).join('') + '</select></label>';
    });
    on(editor.querySelector('[data-use-artifact]'), 'click', function () {
      var entry = selected(); if (!entry) return setBuilderMessage('\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u044d\u0444\u0444\u0435\u043a\u0442 \u0430\u0440\u0442\u0435\u0444\u0430\u043a\u0442\u0430.', 'error');
      var modifiers = entry.effect.modifiers, choice = editor.querySelector('[data-artifact-choice]');
      if (entry.effect.choices && choice) { modifiers = {}; modifiers[choice.value] = entry.effect.modifiers[choice.value]; }
      addAction({ label: '\u042d\u0444\u0444\u0435\u043a\u0442 \u0430\u0440\u0442\u0435\u0444\u0430\u043a\u0442\u0430', summary: entry.artifact.name, code: '[url=' + entry.artifact.url + ']' + entry.artifact.name + '[/url] \u2014 ' + entry.effect.description,
        od: entry.effect.od, ot: 0, chakraSpend: entry.effect.general, focusedChakraSpend: entry.effect.focused, statModifiers: modifiers, modifierSourceKey: 'artifact-effect-' + entry.artifact.inventoryId, attackFocus: /\u0443\u0440\u043e\u043d \u043e\u0442 \u0430\u0442\u0430\u043a\u0438|\u0432\u043e\u0437\u043c\u043e\u0436\u043d\u043e\u0441\u0442\u044c \u0430\u0442\u0430\u043a\u0438/i.test(entry.effect.description) });
    });
  }

  function enhanceFields(target, customLabel) {
    if (statValue('fuinjutsu') < 6) return '<p class="aba-note">\u0423\u0441\u0438\u043b\u0435\u043d\u0438\u0435 \u0447\u0430\u043a\u0440\u043e\u0439 \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u043d\u043e: \u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044f \u0424\u0443\u0438\u043d\u0434\u0437\u044e\u0446\u0443 6.</p>';
    var labels = {
      speed: '\u0423\u0441\u043a\u043e\u0440\u0435\u043d\u0438\u0435',
      strength: '\u0423\u0432\u0435\u043b\u0438\u0447\u0435\u043d\u0438\u0435 \u0441\u0438\u043b\u044b',
      defense: '\u0423\u0432\u0435\u043b\u0438\u0447\u0435\u043d\u0438\u0435 \u0437\u0430\u0449\u0438\u0442\u044b',
      stability: '\u0423\u0441\u0442\u043e\u0439\u0447\u0438\u0432\u043e\u0441\u0442\u044c / \u043f\u0440\u044b\u0433\u0443\u0447\u0435\u0441\u0442\u044c'
    };
    var selected = target || 'strength';
    var available = enhancementAvailable(selected);
    var displayLabel = customLabel || labels[selected];
    return '<label class="aba-check aba-enhance-toggle"><input type="checkbox" data-field="enhance"' + (available ? '' : ' disabled') + '><span>' + displayLabel + ' \u0447\u0430\u043a\u0440\u043e\u0439' + (available ? '' : (turnEnhancementAmount(selected) ? ' \u2014 \u0430\u043a\u0442\u0438\u0432\u043d\u043e \u043d\u0430 \u0432\u0435\u0441\u044c \u0445\u043e\u0434' : ' \u2014 \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u043d\u043e, \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u043e ' + enhancementTurnsAgo(selected) + ' \u0445\u043e\u0434(\u0430) \u043d\u0430\u0437\u0430\u0434')) + '</span></label>' +
      '<div class="aba-enhance-fields" hidden><input type="hidden" data-field="enhance-target" value="' + selected + '"><div class="aba-enhance-kind"><small>\u0412\u0438\u0434 \u0443\u0441\u0438\u043b\u0435\u043d\u0438\u044f</small><strong>' + labels[selected] + '</strong></div>' +
      '<label>\u0427\u0430\u043a\u0440\u0430<select data-field="enhance-chakra"><option>1</option><option>2</option><option>3</option></select></label><p class="aba-note">\u041c\u043e\u0436\u043d\u043e \u043f\u0440\u0438\u043c\u0435\u043d\u044f\u0442\u044c \u043d\u0435 \u0447\u0430\u0449\u0435 \u043e\u0434\u043d\u043e\u0433\u043e \u0440\u0430\u0437\u0430 \u0432 \u0442\u0440\u0438 \u0445\u043e\u0434\u0430.</p></div>';
  }

  function enhancementData(container, context, weapon) {
    var enabled = !!(container.querySelector('[data-field="enhance"]') || {}).checked;
    if (!enabled) return { enabled: false, chakra: 0, check: 0, damage: 0, defense: 0, text: '' };
    var chakra = parseInt(container.querySelector('[data-field="enhance-chakra"]').value, 10) || 1;
    var target = container.querySelector('[data-field="enhance-target"]').value;
    var check = 0;
    var damage = 0;
    var defense = 0;
    var text = '';
    if (target === 'speed') {
      check = /ranged|dodge/.test(context || '') ? chakra : 0;
      var speedMultiplier = /attack/.test(context || '') ? weaponStatMultiplier(weapon, '\u0441\u043a\u043e\u0440\u043e\u0441\u0442\u044c') : 0;
      damage = speedMultiplier * chakra;
      text = '\u0443\u0441\u043a\u043e\u0440\u0435\u043d\u0438\u0435: \u0421\u043a\u043e\u0440\u043e\u0441\u0442\u044c ' + statValue('speed') + ' +' + chakra + ' = ' + (statValue('speed') + chakra);
      if (speedMultiplier) text += ', \u0443\u0440\u043e\u043d \u043e\u0440\u0443\u0436\u0438\u044f +' + damage;
    } else if (target === 'strength') {
      check = /melee|defense/.test(context || '') ? chakra : 0;
      damage = /attack/.test(context || '') ? chakra * 10 : 0;
      text = '\u0443\u0432\u0435\u043b\u0438\u0447\u0435\u043d\u0438\u0435 \u0441\u0438\u043b\u044b: \u0421\u0438\u043b\u0430 ' + statValue('strength') + ' +' + chakra + ' = ' + (statValue('strength') + chakra);
      if (damage) text += ', \u0443\u0440\u043e\u043d +' + damage;
    } else if (target === 'defense') {
      defense = chakra * 10;
      text = '\u0443\u0441\u0438\u043b\u0435\u043d\u0438\u0435 \u0437\u0430\u0449\u0438\u0442\u044b: \u0417\u0430\u0449\u0438\u0442\u0430 ' + statValue('defense') + ' +' + defense + ' = ' + (statValue('defense') + defense);
    } else {
      text = '\u0443\u0441\u0438\u043b\u0435\u043d\u0438\u0435 \u0443\u0441\u0442\u043e\u0439\u0447\u0438\u0432\u043e\u0441\u0442\u0438 / \u043f\u0440\u044b\u0433\u0443\u0447\u0435\u0441\u0442\u0438, \u0432\u043b\u043e\u0436\u0435\u043d\u043e \u0447\u0430\u043a\u0440\u044b: ' + chakra + '; \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442 \u043e\u043f\u0440\u0435\u0434\u0435\u043b\u044f\u0435\u0442 \u0413\u041c \u043f\u043e \u0441\u0438\u0442\u0443\u0430\u0446\u0438\u0438';
    }
    return {
      enabled: true,
      chakra: chakra,
      type: target,
      check: check,
      damage: damage,
      defense: defense,
      text: text + '; \u0440\u0430\u0441\u0445\u043e\u0434 \u043e\u0431\u0449\u0435\u0433\u043e \u0437\u0430\u043f\u0430\u0441\u0430 \u0447\u0430\u043a\u0440\u044b: ' + chakra
    };
  }

  function weaponStatMultiplier(weapon, statName) {
    if (!weapon) return 0;
    var text = clean(weapon.damage).toLocaleLowerCase('ru').replace(/\u0451/g, '\u0435').replace(/[\u00d7\u0445]/g, '*');
    var stat = statName.toLocaleLowerCase('ru').replace(/\u0451/g, '\u0435');
    if (text.indexOf(stat) === -1) return 0;
    var after = text.match(new RegExp(stat + '\\s*\\*\\s*(\\d+)', 'i'));
    var before = text.match(new RegExp('(\\d+)\\s*\\*\\s*' + stat, 'i'));
    return parseInt((after && after[1]) || (before && before[1]) || '1', 10);
  }

  function attackContextFields(allowLongDistance) {
    return '<div class="aba-condition-grid">' +
      '<label class="aba-check"><input type="checkbox" data-field="surprise-attack"><span>\u0421\u043a\u0440\u044b\u0442\u0430\u044f \u0430\u0442\u0430\u043a\u0430: +3 \u043a \u0442\u043e\u0447\u043d\u043e\u0441\u0442\u0438</span></label>' +
      '<label class="aba-check"><input type="checkbox" data-field="joint-attack"><span>\u0421\u043e\u0432\u043c\u0435\u0441\u0442\u043d\u0430\u044f \u0430\u0442\u0430\u043a\u0430: \u22121 \u043a \u0443\u043a\u043b\u043e\u043d\u0435\u043d\u0438\u044e \u0446\u0435\u043b\u0438</span></label>' +
      (allowLongDistance ? '<label class="aba-check"><input type="checkbox" data-field="long-distance"><span>\u0414\u0430\u043b\u044c\u043d\u044f\u044f \u0434\u0438\u0441\u0442\u0430\u043d\u0446\u0438\u044f: \u22122 \u043a \u0442\u043e\u0447\u043d\u043e\u0441\u0442\u0438</span></label>' : '') +
      '<label class="aba-check"><input type="checkbox" data-field="back-attack"><span>\u0410\u0442\u0430\u043a\u0430 \u0432 \u0441\u043f\u0438\u043d\u0443: \u22122 \u043a \u0443\u043a\u043b\u043e\u043d\u0435\u043d\u0438\u044e \u0446\u0435\u043b\u0438</span></label>' +
      (hasPassiveAbility('kaguraEye') ? '<label class="aba-check"><input type="checkbox" data-field="kagura-visible-chakra"><span>\u0422\u0440\u0435\u0442\u0438\u0439 \u0413\u043b\u0430\u0437 \u041a\u0430\u0433\u0443\u0440\u044b: \u0446\u0435\u043b\u044c \u043d\u0435 \u0441\u043a\u0440\u044b\u0432\u0430\u0435\u0442 \u0447\u0430\u043a\u0440\u0443 (+1 \u043a \u0442\u043e\u0447\u043d\u043e\u0441\u0442\u0438)</span></label>' : '') +
      (statValue('taijutsu') >= 8 ? '<label class="aba-check"><input type="checkbox" data-field="critical-point"><span>\u0426\u0435\u043b\u0438\u0442\u044c\u0441\u044f \u0432 \u043a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u0443\u044e \u0442\u043e\u0447\u043a\u0443</span></label><label>\u041a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u0430\u044f \u0442\u043e\u0447\u043a\u0430 / \u043e\u0431\u043b\u0430\u0441\u0442\u044c \u0442\u0435\u043b\u0430<input type="text" data-field="critical-point-target" placeholder="\u041d\u0430\u043f\u0440\u0438\u043c\u0435\u0440: \u0448\u0435\u044f, \u043f\u0440\u0430\u0432\u0430\u044f \u0440\u0443\u043a\u0430"></label>' : '') +
      '</div><p class="aba-note">\u0423\u0441\u043b\u043e\u0432\u0438\u044f \u043f\u0440\u0438\u043c\u0435\u043d\u044f\u044e\u0442\u0441\u044f \u043a \u0438\u0442\u043e\u0433\u043e\u0432\u043e\u0439 \u043f\u0440\u043e\u0432\u0435\u0440\u043a\u0435 \u0430\u0442\u0430\u043a\u0438. \u0422\u043e\u043b\u044c\u043a\u043e \u043f\u0435\u0440\u0432\u043e\u0435 \u0430\u0442\u0430\u043a\u0443\u044e\u0449\u0435\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u0445\u043e\u0434\u0430 \u0434\u043e\u0431\u0430\u0432\u043b\u044f\u0435\u0442 +1 \u043a \u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u043e\u0439 \u0447\u0430\u043a\u0440\u0435.</p>';
  }

  function modifierBlock(content) {
    if (!content) return '';
    return '<details class="aba-modifiers"><summary>\u041c\u043e\u0434\u0438\u0444\u0438\u043a\u0430\u0442\u043e\u0440\u044b</summary><div class="aba-modifiers-body">' + content + '</div></details>';
  }

  function attackConditionData(container) {
    var surprise = !!((container.querySelector('[data-field="surprise-attack"]') || {}).checked);
    var joint = !!((container.querySelector('[data-field="joint-attack"]') || {}).checked);
    var longDistance = !!((container.querySelector('[data-field="long-distance"]') || {}).checked);
    var back = !!((container.querySelector('[data-field="back-attack"]') || {}).checked);
    var criticalPoint = !!((container.querySelector('[data-field="critical-point"]') || {}).checked);
    var kaguraAccuracy = hasPassiveAbility('kaguraEye') && !!((container.querySelector('[data-field="kagura-visible-chakra"]') || {}).checked);
    var criticalPointTarget = criticalPoint ? clean((container.querySelector('[data-field="critical-point-target"]') || {}).value) : '';
    var environment = environmentPenaltyData();
    var accuracy = (surprise ? 3 : 0) + (kaguraAccuracy ? 1 : 0) - (longDistance ? 2 : 0) - environment.effective;
    var targetDodgePenalty = (joint ? 1 : 0) + (back ? 2 : 0);
    var notes = [];
    if (surprise) notes.push('\u0441\u043a\u0440\u044b\u0442\u0430\u044f \u0430\u0442\u0430\u043a\u0430: +3 \u043a \u0442\u043e\u0447\u043d\u043e\u0441\u0442\u0438');
    if (longDistance) notes.push('\u0434\u0430\u043b\u044c\u043d\u044f\u044f \u0434\u0438\u0441\u0442\u0430\u043d\u0446\u0438\u044f: \u22122 \u043a \u0442\u043e\u0447\u043d\u043e\u0441\u0442\u0438');
    if (joint) notes.push('\u0441\u043e\u0432\u043c\u0435\u0441\u0442\u043d\u0430\u044f \u0430\u0442\u0430\u043a\u0430: \u22121 \u043a \u0443\u043a\u043b\u043e\u043d\u0435\u043d\u0438\u044e \u0446\u0435\u043b\u0438');
    if (back) notes.push('\u0430\u0442\u0430\u043a\u0430 \u0432 \u0441\u043f\u0438\u043d\u0443: \u22122 \u043a \u0443\u043a\u043b\u043e\u043d\u0435\u043d\u0438\u044e \u0446\u0435\u043b\u0438');
    if (kaguraAccuracy) notes.push('\u0422\u0440\u0435\u0442\u0438\u0439 \u0413\u043b\u0430\u0437 \u041a\u0430\u0433\u0443\u0440\u044b: +1 \u043a \u0442\u043e\u0447\u043d\u043e\u0441\u0442\u0438 \u043f\u043e \u0446\u0435\u043b\u0438 \u0441 \u043d\u0435\u0441\u043a\u0440\u044b\u0442\u043e\u0439 \u0447\u0430\u043a\u0440\u043e\u0439');
    if (environment.effective) notes.push('\u043e\u0431\u0441\u0442\u043e\u044f\u0442\u0435\u043b\u044c\u0441\u0442\u0432\u0430 \u043e\u043a\u0440\u0443\u0436\u0435\u043d\u0438\u044f: \u2212' + environment.effective + ' \u043a \u0442\u043e\u0447\u043d\u043e\u0441\u0442\u0438' + (environment.reduced ? ' (\u0448\u0442\u0440\u0430\u0444 \u0441\u043d\u0438\u0436\u0435\u043d \u043d\u0430 50%, \u044d\u0444\u0444\u0435\u043a\u0442\u044b \u043d\u0435 \u0441\u0443\u043c\u043c\u0438\u0440\u0443\u044e\u0442\u0441\u044f)' : ''));
    return { accuracy: accuracy, targetDodgePenalty: targetDodgePenalty, text: notes.join('; '), criticalPointTarget: criticalPointTarget };
  }

  function techniqueChakraCost(value) {
    var text = clean(value).replace(/,/g, '.').replace(/[\u2212\u2013\u2014]/g, '-').toLocaleLowerCase('ru').replace(/\u0451/g, '\u0435');
    var result = { focused: 0, general: 0, activation: 0, support: 0 };
    if (!text) return result;
    var unit = '(?:\u0435\u0434(?:\\.|\u0438\u043d\u0438\u0446[\u0430-\u044f\u0451]*))?';
    var creation = text.match(new RegExp('(\\d+(?:\\.\\d+)?)\\s*' + unit + '\\s*(?:\u043d\u0430\\s+)?(?:\u0441\u043e\u0437\u0434\u0430\u043d\u0438[\u0430-\u044f\u0451]*|\u0430\u043a\u0442\u0438\u0432\u0430\u0446\u0438[\u0430-\u044f\u0451]*)', 'i'));
    var expense = text.match(new RegExp('(\\d+(?:\\.\\d+)?)\\s*' + unit + '\\s*(?:\u043d\u0430\\s+)?(?:\u0440\u0430\u0441\u0445\u043e\u0434[\u0430-\u044f\u0451]*|\u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a[\u0430-\u044f\u0451]*)', 'i'));
    var pair = text.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
    if (pair) {
      result.focused = parseFloat(pair[1]) || 0;
      result.general = parseFloat(pair[2]) || 0;
    } else if (creation || expense) {
      result.focused = creation ? (parseFloat(creation[1]) || 0) : 0;
      result.general = expense ? (parseFloat(expense[1]) || 0) : 0;
    } else {
      var single = text.match(/\d+(?:\.\d+)?/);
      var singleValue = single ? (parseFloat(single[0]) || 0) : 0;
      if (/\u0441\u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d/.test(text)) result.focused = singleValue;
      else result.general = singleValue;
    }
    result.activation = creation ? (parseFloat(creation[1]) || 0) : result.focused;
    result.support = expense ? (parseFloat(expense[1]) || 0) : 0;
    return result;
  }

  function supportChakraCost(detail) {
    var text = clean(detail && detail.support).replace(/,/g, '.');
    var match = text.match(/\d+(?:\.\d+)?/);
    return match ? (parseFloat(match[0]) || 0) : 0;
  }

  function findCharacterTechnique(definition) {
    if (!state.character || !definition) return null;
    return (state.character.techniques || []).find(function (item) {
      return String(item.postId || '') === String(definition.postId || '') || normalize(item.name) === normalize(definition.name);
    }) || null;
  }

  function coloredTechniqueBbcode(definition) {
    return '[url=' + definition.url + '][color=' + definition.color + ']' + definition.name + '[/color][/url]';
  }

  function techniqueChakraBoostLimit(item, mode) {
    if (!item || !item.detail || ['D', 'C', 'B', 'A'].indexOf(item.rank) === -1) return 0;
    var category = techniqueCategory(item.detail);
    if ((mode === 'attack' && !category.attack) || (mode === 'defense' && !category.defense)) return 0;
    if (normalize((item.detail.block || '') + ' ' + (item.detail.effect || '')).indexOf('\u0442\u0430\u0439\u0434\u0437\u044e\u0446\u0443') !== -1) return 0;
    var generalCost = Number(techniqueChakraCost(item.detail.chakra).general || 0);
    return Math.max(0, Math.floor(generalCost / 2) * 2);
  }

  function techniqueChakraBoostFields(item, mode) {
    var limit = techniqueChakraBoostLimit(item, mode);
    if (!limit) return '';
    var target = mode === 'defense' ? '\u0417\u0430\u0449\u0438\u0442\u0435' : '\u0443\u0440\u043e\u043d\u0443';
    var options = [];
    for (var chakra = 2; chakra <= limit; chakra += 2) {
      options.push('<option value="' + chakra + '">' + chakra + ' \u0447\u0430\u043a\u0440\u044b \u00b7 +' + (chakra * 10) + ' \u043a ' + target + '</option>');
    }
    return '<div class="aba-tech-boost"><label class="aba-check"><input type="checkbox" data-field="tech-chakra-boost"><span>\u0423\u0441\u0438\u043b\u0438\u0442\u044c \u0442\u0435\u0445\u043d\u0438\u043a\u0443 \u0447\u0430\u043a\u0440\u043e\u0439: 2 \u0447\u0430\u043a\u0440\u044b = +20 \u043a ' + target + '</span></label><label class="aba-tech-boost-fields" hidden>\u0414\u043e\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044c\u043d\u0430\u044f \u0447\u0430\u043a\u0440\u0430<select data-field="tech-chakra-boost-value">' + options.join('') + '</select></label></div>';
  }

  function techniqueChakraBoostData(editor, item, mode) {
    var enabled = !!((editor.querySelector('[data-field="tech-chakra-boost"]') || {}).checked) && !((editor.querySelector('[data-field="tech-weaken"]') || {}).checked);
    var limit = techniqueChakraBoostLimit(item, mode);
    var value = enabled ? Number((editor.querySelector('[data-field="tech-chakra-boost-value"]') || {}).value || 0) : 0;
    value = Math.max(0, Math.min(limit, Math.floor(value / 2) * 2));
    return { chakra: value, bonus: value * 10, target: mode === 'defense' ? 'defense' : 'damage' };
  }

  function techniqueWeakeningRules(item) {
    var notes = clean(item && item.detail && item.detail.notes).replace(/\[\/?(?:b|i|u)(?:=[^\]]*)?\]|<[^>]*>/gi, ' ').replace(/\*\*/g, '').replace(/\s+/g, ' ');
    var marker = /\u0442\u0435\u0445\u043d\u0438\u043a\u0443\s+\u043c\u043e\u0436\u043d\u043e\s+\u043e\u0441\u043b\u0430\u0431\u0438\u0442\u044c\s*:?\s*\u043c\u0438\u043d\u0438\u043c\u0430\u043b\u044c\u043d\u044b\u0439\s+(?:\u0432\u043e\u0437\u043c\u043e\u0436\u043d\u044b\u0439\s+)?\u0440\u0430\u043d\u0433\s*:?\s*([EDCBAS\u0415\u0421\u0412\u0410])/i.exec(notes);
    if (!marker) return null;
    var rank = marker[1].toUpperCase().replace('\u0415', 'E').replace('\u0421', 'C').replace('\u0412', 'B').replace('\u0410', 'A');
    var ranks = RANKS.filter(function (value, index) { return index >= RANKS.indexOf(rank) && index < RANKS.indexOf(item.rank); });
    return ranks.length ? { ranks: ranks, text: notes.slice(marker.index) } : null;
  }

  var WEAKEN_RANK_VALUES = { E: [1, 1, 10], D: [2, 2, 20], C: [2, 4, 40], B: [2, 6, 60], A: [1, 9, 90], S: [0, 12, 120] };

  var RANK_SUPPORT_VALUES = { E: [1, 0, 0, 0], D: [2, 1, 5, 0], C: [4, 2, 10, 0], B: [6, 2, 20, 3], A: [8, 2, 30, 5], S: [12, 3, 40, 8] };

  function techniqueRuleProfile(item, mode) {
    var detail = item.detail;
    var effect = clean(detail.effect).toLowerCase();
    var element = clean(detail.element).toLowerCase();
    var healing = /\u043b\u0435\u0447\u0435\u043d|\u0432\u043e\u0441\u0441\u0442\u0430\u043d\u043e\u0432|\u0440\u0435\u0433\u0435\u043d\u0435\u0440\u0430\u0446/.test(effect);
    var gradual = healing && /\u0432 \u0445\u043e\u0434|\u043f\u043e\u0441\u0442\u0435\u043f\u0435\u043d\u043d/.test(clean(detail.power).toLowerCase());
    var sustained = supportChakraCost(detail) > 0 || gradual;
    if (mode === 'support' && !healing) mode = /\u0430\u0442\u0430\u043a\u0430/.test(effect) ? 'attack' : /\u0437\u0430\u0449\u0438\u0442/.test(effect) ? 'defense' : mode;
    var shape = mode === 'attack' ? (/\u043a\u043e\u043d\u0443\u0441/.test(effect) ? 0.75 : /\u043f\u043b\u043e\u0449\u0430\u0434/.test(effect) ? 0.5 : 1) : 1;
    var elemental = healing ? 1 : ((mode === 'attack' || mode === 'defense') && /\u0432\u043e\u0434\u0430/.test(element) ? 1.1 : mode === 'attack' && /\u0432\u0435\u0442\u0435\u0440/.test(element) ? 1.2 : mode === 'defense' && /\u0437\u0435\u043c\u043b\u044f/.test(element) ? 1.2 : 1);
    return { healing: healing, gradual: gradual, sustained: sustained, shape: shape, elemental: elemental,
      fire: mode === 'attack' && /\u043e\u0433\u043e\u043d\u044c/.test(element), lightning: mode === 'attack' && /\u043c\u043e\u043b\u043d\u0438\u044f/.test(element),
      taijutsu: /\u0442\u0430\u0439\u0434\u0437\u044e\u0446\u0443/.test(clean(detail.block).toLowerCase()), regeneration: /\u0440\u0435\u0433\u0435\u043d\u0435\u0440\u0430\u0446/.test(effect), temporary: /\u0432\u0440\u0435\u043c\u0435\u043d\u043d|^\u0432\u043e\u0441\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d\u0438\u0435(?:\s*\/|$)/.test(effect) };
  }

  function techniquePowerNumber(value) {
    var text = clean(value).replace(',', '.');
    // \u0421\u043b\u043e\u0436\u043d\u044b\u0435 \u0444\u043e\u0440\u043c\u0443\u043b\u044b, \u043d\u0435\u0441\u043a\u043e\u043b\u044c\u043a\u043e \u043f\u043e\u043f\u0430\u0434\u0430\u043d\u0438\u0439 \u0438 \u0443\u0441\u043b\u043e\u0432\u043d\u044b\u0435 \u0437\u043d\u0430\u0447\u0435\u043d\u0438\u044f \u0441\u043e\u0445\u0440\u0430\u043d\u044f\u044e\u0442\u0441\u044f \u0442\u0435\u043a\u0441\u0442\u043e\u043c.
    var match = /^(?:\u0434\u043e\s+)?(\d+(?:\.\d+)?)(?:\s*(?:\u0435\u0434\u0438\u043d\u0438\u0446[\u0430-\u044f]*|\u0435\u0434\.?|HP))?(?:\s+\u0432\s+\u0445\u043e\u0434)?[.!]?$/i.exec(text);
    return match ? Number(match[1]) : null;
  }

  function techniqueDistances(item) {
    var range = clean(item.detail.range).toLowerCase(), distances = [];
    if (/\u043d\u0430 \u0441\u0435\u0431\u044f/.test(range)) distances.push('self');
    if (/\u0431\u043b\u0438\u0436\u043d|\u0441\u0440\u0435\u0434\u043d/.test(range)) distances.push('normal');
    if (/\u0434\u0430\u043b\u044c\u043d/.test(range)) distances.push('far');
    return distances.length ? distances : ['normal'];
  }

  function techniqueCalculation(item, mode, rank, distance, valueMode) {
    var detail = item.detail;
    rank = rank || item.rank;
    var weakened = rank !== item.rank;
    var profile = techniqueRuleProfile(item, mode);
    var values = WEAKEN_RANK_VALUES[rank];
    var supportValues = RANK_SUPPORT_VALUES[rank];
    var original = WEAKEN_RANK_VALUES[item.rank];
    var originalSupport = RANK_SUPPORT_VALUES[item.rank];
    var chakra = techniqueChakraCost(detail.chakra);
    var notes = [];
    var distances = techniqueDistances(item), nativeDistance = distances[0];
    var selectedDistance = distances.indexOf(distance) !== -1 ? distance : nativeDistance;
    var rangeModifier = function (value) { return profile.taijutsu ? 0 : value === 'self' ? -1 : value === 'far' ? 2 : 0; };
    if (weakened || !clean(detail.chakra)) {
      chakra.focused = profile.sustained ? supportValues[0] : values[0];
      chakra.general = profile.sustained ? supportValues[1] : values[1];
      if (profile.taijutsu) { chakra.focused /= 2; chakra.general /= 2; }
      chakra.general = Math.max(0, chakra.general + rangeModifier(selectedDistance));
      if (profile.regeneration) chakra.general *= 3;
    } else {
      // \u041e\u043f\u0438\u0441\u0430\u043d\u0438\u044f \u0443\u0436\u0435 \u0432\u043a\u043b\u044e\u0447\u0430\u044e\u0442 \u0432\u0441\u0435 \u0441\u0442\u0430\u043d\u0434\u0430\u0440\u0442\u043d\u044b\u0435 \u043c\u043e\u0434\u0438\u0444\u0438\u043a\u0430\u0442\u043e\u0440\u044b.
      chakra.general = Math.max(0, chakra.general + rangeModifier(selectedDistance) - rangeModifier(nativeDistance));
    }
    var specializationText = normalizeText([detail.block, detail.element].join(' '));
    var specialties = (state.character && state.character.specializations) || [];
    var exactSpecialties = (state.character && state.character.specializationTechniques) || [];
    var specializationMatch = specialties.some(function (value) { return value && specializationText.indexOf(normalizeText(value)) !== -1; }) ||
      exactSpecialties.some(function (exactSpecialty) { return String(exactSpecialty.postId) === String(item.postId) || normalizeText(exactSpecialty.name) === normalizeText(item.name); });
    var specializationDiscount = statValue('ninjutsu') >= 10 && specializationMatch;
    if (specializationDiscount) {
      chakra.general = Math.max(1, Math.ceil(chakra.general * 0.9));
      notes.push('\u0441\u043f\u0435\u0446\u0438\u0430\u043b\u0438\u0437\u0430\u0446\u0438\u044f \u043f\u0440\u0438 \u041d\u0438\u043d\u0434\u0437\u044e\u0446\u0443 10: \u0440\u0430\u0441\u0445\u043e\u0434 \u043e\u0431\u0449\u0435\u0439 \u0447\u0430\u043a\u0440\u044b \u221210% \u0441 \u043e\u043a\u0440\u0443\u0433\u043b\u0435\u043d\u0438\u0435\u043c \u0432\u0432\u0435\u0440\u0445');
    }
    if (profile.healing && rank === 'E') throw new Error('\u041b\u0435\u0447\u0435\u0431\u043d\u044b\u0435 \u044d\u0444\u0444\u0435\u043a\u0442\u044b \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u043d\u044b \u043d\u0430 \u0440\u0430\u043d\u0433\u0435 E.');
    if (profile.regeneration && ['A', 'S'].indexOf(rank) === -1) throw new Error('\u0420\u0435\u0433\u0435\u043d\u0435\u0440\u0430\u0446\u0438\u044f \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u0430 \u0442\u043e\u043b\u044c\u043a\u043e \u043d\u0430 \u0440\u0430\u043d\u0433\u0430\u0445 A \u0438 S.');
    var standardPower = profile.gradual ? supportValues[2] : values[2];
    var oldStandardPower = profile.gradual ? originalSupport[2] : original[2];
    var raw = techniquePowerNumber(detail.power);
    var factor = profile.shape * profile.elemental;
    var power = raw === null ? standardPower * factor : raw * (weakened ? standardPower / oldStandardPower : 1);
    power = combatRound(power);
    if (weakened && profile.shape !== 1 && raw === null) notes.push(profile.shape === 0.75 ? '\u043a\u043e\u043d\u0443\u0441: \u00d70.75' : '\u043f\u043b\u043e\u0449\u0430\u0434\u044c: \u00d70.5');
    if (weakened && profile.elemental !== 1 && raw === null) notes.push('\u0441\u0442\u0438\u0445\u0438\u044f: \u00d7' + profile.elemental);
    if (profile.regeneration) notes.push('\u0440\u0435\u0433\u0435\u043d\u0435\u0440\u0430\u0446\u0438\u044f: \u0442\u0440\u043e\u0439\u043d\u043e\u0439 \u0440\u0430\u0441\u0445\u043e\u0434 \u043e\u0431\u0449\u0435\u0439 \u0447\u0430\u043a\u0440\u044b');
    var effectiveMode = mode === 'support' ? (/\u0430\u0442\u0430\u043a\u0430/i.test(detail.effect) ? 'attack' : /\u0437\u0430\u0449\u0438\u0442/i.test(detail.effect) ? 'defense' : mode) : mode;
    var powerLabel = profile.healing ? (profile.gradual ? '\u041b\u0435\u0447\u0435\u043d\u0438\u0435 \u0432 \u0445\u043e\u0434' : '\u0412\u043e\u0441\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d\u0438\u0435 \u0431\u043e\u0435\u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u0438') : effectiveMode === 'defense' ? '\u0417\u0430\u0449\u0438\u0442\u0430' : effectiveMode === 'attack' ? '\u0423\u0440\u043e\u043d' : clean(detail.effect) || '\u042d\u0444\u0444\u0435\u043a\u0442';
    var expressionFactor = (weakened ? standardPower / oldStandardPower : 1) * 1;
    var powerText = raw === null && detail.power ? '(' + detail.power + ')' + (expressionFactor !== 1 ? ' \u00d7' + Math.round(expressionFactor * 10000) / 10000 : '') : String(power);
    var weaponBonus = enhancementDamageModifiers(detail).weaponDamage;
    if (weaponBonus && techniqueCategory(detail).enhancement) {
      powerLabel = '\u0423\u0440\u043e\u043d \u043e\u0440\u0443\u0436\u0438\u044f';
      powerText = signedModifier(weaponBonus);
    }
    var burn = profile.fire && (raw !== null || !detail.power) ? combatRound(power * 0.1) : 0;
    if (profile.fire) notes.push(raw === null && detail.power ? '\u043e\u0436\u043e\u0433: 10% \u043e\u0442 \u0444\u0430\u043a\u0442\u0438\u0447\u0435\u0441\u043a\u043e\u0433\u043e \u0443\u0440\u043e\u043d\u0430 \u0432 \u0445\u043e\u0434, 3 \u0445\u043e\u0434\u0430' : '\u043e\u0436\u043e\u0433: ' + burn + ' \u0443\u0440\u043e\u043d\u0430 \u0432 \u0445\u043e\u0434, 3 \u0445\u043e\u0434\u0430');
    if (profile.lightning) notes.push('\u0438\u0433\u043d\u043e\u0440\u0438\u0440\u0443\u0435\u0442 40% \u0437\u0430\u0449\u0438\u0442\u044b \u0446\u0435\u043b\u0438');
    if (profile.temporary && supportValues[3]) notes.push('\u0432\u0440\u0435\u043c\u0435\u043d\u043d\u043e\u0435 \u0432\u043e\u0441\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d\u0438\u0435: ' + supportValues[3] + ' \u0445\u043e\u0434(\u0430), \u0437\u0430\u0442\u0435\u043c HP \u0441\u043d\u043e\u0432\u0430 \u0441\u043d\u0438\u0436\u0430\u0435\u0442\u0441\u044f \u0431\u0435\u0437 \u043b\u0435\u0447\u0435\u043d\u0438\u044f');
    var support = weakened ? (profile.sustained ? supportValues[1] * (profile.taijutsu ? 0.5 : 1) : 0) : supportChakraCost(detail);
    return { rank: rank, focused: chakra.focused, general: chakra.general, support: support, power: power, powerText: powerText,
      powerLabel: powerLabel, burn: burn, healing: profile.healing, gradual: profile.gradual, temporary: profile.temporary,
      duration: profile.temporary ? supportValues[3] : 0, ot: Math.max(1, RANK_COSTS[rank] - detail.discount - (specializationDiscount && rank === 'S' ? 1 : 0)), notes: notes,
      summary: ((profile.healing || effectiveMode === 'attack' || effectiveMode === 'defense' || weaponBonus) ? powerLabel + ': ' + powerText + '; ' : '') + '\u0447\u0430\u043a\u0440\u0430: ' + chakra.focused + '/' + chakra.general + (support ? '; \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430: ' + support + ' \u0432 \u0445\u043e\u0434' : '') + (notes.length ? '; ' + notes.join('; ') : '') };
  }

  function techniqueCalculationFields(item) {
    var distances = techniqueDistances(item), labels = { self: '\u041d\u0430 \u0441\u0435\u0431\u044f', normal: '\u0411\u043b\u0438\u0436\u043d\u044f\u044f / \u0441\u0440\u0435\u0434\u043d\u044f\u044f', far: '\u0414\u0430\u043b\u044c\u043d\u044f\u044f' };
    return (distances.length > 1 ? '<label>\u0414\u0438\u0441\u0442\u0430\u043d\u0446\u0438\u044f \u043f\u0440\u0438\u043c\u0435\u043d\u0435\u043d\u0438\u044f<select data-field="tech-distance">' + distances.map(function (distance) { return '<option value="' + distance + '">' + labels[distance] + '</option>'; }).join('') + '</select></label>' : '<input type="hidden" data-field="tech-distance" value="' + distances[0] + '">') + '<p class="aba-tech-calculation aba-note"></p>';
  }

  function techniqueWeakeningFields(item) {
    var rules = techniqueWeakeningRules(item);
    if (!rules) return '';
    var available = statValue('fuinjutsu') >= 7;
    return '<div><p class="aba-note">' + escapeHtml(rules.text) + '</p><label class="aba-check"><input type="checkbox" data-field="tech-weaken"' + (available ? '' : ' disabled') + '><span>\u041e\u0441\u043b\u0430\u0431\u0438\u0442\u044c \u0442\u0435\u0445\u043d\u0438\u043a\u0443' + (available ? '' : ' \u2014 \u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044f \u0424\u0443\u0438\u043d\u0434\u0437\u044e\u0446\u0443 7 \u0438 \u0432\u044b\u0448\u0435') + '</span></label><div class="aba-tech-weaken-fields" hidden><label>\u0420\u0430\u043d\u0433 \u043e\u0441\u043b\u0430\u0431\u043b\u0435\u043d\u043d\u043e\u0439 \u0442\u0435\u0445\u043d\u0438\u043a\u0438<select data-field="tech-weaken-rank">' + rules.ranks.map(function (rank) { return '<option>' + rank + '</option>'; }).join('') + '</select></label><p class="aba-note aba-tech-weaken-values"></p><label>\u0427\u0442\u043e \u0438\u0437\u043c\u0435\u043d\u044f\u0435\u0442\u0441\u044f \u0432 \u0442\u0435\u0445\u043d\u0438\u043a\u0435<textarea data-field="tech-weaken-description" rows="3"></textarea></label></div></div>';
  }

  function techniqueWeakeningData(editor, item) {
    if (!((editor.querySelector('[data-field="tech-weaken"]') || {}).checked)) return null;
    var rules = techniqueWeakeningRules(item);
    var rank = (editor.querySelector('[data-field="tech-weaken-rank"]') || {}).value;
    if (statValue('fuinjutsu') < 7 || !rules || rules.ranks.indexOf(rank) === -1) throw new Error('\u041e\u0441\u043b\u0430\u0431\u043b\u0435\u043d\u0438\u0435 \u044d\u0442\u043e\u0439 \u0442\u0435\u0445\u043d\u0438\u043a\u0438 \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u043d\u043e.');
    if (((editor.querySelector('[data-field="tech-chakra-boost"]') || {}).checked)) throw new Error('\u0423\u0441\u0438\u043b\u0438\u0442\u044c \u0438 \u043e\u0441\u043b\u0430\u0431\u0438\u0442\u044c \u0442\u0435\u0445\u043d\u0438\u043a\u0443 \u043e\u0434\u043d\u043e\u0432\u0440\u0435\u043c\u0435\u043d\u043d\u043e \u043d\u0435\u043b\u044c\u0437\u044f.');
    var values = WEAKEN_RANK_VALUES[rank];
    var description = clean((editor.querySelector('[data-field="tech-weaken-description"]') || {}).value);
    if (!description) throw new Error('\u0423\u043a\u0430\u0436\u0438\u0442\u0435, \u0447\u0442\u043e \u0438\u0437\u043c\u0435\u043d\u044f\u0435\u0442\u0441\u044f \u043f\u0440\u0438 \u043e\u0441\u043b\u0430\u0431\u043b\u0435\u043d\u0438\u0438 \u0442\u0435\u0445\u043d\u0438\u043a\u0438.');
    return { rank: rank, focused: values[0], general: values[1], power: values[2], description: description };
  }

  function techniqueSealAvailability(item, check) {
    var block = normalize(item.detail.block);
    var taijutsu = block.indexOf('\u0442\u0430\u0439\u0434\u0437\u044e\u0446\u0443') !== -1;
    var genjutsu = block.indexOf('\u0433\u0435\u043d\u0434\u0437\u044e\u0446\u0443') !== -1;
    var ninjutsu = block.indexOf('\u043d\u0438\u043d\u0434\u0437\u044e\u0446\u0443') !== -1 || (!taijutsu && !genjutsu && check.label === '\u0410\u0442\u0430\u043a\u0430 \u041d\u0438\u043d\u0434\u0437\u044e\u0446\u0443');
    return {
      mental: statValue('ninjutsu') >= 9 && ['E', 'D', 'C'].indexOf(item.rank) !== -1 && !item.detail.discount && ninjutsu,
      twoTurn: !item.detail.discount && !taijutsu && !genjutsu
    };
  }

  function renderActionMenu() {
    if (!state.nodes.builder) return;
    if (!state.character) {
      state.nodes.builder.innerHTML = '<div class="aba-empty">\u0421\u043d\u0430\u0447\u0430\u043b\u0430 \u0432\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043b\u0438\u0447\u043d\u043e\u0435 \u0434\u0435\u043b\u043e \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0430.</div>';
      return;
    }
    state.builderTab = state.builderTab || 'actions';
    var isClonesTab = state.builderTab === 'clones';
    var isSituationsTab = state.builderTab === 'situations';
    var isEnvironmentTab = state.builderTab === 'environment';
    state.nodes.builder.innerHTML = '<div class="aba-builder-tabs">' +
      '<button type="button" data-builder-tab="actions" class="' + (isSituationsTab || isEnvironmentTab || isClonesTab ? '' : 'is-active') + '">\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044f</button>' +
      '<button type="button" data-builder-tab="situations" class="' + (isSituationsTab ? 'is-active' : '') + '">\u0411\u043e\u0435\u0432\u044b\u0435 \u0441\u0438\u0442\u0443\u0430\u0446\u0438\u0438</button>' +
      '<button type="button" data-builder-tab="environment" class="' + (isEnvironmentTab ? 'is-active' : '') + '">\u041e\u0431\u0441\u0442\u043e\u044f\u0442\u0435\u043b\u044c\u0441\u0442\u0432\u0430 \u043e\u043a\u0440\u0443\u0436\u0435\u043d\u0438\u044f</button>' +
      '<button type="button" data-builder-tab="clones" class="' + (isClonesTab ? 'is-active' : '') + '">\u0421\u043f\u0443\u0442\u043d\u0438\u043a\u0438 \u0438 \u043a\u043b\u043e\u043d\u044b</button>' +
      '</div>' +
      '<div class="aba-action-types' + (isSituationsTab || isEnvironmentTab || isClonesTab ? ' is-hidden' : '') + '">' +
      '<button type="button" data-action-type="attack"><span>\u0410\u0442\u0430\u043a\u043e\u0432\u0430\u0442\u044c</span><small>\u041e\u0431\u044b\u0447\u043d\u0430\u044f \u0430\u0442\u0430\u043a\u0430, \u0442\u0435\u0445\u043d\u0438\u043a\u0430 \u0438\u043b\u0438 \u0441\u043f\u0443\u0442\u043d\u0438\u043a</small></button>' +
      '<button type="button" data-action-type="defense"><span>\u0417\u0430\u0449\u0438\u0442\u0438\u0442\u044c\u0441\u044f</span><small>\u0423\u043a\u043b\u043e\u043d\u0435\u043d\u0438\u0435, \u0431\u043b\u043e\u043a \u0438\u043b\u0438 \u0442\u0435\u0445\u043d\u0438\u043a\u0430</small></button>' +
      '<button type="button" data-action-type="support"><span>\u041f\u043e\u0434\u0433\u043e\u0442\u043e\u0432\u0438\u0442\u044c\u0441\u044f</span><small>\u041f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430, \u043f\u0440\u0435\u0434\u043c\u0435\u0442\u044b \u0438 \u043f\u0440\u0438\u0437\u044b\u0432</small></button>' +
      '<button type="button" data-action-type="move"><span>\u0414\u0432\u0438\u0433\u0430\u0442\u044c\u0441\u044f</span><small>\u041f\u0435\u0440\u0435\u0434\u0432\u0438\u0436\u0435\u043d\u0438\u0435, \u0441\u0431\u043b\u0438\u0436\u0435\u043d\u0438\u0435 \u0438\u043b\u0438 \u043f\u043e\u0431\u0435\u0433</small></button>' +
      '<button type="button" data-action-type="special"><span>\u041e\u0441\u043e\u0431\u043e\u0435 \u0432\u0437\u0430\u0438\u043c\u043e\u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435</span><small>\u041b\u0435\u0447\u0435\u043d\u0438\u0435, \u044d\u0444\u0444\u0435\u043a\u0442\u044b \u0438 \u043f\u0435\u0440\u0435\u0434\u0430\u0447\u0430 \u0447\u0430\u043a\u0440\u044b</small></button>' +
      (combatState().firstTurn ? '' : '<button type="button" data-action-type="active-effects"><span>\u0410\u043a\u0442\u0438\u0432\u043d\u044b\u0435 \u044d\u0444\u0444\u0435\u043a\u0442\u044b</span><small>\u041f\u043e\u0434\u0434\u0435\u0440\u0436\u0430\u0442\u044c \u0438\u043b\u0438 \u043f\u0440\u0435\u043a\u0440\u0430\u0442\u0438\u0442\u044c</small></button>') +
      '</div><div class="aba-builder-panel"><div class="aba-empty">\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435, \u0447\u0442\u043e \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436 \u0445\u043e\u0447\u0435\u0442 \u0441\u0434\u0435\u043b\u0430\u0442\u044c.</div></div>';
    Array.prototype.forEach.call(state.nodes.builder.querySelectorAll('[data-builder-tab]'), function (button) {
      on(button, 'click', function () {
        state.builderTab = button.dataset.builderTab;
        renderActionMenu();
      });
    });
    Array.prototype.forEach.call(state.nodes.builder.querySelectorAll('[data-action-type]'), function (button) {
      on(button, 'click', function () {
        Array.prototype.forEach.call(state.nodes.builder.querySelectorAll('[data-action-type]'), function (item) { item.classList.toggle('is-active', item === button); });
        renderActionType(button.dataset.actionType);
      });
    });
    if (isClonesTab) renderActiveClones();
    else if (isEnvironmentTab) renderEnvironmentEditor();
    else if (isSituationsTab) renderActionType('situations');
    else renderActionType('attack');
  }

  function renderEnvironmentEditor() {
    var panel = state.nodes.builder.querySelector('.aba-builder-panel');
    var combat = combatState();
    var environment = environmentPenaltyData();
    var options = [
      [0, '\u041d\u0435\u0442 \u043f\u043e\u043c\u0435\u0445 \u2014 \u0431\u0435\u0437 \u0448\u0442\u0440\u0430\u0444\u0430'],
      [1, '\u0421\u043b\u0430\u0431\u0430\u044f \u043f\u043e\u043c\u0435\u0445\u0430: \u0441\u0443\u043c\u0435\u0440\u043a\u0438, \u043b\u0451\u0433\u043a\u0438\u0439 \u0434\u044b\u043c \u0438\u043b\u0438 \u0442\u0443\u043c\u0430\u043d \u2014 \u0448\u0442\u0440\u0430\u0444 1'],
      [2, '\u041e\u0433\u0440\u0430\u043d\u0438\u0447\u0435\u043d\u043d\u0430\u044f \u0432\u0438\u0434\u0438\u043c\u043e\u0441\u0442\u044c: \u0442\u0435\u043c\u043d\u043e\u0442\u0430, \u0434\u044b\u043c \u0438\u043b\u0438 \u0442\u0443\u043c\u0430\u043d \u2014 \u0448\u0442\u0440\u0430\u0444 2'],
      [4, '\u041f\u043e\u0447\u0442\u0438 \u043d\u0443\u043b\u0435\u0432\u0430\u044f \u0432\u0438\u0434\u0438\u043c\u043e\u0441\u0442\u044c: \u0433\u0443\u0441\u0442\u043e\u0439 \u0442\u0443\u043c\u0430\u043d, \u0434\u044b\u043c \u0438\u043b\u0438 \u043f\u043e\u043b\u043d\u0430\u044f \u0442\u0435\u043c\u043d\u043e\u0442\u0430 \u2014 \u0448\u0442\u0440\u0430\u0444 4']
    ];
    panel.innerHTML = '<div class="aba-action-editor aba-action-editor-direct"><h4>\u041e\u0431\u0441\u0442\u043e\u044f\u0442\u0435\u043b\u044c\u0441\u0442\u0432\u0430 \u043e\u043a\u0440\u0443\u0436\u0435\u043d\u0438\u044f</h4><p>\u0428\u0442\u0440\u0430\u0444 \u043f\u0440\u0438\u043c\u0435\u043d\u044f\u0435\u0442\u0441\u044f \u043a \u0442\u043e\u0447\u043d\u043e\u0441\u0442\u0438 \u0430\u0442\u0430\u043a \u0431\u043b\u0438\u0436\u043d\u0435\u0433\u043e \u0438 \u0434\u0430\u043b\u044c\u043d\u0435\u0433\u043e \u0431\u043e\u044f, \u0430 \u0442\u0430\u043a\u0436\u0435 \u0430\u0442\u0430\u043a\u0443\u044e\u0449\u0438\u0445 \u0442\u0435\u0445\u043d\u0438\u043a.</p><label>\u0412\u0438\u0434\u0438\u043c\u043e\u0441\u0442\u044c \u0438 \u043f\u043e\u043c\u0435\u0445\u0438<select data-environment-penalty>' + options.map(function (option) { return '<option value="' + option[0] + '"' + (Number(combat.environmentPenalty || 0) === option[0] ? ' selected' : '') + '>' + option[1] + '</option>'; }).join('') + '</select></label><label class="aba-check"><input type="checkbox" data-environment-ability' + (combat.environmentAbilityReduction ? ' checked' : '') + '><span>\u0414\u043e\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044c\u043d\u0430\u044f \u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u044c \u0441\u043d\u0438\u0436\u0430\u0435\u0442 \u0448\u0442\u0440\u0430\u0444 \u043e\u043a\u0440\u0443\u0436\u0435\u043d\u0438\u044f \u043d\u0430 50%</span></label><div class="aba-summary" data-environment-summary></div><p class="aba-note">\u0422\u0430\u0439\u0434\u0437\u044e\u0446\u0443 8 \u0438 \u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u044c \u0434\u0430\u044e\u0442 \u043e\u0434\u0438\u043d\u0430\u043a\u043e\u0432\u043e\u0435 \u0441\u043d\u0438\u0436\u0435\u043d\u0438\u0435 \u043d\u0430 50% \u0438 \u043d\u0435 \u0441\u043a\u043b\u0430\u0434\u044b\u0432\u0430\u044e\u0442\u0441\u044f \u043c\u0435\u0436\u0434\u0443 \u0441\u043e\u0431\u043e\u0439.</p></div><div class="aba-builder-message" aria-live="polite"></div>';
    function update() {
      combat.environmentPenalty = Number(panel.querySelector('[data-environment-penalty]').value || 0);
      combat.environmentAbilityReduction = panel.querySelector('[data-environment-ability]').checked;
      var current = environmentPenaltyData();
      panel.querySelector('[data-environment-summary]').innerHTML = '<strong>\u0418\u0442\u043e\u0433\u043e\u0432\u044b\u0439 \u0448\u0442\u0440\u0430\u0444 \u043a \u0442\u043e\u0447\u043d\u043e\u0441\u0442\u0438: \u2212' + current.effective + '</strong><span>\u0418\u0441\u0445\u043e\u0434\u043d\u044b\u0439 \u0448\u0442\u0440\u0430\u0444: \u2212' + current.base + (current.ignored ? '; \u043f\u043e\u043c\u0435\u0445\u0430 \u043f\u043e\u043b\u043d\u043e\u0441\u0442\u044c\u044e \u0438\u0433\u043d\u043e\u0440\u0438\u0440\u0443\u0435\u0442\u0441\u044f \u0411\u044c\u044f\u043a\u0443\u0433\u0430\u043d\u043e\u043c' : current.reduced ? '; \u0441\u043d\u0438\u0436\u0435\u043d\u043e \u043d\u0430 50%' : '') + '</span>';
      renderQueue();
    }
    on(panel.querySelector('[data-environment-penalty]'), 'change', update);
    on(panel.querySelector('[data-environment-ability]'), 'change', update);
    update();
  }

  function actionTypeInfo(type) {
    return {
      situations: ['\u0411\u043e\u0435\u0432\u044b\u0435 \u0441\u0438\u0442\u0443\u0430\u0446\u0438\u0438', '\u0413\u043e\u0442\u043e\u0432\u044b\u0435 \u043f\u043e\u0441\u043b\u0435\u0434\u043e\u0432\u0430\u0442\u0435\u043b\u044c\u043d\u043e\u0441\u0442\u0438 \u0434\u043b\u044f \u0447\u0430\u0441\u0442\u044b\u0445 \u0441\u043b\u0443\u0447\u0430\u0435\u0432. \u041f\u043e\u043c\u043e\u0449\u043d\u0438\u043a \u0441\u0430\u043c \u0434\u043e\u0431\u0430\u0432\u0438\u0442 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044f \u0432 \u043f\u0440\u0430\u0432\u0438\u043b\u044c\u043d\u043e\u043c \u043f\u043e\u0440\u044f\u0434\u043a\u0435.'],
      'active-effects': ['\u0410\u043a\u0442\u0438\u0432\u043d\u044b\u0435 \u044d\u0444\u0444\u0435\u043a\u0442\u044b', '\u041e\u043f\u043b\u0430\u0442\u0438\u0442\u0435 \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0443 \u0443\u0436\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0443\u044e\u0449\u0435\u0439 \u0442\u0435\u0445\u043d\u0438\u043a\u0438 \u0438\u043b\u0438 \u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u0438 \u043b\u0438\u0431\u043e \u043f\u0440\u0435\u043a\u0440\u0430\u0442\u0438\u0442\u0435 \u0435\u0451 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435.'],
      attack: ['\u0410\u0442\u0430\u043a\u043e\u0432\u0430\u0442\u044c', '\u041d\u0430\u043d\u0435\u0441\u0438\u0442\u0435 \u0443\u0434\u0430\u0440 \u0431\u0435\u0437 \u043e\u0440\u0443\u0436\u0438\u044f, \u043f\u0440\u0438\u043c\u0435\u043d\u0438\u0442\u0435 \u043e\u0440\u0443\u0436\u0438\u0435, \u0430\u0442\u0430\u043a\u0443\u044e\u0449\u0443\u044e \u0442\u0435\u0445\u043d\u0438\u043a\u0443, \u043f\u0440\u0435\u0434\u043c\u0435\u0442 \u0438\u043b\u0438 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u0441\u043f\u0443\u0442\u043d\u0438\u043a\u0430.'],
      defense: ['\u0417\u0430\u0449\u0438\u0442\u0438\u0442\u044c\u0441\u044f', '\u0423\u043a\u043b\u043e\u043d\u0438\u0442\u0435\u0441\u044c, \u0437\u0430\u0431\u043b\u043e\u043a\u0438\u0440\u0443\u0439\u0442\u0435 \u0443\u0434\u0430\u0440, \u043f\u0440\u0438\u043c\u0435\u043d\u0438\u0442\u0435 \u0437\u0430\u0449\u0438\u0442\u043d\u0443\u044e \u0442\u0435\u0445\u043d\u0438\u043a\u0443 \u0438\u043b\u0438 \u0422\u0435\u0445\u043d\u0438\u043a\u0443 \u0417\u0430\u043c\u0435\u043d\u044b.'],
      support: ['\u041f\u043e\u0434\u0433\u043e\u0442\u043e\u0432\u0438\u0442\u044c\u0441\u044f', '\u041f\u043e\u0434\u0433\u043e\u0442\u043e\u0432\u044c\u0442\u0435 \u043f\u0440\u0435\u0434\u043c\u0435\u0442, \u043b\u043e\u0432\u0443\u0448\u043a\u0443 \u0438\u043b\u0438 \u043f\u0440\u0438\u0437\u044b\u0432, \u0441\u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0438\u0440\u0443\u0439\u0442\u0435 \u0447\u0430\u043a\u0440\u0443 \u043b\u0438\u0431\u043e \u043f\u0440\u0438\u043c\u0435\u043d\u0438\u0442\u0435 \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u044e\u0449\u0438\u0439 \u044d\u0444\u0444\u0435\u043a\u0442.'],
      move: ['\u0414\u0432\u0438\u0433\u0430\u0442\u044c\u0441\u044f', '\u041f\u0435\u0440\u0435\u043c\u0435\u0441\u0442\u0438\u0442\u0435\u0441\u044c \u043f\u043e \u043f\u043e\u043b\u044e \u0431\u043e\u044f, \u0441\u043e\u043a\u0440\u0430\u0442\u0438\u0442\u0435 \u0434\u0438\u0441\u0442\u0430\u043d\u0446\u0438\u044e, \u043e\u0442\u0441\u0442\u0443\u043f\u0438\u0442\u0435 \u0438\u043b\u0438 \u043f\u0440\u0438\u043c\u0435\u043d\u0438\u0442\u0435 \u0422\u0435\u0445\u043d\u0438\u043a\u0443 \u041c\u0435\u0440\u0446\u0430\u044e\u0449\u0435\u0433\u043e \u0422\u0435\u043b\u0430.'],
      special: ['\u041e\u0441\u043e\u0431\u044b\u0435 \u0432\u0437\u0430\u0438\u043c\u043e\u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044f', '\u0417\u0430\u0444\u0438\u043a\u0441\u0438\u0440\u0443\u0439\u0442\u0435 \u043b\u0435\u0447\u0435\u043d\u0438\u0435, \u0440\u0430\u043d\u0435\u043d\u0438\u0435, \u044d\u0444\u0444\u0435\u043a\u0442, \u043f\u0435\u0440\u0435\u0434\u0430\u0447\u0443 \u0447\u0430\u043a\u0440\u044b \u0438\u043b\u0438 \u0434\u0440\u0443\u0433\u043e\u0435 \u0432\u0437\u0430\u0438\u043c\u043e\u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u0441 \u0441\u043e\u044e\u0437\u043d\u0438\u043a\u043e\u043c.']
    }[type] || ['', ''];
  }

  function instructionActionList(type) {
    if (type === 'attack') return ['\u0411\u043b\u0438\u0436\u043d\u0438\u0439 \u0440\u0443\u043a\u043e\u043f\u0430\u0448\u043d\u044b\u0439 \u0431\u043e\u0439', '\u0411\u043b\u0438\u0436\u043d\u0438\u0439 \u0431\u043e\u0439 \u0441 \u043e\u0440\u0443\u0436\u0438\u0435\u043c', '\u0414\u0430\u043b\u044c\u043d\u0438\u0439 \u0431\u043e\u0439 \u0441 \u043e\u0440\u0443\u0436\u0438\u0435\u043c', '\u0421\u0442\u0440\u0435\u043b\u044c\u0431\u0430', '\u0410\u0442\u0430\u043a\u0430 \u043f\u0440\u0435\u0434\u043c\u0435\u0442\u043e\u043c', '\u0410\u0442\u0430\u043a\u0430 \u0442\u0435\u0445\u043d\u0438\u043a\u043e\u0439', '\u0410\u0442\u0430\u043a\u0430 \u0441\u043f\u0443\u0442\u043d\u0438\u043a\u0430'];
    if (type === 'defense') return ['\u0423\u043a\u043b\u043e\u043d\u0435\u043d\u0438\u0435', '\u0420\u0443\u043a\u043e\u043f\u0430\u0448\u043d\u0430\u044f \u0437\u0430\u0449\u0438\u0442\u0430', '\u0417\u0430\u0449\u0438\u0442\u0430 \u043e\u0440\u0443\u0436\u0438\u0435\u043c', '\u0417\u0430\u0449\u0438\u0442\u0430 \u043f\u0440\u0435\u0434\u043c\u0435\u0442\u0430\u043c\u0438', '\u0417\u0430\u0449\u0438\u0442\u0430 \u0447\u0430\u043a\u0440\u043e\u0439', '\u0417\u0430\u0449\u0438\u0442\u0430 \u0442\u0435\u0445\u043d\u0438\u043a\u043e\u0439'];
    if (type === 'support') return ['\u041f\u043e\u0434\u0433\u043e\u0442\u043e\u0432\u043a\u0430 \u043b\u043e\u0432\u0443\u0448\u043a\u0438', '\u0418\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u0435 \u043f\u0440\u0435\u043f\u0430\u0440\u0430\u0442\u0430', '\u0418\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u0435 \u043f\u0440\u0435\u0434\u043c\u0435\u0442\u0430', '\u0417\u0430\u0442\u0440\u0430\u0442\u0430 \u0447\u0430\u043a\u0440\u044b \u0432 \u0445\u043e\u0434', '\u041a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0430\u0446\u0438\u044f \u0447\u0430\u043a\u0440\u044b', '\u041f\u0440\u0438\u0437\u044b\u0432', '\u0418\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u0435 \u0442\u0435\u0445\u043d\u0438\u043a\u0438', '\u0410\u043a\u0442\u0438\u0432\u0430\u0446\u0438\u044f \u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u0438'];
    if (type === 'move') return ['\u041f\u0435\u0440\u0435\u0434\u0432\u0438\u0436\u0435\u043d\u0438\u0435', '\u0421\u0431\u043b\u0438\u0436\u0435\u043d\u0438\u0435 \u0438\u043b\u0438 \u043f\u043e\u0431\u0435\u0433', '\u0422\u0435\u0445\u043d\u0438\u043a\u0430 \u041c\u0435\u0440\u0446\u0430\u044e\u0449\u0435\u0433\u043e \u0422\u0435\u043b\u0430'];
    if (type === 'special') return ['\u041b\u0435\u0447\u0435\u043d\u0438\u0435 \u0441\u043e\u044e\u0437\u043d\u0438\u043a\u0430', '\u041f\u0435\u0440\u0435\u0434\u0430\u0447\u0430 \u0447\u0430\u043a\u0440\u044b', '\u041f\u043e\u043b\u0443\u0447\u0435\u043d\u043e \u043b\u0435\u0447\u0435\u043d\u0438\u0435', '\u041f\u043e\u043b\u0443\u0447\u0435\u043d\u0430 \u0447\u0430\u043a\u0440\u0430', '\u041f\u043e\u043b\u0443\u0447\u0435\u043d\u043e \u0440\u0430\u043d\u0435\u043d\u0438\u0435', '\u041f\u043e\u043b\u0443\u0447\u0435\u043d \u044d\u0444\u0444\u0435\u043a\u0442'];
    return [];
  }

  function renderInstructionPanel(type) {
    var node = state.nodes.instruction;
    if (!node) return;
    var info = actionTypeInfo(type);
    var tabs = ['attack', 'defense', 'support', 'move', 'special'].map(function (key) {
      var active = key === type ? ' is-active' : '';
      return '<button type="button" class="aba-instruction-tab' + active + '" data-instruction-tab="' + key + '">' + actionTypeInfo(key)[0] + '</button>';
    }).join('');
    node.innerHTML = '<div class="aba-instruction-shell"><div class="aba-instruction-header"><strong>\u0418\u043d\u0441\u0442\u0440\u0443\u043a\u0446\u0438\u044f</strong><button type="button" class="aba-instruction-close" aria-label="\u0417\u0430\u043a\u0440\u044b\u0442\u044c \u0438\u043d\u0441\u0442\u0440\u0443\u043a\u0446\u0438\u044e">\u00d7</button></div><div class="aba-instruction-tabs">' + tabs + '</div><div class="aba-instruction-body"><h3>' + escapeHtml(info[0]) + '</h3><p>' + escapeHtml(info[1]) + '</p><ul>' + instructionActionList(type).map(function (item) { return '<li>' + escapeHtml(item) + '</li>'; }).join('') + '</ul></div></div>';
    Array.prototype.forEach.call(node.querySelectorAll('[data-instruction-tab]'), function (button) {
      on(button, 'click', function () {
        state.instructionTab = button.dataset.instructionTab;
        renderInstructionPanel(state.instructionTab);
      });
    });
    on(node.querySelector('.aba-instruction-close'), 'click', function () { node.hidden = true; });
  }

  function actionTypeIntro(type) {
    var info = actionTypeInfo(type);
    return '<div class="aba-action-intro"><strong>' + escapeHtml(info[0]) + '</strong><p>' + escapeHtml(info[1]) + '</p></div>';
  }

  function renderActionType(type) {
    var panel = state.nodes.builder.querySelector('.aba-builder-panel');
    if (type === 'active-effects') {
      panel.innerHTML = actionTypeIntro(type) + '<div class="aba-action-editor aba-action-editor-direct"></div><div class="aba-builder-message" aria-live="polite"></div>';
      renderActiveEffectsEditor(panel.querySelector('.aba-action-editor'));
      return;
    }
    var options = [];
    if (type === 'situations') options = [
      ['situation-elemental-weapon', '\u041e\u0440\u0443\u0436\u0438\u0435 \u0441\u043e \u0441\u0442\u0438\u0445\u0438\u0439\u043d\u043e\u0439 \u0447\u0430\u043a\u0440\u043e\u0439', '\u0422\u0435\u0445\u043d\u0438\u043a\u0430 \u0431\u0435\u0437 \u043f\u0435\u0447\u0430\u0442\u0435\u0439 \u0438 \u0431\u043b\u0438\u0436\u043d\u044f\u044f \u0438\u043b\u0438 \u0434\u0430\u043b\u044c\u043d\u044f\u044f \u0430\u0442\u0430\u043a\u0430 \u043e\u0440\u0443\u0436\u0438\u0435\u043c: +50% \u0443\u0440\u043e\u043d\u0430 \u0442\u0435\u0445\u043d\u0438\u043a\u0438.'],
      ['situation-chakra-unarmed', '\u0420\u0443\u043a\u043e\u043f\u0430\u0448\u043d\u0430\u044f \u0430\u0442\u0430\u043a\u0430 \u0441 \u0447\u0430\u043a\u0440\u043e\u0439', '\u0421\u0442\u0438\u0445\u0438\u0439\u043d\u0430\u044f \u0442\u0435\u0445\u043d\u0438\u043a\u0430 \u0431\u0435\u0437 \u043f\u0435\u0447\u0430\u0442\u0435\u0439 \u0438 \u0440\u0443\u043a\u043e\u043f\u0430\u0448\u043d\u0430\u044f \u0430\u0442\u0430\u043a\u0430: +20% \u0443\u0440\u043e\u043d\u0430 \u0442\u0435\u0445\u043d\u0438\u043a\u0438.'],
      ['situation-ranged-bombs', '\u0414\u0430\u043b\u044c\u043d\u0438\u0439 \u0431\u043e\u0439 \u0441 \u0431\u043e\u043c\u0431\u0430\u043c\u0438', '\u0411\u0440\u043e\u0441\u043e\u043a \u043e\u0440\u0443\u0436\u0438\u044f \u043e\u0434\u043d\u043e\u0439 \u0440\u0443\u043a\u043e\u0439 \u0438 \u0434\u043e \u0442\u0430\u043a\u043e\u0433\u043e \u0436\u0435 \u043a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u0430 \u0434\u044b\u043c\u043e\u0432\u044b\u0445 \u0438\u043b\u0438 \u0441\u0432\u0435\u0442\u043e\u0432\u044b\u0445 \u0431\u043e\u043c\u0431.'],
      ['situation-poison-weapon', '\u0410\u0442\u0430\u043a\u0430 \u044f\u0434\u043e\u0432\u0438\u0442\u044b\u043c \u043e\u0440\u0443\u0436\u0438\u0435\u043c', '\u041f\u043e\u0434\u0433\u043e\u0442\u043e\u0432\u043a\u0430 \u044f\u0434\u0430, \u0437\u0430\u0442\u0435\u043c \u0431\u043b\u0438\u0436\u043d\u044f\u044f \u0438\u043b\u0438 \u0434\u0430\u043b\u044c\u043d\u044f\u044f \u0430\u0442\u0430\u043a\u0430 \u043e\u0440\u0443\u0436\u0438\u0435\u043c.'],
      ['situation-poison-smoke', '\u0410\u0442\u0430\u043a\u0430 \u044f\u0434\u043e\u0432\u0438\u0442\u044b\u043c \u0434\u044b\u043c\u043e\u043c', '\u041f\u043e\u0434\u0433\u043e\u0442\u043e\u0432\u043a\u0430 \u044f\u0434\u0430 \u0438 \u043f\u0440\u0438\u043c\u0435\u043d\u0435\u043d\u0438\u0435 \u0434\u044b\u043c\u043e\u0432\u043e\u0439 \u0431\u043e\u043c\u0431\u044b.'],
      ['situation-substitution-item', '\u0417\u0430\u043c\u0435\u043d\u0430 \u043d\u0430 \u043f\u0440\u0435\u0434\u043c\u0435\u0442', '\u0422\u0435\u0445\u043d\u0438\u043a\u0430 \u0417\u0430\u043c\u0435\u043d\u044b \u0431\u0435\u0437 \u043f\u0435\u0447\u0430\u0442\u0435\u0439 \u0438 \u043f\u043e\u0434\u0433\u043e\u0442\u043e\u0432\u043a\u0430 \u043f\u0440\u0435\u0434\u043c\u0435\u0442\u0430 \u0438\u0437 \u0438\u043d\u0432\u0435\u043d\u0442\u0430\u0440\u044f.'],
      ['situation-substitution-clone', '\u0417\u0430\u043c\u0435\u043d\u0430 \u0441 \u0441\u043e\u0437\u0434\u0430\u043d\u0438\u0435\u043c \u043a\u043b\u043e\u043d\u0430', '\u0422\u0435\u0445\u043d\u0438\u043a\u0430 \u0417\u0430\u043c\u0435\u043d\u044b \u0431\u0435\u0437 \u043f\u0435\u0447\u0430\u0442\u0435\u0439 \u0438 \u0442\u0435\u0445\u043d\u0438\u043a\u0430 \u043a\u043b\u043e\u043d\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u044f \u043d\u0435 \u043d\u0438\u0436\u0435 D.'],
      ['situation-hide', '\u0423\u0432\u043e\u0440\u043e\u0442 \u0441\u043e\u043a\u0440\u044b\u0442\u0438\u0435\u043c', '\u0422\u0435\u0445\u043d\u0438\u043a\u0430 \u0441 \u00ab\u0441\u043e\u043a\u0440\u044b\u0442\u00bb \u0432 \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u0438 \u043f\u0440\u0438\u043c\u0435\u043d\u044f\u0435\u0442\u0441\u044f \u0431\u0435\u0437 \u043f\u0435\u0447\u0430\u0442\u0435\u0439.'],
      ['situation-clone-hide', '\u0421\u043e\u0437\u0434\u0430\u043d\u0438\u0435 \u0438 \u0441\u043e\u043a\u0440\u044b\u0442\u0438\u0435 \u043a\u043b\u043e\u043d\u0430', '\u041a\u043b\u043e\u043d\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435 \u043d\u0435 \u043d\u0438\u0436\u0435 D \u0438 \u0442\u0435\u0445\u043d\u0438\u043a\u0430 \u0441\u043e\u043a\u0440\u044b\u0442\u0438\u044f.'],
      ['substitution', '\u0423\u0432\u043e\u0440\u043e\u0442 \u0417\u0430\u043c\u0435\u043d\u043e\u0439', '\u041f\u0440\u0438\u043c\u0435\u043d\u0438\u0442\u044c \u0422\u0435\u0445\u043d\u0438\u043a\u0443 \u0417\u0430\u043c\u0435\u043d\u044b \u0431\u0435\u0437 \u0441\u043a\u043b\u0430\u0434\u044b\u0432\u0430\u043d\u0438\u044f \u043f\u0435\u0447\u0430\u0442\u0435\u0439 \u043a\u0430\u043a \u0437\u0430\u0449\u0438\u0442\u043d\u043e\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435.']
    ];
    if (type === 'attack') options = [
      ['ordinary-unarmed', '\u0411\u043b\u0438\u0436\u043d\u0438\u0439 \u0440\u0443\u043a\u043e\u043f\u0430\u0448\u043d\u044b\u0439 \u0431\u043e\u0439', '\u0410\u0442\u0430\u043a\u0430 \u0431\u0435\u0437 \u043e\u0440\u0443\u0436\u0438\u044f, \u043e\u0441\u043d\u043e\u0432\u0430\u043d\u043d\u0430\u044f \u043d\u0430 \u0422\u0430\u0439\u0434\u0437\u044e\u0446\u0443.'],
      ['ordinary-melee', '\u0411\u043b\u0438\u0436\u043d\u0438\u0439 \u0431\u043e\u0439 \u0441 \u043e\u0440\u0443\u0436\u0438\u0435\u043c', '\u041a\u043e\u043d\u0442\u0430\u043a\u0442\u043d\u0430\u044f \u0430\u0442\u0430\u043a\u0430 \u0432\u044b\u0431\u0440\u0430\u043d\u043d\u044b\u043c \u043e\u0440\u0443\u0436\u0438\u0435\u043c.'],
      ['ordinary-ranged', '\u0414\u0430\u043b\u044c\u043d\u0438\u0439 \u0431\u043e\u0439 \u0441 \u043e\u0440\u0443\u0436\u0438\u0435\u043c', '\u0411\u0440\u043e\u0441\u043e\u043a \u043c\u0435\u0442\u0430\u0442\u0435\u043b\u044c\u043d\u043e\u0433\u043e \u043e\u0440\u0443\u0436\u0438\u044f.'],
      ['attack-item', '\u0410\u0442\u0430\u043a\u0430 \u043f\u0440\u0435\u0434\u043c\u0435\u0442\u043e\u043c', '\u0414\u043e\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044c\u043d\u043e\u0435 \u043e\u0440\u0443\u0436\u0438\u0435, \u0441\u0442\u0440\u0435\u043b\u043a\u043e\u0432\u043e\u0435 \u043e\u0440\u0443\u0436\u0438\u0435 \u043a\u0430\u043a \u043f\u0440\u0435\u0434\u043c\u0435\u0442 \u0438 \u0434\u0440\u0443\u0433\u0438\u0435 \u0431\u043e\u0435\u0432\u044b\u0435 \u043f\u0440\u0435\u0434\u043c\u0435\u0442\u044b. \u041a\u0430\u0436\u0434\u044b\u0435 1\u20132 \u043f\u0440\u0435\u0434\u043c\u0435\u0442\u0430 \u0440\u0430\u0441\u0445\u043e\u0434\u0443\u044e\u0442 1 \u041e\u0414.'],
      ['fuin-break', '\u0421\u043b\u043e\u043c \u0424\u0443\u0438\u043d\u0434\u0437\u044e\u0446\u0443', '\u0421\u043d\u044f\u0442\u044c \u043f\u0435\u0447\u0430\u0442\u044c \u0438\u043b\u0438 \u0432\u0437\u043b\u043e\u043c\u0430\u0442\u044c \u0431\u0430\u0440\u044c\u0435\u0440. \u041f\u0440\u043e\u0432\u0435\u0440\u043a\u0430: \u0424\u0443\u0438\u043d\u0434\u0437\u044e\u0446\u0443 + \u041d\u0438\u043d\u0434\u0437\u044e\u0446\u0443.'],
      ['tech-attack', '\u0410\u0442\u0430\u043a\u0430 \u0442\u0435\u0445\u043d\u0438\u043a\u043e\u0439', '\u0410\u0442\u0430\u043a\u0443\u044e\u0449\u0430\u044f \u0442\u0435\u0445\u043d\u0438\u043a\u0430 \u0438\u0437 \u043b\u0438\u0447\u043d\u043e\u0433\u043e \u0434\u0435\u043b\u0430.'],
      ['companion', '\u0410\u0442\u0430\u043a\u0430 \u0441\u043f\u0443\u0442\u043d\u0438\u043a\u0430', '\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u043f\u0440\u0438\u0437\u0432\u0430\u043d\u043d\u043e\u0433\u043e \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0430, \u0436\u0438\u0432\u043e\u0442\u043d\u043e\u0433\u043e \u0438\u043b\u0438 \u043c\u0430\u0440\u0438\u043e\u043d\u0435\u0442\u043a\u0438; \u043e\u0447\u043a\u0438 \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0430 \u043d\u0435 \u0442\u0440\u0430\u0442\u044f\u0442\u0441\u044f.']
    ];
    if (type === 'attack' && weaponOptions('firearm').length) {
      options.splice(3, 0, ['ordinary-firearm', '\u0410\u0442\u0430\u043a\u0430 \u043e\u0433\u043d\u0435\u0441\u0442\u0440\u0435\u043b\u044c\u043d\u044b\u043c \u043e\u0440\u0443\u0436\u0438\u0435\u043c', '\u041f\u0440\u043e\u0432\u0435\u0440\u043a\u0430: \u0422\u0430\u0439\u0434\u0437\u044e\u0446\u0443 + \u0422\u0430\u043a\u0442\u0438\u043a\u0430. \u0423\u0440\u043e\u043d \u0431\u0435\u0440\u0451\u0442\u0441\u044f \u0442\u043e\u043b\u044c\u043a\u043e \u0438\u0437 \u043e\u0440\u0443\u0436\u0438\u044f.']);
    }
    if (type === 'attack' && weaponOptions('shooting').length) {
      options.splice(3, 0, ['ordinary-shooting', '\u0421\u0442\u0440\u0435\u043b\u044c\u0431\u0430', '\u041f\u0440\u043e\u0432\u0435\u0440\u043a\u0430: \u0410\u0442\u0430\u043a\u0430 \u043d\u0430 \u0434\u0438\u0441\u0442\u0430\u043d\u0446\u0438\u0438. \u0423\u0440\u043e\u043d \u0438 \u0440\u0430\u0441\u0445\u043e\u0434 \u0431\u0435\u0440\u0443\u0442\u0441\u044f \u0438\u0437 \u0432\u044b\u0431\u0440\u0430\u043d\u043d\u043e\u0433\u043e \u0431\u043e\u0435\u043f\u0440\u0438\u043f\u0430\u0441\u0430.']);
    }
    if (type === 'attack' && !hasAvailableCompanions()) options = options.filter(function (item) { return item[0] !== 'companion'; });
    if (type === 'defense') options = [
      ['dodge', '\u0423\u043a\u043b\u043e\u043d\u0435\u043d\u0438\u0435', '\u041f\u043e\u043f\u044b\u0442\u043a\u0430 \u043f\u043e\u043b\u043d\u043e\u0441\u0442\u044c\u044e \u0443\u0439\u0442\u0438 \u043e\u0442 \u0430\u0442\u0430\u043a\u0438. \u0421\u0442\u043e\u0438\u043c\u043e\u0441\u0442\u044c: 1 \u041e\u0414.'],
      ['defense-unarmed', '\u0420\u0443\u043a\u043e\u043f\u0430\u0448\u043d\u0430\u044f \u0437\u0430\u0449\u0438\u0442\u0430', '\u0411\u043b\u043e\u043a \u0431\u0435\u0437 \u043e\u0440\u0443\u0436\u0438\u044f. \u0421\u0442\u043e\u0438\u043c\u043e\u0441\u0442\u044c: 1 \u041e\u0414.'],
      ['defense-melee', '\u0417\u0430\u0449\u0438\u0442\u0430 \u043e\u0440\u0443\u0436\u0438\u0435\u043c', '\u0411\u043b\u043e\u043a \u0438\u043b\u0438 \u043f\u0430\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435 \u043e\u0440\u0443\u0436\u0438\u0435\u043c \u0431\u043b\u0438\u0436\u043d\u0435\u0433\u043e \u0431\u043e\u044f. \u0421\u0442\u043e\u0438\u043c\u043e\u0441\u0442\u044c: 1 \u041e\u0414.'],
      ['defense-object', '\u0417\u0430\u0449\u0438\u0442\u0430 \u043f\u0440\u0435\u0434\u043c\u0435\u0442\u0430\u043c\u0438', '\u0429\u0438\u0442 \u0438\u043b\u0438 \u043f\u043e\u0434\u0440\u0443\u0447\u043d\u044b\u0439 \u043f\u0440\u0435\u0434\u043c\u0435\u0442. \u0421\u0442\u043e\u0438\u043c\u043e\u0441\u0442\u044c: 1 \u041e\u0414.'],
      ['chakra-defense', '\u0417\u0430\u0449\u0438\u0442\u0430 \u0447\u0430\u043a\u0440\u043e\u0439', '\u041a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0430\u0446\u0438\u044f \u0447\u0430\u043a\u0440\u044b \u0432 \u043c\u0435\u0441\u0442\u0435 \u0443\u0434\u0430\u0440\u0430: +10\u201330 \u043a \u0417\u0430\u0449\u0438\u0442\u0435.'],
      ['substitution', '\u0422\u0435\u0445\u043d\u0438\u043a\u0430 \u0417\u0430\u043c\u0435\u043d\u044b', '\u0417\u0430\u0449\u0438\u0442\u043d\u043e\u0435 \u043f\u0440\u0438\u043c\u0435\u043d\u0435\u043d\u0438\u0435 \u0422\u0435\u0445\u043d\u0438\u043a\u0438 \u0417\u0430\u043c\u0435\u043d\u044b \u0438\u0437 \u043b\u0438\u0447\u043d\u043e\u0433\u043e \u0434\u0435\u043b\u0430.'],
      ['tech-defense', '\u0417\u0430\u0449\u0438\u0442\u0430 \u0442\u0435\u0445\u043d\u0438\u043a\u043e\u0439', '\u0417\u0430\u0449\u0438\u0442\u043d\u043e\u0435 \u043f\u0440\u0438\u043c\u0435\u043d\u0435\u043d\u0438\u0435 \u0442\u0435\u0445\u043d\u0438\u043a\u0438 \u0441 \u0440\u0430\u0441\u0445\u043e\u0434\u043e\u043c \u041e\u0422.'],
      ['defense-ranged', '\u0417\u0430\u0449\u0438\u0442\u0430 \u0434\u0430\u043b\u044c\u043d\u0435\u0433\u043e \u0431\u043e\u044f', '\u0421\u0431\u0438\u0442\u044c \u0430\u0442\u0430\u043a\u0443 \u043c\u0435\u0442\u0430\u0442\u0435\u043b\u044c\u043d\u044b\u043c \u043e\u0440\u0443\u0436\u0438\u0435\u043c. \u0421\u0442\u043e\u0438\u043c\u043e\u0441\u0442\u044c: 1 \u041e\u0414.']
    ];
    if (type === 'support') options = [
      ['trap', '\u041f\u043e\u0434\u0433\u043e\u0442\u043e\u0432\u043a\u0430 \u043b\u043e\u0432\u0443\u0448\u043a\u0438', '\u041f\u043e\u0434\u0433\u043e\u0442\u043e\u0432\u043a\u0430 \u043b\u043e\u0432\u0443\u0448\u043a\u0438 \u043d\u0430 \u043f\u043e\u043b\u0435 \u0431\u043e\u044f. \u0421\u0442\u043e\u0438\u043c\u043e\u0441\u0442\u044c: 1 \u041e\u0414.'],
      ['medicine', '\u0418\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u0435 \u043f\u0440\u0435\u043f\u0430\u0440\u0430\u0442\u0430', '\u041f\u0438\u043b\u044e\u043b\u0438, \u044f\u0434\u044b, \u043f\u0440\u043e\u0442\u0438\u0432\u043e\u044f\u0434\u0438\u044f \u0438 \u0441\u043e\u0434\u0435\u0440\u0436\u0438\u043c\u043e\u0435 \u043c\u0435\u0434\u0438\u0446\u0438\u043d\u0441\u043a\u043e\u0433\u043e \u043d\u0430\u0431\u043e\u0440\u0430. \u0421\u0442\u043e\u0438\u043c\u043e\u0441\u0442\u044c: 1 \u041e\u0414.'],
      ['prepared-item', '\u0418\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u0435 \u043f\u0440\u0435\u0434\u043c\u0435\u0442\u0430', '\u041f\u0440\u0435\u0434\u043c\u0435\u0442 \u0438\u0437 \u0440\u0430\u0441\u0445\u043e\u0434\u043d\u0438\u043a\u043e\u0432 \u0438\u043b\u0438 \u043d\u0430\u0431\u043e\u0440\u0430 \u0448\u0438\u043d\u043e\u0431\u0438. \u0421\u0442\u043e\u0438\u043c\u043e\u0441\u0442\u044c: 1 \u041e\u0414.'],
      ['stability', '\u0423\u0441\u0442\u043e\u0439\u0447\u0438\u0432\u043e\u0441\u0442\u044c / \u043f\u0440\u044b\u0433\u0443\u0447\u0435\u0441\u0442\u044c', '\u0423\u0441\u0438\u043b\u0435\u043d\u0438\u0435 \u0447\u0430\u043a\u0440\u043e\u0439 \u0434\u043b\u044f \u0443\u0441\u0442\u043e\u0439\u0447\u0438\u0432\u043e\u0441\u0442\u0438, \u043f\u0440\u044b\u0436\u043a\u0430 \u0438\u043b\u0438 \u043f\u0440\u043e\u0442\u0438\u0432\u043e\u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044f \u0441\u0431\u0438\u0432\u0430\u043d\u0438\u044e \u0441 \u043d\u043e\u0433.'],
      ['critical-focus', '\u0423\u0441\u0438\u043b\u0438\u0442\u044c \u0448\u0430\u043d\u0441 \u043a\u0440\u0438\u0442\u0430', '\u0412\u043b\u043e\u0436\u0438\u0442\u044c 1\u20133 \u0447\u0430\u043a\u0440\u044b \u0434\u043e \u0431\u0440\u043e\u0441\u043a\u043e\u0432: \u043a\u0430\u0436\u0434\u0430\u044f \u0435\u0434\u0438\u043d\u0438\u0446\u0430 \u0434\u0430\u0451\u0442 +10% \u043a\u043e \u0432\u0441\u0435\u043c \u0430\u0442\u0430\u043a\u0430\u043c \u0445\u043e\u0434\u0430. \u0420\u0430\u0437 \u0432 \u0442\u0440\u0438 \u0445\u043e\u0434\u0430.'],
      ['turn-chakra-cost', '\u0417\u0430\u0442\u0440\u0430\u0442\u0430 \u0447\u0430\u043a\u0440\u044b \u0432 \u0445\u043e\u0434', '\u041e\u043f\u043b\u0430\u0442\u0438\u0442\u044c \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0443 \u0443\u0436\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0443\u044e\u0449\u0435\u0439 \u0442\u0435\u0445\u043d\u0438\u043a\u0438 \u0438\u043b\u0438 \u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u0438 \u0441 \u0440\u0443\u0447\u043d\u044b\u043c \u0432\u044b\u0431\u043e\u0440\u043e\u043c \u0437\u0430\u043f\u0430\u0441\u0430 \u0447\u0430\u043a\u0440\u044b.'],
      ['surface-hold', '\u0423\u0434\u0435\u0440\u0436\u0430\u043d\u0438\u0435 \u043d\u0430 \u043f\u043e\u0432\u0435\u0440\u0445\u043d\u043e\u0441\u0442\u0438 \u0447\u0430\u043a\u0440\u043e\u0439', '\u0425\u043e\u0436\u0434\u0435\u043d\u0438\u0435 \u043f\u043e \u0432\u043e\u0434\u0435 \u0438\u043b\u0438 \u0442\u0432\u0451\u0440\u0434\u043e\u0439 \u043f\u043e\u0432\u0435\u0440\u0445\u043d\u043e\u0441\u0442\u0438 \u0441 \u0440\u0430\u0441\u0445\u043e\u0434\u043e\u043c \u0447\u0430\u043a\u0440\u044b.'],
      ['concentration', '\u041a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0430\u0446\u0438\u044f \u0447\u0430\u043a\u0440\u044b', '\u041f\u043e\u043b\u043d\u0430\u044f \u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0430\u0446\u0438\u044f \u043b\u0438\u0431\u043e \u043f\u0435\u0440\u0435\u0432\u043e\u0434 \u0447\u0430\u043a\u0440\u044b \u0438\u0437 \u043e\u0431\u0449\u0435\u0433\u043e \u0437\u0430\u043f\u0430\u0441\u0430.'],
      ['create-clone', '\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u043a\u043b\u043e\u043d\u0430', '\u041a\u043b\u043e\u043d\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435 \u0438\u0437 \u043b\u0438\u0447\u043d\u043e\u0433\u043e \u0434\u0435\u043b\u0430, \u0440\u0430\u0441\u043f\u0440\u0435\u0434\u0435\u043b\u0435\u043d\u0438\u0435 \u0447\u0430\u043a\u0440\u044b \u0438 \u043e\u0442\u0434\u0435\u043b\u044c\u043d\u044b\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044f \u043a\u043b\u043e\u043d\u043e\u0432.'],
      ['summon', '\u041f\u0440\u0438\u0437\u044b\u0432', '\u041b\u0438\u0447\u043d\u044b\u0439 \u043b\u0438\u0431\u043e \u043e\u0431\u044b\u0447\u043d\u044b\u0439 \u043f\u0440\u0438\u0437\u044b\u0432 \u0447\u0435\u0440\u0435\u0437 \u0422\u0435\u0445\u043d\u0438\u043a\u0443 \u043f\u0440\u0438\u0437\u044b\u0432\u0430.'],
      ['tech-support', '\u0418\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u0435 \u0442\u0435\u0445\u043d\u0438\u043a\u0438', '\u041f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430, \u0443\u0441\u0438\u043b\u0435\u043d\u0438\u0435 \u0438 \u0438\u043d\u043e\u0435 \u043d\u0435 \u0447\u0438\u0441\u0442\u043e \u0430\u0442\u0430\u043a\u0443\u044e\u0449\u0435\u0435/\u0437\u0430\u0449\u0438\u0442\u043d\u043e\u0435 \u043f\u0440\u0438\u043c\u0435\u043d\u0435\u043d\u0438\u0435.'],
      ['ability-activation', '\u0410\u043a\u0442\u0438\u0432\u0430\u0446\u0438\u044f \u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u0438', '\u0410\u043a\u0442\u0438\u0432\u0430\u0446\u0438\u044f \u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u0438 \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0430 \u0441 \u0440\u0430\u0441\u0445\u043e\u0434\u043e\u043c \u0447\u0430\u043a\u0440\u044b.']
    ];
    if (type === 'support' && !(state.character.abilities || []).length) {
      options = options.filter(function (item) { return item[0] !== 'ability-activation'; });
    }
    if (type === 'move') options = [
      ['move-short', '\u041f\u0435\u0440\u0435\u0434\u0432\u0438\u0436\u0435\u043d\u0438\u0435', '\u041f\u0435\u0440\u0435\u043c\u0435\u0449\u0435\u043d\u0438\u0435 \u043f\u043e \u043f\u043e\u043b\u044e \u0431\u043e\u044f. \u0421\u0442\u043e\u0438\u043c\u043e\u0441\u0442\u044c: 1 \u041e\u0414.'],
      ['move-long', '\u0421\u0431\u043b\u0438\u0436\u0435\u043d\u0438\u0435 \u0438\u043b\u0438 \u043f\u043e\u0431\u0435\u0433', '\u0414\u0432\u0438\u0436\u0435\u043d\u0438\u0435 \u043d\u0430 \u0434\u0430\u043b\u044c\u043d\u0435\u0435 \u0440\u0430\u0441\u0441\u0442\u043e\u044f\u043d\u0438\u0435. \u0421\u0442\u043e\u0438\u043c\u043e\u0441\u0442\u044c: 2 \u041e\u0414.']
    ];
    if (type === 'move' && hasBodyFlickerTechnique()) {
      options.push(['body-flicker', '\u0422\u0435\u0445\u043d\u0438\u043a\u0430 \u041c\u0435\u0440\u0446\u0430\u044e\u0449\u0435\u0433\u043e \u0422\u0435\u043b\u0430', '\u0411\u044b\u0441\u0442\u0440\u043e\u0435 \u0441\u0431\u043b\u0438\u0436\u0435\u043d\u0438\u0435 \u0438\u043b\u0438 \u043f\u043e\u0431\u0435\u0433 \u0441 \u043f\u0440\u0438\u043c\u0435\u043d\u0435\u043d\u0438\u0435\u043c \u0442\u0435\u0445\u043d\u0438\u043a\u0438.']);
    }
    if (type === 'special') options = [
      ['illusion-release', '\u0421\u043d\u044f\u0442\u0438\u0435 \u0438\u043b\u043b\u044e\u0437\u0438\u0438 \u0441 \u0441\u043e\u044e\u0437\u043d\u0438\u043a\u0430', '\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043f\u043e\u0434\u0445\u043e\u0434\u044f\u0449\u0443\u044e \u0442\u0435\u0445\u043d\u0438\u043a\u0443 \u0438 \u0443\u043a\u0430\u0436\u0438\u0442\u0435 \u0441\u043e\u044e\u0437\u043d\u0438\u043a\u0430.'],
      ['chakra-transfer', '\u041f\u0435\u0440\u0435\u0434\u0430\u0447\u0430 \u0447\u0430\u043a\u0440\u044b', '\u041f\u0435\u0440\u0435\u0434\u0430\u0442\u044c \u0432\u044b\u0431\u0440\u0430\u043d\u043d\u044b\u0439 \u043e\u0431\u044a\u0451\u043c \u0447\u0430\u043a\u0440\u044b \u0434\u0440\u0443\u0433\u043e\u043c\u0443 \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0443.'],
      ['healing', '\u041b\u0435\u0447\u0435\u043d\u0438\u0435 \u0441\u043e\u044e\u0437\u043d\u0438\u043a\u0430', '\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043b\u0435\u0447\u0435\u0431\u043d\u0443\u044e \u0442\u0435\u0445\u043d\u0438\u043a\u0443 \u0441 \u0442\u0438\u043f\u043e\u043c \u044d\u0444\u0444\u0435\u043a\u0442\u0430 \u00ab\u041b\u0435\u0447\u0435\u043d\u0438\u0435\u00bb \u0438 \u0443\u043a\u0430\u0436\u0438\u0442\u0435 \u0446\u0435\u043b\u044c.'],
      ['received-healing', '\u041f\u043e\u043b\u0443\u0447\u0435\u043d\u043e \u043b\u0435\u0447\u0435\u043d\u0438\u0435', '\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u043f\u043e\u043b\u0443\u0447\u0435\u043d\u043d\u043e\u0435 HP, \u043d\u043e \u043d\u0435 \u0432\u044b\u0448\u0435 \u043c\u0430\u043a\u0441\u0438\u043c\u0443\u043c\u0430.'],
      ['received-chakra', '\u041f\u043e\u043b\u0443\u0447\u0435\u043d\u0430 \u0447\u0430\u043a\u0440\u0430', '\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u043f\u043e\u043b\u0443\u0447\u0435\u043d\u043d\u0443\u044e \u0447\u0430\u043a\u0440\u0443 \u0432 \u043e\u0431\u0449\u0438\u0439 \u0437\u0430\u043f\u0430\u0441.'],
      ['received-wound', '\u041f\u043e\u043b\u0443\u0447\u0435\u043d\u043e \u0440\u0430\u043d\u0435\u043d\u0438\u0435', '\u0412\u044b\u0447\u0435\u0441\u0442\u044c \u043f\u043e\u043b\u0443\u0447\u0435\u043d\u043d\u044b\u0439 \u0443\u0440\u043e\u043d \u0438\u0437 \u0442\u0435\u043a\u0443\u0449\u0435\u0433\u043e HP.'],
      ['received-effect', '\u041f\u043e\u043b\u0443\u0447\u0435\u043d \u044d\u0444\u0444\u0435\u043a\u0442', '\u041e\u0436\u043e\u0433, \u043a\u0440\u043e\u0432\u043e\u0442\u0435\u0447\u0435\u043d\u0438\u0435, \u0431\u0430\u0444\u0444, \u043e\u0431\u0435\u0437\u0434\u0432\u0438\u0436\u0438\u0432\u0430\u043d\u0438\u0435 \u0438\u043b\u0438 \u043f\u0441\u0438\u0445\u043e\u043b\u043e\u0433\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u044d\u0444\u0444\u0435\u043a\u0442.'],
      ['trauma-concentration', '\u041a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0430\u0446\u0438\u044f \u043f\u0440\u0438 \u0442\u0440\u0430\u0432\u043c\u0435', '1\u20133 \u0447\u0430\u043a\u0440\u044b \u0432\u0440\u0435\u043c\u0435\u043d\u043d\u043e \u0432\u043e\u0441\u0441\u0442\u0430\u043d\u0430\u0432\u043b\u0438\u0432\u0430\u044e\u0442 20\u201360 \u0431\u043e\u0435\u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u0438.']
    ];
    if (type === 'special' && !(state.actorScope && state.actorScope.noArtifacts) && (state.character.artifacts || []).some(function (item) { return item.effects && item.effects.length; })) options.push(['artifact-effect', '\u0418\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u044c \u044d\u0444\u0444\u0435\u043a\u0442 \u0430\u0440\u0442\u0435\u0444\u0430\u043a\u0442\u0430', '\u0410\u043a\u0442\u0438\u0432\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u044b\u0439 \u044d\u0444\u0444\u0435\u043a\u0442 \u0441 \u0440\u0430\u0441\u0445\u043e\u0434\u043e\u043c \u0447\u0430\u043a\u0440\u044b.']);
    if (type === 'special' && statValue('fuinjutsu') >= 10) options.push(['sacrifice', '\u0416\u0435\u0440\u0442\u0432\u0430', '\u041e\u0434\u0438\u043d \u0440\u0430\u0437 \u0437\u0430 \u0431\u043e\u0439: \u221220 HP \u0438 +2 \u043a \u0432\u044b\u0431\u0440\u0430\u043d\u043d\u043e\u043c\u0443 \u043f\u0430\u0440\u0430\u043c\u0435\u0442\u0440\u0443.']);
    if (state.actorScope && state.actorScope.noTechniques) options = options.filter(function (item) { return !/^(?:tech-|create-clone|summon|healing|illusion-release|ability-activation)/.test(item[0]); });
    panel.innerHTML = actionTypeIntro(type) + '<div class="aba-option-grid">' + options.map(function (item) {
      return '<button type="button" data-action="' + item[0] + '"><strong>' + item[1] + '</strong><small>' + item[2] + '</small></button>';
    }).join('') + '</div><div class="aba-action-editor"></div><div class="aba-builder-message" aria-live="polite"></div>';
    Array.prototype.forEach.call(panel.querySelectorAll('[data-action]'), function (button) {
      on(button, 'click', function () {
        Array.prototype.forEach.call(panel.querySelectorAll('[data-action]'), function (item) { item.classList.toggle('is-active', item === button); });
        if (button.dataset.action === 'companion') { state.builderTab = 'clones'; renderActionMenu(); return; }
        renderEditor(button.dataset.action);
      });
    });
  }

  function situationCloneAllowed(item) {
    return item.rank !== 'E' && /\u043a\u043b\u043e\u043d/i.test(item.name) && !cloneTechniqueRules(item).mass && (!item.detail || techniqueAllowed(item.detail, 'support', item));
  }

  function situationElementBonus(item, unarmed) {
    var calculation = techniqueCalculation(item, 'attack');
    if (techniquePowerNumber(item.detail.power) === null && clean(item.detail.power)) throw new Error('\u0423\u0440\u043e\u043d \u0442\u0435\u0445\u043d\u0438\u043a\u0438 \u0437\u0430\u0434\u0430\u043d \u0444\u043e\u0440\u043c\u0443\u043b\u043e\u0439: \u0434\u043b\u044f \u044d\u0442\u043e\u0439 \u0441\u0438\u0442\u0443\u0430\u0446\u0438\u0438 \u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044f \u0447\u0438\u0441\u043b\u043e\u0432\u043e\u0439 \u0443\u0440\u043e\u043d.');
    // Master-post numeric damage already includes elemental percentages, as in techniqueCalculation.
    var power = calculation.power;
    var bonus = combatRound(power * (unarmed ? 0.2 : 0.5));
    var element = normalizeText(item.detail.element || item.name);
    var notes = [];
    if (/\u043e\u0433\u043e\u043d\u044c|\u043e\u0433\u043d\u044f/.test(element)) notes.push('\u043e\u0436\u043e\u0433: ' + combatRound(power * 0.1) + ' \u0443\u0440\u043e\u043d\u0430 \u0432 \u0445\u043e\u0434, 3 \u0445\u043e\u0434\u0430');
    if (/\u0432\u043e\u0434\u0430|\u0432\u043e\u0434\u044b/.test(element)) notes.push('\u0412\u043e\u0434\u0430: +10% \u0443\u0440\u043e\u043d\u0430 \u0438 \u0437\u0430\u0449\u0438\u0442\u044b \u0442\u0435\u0445\u043d\u0438\u043a\u0438 (\u0443\u0447\u0442\u0435\u043d\u043e \u0432 \u043f\u0430\u0440\u0430\u043c\u0435\u0442\u0440\u0430\u0445 \u0442\u0435\u0445\u043d\u0438\u043a\u0438)');
    if (/\u0432\u0435\u0442\u0435\u0440|\u0432\u0435\u0442\u0440\u0430/.test(element)) notes.push('\u0412\u0435\u0442\u0435\u0440: +20% \u0443\u0440\u043e\u043d\u0430 \u0442\u0435\u0445\u043d\u0438\u043a\u0438 (\u0443\u0447\u0442\u0435\u043d\u043e \u0432 \u043f\u0430\u0440\u0430\u043c\u0435\u0442\u0440\u0430\u0445 \u0442\u0435\u0445\u043d\u0438\u043a\u0438)');
    if (/\u0437\u0435\u043c\u043b\u044f|\u0437\u0435\u043c\u043b\u0438/.test(element)) notes.push('\u0417\u0435\u043c\u043b\u044f: +20% \u0437\u0430\u0449\u0438\u0442\u044b \u0442\u0435\u0445\u043d\u0438\u043a\u0438');
    if (/\u043c\u043e\u043b\u043d\u0438\u044f|\u043c\u043e\u043b\u043d\u0438\u0438/.test(element)) notes.push('\u0438\u0433\u043d\u043e\u0440\u0438\u0440\u0443\u0435\u0442 40% \u0437\u0430\u0449\u0438\u0442\u044b \u0446\u0435\u043b\u0438');
    return { bonus: bonus, notes: notes.join('; ') };
  }

  function situationTechniqueAction(item, mode, noSeals) {
    if (!item || !item.detail) throw new Error('\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u0443\u044e \u0442\u0435\u0445\u043d\u0438\u043a\u0443 \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0430.');
    var c = techniqueCalculation(item, mode), check = techniqueCheck(item.detail);
    return { label: mode === 'attack' ? '\u0410\u0442\u0430\u043a\u0430 \u0442\u0435\u0445\u043d\u0438\u043a\u043e\u0439' : mode === 'defense' ? '\u0417\u0430\u0449\u0438\u0442\u0430 \u0442\u0435\u0445\u043d\u0438\u043a\u043e\u0439' : '\u0418\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u0435 \u0442\u0435\u0445\u043d\u0438\u043a\u0438',
      summary: item.name + (noSeals ? ' \u00b7 \u0431\u0435\u0437 \u043f\u0435\u0447\u0430\u0442\u0435\u0439' : ''), od: 0, ot: Math.max(1, c.ot - (noSeals ? 1 : 0)),
      code: '[url=' + item.url + ']' + item.name + '[/url]; ' + check.label + ': ' + (check.value + (noSeals && check.label === '\u0410\u0442\u0430\u043a\u0430 \u041d\u0438\u043d\u0434\u0437\u044e\u0446\u0443' ? 1 : 0)) + (noSeals ? '; \u0431\u0435\u0437 \u043f\u0435\u0447\u0430\u0442\u0435\u0439' : '') + '; ' + c.summary + (c.support ? '; \u041f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430 \u0442\u0435\u0445\u043d\u0438\u043a\u0438 #' + item.postId + ': \u0440\u0430\u043d\u0433 ' + c.rank + '; \u0440\u0430\u0441\u0445\u043e\u0434 ' + c.support : ''),
      link: item.url, chakraSpend: c.general + (noSeals ? 1 : 0), focusedChakraSpend: c.focused + (noSeals ? 1 : 0),
      techniqueUseKey: 'technique:' + item.postId, techniqueTurnLimit: techniqueTurnLimit(item.detail) };
  }

  function addSituationChain(actions) {
    var before = state.actions.slice(), captured = state.cloneCapturedActions && state.cloneCapturedActions.length;
    try {
      for (var i = 0; i < actions.length; i++) {
        if (!addAction(actions[i])) {
          state.actions = before;
          if (captured !== undefined) state.cloneCapturedActions.length = captured;
          rebalanceActions(); renderQueue(); renderResources();
          return false;
        }
      }
      return true;
    } catch (error) {
      state.actions = before;
      if (captured !== undefined) state.cloneCapturedActions.length = captured;
      rebalanceActions(); renderQueue(); renderResources();
      throw error;
    }
  }

  function situationWeaponAction(weapon, mode, count, bonus) {
    if (!weapon) throw new Error('\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043e\u0440\u0443\u0436\u0438\u0435 \u0438\u0437 \u0438\u043d\u0432\u0435\u043d\u0442\u0430\u0440\u044f.');
    if (!Number.isInteger(count) || count < 1 || count > (mode === 'ranged' ? (statValue('taijutsu') >= 10 ? 4 : 3) : 1)) throw new Error('\u041d\u0435\u0434\u043e\u043f\u0443\u0441\u0442\u0438\u043c\u043e\u0435 \u043a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e \u043e\u0440\u0443\u0436\u0438\u044f \u0434\u043b\u044f \u043e\u0434\u043d\u043e\u0439 \u0440\u0443\u043a\u0438.');
    var ranged = mode === 'ranged', value = statValue(ranged ? 'rangedAttack' : 'meleeAttack') - (ranged && count === 4 ? 1 : 0);
    var damage = weaponAttackDamage(weapon.damage) + (bonus ? ' +' + bonus.bonus : '');
    return { label: ranged ? '\u0414\u0430\u043b\u044c\u043d\u0438\u0439 \u0431\u043e\u0439 \u0441 \u043e\u0440\u0443\u0436\u0438\u0435\u043c' : '\u0411\u043b\u0438\u0436\u043d\u0438\u0439 \u0431\u043e\u0439 \u0441 \u043e\u0440\u0443\u0436\u0438\u0435\u043c', od: 1, ot: 0,
      summary: weapon.name + ' \u00d7' + count, code: (weapon.url ? '[url=' + weapon.url + ']' + weapon.name + '[/url]' : weapon.name) + ' \u00d7' + count + (ranged ? ' (\u043e\u0441\u043d\u043e\u0432\u043d\u0430\u044f \u0440\u0443\u043a\u0430)' : '') + '; ' + (ranged ? '\u0410\u0442\u0430\u043a\u0430 \u043d\u0430 \u0434\u0438\u0441\u0442\u0430\u043d\u0446\u0438\u0438' : '\u0410\u0442\u0430\u043a\u0430 \u0431\u043b\u0438\u0436\u043d\u0438\u0439 \u0431\u043e\u0439') + ': ' + value + '; \u0443\u0440\u043e\u043d: ' + damage + (ranged ? '; \u0443\u0440\u043e\u043d \u0437\u0430 \u043e\u0434\u043d\u043e \u043f\u043e\u043f\u0430\u0434\u0430\u043d\u0438\u0435' : '') + (bonus && bonus.notes ? '; ' + bonus.notes : '') + criticalNote(weapon.source || {}),
      attackFocus: true, counterAttack: !!combatState().counterAttack,
      inventoryUse: weapon.source && weapon.source.inventoryId ? [inventoryUse(weapon.source, count, ranged, false)] : [] };
  }

  function renderBattleSituation(editor, kind) {
    var elemental = /elemental-weapon|chakra-unarmed/.test(kind), unarmed = /chakra-unarmed/.test(kind);
    var clone = /substitution-clone|clone-hide/.test(kind), hide = /(?:clone-hide|situation-hide)$/.test(kind);
    var replacement = /substitution/.test(kind), bombs = /ranged-bombs/.test(kind), poison = /poison/.test(kind), smoke = /poison-smoke/.test(kind);
    var weaponNeeded = /elemental-weapon|ranged-bombs|poison-weapon/.test(kind);
    var titles = { 'situation-elemental-weapon': '\u041e\u0440\u0443\u0436\u0438\u0435 \u0441\u043e \u0441\u0442\u0438\u0445\u0438\u0439\u043d\u043e\u0439 \u0447\u0430\u043a\u0440\u043e\u0439', 'situation-chakra-unarmed': '\u0420\u0443\u043a\u043e\u043f\u0430\u0448\u043d\u0430\u044f \u0430\u0442\u0430\u043a\u0430 \u0441 \u0447\u0430\u043a\u0440\u043e\u0439', 'situation-ranged-bombs': '\u0414\u0430\u043b\u044c\u043d\u0438\u0439 \u0431\u043e\u0439 \u0441 \u0431\u043e\u043c\u0431\u0430\u043c\u0438', 'situation-poison-weapon': '\u0410\u0442\u0430\u043a\u0430 \u044f\u0434\u043e\u0432\u0438\u0442\u044b\u043c \u043e\u0440\u0443\u0436\u0438\u0435\u043c', 'situation-poison-smoke': '\u0410\u0442\u0430\u043a\u0430 \u044f\u0434\u043e\u0432\u0438\u0442\u044b\u043c \u0434\u044b\u043c\u043e\u043c', 'situation-substitution-item': '\u0417\u0430\u043c\u0435\u043d\u0430 \u043d\u0430 \u043f\u0440\u0435\u0434\u043c\u0435\u0442', 'situation-substitution-clone': '\u0417\u0430\u043c\u0435\u043d\u0430 \u0441 \u0441\u043e\u0437\u0434\u0430\u043d\u0438\u0435\u043c \u043a\u043b\u043e\u043d\u0430', 'situation-hide': '\u0423\u0432\u043e\u0440\u043e\u0442 \u0441\u043e\u043a\u0440\u044b\u0442\u0438\u0435\u043c', 'situation-clone-hide': '\u0421\u043e\u0437\u0434\u0430\u043d\u0438\u0435 \u0438 \u0441\u043e\u043a\u0440\u044b\u0442\u0438\u0435 \u043a\u043b\u043e\u043d\u0430', 'substitution': '\u0423\u0432\u043e\u0440\u043e\u0442 \u0417\u0430\u043c\u0435\u043d\u043e\u0439' };
    editor.innerHTML = '<h4>' + titles[kind] + '</h4><p>\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u044b\u0445 \u0442\u0435\u0445\u043d\u0438\u043a \u0438 \u043f\u0440\u0435\u0434\u043c\u0435\u0442\u043e\u0432\u2026</p>';
    var techniques = (state.character.techniques || []).filter(function (item) { return elemental ? /\u0442\u0435\u0445\u043d\u0438\u043a\u0430\s+\u044d\u043b\u0435\u043c\u0435\u043d\u0442\u0430/i.test(item.name) : (clone && situationCloneAllowed(item)) || (hide && /\u0441\u043e\u043a\u0440\u044b\u0442/i.test(item.name)) || (replacement && item === findCharacterTechnique(SUBSTITUTION_TECHNIQUE)); });
    actorAll(techniques.map(function (item) { return loadTechniqueDetail(item); })).then(function () {
      if (!editor.isConnected) return;
      function select(name, label, items, identity) {
        return '<label>' + label + '<select data-situation="' + name + '"><option value="">\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435</option>' + items.map(function (item) { return '<option value="' + escapeHtml(identity(item)) + '">' + escapeHtml(item.name) + (item.rank ? ' \u00b7 ' + item.rank : '') + '</option>'; }).join('') + '</select></label>';
      }
      var inventory = state.character.inventory || [];
      var html = '<h4>' + titles[kind] + '</h4>';
      if (elemental) html += '<p>\u0422\u0435\u0445\u043d\u0438\u043a\u0430 \u0431\u0435\u0437 \u043f\u0435\u0447\u0430\u0442\u0435\u0439 \u2192 ' + (unarmed ? '\u0440\u0443\u043a\u043e\u043f\u0430\u0448\u043d\u0430\u044f \u0430\u0442\u0430\u043a\u0430; +20%' : '\u0430\u0442\u0430\u043a\u0430 \u043e\u0440\u0443\u0436\u0438\u0435\u043c; +50%') + ' \u0443\u0440\u043e\u043d\u0430 \u0442\u0435\u0445\u043d\u0438\u043a\u0438 \u0438 \u043e\u0441\u043e\u0431\u0435\u043d\u043d\u043e\u0441\u0442\u0438 \u0441\u0442\u0438\u0445\u0438\u0438.</p>' + select('technique', '\u0421\u0442\u0438\u0445\u0438\u0439\u043d\u0430\u044f \u0442\u0435\u0445\u043d\u0438\u043a\u0430', techniques.filter(function (item) { return techniqueCategory(item.detail).attack; }), function (i) { return i.postId; });
      if (clone) html += select('clone', '\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u043e\u0434\u043d\u043e\u0433\u043e \u043a\u043b\u043e\u043d\u0430', techniques.filter(situationCloneAllowed), function (i) { return i.postId; }) + '<label>\u0427\u0430\u043a\u0440\u0430 \u0434\u043b\u044f \u043a\u043b\u043e\u043d\u0430 (\u0435\u0441\u043b\u0438 \u0434\u043e\u043f\u0443\u0441\u043a\u0430\u0435\u0442 \u0442\u0435\u0445\u043d\u0438\u043a\u0430)<input data-situation="clone-chakra" type="number" min="0" value="0"></label>';
      if (hide) html += select('hide', '\u0422\u0435\u0445\u043d\u0438\u043a\u0430 \u0441\u043e\u043a\u0440\u044b\u0442\u0438\u044f', techniques.filter(function (i) { return /\u0441\u043e\u043a\u0440\u044b\u0442/i.test(i.name) && i.detail && techniqueAllowed(i.detail, 'support', i); }), function (i) { return i.postId; });
      if (replacement) html += '<p>\u0422\u0435\u0445\u043d\u0438\u043a\u0430 \u0417\u0430\u043c\u0435\u043d\u044b \u043f\u0440\u0438\u043c\u0435\u043d\u044f\u0435\u0442\u0441\u044f \u0431\u0435\u0437 \u043f\u0435\u0447\u0430\u0442\u0435\u0439.</p>';
      if (poison || kind === 'situation-substitution-item') html += select('item', poison ? '\u041f\u0440\u0435\u043f\u0430\u0440\u0430\u0442: \u044f\u0434' : '\u041f\u0440\u0435\u0434\u043c\u0435\u0442 \u0434\u043b\u044f \u0437\u0430\u043c\u0435\u043d\u044b', inventory.filter(function (i) { return !poison || /\u044f\u0434/i.test(i.name); }), function (i) { return i.inventoryId; });
      if (smoke) html += select('smoke', '\u0414\u044b\u043c\u043e\u0432\u0430\u044f \u0431\u043e\u043c\u0431\u0430', inventory.filter(function (i) { return /\u0434\u044b\u043c\u043e\u0432\u0430\u044f/i.test(i.name); }), function (i) { return i.inventoryId; }) + '<label>\u041a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e<input data-situation="smoke-count" type="number" min="1" value="1"></label>';
      if (weaponNeeded || smoke) html += '<label>\u0414\u0438\u0441\u0442\u0430\u043d\u0446\u0438\u044f<select data-situation="mode">' + (bombs ? '' : '<option value="melee">\u0411\u043b\u0438\u0436\u043d\u0438\u0439 \u0431\u043e\u0439</option>') + '<option value="ranged">\u0414\u0430\u043b\u044c\u043d\u0438\u0439 \u0431\u043e\u0439</option></select></label>';
      if (weaponNeeded) html += '<div data-situation-weapons></div>';
      if (bombs) html += '<p>\u041f\u043e\u0434\u0433\u043e\u0442\u043e\u0432\u043a\u0430: 1 \u041e\u0414 \u0437\u0430 \u043a\u0430\u0436\u0434\u044b\u0435 1\u20132 \u0431\u043e\u043c\u0431\u044b. \u0411\u043e\u043c\u0431 \u043d\u0435 \u0431\u043e\u043b\u044c\u0448\u0435, \u0447\u0435\u043c \u0435\u0434\u0438\u043d\u0438\u0446 \u043e\u0440\u0443\u0436\u0438\u044f.</p>' + inventory.filter(function (i) { return /\u0431\u043e\u043c\u0431/i.test(i.name); }).map(function (i) { return '<label>' + escapeHtml(i.name) + ' (\u043e\u0441\u0442\u0430\u043b\u043e\u0441\u044c ' + inventoryRemaining(i) + ')<input data-bomb="' + escapeHtml(i.inventoryId) + '" type="number" min="0" max="' + inventoryRemaining(i) + '" value="0"></label>'; }).join('');
      html += '<button type="button" class="aba-primary" data-add-situation>\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0446\u0435\u043f\u043e\u0447\u043a\u0443 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439</button>';
      editor.innerHTML = html;
      function value(name) { return (editor.querySelector('[data-situation="' + name + '"]') || {}).value; }
      function updateWeapons() {
        if (!weaponNeeded) return;
        var mode = value('mode');
        editor.querySelector('[data-situation-weapons]').innerHTML = select('weapon', '\u041e\u0440\u0443\u0436\u0438\u0435 \u0438\u0437 \u0438\u043d\u0432\u0435\u043d\u0442\u0430\u0440\u044f', weaponOptions(mode), function (i) { return i.kind + ':' + i.id; }) + (mode === 'ranged' ? '<p>\u0422\u043e\u043b\u044c\u043a\u043e \u043e\u0441\u043d\u043e\u0432\u043d\u0430\u044f \u0440\u0443\u043a\u0430.</p><label>\u041a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e \u043e\u0440\u0443\u0436\u0438\u044f<input data-situation="count" type="number" min="1" max="' + (statValue('taijutsu') >= 10 ? 4 : 3) + '" value="1"></label>' : '');
        bindSearchPicker(editor.querySelector('[data-situation="weapon"]'));
      }
      updateWeapons();
      if (weaponNeeded) on(editor.querySelector('[data-situation="mode"]'), 'change', updateWeapons);
      Array.prototype.forEach.call(editor.querySelectorAll('select[data-situation]'), function (node) { if (node.dataset.situation !== 'mode') bindSearchPicker(node); });
      on(editor.querySelector('[data-add-situation]'), 'click', function () {
        try {
          var actions = [], bonus = null, mode = value('mode') || 'melee';
          function technique(name) { var item = techniques.find(function (i) { return String(i.postId) === value(name); }); if (!item) throw new Error('\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0442\u0435\u0445\u043d\u0438\u043a\u0443.'); return item; }
          function inventoryItem(name) { var item = inventory.find(function (i) { return i.inventoryId === value(name); }); if (!item) throw new Error('\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043f\u0440\u0435\u0434\u043c\u0435\u0442 \u0438\u0437 \u0438\u043d\u0432\u0435\u043d\u0442\u0430\u0440\u044f.'); return item; }
          function itemAction(item, count, label, od) { if (!Number.isInteger(count) || count < 1) throw new Error('\u0423\u043a\u0430\u0436\u0438\u0442\u0435 \u0446\u0435\u043b\u043e\u0435 \u043f\u043e\u043b\u043e\u0436\u0438\u0442\u0435\u043b\u044c\u043d\u043e\u0435 \u043a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e.'); return { label: label, summary: item.name + ' \u00d7' + count, code: item.name + ' \u00d7' + count, od: od, ot: 0, inventoryUse: [inventoryUse(item, count, true, false)] }; }
          if (poison || kind === 'situation-substitution-item') actions.push(itemAction(inventoryItem('item'), 1, poison ? '\u041f\u043e\u0434\u0433\u043e\u0442\u043e\u0432\u043a\u0430 \u2014 \u041f\u0440\u0435\u043f\u0430\u0440\u0430\u0442' : '\u041f\u043e\u0434\u0433\u043e\u0442\u043e\u0432\u043a\u0430 \u2014 \u041f\u0440\u0435\u0434\u043c\u0435\u0442', 1));
          if (clone) { var cloneItem = technique('clone'); if (!situationCloneAllowed(cloneItem)) throw new Error('\u042d\u0442\u0430 \u0442\u0435\u0445\u043d\u0438\u043a\u0430 \u043a\u043b\u043e\u043d\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u044f \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u043d\u0430.'); actions.push(cloneCreationAction(cloneItem, { count: 1, chakraPerClone: Number(value('clone-chakra')), placement: cloneTechniqueRules(cloneItem).chargeable ? Number(value('clone-chakra')) : 0 })); }
          if (elemental) { var tech = technique('technique'); bonus = situationElementBonus(tech, unarmed); actions.push(situationTechniqueAction(tech, 'attack', true)); }
          var count = mode === 'ranged' ? Number(value('count')) : 1;
          if (bombs) {
            var uses = [], names = [], total = 0;
            Array.prototype.forEach.call(editor.querySelectorAll('[data-bomb]'), function (node) {
              var n = Number(node.value), item = inventory.find(function (i) { return i.inventoryId === node.dataset.bomb; });
              if (!Number.isInteger(n) || n < 0) throw new Error('\u0423\u043a\u0430\u0436\u0438\u0442\u0435 \u0446\u0435\u043b\u043e\u0435 \u043a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e \u0431\u043e\u043c\u0431.');
              if (n) { total += n; uses.push(inventoryUse(item, n, true, false)); names.push(item.name + ' \u00d7' + n); }
            });
            if (!total || total > count) throw new Error('\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043e\u0442 \u043e\u0434\u043d\u043e\u0439 \u0431\u043e\u043c\u0431\u044b \u0434\u043e \u043a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u0430 \u0431\u0440\u043e\u0448\u0435\u043d\u043d\u043e\u0433\u043e \u043e\u0440\u0443\u0436\u0438\u044f.');
            actions.push({ label: '\u041f\u043e\u0434\u0433\u043e\u0442\u043e\u0432\u043a\u0430 \u0431\u043e\u043c\u0431 \u2014 \u0410\u0442\u0430\u043a\u0430 \u043f\u0440\u0435\u0434\u043c\u0435\u0442\u043e\u043c', summary: names.join(', '), code: names.join(', '), od: attackItemCost(total), ot: 0, inventoryUse: uses });
          }
          if (weaponNeeded) actions.push(situationWeaponAction(findWeapon(value('weapon'), mode), mode, count, bonus));
          if (unarmed) actions.push({ label: '\u0411\u043b\u0438\u0436\u043d\u0438\u0439 \u0440\u0443\u043a\u043e\u043f\u0430\u0448\u043d\u044b\u0439 \u0431\u043e\u0439', summary: '\u0410\u0442\u0430\u043a\u0430 \u0440\u0443\u043a\u043e\u043f\u0430\u0448\u043d\u0430\u044f', code: '\u0410\u0442\u0430\u043a\u0430 \u0431\u043b\u0438\u0436\u043d\u0438\u0439 \u0431\u043e\u0439: ' + statValue('meleeAttack') + '; \u0443\u0440\u043e\u043d \u0431\u0435\u0437 \u043e\u0440\u0443\u0436\u0438\u044f: ' + damageText('unarmedDamage') + ' +' + bonus.bonus + (bonus.notes ? '; ' + bonus.notes : ''), od: 1, ot: 0, attackFocus: true, counterAttack: !!combatState().counterAttack });
          if (smoke) { var smokeCount = Number(value('smoke-count')), smokeAction = itemAction(inventoryItem('smoke'), smokeCount, '\u0410\u0442\u0430\u043a\u0430 \u043f\u0440\u0435\u0434\u043c\u0435\u0442\u043e\u043c', attackItemCost(smokeCount)); smokeAction.code += '; \u0434\u0438\u0441\u0442\u0430\u043d\u0446\u0438\u044f: ' + (mode === 'ranged' ? '\u0434\u0430\u043b\u044c\u043d\u044f\u044f' : '\u0431\u043b\u0438\u0436\u043d\u044f\u044f'); actions.push(smokeAction); }
          if (replacement) actions.push(situationTechniqueAction(findCharacterTechnique(SUBSTITUTION_TECHNIQUE), 'defense', true));
          if (hide) actions.push(situationTechniqueAction(technique('hide'), 'support', !clone));
          addSituationChain(actions);
        } catch (error) { setBuilderMessage(error.message, 'error'); }
      });
    }).catch(function (error) { if (editor.isConnected) editor.innerHTML = '<p class="aba-error">' + escapeHtml(error.message) + '</p>'; });
  }

  function opponentDamageType(label, code) {
    var text = normalizeText((label || '') + ' ' + (code || ''));
    if (/\u0440\u0443\u043a\u043e\u043f\u0430\u0448\u043d|\u0431\u0435\u0437 \u043e\u0440\u0443\u0436\u0438\u044f/.test(text)) return 'unarmed';
    if (/\u0434\u0430\u043b\u044c\u043d|\u0434\u0438\u0441\u0442\u0430\u043d\u0446|\u043c\u0435\u0442\u0430\u0442\u0435\u043b\u044c\u043d/.test(text)) return 'ranged';
    if (/\u043e\u0440\u0443\u0436\u0438/.test(text) && !/\u0442\u0435\u0445\u043d\u0438\u043a/.test(text)) return 'weapon';
    return 'technique';
  }

  function parseOpponentDamageLines(lines) {
    var actions = [], current = null;
    function flush() {
      if (!current) return;
      var code = current.lines.join('; '), match = code.match(/\u0418\u0442\u043e\u0433\u043e\u0432\u044b\u0439 \u0443\u0440\u043e\u043d:\s*([\d.,]+)/i);
      if (!match) match = code.match(/\u0438\u0442\u043e\u0433\u043e\u0432\u044b\u0439 \u044d\u0444\u0444\u0435\u043a\u0442:\s*\u0423\u0440\u043e\u043d\s+([^;]+)/i);
      if (!match) match = code.match(/(?:\u0443\u0440\u043e\u043d \u0431\u0435\u0437 \u043e\u0440\u0443\u0436\u0438\u044f|\u0443\u0440\u043e\u043d \u043e\u0442 \u0430\u0442\u0430\u043a\u0438 \u043e\u0440\u0443\u0436\u0438\u0435\u043c|(?:^|;\s*)\u0443\u0440\u043e\u043d):\s*([^;]+)/i);
      var damage = match ? combatRound(arithmeticExpressionNumber(match[1], Number(String(match[1]).replace(',', '.')) || 0)) : 0;
      if (damage > 0 && !/\u043f\u043e\u043b\u0443\u0447\u0435\u043d\u043e \u0440\u0430\u043d\u0435\u043d\u0438\u0435|\u043f\u043e\u043b\u0443\u0447\u0435\u043d\u0430 \u0430\u0442\u0430\u043a\u0430/i.test(current.label)) actions.push({ index: current.index, label: current.label, code: code, damage: damage, type: opponentDamageType(current.label, code) });
    }
    (lines || []).forEach(function (line) {
      line = clean(line).replace(/[\u2212\u2013\u2014]/g, '-');
      var heading = line.match(/^(\d+)\.\s+(.+)/);
      if (heading) { flush(); current = { index: Number(heading[1]), label: clean(heading[2]), lines: [] }; }
      else if (current && !/^(?:HP|\u0427\u0430\u043a\u0440\u0430) \u043d\u0430 \u043a\u043e\u043d\u0435\u0446 \u0445\u043e\u0434\u0430/i.test(line)) current.lines.push(line);
    });
    flush();
    return actions;
  }

  function renderOpponentDamageChoices(editor, actions) {
    var target = editor.querySelector('.aba-enemy-actions-found');
    if (!target) return;
    editor.enemyDamageActions = actions;
    if (!actions.length) { target.innerHTML = '<div class="aba-empty">\u0412 \u043f\u043e\u0441\u0442\u0435 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u044b \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044f \u0441 \u0438\u0442\u043e\u0433\u043e\u0432\u044b\u043c \u0443\u0440\u043e\u043d\u043e\u043c. \u0417\u043d\u0430\u0447\u0435\u043d\u0438\u044f \u043c\u043e\u0436\u043d\u043e \u0432\u0432\u0435\u0441\u0442\u0438 \u0432\u0440\u0443\u0447\u043d\u0443\u044e.</div>'; return; }
    target.innerHTML = '<strong>\u041e\u0442\u043c\u0435\u0442\u044c\u0442\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044f, \u043a\u043e\u0442\u043e\u0440\u044b\u0435 \u043d\u0430\u043d\u0435\u0441\u043b\u0438 \u0443\u0440\u043e\u043d</strong>' + actions.map(function (action, index) {
      return '<label class="aba-check aba-enemy-action"><input type="checkbox" data-enemy-action="' + index + '"><span><b>' + escapeHtml(action.label) + '</b><small>\u0423\u0440\u043e\u043d: ' + action.damage + ' \u00b7 ' + escapeHtml({ unarmed:'\u0440\u0443\u043a\u043e\u043f\u0430\u0448\u043d\u0430\u044f \u0430\u0442\u0430\u043a\u0430', weapon:'\u043e\u0440\u0443\u0436\u0438\u0435 \u0431\u043b\u0438\u0436\u043d\u0435\u0433\u043e \u0431\u043e\u044f', ranged:'\u0434\u0430\u043b\u044c\u043d\u0438\u0439 \u0431\u043e\u0439', technique:'\u0442\u0435\u0445\u043d\u0438\u043a\u0430 \u0438\u043b\u0438 \u0434\u0440\u0443\u0433\u043e\u0439 \u0438\u0441\u0442\u043e\u0447\u043d\u0438\u043a' }[action.type]) + '</small></span></label>';
    }).join('');
    Array.prototype.forEach.call(target.querySelectorAll('[data-enemy-action]'), function (checkbox) {
      on(checkbox, 'change', function () {
        var selected = Array.prototype.slice.call(target.querySelectorAll('[data-enemy-action]:checked')).map(function (node) { return actions[Number(node.dataset.enemyAction)]; });
        editor.selectedEnemyDamageActions = selected;
        if (!selected.length) {
          editor.querySelector('[data-field="hp-amount"]').value = 1;
          editor.querySelector('[data-field="enemy-actions"]').value = '';
          editor.querySelector('[data-field="incoming-attack-type"]').value = 'technique';
          return;
        }
        editor.querySelector('[data-field="hp-amount"]').value = selected.reduce(function (sum, action) { return sum + action.damage; }, 0);
        editor.querySelector('[data-field="enemy-actions"]').value = selected.map(function (action) { return action.index + '. ' + action.label + ' \u2014 \u0443\u0440\u043e\u043d ' + action.damage; }).join('\n');
        var types = selected.map(function (action) { return action.type; }).filter(function (type, index, list) { return list.indexOf(type) === index; });
        editor.querySelector('[data-field="incoming-attack-type"]').value = types.length === 1 ? types[0] : 'technique';
      });
    });
  }

  function loadOpponentDamageActions(editor) {
    var input = editor.querySelector('[data-field="enemy-post"]'), status = editor.querySelector('.aba-enemy-load-status');
    var absolute = absoluteUrl(clean(input && input.value), BASE_URL), postId = (absolute.match(/#p(\d+)/i) || [])[1];
    if (!postId) { status.textContent = '\u0423\u043a\u0430\u0436\u0438\u0442\u0435 \u0441\u0441\u044b\u043b\u043a\u0443 \u043d\u0430 \u043a\u043e\u043d\u043a\u0440\u0435\u0442\u043d\u044b\u0439 \u043f\u043e\u0441\u0442 \u0441 #p.'; status.className = 'aba-enemy-load-status aba-error'; return; }
    status.textContent = '\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u043f\u043e\u0441\u0442\u0430 \u043f\u0440\u043e\u0442\u0438\u0432\u043d\u0438\u043a\u0430\u2026'; status.className = 'aba-enemy-load-status aba-loading';
    return loadDocument(absolute.split('#')[0]).then(function (doc) {
      var content = findPostContent(doc, postId);
      if (!content) throw new Error('\u041f\u043e\u0441\u0442 \u043f\u0440\u043e\u0442\u0438\u0432\u043d\u0438\u043a\u0430 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d.');
      var actions = parseOpponentDamageLines(postLines(content));
      renderOpponentDamageChoices(editor, actions);
      status.textContent = actions.length ? '\u041d\u0430\u0439\u0434\u0435\u043d\u043e \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439 \u0441 \u0443\u0440\u043e\u043d\u043e\u043c: ' + actions.length + '. \u041e\u0442\u043c\u0435\u0442\u044c\u0442\u0435 \u043d\u0443\u0436\u043d\u044b\u0435.' : '\u041f\u043e\u0441\u0442 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043d, \u043d\u043e \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044f \u0441 \u0438\u0442\u043e\u0433\u043e\u0432\u044b\u043c \u0443\u0440\u043e\u043d\u043e\u043c \u043d\u0435 \u0440\u0430\u0441\u043f\u043e\u0437\u043d\u0430\u043d\u044b.';
      status.className = 'aba-enemy-load-status ' + (actions.length ? 'aba-note' : 'aba-error');
    }).catch(function (error) { status.textContent = '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u043f\u043e\u0441\u0442: ' + error.message; status.className = 'aba-enemy-load-status aba-error'; });
  }

  function renderEditor(action) {
    var editor = state.nodes.builder.querySelector('.aba-action-editor');
    if (!editor) return;
    if (action === 'create-clone') {
      renderCloneCreationEditor(editor); return;
    } else if (/^situation-/.test(action) || action === 'substitution' && state.nodes.builder.querySelector('[data-action="situation-hide"]')) {
      renderBattleSituation(editor, action);
    } else if (action === 'ordinary-unarmed') {
      editor.innerHTML = '<h4>\u0411\u043b\u0438\u0436\u043d\u0438\u0439 \u0440\u0443\u043a\u043e\u043f\u0430\u0448\u043d\u044b\u0439 \u0431\u043e\u0439</h4><p>\u041f\u0440\u043e\u0432\u0435\u0440\u043a\u0430: <b>\u0410\u0442\u0430\u043a\u0430 \u0431\u043b\u0438\u0436\u043d\u0438\u0439 \u0431\u043e\u0439 ' + statValue('meleeAttack') + '</b>. \u0423\u0440\u043e\u043d \u0431\u0435\u0437 \u043e\u0440\u0443\u0436\u0438\u044f: <b>' + damageText('unarmedDamage') + '</b>.</p>' + (hasPassiveAbility('inuzuka') ? '<label class="aba-check"><input type="checkbox" data-field="inuzuka-bite"><span>\u0423\u043a\u0443\u0441 \u0418\u043d\u0443\u0437\u0443\u043a\u0430 \u2014 \u043a\u0440\u043e\u0432\u043e\u0442\u0435\u0447\u0435\u043d\u0438\u0435 3 \u0443\u0440\u043e\u043d\u0430 \u0432 \u0445\u043e\u0434, 3 \u0445\u043e\u0434\u0430</span></label>' : '') + modifierBlock(enhanceFields('strength') + attackContextFields(false)) + '<button class="aba-primary" type="button" data-add="ordinary-unarmed">\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u00b7 1 \u041e\u0414</button>';
    } else if (action === 'ordinary-melee' || action === 'defense-melee') {
      var meleeItems = weaponOptions('melee');
      editor.innerHTML = '<h4>' + (action === 'ordinary-melee' ? '\u0411\u043b\u0438\u0436\u043d\u0438\u0439 \u0431\u043e\u0439 \u0441 \u043e\u0440\u0443\u0436\u0438\u0435\u043c' : '\u0417\u0430\u0449\u0438\u0442\u0430 \u043e\u0440\u0443\u0436\u0438\u0435\u043c') + '</h4><label>\u041e\u0440\u0443\u0436\u0438\u0435<select data-field="weapon">' + optionList(meleeItems, '\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043e\u0440\u0443\u0436\u0438\u0435') + '</select></label><div class="aba-weapon-info"></div>' + modifierBlock(enhanceFields('strength') + (action === 'ordinary-melee' ? attackContextFields(false) : '')) + '<button class="aba-primary" type="button" data-add="' + action + '">\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u00b7 1 \u041e\u0414</button>';
      selectCharacterWeapon(editor, 'melee');
    } else if (action === 'ordinary-ranged' || action === 'defense-ranged') {
      var max = statValue('taijutsu') >= 10 ? 4 : 3;
      var fourRule = max === 4 ? ' \u041f\u0440\u0438 \u0431\u0440\u043e\u0441\u043a\u0435 \u0447\u0435\u0442\u044b\u0440\u0451\u0445 \u0435\u0434\u0438\u043d\u0438\u0446 \u043e\u0434\u043d\u043e\u0439 \u0440\u0443\u043a\u043e\u0439 \u043f\u0440\u0438\u043c\u0435\u043d\u044f\u0435\u0442\u0441\u044f \u22121 \u043a \u0442\u043e\u0447\u043d\u043e\u0441\u0442\u0438 \u0437\u0430 \u044d\u0442\u0443 \u0440\u0443\u043a\u0443.' : '';
      editor.innerHTML = '<h4>' + (action === 'ordinary-ranged' ? '\u0414\u0430\u043b\u044c\u043d\u0438\u0439 \u0431\u043e\u0439 \u0441 \u043e\u0440\u0443\u0436\u0438\u0435\u043c' : '\u0417\u0430\u0449\u0438\u0442\u0430 \u0434\u0430\u043b\u044c\u043d\u0435\u0433\u043e \u0431\u043e\u044f') + '</h4><p>\u041f\u0440\u043e\u0432\u0435\u0440\u043a\u0430: <b>\u0410\u0442\u0430\u043a\u0430 \u043d\u0430 \u0434\u0438\u0441\u0442\u0430\u043d\u0446\u0438\u0438 ' + statValue('rangedAttack') + '</b>. \u041e\u0434\u043d\u043e\u0439 \u0440\u0443\u043a\u043e\u0439 \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u043e \u0434\u043e ' + max + ' \u0435\u0434\u0438\u043d\u0438\u0446, \u0434\u0432\u0443\u043c\u044f \u2014 \u0434\u043e ' + (max * 2) + '.' + fourRule + ' \u0417\u0430 \u0434\u043e\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044c\u043d\u0443\u044e \u0440\u0443\u043a\u0443 \u043f\u0440\u0438\u043c\u0435\u043d\u044f\u0435\u0442\u0441\u044f \u22121 \u043a \u0442\u043e\u0447\u043d\u043e\u0441\u0442\u0438.</p><label>\u041c\u0435\u0442\u0430\u0442\u0435\u043b\u044c\u043d\u043e\u0435 \u043e\u0440\u0443\u0436\u0438\u0435<select data-field="weapon">' + optionList(weaponOptions('ranged'), '\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043e\u0440\u0443\u0436\u0438\u0435') + '</select></label><div class="aba-inline"><label>\u041a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e<input data-field="count" type="number" min="1" max="' + max + '" value="1"></label><label>\u0420\u0443\u043a\u0430<select data-field="hand"><option value="main">\u041e\u0441\u043d\u043e\u0432\u043d\u0430\u044f</option><option value="off">\u0414\u043e\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044c\u043d\u0430\u044f (\u22121)</option><option value="both">\u041e\u0431\u0435 \u0440\u0443\u043a\u0438 \u043e\u0434\u043d\u043e\u0432\u0440\u0435\u043c\u0435\u043d\u043d\u043e</option></select></label></div><div class="aba-weapon-info"></div>' + modifierBlock(enhanceFields('speed', '\u0423\u0441\u043a\u043e\u0440\u0435\u043d\u0438\u0435 \u0440\u0443\u043a\u0438') + (action === 'ordinary-ranged' ? attackContextFields(true) : '')) + '<button class="aba-primary" type="button" data-add="' + action + '">\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u00b7 1 \u041e\u0414</button>';
    } else if (action === 'ordinary-firearm') {
      var firearmCheck = statValue('taijutsu') + statValue('strategy');
      editor.innerHTML = '<h4>\u0410\u0442\u0430\u043a\u0430 \u043e\u0433\u043d\u0435\u0441\u0442\u0440\u0435\u043b\u044c\u043d\u044b\u043c \u043e\u0440\u0443\u0436\u0438\u0435\u043c</h4><p>\u041f\u0440\u043e\u0432\u0435\u0440\u043a\u0430: <b>\u0422\u0430\u0439\u0434\u0437\u044e\u0446\u0443 + \u0422\u0430\u043a\u0442\u0438\u043a\u0430 = ' + firearmCheck + '</b>. \u0423\u0440\u043e\u043d \u043f\u043e\u0441\u0442\u043e\u044f\u043d\u043d\u044b\u0439 \u0438 \u0431\u0435\u0440\u0451\u0442\u0441\u044f \u0442\u043e\u043b\u044c\u043a\u043e \u0438\u0437 \u043e\u0440\u0443\u0436\u0438\u044f, \u0431\u0435\u0437 \u043f\u0440\u0438\u0431\u0430\u0432\u043e\u043a \u043f\u0430\u0440\u0430\u043c\u0435\u0442\u0440\u043e\u0432 \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0430.</p><label>\u041e\u0433\u043d\u0435\u0441\u0442\u0440\u0435\u043b\u044c\u043d\u043e\u0435 \u043e\u0440\u0443\u0436\u0438\u0435<select data-field="weapon">' + optionList(weaponOptions('firearm'), '\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043e\u0440\u0443\u0436\u0438\u0435') + '</select></label><div class="aba-weapon-info"></div>' + modifierBlock(attackContextFields(true)) + '<button class="aba-primary" type="button" data-add="ordinary-firearm">\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u00b7 1 \u041e\u0414</button>';
    } else if (action === 'ordinary-shooting') {
      editor.innerHTML = '<h4>\u0421\u0442\u0440\u0435\u043b\u044c\u0431\u0430</h4><p>\u041f\u0440\u043e\u0432\u0435\u0440\u043a\u0430: <b>\u0410\u0442\u0430\u043a\u0430 \u043d\u0430 \u0434\u0438\u0441\u0442\u0430\u043d\u0446\u0438\u0438 ' + statValue('rangedAttack') + '</b>. \u0414\u043e\u0441\u0442\u0443\u043f\u043d\u044b\u0435 \u0431\u043e\u0435\u043f\u0440\u0438\u043f\u0430\u0441\u044b \u043e\u043f\u0440\u0435\u0434\u0435\u043b\u044f\u044e\u0442\u0441\u044f \u0432\u044b\u0431\u0440\u0430\u043d\u043d\u044b\u043c \u043e\u0440\u0443\u0436\u0438\u0435\u043c.</p><label>\u0421\u0442\u0440\u0435\u043b\u043a\u043e\u0432\u043e\u0435 \u043e\u0440\u0443\u0436\u0438\u0435<select data-field="weapon">' + optionList(weaponOptions('shooting'), '\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043e\u0440\u0443\u0436\u0438\u0435') + '</select></label><label>\u0411\u043e\u0435\u043f\u0440\u0438\u043f\u0430\u0441<select data-field="shooting-ammo"><option value="">\u0421\u043d\u0430\u0447\u0430\u043b\u0430 \u0432\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043e\u0440\u0443\u0436\u0438\u0435</option></select></label><label>\u041a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e \u0432\u044b\u043f\u0443\u0449\u0435\u043d\u043d\u044b\u0445 \u0441\u043d\u0430\u0440\u044f\u0434\u043e\u0432<input data-field="shooting-count" type="number" min="1" step="1" value="1"></label><div class="aba-weapon-info"></div>' + modifierBlock(attackContextFields(true)) + '<button class="aba-primary" type="button" data-add="ordinary-shooting">\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435</button>';
      selectCharacterWeapon(editor, 'firearm');
    } else if (action === 'dodge') {
      editor.innerHTML = '<h4>\u0423\u043a\u043b\u043e\u043d\u0435\u043d\u0438\u0435</h4><p>\u041f\u0435\u0440\u0441\u043e\u043d\u0430\u0436 \u043f\u044b\u0442\u0430\u0435\u0442\u0441\u044f \u043f\u043e\u043b\u043d\u043e\u0441\u0442\u044c\u044e \u0443\u0439\u0442\u0438 \u043e\u0442 \u0430\u0442\u0430\u043a\u0438. \u041f\u043e\u043a\u0430\u0437\u0430\u0442\u0435\u043b\u044c: <b>\u0423\u043a\u043b\u043e\u043d\u0435\u043d\u0438\u0435 ' + statValue('dodge') + '</b>.</p>' + (hasPassiveAbility('kaguraEye') ? '<label>\u0422\u0440\u0435\u0442\u0438\u0439 \u0413\u043b\u0430\u0437 \u041a\u0430\u0433\u0443\u0440\u044b<select data-field="kagura-dodge"><option value="0">\u041d\u0435 \u043f\u0440\u0438\u043c\u0435\u043d\u044f\u0435\u0442\u0441\u044f</option><option value="2">\u041d\u0438\u043d\u0434\u0437\u044e\u0446\u0443 \u0441 \u0431\u043b\u0438\u0436\u043d\u0435\u0439 \u0434\u0438\u0441\u0442\u0430\u043d\u0446\u0438\u0438: +2</option><option value="1">\u041d\u0438\u043d\u0434\u0437\u044e\u0446\u0443 \u0441\u043e \u0441\u0440\u0435\u0434\u043d\u0435\u0439 \u0434\u0438\u0441\u0442\u0430\u043d\u0446\u0438\u0438: +1</option></select></label>' : '') + (hasPassiveAbility('inuzuka') && statValue('level') >= 11 ? '<label class="aba-check"><input type="checkbox" data-field="inuzuka-reaction"><span>\u0420\u0435\u0430\u043a\u0446\u0438\u044f \u0418\u043d\u0443\u0437\u0443\u043a\u0430: +10% \u043a \u0423\u043a\u043b\u043e\u043d\u0435\u043d\u0438\u044e</span></label>' : '') + modifierBlock(enhanceFields('speed')) + '<button class="aba-primary" type="button" data-add="dodge">\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u00b7 1 \u041e\u0414</button>';
    } else if (action === 'defense-unarmed') {
      editor.innerHTML = '<h4>\u0420\u0443\u043a\u043e\u043f\u0430\u0448\u043d\u0430\u044f \u0437\u0430\u0449\u0438\u0442\u0430</h4><p>\u0411\u043b\u043e\u043a \u0432 \u0431\u043b\u0438\u0436\u043d\u0435\u043c \u0431\u043e\u044e \u0431\u0435\u0437 \u043e\u0440\u0443\u0436\u0438\u044f. \u041f\u0440\u043e\u0432\u0435\u0440\u043a\u0430: <b>\u0410\u0442\u0430\u043a\u0430 \u0431\u043b\u0438\u0436\u043d\u0438\u0439 \u0431\u043e\u0439 ' + statValue('meleeAttack') + '</b>.</p>' + (hasPassiveAbility('inuzuka') && statValue('level') >= 11 ? '<label class="aba-check"><input type="checkbox" data-field="inuzuka-reaction"><span>\u0420\u0435\u0430\u043a\u0446\u0438\u044f \u0418\u043d\u0443\u0437\u0443\u043a\u0430: +10% \u043a \u043f\u0435\u0440\u0435\u0445\u0432\u0430\u0442\u0443 \u0431\u043b\u0438\u0436\u043d\u0435\u0439 \u0430\u0442\u0430\u043a\u0438</span></label>' : '') + modifierBlock(enhanceFields('strength')) + '<button class="aba-primary" type="button" data-add="defense-unarmed">\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u00b7 1 \u041e\u0414</button>';
    } else if (action === 'defense-object') {
      editor.innerHTML = '<h4>\u0417\u0430\u0449\u0438\u0442\u0430 \u043f\u0440\u0435\u0434\u043c\u0435\u0442\u0430\u043c\u0438</h4><p>\u0411\u043b\u043e\u043a \u0449\u0438\u0442\u043e\u043c \u0438\u043b\u0438 \u043f\u043e\u0434\u0440\u0443\u0447\u043d\u044b\u043c \u043f\u0440\u0435\u0434\u043c\u0435\u0442\u043e\u043c. \u041f\u043e \u043f\u0440\u0430\u0432\u0438\u043b\u0430\u043c \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u0435\u0442\u0441\u044f \u043f\u0440\u043e\u0432\u0435\u0440\u043a\u0430 \u0431\u043b\u0438\u0436\u043d\u0435\u0433\u043e \u0431\u043e\u044f.</p>' + inventoryFields('defense-object') + '<label>\u041f\u0440\u0435\u0434\u043c\u0435\u0442<input data-field="object" type="text" placeholder="\u0429\u0438\u0442, \u043a\u0440\u044b\u0448\u043a\u0430, \u043e\u0431\u043b\u043e\u043c\u043e\u043a \u0441\u0442\u0435\u043d\u044b\u2026"></label>' + modifierBlock(enhanceFields('strength')) + '<button class="aba-primary" type="button" data-add="defense-object">\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u00b7 1 \u041e\u0414</button>';
    } else if (action === 'chakra-defense') {
      editor.innerHTML = statValue('fuinjutsu') < 6 ? '<h4>\u0417\u0430\u0449\u0438\u0442\u0430 \u0447\u0430\u043a\u0440\u043e\u0439</h4><p class="aba-error">\u041d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u043d\u043e: \u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044f \u0424\u0443\u0438\u043d\u0434\u0437\u044e\u0446\u0443 6.</p>' : !enhancementAvailable('defense') ? '<h4>\u0417\u0430\u0449\u0438\u0442\u0430 \u0447\u0430\u043a\u0440\u043e\u0439</h4><p class="aba-error">\u041d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u043d\u043e: \u0443\u0441\u0438\u043b\u0435\u043d\u0438\u0435 \u0437\u0430\u0449\u0438\u0442\u044b \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u043e ' + enhancementTurnsAgo('defense') + ' \u0445\u043e\u0434(\u0430) \u043d\u0430\u0437\u0430\u0434.</p>' : '<h4>\u0417\u0430\u0449\u0438\u0442\u0430 \u0447\u0430\u043a\u0440\u043e\u0439</h4><p>\u041a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0430\u0446\u0438\u044f \u0447\u0430\u043a\u0440\u044b \u0432 \u0447\u0430\u0441\u0442\u0438 \u0442\u0435\u043b\u0430 \u0438\u043b\u0438 \u043f\u043e \u0432\u0441\u0435\u043c\u0443 \u0442\u0435\u043b\u0443 \u0441\u043d\u0438\u0436\u0430\u0435\u0442 \u0432\u0445\u043e\u0434\u044f\u0449\u0438\u0439 \u0443\u0440\u043e\u043d. \u041a\u0430\u0436\u0434\u0430\u044f \u0435\u0434\u0438\u043d\u0438\u0446\u0430 \u0447\u0430\u043a\u0440\u044b \u0434\u043e\u0431\u0430\u0432\u043b\u044f\u0435\u0442 +10 \u043a \u0417\u0430\u0449\u0438\u0442\u0435.</p><label>\u0427\u0430\u043a\u0440\u0430<select data-field="standalone-chakra"><option value="1">1 \u0447\u0430\u043a\u0440\u0430 \u00b7 +10 \u043a \u0417\u0430\u0449\u0438\u0442\u0435</option><option value="2">2 \u0447\u0430\u043a\u0440\u044b \u00b7 +20 \u043a \u0417\u0430\u0449\u0438\u0442\u0435</option><option value="3">3 \u0447\u0430\u043a\u0440\u044b \u00b7 +30 \u043a \u0417\u0430\u0449\u0438\u0442\u0435</option></select></label><button class="aba-primary" type="button" data-add="chakra-defense">\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0437\u0430\u0449\u0438\u0442\u0443 \u0447\u0430\u043a\u0440\u043e\u0439</button>';
    } else if (action === 'companion') {
      editor.innerHTML = '<h4>\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044f \u0441\u043f\u0443\u0442\u043d\u0438\u043a\u0430</h4><p>\u041c\u0430\u0440\u0438\u043e\u043d\u0435\u0442\u043a\u0430, \u0436\u0438\u0432\u043e\u0442\u043d\u043e\u0435, \u043f\u0440\u0438\u0437\u044b\u0432 \u0438\u043b\u0438 \u0434\u0440\u0443\u0433\u043e\u0439 \u0448\u0438\u043d\u043e\u0431\u0438. \u041a\u0430\u0436\u0434\u0430\u044f \u0441\u0442\u0440\u043e\u043a\u0430 \u0441\u0442\u0430\u043d\u0435\u0442 \u0441\u043b\u0435\u0434\u0443\u044e\u0449\u0438\u043c \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435\u043c \u0446\u0435\u043f\u043e\u0447\u043a\u0438.</p><label>\u041a\u0442\u043e \u0434\u0435\u0439\u0441\u0442\u0432\u0443\u0435\u0442<input data-field="companion" type="text" value="' + (hasPassiveAbility('inuzuka') ? '\u041d\u0438\u043d\u043a\u0435\u043d' : '') + '" placeholder="\u0418\u043c\u044f \u0438\u043b\u0438 \u0432\u0438\u0434 \u0441\u043f\u0443\u0442\u043d\u0438\u043a\u0430"></label><label>\u0421\u0441\u044b\u043b\u043a\u0430 \u043d\u0430 \u0441\u043f\u0443\u0442\u043d\u0438\u043a\u0430 \u0438\u043b\u0438 \u043f\u0440\u0438\u0437\u044b\u0432<input data-field="companion-url" type="url" placeholder="https://\u2026"></label><label>\u0426\u0435\u043f\u043e\u0447\u043a\u0430 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439<textarea data-field="description" rows="4" placeholder="\u041e\u0434\u043d\u043e \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u043d\u0430 \u0441\u0442\u0440\u043e\u043a\u0435"></textarea></label><button class="aba-primary" type="button" data-add="companion">\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0446\u0435\u043f\u043e\u0447\u043a\u0443</button>';
    } else if (action === 'artifact-effect') {
      renderArtifactEffectEditor(editor);
    } else if (action === 'attack-item') {
      editor.innerHTML = '<h4>\u0410\u0442\u0430\u043a\u0430 \u043f\u0440\u0435\u0434\u043c\u0435\u0442\u043e\u043c</h4><p>\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0434\u0438\u0441\u0442\u0430\u043d\u0446\u0438\u044e \u0430\u0442\u0430\u043a\u0438. \u041a\u0430\u0436\u0434\u044b\u0435 1\u20132 \u043f\u0440\u0435\u0434\u043c\u0435\u0442\u0430 \u0440\u0430\u0441\u0445\u043e\u0434\u0443\u044e\u0442 1 \u041e\u0414. \u0414\u043b\u044f \u0441\u0442\u0440\u0435\u043b\u043a\u043e\u0432\u043e\u0433\u043e \u043e\u0440\u0443\u0436\u0438\u044f \u0437\u0434\u0435\u0441\u044c \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u0435\u0442\u0441\u044f \u0443\u0440\u043e\u043d \u043e\u0442 \u0443\u0434\u0430\u0440\u0430 \u0441\u0430\u043c\u0438\u043c \u043e\u0440\u0443\u0436\u0438\u0435\u043c.</p><label>\u0414\u0438\u0441\u0442\u0430\u043d\u0446\u0438\u044f<select data-field="item-attack-mode"><option value="melee">\u0411\u043b\u0438\u0436\u043d\u0438\u0439 \u0431\u043e\u0439</option><option value="ranged">\u0414\u0430\u043b\u044c\u043d\u0438\u0439 \u0431\u043e\u0439</option></select></label>' + inventoryFields('attack-item') + '<label>\u0427\u0442\u043e \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u0435\u0442\u0441\u044f<input data-field="description" type="text" placeholder="\u0414\u044b\u043c\u043e\u0432\u0430\u044f \u0448\u0430\u0448\u043a\u0430, \u043b\u0443\u043a, \u043c\u043e\u043a\u0438\u0431\u0438\u0448\u0438\u2026"></label><button class="aba-primary" type="button" data-add="attack-item">\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u00b7 1 \u041e\u0414</button>';
    } else if (action === 'fuin-break') {
      var fuinCheck = statValue('fuinjutsu') + statValue('ninjutsu');
      editor.innerHTML = '<h4>\u0421\u043b\u043e\u043c \u0424\u0443\u0438\u043d\u0434\u0437\u044e\u0446\u0443</h4><p>\u0421\u043d\u044f\u0442\u0438\u0435 \u043d\u0430\u043b\u043e\u0436\u0435\u043d\u043d\u043e\u0439 \u043f\u0435\u0447\u0430\u0442\u0438 \u0438\u043b\u0438 \u0432\u0437\u043b\u043e\u043c \u0431\u0430\u0440\u044c\u0435\u0440\u0430. \u041f\u0440\u043e\u0432\u0435\u0440\u043a\u0430: <b>\u0424\u0443\u0438\u043d\u0434\u0437\u044e\u0446\u0443 + \u041d\u0438\u043d\u0434\u0437\u044e\u0446\u0443 = ' + fuinCheck + '</b>. \u0418\u043d\u043e\u0433\u0434\u0430 \u043f\u0440\u0438 \u0432\u044b\u0441\u043e\u043a\u043e\u043c \u0424\u0443\u0438\u043d\u0434\u0437\u044e\u0446\u0443 \u043f\u0435\u0447\u0430\u0442\u044c \u043b\u043e\u0433\u0438\u0447\u043d\u0435\u0435 \u0441\u043d\u044f\u0442\u044c, \u0430 \u043d\u0435 \u043f\u0440\u043e\u0431\u0438\u0432\u0430\u0442\u044c.</p><label>\u0426\u0435\u043b\u044c \u043f\u0440\u043e\u0432\u0435\u0440\u043a\u0438<input data-field="description" type="text" placeholder="\u041a\u0430\u043a\u0430\u044f \u043f\u0435\u0447\u0430\u0442\u044c \u0438\u043b\u0438 \u0431\u0430\u0440\u044c\u0435\u0440 \u0441\u043d\u0438\u043c\u0430\u0435\u0442\u0441\u044f"></label><button class="aba-primary" type="button" data-add="fuin-break">\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0430\u0442\u0430\u043a\u0443 \u00b7 1 \u041e\u0414</button>';
    } else if (action === 'trap' || action === 'medicine' || action === 'prepared-item') {
      var preparationTitle = action === 'trap' ? '\u041f\u043e\u0434\u0433\u043e\u0442\u043e\u0432\u043a\u0430 \u043b\u043e\u0432\u0443\u0448\u043a\u0438' : action === 'medicine' ? '\u0418\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u0435 \u043f\u0440\u0435\u043f\u0430\u0440\u0430\u0442\u0430' : '\u0418\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u0435 \u043f\u0440\u0435\u0434\u043c\u0435\u0442\u0430';
      editor.innerHTML = '<h4>' + preparationTitle + '</h4>' + inventoryFields(action, action === 'trap') + (action === 'medicine' ? '<p class="aba-note">\u042d\u0444\u0444\u0435\u043a\u0442 \u0437\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u0442\u0441\u044f \u0438\u0437 \u043c\u0430\u0441\u0442\u0435\u0440-\u043f\u043e\u0441\u0442\u0430 \u043f\u0440\u0435\u043f\u0430\u0440\u0430\u0442\u043e\u0432. \u0415\u0441\u043b\u0438 \u043e\u043d \u043d\u0435 \u0440\u0430\u0441\u043f\u043e\u0437\u043d\u0430\u043d, \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442 \u043e\u043f\u0440\u0435\u0434\u0435\u043b\u044f\u0435\u0442 \u0413\u041c.</p>' : '') + '<label>\u041e\u043f\u0438\u0441\u0430\u043d\u0438\u0435<input data-field="description" type="text" placeholder="\u0427\u0442\u043e \u0438\u043c\u0435\u043d\u043d\u043e \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u0435\u0442\u0441\u044f"></label><button class="aba-primary" type="button" data-add="' + action + '">\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u00b7 1 \u041e\u0414</button>';
    } else if (action === 'stability') {
      editor.innerHTML = statValue('fuinjutsu') < 6 ? '<h4>\u0423\u0441\u0442\u043e\u0439\u0447\u0438\u0432\u043e\u0441\u0442\u044c / \u043f\u0440\u044b\u0433\u0443\u0447\u0435\u0441\u0442\u044c</h4><p class="aba-error">\u041d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u043d\u043e: \u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044f \u0424\u0443\u0438\u043d\u0434\u0437\u044e\u0446\u0443 6.</p>' : '<h4>\u0423\u0441\u0442\u043e\u0439\u0447\u0438\u0432\u043e\u0441\u0442\u044c / \u043f\u0440\u044b\u0433\u0443\u0447\u0435\u0441\u0442\u044c</h4><p>\u0423\u0441\u0438\u043b\u0435\u043d\u0438\u0435 \u0447\u0430\u043a\u0440\u043e\u0439 \u043f\u043e\u043c\u043e\u0433\u0430\u0435\u0442 \u0443\u0434\u0435\u0440\u0436\u0430\u0442\u044c\u0441\u044f \u043d\u0430 \u043d\u043e\u0433\u0430\u0445, \u0443\u0432\u0435\u043b\u0438\u0447\u0438\u0442\u044c \u0434\u0430\u043b\u044c\u043d\u043e\u0441\u0442\u044c \u043f\u0440\u044b\u0436\u043a\u0430 \u0438\u043b\u0438 \u043f\u0440\u043e\u0442\u0438\u0432\u043e\u0434\u0435\u0439\u0441\u0442\u0432\u043e\u0432\u0430\u0442\u044c \u0441\u0431\u0438\u0432\u0430\u044e\u0449\u0435\u043c\u0443 \u044d\u0444\u0444\u0435\u043a\u0442\u0443. \u0420\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442 \u043e\u043f\u0440\u0435\u0434\u0435\u043b\u044f\u0435\u0442 \u0413\u041c.</p><label>\u0427\u0430\u043a\u0440\u0430<select data-field="standalone-chakra"><option>1</option><option>2</option><option>3</option></select></label><button class="aba-primary" type="button" data-add="stability">\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u043f\u043e\u0434\u0433\u043e\u0442\u043e\u0432\u043a\u0443</button>';
    } else if (action === 'critical-focus') {
      editor.innerHTML = !combatState().criticalEnabled ? '<h4>\u0423\u0441\u0438\u043b\u0435\u043d\u0438\u0435 \u0448\u0430\u043d\u0441\u0430 \u043a\u0440\u0438\u0442\u0430</h4><p class="aba-error">\u0421\u043d\u0430\u0447\u0430\u043b\u0430 \u0432\u043a\u043b\u044e\u0447\u0438\u0442\u0435 \u0441\u0432\u0435\u0440\u0445\u0443 \u00ab\u0421\u0447\u0438\u0442\u0430\u0442\u044c \u043a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u0443\u0440\u043e\u043d\u00bb.</p>' : !enhancementAvailable('critical') ? '<h4>\u0423\u0441\u0438\u043b\u0435\u043d\u0438\u0435 \u0448\u0430\u043d\u0441\u0430 \u043a\u0440\u0438\u0442\u0430</h4><p class="aba-error">\u0423\u0441\u0438\u043b\u0435\u043d\u0438\u0435 \u043a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u043e\u0433\u043e \u0448\u0430\u043d\u0441\u0430 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u043e ' + enhancementTurnsAgo('critical') + ' \u0445\u043e\u0434(\u0430) \u043d\u0430\u0437\u0430\u0434.</p>' : '<h4>\u0423\u0441\u0438\u043b\u0435\u043d\u0438\u0435 \u0448\u0430\u043d\u0441\u0430 \u043a\u0440\u0438\u0442\u0430</h4><p>\u0414\u043e\u0431\u0430\u0432\u043b\u044f\u0435\u0442\u0441\u044f \u0434\u043e \u0431\u0440\u043e\u0441\u043a\u0430 \u0438 \u0434\u0435\u0439\u0441\u0442\u0432\u0443\u0435\u0442 \u043d\u0430 \u0432\u0441\u0435 \u043f\u043e\u0441\u043b\u0435\u0434\u0443\u044e\u0449\u0438\u0435 \u0430\u0442\u0430\u043a\u0438 \u044d\u0442\u043e\u0433\u043e \u0445\u043e\u0434\u0430.</p><label>\u0427\u0430\u043a\u0440\u0430<select data-field="critical-chakra"><option value="1">1 \u0447\u0430\u043a\u0440\u0430 \u00b7 +10%</option><option value="2">2 \u0447\u0430\u043a\u0440\u044b \u00b7 +20%</option><option value="3">3 \u0447\u0430\u043a\u0440\u044b \u00b7 +30%</option></select></label><button class="aba-primary" type="button" data-add="critical-focus">\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0443\u0441\u0438\u043b\u0435\u043d\u0438\u0435</button>';
    } else if (action === 'concentration') {
      var fullAvailable = remaining().spentOD === 0;
      var focusedState = chakraLedger(state.actions);
      editor.innerHTML = '<h4>\u041a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0430\u0446\u0438\u044f \u0447\u0430\u043a\u0440\u044b</h4><p>\u0422\u0435\u043a\u0443\u0449\u0438\u0439 \u0437\u0430\u043f\u0430\u0441: <b>' + focusedState.focused + ' / ' + focusedState.limit + '</b>. \u0410\u0431\u0441\u043e\u043b\u044e\u0442\u043d\u044b\u0439 \u043f\u0440\u0435\u0434\u0435\u043b \u043f\u043e \u0444\u043e\u0440\u043c\u0443\u043b\u0435 <b>2 \u00d7 \u0427\u0430\u043a\u0440\u0430 + \u0424\u0443\u0438\u043d\u0434\u0437\u044e\u0446\u0443 + \u043c\u043e\u0434\u0438\u0444\u0438\u043a\u0430\u0442\u043e\u0440\u044b</b>: <b>' + focusedState.absoluteLimit + '</b>. \u0417\u0430 \u043e\u0434\u0438\u043d \u0445\u043e\u0434 \u043c\u043e\u0436\u043d\u043e \u0434\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0434\u043e \u0437\u043d\u0430\u0447\u0435\u043d\u0438\u044f \u0424\u0443\u0438\u043d\u0434\u0437\u044e\u0446\u0443: <b>' + statValue('fuinjutsu') + '</b>.</p>' + (focusedState.focused >= focusedState.absoluteLimit ? '<p class="aba-error">\u0410\u0431\u0441\u043e\u043b\u044e\u0442\u043d\u044b\u0439 \u043f\u0440\u0435\u0434\u0435\u043b \u0434\u043e\u0441\u0442\u0438\u0433\u043d\u0443\u0442: \u0434\u0430\u043b\u044c\u043d\u0435\u0439\u0448\u0430\u044f \u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0430\u0446\u0438\u044f \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u043d\u0430.</p>' : '') + (!fullAvailable ? '<p class="aba-error">\u041f\u043e\u043b\u043d\u0430\u044f \u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0430\u0446\u0438\u044f \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u043d\u0430: \u0432 \u044d\u0442\u043e\u043c \u0445\u043e\u0434\u0443 \u0443\u0436\u0435 \u043f\u043e\u0442\u0440\u0430\u0447\u0435\u043d\u044b \u041e\u0414.</p>' : '') + '<label>\u0412\u0438\u0434 \u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0430\u0446\u0438\u0438<select data-field="concentration-type"><option value="rest"' + (fullAvailable ? '' : ' disabled') + '>\u041f\u043e\u043b\u043d\u0430\u044f \u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0430\u0446\u0438\u044f \u2014 \u043f\u043e\u0442\u0440\u0430\u0442\u0438\u0442\u044c \u0432\u0441\u0435 \u041e\u0414 \u0445\u043e\u0434\u0430 (' + actionTotal('ordinary') + ')</option><option value="battle">\u0411\u043e\u0435\u0432\u0430\u044f \u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0430\u0446\u0438\u044f \u2014 \u0431\u0435\u0437 \u041e\u0414/\u041e\u0422, \u043f\u0435\u0440\u0435\u0432\u0435\u0441\u0442\u0438 \u0447\u0430\u043a\u0440\u0443 \u0438\u0437 \u043e\u0431\u0449\u0435\u0433\u043e \u0437\u0430\u043f\u0430\u0441\u0430</option></select></label><button class="aba-primary" type="button" data-add="concentration"' + (focusedState.focused >= focusedState.absoluteLimit ? ' disabled' : '') + '>\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0430\u0446\u0438\u044e</button>';
    } else if (action === 'move-short' || action === 'move-long') {
      var cost = action === 'move-short' ? 1 : 2;
      editor.innerHTML = '<h4>' + (action === 'move-short' ? '\u041f\u0435\u0440\u0435\u0434\u0432\u0438\u0436\u0435\u043d\u0438\u0435' : '\u0421\u0431\u043b\u0438\u0436\u0435\u043d\u0438\u0435 \u0438\u043b\u0438 \u043f\u043e\u0431\u0435\u0433') + '</h4><label>\u041a\u0443\u0434\u0430 \u0438 \u0437\u0430\u0447\u0435\u043c \u0434\u0432\u0438\u0436\u0435\u0442\u0441\u044f \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436<input data-field="description" type="text" placeholder="\u041a\u0440\u0430\u0442\u043a\u043e\u0435 \u043e\u043f\u0438\u0441\u0430\u043d\u0438\u0435 \u043f\u0435\u0440\u0435\u043c\u0435\u0449\u0435\u043d\u0438\u044f"></label>' + modifierBlock(enhanceFields('speed')) + '<button class="aba-primary" type="button" data-add="' + action + '">\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u00b7 ' + cost + ' \u041e\u0414</button>';
    } else if (action === 'body-flicker') {
      editor.innerHTML = '<h4>\u0422\u0435\u0445\u043d\u0438\u043a\u0430 \u041c\u0435\u0440\u0446\u0430\u044e\u0449\u0435\u0433\u043e \u0422\u0435\u043b\u0430</h4><p>\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u043f\u043e\u0441\u043e\u0431 \u043f\u0440\u0438\u043c\u0435\u043d\u0435\u043d\u0438\u044f \u0442\u0435\u0445\u043d\u0438\u043a\u0438.</p><label>\u041f\u0440\u0438\u043c\u0435\u043d\u0435\u043d\u0438\u0435<select data-field="body-flicker-mode"><option value="escape">\u041f\u043e\u0431\u0435\u0433 \u2014 \u043f\u0440\u043e\u0432\u0435\u0440\u043a\u0430 \u0423\u043a\u043b\u043e\u043d\u0435\u043d\u0438\u044f</option><option value="approach">\u0421\u0431\u043b\u0438\u0436\u0435\u043d\u0438\u0435 \u2014 \u0431\u0435\u0437 \u043f\u0440\u043e\u0432\u0435\u0440\u043a\u0438</option></select></label><button class="aba-primary" type="button" data-add="body-flicker">\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0442\u0435\u0445\u043d\u0438\u043a\u0443 \u00b7 ' + RANK_COSTS.D + ' \u041e\u0422</button>';
    } else if (action === 'substitution') {
      renderSubstitutionEditor(editor);
    } else if (action === 'turn-chakra-cost') {
      editor.innerHTML = '<h4>\u0417\u0430\u0442\u0440\u0430\u0442\u0430 \u0447\u0430\u043a\u0440\u044b \u0432 \u0445\u043e\u0434</h4><p>\u0414\u043b\u044f \u0443\u0436\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0443\u044e\u0449\u0435\u0439 \u0442\u0435\u0445\u043d\u0438\u043a\u0438 \u0438\u043b\u0438 \u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u0438. \u0423\u043a\u0430\u0436\u0438\u0442\u0435 \u0440\u0430\u0441\u0445\u043e\u0434 \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0438 \u0438 \u0437\u0430\u043f\u0430\u0441, \u0438\u0437 \u043a\u043e\u0442\u043e\u0440\u043e\u0433\u043e \u043e\u043d \u043e\u043f\u043b\u0430\u0447\u0438\u0432\u0430\u0435\u0442\u0441\u044f.</p><label>\u0422\u0435\u0445\u043d\u0438\u043a\u0430 \u0438\u043b\u0438 \u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u044c<input data-field="turn-chakra-name" type="text" placeholder="\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0443\u044e\u0449\u0435\u0433\u043e \u044d\u0444\u0444\u0435\u043a\u0442\u0430"></label><div class="aba-inline"><label>\u0417\u0430\u0442\u0440\u0430\u0442\u0430 \u0447\u0430\u043a\u0440\u044b \u0432 \u0445\u043e\u0434<input data-field="turn-chakra-amount" type="number" min="1" step="1" value="1"></label><label>\u0422\u0438\u043f \u0447\u0430\u043a\u0440\u044b<select data-field="turn-chakra-type"><option value="general">\u041e\u0431\u0449\u0438\u0439 \u0437\u0430\u043f\u0430\u0441</option><option value="focused">\u041a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u0430\u044f \u0447\u0430\u043a\u0440\u0430</option></select></label></div><button class="aba-primary" type="button" data-add="turn-chakra-cost">\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0440\u0430\u0441\u0445\u043e\u0434 \u00b7 \u0431\u0435\u0437 \u041e\u0414/\u041e\u0422</button>';
    } else if (action === 'surface-hold') {
      renderSurfaceHoldEditor(editor);
    } else if (action === 'summon') {
      renderSummonEditor(editor);
    } else if (action === 'ability-activation') {
      renderAbilityActivationEditor(editor);
    } else if (action === 'active-effects') {
      renderActiveEffectsEditor(editor);
    } else if (action === 'illusion-release' || action === 'chakra-transfer' || action === 'healing') {
      renderSpecialTechniqueEditor(editor, action);
    } else if (action === 'received-healing' || action === 'received-wound') {
      var enemyTop = action === 'received-wound' ? '<div class="aba-inline aba-enemy-load"><label>\u0421\u0441\u044b\u043b\u043a\u0430 \u043d\u0430 \u043f\u043e\u0441\u0442 \u043f\u0440\u043e\u0442\u0438\u0432\u043d\u0438\u043a\u0430<input data-field="enemy-post" type="url" placeholder="https://\u2026#p\u2026"></label><button class="aba-refresh" type="button" data-load-enemy-post>\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c</button></div><div class="aba-enemy-load-status" aria-live="polite"></div><label>\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044f \u043f\u0440\u043e\u0442\u0438\u0432\u043d\u0438\u043a\u0430 \u0438\u0437 \u043f\u043e\u0441\u0442\u0430<textarea data-field="enemy-actions" rows="3" placeholder="\u041f\u043e\u0441\u043b\u0435 \u0437\u0430\u0433\u0440\u0443\u0437\u043a\u0438 \u043e\u0442\u043c\u0435\u0442\u044c\u0442\u0435 \u043d\u0443\u0436\u043d\u044b\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044f \u043d\u0438\u0436\u0435"></textarea></label><div class="aba-enemy-actions-found"></div>' : '';
      editor.innerHTML = '<h4>' + (action === 'received-healing' ? '\u041f\u043e\u043b\u0443\u0447\u0435\u043d\u043e \u043b\u0435\u0447\u0435\u043d\u0438\u0435' : '\u041f\u043e\u043b\u0443\u0447\u0435\u043d\u043e \u0440\u0430\u043d\u0435\u043d\u0438\u0435') + '</h4><p>' + (action === 'received-healing' ? '\u041b\u0435\u0447\u0435\u043d\u0438\u0435 \u0443\u0432\u0435\u043b\u0438\u0447\u0438\u0442 HP, \u043d\u043e \u043d\u0435 \u0432\u044b\u0448\u0435 \u043c\u0430\u043a\u0441\u0438\u043c\u0430\u043b\u044c\u043d\u043e\u0433\u043e \u0437\u043d\u0430\u0447\u0435\u043d\u0438\u044f.' : '\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u0435 \u043f\u043e\u0441\u0442 \u043f\u0440\u043e\u0442\u0438\u0432\u043d\u0438\u043a\u0430 \u0438 \u043e\u0442\u043c\u0435\u0442\u044c\u0442\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044f, \u043a\u043e\u0442\u043e\u0440\u044b\u0435 \u043d\u0430\u043d\u0435\u0441\u043b\u0438 \u0443\u0440\u043e\u043d, \u043b\u0438\u0431\u043e \u0437\u0430\u043f\u043e\u043b\u043d\u0438\u0442\u0435 \u0437\u043d\u0430\u0447\u0435\u043d\u0438\u044f \u0432\u0440\u0443\u0447\u043d\u0443\u044e.') + '</p>' + enemyTop + '<label>\u041a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e HP / \u0432\u0445\u043e\u0434\u044f\u0449\u0438\u0439 \u0443\u0440\u043e\u043d<input data-field="hp-amount" type="number" min="1" step="1" value="1"></label>' + (action === 'received-wound' ? '<label>\u0422\u0438\u043f \u0432\u0445\u043e\u0434\u044f\u0449\u0435\u0439 \u0430\u0442\u0430\u043a\u0438<select data-field="incoming-attack-type"><option value="technique">\u0422\u0435\u0445\u043d\u0438\u043a\u0430 \u0438\u043b\u0438 \u0434\u0440\u0443\u0433\u043e\u0439 \u0438\u0441\u0442\u043e\u0447\u043d\u0438\u043a</option><option value="unarmed">\u0420\u0443\u043a\u043e\u043f\u0430\u0448\u043d\u0430\u044f \u0430\u0442\u0430\u043a\u0430 \u0431\u0435\u0437 \u043e\u0440\u0443\u0436\u0438\u044f</option><option value="weapon">\u041e\u0431\u044b\u0447\u043d\u0430\u044f \u0430\u0442\u0430\u043a\u0430 \u043e\u0440\u0443\u0436\u0438\u0435\u043c</option><option value="ranged">\u041e\u0431\u044b\u0447\u043d\u0430\u044f \u0434\u0430\u043b\u044c\u043d\u044f\u044f \u0430\u0442\u0430\u043a\u0430 \u043e\u0440\u0443\u0436\u0438\u0435\u043c</option></select></label><label class="aba-check"><input type="checkbox" data-field="incoming-hidden"><span>\u0421\u043a\u0440\u044b\u0442\u0430\u044f \u0440\u0443\u043a\u043e\u043f\u0430\u0448\u043d\u0430\u044f \u0430\u0442\u0430\u043a\u0430</span></label><label class="aba-check"><input type="checkbox" data-field="incoming-extra-factors"><span>\u0415\u0441\u0442\u044c \u0434\u043e\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044c\u043d\u044b\u0435 \u0444\u0430\u043a\u0442\u043e\u0440\u044b, \u043f\u043e\u0437\u0432\u043e\u043b\u044f\u044e\u0449\u0438\u0435 \u0441\u043a\u0440\u044b\u0442\u043e\u0439 \u0430\u0442\u0430\u043a\u0435 \u043f\u043e\u0434\u0435\u0439\u0441\u0442\u0432\u043e\u0432\u0430\u0442\u044c</span></label><label class="aba-check"><input type="checkbox" data-field="incoming-critical"><span>\u0415\u0441\u0442\u044c \u043a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u043e\u0435 \u043f\u043e\u043f\u0430\u0434\u0430\u043d\u0438\u0435</span></label><label>\u0414\u043e\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044c\u043d\u044b\u0439 \u0443\u0440\u043e\u043d \u043a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u043e\u0433\u043e \u043f\u043e\u043f\u0430\u0434\u0430\u043d\u0438\u044f<input data-field="incoming-critical-damage" type="number" min="0" step="1" value="0"></label><label class="aba-check"><input type="checkbox" data-field="apply-protection"><span>\u0423\u0447\u0438\u0442\u044b\u0432\u0430\u0442\u044c \u0437\u0430\u0449\u0438\u0442\u0443</span></label><label>\u0414\u043e\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044c\u043d\u044b\u0435 \u0441\u043b\u043e\u0438 \u0437\u0430\u0449\u0438\u0442\u044b<input data-field="defense-layers" placeholder="20 + 30"></label><p class="aba-note">\u041f\u0440\u0438 \u0422\u0430\u0439\u0434\u0437\u044e\u0446\u0443 8 \u0441\u043a\u0440\u044b\u0442\u0430\u044f \u0440\u0443\u043a\u043e\u043f\u0430\u0448\u043d\u0430\u044f \u0430\u0442\u0430\u043a\u0430 \u0431\u0435\u0437 \u0434\u043e\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044c\u043d\u044b\u0445 \u0444\u0430\u043a\u0442\u043e\u0440\u043e\u0432 \u043d\u0435 \u043d\u0430\u043d\u043e\u0441\u0438\u0442 \u0443\u0440\u043e\u043d. \u041f\u0440\u0438 \u0422\u0430\u0439\u0434\u0437\u044e\u0446\u0443 9 \u043a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u043a\u043e\u043c\u043f\u043e\u043d\u0435\u043d\u0442 \u0440\u0443\u043a\u043e\u043f\u0430\u0448\u043d\u043e\u0439 \u0430\u0442\u0430\u043a\u0438 \u0438\u0433\u043d\u043e\u0440\u0438\u0440\u0443\u0435\u0442\u0441\u044f, \u0430 \u043e\u0431\u044b\u0447\u043d\u044b\u0435 \u0430\u0442\u0430\u043a\u0438 \u043e\u0440\u0443\u0436\u0438\u0435\u043c \u0438 \u0431\u0435\u0437 \u043e\u0440\u0443\u0436\u0438\u044f \u043d\u0430\u043d\u043e\u0441\u044f\u0442 \u043d\u0430 10% \u043c\u0435\u043d\u044c\u0448\u0435 \u0443\u0440\u043e\u043d\u0430.</p>' : '') + '<label>\u0418\u0441\u0442\u043e\u0447\u043d\u0438\u043a \u0438\u043b\u0438 \u043f\u043e\u044f\u0441\u043d\u0435\u043d\u0438\u0435<input data-field="description" type="text" placeholder="\u041a\u0442\u043e \u043b\u0435\u0447\u0438\u0442 \u0438\u043b\u0438 \u0447\u0435\u043c \u043d\u0430\u043d\u0435\u0441\u0435\u043d\u043e \u0440\u0430\u043d\u0435\u043d\u0438\u0435"></label><button class="aba-primary" type="button" data-add="' + action + '">\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c</button>';
      var enemyLoad = editor.querySelector('[data-load-enemy-post]');
      if (enemyLoad) on(enemyLoad, 'click', function () { loadOpponentDamageActions(editor); });
    } else if (action === 'trauma-concentration') {
      editor.innerHTML = '<h4>\u041a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0430\u0446\u0438\u044f \u0447\u0430\u043a\u0440\u044b \u043f\u0440\u0438 \u0442\u0440\u0430\u0432\u043c\u0435</h4><p>\u041a\u0430\u0436\u0434\u0430\u044f \u0435\u0434\u0438\u043d\u0438\u0446\u0430 \u0447\u0430\u043a\u0440\u044b \u0432\u0440\u0435\u043c\u0435\u043d\u043d\u043e \u0432\u043e\u0441\u0441\u0442\u0430\u043d\u0430\u0432\u043b\u0438\u0432\u0430\u0435\u0442 20 \u0431\u043e\u0435\u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u0438 \u0438 \u043f\u043e\u0434\u0430\u0432\u043b\u044f\u0435\u0442 \u0443\u043a\u0430\u0437\u0430\u043d\u043d\u044b\u0439 \u0434\u0435\u0431\u0430\u0444.</p><label>\u0427\u0430\u043a\u0440\u0430<select data-field="trauma-chakra"><option value="1">1 \u0447\u0430\u043a\u0440\u0430 \u00b7 20 HP</option><option value="2">2 \u0447\u0430\u043a\u0440\u044b \u00b7 40 HP</option><option value="3">3 \u0447\u0430\u043a\u0440\u044b \u00b7 60 HP</option></select></label><label>\u0422\u0440\u0430\u0432\u043c\u0430 \u0438\u043b\u0438 \u0434\u0435\u0431\u0430\u0444<input data-field="description"></label><button class="aba-primary" type="button" data-add="trauma-concentration">\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0430\u0446\u0438\u044e</button>';
    } else if (action === 'received-chakra') {
      editor.innerHTML = '<h4>\u041f\u043e\u043b\u0443\u0447\u0435\u043d\u0430 \u0447\u0430\u043a\u0440\u0430</h4><p>\u041f\u043e\u043b\u0443\u0447\u0435\u043d\u043d\u044b\u0439 \u043e\u0431\u044a\u0451\u043c \u0431\u0443\u0434\u0435\u0442 \u0434\u043e\u0431\u0430\u0432\u043b\u0435\u043d \u043a \u0442\u0435\u043a\u0443\u0449\u0435\u043c\u0443 \u043e\u0431\u0449\u0435\u043c\u0443 \u0437\u0430\u043f\u0430\u0441\u0443 \u0447\u0430\u043a\u0440\u044b.</p><label>\u041a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e \u0447\u0430\u043a\u0440\u044b<input data-field="chakra-amount" type="number" min="1" step="1" value="1"></label><label>\u0418\u0441\u0442\u043e\u0447\u043d\u0438\u043a \u0438\u043b\u0438 \u043f\u043e\u044f\u0441\u043d\u0435\u043d\u0438\u0435<input data-field="description" type="text" placeholder="\u041a\u0442\u043e \u043f\u0435\u0440\u0435\u0434\u0430\u043b \u0447\u0430\u043a\u0440\u0443 \u0438\u043b\u0438 \u043e\u0442\u043a\u0443\u0434\u0430 \u043e\u043d\u0430 \u043f\u043e\u043b\u0443\u0447\u0435\u043d\u0430"></label><button class="aba-primary" type="button" data-add="received-chakra">\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0447\u0430\u043a\u0440\u0443</button>';
    } else if (action === 'received-effect') {
      editor.innerHTML = '<h4>\u041f\u043e\u043b\u0443\u0447\u0435\u043d \u044d\u0444\u0444\u0435\u043a\u0442</h4><label>\u042d\u0444\u0444\u0435\u043a\u0442<select data-field="effect-type"><option value="burn">\u041e\u0436\u043e\u0433</option><option value="bleeding">\u041a\u0440\u043e\u0432\u043e\u0442\u0435\u0447\u0435\u043d\u0438\u0435</option><option value="buff">\u0411\u0430\u0444\u0444</option><option value="immobilized">\u041e\u0431\u0435\u0437\u0434\u0432\u0438\u0436\u0438\u0432\u0430\u043d\u0438\u0435</option><option value="fear">\u0418\u0441\u043f\u0443\u0433</option><option value="disorientation">\u0414\u0435\u0437\u043e\u0440\u0438\u0435\u043d\u0442\u0430\u0446\u0438\u044f</option><option value="trauma">\u041f\u0441\u0438\u0445\u043e\u043b\u043e\u0433\u0438\u0447\u0435\u0441\u043a\u0430\u044f \u0442\u0440\u0430\u0432\u043c\u0430</option></select></label><div class="aba-effect-fields"></div><button class="aba-primary" type="button" data-add="received-effect">\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u044d\u0444\u0444\u0435\u043a\u0442</button>';
      updateEffectFields(editor);
    } else if (action === 'sacrifice') {
      editor.innerHTML = sacrificeAlreadyUsed() ? '<h4>\u0416\u0435\u0440\u0442\u0432\u0430</h4><p class="aba-error">\u0416\u0435\u0440\u0442\u0432\u0430 \u0443\u0436\u0435 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0430 \u0432 \u044d\u0442\u043e\u043c \u0431\u043e\u044e.</p>' : '<h4>\u0416\u0435\u0440\u0442\u0432\u0430</h4><p>\u041f\u0440\u0438 \u0424\u0443\u0438\u043d\u0434\u0437\u044e\u0446\u0443 10 \u043e\u0434\u0438\u043d \u0440\u0430\u0437 \u0437\u0430 \u0431\u043e\u0439 \u043c\u043e\u0436\u043d\u043e \u043d\u0430\u043d\u0435\u0441\u0442\u0438 \u0441\u0435\u0431\u0435 20 \u0443\u0440\u043e\u043d\u0430 \u0438 \u043f\u043e\u043b\u0443\u0447\u0438\u0442\u044c +2 \u043a \u0432\u044b\u0431\u0440\u0430\u043d\u043d\u043e\u043c\u0443 \u043f\u0430\u0440\u0430\u043c\u0435\u0442\u0440\u0443.</p><label>\u041f\u0430\u0440\u0430\u043c\u0435\u0442\u0440<select data-field="sacrifice-stat">' + [['ninjutsu','\u041d\u0438\u043d\u0434\u0437\u044e\u0446\u0443'],['taijutsu','\u0422\u0430\u0439\u0434\u0437\u044e\u0446\u0443'],['genjutsu','\u0413\u0435\u043d\u0434\u0437\u044e\u0446\u0443'],['fuinjutsu','\u0424\u0443\u0438\u043d\u0434\u0437\u044e\u0446\u0443'],['strategy','\u0422\u0430\u043a\u0442\u0438\u043a\u0430'],['knowledge','\u0417\u043d\u0430\u043d\u0438\u044f'],['strength','\u0421\u0438\u043b\u0430'],['speed','\u0421\u043a\u043e\u0440\u043e\u0441\u0442\u044c'],['chakra','\u0427\u0430\u043a\u0440\u0430'],['health','\u0417\u0434\u043e\u0440\u043e\u0432\u044c\u0435']].map(function (item) { return '<option value="' + item[0] + '">' + item[1] + '</option>'; }).join('') + '</select></label><button class="aba-primary" type="button" data-add="sacrifice">\u041f\u0440\u0438\u043c\u0435\u043d\u0438\u0442\u044c \u0436\u0435\u0440\u0442\u0432\u0443</button>';
    } else if (action.indexOf('tech-') === 0) {
      renderTechniqueEditor(editor, action.replace('tech-', ''));
    }
    bindEditor(editor);
  }

  function selectCharacterWeapon(editor, mode) {
    if (!state.character) return;
    var selected = weaponOptions(mode)[0];
    if (!selected) return;
    var select = editor.querySelector('[data-field="weapon"]');
    if (!select) return;
    select.value = selected.kind + ':' + selected.id;
    updateWeaponInfo(editor, mode);
  }

  function renderSubstitutionEditor(editor) {
    var item = findCharacterTechnique(SUBSTITUTION_TECHNIQUE);
    editor.innerHTML = '<h4>\u0422\u0435\u0445\u043d\u0438\u043a\u0430 \u0417\u0430\u043c\u0435\u043d\u044b</h4><p>\u0417\u0430\u0449\u0438\u0442\u043d\u043e\u0435 \u043f\u0440\u0438\u043c\u0435\u043d\u0435\u043d\u0438\u0435 \u0442\u0435\u0445\u043d\u0438\u043a\u0438 \u0438\u0437 \u043b\u0438\u0447\u043d\u043e\u0433\u043e \u0434\u0435\u043b\u0430 \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0430.</p>' + (item ? '<div class="aba-loading">\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u043e\u043f\u0438\u0441\u0430\u043d\u0438\u044f \u0442\u0435\u0445\u043d\u0438\u043a\u0438\u2026</div>' : '<p class="aba-error">\u0422\u0435\u0445\u043d\u0438\u043a\u0430 \u0417\u0430\u043c\u0435\u043d\u044b \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u0430 \u0432 \u043b\u0438\u0447\u043d\u043e\u043c \u0434\u0435\u043b\u0435.</p>');
    if (!item) return;
    loadTechniqueDetail(item).then(function (detail) {
      var sealAvailability = techniqueSealAvailability(item, techniqueCheck(detail));
      var costBase = Math.max(1, RANK_COSTS[item.rank] - detail.discount);
      var mentalSeals = sealAvailability.mental;
      editor.innerHTML = '<h4>\u0422\u0435\u0445\u043d\u0438\u043a\u0430 \u0417\u0430\u043c\u0435\u043d\u044b</h4><p>\u0417\u0430\u0449\u0438\u0442\u043d\u043e\u0435 \u043f\u0440\u0438\u043c\u0435\u043d\u0435\u043d\u0438\u0435 \u0442\u0435\u0445\u043d\u0438\u043a\u0438 \u0438\u0437 \u043b\u0438\u0447\u043d\u043e\u0433\u043e \u0434\u0435\u043b\u0430 \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0430.</p><div class="aba-summary"><strong>' + escapeHtml(item.name) + '</strong>' + (detail.chakra ? '<span>\u0427\u0430\u043a\u0440\u0430: ' + escapeHtml(detail.chakra) + '</span>' : '') + '</div>' + (mentalSeals ? '<label class="aba-check"><input type="checkbox" data-field="substitution-mental"><span>\u0421\u043a\u043b\u0430\u0434\u044b\u0432\u0430\u0442\u044c \u043f\u0435\u0447\u0430\u0442\u0438 \u043c\u044b\u0441\u043b\u0435\u043d\u043d\u043e: \u22121 \u041e\u0422, +1 \u043a \u0410\u0442\u0430\u043a\u0435 \u041d\u0438\u043d\u0434\u0437\u044e\u0446\u0443, +1 \u043a \u0440\u0430\u0441\u0445\u043e\u0434\u0443 \u043e\u0431\u043e\u0438\u0445 \u0437\u0430\u043f\u0430\u0441\u043e\u0432 \u0447\u0430\u043a\u0440\u044b</span></label>' : '') + '<button class="aba-primary" type="button" data-add-substitution>\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u00b7 ' + costBase + ' \u041e\u0422</button>';
      var mentalCheckbox = editor.querySelector('[data-field="substitution-mental"]');
      var addButton = editor.querySelector('[data-add-substitution]');
      var updateCost = function () {
        var enabled = !!(mentalCheckbox && mentalCheckbox.checked);
        var cost = Math.max(1, costBase - (enabled ? 1 : 0));
        if (addButton) addButton.textContent = '\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u00b7 ' + cost + ' \u041e\u0422';
      };
      if (mentalCheckbox) on(mentalCheckbox, 'change', updateCost);
      updateCost();
      on(addButton, 'click', function () {
        var useMentalSeals = !!(mentalCheckbox && mentalCheckbox.checked);
        var chakra = techniqueChakraCost(detail.chakra);
        var cost = Math.max(1, costBase - (useMentalSeals ? 1 : 0));
        if (useMentalSeals) {
          chakra.focused += 1;
          chakra.general += 1;
        }
        var check = techniqueCheck(detail);
        var code = coloredTechniqueBbcode(SUBSTITUTION_TECHNIQUE) + ' \u2014 \u0437\u0430\u0449\u0438\u0442\u043d\u043e\u0435 \u043f\u0440\u0438\u043c\u0435\u043d\u0435\u043d\u0438\u0435';
        var statModifiers = null;
        if (useMentalSeals && check.label === '\u0410\u0442\u0430\u043a\u0430 \u041d\u0438\u043d\u0434\u0437\u044e\u0446\u0443') {
          code += '; \u043f\u0435\u0447\u0430\u0442\u0438 \u0441\u043a\u043b\u0430\u0434\u044b\u0432\u0430\u044e\u0442\u0441\u044f \u043c\u044b\u0441\u043b\u0435\u043d\u043d\u043e: \u0410\u0442\u0430\u043a\u0430 \u041d\u0438\u043d\u0434\u0437\u044e\u0446\u0443 +1, \u0441\u0442\u043e\u0438\u043c\u043e\u0441\u0442\u044c \u22121 \u041e\u0422, \u0440\u0430\u0441\u0445\u043e\u0434 \u043e\u0431\u0449\u0435\u0439 \u0438 \u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u043e\u0439 \u0447\u0430\u043a\u0440\u044b +1';
          statModifiers = { ninjutsuAttack: 1 };
        }
        addAction({
          label: '\u0422\u0435\u0445\u043d\u0438\u043a\u0430 \u0417\u0430\u043c\u0435\u043d\u044b',
          summary: item.name + (useMentalSeals ? ' \u00b7 \u043f\u0435\u0447\u0430\u0442\u0438 \u043c\u044b\u0441\u043b\u0435\u043d\u043d\u043e' : ''),
          od: 0,
          ot: cost,
          code: code,
          link: item.url,
          focusedChakraSpend: chakra.focused,
          chakraSpend: chakra.general,
          techniqueUseKey: 'technique:' + item.postId,
          techniqueTurnLimit: techniqueTurnLimit(detail),
          statModifiers: statModifiers,
          modifierSourceKey: useMentalSeals ? 'technique:' + item.postId + ':mental' : ''
        });
      });
    }).catch(function (error) {
      editor.innerHTML = '<h4>\u0422\u0435\u0445\u043d\u0438\u043a\u0430 \u0417\u0430\u043c\u0435\u043d\u044b</h4><p class="aba-error">\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u043e\u043f\u0438\u0441\u0430\u043d\u0438\u0435 \u0442\u0435\u0445\u043d\u0438\u043a\u0438: ' + escapeHtml(error.message) + '</p>';
    });
  }

  function renderSurfaceHoldEditor(editor) {
    editor.innerHTML = '<h4>\u0423\u0434\u0435\u0440\u0436\u0430\u043d\u0438\u0435 \u043d\u0430 \u043f\u043e\u0432\u0435\u0440\u0445\u043d\u043e\u0441\u0442\u0438 \u0447\u0430\u043a\u0440\u043e\u0439</h4><p>\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043f\u043e\u0432\u0435\u0440\u0445\u043d\u043e\u0441\u0442\u044c. \u041f\u0440\u0438 \u043f\u0435\u0440\u0432\u043e\u043c \u043f\u0440\u0438\u043c\u0435\u043d\u0435\u043d\u0438\u0438 \u0441\u043f\u0438\u0441\u044b\u0432\u0430\u0435\u0442\u0441\u044f \u0447\u0430\u043a\u0440\u0430 \u0437\u0430 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u0435 \u0442\u0435\u0445\u043d\u0438\u043a\u0438, \u043f\u0440\u0438 \u043f\u0440\u043e\u0434\u043e\u043b\u0436\u0435\u043d\u0438\u0438 \u2014 \u0442\u043e\u043b\u044c\u043a\u043e \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430 \u0442\u0435\u043a\u0443\u0449\u0435\u0433\u043e \u0445\u043e\u0434\u0430.</p><label>\u0422\u0438\u043f \u043f\u043e\u0432\u0435\u0440\u0445\u043d\u043e\u0441\u0442\u0438<select data-field="surface-type"><option value="solid">\u0422\u0432\u0451\u0440\u0434\u0430\u044f \u043f\u043e\u0432\u0435\u0440\u0445\u043d\u043e\u0441\u0442\u044c</option><option value="liquid">\u0416\u0438\u0434\u043a\u043e\u0441\u0442\u044c</option></select></label><label class="aba-check"><input type="checkbox" data-field="surface-continuation"><span>\u041f\u0440\u043e\u0434\u043e\u043b\u0436\u0435\u043d\u0438\u0435: \u0442\u0435\u0445\u043d\u0438\u043a\u0430 \u0443\u0436\u0435 \u0430\u043a\u0442\u0438\u0432\u0438\u0440\u043e\u0432\u0430\u043d\u0430</span></label><div class="aba-surface-summary"></div>';
    var type = editor.querySelector('[data-field="surface-type"]');
    var continuation = editor.querySelector('[data-field="surface-continuation"]');
    var summary = editor.querySelector('.aba-surface-summary');

    function update() {
      var definition = SURFACE_TECHNIQUES[type.value];
      var item = findCharacterTechnique(definition);
      if (!item) {
        summary.innerHTML = '<p class="aba-error">' + escapeHtml(definition.name) + ' \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u0430 \u0432 \u043b\u0438\u0447\u043d\u043e\u043c \u0434\u0435\u043b\u0435.</p>';
        return;
      }
      summary.innerHTML = '<div class="aba-loading">\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u043e\u043f\u0438\u0441\u0430\u043d\u0438\u044f \u0442\u0435\u0445\u043d\u0438\u043a\u0438\u2026</div>';
      loadTechniqueDetail(item).then(function (detail) {
        if (SURFACE_TECHNIQUES[type.value] !== definition) return;
        var useCost = techniqueCalculation(item, 'support');
        var supportCost = supportChakraCost(detail) || useCost.support || useCost.general;
        var isContinuation = continuation.checked;
        var focused = isContinuation ? 0 : useCost.focused;
        var general = isContinuation ? supportCost : useCost.general;
        var ot = isContinuation ? 0 : useCost.ot;
        summary.innerHTML = '<div class="aba-summary"><strong>' + escapeHtml(definition.name) + '</strong><span>' + (isContinuation ? '\u041f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430 \u0442\u0435\u043a\u0443\u0449\u0435\u0433\u043e \u0445\u043e\u0434\u0430: ' + general + ' \u043e\u0431\u0449\u0435\u0439 \u0447\u0430\u043a\u0440\u044b' : '\u041f\u0435\u0440\u0432\u043e\u0435 \u043f\u0440\u0438\u043c\u0435\u043d\u0435\u043d\u0438\u0435' + (detail.chakra ? ': ' + escapeHtml(detail.chakra) : '')) + '</span><button class="aba-primary" type="button" data-add-surface>\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c' + (ot ? ' \u00b7 ' + ot + ' \u041e\u0422' : '') + '</button></div>';
        on(summary.querySelector('[data-add-surface]'), 'click', function () {
          addAction({
            label: '\u0423\u0434\u0435\u0440\u0436\u0430\u043d\u0438\u0435 \u043d\u0430 \u043f\u043e\u0432\u0435\u0440\u0445\u043d\u043e\u0441\u0442\u0438 \u0447\u0430\u043a\u0440\u043e\u0439',
            summary: definition.name + (isContinuation ? ' \u2014 \u043f\u0440\u043e\u0434\u043e\u043b\u0436\u0435\u043d\u0438\u0435' : ''),
            od: 0,
            ot: ot,
            code: coloredTechniqueBbcode(definition) + ' \u2014 ' + (isContinuation ? '\u043f\u0440\u043e\u0434\u043e\u043b\u0436\u0435\u043d\u0438\u0435 \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0438' : '\u0430\u043a\u0442\u0438\u0432\u0430\u0446\u0438\u044f') + ', \u043f\u043e\u0432\u0435\u0440\u0445\u043d\u043e\u0441\u0442\u044c: ' + (type.value === 'liquid' ? '\u0436\u0438\u0434\u043a\u043e\u0441\u0442\u044c' : '\u0442\u0432\u0451\u0440\u0434\u0430\u044f'),
            link: item.url,
            focusedChakraSpend: focused,
            chakraSpend: general,
            startActiveEffect: true,
            activeEffectKey: activeEffectKey({ item: item, kind: 'technique' }),
            techniqueUseKey: isContinuation ? '' : 'technique:' + item.postId,
            techniqueTurnLimit: isContinuation ? 0 : techniqueTurnLimit(detail)
          });
        });
      }).catch(function (error) {
        summary.innerHTML = '<p class="aba-error">\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u043e\u043f\u0438\u0441\u0430\u043d\u0438\u0435 \u0442\u0435\u0445\u043d\u0438\u043a\u0438: ' + escapeHtml(error.message) + '</p>';
      });
    }

    on(type, 'change', update);
    on(continuation, 'change', update);
    update();
  }

  function maxOrdinarySummonRank(chakraTotal) {
    chakraTotal = Number(chakraTotal) || 0;
    return chakraTotal > 300 ? 'S' : chakraTotal > 200 ? 'A' : chakraTotal > 150 ? 'B' : chakraTotal > 100 ? 'C' : 'D';
  }

  function firearmWeaponDamage(weapon) {
    var damage = String(weapon && weapon.damage || '\u0443\u0440\u043e\u043d \u043d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d')
      .replace(/\s*[+]\s*(?:\u0441\u0438\u043b\u0430|\u0441\u0438\u043b\u044b|\u0441\u043a\u043e\u0440\u043e\u0441\u0442\u044c|\u0441\u043a\u043e\u0440\u043e\u0441\u0442\u0438|\u0442\u0430\u0439\u0434\u0437\u044e(?:\u0446\u0443|\u0442\u0441\u0443))(?=\s|$|\/)/gi, '')
      .trim();
    return equipmentDamage(damage, true);
  }

  function summonRankFromNode(region) {
    var colorMap = { '#c46f33':'E', 'rgb(196, 111, 51)':'E', '#377e22':'D', 'rgb(55, 126, 34)':'D', 'mediumpurple':'C', 'rgb(147, 112, 219)':'C', 'dodgerblue':'B', 'rgb(30, 144, 255)':'B', '#808080':'A', 'gray':'A', 'grey':'A', 'rgb(128, 128, 128)':'A', 'red':'S', '#ff0000':'S', 'rgb(255, 0, 0)':'S' };
    var colored = region && region.querySelector('[style*="color"]');
    var color = colored ? String(colored.style.color || '').toLowerCase() : '';
    return colorMap[color] || rankFromLabel(region && region.textContent) || 'E';
  }

  function parseNamedSummonIndex(doc) {
    var post = findPostContent(doc, '267');
    var result = [], seen = {};
    if (!post) return result;
    Array.prototype.forEach.call(post.querySelectorAll('table tr'), function (row) {
      var cells = row.cells || [];
      if (cells.length < 2) return;
      var category = clean(cells[0].textContent);
      Array.prototype.forEach.call(cells[1].querySelectorAll('a[href*="#p"]'), function (link) {
        var href = absoluteUrl(link.getAttribute('href'), BASE_URL), match = href.match(/#p(\d+)/i), name = clean(link.textContent);
        if (!match || !name || seen[match[1]]) return;
        seen[match[1]] = true;
        result.push({ postId: match[1], name: name, category: category || '\u0411\u0435\u0437 \u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u0438', url: href });
      });
    });
    return result;
  }

  function loadNamedSummons(force) {
    if (state.namedSummons.length && !force) return actorResolve(state.namedSummons);
    return loadDocument(BASE_URL + '/viewtopic.php?id=' + SUMMON_TOPIC_ID, force).then(function (doc) {
      state.namedSummons = parseNamedSummonIndex(doc);
      return state.namedSummons;
    });
  }

  function summonStat(text, label) {
    var match = String(text || '').match(new RegExp(label + '\\s*(?:-|\u2013|\u2014|:)\\s*(\\d+)', 'i'));
    return match ? Number(match[1]) : 0;
  }

  function parseNamedSummonCard(region, item) {
    var text = clean(region && region.textContent), stats = {
      chakra: summonStat(text, '\u0427\u0430\u043a\u0440\u0430'), strength: summonStat(text, '\u0421\u0438\u043b\u0430'), speed: summonStat(text, '\u0421\u043a\u043e\u0440\u043e\u0441\u0442\u044c'), strategy: summonStat(text, '\u0422\u0430\u043a\u0442\u0438\u043a\u0430'),
      ninjutsu: summonStat(text, '\u041d\u0438\u043d\u0434\u0437\u044e\u0446\u0443'), taijutsu: summonStat(text, '\u0422\u0430\u0439\u0434\u0437\u044e\u0446\u0443'), genjutsu: summonStat(text, '\u0413\u0435\u043d\u0434\u0437\u044e\u0446\u0443'), fuinjutsu: summonStat(text, '\u0424\u0443\u0438\u043d\u0434\u0437\u044e\u0446\u0443'), health: summonStat(text, '\u0417\u0434\u043e\u0440\u043e\u0432\u044c\u0435')
    };
    var hp = text.match(/\u0411\u043e\u0435\u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u044c\s*\(HP\)\s*:?\s*(\d+)/i), pool = text.match(/\u0417\u0430\u043f\u0430\u0441 \u0447\u0430\u043a\u0440\u044b[^:]*:\s*(\d+)\s*\/\s*(\d+)/i);
    var techniques = [];
    Array.prototype.forEach.call(region ? region.querySelectorAll('a[href*="#p"]') : [], function (link) {
      var href = absoluteUrl(link.getAttribute('href'), BASE_URL), post = href.match(/#p(\d+)/i), name = clean(link.textContent);
      if (!post || !name || Number(post[1]) === Number(item.postId) || Number((href.match(/[?&]id=(\d+)/)||[])[1]) === SUMMON_TOPIC_ID) return;
      var rank = summonRankFromNode(link);
      techniques.push({ postId: post[1], name: name, url: href, rank: rank, detail: null });
    });
    return Object.assign({}, item, { rank: summonRankFromNode(region), stats: stats, hp: hp ? Number(hp[1]) : 0, general: pool ? Number(pool[1]) : 0, focused: pool ? Number(pool[2]) : 0,
      ordinaryTotal: ordinaryActionFormula(stats.taijutsu), techniqueTotal: techniqueActionFormula(stats.taijutsu, stats.ninjutsu), partOfPack: /\u0427\u0430\u0441\u0442\u044c \u0441\u0442\u0430\u0438/i.test(text), text: text, techniques: techniques });
  }

  function loadNamedSummonDetail(item) {
    if (!item) return actorResolve(null);
    if (state.summonDetails[item.postId]) return actorResolve(state.summonDetails[item.postId]);
    return loadDocument(item.url.split('#')[0]).then(function (doc) {
      var region = findPostContent(doc, item.postId);
      if (!region) throw new Error('\u041a\u0430\u0440\u0442\u043e\u0447\u043a\u0430 \u0438\u043c\u0435\u043d\u043d\u043e\u0433\u043e \u043f\u0440\u0438\u0437\u044b\u0432\u0430 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u0430.');
      state.summonDetails[item.postId] = parseNamedSummonCard(region, item);
      return state.summonDetails[item.postId];
    });
  }

  function renderSummonEditor(editor) {
    var maxRank = maxOrdinarySummonRank(statValue('chakraTotal'));
    var allowedRanks = RANKS.slice(0, RANKS.indexOf(maxRank) + 1);
    editor.innerHTML = '<h4>\u041f\u0440\u0438\u0437\u044b\u0432</h4><p class="aba-loading">\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u0438\u043c\u0435\u043d\u043d\u044b\u0445 \u043f\u0440\u0438\u0437\u044b\u0432\u043e\u0432\u2026</p>';
    loadNamedSummons(false).then(function (items) {
      if (!editor.isConnected) return;
      var categories = items.map(function (item) { return item.category; }).filter(function (value, index, all) { return all.indexOf(value) === index; });
      editor.innerHTML = '<h4>\u041f\u0440\u0438\u0437\u044b\u0432</h4><div class="aba-inline"><label>\u0412\u0438\u0434 \u043f\u0440\u0438\u0437\u044b\u0432\u0430<select data-field="summon-type"><option value="ordinary">\u041e\u0431\u044b\u0447\u043d\u044b\u0439 \u043f\u0440\u0438\u0437\u044b\u0432</option><option value="personal">\u041b\u0438\u0447\u043d\u044b\u0439 \u043f\u0440\u0438\u0437\u044b\u0432</option></select></label><label class="aba-summon-mode">\u0412\u0430\u0440\u0438\u0430\u043d\u0442 \u043e\u0431\u044b\u0447\u043d\u043e\u0433\u043e \u043f\u0440\u0438\u0437\u044b\u0432\u0430<select data-field="summon-mode"><option value="basic">\u0411\u0430\u0437\u043e\u0432\u044b\u0439 \u043f\u0440\u0438\u0437\u044b\u0432</option><option value="named">\u0418\u043c\u0435\u043d\u043d\u043e\u0439 \u043f\u0440\u0438\u0437\u044b\u0432</option></select></label></div>' +
        '<label class="aba-summon-rank">\u0420\u0430\u043d\u0433 \u0436\u0438\u0432\u043e\u0442\u043d\u043e\u0433\u043e<select data-field="summon-rank">' + allowedRanks.map(function (rank) { return '<option value="' + rank + '">' + rank + '</option>'; }).join('') + '</select><small>\u041c\u0430\u043a\u0441\u0438\u043c\u0443\u043c \u043f\u043e \u043e\u0431\u0449\u0435\u043c\u0443 \u0437\u0430\u043f\u0430\u0441\u0443 \u0447\u0430\u043a\u0440\u044b ' + statValue('chakraTotal') + ': \u0440\u0430\u043d\u0433 ' + maxRank + '</small></label>' +
        '<div class="aba-summon-basic"><label>\u0412\u0438\u0434 \u0436\u0438\u0432\u043e\u0442\u043d\u043e\u0433\u043e<input data-field="summon-species" placeholder="\u0421\u043e\u0431\u0430\u043a\u0438, \u0436\u0430\u0431\u044b, \u0437\u043c\u0435\u0438\u2026"></label><label>\u041e\u043f\u0438\u0441\u0430\u043d\u0438\u0435<textarea data-field="summon-description" rows="3" placeholder="\u041e\u043f\u0438\u0441\u0430\u043d\u0438\u0435 \u043f\u0440\u0438\u0437\u0432\u0430\u043d\u043d\u043e\u0433\u043e \u0436\u0438\u0432\u043e\u0442\u043d\u043e\u0433\u043e \u0438 \u0435\u0433\u043e \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044f"></textarea></label></div>' +
        '<div class="aba-summon-named" hidden><label>\u041a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u044f<select data-field="summon-category"><option value="">\u0412\u0441\u0435 \u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u0438</option>' + categories.map(function (category) { return '<option value="' + escapeHtml(category) + '">' + escapeHtml(category) + '</option>'; }).join('') + '</select></label><label>\u0418\u043c\u0435\u043d\u043d\u043e\u0439 \u043f\u0440\u0438\u0437\u044b\u0432<select data-field="summon-name"></select></label><div class="aba-summon-detail"></div></div>' +
        '<p>\u0418\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u0435\u0442\u0441\u044f <a href="' + escapeHtml(SUMMON_TECHNIQUE.url) + '" target="_blank" rel="noopener">\u0422\u0435\u0445\u043d\u0438\u043a\u0430 \u043f\u0440\u0438\u0437\u044b\u0432\u0430</a>.</p><div class="aba-summary aba-summon-cost"></div><button class="aba-primary" type="button" data-add="summon">\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u00b7 ' + RANK_COSTS.C + ' \u041e\u0422</button>';
      var type = editor.querySelector('[data-field="summon-type"]'), mode = editor.querySelector('[data-field="summon-mode"]'), category = editor.querySelector('[data-field="summon-category"]'), named = editor.querySelector('[data-field="summon-name"]');
      function fillNames() {
        var filtered = items.filter(function (item) { return !category.value || item.category === category.value; });
        named.innerHTML = '<option value="">\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043f\u0440\u0438\u0437\u044b\u0432</option>' + filtered.map(function (item) { return '<option value="' + item.postId + '">' + escapeHtml(item.name) + '</option>'; }).join('');
      }
      function update() {
        var personal = type.value === 'personal';
        if (personal) mode.value = 'named';
        var namedMode = personal || mode.value === 'named';
        editor.querySelector('.aba-summon-mode').hidden = personal;
        editor.querySelector('.aba-summon-rank').hidden = namedMode;
        editor.querySelector('.aba-summon-basic').hidden = namedMode;
        editor.querySelector('.aba-summon-named').hidden = !namedMode;
        updateSummonCost(editor);
      }
      function detail() {
        var item = items.find(function (entry) { return entry.postId === named.value; }), target = editor.querySelector('.aba-summon-detail');
        if (!item) { target.innerHTML = ''; updateSummonCost(editor); return; }
        target.innerHTML = '<p class="aba-loading">\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u043a\u0430\u0440\u0442\u043e\u0447\u043a\u0438\u2026</p>';
        loadNamedSummonDetail(item).then(function (entry) {
          target.innerHTML = '<div class="aba-summary"><strong>' + escapeHtml(entry.name) + ' \u00b7 \u0440\u0430\u043d\u0433 ' + entry.rank + '</strong><span>\u041a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u044f: ' + escapeHtml(entry.category) + '; \u041e\u0414 ' + entry.ordinaryTotal + '; \u041e\u0422 ' + entry.techniqueTotal + '</span>' + (entry.partOfPack ? '<label class="aba-check"><input type="checkbox" data-field="summon-pack"><span>\u0412\u044b\u0437\u0432\u0430\u0442\u044c \u0432\u0441\u044e \u0441\u0442\u0430\u044e \u043a\u0430\u043a \u043e\u0434\u0438\u043d \u043f\u0440\u0438\u0437\u044b\u0432 \u0440\u0430\u043d\u0433\u0430 B</span></label>' : '') + '</div>';
          var packToggle = target.querySelector('[data-field="summon-pack"]');
          if (packToggle) on(packToggle, 'change', function () { updateSummonCost(editor); });
          updateSummonCost(editor);
          if (entry.partOfPack) actorAll(items.filter(function (candidate) { return candidate.category === entry.category; }).map(loadNamedSummonDetail)).catch(function () {});
        }).catch(function (error) { target.innerHTML = '<p class="aba-error">' + escapeHtml(error.message) + '</p>'; });
      }
      on(type, 'change', update); on(mode, 'change', update); on(category, 'change', function () { fillNames(); detail(); }); on(named, 'change', detail);
      bindAddButtons(editor); fillNames(); update();
    }).catch(function (error) { editor.innerHTML = '<h4>\u041f\u0440\u0438\u0437\u044b\u0432</h4><p class="aba-error">\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u0438\u043c\u0435\u043d\u043d\u044b\u0435 \u043f\u0440\u0438\u0437\u044b\u0432\u044b: ' + escapeHtml(error.message) + '</p>'; });
  }

  function summonChakraCost(rank, type) {
    var effectiveRank = rank;
    if (type === 'personal' && rank !== 'S') effectiveRank = RANKS[Math.max(0, RANKS.indexOf(rank) - 1)];
    var cost = SUMMON_CHAKRA[effectiveRank] || SUMMON_CHAKRA.C;
    return { focused: cost.focused, general: cost.general, effectiveRank: effectiveRank };
  }

  function updateSummonCost(editor) {
    var type = (editor.querySelector('[data-field="summon-type"]') || {}).value || 'ordinary';
    var mode = (editor.querySelector('[data-field="summon-mode"]') || {}).value || 'basic';
    var selected = (editor.querySelector('[data-field="summon-name"]') || {}).value;
    var detail = state.summonDetails[selected];
    var pack = !!((editor.querySelector('[data-field="summon-pack"]') || {}).checked);
    var rank = detail ? (pack ? 'B' : detail.rank) : (editor.querySelector('[data-field="summon-rank"]') || {}).value || 'E';
    var cost = summonChakraCost(rank, type === 'personal' ? 'personal' : mode === 'named' ? 'personal' : 'ordinary');
    var node = editor.querySelector('.aba-summon-cost');
    if (node) node.innerHTML = '<strong>\u0420\u0430\u0441\u0445\u043e\u0434 \u0447\u0430\u043a\u0440\u044b \u00b7 \u0440\u0430\u043d\u0433 ' + rank + '</strong><span>\u041a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u0430\u044f: ' + cost.focused + '; \u043e\u0431\u0449\u0430\u044f: ' + cost.general + '</span>';
  }
  function isInnatelyActiveAbility(ability) {
    return !!ability && String(ability.postId || '') === '2173';
  }

  function activationSpend(detail, ability) {
    var cost = techniqueChakraCost(detail.chakra);
    var support = supportChakraCost(detail) || cost.support;
    var permanentFocusedDebuff = isInnatelyActiveAbility(ability) && hasPermanentFocusedChakraDebuff();
    if (permanentFocusedDebuff && support > 0) {
      return { focused: 0, general: support, label: '\u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430 \u0443\u0436\u0435 \u0430\u043a\u0442\u0438\u0432\u043d\u043e\u0439 \u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u0438' };
    }
    if (cost.activation > 0) return { focused: cost.activation, general: 0, label: '\u0430\u043a\u0442\u0438\u0432\u0430\u0446\u0438\u044f \u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u0438' };
    return { focused: cost.focused, general: cost.general, label: '\u0430\u043a\u0442\u0438\u0432\u0430\u0446\u0438\u044f \u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u0438' };
  }

  function renderAbilityActivationEditor(editor) {
    var abilities = (state.character && state.character.abilities) || [];
    editor.innerHTML = '<h4>\u0410\u043a\u0442\u0438\u0432\u0430\u0446\u0438\u044f \u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u0438</h4><p>\u041f\u043e\u043a\u0430\u0437\u044b\u0432\u0430\u044e\u0442\u0441\u044f \u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u0438 \u043b\u0438\u0447\u043d\u043e\u0433\u043e \u0434\u0435\u043b\u0430, \u0434\u043b\u044f \u043a\u043e\u0442\u043e\u0440\u044b\u0445 \u0432 \u043c\u0430\u0441\u0442\u0435\u0440-\u043f\u043e\u0441\u0442\u0435 \u0443\u043a\u0430\u0437\u0430\u043d \u0440\u0430\u0441\u0445\u043e\u0434 \u0447\u0430\u043a\u0440\u044b.</p><div class="aba-loading">\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u0435\u0439\u2026</div>';
    if (!abilities.length) {
      editor.innerHTML = '<h4>\u0410\u043a\u0442\u0438\u0432\u0430\u0446\u0438\u044f \u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u0438</h4><div class="aba-empty">\u0412 \u043b\u0438\u0447\u043d\u043e\u043c \u0434\u0435\u043b\u0435 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u044b \u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u0438.</div>';
      return;
    }
    actorAll(abilities.map(function (ability) { return loadAbilityDetail(ability).catch(function () { return null; }); })).then(function () {
      var available = abilities.filter(function (ability) {
        if (!ability.detail) return false;
        var cost = techniqueChakraCost(ability.detail.chakra);
        var support = supportChakraCost(ability.detail) || cost.support;
        return cost.focused > 0 || cost.general > 0 || cost.activation > 0 || support > 0;
      });
      editor.innerHTML = '<h4>\u0410\u043a\u0442\u0438\u0432\u0430\u0446\u0438\u044f \u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u0438</h4><p>\u041f\u043e\u043a\u0430\u0437\u044b\u0432\u0430\u044e\u0442\u0441\u044f \u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u0438 \u043b\u0438\u0447\u043d\u043e\u0433\u043e \u0434\u0435\u043b\u0430, \u0434\u043b\u044f \u043a\u043e\u0442\u043e\u0440\u044b\u0445 \u0432 \u043c\u0430\u0441\u0442\u0435\u0440-\u043f\u043e\u0441\u0442\u0435 \u0443\u043a\u0430\u0437\u0430\u043d \u0440\u0430\u0441\u0445\u043e\u0434 \u0447\u0430\u043a\u0440\u044b.</p><label>\u0421\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u044c<select data-field="ability"><option value="">\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u044c</option>' + available.map(function (ability) { return '<option value="' + ability.postId + '">' + escapeHtml(ability.name) + '</option>'; }).join('') + '</select></label><div class="aba-active-detail"></div>';
      var select = editor.querySelector('[data-field="ability"]');
      on(select, 'change', function () {
        var ability = available.find(function (item) { return item.postId === select.value; });
        var detail = editor.querySelector('.aba-active-detail');
        if (!ability) { detail.innerHTML = ''; return; }
        var spend = activationSpend(ability.detail, ability);
        detail.innerHTML = '<div class="aba-summary"><strong>' + escapeHtml(ability.name) + '</strong><span>\u0427\u0430\u043a\u0440\u0430: ' + escapeHtml(ability.detail.chakra) + '</span><span>\u0421\u0435\u0439\u0447\u0430\u0441: ' + escapeHtml(spend.label) + '; \u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u0430\u044f \u2212' + spend.focused + ', \u043e\u0431\u0449\u0430\u044f \u2212' + spend.general + '</span><button class="aba-primary" type="button">\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0430\u043a\u0442\u0438\u0432\u0430\u0446\u0438\u044e</button></div>';
        on(detail.querySelector('button'), 'click', function () {
          var abilityModifiers = enhancementModifierSummary(ability.detail);
          addAction({ label: '\u0410\u043a\u0442\u0438\u0432\u0430\u0446\u0438\u044f \u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u0438', od: 0, ot: 0, summary: ability.name + (abilityModifiers ? ' \u00b7 ' + abilityModifiers : ''), code: '[url=' + ability.url + ']' + ability.name + '[/url] \u2014 ' + spend.label + (abilityModifiers ? '; ' + abilityModifiers : ''), link: ability.url, focusedChakraSpend: spend.focused, chakraSpend: spend.general, statModifiers: abilityStatModifiers(ability.detail), damageModifiers: techniqueCategory(ability.detail).enhancement ? enhancementDamageModifiers(ability.detail) : null, modifierSourceKey: 'ability:' + ability.postId, oncePerTurnKey: 'ability:' + ability.postId });
        });
      });
      if (!available.length) editor.querySelector('.aba-active-detail').innerHTML = '<div class="aba-empty">\u0421\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u0435\u0439 \u0441 \u0440\u0430\u0441\u0445\u043e\u0434\u043e\u043c \u0447\u0430\u043a\u0440\u044b \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u043e.</div>';
    });
  }

  function activeEffectEntries() {
    var techniques = (state.character.techniques || []).filter(function (item) { return !cloneTechniqueMatches(item); }).map(function (item) { return { item: item, kind: 'technique' }; });
    var abilities = (state.character.abilities || []).map(function (item) { return { item: item, kind: 'ability' }; });
    return techniques.concat(abilities);
  }

  function activeEffectKey(entry) {
    return entry.kind + ':' + entry.item.postId;
  }

  function turnChakraCostAction(name, amount, type, imported) {
    name = clean(name);
    amount = combatRound(amount);
    type = type === 'focused' ? 'focused' : 'general';
    if (!name || !isFinite(amount) || amount <= 0) throw new Error('\u041f\u0440\u043e\u0432\u0435\u0440\u044c\u0442\u0435 \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u044d\u0444\u0444\u0435\u043a\u0442\u0430 \u0438 \u0437\u0430\u0442\u0440\u0430\u0442\u0443 \u0447\u0430\u043a\u0440\u044b \u0432 \u0445\u043e\u0434.');
    var typeLabel = type === 'focused' ? '\u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u0430\u044f' : '\u043e\u0431\u0449\u0438\u0439 \u0437\u0430\u043f\u0430\u0441';
    return {
      label: '\u0417\u0430\u0442\u0440\u0430\u0442\u0430 \u0447\u0430\u043a\u0440\u044b \u0432 \u0445\u043e\u0434',
      summary: name + ' \u00b7 ' + amount + ' \u00b7 ' + typeLabel,
      code: '[b]\u0417\u0430\u0442\u0440\u0430\u0442\u0430 \u0447\u0430\u043a\u0440\u044b \u0432 \u0445\u043e\u0434:[/b] ' + name + '; \u0437\u043d\u0430\u0447\u0435\u043d\u0438\u0435 ' + amount + '; \u0442\u0438\u043f ' + typeLabel,
      od: 0,
      ot: 0,
      chakraSpend: type === 'general' ? amount : 0,
      focusedChakraSpend: type === 'focused' ? amount : 0,
      turnChakraCost: { name: name, amount: amount, type: type },
      autoImported: !!imported
    };
  }

  function parseTurnChakraCosts(text) {
    var actions = [], expression = /\u0417\u0430\u0442\u0440\u0430\u0442\u0430 \u0447\u0430\u043a\u0440\u044b \u0432 \u0445\u043e\u0434:\s*([^;\n]+);\s*\u0437\u043d\u0430\u0447\u0435\u043d\u0438\u0435\s*([\d.,]+);\s*\u0442\u0438\u043f\s*(\u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u0430\u044f|\u043e\u0431\u0449\u0438\u0439 \u0437\u0430\u043f\u0430\u0441)/gi, match;
    while ((match = expression.exec(String(text || '')))) {
      actions.push(turnChakraCostAction(match[1], Number(match[2].replace(',', '.')), /\u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d/i.test(match[3]) ? 'focused' : 'general', true));
    }
    return actions;
  }

  function loadActiveEffectEntries() {
    var entries = activeEffectEntries();
    return actorAll(entries.map(function (entry) {
      return (entry.kind === 'ability' ? loadAbilityDetail(entry.item) : loadTechniqueDetail(entry.item)).catch(function () { return null; });
    })).then(function () {
      return entries.filter(function (entry) {
        return entry.item.detail && (supportChakraCost(entry.item.detail) > 0 || /Shurad[o\u014d]|\u0428\u0443\u0440\u0430\u0434\u043e|\u041f\u0443\u0442\u044c \u0410\u0441\u0443\u0440\u044b/i.test(entry.item.name));
      });
    });
  }

  function activeEffectAction(entry, stopping, imported) {
    var calculation = entry.kind === 'technique' ? techniqueCalculation(entry.item, 'support', entry.effectiveRank || entry.item.rank) : null;
    var support = calculation ? calculation.support : supportChakraCost(entry.item.detail);
    var category = techniqueCategory(entry.item.detail);
    var shurado = /Shurad[o\u014d]|\u0428\u0443\u0440\u0430\u0434\u043e|\u041f\u0443\u0442\u044c \u0410\u0441\u0443\u0440\u044b/i.test(entry.item.name);
    var appliesModifiers = !stopping && (entry.kind === 'ability' || category.enhancement || shurado);
    var modifierSummary = appliesModifiers ? enhancementModifierSummary(entry.item.detail) : '';
    var modifierSourceKey = appliesModifiers ? entry.kind + ':' + entry.item.postId : '';
    return {
      label: stopping ? '\u041f\u0440\u0435\u043a\u0440\u0430\u0449\u0435\u043d\u0438\u0435 \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0438' : '\u041f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430 \u0430\u043a\u0442\u0438\u0432\u043d\u043e\u0433\u043e \u044d\u0444\u0444\u0435\u043a\u0442\u0430',
      od: 0,
      ot: 0,
      summary: entry.item.name + (modifierSummary ? ' \u00b7 ' + modifierSummary : ''),
      code: '[url=' + entry.item.url + ']' + entry.item.name + '[/url] \u2014 ' + (stopping ? '\u043c\u043e\u0434\u0438\u0444\u0438\u043a\u0430\u0446\u0438\u044f \u043f\u0440\u0435\u043a\u0440\u0430\u0449\u0435\u043d\u0430' : shurado ? '\u043c\u043e\u0434\u0438\u0444\u0438\u043a\u0430\u0446\u0438\u044f \u0430\u043a\u0442\u0438\u0432\u043d\u0430; \u043f\u043e\u0441\u0442\u043e\u044f\u043d\u043d\u044b\u0439 \u0431\u0430\u0444 \u0434\u0435\u0439\u0441\u0442\u0432\u0443\u0435\u0442' : '\u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430 \u043f\u0440\u043e\u0434\u043e\u043b\u0436\u0435\u043d\u0430') + (modifierSummary ? '; ' + modifierSummary : '') + (!stopping && calculation && support ? '; \u041f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430 \u0442\u0435\u0445\u043d\u0438\u043a\u0438 #' + entry.item.postId + ': \u0440\u0430\u043d\u0433 ' + calculation.rank + '; \u0440\u0430\u0441\u0445\u043e\u0434 ' + support : ''),
      link: entry.item.url,
      chakraSpend: stopping ? 0 : support,
      effectiveRank: entry.effectiveRank || entry.item.rank,
      techniqueCalculation: calculation,
      activeEffectKey: activeEffectKey(entry),
      startActiveEffect: !stopping,
      autoImported: !!imported,
      statModifiers: appliesModifiers ? abilityStatModifiers(entry.item.detail) : null,
      damageModifiers: appliesModifiers && category.enhancement ? enhancementDamageModifiers(entry.item.detail) : null,
      modifierSourceKey: modifierSourceKey
    };
  }

  function renderActiveEffectsEditor(editor) {
    editor.innerHTML = '<h4>\u0420\u0430\u043d\u0435\u0435 \u0430\u043a\u0442\u0438\u0432\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u044b\u0435 \u0442\u0435\u0445\u043d\u0438\u043a\u0438 \u0438 \u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u0438</h4><p>\u041f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430 \u0442\u0435\u043a\u0443\u0449\u0435\u0433\u043e \u0445\u043e\u0434\u0430 \u0441\u043f\u0438\u0441\u044b\u0432\u0430\u0435\u0442\u0441\u044f \u0442\u043e\u043b\u044c\u043a\u043e \u0438\u0437 \u043e\u0431\u0449\u0435\u0433\u043e \u0437\u0430\u043f\u0430\u0441\u0430 \u0447\u0430\u043a\u0440\u044b. \u0415\u0451 \u0442\u0430\u043a\u0436\u0435 \u043c\u043e\u0436\u043d\u043e \u043f\u0440\u0435\u043a\u0440\u0430\u0442\u0438\u0442\u044c.</p><div class="aba-loading">\u041f\u043e\u0438\u0441\u043a \u044d\u0444\u0444\u0435\u043a\u0442\u043e\u0432 \u0441 \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u043e\u0439\u2026</div>';
    loadActiveEffectEntries().then(function (available) {
      editor.innerHTML = '<h4>\u0420\u0430\u043d\u0435\u0435 \u0430\u043a\u0442\u0438\u0432\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u044b\u0435 \u0442\u0435\u0445\u043d\u0438\u043a\u0438 \u0438 \u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u0438</h4><p>\u041f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430 \u0442\u0435\u043a\u0443\u0449\u0435\u0433\u043e \u0445\u043e\u0434\u0430 \u0441\u043f\u0438\u0441\u044b\u0432\u0430\u0435\u0442\u0441\u044f \u0442\u043e\u043b\u044c\u043a\u043e \u0438\u0437 \u043e\u0431\u0449\u0435\u0433\u043e \u0437\u0430\u043f\u0430\u0441\u0430 \u0447\u0430\u043a\u0440\u044b. \u0415\u0451 \u0442\u0430\u043a\u0436\u0435 \u043c\u043e\u0436\u043d\u043e \u043f\u0440\u0435\u043a\u0440\u0430\u0442\u0438\u0442\u044c.</p><div class="aba-inline"><label>\u041f\u043e\u0438\u0441\u043a<input type="search" data-field="active-effect-search" placeholder="\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u0442\u0435\u0445\u043d\u0438\u043a\u0438 \u0438\u043b\u0438 \u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u0438"></label><label>\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u0435<select data-field="active-effect-mode"><option value="continue">\u041f\u0440\u043e\u0434\u043e\u043b\u0436\u0438\u0442\u044c \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0443</option><option value="stop">\u041f\u0440\u0435\u043a\u0440\u0430\u0442\u0438\u0442\u044c \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0443</option></select></label></div><div class="aba-active-effect-list">' + (available.length ? available.map(function (entry) { return '<label class="aba-tech-option" data-active-search="' + escapeHtml(entry.item.name.toLocaleLowerCase('ru')) + '"><input type="radio" name="aba-active-effect" value="' + activeEffectKey(entry) + '"><span><strong>' + escapeHtml(entry.item.name) + '</strong><small>\u041f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430: ' + escapeHtml(entry.item.detail.support) + '</small></span></label>'; }).join('') : '<div class="aba-empty">\u0410\u043a\u0442\u0438\u0432\u043d\u044b\u0445 \u044d\u0444\u0444\u0435\u043a\u0442\u043e\u0432 \u0441 \u0443\u043a\u0430\u0437\u0430\u043d\u043d\u043e\u0439 \u0441\u0442\u043e\u0438\u043c\u043e\u0441\u0442\u044c\u044e \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0438 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u043e.</div>') + '</div><div class="aba-active-detail"></div>';
      var search = editor.querySelector('[data-field="active-effect-search"]');
      var mode = editor.querySelector('[data-field="active-effect-mode"]');
      function update() {
        var selected = editor.querySelector('input[name="aba-active-effect"]:checked');
        var entry = selected && available.find(function (candidate) { return activeEffectKey(candidate) === selected.value; });
        var detail = editor.querySelector('.aba-active-detail');
        if (!entry) { detail.innerHTML = ''; return; }
        var saved = state.actions.find(function (action) { return action.activeEffectKey === activeEffectKey(entry); });
        if (saved && saved.effectiveRank) entry.effectiveRank = saved.effectiveRank;
        var support = entry.kind === 'technique' ? techniqueCalculation(entry.item, 'support', entry.effectiveRank || entry.item.rank).support : supportChakraCost(entry.item.detail);
        var stopping = mode.value === 'stop';
        var modifiers = !stopping ? enhancementModifierSummary(entry.item.detail) : '';
        detail.innerHTML = '<div class="aba-summary"><strong>' + escapeHtml(entry.item.name) + '</strong><span>\u041f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430: ' + escapeHtml(entry.item.detail.support) + '</span>' + (modifiers ? '<span>\u041c\u043e\u0434\u0438\u0444\u0438\u043a\u0430\u0442\u043e\u0440\u044b: ' + escapeHtml(modifiers) + '</span>' : '') + '<button class="aba-primary" type="button">' + (stopping ? '\u041f\u0440\u0435\u043a\u0440\u0430\u0442\u0438\u0442\u044c \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0443' : '\u041e\u043f\u043b\u0430\u0442\u0438\u0442\u044c \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0443 \u00b7 ' + support + ' \u0447\u0430\u043a\u0440\u044b') + '</button></div>';
        on(detail.querySelector('button'), 'click', function () {
          addAction(activeEffectAction(entry, stopping, false));
        });
      }
      Array.prototype.forEach.call(editor.querySelectorAll('input[name="aba-active-effect"]'), function (input) { on(input, 'change', update); });
      on(search, 'input', function () {
        var query = clean(search.value).toLocaleLowerCase('ru');
        Array.prototype.forEach.call(editor.querySelectorAll('[data-active-search]'), function (row) { row.hidden = query && row.dataset.activeSearch.indexOf(query) === -1; });
      });
      on(mode, 'change', update);
    });
  }

  function specialTechniqueMatches(item, kind) {
    var source = clean(item.name + ' ' + (item.detail ? item.detail.effect + ' ' + item.detail.text : '')).toLocaleLowerCase('ru').replace(/\u0451/g, '\u0435');
    if (kind === 'illusion-release') return String(item.postId) === '301' || normalize(item.name) === normalize('\u0422\u0435\u0445\u043d\u0438\u043a\u0430 \u0421\u043d\u044f\u0442\u0438\u044f \u0418\u043b\u043b\u044e\u0437\u0438\u0438');
    if (kind === 'chakra-transfer') return String(item.postId) === '35667' || normalize(item.name) === normalize('\u0422\u0435\u0445\u043d\u0438\u043a\u0430 \u041f\u0435\u0440\u0435\u0434\u0430\u0447\u0438 \u0427\u0430\u043a\u0440\u044b');
    return /\u043b\u0435\u0447\u0435\u043d|\u0432\u043e\u0441\u0441\u0442\u0430\u043d\u043e\u0432|\u0440\u0435\u0433\u0435\u043d\u0435\u0440\u0430\u0446/.test(clean(item.detail && item.detail.effect).toLocaleLowerCase('ru').replace(/\u0451/g, '\u0435'));
  }

  function hasBodyFlickerTechnique() {
    return !!(state.character && (state.character.techniques || []).some(function (item) {
      return String(item.postId) === BODY_FLICKER_TECHNIQUE.postId || normalize(item.name) === normalize(BODY_FLICKER_TECHNIQUE.name);
    }));
  }

  function renderSpecialTechniqueEditor(editor, kind) {
    var headings = { 'illusion-release': '\u0421\u043d\u044f\u0442\u0438\u0435 \u0438\u043b\u043b\u044e\u0437\u0438\u0438 \u0441 \u0441\u043e\u044e\u0437\u043d\u0438\u043a\u0430', 'chakra-transfer': '\u041f\u0435\u0440\u0435\u0434\u0430\u0447\u0430 \u0447\u0430\u043a\u0440\u044b', healing: '\u041b\u0435\u0447\u0435\u043d\u0438\u0435 \u0441\u043e\u044e\u0437\u043d\u0438\u043a\u0430' };
    var techniques = state.character.techniques || [];
    editor.innerHTML = '<h4>' + headings[kind] + '</h4><p>\u041f\u043e\u0434\u0445\u043e\u0434\u044f\u0449\u0438\u0435 \u0442\u0435\u0445\u043d\u0438\u043a\u0438 \u0438\u0449\u0443\u0442\u0441\u044f \u0432 \u043b\u0438\u0447\u043d\u043e\u043c \u0434\u0435\u043b\u0435 \u0438 \u043f\u0440\u043e\u0432\u0435\u0440\u044f\u044e\u0442\u0441\u044f \u043f\u043e \u043e\u043f\u0438\u0441\u0430\u043d\u0438\u044e \u043c\u0430\u0441\u0442\u0435\u0440-\u043f\u043e\u0441\u0442\u0430.</p><div class="aba-loading">\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u043e\u043f\u0438\u0441\u0430\u043d\u0438\u0439\u2026</div>';
    actorAll(techniques.map(function (item) { return loadTechniqueDetail(item).catch(function () { return null; }); })).then(function () {
      var available = techniques.filter(function (item) { return item.detail && specialTechniqueMatches(item, kind); });
      editor.innerHTML = '<h4>' + headings[kind] + '</h4><label>' + (kind === 'chakra-transfer' ? '\u041a\u043e\u043c\u0443 \u043f\u0435\u0440\u0435\u0434\u0430\u0442\u044c \u0447\u0430\u043a\u0440\u0443' : '\u041d\u0430 \u043a\u043e\u0433\u043e \u043f\u0440\u0438\u043c\u0435\u043d\u044f\u0435\u0442\u0441\u044f \u0442\u0435\u0445\u043d\u0438\u043a\u0430') + '<input data-field="special-target" type="text" placeholder="\u0418\u043c\u044f \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0430"></label>' +
        (kind === 'chakra-transfer' ? '<label>\u041f\u0435\u0440\u0435\u0434\u0430\u0432\u0430\u0435\u043c\u044b\u0439 \u043e\u0431\u044a\u0451\u043c<input data-field="transfer-amount" type="number" min="1" value="1"></label>' : '') +
        '<div class="aba-tech-list">' + (available.length ? available.map(function (item) { return '<label class="aba-tech-option"><input type="radio" name="aba-special-tech" value="' + item.postId + '"><span><strong>' + escapeHtml(item.name) + '</strong><small>\u0420\u0430\u043d\u0433 ' + item.rank + ' \u00b7 ' + escapeHtml(item.detail.effect) + '</small></span><button type="button" data-preview="' + item.postId + '" title="\u041f\u043e\u043a\u0430\u0437\u0430\u0442\u044c \u043e\u043f\u0438\u0441\u0430\u043d\u0438\u0435">i</button></label>'; }).join('') : '<div class="aba-empty">\u041f\u043e\u0434\u0445\u043e\u0434\u044f\u0449\u0438\u0445 \u0442\u0435\u0445\u043d\u0438\u043a \u0432 \u043b\u0438\u0447\u043d\u043e\u043c \u0434\u0435\u043b\u0435 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u043e.</div>') + '</div><div class="aba-tech-detail"></div><button class="aba-primary" type="button" data-add-special="' + kind + '"' + (available.length ? '' : ' disabled') + '>\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0432\u0437\u0430\u0438\u043c\u043e\u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435</button>';
      Array.prototype.forEach.call(editor.querySelectorAll('[data-preview]'), function (button) { on(button, 'click', function (event) { event.preventDefault(); showTechniquePreview(button.dataset.preview); }); });
      Array.prototype.forEach.call(editor.querySelectorAll('input[name="aba-special-tech"]'), function (input) { on(input, 'change', function () {
        showTechniqueSummary(editor, input.value, 'support', true);
        editor.querySelector('[data-add-tech]').hidden = true;
      }); });
      var add = editor.querySelector('[data-add-special]');
      if (add) on(add, 'click', function () { addSpecialTechniqueAction(kind, editor); });
    });
  }

  function addSpecialTechniqueAction(kind, editor) {
    var selected = editor.querySelector('input[name="aba-special-tech"]:checked');
    var target = clean((editor.querySelector('[data-field="special-target"]') || {}).value);
    if (!selected || !target) return setBuilderMessage('\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0442\u0435\u0445\u043d\u0438\u043a\u0443 \u0438 \u0443\u043a\u0430\u0436\u0438\u0442\u0435 \u0446\u0435\u043b\u044c.', 'error');
    var item = state.character.techniques.find(function (technique) { return technique.postId === selected.value; });
    if (!item || !item.detail) return;
    var weakening, calculation;
    try { weakening = techniqueWeakeningData(editor, item); calculation = techniqueCalculation(item, 'support', weakening ? weakening.rank : item.rank, (editor.querySelector('[data-field="tech-distance"]') || {}).value); } catch (error) { return setBuilderMessage(error.message, 'error'); }
    var cost = calculation.ot;
    var chakra = calculation;
    var transfer = kind === 'chakra-transfer' ? Math.max(1, parseInt((editor.querySelector('[data-field="transfer-amount"]') || {}).value, 10) || 1) : 0;
    var check = kind === 'illusion-release' ? { label: '\u0417\u0430\u0449\u0438\u0442\u0430 \u043e\u0442 \u0413\u0435\u043d\u0434\u0437\u044e\u0446\u0443', value: statValue('genjutsuDefense') } : techniqueCheck(item.detail);
    var labels = { 'illusion-release': '\u0421\u043d\u044f\u0442\u0438\u0435 \u0438\u043b\u043b\u044e\u0437\u0438\u0438', 'chakra-transfer': '\u041f\u0435\u0440\u0435\u0434\u0430\u0447\u0430 \u0447\u0430\u043a\u0440\u044b', healing: '\u041b\u0435\u0447\u0435\u043d\u0438\u0435 \u0441\u043e\u044e\u0437\u043d\u0438\u043a\u0430' };
    var code = '[url=' + item.url + ']' + item.name + '[/url] \u2014 \u0446\u0435\u043b\u044c: ' + target + '; ' + check.label + ': ' + check.value;
    code += '; ' + calculation.summary;
    if (weakening) code += '; \u043e\u0441\u043b\u0430\u0431\u043b\u0435\u043d\u0438\u0435 \u0434\u043e \u0440\u0430\u043d\u0433\u0430 ' + weakening.rank + '; \u0438\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u044f: ' + weakening.description + '; \u043f\u0440\u0430\u0432\u0438\u043b\u0430: ' + techniqueWeakeningRules(item).text;
    if (calculation.support) code += '; \u041f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430 \u0442\u0435\u0445\u043d\u0438\u043a\u0438 #' + item.postId + ': \u0440\u0430\u043d\u0433 ' + calculation.rank + '; \u0440\u0430\u0441\u0445\u043e\u0434 ' + calculation.support;
    if (transfer) code += '; \u043f\u0435\u0440\u0435\u0434\u0430\u043d\u043e \u0447\u0430\u043a\u0440\u044b: ' + transfer;
    addAction({ label: labels[kind], od: 0, ot: cost, summary: item.name + ' \u2192 ' + target + ' \u00b7 ' + calculation.summary + (transfer ? ', \u0447\u0430\u043a\u0440\u0430 ' + transfer : ''), code: code, link: item.url, focusedChakraSpend: chakra.focused, chakraSpend: chakra.general + transfer, effectiveRank: calculation.rank, techniqueCalculation: calculation, techniqueUseKey: 'technique:' + item.postId, techniqueTurnLimit: techniqueTurnLimit(item.detail) });
  }

  function updateEffectFields(editor) {
    var type = (editor.querySelector('[data-field="effect-type"]') || {}).value || 'burn';
    var target = editor.querySelector('.aba-effect-fields');
    if (!target) return;
    if (type === 'burn' || type === 'bleeding') target.innerHTML = '<label>\u0423\u0440\u043e\u043d<input data-field="effect-amount" type="number" min="1" value="1"></label>';
    else if (type === 'buff') target.innerHTML = '<div class="aba-inline"><label>\u041f\u0430\u0440\u0430\u043c\u0435\u0442\u0440<select data-field="effect-stat"><option value="meleeAttack">\u0410\u0442\u0430\u043a\u0430 \u0431\u043b\u0438\u0436\u043d\u0438\u0439 \u0431\u043e\u0439</option><option value="rangedAttack">\u0410\u0442\u0430\u043a\u0430 \u043d\u0430 \u0434\u0438\u0441\u0442\u0430\u043d\u0446\u0438\u0438</option><option value="ninjutsuAttack">\u0410\u0442\u0430\u043a\u0430 \u041d\u0438\u043d\u0434\u0437\u044e\u0446\u0443</option><option value="genjutsuAttack">\u0410\u0442\u0430\u043a\u0430 \u0413\u0435\u043d\u0434\u0437\u044e\u0446\u0443</option><option value="dodge">\u0423\u043a\u043b\u043e\u043d\u0435\u043d\u0438\u0435</option><option value="defense">\u0417\u0430\u0449\u0438\u0442\u0430</option><option value="speed">\u0421\u043a\u043e\u0440\u043e\u0441\u0442\u044c</option><option value="strength">\u0421\u0438\u043b\u0430</option></select></label><label>\u041c\u043e\u0434\u0438\u0444\u0438\u043a\u0430\u0442\u043e\u0440<input data-field="effect-modifier" type="number" value="1"></label></div>';
    else target.innerHTML = '<label>\u041f\u043e\u044f\u0441\u043d\u0435\u043d\u0438\u0435<input data-field="effect-description" type="text" placeholder="\u0418\u0441\u0442\u043e\u0447\u043d\u0438\u043a, \u0434\u043b\u0438\u0442\u0435\u043b\u044c\u043d\u043e\u0441\u0442\u044c \u0438\u043b\u0438 \u043e\u0441\u043e\u0431\u0435\u043d\u043d\u043e\u0441\u0442\u0438 \u044d\u0444\u0444\u0435\u043a\u0442\u0430"></label>';
  }

  function renderTechniqueEditor(editor, mode) {
    var ranks = RANKS.filter(function (rank) { return state.character.techniques.some(function (item) { return item.rank === rank; }); });
    var rankOptions = mode === 'attack' ? '' : ranks.map(function (rank) { return '<option value="' + rank + '">' + rank + ' \u00b7 ' + RANK_COSTS[rank] + ' \u041e\u0422</option>'; }).join('');
    editor.innerHTML = '<h4>' + (mode === 'attack' ? '\u0410\u0442\u0430\u043a\u0430 \u0442\u0435\u0445\u043d\u0438\u043a\u043e\u0439' : mode === 'defense' ? '\u0417\u0430\u0449\u0438\u0442\u0430 \u0442\u0435\u0445\u043d\u0438\u043a\u043e\u0439' : '\u0418\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u0435 \u0442\u0435\u0445\u043d\u0438\u043a\u0438') + '</h4><p>' + (mode === 'attack' ? '\u041f\u043e\u043a\u0430\u0437\u044b\u0432\u0430\u044e\u0442\u0441\u044f \u0442\u0435\u0445\u043d\u0438\u043a\u0438, \u0443 \u043a\u043e\u0442\u043e\u0440\u044b\u0445 \u0442\u0438\u043f \u044d\u0444\u0444\u0435\u043a\u0442\u0430 \u0441\u043e\u0434\u0435\u0440\u0436\u0438\u0442 \u00ab\u0410\u0442\u0430\u043a\u0430\u00bb.' : mode === 'defense' ? '\u041f\u043e\u043a\u0430\u0437\u044b\u0432\u0430\u044e\u0442\u0441\u044f \u0442\u043e\u043b\u044c\u043a\u043e \u0442\u0435\u0445\u043d\u0438\u043a\u0438, \u0443 \u043a\u043e\u0442\u043e\u0440\u044b\u0445 \u0442\u0438\u043f \u044d\u0444\u0444\u0435\u043a\u0442\u0430 \u0441\u043e\u0434\u0435\u0440\u0436\u0438\u0442 \u00ab\u0417\u0430\u0449\u0438\u0442\u0430\u00bb.' : '\u041d\u0435 \u043f\u043e\u043a\u0430\u0437\u044b\u0432\u0430\u044e\u0442\u0441\u044f \u0447\u0438\u0441\u0442\u0430\u044f \u0430\u0442\u0430\u043a\u0430, \u0441\u043e\u0447\u0435\u0442\u0430\u043d\u0438\u0435 \u0442\u043e\u043b\u044c\u043a\u043e \u00ab\u0410\u0442\u0430\u043a\u0430/\u0417\u0430\u0449\u0438\u0442\u0430\u00bb \u0438 \u0422\u0435\u0445\u043d\u0438\u043a\u0430 \u043f\u0440\u0438\u0437\u044b\u0432\u0430.') + '</p><div class="aba-inline"><label>\u0420\u0430\u043d\u0433<select data-field="rank"' + (mode === 'attack' ? ' disabled' : '') + '><option value="">' + (mode === 'attack' ? '\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u044b\u0445 \u0440\u0430\u043d\u0433\u043e\u0432\u2026' : '\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0440\u0430\u043d\u0433') + '</option>' + rankOptions + '</select></label><label>\u041f\u043e\u0438\u0441\u043a<input data-field="tech-search" type="search" placeholder="\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u0442\u0435\u0445\u043d\u0438\u043a\u0438"></label></div>' + (mode === 'attack' ? modifierBlock(attackContextFields(true)) : '') + '<div class="aba-tech-list"><div class="aba-empty">' + (mode === 'attack' ? '\u041f\u0440\u043e\u0432\u0435\u0440\u044f\u0435\u043c \u0430\u0442\u0430\u043a\u0443\u044e\u0449\u0438\u0435 \u0442\u0435\u0445\u043d\u0438\u043a\u0438\u2026' : '\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0440\u0430\u043d\u0433.') + '</div></div><div class="aba-tech-detail"></div>';
    var rank = editor.querySelector('[data-field="rank"]');
    var search = editor.querySelector('[data-field="tech-search"]');
    on(rank, 'change', function () { loadTechniqueChoices(editor, mode); });
    on(search, 'input', function () { filterTechniqueChoices(editor); });
    if (mode === 'attack') {
      actorAll(state.character.techniques.map(function (item) { return loadTechniqueDetail(item).catch(function () { return null; }); })).then(function () {
        var availableRanks = techniqueRanksForMode('attack');
        rank.innerHTML = '<option value="">\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0440\u0430\u043d\u0433</option>' + availableRanks.map(function (itemRank) { return '<option value="' + itemRank + '">' + itemRank + ' \u00b7 ' + RANK_COSTS[itemRank] + ' \u041e\u0422</option>'; }).join('');
        rank.disabled = false;
        editor.querySelector('.aba-tech-list').innerHTML = availableRanks.length ? '<div class="aba-empty">\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0440\u0430\u043d\u0433.</div>' : '<div class="aba-empty">\u0412 \u043b\u0438\u0447\u043d\u043e\u043c \u0434\u0435\u043b\u0435 \u043d\u0435\u0442 \u0430\u0442\u0430\u043a\u0443\u044e\u0449\u0438\u0445 \u0442\u0435\u0445\u043d\u0438\u043a.</div>';
      });
    }
  }

  function loadTechniqueChoices(editor, mode) {
    var rank = editor.querySelector('[data-field="rank"]').value;
    var list = editor.querySelector('.aba-tech-list');
    var detail = editor.querySelector('.aba-tech-detail');
    detail.innerHTML = '';
    if (!rank) { list.innerHTML = '<div class="aba-empty">\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0440\u0430\u043d\u0433.</div>'; return; }
    var techniques = state.character.techniques.filter(function (item) { return item.rank === rank; });
    list.innerHTML = '<div class="aba-loading">\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u043e\u043f\u0438\u0441\u0430\u043d\u0438\u0439 \u0442\u0435\u0445\u043d\u0438\u043a\u2026</div>';
    actorAll(techniques.map(function (item) {
      return loadTechniqueDetail(item).then(function (detail) { item.loadError = ''; return detail; }).catch(function (error) { item.loadError = error.message; return null; });
    })).then(function () {
      var available = techniques.filter(function (item) { return item.detail && techniqueAllowed(item.detail, mode, item); });
      list.innerHTML = available.length ? available.map(function (item) {
        return '<label class="aba-tech-option" data-search="' + escapeHtml(item.name.toLocaleLowerCase('ru')) + '"><input type="radio" name="aba-technique" value="' + item.postId + '"><span><strong>' + escapeHtml(item.name) + '</strong><small>' + escapeHtml(item.detail.effect) + (item.detail.discount ? ' \u00b7 \u0441\u0442\u043e\u0438\u043c\u043e\u0441\u0442\u044c \u0440\u0430\u043d\u0433\u0430 \u22121 \u041e\u0422' : '') + '</small></span><button type="button" data-preview="' + item.postId + '" title="\u041f\u043e\u043a\u0430\u0437\u0430\u0442\u044c \u043e\u043f\u0438\u0441\u0430\u043d\u0438\u0435">i</button></label>';
      }).join('') : '<div class="aba-empty">\u041f\u043e\u0434\u0445\u043e\u0434\u044f\u0449\u0438\u0445 \u0442\u0435\u0445\u043d\u0438\u043a \u044d\u0442\u043e\u0433\u043e \u0440\u0430\u043d\u0433\u0430 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u043e.</div>';
      var failed = techniques.filter(function (item) { return item.loadError; });
      if (failed.length) list.innerHTML += '<p class="aba-error">\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c: ' + failed.map(function (item) { return escapeHtml(item.name + ': ' + item.loadError); }).join('; ') + '. \u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0440\u0430\u043d\u0433 \u0435\u0449\u0451 \u0440\u0430\u0437 \u0434\u043b\u044f \u043f\u043e\u0432\u0442\u043e\u0440\u043d\u043e\u0439 \u0437\u0430\u0433\u0440\u0443\u0437\u043a\u0438.</p>';
      bindTechniqueChoices(editor, mode);
      filterTechniqueChoices(editor);
    });
  }

  function filterTechniqueChoices(editor) {
    var query = clean((editor.querySelector('[data-field="tech-search"]') || {}).value).toLocaleLowerCase('ru');
    Array.prototype.forEach.call(editor.querySelectorAll('.aba-tech-option'), function (option) {
      option.hidden = query && option.dataset.search.indexOf(query) === -1;
    });
  }

  function bindTechniqueChoices(editor, mode) {
    Array.prototype.forEach.call(editor.querySelectorAll('.aba-tech-option input'), function (input) {
      on(input, 'change', function () { showTechniqueSummary(editor, input.value, mode); });
    });
    Array.prototype.forEach.call(editor.querySelectorAll('[data-preview]'), function (button) {
      on(button, 'click', function (event) {
        event.preventDefault();
        showTechniquePreview(button.dataset.preview);
      });
    });
  }

  function showTechniqueSummary(editor, postId, mode, special) {
    var item = state.character.techniques.find(function (candidate) { return candidate.postId === postId; });
    if (!item || !item.detail) return;
    if (cloneTechniqueMatches(item) && !special) { renderCloneCreationOptions(editor.querySelector('.aba-tech-detail'), item); return; }
    var check = techniqueCheck(item.detail);
    var cost = techniqueCalculation(item, mode).ot;
    var sealAvailability = special ? { mental: false, twoTurn: false } : techniqueSealAvailability(item, check);
    var turnLimit = techniqueTurnLimit(item.detail);
    var sealControls = '';
    if (sealAvailability.mental) sealControls += '<label class="aba-check"><input type="checkbox" data-field="mental-seals"><span>\u0421\u043a\u043b\u0430\u0434\u044b\u0432\u0430\u0442\u044c \u043f\u0435\u0447\u0430\u0442\u0438 \u043c\u044b\u0441\u043b\u0435\u043d\u043d\u043e: \u22121 \u041e\u0422, +1 \u043a \u0410\u0442\u0430\u043a\u0435 \u041d\u0438\u043d\u0434\u0437\u044e\u0446\u0443, +1 \u043a \u0440\u0430\u0441\u0445\u043e\u0434\u0443 \u043e\u0431\u043e\u0438\u0445 \u0437\u0430\u043f\u0430\u0441\u043e\u0432 \u0447\u0430\u043a\u0440\u044b</span></label>';
    if (sealAvailability.twoTurn) sealControls += '<label class="aba-check"><input type="checkbox" data-field="two-turn-seals"><span>\u0421\u043a\u043b\u0430\u0434\u044b\u0432\u0430\u0442\u044c \u043f\u0435\u0447\u0430\u0442\u0438 \u0434\u0432\u0430 \u0445\u043e\u0434\u0430</span></label><label class="aba-two-turn-effect" hidden>\u042d\u0444\u0444\u0435\u043a\u0442 \u043f\u043e\u0434\u0433\u043e\u0442\u043e\u0432\u043a\u0438<select data-field="two-turn-effect"><option value="chakra">\u22121/4 \u0440\u0430\u0441\u0445\u043e\u0434\u0430 \u0447\u0430\u043a\u0440\u044b</option><option value="damage">+1/3 \u0443\u0440\u043e\u043d\u0430</option></select></label>';
    var modifierControls = (sealControls ? '<div class="aba-seal-options">' + sealControls + '</div>' : '') + techniqueChakraBoostFields(item, mode) + techniqueWeakeningFields(item) + techniqueCalculationFields(item);
    var modifierOptions = modifierControls ? modifierBlock(modifierControls) : '';
    editor.querySelector('.aba-tech-detail').innerHTML = '<div class="aba-summary"><strong>' + escapeHtml(item.name) + '</strong><span>\u042d\u0444\u0444\u0435\u043a\u0442: ' + escapeHtml(item.detail.effect) + '</span><span>\u041f\u0440\u043e\u0432\u0435\u0440\u043a\u0430: ' + escapeHtml(check.label) + ' <b>' + check.value + '</b>' + (check.bonus ? ' (' + (check.bonus > 0 ? '+' : '') + check.bonus + ')' : '') + '</span>' + (item.detail.chakra ? '<span>\u0427\u0430\u043a\u0440\u0430: ' + escapeHtml(item.detail.chakra) + '</span>' : '') + (turnLimit ? '<span>\u041e\u0433\u0440\u0430\u043d\u0438\u0447\u0435\u043d\u0438\u0435: \u043d\u0435 \u0431\u043e\u043b\u044c\u0448\u0435 ' + turnLimit + ' \u0440\u0430\u0437 \u0437\u0430 \u0445\u043e\u0434</span>' : '') + modifierOptions + '<button class="aba-primary" type="button" data-add-tech="' + mode + '" data-post-id="' + postId + '">\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u00b7 ' + cost + ' \u041e\u0422</button></div>';
    var mentalSeals = editor.querySelector('[data-field="mental-seals"]');
    var twoTurn = editor.querySelector('[data-field="two-turn-seals"]');
    var effect = editor.querySelector('.aba-two-turn-effect');
    var chakraBoostToggle = editor.querySelector('[data-field="tech-chakra-boost"]');
    var chakraBoostFields = editor.querySelector('.aba-tech-boost-fields');
    var techniqueDistance = editor.querySelector('[data-field="tech-distance"]');
    var weakenToggle = editor.querySelector('[data-field="tech-weaken"]');
    var weakenRank = editor.querySelector('[data-field="tech-weaken-rank"]');
    var weakenFields = editor.querySelector('.aba-tech-weaken-fields');
    var addButton = editor.querySelector('[data-add-tech]');
    function updateSealOptions(changed) {
      if (changed === mentalSeals && mentalSeals && mentalSeals.checked && twoTurn) twoTurn.checked = false;
      if (changed === twoTurn && twoTurn && twoTurn.checked && mentalSeals) mentalSeals.checked = false;
      if (effect) effect.hidden = !(twoTurn && twoTurn.checked);
      var selectedCost = weakenToggle && weakenToggle.checked ? techniqueCalculation(item, mode, weakenRank.value, techniqueDistance.value).ot : cost;
      var currentCost = Math.max(1, selectedCost - (mentalSeals && mentalSeals.checked ? 1 : 0));
      addButton.textContent = '\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u00b7 ' + currentCost + ' \u041e\u0422';
    }
    if (mentalSeals) on(mentalSeals, 'change', function () { updateSealOptions(mentalSeals); });
    if (twoTurn) on(twoTurn, 'change', function () { updateSealOptions(twoTurn); });
    function updateWeakening(changed) {
      if (changed === weakenToggle && weakenToggle.checked && chakraBoostToggle) chakraBoostToggle.checked = false;
      if (changed === chakraBoostToggle && chakraBoostToggle.checked && weakenToggle) weakenToggle.checked = false;
      if (chakraBoostFields) chakraBoostFields.hidden = !chakraBoostToggle.checked;
      if (weakenFields) weakenFields.hidden = !weakenToggle.checked;
      if (weakenRank) {
        editor.querySelector('.aba-tech-weaken-values').textContent = '\u0412\u044b\u0431\u0440\u0430\u043d \u0440\u0430\u043d\u0433 ' + weakenRank.value;
      }
      try {
        var calculation = techniqueCalculation(item, mode, weakenToggle && weakenToggle.checked ? weakenRank.value : item.rank, techniqueDistance.value);
        editor.querySelector('.aba-tech-calculation').textContent = weakenToggle && weakenToggle.checked ? calculation.summary : '';
        addButton.disabled = false;
      } catch (error) { editor.querySelector('.aba-tech-calculation').textContent = error.message; addButton.disabled = true; }
      updateSealOptions();
    }
    if (techniqueDistance) on(techniqueDistance, 'change', function () { updateWeakening(techniqueDistance); });
    if (chakraBoostToggle) on(chakraBoostToggle, 'change', function () { updateWeakening(chakraBoostToggle); });
    if (weakenToggle) on(weakenToggle, 'change', function () { updateWeakening(weakenToggle); });
    if (weakenRank) on(weakenRank, 'change', function () { updateWeakening(weakenRank); });
    updateWeakening();
    on(editor.querySelector('[data-add-tech]'), 'click', function () { addTechniqueAction(item, mode, editor); });
  }

  function showTechniquePreview(postId) {
    var item = state.character.techniques.find(function (candidate) { return candidate.postId === postId; });
    if (!item) return;
    loadTechniqueDetail(item).then(function (detail) {
      state.nodes.preview.innerHTML = '<header><div><strong>' + escapeHtml(item.name) + '</strong><small>\u0420\u0430\u043d\u0433 ' + item.rank + ' \u00b7 ' + escapeHtml(detail.effect) + '</small></div><button type="button" aria-label="\u0417\u0430\u043a\u0440\u044b\u0442\u044c">\u00d7</button></header><div class="aba-preview-body">' + detail.html + '</div><a class="aba-preview-link" href="' + escapeHtml(item.url) + '" target="_blank" rel="noopener">\u041e\u0442\u043a\u0440\u044b\u0442\u044c \u0441\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435 \u2197</a>';
      state.nodes.preview.hidden = false;
      on(state.nodes.preview.querySelector('button'), 'click', function () { state.nodes.preview.hidden = true; });
      Array.prototype.forEach.call(state.nodes.preview.querySelectorAll('[href]'), function (link) { link.setAttribute('target', '_blank'); link.setAttribute('rel', 'noopener'); });
      Array.prototype.forEach.call(state.nodes.preview.querySelectorAll('img'), function (image) { image.style.maxWidth = '100%'; image.style.height = 'auto'; });
    });
  }

  function addTechniqueAction(item, mode, editor) {
    var detail = item.detail;
    var weakening;
    try { weakening = techniqueWeakeningData(editor, item); } catch (error) { return setBuilderMessage(error.message, 'error'); }
    var mentalSeals = !!((editor.querySelector('[data-field="mental-seals"]') || {}).checked);
    var twoTurn = !!((editor.querySelector('[data-field="two-turn-seals"]') || {}).checked);
    var twoTurnEffect = ((editor.querySelector('[data-field="two-turn-effect"]') || {}).value) || 'chakra';
    var calculation;
    try { calculation = techniqueCalculation(item, mode, weakening ? weakening.rank : item.rank, (editor.querySelector('[data-field="tech-distance"]') || {}).value); } catch (error) { return setBuilderMessage(error.message, 'error'); }
    var cost = Math.max(1, calculation.ot - (mentalSeals ? 1 : 0));
    var check = techniqueCheck(detail);
    var conditions = mode === 'attack' && !twoTurn ? attackConditionData(editor) : { accuracy: 0, targetDodgePenalty: 0, text: '' };
    var checkValue = check.value + conditions.accuracy + (mentalSeals && check.label === '\u0410\u0442\u0430\u043a\u0430 \u041d\u0438\u043d\u0434\u0437\u044e\u0446\u0443' ? 1 : 0);
    var labels = { attack: '\u0410\u0442\u0430\u043a\u0430 \u0442\u0435\u0445\u043d\u0438\u043a\u043e\u0439', defense: '\u0417\u0430\u0449\u0438\u0442\u0430 \u0442\u0435\u0445\u043d\u0438\u043a\u043e\u0439', support: '\u0418\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u0435 \u0442\u0435\u0445\u043d\u0438\u043a\u0438' };
    var code = '[url=' + item.url + ']' + item.name + '[/url] \u2014 ' + check.label + ' ' + checkValue;
    code += '; ' + calculation.summary;
    if (weakening) code += '; \u043e\u0441\u043b\u0430\u0431\u043b\u0435\u043d\u0438\u0435 \u0434\u043e \u0440\u0430\u043d\u0433\u0430 ' + weakening.rank + '; \u0438\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u044f: ' + weakening.description + '; \u043f\u0440\u0430\u0432\u0438\u043b\u0430 \u043e\u0441\u043b\u0430\u0431\u043b\u0435\u043d\u0438\u044f: ' + techniqueWeakeningRules(item).text;

    if (calculation.support) code += '; \u041f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430 \u0442\u0435\u0445\u043d\u0438\u043a\u0438 #' + item.postId + ': \u0440\u0430\u043d\u0433 ' + calculation.rank + '; \u0440\u0430\u0441\u0445\u043e\u0434 ' + calculation.support;
    if (detail.discount) code += ', \u0441\u0442\u043e\u0438\u043c\u043e\u0441\u0442\u044c \u0441\u043d\u0438\u0436\u0435\u043d\u0430 \u043d\u0430 1 \u041e\u0422 \u043f\u043e \u043e\u043f\u0438\u0441\u0430\u043d\u0438\u044e';
    if (conditions.text) code += '; ' + conditions.text;
    if (conditions.targetDodgePenalty) code += '; \u0438\u0442\u043e\u0433\u043e\u0432\u044b\u0439 \u0448\u0442\u0440\u0430\u0444 \u043a \u0443\u043a\u043b\u043e\u043d\u0435\u043d\u0438\u044e \u0446\u0435\u043b\u0438: \u2212' + conditions.targetDodgePenalty;
    if (mentalSeals) code += '; \u043f\u0435\u0447\u0430\u0442\u0438 \u0441\u043a\u043b\u0430\u0434\u044b\u0432\u0430\u044e\u0442\u0441\u044f \u043c\u044b\u0441\u043b\u0435\u043d\u043d\u043e: \u0410\u0442\u0430\u043a\u0430 \u041d\u0438\u043d\u0434\u0437\u044e\u0446\u0443 +1, \u0441\u0442\u043e\u0438\u043c\u043e\u0441\u0442\u044c \u22121 \u041e\u0422, \u0440\u0430\u0441\u0445\u043e\u0434 \u043e\u0431\u0449\u0435\u0439 \u0438 \u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u043e\u0439 \u0447\u0430\u043a\u0440\u044b +1';
    if (twoTurn) code += twoTurnEffect === 'chakra' ? '; \u0441\u043a\u043b\u0430\u0434\u044b\u0432\u0430\u043d\u0438\u0435 \u043f\u0435\u0447\u0430\u0442\u0435\u0439 \u0434\u0432\u0430 \u0445\u043e\u0434\u0430: \u0440\u0430\u0441\u0445\u043e\u0434 \u0447\u0430\u043a\u0440\u044b \u0443\u043c\u0435\u043d\u044c\u0448\u0435\u043d \u043d\u0430 1/4' : '; \u0441\u043a\u043b\u0430\u0434\u044b\u0432\u0430\u043d\u0438\u0435 \u043f\u0435\u0447\u0430\u0442\u0435\u0439 \u0434\u0432\u0430 \u0445\u043e\u0434\u0430: \u0443\u0440\u043e\u043d \u0443\u0432\u0435\u043b\u0438\u0447\u0435\u043d \u043d\u0430 1/3';
    if (twoTurn) code += '; \u0432 \u044d\u0442\u043e\u043c \u0445\u043e\u0434\u0443 \u0442\u0435\u0445\u043d\u0438\u043a\u0430 \u043d\u0435 \u0441\u0440\u0430\u0431\u0430\u0442\u044b\u0432\u0430\u0435\u0442 \u0438 \u043f\u0440\u043e\u0434\u043e\u043b\u0436\u0430\u044e\u0442 \u0441\u043a\u043b\u0430\u0434\u044b\u0432\u0430\u0442\u044c\u0441\u044f \u043f\u0435\u0447\u0430\u0442\u0438';
    var enhancement = techniqueEnhancementPayload(item, twoTurn);
    if (enhancement.summary) code += '; \u0443\u0441\u0438\u043b\u0435\u043d\u0438\u0435: ' + enhancement.summary;
    var counterAttack = mode === 'attack' && !!combatState().counterAttack;
    var chakraCost = { focused: calculation.focused, general: calculation.general };
    if (mentalSeals) {
      chakraCost.focused += 1;
      chakraCost.general += 1;
    }
    if (twoTurn && twoTurnEffect === 'chakra') {
      chakraCost.focused = combatRound(chakraCost.focused * 0.75);
      chakraCost.general = combatRound(chakraCost.general * 0.75);
    }
    var chakraBoost = techniqueChakraBoostData(editor, item, mode);
    if (chakraBoost.chakra) {
      chakraCost.general += chakraBoost.chakra;
      code += '; \u0443\u0441\u0438\u043b\u0435\u043d\u0438\u0435 \u0447\u0430\u043a\u0440\u043e\u0439: +' + chakraBoost.bonus + (chakraBoost.target === 'defense' ? ' \u043a \u0417\u0430\u0449\u0438\u0442\u0435' : ' \u043a \u0443\u0440\u043e\u043d\u0443') + '; \u0434\u043e\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044c\u043d\u044b\u0439 \u0440\u0430\u0441\u0445\u043e\u0434 \u043e\u0431\u0449\u0435\u0433\u043e \u0437\u0430\u043f\u0430\u0441\u0430 \u0447\u0430\u043a\u0440\u044b: ' + chakraBoost.chakra;
    }
    calculation.focused = chakraCost.focused;
    calculation.general = chakraCost.general;
    calculation.ot = cost;
    if (twoTurn && twoTurnEffect === 'damage' && mode === 'attack') calculation.power = combatRound(calculation.power * 4 / 3);
    if (chakraBoost.bonus) calculation.power += chakraBoost.bonus;
    if (mode === 'attack' && techniqueRuleProfile(item, mode).fire) calculation.burn = Math.round(calculation.power * 0.1 * 100) / 100;
    if (chakraBoost.bonus || (twoTurn && twoTurnEffect === 'damage')) code += '; \u0438\u0442\u043e\u0433\u043e\u0432\u044b\u0439 \u044d\u0444\u0444\u0435\u043a\u0442: ' + calculation.powerLabel + ' ' + calculation.power + (calculation.burn ? ', \u043e\u0436\u043e\u0433 ' + calculation.burn + ' \u0432 \u0445\u043e\u0434, 3 \u0445\u043e\u0434\u0430' : '');
    var techniqueAction = { label: labels[mode], summary: item.name + ' \u00b7 ' + calculation.summary + (weakening ? ' \u2014 \u043e\u0441\u043b\u0430\u0431\u043b\u0435\u043d\u0438\u0435 \u0434\u043e ' + weakening.rank + '; ' + weakening.description : '') + (twoTurn ? ' \u2014 \u043f\u043e\u0434\u0433\u043e\u0442\u043e\u0432\u043a\u0430 \u043f\u0435\u0447\u0430\u0442\u0435\u0439' : '') + (enhancement.summary ? ' \u00b7 ' + enhancement.summary : '') + (chakraBoost.chakra ? ' \u00b7 +' + chakraBoost.bonus + (chakraBoost.target === 'defense' ? ' \u043a \u0417\u0430\u0449\u0438\u0442\u0435' : ' \u043a \u0443\u0440\u043e\u043d\u0443') : ''), od: 0, ot: cost, code: code, link: item.url, attackFocus: mode === 'attack' && !twoTurn, counterAttack: counterAttack && !twoTurn, focusedChakraSpend: chakraCost.focused, chakraSpend: chakraCost.general, statModifiers: enhancement.statModifiers, expandedStatModifiers: enhancement.expandedStatModifiers, damageModifiers: enhancement.damageModifiers, modifierSourceKey: enhancement.modifierSourceKey, techniqueUseKey: 'technique:' + item.postId, techniqueTurnLimit: techniqueTurnLimit(detail), effectiveRank: calculation.rank, techniqueCalculation: calculation, hpDelta: calculation.healing && techniquePowerNumber(detail.power) !== null && !twoTurn && !calculation.temporary && (editor.querySelector('[data-field="tech-distance"]') || {}).value === 'self' ? calculation.power : 0 };
    if (mode === 'attack' && !twoTurn) attachCriticalAction(techniqueAction, 'technique', {}, detail, calculation.power, 1, conditions);
    addAction(techniqueAction);
  }

  function updateWeaponInfo(editor, mode) {
    var select = editor.querySelector('[data-field="weapon"]');
    var info = editor.querySelector('.aba-weapon-info');
    if (!select || !info) return;
    var weapon = findWeapon(select.value, mode);
    if (!weapon) { info.innerHTML = ''; return; }
    var update = function () {
      var variants = String(weapon.damage || '').split('/');
      info.innerHTML = '<div class="aba-summary"><strong>' + escapeHtml(weapon.name) + '</strong><span>\u0423\u0440\u043e\u043d \u043e\u0440\u0443\u0436\u0438\u044f: ' + escapeHtml(equipmentDamage(weapon.damage || '\u043d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d')) + '</span></div>' + (variants.length > 1 ? '<label>\u0412\u0430\u0440\u0438\u0430\u043d\u0442 \u0443\u0440\u043e\u043d\u0430 / \u0444\u043e\u0440\u043c\u0430 \u043e\u0440\u0443\u0436\u0438\u044f<select data-field="weapon-variant">' + variants.map(function (damage, index) { return '<option value="' + index + '">' + escapeHtml(equipmentDamage(damage)) + '</option>'; }).join('') + '</select></label>' : '');
      Array.prototype.forEach.call(editor.querySelectorAll('[data-add]'), function (button) { button.disabled = false; });
    };
    if (weapon.kind === 'artifact' && !weapon.damage) {
      info.innerHTML = '<div class="aba-loading">\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u0443\u0440\u043e\u043d\u0430 \u0430\u0440\u0442\u0435\u0444\u0430\u043a\u0442\u0430\u2026</div>';
      loadArtifactDetail(weapon.source).then(function (artifact) { weapon.damage = artifact.damage; update(); }).catch(function (error) { info.innerHTML = '<div class="aba-error">' + escapeHtml(error.message) + '</div>'; });
    } else update();
  }

  function bindAddButtons(editor) {
    Array.prototype.forEach.call(editor.querySelectorAll('[data-add]'), function (button) {
      if (button.dataset.addBound === '1') return;
      button.dataset.addBound = '1';
      on(button, 'click', function () { addEditorAction(button.dataset.add, editor, button); });
    });
  }

  function bindEditor(editor) {
    bindInventoryEditor(editor);
    var weapon = editor.querySelector('[data-field="weapon"]');
    bindSearchPicker(weapon);
    if (weapon) on(weapon, 'change', function () {
      var mode = weaponOptions('firearm').some(function (item) { return item.kind + ':' + item.id === weapon.value; }) ? 'firearm'
        : weaponOptions('shooting').some(function (item) { return item.kind + ':' + item.id === weapon.value; }) ? 'shooting'
        : weaponOptions('ranged').some(function (item) { return item.kind + ':' + item.id === weapon.value; }) ? 'ranged' : 'melee';
      updateWeaponInfo(editor, mode);
      if (mode === 'shooting') updateShootingEditor(editor);
    });
    var shootingCount = editor.querySelector('[data-field="shooting-count"]');
    if (shootingCount) { on(shootingCount, 'input', function () { updateShootingEditor(editor); }); updateShootingEditor(editor); }
    var hand = editor.querySelector('[data-field="hand"]');
    var count = editor.querySelector('[data-field="count"]');
    if (hand && count) {
      function enforceThrowingMaximum() {
        var oneHand = statValue('taijutsu') >= 10 ? 4 : 3;
        count.max = hand.value === 'both' ? oneHand * 2 : oneHand;
        if (Number(count.value) > Number(count.max)) count.value = count.max;
        if (Number(count.value) < 1) count.value = 1;
      }
      on(hand, 'change', enforceThrowingMaximum);
      on(count, 'input', enforceThrowingMaximum);
    }
    var enhance = editor.querySelector('[data-field="enhance"]');
    if (enhance) on(enhance, 'change', function () { editor.querySelector('.aba-enhance-fields').hidden = !enhance.checked; });
    var summonType = editor.querySelector('[data-field="summon-type"]');
    if (summonType) on(summonType, 'change', function () {
      editor.querySelector('.aba-summon-name').hidden = summonType.value !== 'personal';
      editor.querySelector('.aba-summon-description').hidden = summonType.value === 'personal';
      updateSummonCost(editor);
    });
    var summonRank = editor.querySelector('[data-field="summon-rank"]');
    if (summonRank) on(summonRank, 'change', function () { updateSummonCost(editor); });
    var effectType = editor.querySelector('[data-field="effect-type"]');
    if (effectType) on(effectType, 'change', function () { updateEffectFields(editor); });
    bindAddButtons(editor);
  }

  function updateShootingEditor(editor) {
    var weaponField = editor.querySelector('[data-field="weapon"]');
    var ammoField = editor.querySelector('[data-field="shooting-ammo"]');
    var countField = editor.querySelector('[data-field="shooting-count"]');
    var button = editor.querySelector('[data-add="ordinary-shooting"]');
    if (!weaponField || !ammoField || !countField || !button) return;
    var selectedValue = ammoField.value;
    var weapon = findWeapon(weaponField.value, 'shooting');
    var ammo = weapon ? shootingAmmoOptions(weapon) : [];
    ammoField.innerHTML = '<option value="">' + (weapon ? '\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0431\u043e\u0435\u043f\u0440\u0438\u043f\u0430\u0441' : '\u0421\u043d\u0430\u0447\u0430\u043b\u0430 \u0432\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043e\u0440\u0443\u0436\u0438\u0435') + '</option>' + ammo.map(function (item) {
      return '<option value="' + escapeHtml(item.inventoryId) + '">' + escapeHtml(item.name + ' \u2014 ' + item.damage + ' (\u0434\u043e\u0441\u0442\u0443\u043f\u043d\u043e ' + inventoryRemaining(item) + ')') + '</option>';
    }).join('');
    if (ammo.some(function (item) { return item.inventoryId === selectedValue; })) ammoField.value = selectedValue;
    var rules = weapon ? shootingWeaponRules(weapon.source) : { shotsPerOd: 1 };
    var count = Math.max(1, parseInt(countField.value, 10) || 1);
    button.textContent = '\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u00b7 ' + shootingActionCost(count, rules.shotsPerOd) + ' \u041e\u0414';
    button.disabled = !weapon || !ammo.length;
  }

  function addEditorAction(kind, editor, button) {
    var action;
    if (kind === 'turn-chakra-cost') {
      var turnChakraName = clean((editor.querySelector('[data-field="turn-chakra-name"]') || {}).value);
      var turnChakraAmount = Number(String((editor.querySelector('[data-field="turn-chakra-amount"]') || {}).value || '').replace(',', '.'));
      var turnChakraType = (editor.querySelector('[data-field="turn-chakra-type"]') || {}).value || 'general';
      if (!turnChakraName) return setBuilderMessage('\u0423\u043a\u0430\u0436\u0438\u0442\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0443\u044e\u0449\u0443\u044e \u0442\u0435\u0445\u043d\u0438\u043a\u0443 \u0438\u043b\u0438 \u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u044c.', 'error');
      if (!Number.isInteger(turnChakraAmount) || turnChakraAmount <= 0) return setBuilderMessage('\u0423\u043a\u0430\u0436\u0438\u0442\u0435 \u043f\u043e\u043b\u043e\u0436\u0438\u0442\u0435\u043b\u044c\u043d\u0443\u044e \u0437\u0430\u0442\u0440\u0430\u0442\u0443 \u0447\u0430\u043a\u0440\u044b \u0432 \u0445\u043e\u0434.', 'error');
      action = turnChakraCostAction(turnChakraName, turnChakraAmount, turnChakraType);
    } else if (kind === 'ordinary-unarmed') {
      var boost = enhancementData(editor, 'melee-attack');
      var unarmedConditions = attackConditionData(editor);
      var counterAttack = !!combatState().counterAttack;
      var inuzukaBite = hasPassiveAbility('inuzuka') && !!((editor.querySelector('[data-field="inuzuka-bite"]') || {}).checked);
      var unarmedValue = statValue('meleeAttack') + boost.check + unarmedConditions.accuracy;
      var unarmedSummary = '\u0410\u0442\u0430\u043a\u0430 ' + unarmedValue + ', \u0443\u0440\u043e\u043d ' + damageText('unarmedDamage') + (boost.damage ? ' +' + boost.damage : '');
      var unarmedCode = '\u0410\u0442\u0430\u043a\u0430 \u0431\u043b\u0438\u0436\u043d\u0438\u0439 \u0431\u043e\u0439: ' + unarmedValue + '; \u0443\u0440\u043e\u043d \u0431\u0435\u0437 \u043e\u0440\u0443\u0436\u0438\u044f: ' + damageText('unarmedDamage') + (boost.damage ? ' +' + boost.damage : '') + (unarmedConditions.text ? '; ' + unarmedConditions.text : '') + (unarmedConditions.targetDodgePenalty ? '; \u0438\u0442\u043e\u0433\u043e\u0432\u044b\u0439 \u0448\u0442\u0440\u0430\u0444 \u043a \u0443\u043a\u043b\u043e\u043d\u0435\u043d\u0438\u044e \u0446\u0435\u043b\u0438: \u2212' + unarmedConditions.targetDodgePenalty : '') + (boost.defense ? '; \u0437\u0430\u0449\u0438\u0442\u0430: ' + (statValue('defense') + boost.defense) : '') + (boost.text ? '; ' + boost.text : '') + (inuzukaBite ? '; \u0423\u043a\u0443\u0441 \u0418\u043d\u0443\u0437\u0443\u043a\u0430: \u041a\u0440\u043e\u0432\u043e\u0442\u0435\u0447\u0435\u043d\u0438\u0435 3 \u0443\u0440\u043e\u043d\u0430 \u0432 \u0445\u043e\u0434, 3 \u0445\u043e\u0434\u0430' : '');
      action = { label: inuzukaBite ? '\u0411\u043b\u0438\u0436\u043d\u0438\u0439 \u0431\u043e\u0439 \u2014 \u0423\u043a\u0443\u0441' : '\u0411\u043b\u0438\u0436\u043d\u0438\u0439 \u0440\u0443\u043a\u043e\u043f\u0430\u0448\u043d\u044b\u0439 \u0431\u043e\u0439', od: 1, ot: 0, summary: unarmedSummary, code: unarmedCode, baseSummary: unarmedSummary, baseCode: unarmedCode, ruleType: 'unarmedAttack', attackFocus: true, counterAttack: counterAttack, chakraSpend: boost.chakra, enhancementType: boost.enabled ? boost.type : '' };
    } else if (kind === 'ordinary-melee' || kind === 'defense-melee') {
      var melee = findWeapon((editor.querySelector('[data-field="weapon"]') || {}).value, 'melee');
      if (!melee) return setBuilderMessage('\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043e\u0440\u0443\u0436\u0438\u0435.', 'error');
      melee = selectedWeaponVariant(melee, editor);
      var meleeBoost = enhancementData(editor, kind === 'ordinary-melee' ? 'melee-attack' : 'melee-defense', melee);
      var meleeConditions = kind === 'ordinary-melee' ? attackConditionData(editor) : { accuracy: 0, targetDodgePenalty: 0, text: '' };
      var meleeLabel = kind === 'ordinary-melee' ? '\u0411\u043b\u0438\u0436\u043d\u0438\u0439 \u0431\u043e\u0439 \u0441 \u043e\u0440\u0443\u0436\u0438\u0435\u043c' : '\u0417\u0430\u0449\u0438\u0442\u0430 \u043e\u0440\u0443\u0436\u0438\u0435\u043c';
      var meleeLink = melee.url ? '[url=' + melee.url + ']' + melee.name + '[/url]' : melee.name;
      var meleeDamage = meleeWeaponDamage(melee);
      var meleeCounter = kind === 'ordinary-melee' && !!combatState().counterAttack;
      var meleeValue = statValue('meleeAttack') + meleeBoost.check + meleeConditions.accuracy;
      action = { label: meleeLabel, od: 1, ot: 0, summary: melee.name + ', \u043f\u0440\u043e\u0432\u0435\u0440\u043a\u0430 ' + meleeValue, code: meleeLink + '; \u0410\u0442\u0430\u043a\u0430 \u0431\u043b\u0438\u0436\u043d\u0438\u0439 \u0431\u043e\u0439: ' + meleeValue + (kind === 'ordinary-melee' ? '; \u0443\u0440\u043e\u043d \u043e\u0442 \u0430\u0442\u0430\u043a\u0438 \u043e\u0440\u0443\u0436\u0438\u0435\u043c: ' + meleeDamage + (meleeBoost.damage ? ' +' + meleeBoost.damage : '') : '') + (meleeConditions.text ? '; ' + meleeConditions.text : '') + (meleeConditions.targetDodgePenalty ? '; \u0438\u0442\u043e\u0433\u043e\u0432\u044b\u0439 \u0448\u0442\u0440\u0430\u0444 \u043a \u0443\u043a\u043b\u043e\u043d\u0435\u043d\u0438\u044e \u0446\u0435\u043b\u0438: \u2212' + meleeConditions.targetDodgePenalty : '') + (meleeBoost.defense ? '; \u0437\u0430\u0449\u0438\u0442\u0430: ' + (statValue('defense') + meleeBoost.defense) : '') + (meleeBoost.text ? '; ' + meleeBoost.text : ''), link: melee.url, attackFocus: kind === 'ordinary-melee', counterAttack: meleeCounter, chakraSpend: meleeBoost.chakra, enhancementType: meleeBoost.enabled ? meleeBoost.type : '' };
    } else if (kind === 'ordinary-firearm') {
      var firearm = findWeapon((editor.querySelector('[data-field="weapon"]') || {}).value, 'firearm');
      if (!firearm) return setBuilderMessage('\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043e\u0433\u043d\u0435\u0441\u0442\u0440\u0435\u043b\u044c\u043d\u043e\u0435 \u043e\u0440\u0443\u0436\u0438\u0435.', 'error');
      firearm = selectedWeaponVariant(firearm, editor);
      var firearmConditions = attackConditionData(editor);
      var firearmValue = statValue('taijutsu') + statValue('strategy') + firearmConditions.accuracy;
      var firearmDamage = firearmWeaponDamage(firearm);
      var firearmLink = firearm.url ? '[url=' + firearm.url + ']' + firearm.name + '[/url]' : firearm.name;
      action = { label: '\u0410\u0442\u0430\u043a\u0430 \u043e\u0433\u043d\u0435\u0441\u0442\u0440\u0435\u043b\u044c\u043d\u044b\u043c \u043e\u0440\u0443\u0436\u0438\u0435\u043c', od: 1, ot: 0, summary: firearm.name + ', \u043f\u0440\u043e\u0432\u0435\u0440\u043a\u0430 ' + firearmValue + ', \u0443\u0440\u043e\u043d ' + firearmDamage, code: firearmLink + '; \u0422\u0430\u0439\u0434\u0437\u044e\u0446\u0443 + \u0422\u0430\u043a\u0442\u0438\u043a\u0430: ' + firearmValue + '; \u0443\u0440\u043e\u043d: ' + firearmDamage + (firearmConditions.text ? '; ' + firearmConditions.text : '') + (firearmConditions.targetDodgePenalty ? '; \u0438\u0442\u043e\u0433\u043e\u0432\u044b\u0439 \u0448\u0442\u0440\u0430\u0444 \u043a \u0443\u043a\u043b\u043e\u043d\u0435\u043d\u0438\u044e \u0446\u0435\u043b\u0438: \u2212' + firearmConditions.targetDodgePenalty : ''), link: firearm.url, attackFocus: true };
    } else if (kind === 'ordinary-shooting') {
      var shooting = findWeapon((editor.querySelector('[data-field="weapon"]') || {}).value, 'shooting');
      if (!shooting) return setBuilderMessage('\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u0442\u0440\u0435\u043b\u043a\u043e\u0432\u043e\u0435 \u043e\u0440\u0443\u0436\u0438\u0435.', 'error');
      var shootingRules = shootingWeaponRules(shooting.source);
      var shootingAmmo = shootingAmmoOptions(shooting).find(function (item) { return item.inventoryId === (editor.querySelector('[data-field="shooting-ammo"]') || {}).value; });
      if (!shootingAmmo) return setBuilderMessage('\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043f\u043e\u0434\u0445\u043e\u0434\u044f\u0449\u0438\u0439 \u0431\u043e\u0435\u043f\u0440\u0438\u043f\u0430\u0441 \u0438\u0437 \u0438\u043d\u0432\u0435\u043d\u0442\u0430\u0440\u044f.', 'error');
      var shootingCount = parseInt((editor.querySelector('[data-field="shooting-count"]') || {}).value, 10);
      var shootingCost;
      try { shootingCost = shootingActionCost(shootingCount, shootingRules.shotsPerOd); } catch (error) { return setBuilderMessage(error.message, 'error'); }
      var ammoSpend = shootingCount * shootingRules.ammoPerShot;
      if (ammoSpend > inventoryRemaining(shootingAmmo)) return setBuilderMessage('\u041d\u0435\u0434\u043e\u0441\u0442\u0430\u0442\u043e\u0447\u043d\u043e \u0431\u043e\u0435\u043f\u0440\u0438\u043f\u0430\u0441\u043e\u0432: \u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044f ' + ammoSpend + ', \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u043e ' + inventoryRemaining(shootingAmmo) + '.', 'error');
      var shootingConditions = attackConditionData(editor);
      var shootingValue = statValue('rangedAttack') + shootingConditions.accuracy;
      var shootingDamage = shootingAmmoDamage(shootingAmmo);
      var shootingLink = shooting.url ? '[url=' + shooting.url + ']' + shooting.name + '[/url]' : shooting.name;
      action = { label: '\u0421\u0442\u0440\u0435\u043b\u044c\u0431\u0430', od: shootingCost, ot: 0, summary: shooting.name + '; ' + shootingAmmo.name + ' \u00d7' + shootingCount + ', \u0430\u0442\u0430\u043a\u0430 ' + shootingValue + ', \u0443\u0440\u043e\u043d ' + shootingDamage, code: shootingLink + '; \u0431\u043e\u0435\u043f\u0440\u0438\u043f\u0430\u0441: ' + shootingAmmo.name + ' \u00d7' + shootingCount + '; \u0410\u0442\u0430\u043a\u0430 \u043d\u0430 \u0434\u0438\u0441\u0442\u0430\u043d\u0446\u0438\u0438: ' + shootingValue + '; \u0443\u0440\u043e\u043d \u043a\u0430\u0436\u0434\u043e\u0433\u043e \u0441\u043d\u0430\u0440\u044f\u0434\u0430: ' + shootingDamage + (shootingConditions.text ? '; ' + shootingConditions.text : '') + (shootingConditions.targetDodgePenalty ? '; \u0438\u0442\u043e\u0433\u043e\u0432\u044b\u0439 \u0448\u0442\u0440\u0430\u0444 \u043a \u0443\u043a\u043b\u043e\u043d\u0435\u043d\u0438\u044e \u0446\u0435\u043b\u0438: \u2212' + shootingConditions.targetDodgePenalty : ''), link: shooting.url, attackFocus: true, counterAttack: !!combatState().counterAttack, inventoryUse: [inventoryUse(shootingAmmo, ammoSpend, true, false)], criticalSource: shootingAmmo };
    } else if (kind === 'ordinary-ranged' || kind === 'defense-ranged') {
      var ranged = findWeapon((editor.querySelector('[data-field="weapon"]') || {}).value, 'ranged');
      if (!ranged) return setBuilderMessage('\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043c\u0435\u0442\u0430\u0442\u0435\u043b\u044c\u043d\u043e\u0435 \u043e\u0440\u0443\u0436\u0438\u0435.', 'error');
      ranged = selectedWeaponVariant(ranged, editor);
      var oneHandMaximum = statValue('taijutsu') >= 10 ? 4 : 3;
      var hand = editor.querySelector('[data-field="hand"]').value;
      var maxCount = hand === 'both' ? oneHandMaximum * 2 : oneHandMaximum;
      var count = Math.min(maxCount, Math.max(1, parseInt(editor.querySelector('[data-field="count"]').value, 10) || 1));
      var maximumHands = hand === 'both' && oneHandMaximum === 4 ? Math.max(0, count - 6) : (hand !== 'both' && count >= 4 ? 1 : 0);
      var penalty = maximumHands + (hand === 'off' || hand === 'both' ? 1 : 0);
      var rangedConditions = kind === 'ordinary-ranged' ? attackConditionData(editor) : { accuracy: 0, targetDodgePenalty: 0, text: '' };
      var rangedLabel = kind === 'ordinary-ranged' ? '\u0414\u0430\u043b\u044c\u043d\u0438\u0439 \u0431\u043e\u0439 \u0441 \u043e\u0440\u0443\u0436\u0438\u0435\u043c' : '\u0417\u0430\u0449\u0438\u0442\u0430 \u0434\u0430\u043b\u044c\u043d\u0435\u0433\u043e \u0431\u043e\u044f';
      var rangedBoost = enhancementData(editor, kind === 'ordinary-ranged' ? 'ranged-attack' : 'ranged-defense', ranged);
      var rangedCounter = kind === 'ordinary-ranged' && !!combatState().counterAttack;
      var rangedValue = statValue('rangedAttack') - penalty + rangedConditions.accuracy + rangedBoost.check;
      var rangedPenaltyText = [maximumHands ? '\u043f\u043e \u0447\u0435\u0442\u044b\u0440\u0435 \u0435\u0434\u0438\u043d\u0438\u0446\u044b: \u2212' + maximumHands + ' \u043a \u0442\u043e\u0447\u043d\u043e\u0441\u0442\u0438' : '', hand === 'off' || hand === 'both' ? '\u0434\u043e\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044c\u043d\u0430\u044f \u0440\u0443\u043a\u0430: \u22121 \u043a \u0442\u043e\u0447\u043d\u043e\u0441\u0442\u0438' : ''].filter(Boolean).join('; ');
      action = { label: rangedLabel, od: 1, ot: 0, summary: ranged.name + ' \u00d7' + count + ', \u0430\u0442\u0430\u043a\u0430 ' + rangedValue, code: ranged.name + ' \u00d7' + count + ' (' + (hand === 'off' ? '\u0434\u043e\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044c\u043d\u0430\u044f \u0440\u0443\u043a\u0430' : hand === 'both' ? '\u043e\u0431\u0435 \u0440\u0443\u043a\u0438' : '\u043e\u0441\u043d\u043e\u0432\u043d\u0430\u044f \u0440\u0443\u043a\u0430') + '); \u0410\u0442\u0430\u043a\u0430 \u043d\u0430 \u0434\u0438\u0441\u0442\u0430\u043d\u0446\u0438\u0438: ' + rangedValue + (rangedPenaltyText ? '; ' + rangedPenaltyText : '') + (rangedConditions.text ? '; ' + rangedConditions.text : '') + (rangedConditions.targetDodgePenalty ? '; \u0438\u0442\u043e\u0433\u043e\u0432\u044b\u0439 \u0448\u0442\u0440\u0430\u0444 \u043a \u0443\u043a\u043b\u043e\u043d\u0435\u043d\u0438\u044e \u0446\u0435\u043b\u0438: \u2212' + rangedConditions.targetDodgePenalty : '') + (kind === 'ordinary-ranged' ? '; \u0443\u0440\u043e\u043d: ' + weaponAttackDamage(ranged.damage) + (rangedBoost.damage ? ' +' + rangedBoost.damage : '') : '') + (rangedBoost.defense ? '; \u0437\u0430\u0449\u0438\u0442\u0430: ' + (statValue('defense') + rangedBoost.defense) : '') + (rangedBoost.text ? '; ' + rangedBoost.text : ''), attackFocus: kind === 'ordinary-ranged', counterAttack: rangedCounter, chakraSpend: rangedBoost.chakra, enhancementType: rangedBoost.enabled ? rangedBoost.type : '' };
    } else if (kind === 'dodge') {
      var dodgeBoost = enhancementData(editor, 'dodge');
      var kaguraDodge = hasPassiveAbility('kaguraEye') ? Number((editor.querySelector('[data-field="kagura-dodge"]') || {}).value || 0) : 0;
      var inuzukaDodge = hasPassiveAbility('inuzuka') && statValue('level') >= 11 && !!((editor.querySelector('[data-field="inuzuka-reaction"]') || {}).checked) ? combatRound(statValue('dodge') * 0.1) : 0;
      action = { label: '\u0423\u043a\u043b\u043e\u043d\u0435\u043d\u0438\u0435', od: 1, ot: 0, summary: '', code: '', baseCheck: statValue('dodge') + dodgeBoost.check + kaguraDodge + inuzukaDodge, dodgeModifier: dodgeBoost.check + kaguraDodge + inuzukaDodge, ruleSuffix: (dodgeBoost.text ? '; ' + dodgeBoost.text : '') + (kaguraDodge ? '; \u0422\u0440\u0435\u0442\u0438\u0439 \u0413\u043b\u0430\u0437 \u041a\u0430\u0433\u0443\u0440\u044b +' + kaguraDodge + ' \u043a \u0423\u043a\u043b\u043e\u043d\u0435\u043d\u0438\u044e \u043f\u0440\u043e\u0442\u0438\u0432 \u0432\u0438\u0434\u0438\u043c\u043e\u0439 \u0430\u0442\u0430\u043a\u0438 \u041d\u0438\u043d\u0434\u0437\u044e\u0446\u0443' : '') + (inuzukaDodge ? '; \u0440\u0435\u0430\u043a\u0446\u0438\u044f \u0418\u043d\u0443\u0437\u0443\u043a\u0430 +10% (+' + inuzukaDodge + ')' : ''), ruleType: 'dodge', chakraSpend: dodgeBoost.chakra, enhancementType: dodgeBoost.enabled ? dodgeBoost.type : '' };
    } else if (kind === 'defense-unarmed') {
      var unarmedDefenseBoost = enhancementData(editor, 'melee-defense');
      var inuzukaIntercept = hasPassiveAbility('inuzuka') && statValue('level') >= 11 && !!((editor.querySelector('[data-field="inuzuka-reaction"]') || {}).checked) ? combatRound(statValue('meleeAttack') * 0.1) : 0;
      action = { label: '\u0420\u0443\u043a\u043e\u043f\u0430\u0448\u043d\u0430\u044f \u0437\u0430\u0449\u0438\u0442\u0430', od: 1, ot: 0, summary: '\u0410\u0442\u0430\u043a\u0430 \u0431\u043b\u0438\u0436\u043d\u0438\u0439 \u0431\u043e\u0439 ' + (statValue('meleeAttack') + unarmedDefenseBoost.check + inuzukaIntercept), code: '\u0411\u043b\u043e\u043a \u0431\u0435\u0437 \u043e\u0440\u0443\u0436\u0438\u044f; \u0410\u0442\u0430\u043a\u0430 \u0431\u043b\u0438\u0436\u043d\u0438\u0439 \u0431\u043e\u0439: ' + (statValue('meleeAttack') + unarmedDefenseBoost.check + inuzukaIntercept) + (inuzukaIntercept ? '; \u0440\u0435\u0430\u043a\u0446\u0438\u044f \u0418\u043d\u0443\u0437\u0443\u043a\u0430 +10% (+' + inuzukaIntercept + ')' : '') + (unarmedDefenseBoost.defense ? '; \u0437\u0430\u0449\u0438\u0442\u0430: ' + (statValue('defense') + unarmedDefenseBoost.defense) : '') + (unarmedDefenseBoost.text ? '; ' + unarmedDefenseBoost.text : ''), chakraSpend: unarmedDefenseBoost.chakra, enhancementType: unarmedDefenseBoost.enabled ? unarmedDefenseBoost.type : '' };
    } else if (kind === 'defense-object') {
      var objectName = clean((editor.querySelector('[data-field="object"]') || {}).value);
      if (!objectName) return setBuilderMessage('\u0423\u043a\u0430\u0436\u0438\u0442\u0435 \u043f\u0440\u0435\u0434\u043c\u0435\u0442 \u0437\u0430\u0449\u0438\u0442\u044b.', 'error');
      var objectBoost = enhancementData(editor, 'melee-defense');
      action = { label: '\u0417\u0430\u0449\u0438\u0442\u0430 \u043f\u0440\u0435\u0434\u043c\u0435\u0442\u0430\u043c\u0438', od: 1, ot: 0, summary: objectName, code: objectName + '; \u0410\u0442\u0430\u043a\u0430 \u0431\u043b\u0438\u0436\u043d\u0438\u0439 \u0431\u043e\u0439: ' + (statValue('meleeAttack') + objectBoost.check) + '; \u043f\u043e\u0441\u0442\u043e\u044f\u043d\u043d\u0430\u044f \u0437\u0430\u0449\u0438\u0442\u0430: ' + (statValue('defense') + objectBoost.defense) + (objectBoost.text ? '; ' + objectBoost.text : ''), chakraSpend: objectBoost.chakra, enhancementType: objectBoost.enabled ? objectBoost.type : '' };
    } else if (kind === 'chakra-defense') {
      var defenseChakra = Math.min(3, Math.max(1, parseInt((editor.querySelector('[data-field="standalone-chakra"]') || {}).value, 10) || 1));
      var defenseBonus = defenseChakra * 10;
      action = { label: '\u0417\u0430\u0449\u0438\u0442\u0430 \u0447\u0430\u043a\u0440\u043e\u0439', od: 0, ot: 0, summary: '\u0417\u0430\u0449\u0438\u0442\u0430 ' + statValue('defense') + ' +' + defenseBonus + ' = ' + (statValue('defense') + defenseBonus), code: '\u0417\u0430\u0449\u0438\u0442\u0430 \u0447\u0430\u043a\u0440\u043e\u0439: \u0417\u0430\u0449\u0438\u0442\u0430 ' + statValue('defense') + ' +' + defenseBonus + ' = ' + (statValue('defense') + defenseBonus) + '; \u0440\u0430\u0441\u0445\u043e\u0434 \u043e\u0431\u0449\u0435\u0433\u043e \u0437\u0430\u043f\u0430\u0441\u0430 \u0447\u0430\u043a\u0440\u044b: ' + defenseChakra, chakraSpend: defenseChakra, enhancementType: 'defense' };
    } else if (kind === 'companion') {
      var companion = clean((editor.querySelector('[data-field="companion"]') || {}).value);
      var companionAction = clean((editor.querySelector('[data-field="description"]') || {}).value);
      var companionUrl = clean((editor.querySelector('[data-field="companion-url"]') || {}).value);
      if (!companion || !companionAction) return setBuilderMessage('\u0423\u043a\u0430\u0436\u0438\u0442\u0435 \u0441\u043f\u0443\u0442\u043d\u0438\u043a\u0430 \u0438 \u0435\u0433\u043e \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435.', 'error');
      var companionLabel = companionUrl ? '[url=' + companionUrl + ']' + companion + '[/url]' : companion;
      var companionChain = companionAction.split(/\n+/).map(clean).filter(Boolean);
      action = { label: '\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044f \u0441\u043f\u0443\u0442\u043d\u0438\u043a\u0430', od: 0, ot: 0, summary: companion + ': ' + companionChain.join(' \u2192 '), code: companionLabel + ': ' + companionChain.map(function (step, index) { return (index + 1) + ') ' + step; }).join('; ') + ' (\u0446\u0435\u043f\u043e\u0447\u043a\u0430 \u0441\u043f\u0443\u0442\u043d\u0438\u043a\u0430, \u0431\u0435\u0437 \u0440\u0430\u0441\u0445\u043e\u0434\u0430 \u041e\u0414/\u041e\u0422 \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0430)' };
    } else if (kind === 'attack-item') {
      var attackItem = clean((editor.querySelector('[data-field="description"]') || {}).value);
      if (!attackItem) return setBuilderMessage('\u0423\u043a\u0430\u0436\u0438\u0442\u0435 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u0435\u043c\u044b\u0439 \u043f\u0440\u0435\u0434\u043c\u0435\u0442.', 'error');
      var attackCount = Number((editor.querySelector('[data-inventory-count]') || {}).value);
      var attackItemMode = (editor.querySelector('[data-field="item-attack-mode"]') || {}).value || 'melee';
      var attackCost;
      try { attackCost = attackItemCost(attackCount); } catch (error) { return setBuilderMessage(error.message, 'error'); }
      var itemAttackLabel = attackItemMode === 'ranged' ? '\u0410\u0442\u0430\u043a\u0430 \u0434\u0430\u043b\u044c\u043d\u0438\u0439 \u0431\u043e\u0439' : '\u0410\u0442\u0430\u043a\u0430 \u0431\u043b\u0438\u0436\u043d\u0438\u0439 \u0431\u043e\u0439';
      var itemAttackValue = statValue(attackItemMode === 'ranged' ? 'rangedAttack' : 'meleeAttack');
      var attackInventoryItem = (state.character.inventory || []).find(function (item) { return item.inventoryId === (editor.querySelector('[data-inventory-select]') || {}).value; });
      var attackItemDamage = attackInventoryItem && attackInventoryItem.damage ? weaponAttackDamage(attackInventoryItem.damage) : '';
      action = { label: '\u0410\u0442\u0430\u043a\u0430 \u043f\u0440\u0435\u0434\u043c\u0435\u0442\u043e\u043c', od: attackCost, ot: 0, summary: attackItem + ' \u00d7' + attackCount + ', ' + itemAttackLabel + ' ' + itemAttackValue + (attackItemDamage ? ', \u0443\u0440\u043e\u043d ' + attackItemDamage : ''), code: attackItem + ' \u00d7' + attackCount + '; ' + itemAttackLabel + ': ' + itemAttackValue + (attackItemDamage ? '; \u0443\u0440\u043e\u043d: ' + attackItemDamage : ''), attackFocus: true, counterAttack: !!combatState().counterAttack };
    } else if (kind === 'fuin-break') {
      var fuinTarget = clean((editor.querySelector('[data-field="description"]') || {}).value);
      if (!fuinTarget) return setBuilderMessage('\u0423\u043a\u0430\u0436\u0438\u0442\u0435 \u043f\u0435\u0447\u0430\u0442\u044c \u0438\u043b\u0438 \u0431\u0430\u0440\u044c\u0435\u0440.', 'error');
      var fuinValue = statValue('fuinjutsu') + statValue('ninjutsu');
      action = { label: '\u0421\u043b\u043e\u043c \u0424\u0443\u0438\u043d\u0434\u0437\u044e\u0446\u0443', od: 1, ot: 0, summary: fuinTarget + ', \u043f\u0440\u043e\u0432\u0435\u0440\u043a\u0430 ' + fuinValue, code: fuinTarget + '; \u043f\u0440\u043e\u0432\u0435\u0440\u043a\u0430 \u0424\u0443\u0438\u043d\u0434\u0437\u044e\u0446\u0443 + \u041d\u0438\u043d\u0434\u0437\u044e\u0446\u0443: ' + statValue('fuinjutsu') + ' + ' + statValue('ninjutsu') + ' = ' + fuinValue, attackFocus: true, counterAttack: !!combatState().counterAttack };
    } else if (kind === 'trap' || kind === 'medicine' || kind === 'prepared-item') {
      var description = clean((editor.querySelector('[data-field="description"]') || {}).value);
      if (!description) return setBuilderMessage('\u0414\u043e\u0431\u0430\u0432\u044c\u0442\u0435 \u043a\u0440\u0430\u0442\u043a\u043e\u0435 \u043e\u043f\u0438\u0441\u0430\u043d\u0438\u0435.', 'error');
      action = { label: kind === 'trap' ? '\u041f\u043e\u0434\u0433\u043e\u0442\u043e\u0432\u043a\u0430 \u043b\u043e\u0432\u0443\u0448\u043a\u0438' : kind === 'medicine' ? '\u0418\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u0435 \u043f\u0440\u0435\u043f\u0430\u0440\u0430\u0442\u0430' : '\u0418\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u0435 \u043f\u0440\u0435\u0434\u043c\u0435\u0442\u0430', od: 1, ot: 0, summary: description, code: description };
      if (kind === 'medicine') {
        var medicineItem = (state.character.inventory || []).find(function (item) { return item.inventoryId === (editor.querySelector('[data-inventory-select]') || {}).value; });
        if (!medicineItem) return setBuilderMessage('\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043f\u0440\u0435\u043f\u0430\u0440\u0430\u0442 \u0438\u0437 \u0438\u043d\u0432\u0435\u043d\u0442\u0430\u0440\u044f.', 'error');
        var medicine = medicineEffect(medicineItem);
        action.hpDelta = medicine.hp;
        action.focusedChakraGain = medicine.focused;
        action.buffKey = medicine.stat;
        action.buffModifier = medicine.modifier;
        action.effectDuration = medicine.duration;
        var medicineNotes = [];
        if (medicine.hp) medicineNotes.push('+' + medicine.hp + ' HP, \u043d\u0435 \u0432\u044b\u0448\u0435 \u043c\u0430\u043a\u0441\u0438\u043c\u0443\u043c\u0430');
        if (medicine.focused) medicineNotes.push('+' + medicine.focused + ' \u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u043e\u0439 \u0447\u0430\u043a\u0440\u044b, \u043d\u0435 \u0432\u044b\u0448\u0435 \u0437\u0430\u043f\u0430\u0441\u0430');
        if (medicine.stat) medicineNotes.push(statLabel(medicine.stat) + ' +' + medicine.modifier + (medicine.duration ? ' \u043d\u0430 ' + medicine.duration + ' \u0445\u043e\u0434\u043e\u0432' : ''));
        if (!medicineNotes.length) medicineNotes.push('\u044d\u0444\u0444\u0435\u043a\u0442 \u043e\u043f\u0440\u0435\u0434\u0435\u043b\u044f\u0435\u0442 \u0413\u041c');
        action.summary += ' \u00b7 ' + medicineNotes.join('; ');
        action.code += '; \u044d\u0444\u0444\u0435\u043a\u0442: ' + medicineNotes.join('; ');
      }
    } else if (kind === 'critical-focus') {
      if (!combatState().criticalEnabled) return setBuilderMessage('\u0412\u043a\u043b\u044e\u0447\u0438\u0442\u0435 \u00ab\u0421\u0447\u0438\u0442\u0430\u0442\u044c \u043a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u0443\u0440\u043e\u043d\u00bb.', 'error');
      if (!enhancementAvailable('critical') || state.actions.some(function (item) { return item.criticalChakraBoost; })) return setBuilderMessage('\u0423\u0441\u0438\u043b\u0435\u043d\u0438\u0435 \u043a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u043e\u0433\u043e \u0448\u0430\u043d\u0441\u0430 \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u043e \u0442\u043e\u043b\u044c\u043a\u043e \u0440\u0430\u0437 \u0432 \u0442\u0440\u0438 \u0445\u043e\u0434\u0430.', 'error');
      var criticalChakra = Math.min(3, Math.max(1, parseInt((editor.querySelector('[data-field="critical-chakra"]') || {}).value, 10) || 1));
      action = { label: '\u0423\u0441\u0438\u043b\u0435\u043d\u0438\u0435 \u0448\u0430\u043d\u0441\u0430 \u043a\u0440\u0438\u0442\u0430', od: 0, ot: 0, summary: '+' + (criticalChakra * 10) + '% \u043a\u043e \u0432\u0441\u0435\u043c \u0430\u0442\u0430\u043a\u0430\u043c \u0445\u043e\u0434\u0430', code: '\u0414\u043e \u0431\u0440\u043e\u0441\u043a\u043e\u0432 \u0432\u043b\u043e\u0436\u0435\u043d\u043e ' + criticalChakra + ' \u0447\u0430\u043a\u0440\u044b \u0432 \u0448\u0430\u043d\u0441 \u043a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u043e\u0433\u043e \u043f\u043e\u043f\u0430\u0434\u0430\u043d\u0438\u044f: +' + (criticalChakra * 10) + '% \u043a\u043e \u0432\u0441\u0435\u043c \u0430\u0442\u0430\u043a\u0430\u043c \u0442\u0435\u043a\u0443\u0449\u0435\u0433\u043e \u0445\u043e\u0434\u0430', chakraSpend: criticalChakra, criticalChakraBoost: criticalChakra, enhancementType: 'critical' };
    } else if (kind === 'stability') {
      var stabilityChakra = Math.min(3, Math.max(1, parseInt((editor.querySelector('[data-field="standalone-chakra"]') || {}).value, 10) || 1));
      action = { label: '\u0423\u0441\u0442\u043e\u0439\u0447\u0438\u0432\u043e\u0441\u0442\u044c / \u043f\u0440\u044b\u0433\u0443\u0447\u0435\u0441\u0442\u044c', od: 0, ot: 0, summary: '\u0412\u043b\u043e\u0436\u0435\u043d\u043e \u0447\u0430\u043a\u0440\u044b: ' + stabilityChakra, code: '\u0423\u0441\u0438\u043b\u0435\u043d\u0438\u0435 \u0443\u0441\u0442\u043e\u0439\u0447\u0438\u0432\u043e\u0441\u0442\u0438 / \u043f\u0440\u044b\u0433\u0443\u0447\u0435\u0441\u0442\u0438; \u0432\u043b\u043e\u0436\u0435\u043d\u043e \u0447\u0430\u043a\u0440\u044b: ' + stabilityChakra + '; \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442 \u043e\u043f\u0440\u0435\u0434\u0435\u043b\u044f\u0435\u0442 \u0413\u041c \u043f\u043e \u0441\u0438\u0442\u0443\u0430\u0446\u0438\u0438', chakraSpend: stabilityChakra };
    } else if (kind === 'concentration') {
      var concentrationType = editor.querySelector('[data-field="concentration-type"]').value;
      if (concentrationType === 'rest' && remaining().spentOD > 0) return setBuilderMessage('\u041f\u043e\u043b\u043d\u0430\u044f \u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0430\u0446\u0438\u044f \u0442\u0440\u0435\u0431\u0443\u0435\u0442 \u0432\u0441\u0435 \u041e\u0414 \u0445\u043e\u0434\u0430 \u0438 \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u043d\u0430 \u043f\u043e\u0441\u043b\u0435 \u0440\u0430\u0441\u0445\u043e\u0434\u0430 \u0445\u043e\u0442\u044f \u0431\u044b \u043e\u0434\u043d\u043e\u0433\u043e \u041e\u0414.', 'error');
      var concentrationCost = concentrationType === 'rest' ? actionTotal('ordinary') : 0;
      if (concentrationType === 'rest' && concentrationCost < 1) return setBuilderMessage('\u0414\u043b\u044f \u043f\u043e\u043b\u043d\u043e\u0439 \u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0430\u0446\u0438\u0438 \u043d\u0443\u0436\u043d\u044b \u043e\u0447\u043a\u0438 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439.', 'error');
      action = { label: concentrationType === 'rest' ? '\u041f\u043e\u043b\u043d\u0430\u044f \u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0430\u0446\u0438\u044f \u0447\u0430\u043a\u0440\u044b' : '\u0411\u043e\u0435\u0432\u0430\u044f \u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0430\u0446\u0438\u044f \u0447\u0430\u043a\u0440\u044b', od: concentrationCost, ot: 0, summary: concentrationType === 'rest' ? '\u041f\u043e\u0442\u0440\u0430\u0447\u0435\u043d\u044b \u0432\u0441\u0435 \u043e\u0441\u0442\u0430\u0432\u0448\u0438\u0435\u0441\u044f \u041e\u0414' : '\u041f\u0435\u0440\u0435\u0432\u043e\u0434 \u0438\u0437 \u043e\u0431\u0449\u0435\u0433\u043e \u0437\u0430\u043f\u0430\u0441\u0430 \u0431\u0435\u0437 \u041e\u0414/\u041e\u0422', code: concentrationType === 'rest' ? '\u041a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0430\u0446\u0438\u044f \u0447\u0430\u043a\u0440\u044b \u0438\u0437 \u043e\u0442\u0434\u044b\u0445\u0430; \u043f\u043e\u0442\u0440\u0430\u0447\u0435\u043d\u044b \u0432\u0441\u0435 \u043e\u0441\u0442\u0430\u0432\u0448\u0438\u0435\u0441\u044f \u041e\u0414' : '\u0411\u043e\u0435\u0432\u0430\u044f \u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0430\u0446\u0438\u044f; \u043f\u0435\u0440\u0435\u0432\u043e\u0434 \u0447\u0430\u043a\u0440\u044b \u0438\u0437 \u043e\u0431\u0449\u0435\u0433\u043e \u0437\u0430\u043f\u0430\u0441\u0430 \u0432 \u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u044b\u0439', chakraMode: concentrationType, usesAllOd: concentrationType === 'rest' };
    } else if (kind === 'move-short' || kind === 'move-long') {
      var movement = clean((editor.querySelector('[data-field="description"]') || {}).value) || (kind === 'move-short' ? '\u041f\u0435\u0440\u0435\u0434\u0432\u0438\u0436\u0435\u043d\u0438\u0435 \u043f\u043e \u043f\u043e\u043b\u044e \u0431\u043e\u044f' : '\u0421\u0431\u043b\u0438\u0436\u0435\u043d\u0438\u0435 \u0438\u043b\u0438 \u043f\u043e\u0431\u0435\u0433 \u043d\u0430 \u0434\u0430\u043b\u044c\u043d\u0435\u0435 \u0440\u0430\u0441\u0441\u0442\u043e\u044f\u043d\u0438\u0435');
      var movementBoost = enhancementData(editor, 'movement');
      action = { label: kind === 'move-short' ? '\u041f\u0435\u0440\u0435\u0434\u0432\u0438\u0436\u0435\u043d\u0438\u0435' : '\u0421\u0431\u043b\u0438\u0436\u0435\u043d\u0438\u0435 \u0438\u043b\u0438 \u043f\u043e\u0431\u0435\u0433', od: kind === 'move-short' ? 1 : 2, ot: 0, summary: movement, code: movement + (movementBoost.text ? '; ' + movementBoost.text : ''), chakraSpend: movementBoost.chakra, enhancementType: movementBoost.enabled ? movementBoost.type : '', ruleType: 'movement' };
    } else if (kind === 'body-flicker') {
      var flickerMode = (editor.querySelector('[data-field="body-flicker-mode"]') || {}).value || 'escape';
      var flickerUse = flickerMode === 'escape' ? '\u043f\u043e\u0431\u0435\u0433' : '\u0441\u0431\u043b\u0438\u0436\u0435\u043d\u0438\u0435';
      var flickerCheck = flickerMode === 'escape' ? '; \u0423\u043a\u043b\u043e\u043d\u0435\u043d\u0438\u0435: ' + statValue('dodge') : '';
      action = {
        label: '\u0422\u0435\u0445\u043d\u0438\u043a\u0430 \u041c\u0435\u0440\u0446\u0430\u044e\u0449\u0435\u0433\u043e \u0422\u0435\u043b\u0430',
        od: 0,
        ot: RANK_COSTS.D,
        summary: flickerUse + (flickerCheck ? ', \u0423\u043a\u043b\u043e\u043d\u0435\u043d\u0438\u0435 ' + statValue('dodge') : ''),
        code: '[url=' + BODY_FLICKER_TECHNIQUE.url + '][color=#377e22]' + BODY_FLICKER_TECHNIQUE.name + '[/color][/url] \u2014 ' + flickerUse + flickerCheck,
        link: BODY_FLICKER_TECHNIQUE.url,
        focusedChakraSpend: BODY_FLICKER_TECHNIQUE.focusedChakra,
        chakraSpend: BODY_FLICKER_TECHNIQUE.generalChakra,
        ruleType: 'movement'
      };
    } else if (kind === 'summon') {
      var summon = SUMMON_TECHNIQUE;
      var summonType = editor.querySelector('[data-field="summon-type"]').value;
      var summonMode = (editor.querySelector('[data-field="summon-mode"]') || {}).value || 'basic';
      var namedId = (editor.querySelector('[data-field="summon-name"]') || {}).value;
      var namedItem = state.namedSummons.find(function (item) { return item.postId === namedId; });
      var namedDetail = namedItem && state.summonDetails[namedId];
      var useNamed = summonType === 'personal' || summonMode === 'named';
      var summonRank = useNamed && namedDetail ? namedDetail.rank : editor.querySelector('[data-field="summon-rank"]').value;
      var callPack = !!((editor.querySelector('[data-field="summon-pack"]') || {}).checked);
      if (useNamed && !namedDetail) return setBuilderMessage('\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0438\u043c\u0435\u043d\u043d\u043e\u0439 \u043f\u0440\u0438\u0437\u044b\u0432 \u0438 \u0434\u043e\u0436\u0434\u0438\u0442\u0435\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u043a\u0438 \u043a\u0430\u0440\u0442\u043e\u0447\u043a\u0438.', 'error');
      var species = clean((editor.querySelector('[data-field="summon-species"]') || {}).value);
      var summonDescription = clean((editor.querySelector('[data-field="summon-description"]') || {}).value);
      if (!useNamed && (!species || !summonDescription)) return setBuilderMessage('\u0423\u043a\u0430\u0436\u0438\u0442\u0435 \u0432\u0438\u0434 \u0436\u0438\u0432\u043e\u0442\u043d\u043e\u0433\u043e \u0438 \u043e\u043f\u0438\u0441\u0430\u043d\u0438\u0435 \u043e\u0431\u044b\u0447\u043d\u043e\u0433\u043e \u043f\u0440\u0438\u0437\u044b\u0432\u0430.', 'error');
      if (callPack && namedDetail.partOfPack) summonRank = 'B';
      var summonCost = summonChakraCost(summonRank, useNamed ? 'personal' : 'ordinary');
      var companions = [];
      if (callPack && namedDetail.partOfPack) {
        state.namedSummons.filter(function (item) { return item.category === namedDetail.category; }).forEach(function (item) {
          companions.push(state.summonDetails[item.postId] || Object.assign({}, item, { rank: 'B', ordinaryTotal: Math.ceil(actionTotal('ordinary') / 2), techniqueTotal: Math.ceil(actionTotal('technique') / 2), stats: {} }));
        });
      } else if (useNamed) companions.push(namedDetail);
      else companions.push({ postId: 'ordinary-' + Date.now(), name: species, category: '\u041e\u0431\u044b\u0447\u043d\u044b\u0439 \u043f\u0440\u0438\u0437\u044b\u0432', rank: summonRank, url: '', description: summonDescription, stats: {}, ordinaryTotal: Math.ceil(actionTotal('ordinary') / 2), techniqueTotal: Math.ceil(actionTotal('technique') / 2), basic: true });
      var label = callPack ? namedDetail.category + ' \u2014 \u0432\u0441\u044f \u0441\u0442\u0430\u044f' : useNamed ? namedDetail.name : species;
      var summonText = useNamed ? (namedDetail.url ? '[url=' + namedDetail.url + ']' + label + '[/url]' : label) : '\u0432\u0438\u0434 \u0436\u0438\u0432\u043e\u0442\u043d\u043e\u0433\u043e: ' + species + '; \u043e\u043f\u0438\u0441\u0430\u043d\u0438\u0435: ' + summonDescription;
      action = { label: '\u041f\u0440\u0438\u0437\u044b\u0432', od: 0, ot: RANK_COSTS.C, summary: label + ', \u0440\u0430\u043d\u0433 ' + summonRank, code: '[url=' + summon.url + ']' + summon.name + '[/url] \u2014 ' + summonText + '; \u0440\u0430\u043d\u0433 \u0436\u0438\u0432\u043e\u0442\u043d\u043e\u0433\u043e: ' + summonRank, focusedChakraSpend: summonCost.focused, chakraSpend: summonCost.general, summonedCompanions: companions, summonGroupId: 'summon-' + Date.now() + '-' + Math.random().toString(36).slice(2) };
    } else if (/^situation-(?:chakra-unarmed|ranged-bombs|poison-weapon|poison-smoke|substitution-item|substitution-clone|hide|clone-hide)$/.test(kind)) {
      var situationDescription = clean((editor.querySelector('[data-field="description"]') || {}).value);
      if (!situationDescription) return setBuilderMessage('\u0423\u043a\u0430\u0436\u0438\u0442\u0435 \u0446\u0435\u043f\u043e\u0447\u043a\u0443 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439.', 'error');
      var situationItems = Math.max(0, parseInt((editor.querySelector('[data-field="situation-items"]') || {}).value, 10) || 0);
      var situationWeapons = Math.max(1, parseInt((editor.querySelector('[data-field="situation-weapons"]') || {}).value, 10) || 1);
      if (kind === 'situation-ranged-bombs' && situationItems > situationWeapons) return setBuilderMessage('\u0427\u0438\u0441\u043b\u043e \u0431\u043e\u043c\u0431 \u043d\u0435 \u043c\u043e\u0436\u0435\u0442 \u043f\u0440\u0435\u0432\u044b\u0448\u0430\u0442\u044c \u0447\u0438\u0441\u043b\u043e \u0431\u0440\u043e\u0448\u0435\u043d\u043d\u044b\u0445 \u0435\u0434\u0438\u043d\u0438\u0446 \u043e\u0440\u0443\u0436\u0438\u044f.', 'error');
      var situationSteps = situationDescription.split(/\n+/).map(clean).filter(Boolean);
      var situationNames = { 'situation-chakra-unarmed':'\u0420\u0443\u043a\u043e\u043f\u0430\u0448\u043d\u0430\u044f \u0430\u0442\u0430\u043a\u0430 \u0441 \u0447\u0430\u043a\u0440\u043e\u0439','situation-ranged-bombs':'\u0414\u0430\u043b\u044c\u043d\u0438\u0439 \u0431\u043e\u0439 \u0441 \u0431\u043e\u043c\u0431\u0430\u043c\u0438','situation-poison-weapon':'\u0410\u0442\u0430\u043a\u0430 \u044f\u0434\u043e\u0432\u0438\u0442\u044b\u043c \u043e\u0440\u0443\u0436\u0438\u0435\u043c','situation-poison-smoke':'\u0410\u0442\u0430\u043a\u0430 \u044f\u0434\u043e\u0432\u0438\u0442\u044b\u043c \u0434\u044b\u043c\u043e\u043c','situation-substitution-item':'\u0417\u0430\u043c\u0435\u043d\u0430 \u043d\u0430 \u043f\u0440\u0435\u0434\u043c\u0435\u0442','situation-substitution-clone':'\u0417\u0430\u043c\u0435\u043d\u0430 \u0441 \u0441\u043e\u0437\u0434\u0430\u043d\u0438\u0435\u043c \u043a\u043b\u043e\u043d\u0430','situation-hide':'\u0423\u0432\u043e\u0440\u043e\u0442 \u0441\u043e\u043a\u0440\u044b\u0442\u0438\u0435\u043c','situation-clone-hide':'\u0421\u043e\u0437\u0434\u0430\u043d\u0438\u0435 \u0438 \u0441\u043e\u043a\u0440\u044b\u0442\u0438\u0435 \u043a\u043b\u043e\u043d\u0430' };
      var situationOd = kind === 'situation-ranged-bombs' ? 1 + situationItems : (/poison|substitution-item/.test(kind) ? 2 : 1);
      action = { label: situationNames[kind], od: situationOd, ot: 0, summary: situationSteps.join(' \u2192 '), code: situationNames[kind] + ': ' + situationSteps.map(function (step, index) { return (index + 1) + ') ' + step; }).join('; ') + '; \u0441\u0443\u043c\u043c\u0430\u0440\u043d\u043e \u041e\u0414: ' + situationOd };
    } else if (kind === 'received-healing' || kind === 'received-wound') {
      var hpAmount = Math.max(1, Number((editor.querySelector('[data-field="hp-amount"]') || {}).value) || 1);
      var hpDescription = clean((editor.querySelector('[data-field="description"]') || {}).value);
      var positive = kind === 'received-healing';
      var enemyPost = clean((editor.querySelector('[data-field="enemy-post"]') || {}).value);
      var enemyActions = clean((editor.querySelector('[data-field="enemy-actions"]') || {}).value);
      var applyProtection = !!((editor.querySelector('[data-field="apply-protection"]') || {}).checked);
      var layersText = clean((editor.querySelector('[data-field="defense-layers"]') || {}).value);
      var layers = (layersText.match(/\d+(?:[.,]\d+)?/g) || []).reduce(function (sum, value) { return sum + Number(value.replace(',', '.')); }, 0);
      var protection = positive || !applyProtection ? 0 : Math.max(0, statValue('defense') + layers);
      var incomingType = ((editor.querySelector('[data-field="incoming-attack-type"]') || {}).value) || 'technique';
      var selectedEnemyActions = positive ? [] : (editor.selectedEnemyDamageActions || []);
      var incomingOptions = {
        hidden: !!((editor.querySelector('[data-field="incoming-hidden"]') || {}).checked),
        extraFactors: !!((editor.querySelector('[data-field="incoming-extra-factors"]') || {}).checked),
        critical: !!((editor.querySelector('[data-field="incoming-critical"]') || {}).checked),
        criticalDamage: Number((editor.querySelector('[data-field="incoming-critical-damage"]') || {}).value || 0),
        applyProtection: applyProtection,
        protection: protection
      };
      var incomingResult;
      if (selectedEnemyActions.length) {
        hpAmount = selectedEnemyActions.reduce(function (sum, item) { return sum + item.damage; }, 0);
        var selectedResults = selectedEnemyActions.map(function (item) { return { item: item, result: incomingDamageCalculation(item.damage, Object.assign({}, incomingOptions, { type: item.type })) }; });
        incomingResult = {
          final: selectedResults.reduce(function (sum, entry) { return sum + entry.result.final; }, 0),
          notes: selectedResults.reduce(function (notes, entry) {
            notes.push(entry.item.label + ': ' + entry.item.damage + ' \u2192 ' + entry.result.final + ' \u0443\u0440\u043e\u043d\u0430');
            entry.result.notes.forEach(function (note) { if (notes.indexOf(note) === -1) notes.push(note); });
            return notes;
          }, [])
        };
        incomingType = selectedEnemyActions.length === 1 ? selectedEnemyActions[0].type : 'technique';
      } else incomingResult = positive ? null : incomingDamageCalculation(hpAmount, Object.assign({}, incomingOptions, { type: incomingType }));
      var finalHpAmount = positive ? hpAmount : incomingResult.final;
      var sourceText = (enemyPost ? '[url=' + enemyPost + ']\u041f\u043e\u0441\u0442 \u043f\u0440\u043e\u0442\u0438\u0432\u043d\u0438\u043a\u0430[/url]' : '') + (enemyActions ? (enemyPost ? '; ' : '') + '\u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044f: ' + enemyActions : '');
      var incomingNotes = incomingResult && incomingResult.notes.length ? '; ' + incomingResult.notes.join('; ') : '';
      var incomingTypeLabels = { technique: '\u0442\u0435\u0445\u043d\u0438\u043a\u0430 \u0438\u043b\u0438 \u0434\u0440\u0443\u0433\u043e\u0439 \u0438\u0441\u0442\u043e\u0447\u043d\u0438\u043a', unarmed: '\u0440\u0443\u043a\u043e\u043f\u0430\u0448\u043d\u0430\u044f \u0430\u0442\u0430\u043a\u0430 \u0431\u0435\u0437 \u043e\u0440\u0443\u0436\u0438\u044f', weapon: '\u043e\u0431\u044b\u0447\u043d\u0430\u044f \u0430\u0442\u0430\u043a\u0430 \u043e\u0440\u0443\u0436\u0438\u0435\u043c', ranged: '\u043e\u0431\u044b\u0447\u043d\u0430\u044f \u0434\u0430\u043b\u044c\u043d\u044f\u044f \u0430\u0442\u0430\u043a\u0430 \u043e\u0440\u0443\u0436\u0438\u0435\u043c' };
      action = { label: positive ? '\u041f\u043e\u043b\u0443\u0447\u0435\u043d\u043e \u043b\u0435\u0447\u0435\u043d\u0438\u0435' : '\u041f\u043e\u043b\u0443\u0447\u0435\u043d\u043e \u0440\u0430\u043d\u0435\u043d\u0438\u0435', od: 0, ot: 0, summary: (positive ? '+' : '\u2212') + finalHpAmount + ' HP' + (applyProtection ? ' \u00b7 \u0437\u0430\u0449\u0438\u0442\u0430 ' + protection : '') + (incomingResult && incomingResult.notes.length ? ' \u00b7 ' + incomingResult.notes.join('; ') : '') + (hpDescription ? ' \u00b7 ' + hpDescription : ''), code: (positive ? '\u041f\u043e\u043b\u0443\u0447\u0435\u043d\u043e \u043b\u0435\u0447\u0435\u043d\u0438\u0435: +' : '\u041f\u043e\u043b\u0443\u0447\u0435\u043d\u0430 \u0430\u0442\u0430\u043a\u0430 (' + incomingTypeLabels[incomingType] + '): ' + hpAmount + incomingNotes + '; ' + (applyProtection ? '\u0437\u0430\u0449\u0438\u0442\u0430 \u0441\u043b\u043e\u044f\u043c\u0438: ' + protection + '; \u0438\u0442\u043e\u0433\u043e\u0432\u043e\u0435 \u0440\u0430\u043d\u0435\u043d\u0438\u0435: \u2212' : '\u0438\u0442\u043e\u0433\u043e\u0432\u043e\u0435 \u0440\u0430\u043d\u0435\u043d\u0438\u0435: \u2212')) + finalHpAmount + ' HP' + (sourceText ? '; ' + sourceText : '') + (hpDescription ? '; ' + hpDescription : ''), hpDelta: positive ? finalHpAmount : -finalHpAmount };
    } else if (kind === 'trauma-concentration') {
      var traumaChakra = Math.min(3, Math.max(1, parseInt((editor.querySelector('[data-field="trauma-chakra"]') || {}).value, 10) || 1));
      var traumaDescription = clean((editor.querySelector('[data-field="description"]') || {}).value);
      action = { label: '\u041a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0430\u0446\u0438\u044f \u043f\u0440\u0438 \u0442\u0440\u0430\u0432\u043c\u0435', od: 0, ot: 0, summary: '+' + (traumaChakra * 20) + ' \u0432\u0440\u0435\u043c\u0435\u043d\u043d\u043e\u0439 \u0431\u043e\u0435\u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u0438' + (traumaDescription ? ' \u00b7 ' + traumaDescription : ''), code: '\u041a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0430\u0446\u0438\u044f \u0447\u0430\u043a\u0440\u044b \u043f\u0440\u0438 \u0442\u0440\u0430\u0432\u043c\u0435: \u0440\u0430\u0441\u0445\u043e\u0434 ' + traumaChakra + '; \u0432\u0440\u0435\u043c\u0435\u043d\u043d\u043e \u0432\u043e\u0441\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d\u043e ' + (traumaChakra * 20) + ' \u0431\u043e\u0435\u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u0438' + (traumaDescription ? '; \u043f\u043e\u0434\u0430\u0432\u043b\u0435\u043d \u044d\u0444\u0444\u0435\u043a\u0442: ' + traumaDescription : ''), chakraSpend: traumaChakra, temporaryHp: traumaChakra * 20 };
    } else if (kind === 'received-chakra') {
      var chakraAmount = Math.max(1, parseInt((editor.querySelector('[data-field="chakra-amount"]') || {}).value, 10) || 1);
      var chakraDescription = clean((editor.querySelector('[data-field="description"]') || {}).value);
      action = { label: '\u041f\u043e\u043b\u0443\u0447\u0435\u043d\u0430 \u0447\u0430\u043a\u0440\u0430', od: 0, ot: 0, summary: '+' + chakraAmount + ' \u043a \u043e\u0431\u0449\u0435\u043c\u0443 \u0437\u0430\u043f\u0430\u0441\u0443' + (chakraDescription ? ' \u00b7 ' + chakraDescription : ''), code: '\u041f\u043e\u043b\u0443\u0447\u0435\u043d\u0430 \u0447\u0430\u043a\u0440\u0430: +' + chakraAmount + ' \u043a \u043e\u0431\u0449\u0435\u043c\u0443 \u0437\u0430\u043f\u0430\u0441\u0443' + (chakraDescription ? '; ' + chakraDescription : ''), chakraGain: chakraAmount };
    } else if (kind === 'received-effect') {
      var effectType = (editor.querySelector('[data-field="effect-type"]') || {}).value || 'burn';
      var effectLabels = { burn: '\u041e\u0436\u043e\u0433', bleeding: '\u041a\u0440\u043e\u0432\u043e\u0442\u0435\u0447\u0435\u043d\u0438\u0435', buff: '\u0411\u0430\u0444\u0444', immobilized: '\u041e\u0431\u0435\u0437\u0434\u0432\u0438\u0436\u0438\u0432\u0430\u043d\u0438\u0435', fear: '\u0418\u0441\u043f\u0443\u0433', disorientation: '\u0414\u0435\u0437\u043e\u0440\u0438\u0435\u043d\u0442\u0430\u0446\u0438\u044f', trauma: '\u041f\u0441\u0438\u0445\u043e\u043b\u043e\u0433\u0438\u0447\u0435\u0441\u043a\u0430\u044f \u0442\u0440\u0430\u0432\u043c\u0430' };
      var effectCode = effectLabels[effectType];
      var effectDelta = 0;
      if (effectType === 'burn' || effectType === 'bleeding') {
        var effectAmount = Math.max(1, parseInt((editor.querySelector('[data-field="effect-amount"]') || {}).value, 10) || 1);
        effectCode += ': \u2212' + effectAmount + ' HP';
        effectDelta = -effectAmount;
      } else if (effectType === 'buff') {
        var effectStat = (editor.querySelector('[data-field="effect-stat"]') || {}).value || 'meleeAttack';
        var effectStatLabels = { meleeAttack: '\u0410\u0442\u0430\u043a\u0430 \u0431\u043b\u0438\u0436\u043d\u0438\u0439 \u0431\u043e\u0439', rangedAttack: '\u0410\u0442\u0430\u043a\u0430 \u043d\u0430 \u0434\u0438\u0441\u0442\u0430\u043d\u0446\u0438\u0438', ninjutsuAttack: '\u0410\u0442\u0430\u043a\u0430 \u041d\u0438\u043d\u0434\u0437\u044e\u0446\u0443', genjutsuAttack: '\u0410\u0442\u0430\u043a\u0430 \u0413\u0435\u043d\u0434\u0437\u044e\u0446\u0443', dodge: '\u0423\u043a\u043b\u043e\u043d\u0435\u043d\u0438\u0435', defense: '\u0417\u0430\u0449\u0438\u0442\u0430', speed: '\u0421\u043a\u043e\u0440\u043e\u0441\u0442\u044c', strength: '\u0421\u0438\u043b\u0430' };
        var effectModifier = parseInt((editor.querySelector('[data-field="effect-modifier"]') || {}).value, 10) || 0;
        effectCode += ': ' + effectStatLabels[effectStat] + ' ' + (effectModifier >= 0 ? '+' : '') + effectModifier;
      } else {
        var effectDescription = clean((editor.querySelector('[data-field="effect-description"]') || {}).value);
        if (effectDescription) effectCode += ': ' + effectDescription;
      }
      action = { label: '\u041f\u043e\u043b\u0443\u0447\u0435\u043d \u044d\u0444\u0444\u0435\u043a\u0442', od: 0, ot: 0, summary: effectCode, code: '\u041f\u043e\u043b\u0443\u0447\u0435\u043d \u044d\u0444\u0444\u0435\u043a\u0442: ' + effectCode, hpDelta: effectDelta, effectType: effectType, buffKey: effectType === 'buff' ? effectStat : '', buffModifier: effectType === 'buff' ? effectModifier : 0 };
    } else if (kind === 'sacrifice') {
      if (sacrificeAlreadyUsed()) return setBuilderMessage('\u0416\u0435\u0440\u0442\u0432\u0430 \u0443\u0436\u0435 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0430 \u0432 \u044d\u0442\u043e\u043c \u0431\u043e\u044e.', 'error');
      if (healthLedger().current < 20) return setBuilderMessage('\u0414\u043b\u044f \u0436\u0435\u0440\u0442\u0432\u044b \u043d\u0435\u0434\u043e\u0441\u0442\u0430\u0442\u043e\u0447\u043d\u043e HP.', 'error');
      var sacrificeStat = (editor.querySelector('[data-field="sacrifice-stat"]') || {}).value || 'ninjutsu';
      var sacrificeLabels = { ninjutsu: '\u041d\u0438\u043d\u0434\u0437\u044e\u0446\u0443', taijutsu: '\u0422\u0430\u0439\u0434\u0437\u044e\u0446\u0443', genjutsu: '\u0413\u0435\u043d\u0434\u0437\u044e\u0446\u0443', fuinjutsu: '\u0424\u0443\u0438\u043d\u0434\u0437\u044e\u0446\u0443', strategy: '\u0422\u0430\u043a\u0442\u0438\u043a\u0430', knowledge: '\u0417\u043d\u0430\u043d\u0438\u044f', strength: '\u0421\u0438\u043b\u0430', speed: '\u0421\u043a\u043e\u0440\u043e\u0441\u0442\u044c', chakra: '\u0427\u0430\u043a\u0440\u0430', health: '\u0417\u0434\u043e\u0440\u043e\u0432\u044c\u0435' };
      action = { label: '\u0416\u0435\u0440\u0442\u0432\u0430', od: 0, ot: 0, summary: '\u221220 HP; ' + sacrificeLabels[sacrificeStat] + ' +2', code: '\u0416\u0435\u0440\u0442\u0432\u0430: \u221220 HP; ' + sacrificeLabels[sacrificeStat] + ' ' + statValue(sacrificeStat) + ' +2 = ' + (statValue(sacrificeStat) + 2), hpDelta: -20, ruleType: 'sacrifice', sacrificeStat: sacrificeStat };
    }
    if (action) {
      try {
        action = attachInventoryAction(action, editor, kind);
        if (/^(?:ordinary|defense)-(?:melee|ranged)$/.test(kind)) action.artifactCheckKey = /ranged/.test(kind) ? 'rangedAttack' : 'meleeAttack';
        if (kind === 'ordinary-unarmed') action.artifactCheckKey = 'meleeAttack';
        if (kind === 'ordinary-unarmed') action.criticalSource = {};
        var weapon = typeof melee !== 'undefined' && melee || typeof ranged !== 'undefined' && ranged || typeof firearm !== 'undefined' && firearm;
        if (weapon && weapon.source && weapon.source.inventoryId) {
          action.inventoryUse = [inventoryUse(weapon.source, /ranged/.test(kind) ? count : 1, kind === 'ordinary-ranged' || kind === 'defense-ranged', false)];
          if (/^ordinary-/.test(kind)) action.criticalSource = weapon.source;
          if (kind === 'defense-melee' && weapon.source.defense) action.code += '; \u0437\u0430\u0449\u0438\u0442\u0430 \u043e\u0440\u0443\u0436\u0438\u044f: ' + weapon.source.defense;
        }
        if (/^ordinary-(?:unarmed|melee|ranged)$/.test(kind)) {
          action.turnDamageType = kind === 'ordinary-ranged' ? 'speed' : 'strength';
          if (weapon) action.damageWeapon = weapon.damage;
          action.turnDamageMultiplier = kind === 'ordinary-ranged' ? weaponStatMultiplier(weapon, '\u0441\u043a\u043e\u0440\u043e\u0441\u0442\u044c') : 10;
          action.turnDamageAmount = action.enhancementType ? action.chakraSpend * action.turnDamageMultiplier : 0;
        }
        if (kind === 'ordinary-unarmed') attachCriticalAction(action, 'unarmed', {}, null, damageText('unarmedDamage'), 1, unarmedConditions);
        if (kind === 'ordinary-melee') attachCriticalAction(action, 'weapon', melee.source || {}, null, meleeDamage, 1, meleeConditions);
        if (kind === 'ordinary-ranged') attachCriticalAction(action, 'weapon', ranged.source || {}, null, weaponAttackDamage(ranged.damage), count, rangedConditions);
        if (kind === 'ordinary-firearm') attachCriticalAction(action, 'weapon', firearm.source || {}, null, firearmDamage, 1, firearmConditions);
        if (kind === 'ordinary-shooting') attachCriticalAction(action, 'weapon', shootingAmmo || {}, null, shootingDamage, shootingCount, shootingConditions);
        action.baseCode = action.code;
        action.baseSummary = action.summary;
        addAction(action);
      } catch (error) { setBuilderMessage(error.message, 'error'); }
    }
  }

  function setBuilderMessage(message, type) {
    var node = state.nodes.builder && state.nodes.builder.querySelector('.aba-builder-message');
    if (!node) return;
    node.textContent = message;
    node.className = 'aba-builder-message ' + (type ? 'is-' + type : '');
  }

  function loadNpcCharacters(force) {
    if (state.npcLoading) return state.npcLoading;
    if (state.npcs && !force) { fillCharacters(); return actorResolve(state.npcs); }
    state.npcLoading = loadDocument(topicUrl(CONFIG.npcTopicId || 502), force).then(function (doc) {
      state.npcs = npcCatalog(doc, BASE_URL, CONFIG.npcTopicId || 502);
      var types = Array.from(new Set(state.npcs.map(function (item) { return item.type; })));
      state.nodes.npcType.innerHTML = '<option value="">\u0412\u0441\u0435 \u0442\u0438\u043f\u044b \u041d\u041f\u0421</option>' + types.map(function (type) { return '<option>' + escapeHtml(type) + '</option>'; }).join('');
      fillCharacters(); return state.npcs;
    }).catch(function (error) { setStatus('\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u041d\u041f\u0421: ' + error.message, 'error'); return []; }).then(function (items) { state.npcLoading = null; return items; });
    return state.npcLoading;
  }
  function fillCharacters() {
    var select = state.nodes.character;
    if (!select) return;
    var selected = select.value, include = state.nodes.npcEnabled && state.nodes.npcEnabled.checked;
    var search = normalizeText(state.nodes.characterSearch && state.nodes.characterSearch.value || ''), type = include && state.nodes.npcType.value;
    var items = state.characters.concat(include ? state.npcs || [] : []).filter(function (item) {
      return (!search || normalizeText(item.name).indexOf(search) !== -1) && (!type || item.npc && item.type === type);
    });
    select.innerHTML = '<option value="">\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0430</option>' + items.map(function (item) {
      return '<option value="' + item.id + '">' + escapeHtml(item.name + (item.npc ? ' \u00b7 \u041d\u041f\u0421 \u00b7 ' + item.type : '')) + '</option>';
    }).join('');
    if (items.some(function (item) { return item.id === selected; })) select.value = selected;
    var results = state.nodes.overlay.querySelector('.aba-character-results');
    results.innerHTML = items.length ? items.map(function (item) {
      return '<button type="button" data-character-id="' + escapeHtml(item.id) + '">' + escapeHtml(item.name) + (item.npc ? '<small>\u041d\u041f\u0421 \u00b7 ' + escapeHtml(item.type) + '</small>' : '') + '</button>';
    }).join('') : '<p>\u041f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0438 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u044b</p>';

  }

  function setStatus(message, type) {
    if (!state.nodes.status) return;
    state.nodes.status.textContent = message;
    state.nodes.status.className = 'aba-status ' + (type ? 'is-' + type : '');
  }

  function previousTechnicalRegion(content) {
    var clone = content.cloneNode(true);
    var spoiler = Array.prototype.find.call(clone.querySelectorAll('.quote-box,.spoiler-box,[class*="spoiler"]'), function (box) {
      var heading = box.querySelector('.quote-box-head,.spoiler-head,.spoiler-title,summary') || box.firstElementChild;
      var title = clean((box.getAttribute('data-title') || box.getAttribute('title') || '') + ' ' + (heading ? heading.textContent : ''));
      return /(?:^|\s)(?:\u0442\u0447|\u0442\u0435\u0445\u0447\u0430\u0441\u0442\u044c)(?:\s|$|[.:\u2014\u2013-])/i.test(title);
    });
    if (spoiler) return spoiler.querySelector('.quote-box-content,.spoiler-content,blockquote') || spoiler;
    var rules = clone.querySelectorAll('hr');
    if (!rules.length) return clone;
    var result = document.createElement('div');
    var node = rules[rules.length - 1].nextSibling;
    while (node) {
      result.appendChild(node.cloneNode(true));
      node = node.nextSibling;
    }
    return result;
  }

  function lastRegexMatch(text, expression) {
    var match;
    var result = null;
    expression.lastIndex = 0;
    while ((match = expression.exec(text))) result = match;
    return result;
  }

  function parsePreviousResources(region) {
    var text = postLines(region).join('\n').replace(/[\u2212\u2013\u2014]/g, '-');
    var resourceText = text.split('\n').filter(function (line) { return !/^(?:\u041a\u043b\u043e\u043d\u044b \u00d7|\u0422\u0435\u0445\u043d\u0438\u043a\u0430 \u043a\u043b\u043e\u043d\u0430 #)/.test(clean(line)); }).join('\n');
    var finalHp = lastRegexMatch(resourceText, /HP\s+\u043d\u0430\s+\u043a\u043e\u043d\u0435\u0446\s+\u0445\u043e\u0434\u0430\s*:?\s*(-?\d+(?:[.,]\d+)?)(?:\s*\/\s*(-?\d+(?:[.,]\d+)?))?/gi);
    var hp = finalHp || lastRegexMatch(resourceText, /(?:\bHP\b|\b\u0425\u041f\b|\u0437\u0434\u043e\u0440\u043e\u0432\u044c\u0435|\u0431\u043e\u0435\u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u044c)\s*(?:\u043d\u0430\s+(?:\u043d\u0430\u0447\u0430\u043b\u043e|\u043a\u043e\u043d\u0435\u0446)\s+\u0445\u043e\u0434\u0430)?\s*:?\s*(-?\d+(?:[.,]\d+)?)(?:\s*\/\s*(-?\d+(?:[.,]\d+)?))?/gi);
    var chakra = lastRegexMatch(resourceText, /\u0447\u0430\u043a\u0440\u0430(?:\s+\u043d\u0430\s+(?:\u043d\u0430\u0447\u0430\u043b\u043e|\u043a\u043e\u043d\u0435\u0446)\s+\u0445\u043e\u0434\u0430|\s+\u043f\u043e\u0441\u043b\u0435\s+\u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439)?\s*:?\s*\u043e\u0431\u0449\u0430\u044f\s*(-?\d+(?:[.,]\d+)?)[^\n;]*[;\s]+\u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d[\u0430-\u044f\u0451]*\s*(-?\d+(?:[.,]\d+)?)/gi);
    var compactChakra = chakra ? null : lastRegexMatch(resourceText, /\u0447\u0430\u043a\u0440\u0430\s*:?\s*(-?\d+(?:[.,]\d+)?)\s*\/\s*(-?\d+(?:[.,]\d+)?)/gi);
    var environmentPenalty = resourceText.match(/\u0418\u0441\u0445\u043e\u0434\u043d\u044b\u0439 \u0448\u0442\u0440\u0430\u0444 \u043e\u043a\u0440\u0443\u0436\u0435\u043d\u0438\u044f\s*:\s*-?(\d+(?:[.,]\d+)?)/i);
    var cooldowns = { speed: 3, strength: 3, defense: 3, critical: 3 };
    [
      ['speed', /\u0443\u0441\u043a\u043e\u0440\u0435\u043d\u0438[\u0435\u044f]\s+\u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d[\u0430-\u044f\u0451]*\s+(\d+)\s+\u0445\u043e\u0434/gi],
      ['strength', /(?:\u0443\u0432\u0435\u043b\u0438\u0447\u0435\u043d\u0438[\u0435\u044f]\s+\u0441\u0438\u043b\u044b|\u0443\u0441\u0438\u043b\u0435\u043d\u0438[\u0435\u044f])\s+\u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d[\u0430-\u044f\u0451]*\s+(\d+)\s+\u0445\u043e\u0434/gi],
      ['defense', /(?:\u0443\u0432\u0435\u043b\u0438\u0447\u0435\u043d\u0438[\u0435\u044f]\s+\u0437\u0430\u0449\u0438\u0442\u044b|\u0437\u0430\u0449\u0438\u0442[\u0430\u044b]\s+\u0447\u0430\u043a\u0440\u043e\u0439)\s+\u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d[\u0430-\u044f\u0451]*\s+(\d+)\s+\u0445\u043e\u0434/gi],
      ['critical', /\u0443\u0441\u0438\u043b\u0435\u043d\u0438[\u0435\u044f]\s+\u043a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a[\u0430-\u044f\u0451]*\s+\u0448\u0430\u043d[\u0430-\u044f\u0451]*\s+\u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d[\u0430-\u044f\u0451]*\s+(\d+)\s+\u0445\u043e\u0434/gi]
    ].forEach(function (item) {
      var found = lastRegexMatch(resourceText, item[1]);
      if (found) cooldowns[item[0]] = Math.min(3, (parseInt(found[1], 10) || 0) + 1);
    });
    return {
      text: text,
      hp: hp ? parseFloat(hp[1].replace(',', '.')) : null,
      maxHp: hp && hp[2] ? parseFloat(hp[2].replace(',', '.')) : null,
      general: chakra ? parseFloat(chakra[1].replace(',', '.')) : (compactChakra ? parseFloat(compactChakra[2].replace(',', '.')) : null),
      focused: chakra ? parseFloat(chakra[2].replace(',', '.')) : (compactChakra ? parseFloat(compactChakra[1].replace(',', '.')) : null),
      cooldowns: cooldowns,
      sacrificeUsed: /\u0436\u0435\u0440\u0442\u0432\u0430\s+\u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0430\s*:\s*\u0434\u0430/i.test(resourceText),
      environmentPenalty: environmentPenalty ? Number(environmentPenalty[1].replace(',', '.')) : 0,
      environmentAbilityReduction: /\u0421\u043d\u0438\u0436\u0435\u043d\u0438\u0435 \u0448\u0442\u0440\u0430\u0444\u0430 \u043e\u043a\u0440\u0443\u0436\u0435\u043d\u0438\u044f\s*:\s*\u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u044c/i.test(resourceText),
      criticalEnabled: /\u041a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u0443\u0440\u043e\u043d \u0443\u0447\u0438\u0442\u044b\u0432\u0430\u0435\u0442\u0441\u044f\s*:\s*\u0434\u0430/i.test(resourceText),
      preparedReplacement: /(?:\u043f\u043e\u0434\u0433\u043e\u0442\u043e\u0432\u043b\u0435\u043d[\u0430-\u044f\u0451]*\s+)?\u0442\u0435\u0445\u043d\u0438\u043a[\u0430-\u044f\u0451]*\s+\u0437\u0430\u043c\u0435\u043d[\u0430-\u044f\u0451]*/i.test(resourceText),
      immobilized: /(?:\u043f\u043e\u043b\u0443\u0447\u0435\u043d[\u0430-\u044f\u0451]*\s+\u044d\u0444\u0444\u0435\u043a\u0442\s*:\s*)?\u043e\u0431\u0435\u0437\u0434\u0432\u0438\u0436\u0438\u0432\u0430\u043d/i.test(resourceText)
    };
  }

  function importPreviousSupport(region) {
    if (!state.character) return actorResolve([]);
    var rootText = postLines(region).filter(function (line) { return !/^\u041a\u043b\u043e\u043d\u044b \u00d7/.test(line); }).join('\n');
    var manualCosts = parseTurnChakraCosts(rootText);
    var ids = {}, linkedNames = {};
    Array.prototype.forEach.call(region.querySelectorAll('a[href*="#p"]'), function (link) {
      var match = (link.getAttribute('href') || '').match(/#p(\d+)/i);
      if (match) { ids[match[1]] = true; linkedNames[match[1]] = clean(link.textContent); }
    });
    var entries = state.character.techniques.map(function (item) { return { item: item, kind: 'technique' }; })
      .concat(state.character.abilities.map(function (item) { return { item: item, kind: 'ability' }; }))
      .filter(function (entry) { return ids[entry.item.postId]; });
    return actorAll(entries.map(function (entry) {
      return (entry.kind === 'ability' ? loadAbilityDetail(entry.item) : loadTechniqueDetail(entry.item)).then(function (detail) {
        if (cloneTechniqueMatches(entry.item)) {
          var illusion = new RegExp('\u041f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430 \u0438\u043b\u043b\u044e\u0437\u043e\u0440\u043d\u044b\u0445 \u043a\u043b\u043e\u043d\u043e\u0432 #' + entry.item.postId + ': \u043a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e (\\d+)').exec(rootText);
          return illusion ? cloneImportAction(entry.item, { count: Number(illusion[1]), mode: 'illusion', autoImported: true }) : null;
        }
        var stopped = false;
        rootText.split('\n').forEach(function (line) {
          if (normalize(line).indexOf(normalize(linkedNames[entry.item.postId] || entry.item.name)) !== -1) {
            if (/\u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430 \u043f\u0440\u0435\u043a\u0440\u0430\u0449\u0435\u043d\u0430/i.test(line)) stopped = true;
            else if (/\u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430 \u043f\u0440\u043e\u0434\u043e\u043b\u0436\u0435\u043d\u0430|\u043f\u0440\u043e\u0434\u043e\u043b\u0436\u0435\u043d\u0438\u0435 \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0438|\u0430\u043a\u0442\u0438\u0432\u0430\u0446\u0438\u044f/i.test(line)) stopped = false;
          }
        });
        if (stopped) return null;
        var surface = Object.keys(SURFACE_TECHNIQUES).find(function (type) { return SURFACE_TECHNIQUES[type].postId === String(entry.item.postId); });
        if (surface) {
          var surfaceCalculation = techniqueCalculation(entry.item, 'support');
          var surfaceSupport = supportChakraCost(detail) || surfaceCalculation.support || surfaceCalculation.general;
          return { label: '\u0423\u0434\u0435\u0440\u0436\u0430\u043d\u0438\u0435 \u043d\u0430 \u043f\u043e\u0432\u0435\u0440\u0445\u043d\u043e\u0441\u0442\u0438 \u0447\u0430\u043a\u0440\u043e\u0439', summary: SURFACE_TECHNIQUES[surface].name + ' \u2014 \u043f\u0440\u043e\u0434\u043e\u043b\u0436\u0435\u043d\u0438\u0435', od: 0, ot: 0,
            code: coloredTechniqueBbcode(SURFACE_TECHNIQUES[surface]) + ' \u2014 \u043f\u0440\u043e\u0434\u043e\u043b\u0436\u0435\u043d\u0438\u0435 \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0438, \u043f\u043e\u0432\u0435\u0440\u0445\u043d\u043e\u0441\u0442\u044c: ' + (surface === 'liquid' ? '\u0436\u0438\u0434\u043a\u043e\u0441\u0442\u044c' : '\u0442\u0432\u0451\u0440\u0434\u0430\u044f'),
            link: entry.item.url, chakraSpend: surfaceSupport, focusedChakraSpend: 0,
            startActiveEffect: true, activeEffectKey: activeEffectKey(entry), autoImported: true };
        }
        var support = supportChakraCost(detail) || techniqueChakraCost(detail.chakra).support;
        if (!support) return null;
        var rankMarker = new RegExp('\u041f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430 \u0442\u0435\u0445\u043d\u0438\u043a\u0438 #' + entry.item.postId + ': \u0440\u0430\u043d\u0433 ([EDCBAS])', 'g');
        var rankMatch;
        while ((rankMatch = rankMarker.exec(rootText))) entry.effectiveRank = rankMatch[1];
        return activeEffectAction(entry, false, true);
      }).catch(function () { return null; });
    })).then(function (actions) { return manualCosts.concat(actions.filter(Boolean)); });
  }

  function normalizePreviousPostUrl(value) {
    var absolute = absoluteUrl(value, BASE_URL);
    if (!absolute) return null;
    var postId = (absolute.match(/#p(\d+)/i) || [])[1];
    try {
      var parsed = new URL(absolute);
      if (parsed.hostname !== new URL(BASE_URL).hostname || !/\/viewtopic\.php$/i.test(parsed.pathname) || !postId) return null;
    } catch (error) {
      return null;
    }
    return { url: absolute, postId: postId };
  }

  function loadPreviousTurn(url) {
    var combat = combatState();
    var normalizedPost = normalizePreviousPostUrl(url);
    if (!normalizedPost) return setStatus('\u0423\u043a\u0430\u0436\u0438\u0442\u0435 \u0441\u0441\u044b\u043b\u043a\u0443 \u043d\u0430 \u043a\u043e\u043d\u043a\u0440\u0435\u0442\u043d\u044b\u0439 \u043f\u043e\u0441\u0442 \u0444\u043e\u0440\u0443\u043c\u0430 \u0432 \u0444\u043e\u0440\u043c\u0430\u0442\u0435 viewtopic.php\u2026#p123.', 'error');
    var absolute = normalizedPost.url;
    setStatus('\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u0442\u0435\u0445\u0447\u0430\u0441\u0442\u0438 \u043f\u0440\u043e\u0448\u043b\u043e\u0433\u043e \u043f\u043e\u0441\u0442\u0430\u2026', 'loading');
    return loadDocument(absolute.split('#')[0]).then(function (doc) {
      var postId = normalizedPost.postId;
      var content = postId ? findPostContent(doc, postId) : null;
      if (!content) {
        var posts = doc.querySelectorAll('.post-content');
        content = posts.length ? posts[posts.length - 1] : null;
      }
      if (!content) throw new Error('\u0421\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u043e');
      var region = previousTechnicalRegion(content);
      var parsed = parsePreviousResources(region);
      combat.sourceUrl = absolute;
      combat.firstTurn = false;
      combat.hp = parsed.hp === null ? '' : Math.max(unconsciousHpThreshold(), parsed.hp);
      combat.maxHp = Math.max(0, statValue('life'));
      if (parsed.general !== null) combat.general = Math.max(0, parsed.general);
      if (parsed.focused !== null) combat.focused = Math.max(0, parsed.focused);
      combat.cooldowns = parsed.cooldowns;
      combat.sacrificeUsed = parsed.sacrificeUsed;
      combat.environmentPenalty = parsed.environmentPenalty || 0;
      combat.environmentAbilityReduction = parsed.environmentAbilityReduction;
      combat.criticalEnabled = parsed.criticalEnabled;
      combat.preparedReplacement = parsed.preparedReplacement;
      combat.effects = parsed.immobilized ? [{ type: 'immobilized', label: '\u041e\u0431\u0435\u0437\u0434\u0432\u0438\u0436\u0438\u0432\u0430\u043d\u0438\u0435', detail: '\u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043d\u043e \u0438\u0437 \u043f\u0440\u043e\u0448\u043b\u043e\u0433\u043e \u043f\u043e\u0441\u0442\u0430' }] : [];
      var previousBuffText = clean(region.textContent);
      ['speed', 'strategy', 'strength', 'meleeAttack', 'rangedAttack', 'ninjutsuAttack', 'genjutsuAttack', 'dodge', 'defense'].forEach(function (key) {
        var expression = new RegExp('\u041c\u043e\u0434\u0438\u0444\u0438\u043a\u0430\u0442\u043e\u0440 \u043f\u0430\u0440\u0430\u043c\u0435\u0442\u0440\u0430 ' + statLabel(key) + ':\\s*(?:\\[\\/b\\])?\\s*([+-]?\\d+(?:[.,]\\d+)?)', 'gi'), match;
        while ((match = expression.exec(previousBuffText))) combat.effects.push({ type: 'buff', label: '\u0411\u0430\u0444\u0444 / \u0434\u0435\u0431\u0430\u0444\u0444', stat: key, modifier: Number(match[1].replace(',', '.')) });
      });
      var medicineEffectExpression = /\u042d\u0444\u0444\u0435\u043a\u0442 \u043f\u0440\u0435\u043f\u0430\u0440\u0430\u0442\u0430 \u043d\u0430 \u0441\u043b\u0435\u0434\u0443\u044e\u0449\u0438\u0439 \u0445\u043e\u0434:\s*([^+;]+)\s*([+-]\d+(?:[.,]\d+)?);\s*\u043e\u0441\u0442\u0430\u043b\u043e\u0441\u044c \u0445\u043e\u0434\u043e\u0432:\s*(\d+)/gi;
      var medicineEffectMatch;
      while ((medicineEffectMatch = medicineEffectExpression.exec(previousBuffText))) {
        var medicineStatName = normalizeText(medicineEffectMatch[1]);
        var medicineStat = { \u0441\u0438\u043b\u0430: 'strength', \u0441\u043a\u043e\u0440\u043e\u0441\u0442\u044c: 'speed', \u0437\u0430\u0449\u0438\u0442\u0430: 'defense', \u0443\u043a\u043b\u043e\u043d\u0435\u043d\u0438\u0435: 'dodge' }[medicineStatName];
        if (medicineStat) combat.effects.push({ type: 'buff', label: '\u042d\u0444\u0444\u0435\u043a\u0442 \u043f\u0440\u0435\u043f\u0430\u0440\u0430\u0442\u0430', stat: medicineStat, modifier: Number(medicineEffectMatch[2].replace(',', '.')), duration: Number(medicineEffectMatch[3]) });
      }
      combat.sourceMessage = parsed.hp === null ? 'HP \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d. \u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0442\u0435\u043a\u0443\u0449\u0435\u0435 \u0437\u043d\u0430\u0447\u0435\u043d\u0438\u0435 \u0432\u0440\u0443\u0447\u043d\u0443\u044e.' : '\u0420\u0435\u0441\u0443\u0440\u0441\u044b \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043d\u044b \u0438\u0437 \u043f\u0440\u043e\u0448\u043b\u043e\u0433\u043e \u043f\u043e\u0441\u0442\u0430; \u0438\u0445 \u043c\u043e\u0436\u043d\u043e \u0438\u0441\u043f\u0440\u0430\u0432\u0438\u0442\u044c \u0432\u0440\u0443\u0447\u043d\u0443\u044e.';
      state.actions = state.actions.filter(function (action) { return !action.autoImported; });
      return actorAll([importPreviousSupport(region), importCloneGroups(region, true)]).then(function (parts) {
        var actions = parts[0].concat(parts[1]);
        combat.activeEffects = actions.map(function (action) { return action.activeEffectKey; }).filter(Boolean);
        state.actions = actions.concat(state.actions);
        rebalanceActions();
        renderTurnSetup();
        renderResources();
        renderQueue();
        if (state.builderTab === 'clones') renderActiveClones();
        setStatus(combat.sourceMessage + (actions.length ? ' \u0410\u043a\u0442\u0438\u0432\u043d\u0430\u044f \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430 \u0434\u043e\u0431\u0430\u0432\u043b\u0435\u043d\u0430 \u0430\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0447\u0435\u0441\u043a\u0438: ' + actions.length + '.' : ''), parsed.hp === null ? 'error' : '');
      });
    }).catch(function (error) {
      setStatus('\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043f\u0440\u043e\u0447\u0438\u0442\u0430\u0442\u044c \u043f\u0440\u043e\u0448\u043b\u044b\u0439 \u043f\u043e\u0441\u0442: ' + error.message, 'error');
    });
  }

  function combatEffect(type) {
    var combat = combatState();
    return combat && combat.effects.find(function (effect) { return effect && effect.type === type; }) || null;
  }

  function startEffectsMarkup() {
    var types = [
      ['burn', '\u041e\u0436\u043e\u0433'], ['bleeding', '\u041a\u0440\u043e\u0432\u043e\u0442\u0435\u0447\u0435\u043d\u0438\u0435'], ['immobilized', '\u041e\u0431\u0435\u0437\u0434\u0432\u0438\u0436\u0438\u0432\u0430\u043d\u0438\u0435'],
      ['fear', '\u0418\u0441\u043f\u0443\u0433'], ['disorientation', '\u0414\u0435\u0437\u043e\u0440\u0438\u0435\u043d\u0442\u0430\u0446\u0438\u044f'], ['trauma', '\u041f\u0441\u0438\u0445\u043e\u043b\u043e\u0433\u0438\u0447\u0435\u0441\u043a\u0430\u044f \u0442\u0440\u0430\u0432\u043c\u0430']
    ];
    return '<div class="aba-start-effects">' + types.map(function (item) {
      var effect = combatEffect(item[0]);
      var extra = '';
      if (item[0] === 'burn' || item[0] === 'bleeding') extra = '<label class="aba-effect-value">\u0423\u0440\u043e\u043d<input type="number" min="0" data-effect-value="' + item[0] + '" value="' + escapeHtml(effect && effect.amount || 0) + '"' + (effect ? '' : ' disabled') + '></label>';
      else if (item[0] === 'buff') extra = '<label class="aba-effect-value">\u041f\u0430\u0440\u0430\u043c\u0435\u0442\u0440<select data-effect-stat' + (effect ? '' : ' disabled') + '><option value="meleeAttack">\u0410\u0442\u0430\u043a\u0430 \u0431\u043b\u0438\u0436\u043d\u0438\u0439 \u0431\u043e\u0439</option><option value="rangedAttack">\u0410\u0442\u0430\u043a\u0430 \u043d\u0430 \u0434\u0438\u0441\u0442\u0430\u043d\u0446\u0438\u0438</option><option value="ninjutsuAttack">\u0410\u0442\u0430\u043a\u0430 \u041d\u0438\u043d\u0434\u0437\u044e\u0446\u0443</option><option value="genjutsuAttack">\u0410\u0442\u0430\u043a\u0430 \u0413\u0435\u043d\u0434\u0437\u044e\u0446\u0443</option><option value="dodge">\u0423\u043a\u043b\u043e\u043d\u0435\u043d\u0438\u0435</option><option value="defense">\u0417\u0430\u0449\u0438\u0442\u0430</option><option value="speed">\u0421\u043a\u043e\u0440\u043e\u0441\u0442\u044c</option><option value="strength">\u0421\u0438\u043b\u0430</option></select></label><label class="aba-effect-value">\u041c\u043e\u0434\u0438\u0444\u0438\u043a\u0430\u0442\u043e\u0440<input type="number" data-effect-modifier value="' + escapeHtml(effect && effect.modifier || 1) + '"' + (effect ? '' : ' disabled') + '></label>';
      else extra = '<label class="aba-effect-value">\u041f\u043e\u044f\u0441\u043d\u0435\u043d\u0438\u0435<input type="text" data-effect-detail="' + item[0] + '" value="' + escapeHtml(effect && effect.detail || '') + '" placeholder="\u0418\u0441\u0442\u043e\u0447\u043d\u0438\u043a \u0438\u043b\u0438 \u043e\u0441\u043e\u0431\u0435\u043d\u043d\u043e\u0441\u0442\u0438"' + (effect ? '' : ' disabled') + '></label>';
      return '<div class="aba-start-effect-row" data-effect-row="' + item[0] + '"><label class="aba-check"><input type="checkbox" data-start-effect="' + item[0] + '"' + (effect ? ' checked' : '') + '><span>' + item[1] + '</span></label>' + extra + '</div>';
    }).join('') + '</div>';
  }

  function startBuffsMarkup() {
    var stats = ['speed', 'strategy', 'strength', 'health', 'chakra', 'taijutsu', 'ninjutsu', 'genjutsu', 'meleeAttack', 'rangedAttack', 'ninjutsuAttack', 'genjutsuAttack', 'dodge', 'defense'];
    var buffs = (combatState().effects || []).filter(function (effect) { return effect.type === 'buff'; });
    return '<section class="aba-buffs"><h4>\u0411\u0430\u0444\u0444\u044b \u0438 \u0434\u0435\u0431\u0430\u0444\u0444\u044b</h4><div class="aba-buff-list">' + buffs.map(function (buff, index) {
      return '<div class="aba-buff-row" data-buff-row="' + index + '"><label>\u041f\u0430\u0440\u0430\u043c\u0435\u0442\u0440<select data-buff-stat>' + stats.map(function (key) { return '<option value="' + key + '"' + (buff.stat === key ? ' selected' : '') + '>' + statLabel(key) + '</option>'; }).join('') + '</select></label><label>\u041c\u043e\u0434\u0438\u0444\u0438\u043a\u0430\u0442\u043e\u0440<input type="number" step="any" data-buff-modifier value="' + escapeHtml(buff.modifier) + '"></label><label>\u0418\u0441\u0442\u043e\u0447\u043d\u0438\u043a<input type="text" data-buff-source value="' + escapeHtml(buff.source || '') + '"></label><button type="button" class="aba-refresh" data-remove-buff aria-label="\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u043c\u043e\u0434\u0438\u0444\u0438\u043a\u0430\u0442\u043e\u0440">\u00d7</button></div>';
    }).join('') + '</div><button type="button" class="aba-refresh" data-add-buff>\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u043c\u043e\u0434\u0438\u0444\u0438\u043a\u0430\u0442\u043e\u0440</button></section>';
  }

  function bindStartBuffs(node) {
    function refresh() {
      rebalanceActions(); renderCharacter();
      var editor = state.nodes.builder && state.nodes.builder.querySelector('.aba-action-editor');
      if (editor && editor.querySelector('[data-add="dodge"]') && editor.querySelector('p')) editor.querySelector('p').innerHTML = '\u041f\u043e\u043a\u0430\u0437\u0430\u0442\u0435\u043b\u044c: <b>\u0423\u043a\u043b\u043e\u043d\u0435\u043d\u0438\u0435 ' + statValue('dodge') + '</b>.';
      if (editor && editor.querySelector('[data-add="ordinary-unarmed"]') && editor.querySelector('p')) editor.querySelector('p').innerHTML = '\u041f\u0440\u043e\u0432\u0435\u0440\u043a\u0430: <b>\u0410\u0442\u0430\u043a\u0430 \u0431\u043b\u0438\u0436\u043d\u0438\u0439 \u0431\u043e\u0439 ' + statValue('meleeAttack') + '</b>. \u0423\u0440\u043e\u043d \u0431\u0435\u0437 \u043e\u0440\u0443\u0436\u0438\u044f: <b>' + damageText('unarmedDamage') + '</b>.';

    }
    on(node.querySelector('[data-add-buff]'), 'click', function () {
      combatState().effects.push({ type: 'buff', label: '\u0411\u0430\u0444\u0444 / \u0434\u0435\u0431\u0430\u0444\u0444', stat: 'speed', modifier: 0, source: '' });
      renderTurnSetup(); refresh();
    });
    Array.prototype.forEach.call(node.querySelectorAll('[data-buff-row]'), function (row) {
      var buff = combatState().effects.filter(function (effect) { return effect.type === 'buff'; })[Number(row.dataset.buffRow)];
      function update() { buff.stat = row.querySelector('[data-buff-stat]').value; buff.modifier = Number(row.querySelector('[data-buff-modifier]').value) || 0; buff.source = clean(row.querySelector('[data-buff-source]').value); refresh(); }
      Array.prototype.forEach.call(row.querySelectorAll('input,select'), function (field) { on(field, 'input', update); on(field, 'change', update); });
      on(row.querySelector('[data-remove-buff]'), 'click', function () { combatState().effects = combatState().effects.filter(function (effect) { return effect !== buff; }); renderTurnSetup(); refresh(); });
    });
  }

  function syncStartEffects(node) {
    var labels = { burn: '\u041e\u0436\u043e\u0433', bleeding: '\u041a\u0440\u043e\u0432\u043e\u0442\u0435\u0447\u0435\u043d\u0438\u0435', buff: '\u0411\u0430\u0444\u0444', immobilized: '\u041e\u0431\u0435\u0437\u0434\u0432\u0438\u0436\u0438\u0432\u0430\u043d\u0438\u0435', fear: '\u0418\u0441\u043f\u0443\u0433', disorientation: '\u0414\u0435\u0437\u043e\u0440\u0438\u0435\u043d\u0442\u0430\u0446\u0438\u044f', trauma: '\u041f\u0441\u0438\u0445\u043e\u043b\u043e\u0433\u0438\u0447\u0435\u0441\u043a\u0430\u044f \u0442\u0440\u0430\u0432\u043c\u0430' };
    var effects = (combatState().effects || []).filter(function (effect) { return effect.type === 'buff'; });
    Array.prototype.forEach.call(node.querySelectorAll('[data-start-effect]:checked'), function (checkbox) {
      var type = checkbox.dataset.startEffect;
      var row = checkbox.closest('[data-effect-row]');
      var effect = { type: type, label: labels[type] };
      if (type === 'burn' || type === 'bleeding') effect.amount = Math.max(0, Number((row.querySelector('[data-effect-value]') || {}).value) || 0);
      else if (type === 'buff') {
        effect.stat = (row.querySelector('[data-effect-stat]') || {}).value || 'meleeAttack';
        effect.modifier = Number((row.querySelector('[data-effect-modifier]') || {}).value) || 0;
      } else effect.detail = clean((row.querySelector('[data-effect-detail]') || {}).value);
      effects.push(effect);
    });
    combatState().effects = effects;
    renderResources();
  }

  function renderStartActiveEffects(container) {
    if (!container || combatState().firstTurn) return;
    container.innerHTML = '<div class="aba-loading">\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u0442\u0435\u0445\u043d\u0438\u043a \u0438 \u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u0435\u0439 \u0441 \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u043e\u0439\u2026</div>';
    loadActiveEffectEntries().then(function (entries) {
      var selected = combatState().activeEffects || [];
      entries.sort(function (a, b) { return (selected.indexOf(activeEffectKey(b)) !== -1) - (selected.indexOf(activeEffectKey(a)) !== -1) || a.item.name.localeCompare(b.item.name, 'ru'); });
      container.innerHTML = '<label>\u041f\u043e\u0438\u0441\u043a<input type="search" data-start-active-search placeholder="\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u0442\u0435\u0445\u043d\u0438\u043a\u0438 \u0438\u043b\u0438 \u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u0438"></label><div class="aba-start-active-list">' + (entries.length ? entries.map(function (entry) {
        var key = activeEffectKey(entry);
        return '<label class="aba-tech-option" data-start-active-name="' + escapeHtml(entry.item.name.toLocaleLowerCase('ru')) + '"><input type="checkbox" data-start-active="' + key + '"' + (selected.indexOf(key) !== -1 ? ' checked' : '') + '><span><strong>' + escapeHtml(entry.item.name) + '</strong><small>\u041f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430: ' + escapeHtml(entry.item.detail.support) + '</small></span></label>';
      }).join('') : '<div class="aba-empty">\u042d\u0444\u0444\u0435\u043a\u0442\u043e\u0432 \u0441 \u0443\u043a\u0430\u0437\u0430\u043d\u043d\u043e\u0439 \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u043e\u0439 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u043e.</div>') + '</div>';
      var search = container.querySelector('[data-start-active-search]');
      on(search, 'input', function () {
        var query = clean(search.value).toLocaleLowerCase('ru');
        Array.prototype.forEach.call(container.querySelectorAll('[data-start-active-name]'), function (row) { row.hidden = query && row.dataset.startActiveName.indexOf(query) === -1; });
      });
      Array.prototype.forEach.call(container.querySelectorAll('[data-start-active]'), function (checkbox) {
        on(checkbox, 'change', function () {
          var key = checkbox.dataset.startActive;
          var entry = entries.find(function (candidate) { return activeEffectKey(candidate) === key; });
          state.actions = state.actions.filter(function (action) { return !(action.startActiveEffect && action.activeEffectKey === key); });
          if (checkbox.checked && entry) state.actions.unshift(activeEffectAction(entry, false, false));
          combatState().activeEffects = Array.prototype.map.call(container.querySelectorAll('[data-start-active]:checked'), function (input) { return input.dataset.startActive; });
          rebalanceActions();
          renderCharacter();
        });
      });
    });
  }

  function renderTurnSetup() {
    if (state.actorScope) return;
    var node = state.nodes.turnSetup;
    if (!node) return;
    if (!state.character) { node.innerHTML = ''; node.hidden = true; return; }
    node.hidden = false;
    var combat = combatState();
    combat.maxHp = Math.max(0, statValue('life'));
    var readonly = combat.firstTurn ? ' readonly' : '';
    var labels = { speed: '\u0423\u0441\u043a\u043e\u0440\u0435\u043d\u0438\u0435', strength: '\u0423\u0441\u0438\u043b\u0435\u043d\u0438\u0435 \u0441\u0438\u043b\u044b', defense: '\u0423\u0441\u0438\u043b\u0435\u043d\u0438\u0435 \u0437\u0430\u0449\u0438\u0442\u044b', critical: '\u0423\u0441\u0438\u043b\u0435\u043d\u0438\u0435 \u043a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u043e\u0433\u043e \u0448\u0430\u043d\u0441\u0430' };
    var nonFirstSource = !combat.firstTurn ? '<div class="aba-previous-source"><label>\u0421\u0441\u044b\u043b\u043a\u0430 \u043d\u0430 \u043f\u0440\u043e\u0448\u043b\u044b\u0439 \u043f\u043e\u0441\u0442<input type="url" data-turn="source" value="' + escapeHtml(combat.sourceUrl) + '" placeholder="https://\u2026#p123"></label><button type="button" class="aba-refresh" data-turn-load>\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c</button><button type="button" class="aba-refresh" data-turn-source-reset>\u0421\u0431\u0440\u043e\u0441\u0438\u0442\u044c \u0441\u0441\u044b\u043b\u043a\u0443</button><span>\u041c\u043e\u0436\u043d\u043e \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u0442\u0435\u0445\u0447\u0430\u0441\u0442\u044c \u043b\u0438\u0431\u043e \u0432\u0432\u0435\u0441\u0442\u0438 \u0442\u0435\u043a\u0443\u0449\u0438\u0435 HP \u0438 \u0447\u0430\u043a\u0440\u0443 \u0432\u0440\u0443\u0447\u043d\u0443\u044e.</span></div>' : '';
    var nonFirstPanels = !combat.firstTurn ?
      '<details class="aba-modifiers aba-turn-modifiers"><summary>\u0421\u043e\u0441\u0442\u043e\u044f\u043d\u0438\u0435 \u0438 \u043c\u043e\u0434\u0438\u0444\u0438\u043a\u0430\u0442\u043e\u0440\u044b</summary><div class="aba-modifiers-body"><label class="aba-check"><input type="checkbox" data-turn="counter"' + (combat.counterAttack ? ' checked' : '') + '><span>\u042d\u0442\u043e\u0442 \u0445\u043e\u0434 \u044f\u0432\u043b\u044f\u0435\u0442\u0441\u044f \u043a\u043e\u043d\u0442\u0440-\u0430\u0442\u0430\u043a\u043e\u0439</span></label><label class="aba-check"><input type="checkbox" data-turn="replacement"' + (combat.preparedReplacement ? ' checked' : '') + '><span>\u0415\u0441\u0442\u044c \u043f\u043e\u0434\u0433\u043e\u0442\u043e\u0432\u043b\u0435\u043d\u043d\u0430\u044f \u0422\u0435\u0445\u043d\u0438\u043a\u0430 \u0417\u0430\u043c\u0435\u043d\u044b</span></label><div class="aba-cooldowns"><strong>\u041f\u043e\u0441\u043b\u0435\u0434\u043d\u0435\u0435 \u0443\u0441\u0438\u043b\u0435\u043d\u0438\u0435</strong>' + Object.keys(labels).map(function (key) { return '<label><span>' + labels[key] + '</span><input type="number" min="0" data-cooldown="' + key + '" value="' + enhancementTurnsAgo(key) + '"><small>\u0445\u043e\u0434\u043e\u0432 \u043d\u0430\u0437\u0430\u0434</small></label>'; }).join('') + '<label class="aba-check"><input type="checkbox" data-turn="sacrifice"' + (combat.sacrificeUsed ? ' checked' : '') + '><span>\u0416\u0435\u0440\u0442\u0432\u0430 \u0443\u0436\u0435 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0430</span></label></div><h4>\u041d\u0430\u043b\u0438\u0447\u0438\u0435 \u044d\u0444\u0444\u0435\u043a\u0442\u043e\u0432</h4>' + startEffectsMarkup() + '</div></details>' +
      '<details class="aba-modifiers aba-turn-active"><summary>\u0414\u0435\u0439\u0441\u0442\u0432\u0443\u044e\u0449\u0438\u0435 \u0442\u0435\u0445\u043d\u0438\u043a\u0438 \u0438 \u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u0438</summary><div class="aba-modifiers-body aba-start-active"></div></details>' : '';
    node.innerHTML = '<div class="aba-turn-heading"><strong>\u0421\u043e\u0441\u0442\u043e\u044f\u043d\u0438\u0435 \u043d\u0430 \u043d\u0430\u0447\u0430\u043b\u043e \u0445\u043e\u0434\u0430</strong><label class="aba-check"><input type="checkbox" data-turn="critical"' + (combat.criticalEnabled ? ' checked' : '') + '><span>\u0421\u0447\u0438\u0442\u0430\u0442\u044c \u043a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u0443\u0440\u043e\u043d</span></label><label class="aba-check"><input type="checkbox" data-turn="first"' + (combat.firstTurn ? ' checked' : '') + '><span>\u041f\u0435\u0440\u0432\u044b\u0439 \u0431\u043e\u0435\u0432\u043e\u0439 \u0445\u043e\u0434</span></label></div>' +
      nonFirstSource +
      '<div class="aba-turn-values"><label>HP<input type="number" min="' + unconsciousHpThreshold() + '" data-turn="hp" value="' + escapeHtml(combat.hp) + '" placeholder="\u0412\u0432\u0435\u0434\u0438\u0442\u0435 HP"' + readonly + '></label><label>\u041e\u0431\u0449\u0430\u044f \u0447\u0430\u043a\u0440\u0430<input type="number" min="0" step="1" data-turn="general" value="' + combat.general + '"' + readonly + '></label><label>\u041a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u0430\u044f<input type="number" min="0" max="' + focusedChakraAbsoluteLimit() + '" step="1" data-turn="focused" value="' + combat.focused + '"' + readonly + '></label></div>' +
      '<p class="aba-note">\u041f\u043e\u0440\u043e\u0433 \u043f\u043e\u0442\u0435\u0440\u0438 \u0441\u043e\u0437\u043d\u0430\u043d\u0438\u044f: <b>' + unconsciousHpThreshold() + ' HP</b>.' + (statValue('taijutsu') >= 5 ? ' \u0412 \u043d\u0430\u0447\u0430\u043b\u0435 \u043d\u0435\u043f\u0435\u0440\u0432\u043e\u0433\u043e \u0445\u043e\u0434\u0430 \u0432\u043e\u0441\u0441\u0442\u0430\u043d\u0430\u0432\u043b\u0438\u0432\u0430\u0435\u0442\u0441\u044f 1 HP, \u0435\u0441\u043b\u0438 \u0437\u0430\u043f\u0430\u0441 \u043d\u0435\u043f\u043e\u043b\u043d\u044b\u0439.' : '') + '</p>' +
      nonFirstPanels + startBuffsMarkup() +
      '<p class="aba-note">' + escapeHtml(combat.sourceMessage || '') + '</p>';
    bindStartBuffs(node);
    var buff = combatEffect('buff');
    var buffSelect = node.querySelector('[data-effect-stat]');
    if (buffSelect && buff) buffSelect.value = buff.stat || 'meleeAttack';
    var first = node.querySelector('[data-turn="first"]');
    on(first, 'change', function () {
      if (first.checked) {
        state.actions = [];
        state.combat = createCombatState();
      } else {
        combat.firstTurn = false;
        combat.sourceMessage = '\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0440\u0435\u0441\u0443\u0440\u0441\u044b \u0432\u0440\u0443\u0447\u043d\u0443\u044e \u0438\u043b\u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u0435 \u043f\u0440\u043e\u0448\u043b\u044b\u0439 \u043f\u043e\u0441\u0442.';
        state.actions = [];
      }
      renderTurnSetup(); renderResources(); renderQueue(); renderActionMenu();
    });
    var source = node.querySelector('[data-turn="source"]');
    if (source) {
      on(source, 'input', function () { combatState().sourceUrl = source.value; });
      on(node.querySelector('[data-turn-load]'), 'click', function () { loadPreviousTurn(source.value); });
      on(node.querySelector('[data-turn-source-reset]'), 'click', function () {
        combatState().sourceUrl = '';
        combatState().sourceMessage = '\u0421\u0441\u044b\u043b\u043a\u0430 \u0441\u0431\u0440\u043e\u0448\u0435\u043d\u0430. \u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0440\u0435\u0441\u0443\u0440\u0441\u044b \u0432\u0440\u0443\u0447\u043d\u0443\u044e \u0438\u043b\u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u0435 \u0434\u0440\u0443\u0433\u043e\u0439 \u043f\u0440\u043e\u0448\u043b\u044b\u0439 \u043f\u043e\u0441\u0442.';
        setStatus('\u0421\u0441\u044b\u043b\u043a\u0430 \u043d\u0430 \u043f\u0440\u043e\u0448\u043b\u044b\u0439 \u043f\u043e\u0441\u0442 \u0441\u0431\u0440\u043e\u0448\u0435\u043d\u0430.', '');
        renderTurnSetup();
      });
    }
    var criticalToggle = node.querySelector('[data-turn="critical"]');
    if (criticalToggle) on(criticalToggle, 'change', function () {
      combatState().criticalEnabled = criticalToggle.checked;
      renderActionMenu();
    });
    Array.prototype.forEach.call(node.querySelectorAll('[data-turn="hp"],[data-turn="general"],[data-turn="focused"]'), function (input) {
      if (input.readOnly) return;
      on(input, 'input', function () { combatState()[input.dataset.turn] = input.value === '' ? '' : (input.dataset.turn === 'hp' ? Math.max(unconsciousHpThreshold(), Number(input.value)) : Math.round(Math.max(0, Number(input.value)))); renderResources(); renderQueue(); });
    });
    var sacrifice = node.querySelector('[data-turn="sacrifice"]');
    if (sacrifice) on(sacrifice, 'change', function (event) { combatState().sacrificeUsed = event.target.checked; });
    var counter = node.querySelector('[data-turn="counter"]');
    if (counter) on(counter, 'change', function (event) { combatState().counterAttack = event.target.checked; renderQueue(); });
    var replacement = node.querySelector('[data-turn="replacement"]');
    if (replacement) on(replacement, 'change', function (event) { combatState().preparedReplacement = event.target.checked; });
    Array.prototype.forEach.call(node.querySelectorAll('[data-cooldown]'), function (input) { on(input, 'input', function () { combatState().cooldowns[input.dataset.cooldown] = Math.max(0, parseInt(input.value, 10) || 0); }); });
    Array.prototype.forEach.call(node.querySelectorAll('[data-start-effect]'), function (checkbox) {
      on(checkbox, 'change', function () {
        Array.prototype.forEach.call(checkbox.closest('[data-effect-row]').querySelectorAll('input:not([data-start-effect]),select'), function (field) { field.disabled = !checkbox.checked; });
        syncStartEffects(node);
      });
    });
    Array.prototype.forEach.call(node.querySelectorAll('[data-effect-value],[data-effect-stat],[data-effect-modifier],[data-effect-detail]'), function (input) { on(input, 'input', function () { syncStartEffects(node); }); on(input, 'change', function () { syncStartEffects(node); }); });
    renderStartActiveEffects(node.querySelector('.aba-start-active'));
  }

  function renderCharacter() {
    if (state.actorScope) return;
    var summary = state.nodes.characterSummary;
    if (!summary) return;
    if (!state.character) {
      summary.innerHTML = '<div class="aba-empty">\u041f\u0430\u0440\u0430\u043c\u0435\u0442\u0440\u044b \u043f\u043e\u044f\u0432\u044f\u0442\u0441\u044f \u043f\u043e\u0441\u043b\u0435 \u0437\u0430\u0433\u0440\u0443\u0437\u043a\u0438 \u043b\u0438\u0447\u043d\u043e\u0433\u043e \u0434\u0435\u043b\u0430.</div>';
      renderResources();
      renderQueue();
      return;
    }
    var s = state.character.stats;
    var levelText = state.character && state.character.stats && state.character.stats.level ? '\u0423\u0440\u043e\u0432\u0435\u043d\u044c ' + (state.character.stats.level.value || 0) : '\u0423\u0440\u043e\u0432\u0435\u043d\u044c 0';
    summary.innerHTML = '<div class="aba-character-title"><div class="aba-character-title-left"><strong>' + escapeHtml(state.character.name) + '</strong><span class="aba-character-level">' + escapeHtml(levelText) + '</span></div><a href="' + escapeHtml(state.character.url) + '" target="_blank" rel="noopener">\u041b\u0438\u0447\u043d\u043e\u0435 \u0434\u0435\u043b\u043e \u2197</a></div><div class="aba-stat-grid">' + [
      ['HP', statValue('life')], ['\u041e\u0431\u0449\u0430\u044f \u0447\u0430\u043a\u0440\u0430', statValue('chakraTotal')], ['\u041a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u0430\u044f \u0447\u0430\u043a\u0440\u0430', chakraLedger().focused + ' / ' + focusedChakraLimit()], ['\u0411\u0430\u0437\u043e\u0432\u044b\u0439 \u043a\u0440\u0438\u0442', statValue('baseCritical') + '%'], ['\u0410\u0442\u0430\u043a\u0430 \u0431\u043b\u0438\u0436\u043d\u0438\u0439 \u0431\u043e\u0439', statValue('meleeAttack')], ['\u0410\u0442\u0430\u043a\u0430 \u043d\u0430 \u0434\u0438\u0441\u0442\u0430\u043d\u0446\u0438\u0438', statValue('rangedAttack')], ['\u0410\u0442\u0430\u043a\u0430 \u041d\u0438\u043d\u0434\u0437\u044e\u0446\u0443', statValue('ninjutsuAttack')], ['\u0410\u0442\u0430\u043a\u0430 \u0413\u0435\u043d\u0434\u0437\u044e\u0446\u0443', statValue('genjutsuAttack')], ['\u0423\u043a\u043b\u043e\u043d\u0435\u043d\u0438\u0435', statValue('dodge')], ['\u0417\u0430\u0449\u0438\u0442\u0430', statValue('defense')], ['\u0417\u0430\u0449\u0438\u0442\u0430 \u043e\u0442 \u0413\u0435\u043d\u0434\u0437\u044e\u0446\u0443', statValue('genjutsuDefense')], ['\u0417\u0430\u0449\u0438\u0442\u0430 \u043e\u0442 \u044f\u0434\u043e\u0432 \u0438 \u0431\u043e\u043b\u0435\u0437\u043d\u0435\u0439', statValue('resistance')]
    ].map(function (item) { return '<span><small>' + item[0] + '</small><b>' + escapeHtml(item[1]) + '</b></span>'; }).join('') + '</div>';
    var taijutsu = statValue('taijutsu'), taijutsuRules = [];
    if (taijutsu >= 5) taijutsuRules.push('\u0422\u0430\u0439\u0434\u0437\u044e\u0446\u0443 5: \u0432\u043e\u0441\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d\u0438\u0435 1 HP \u0432 \u043d\u0430\u0447\u0430\u043b\u0435 \u0445\u043e\u0434\u0430, \u0435\u0441\u043b\u0438 \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436 \u0432 \u0441\u043e\u0437\u043d\u0430\u043d\u0438\u0438 \u0438 HP \u043d\u0435\u043f\u043e\u043b\u043d\u044b\u0439.');
    if (taijutsu >= 7) taijutsuRules.push('\u0422\u0430\u0439\u0434\u0437\u044e\u0446\u0443 7: \u043f\u043e\u0442\u0435\u0440\u044f \u0441\u043e\u0437\u043d\u0430\u043d\u0438\u044f \u043f\u0440\u0438 ' + unconsciousHpThreshold() + ' HP.');
    if (taijutsu >= 8) taijutsuRules.push('\u0422\u0430\u0439\u0434\u0437\u044e\u0446\u0443 8: \u0438\u043c\u043c\u0443\u043d\u0438\u0442\u0435\u0442 \u043a \u0441\u043a\u0440\u044b\u0442\u043e\u0439 \u0440\u0443\u043a\u043e\u043f\u0430\u0448\u043d\u043e\u0439 \u0430\u0442\u0430\u043a\u0435 \u0431\u0435\u0437 \u0434\u043e\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044c\u043d\u044b\u0445 \u0444\u0430\u043a\u0442\u043e\u0440\u043e\u0432; \u0448\u0442\u0440\u0430\u0444 \u043e\u043a\u0440\u0443\u0436\u0435\u043d\u0438\u044f \u0441\u043d\u0438\u0436\u0435\u043d \u043d\u0430 50%.');
    if (taijutsu >= 9) taijutsuRules.push('\u0422\u0430\u0439\u0434\u0437\u044e\u0446\u0443 9: \u0438\u043c\u043c\u0443\u043d\u0438\u0442\u0435\u0442 \u043a \u043a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u0438\u043c \u043f\u043e\u043f\u0430\u0434\u0430\u043d\u0438\u044f\u043c \u0432 \u0440\u0443\u043a\u043e\u043f\u0430\u0448\u043d\u043e\u043c \u0431\u043e\u044e; \u0443\u0440\u043e\u043d \u043e\u0431\u044b\u0447\u043d\u044b\u0445 \u0430\u0442\u0430\u043a \u0441\u043d\u0438\u0436\u0435\u043d \u043d\u0430 10%.');
    if (taijutsuRules.length) summary.innerHTML += '<details class="aba-taijutsu-rules"><summary>\u0412\u044b\u0441\u043e\u043a\u0438\u0439 \u043d\u0430\u0432\u044b\u043a \u0422\u0430\u0439\u0434\u0437\u044e\u0446\u0443 \u00b7 ' + taijutsu + '</summary><div>' + taijutsuRules.map(function (rule) { return '<p>' + escapeHtml(rule) + '</p>'; }).join('') + '</div></details>';
    var passiveNotes = passiveAbilityNotes();
    if (passiveNotes.length) summary.innerHTML += '<details class="aba-taijutsu-rules" open><summary>\u0410\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0447\u0435\u0441\u043a\u0438\u0435 \u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u0438</summary><div>' + passiveNotes.map(function (rule) { return '<p>' + escapeHtml(rule) + '</p>'; }).join('') + '</div></details>';
    var spent = inventoryUsage();
    var consumables = (state.character.inventory || []).filter(function (item) { return spent[item.inventoryId]; });
    if (consumables.length) summary.innerHTML += '<div class="aba-inventory-spent"><strong>\u041f\u043e\u0442\u0440\u0430\u0447\u0435\u043d\u043d\u044b\u0435 \u043f\u0440\u0435\u0434\u043c\u0435\u0442\u044b</strong><p>' + escapeHtml(consumables.map(function (item) { return item.name + ': ' + spent[item.inventoryId] + ' ' + item.unit + '; \u043e\u0441\u0442\u0430\u043b\u043e\u0441\u044c ' + inventoryRemaining(item); }).join(' \u00b7 ')) + '</p></div>';
    var artifacts = (state.character.artifacts || []).filter(function (item) { return item.passive && Object.keys(item.passive).length; });
    if (artifacts.length) {
      summary.innerHTML += '<div class="aba-artifact-effects">' + artifacts.map(function (item) { return '<label><input type="checkbox" data-artifact-passive="' + item.inventoryId + '"' + (item.passiveEnabled !== false ? ' checked' : '') + '> \u0410\u043a\u0442\u0438\u0432\u0435\u043d \u044d\u0444\u0444\u0435\u043a\u0442 \u0430\u0440\u0442\u0435\u0444\u0430\u043a\u0442\u0430: ' + escapeHtml(item.name) + '<small>' + escapeHtml(Object.keys(item.passive).map(function (key) { return (key === 'critical' ? '\u041a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u0443\u0434\u0430\u0440' : statLabel(key)) + ' +' + item.passive[key] + (key === 'critical' ? '%' : ''); }).join('; ')) + '</small></label>'; }).join('') + '</div>';
      Array.prototype.forEach.call(summary.querySelectorAll('[data-artifact-passive]'), function (node) { on(node, 'change', function () { var item = artifacts.find(function (candidate) { return candidate.inventoryId === node.dataset.artifactPassive; }); item.passiveEnabled = node.checked; rebalanceActions(); renderCharacter(); renderActionMenu(); }); });
    }
    renderResources();
    renderQueue();
  }

  function renderResources() {
    if (state.actorScope) return;
    if (!state.nodes.resources) return;
    if (!state.character) {
      state.nodes.resources.innerHTML = '<span><small>HP</small><b>\u2014</b></span><span><small>\u041e\u0431\u044b\u0447\u043d\u044b\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044f</small><b>\u2014</b></span><span><small>\u041e\u0447\u043a\u0438 \u0442\u0435\u0445\u043d\u0438\u043a</small><b>\u2014</b></span><span><small>\u041e\u0431\u0449\u0430\u044f \u0447\u0430\u043a\u0440\u0430</small><b>\u2014</b></span><span><small>\u041a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u0430\u044f</small><b>\u2014</b></span>';
      return;
    }
    var left = remaining();
    var chakra = chakraLedger();
    var health = healthLedger();
    state.nodes.resources.innerHTML = '<span class="' + (health.unconscious ? 'aba-hp-unconscious' : '') + '"><small>HP</small><b>' + health.current + ' / ' + health.max + '</b>' + (health.unconscious ? '<em>\u0412\u044b \u043f\u043e\u0442\u0435\u0440\u044f\u043b\u0438 \u0441\u043e\u0437\u043d\u0430\u043d\u0438\u0435</em>' : '') + '</span><span><small>\u041e\u0431\u044b\u0447\u043d\u044b\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044f</small><b>' + left.od + ' / ' + actionTotal('ordinary') + '</b></span><span><small>\u041e\u0447\u043a\u0438 \u0442\u0435\u0445\u043d\u0438\u043a</small><b>' + left.ot + ' / ' + actionTotal('technique') + '</b></span><span><small>\u041e\u0431\u0449\u0430\u044f \u0447\u0430\u043a\u0440\u0430</small><b>' + chakra.general + '</b></span><span><small>\u041a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u0430\u044f</small><b>' + chakra.focused + ' / ' + chakra.limit + '</b></span>';
  }

  function actionChakraNote(action, index, ledger) {
    var entry = ledger.entries[index] || { generalSpent: 0, generalGained: 0, focusedSpent: 0, focusedGained: 0, transfer: 0 };
    var notes = [];
    if (action.attackFocus && combatState() && combatState().counterAttack) notes.push('\u043a\u043e\u043d\u0442\u0440-\u0430\u0442\u0430\u043a\u0430');
    else if (entry.attackFocusGranted) notes.push('\u0445\u043e\u0434-\u0430\u0442\u0430\u043a\u0430');
    if (action.chakraMode === 'battle') notes.push('\u043e\u0431\u0449\u0430\u044f \u0447\u0430\u043a\u0440\u0430 \u2212' + entry.transfer + ', \u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u0430\u044f +' + entry.transfer);
    else if (action.chakraMode === 'rest') notes.push('\u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u0430\u044f \u0447\u0430\u043a\u0440\u0430 +' + entry.focusedGained);
    else if (entry.attackFocusGranted) notes.push('\u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u0430\u044f \u0447\u0430\u043a\u0440\u0430 +' + entry.focusedGained);
    if (entry.cloneAllocated) notes.push('\u0440\u0430\u0441\u043f\u0440\u0435\u0434\u0435\u043b\u0435\u043d\u043e \u043c\u0435\u0436\u0434\u0443 \u043a\u043b\u043e\u043d\u0430\u043c\u0438: ' + entry.cloneAllocated);
    if (entry.cloneSupport) notes.push('\u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430 \u0438\u0437 \u0447\u0430\u043a\u0440\u044b \u043a\u043b\u043e\u043d\u043e\u0432: ' + entry.cloneSupport);
    if (action.cloneOperation === 'act') { notes.push('\u043d\u0430 \u043a\u0430\u0436\u0434\u043e\u0433\u043e \u043a\u043b\u043e\u043d\u0430: \u041e\u0414 ' + (action.actorAction.od || 0) + ', \u041e\u0422 ' + (action.actorAction.ot || 0)); if (entry.generalSpent) notes.push('\u043e\u0431\u0449\u0430\u044f \u0447\u0430\u043a\u0440\u0430 \u2212' + entry.generalSpent); if (entry.focusedSpent) notes.push('\u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u0430\u044f \u2212' + entry.focusedSpent); }
    if (action.chakraSpend) notes.unshift('\u0440\u0430\u0441\u0445\u043e\u0434 \u043e\u0431\u0449\u0435\u0439 \u0447\u0430\u043a\u0440\u044b: ' + entry.generalSpent);
    if (entry.generalGained) notes.push('\u043e\u0431\u0449\u0430\u044f \u0447\u0430\u043a\u0440\u0430 ' + entry.generalBeforeGain + ' +' + entry.generalGained + ' = ' + entry.generalAfterGain);
    if (action.focusedChakraGain && entry.focusedGained) notes.push('\u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u0430\u044f \u0447\u0430\u043a\u0440\u0430 +' + entry.focusedGained);
    if (action.cloneOperation === 'dismiss' && entry.focusedGained) notes.push('\u0432\u043e\u0437\u0432\u0440\u0430\u0449\u0435\u043d\u043e \u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u043e\u0439 \u0447\u0430\u043a\u0440\u044b: ' + entry.focusedGained);
    if (action.focusedChakraSpend) notes.unshift('\u0440\u0430\u0441\u0445\u043e\u0434 \u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u043e\u0439 \u0447\u0430\u043a\u0440\u044b: ' + entry.focusedSpent);
    return notes.join('; ');
  }

  function reorderBattleAction(from, to) {
    if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 || from >= state.actions.length || to >= state.actions.length || from === to) return false;
    var previous = state.actions.slice(), moved = state.actions.splice(from, 1)[0];
    state.actions.splice(to, 0, moved);
    var groups = {}, error = '';
    state.actions.forEach(function (action) {
      var plan = action.cloneCreation || action.cloneImport;
      if (plan && !plan.illusory) groups[plan.id] = plan.count;
      if (action.cloneOperation) {
        if ((groups[action.cloneGroupId] || 0) < action.cloneCount) error = '\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u043a\u043b\u043e\u043d\u0430 \u0434\u043e\u043b\u0436\u043d\u043e \u0438\u0434\u0442\u0438 \u043f\u043e\u0441\u043b\u0435 \u0435\u0433\u043e \u0441\u043e\u0437\u0434\u0430\u043d\u0438\u044f \u0438 \u0434\u043e \u0440\u0430\u0441\u0441\u0435\u0438\u0432\u0430\u043d\u0438\u044f.';
        groups[action.cloneGroupId] = (groups[action.cloneGroupId] || 0) - action.cloneCount;
        if (action.cloneOperation === 'act') groups[action.cloneResultId] = action.cloneCount;
      }
    });
    rebalanceActions();
    var ledger = chakraLedger();
    state.actions.forEach(function (action, index) {
      var entry = ledger.entries[index];
      if (!action.actorAction && entry && (entry.generalSpent < (action.chakraSpend || 0) || entry.focusedSpent < (action.focusedChakraSpend || 0))) error = '\u0412 \u044d\u0442\u043e\u043c \u043f\u043e\u0440\u044f\u0434\u043a\u0435 \u043d\u0435\u0434\u043e\u0441\u0442\u0430\u0442\u043e\u0447\u043d\u043e \u0447\u0430\u043a\u0440\u044b \u0434\u043b\u044f \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044f \u00ab' + action.label + '\u00bb.';
    });
    if (error) { state.actions = previous; rebalanceActions(); }
    renderTurnSetup(); renderCharacter();
    if (error) setBuilderMessage(error, 'error');
    return !error;
  }

  function bindQueueReordering() {
    var queue = state.nodes.queue;
    Array.prototype.forEach.call(queue.querySelectorAll('[data-reorder]'), function (handle) {
      on(handle, 'keydown', function (event) {
        if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
        event.preventDefault();
        var from = Number(handle.dataset.reorder), to = from + (event.key === 'ArrowUp' ? -1 : 1);
        if (reorderBattleAction(from, to)) { var next = queue.querySelector('[data-reorder="' + to + '"]'); if (next) next.focus(); }
      });
      on(handle, 'pointerdown', function (event) {
        if (event.button !== 0 || state.actions.length < 2) return;
        event.preventDefault();
        var from = Number(handle.dataset.reorder), boundary = from, card = handle.closest('.aba-queue-item'), pointerId = event.pointerId;
        card.classList.add('is-dragging');
        handle.setPointerCapture(pointerId);
        function clearMarkers() { Array.prototype.forEach.call(queue.querySelectorAll('.is-drop-before,.is-drop-after'), function (node) { node.classList.remove('is-drop-before', 'is-drop-after'); }); }
        function move(event) {
          if (event.pointerId !== pointerId) return;
          clearMarkers();
          var cards = Array.prototype.slice.call(queue.querySelectorAll('.aba-queue-item'));
          var bounds = queue.getBoundingClientRect();
          if (event.clientY < bounds.top + 35) queue.scrollTop -= 16;
          if (event.clientY > bounds.bottom - 35) queue.scrollTop += 16;
          boundary = cards.length;
          for (var i = 0; i < cards.length; i++) { var rect = cards[i].getBoundingClientRect(); if (event.clientY < rect.top + rect.height / 2) { boundary = i; break; } }
          if (boundary < cards.length) cards[boundary].classList.add('is-drop-before');
          else cards[cards.length - 1].classList.add('is-drop-after');
        }
        function finish(event) {
          if (event.pointerId !== pointerId) return;
          handle.removeEventListener('pointermove', move); handle.removeEventListener('pointerup', finish); handle.removeEventListener('pointercancel', finish);
          clearMarkers(); card.classList.remove('is-dragging');
          if (handle.hasPointerCapture(pointerId)) handle.releasePointerCapture(pointerId);
          if (event.type !== 'pointercancel') reorderBattleAction(from, boundary > from ? boundary - 1 : boundary);
        }
        handle.addEventListener('pointermove', move); handle.addEventListener('pointerup', finish); handle.addEventListener('pointercancel', finish);
      });
    });
  }

  function renderQueue() {
    if (state.actorScope) return;
    if (!state.nodes.queue) return;
    if (!state.actions.length) {
      state.nodes.queue.innerHTML = '<div class="aba-empty">\u0414\u043e\u0431\u0430\u0432\u043b\u0435\u043d\u043d\u044b\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044f \u043f\u043e\u044f\u0432\u044f\u0442\u0441\u044f \u0437\u0434\u0435\u0441\u044c \u0432 \u043f\u043e\u0440\u044f\u0434\u043a\u0435 \u0432\u044b\u043f\u043e\u043b\u043d\u0435\u043d\u0438\u044f.</div>';
      state.nodes.insert.disabled = true;
      if (state.character && state.builderTab === 'clones') renderActiveClones();
      return;
    }
    var ledger = chakraLedger();
    var hpLedger = healthLedger();
    state.nodes.queue.innerHTML = state.actions.map(function (action, index) {
      var pointsAction = action.actorAction || action;
      var pointNote = (action.actorAction ? '\u043d\u0430 \u043a\u0430\u0436\u0434\u043e\u0433\u043e \u043a\u043b\u043e\u043d\u0430: ' : '') + (pointsAction.od ? pointsAction.od + ' \u041e\u0414' : '') + (pointsAction.od && pointsAction.ot ? ' \u00b7 ' : '') + (pointsAction.ot ? pointsAction.ot + ' \u041e\u0422' : (!pointsAction.od ? '\u0431\u0435\u0437 \u0440\u0430\u0441\u0445\u043e\u0434\u0430' : ''));
      var damageNote = queueDamageNote(pointsAction);
      var chakraNote = actionChakraNote(action, index, ledger);
      var hpEntry = hpLedger.entries[index];
      var hpNote = hpEntry && hpEntry.delta ? 'HP ' + hpEntry.before + (hpEntry.delta > 0 ? ' +' : ' \u2212') + Math.abs(hpEntry.delta) + ' = ' + hpEntry.after : '';
      var lostConsciousness = hpEntry && hpEntry.after <= hpLedger.minimum && hpEntry.before > hpLedger.minimum;
      return '<article class="aba-queue-item"><button type="button" class="aba-number aba-drag-handle" data-reorder="' + index + '" title="\u041f\u0435\u0440\u0435\u0442\u0430\u0449\u0438\u0442\u044c \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435; \u2191 \u0438 \u2193 \u2014 \u043f\u0435\u0440\u0435\u043c\u0435\u0441\u0442\u0438\u0442\u044c" aria-label="\u041f\u0435\u0440\u0435\u043c\u0435\u0441\u0442\u0438\u0442\u044c \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 ' + (index + 1) + '">' + (index + 1) + '</button><div><strong>' + escapeHtml(action.label) + '</strong><p>' + escapeHtml(action.summary) + '</p>' + (damageNote ? '<p class="aba-queue-damage">' + escapeHtml(damageNote) + '</p>' : '') + (chakraNote ? '<em>' + escapeHtml(chakraNote) + '</em>' : '') + (hpNote ? '<em>' + escapeHtml(hpNote) + '</em>' : '') + (lostConsciousness ? '<strong class="aba-consciousness-warning">\u0412\u044b \u043f\u043e\u0442\u0435\u0440\u044f\u043b\u0438 \u0441\u043e\u0437\u043d\u0430\u043d\u0438\u0435 \u043f\u0440\u0438 ' + hpEntry.after + ' HP.</strong>' : '') + '<small>' + escapeHtml(pointNote) + '</small></div><button type="button" data-remove="' + index + '" title="\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435">\u00d7</button></article>';
    }).join('');
    Array.prototype.forEach.call(state.nodes.queue.querySelectorAll('[data-remove]'), function (button) {
      on(button, 'click', function () {
        removeBattleAction(parseInt(button.dataset.remove, 10));
        rebalanceActions();
        renderTurnSetup();
        renderCharacter();
        var selected = state.nodes.builder && state.nodes.builder.querySelector('[data-action].is-active');
        if (selected) renderEditor(selected.dataset.action);
        else if (state.builderTab !== 'clones') renderActionMenu();
      });
    });
    bindQueueReordering();
    state.nodes.insert.disabled = false;
    if (state.builderTab === 'clones') renderActiveClones();
  }

  function queueDamageNote(action) {
    var code = String(action.code || '').replace(/\[\/?b\]/gi, '');
    var final = code.match(/\u0438\u0442\u043e\u0433\u043e\u0432\u044b\u0439 \u044d\u0444\u0444\u0435\u043a\u0442:\s*\u0423\u0440\u043e\u043d\s+([^;]+)/i);
    var damage = final || code.match(/(?:^|;\s*)(?:\u0443\u0440\u043e\u043d \u0431\u0435\u0437 \u043e\u0440\u0443\u0436\u0438\u044f|\u0443\u0440\u043e\u043d \u043e\u0442 \u0430\u0442\u0430\u043a\u0438 \u043e\u0440\u0443\u0436\u0438\u0435\u043c|\u0443\u0440\u043e\u043d):\s*([^;]+)/i);
    if (!damage) return '';
    var value = clean(damage[1]);
    if (/^[\d.,]+(?:\s*[+-]\s*[\d.,]+)+$/.test(value)) value += ' = ' + arithmeticExpressionNumber(value, 0);
    return '\u0423\u0440\u043e\u043d: ' + value + (/\u0443\u0440\u043e\u043d \u0437\u0430 \u043e\u0434\u043d\u043e \u043f\u043e\u043f\u0430\u0434\u0430\u043d\u0438\u0435/i.test(code) ? ' (\u0437\u0430 \u043e\u0434\u043d\u043e \u043f\u043e\u043f\u0430\u0434\u0430\u043d\u0438\u0435)' : '');
  }

  function formatFinalDamage(code) {
    code = String(code || '');
    if (/\u0438\u0442\u043e\u0433\u043e\u0432\u044b\u0439 \u044d\u0444\u0444\u0435\u043a\u0442:\s*\u0423\u0440\u043e\u043d\s+[\d.,]+/i.test(code)) return code.replace(/(\u0438\u0442\u043e\u0433\u043e\u0432\u044b\u0439 \u044d\u0444\u0444\u0435\u043a\u0442:\s*)(\u0423\u0440\u043e\u043d\s+[\d.,]+)/gi, '$1[b]$2[/b]');
    var damage = code.match(/(?:\u0443\u0440\u043e\u043d \u0431\u0435\u0437 \u043e\u0440\u0443\u0436\u0438\u044f|\u0443\u0440\u043e\u043d \u043e\u0442 \u0430\u0442\u0430\u043a\u0438 \u043e\u0440\u0443\u0436\u0438\u0435\u043c|\u0443\u0440\u043e\u043d):\s*([^;]+)/i);
    if (damage && /^\s*[\d.,]+(?:\s*[+-]\s*[\d.,]+)+\s*$/.test(damage[1])) {
      code += '; [b]\u0418\u0442\u043e\u0433\u043e\u0432\u044b\u0439 \u0443\u0440\u043e\u043d: ' + arithmeticExpressionNumber(damage[1], 0) + '[/b]';
    }
    return code;
  }

  function conciseActionCode(action) {
    var code = String(action.code || '');
    code = code.replace(/;\s*(?:\u041d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d|\u041e\u0441\u043e\u0431\u044b\u0439|\u042d\u0444\u0444\u0435\u043a\u0442|\u041f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430(?:\s*\/\s*\u0423\u0441\u0438\u043b\u0435\u043d\u0438\u0435)?|\u0423\u0441\u0438\u043b\u0435\u043d\u0438\u0435):\s*\d+(?:[.,]\d+)?(?=;|$)/gi, '');
    // Actual chakra expenditure is printed by actionChakraNote, including discounts.
    code = code.replace(/; \u0447\u0430\u043a\u0440\u0430: [\d.,]+\/[\d.,]+/g, '');
    if (/\u041f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430 \u0442\u0435\u0445\u043d\u0438\u043a\u0438 #\d+: \u0440\u0430\u043d\u0433 [EDCBAS]; \u0440\u0430\u0441\u0445\u043e\u0434/.test(code)) {
      code = code.replace(/; \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430: [\d.,]+ \u0432 \u0445\u043e\u0434/g, '');
    }
    code = code.replace(/; \u0443\u0441\u0438\u043b\u0435\u043d\u0438\u0435: \u0423\u0440\u043e\u043d \u0441 \u043e\u0440\u0443\u0436\u0438\u0435\u043c ([+\u2212-]\d+)(?=;|$)/g, function (text, value) {
      return code.indexOf('\u0423\u0440\u043e\u043d \u043e\u0440\u0443\u0436\u0438\u044f: ' + value) !== -1 ? '' : text;
    });
    return code;
  }

  function formatBattleActionLine(action, index, ledger) {
    var code = conciseActionCode(action)
      .replace(/;\s*\[b\]\u0418\u0442\u043e\u0433\u043e\u0432\u044b\u0439 \u0443\u0440\u043e\u043d:[^;]*\[\/b\]/gi, '')
      .replace(/;\s*\u0431\u0430\u0437\u043e\u0432\u044b\u0439 \u0448\u0430\u043d\u0441 \u043a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u043e\u0433\u043e \u043f\u043e\u043f\u0430\u0434\u0430\u043d\u0438\u044f:[^;]*/gi, '')
      .replace(/;\s*\u0434\u0435\u0439\u0441\u0442\u0432\u0443\u044e\u0449\u0438\u0435 \u043c\u043e\u0434\u0438\u0444\u0438\u043a\u0430\u0442\u043e\u0440\u044b:[^;]*/gi, '')
      .replace(/;\s*\u0440\u0430\u0441\u0445\u043e\u0434 \u043e\u0431\u0449\u0435\u0433\u043e \u0437\u0430\u043f\u0430\u0441\u0430 \u0447\u0430\u043a\u0440\u044b:[^;]*/gi, '')
      .replace(/;\s*\u0438\u0442\u043e\u0433\u043e\u0432\u044b\u0439 \u0448\u0430\u043d\u0441 \u043a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u043e\u0433\u043e \u043f\u043e\u043f\u0430\u0434\u0430\u043d\u0438\u044f:[\s\S]*$/i, '')
      .replace(/;\s*\u043a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u0443\u0440\u043e\u043d \u043d\u0435 \u0440\u0430\u0441\u0441\u0447\u0438\u0442\u044b\u0432\u0430\u0435\u0442\u0441\u044f:[^;]*/gi, '')
      .replace(/;\s*;+/g, ';')
      .replace(/;\s*$/, '');
    var damage = code.match(/(?:\u0443\u0440\u043e\u043d \u0431\u0435\u0437 \u043e\u0440\u0443\u0436\u0438\u044f|\u0443\u0440\u043e\u043d \u043e\u0442 \u0430\u0442\u0430\u043a\u0438 \u043e\u0440\u0443\u0436\u0438\u0435\u043c|\u0443\u0440\u043e\u043d):\s*([^;]+)/i);
    var finalDamage = damage && /^\s*[\d.,]+(?:\s*[+\u2212-]\s*[\d.,]+)+\s*$/.test(damage[1]) ? arithmeticExpressionNumber(damage[1], 0) : null;
    var critical = combatState().criticalEnabled ? action.criticalData : null;
    var firstSeparator = code.indexOf(';');
    var first = firstSeparator === -1 ? code : code.slice(0, firstSeparator);
    var rest = firstSeparator === -1 ? '' : code.slice(firstSeparator + 1).replace(/^\s*/, '');
    var parts = [first];
    if (finalDamage !== null) parts.push('[b]\u0418\u0442\u043e\u0433\u043e\u0432\u044b\u0439 \u0443\u0440\u043e\u043d: ' + finalDamage + '[/b]');
    if (critical && critical.eligible && critical.chance) parts.push('[b]\u0418\u0442\u043e\u0433\u043e\u0432\u044b\u0439 \u0448\u0430\u043d\u0441 \u043a\u0440\u0438\u0442\u0430: ' + critical.chance + '%[/b]');
    if (rest) parts.push(rest);
    var chakraNote = actionChakraNote(action, index, ledger);
    if (chakraNote) parts.push(chakraNote);
    if (critical && critical.eligible && critical.chance) {
      parts.push('\u0431\u0430\u0437\u043e\u0432\u044b\u0439 \u0448\u0430\u043d\u0441 \u043a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u043e\u0433\u043e \u043f\u043e\u043f\u0430\u0434\u0430\u043d\u0438\u044f: ' + critical.base + '% + ' + critical.effects + '%');
      parts.push('\u0434\u0438\u0430\u043f\u0430\u0437\u043e\u043d \u0443\u0441\u043f\u0435\u0445\u0430 \u043a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u043e\u0433\u043e \u043f\u043e\u043f\u0430\u0434\u0430\u043d\u0438\u044f: ' + critical.threshold + '\u2013100');
      parts.push('\u043a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u0443\u0440\u043e\u043d: ' + critical.criticalDamage);
      parts.push('\u0431\u0440\u043e\u0441\u043e\u043a \u043a\u0440\u0438\u0442\u0430: ' + CRITICAL_DICE_MARKER);
      if (critical.pointChance) parts.push('\u043a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u0430\u044f \u0442\u043e\u0447\u043a\u0430 \u00ab' + critical.target + '\u00bb: \u0438\u0442\u043e\u0433\u043e\u0432\u044b\u0439 \u0448\u0430\u043d\u0441 ' + critical.pointChance + '%; \u0434\u0438\u0430\u043f\u0430\u0437\u043e\u043d \u0443\u0441\u043f\u0435\u0445\u0430 ' + critical.pointThreshold + '\u2013100; \u043f\u043e\u0441\u043b\u0435\u0434\u0441\u0442\u0432\u0438\u0435 \u043e\u043f\u0440\u0435\u0434\u0435\u043b\u044f\u0435\u0442 \u0413\u041c, \u0437\u0430\u0449\u0438\u0442\u0430 \u043e\u0431\u043b\u0430\u0441\u0442\u0438 \u0443\u0447\u0438\u0442\u044b\u0432\u0430\u0435\u0442\u0441\u044f \u043f\u0435\u0440\u0432\u043e\u0439');
    }
    return parts.filter(Boolean).join('; ');
  }

  function buildBbcode() {
    var left = remaining();
    var chakra = chakraLedger();
    var health = healthLedger();
    var combat = combatState();
    var lines = ['[spoiler="\u0422\u0435\u0445\u0447\u0430\u0441\u0442\u044c"]', '[b]\u041f\u0435\u0440\u0441\u043e\u043d\u0430\u0436:[/b] ' + state.character.name, '[b]HP \u043d\u0430 \u043d\u0430\u0447\u0430\u043b\u043e \u0445\u043e\u0434\u0430:[/b] ' + health.start + '/' + health.max, '[b]\u0427\u0430\u043a\u0440\u0430 \u043d\u0430 \u043d\u0430\u0447\u0430\u043b\u043e \u0445\u043e\u0434\u0430:[/b] \u043e\u0431\u0449\u0430\u044f ' + combatNumber('general', statValue('chakraTotal')) + '/' + statValue('chakraTotal') + '; \u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u0430\u044f ' + combatNumber('focused', statValue('chakraFocused')) + '/' + chakra.limit, '[b]\u0420\u0430\u0441\u0445\u043e\u0434:[/b] \u041e\u0414 ' + left.spentOD + '/' + actionTotal('ordinary') + '; \u041e\u0422 ' + left.spentOT + '/' + actionTotal('technique')];
    if (combat.criticalEnabled) lines.push('[b]\u041a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u0443\u0440\u043e\u043d \u0443\u0447\u0438\u0442\u044b\u0432\u0430\u0435\u0442\u0441\u044f:[/b] \u0434\u0430');
    if (health.regenerated) lines.push('[b]\u0412\u044b\u0441\u043e\u043a\u0438\u0439 \u043d\u0430\u0432\u044b\u043a \u0422\u0430\u0439\u0434\u0437\u044e\u0446\u0443:[/b] \u0432\u043e\u0441\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d\u043e 1 HP \u0432 \u043d\u0430\u0447\u0430\u043b\u0435 \u0445\u043e\u0434\u0430');
    var environment = environmentPenaltyData();
    if (environment.base) lines.push('[b]\u0418\u0441\u0445\u043e\u0434\u043d\u044b\u0439 \u0448\u0442\u0440\u0430\u0444 \u043e\u043a\u0440\u0443\u0436\u0435\u043d\u0438\u044f:[/b] \u2212' + environment.base, '[b]\u0418\u0442\u043e\u0433\u043e\u0432\u044b\u0439 \u0448\u0442\u0440\u0430\u0444 \u043e\u043a\u0440\u0443\u0436\u0435\u043d\u0438\u044f:[/b] \u2212' + environment.effective, '[b]\u0421\u043d\u0438\u0436\u0435\u043d\u0438\u0435 \u0448\u0442\u0440\u0430\u0444\u0430 \u043e\u043a\u0440\u0443\u0436\u0435\u043d\u0438\u044f:[/b] ' + (environment.ignored ? '\u0411\u044c\u044f\u043a\u0443\u0433\u0430\u043d, \u0438\u0433\u043d\u043e\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435 100%' : environment.reducedByAbility ? '\u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u044c, \u0441\u043d\u0438\u0436\u0435\u043d\u0438\u0435 50%' : environment.reducedByTaijutsu ? '\u0422\u0430\u0439\u0434\u0437\u044e\u0446\u0443 8, \u0441\u043d\u0438\u0436\u0435\u043d\u0438\u0435 50%' : '\u043d\u0435\u0442'));
    passiveAbilityNotes().forEach(function (note) { lines.push('[b]\u0410\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0447\u0435\u0441\u043a\u0430\u044f \u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u044c:[/b] ' + note); });
    if (!combat.firstTurn) {
      if (combat.counterAttack) lines.push('[b]\u0422\u0438\u043f \u0445\u043e\u0434\u0430:[/b] \u043a\u043e\u043d\u0442\u0440-\u0430\u0442\u0430\u043a\u0430');
      if (combat.preparedReplacement) lines.push('[b]\u041f\u043e\u0434\u0433\u043e\u0442\u043e\u0432\u043b\u0435\u043d\u043d\u0430\u044f \u0442\u0435\u0445\u043d\u0438\u043a\u0430:[/b] \u0422\u0435\u0445\u043d\u0438\u043a\u0430 \u0417\u0430\u043c\u0435\u043d\u044b');
    }
    (combat.effects || []).forEach(function (effect) {
        var detail = effect.type === 'buff' ? statLabel(effect.stat) + ' ' + (effect.modifier >= 0 ? '+' : '') + effect.modifier : (effect.amount ? '\u0443\u0440\u043e\u043d ' + effect.amount : effect.detail || '\u0430\u043a\u0442\u0438\u0432\u0435\u043d');
        lines.push('[b]\u042d\u0444\u0444\u0435\u043a\u0442 \u043d\u0430 \u043d\u0430\u0447\u0430\u043b\u043e \u0445\u043e\u0434\u0430:[/b] ' + (effect.label || effect.type) + ' \u2014 ' + detail + (effect.source ? '; \u0438\u0441\u0442\u043e\u0447\u043d\u0438\u043a: ' + effect.source : ''));
        if (effect.type === 'buff' && !effect.duration) lines.push('[b]\u041c\u043e\u0434\u0438\u0444\u0438\u043a\u0430\u0442\u043e\u0440 \u043f\u0430\u0440\u0430\u043c\u0435\u0442\u0440\u0430 ' + statLabel(effect.stat) + ':[/b] ' + effect.modifier);
        if (effect.type === 'buff' && effect.duration > 1) lines.push('[b]\u042d\u0444\u0444\u0435\u043a\u0442 \u043f\u0440\u0435\u043f\u0430\u0440\u0430\u0442\u0430 \u043d\u0430 \u0441\u043b\u0435\u0434\u0443\u044e\u0449\u0438\u0439 \u0445\u043e\u0434:[/b] ' + statLabel(effect.stat) + ' ' + (effect.modifier >= 0 ? '+' : '') + effect.modifier + '; \u043e\u0441\u0442\u0430\u043b\u043e\u0441\u044c \u0445\u043e\u0434\u043e\u0432: ' + (effect.duration - 1));
    });
    lines.push('');
    state.actions.forEach(function (action, index) {
      lines.push('[b]' + (index + 1) + '. ' + action.label + '[/b]');
      lines.push(formatBattleActionLine(action, index, chakra));
      if (action.buffKey && action.effectDuration > 1) lines.push('[b]\u042d\u0444\u0444\u0435\u043a\u0442 \u043f\u0440\u0435\u043f\u0430\u0440\u0430\u0442\u0430 \u043d\u0430 \u0441\u043b\u0435\u0434\u0443\u044e\u0449\u0438\u0439 \u0445\u043e\u0434:[/b] ' + statLabel(action.buffKey) + ' ' + (action.buffModifier >= 0 ? '+' : '') + action.buffModifier + '; \u043e\u0441\u0442\u0430\u043b\u043e\u0441\u044c \u0445\u043e\u0434\u043e\u0432: ' + (action.effectDuration - 1));
      lines.push('');
    });
    var inventorySpent = inventoryUsage();
    var spentItems = (state.character.inventory || []).filter(function (item) { return inventorySpent[item.inventoryId]; });
    if (spentItems.length) lines.push('[b]\u0418\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u043d\u044b\u0435 \u0440\u0430\u0441\u0445\u043e\u0434\u043d\u0438\u043a\u0438:[/b] ' + spentItems.map(function (item) { return item.name + ' \u2014 ' + inventorySpent[item.inventoryId] + ' ' + item.unit + ' (\u043e\u0441\u0442\u0430\u0442\u043e\u043a ' + inventoryRemaining(item) + ' ' + item.unit + ')'; }).join('; '));
    (state.character.artifacts || []).filter(function (item) { return item.passiveEnabled !== false && item.passive && Object.keys(item.passive).length; }).forEach(function (item) { lines.push('[b]\u0410\u043a\u0442\u0438\u0432\u0435\u043d \u044d\u0444\u0444\u0435\u043a\u0442 \u0430\u0440\u0442\u0435\u0444\u0430\u043a\u0442\u0430:[/b] ' + item.name); });
    lines.push('[b]HP \u043d\u0430 \u043a\u043e\u043d\u0435\u0446 \u0445\u043e\u0434\u0430:[/b] ' + health.current + '/' + health.max);
    if (health.unconscious) lines.push('[color=#c62828][b]\u0412\u044b \u043f\u043e\u0442\u0435\u0440\u044f\u043b\u0438 \u0441\u043e\u0437\u043d\u0430\u043d\u0438\u0435 \u043f\u0440\u0438 ' + health.current + ' HP.[/b][/color]');
    lines.push('[b]\u0427\u0430\u043a\u0440\u0430 \u043d\u0430 \u043a\u043e\u043d\u0435\u0446 \u0445\u043e\u0434\u0430:[/b] \u043e\u0431\u0449\u0430\u044f ' + chakra.general + '/' + statValue('chakraTotal') + '; \u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u0430\u044f ' + chakra.focused + '/' + chakra.limit);
    if (!combat.firstTurn) {
      ['speed', 'strength', 'defense', 'critical'].forEach(function (type) {
        var labels = { speed: '\u0423\u0441\u043a\u043e\u0440\u0435\u043d\u0438\u0435', strength: '\u0423\u0432\u0435\u043b\u0438\u0447\u0435\u043d\u0438\u0435 \u0441\u0438\u043b\u044b', defense: '\u0423\u0432\u0435\u043b\u0438\u0447\u0435\u043d\u0438\u0435 \u0437\u0430\u0449\u0438\u0442\u044b', critical: '\u0423\u0441\u0438\u043b\u0435\u043d\u0438\u0435 \u043a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u043e\u0433\u043e \u0448\u0430\u043d\u0441\u0430' };
        var usedNow = state.actions.some(function (action) { return action.enhancementType === type; });
        // \u041f\u0440\u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u043a\u0435 \u043f\u0440\u043e\u0448\u043b\u043e\u0433\u043e \u043f\u043e\u0441\u0442\u0430 \u0441\u0447\u0451\u0442\u0447\u0438\u043a \u0443\u0436\u0435 \u043f\u0435\u0440\u0435\u0432\u043e\u0434\u0438\u0442\u0441\u044f \u043d\u0430 \u0442\u0435\u043a\u0443\u0449\u0438\u0439 \u0445\u043e\u0434.
        // \u0412 \u0438\u0442\u043e\u0433\u043e\u0432\u043e\u0439 \u0442\u0435\u0445\u0447\u0430\u0441\u0442\u0438 \u0441\u043e\u0445\u0440\u0430\u043d\u044f\u0435\u043c \u0442\u0435\u043a\u0443\u0449\u0435\u0435 \u0437\u043d\u0430\u0447\u0435\u043d\u0438\u0435, \u0447\u0442\u043e\u0431\u044b \u043d\u0435 \u043f\u0440\u0438\u0431\u0430\u0432\u043b\u044f\u0442\u044c \u0445\u043e\u0434 \u0434\u0432\u0430\u0436\u0434\u044b.
        var turns = usedNow ? 0 : Math.min(3, Math.max(0, parseInt(combat.cooldowns[type], 10) || 0));
        if (usedNow || turns < 3) lines.push('[b]' + labels[type] + ' \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u043e ' + turns + ' \u0445\u043e\u0434(\u0430) \u043d\u0430\u0437\u0430\u0434[/b]');
      });
      if (sacrificeAlreadyUsed()) lines.push('[b]\u0416\u0435\u0440\u0442\u0432\u0430 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0430:[/b] \u0434\u0430');
    }
    if (chakra.cloneGroups.length) { lines.push(''); lines = lines.concat(cloneGroupsBbcode(chakra.cloneGroups)); }
    lines.push('[/spoiler]');
    return lines.join('\n');
  }

  function insertBbcode() {
    var textarea = state.textarea || findReplyTextarea();
    if (!textarea || !state.character || !state.actions.length) return;
    if (combatState().hp === '' || !isFinite(Number(combatState().hp))) {
      setStatus('\u0412\u0432\u0435\u0434\u0438\u0442\u0435 HP \u043d\u0430 \u043d\u0430\u0447\u0430\u043b\u043e \u0445\u043e\u0434\u0430 \u043f\u0435\u0440\u0435\u0434 \u0432\u0441\u0442\u0430\u0432\u043a\u043e\u0439.', 'error');
      return;
    }
    var code = buildBbcode();
    var prefix = textarea.value && !/\n$/.test(textarea.value) ? '\n\n' : '';
    textarea.value += prefix + code;
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    closeModal();
    insertNativeCriticalDice(textarea);
  }

  function insertNativeCriticalDice(textarea) {
    var markerIndex = textarea.value.indexOf(CRITICAL_DICE_MARKER);
    while (markerIndex !== -1) {
      textarea.setRangeText('', markerIndex, markerIndex + CRITICAL_DICE_MARKER.length, 'end');
      textarea.focus();
      textarea.setSelectionRange(markerIndex, markerIndex);
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      var diceButton = typeof window.dice === 'function' ? null : document.querySelector('#button-dice button, #button-dice');
      var diceAction = typeof window.dice === 'function' ? function () { window.dice(); } : diceButton && typeof diceButton.click === 'function' ? function () { diceButton.click(); } : null;
      if (diceAction) {
        var originalPrompt = window.prompt;
        var diceAnswers = ['1', '100'];
        window.prompt = function () { return diceAnswers.shift() || '100'; };
        try { diceAction(); }
        finally { window.prompt = originalPrompt; }
      } else {
        textarea.setRangeText('[\u0432\u0441\u0442\u0430\u0432\u044c\u0442\u0435 \u0431\u0440\u043e\u0441\u043e\u043a \u043a\u043d\u043e\u043f\u043a\u043e\u0439 \u00ab\u041a\u0443\u0431\u0438\u043a\u0438\u00bb]', markerIndex, markerIndex, 'end');
        window.alert('\u041a\u043d\u043e\u043f\u043a\u0430 \u00ab\u041a\u0443\u0431\u0438\u043a\u0438\u00bb \u0440\u0435\u0434\u0430\u043a\u0442\u043e\u0440\u0430 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u0430. \u0412\u0441\u0442\u0430\u0432\u044c\u0442\u0435 \u0431\u0440\u043e\u0441\u043e\u043a \u0432\u0440\u0443\u0447\u043d\u0443\u044e.');
        break;
      }
      markerIndex = textarea.value.indexOf(CRITICAL_DICE_MARKER);
    }
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function openModal() {
    state.nodes.overlay.classList.add('is-open');
    document.documentElement.classList.add('aba-modal-open');
    if (!state.characters.length) loadCharacters(false);
  }

  function closeModal() {
    state.nodes.overlay.classList.remove('is-open');
    document.documentElement.classList.remove('aba-modal-open');
    state.nodes.preview.hidden = true;
    if (state.nodes.instruction) state.nodes.instruction.hidden = true;
  }

  function buildUi() {
    if (state.uiBuilt) return;
    var style = document.createElement('style');
    style.textContent = [
      '.aba-modal-open{overflow:hidden}',
      '.ats-launcher-wrap,.aba-launcher-wrap{gap:8px}',
      '.aba-launcher-wrap{display:flex;position:relative;width:100%;box-sizing:border-box;justify-content:flex-end;align-items:center;margin:16px 0 20px;padding:0 12px;clear:both}',
      '.aba-launcher-button{display:inline-flex;width:140px!important;max-width:100%;min-width:0!important;min-height:34px;box-sizing:border-box;margin:0!important;padding:6px 11px!important;border:1px solid var(--color-link)!important;border-radius:5px!important;background:transparent!important;color:var(--color-link,#863030)!important;align-items:center;justify-content:center;cursor:pointer;font:700 9.5px/1.2 var(--font-1)!important;letter-spacing:.2px;text-transform:uppercase;transition:.25s ease}',
      '.aba-launcher-button:hover,.aba-launcher-button:focus-visible{background:var(--color-link,#863030)!important;color:var(--color-txt3,#f5f1f1)!important;outline:0;transform:translateY(-1px)}',
      '.aba-overlay{--aba-accent:var(--color-link,#863030);--aba-hover:var(--color-hover,#b03b3b);--aba-surface:var(--color-forum,#f5f1f1);--aba-panel:var(--color-qv,#fbf8f8);--aba-soft:var(--color-lnthoverbg,#e8e3e3);--aba-text:var(--color-txt1,#282627);--aba-muted:var(--color-underava,#746b69);display:none;position:fixed;z-index:100100;inset:0;box-sizing:border-box;padding:2vh 2vw;background:var(--color-glass,rgba(0,0,0,.76));color:var(--aba-text);font-family:var(--font-1,"Russo One",Arial,sans-serif)}',
      '.aba-overlay.is-open{display:flex}',
      '.aba-overlay button,.aba-overlay input,.aba-overlay select,.aba-overlay textarea{font-family:var(--font-1,"Russo One",Arial,sans-serif)!important}',
      '.aba-modal{display:flex;flex-direction:column;width:min(1440px,100%);height:96vh;margin:auto;border:1px solid var(--color-sub-border,#5b4c4c);border-radius:14px 48px 24px 24px;background:var(--aba-surface);box-shadow:-7px 8px 25px var(--shedow1,rgba(0,0,0,.5));overflow:hidden}',
      '.aba-head{display:flex;align-items:center;justify-content:space-between;padding:15px 20px;background:var(--aba-accent);color:var(--color-txt3,#fff)}',
      '.aba-head h2{margin:0!important;color:inherit!important;font:400 22px/1.2 var(--font-1,"Russo One",sans-serif)!important;text-transform:uppercase}',
      '.aba-head-actions{display:flex;align-items:center;gap:10px}',
      '.aba-help{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border:1px solid rgba(255,255,255,.7);border-radius:50%;background:transparent;color:inherit;font:700 18px/1 Arial;cursor:pointer}',
      '.aba-close{border:0;background:transparent;color:inherit;font:30px/1 Arial;cursor:pointer;transition:transform .25s}.aba-close:hover{transform:rotate(90deg)}',
      '.aba-builder-tabs{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;padding:4px;border:1px solid var(--aba-soft);border-radius:12px;background:var(--aba-soft)}.aba-builder-tabs button{flex:1 1 180px;min-height:42px;border:1px solid transparent;border-radius:10px 20px 10px 10px;background:transparent;color:var(--aba-text);cursor:pointer;font-weight:800}.aba-builder-tabs button.is-active{border-color:var(--aba-accent);background:var(--aba-panel);color:var(--aba-accent)}',
      '.aba-instruction{position:fixed;z-index:100110;left:24px;right:24px;top:24px;bottom:24px;width:auto;height:calc(100vh - 48px);max-width:none;max-height:none;border:1px solid var(--aba-accent);border-radius:18px 30px 18px 18px;background:var(--aba-surface);box-shadow:-7px 8px 22px rgba(0,0,0,.35);overflow:hidden}',
      '.aba-instruction-shell{display:flex;flex-direction:column;max-height:100%}',
      '.aba-instruction-header{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:var(--aba-accent);color:#fff}',
      '.aba-instruction-header strong{font-weight:800}',
      '.aba-instruction-close{border:0;background:transparent;color:#fff;font-size:25px;cursor:pointer}',
      '.aba-instruction-tabs{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;padding:10px;border-bottom:1px solid var(--aba-soft)}.aba-instruction-tab{min-height:36px;border:1px solid var(--aba-soft);border-radius:8px 14px 8px 8px;background:var(--aba-soft);color:var(--aba-text);cursor:pointer}.aba-instruction-tab.is-active{border-color:var(--aba-accent);background:var(--aba-panel);color:var(--aba-accent)}',
      '.aba-instruction-body{padding:12px 14px 16px;overflow:auto}',
      '.aba-instruction-body h3{margin:0 0 8px;color:var(--aba-accent);font-weight:800;text-transform:uppercase}',
      '.aba-instruction-body p{margin:0 0 8px;color:var(--aba-muted);line-height:1.5}',
      '.aba-instruction-body ul{margin:0;padding-left:20px;color:var(--aba-text);line-height:1.6}',
      '.aba-action-types.is-hidden{display:none}',
      '.aba-character-field{min-width:0;display:grid;gap:6px}.aba-character-picker{position:relative;min-width:0}.aba-character-picker>summary{cursor:pointer;list-style:none;box-sizing:border-box;min-height:42px;padding:11px 30px 11px 12px;border:1px solid var(--aba-soft);border-radius:10px;background:var(--aba-panel);font:inherit;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.aba-character-picker>summary::-webkit-details-marker{display:none}.aba-character-picker>summary:after{content:"\u25be";position:absolute;right:12px}.aba-character-dropdown{position:absolute;top:calc(100% + 6px);left:0;right:0;z-index:30;padding:10px;border:1px solid var(--aba-soft);border-radius:12px;background:var(--aba-panel);box-shadow:0 8px 24px #0003;max-height:min(420px,55vh);overflow:auto}.aba-character-dropdown .aba-character-search{width:100%;box-sizing:border-box;height:36px;padding:7px 10px;border:1px solid var(--aba-soft);border-radius:7px;background:var(--aba-bg);color:var(--aba-text);font:inherit!important}.aba-top .aba-npc-toggle{display:flex;flex-direction:row;align-items:center;gap:7px;margin:9px 0;font:inherit;cursor:pointer}.aba-npc-toggle input{width:16px;height:16px;margin:0}.aba-character-results{display:grid;gap:3px;margin-top:6px}.aba-character-results button{display:block;width:100%;text-align:left;padding:9px 10px!important;border:0!important;border-radius:6px!important;background:transparent!important;color:var(--aba-text)!important;font:inherit!important;text-transform:none!important;white-space:normal}.aba-character-results button:hover,.aba-character-results button:focus-visible{background:var(--aba-soft)!important}.aba-character-results small{display:block;font-size:11px;opacity:.7;margin-top:3px}.aba-character-field>select[hidden]{display:none!important}',
      '.aba-top{display:grid;grid-template-columns:minmax(280px,1fr) auto auto;gap:10px;align-items:end;padding:12px 16px;border-bottom:1px solid var(--aba-soft)}',
      '.aba-top label,.aba-action-editor label{display:flex;flex-direction:column;gap:6px;font-weight:700}',
      '.aba-top select,.aba-action-editor select,.aba-action-editor input{width:100%;height:42px;box-sizing:border-box!important;border:1px solid var(--aba-soft)!important;border-radius:10px!important;padding:8px 12px!important;background:var(--aba-panel)!important;color:var(--aba-text)!important;font:600 13px/1.2 var(--font-1,"Russo One",Arial,sans-serif)!important;text-transform:none!important}',
      '.aba-refresh{height:42px;border:1px solid var(--aba-accent);border-radius:10px;padding:8px 14px;background:transparent;color:var(--aba-accent);cursor:pointer;font-weight:800;text-transform:uppercase}',
      '.aba-resources{display:flex;min-width:0;flex-wrap:wrap;gap:8px}.aba-resources span{display:flex;min-width:135px;min-height:52px;box-sizing:border-box;flex:1 1 135px;flex-direction:column;padding:6px 10px;border-radius:10px;background:var(--aba-soft);align-items:center;justify-content:center;gap:2px;text-align:center}.aba-resources small{max-width:100%;line-height:1.1;white-space:normal}.aba-resources b{font-size:17px;line-height:1.1;color:var(--aba-accent);white-space:nowrap}.aba-resources .aba-hp-unconscious{border:2px solid #c62828;background:rgba(198,40,40,.1)}.aba-resources .aba-hp-unconscious b,.aba-resources .aba-hp-unconscious em,.aba-consciousness-warning{color:#c62828!important}.aba-resources .aba-hp-unconscious em{font-size:11px;font-style:normal;font-weight:800}.aba-consciousness-warning{display:block;margin-top:6px}',
      '.aba-taijutsu-rules{margin-top:10px;border:1px solid var(--aba-soft);border-radius:10px;background:var(--aba-panel);overflow:hidden}.aba-taijutsu-rules summary{padding:10px 12px;color:var(--aba-accent);font-weight:800;cursor:pointer}.aba-taijutsu-rules>div{padding:0 12px 8px}.aba-taijutsu-rules p{margin:0 0 6px;line-height:1.4}',
      '.aba-status{padding:7px 16px;color:var(--aba-muted);font-size:12px}.aba-status.is-error,.aba-error{color:var(--aba-hover)}.aba-status.is-loading,.aba-loading{color:#8c651c}',
      '.aba-body{display:grid;grid-template-columns:minmax(0,1fr) 390px;min-height:0;flex:1;border-top:1px solid var(--aba-soft)}',
      '.aba-main{min-width:0;overflow:auto;padding:14px}.aba-side{display:flex;flex-direction:column;min-height:0;border-left:1px solid var(--aba-soft);background:var(--aba-panel)}',
      '.aba-character-summary{margin-bottom:12px;padding:12px;border-radius:12px 28px 12px 12px;background:var(--aba-soft)}',
      '.aba-turn-setup{margin-bottom:12px;padding:12px;border:1px solid var(--aba-soft);border-radius:12px 30px 16px 16px;background:var(--aba-panel)}.aba-turn-setup[hidden]{display:none}.aba-turn-heading{display:flex;gap:12px;align-items:center;justify-content:space-between}.aba-turn-heading>.aba-check{margin:0}.aba-previous-source{display:grid;grid-template-columns:minmax(240px,1fr) auto;gap:8px;margin-top:10px;align-items:end}.aba-previous-source>span{grid-column:1/-1;color:var(--aba-muted);font-size:12px}.aba-turn-setup label{display:flex;flex-direction:column;gap:5px;font-weight:700}.aba-turn-setup input,.aba-turn-setup select{width:100%;height:40px;box-sizing:border-box;border:1px solid var(--aba-soft);border-radius:9px;padding:7px 10px;background:var(--aba-surface);color:var(--aba-text)}.aba-turn-setup input[readonly]{border-color:transparent;background:var(--aba-soft);cursor:not-allowed;opacity:.9}.aba-turn-values{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px}.aba-turn-modifiers h4{margin:14px 0 5px;color:var(--aba-accent);text-transform:uppercase}.aba-cooldowns{display:grid;grid-template-columns:auto repeat(3,minmax(145px,1fr)) auto;gap:8px;margin-top:10px;align-items:center}.aba-cooldowns label:not(.aba-check){display:grid;grid-template-columns:1fr 58px;gap:2px 6px;padding:7px 9px;border-radius:9px;background:var(--aba-soft);align-items:center}.aba-cooldowns label:not(.aba-check) small{grid-column:1/-1;color:var(--aba-muted)}.aba-cooldowns .aba-check{margin:0}.aba-start-effects{display:grid;gap:7px}.aba-start-effect-row{display:grid;grid-template-columns:minmax(190px,.8fr) minmax(180px,1fr) minmax(150px,.8fr);gap:7px;align-items:end}.aba-start-effect-row>.aba-check{margin:0}.aba-effect-value{padding:6px 8px;border-radius:8px;background:var(--aba-soft)}.aba-start-active-list,.aba-active-effect-list{max-height:260px;margin-top:8px;overflow:auto;padding-right:3px}',
      '.aba-character-title{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:9px}.aba-character-title-left{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.aba-character-title strong{font-size:1.05em}.aba-character-level{display:inline-flex;align-items:center;color:var(--aba-accent);font-weight:700;letter-spacing:.02em}.aba-character-title a{color:var(--aba-accent);font-weight:700}',
      '.aba-stat-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}.aba-stat-grid span{display:flex;flex-direction:column;padding:7px 9px;border-radius:8px;background:var(--aba-panel)}.aba-stat-grid small{color:var(--aba-muted)}.aba-stat-grid b{font-size:14px}',
      '.aba-action-types{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-bottom:10px}.aba-action-types button,.aba-option-grid button{display:flex;flex-direction:column;gap:4px;border:1px solid transparent;border-radius:10px 24px 10px 10px;padding:11px;background:var(--aba-soft);color:var(--aba-text);text-align:left;cursor:pointer}.aba-action-types button:hover,.aba-action-types button.is-active,.aba-option-grid button:hover,.aba-option-grid button.is-active{border-color:var(--aba-accent);background:var(--aba-panel)}.aba-action-types span,.aba-option-grid strong{font-weight:800}.aba-action-types small,.aba-option-grid small{color:var(--aba-muted);line-height:1.3}',
      '.aba-builder-panel{padding:12px;border:1px solid var(--aba-soft);border-radius:12px 30px 18px 18px;background:var(--aba-panel)}.aba-option-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.aba-action-editor{margin-top:12px;padding-top:12px;border-top:1px solid var(--aba-soft)}.aba-action-editor-direct{margin-top:0;padding-top:0;border-top:0}.aba-action-editor h4{margin:0 0 8px;color:var(--aba-accent);font:400 17px/1.2 var(--font-1);text-transform:uppercase}.aba-action-editor p{margin:7px 0;line-height:1.5}.aba-inline{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.aba-condition-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:7px}.aba-check{display:flex!important;min-height:40px;box-sizing:border-box;flex-direction:row!important;align-items:center;gap:9px;margin:9px 0;padding:7px 10px;border:1px solid transparent;border-radius:8px 18px 8px 8px;background:var(--aba-soft);cursor:pointer;transition:.2s ease}.aba-check:hover{border-color:var(--aba-accent);background:var(--aba-panel)}.aba-check:has(input:checked){border-color:var(--aba-accent);background:var(--aba-panel);color:var(--aba-accent)}.aba-condition-grid .aba-check{margin:0;font-size:12px}.aba-check input{width:17px!important;height:17px!important;flex:0 0 auto;accent-color:var(--aba-accent)}.aba-enhance-fields{display:grid;grid-template-columns:minmax(0,1fr) 130px;gap:8px;margin-top:8px;padding:10px;border:1px solid var(--aba-soft);border-radius:10px 24px 10px 10px;background:var(--aba-surface);align-items:end}.aba-tech-weaken-fields[hidden],.aba-tech-boost-fields[hidden],.aba-enhance-fields[hidden],.aba-two-turn-effect[hidden],.aba-summon-name[hidden],.aba-summon-description[hidden],.aba-summon-mode[hidden],.aba-summon-rank[hidden],.aba-summon-basic[hidden],.aba-summon-named[hidden]{display:none!important}.aba-enhance-kind{display:flex;min-height:42px;box-sizing:border-box;flex-direction:column;justify-content:center;padding:7px 11px;border-radius:9px;background:var(--aba-soft)}.aba-enhance-kind small{color:var(--aba-muted)}.aba-enhance-fields .aba-note{grid-column:1/-1;margin:0}.aba-seal-options{margin-top:8px;padding-top:5px;border-top:1px solid var(--aba-panel)}.aba-two-turn-effect{margin-top:8px}.aba-note{color:var(--aba-muted)}',
      '.aba-modifiers{margin:10px 0;border:1px solid var(--aba-soft);border-radius:10px 24px 10px 10px;background:var(--aba-surface);overflow:hidden}.aba-modifiers>summary{display:flex;min-height:42px;box-sizing:border-box;padding:9px 13px;color:var(--aba-accent);align-items:center;justify-content:space-between;cursor:pointer;font-weight:900;text-transform:uppercase;list-style:none}.aba-modifiers>summary::-webkit-details-marker{display:none}.aba-modifiers>summary:after{content:"\uff0b";font-size:18px;line-height:1}.aba-modifiers[open]>summary:after{content:"\u2212"}.aba-modifiers-body{padding:0 10px 10px;border-top:1px solid var(--aba-soft)}',
      '.aba-tech-boost-fields[hidden]{display:none!important}.aba-tech-boost{display:grid;gap:8px;margin-top:8px}.aba-tech-boost>.aba-check{margin:0}.aba-tech-boost-fields{display:grid;gap:5px;padding:9px 11px;border:1px solid var(--aba-soft);border-radius:9px 20px 9px 9px;background:var(--aba-surface)}',
      '.aba-guide{margin:0 0 12px;border:1px solid var(--aba-soft);border-radius:10px 26px 12px 12px;background:var(--aba-panel);overflow:hidden}.aba-guide summary{padding:11px 14px;color:var(--aba-accent);font-weight:700!important;text-transform:uppercase;cursor:pointer;list-style:none}.aba-guide summary::-webkit-details-marker{display:none}.aba-guide summary:after{content:"\uff0b";float:right}.aba-guide[open] summary:after{content:"\u2212"}.aba-guide ol{margin:0;padding:0 18px 14px 34px;color:var(--aba-muted);line-height:1.55}.aba-guide li+li{margin-top:5px}',
      '.aba-primary{margin-top:10px;border:1px solid var(--aba-accent);border-radius:8px 18px 8px 8px;padding:10px 14px;background:var(--aba-accent);color:var(--color-txt3,#fff);cursor:pointer;font-weight:800;text-transform:uppercase}.aba-primary:hover{background:var(--aba-hover)}.aba-primary:disabled{opacity:.45;cursor:not-allowed}',
      '.aba-builder-message{min-height:18px;margin-top:7px;font-weight:700}.aba-builder-message.is-error{color:var(--aba-hover)}.aba-builder-message.is-success{color:#2f8a62}',
      '.aba-tech-list{max-height:280px;margin-top:9px;overflow:auto}.aba-tech-option{display:grid!important;grid-template-columns:auto minmax(0,1fr) auto;gap:9px!important;align-items:center;margin:5px 0;padding:9px!important;border:1px solid transparent;border-radius:9px 22px 9px 9px;background:var(--aba-soft);cursor:pointer}.aba-tech-option:has(input:checked){border-color:var(--aba-accent)}.aba-tech-option input{width:auto!important;height:auto!important}.aba-tech-option span{display:flex;flex-direction:column}.aba-tech-option small{color:var(--aba-muted)}.aba-tech-option button{width:28px;height:28px;border:1px solid var(--aba-accent);border-radius:50%;background:transparent;color:var(--aba-accent);cursor:pointer;font-weight:900}',
      '.aba-summary{display:flex;flex-direction:column;gap:4px;margin-top:8px;padding:10px;border-radius:9px 22px 9px 9px;background:var(--aba-soft)}',
      '.aba-side h3{margin:0;padding:14px 15px 8px;color:var(--aba-accent);font:400 17px/1.2 var(--font-1);text-transform:uppercase}.aba-queue{min-height:0;overflow:auto;padding:5px 10px;flex:1}.aba-queue-item{display:grid;grid-template-columns:30px minmax(0,1fr) 28px;gap:8px;margin:6px 0;padding:9px;border:1px solid var(--aba-soft);border-radius:9px 22px 9px 9px;background:var(--aba-surface)}.aba-number{display:flex;width:28px;height:28px;border-radius:50%;background:var(--aba-accent);color:#fff;align-items:center;justify-content:center;font-weight:800}.aba-queue-item p{margin:3px 0}.aba-queue-item em{display:block;margin:3px 0;color:var(--aba-accent);font-size:11px}.aba-queue-item small{color:var(--aba-muted)}.aba-queue-item>button{border:0;background:transparent;color:var(--aba-accent);cursor:pointer;font-size:23px}.aba-insert{margin:10px;padding:11px;border:1px solid var(--aba-accent);border-radius:8px 20px 8px 8px;background:var(--aba-accent);color:#fff;cursor:pointer;font-weight:800;text-transform:uppercase}.aba-insert:disabled{opacity:.4;cursor:not-allowed}',
      '@media(max-width:560px){.aba-resources{flex-wrap:wrap}.aba-resources span{flex:1 1 100px;overflow-wrap:anywhere}.aba-clone-actor-builder .aba-option-grid{grid-template-columns:1fr}}',
      '.aba-clone-groups{display:grid;gap:10px}.aba-clone-card{padding:12px;border:1px solid var(--aba-soft);border-radius:12px 25px 12px 12px;background:var(--aba-surface)}.aba-clone-card>strong{color:var(--aba-accent);font-weight:700!important}.aba-clone-card label{display:flex;flex-direction:column;gap:6px;margin:8px 0}.aba-clone-card input{height:40px;width:100%;box-sizing:border-box;border:1px solid var(--aba-soft);border-radius:9px;padding:7px 10px;background:var(--aba-panel);color:var(--aba-text)}.aba-clone-owner-warning{color:#b32424!important;font-weight:700!important;border:1px solid #b32424;border-radius:9px;padding:10px;background:rgba(179,36,36,.06)}.aba-clone-action-host{margin-top:14px}.aba-clone-action-host>h4{color:var(--aba-accent)}.aba-clone-actor-builder .aba-builder-panel{padding:8px}.aba-clone-actor-builder .aba-option-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.aba-clone-allocation[hidden]{display:none!important}',
      '.aba-clone-buttons{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;align-items:stretch!important}.aba-clone-buttons>button{margin:0!important;min-width:0;width:100%;height:44px;box-sizing:border-box}.aba-clone-action-host>.aba-inline>label{display:flex!important;flex-direction:column;gap:8px;width:100%;margin:12px 0}.aba-clone-action-host select{width:100%;height:42px;box-sizing:border-box;border:1px solid var(--aba-soft);border-radius:9px;padding:7px 10px;background:var(--aba-panel);color:var(--aba-text)}',
      '.aba-inventory-picker{display:grid;gap:10px;margin:12px 0;padding:12px;border:1px solid var(--aba-soft);border-radius:12px}.aba-inventory-description,.aba-artifact-effect-info{font-size:13px;line-height:1.6;overflow-wrap:anywhere}.aba-artifact-effects,.aba-inventory-spent{padding:12px;margin-top:12px;border-radius:12px;background:var(--aba-soft)}.aba-artifact-effects label{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:6px 0}.aba-artifact-effects small{flex-basis:100%;padding-left:24px}.aba-artifact-effects input{width:auto!important;height:auto!important}',
      '.aba-buffs{margin-top:14px;padding:14px;border:1px solid var(--aba-soft);border-radius:12px}.aba-buffs h4{margin:0 0 12px}.aba-buff-list{display:grid;gap:10px}.aba-buff-row{display:grid;grid-template-columns:minmax(0,2fr) minmax(80px,1fr) minmax(0,2fr) 38px;gap:8px;align-items:end}.aba-buff-row label{display:flex;flex-direction:column;gap:6px;min-width:0}.aba-buff-row input,.aba-buff-row select{width:100%;height:40px;box-sizing:border-box;border:1px solid var(--aba-soft);border-radius:9px;padding:7px;background:var(--aba-panel);color:var(--aba-text)}.aba-buffs>[data-add-buff]{margin-top:12px}@media(max-width:560px){.aba-buff-row{grid-template-columns:minmax(0,1fr) 90px}.aba-buff-row label:nth-child(3){grid-column:1}.aba-buff-row>button{width:38px;justify-self:end}}',
      '.aba-queue-item>.aba-drag-handle{display:flex!important;border:0!important;background:var(--aba-accent)!important;color:#fff!important;font-size:13px!important;cursor:grab;touch-action:none;user-select:none;margin:0;padding:0}.aba-drag-handle:focus-visible{outline:2px solid var(--aba-accent);outline-offset:3px}.aba-queue-item.is-dragging{opacity:.55}.aba-queue-item.is-drop-before{box-shadow:0 -3px 0 var(--aba-accent)}.aba-queue-item.is-drop-after{box-shadow:0 3px 0 var(--aba-accent)}',
      '.aba-search-picker{margin-top:5px;border:1px solid var(--aba-soft);border-radius:12px;background:var(--aba-surface);overflow:hidden}.aba-search-picker>summary{padding:12px 14px;cursor:pointer;line-height:1.5;font-size:14px!important;font-weight:400!important;text-transform:none!important;overflow-wrap:anywhere}.aba-search-picker[open]>summary{border-bottom:1px solid var(--aba-soft);color:var(--aba-accent)}.aba-search-picker-body{padding:10px;display:grid;gap:8px}.aba-search-picker-results{max-height:240px;overflow:auto;display:grid;gap:5px;overscroll-behavior:contain}.aba-search-picker-results>button{display:block;width:100%;padding:10px 12px;text-align:left;border:1px solid transparent;border-radius:8px;background:var(--aba-panel);color:var(--aba-text);cursor:pointer;text-transform:none!important;white-space:normal;line-height:1.5;font-size:13px!important;font-weight:400!important;overflow-wrap:anywhere}.aba-search-picker-results>button:hover,.aba-search-picker-results>button[aria-pressed=true]{border-color:var(--aba-accent);background:var(--aba-soft)}',
      '.aba-clone-settings{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(240px,100%),1fr));gap:12px;margin:16px 0}.aba-clone-settings>label{margin:0!important}.aba-clone-settings>label:has(select){grid-column:1/-1}.aba-clone-create-preview{padding:12px 16px;margin:12px 0;border:1px solid var(--aba-soft);border-radius:12px;background:var(--aba-panel)}.aba-clone-create-preview p{margin:6px 0;line-height:1.6}.aba-clone-rules{margin-top:22px;padding:18px;border:1px solid var(--aba-soft);border-radius:14px;background:var(--aba-surface)}.aba-clone-rules h5{margin:0 0 14px;color:var(--aba-accent);font-size:15px!important;font-weight:700!important}.aba-clone-rules ul{list-style:none;margin:0;padding:0;display:grid;gap:0}.aba-clone-rules li{position:relative;padding:12px 0 12px 18px;border-top:1px solid var(--aba-soft);font-size:13px!important;line-height:1.7!important;font-weight:400!important;letter-spacing:0!important;overflow-wrap:anywhere}.aba-clone-rules li:first-child{border-top:0;padding-top:0}.aba-clone-rules li:before{content:"";position:absolute;left:0;top:20px;width:5px;height:5px;border-radius:50%;background:var(--aba-accent)}.aba-clone-rules li:first-child:before{top:8px}',
      '.aba-empty{padding:18px;color:var(--aba-muted);text-align:center}.aba-preview{position:fixed;z-index:100110;right:18px;top:70px;width:min(480px,calc(100vw - 36px));height:calc(100vh - 100px);border:1px solid var(--aba-accent);border-radius:12px 34px 18px 18px;background:var(--aba-surface);box-shadow:-7px 8px 22px rgba(0,0,0,.35);overflow:hidden}.aba-preview header{display:flex;padding:12px 14px;background:var(--aba-accent);color:#fff;align-items:center;justify-content:space-between}.aba-preview header div{display:flex;flex-direction:column}.aba-preview header button{border:0;background:transparent;color:#fff;font-size:25px;cursor:pointer}.aba-preview-body{height:calc(100% - 105px);padding:12px;overflow:auto}.aba-preview-link{display:block;padding:10px 14px;border-top:1px solid var(--aba-soft);color:var(--aba-accent);text-align:right;font-weight:800}',
      '.aba-launcher-button{font:200 10px/1.2 var(--font-g,"Nunito Sans",Arial,sans-serif)!important;letter-spacing:.5px!important}',
      '.aba-overlay,.aba-overlay *{font-family:var(--font-g,"Nunito Sans",Arial,sans-serif)!important;font-weight:200!important;letter-spacing:.5px!important}',
      '.aba-head h2{font:200 22px/1.2 var(--font-g,"Nunito Sans",Arial,sans-serif)!important;letter-spacing:.5px!important}',
      '.aba-top select,.aba-action-editor select,.aba-action-editor input,.aba-turn-setup input,.aba-turn-setup select{font:200 13px/1.2 var(--font-g,"Nunito Sans",Arial,sans-serif)!important;letter-spacing:.5px!important}',
      '.aba-refresh{font:200 13px/1.2 var(--font-g,"Nunito Sans",Arial,sans-serif)!important;letter-spacing:.5px!important}',
      '.aba-overlay :is(h1,h2,h3,h4,h5,h6,strong,b,.aba-number,.aba-primary,.aba-insert,.aba-modifiers>summary){font-weight:400!important}',
      '.aba-overlay :is(.aba-action-types span,.aba-option-grid strong,.aba-action-editor h4,.aba-queue-item strong){font-weight:700!important}',
      '@media(max-width:1050px){.aba-overlay{padding:0}.aba-modal{height:100vh;height:100dvh;border:0;border-radius:0}.aba-top{grid-template-columns:1fr auto}.aba-top label{grid-column:1/-1}.aba-body{display:block;overflow:auto}.aba-main{overflow:visible}.aba-side{min-height:380px;border:0;border-top:1px solid var(--aba-soft)}.aba-action-types{grid-template-columns:repeat(2,1fr)}.aba-option-grid{grid-template-columns:repeat(2,1fr)}.aba-stat-grid{grid-template-columns:repeat(2,1fr)}.aba-turn-values{grid-template-columns:repeat(2,1fr)}.aba-cooldowns{grid-template-columns:repeat(2,minmax(0,1fr))}.aba-cooldowns>strong,.aba-cooldowns>.aba-check{grid-column:1/-1}.aba-start-effect-row{grid-template-columns:1fr 1fr}.aba-preview{right:8px;top:8px;width:calc(100vw - 16px);height:calc(100vh - 16px)} }',
      '@media(max-width:560px){.aba-resources{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.aba-resources small{font-size:10px;overflow-wrap:anywhere}.aba-head{padding:11px 13px}.aba-head h2{font-size:17px!important}.aba-top{display:block;padding:9px}.aba-top>*{margin-bottom:7px}.aba-resources span{min-width:0;flex:1}.aba-main{padding:8px}.aba-action-types,.aba-option-grid,.aba-inline,.aba-condition-grid,.aba-enhance-fields,.aba-start-effect-row{grid-template-columns:1fr}.aba-stat-grid{grid-template-columns:repeat(2,1fr)}.aba-launcher-button{width:132px!important}.aba-character-title{flex-direction:column}.aba-side{min-height:320px}}'
    ].join('');
    document.head.appendChild(style);

    var overlay = document.createElement('div');
    overlay.className = 'aba-overlay';
    overlay.innerHTML = '<section class="aba-modal" role="dialog" aria-modal="true" aria-labelledby="aba-title"><header class="aba-head"><h2 id="aba-title">\u0411\u043e\u0435\u0432\u043e\u0439 \u043f\u043e\u043c\u043e\u0449\u043d\u0438\u043a</h2><div class="aba-head-actions"><button type="button" class="aba-help" aria-label="\u0418\u043d\u0441\u0442\u0440\u0443\u043a\u0446\u0438\u044f">i</button><button type="button" class="aba-close" aria-label="\u0417\u0430\u043a\u0440\u044b\u0442\u044c">\u00d7</button></div></header><div class="aba-top"><div class="aba-character-field"><span>\u041f\u0435\u0440\u0441\u043e\u043d\u0430\u0436</span><details class="aba-character-picker"><summary>\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0430</summary><div class="aba-character-dropdown"><input type="search" class="aba-character-search" aria-label="\u041f\u043e\u0438\u0441\u043a \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0430 \u043f\u043e \u0438\u043c\u0435\u043d\u0438" placeholder="\u041f\u043e\u0438\u0441\u043a \u043f\u043e \u0438\u043c\u0435\u043d\u0438"><label class="aba-npc-toggle"><input type="checkbox" class="aba-npc-enabled" id="aba-npc-enabled"><span>\u041d\u0435\u0438\u0433\u0440\u043e\u0432\u044b\u0435 \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0438</span></label><select class="aba-npc-type" aria-label="\u0422\u0438\u043f \u043d\u0435\u0438\u0433\u0440\u043e\u0432\u043e\u0433\u043e \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0430" hidden><option value="">\u0412\u0441\u0435 \u0442\u0438\u043f\u044b \u041d\u041f\u0421</option></select><div class="aba-character-results"></div></div></details><select class="aba-character" aria-label="\u041f\u0435\u0440\u0441\u043e\u043d\u0430\u0436" hidden><option value="">\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0430</option></select></div><button type="button" class="aba-refresh">\u041e\u0431\u043d\u043e\u0432\u0438\u0442\u044c \u0441\u043f\u0438\u0441\u043e\u043a</button><div class="aba-resources"></div></div><div class="aba-status"></div><div class="aba-body"><main class="aba-main"><section class="aba-character-summary"></section><details class="aba-guide"><summary>\u041a\u0430\u043a \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u044c\u0441\u044f \u043f\u043e\u043c\u043e\u0449\u043d\u0438\u043a\u043e\u043c</summary><ol><li>\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043b\u0438\u0447\u043d\u043e\u0435 \u0434\u0435\u043b\u043e \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0430.</li><li>\u0423\u043a\u0430\u0436\u0438\u0442\u0435, \u043f\u0435\u0440\u0432\u044b\u0439 \u044d\u0442\u043e \u0431\u043e\u0435\u0432\u043e\u0439 \u0445\u043e\u0434 \u0438\u043b\u0438 \u043f\u0440\u043e\u0434\u043e\u043b\u0436\u0435\u043d\u0438\u0435 \u0431\u043e\u044f, \u0438 \u043f\u0440\u043e\u0432\u0435\u0440\u044c\u0442\u0435 \u0441\u043e\u0441\u0442\u043e\u044f\u043d\u0438\u0435 \u0440\u0435\u0441\u0443\u0440\u0441\u043e\u0432.</li><li>\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0440\u0430\u0437\u0434\u0435\u043b: \u0430\u0442\u0430\u043a\u0430, \u0437\u0430\u0449\u0438\u0442\u0430, \u043f\u043e\u0434\u0433\u043e\u0442\u043e\u0432\u043a\u0430, \u0434\u0432\u0438\u0436\u0435\u043d\u0438\u0435 \u0438\u043b\u0438 \u043e\u0441\u043e\u0431\u043e\u0435 \u0432\u0437\u0430\u0438\u043c\u043e\u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435.</li><li>\u0414\u043e\u0431\u0430\u0432\u043b\u044f\u0439\u0442\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044f \u043f\u043e \u043f\u043e\u0440\u044f\u0434\u043a\u0443, \u0437\u0430\u0442\u0435\u043c \u043d\u0430\u0436\u043c\u0438\u0442\u0435 \u00ab\u0412\u0441\u0442\u0430\u0432\u0438\u0442\u044c \u0432 \u043f\u043e\u0441\u0442\u00bb.</li></ol></details><section class="aba-turn-setup" hidden></section><section class="aba-builder"></section></main><aside class="aba-side"><h3>\u041f\u043e\u0440\u044f\u0434\u043e\u043a \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439</h3><div class="aba-queue"></div><button type="button" class="aba-insert" disabled>\u0412\u0441\u0442\u0430\u0432\u0438\u0442\u044c \u0432 \u043f\u043e\u0441\u0442</button></aside></div></section><aside class="aba-preview" hidden></aside><aside class="aba-instruction" hidden></aside>';
    document.body.appendChild(overlay);
    state.instructionTab = 'attack';
    state.nodes = {
      overlay: overlay,
      character: overlay.querySelector('.aba-character'),
      characterSearch: overlay.querySelector('.aba-character-search'),
      npcEnabled: overlay.querySelector('.aba-npc-enabled'),
      npcType: overlay.querySelector('.aba-npc-type'),
      refresh: overlay.querySelector('.aba-refresh'),
      resources: overlay.querySelector('.aba-resources'),
      status: overlay.querySelector('.aba-status'),
      turnSetup: overlay.querySelector('.aba-turn-setup'),
      characterSummary: overlay.querySelector('.aba-character-summary'),
      builder: overlay.querySelector('.aba-builder'),
      queue: overlay.querySelector('.aba-queue'),
      insert: overlay.querySelector('.aba-insert'),
      preview: overlay.querySelector('.aba-preview'),
      instruction: overlay.querySelector('.aba-instruction')
    };
    on(overlay.querySelector('.aba-close'), 'click', closeModal);
    on(overlay.querySelector('.aba-help'), 'click', function () {
      state.nodes.instruction.hidden = !state.nodes.instruction.hidden;
      if (!state.nodes.instruction.hidden) renderInstructionPanel(state.instructionTab || 'attack');
    });
    on(overlay, 'mousedown', function (event) { if (event.target === overlay) closeModal(); });
    on(state.nodes.character, 'change', function () {
      var item = state.characters.concat(state.npcs || []).find(function (candidate) { return candidate.id === state.nodes.character.value; });
      if (item) loadCharacter(item);
      else { state.character = null; state.combat = null; state.actions = []; renderCharacter(); renderTurnSetup(); renderActionMenu(); }
    });
    var characterPicker = overlay.querySelector('.aba-character-picker');
    on(characterPicker, 'toggle', function () { if (characterPicker.open) state.nodes.characterSearch.focus(); });
    on(overlay.querySelector('.aba-character-results'), 'click', function (event) {
      var button = event.target.closest('[data-character-id]'); if (!button) return;
      state.nodes.character.value = button.getAttribute('data-character-id');
      characterPicker.querySelector('summary').textContent = button.firstChild.textContent;
      characterPicker.open = false;
      state.nodes.character.dispatchEvent(new Event('change', { bubbles: true }));
      characterPicker.querySelector('summary').focus();
    });
    on(document, 'click', function (event) { if (!characterPicker.contains(event.target)) characterPicker.open = false; });
    on(characterPicker, 'keydown', function (event) { if (event.key === 'Escape') { event.stopPropagation(); characterPicker.open = false; characterPicker.querySelector('summary').focus(); } });
    on(state.nodes.characterSearch, 'input', fillCharacters);
    on(state.nodes.npcType, 'change', fillCharacters);
    on(state.nodes.npcEnabled, 'change', function () { state.nodes.npcType.hidden = !state.nodes.npcEnabled.checked; fillCharacters(); if (state.nodes.npcEnabled.checked) loadNpcCharacters(false); });
    on(state.nodes.refresh, 'click', function () { loadCharacters(true); if (state.nodes.npcEnabled.checked) loadNpcCharacters(true); });
    on(state.nodes.insert, 'click', insertBbcode);
    on(document, 'keydown', function (event) { if (event.key === 'Escape' && overlay.classList.contains('is-open')) closeModal(); });
    state.uiBuilt = true;
    renderTurnSetup();
    renderCharacter();
    renderActionMenu();
  }

  function isReplyForm(form, textarea) {
    if (!form || !textarea) return false;
    if (textarea.closest && textarea.closest('#pun-profile,#pun-messages,#pun-userlist')) return false;
    var action = (form.getAttribute('action') || '').toLocaleLowerCase('ru');
    return /(?:^|\/)(?:post|edit)\.php(?:[?#]|$)/.test(action) || !!(form.closest && form.closest('#pun-viewtopic,#pun-post,#pun-edit'));
  }

  function isReplyPage() {
    if (document.querySelector('#pun-viewtopic,#pun-post,#pun-edit')) return true;
    return /\/(?:viewtopic|post|edit)\.php$/i.test(location.pathname);
  }

  function findReplyTextarea() {
    var selectors = ['#pun-viewtopic form textarea[name="req_message"]', '#pun-post form textarea[name="req_message"]', '#pun-edit form textarea[name="req_message"]', 'form[action*="post.php"] textarea[name="req_message"]', 'form[action*="edit.php"] textarea[name="req_message"]'];
    var candidates = document.querySelectorAll(selectors.join(','));
    for (var index = 0; index < candidates.length; index += 1) {
      if (isReplyForm(candidates[index].closest('form'), candidates[index])) return candidates[index];
    }
    return null;
  }

  function addLauncher(textarea) {
    var form = textarea && textarea.closest ? textarea.closest('form') : null;
    if (!isReplyForm(form, textarea)) return false;
    state.textarea = textarea;
    if (form.querySelector('.aba-launcher-button')) return true;
    Array.prototype.forEach.call(document.querySelectorAll('.aba-launcher-wrap'), function (node) { if (node.parentNode) node.parentNode.removeChild(node); });
    var searchWrap = form.querySelector('.ats-launcher-wrap');
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'aba-launcher-button';
    button.title = '\u041f\u043e\u043c\u043e\u0449\u043d\u0438\u043a \u0434\u043b\u044f \u0440\u0430\u0441\u0447\u0451\u0442\u0430 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439 \u0432 \u0431\u043e\u044e';
    button.textContent = '\u0411\u043e\u0435\u0432\u043e\u0439 \u043f\u043e\u043c\u043e\u0449\u043d\u0438\u043a';
    on(button, 'click', openModal);
    if (searchWrap) {
      searchWrap.appendChild(button);
      return true;
    }
    var submit = form.querySelector('input[name="submit"],button[name="submit"],input[type="submit"],button[type="submit"]');
    var actionRow = submit ? submit.parentNode : null;
    while (actionRow && actionRow.parentNode !== form && !actionRow.querySelector('input[name="preview"],button[name="preview"]')) actionRow = actionRow.parentNode;
    var wrap = document.createElement('div');
    wrap.className = 'aba-launcher-wrap';
    wrap.appendChild(button);
    if (actionRow && actionRow !== form && form.contains(actionRow) && actionRow.parentNode) actionRow.parentNode.insertBefore(wrap, actionRow);
    else form.appendChild(wrap);
    return true;
  }

  function ensureReplyUi() {
    var textarea = findReplyTextarea();
    if (!textarea) return false;
    if (!state.uiBuilt) buildUi();
    var result = addLauncher(textarea);
    var ownWrap = textarea.closest('form').querySelector('.aba-launcher-wrap');
    var searchWrap = textarea.closest('form').querySelector('.ats-launcher-wrap');
    if (ownWrap && searchWrap) {
      var button = ownWrap.querySelector('.aba-launcher-button');
      if (button) searchWrap.appendChild(button);
      ownWrap.remove();
    }
    return result;
  }

  function scheduleUiCheck() {
    if (state.formCheckScheduled) return;
    state.formCheckScheduled = true;
    setTimeout(function () { state.formCheckScheduled = false; ensureReplyUi(); }, 60);
  }

  function init() {
    if (!isReplyPage() || window.__akatsukiBattleBooted) return;
    window.__akatsukiBattleBooted = true;
    ensureReplyUi();
    if (window.MutationObserver && document.body) {
      state.observer = new MutationObserver(scheduleUiCheck);
      state.observer.observe(document.body, { childList: true, subtree: true });
    }
    var attempts = 0;
    var retry = setInterval(function () { attempts += 1; if (ensureReplyUi() || attempts >= 60) clearInterval(retry); }, 500);
  }

  if (document.readyState === 'loading') on(document, 'DOMContentLoaded', init);
  else init();
})();












