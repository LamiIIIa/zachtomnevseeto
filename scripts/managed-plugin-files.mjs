import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { pluginDefinitions, pluginContentHash } from './plugin-config.mjs'

const origin = 'https://akatsukigood.forum.cool'
const normalized = source => source.replace(/^\uFEFF/, '').replace(/\r/g, '').trim()
export async function managedFileRows(page) {
  return page.locator('#filetable tr[id]').evaluateAll(rows => rows.map(row => ({
    file: row.id,
    comment: row.querySelector('input[type="text"]')?.value || '',
    url: row.querySelector('a[href*="forumstatic.ru/files/"]')?.href || '',
    version: Number(row.querySelector('.ft-version span')?.textContent || 0),
    tags: [...row.querySelectorAll('.ft-tags span')].map(tag => tag.textContent.trim()).filter(Boolean),
  })))
}
export function choosePluginFile(plugin, rows, footer) {
  const canonical = rows.find(row => row.file === plugin.forumFile && row.comment === plugin.filename)
    || rows.find(row => row.comment === plugin.filename)
  if (canonical) return canonical
  const descriptor = [...footer.matchAll(/<script\b[^>]*data-forum-plugin="([^"]+)"[^>]*>([\s\S]*?)<\/script>/g)]
    .find(match => match[1] === plugin.id)
  if (descriptor) {
    const file = new URL(JSON.parse(descriptor[2]).src).pathname.split('/').pop()
    const row = rows.find(row => row.file === file && row.comment.startsWith(`fd-plugin-${plugin.id}-`))
    if (row) return row
  }
  throw new Error(`No existing managed file for ${plugin.filename}; refusing to create another duplicate`)
}
export async function updateManagedPlugins({ files, editor, dir, manifest, footer, saveEditor, backups }) {
  const rows = await managedFileRows(files), urls = {}, published = []
  const previousHashes = Object.fromEntries([...footer.matchAll(/<script\b[^>]*data-forum-plugin="([^"]+)"[^>]*>([\s\S]*?)<\/script>/g)].map(match => [match[1], JSON.parse(match[2]).sourceHash]))
  // Resolve all four files and read all local payloads before changing anything.
  const plans = await Promise.all(manifest.plugins.map(async plugin => ({
    plugin, row: choosePluginFile(plugin, rows, footer),
    content: await readFile(path.join(dir, plugin.file), 'utf8'),
  })))
  for (const { plugin, row, content } of plans) {
    await editor.goto(`${origin}/admin_files.php?edit&file=${encodeURIComponent(row.file)}&fd_verify=${Date.now()}`)
    const previous = await editor.locator('textarea[name="content"]').inputValue()
    if (previousHashes[plugin.id] && pluginContentHash(previous) !== previousHashes[plugin.id] && pluginContentHash(previous) !== plugin.sourceHash) {
      throw new Error(`Manual forum edit detected for ${plugin.filename}; import that update into Git before publishing, file left unchanged`)
    }
    if (normalized(previous) !== normalized(content)) {
      backups.push({ file: row.file, content: previous })
      await saveEditor(editor, 'content', content)
      await editor.goto(`${origin}/admin_files.php?edit&file=${encodeURIComponent(row.file)}&fd_verify=${Date.now()}`)
      if (normalized(await editor.locator('textarea[name="content"]').inputValue()) !== normalized(content)) throw new Error(`File verification failed: ${plugin.filename}`)
    }
    published.push({ ...row, id: plugin.id, filename: plugin.filename, tag: plugin.tag })
  }
  await files.reload()
  const current = await managedFileRows(files)
  for (const plugin of published) {
    const row = current.find(row => row.file === plugin.file)
    if (!row?.url || row.version < 1) throw new Error(`Updated file is missing: ${plugin.filename}`)
    const url = new URL(row.url)
    url.searchParams.set('v', String(row.version))
    urls[plugin.id] = url.href
  }
  const retired = current.flatMap(row => {
    const plugin = pluginDefinitions.find(plugin => row.comment.startsWith(`fd-plugin-${plugin.id}-`))
    return plugin && !published.some(active => active.file === row.file) ? [{ ...row, id: plugin.id, tag: plugin.tag }] : []
  })
  return { urls, published, retired }
}
async function setTags(page, file, expected) {
  const row = page.locator('#filetable tr[id]').filter({ has: page.locator(`input[type="checkbox"][value="${file}"]`) })
  const existing = await row.locator('.ft-tags span').allTextContents()
  const key = tag => tag.toLocaleLowerCase('ru')
  const desired = []
  for (const tag of [...existing.filter(tag => tag && !['архив', 'github'].includes(key(tag))), ...expected]) {
    if (!desired.some(value => key(value) === key(tag))) desired.push(tag)
  }
  if (desired.length > 5) throw new Error(`Too many tags on ${file}`)
  if (existing.length === desired.length && desired.every(tag => existing.some(value => key(value) === key(tag)))) return
  // Rows on other pagination pages are hidden, but their native tag editor works.
  await row.locator('a.tag-edit').dispatchEvent('click')
  const modal = page.locator('.pun-modal')
  while (await modal.locator('.tagify__tag__removeBtn').count()) await modal.locator('.tagify__tag__removeBtn').first().click()
  for (const tag of desired) {
    await modal.locator('.tagify__input').fill(tag)
    await modal.locator('.tagify__input').press('Enter')
  }
  await modal.locator('button.tags-save').click()
  await modal.waitFor({ state: 'detached' })
  const actual = await row.locator('.ft-tags span').allTextContents()
  if (!desired.every(tag => actual.some(value => key(value) === key(tag)))) throw new Error(`Tag verification failed: ${file}`)
}
export async function labelManagedPlugins(page, publication) {
  let commentsChanged = false
  for (const plugin of publication.published) {
    const input = page.locator(`input[name="comments[${plugin.file}]"]`)
    if (await input.inputValue() !== plugin.filename) { await input.fill(plugin.filename); commentsChanged = true }
    await setTags(page, plugin.file, [plugin.tag, 'GitHub'])
  }
  for (const retired of publication.retired) await setTags(page, retired.file, [retired.tag, 'Архив'])
  if (commentsChanged) {
    page.once('dialog', dialog => dialog.accept())
    await page.locator('#update_comments').click()
  }
}
export async function restoreManagedPlugins(editor, backups, saveEditor) {
  const errors = []
  for (const backup of [...backups].reverse()) {
    try {
      await editor.goto(`${origin}/admin_files.php?edit&file=${encodeURIComponent(backup.file)}&fd_verify=${Date.now()}`)
      await saveEditor(editor, 'content', backup.content)
    } catch { errors.push(backup.file) }
  }
  if (errors.length) throw new Error(`Could not restore managed plugin files: ${errors.join(', ')}`)
}
