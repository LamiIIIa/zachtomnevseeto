import { forumConfig } from "../config/forum.js";
import { t } from "../i18n/index.js";

export function initProfile({ root, main, userId }) {
  main?.classList.add("forum-design-profile");
  if (userId !== null) main?.setAttribute("data-user-id", String(userId));

  placeProfileNavigation(root, main);
  transformViewProfileLayout(main);
  initProfileNavigationDropdown(root);
  lockRestrictedProfile(main);
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

  layout.append(leftBlock, rightBlock);
  table.replaceWith(layout);

  transformProfileSignature(viewProfile);

  const contentBlock = createProfileBlock(contentList, "viewprofile-content");

  contentList.replaceWith(contentBlock);

  viewProfile.dataset.blockLayoutReady = "true";
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
  if (!root || !main) return;

  const profilePage = main.querySelector("#viewprofile, #profile");
  const profileNavigation = root.querySelector("#profilenav");
  const topCrumbsSection = root.querySelector("#pun-crumbs1");

  if (!profilePage || !profileNavigation || !topCrumbsSection) return;

  topCrumbsSection.replaceWith(profileNavigation);

  profileNavigation.style.removeProperty("display");
  profileNavigation.removeAttribute("hidden");
  profileNavigation.classList.add("profile-section-menu");
}

function initProfileNavigationDropdown(root) {
  if (!root) return;

  const navigation = root.querySelector("#profilenav");
  const linkList = navigation?.querySelector(":scope > ul");

  if (!navigation || !linkList) return;
  if (navigation.dataset.dropdownReady === "true") return;

  const button = document.createElement("button");
  const buttonText = document.createElement("span");

  if (!linkList.id) {
    linkList.id = "profile-navigation-links";
  }

  inkList.classList.add("profile-section-menu__items");

  button.type = "button";
  button.className = "profile-navigation-toggle";
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", linkList.id);

  buttonText.textContent = "Разделы профиля";

  if (!linkList.id) {
    linkList.id = "profile-navigation-links";
  }

  linkList.classList.add("profile-section-menu__items");

  button.setAttribute("aria-controls", linkList.id);
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
