import { createHash } from 'node:crypto'

// Related notification/voting/realtime modules and visibility guards are
// deliberately absent: their original tags and inline configuration stay put.
export const extraRules = {
  '67329': ['episode-generator', 'episode'],
  '74246': ['chronology-tabs', 'chronology'],
  '19286': ['application-generator', 'application'],
  '26781': ['pr-login', 'all'],
  '77306': ['quote-avatars', 'posts'],
  '86722': ['html-code-editor', 'editor'],
  '26102': ['code-selection', 'content'],
  '29572': ['profile-fields', 'masks'],
  '89289': ['profile-masks', 'masks'],
  '58594': ['profile-fields-legacy', 'profile'],
  '53719': ['tooltips', 'all'],
  '31001': ['post-font-size', 'posts'],
  '24001': ['vote-spoiler', 'content'],
  '90542': ['post-preview', 'editor'],
  '72467': ['advent-calendar', 'advent'],
  '35234': ['profile-stats-tooltip', 'masks'],
  '18791': ['turn-vitals', 'posts'],
  '57022': ['banner-scroll', 'banners'],
  '84381': ['technique-builder', 'topic:71'],
  '61274': ['lottery', 'topic:361'],
  '36574': ['lottery-results', 'lottery-results'],
  '45580': ['orochimaru-quest', 'topic:537'],
  '81485': ['anbu-exam', 'topic:538'],
  '98830': ['mask-quest', 'topic:539'],
}

function criticalHints() {
  if (document.querySelector('link[data-forum-critical-hint]')) return
  var base = String(window.StaticURL || 'https://forumstatic.ru').replace(/\/$/, '')
  var hour = Math.floor(Number(window.RequestTime || Date.now() / 1000) / 3600)
  function hint(href, as) {
    var link = document.createElement('link')
    link.rel = 'preload'; link.as = as; link.href = href
    link.setAttribute('data-forum-critical-hint', '1')
    link.setAttribute('fetchpriority', 'high')
    document.head.appendChild(link)
  }
  ;['notifications.core', 'notifications.tgbot', 'notifications.mentions',
    'notifications.subscriptions', 'notifications.common', 'notifications.important',
    'reputation.core', 'realtime.core'].forEach(function (name) {
    hint(base + '/f/ru/bestbb/' + name + '.js?' + hour, 'script')
  })
  ;['notifications.tgbot', 'notifications.mentions'].forEach(function (name) {
    hint(base + '/f/ru/bestbb/' + name + '.css?' + hour, 'style')
  })
}

function installDeferredExtras() {
  if (window.forumDeferredExtras || /\/admin_[^/]*\.php$/i.test(location.pathname)) return
  var state = { ready: false, errors: [], onReady: onReady }
  var readyCallbacks = [], done = {}, running = false, started = false, scheduled = false
  window.forumDeferredExtras = state
  function onReady(callback) { if (state.ready) callback(); else readyCallbacks.push(callback) }
  function editor() {
    return !!document.querySelector('#pun-viewtopic textarea[name="req_message"],#pun-post textarea[name="req_message"],#pun-edit textarea[name="req_message"],#pun-messages textarea[name="req_message"],form[action*="post.php"] textarea[name="req_message"],form[action*="edit.php"] textarea[name="req_message"]')
  }
  function eligible(rule) {
    var posts = !!document.querySelector('.post,#messages')
    if (rule === 'all') return true
    if (rule === 'posts') return posts
    if (rule === 'content') return posts || editor()
    if (rule === 'editor') return editor()
    if (rule === 'profile') return !!document.querySelector('#pun-profile')
    if (rule === 'masks') return posts || editor() || !!document.querySelector('#pun-profile')
    if (rule === 'episode') return !!document.querySelector('[data-episode-generator]')
    if (rule === 'chronology') return !!document.querySelector('.bbchron')
    if (rule === 'application') return !!document.querySelector('[data-anketa-generator-v6]')
    if (rule === 'banners') return !!document.querySelector('.bannerc')
    if (rule === 'advent') return !!document.querySelector('#akatsuki-advent-calendar') || (document.querySelector('#pun-main')?.textContent || '').includes('[advent-calcendar-universal]') || new URLSearchParams(location.search).has('adventDate')
    if (rule === 'lottery-results') return !!document.querySelector('[data-lottery-result]') || /\[lottery-(?:result|results|calc)\]/.test(document.querySelector('#pun-main')?.textContent || '')
    if (rule.indexOf('topic:') === 0) return /\/viewtopic\.php$/i.test(location.pathname) && new URLSearchParams(location.search).get('id') === rule.slice(6)
    return false
  }
  function source(item) {
    if (item.id === 'pr-login') {
      return String(window.StaticURL || 'https://forumstatic.ru').replace(/\/$/, '') + '/files/0016/0b/c8/37000.js?' + Math.floor(Number(window.RequestTime || Date.now() / 1000) / 86400)
    }
    return item.src
  }
  function execute(item) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script'), timer, runtimeError
      function onError(event) {
        if ((item.src && event.filename === script.src) || (!item.src && document.currentScript === script)) runtimeError = event.error || new Error(event.message)
      }
      function cleanup() { clearTimeout(timer); window.removeEventListener('error', onError) }
      window.addEventListener('error', onError)
      Object.keys(item.attributes || {}).forEach(function (name) { script.setAttribute(name, item.attributes[name]) })
      script.setAttribute('data-forum-extra-loaded', item.id)
      if (item.src) {
        script.async = true; script.src = source(item)
        script.onload = function () { cleanup(); if (runtimeError) reject(runtimeError); else resolve() }
        script.onerror = function () { cleanup(); script.remove(); reject(new Error('Extra failed: ' + item.id)) }
        timer = setTimeout(function () { cleanup(); script.remove(); reject(new Error('Extra timeout: ' + item.id)) }, 12000)
      } else script.textContent = item.code
      // Legacy plugins inspect script:last to validate their own URL.
      document.body.appendChild(script)
      if (!item.src) { cleanup(); if (runtimeError) reject(runtimeError); else resolve() }
    })
  }
  function items() {
    return Array.from(document.querySelectorAll('script[data-forum-extra]')).map(function (node) { return JSON.parse(node.textContent) })
  }
  async function run() {
    if (running) return
    running = true
    try {
      var pending = items().filter(function (item) { return !done[item.id] && eligible(item.rule) })
      // Download independent files together, execute in original dependency order.
      pending.forEach(function (item) {
        if (!item.src) return
        var hint = document.createElement('link')
        hint.rel = 'preload'; hint.as = 'script'; hint.href = source(item)
        hint.setAttribute('fetchpriority', 'low'); document.head.appendChild(hint)
      })
      for (var item of pending) {
        done[item.id] = true
        try { await execute(item) }
        catch (error) { state.errors.push({ id: item.id, message: error.message }); console.error(error) }
      }
      while (readyCallbacks.length) {
        try { readyCallbacks.shift()() } catch (error) { state.errors.push({ message: error.message }); console.error(error) }
      }
    } finally {
      state.ready = true; running = false
      document.dispatchEvent(new Event('forum-extras:ready'))
    }
  }
  function schedule() {
    if (scheduled || running || !items().some(function (item) { return !done[item.id] && eligible(item.rule) })) return
    scheduled = true
    var next = function () { scheduled = false; void run() }
    if (window.requestIdleCallback) requestIdleCallback(next, { timeout: 1200 })
    else setTimeout(next, 0)
  }
  function start() {
    if (started || document.readyState !== 'complete' || !document.querySelector('.punbb.forum-design--ready')) return
    started = true
    document.removeEventListener('forum-design:ready', start)
    document.removeEventListener('DOMContentLoaded', start)
    window.removeEventListener('load', start)
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      void run().then(function () {
        new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true })
      })
    }) })
  }
  document.addEventListener('forum-design:ready', start)
  document.addEventListener('DOMContentLoaded', start)
  window.addEventListener('load', start)
  start()
}

const tokens = /<!--[\s\S]*?-->|<script\b([^>]*)>([\s\S]*?)<\/script>|<img\b[^>]*>/gi
function inlineRule(code) {
  if (/\bPR\.(?:nick|set|pass)/.test(code)) return 'all'
  if (/\bselect_text\b|\bsetLinkAndAva\s*\(/.test(code)) return 'content'
  if (/hvScriptSet\.addMask/.test(code)) return 'masks'
  if (/\bPPREV\b|\bParseContent\b|\bsetCookiePPrev\b/.test(code)) return 'editor'
  // Keep initial text transforms before applications mount. Rewriting their
  // innerHTML later would destroy already-attached application handlers.
  if (/button-float|\[float=|\.post-content.*\.html/s.test(code)) return null
  if (/oroPump|mybb-ghosts/.test(code)) return 'all'
  if (/akatsukiQuestPageLoader/.test(code)) return 'posts'
  return null
}
export function patchExtras(source, section, urls = {}) {
  const clean = source.replace(/(?:\r?\n)?<!-- forum-extras-bootstrap:start -->[\s\S]*?<!-- forum-extras-bootstrap:end -->\s*/g, '')
  const patched = clean.replace(tokens, (whole, attrs, code) => {
    if (whole.startsWith('<!--')) return whole
    if (/^<img\b/i.test(whole)) {
      if (section !== 'footer') return whole
      let tag = whole
      for (const [name, value] of Object.entries({ loading: 'lazy', decoding: 'async', fetchpriority: 'low' })) {
        if (!new RegExp(`\\b${name}\\s*=`, 'i').test(tag)) tag = tag.replace(/\s*\/?>$/, ` ${name}="${value}">`)
      }
      return tag
    }
    const descriptor = attrs.match(/data-forum-extra=["']([^"']+)/)
    let item
    if (descriptor) item = JSON.parse(code)
    else {
      const src = attrs.match(/\bsrc=["']([^"']+)["']/i)?.[1]
      if (src) {
        const file = src.match(/\/files\/[\da-f/]+\/(\d+)\.js(?:[?#]|$)/i)?.[1]
        const rule = extraRules[file]
        if (!rule) return whole
        item = { id: rule[0], rule: rule[1], src, attributes: Object.fromEntries([...attrs.matchAll(/\b(charset|addComment|data-[\w-]+)=["']([^"']*)["']/gi)].map(m => [m[1], m[2]])) }
      } else {
        if (/data-forum-plugin|application\/json/.test(attrs)) return whole
        const rule = inlineRule(code)
        if (!rule) return whole
        item = { id: `${section}-inline-${createHash('sha256').update(code).digest('hex').slice(0, 16)}`, rule, code, attributes: {} }
      }
    }
    if (urls[item.id]) { item.src = urls[item.id]; item.attributes.charset = 'utf-8' }
    const json = JSON.stringify(item).replace(/[^\x00-\x7f]/g, char => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`).replace(/</g, '\\u003c')
    return `<script type="application/json" data-forum-extra="${item.id}">${json}</script>`
  })
  if (section !== 'header') return patched
  return `<!-- forum-extras-bootstrap:start -->\n<script>(${criticalHints.toString()})();\n(${installDeferredExtras.toString()})();</script>\n<!-- forum-extras-bootstrap:end -->\n` + patched
}
