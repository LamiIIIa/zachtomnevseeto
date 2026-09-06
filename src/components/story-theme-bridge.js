const STORY_FRAME_ORIGIN = 'https://forumscripts.ru'
const THEME_REQUEST = 'story:theme-request'
const THEME_UPDATE = 'story:theme-update'
const THEME_PROPERTIES = [
  '--color-forum',
  '--color-link',
  '--color-lnthoverbg',
  '--font-1',
]

export function initStoryThemeBridge() {
  if (document.documentElement.dataset.storyThemeBridgeReady) return

  document.documentElement.dataset.storyThemeBridgeReady = 'true'

  window.addEventListener('message', (event) => {
    if (event.origin !== STORY_FRAME_ORIGIN) return
    if (event.data?.type !== THEME_REQUEST) return
    if (!isHtmlPostFrame(event.source)) return

    sendTheme(event.source)
  })

  const themeObserver = new MutationObserver(broadcastTheme)
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
}

function isHtmlPostFrame(source) {
  return [...document.querySelectorAll('iframe.html_frame')].some(
    (frame) => frame.contentWindow === source,
  )
}

function broadcastTheme() {
  document.querySelectorAll('iframe.html_frame').forEach((frame) => {
    sendTheme(frame.contentWindow)
  })
}

function sendTheme(target) {
  if (!target) return

  const rootStyle = getComputedStyle(document.documentElement)
  const properties = Object.fromEntries(
    THEME_PROPERTIES.map((property) => [
      property,
      rootStyle.getPropertyValue(property).trim(),
    ]).filter(([, value]) => value),
  )

  target.postMessage({ type: THEME_UPDATE, properties }, STORY_FRAME_ORIGIN)
}
