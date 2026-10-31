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
  function replyFormPresent() {
    return !!document.querySelector('form[action*="post.php"] textarea[name="req_message"],form[action*="edit.php"] textarea[name="req_message"],#pun-viewtopic form textarea[name="req_message"],#pun-post form textarea[name="req_message"],#pun-edit form textarea[name="req_message"]')
  }
  function permitted(id) {
    if (id === 'technique-search' || id === 'battle-assistant') {
      return replyFormPresent() && [1, 2, 5].indexOf(Number(window.GroupID || (window.FORUM && window.FORUM.group_id))) !== -1
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
  function background() {
    function run() {
      ;['shop', 'technique-search', 'battle-assistant', 'npc-gallery'].reduce(function (chain, id) {
        return chain.then(function () { return load(id).catch(function (error) { console.error(error) }) })
      }, Promise.resolve())
    }
    // Some quick-reply forms are inserted later. Never load tools without one.
    var editorScheduled = false
    var editorObserver = new MutationObserver(function () {
      if (editorScheduled || !permitted('technique-search')) return
      editorScheduled = true
      load('technique-search').then(function () { return load('battle-assistant') }).then(function () {
        editorObserver.disconnect()
      }).catch(function (error) { editorScheduled = false; console.error(error) })
    })
    if ([1, 2, 5].indexOf(Number(window.GroupID || (window.FORUM && window.FORUM.group_id))) !== -1) {
      editorObserver.observe(document.body, { childList: true, subtree: true })
    }
    if (window.requestIdleCallback) requestIdleCallback(run, { timeout: 1500 })
    else setTimeout(run, 0)
  }
  function check() {
    if (started || document.readyState !== 'complete') return
    if (!document.querySelector('.punbb.forum-design--ready')) return
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
<script>(${installBackgroundPlugins.toString()})();</script>
<!-- forum-background:end -->`
}
