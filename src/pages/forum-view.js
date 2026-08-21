import {
  applyTopicCardAppearance,
  createCardFromRow,
  getTopicCardAppearance,
  moveCellToBlock,
  replaceTableWithCardList,
} from "../components/table-card-layout.js";
import {
  FORUM_TABLE_SELECTOR,
  MOBILE_LAYOUT_QUERY,
} from "../config/layout.js";

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("ru-RU", {
  weekday: "short",
});
const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
});
const PREVIEW_EXCLUDED_SELECTOR = [
  "blockquote",
  ".quote-box",
  ".spoiler-box",
  ".hide-box",
  "script",
  "style",
  "iframe",
  "video",
  "audio",
].join(",");

const forumViewState = {
  topics: new Map(),
};

export function initForumView({ main, forumId }) {
  if (!main) return;

  main.classList.add("forum-design-forum");
  if (forumId !== null) main.setAttribute("data-forum-id", String(forumId));

  if (main.dataset.forumLayout === "cards") return;

  forumViewState.topics.clear();
  main
    .querySelectorAll(FORUM_TABLE_SELECTOR)
    .forEach((table) => {
      replaceTableWithCardList(table, {
        listClassName: "topic-list forum-card-list",
        renderRow: ({ row, headers }) => convertTopicRow(row, headers),
      });
    });

  initTopicPreviews(main);
  main.dataset.forumLayout = "cards";
}

function convertTopicRow(row, headers) {
  const topicState = createTopicState(row);

  if (topicState.id !== null) {
    forumViewState.topics.set(topicState.id, topicState);
  }

  return renderTopicCard(row, headers, topicState);
}

function createTopicState(row) {
  const cells = Array.from(row.cells);
  const appearance = getTopicCardAppearance(row, cells[0]);
  const topicLink = cells[0]?.querySelector(
    'a[href*="viewtopic.php"][href*="id="]:not([href*="action=new"])'
  );
  const lastPostLink = cells[3]?.querySelector(
    'a[href*="viewtopic.php"][href*="#p"]'
  );
  // Сохраняем исходную подпись MyBB: «Сегодня 12:30», «Вчера 18:45» или дату.
  const lastPostDate =
    lastPostLink?.textContent.replace(/\s+/g, " ").trim() ?? "";

  return {
    id: getNumericUrlParameter(topicLink?.href, "id"),
    title: topicLink?.textContent.trim() ?? "",
    // Название темы всегда должно открывать её первую страницу.
    url: getFirstTopicPageUrl(topicLink?.href),
    replyCount: getNumericText(cells[1]?.textContent),
    viewCount: getNumericText(cells[2]?.textContent),
    lastPostId: getPostId(lastPostLink?.href),
    lastPostUrl: lastPostLink?.href ?? "",
    lastPostDate,
    // Компактная подпись используется только отдельным мобильным элементом.
    formattedDate: formatTopicDate(lastPostDate),
    ...appearance,
    preview: "",
    previewStatus: "idle",
    rowId: row.id,
    rowClasses: Array.from(row.classList),
  };
}

function renderTopicCard(row, headers, topicState) {
  const cells = Array.from(row.cells);
  const topic = createCardFromRow(row, {
    className: "topic-card forum-list-card forum-topic-card",
  });

  applyTopicCardAppearance(topic, cells[0], topicState);

  if (topicState.id !== null) topic.dataset.topicId = String(topicState.id);
  if (topicState.lastPostId !== null) {
    topic.dataset.lastPostId = String(topicState.lastPostId);
  }
  topic.dataset.previewStatus = topicState.previewStatus;

  const main = moveCellToBlock(cells[0], {
    className: "topic-card__main tcl",
    label: headers[0],
  });

  // MyBB иногда добавляет к ссылке страницы или служебные параметры.
  // Возвращаем заголовку нормализованный адрес первой страницы темы.
  const titleLink = main.querySelector(
    'a[href*="viewtopic.php"][href*="id="]:not([href*="action=new"])'
  );

  if (titleLink && topicState.url) titleLink.href = topicState.url;

  const replies = moveCellToBlock(cells[1], {
    className: "topic-card__stat topic-card__replies tc2",
    label: headers[1],
  });
  const views = moveCellToBlock(cells[2], {
    className: "topic-card__stat topic-card__views tc3",
    label: headers[2],
  });
  const lastPost = moveCellToBlock(cells[3], {
    className: "topic-card__last-post tcr",
    label: headers[3],
  });

  const lastPostUrl = topicState.lastPostUrl || topicState.url;

  // Полную десктопную дату оставляем на месте и создаём мобильную ссылку.
  const mobileDateLink = createTopicLink(
    "topic-card__mobile-date",
    lastPostUrl,
    `Последнее сообщение: ${topicState.lastPostDate}`
  );
  const mobileDate = document.createElement("time");

  mobileDate.textContent = topicState.formattedDate;
  // Полная исходная дата остаётся доступной вспомогательным технологиям.
  mobileDate.setAttribute("aria-label", topicState.lastPostDate);
  mobileDateLink.append(mobileDate);

  // Превью целиком является ссылкой на последнее сообщение.
  const preview = createTopicLink(
    "topic-card__preview",
    lastPostUrl,
    "Открыть последнее сообщение"
  );
  preview.textContent = topicState.preview;

  // MyBB уже отмечает непрочитанные темы классом inew. Для них создаём
  // компактную мобильную плашку со ссылкой на последнее сообщение.
  const unreadBadge = topicState.hasNewMessages
    ? createTopicLink(
        "topic-card__unread-badge",
        lastPostUrl,
        "Есть непрочитанные сообщения. Перейти к последнему сообщению"
      )
    : null;

  if (unreadBadge) unreadBadge.textContent = "Есть непрочитанные";

  const stats = document.createElement("div");

  stats.className = "topic-card__stats";
  stats.append(replies, views);
  topic.append(main, stats, lastPost, mobileDateLink, preview);
  if (unreadBadge) topic.append(unreadBadge);

  return topic;
}

function createTopicLink(className, href, label) {
  const link = document.createElement("a");

  link.className = className;
  link.href = href;
  link.setAttribute("aria-label", label);

  return link;
}

function getFirstTopicPageUrl(href) {
  if (!href) return "";

  const url = new URL(href, window.location.href);
  const topicId = url.searchParams.get("id");

  if (!topicId) return href;

  // Удаляем номер страницы, action и якорь последнего сообщения.
  url.search = "";
  url.searchParams.set("id", topicId);
  url.hash = "";

  return url.href;
}

function getNumericUrlParameter(href, parameter) {
  if (!href) return null;

  const value = new URL(href, window.location.href).searchParams.get(parameter);

  return value && /^\d+$/.test(value) ? Number(value) : null;
}

function getPostId(href) {
  if (!href) return null;

  const match = new URL(href, window.location.href).hash.match(/^#p(\d+)$/);

  return match ? Number(match[1]) : null;
}

function getNumericText(text) {
  const value = Number.parseInt(String(text ?? "").replace(/\D/g, ""), 10);

  return Number.isNaN(value) ? 0 : value;
}

function formatTopicDate(value, now = new Date()) {
  // Убираем повторяющиеся пробелы и переносы, сохраняя разделение слов.
  const normalized = value.replace(/\s+/g, " ").trim();

  // Забираем только часы и минуты: секунды в мобильной карточке не нужны.
  const timeMatch = normalized.match(/(\d{1,2}):(\d{2})/);

  // Неизвестный формат безопаснее показать без изменений.
  if (!timeMatch) return normalized;

  // Всегда выводим часы двумя цифрами, например «09:05».
  const time = `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`;

  // Для сегодняшнего сообщения достаточно времени.
  if (/^Сегодня\b/i.test(normalized)) {
    return time;
  }

  // Для остальных вариантов получаем настоящую календарную дату.
  const date = parseTopicDate(normalized, now);

  // Если строка не распознана, оставляем исходную подпись MyBB.
  if (!date) return normalized;

  // Находим понедельник текущей недели.
  const weekStart = new Date(now);

  // Обнуляем время, чтобы сравнивать только календарные дни.
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));

  // В пределах текущей недели выводим короткий день: «пн», «вт», «ср».
  if (date >= weekStart) {
    return WEEKDAY_FORMATTER.format(date)
      .replace(/\.$/, "");
  }

  // Для более старых сообщений выводим число и месяц: «12 авг».
  return SHORT_DATE_FORMATTER.format(date).replace(/\.$/, "");
}

function parseTopicDate(value, now) {
  // «Вчера» преобразуем в предыдущий календарный день.
  if (/^Вчера\b/i.test(value)) {
    // Создаём копию, чтобы не изменять переданный объект now.
    const yesterday = new Date(now);

    // Обнуляем время и отнимаем один день.
    yesterday.setHours(0, 0, 0, 0);
    yesterday.setDate(yesterday.getDate() - 1);

    return yesterday;
  }

  // Старые сообщения MyBB отдаёт в ISO-формате: «2025-12-19 12:01:19».
  const isoMatch = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);

  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    const date = new Date(year, month - 1, day);

    // Проверяем, что Date не исправил невозможное число или месяц.
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  }

  // Поддерживаем разделители точкой, косой чертой и дефисом.
  // Год в строке может отсутствовать.
  const match = value.match(/^(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?/);

  // Другой формат эта функция разбирать не должна.
  if (!match) return null;

  // Извлекаем числовые части найденной даты.
  const day = Number(match[1]);
  const month = Number(match[2]);
  let year = match[3] ? Number(match[3]) : now.getFullYear();

  // Преобразуем короткий год, например 26, в 2026.
  if (year < 100) year += 2000;

  // Месяцы Date начинаются с нуля, поэтому вычитаем единицу.
  const date = new Date(year, month - 1, day);

  // Дата без года не должна случайно оказаться в будущем.
  // Например, «28.12» в январе относится к предыдущему году.
  if (!match[3] && date > now) {
    date.setFullYear(date.getFullYear() - 1);
  }

  // Date исправляет невозможные значения автоматически.
  // Повторная проверка отбрасывает даты вроде 31 февраля.
  if (date.getDate() !== day || date.getMonth() !== month - 1) {
    return null;
  }

  // Возвращаем корректно распознанную дату.
  return date;
}

function initTopicPreviews(main) {
  const mobileView = window.matchMedia(MOBILE_LAYOUT_QUERY);

  if (!mobileView.matches) return;

  const topicCards = main.querySelectorAll(".topic-card[data-topic-id]");

  if (!topicCards.length) return;

  const loadCardPreview = (topicCard) => {
    const topicId = Number(topicCard.dataset.topicId);

    const topicState = forumViewState.topics.get(topicId);

    if (!topicState) return;

    void loadTopicPreview(topicState, topicCard);
  };

  if (!("IntersectionObserver" in window)) {
    topicCards.forEach(loadCardPreview);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        observer.unobserve(entry.target);

        loadCardPreview(entry.target);
      });
    },
    {
      root: null,
      rootMargin: "300px 0px",
      threshold: 0,
    }
  );

  topicCards.forEach((topicCard) => {
    observer.observe(topicCard);
  });
}

async function loadTopicPreview(topicState, topicCard) {
  if (topicState.previewStatus !== "idle") return;

  topicState.previewStatus = "loading";

  updateTopicPreview(topicState, topicCard);

  try {
    const parameters = new URLSearchParams({
      method: "post.get",
      topic_id: String(topicState.id),
      limit: "1",
      sort_dir: "desc",
      charset: "utf-8",
    });

    const response = await fetch(`/api.php?${parameters.toString()}`, {
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`MyBB API вернул статус ${response.status}`);
    }

    const data = await response.json();

    if (data.error || data.code) {
      throw new Error("MyBB API вернул ошибку");
    }

    const posts = Array.isArray(data.response)
      ? data.response
      : data.response?.posts;

    const lastPost = posts?.[0];

    if (!lastPost?.message) {
      topicState.preview = "";
      topicState.previewStatus = "empty";

      updateTopicPreview(topicState, topicCard);
      return;
    }
    topicState.preview = createTopicPreview(lastPost.message);
    topicState.previewStatus = topicState.preview ? "loaded" : "empty";
  } catch (error) {
    topicState.preview = "";
    topicState.previewStatus = "error";

    console.warn(`Не удалось загрузить превью темы ${topicState.id}`, error);
  }

  updateTopicPreview(topicState, topicCard);
}

function updateTopicPreview(topicState, topicCard) {
  const previewElement = topicCard.querySelector(".topic-card__preview");

  if (!previewElement) return;

  previewElement.textContent = topicState.preview;
  topicCard.dataset.previewStatus = topicState.previewStatus;
}

function createTopicPreview(messageHtml) {
  const template = document.createElement("template");
  template.innerHTML = messageHtml;

  template.content
    .querySelectorAll(PREVIEW_EXCLUDED_SELECTOR)
    .forEach((element) => element.remove());

  template.content.querySelectorAll("img").forEach((image) => {
    const alternative = image.alt?.trim();

    image.replaceWith(
      alternative
        ? ` ${alternative} `
        : " Это картинка. Это не читается. Это смотрится. "
    );
  });

  template.content.querySelectorAll("br").forEach((lineBreak) => {
    lineBreak.replaceWith(" ");
  });

  template.content.querySelectorAll("p, div, li").forEach((element) => {
    element.append(" ");
  });

  const text = template.content.textContent.replace(/\s+/g, " ").trim();

  return limitPreviewText(text);
}

function limitPreviewText(text, maxLength = 180) {
  if (text.length <= maxLength) return text;

  const shortened = text.slice(0, maxLength);
  const lastSpace = shortened.lastIndexOf(" ");

  const result = lastSpace > 0 ? shortened.slice(0, lastSpace) : shortened;

  return `${result}…`;
}
