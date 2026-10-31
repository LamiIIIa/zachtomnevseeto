// mubb-technique-search ver 16
(function () {
  'use strict';

  var SCRIPT_ELEMENT = document.currentScript;
  var USER_CONFIG = window.AKATSUKI_TECH_SEARCH || {};
  var DATA_BASE_URL = SCRIPT_ELEMENT && SCRIPT_ELEMENT.getAttribute('data-base-url');
  var DATA_BRIDGE_ORIGINS = SCRIPT_ELEMENT && SCRIPT_ELEMENT.getAttribute('data-bridge-origins');
  var ATTRIBUTE_BRIDGE_ORIGINS = DATA_BRIDGE_ORIGINS ? DATA_BRIDGE_ORIGINS.split(',').map(function (origin) {
    return origin.trim().replace(/\/+$/, '');
  }).filter(Boolean) : null;
  var CONFIG = {
    baseUrl: String(USER_CONFIG.baseUrl || DATA_BASE_URL || location.origin).replace(/\/+$/, ''),
    topics: Array.isArray(USER_CONFIG.topics) ? USER_CONFIG.topics : [
      { rank: 'E', id: 74 },
      { rank: 'D', id: 75 },
      { rank: 'C', id: 76 },
      { rank: 'B', id: 77 },
      { rank: 'A', id: 78 },
      { rank: 'S', id: 79 }
    ],
    cacheKey: USER_CONFIG.cacheKey || 'akatsuki_technique_search_v2',
    cacheLifetime: USER_CONFIG.cacheLifetime || 6 * 60 * 60 * 1000,
    resultLimit: USER_CONFIG.resultLimit || 100,
    bridgeEnabled: USER_CONFIG.bridgeEnabled !== false,
    bridgeAllowedOrigins: USER_CONFIG.bridgeAllowedOrigins || ATTRIBUTE_BRIDGE_ORIGINS || null,
    bridgeTimeout: USER_CONFIG.bridgeTimeout || 12000,
    bridgeParam: 'ats-tech-bridge',
    characterForumId: USER_CONFIG.characterForumId || 144,
    charactersEnabled: USER_CONFIG.charactersEnabled !== false
  };

  CONFIG.baseOrigin = new URL(CONFIG.baseUrl, location.href).origin;
  CONFIG.cacheKey += ':' + CONFIG.baseOrigin;

  var state = {
    index: [],
    detailCache: {},
    selected: null,
    requestNumber: 0,
    textarea: null,
    bridgeFrame: null,
    bridgeReadyPromise: null,
    bridgeResolve: null,
    bridgeReject: null,
    bridgeTimer: null,
    bridgePending: {},
    bridgeSequence: 0,
    bridgeListenerAdded: false,
    characters: [],
    characterLoadPromise: null,
    selectedCharacterPostIds: null,
    formObserver: null,
    formCheckScheduled: false,
    uiBuilt: false,
    nodes: {}
  };

  function normalize(value) {
    return String(value || '')
      .toLocaleLowerCase('ru-RU')
      .replace(/\u0451/g, '\u0435')
      .replace(/[\u2013\u2014\u2212]/g, '-')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function cleanText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function searchTokens(query) {
    var ignored = {
      '\u0442\u0435\u0445\u043d\u0438\u043a\u0430': true,
      '\u0442\u0435\u0445\u043d\u0438\u043a\u0438': true,
      '\u044d\u043b\u0435\u043c\u0435\u043d\u0442': true,
      '\u0441\u0442\u0438\u0445\u0438\u044f': true,
      '\u0440\u0430\u043d\u0433': true
    };

    return normalize(query).split(/[^a-z\u0430-\u044f0-9]+/i).filter(function (word) {
      return word.length > 2 && !ignored[word];
    }).map(function (word) {
      if (/^\u043b\u0435\u0447/i.test(word)) return '\u043b\u0435\u0447';
      if (/^\u0440\u0443\u043a/i.test(word)) return '\u0440\u0443\u043a';
      return word;
    }).filter(function (word, index, words) {
      return words.indexOf(word) === index;
    });
  }

  function matchesQuery(item, query) {
    if (!query || item.searchText.indexOf(query) !== -1) return true;

    var tokens = searchTokens(query);
    return tokens.length > 0 && tokens.every(function (token) {
      return item.searchText.indexOf(token) !== -1;
    });
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }


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
      else if (/^(\u0411\u043e\u0435\u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u044c|\u0417\u0430\u043f\u0430\u0441\s+\u0427\u0430\u043a\u0440\u044b|\u0423\u0440\u043e\u043d|\u0417\u0430\u0449\u0438\u0442\u0430|\u041a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439|\u0410\u0442\u0430\u043a\u0430|\u0423\u043a\u043b\u043e\u043d\u0435\u043d\u0438\u0435)/i.test(label) && cells.length >= 2) {
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
      return '[akcmsection]' + title + '[/akcmsection][akcmequiplist]' + lines.filter(function (line) { return line.trim(); }).map(function (line) { var match = line.replace(/^\u2022\s*/, '').split(/:\s*| \u2014 /); return '[akcmequiprow][akcmvalue]' + match.shift() + '[/akcmvalue][akcmname]' + match.join(' \u2014 ') + '[/akcmname][/akcmequiprow]'; }).join('\n') + '[/akcmequiplist]';
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
  var inventory = Array.from(clone.querySelectorAll('.spoiler-box,details')).find(function (node) { var title=node.querySelector(':scope > div:first-child,:scope > summary');return title&&/^\u0438\u043d\u0432\u0435\u043d\u0442\u0430\u0440\u044c$/i.test(title.textContent.trim()); });
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
  function loadDocumentDirect(url) { return akatsukiNetwork().document(url); }


  function isAllowedBridgeOrigin(origin, requestedUrl) {
    if (Array.isArray(CONFIG.bridgeAllowedOrigins)) {
      return CONFIG.bridgeAllowedOrigins.indexOf('*') !== -1 ||
        CONFIG.bridgeAllowedOrigins.indexOf(origin) !== -1;
    }

    try {
      var hostname = new URL(origin).hostname.toLowerCase();
      if (hostname === 'forum.cool' || /\.forum\.cool$/.test(hostname)) return true;

      if (requestedUrl && requestedUrl.pathname === '/viewtopic.php') {
        var topicId = Number(requestedUrl.searchParams.get('id'));
        return CONFIG.topics.some(function (topic) { return Number(topic.id) === topicId; });
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  function isBridgePage() {
    try {
      return location.origin === CONFIG.baseOrigin &&
        new URLSearchParams(location.search).get(CONFIG.bridgeParam) === '1' &&
        window.parent !== window;
    } catch (error) {
      return false;
    }
  }

  function startBridgeServer() {
    window.addEventListener('message', function (event) {
      var data = event.data || {};
      if (data.type !== 'ATS_TECH_BRIDGE_REQUEST') return;

      var requestedUrl;
      try {
        requestedUrl = new URL(data.url, location.origin);
      } catch (error) {
        event.source.postMessage({
          type: 'ATS_TECH_BRIDGE_RESPONSE',
          id: data.id,
          error: '\u041d\u0435\u043a\u043e\u0440\u0440\u0435\u043a\u0442\u043d\u044b\u0439 \u0430\u0434\u0440\u0435\u0441'
        }, event.origin);
        return;
      }

      if (!isAllowedBridgeOrigin(event.origin, requestedUrl)) {
        event.source.postMessage({
          type: 'ATS_TECH_BRIDGE_RESPONSE',
          id: data.id,
          error: '\u0414\u043e\u043c\u0435\u043d \u0442\u0435\u0441\u0442\u043e\u0432\u043e\u0433\u043e \u0444\u043e\u0440\u0443\u043c\u0430 \u043d\u0435 \u0440\u0430\u0437\u0440\u0435\u0448\u0451\u043d: ' + event.origin
        }, event.origin);
        return;
      }

      if (requestedUrl.origin !== location.origin ||
          (requestedUrl.pathname !== '/viewtopic.php' && requestedUrl.pathname !== '/viewforum.php')) {
        event.source.postMessage({
          type: 'ATS_TECH_BRIDGE_RESPONSE',
          id: data.id,
          error: '\u0410\u0434\u0440\u0435\u0441 \u0437\u0430\u043f\u0440\u0435\u0449\u0451\u043d'
        }, event.origin);
        return;
      }

      loadDocumentDirect(requestedUrl.href).then(function (doc) {
        event.source.postMessage({
          type: 'ATS_TECH_BRIDGE_RESPONSE',
          id: data.id,
          html: '<!doctype html>' + doc.documentElement.outerHTML
        }, event.origin);
      }).catch(function (error) {
        event.source.postMessage({
          type: 'ATS_TECH_BRIDGE_RESPONSE',
          id: data.id,
          error: error.message || '\u041e\u0448\u0438\u0431\u043a\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043a\u0438'
        }, event.origin);
      });
    });

    window.parent.postMessage({ type: 'ATS_TECH_BRIDGE_READY' }, '*');
  }

  function handleBridgeMessage(event) {
    if (event.origin !== CONFIG.baseOrigin) return;
    var data = event.data || {};

    if (data.type === 'ATS_TECH_BRIDGE_READY') {
      clearTimeout(state.bridgeTimer);
      if (state.bridgeResolve) state.bridgeResolve();
      state.bridgeResolve = null;
      state.bridgeReject = null;
      return;
    }

    if (data.type !== 'ATS_TECH_BRIDGE_RESPONSE' || !data.id) return;
    var pending = state.bridgePending[data.id];
    if (!pending) return;

    clearTimeout(pending.timer);
    delete state.bridgePending[data.id];

    if (data.error) {
      pending.reject(new Error(data.error));
      return;
    }

    var doc = new DOMParser().parseFromString(data.html || '', 'text/html');
    pending.resolve(doc);
  }

  function ensureBridge() {
    if (state.bridgeReadyPromise) return state.bridgeReadyPromise;

    state.bridgeReadyPromise = new Promise(function (resolve, reject) {
      state.bridgeResolve = resolve;
      state.bridgeReject = reject;

      if (!state.bridgeListenerAdded) {
        window.addEventListener('message', handleBridgeMessage);
        state.bridgeListenerAdded = true;
      }

      var frame = document.createElement('iframe');
      frame.setAttribute('title', 'Technique data bridge');
      frame.setAttribute('aria-hidden', 'true');
      frame.style.display = 'none';
      frame.src = CONFIG.baseUrl + '/?' + CONFIG.bridgeParam + '=1';
      document.body.appendChild(frame);
      state.bridgeFrame = frame;

      state.bridgeTimer = setTimeout(function () {
        state.bridgeReadyPromise = null;
        reject(new Error('\u041e\u0441\u043d\u043e\u0432\u043d\u043e\u0439 \u0444\u043e\u0440\u0443\u043c \u043d\u0435 \u043e\u0442\u0432\u0435\u0442\u0438\u043b. \u041f\u043e\u0434\u043a\u043b\u044e\u0447\u0438\u0442\u0435 \u044d\u0442\u043e\u0442 \u0436\u0435 JS \u0432 \u0435\u0433\u043e HTML-\u043d\u0438\u0437.'));
      }, CONFIG.bridgeTimeout);
    });

    return state.bridgeReadyPromise;
  }

  function loadDocumentThroughBridge(url) {
    return ensureBridge().then(function () {
      return new Promise(function (resolve, reject) {
        var id = 'ats-' + Date.now() + '-' + (++state.bridgeSequence);
        var timer = setTimeout(function () {
          delete state.bridgePending[id];
          reject(new Error('\u041e\u0441\u043d\u043e\u0432\u043d\u043e\u0439 \u0444\u043e\u0440\u0443\u043c \u043d\u0435 \u043f\u0435\u0440\u0435\u0434\u0430\u043b \u0434\u0430\u043d\u043d\u044b\u0435 \u0432\u043e\u0432\u0440\u0435\u043c\u044f'));
        }, Math.max(CONFIG.bridgeTimeout, 120000));

        state.bridgePending[id] = { resolve: resolve, reject: reject, timer: timer };
        state.bridgeFrame.contentWindow.postMessage({
          type: 'ATS_TECH_BRIDGE_REQUEST',
          id: id,
          url: url
        }, CONFIG.baseOrigin);
      });
    });
  }

  function loadDocument(url) {
    var resolvedUrl = new URL(url, location.href);
    if (resolvedUrl.origin === location.origin) return loadDocumentDirect(resolvedUrl.href);

    if (resolvedUrl.origin === CONFIG.baseOrigin && CONFIG.bridgeEnabled) {
      return loadDocumentThroughBridge(resolvedUrl.href);
    }

    return Promise.reject(new Error('\u041c\u0435\u0436\u0434\u043e\u043c\u0435\u043d\u043d\u0430\u044f \u0437\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u043d\u0435 \u043d\u0430\u0441\u0442\u0440\u043e\u0435\u043d\u0430'));
  }

  function topicUrl(id) {
    return CONFIG.baseUrl + '/viewtopic.php?id=' + id;
  }

  function parseMasterPost(doc, topic) {
    var master = doc.querySelector('.post-content');
    if (!master) return [];

    var result = [];
    var rows = master.querySelectorAll('table tr');

    Array.prototype.forEach.call(rows, function (row) {
      var cells = row.cells || row.children;
      if (cells.length < 2) return;

      var block = cleanText(cells[0].textContent).replace(/\u0434\u0437\u044e\u0442\u0441\u0443/gi, '\u0434\u0437\u044e\u0446\u0443');
      if (!block) return;

      var links = cells[1].querySelectorAll('a[href*="#p"]');
      Array.prototype.forEach.call(links, function (link) {
        var title = cleanText(link.textContent);
        var href = link.href;
        var postMatch = href.match(/#p(\d+)/i);
        if (!title || !postMatch) return;

        result.push({
          title: title,
          rank: topic.rank,
          block: block,
          url: href,
          postId: postMatch[1],
          searchText: normalize(title + ' ' + block + ' ' + topic.rank)
        });
      });
    });

    return result;
  }

  function readCache() {
    try {
      var saved = JSON.parse(localStorage.getItem(CONFIG.cacheKey) || 'null');
      if (!saved || !Array.isArray(saved.items) || !saved.createdAt) return null;
      if (Date.now() - saved.createdAt > CONFIG.cacheLifetime) return null;
      return saved.items;
    } catch (error) {
      return null;
    }
  }

  function writeCache(items) {
    try {
      localStorage.setItem(CONFIG.cacheKey, JSON.stringify({
        createdAt: Date.now(),
        items: items
      }));
    } catch (error) {}
  }

  function setStatus(text, kind) {
    var node = state.nodes.status;
    if (!node) return;
    node.textContent = text || '';
    node.className = 'ats-status' + (kind ? ' is-' + kind : '');
  }

  function loadIndex(force) {
    var loadErrors = [];
    if (!force) {
      var cached = readCache();
      if (cached && cached.length) {
        state.index = cached;
        fillBlockFilter();
        renderResults();
        setStatus('\u0417\u0430\u0433\u0440\u0443\u0436\u0435\u043d\u043e \u0442\u0435\u0445\u043d\u0438\u043a: ' + cached.length + ' (\u0438\u0437 \u043a\u044d\u0448\u0430)');
        loadCharacters();
        return Promise.resolve(cached);
      }
    }

    setStatus('\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u044e \u043c\u0430\u0441\u0442\u0435\u0440-\u043f\u043e\u0441\u0442\u044b \u0440\u0430\u043d\u0433\u043e\u0432 E\u2013S\u2026', 'loading');
    state.nodes.results.innerHTML = '<div class="ats-empty">\u0418\u0434\u0451\u0442 \u0437\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u0441\u043f\u0438\u0441\u043a\u0430\u2026</div>';

    return Promise.all(CONFIG.topics.map(function (topic) {
      return loadDocument(topicUrl(topic.id))
        .then(function (doc) { return parseMasterPost(doc, topic); })
        .catch(function (error) {
          loadErrors.push('\u0420\u0430\u043d\u0433 ' + topic.rank + ': ' + error.message);
          return [];
        });
    })).then(function (groups) {
      var merged = [];
      groups.forEach(function (items) { merged = merged.concat(items); });

      state.index = merged;
      writeCache(merged);
      fillBlockFilter();
      renderResults();

      if (merged.length) {
        setStatus('\u0417\u0430\u0433\u0440\u0443\u0436\u0435\u043d\u043e \u0442\u0435\u0445\u043d\u0438\u043a: ' + merged.length);
        loadCharacters();
      } else {
        setStatus('\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u043c\u0430\u0441\u0442\u0435\u0440-\u043f\u043e\u0441\u0442\u044b. ' + loadErrors.join(' | '), 'error');
      }

      return merged;
    });
  }

  function fillBlockFilter() {
    var select = state.nodes.block;
    var current = select.value;
    var blocks = {};

    state.index.forEach(function (item) { blocks[item.block] = true; });
    select.innerHTML = '<option value="">\u0412\u0441\u0435 \u0431\u043b\u043e\u043a\u0438 / \u043a\u043b\u0430\u0441\u0441\u044b</option>';

    Object.keys(blocks).sort(function (a, b) {
      return a.localeCompare(b, 'ru');
    }).forEach(function (block) {
      var option = document.createElement('option');
      option.value = block;
      option.textContent = block;
      select.appendChild(option);
    });

    select.value = current;
  }

  function characterForumUrl(page) {
    var url = CONFIG.baseUrl + '/viewforum.php?id=' + CONFIG.characterForumId;
    return page > 1 ? url + '&p=' + page : url;
  }

  function extractCharacterNameFromTopic(title) {
    var text = cleanText(title || '');
    var match = text.match(/^\u043b\u0438\u0447\u043d\u043e\u0435\s+\u0434\u0435\u043b\u043e\s*(?:[:\u2014\u2013-]\s*)?(.+)$/i);
    return match ? cleanText(match[1]) : '';
  }

  function parseCharacterTopics(doc) {
    var result = [];
    var seen = {};
    var links = doc.querySelectorAll([
      '#pun-main td.tcl .tclcon > a[href*="viewtopic.php?id="]',
      '#pun-viewforum td.tcl .tclcon > a[href*="viewtopic.php?id="]',
      'td.tcl .tclcon > a[href*="viewtopic.php?id="]',
      '#pun-main .main-item a[href*="viewtopic.php?id="]',
      '#pun-viewforum .main-item a[href*="viewtopic.php?id="]'
    ].join(','));

    Array.prototype.forEach.call(links, function (link) {
      var url;
      try { url = new URL(link.href, CONFIG.baseUrl); } catch (error) { return; }
      var topicId = url.searchParams.get('id');
      var name = extractCharacterNameFromTopic(link.getAttribute('title') || link.textContent);
      if (!topicId || !name || seen[topicId]) return;

      seen[topicId] = true;
      result.push({
        topicId: String(topicId),
        name: name,
        url: CONFIG.baseUrl + '/viewtopic.php?id=' + topicId,
        postIds: null
      });
    });

    return result;
  }

  function getLastCharacterForumPage(doc) {
    var lastPage = 1;
    var links = doc.querySelectorAll('a[href*="viewforum.php"][href*="p="]');
    Array.prototype.forEach.call(links, function (link) {
      try {
        var url = new URL(link.href, CONFIG.baseUrl);
        if (Number(url.searchParams.get('id')) !== Number(CONFIG.characterForumId)) return;
        lastPage = Math.max(lastPage, Number(url.searchParams.get('p')) || 1);
      } catch (error) {}
    });
    return lastPage;
  }

  function fillCharacterFilter() {
    var select = state.nodes.character;
    if (!select) return;
    var current = select.value;
    select.innerHTML = '<option value="">\u0418\u0433\u0440\u043e\u0432\u044b\u0435 \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0438</option>';

    state.characters.sort(function (a, b) {
      return a.name.localeCompare(b.name, 'ru');
    }).forEach(function (character) {
      var option = document.createElement('option');
      option.value = character.topicId;
      option.textContent = character.name;
      select.appendChild(option);
    });

    select.disabled = false;
    select.value = current;
  }

  function loadCharacters() {
    if (!CONFIG.charactersEnabled || !state.nodes.character) return Promise.resolve([]);
    if (state.characterLoadPromise) return state.characterLoadPromise;

    state.nodes.character.disabled = true;
    state.nodes.character.innerHTML = '<option value="">\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0435\u0439\u2026</option>';

    state.characterLoadPromise = loadDocument(characterForumUrl(1)).then(function (firstDoc) {
      var lastPage = getLastCharacterForumPage(firstDoc);
      if (lastPage > 50) throw new Error('\u0412 \u043a\u0430\u0442\u0430\u043b\u043e\u0433\u0435 \u0431\u043e\u043b\u044c\u0448\u0435 50 \u0441\u0442\u0440\u0430\u043d\u0438\u0446. \u0423\u0442\u043e\u0447\u043d\u0438\u0442\u0435 \u0440\u0430\u0437\u0434\u0435\u043b \u043b\u0438\u0447\u043d\u044b\u0445 \u0434\u0435\u043b.');
      var requests = [Promise.resolve(firstDoc)];
      for (var page = 2; page <= Math.min(lastPage, 50); page += 1) {
        requests.push(loadDocument(characterForumUrl(page)));
      }
      return Promise.all(requests);
    }).then(function (documents) {
      var byTopic = {};
      documents.forEach(function (doc) {
        parseCharacterTopics(doc).forEach(function (character) {
          byTopic[character.topicId] = character;
        });
      });
      state.characters = Object.keys(byTopic).map(function (id) { return byTopic[id]; });
      fillCharacterFilter();
      return state.characters;
    }).catch(function (error) {
      state.nodes.character.disabled = true;
      state.nodes.character.innerHTML = '<option value="">\u041f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0438 \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u043d\u044b</option>';
      state.nodes.character.title = error.message;
      return [];
    });

    return state.characterLoadPromise;
  }

  function extractCharacterName(firstPost, fallback) {
    if (!firstPost) return fallback;
    var explicit = firstPost.querySelector('[data-character-name], .character-name, .ank-name');
    if (explicit && cleanText(explicit.textContent)) return cleanText(explicit.textContent);

    var labels = firstPost.querySelectorAll('strong, b');
    for (var i = 0; i < labels.length; i += 1) {
      var label = cleanText(labels[i].textContent);
      if (!/^\u0438\u043c\u044f(\s+\u0438\s+\u0444\u0430\u043c\u0438\u043b\u0438\u044f)?\s*:?$/i.test(label)) continue;
      var rowText = cleanText(labels[i].parentNode.textContent).replace(label, '').replace(/^\s*:\s*/, '');
      if (rowText) return rowText;
    }

    return fallback;
  }

  function updateCharacterOption(character) {
    var option = state.nodes.character &&
      state.nodes.character.querySelector('option[value="' + character.topicId + '"]');
    if (option) option.textContent = character.name;
  }

  function loadCharacterTechniques(topicId) {
    var character = state.characters.filter(function (item) {
      return item.topicId === String(topicId);
    })[0];
    if (!character) return Promise.reject(new Error('\u041f\u0435\u0440\u0441\u043e\u043d\u0430\u0436 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d'));

    if (Array.isArray(character.postIds)) {
      state.selectedCharacterPostIds = character.postIds;
      return Promise.resolve(character.postIds);
    }

    setStatus('\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u044e \u0442\u0435\u0445\u043d\u0438\u043a\u0438 \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0430 \u00ab' + character.name + '\u00bb\u2026', 'loading');
    return loadDocument(character.url).then(function (doc) {
      var posts = doc.querySelectorAll('.post-content');
      if (posts.length < 2) throw new Error('\u0412 \u0442\u0435\u043c\u0435 \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0430 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d \u0432\u0442\u043e\u0440\u043e\u0439 \u043f\u043e\u0441\u0442');

      character.name = extractCharacterName(posts[0], character.name);
      updateCharacterOption(character);

      var topicIds = {};
      CONFIG.topics.forEach(function (topic) { topicIds[String(topic.id)] = true; });
      var postIds = {};
      var links = akcmNormalizePost(posts[1]).querySelectorAll('a[href*="viewtopic.php"][href*="#p"]');
      Array.prototype.forEach.call(links, function (link) {
        try {
          var url = new URL(link.href, CONFIG.baseUrl);
          var postMatch = url.hash.match(/^#p(\d+)$/i);
          if (topicIds[url.searchParams.get('id')] && postMatch) postIds[postMatch[1]] = true;
        } catch (error) {}
      });

      character.postIds = Object.keys(postIds);
      state.selectedCharacterPostIds = character.postIds;
      setStatus('\u041f\u0435\u0440\u0441\u043e\u043d\u0430\u0436: ' + character.name + '. \u0422\u0435\u0445\u043d\u0438\u043a \u043d\u0430\u0439\u0434\u0435\u043d\u043e: ' + character.postIds.length);
      return character.postIds;
    });
  }

  function filteredItems() {
    var query = normalize(state.nodes.search.value);
    var rank = state.nodes.rank.value;
    var block = state.nodes.block.value;
    var characterId = state.nodes.character ? state.nodes.character.value : '';

    return state.index.filter(function (item) {
      return matchesQuery(item, query) &&
        (!rank || item.rank === rank) &&
        (!block || item.block === block) &&
        (!characterId || (state.selectedCharacterPostIds &&
          state.selectedCharacterPostIds.indexOf(String(item.postId)) !== -1));
    });
  }

  function renderResults() {
    var items = filteredItems();
    var visible = items.slice(0, CONFIG.resultLimit);
    var list = state.nodes.results;

    state.nodes.count.textContent = items.length ?
      '\u041d\u0430\u0439\u0434\u0435\u043d\u043e: ' + items.length + (items.length > visible.length ? ', \u043f\u043e\u043a\u0430\u0437\u0430\u043d\u043e: ' + visible.length : '') : '';

    if (!items.length) {
      list.innerHTML = '<div class="ats-empty">\u041d\u0438\u0447\u0435\u0433\u043e \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u043e. \u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0447\u0430\u0441\u0442\u044c \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u044f, \u043d\u0430\u043f\u0440\u0438\u043c\u0435\u0440 \u00ab\u041e\u0433\u043d\u044f\u00bb.</div>';
      return;
    }

    list.innerHTML = visible.map(function (item, index) {
      return '<button type="button" class="ats-result" data-index="' + index + '">' +
        '<span class="ats-result-rank">' + escapeHtml(item.rank) + '</span>' +
        '<span class="ats-result-main"><strong>' + escapeHtml(item.title) + '</strong>' +
        '<small>\u0420\u0430\u043d\u0433 ' + escapeHtml(item.rank) + ' \u00b7 ' + escapeHtml(item.block) + '</small></span>' +
        '</button>';
    }).join('');

    Array.prototype.forEach.call(list.querySelectorAll('.ats-result'), function (button) {
      button.addEventListener('click', function () {
        selectItem(visible[Number(button.getAttribute('data-index'))], button);
      });
    });
  }

  function sanitizePost(content) {
    var clone = content.cloneNode(true);
    Array.prototype.forEach.call(
      clone.querySelectorAll('script, style, iframe, object, embed, form'),
      function (node) { node.remove(); }
    );
    Array.prototype.forEach.call(clone.querySelectorAll('a[href]'), function (link) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    });
    return clone.innerHTML;
  }

  function loadDetail(item) {
    if (state.detailCache[item.postId]) {
      return Promise.resolve(state.detailCache[item.postId]);
    }

    return loadDocument(item.url).then(function (doc) {
      var content = doc.querySelector('#p' + item.postId + '-content');
      if (!content) throw new Error('\u0421\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u043e');

      var codeNode = content.querySelector('.code-box pre');
      var detail = {
        html: sanitizePost(content),
        code: codeNode ? codeNode.textContent.trim() : '',
        permalink: item.url
      };

      state.detailCache[item.postId] = detail;
      return detail;
    });
  }

  function selectItem(item, button) {
    if (!item) return;

    state.selected = null;
    var requestNumber = ++state.requestNumber;
    Array.prototype.forEach.call(state.nodes.results.querySelectorAll('.ats-result'), function (node) {
      node.classList.remove('is-selected');
    });
    if (button) button.classList.add('is-selected');

    state.nodes.overlay.classList.add('is-detail-view');
    state.nodes.detail.scrollTop = 0;
    state.nodes.detail.innerHTML = mobileBackButton() +
      '<div class="ats-detail-loading">\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u044e \u043f\u043e\u043b\u043d\u043e\u0435 \u0441\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435\u2026</div>';
    bindMobileBack();

    loadDetail(item).then(function (detail) {
      if (requestNumber !== state.requestNumber) return;
      state.selected = { item: item, detail: detail };
      renderDetail(item, detail);
    }).catch(function (error) {
      if (requestNumber !== state.requestNumber) return;
      state.nodes.detail.innerHTML = mobileBackButton() +
        '<div class="ats-detail-error">\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u0441\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435: ' +
        escapeHtml(error.message) + '</div>';
      bindMobileBack();
    });
  }

  function mobileBackButton() {
    return '<button type="button" class="ats-mobile-back">\u2190 \u041a \u0441\u043f\u0438\u0441\u043a\u0443 \u0442\u0435\u0445\u043d\u0438\u043a</button>';
  }

  function bindMobileBack() {
    var button = state.nodes.detail.querySelector('.ats-mobile-back');
    if (!button) return;
    button.addEventListener('click', function () {
      state.nodes.overlay.classList.remove('is-detail-view');
    });
  }

  function renderDetail(item, detail) {
    var code = detail.code || ('[url=' + detail.permalink + ']' + item.title + '[/url]');
    state.nodes.detail.innerHTML =
      mobileBackButton() +
      '<div class="ats-detail-head">' +
        '<div><span class="ats-rank-badge">\u0420\u0430\u043d\u0433 ' + escapeHtml(item.rank) + '</span>' +
        '<span class="ats-block-badge">' + escapeHtml(item.block) + '</span></div>' +
        '<a href="' + escapeHtml(detail.permalink) + '" target="_blank" rel="noopener">\u041e\u0442\u043a\u0440\u044b\u0442\u044c \u043e\u0440\u0438\u0433\u0438\u043d\u0430\u043b \u2197</a>' +
      '</div>' +
      '<section class="ats-code-panel">' +
        '<button type="button" class="ats-code-toggle" aria-expanded="false">' +
          '<span>\u041a\u043e\u0434 \u0434\u043b\u044f \u0432\u0441\u0442\u0430\u0432\u043a\u0438</span><span class="ats-code-toggle-icon">expand_more</span>' +
        '</button>' +
        '<div class="ats-code-content">' +
          '<pre class="ats-code"></pre>' +
          '<div class="ats-code-actions">' +
            '<button type="button" class="ats-copy">\u0421\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u0442\u044c</button>' +
            '<button type="button" class="ats-insert">\u0412\u0441\u0442\u0430\u0432\u0438\u0442\u044c \u0432 \u043e\u0442\u0432\u0435\u0442</button>' +
          '</div>' +
        '</div>' +
      '</section>' +
      '<section class="ats-post-preview">' + detail.html + '</section>';

    bindMobileBack();
    state.nodes.detail.querySelector('.ats-code').textContent = code;
    var codeToggle = state.nodes.detail.querySelector('.ats-code-toggle');
    var compactDetail = window.matchMedia && window.matchMedia('(max-width:1100px)').matches;
    codeToggle.setAttribute('aria-expanded', compactDetail ? 'false' : 'true');
    codeToggle.addEventListener('click', function (event) {
      if (window.matchMedia && !window.matchMedia('(max-width:1100px)').matches) return;
      var panel = event.currentTarget.parentNode;
      var isOpen = panel.classList.toggle('is-open');
      event.currentTarget.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    state.nodes.detail.querySelector('.ats-copy').addEventListener('click', function (event) {
      copyText(code, event.currentTarget);
    });
    state.nodes.detail.querySelector('.ats-insert').addEventListener('click', function () {
      insertIntoReply(code);
    });
  }

  function copyText(text, button) {
    function done() {
      var previous = button.textContent;
      button.textContent = '\u0421\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u043d\u043e \u2713';
      setTimeout(function () { button.textContent = previous; }, 1400);
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(function () {
        legacyCopy(text, done);
      });
    } else {
      legacyCopy(text, done);
    }
  }

  function legacyCopy(text, callback) {
    var helper = document.createElement('textarea');
    helper.value = text;
    helper.setAttribute('readonly', 'readonly');
    helper.style.position = 'fixed';
    helper.style.opacity = '0';
    document.body.appendChild(helper);
    helper.select();
    try { document.execCommand('copy'); } catch (error) {}
    helper.remove();
    callback();
  }

  function insertIntoReply(code) {
    var textarea = state.textarea || findReplyTextarea();
    if (!textarea) {
      setStatus('\u041f\u043e\u043b\u0435 \u043e\u0442\u0432\u0435\u0442\u0430 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u043e.', 'error');
      return;
    }

    var start = typeof textarea.selectionStart === 'number' ? textarea.selectionStart : textarea.value.length;
    var end = typeof textarea.selectionEnd === 'number' ? textarea.selectionEnd : start;
    var before = textarea.value.slice(0, start);
    var after = textarea.value.slice(end);
    var prefix = before && !/\n$/.test(before) ? '\n' : '';
    var suffix = after && !/^\n/.test(after) ? '\n' : '';

    textarea.value = before + prefix + code + suffix + after;
    var cursor = before.length + prefix.length + code.length;
    textarea.focus();
    if (textarea.setSelectionRange) textarea.setSelectionRange(cursor, cursor);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));

    closeModal();
  }

  function isReplyForm(form, textarea) {
    if (!form || !textarea) return false;
    if (textarea.closest && textarea.closest('#pun-profile,#pun-messages,#pun-userlist')) return false;
    var action = (form.getAttribute('action') || '').toLocaleLowerCase('ru');
    return /(?:^|\/)(?:post|edit)\.php(?:[?#]|$)/.test(action) ||
      !!(form.closest && form.closest('#pun-viewtopic,#pun-post,#pun-edit'));
  }

  function isReplyPage() {
    if (document.querySelector('#pun-viewtopic,#pun-post,#pun-edit')) return true;
    return /\/(?:viewtopic|post|edit)\.php$/i.test(location.pathname);
  }

  function findReplyTextarea() {
    var selectors = [
      '#pun-viewtopic form textarea[name="req_message"]',
      '#pun-post form textarea[name="req_message"]',
      '#pun-edit form textarea[name="req_message"]',
      'form[action*="post.php"] textarea[name="req_message"]',
      'form[action*="edit.php"] textarea[name="req_message"]'
    ];
    var candidates = document.querySelectorAll(selectors.join(','));
    for (var index = 0; index < candidates.length; index += 1) {
      var textarea = candidates[index];
      if (isReplyForm(textarea.closest('form'), textarea)) return textarea;
    }
    return null;
  }

  function openModal() {
    state.nodes.overlay.classList.add('is-open');
    document.documentElement.classList.add('ats-modal-open');
    state.nodes.search.focus();

    if (!state.index.length) loadIndex(false);
  }

  function closeModal() {
    state.nodes.overlay.classList.remove('is-open');
    state.nodes.overlay.classList.remove('is-detail-view');
    document.documentElement.classList.remove('ats-modal-open');
  }

  function buildUi() {
    if (state.uiBuilt && state.nodes.overlay && document.body.contains(state.nodes.overlay)) return;

    var style = document.createElement('style');
    style.textContent = [
      '.ats-modal-open{overflow:hidden}',
      '.ats-launcher-wrap{display:flex;position:relative;width:100%;box-sizing:border-box;justify-content:flex-end;align-items:center;margin:16px 0 20px;padding:0 12px;clear:both}',
      '.ats-launcher-button{display:inline-flex;width:140px!important;max-width:100%;min-width:0!important;min-height:34px;box-sizing:border-box;margin:0!important;padding:6px 11px!important;border:1px solid var(--color-link)!important;border-radius:5px!important;background:var(--color-link,#863030)!important;color:var(--color-txt3,#f5f1f1)!important;align-items:center;justify-content:center;flex:0 0 auto;cursor:pointer;font:700 9.5px/1.2 var(--font-1)!important;letter-spacing:.2px;text-transform:uppercase;transition:background .3s ease,border-color .3s ease,transform .3s ease}',
      '.ats-launcher-button:hover,.ats-launcher-button:focus-visible{border-color:var(--color-hover,#b03b3b)!important;background:var(--color-hover,#b03b3b)!important;outline:0;transform:translateY(-1px)}',
      '.ats-overlay{--ats-accent:var(--color-link,#863030);--ats-accent-hover:var(--color-hover,#b03b3b);--ats-surface:var(--color-forum,#f5f1f1);--ats-soft:var(--color-lnthoverbg,#e8e3e3);--ats-text:var(--color-txt1,#282627);--ats-muted:var(--color-underava,#6a5f5f);--ats-border:var(--color-sub-border,#5b4c4c);display:none;position:fixed;z-index:100000;inset:0;background:var(--color-glass,rgba(0,0,0,.75));padding:3vh 3vw;box-sizing:border-box;font-family:var(--font-1,"Russo One",Arial,sans-serif);color:var(--ats-text)}',
      'html.kakashi .ats-overlay{--ats-muted:#b9c8ce;--ats-border:#4ab9fe}',
      '.ats-overlay.is-open{display:flex}',
      '.ats-overlay button,.ats-overlay input,.ats-overlay select,.ats-overlay textarea{font-family:var(--font-1,"Russo One",Arial,sans-serif)!important}',
      '.ats-modal{display:flex;flex-direction:column;width:min(1220px,100%);height:94vh;margin:auto;background:var(--ats-surface);color:var(--ats-text);border:1px solid var(--ats-border);border-radius:12px 48px 24px 24px;box-shadow:-7px 8px 24px var(--shedow1,rgba(0,0,0,.5));overflow:hidden}',
      '.ats-modal-head{display:flex;align-items:center;justify-content:space-between;padding:15px 20px;background:var(--ats-accent);color:var(--color-txt3,#f5f1f1)}',
      '.ats-modal-head h2{margin:0!important;color:var(--color-txt3,#f5f1f1)!important;font:400 22px/1.2 var(--font-1,"Russo One",sans-serif)!important;letter-spacing:.3px;text-transform:uppercase}',
      '.ats-close{border:0;background:transparent;color:var(--color-txt3,#f5f1f1);font:400 30px/1 Arial,sans-serif;cursor:pointer;transition:transform .25s ease,color .25s ease}',
      '.ats-close:hover{color:#fff;transform:rotate(90deg)}',
      '.ats-controls{display:grid;grid-template-columns:minmax(240px,1fr) 130px minmax(180px,240px) minmax(180px,260px) auto;gap:8px;padding:12px 14px;border-bottom:1px solid var(--ats-soft);background:var(--ats-surface)}',
      '.ats-controls input,.ats-controls select{width:100%;height:42px;box-sizing:border-box!important;border:1px solid var(--ats-soft)!important;border-radius:10px!important;padding:9px 12px!important;background:var(--color-qv,#fbf8f8)!important;color:var(--ats-text)!important;font:600 13px/1.2 var(--font-1,"Russo One",Arial,sans-serif)!important;letter-spacing:.15px!important;box-shadow:none!important}',
      '.ats-controls input:focus,.ats-controls select:focus{outline:0;border-color:var(--ats-accent)!important;box-shadow:0 0 0 2px color-mix(in srgb,var(--ats-accent) 18%,transparent)!important}',
      '.ats-controls input::placeholder{color:var(--ats-muted);opacity:.8}',
      '.ats-controls select,.ats-controls option{text-transform:none!important;font-variant:normal!important}',
      '.ats-refresh{height:42px;border:1px solid var(--ats-accent);border-radius:10px 20px 10px 10px;padding:8px 15px;background:var(--ats-surface);color:var(--ats-accent);cursor:pointer;font:700 12px/1.2 var(--font-1,"Russo One",Arial,sans-serif);letter-spacing:.3px;text-transform:uppercase;transition:all .35s ease}',
      '.ats-refresh:hover{background:var(--ats-accent);color:var(--color-txt3,#f5f1f1)}',
      '.ats-meta{display:flex;justify-content:space-between;gap:12px;padding:8px 14px;color:var(--ats-muted);background:var(--ats-surface);font:600 12px/1.3 var(--font-1,"Russo One",Arial,sans-serif);letter-spacing:.1px}',
      '.ats-status.is-loading{color:#8b5d15}.ats-status.is-error{color:var(--ats-accent-hover)}',
      'html.kakashi .ats-status.is-loading{color:var(--ats-accent-hover)}',
      '.ats-body{display:grid;grid-template-columns:360px minmax(0,1fr);min-height:0;flex:1}',
      '.ats-results{overflow:auto;border-right:1px solid var(--ats-soft);background:var(--color-qv,#fbf8f8)}',
      '.ats-result{display:flex;align-items:flex-start;gap:10px;width:calc(100% - 10px);margin:5px;border:1px solid transparent;border-radius:10px 24px 10px 10px;padding:11px 12px;background:transparent;text-align:left;color:var(--ats-text);cursor:pointer;font-family:var(--font-1,"Russo One",Arial,sans-serif);transition:background .25s ease,border-color .25s ease,box-shadow .25s ease}',
      '.ats-result:hover,.ats-result.is-selected{background:var(--ats-soft)}',
      '.ats-result:hover{border-color:var(--ats-soft)}',
      '.ats-result.is-selected{border-color:var(--ats-accent);box-shadow:-2px 2px 5px var(--shedow1,rgba(0,0,0,.18))}',
      '.ats-result-rank{display:inline-flex;align-items:center;justify-content:center;min-width:32px;height:32px;border-radius:50%;background:var(--ats-accent);color:var(--color-txt3,#f5f1f1);font:700 13px/1 var(--font-1,"Russo One",sans-serif)}',
      '.ats-result-main{display:flex;flex-direction:column;gap:4px;min-width:0}',
      '.ats-result-main strong{font:700 14px/1.35 var(--font-1,"Russo One",Arial,sans-serif)}',
      '.ats-result-main small{color:var(--ats-muted);font:600 11px/1.3 var(--font-1,"Russo One",Arial,sans-serif);letter-spacing:.1px}',
      '.ats-empty,.ats-detail-loading,.ats-detail-error{padding:24px;color:var(--ats-muted);text-align:center;font:500 13px/1.5 var(--font-1,"Russo One",Arial,sans-serif)}',
      '.ats-detail-error{color:var(--ats-accent-hover)}',
      '.ats-detail{overflow:auto;padding:14px 18px;background:var(--ats-surface);font:400 14px/1.55 var(--font-1,"Russo One",Arial,sans-serif)}',
      '.ats-detail-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}',
      '.ats-detail-head a{color:var(--ats-accent);font:700 12px/1.2 var(--font-1,"Russo One",Arial,sans-serif)}',
      '.ats-detail-head a:hover{color:var(--ats-accent-hover)}',
      '.ats-rank-badge,.ats-block-badge{display:inline-block;margin-right:7px;border-radius:8px 16px 8px 8px;padding:6px 10px;font:700 11px/1.2 var(--font-1,"Russo One",Arial,sans-serif);letter-spacing:.2px}',
      '.ats-rank-badge{background:var(--ats-accent);color:var(--color-txt3,#f5f1f1)}',
      '.ats-block-badge{background:var(--ats-soft);color:var(--ats-text)}',
      '.ats-code-panel{position:sticky;top:-14px;z-index:5;margin:0 0 14px;padding:14px;border:1px solid var(--ats-accent);border-radius:10px 34px 18px 18px;background:var(--color-qv,#fbf8f8);box-shadow:-4px 5px 12px var(--shedow1,rgba(0,0,0,.18))}',
      '.ats-code-toggle{display:flex;width:100%;margin:0 0 7px;padding:0;border:0;background:transparent;color:var(--ats-accent);align-items:center;justify-content:space-between;cursor:pointer;text-align:left;font:400 16px/1.25 var(--font-1,"Russo One",sans-serif);text-transform:uppercase;box-shadow:none}',
      '.ats-code-toggle-icon{display:none;font:400 22px/1 var(--mat,"Material Symbols Outlined");font-feature-settings:"liga";transition:transform .25s ease}',
      '.ats-code-content{display:block}',
      '.ats-code{margin:0 0 10px;padding:11px 12px;overflow:auto;white-space:pre-wrap;word-break:break-word;background:var(--ats-soft);color:var(--ats-text);border:1px solid color-mix(in srgb,var(--ats-accent) 18%,transparent);border-radius:10px;font:12px/1.5 Consolas,"Courier New",monospace}',
      '.ats-code-actions{display:flex;gap:8px}',
      '.ats-code-actions button{border:1px solid var(--ats-accent);border-radius:10px 20px 10px 10px;padding:9px 13px;background:var(--ats-accent);color:var(--color-txt3,#f5f1f1);cursor:pointer;font:700 11px/1.2 var(--font-1,"Russo One",Arial,sans-serif);letter-spacing:.3px;text-transform:uppercase;transition:all .3s ease;box-shadow:-2px 2px 5px var(--shedow1,rgba(0,0,0,.15))}',
      '.ats-code-actions button:hover{background:var(--ats-accent-hover);border-color:var(--ats-accent-hover)}',
      '.ats-code-actions .ats-copy{background:var(--color-sub,#5b4c4c);border-color:var(--color-sub,#5b4c4c)}',
      '.ats-post-preview{min-width:0;overflow-wrap:anywhere;color:var(--ats-text)}',
      '.ats-post-preview img{max-width:100%;height:auto}',
      '.ats-post-preview table{max-width:100%}',
      '.ats-post-preview .code-box{margin-top:10px}',
      '.ats-mobile-back{display:none}',
      '.ats-launcher-button{font:200 10px/1.2 var(--font-g,"Nunito Sans",Arial,sans-serif)!important;letter-spacing:.5px!important}',
      '.ats-overlay,.ats-overlay *{font-family:var(--font-g,"Nunito Sans",Arial,sans-serif)!important;font-weight:200!important;letter-spacing:.5px!important}',
      '.ats-modal-head h2{font:200 22px/1.2 var(--font-g,"Nunito Sans",Arial,sans-serif)!important;letter-spacing:.5px!important}',
      '.ats-controls input,.ats-controls select,.ats-controls option{font:200 13px/1.2 var(--font-g,"Nunito Sans",Arial,sans-serif)!important;letter-spacing:.5px!important}',
      '.ats-refresh{font:200 12px/1.2 var(--font-g,"Nunito Sans",Arial,sans-serif)!important;letter-spacing:.5px!important}',
      '.ats-overlay :is(h1,h2,h3,h4,h5,h6,strong,b,.ats-result-rank,.ats-rank-badge,.ats-block-badge,.ats-code-toggle){font-weight:400!important}',
      '.ats-overlay .ats-code{font-family:Consolas,"Courier New",monospace!important;font-weight:400!important;letter-spacing:0!important}',
      '.ats-overlay .ats-code-toggle-icon{font-family:var(--mat,"Material Symbols Outlined")!important;font-weight:400!important;letter-spacing:normal!important}',
      '@media(max-width:1100px){.ats-overlay{padding:0}.ats-modal{width:100%;height:100vh;height:100dvh;border:0;border-radius:0;box-shadow:none}.ats-modal-head{flex:0 0 auto;padding:11px 15px}.ats-modal-head h2{font-size:17px!important}.ats-close{font-size:26px}.ats-controls{flex:0 0 auto;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:7px;padding:9px}.ats-search{grid-column:1/-1}.ats-rank-filter{grid-column:1}.ats-block-filter{grid-column:2}.ats-character-filter{grid-column:1}.ats-refresh{grid-column:2}.ats-controls input,.ats-controls select,.ats-refresh{height:39px}.ats-meta{flex:0 0 auto;padding:7px 10px;flex-wrap:wrap}.ats-body{display:block;position:relative;min-height:0;overflow:hidden}.ats-results,.ats-detail{box-sizing:border-box;width:100%;height:100%;max-height:none;overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}.ats-results{display:block;border:0;padding-bottom:max(14px,env(safe-area-inset-bottom))}.ats-detail{display:none;padding:10px 11px max(18px,env(safe-area-inset-bottom));background:var(--ats-surface)}.ats-overlay.is-detail-view .ats-results{display:none}.ats-overlay.is-detail-view .ats-detail{display:block}.ats-mobile-back{display:inline-flex;margin:0 0 10px;padding:8px 11px;border:1px solid var(--ats-accent);border-radius:8px 16px 8px 8px;background:transparent;color:var(--ats-accent);align-items:center;cursor:pointer;font:700 12px/1.2 var(--font-1,"Russo One",Arial,sans-serif)}.ats-detail-head{align-items:flex-start;flex-wrap:wrap}.ats-detail-head a{margin-left:auto}.ats-code-panel{position:static;margin:10px 0 14px;padding:0;border-color:var(--ats-soft);border-radius:9px 22px 12px 12px;box-shadow:none;overflow:hidden}.ats-code-toggle{box-sizing:border-box;margin:0;padding:11px 13px;background:var(--ats-soft);font-size:14px}.ats-code-toggle-icon{display:block}.ats-code-content{display:none;padding:11px}.ats-code-panel.is-open .ats-code-content{display:block}.ats-code-panel.is-open .ats-code-toggle-icon{transform:rotate(180deg)}.ats-code-actions{flex-wrap:wrap}.ats-code-actions button{flex:1 1 135px}.ats-post-preview{max-width:100%;overflow-x:hidden}.ats-result{width:calc(100% - 12px);margin:6px}.ats-empty{display:none}}',
      '@media(max-width:520px){.ats-controls{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.ats-controls input,.ats-controls select,.ats-refresh{font-size:11px!important;padding-left:9px!important;padding-right:9px!important}.ats-meta{font-size:11px}.ats-result-main strong{font-size:13px}.ats-result-rank{min-width:30px;height:30px}.ats-detail-head a{width:100%;margin:2px 0 0}}'
    ].join('');
    document.head.appendChild(style);

    var overlay = document.createElement('div');
    overlay.className = 'ats-overlay';
    overlay.innerHTML =
      '<div class="ats-modal" role="dialog" aria-modal="true" aria-labelledby="ats-title">' +
        '<header class="ats-modal-head"><h2 id="ats-title">\u041f\u043e\u0438\u0441\u043a \u0442\u0435\u0445\u043d\u0438\u043a</h2>' +
          '<button type="button" class="ats-close" aria-label="\u0417\u0430\u043a\u0440\u044b\u0442\u044c">\u00d7</button></header>' +
        '<div class="ats-controls">' +
          '<input class="ats-search" type="search" placeholder="\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u0438\u043b\u0438 \u0447\u0430\u0441\u0442\u044c \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u044f: \u041e\u0433\u043d\u044f, \u041b\u0435\u0447\u0430\u0449\u0435\u0439\u2026" autocomplete="off">' +
          '<select class="ats-rank-filter"><option value="">\u0412\u0441\u0435 \u0440\u0430\u043d\u0433\u0438</option><option>E</option><option>D</option><option>C</option><option>B</option><option>A</option><option>S</option></select>' +
          '<select class="ats-block-filter"><option value="">\u0412\u0441\u0435 \u0431\u043b\u043e\u043a\u0438 / \u043a\u043b\u0430\u0441\u0441\u044b</option></select>' +
          '<select class="ats-character-filter"><option value="">\u0418\u0433\u0440\u043e\u0432\u044b\u0435 \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0438</option></select>' +
          '<button type="button" class="ats-refresh" title="\u041f\u0435\u0440\u0435\u0447\u0438\u0442\u0430\u0442\u044c \u043c\u0430\u0441\u0442\u0435\u0440-\u043f\u043e\u0441\u0442\u044b">\u041e\u0431\u043d\u043e\u0432\u0438\u0442\u044c</button>' +
        '</div>' +
        '<div class="ats-meta"><span class="ats-status"></span><span class="ats-count"></span></div>' +
        '<div class="ats-body"><div class="ats-results"></div>' +
          '<div class="ats-detail"><div class="ats-empty">\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0442\u0435\u0445\u043d\u0438\u043a\u0443 \u0441\u043b\u0435\u0432\u0430, \u0447\u0442\u043e\u0431\u044b \u0443\u0432\u0438\u0434\u0435\u0442\u044c \u0441\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435 \u0438 \u043a\u043e\u0434.</div></div></div>' +
      '</div>';
    document.body.appendChild(overlay);
    state.uiBuilt = true;

    state.nodes = {
      overlay: overlay,
      search: overlay.querySelector('.ats-search'),
      rank: overlay.querySelector('.ats-rank-filter'),
      block: overlay.querySelector('.ats-block-filter'),
      character: overlay.querySelector('.ats-character-filter'),
      refresh: overlay.querySelector('.ats-refresh'),
      status: overlay.querySelector('.ats-status'),
      count: overlay.querySelector('.ats-count'),
      results: overlay.querySelector('.ats-results'),
      detail: overlay.querySelector('.ats-detail')
    };

    overlay.querySelector('.ats-close').addEventListener('click', closeModal);
    overlay.addEventListener('mousedown', function (event) {
      if (event.target === overlay) closeModal();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && overlay.classList.contains('is-open')) closeModal();
    });
    state.nodes.search.addEventListener('input', renderResults);
    state.nodes.rank.addEventListener('change', renderResults);
    state.nodes.block.addEventListener('change', renderResults);
    state.nodes.character.addEventListener('change', function () {
      var topicId = state.nodes.character.value;
      state.selectedCharacterPostIds = null;

      if (!topicId) {
        renderResults();
        setStatus('\u0417\u0430\u0433\u0440\u0443\u0436\u0435\u043d\u043e \u0442\u0435\u0445\u043d\u0438\u043a: ' + state.index.length);
        return;
      }

      renderResults();
      loadCharacterTechniques(topicId).then(renderResults).catch(function (error) {
        setStatus('\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u0442\u0435\u0445\u043d\u0438\u043a\u0438 \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0430: ' + error.message, 'error');
        state.selectedCharacterPostIds = [];
        renderResults();
      });
    });
    state.nodes.refresh.addEventListener('click', function () {
      try { localStorage.removeItem(CONFIG.cacheKey); } catch (error) {}
      state.characters = [];
      state.characterLoadPromise = null;
      state.selectedCharacterPostIds = null;
      loadIndex(true);
    });
  }

  function addLauncher(textarea) {
    if (!textarea) return false;
    var form = textarea.closest ? textarea.closest('form') : null;
    if (!isReplyForm(form, textarea)) return false;
    state.textarea = textarea;

    Array.prototype.forEach.call(document.querySelectorAll('.ats-toolbar-item'), function (item) {
      if (item.parentNode) item.parentNode.removeChild(item);
    });

    var existing = form.querySelector('.ats-launcher-wrap');
    if (existing) return true;
    Array.prototype.forEach.call(document.querySelectorAll('.ats-launcher-wrap'), function (launcher) {
      if (launcher.parentNode) launcher.parentNode.removeChild(launcher);
    });

    var submit = form.querySelector('input[name="submit"],button[name="submit"],input[type="submit"],button[type="submit"]');
    var actionRow = submit ? submit.parentNode : null;
    while (actionRow && actionRow.parentNode !== form && !actionRow.querySelector('input[name="preview"],button[name="preview"]')) {
      actionRow = actionRow.parentNode;
    }

    var wrap = document.createElement('div');
    wrap.className = 'ats-launcher-wrap';
    wrap.innerHTML = '<button type="button" class="ats-launcher-button" title="\u041f\u043e\u043c\u043e\u0449\u043d\u0438\u043a \u043f\u043e \u043f\u043e\u0438\u0441\u043a\u0443 \u0442\u0435\u0445\u043d\u0438\u043a">\u041f\u043e\u0438\u0441\u043a \u0442\u0435\u0445\u043d\u0438\u043a</button>';

    if (actionRow && actionRow.parentNode) {
      actionRow.parentNode.insertBefore(wrap, actionRow);
    } else {
      form.appendChild(wrap);
    }

    wrap.querySelector('button').addEventListener('click', openModal);
    return true;
  }

  function ensureReplyUi() {
    var textarea = findReplyTextarea();
    if (!textarea) return false;
    if (!state.uiBuilt) buildUi();
    return addLauncher(textarea);
  }

  function scheduleReplyUiCheck() {
    if (state.formCheckScheduled) return;
    state.formCheckScheduled = true;

    setTimeout(function () {
      state.formCheckScheduled = false;
      ensureReplyUi();
    }, 50);
  }

  function init() {
    if (!isReplyPage() || window.__akatsukiSearchBooted) return;
    window.__akatsukiSearchBooted = true;
    var found = ensureReplyUi();

    if (!found && window.console && console.warn) {
      console.warn('[ATS] Reply textarea is not available yet; waiting for editor initialization.');
    }

    if (window.MutationObserver && document.body) {
      state.formObserver = new MutationObserver(scheduleReplyUiCheck);
      state.formObserver.observe(document.body, { childList: true, subtree: true });
    }

    var attempts = 0;
    var retryTimer = setInterval(function () {
      attempts += 1;
      if (ensureReplyUi() || attempts >= 60) clearInterval(retryTimer);
    }, 500);
  }

  if (isBridgePage()) {
    startBridgeServer();
    return;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
