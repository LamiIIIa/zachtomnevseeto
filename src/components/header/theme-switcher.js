import { t } from '../../i18n/index.js'
import { MOBILE_LAYOUT_QUERY } from '../../config/layout.js'

const STORAGE_KEY = 'selectedTheme'

const THEMES = [
  { name: 'shinobi', titleKey: 'themes.shinobi' },
  { name: 'oto', titleKey: 'themes.oto' },
  { name: 'akatsuki', titleKey: 'themes.akatsuki' },
  { name: 'green', titleKey: 'themes.green' },
  { name: 'kakashi', titleKey: 'themes.kakashi' },
]

export function applyStoredTheme() {
  const storedTheme = window.localStorage.getItem(STORAGE_KEY)
  setTheme(isKnownTheme(storedTheme) ? storedTheme : THEMES[0].name)
}

export function initThemeSwitcher(root = document) {
  const switcher = root?.querySelector('#theme_switcher')
  if (!switcher || switcher.dataset.forumDesignReady) return

  if (!switcher.children.length) {
    switcher.append(...THEMES.map(createThemeOption))
  } else {
    localizeThemeOptions(switcher)
  }

  switcher.addEventListener('change', (event) => {
    if (!(event.target instanceof HTMLInputElement)) return
    if (event.target.name !== 'switcher' || !isKnownTheme(event.target.value)) return
    setTheme(event.target.value)
  })

  switcher.dataset.forumDesignReady = 'true'
  applyStoredTheme()
  initMobilePlacement(switcher, root)
}

function initMobilePlacement(switcher, header) {
  if (!window.matchMedia || !header) return

  const placeholder = document.createComment('theme-switcher-position')
  switcher.before(placeholder)

  const picker = document.createElement('div')
  picker.className = 'mobile-theme-picker'

  const button = document.createElement('button')
  button.className = 'mobile-theme-picker__button'
  button.type = 'button'
  button.setAttribute('aria-controls', 'theme_switcher')
  button.setAttribute('aria-expanded', 'false')
  button.dataset.i18n = 'themes.menu'
  button.textContent = t('themes.menu')

  const closePicker = () => {
    picker.classList.remove('mobile-theme-picker--open')
    button.setAttribute('aria-expanded', 'false')
  }

  button.addEventListener('click', () => {
    const isOpen = picker.classList.toggle('mobile-theme-picker--open')
    button.setAttribute('aria-expanded', String(isOpen))
  })

  switcher.addEventListener('change', closePicker)
  document.addEventListener('pointerdown', (event) => {
    if (!picker.contains(event.target)) closePicker()
  })
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closePicker()
  })

  picker.append(button)
  header.append(picker)

  const media = window.matchMedia(MOBILE_LAYOUT_QUERY)
  const updatePlacement = () => {
    if (media.matches) {
      picker.append(switcher)
      return
    }

    closePicker()
    placeholder.after(switcher)
  }

  updatePlacement()
  media.addEventListener?.('change', updatePlacement)
}

function setTheme(theme) {
  document.documentElement.classList.remove(...THEMES.map(({ name }) => name))
  document.documentElement.classList.add(theme)
  window.localStorage.setItem(STORAGE_KEY, theme)

  const input = document.querySelector(`#theme_switcher input[value="${theme}"]`)
  if (input) input.checked = true
}

function createThemeOption({ name, titleKey }) {
  const title = t(titleKey)
  const item = document.createElement('li')
  item.title = title
  item.dataset.i18nAttr = `title:${titleKey}`

  const wrapper = document.createElement('span')
  wrapper.className = 'radio'

  const input = document.createElement('input')
  input.type = 'radio'
  input.name = 'switcher'
  input.id = name
  input.value = name

  const label = document.createElement('label')
  label.htmlFor = name
  label.textContent = title
  label.dataset.i18n = titleKey

  wrapper.append(input, label)
  item.append(wrapper)
  return item
}

function localizeThemeOptions(switcher) {
  THEMES.forEach(({ name, titleKey }) => {
    const input = switcher.querySelector(`input[value="${name}"]`)
    const item = input?.closest('li')
    const label = input?.id ? switcher.querySelector(`label[for="${input.id}"]`) : null
    const title = t(titleKey)

    if (item) {
      item.title = title
      item.dataset.i18nAttr = `title:${titleKey}`
    }

    if (label) {
      label.textContent = title
      label.dataset.i18n = titleKey
    }
  })
}

function isKnownTheme(theme) {
  return THEMES.some(({ name }) => name === theme)
}
