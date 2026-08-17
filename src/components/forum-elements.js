import { forumConfig } from '../config/forum.js'
import { t } from '../i18n/index.js'

const TITLE_RULES = [
  ['div.icon', 'forumElements.noNewMessages'],
  ['tr.inew div.icon', 'forumElements.newMessages'],
  ['tr.isticky div.icon', 'forumElements.importantTopic'],
  ['tr.iclosed div.icon', 'forumElements.closedTopic'],
  ['td.tcr a', 'forumElements.lastPost'],
  ['input[name="submit"]', 'forumElements.submit'],
  ['input[name="preview"]', 'forumElements.preview'],
  ['.pa-online', 'forumElements.online'],
]

export function initForumElements(root) {
  if (!root) return

  applyElementTitles(root)
  addDefaultAvatars(root)

  if (root.dataset.forumElementsObserverReady) return
  root.dataset.forumElementsObserverReady = 'true'

  const observer = new MutationObserver((mutations) => {
    mutations.forEach(({ addedNodes }) => {
      addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return
        applyElementTitles(node)
        addDefaultAvatars(node)
      })
    })
  })

  observer.observe(root, { childList: true, subtree: true })
}

function applyElementTitles(root) {
  TITLE_RULES.forEach(([selector, translationKey]) => {
    root.querySelectorAll(selector).forEach((element) => {
      element.title = t(translationKey)
      element.dataset.i18nAttr = `title:${translationKey}`
    })
  })
}

function addDefaultAvatars(root) {
  root.querySelectorAll('#pun-viewtopic .pa-title').forEach((title) => {
    const authorDetails = title.parentElement
    if (!authorDetails || authorDetails.querySelector('.pa-avatar')) return

    const avatarItem = document.createElement('li')
    const avatar = document.createElement('img')

    avatarItem.className = 'pa-avatar item2 pa-avatar--default'
    avatar.className = 'defavtr'
    avatar.src = forumConfig.posts.defaultAvatar
    avatar.alt = t('forumElements.defaultAvatar')
    avatar.dataset.i18nAttr = 'alt:forumElements.defaultAvatar'
    avatarItem.append(avatar)
    title.after(avatarItem)
  })
}
