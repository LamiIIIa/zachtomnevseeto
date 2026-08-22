import { t } from '../i18n/index.js'
import { MOBILE_LAYOUT_QUERY } from '../config/layout.js'

const EDGE_OFFSET = 250

export function initScrollControls() {
  if (!document.body) return

  const topControl = getOrCreateControl({
    id: 'ToTop',
    className: 'go-up',
    labelKey: 'scroll.toTop',
  })
  const bottomControl = getOrCreateControl({
    id: 'OnBottom',
    className: 'go-down',
    labelKey: 'scroll.toBottom',
  })

  if (topControl.dataset.forumDesignReady) return

  topControl.dataset.forumDesignReady = 'true'
  bottomControl.dataset.forumDesignReady = 'true'

  const media = window.matchMedia?.(MOBILE_LAYOUT_QUERY)
  let scrollRoot = getPageScrollRoot()
  let scrollTarget = getScrollEventTarget(scrollRoot)

  const updatePlacement = () => {
    const mobileDock = document.querySelector('.mobile-dock')
    const target = media?.matches && mobileDock ? mobileDock : document.body

    target.append(topControl, bottomControl)
  }

  topControl.addEventListener('click', () => {
    scrollPageTo(scrollRoot, 0)
  })

  bottomControl.addEventListener('click', () => {
    scrollPageTo(scrollRoot, scrollRoot.scrollHeight)
  })

  let updateRequested = false
  const updateVisibility = () => {
    const scrollTop = getScrollTop(scrollRoot)
    const distanceToBottom =
      scrollRoot.scrollHeight - (scrollTop + scrollRoot.clientHeight)

    topControl.classList.toggle('scroll-control--visible', scrollTop > EDGE_OFFSET)
    bottomControl.classList.toggle(
      'scroll-control--visible',
      distanceToBottom > EDGE_OFFSET,
    )
    updateRequested = false
  }

  const requestUpdate = () => {
    if (updateRequested) return
    updateRequested = true
    window.requestAnimationFrame(updateVisibility)
  }

  const updateScrollRoot = () => {
    const nextRoot = getPageScrollRoot()
    const nextTarget = getScrollEventTarget(nextRoot)

    if (nextTarget !== scrollTarget) {
      scrollTarget.removeEventListener('scroll', requestUpdate)
      nextTarget.addEventListener('scroll', requestUpdate, { passive: true })
      scrollTarget = nextTarget
    }

    scrollRoot = nextRoot
  }

  scrollTarget.addEventListener('scroll', requestUpdate, { passive: true })
  window.addEventListener('resize', requestUpdate)
  media?.addEventListener?.('change', () => {
    updatePlacement()
    updateScrollRoot()
    requestUpdate()
  })
  updatePlacement()
  updateScrollRoot()
  updateVisibility()
}

function getPageScrollRoot() {
  const documentRoot = document.scrollingElement || document.documentElement

  /*
   * На мобильном стандартный mobile.css MyBB объявляет body прокручиваемым,
   * хотя настоящим корнем документа остаётся document.scrollingElement.
   * Прокрутка body заставляет браузер перерисовывать его десктопный фон и в
   * Safari часто заканчивается резким прыжком вместо плавной анимации.
   */
  if (window.matchMedia?.(MOBILE_LAYOUT_QUERY).matches) return documentRoot

  const body = document.body

  if (body) {
    const overflowY = window.getComputedStyle(body).overflowY
    const bodyOwnsScroll =
      /^(auto|scroll)$/.test(overflowY) && body.scrollHeight > body.clientHeight + 1

    if (bodyOwnsScroll) return body
  }

  return documentRoot
}

function getScrollEventTarget(scrollRoot) {
  return scrollRoot === document.documentElement ? window : scrollRoot
}

function getScrollTop(scrollRoot) {
  return scrollRoot === document.documentElement ? window.scrollY : scrollRoot.scrollTop
}

function scrollPageTo(scrollRoot, top) {
  const options = { top, behavior: getScrollBehavior() }

  if (scrollRoot === document.documentElement) {
    window.scrollTo(options)
    return
  }

  scrollRoot.scrollTo(options)
}

function getOrCreateControl({ id, className, labelKey }) {
  let control = document.getElementById(id)

  if (!control) {
    control = document.createElement('div')
    control.id = id
    control.className = className
    document.body.append(control)
  }

  control.classList.add(className)
  control.setAttribute('role', 'button')
  control.tabIndex = 0
  control.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      control.click()
    }
  })

  let inside = control.querySelector(':scope > .inside')

  if (!inside) {
    inside = document.createElement('div')
    inside.className = 'inside'
    control.replaceChildren(inside)
  }

  if (!inside.querySelector(':scope > .scroll-control__icon')) {
    const icon = document.createElement('span')

    icon.className = 'scroll-control__icon'
    icon.setAttribute('aria-hidden', 'true')
    inside.replaceChildren(icon)
  }

  control.setAttribute('aria-label', t(labelKey))
  control.dataset.i18nAttr = `aria-label:${labelKey}`
  return control
}

function getScrollBehavior() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
}
