export function initCommon({ root }) {
  document.documentElement.classList.add('forum-design-js')

  root.querySelectorAll('[data-menu-toggle]').forEach((button) => {
    const menu = document.getElementById(button.getAttribute('aria-controls'))
    if (!menu) return

    button.addEventListener('click', () => {
      const isOpen = button.getAttribute('aria-expanded') === 'true'
      button.setAttribute('aria-expanded', String(!isOpen))
      menu.hidden = isOpen
    })
  })
}
