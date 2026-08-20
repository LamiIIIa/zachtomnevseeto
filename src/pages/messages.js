import {
  createCardFromRow,
  moveCellToBlock,
  replaceTableWithCardList,
} from "../components/table-card-layout.js";

export function initMessages({ root, main }) {
  if (!main) return;

  main.classList.add("forum-design-messages");
  initMessagesNavigation(root, main);
  initMessagesPreviewToggle(main);

  if (main.dataset.messagesLayout === "cards") return;

  const table = main.querySelector("form#messages fieldset table");

  if (!table) return;

  replaceTableWithCardList(table, {
    listClassName: "message-list",
    renderRow: ({ row, cells, headers }) =>
      createMessageCard(row, cells, headers),
  });

  main.dataset.messagesLayout = "cards";
}

function initMessagesPreviewToggle(main) {
  const postForm = main.querySelector("form#post");
  const postFormBody = postForm?.querySelector("#post-form");
  const actions = postFormBody
    ?.querySelector('input[name="preview"]')
    ?.closest("p");

  if (
    !postForm ||
    !postFormBody ||
    !actions ||
    postForm.querySelector("#togglePreview")
  ) {
    return;
  }

  const enableLabel = "Включить быстрый предпросмотр";
  const disableLabel = "Отключить быстрый предпросмотр";
  const toggle = document.createElement("small");
  const button = document.createElement("input");

  toggle.id = "togglePreview";
  toggle.dataset.previewState = "on";
  button.type = "button";
  button.className = "button";
  button.value = disableLabel;
  button.title = disableLabel;
  button.setAttribute("aria-label", disableLabel);

  button.addEventListener("click", () => {
    if (typeof window.togglePreview !== "function") return;

    window.togglePreview(button);
    syncMessagesPreviewState(postForm, toggle, button, enableLabel);
  });

  toggle.append(button);
  actions.before(toggle);

  if (readCookie("_PreviewToggle") === "OFF") {
    button.click();
  }
}

function syncMessagesPreviewState(postForm, toggle, button, enableLabel) {
  const isEnabled = button.value !== enableLabel;

  toggle.dataset.previewState = isEnabled ? "on" : "off";
  postForm.querySelectorAll("#post-preview").forEach((preview) => {
    preview.hidden = !isEnabled;
    preview.style.display = isEnabled ? "" : "none";
  });
}

function readCookie(name) {
  const prefix = `${encodeURIComponent(name)}=`;
  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
}

function createMessageCard(row, cells, headers) {
  if (cells.length < 4) {
    const message = document.createElement("p");

    message.className = "message-list__empty";
    message.textContent = row.textContent.trim();

    return message;
  }

  const oldIcon = cells[0]?.querySelector(".icon");
  const iconElements = oldIcon
    ? [oldIcon, ...oldIcon.querySelectorAll("*")]
    : [];
  const iconClasses = new Set(
    iconElements.flatMap((element) => Array.from(element.classList))
  );
  const hasNewMessages = Boolean(
    row.classList.contains("inew") ||
      iconClasses.has("inew") ||
      iconClasses.has("icon-new") ||
      oldIcon?.title === "Есть новые сообщения"
  );
  const card = createCardFromRow(row, { className: "message-card" });

  oldIcon?.remove();
  card.classList.toggle("inew", hasNewMessages);
  card.dataset.messageState = hasNewMessages ? "unread" : "read";

  const subject = moveCellToBlock(cells[0], {
    className: "message-card__subject tcl",
    label: headers[0],
  });
  const sender = moveCellToBlock(cells[1], {
    className: "message-card__sender tc2",
    label: headers[1],
  });
  const date = moveCellToBlock(cells[2], {
    className: "message-card__date tc3",
    label: headers[2],
  });
  const selection = moveCellToBlock(cells[3], {
    className: "message-card__selection tc2",
    label: headers[3],
  });
  const subjectLink = subject.querySelector('a[href*="messages.php"]');
  const checkbox = selection.querySelector('input[type="checkbox"]');

  if (checkbox && subjectLink && !checkbox.hasAttribute("aria-label")) {
    checkbox.setAttribute(
      "aria-label",
      `Выбрать сообщение «${subjectLink.textContent.trim()}»`
    );
  }

  card.append(subject, sender, date, selection);

  return card;
}

function initMessagesNavigation(root, main) {
  if (!root || main.dataset.messagesNavigationReady === "true") return;

  const navigation = main.querySelector("#profilenav");
  const crumbsSection = root.querySelector("#pun-crumbs1");

  if (!navigation || !crumbsSection) return;

  navigation.classList.add("messages-navigation");

  const toolbar = document.createElement("nav");

  toolbar.className = "messages-mobile-navigation";
  toolbar.setAttribute("aria-label", "Навигация по личным сообщениям");

  Array.from(navigation.querySelectorAll(":scope > h2")).forEach(
    (heading, index) => {
      const sourceList = heading.nextElementSibling;

      if (!sourceList?.matches("ul")) return;

      toolbar.append(createNavigationGroup(heading, sourceList, index));
    }
  );

  if (!toolbar.children.length) return;

  crumbsSection.append(toolbar);
  main.dataset.messagesNavigationReady = "true";

  document.addEventListener("click", (event) => {
    if (toolbar.contains(event.target)) return;

    closeNavigationGroups(toolbar);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    closeNavigationGroups(toolbar);
  });
}

function createNavigationGroup(heading, sourceList, index) {
  const group = document.createElement("div");
  const button = document.createElement("button");
  const menu = sourceList.cloneNode(true);
  const menuId = `messages-mobile-menu-${index + 1}`;

  group.className = "messages-mobile-navigation__group";
  button.className = "messages-mobile-navigation__button";
  button.type = "button";
  button.textContent = heading.textContent.trim();
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", menuId);
  menu.className = "messages-mobile-navigation__menu";
  menu.id = menuId;

  button.addEventListener("click", () => {
    const shouldOpen = !group.classList.contains(
      "messages-mobile-navigation__group--open"
    );
    const toolbar = group.parentElement;

    closeNavigationGroups(toolbar);
    group.classList.toggle(
      "messages-mobile-navigation__group--open",
      shouldOpen
    );
    button.setAttribute("aria-expanded", String(shouldOpen));
  });

  group.append(button, menu);

  return group;
}

function closeNavigationGroups(toolbar) {
  if (!toolbar) return;

  toolbar
    .querySelectorAll(".messages-mobile-navigation__group--open")
    .forEach((group) => {
      group.classList.remove("messages-mobile-navigation__group--open");
      group
        .querySelector(".messages-mobile-navigation__button")
        ?.setAttribute("aria-expanded", "false");
    });
}
