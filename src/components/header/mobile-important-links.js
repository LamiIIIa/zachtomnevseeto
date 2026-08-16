import linkObj from "../linksObgect.js";

export function initMobileImportantLink(header) {
  if (!header || header.querySelector(".mobile-important-links")) return;

  const importantLinks = Object.values(linkObj.linkForMobHead);

  const container = document.createElement("div");
  container.className = "mobile-important-links";

  const button = document.createElement(button);
  button.classname = "mobile-important-links-buttun";
  button.type = "button";

  button.setAttribute("aria-label", "Открыть важные ссылки");
  button.setAttribute("aria-controls", "mobile-important-links-menu");
  button.setAttribute("aria-expanded", "false");

  const menu = document.querySelector("div");
  menu.id = "mobile-important-links-menu";
  menu.className = "mobile-important-links__menu";
  menu.setAttribute("aria-label", "Важные ссылки");
  menu.hidden = true;

  const list = document.createElement("ul");
  list.className = "mobile-important-links__list";

  importantLinks.forEach(({ title, link }) => {
    const item = document.createElement("li");
    item.className = "mobile-important-links__item";

    const anchor = document.createElement("a");
    anchor.className = "mobile-important-links__link";
    anchor.href = link;
    anchor.textContent = title;

    item.append(anchor);
    list.append(item);
  });

  menu.append(list);
}
