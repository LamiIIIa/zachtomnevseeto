const PAGE_ROOT_SELECTOR = [
  '#pun > .punbb[id^="pun-"]',
  '#pun .punbb[id^="pun-"]',
  '.punbb[id^="pun-"]',
  '#pun > .punbb',
  '#pun .punbb',
].join(', ')

export function getPageContext() {
  const root = document.querySelector(PAGE_ROOT_SELECTOR)
  if (!root) return null

  return {
    root,
    main: root.querySelector('#pun-main'),
    page: root.id.replace(/^pun-/, '') || 'unknown',
    forumId: getNumericParam('id', /^\/viewforum\.php$/),
    topicId: getNumericParam('id', /^\/viewtopic\.php$/),
    userId: getNumericParam('id', /^\/profile\.php$/),
  }
}

function getNumericParam(name, pathnamePattern) {
  if (!pathnamePattern.test(window.location.pathname)) return null
  const value = Number.parseInt(new URLSearchParams(window.location.search).get(name), 10)
  return Number.isNaN(value) ? null : value
}
