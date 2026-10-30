import './styles/main.css'

import { initCommon } from './components/common.js'
import {
  applyStoredTheme,
  applyStoredViewportMode,
  initHeader,
} from './components/header/index.js'
import { getPageContext } from './core/page-context.js'
import { initI18n } from './i18n/index.js'
import { initAuth } from './pages/auth.js'
import { initForumIndex } from './pages/forum-index.js'
import { initForumModeration } from './pages/forum-moderation.js'
import { initForumView } from './pages/forum-view.js'
import { initMessages } from './pages/messages.js'
import { initPostEditor } from './pages/post-editor.js'
import { initProfile } from './pages/profile.js'
import { initSearch } from './pages/search.js'
import { initTopicView } from './pages/topic-view.js'
import { initUserList } from './pages/user-list.js'

const CSS_READY_MARKER = '--forum-design-css-ready'
const CSS_FALLBACK_ID = 'forum-design-css-fallback'
const currentBundleUrl = document.currentScript?.src ?? ''
const explicitStyleUrl = document.currentScript?.dataset.forumCss ?? ''

const pageInitializers = {
  index: initForumIndex,
  modviewforum: initForumModeration,
  viewforum: initForumView,
  viewtopic: initTopicView,
  profile: initProfile,
  changepass: initProfile,
  upavatar: initProfile,
  userlist: initUserList,
  search: initSearch,
  searchtopics: initSearch,
  messages: initMessages,
  post: initPostEditor,
  edit: initPostEditor,
  login: initAuth,
  register: initAuth,
}

function forumCssIsReady() {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(CSS_READY_MARKER)
    .trim() === '1'
}

function getFallbackStyleUrl() {
  if (explicitStyleUrl) return new URL(explicitStyleUrl, window.location.href).href
  if (!currentBundleUrl) return null

  const bundleUrl = new URL(currentBundleUrl, window.location.href)
  const styleUrl = new URL('forum.css', bundleUrl)
  styleUrl.search = bundleUrl.search

  return styleUrl.href
}

function waitForPageLoad() {
  if (document.readyState === 'complete') return Promise.resolve()

  return new Promise((resolve) => {
    window.addEventListener('load', resolve, { once: true })
  })
}

function waitForCssMarker(maxAttempts = 10) {
  return new Promise((resolve) => {
    let attempts = 0

    const checkMarker = () => {
      if (forumCssIsReady()) {
        resolve(true)
        return
      }

      attempts += 1
      if (attempts >= maxAttempts) {
        resolve(false)
        return
      }

      window.setTimeout(checkMarker, 50)
    }

    checkMarker()
  })
}

function loadFallbackStyles() {
  const styleUrl = getFallbackStyleUrl()
  if (!styleUrl) return Promise.resolve(false)

  return new Promise((resolve) => {
    const existingLink = document.getElementById(CSS_FALLBACK_ID)
    const link = existingLink ?? document.createElement('link')
    let isSettling = false
    let fallbackTimeout

    const settle = () => {
      if (isSettling) return

      isSettling = true
      window.clearTimeout(fallbackTimeout)
      void waitForCssMarker().then(resolve)
    }

    link.id = CSS_FALLBACK_ID
    link.rel = 'stylesheet'
    link.addEventListener('load', settle, { once: true })
    link.addEventListener('error', settle, { once: true })
    fallbackTimeout = window.setTimeout(settle, 12_000)
    link.href = styleUrl

    if (!existingLink) document.head.append(link)
  })
}

async function ensureForumStyles() {
  if (forumCssIsReady()) return true

  // Даём основному @import завершиться, прежде чем создавать резервный link.
  await waitForPageLoad()
  if (forumCssIsReady()) return true

  return loadFallbackStyles()
}

async function init() {
  const context = getPageContext()
  if (!context) return

  try {
    await initI18n(context.root)
  } catch (error) {
    console.error('Не удалось инициализировать локализацию форума', error)
  }
  context.root.classList.add('forum-design')
  context.root.dataset.forumPage = context.page
  initCommon(context)
  initHeader(context)
  pageInitializers[context.page]?.(context)
  context.root.classList.add('forum-design--ready')
  document.dispatchEvent(new CustomEvent('forum-design:ready', { detail: context }))
}

async function boot() {
  const stylesAreReady = await ensureForumStyles()

  if (!stylesAreReady) {
    document.documentElement.classList.add('forum-design-css-failed')
    console.error('Не удалось загрузить оформление форума; преобразование DOM отменено')
    return
  }

  // Применяем viewport и тему до инициализации DOM, чтобы уменьшить мигание.
  applyStoredViewportMode()
  applyStoredTheme()

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => void init(), { once: true })
  } else {
    await init()
  }
}

void boot()
