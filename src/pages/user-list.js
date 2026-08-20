import {
  createCardFromRow,
  moveCellToBlock,
  replaceTableWithCardList,
} from "../components/table-card-layout.js";

export function initUserList({ main }) {
  if (!main) return;

  main.classList.add("forum-design-user-list");
  if (main.dataset.userListLayout === "cards") return;

  main.querySelectorAll(".usertable > .container > table").forEach((table) => {
    replaceTableWithCardList(table, {
      listClassName: "user-card-list forum-card-list",
      renderRow: renderUserCard,
    });
  });

  main.dataset.userListLayout = "cards";
}

function renderUserCard({ row, cells, headers }) {
  if (cells.length < 6) {
    const empty = document.createElement("p");

    empty.className = "user-card-list__empty forum-list-card";
    empty.textContent = row.textContent.trim();

    return empty;
  }

  const card = createCardFromRow(row, {
    className: "user-card forum-list-card",
  });
  const identity = moveCellToBlock(cells[0], {
    className: "user-card__identity tcl username",
    label: headers[0],
  });
  const title = moveCellToBlock(cells[1], {
    className: "user-card__title tc2 user_title",
    label: headers[1],
  });
  const respect = moveCellToBlock(cells[2], {
    className: "user-card__stat user-card__respect tc3 relation",
    label: headers[2],
  });
  const posts = moveCellToBlock(cells[3], {
    className: "user-card__stat user-card__posts tc3 num_posts",
    label: headers[3],
  });
  const registered = moveCellToBlock(cells[4], {
    className: "user-card__registered tc3 registered",
    label: headers[4],
  });
  const lastVisit = moveCellToBlock(cells[5], {
    className: "user-card__last-visit tc3 last_visit",
    label: headers[5],
  });
  const stats = document.createElement("div");

  stats.className = "user-card__stats";
  stats.append(respect, posts);
  card.append(identity, title, stats, registered, lastVisit);

  return card;
}
