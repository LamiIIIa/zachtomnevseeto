export function initForumView({ main, forumId }) {
  if (!main) return

  main.classList.add('forum-design-forum')
  if (forumId !== null) main.setAttribute('data-forum-id', String(forumId))

  if (main.dataset.forumLayout === 'cards') return

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
  const cells = Array.from(row.cells)
  const topic = document.createElement('article')
  const oldIcon = cells[0]?.querySelector('.icon')
  const hasNewMessages = Boolean(
    row.classList.contains('inew') ||
      oldIcon?.matches('.inew, .icon-new') ||
      oldIcon?.querySelector('.inew, .icon-new')
  )

  // Состояние темы остаётся на карточке, поэтому старая системная иконка не нужна.
  oldIcon?.remove()

  if (row.id) topic.id = row.id
  topic.className = `topic-card ${row.className}`.trim()
  topic.classList.toggle('inew', hasNewMessages)
  topic.setAttribute('role', 'listitem')

  const main = createBlock('topic-card__main tcl', cells[0], headers[0])
  const replies = createBlock('topic-card__stat topic-card__replies tc2', cells[1], headers[1])
  const views = createBlock('topic-card__stat topic-card__views tc3', cells[2], headers[2])
  const lastPost = createBlock('topic-card__last-post tcr', cells[3], headers[3])
  const stats = document.createElement('div')

  stats.className = 'topic-card__stats'
  stats.append(replies, views)
  topic.append(main, stats, lastPost)

  return topic
}

function createBlock(className, source, label) {
  const block = document.createElement('div')

  block.className = className
  if (label) block.dataset.label = label
  if (source) block.append(...source.childNodes)

  return block
}
