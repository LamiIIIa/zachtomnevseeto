import i18next from 'i18next'

import en from './locales/en.js'
import ru from './locales/ru.js'

const STORAGE_KEY = 'forumLanguage'
const DEFAULT_LANGUAGE = 'ru'
const SUPPORTED_LANGUAGES = ['ru', 'en']

let initialization
let isWatchingLanguage = false

export function initI18n(root = document) {
  if (!initialization) {
    initialization = i18next.init({
      lng: getInitialLanguage(),
      fallbackLng: DEFAULT_LANGUAGE,
      supportedLngs: SUPPORTED_LANGUAGES,
      load: 'languageOnly',
      resources: {
        ru: { translation: ru },
        en: { translation: en },
      },
      interpolation: {
        escapeValue: false,
      },
    })
  }

  return initialization.then(() => {
    watchLanguageChanges()
    exposePublicApi()
    applyLanguage(i18next.resolvedLanguage)
    translateDom(root)
    return i18next
  })
}

export async function changeLanguage(language) {
  await initI18n()
  const normalizedLanguage = normalizeLanguage(language)
  if (!normalizedLanguage || normalizedLanguage === getLanguage()) return
  await i18next.changeLanguage(normalizedLanguage)
}

export function getLanguage() {
  return normalizeLanguage(i18next.resolvedLanguage) || DEFAULT_LANGUAGE
}

export function t(key, options) {
  return i18next.t(key, options)
}

export function translateDom(root = document) {
  if (!root) return

  collectTranslatableElements(root).forEach((element) => {
    const options = getTranslationOptions(element)
    const contentKey = element.dataset.i18n

    if (contentKey) element.textContent = t(contentKey, options)

    parseAttributeTranslations(element.dataset.i18nAttr).forEach(({ attribute, key }) => {
      element.setAttribute(attribute, t(key, options))
    })
  })
}

function watchLanguageChanges() {
  if (isWatchingLanguage) return

  i18next.on('languageChanged', (language) => {
    applyLanguage(language)
    translateDom(document)
    document.dispatchEvent(
      new CustomEvent('forum-language-changed', {
        detail: { language: getLanguage() },
      }),
    )
  })

  isWatchingLanguage = true
}

function applyLanguage(language) {
  const normalizedLanguage = normalizeLanguage(language) || DEFAULT_LANGUAGE
  document.documentElement.lang = normalizedLanguage
  document.documentElement.dataset.forumLanguage = normalizedLanguage

  try {
    window.localStorage.setItem(STORAGE_KEY, normalizedLanguage)
  } catch {
    // Перевод продолжит работать, даже если localStorage недоступен.
  }
}

function getInitialLanguage() {
  const candidates = [getStoredLanguage(), document.documentElement.lang, window.navigator.language]
  return candidates.map(normalizeLanguage).find(Boolean) || DEFAULT_LANGUAGE
}

function getStoredLanguage() {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function normalizeLanguage(language) {
  if (typeof language !== 'string') return null
  const normalizedLanguage = language.toLowerCase().split('-')[0]
  return SUPPORTED_LANGUAGES.includes(normalizedLanguage) ? normalizedLanguage : null
}

function collectTranslatableElements(root) {
  const elements = []

  if (root instanceof Element && (root.matches('[data-i18n]') || root.matches('[data-i18n-attr]'))) {
    elements.push(root)
  }

  elements.push(...root.querySelectorAll('[data-i18n], [data-i18n-attr]'))
  return elements
}

function getTranslationOptions(element) {
  const serializedOptions = element.dataset.i18nOptions
  if (!serializedOptions) return undefined

  try {
    return JSON.parse(serializedOptions)
  } catch (error) {
    console.warn('Некорректный JSON в data-i18n-options', element, error)
    return undefined
  }
}

function parseAttributeTranslations(value = '') {
  return value
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const separatorIndex = entry.indexOf(':')
      if (separatorIndex === -1) return null

      const attribute = entry.slice(0, separatorIndex).trim()
      const key = entry.slice(separatorIndex + 1).trim()
      return attribute && key ? { attribute, key } : null
    })
    .filter(Boolean)
}

function exposePublicApi() {
  window.ForumI18n = Object.freeze({
    changeLanguage,
    getLanguage,
    t,
    translateDom,
  })
}
