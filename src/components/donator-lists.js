import {
  createCardFromRow,
  createEmptyListMessage,
  moveCellToBlock,
  replaceTableWithCardList,
} from "./table-card-layout.js";

const DONATOR_TABLE_SELECTOR = [
  "#top-donators > .container > table",
  "#latest-donators > .container > table",
].join(", ");

export function initDonatorLists(root) {
  if (!root) return;

  root.querySelectorAll(DONATOR_TABLE_SELECTOR).forEach((table) => {
    replaceTableWithCardList(table, {
      listClassName: "donator-card-list forum-card-list",
      renderRow: renderDonatorCard,
    });
  });
}

function renderDonatorCard({ row, cells, headers }) {
  if (cells.length < 4) {
    return createEmptyListMessage(
      row,
      "donator-card-list__empty forum-list-card"
    );
  }

  const card = createCardFromRow(row, {
    className: "donator-card forum-list-card",
  });
  const identity = moveCellToBlock(cells[0], {
    className: "donator-card__identity tcl",
    label: headers[0],
  });
  const status = moveCellToBlock(cells[1], {
    className: "donator-card__status tc2",
    label: headers[1],
  });
  const registered = moveCellToBlock(cells[2], {
    className: "donator-card__registered tc3",
    label: headers[2],
  });
  const amount = moveCellToBlock(cells[3], {
    className: "donator-card__amount tc3",
    label: headers[3],
  });

  card.append(identity, status, registered, amount);

  return card;
}
