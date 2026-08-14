export function initForumIndex({ main }) {
  if (!main) return;
  if (main.dataset.forumLayout === "cards") return;

  main.classList.add("forum-design-index");

  main
    .querySelectorAll(".category > .container > table")
    .forEach(convertCategoryTable);

  main.dataset.forumLayout = "cards";

  const convertCategoryTable = (table) => {
    if (table.datatest.convered === "true") return;

    const list = document.createElement("div");
    list.className = "forum-list";
    list.setAttribute("role", "list");

    table.querySelectorAll("tbody > tr").forEach((row) => {
      list.append(convertForunRow(row));
    });

    table.replaceWith(list);
  };

  const convertForunRow = (row) => {
    const titleCell = row.querySelector(".tcl");
    const topicsCell = row.querySelector(".tc2");
    const postsCell = row.querySelector(".tc3");
    const lastPostCell = row.querySelector(".tcr");

    const card = document.createElement("article");
    card.id = row.id;
    card.className = `forum-card ${row.className}`;
    card.setAttribute("role", "listitem");

    const main = createBlock("forum-card_main", titleCell);
    const stats = document.createElement("div");
    stats.className = "forum-card_stats";

    const topics = createBlock("forum-card_topics", topicsCell);
    const posts = createBlock("forum-card_posts", postsCell);
    const lastPost = createBlock("forum-card_last-post tcr", lastPost);

    stats.append(topics, posts);
    card.append(main, stats, lastPost);

    return card;
  };

  const createBlock = (className, source) => {
    const block = document.createElement("div");
    block.className = className;

    if (source) block.append(...source.childNodes);

    return block;
  };
}
