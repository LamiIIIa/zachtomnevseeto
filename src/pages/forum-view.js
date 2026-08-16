const forumViewState = {
  topics: new Map(),
}

export function initForumView({ main, forumId }) {
  if (!main) return

  main.classList.add('forum-design-forum')
  if (forumId !== null) main.setAttribute('data-forum-id', String(forumId))

  if (main.dataset.forumLayout === 'cards') return

  forumViewState.topics.clear()
  main.querySelectorAll('.forum > .container > table').forEach(convertTopicTable)
  main.dataset.forumLayout = 'cards'
}

function convertTopicTable(table) {
  const list = document.createElement('div')
  const headers = Array.from(table.tHead?.rows[0]?.cells ?? []).map((cell) =>
    cell.textContent.trim()
  )

  list.className = 'topic-list'
  list.setAttribute('role', 'list')

  const rows = Array.from(table.tBodies).flatMap((body) => Array.from(body.rows))
  rows.forEach((row) => list.append(convertTopicRow(row, headers)))

  table.replaceWith(list)
}

function convertTopicRow(row, headers) {
  const topicState = createTopicState(row)

  if (topicState.id !== null) {
    forumViewState.topics.set(topicState.id, topicState)
  }

  return renderTopicCard(row, headers, topicState)
}

function createTopicState(row) {
  const cells = Array.from(row.cells)
  const oldIcon = cells[0]?.querySelector('.icon')
  const iconElements = oldIcon ? [oldIcon, ...oldIcon.querySelectorAll('*')] : []
  const iconClasses = new Set(iconElements.flatMap((element) => [...element.classList]))
  const topicLink = cells[0]?.querySelector(
    'a[href*="viewtopic.php"][href*="id="]:not([href*="action=new"])'
  )
  const unreadLink = cells[0]?.querySelector(
    'a[href*="viewtopic.php"][href*="action=new"]'
  )
  const lastPostLink = cells[3]?.querySelector(
    'a[href*="viewtopic.php"][href*="#p"]'
  )
  const hasNewMessages = Boolean(
    row.classList.contains('inew') ||
      iconClasses.has('inew') ||
      iconClasses.has('icon-new') ||
      oldIcon?.title === 'Есть новые сообщения' ||
      cells[0]?.querySelector('.newtext')
  )
  const inheritedStates = ['isticky', 'iclosed', 'ipinned', 'pinned', 'important'].filter(
    (state) => iconClasses.has(state)
  )

  const lastPostDate = lastPostLink?.textContent.replace(/\s+/g, '').trim() ?? ''


  return {
    id: getNumericUrlParameter(topicLink?.href, 'id'),
    title: topicLink?.textContent.trim() ?? '',
    url: topicLink?.href ?? '',
    replyCount: getNumericText(cells[1]?.textContent),
    viewCount: getNumericText(cells[2]?.textContent),
    lastPostId: getPostId(lastPostLink?.href),
    lastPostUrl: lastPostLink?.href ?? '',
    lastPostDate,
    formattedDate: formatTopicDate(lastPostDate)
    hasNewMessages,
    unreadUrl: unreadLink?.href ?? '',
    unreadCount: hasNewMessages ? null : 0,
    preview: '',
    previewStatus: 'idle',
    rowId: row.id,
    rowClasses: Array.from(row.classList),
    inheritedStates,
  }
}

function renderTopicCard(row, headers, topicState) {
  const cells = Array.from(row.cells)
  const topic = document.createElement('article')

  // Состояние темы остаётся на карточке, поэтому старая системная иконка не нужна.
  cells[0]?.querySelector('.icon')?.remove()

  if (topicState.rowId) topic.id = topicState.rowId
  topic.className = ['topic-card', ...topicState.rowClasses].join(' ')
  topic.classList.add(...topicState.inheritedStates)
  topic.classList.toggle('inew', topicState.hasNewMessages)
  topic.setAttribute('role', 'listitem')

  if (topicState.id !== null) topic.dataset.topicId = String(topicState.id)
  if (topicState.lastPostId !== null) {
    topic.dataset.lastPostId = String(topicState.lastPostId)
  }
  topic.dataset.hasNewMessages = String(topicState.hasNewMessages)
  if (topicState.unreadUrl) topic.dataset.unreadUrl = topicState.unreadUrl

  const main = createBlock('topic-card__main tcl', cells[0], headers[0])
  const replies = createBlock('topic-card__stat topic-card__replies tc2', cells[1], headers[1])
  const views = createBlock('topic-card__stat topic-card__views tc3', cells[2], headers[2])
  const lastPost = createBlock('topic-card__last-post tcr', cells[3], headers[3])
  const mobileDate = document.createElement('time')

  mobileDate.className = 'topic-card__mobile-date'
  mobileDate.textContent = topicState.formattedDate
  mobileDate.setAttribute('aria-label', topicState.lastPostDate)

  const stats = document.createElement('div')

  stats.className = 'topic-card__stats'
  stats.append(replies, views)
  topic.append(main, stats, lastPost, mobileDate)

  return topic
}

function createBlock(className, source, label) {
  const block = document.createElement('div')

  block.className = className
  if (label) block.dataset.label = label
  if (source) block.append(...source.childNodes)

  return block
}

function getNumericUrlParameter(href, parameter) {
  if (!href) return null

  const value = new URL(href, window.location.href).searchParams.get(parameter)

  return value && /^\d+$/.test(value) ? Number(value) : null
}

function getPostId(href) {
  if (!href) return null

  const match = new URL(href, window.location.href).hash.match(/^#p(\d+)$/)

  return match ? Number(match[1]) : null
}

function getNumericText(text) {
  const value = Number.parseInt(String(text ?? '').replace(/\D/g, ''), 10)

  return Number.isNaN(value) ? 0 : value
}

function formatTopicDate(value, now = new Date()) {
  const normalized = value.replase(/\s+/g, '').trim()
  const timeMatch = normalized.match(/(\d{1,2}):(\d{2})/)

  if (!timeMatch) return normalized

  const time = `${timeMatch[1].padStart(2, 0)}:${timeMatch[2]}`

  if(/^Сегодня\b/i.test(normalized)) {
    return time
  }

  const date = parseTopicDate(normalized, now)

  weekStart.setHours(0, 0, 0, 0)
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7))

  if (date >= weekStart) {
    return new Intl.DateTimeFormat('ru-Ru', {
      weekday: 'short',
    })
    .format(date)
    .replase(/\.$/, '')
  }

  return new Intl.DateTimeFormat('ru-Ru', {
    day: 'numeric',
    month: 'short',
  })
  .format(date)
  .replace(/\.$/, '')
}

function parseTopicDate(value, now) {
  if (/^Вчера\b/i.test(value)) {
    const yesterday = new Date(now)

    yesterday.setHours(0, 0, 0, 0)
    yesterday.setDate(yesterday.getDate() - 1)

    return yesterday
  }

  const match = value.match(
    /^(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?/
  )

  if (!match) return null

  const day = Number(match[1])
  const month = Number(match[2])
  let year = match[3] ? Number(match[3]) : now.getFullYear()

  if (year < 100) year += 2000

  const date = new Date(year, month - 1, day)

  if (!match[3] && date > now) {
    date.setFullYear(date.getFullYear() - 1)
  }

  if (
    date.getDate() !== day ||
    date.getMonth() !== month - 1
  ) {
    return null
  }

  return date
}
