const ACTIVE_TOPIC_STATES = [
  "isticky",
  "iclosed",
  "ipinned",
  "pinned",
  "important",
];

export function initForumModeration({ main }) {
  if (!main || main.dataset.moderationLayout === "cards") return;

  const table = main.querySelector(".forum > .container > table");

  if (!table) return;

  const topicList = createModerationTopicList(table);

  table.replaceWith(topicList);
  main.dataset.moderationLayout = "cards";
}

function createModerationTopicList(table) {
  const topicList = document.createElement("div");
  const headers = Array.from(table.tHead?.rows[0]?.cells ?? []).map((cell) =>
    cell.textContent.trim()
  );
  const rows = Array.from(table.tBodies).flatMap((body) =>
    Array.from(body.rows)
  );

  topicList.className = "moderation-topic-list";
  topicList.setAttribute("role", "list");

  const label = table.getAttribute("summary");

  if (label) topicList.setAttribute("aria-label", label);

  rows.forEach((row) => {
    topicList.append(createModerationTopicCard(row, headers));
  });

  return topicList;
}

function createModerationTopicCard(row, headers) {
  const cells = Array.from(row.cells);

  // MyBB может вывести вместо тем одну служебную строку с сообщением.
  if (cells.length < 5) {
    const message = document.createElement("p");

    message.className = "moderation-topic-list__empty";
    message.textContent = row.textContent.trim();

    return message;
  }

  const icon = cells[0]?.querySelector(".icon");
  const iconClasses = new Set(
    [icon, ...(icon?.querySelectorAll("*") ?? [])]
      .filter(Boolean)
      .flatMap((element) => Array.from(element.classList))
  );
  const inheritedStates = ACTIVE_TOPIC_STATES.filter((state) =>
    iconClasses.has(state)
  );
  const hasNewMessages = Boolean(
    row.classList.contains("inew") ||
      iconClasses.has("inew") ||
      iconClasses.has("icon-new") ||
      icon?.title === "Есть новые сообщения" ||
      cells[0]?.querySelector(".newtext")
  );
  const topicCard = document.createElement("article");

  // Иконка будет нарисована псевдоэлементом карточки на десктопе.
  icon?.remove();

  topicCard.className = [
    "moderation-topic-card",
    ...Array.from(row.classList),
    ...inheritedStates,
  ].join(" ");
  topicCard.classList.toggle("inew", hasNewMessages);
  topicCard.setAttribute("role", "listitem");

  if (row.id) topicCard.id = row.id;

  const main = createBlock(
    "moderation-topic-card__main tcl",
    cells[0],
    headers[0]
  );
  const replies = createBlock(
    "moderation-topic-card__stat moderation-topic-card__replies tc2",
    cells[1],
    headers[1]
  );
  const views = createBlock(
    "moderation-topic-card__stat moderation-topic-card__views tc3",
    cells[2],
    headers[2]
  );
  const lastPost = createBlock(
    "moderation-topic-card__last-post tcr",
    cells[3],
    headers[3]
  );
  const selection = createBlock(
    "moderation-topic-card__selection tcmod",
    cells[4],
    headers[4]
  );
  const stats = document.createElement("div");
  const topicTitle = main
    .querySelector('a[href*="viewtopic.php"]')
    ?.textContent.trim();
  const checkbox = selection.querySelector('input[type="checkbox"]');

  if (checkbox && topicTitle && !checkbox.hasAttribute("aria-label")) {
    checkbox.setAttribute("aria-label", `Выбрать тему «${topicTitle}»`);
  }

  stats.className = "moderation-topic-card__stats";
  stats.append(replies, views);
  topicCard.append(main, stats, lastPost, selection);

  return topicCard;
}

function createBlock(className, source, label) {
  const block = document.createElement("div");

  block.className = className;
  if (label) block.dataset.label = label;
  if (source) block.append(...source.childNodes);

  return block;
}
