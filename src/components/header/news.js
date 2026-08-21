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
      const content = extractNewsContent(post.message, maxCharacters)
      if (!content.textContent?.trim()) return
      fragment.append(createNewsItem(post, content))
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

function extractNewsContent(message = '', maxCharacters) {
  const template = document.createElement('template')
  template.innerHTML = String(message)
    .replace(/\[quote[\s\S]*?\[\/quote\]/gi, '')
    .replace(/\[spoiler[\s\S]*?\[\/spoiler\]/gi, '')
    .replace(/\[hide[\s\S]*?\[\/hide\]/gi, '')
    .replace(/\[hr\]/gi, '\n')

  template.content
    .querySelectorAll('.quote-box, .spoiler-box, .hide-box, blockquote, script, style')
    .forEach((element) => element.remove())

  const content = document.createDocumentFragment()

  appendSafeNewsNodes(template.content, content)
  normalizeNewsWhitespace(content)

  return truncateNewsContent(content, maxCharacters)
}

function appendSafeNewsNodes(source, target) {
  Array.from(source.childNodes).forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      target.append(document.createTextNode(node.data))
      return
    }

    if (!(node instanceof Element)) return

    const tagName = node.tagName.toLowerCase()

    if (tagName === 'a') {
      const link = createSafeNewsLink(node)

      if (link) {
        appendSafeNewsNodes(node, link)
        if (link.textContent) target.append(link)
      } else {
        appendSafeNewsNodes(node, target)
      }
      return
    }

    if (tagName === 'strong' || tagName === 'b') {
      const strong = document.createElement('strong')

      appendSafeNewsNodes(node, strong)
      if (strong.textContent) target.append(strong)
      return
    }

    if (tagName === 'br' || tagName === 'hr') {
      target.append(document.createTextNode('\n'))
      return
    }

    appendSafeNewsNodes(node, target)

    if (tagName === 'p' || tagName === 'div') {
      target.append(document.createTextNode('\n\n'))
    } else if (tagName === 'li') {
      target.append(document.createTextNode('\n'))
    }
  })
}

function createSafeNewsLink(source) {
  const href = source.getAttribute('href')?.trim()
  if (!href) return null

  let url

  try {
    url = new URL(href, window.location.origin)
  } catch {
    return null
  }

  if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) return null

  const link = document.createElement('a')

  link.href = url.href
  link.rel = 'nofollow noopener noreferrer'

  if (source.getAttribute('target') === '_blank') link.target = '_blank'
  if (source.title) link.title = source.title

  return link
}

function normalizeNewsWhitespace(content) {
  const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT)
  const textNodes = []

  while (walker.nextNode()) textNodes.push(walker.currentNode)

  textNodes.forEach((node) => {
    node.data = node.data
      .replace(/\u00a0/g, ' ')
      .replace(/\r/g, '')
      .replace(/[\t ]+/g, ' ')
      .replace(/ *\n */g, '\n')
      .replace(/\n{3,}/g, '\n\n')
  })

  const first = textNodes.find((node) => node.data)
  const last = [...textNodes].reverse().find((node) => node.data)

  if (first) first.data = first.data.replace(/^\s+/, '')
  if (last) last.data = last.data.replace(/\s+$/, '')
}

function truncateNewsContent(content, maxCharacters) {
  const text = content.textContent || ''
  if (text.length <= maxCharacters) return content

  const shortenedText = text.slice(0, maxCharacters)
  const lastSpace = Math.max(
    shortenedText.lastIndexOf(' '),
    shortenedText.lastIndexOf('\n'),
  )
  const limit = lastSpace > 0 ? lastSpace : maxCharacters
  const truncated = document.createDocumentFragment()
  const state = { remaining: limit, done: false }

  cloneNewsNodesWithinLimit(content, truncated, state)
  truncated.append(document.createTextNode('…'))

  return truncated
}

function cloneNewsNodesWithinLimit(source, target, state) {
  for (const node of source.childNodes) {
    if (state.done) break

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.data.slice(0, state.remaining)

      if (text) target.append(document.createTextNode(text))
      state.remaining -= text.length
      if (state.remaining === 0) state.done = true
      continue
    }

    if (!(node instanceof Element)) continue

    const clone = node.cloneNode(false)

    cloneNewsNodesWithinLimit(node, clone, state)
    if (clone.childNodes.length) target.append(clone)
  }
}

function createNewsItem(post, newsContent) {
  const item = document.createElement('article')
  const time = document.createElement('time')
  const content = document.createElement('div')
  const date = new Date(Number(post.posted) * 1000)

  item.className = 'news-item'
  time.className = 'news-item__date'
  time.dateTime = Number.isNaN(date.getTime()) ? '' : date.toISOString()
  time.textContent = Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString()
  content.className = 'news-item__text'
  content.append(newsContent)

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
