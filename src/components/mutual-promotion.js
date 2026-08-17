import { forumConfig } from '../config/forum.js'
import { t } from '../i18n/index.js'

export function initMutualPromotion(root) {
  // Адаптация «Взаимной рекламы» v1.2 © max, the murderer! без jQuery.
  if (!root || !isPromotionTopic()) return

  initPromotionPosts(root)
  disableConflictingReportButton()

  if (root.dataset.mutualPromotionObserverReady) return
  root.dataset.mutualPromotionObserverReady = 'true'

  const observer = new MutationObserver((mutations) => {
    mutations.forEach(({ addedNodes }) => {
      addedNodes.forEach((node) => {
        if (node instanceof Element) initPromotionPosts(node)
      })
    })
  })

  observer.observe(root, { childList: true, subtree: true })
}

function isPromotionTopic() {
  const groupId = Number(window.GroupID)
  if (!forumConfig.mutualPromotion.allowedGroupIds.includes(groupId)) return false

  try {
    const topicSubject = window.FORUM?.get?.('topic.subject') || ''
    return forumConfig.mutualPromotion.topicPattern.test(topicSubject)
  } catch {
    return false
  }
}

function initPromotionPosts(root) {
  const posts = []
  if (root instanceof Element && root.matches('.post')) posts.push(root)
  posts.push(...root.querySelectorAll('.post'))

  posts.forEach((post) => {
    if (post.dataset.mutualPromotionReady) return

    const actions = post.querySelector('.post-links ul')
    const permalink = post.querySelector('h3 a.permalink, a.permalink')
    if (!actions || !permalink) return
    if (actions.querySelector('.pl-mutualPR')) {
      post.dataset.mutualPromotionReady = 'existing'
      return
    }

    const item = document.createElement('li')
    const button = document.createElement('button')

    item.className = 'pl-mutualPR'
    button.type = 'button'
    button.className = 'post-link-button'
    button.textContent = t('mutualPromotion.copy')
    button.dataset.i18n = 'mutualPromotion.copy'
    button.addEventListener('click', async () => {
      const text = `${createRandomTemplate()}\n\n[url=${permalink.href}]${t(
        'mutualPromotion.backlink',
      )}[/url]`

      const copied = await copyText(text)
      notifyCopyResult(button, copied)
    })

    item.append(button)
    actions.append(item)
    post.dataset.mutualPromotionReady = 'true'
  })
}

function createRandomTemplate() {
  const { images } = forumConfig.mutualPromotion
  const image = images[Math.floor(Math.random() * images.length)]
  const origin = forumConfig.primaryOrigin

  return [
    `[align=center][url=${origin}/][img]${image}[/img][/url][/align]`,
    `[align=center][url=${origin}/viewtopic.php?id=99]сюжет[/url] | ` +
      `[url=${origin}/viewtopic.php?id=214]ищем[/url] | ` +
      `[url=${origin}/viewtopic.php?id=192#p1721]роли[/url][/align]`,
  ].join('')
}

async function copyText(text) {
  try {
    await window.navigator.clipboard.writeText(text)
    return true
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.className = 'clipboard-fallback'
    document.body.append(textarea)
    textarea.select()

    try {
      return document.execCommand('copy')
    } catch {
      return false
    } finally {
      textarea.remove()
    }
  }
}

function notifyCopyResult(button, copied) {
  const originalText = t('mutualPromotion.copy')
  button.textContent = t(copied ? 'mutualPromotion.copied' : 'mutualPromotion.copyError')

  window.setTimeout(() => {
    button.textContent = originalText
  }, 2_000)
}

function disableConflictingReportButton() {
  if (window.RusffCore?.sets) window.RusffCore.sets.show_reportBtn = 0
}
