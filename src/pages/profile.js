import { forumConfig } from '../config/forum.js'
import { t } from '../i18n/index.js'

export function initProfile({ main, userId }) {
  main?.classList.add('forum-design-profile')
  if (userId !== null) main?.setAttribute('data-user-id', String(userId))

  lockRestrictedProfile(main)
}

function lockRestrictedProfile(main) {
  if (!main || !forumConfig.profile.lockedGroupIds.includes(Number(window.GroupID))) return

  const submitButtons = main.querySelectorAll('input[type="submit"], button[type="submit"]')
  if (!submitButtons.length) return

  submitButtons.forEach((button) => {
    button.disabled = true
  })

  const submitArea = main.querySelector('.formsubmit')
  if (!submitArea || submitArea.querySelector('.profile-lock-notice')) return

  const notice = document.createElement('span')
  notice.className = 'profile-lock-notice'
  notice.dataset.i18n = 'profile.editLocked'
  notice.textContent = t('profile.editLocked')
  submitArea.append(notice)
}
