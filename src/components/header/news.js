import { forumConfig } from '../../config/forum.js'
import { t } from '../../i18n/index.js'

const NEWS_CACHE_PREFIX = 'forum-news-v2'
const API_MAX_RESULTS = 100

export function initHeaderNews(root = document) {
  const container = root?.querySelector('.nvsscroll')
  if (!container || container.dataset.forumNewsReady) return

  // Не затираем новости, если их уже вывел серверный или старый скрипт.
  if (container.children.length > 0) {
    container.dataset.forumNewsReady = 'existing'
    return
  }

  const topicId = getPositiveInteger(container.dataset.topicId) ?? forumConfig.news.topicId
  const limit = Math.min(
    getPositiveInteger(container.dataset.limit) ?? forumConfig.news.limit,
    API_MAX_RESULTS,
  )

  container.dataset.forumNewsReady = 'loading'
  setStatus(container, 'header.news.loading')

  loadNews({ container, topicId, limit }).catch((error) => {
    container.dataset.forumNewsReady = 'error'
    setStatus(container, 'header.news.unavailable')
    console.error('Не удалось загрузить новости форума', error)
  })
}

async function loadNews({ container, topicId, limit }) {
  const cacheKey = getNewsCacheKey(container, topicId, limit)
  let posts = readNewsCache(cacheKey)

  if (!posts) {
    posts = await requestTopicPosts(container, topicId, limit)
    writeNewsCache(cacheKey, posts)
  }

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
      const id = getPositiveInteger(post.id ?? post.post_id)
      const title = extractNewsTitle(post.message)
      if (id && title) fragment.append(createNewsItem(post, id, title))
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
    apiUrl.searchParams.set('fields', 'id,message,posted')
    apiUrl.searchParams.set('limit', String(limit))
    apiUrl.searchParams.set('sort_by', 'posted')
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

    script.charset = 'utf-8'
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

function getNewsCacheKey(container, topicId, limit) {
  const apiUrl = new URL(container.dataset.apiUrl || forumConfig.news.apiUrl, window.location.origin)

  return `${NEWS_CACHE_PREFIX}:${apiUrl.origin}:${topicId}:${limit}`
}

function readNewsCache(cacheKey) {
  try {
    const cached = JSON.parse(window.sessionStorage.getItem(cacheKey) || 'null')

    if (
      !cached ||
      !Array.isArray(cached.posts) ||
      !Number.isFinite(cached.savedAt) ||
      Date.now() - cached.savedAt >= forumConfig.news.cacheDuration
    ) {
      return null
    }

    return cached.posts
  } catch {
    return null
  }
}

function writeNewsCache(cacheKey, posts) {
  try {
    window.sessionStorage.setItem(
      cacheKey,
      JSON.stringify({ savedAt: Date.now(), posts }),
    )
  } catch {
    // Новости продолжат работать без кеша, если sessionStorage недоступен.
  }
}

function extractNewsTitle(message = '') {
  const template = document.createElement('template')
  template.innerHTML = String(message)
    .replace(/\[(quote|spoiler|hide)\b[^\]]*\][\s\S]*?\[\/\1\]/gi, '')
    .replace(/\[img\b[^\]]*\][\s\S]*?\[\/img\]/gi, '')
    .replace(/\[(?:\/?(?:b|i|u|s|color|size|font|align|url)(?:=[^\]]*)?|hr)\]/gi, '')

  template.content
    .querySelectorAll('.quote-box, .spoiler-box, .hide-box, blockquote, script, style')
    .forEach((element) => element.remove())

  template.content.querySelectorAll('br, hr, p, div, li, h1, h2, h3, h4, h5, h6')
    .forEach((element) => element.after('\n'))

  return (template.content.textContent || '')
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .find(Boolean) || ''
}

function createNewsItem(post, id, title) {
  const item = document.createElement('a')
  const time = document.createElement('time')
  const heading = document.createElement('span')
  const date = new Date(Number(post.posted) * 1000)

  item.className = 'news-item'
  item.href = '/viewtopic.php?pid=' + id + '#p' + id
  item.title = title
  time.className = 'news-item__date'
  if (Number.isFinite(date.getTime())) {
    time.dateTime = date.toISOString()
    time.textContent = new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit', month: '2-digit', timeZone: 'Europe/Moscow',
    }).format(date)
  }
  heading.className = 'news-item__title'
  heading.textContent = title
  item.append(time, heading)
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
