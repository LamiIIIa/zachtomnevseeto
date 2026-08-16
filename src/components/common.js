import { t } from '../i18n/index.js'
import { initMobileNavigation } from './mobile-navigation.js'

export function initCommon({ root }) {
  // Отмечаем, что новый JavaScript-дизайн запущен на текущей странице.
  document.documentElement.classList.add('forum-design-js')

  // Настраиваем общую навигацию до инициализации остальных элементов страницы.
  initAdminNavigation(root)

  // Создаём мобильную навигацию до подключения обработчиков раскрывающихся меню.
  initMobileNavigation({ root })

  // Сворачиваем партнёрские баннеры в футере под отдельную кнопку.
  initFooterBanners(root)

  // Находим все кнопки, которые открывают и закрывают связанные меню.
  root.querySelectorAll('[data-menu-toggle]').forEach((button) => {
    // Получаем меню по идентификатору из aria-controls кнопки.
    const menu = document.getElementById(button.getAttribute('aria-controls'))

    // Пропускаем кнопку, если связанное меню отсутствует в DOM.
    if (!menu) return

    // Переключаем состояние меню при нажатии на кнопку.
    button.addEventListener('click', () => {
      const isOpen = button.getAttribute('aria-expanded') === 'true'
      button.setAttribute('aria-expanded', String(!isOpen))
      menu.hidden = isOpen
    })
  })
}

function initFooterBanners(root) {
  root.querySelectorAll('.bannerc').forEach((banners, index) => {
    if (banners.dataset.forumDesignReady) return

    const id = banners.id || `footer-banners-${index + 1}`
    banners.id = id
    banners.hidden = true
    banners.dataset.forumDesignReady = 'true'

    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'footer-banners-toggle'
    button.setAttribute('aria-controls', id)
    button.setAttribute('aria-expanded', 'false')
    button.dataset.i18n = 'footer.banners'
    button.textContent = t('footer.banners')

    button.addEventListener('click', () => {
      const isOpen = button.getAttribute('aria-expanded') === 'true'
      button.setAttribute('aria-expanded', String(!isOpen))
      banners.hidden = isOpen
    })

    banners.before(button)
  })
}

// Изменяет название ссылки администрирования на всех страницах форума.
function initAdminNavigation(root) {
  // Находим span внутри ссылки администрирования в основной навигации.
  const adminNavLabel = root.querySelector('#navadmin a > span')

  // У гостей и обычных пользователей этой ссылки нет, поэтому завершаем функцию.
  if (!adminNavLabel) return

  // Храним ключ отдельно, чтобы не повторять строку в двух следующих операциях.
  const translationKey = 'navigation.adminNav'

  // Позволяем общей системе i18n обновлять элемент при смене языка.
  adminNavLabel.dataset.i18n = translationKey

  // Сразу устанавливаем перевод для текущего языка.
  adminNavLabel.textContent = t(translationKey)
}
