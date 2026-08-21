import { applyStoredTheme, initThemeSwitcher } from './theme-switcher.js'
import { initUserStatus } from './status.js'
import { initMobileImportantLinks } from './mobile-important-links.js'
import { initHeaderNews } from './news.js'
import { applyStoredViewportMode, initViewportModeToggle } from './viewport-mode.js'

export { applyStoredTheme, applyStoredViewportMode }

export function initHeader({ root }) {
  const title = root.querySelector('#pun-title')
  const navigation = root.querySelector('#pun-navlinks')
  const announcement = root.querySelector('#pun-announcement')
  const status = root.querySelector('#pun-status')

  title?.classList.add('forum-header__title')
  navigation?.classList.add('forum-header__navigation')
  announcement?.classList.add('forum-header')
  status?.classList.add('forum-header__status')

  initThemeSwitcher(announcement)
  initViewportModeToggle(announcement)
  initMobileImportantLinks(announcement)
  initHeaderNews(announcement)
  initUserStatus(root)
}
