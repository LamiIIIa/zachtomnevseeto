import './styles/main.css'

import { initCommon } from './components/common.js'
import { applyStoredTheme, initHeader } from './components/header/index.js'
import { getPageContext } from './core/page-context.js'
import { initAuth } from './pages/auth.js'
import { initForumIndex } from './pages/forum-index.js'
import { initForumView } from './pages/forum-view.js'
import { initMessages } from './pages/messages.js'
import { initPostEditor } from './pages/post-editor.js'
import { initProfile } from './pages/profile.js'
import { initSearch } from './pages/search.js'
import { initTopicView } from './pages/topic-view.js'
import { initUserList } from './pages/user-list.js'

const pageInitializers = {
  index: initForumIndex,
  viewforum: initForumView,
  viewtopic: initTopicView,
  profile: initProfile,
  userlist: initUserList,
  search: initSearch,
  messages: initMessages,
  post: initPostEditor,
  edit: initPostEditor,
  login: initAuth,
  register: initAuth,
}

// Применяем тему до DOMContentLoaded, чтобы уменьшить мигание оформления.
applyStoredTheme()

function init() {
  const context = getPageContext()
  if (!context) return

  context.root.classList.add('forum-design')
  context.root.dataset.forumPage = context.page
  initCommon(context)
  initHeader(context)
  pageInitializers[context.page]?.(context)
  context.root.classList.add('forum-design--ready')
  document.dispatchEvent(new CustomEvent('forum-design:ready', { detail: context }))
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true })
} else {
  init()
}
