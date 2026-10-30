// This tiny parser-time helper must stay inline: deferring it reintroduces FOUC.
function installPrepaint() {
  var root = document.querySelector('#pun > .punbb') || document.querySelector('.punbb')
  if (!root || /^pun-admin/.test(root.id) || root.id === 'pun-redirect') return
  if (root.classList.contains('forum-design--ready')) return
  var main, placeholder, timer, observer, finished = false
  root.setAttribute('data-forum-prepaint', 'pending')
  function showMain() {
    root.removeAttribute('data-forum-prepaint')
    if (main) main.removeAttribute('aria-busy')
    if (placeholder) { placeholder.remove(); placeholder = null }
  }
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
    showMain()
    if (observer) observer.disconnect()
    clearTimeout(timer)
    document.removeEventListener('forum-design:ready', finish)
    window.removeEventListener('resize', resize)
  }
  function resize() {
    if (main && placeholder) placeholder.style.width = main.getBoundingClientRect().width + 'px'
  }
  function check() {
    if (finished) return
    if (root.classList.contains('forum-design--ready')) { finish(); return }
    main = root.querySelector('#pun-main')
    if (!main) return
    // Decorate the existing rows while HTML is being parsed. Do not wait for
    // forum.js, DOMContentLoaded, fonts, images, or unrelated forum plugins.
    // Leave the original cells intact for the full initializer and plugins.
    if (paintIndex()) { showMain(); return }
    if (placeholder) return
    main.setAttribute('aria-busy', 'true')
    placeholder = document.createElement('div')
    placeholder.id = 'forum-prepaint-placeholder'
    placeholder.setAttribute('role', 'status')
    placeholder.setAttribute('aria-live', 'polite')
    placeholder.innerHTML = '<p class="forum-prepaint-label">Загрузка страницы…</p><div class="forum-prepaint-card"></div><div class="forum-prepaint-card"></div><div class="forum-prepaint-card"></div><button type="button" class="forum-prepaint-fallback" hidden>Показать содержимое</button>'
    placeholder.querySelector('button').onclick = finish
    main.parentNode.insertBefore(placeholder, main)
    resize()
  }
  document.addEventListener('forum-design:ready', finish)
  observer = new MutationObserver(check)
  observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })
  window.addEventListener('resize', resize)
  timer = setTimeout(function () {
    if (!placeholder || finished) return
    placeholder.querySelector('.forum-prepaint-label').textContent = 'Страница загружается дольше обычного.'
    placeholder.querySelector('button').hidden = false
  }, 5000)
  check()
}

const css = `
.punbb[data-forum-prepaint="pending"] #pun-main,
.punbb[data-forum-prepaint="pending"] #pun-crumbs1,
.punbb[data-forum-prepaint="pending"] #pun-crumbs2 {opacity:0!important;pointer-events:none!important;}
#forum-prepaint-placeholder {position:absolute;z-index:2;box-sizing:border-box;max-width:100%;padding:0 0 20px;background:var(--color-forum,#fbf2e5);color:var(--color-txt1,#282627);}
.forum-prepaint-label {margin:0 0 16px;padding:12px 16px;border:1px solid var(--color-sub-border,#d1b48c);border-radius:10px;font:14px/1.5 var(--font-g,sans-serif);text-align:center;}
.forum-prepaint-card {height:155px;margin:0 0 18px;border:1px solid var(--color-lnthoverbg,#eadbc5);border-radius:18px;background:linear-gradient(var(--color-lnthoverbg,#eadbc5),var(--color-lnthoverbg,#eadbc5)) center 30px/38% 14px no-repeat,linear-gradient(var(--color-lnthoverbg,#eadbc5),var(--color-lnthoverbg,#eadbc5)) center 64px/70% 9px no-repeat,linear-gradient(var(--color-lnthoverbg,#eadbc5),var(--color-lnthoverbg,#eadbc5)) right 24px bottom 24px/30% 9px no-repeat;}
.forum-prepaint-fallback {cursor:pointer;padding:10px 16px;border:1px solid var(--color-link,#de7444);border-radius:8px;background:var(--color-forum,#fbf2e5);color:var(--color-link,#de7444);}
.forum-prepaint-fallback[hidden] {display:none!important;}
#pun-index table.fd-fast-table {display:grid!important;width:100%!important;margin:0!important;border-collapse:separate!important;}
#pun-index table.fd-fast-table > tbody {display:contents!important;}
#pun-index table.fd-fast-table > thead {display:none!important;}
#pun-index table.fd-fast-table tr.forum-card {display:flex!important;width:auto!important;float:none!important;grid-template-columns:none!important;}
#pun-index table.fd-fast-table tr:not(.forum-card) {visibility:hidden;}
#pun-index table.fd-fast-table td.forum-card__main {display:block!important;width:100%!important;min-width:0!important;box-sizing:border-box!important;border:0!important;}
#pun-index table.fd-fast-table td.forum-card__last-post {display:grid!important;width:100%!important;min-width:0!important;box-sizing:border-box!important;float:none!important;border:0!important;white-space:normal!important;word-break:normal!important;}
#pun-index table.fd-fast-table td.tc2,#pun-index table.fd-fast-table td.tc3,#pun-index table.fd-fast-table .icon {display:none!important;}
@media(max-width:700px){.forum-prepaint-card{height:180px;}}
`

export function renderPrepaint() {
  return `<!-- forum-prepaint:start -->\n<style id="forum-prepaint-style">${css}</style>\n<script>(${installPrepaint.toString()})();</script>\n<!-- forum-prepaint:end -->`
}
