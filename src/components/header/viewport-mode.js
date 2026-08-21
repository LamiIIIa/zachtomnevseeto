import { t } from '../../i18n/index.js'
import {
  DESKTOP_VIEWPORT_WIDTH,
  MOBILE_LAYOUT_QUERY,
} from '../../config/layout.js'

const STORAGE_KEY = 'forumViewportMode'
const DESKTOP_MODE = 'desktop'
const MOBILE_VIEWPORT = 'width=device-width, initial-scale=1'
const DESKTOP_VIEWPORT = `width=${DESKTOP_VIEWPORT_WIDTH}`

export function applyStoredViewportMode() {
  setViewportContent(getStoredMode() === DESKTOP_MODE ? DESKTOP_VIEWPORT : MOBILE_VIEWPORT)
}

export function initViewportModeToggle(header) {
  if (!header || !window.matchMedia) return

  const desktopTarget = header.querySelector('.ripbottom')
  const mobileTarget = header.querySelector('.mobile-theme-picker')
  if (!desktopTarget || !mobileTarget) return

  const button = document.createElement('button')
  let desktopModeEnabled = getStoredMode() === DESKTOP_MODE
  const media = window.matchMedia(MOBILE_LAYOUT_QUERY)

  button.type = 'button'
  button.className = 'viewport-mode-toggle'

  const updateButton = () => {
    const translationKey = desktopModeEnabled
      ? 'viewportMode.enableMobile'
      : 'viewportMode.disableMobile'
    const titleKey = media.matches ? translationKey : 'viewportMode.enableMobile'

    button.textContent = t(translationKey)
    button.title = t(titleKey)
    button.setAttribute('aria-label', t(translationKey))
    button.dataset.tooltip = t('viewportMode.enableMobile')
    button.dataset.i18n = translationKey
    button.dataset.i18nAttr = `title:${titleKey};aria-label:${translationKey};data-tooltip:viewportMode.enableMobile`
  }

  button.addEventListener('click', () => {
    if (desktopModeEnabled) {
      window.localStorage.removeItem(STORAGE_KEY)
    } else {
      window.localStorage.setItem(STORAGE_KEY, DESKTOP_MODE)
    }

    desktopModeEnabled = !desktopModeEnabled
    applyStoredViewportMode()
    window.location.reload()
  })

  const updatePlacement = () => {
    if (media.matches) {
      mobileTarget.append(button)
      updateButton()
      return
    }

    const contactTitle = desktopTarget.querySelector(':scope > p:first-child')
    contactTitle?.prepend(button)
    updateButton()
  }

  updateButton()
  updatePlacement()
  media.addEventListener?.('change', updatePlacement)
}

function getStoredMode() {
  return window.localStorage.getItem(STORAGE_KEY)
}

function setViewportContent(content) {
  let viewport = document.querySelector('meta[name="viewport"]')

  if (!viewport) {
    viewport = document.createElement('meta')
    viewport.name = 'viewport'
    document.head.append(viewport)
  }

  viewport.content = content
}
