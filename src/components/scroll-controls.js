import { t } from '../i18n/index.js'

const EDGE_OFFSET = 250

export function initScrollControls() {
  if (!document.body) return

  const topControl = getOrCreateControl({
    id: 'ToTop',
    className: 'go-up',
    iconClassName: 'upper',
    labelKey: 'scroll.toTop',
  })
  const bottomControl = getOrCreateControl({
    id: 'OnBottom',
    className: 'go-down',
    iconClassName: 'dvnr',
    labelKey: 'scroll.toBottom',
  })

  if (topControl.dataset.forumDesignReady) return

  topControl.dataset.forumDesignReady = 'true'
  bottomControl.dataset.forumDesignReady = 'true'

  topControl.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: getScrollBehavior() })
  })

  bottomControl.addEventListener('click', () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: getScrollBehavior() })
  })

  let updateRequested = false
  const updateVisibility = () => {
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
    topControl.classList.toggle('scroll-control--visible', window.scrollY > EDGE_OFFSET)
    bottomControl.classList.toggle(
      'scroll-control--visible',
      maxScroll - window.scrollY > EDGE_OFFSET,
    )
    updateRequested = false
  }

  const requestUpdate = () => {
    if (updateRequested) return
    updateRequested = true
    window.requestAnimationFrame(updateVisibility)
  }

  window.addEventListener('scroll', requestUpdate, { passive: true })
  window.addEventListener('resize', requestUpdate)
  updateVisibility()
}

function getOrCreateControl({ id, className, iconClassName, labelKey }) {
  let control = document.getElementById(id)

  if (!control) {
    control = document.createElement('button')
    control.id = id
    control.className = className
    document.body.append(control)
  }

  if (control instanceof HTMLButtonElement) {
    control.type = 'button'
  } else {
    control.setAttribute('role', 'button')
    control.tabIndex = 0
    control.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        control.click()
      }
    })
  }

  if (!control.querySelector(`.${iconClassName}`)) {
    const icon = document.createElement('span')
    icon.className = iconClassName
    icon.setAttribute('aria-hidden', 'true')
    control.append(icon)
  }

  control.setAttribute('aria-label', t(labelKey))
  control.dataset.i18nAttr = `aria-label:${labelKey}`
  return control
}

function getScrollBehavior() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
}
