export function query(selector, root = document) {
  return root.querySelector(selector)
}

export function queryAll(selector, root = document) {
  return [...root.querySelectorAll(selector)]
}
