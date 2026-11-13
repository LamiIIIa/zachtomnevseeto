// Keep the manager's global events bootstrap and its existing execution order.
export function patchManagerScript(footer, url, sourceHash) {
  if (!url || !sourceHash) throw new Error('Missing character manager payload')
  let found = false
  const result = footer.replace(/<!--[\s\S]*?-->|<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (whole, attrs) => {
    if (whole.startsWith('<!--')) return whole
    const src = attrs.match(/\bsrc=["']([^"']+)["']/i)
    if (!src || !/\/files\/001a\/12\/f3\/45688\.js(?:[?#]|$)/.test(src[1])) return whole
    if (found) return ''
    found = true
    attrs = attrs.replace(/\s*data-character-manager-hash=["'][^"']*["']/gi, '')
    attrs = attrs.replace(/\bsrc=["'][^"']+["']/i, `src="${url}"`)
    return `<script${attrs} data-character-manager-hash="${sourceHash}"></script>`
  })
  if (!found) throw new Error('Existing character manager connection 45688.js not found; footer left unchanged')
  return result
}
