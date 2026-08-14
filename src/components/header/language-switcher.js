import { changeLanguage, getLanguage, t, translateDom } from '../../i18n/index.js'

const LANGUAGES = ['ru', 'en']

export function initLanguageSwitcher(root = document) {
  if (!root || root.querySelector('[data-language-switcher]')) return

  const switcher = createLanguageSwitcher()
  const themeSwitcher = root.querySelector('#theme_switcher')

  if (themeSwitcher) themeSwitcher.insertAdjacentElement('afterend', switcher)
  else root.append(switcher)

  translateDom(switcher)
}

function createLanguageSwitcher() {
  const wrapper = document.createElement('div')
  wrapper.className = 'forum-language-switcher'
  wrapper.dataset.languageSwitcher = 'true'

  const label = document.createElement('label')
  label.className = 'forum-language-switcher__label'
  label.htmlFor = 'forum-language'
  label.dataset.i18n = 'language.label'
  label.textContent = t('language.label')

  const select = document.createElement('select')
  select.className = 'forum-language-switcher__select'
  select.id = 'forum-language'
  select.setAttribute('aria-label', t('language.label'))
  select.dataset.i18nAttr = 'aria-label:language.label'
  select.append(...LANGUAGES.map(createLanguageOption))
  select.value = getLanguage()

  select.addEventListener('change', () => {
    void changeLanguage(select.value).catch((error) => {
      select.value = getLanguage()
      console.error('Не удалось переключить язык форума', error)
    })
  })

  document.addEventListener('forum-language-changed', (event) => {
    select.value = event.detail.language
  })

  wrapper.append(label, select)
  return wrapper
}

function createLanguageOption(language) {
  const option = document.createElement('option')
  option.value = language
  option.dataset.i18n = `language.options.${language}`
  option.textContent = t(`language.options.${language}`)
  return option
}
