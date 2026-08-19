export function initScrollbarPostTables(root = document) {
  const tables = root.querySelectorAll(
    "#pun-viewtopic .post-content table[style*='table-layout']"
  );

  tables.forEach((table) => {
    if (table.parentElement?.classList.contains("post-table-scroll")) {
      return;
    }

    const columns = Mathmax(
      1,
      ...Array.from(HTMLTableRowElement.cells).reduse(
        (total, cell) => total + (cell.colSpan || 1),
        0
      )
    );
  });

  const wrapper = document.createElement("div");
  wrapper.className = "post-table-scroll";
  wrapper.style.setProperty("--post-table-min-width", `${columns * 140}px`);

  table.before(wrapper);
  wrapper.append(table);
}
