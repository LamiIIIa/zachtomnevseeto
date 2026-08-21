import { forumConfig } from "../config/forum.js";
import { t } from "../i18n/index.js";
import {
  createCardFromRow,
  createEmptyListMessage,
  moveCellToBlock,
  replaceTableWithCardList,
} from "../components/table-card-layout.js";

export function initProfile({ root, main, userId }) {
  main?.classList.add("forum-design-profile");
  if (userId !== null) main?.setAttribute("data-user-id", String(userId));

  const profileNavigation = placeProfileNavigation(root, main);

  transformViewProfileLayout(main);
  transformProfileFileTable(main);
  initProfileNavigationDropdown(profileNavigation);
  lockRestrictedProfile(main);
}

function transformProfileFileTable(main) {
  const table = main?.querySelector("#profile #filetable");

  if (!table || table.dataset.cardLayoutReady === "true") return;

  const selectAll = table.querySelector("thead #checker");

  table.dataset.cardLayoutReady = "true";

  const list = replaceTableWithCardList(table, {
    listClassName: "profile-file-card-list forum-card-list",
    listLabel: "Загруженные файлы",
    renderRow: renderProfileFileCard,
  });

  if (!list || !selectAll) return;

  const toolbar = document.createElement("div");
  const label = document.createElement("label");
  const labelText = document.createElement("span");

  toolbar.className = "profile-file-card-toolbar";
  label.className = "profile-file-card-toolbar__select-all";
  labelText.textContent = selectAll.title || "Выделить все";
  selectAll.removeAttribute("title");
  selectAll.addEventListener("change", () => {
    list
      .querySelectorAll('.profile-file-card__selection input[type="checkbox"]')
      .forEach((checkbox) => {
        checkbox.checked = selectAll.checked;
      });
  });
  label.append(selectAll, labelText);
  toolbar.append(label);
  list.before(toolbar);
}

function renderProfileFileCard({ row, cells, headers }) {
  if (cells.length < 7) {
    return createEmptyListMessage(
      row,
      "profile-file-card-list__empty forum-list-card"
    );
  }

  const card = createCardFromRow(row, {
    className: "profile-file-card forum-list-card",
  });
  const name = moveCellToBlock(cells[0], {
    className: "profile-file-card__name tcl",
    label: headers[0],
  });
  const uploaded = moveCellToBlock(cells[1], {
    className: "profile-file-card__uploaded tc2 ft-uploaded",
    label: headers[1],
  });
  const modified = moveCellToBlock(cells[2], {
    className: "profile-file-card__modified tc2",
    label: headers[2],
  });
  const version = moveCellToBlock(cells[3], {
    className: "profile-file-card__version tc3 ft-version",
    label: headers[3],
  });
  const size = moveCellToBlock(cells[4], {
    className: "profile-file-card__size tc3",
    label: headers[4],
  });
  const comment = moveCellToBlock(cells[5], {
    className: "profile-file-card__comment tcr",
    label: headers[5],
  });
  const selection = moveCellToBlock(cells[6], {
    className: "profile-file-card__selection tc3 checker",
  });
  const dates = document.createElement("div");
  const details = document.createElement("div");
  const checkbox = selection.querySelector('input[type="checkbox"]');

  dates.className = "profile-file-card__dates";
  details.className = "profile-file-card__details";
  dates.append(uploaded, modified);
  details.append(version, size);

  if (checkbox) {
    checkbox.setAttribute(
      "aria-label",
      `Выбрать файл ${name.textContent.trim()}`
    );
  }

  card.append(name, dates, details, comment, selection);
  return card;
}

function transformViewProfileLayout(main) {
  if (!main) return;

  const viewProfile = main.querySelector("#viewprofile");

  if (!viewProfile) return;

  if (viewProfile.dataset.blockLayoutReady === "true") return;

  const container = viewProfile.querySelector(":scope > .container");
  const contentList = container?.querySelector(":scope > ul");
  const table = contentList?.querySelector("table");
  const profileLeft = table?.querySelector("#profile-left");
  const profileRight = table?.querySelector("#profile-right");

  if (!container || !contentList || !table || !profileLeft || !profileRight) {
    return;
  }

  const layout = document.createElement("div");

  layout.className = "viewprofile-layout";

  const leftBlock = createProfileBlock(
    profileLeft,
    "viewprofile-column",
    "viewprofile-column--left"
  );

  const rightBlock = createProfileBlock(
    profileRight,
    "viewprofile-column",
    "viewprofile-column--right"
  );

  transformProfileItems(leftBlock);
  transformProfileItems(rightBlock);
  normalizeProfilePostLinks(rightBlock);

  layout.append(leftBlock, rightBlock);
  table.replaceWith(layout);

  transformProfileSignature(viewProfile);

  const contentBlock = createProfileBlock(contentList, "viewprofile-content");

  contentList.replaceWith(contentBlock);

  viewProfile.dataset.blockLayoutReady = "true";
}

function normalizeProfilePostLinks(profileRight) {
  const postLinks = profileRight?.querySelector("#pa-posts strong");

  if (!postLinks) return;

  Array.from(postLinks.childNodes).forEach((node) => {
    if (node.nodeType !== Node.TEXT_NODE) return;

    node.textContent = node.textContent
      .replace(/\s*-\s*$/, "")
      .replace(/\s*\|\s*/g, "");
  });
}

function createProfileBlock(source, ...classNames) {
  const block = document.createElement("div");

  Array.from(source.attributes).forEach((attribute) => {
    block.setAttribute(attribute.name, attribute.value);
  });

  block.classList.add(...classNames);
  block.append(...source.childNodes);

  return block;
}

function transformProfileItems(column) {
  const items = column.querySelectorAll(":scope > li");

  items.forEach((item) => {
    const block = createProfileBlock(item, "viewprofile-item");

    item.replaceWith(block);
  });
}

function transformProfileSignature(viewProfile) {
  const signature = viewProfile.querySelector("#profile-signature");
  const signatureList = signature?.querySelector(":scope > ul");

  if (!signatureList) return;

  const signatureBlock = createProfileBlock(
    signatureList,
    "viewprofile-signature-content"
  );

  signatureList.replaceWith(signatureBlock);
}

function placeProfileNavigation(root, main) {
  if (!root || !main) return null;

  const profilePage = main.querySelector("#viewprofile, #profile");
  const profileNavigation = root.querySelector("#profilenav");
  const topCrumbsSection = root.querySelector("#pun-crumbs1");

  if (!profilePage || !profileNavigation || !topCrumbsSection) return null;

  topCrumbsSection.replaceWith(profileNavigation);

  profileNavigation.style.removeProperty("display");
  profileNavigation.removeAttribute("hidden");
  profileNavigation.classList.add("profile-section-menu");

  return profileNavigation;
}

function initProfileNavigationDropdown(navigation) {
  const linkList = navigation?.querySelector(":scope > ul");

  if (!navigation || !linkList) return;
  if (navigation.dataset.dropdownReady === "true") return;

  const button = document.createElement("button");
  const buttonText = document.createElement("span");

  if (!linkList.id) {
    linkList.id = "profile-navigation-links";
  }

  linkList.classList.add("profile-section-menu__items");

  button.type = "button";
  button.className = "profile-navigation-toggle";
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", linkList.id);

  buttonText.textContent = "Разделы профиля";
  button.append(buttonText);

  navigation.prepend(button);

  button.addEventListener("click", () => {
    const isOpen = navigation.classList.toggle("profile-section-menu--open");

    button.setAttribute("aria-expanded", String(isOpen));
  });

  linkList.addEventListener("click", (event) => {
    if (!event.target.closest("a")) return;

    closeProfileNavigation(navigation, button);
  });

  document.addEventListener("click", (event) => {
    if (navigation.contains(event.target)) return;

    closeProfileNavigation(navigation, button);
  });

  navigation.dataset.dropdownReady = "true";
}

function closeProfileNavigation(navigation, button) {
  navigation.classList.remove("profile-section-menu--open");
  button.setAttribute("aria-expanded", "false");
}

function lockRestrictedProfile(main) {
  if (
    !main ||
    !forumConfig.profile.lockedGroupIds.includes(Number(window.GroupID))
  )
    return;

  const submitButtons = main.querySelectorAll(
    'input[type="submit"], button[type="submit"]'
  );
  if (!submitButtons.length) return;

  submitButtons.forEach((button) => {
    button.disabled = true;
  });

  const submitArea = main.querySelector(".formsubmit");
  if (!submitArea || submitArea.querySelector(".profile-lock-notice")) return;

  const notice = document.createElement("span");
  notice.className = "profile-lock-notice";
  notice.dataset.i18n = "profile.editLocked";
  notice.textContent = t("profile.editLocked");
  submitArea.append(notice);
}
