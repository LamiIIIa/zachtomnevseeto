import { t } from '../i18n/index.js'

export function initCommon({ root }) {
  // Отмечаем, что новый JavaScript-дизайн запущен на текущей странице.
  document.documentElement.classList.add('forum-design-js')

  // Настраиваем общую навигацию до инициализации остальных элементов страницы.
  initAdminNavigation(root)

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
