import { t } from '../../i18n/index.js'

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
