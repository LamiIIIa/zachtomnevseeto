import {
  applyTopicCardAppearance,
  createCardFromRow,
  getTopicCardAppearance,
  moveCellToBlock,
  replaceTableWithCardList,
} from "../components/table-card-layout.js";

const TOPIC_SEARCH_ACTIONS = new Set([
  "show_recent",
  "show_replies",
  "show_subscriptions",
  "show_unanswered",
]);

export function initSearch({ main }) {
  if (!main) return;

  main.classList.add("forum-design-search");

  const action = new URLSearchParams(window.location.search)
    .get("action")
    ?.replace(/,+$/, "");

  if (!TOPIC_SEARCH_ACTIONS.has(action)) return;

  main.classList.add("forum-design-topic-search");
  if (main.dataset.searchTopicLayout === "cards") return;

  main.querySelectorAll(".forum > .container > table").forEach((table) => {
    replaceTableWithCardList(table, {
      listClassName: "search-topic-list forum-card-list",
      renderRow: renderSearchTopicCard,
    });
  });

  main.dataset.searchTopicLayout = "cards";
}

function renderSearchTopicCard({ row, cells, headers }) {
  if (cells.length < 4) {
    const empty = document.createElement("p");

    empty.className = "search-topic-list__empty forum-list-card";
    empty.textContent = row.textContent.trim();

    return empty;
  }

  const appearance = getTopicCardAppearance(row, cells[0]);
  const card = createCardFromRow(row, {
    className: "search-topic-card forum-list-card forum-topic-card",
  });

  applyTopicCardAppearance(card, cells[0], appearance);

  const subject = moveCellToBlock(cells[0], {
    className: "search-topic-card__subject tcl",
    label: headers[0],
  });
  const forum = moveCellToBlock(cells[1], {
    className: "search-topic-card__forum tc2",
    label: headers[1],
  });
  const replies = moveCellToBlock(cells[2], {
    className: "search-topic-card__replies tc3",
    label: headers[2],
  });
  const lastPost = moveCellToBlock(cells[3], {
    className: "search-topic-card__last-post tcr",
    label: headers[3],
  });

  card.append(subject, forum, replies, lastPost);

  return card;
}
