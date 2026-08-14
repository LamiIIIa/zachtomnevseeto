// Инициализирует блочную раскладку только на главной странице форума.
export function initForumIndex({ main }) {
  // Завершаем работу, если MyBB не создал основной контейнер страницы.
  if (!main) return

  // Не преобразуем DOM повторно при повторном запуске скрипта.
  if (main.dataset.forumLayout === 'cards') return

  // Добавляем класс-область для стилей главной страницы.
  main.classList.add('forum-design-index')

  // Находим только таблицы со списками форумов внутри категорий.
  const categoryTables = main.querySelectorAll('.category > .container > table')

  // Заменяем каждую найденную таблицу блочным списком.
  categoryTables.forEach(convertCategoryTable)

  // Отмечаем, что преобразование главной страницы завершено.
  main.dataset.forumLayout = 'cards'
}

// Заменяет одну таблицу категории контейнером с карточками форумов.
function convertCategoryTable(table) {
  // Создаём блочный список вместо элемента table.
  const list = document.createElement('div')

  // Назначаем новый класс, который не зависит от табличных стилей MyBB.
  list.className = 'forum-list'

  // Сохраняем семантику списка для вспомогательных технологий.
  list.setAttribute('role', 'list')

  // Сохраняем строки в обычный массив до начала изменения DOM.
  const rows = Array.from(table.tBodies[0]?.rows ?? [])

  // Преобразуем каждую строку таблицы в отдельную карточку.
  rows.forEach((row) => {
    // Добавляем готовую карточку в новый блочный список.
    list.append(convertForumRow(row))
  })

  // Удаляем исходную таблицу и ставим на её место новый список.
  table.replaceWith(list)
}

// Собирает карточку форума из четырёх ячеек исходной строки.
function convertForumRow(row) {
  // Находим ячейку с названием, описанием, иконкой и подфорумами.
  const titleCell = row.querySelector(':scope > .tcl')

  // Находим ячейку с количеством тем.
  const topicsCell = row.querySelector(':scope > .tc2')

  // Находим ячейку с количеством сообщений.
  const postsCell = row.querySelector(':scope > .tc3')

  // Находим ячейку с данными последнего сообщения.
  const lastPostCell = row.querySelector(':scope > .tcr')

  // Создаём самостоятельную карточку форума.
  const card = document.createElement('article')

  // Сохраняем системный идентификатор MyBB вида forum_f3.
  card.id = row.id

  // Сохраняем классы состояния строки и добавляем новый класс карточки.
  card.className = `forum-card ${row.className}`

  // Помечаем карточку как элемент созданного выше списка.
  card.setAttribute('role', 'listitem')

  // Переносим основное содержимое, сохраняя старый класс tcl для совместимости.
  const content = createBlock('forum-card__main tcl', titleCell)

  // Создаём общий контейнер для двух счётчиков.
  const stats = document.createElement('div')

  // Добавляем контейнеру счётчиков независимый класс.
  stats.className = 'forum-card__stats'

  // Переносим количество тем в отдельный блок.
  const topics = createBlock('forum-card__stat forum-card__topics', topicsCell)

  // Переносим количество сообщений в отдельный блок.
  const posts = createBlock('forum-card__stat forum-card__posts', postsCell)

  // Переносим последнее сообщение и сохраняем класс tcr для старых стилей.
  const lastPost = createBlock('forum-card__last-post tcr', lastPostCell)

  // Объединяем два счётчика в один контейнер.
  stats.append(topics, posts)

  // Собираем карточку из основного содержимого, счётчиков и последнего сообщения.
  card.append(content, stats, lastPost)

  // Возвращаем готовую карточку в преобразователь категории.
  return card
}

// Создаёт div и переносит в него существующие дочерние узлы ячейки.
function createBlock(className, source) {
  // Создаём новый блочный контейнер.
  const block = document.createElement('div')

  // Устанавливаем переданные классы нового интерфейса.
  block.className = className

  // Переносим узлы, сохраняя ссылки, аватары и обработчики событий.
  if (source) block.append(...source.childNodes)

  // Возвращаем заполненный блок вызывающей функции.
  return block
}
