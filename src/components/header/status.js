import { t } from '../../i18n/index.js'

// Страница VIP объясняет способы улучшения аккаунта и поддержки фонда форума.
const SUPPORT_FORUM_URL = '/vip.php'

// Системный аватар используется, пока настоящий аватар загружается из профиля.
const DEFAULT_AVATAR_URL = '/img/avatars/default.png'

// Перестраивает стандартную строку статуса MyBB для авторизованного пользователя.
export function initUserStatus(root) {
  // Находим исходные элементы статуса и ссылку на профиль текущего пользователя.
  const container = root.querySelector('#pun-status .container')
  const profileLink = root.querySelector('#navprofile a[href*="profile.php"]')

  // У гостя нет ссылки на профиль, поэтому его стандартный статус не меняем.
  if (!container || !profileLink || container.dataset.statusLayout === 'ready') return

  // MyBB уже создал приветствие, последний визит и ссылку улучшения аккаунта.
  const greeting = container.querySelector(':scope > .item1')
  const lastVisit = container.querySelector(':scope > .item2')
  const premiumAction = container.querySelector(':scope > .status-right')

  // Не перестраиваем неизвестный вариант разметки, чтобы не потерять его содержимое.
  if (!greeting || !premiumAction) return

  // Создаём левую область с аватаром и двумя строками пользовательских данных.
  const userBlock = document.createElement('span')
  const userText = document.createElement('span')
  const avatar = createStatusAvatar(root, profileLink)

  userBlock.classList.add('status-user')
  userText.classList.add('status-user__text')
  greeting.classList.add('status-user__line', 'status-user__greeting')
  lastVisit?.classList.add('status-user__line', 'status-user__last-visit')

  // Сохраняем оригинальные тексты MyBB и только переносим их в новую структуру.
  userText.append(greeting)
  if (lastVisit) userText.append(lastVisit)
  userBlock.append(avatar, userText)

  // Создаём правую колонку действий.
  const actions = document.createElement('span')
  const supportLink = document.createElement('a')

  actions.classList.add('status-actions')
  premiumAction.classList.add('status-action', 'status-action--premium')

  // Новая ссылка локализуется общей системой i18n.
  supportLink.classList.add('status-action', 'status-action--support')
  supportLink.href = SUPPORT_FORUM_URL
  supportLink.dataset.i18n = 'status.supportForum'
  supportLink.textContent = t('status.supportForum')

  actions.append(premiumAction, supportLink)

  // Заменяем только содержимое строки, не удаляя системный контейнер MyBB.
  container.replaceChildren(userBlock, actions)
  container.classList.add('status-layout')
  container.dataset.statusLayout = 'ready'
}

// Создаёт аватар текущего пользователя из уже загруженных данных или профиля.
function createStatusAvatar(root, profileLink) {
  const profileId = getProfileId(profileLink.href)

  // На главной аватар часто уже присутствует в данных последнего сообщения.
  const existingAvatar = Array.from(root.querySelectorAll('.user-avatar')).find(
    (avatar) => getProfileId(avatar.querySelector('a')?.href) === profileId,
  )

  if (existingAvatar) {
    // Клонируем элемент, чтобы не забирать аватар из карточки форума.
    const avatar = existingAvatar.cloneNode(true)
    avatar.classList.add('status-user__avatar')
    return avatar
  }

  // Если готового элемента нет, сразу показываем системный аватар-заглушку.
  const avatar = document.createElement('span')
  const link = document.createElement('a')
  const image = document.createElement('span')

  avatar.classList.add('user-avatar', 'status-user__avatar')
  link.href = profileLink.href
  image.classList.add('avatar-image')
  image.style.backgroundImage = `url(${JSON.stringify(DEFAULT_AVATAR_URL)})`
  link.append(image)
  avatar.append(link)

  // Настоящий аватар подставится после фоновой загрузки страницы профиля.
  void loadProfileAvatar(profileLink.href, image)

  return avatar
}

// Возвращает числовой id из стандартной ссылки MyBB profile.php?id=N.
function getProfileId(href) {
  if (!href) return null

  try {
    return new URL(href, window.location.href).searchParams.get('id')
  } catch {
    return null
  }
}

// Загружает аватар из профиля, когда на текущей странице его ещё нет.
async function loadProfileAvatar(profileUrl, image) {
  try {
    const response = await fetch(profileUrl, { credentials: 'same-origin' })
    if (!response.ok) return

    const profileHtml = await response.text()
    const profileDocument = new DOMParser().parseFromString(profileHtml, 'text/html')
    const profileImage = profileDocument.querySelector('#pa-avatar img')
    const source = profileImage?.getAttribute('src')

    if (!source) return

    const avatarUrl = new URL(source, profileUrl).href
    image.style.backgroundImage = `url(${JSON.stringify(avatarUrl)})`
  } catch {
    // При сетевой ошибке остаётся системный аватар-заглушка.
  }
}
