import quotesK from "../components/main_components/quotesK.js";
import {
  createCardFromRow,
  moveCellToBlock,
  replaceTableWithCardList,
} from "../components/table-card-layout.js";

const CATEGORY_QUOTE_KEYS = [
  "citatas.first",
  "citatas.second",
  "citatas.third",
  "citatas.four",
  "citatas.five",
  "citatas.six",
];
// Инициализирует блочную раскладку только на главной странице форума.
export function initForumIndex({ main, root }) {
  // Завершаем работу, если MyBB не создал основной контейнер страницы.
  if (!main || !root) return;

  // Не преобразуем DOM повторно при повторном запуске скрипта.
  if (main.dataset.forumLayout === "cards") return;

  // Добавляем класс-область для стилей главной страницы.
  main.classList.add("forum-design-index");

  initIndexQuotes(root);

  // Отмечаем первую категорию для отдельного мобильного отступа после шапки.
  main.querySelector('.category')?.classList.add('category--first');

  // Хлебные крошки находятся рядом с #pun-main, поэтому ищем их от корня страницы.
  const breadcrumbs = root.querySelectorAll("p.container.crumbs");

  breadcrumbs.forEach((breadcrumb) => {
    // Находим название форума и разделитель только среди прямых потомков.
    const forumName = breadcrumb.querySelector(":scope > span");
    const arrow = breadcrumb.querySelector(":scope > em");

    // Сохраняем смысловые классы и скрываем оба элемента общей утилитой.
    forumName?.classList.add("forum-index__name", "hidden");
    arrow?.classList.add("forum-index__arrow", "hidden");
  });

  // Находим только таблицы со списками форумов внутри категорий.
  const categoryTables = main.querySelectorAll(
    ".category > .container > table"
  );

  // Заменяем каждую найденную таблицу блочным списком.
  categoryTables.forEach(convertCategoryTable);

  // Отмечаем, что преобразование главной страницы завершено.
  main.dataset.forumLayout = "cards";
}

// Заменяет одну таблицу категории контейнером с карточками форумов.
function convertCategoryTable(table) {
  replaceTableWithCardList(table, {
    listClassName: "forum-list",
    renderRow: ({ row }) => convertForumRow(row),
  });
}

// Собирает карточку форума из четырёх ячеек исходной строки.
function convertForumRow(row) {
  // Находим ячейку с названием, описанием, иконкой и подфорумами.
  const titleCell = row.querySelector(":scope > .tcl");

  // Находим ячейку с количеством тем.
  const topicsCell = row.querySelector(":scope > .tc2");

  // Находим ячейку с количеством сообщений.
  const postsCell = row.querySelector(":scope > .tc3");

  // Находим ячейку с данными последнего сообщения.
  const lastPostCell = row.querySelector(":scope > .tcr");

  // Находим старую иконку MyBB до переноса содержимого в новую карточку.
  const messageIcon = titleCell?.querySelector(".icon");

  // В разных шаблонах MyBB признак новых сообщений может стоять на строке,
  // самой иконке или вложенном в неё элементе.
  const hasNewMessages = Boolean(
    row.classList.contains("inew") ||
      messageIcon?.matches(".inew, .icon-new") ||
      messageIcon?.querySelector(".inew, .icon-new")
  );

  // Состояние сохранено выше, поэтому старая мигающая иконка больше не нужна.
  messageIcon?.remove();

  // Создаём самостоятельную карточку форума.
  const card = createCardFromRow(row, { className: "forum-card" });

  // Рамка и фоновая картинка будут зависеть от этого смыслового класса.
  card.classList.toggle("forum-card--unread", hasNewMessages);

  // Data-атрибут оставляет состояние доступным для будущих вариантов графики.
  card.dataset.messageState = hasNewMessages ? "unread" : "read";

  // Переносим основное содержимое, сохраняя старый класс tcl для совместимости.
  const content = moveCellToBlock(titleCell, {
    className: "forum-card__main tcl",
  });

  // Создаём общий контейнер для двух счётчиков.
  const stats = document.createElement("div");

  // Добавляем контейнеру счётчиков независимый класс.
  stats.classList.add("forum-card__stats", "hidden");

  // Переносим количество тем в отдельный блок.
  const topics = moveCellToBlock(topicsCell, {
    className: "forum-card__stat forum-card__topics",
  });

  // Переносим количество сообщений в отдельный блок.
  const posts = moveCellToBlock(postsCell, {
    className: "forum-card__stat forum-card__posts",
  });

  // Переносим последнее сообщение и сохраняем класс tcr для старых стилей.
  const lastPost = moveCellToBlock(lastPostCell, {
    className: "forum-card__last-post tcr",
  });

  makeLastPostInLink(lastPost);

  // Объединяем два счётчика в один контейнер.
  stats.append(topics, posts);

  // Собираем карточку из основного содержимого, счётчиков и последнего сообщения.
  card.append(content, stats, lastPost);

  // Возвращаем готовую карточку в преобразователь категории.
  return card;
}

function initIndexQuotes(root) {
  const categories = root.querySelectorAll("#pun-main .category");

  categories.forEach((category, index) => {
    const translationKey = CATEGORY_QUOTE_KEYS[index];

    if (!translationKey) return;

    // Названию и цитате категории назначаем разные классы.
    addQuoteK(category, translationKey, {
      titleClass: "category-title",
      quoteClass: "category-quote",
    });
  });

  const statistics = root.querySelector("#pun-stats");

  if (statistics) {
    // Названию и цитате статистики назначаем собственные классы.
    addQuoteK(statistics, "citatas.eight", {
      titleClass: "statistics-title",
      quoteClass: "statistics-quote",
    });
  }
}

function makeLastPostInLink(lastPost) {
  const link = lastPost.querySelector(
    "a.lastpost-link[href], .lastpost-link a[href]"
  );

  if (!link) return;

  const linkLast = link.href;

  lastPost.classList.add("forum-card__last-post--clickable");
  lastPost.tabIndex = 0;
  lastPost.setAttribute("role", "link");

  lastPost.addEventListener("click", (event) => {
    event.preventDefault();

    if (event.ctrlKey || event.metaKey) {
      window.open(linkLast, "_blank", "noopener");
      return;
    }

    window.location.assign(linkLast);
  });

  lastPost.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;

    event.preventDefault();
    window.location.assign(linkLast);
  });

  lastPost.addEventListener("auxclick", (event) => {
    if (event.button !== 1) return;

    event.preventDefault();
    window.open(linkLast, "_blank", "noopener");
  });
}

function addQuoteK(section, translationKey, { titleClass, quoteClass }) {
  // Находим заголовок категории или статистики.
  const heading = section.querySelector("h2");

  if (!heading) return;

  // Первый прямой span — это название, которое уже создал MyBB.
  const title = heading.querySelector(":scope > span:first-of-type");

  // Добавляем названию отдельный класс для оформления.
  title?.classList.add(titleClass);

  // Не создаём вторую такую же цитату при повторном запуске.
  if (heading.querySelector(`:scope > .${quoteClass}`)) return;

  // Создаём цитату с классом, соответствующим типу секции.
  const quote = quotesK(translationKey, quoteClass);

  // Добавляем готовую цитату внутрь заголовка.
  heading.append(quote);
}
