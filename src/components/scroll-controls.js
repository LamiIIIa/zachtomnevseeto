import { t } from '../i18n/index.js'

const EDGE_OFFSET = 250
const BOTTOM_EDGE_OFFSET = 999

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

  topControl.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: getScrollBehavior() })
  })

  bottomControl.addEventListener('click', () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: getScrollBehavior() })
  })

  let updateRequested = false
  const updateVisibility = () => {
    topControl.classList.toggle('scroll-control--visible', window.scrollY > EDGE_OFFSET)
    bottomControl.classList.toggle(
      'scroll-control--visible',
      window.scrollY < document.documentElement.scrollHeight - BOTTOM_EDGE_OFFSET,
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
