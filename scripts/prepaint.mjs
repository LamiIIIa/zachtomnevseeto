// This tiny parser-time helper must stay inline: deferring it reintroduces FOUC.
function installPrepaint() {
  var root = document.querySelector('#pun > .punbb') || document.querySelector('.punbb')
  if (!root || /^pun-admin/.test(root.id) || root.id === 'pun-redirect') return
  if (root.classList.contains('forum-design--ready')) return
  var main, observer, finished = false
  function paintIndex() {
    if (root.id !== 'pun-index') return false
    if (!root.classList.contains('forum-design')) root.classList.add('forum-design')
    if (!main.classList.contains('forum-design-index')) main.classList.add('forum-design-index')
    var headings = main.querySelectorAll('.category h2 > span:first-of-type')
    for (var h = 0; h < headings.length; h++) {
      if (!headings[h].classList.contains('category-title')) headings[h].classList.add('category-title')
    }
    var first = main.querySelector('.category')
    if (first && !first.classList.contains('category--first')) first.classList.add('category--first')
    var tables = main.querySelectorAll('.category > .container > table')
    var ready = !!main.querySelector('.forum-card')
    for (var t = 0; t < tables.length; t++) {
      var table = tables[t]
      if (!table.classList.contains('fd-fast-table')) table.classList.add('forum-list', 'fd-fast-table')
      var rows = table.querySelectorAll('tbody > tr')
      for (var r = 0; r < rows.length; r++) {
        var row = rows[r]
        if (row.getAttribute('data-forum-fast-row')) { ready = true; continue }
        var title = row.querySelector('.tcl'), last = row.querySelector('.tcr')
        if (!title || !last || row.cells.length < 4) continue
        row.classList.add('forum-card')
        title.classList.add('forum-card__main')
        last.classList.add('forum-card__last-post')
        if (row.classList.contains('inew') || title.querySelector('.inew,.icon-new,.newtext')) row.classList.add('forum-card--unread')
        row.setAttribute('data-forum-fast-row', '1')
        ready = true
      }
    }
    return ready
  }
  function finish() {
    if (finished) return
    finished = true
    if (observer) observer.disconnect()
    document.removeEventListener('forum-design:ready', finish)
  }
  function check() {
    if (finished) return
    if (root.classList.contains('forum-design--ready')) { finish(); return }
    main = root.querySelector('#pun-main')
    if (!main) return
    // Decorate the existing rows while HTML is being parsed. Do not wait for
    // forum.js, DOMContentLoaded, fonts, images, or unrelated forum plugins.
    // Leave the original cells intact for the full initializer and plugins.
    paintIndex()
  }
  document.addEventListener('forum-design:ready', finish)
  observer = new MutationObserver(check)
  observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })
  check()
}

// Read preferences while the parser is still in HTML header, before post text paints.
function installTextPrepaint() {
  function setFontSize(size) {
    var style = document.getElementById('forum-post-font-preference');
    if (!style) { style = document.createElement('style'); style.id = 'forum-post-font-preference'; document.head.appendChild(style) }
    var value = Number(size);
    style.textContent = size != null && Number.isFinite(value) && value >= 6 && value <= 40
      ? '#pun .post .post-content p,#post-preview .post-content p,#profile-signature .post-content p,.parsedsig .post-content p{font-size:' + value + 'px}' : '';
  }
  window.forumTextLayout = {setFontSize:setFontSize};
  try { var preference = localStorage.getItem('FNTsize'); if (preference) setFontSize(preference.split(',')[1]) } catch (_) {}
  function reserveQuotes() {
    if (!document.getElementById('fntSlider') && !document.getElementById('forum-font-slider-space')) {
      var first = document.querySelector('.post h3 > span');
      if (first) {
        var space = document.createElement('div');
        space.id = 'forum-font-slider-space'; space.className = 'FNTslider';
        space.style.visibility = 'hidden'; space.setAttribute('aria-hidden','true');
        var strong = first.querySelector('strong');
        if (strong) strong.insertAdjacentElement('afterend',space); else first.appendChild(space);
      }
    }
    document.querySelectorAll('.quote-box:not(.spoiler-box):not(.fd-quote-reserved)').forEach(function (box) {
      var cite = box.querySelector(':scope > cite'), label = cite && cite.textContent;
      if (label && !/^(HTML\+? написал|Скрытый\sтекст)/.test(label)) box.classList.add('fd-quote-reserved');
    });
  }
  var observer = new MutationObserver(reserveQuotes);
  observer.observe(document.documentElement, {childList:true,subtree:true});
  reserveQuotes();
  document.addEventListener('DOMContentLoaded', function () { reserveQuotes(); observer.disconnect() }, {once:true});
}

const css = `
.punbb .post-content .quote-box.fd-quote-reserved:not(.with-avatar) > cite {visibility:hidden;}
@media(min-width:701px){.punbb .post-content .quote-box.fd-quote-reserved:not(.spoiler-box){padding-left:45px!important;}}
@media(max-width:700px){.punbb .post-content .quote-box.fd-quote-reserved:not(.spoiler-box){padding:10px 10px 5px!important;}}

#pun-index table.fd-fast-table {display:grid!important;width:100%!important;margin:0!important;border-collapse:separate!important;}
#pun-index table.fd-fast-table > tbody {display:contents!important;}
#pun-index table.fd-fast-table > thead {display:none!important;}
#pun-index table.fd-fast-table tr.forum-card {display:flex!important;width:auto!important;float:none!important;grid-template-columns:none!important;}
#pun-index table.fd-fast-table tr:not(.forum-card) {visibility:hidden;}
#pun-index table.fd-fast-table td.forum-card__main {display:block!important;width:100%!important;min-width:0!important;box-sizing:border-box!important;border:0!important;}
#pun-index table.fd-fast-table td.forum-card__last-post {display:grid!important;width:100%!important;min-width:0!important;box-sizing:border-box!important;float:none!important;border:0!important;white-space:normal!important;word-break:normal!important;}
#pun-index table.fd-fast-table td.tc2,#pun-index table.fd-fast-table td.tc3,#pun-index table.fd-fast-table .icon {display:none!important;}
`

export function renderPrepaint(fontUrls = []) {
  const fonts = [...new Set(fontUrls)].map(url => `<link data-forum-text-font rel="preload" as="font" type="font/woff2" crossorigin="anonymous" fetchpriority="high" href="${url.replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">`).join('\n')
  return `<!-- forum-prepaint:start -->\n${fonts}\n<style id="forum-prepaint-style">${css}</style>\n<script>(${installTextPrepaint.toString()})();\n(${installPrepaint.toString()})();</script>\n<!-- forum-prepaint:end -->`
}
