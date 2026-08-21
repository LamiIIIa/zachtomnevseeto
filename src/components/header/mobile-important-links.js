import linkObj from "../links-object.js";

export function initMobileImportantLinks(header) {
  if (!header || header.querySelector(".mobile-important-links")) return;

  const importantLinks = Object.values(linkObj.linkForMobHead);

  const container = document.createElement("div");
  container.className = "mobile-important-links";

  const button = document.createElement("button");
  button.className = "mobile-important-links__button";
  button.type = "button";

  button.setAttribute("aria-label", "Открыть важные ссылки");
  button.setAttribute("aria-controls", "mobile-important-links-menu");
  button.setAttribute("aria-expanded", "false");

  const menu = document.createElement("nav");
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

  const closeMenu = () => {
    menu.hidden = true;
    button.setAttribute("aria-expanded", "false");
  };

  const openMenu = () => {
    menu.hidden = false;
    button.setAttribute("aria-expanded", "true");
  };

  button.addEventListener("click", () => {
    const isOpen = button.getAttribute("aria-expanded") === "true";

    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  menu.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      closeMenu();
    }
  });

  document.addEventListener("pointerdown", (event) => {
    if (!container.contains(event.target)) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  container.append(menu, button);
  header.append(container);
}
