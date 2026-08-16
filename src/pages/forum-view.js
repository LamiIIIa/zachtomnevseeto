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

  // Сохраняем исходную подпись MyBB: «Сегодня 12:30», «Вчера 18:45» или дату.
  const lastPostDate = lastPostLink?.textContent.replace(/\s+/g, ' ').trim() ?? ''

  return {
    id: getNumericUrlParameter(topicLink?.href, 'id'),
    title: topicLink?.textContent.trim() ?? '',
    url: topicLink?.href ?? '',
    replyCount: getNumericText(cells[1]?.textContent),
    viewCount: getNumericText(cells[2]?.textContent),
    lastPostId: getPostId(lastPostLink?.href),
    lastPostUrl: lastPostLink?.href ?? '',
    lastPostDate,
    // Компактная подпись используется только отдельным мобильным элементом.
    formattedDate: formatTopicDate(lastPostDate),
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

  // Полную десктопную дату оставляем на месте и создаём её мобильную копию.
  const mobileDate = document.createElement('time')

  mobileDate.className = 'topic-card__mobile-date'
  mobileDate.textContent = topicState.formattedDate
  // Полная исходная дата остаётся доступной вспомогательным технологиям.
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
  // Убираем повторяющиеся пробелы и переносы, сохраняя разделение слов.
  const normalized = value.replace(/\s+/g, ' ').trim()

  // Забираем только часы и минуты: секунды в мобильной карточке не нужны.
  const timeMatch = normalized.match(/(\d{1,2}):(\d{2})/)

  // Неизвестный формат безопаснее показать без изменений.
  if (!timeMatch) return normalized

  // Всегда выводим часы двумя цифрами, например «09:05».
  const time = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`

  // Для сегодняшнего сообщения достаточно времени.
  if (/^Сегодня\b/i.test(normalized)) {
    return time
  }

  // Для остальных вариантов получаем настоящую календарную дату.
  const date = parseTopicDate(normalized, now)

  // Если строка не распознана, оставляем исходную подпись MyBB.
  if (!date) return normalized

  // Находим понедельник текущей недели.
  const weekStart = new Date(now)

  // Обнуляем время, чтобы сравнивать только календарные дни.
  weekStart.setHours(0, 0, 0, 0)
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7))

  // В пределах текущей недели выводим короткий день: «пн», «вт», «ср».
  if (date >= weekStart) {
    return new Intl.DateTimeFormat('ru-RU', {
      weekday: 'short',
    })
      .format(date)
      // В интерфейсе точка после сокращения не нужна.
      .replace(/\.$/, '')
  }

  // Для более старых сообщений выводим число и месяц: «12 авг».
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
  })
    .format(date)
    .replace(/\.$/, '')
}

function parseTopicDate(value, now) {
  // «Вчера» преобразуем в предыдущий календарный день.
  if (/^Вчера\b/i.test(value)) {
    // Создаём копию, чтобы не изменять переданный объект now.
    const yesterday = new Date(now)

    // Обнуляем время и отнимаем один день.
    yesterday.setHours(0, 0, 0, 0)
    yesterday.setDate(yesterday.getDate() - 1)

    return yesterday
  }

  // Старые сообщения MyBB отдаёт в ISO-формате: «2025-12-19 12:01:19».
  const isoMatch = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)

  if (isoMatch) {
    const year = Number(isoMatch[1])
    const month = Number(isoMatch[2])
    const day = Number(isoMatch[3])
    const date = new Date(year, month - 1, day)

    // Проверяем, что Date не исправил невозможное число или месяц.
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null
    }

    return date
  }

  // Поддерживаем разделители точкой, косой чертой и дефисом.
  // Год в строке может отсутствовать.
  const match = value.match(
    /^(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?/
  )

  // Другой формат эта функция разбирать не должна.
  if (!match) return null

  // Извлекаем числовые части найденной даты.
  const day = Number(match[1])
  const month = Number(match[2])
  let year = match[3] ? Number(match[3]) : now.getFullYear()

  // Преобразуем короткий год, например 26, в 2026.
  if (year < 100) year += 2000

  // Месяцы Date начинаются с нуля, поэтому вычитаем единицу.
  const date = new Date(year, month - 1, day)

  // Дата без года не должна случайно оказаться в будущем.
  // Например, «28.12» в январе относится к предыдущему году.
  if (!match[3] && date > now) {
    date.setFullYear(date.getFullYear() - 1)
  }

  // Date исправляет невозможные значения автоматически.
  // Повторная проверка отбрасывает даты вроде 31 февраля.
  if (
    date.getDate() !== day ||
    date.getMonth() !== month - 1
  ) {
    return null
  }

  // Возвращаем корректно распознанную дату.
  return date
}
