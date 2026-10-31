// Rebuilt into the footer on every deploy; never parser-blocks on plugin files.
export const pluginSources = {
  'technique-search': '24002',
  'battle-assistant': '28054',
  shop: '11008',
  'npc-gallery': '80230',
}

function installBackgroundPlugins() {
  if (window.forumBackgroundPlugins || /\/admin_[^/]*\.php$/i.test(location.pathname)) return
  var jobs = {}, started = false
  var config = {}
  document.querySelectorAll('script[data-forum-plugin]').forEach(function (node) {
    config[node.getAttribute('data-forum-plugin')] = JSON.parse(node.textContent)
  })
  function permitted(id) {
    if (id === 'technique-search' || id === 'battle-assistant') {
      return [1, 2, 5].indexOf(Number(window.GroupID || (window.FORUM && window.FORUM.group_id))) !== -1
    }
    if (id === 'shop') {
      return /\/viewtopic\.php$/i.test(location.pathname) && new URLSearchParams(location.search).get('id') === '202'
    }
    if (id === 'npc-gallery') return !!document.querySelector('#forum_f8, a[href*="viewforum.php?id=8"]')
    return false
  }
  function load(id) {
    if (!config[id] || !permitted(id)) return Promise.resolve(false)
    if (jobs[id]) return jobs[id]
    jobs[id] = new Promise(function (resolve, reject) {
      var script = document.createElement('script')
      Object.keys(config[id].attributes).forEach(function (name) { script.setAttribute(name, config[id].attributes[name]) })
      script.src = config[id].src
      script.charset = 'utf-8'
      script.async = true
      script.setAttribute('data-forum-plugin-loaded', id)
      script.onload = function () { resolve(true) }
      script.onerror = function () { delete jobs[id]; script.remove(); reject(new Error('Plugin load failed: ' + id)) }
      document.head.appendChild(script)
    })
    return jobs[id]
  }
  function launcher(id, label, api) {
    if (!permitted(id) || !config[id]) return
    var tools = document.getElementById('forum-tools')
    if (!tools) {
      tools = document.createElement('div')
      tools.id = 'forum-tools'
      tools.setAttribute('role', 'group')
      tools.setAttribute('aria-label', 'Инструменты игрока')
      var nav = document.getElementById('pun-navlinks')
      if (!nav) return
      nav.appendChild(tools)
    }
    var button = document.createElement('button')
    button.type = 'button'
    button.textContent = label
    button.setAttribute('data-forum-tool', id)
    button.onclick = function () {
      button.disabled = true
      load(id).then(function () {
        if (!window[api]) throw new Error('Plugin did not initialize: ' + id)
        window[api].open()
        button.textContent = label
      }).catch(function (error) {
        console.error(error)
        button.textContent = 'Повторить: ' + label
      }).finally(function () { button.disabled = false })
    }
    tools.appendChild(button)
  }
  function background() {
    // The two editor plugins keep their existing launcher next to the reply.
    // Header launchers additionally make them available on all public pages.
    launcher('technique-search', 'Поиск техник', 'ForumTechniqueSearch')
    launcher('battle-assistant', 'Боевой помощник', 'ForumBattleAssistant')
    function run() {
      ;['shop', 'technique-search', 'battle-assistant', 'npc-gallery'].reduce(function (chain, id) {
        return chain.then(function () { return load(id).catch(function (error) { console.error(error) }) })
      }, Promise.resolve())
    }
    if (window.requestIdleCallback) requestIdleCallback(run, { timeout: 1500 })
    else setTimeout(run, 0)
  }
  function check() {
    if (started || document.readyState !== 'complete' || !document.querySelector('.punbb.forum-design--ready')) return
    started = true
    document.removeEventListener('forum-design:ready', check)
    window.removeEventListener('load', check)
    // Allow the finished design to paint before any optional plugin executes.
    requestAnimationFrame(function () { requestAnimationFrame(background) })
  }
  window.forumBackgroundPlugins = { load: load }
  document.addEventListener('forum-design:ready', check)
  window.addEventListener('load', check)
  check()
}

export function patchPluginFooter(source, urls, { requireAll = false } = {}) {
  let updated = source.replace(/(?:\r?\n)?<!-- forum-background:start -->[\s\S]*?<!-- forum-background:end -->\s*/g, '')
  for (const [id, file] of Object.entries(pluginSources)) {
    let found = false
    const descriptor = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi
    updated = updated.replace(descriptor, (whole, attrs, body) => {
      const prior = attrs.match(/\bdata-forum-plugin=["']([^"']+)["']/i)
      const src = attrs.match(/\bsrc=["']([^"']+)["']/i)
      if (prior?.[1] !== id && !src?.[1].match(new RegExp(`/files/001a/12/f3/${file}\\.js(?:[?#]|$)`))) return whole
      if (found) throw new Error(`Duplicate plugin: ${id}`)
      found = true
      const attributes = prior ? JSON.parse(body).attributes : Object.fromEntries(
        [...attrs.matchAll(/\b(data-[\w-]+)=["']([^"']*)["']/gi)].map(match => [match[1], match[2]]),
      )
      if (!urls[id]) throw new Error(`Missing published plugin: ${id}`)
      const json = JSON.stringify({ src: urls[id], attributes }).replace(/</g, '\\u003c')
      return `<script type="application/json" data-forum-plugin="${id}">${json}</script>`
    })
    if (requireAll && !found) throw new Error(`Managed plugin is missing: ${id}`)
  }
  return updated + `\n<!-- forum-background:start -->
<style>#forum-tools{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin:10px 0}#forum-tools button{font:inherit;font-size:13px;cursor:pointer;padding:5px 10px;border:1px solid var(--color-sub-border,#b7a7a7);border-radius:8px;color:var(--color-link,#8f3131);background:var(--color-forum,#fbf2e5)}#forum-tools button:disabled{cursor:wait;opacity:.6}</style>
<script>(${installBackgroundPlugins.toString()})();</script>
<!-- forum-background:end -->`
}
