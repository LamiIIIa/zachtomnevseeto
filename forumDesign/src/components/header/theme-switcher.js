const STORAGE_KEY = 'selectedTheme'

const THEMES = [
  { name: 'shinobi', title: 'Даттебайо!' },
  { name: 'oto', title: 'Я бессмертен!' },
  { name: 'akatsuki', title: 'Познай боль!' },
  { name: 'green', title: 'Сила Юности!' },
  { name: 'kakashi', title: 'Как бы это сказать...' },
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

function createThemeOption({ name, title }) {
  const item = document.createElement('li')
  item.title = title

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

  wrapper.append(input, label)
  item.append(wrapper)
  return item
}

function isKnownTheme(theme) {
  return THEMES.some(({ name }) => name === theme)
}
