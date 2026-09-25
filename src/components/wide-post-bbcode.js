const POST_CONTENT_SELECTOR = '.post-content'
const POST_SELECTOR = '.post'
const WIDE_POST_CLASS = 'post--wide'
const PARSED_MARKER_SELECTOR = '.custom_tag_widepost, [data-bbcode="widepost"]'
const LITERAL_TAG_PATTERN = /\[\/?widepost\]/gi
const IGNORED_CONTENT_SELECTOR = 'blockquote, pre, code, textarea, script, style, .quote-box, .code-box'

export function initWidePostBbcode(root) {
  if (!root || root.dataset.widePostBbcodeReady) return

  root.dataset.widePostBbcodeReady = 'true'
  processWidePostTags(root)

  // Обрабатываем новые сообщения, которые MyBB добавляет без перезагрузки страницы.
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof Element) processWidePostTags(node)
      })
    })
  })

  observer.observe(root, { childList: true, subtree: true })
}

function processWidePostTags(scope) {
  const postContents = collectPostContents(scope)
  postContents.forEach(markWidePost)
}

function collectPostContents(scope) {
  const postContents = []

  if (scope.matches?.(POST_CONTENT_SELECTOR)) postContents.push(scope)
  postContents.push(...scope.querySelectorAll(POST_CONTENT_SELECTOR))

  return postContents
}

function markWidePost(postContent) {
  let hasMarker = unwrapParsedMarkers(postContent)
  const walker = document.createTreeWalker(postContent, NodeFilter.SHOW_TEXT)
  const textNodes = []

  while (walker.nextNode()) textNodes.push(walker.currentNode)

  textNodes.forEach((textNode) => {
    if (textNode.parentElement?.closest(IGNORED_CONTENT_SELECTOR)) return

    const updatedText = textNode.data.replace(LITERAL_TAG_PATTERN, '')
    if (updatedText === textNode.data) return

    textNode.data = updatedText
    hasMarker = true
  })

  if (!hasMarker) return
  postContent.closest(POST_SELECTOR)?.classList.add(WIDE_POST_CLASS)
}

function unwrapParsedMarkers(postContent) {
  const markers = postContent.querySelectorAll(PARSED_MARKER_SELECTOR)

  markers.forEach((marker) => {
    marker.replaceWith(...marker.childNodes)
  })

  return markers.length > 0
}
