// This tiny parser-time helper must stay inline: deferring it reintroduces FOUC.
function installPrepaint() {
  var root = document.querySelector('#pun > .punbb') || document.querySelector('.punbb')
  if (!root || /^pun-admin/.test(root.id) || root.id === 'pun-redirect') return
  if (root.classList.contains('forum-design--ready')) return
  var main, placeholder, timer, observer, finished = false
  root.setAttribute('data-forum-prepaint', 'pending')
  function finish() {
    if (finished) return
    finished = true
    root.removeAttribute('data-forum-prepaint')
    if (main) main.removeAttribute('aria-busy')
    if (placeholder) placeholder.remove()
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
    if (!main || placeholder) return
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
@media(max-width:700px){.forum-prepaint-card{height:180px;}}
`

export function renderPrepaint() {
  return `<!-- forum-prepaint:start -->\n<style id="forum-prepaint-style">${css}</style>\n<script>(${installPrepaint.toString()})();</script>\n<!-- forum-prepaint:end -->`
}
