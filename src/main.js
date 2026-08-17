import './styles/main.css'

import { initCommon } from './components/common.js'
import { applyStoredTheme, initHeader } from './components/header/index.js'
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
  messages: initMessages,
  post: initPostEditor,
  edit: initPostEditor,
  login: initAuth,
  register: initAuth,
}

// Применяем тему до DOMContentLoaded, чтобы уменьшить мигание оформления.
applyStoredTheme()

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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => void init(), { once: true })
} else {
  void init()
}
