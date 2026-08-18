export function replaceTableWithCardList(
  table,
  { listClassName, renderRow, listLabel = "" }
) {
  if (!table || !listClassName || typeof renderRow !== "function") return null;

  const list = document.createElement("div");
  const headers = Array.from(table.tHead?.rows[0]?.cells ?? []).map((cell) =>
    cell.textContent.trim()
  );
  const rows = Array.from(table.tBodies).flatMap((body) =>
    Array.from(body.rows)
  );
  const accessibleLabel = listLabel || table.getAttribute("summary");

  list.className = listClassName;
  list.setAttribute("role", "list");

  if (accessibleLabel) list.setAttribute("aria-label", accessibleLabel);

  rows.forEach((row, rowIndex) => {
    const card = renderRow({
      row,
      rowIndex,
      cells: Array.from(row.cells),
      headers,
    });

    if (card) list.append(card);
  });

  table.replaceWith(list);

  return list;
}

export function createCardFromRow(
  row,
  { className, tagName = "article", inheritRowClasses = true }
) {
  const card = document.createElement(tagName);
  const classNames = [className];

  if (inheritRowClasses) classNames.push(...row.classList);

  card.className = classNames.filter(Boolean).join(" ");
  card.setAttribute("role", "listitem");

  if (row.id) card.id = row.id;

  return card;
}

export function moveCellToBlock(
  source,
  { className, label = "", tagName = "div" }
) {
  const block = document.createElement(tagName);

  block.className = className;

  if (label) block.dataset.label = label;
  if (source) block.append(...source.childNodes);

  return block;
}
