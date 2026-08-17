import { forumConfig } from '../../config/forum.js'
import { t } from '../../i18n/index.js'

export function initHeaderNews(root = document) {
  const container = root?.querySelector('.nvsscroll')
  if (!container || container.dataset.forumNewsReady) return

  // Не затираем новости, если их уже вывел серверный или старый скрипт.
  if (container.children.length > 0) {
    container.dataset.forumNewsReady = 'existing'
    return
  }

  const topicId = getPositiveInteger(container.dataset.topicId) ?? forumConfig.news.topicId
  const limit = getPositiveInteger(container.dataset.limit) ?? forumConfig.news.limit
  const maxCharacters =
    getPositiveInteger(container.dataset.maxCharacters) ?? forumConfig.news.maxCharacters

  container.dataset.forumNewsReady = 'loading'
  setStatus(container, 'header.news.loading')

  loadNews({ container, topicId, limit, maxCharacters }).catch((error) => {
    container.dataset.forumNewsReady = 'error'
    setStatus(container, 'header.news.unavailable')
    console.error('Не удалось загрузить новости форума', error)
  })
}

async function loadNews({ container, topicId, limit, maxCharacters }) {
  const posts = await requestTopicPosts(container, topicId, limit)

  if (!posts.length) {
    container.dataset.forumNewsReady = 'empty'
    setStatus(container, 'header.news.empty')
    return
  }

  const fragment = document.createDocumentFragment()

  posts
    .sort((first, second) => Number(second.posted) - Number(first.posted))
    .slice(0, limit)
    .forEach((post) => {
      const text = truncateText(extractNewsText(post.message), maxCharacters)
      if (!text) return
      fragment.append(createNewsItem(post, text))
    })

  container.replaceChildren(fragment)
  container.dataset.forumNewsReady = container.children.length ? 'true' : 'empty'

  if (!container.children.length) setStatus(container, 'header.news.empty')
}

function requestTopicPosts(container, topicId, limit) {
  return new Promise((resolve, reject) => {
    const callbackName = `forumNews_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const script = document.createElement('script')
    const apiUrl = new URL(container.dataset.apiUrl || forumConfig.news.apiUrl, window.location.origin)
    let completed = false

    apiUrl.searchParams.set('method', 'post.get')
    apiUrl.searchParams.set('topic_id', String(topicId))
    apiUrl.searchParams.set('limit', String(limit))
    apiUrl.searchParams.set('sort_dir', 'desc')
    apiUrl.searchParams.set('charset', 'utf-8')
    apiUrl.searchParams.set('callback', callbackName)

    const cleanup = () => {
      window.clearTimeout(timeoutId)
      script.remove()
      delete window[callbackName]
    }

    const finish = (callback) => {
      if (completed) return
      completed = true
      cleanup()
      callback()
    }

    window[callbackName] = (data) => {
      finish(() => {
        if (!data || data.error || data.code) {
          reject(new Error(data?.error || data?.message || 'MyBB API вернул ошибку'))
          return
        }

        const posts = Array.isArray(data.response) ? data.response : data.response?.posts
        resolve(Array.isArray(posts) ? posts : [])
      })
    }

    script.src = apiUrl.href
    script.async = true
    script.addEventListener('error', () => {
      finish(() => reject(new Error('Не удалось загрузить JSONP-ответ MyBB API')))
    })

    const timeoutId = window.setTimeout(() => {
      finish(() => reject(new Error('Истекло время ожидания MyBB API')))
    }, forumConfig.news.timeout)

    document.body.append(script)
  })
}

function extractNewsText(message = '') {
  const template = document.createElement('template')
  template.innerHTML = String(message)

  template.content
    .querySelectorAll('.quote-box, .spoiler-box, .hide-box, blockquote, script, style')
    .forEach((element) => element.remove())

  template.content.querySelectorAll('br, hr').forEach((element) => element.replaceWith('\n'))
  template.content.querySelectorAll('p, div, li').forEach((element) => element.append('\n'))

  return (template.content.textContent || '')
    .replace(/\[quote[\s\S]*?\[\/quote\]/gi, '')
    .replace(/\[spoiler[\s\S]*?\[\/spoiler\]/gi, '')
    .replace(/\[hide[\s\S]*?\[\/hide\]/gi, '')
    .replace(/\[hr\]/gi, '\n')
    .replace(/\n[\t ]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function truncateText(text, maxCharacters) {
  if (text.length <= maxCharacters) return text

  const shortenedText = text.slice(0, maxCharacters)
  const lastSpace = shortenedText.lastIndexOf(' ')

  return `${shortenedText.slice(0, lastSpace > 0 ? lastSpace : maxCharacters).trim()}…`
}

function createNewsItem(post, text) {
  const item = document.createElement('article')
  const time = document.createElement('time')
  const content = document.createElement('p')
  const date = new Date(Number(post.posted) * 1000)

  item.className = 'news-item'
  time.className = 'news-item__date'
  time.dateTime = Number.isNaN(date.getTime()) ? '' : date.toISOString()
  time.textContent = Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString()
  content.className = 'news-item__text'
  content.textContent = text

  item.append(time, content)
  return item
}

function setStatus(container, translationKey) {
  const status = document.createElement('p')
  status.className = 'news-item__status'
  status.dataset.i18n = translationKey
  status.textContent = t(translationKey)
  container.replaceChildren(status)
}

function getPositiveInteger(value) {
  const number = Number.parseInt(value, 10)
  return Number.isInteger(number) && number > 0 ? number : null
}
