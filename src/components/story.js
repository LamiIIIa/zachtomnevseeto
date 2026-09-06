function initStory() {
  const story = document.getElementById('story')

  if (!story || story.dataset.storyInitialized === 'true') return

  story.dataset.storyInitialized = 'true'

  const tabs = story.querySelectorAll('.story-tab')
  const panels = story.querySelectorAll('.story-panel')

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetId = tab.dataset.target

      panels.forEach((panel) => {
        panel.hidden = panel.id !== targetId
      })

      tabs.forEach((button) => {
        const isActive = button === tab
        button.classList.toggle('is-active', isActive)
        button.setAttribute('aria-pressed', String(isActive))
      })
    })
  })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initStory, { once: true })
} else {
  initStory()
}
