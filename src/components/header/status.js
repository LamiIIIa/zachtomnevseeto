import { t } from "../../i18n/index.js";

// Страница VIP объясняет способы улучшения аккаунта и поддержки фонда форума.
const SUPPORT_FORUM_URL = "/vip.php";

// Системный аватар используется, если настоящий ещё не найден на страницах форума.
const DEFAULT_AVATAR_URL = "/img/avatars/default.png";

// Кеш позволяет показывать найденный ранее аватар без фонового перехода в
// profile.php. Такой запрос MyBB учитывает как реальное посещение профиля и
// из-за него неверно меняет местоположение пользователя в списке «Активны».
const STATUS_AVATAR_CACHE_KEY = "forum-status-avatars";

// Перестраивает стандартную строку статуса MyBB для авторизованного пользователя.
export function initUserStatus(root) {
  // В десктопной версии панель используется на всех страницах;
  // на мобильных внутренних страницах её скрывает responsive/mobile.css.
  if (!root) return;

  // Находим исходные элементы статуса и ссылку на профиль текущего пользователя.
  const container = root.querySelector("#pun-status .container");
  const profileLink = root.querySelector('#navprofile a[href*="profile.php"]');

  // У гостя нет ссылки на профиль, поэтому его стандартный статус не меняем.
  if (!container || !profileLink || container.dataset.statusLayout === "ready")
    return;

  // MyBB уже создал приветствие, последний визит и ссылку улучшения аккаунта.
  const greeting = container.querySelector(":scope > .item1");
  const lastVisit = container.querySelector(":scope > .item2");
  const premiumAction = container.querySelector(":scope > .status-right");

  // Не перестраиваем неизвестный вариант разметки, чтобы не потерять его содержимое.
  if (!greeting || !premiumAction) return;

  // Создаём левую область с аватаром и двумя строками пользовательских данных.
  const userBlock = document.createElement("span");
  const userText = document.createElement("span");
  const avatar = createStatusAvatar(root, profileLink);

  userBlock.classList.add("status-user");
  userText.classList.add("status-user__text");
  greeting.classList.add("status-user__line", "status-user__greeting");
  lastVisit?.classList.add("status-user__line", "status-user__last-visit");

  // Сохраняем оригинальные тексты MyBB и только переносим их в новую структуру.
  userText.append(greeting);
  if (lastVisit) userText.append(lastVisit);
  userBlock.append(avatar, userText);

  // Создаём правую колонку действий.
  const actions = document.createElement("span");
  const supportLabel = t("status.supportForum");
  const hasSupportAction = Array.from(
    premiumAction.querySelectorAll("a")
  ).some((link) => normalizeText(link.textContent) === normalizeText(supportLabel));

  actions.classList.add("status-actions");
  premiumAction.classList.add("status-action", "status-action--premium");
  removeStandalonePunctuation(premiumAction);

  actions.append(premiumAction);

  // На основном форуме системный блок уже содержит кнопку поддержки фонда.
  // На страницах без неё создаём дополнительную ссылку, как раньше.
  if (!hasSupportAction) {
    const supportLink = document.createElement("a");

    supportLink.classList.add("status-action", "status-action--support");
    supportLink.href = SUPPORT_FORUM_URL;
    supportLink.dataset.i18n = "status.supportForum";
    supportLink.textContent = supportLabel;
    actions.append(supportLink);
  }

  // Заменяем только содержимое строки, не удаляя системный контейнер MyBB.
  container.replaceChildren(userBlock, actions);
  container.classList.add("status-layout");
  container.dataset.statusLayout = "ready";
}

function normalizeText(value) {
  return value?.replace(/\s+/g, " ").trim().toLocaleLowerCase() || "";
}

function removeStandalonePunctuation(element) {
  Array.from(element.childNodes).forEach((node) => {
    if (node.nodeType !== Node.TEXT_NODE) return;
    if (/^[\s.,;:!?]+$/.test(node.textContent)) node.remove();
  });
}

// Создаёт независимый аватар без старого класса .user-avatar и его конфликтов.
function createStatusAvatar(root, profileLink) {
  const profileId = getProfileId(profileLink.href);

  // На главной адрес аватара часто уже есть в данных последнего сообщения, а
  // на собственной странице профиля — в стандартном блоке #pa-avatar.
  const listedAvatar = Array.from(root.querySelectorAll(".user-avatar")).find(
    (avatar) => getProfileId(avatar.querySelector("a")?.href) === profileId
  );
  const authoredPost = Array.from(root.querySelectorAll(".post")).find(
    (post) =>
      getProfileId(post.querySelector('.pa-author a[href*="profile.php"]')?.href) ===
      profileId
  );
  const postAvatar = authoredPost?.querySelector(".pa-avatar");
  const profileAvatar =
    getProfileId(window.location.href) === profileId
      ? root.querySelector("#pa-avatar")
      : null;
  const existingAvatar = listedAvatar || postAvatar || profileAvatar;
  const existingSource = getAvatarSource(existingAvatar);
  const cachedSource = getCachedAvatarSource(profileId);

  // Создаём простую разметку, которая не наследует стили аватаров карточек.
  const avatar = document.createElement("span");
  const link = document.createElement("a");
  const image = document.createElement("img");

  avatar.classList.add("status-user__avatar");
  link.href = profileLink.href;
  link.setAttribute("aria-label", profileLink.textContent.trim());
  image.classList.add("status-user__avatar-image");
  image.src = existingSource || cachedSource || DEFAULT_AVATAR_URL;
  image.alt = "";
  link.append(image);
  avatar.append(link);

  if (existingSource) cacheAvatarSource(profileId, existingSource);

  return avatar;
}

// Извлекает URL как из обычного img, так и из фонового .avatar-image MyBB.
function getAvatarSource(avatar) {
  if (!avatar) return null;

  const imageSource = avatar.querySelector("img")?.src;
  if (imageSource) return imageSource;

  const background =
    avatar.querySelector(".avatar-image")?.style.backgroundImage;
  const match = background?.match(/^url\(["']?(.*?)["']?\)$/);

  return match?.[1] || null;
}

// Возвращает числовой id из стандартной ссылки MyBB profile.php?id=N.
function getProfileId(href) {
  if (!href) return null;

  try {
    return new URL(href, window.location.href).searchParams.get("id");
  } catch {
    return null;
  }
}

function getCachedAvatarSource(profileId) {
  if (!profileId) return null;

  try {
    const avatars = JSON.parse(
      window.localStorage.getItem(STATUS_AVATAR_CACHE_KEY) || "{}"
    );
    return typeof avatars[profileId] === "string" ? avatars[profileId] : null;
  } catch {
    return null;
  }
}

function cacheAvatarSource(profileId, source) {
  if (!profileId || !source) return;

  try {
    const avatars = JSON.parse(
      window.localStorage.getItem(STATUS_AVATAR_CACHE_KEY) || "{}"
    );
    avatars[profileId] = source;
    window.localStorage.setItem(STATUS_AVATAR_CACHE_KEY, JSON.stringify(avatars));
  } catch {
    // Недоступный localStorage не должен мешать построению панели статуса.
  }
}
