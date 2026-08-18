import {
  createCardFromRow,
  moveCellToBlock,
  replaceTableWithCardList,
} from "../components/table-card-layout.js";

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

  replaceTableWithCardList(table, {
    listClassName: "moderation-topic-list",
    renderRow: ({ row, headers, cells }) =>
      createModerationTopicCard(row, headers, cells),
  });
  main.dataset.moderationLayout = "cards";
}

function createModerationTopicCard(row, headers, cells) {

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
  const topicCard = createCardFromRow(row, {
    className: "moderation-topic-card",
  });

  // Иконка будет нарисована псевдоэлементом карточки на десктопе.
  icon?.remove();

  topicCard.classList.add(...inheritedStates);
  topicCard.classList.toggle("inew", hasNewMessages);

  const main = moveCellToBlock(cells[0], {
    className: "moderation-topic-card__main tcl",
    label: headers[0],
  });
  const replies = moveCellToBlock(cells[1], {
    className: "moderation-topic-card__stat moderation-topic-card__replies tc2",
    label: headers[1],
  });
  const views = moveCellToBlock(cells[2], {
    className: "moderation-topic-card__stat moderation-topic-card__views tc3",
    label: headers[2],
  });
  const lastPost = moveCellToBlock(cells[3], {
    className: "moderation-topic-card__last-post tcr",
    label: headers[3],
  });
  const selection = moveCellToBlock(cells[4], {
    className: "moderation-topic-card__selection tcmod",
    label: headers[4],
  });
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
