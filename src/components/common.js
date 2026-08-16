import { t } from '../i18n/index.js'
import { initMobileNavigation } from './mobile-navigation.js'

export function initCommon({ root }) {
  // Отмечаем, что новый JavaScript-дизайн запущен на текущей странице.
  document.documentElement.classList.add('forum-design-js')

  // Настраиваем общую навигацию до инициализации остальных элементов страницы.
  initAdminNavigation(root)

  // Создаём мобильную навигацию до подключения обработчиков раскрывающихся меню.
  initMobileNavigation({ root })

  // Переносим партнёрские баннеры из скрытого системного футера в видимый.
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
  const footer = root.querySelector('#pun-about .container') || root.querySelector('#pun-about')
  if (!footer || !window.matchMedia) return

  const media = window.matchMedia('(max-width: 700px)')

  document.querySelectorAll('.bannerc').forEach((banners) => {
    if (banners.dataset.forumDesignReady) return

    const placeholder = document.createComment('footer-banners-position')
    banners.before(placeholder)
    banners.dataset.forumDesignReady = 'true'
    banners.hidden = false
    banners.classList.add('footer-banners-window')

    const updatePlacement = () => {
      if (media.matches) {
        footer.prepend(banners)
        return
      }

      placeholder.after(banners)
    }

    updatePlacement()
    media.addEventListener?.('change', updatePlacement)
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
