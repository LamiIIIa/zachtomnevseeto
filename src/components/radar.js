import { forumConfig } from '../config/forum.js'
import { t } from '../i18n/index.js'

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'
const RAW_RADAR_PATTERN = /\[radar=([0-9\s,.;-]+)\]|\[radar\]([0-9\s,.;-]+)\[\/radar\]/gi

export function initRadars(root) {
  if (!root) return

  processRadarContent(root)

  if (root.dataset.radarObserverReady) return
  root.dataset.radarObserverReady = 'true'

  const observer = new MutationObserver((mutations) => {
    mutations.forEach(({ addedNodes }) => {
      addedNodes.forEach((node) => {
        if (node instanceof Element) processRadarContent(node)
      })
    })
  })

  observer.observe(root, { childList: true, subtree: true })
}

function processRadarContent(root) {
  const postContents = []

  if (root instanceof Element && root.matches('.post-content')) postContents.push(root)
  postContents.push(...root.querySelectorAll('.post-content'))

  postContents.forEach(replaceRawRadarCodes)

  const wrappers = []
  if (root instanceof Element && root.matches('.radar-wrapper[data-stats]')) wrappers.push(root)
  wrappers.push(...root.querySelectorAll('.radar-wrapper[data-stats]'))
  wrappers.forEach(renderRadar)
}

function replaceRawRadarCodes(postContent) {
  const walker = document.createTreeWalker(postContent, NodeFilter.SHOW_TEXT)
  const textNodes = []

  while (walker.nextNode()) {
    const textNode = walker.currentNode
    const parent = textNode.parentElement

    if (!parent || parent.closest('.radar-wrapper, script, style, textarea, code, pre')) continue
    RAW_RADAR_PATTERN.lastIndex = 0
    if (RAW_RADAR_PATTERN.test(textNode.data)) textNodes.push(textNode)
  }

  textNodes.forEach(replaceRadarTextNode)
}

function replaceRadarTextNode(textNode) {
  const fragment = document.createDocumentFragment()
  const source = textNode.data
  let lastIndex = 0

  RAW_RADAR_PATTERN.lastIndex = 0
  for (const match of source.matchAll(RAW_RADAR_PATTERN)) {
    fragment.append(source.slice(lastIndex, match.index))

    const wrapper = document.createElement('div')
    wrapper.className = 'radar-wrapper'
    wrapper.dataset.stats = match[1] || match[2]
    fragment.append(wrapper)
    lastIndex = match.index + match[0].length
  }

  fragment.append(source.slice(lastIndex))
  textNode.replaceWith(fragment)
}

function renderRadar(wrapper) {
  if (wrapper.dataset.radarReady) return

  const values = parseRadarValues(wrapper.dataset.stats)
  if (values.length < 3) {
    wrapper.dataset.radarReady = 'invalid'
    wrapper.textContent = t('radar.invalid')
    return
  }

  const labels = getRadarLabels(values.length)
  const { size, radius, rings, maxValue } = forumConfig.radar
  const center = size / 2
  const chart = document.createElement('div')
  const svg = createSvgElement('svg', {
    viewBox: `0 0 ${size} ${size}`,
    role: 'img',
    'aria-label': t('radar.summary', {
      values: labels.map((label, index) => `${label}: ${values[index]}`).join(', '),
    }),
  })

  chart.className = 'radar'
  svg.classList.add('radar-chart')

  for (let ring = 1; ring <= rings; ring += 1) {
    svg.append(
      createSvgElement('polygon', {
        class: 'radar-circle',
        points: createPolygonPoints(values.length, center, (radius * ring) / rings),
      }),
    )
  }

  values.forEach((_, index) => {
    const point = getPoint(index, values.length, center, radius)
    svg.append(
      createSvgElement('line', {
        class: 'radar-line',
        x1: center,
        y1: center,
        x2: point.x,
        y2: point.y,
      }),
    )
  })

  labels.forEach((label, index) => {
    const point = getPoint(index, labels.length, center, radius + 25)
    const text = createSvgElement('text', {
      class: 'radar-label',
      x: point.x,
      y: point.y,
    })

    text.textContent = label
    svg.append(text)
  })

  const valuePoints = values
    .map((value, index) => {
      const valueRadius = radius * (value / maxValue)
      const point = getPoint(index, values.length, center, valueRadius)
      return `${point.x},${point.y}`
    })
    .join(' ')

  svg.append(createSvgElement('polygon', { class: 'radar-area', points: valuePoints }))
  chart.append(svg)
  wrapper.replaceChildren(chart)
  wrapper.dataset.radarReady = 'true'
}

function parseRadarValues(serializedValues = '') {
  return String(serializedValues)
    .split(/[\s,;.]+/)
    .filter(Boolean)
    .map((value) => Number(value))
    .filter(Number.isFinite)
    .slice(0, 10)
    .map((value) => Math.min(forumConfig.radar.maxValue, Math.max(0, value)))
}

function getRadarLabels(count) {
  const labels = t('radar.labels', { returnObjects: true })
  const normalizedLabels = Array.isArray(labels) ? labels : []

  return Array.from({ length: count }, (_, index) => normalizedLabels[index] || String(index + 1))
}

function createPolygonPoints(count, center, radius) {
  return Array.from({ length: count }, (_, index) => {
    const point = getPoint(index, count, center, radius)
    return `${point.x},${point.y}`
  }).join(' ')
}

function getPoint(index, count, center, radius) {
  const angle = (Math.PI * 2 * index) / count - Math.PI / 2
  return {
    x: center + radius * Math.cos(angle),
    y: center + radius * Math.sin(angle),
  }
}

function createSvgElement(tagName, attributes) {
  const element = document.createElementNS(SVG_NAMESPACE, tagName)

  Object.entries(attributes).forEach(([name, value]) => {
    element.setAttribute(name, String(value))
  })

  return element
}
