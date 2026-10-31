import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { managedFileRows, setTags } from './managed-plugin-files.mjs'
export async function auditDesignFiles(files, forms, style, source, dir) {
  await files.reload()
  const rows = await managedFileRows(files)
  const text = source + (await forms.locator('textarea').allTextContents()).join('\n') + await style.locator('textarea').allTextContents()
  const referenced = new Set([...text.matchAll(/\/files\/001a\/12\/f3\/([\w.-]+)/g)].map(match => match[1]))
  const report = []
  for (const row of rows) {
    if (!row.comment.startsWith('fd-') && !['97290.js', '50624.js', '15715.css'].includes(row.file)) continue
    if (row.comment.startsWith('fd-plugin-')) continue
    const asset = /^fd-[a-f0-9]+\./.test(row.comment)
    const kind = /\.(woff2?|ttf|otf)$/i.test(row.comment) ? 'Шрифты' : /\.css$/i.test(row.comment) ? 'Стили' : /\.js$/i.test(row.comment) ? 'Скрипты' : 'Изображения'
    const candidate = !asset && !referenced.has(row.file)
    await setTags(files, row.file, ['GitHub', 'Дизайн', kind, ...(candidate ? ['Архив'] : [])])
    report.push({ file: row.file, comment: row.comment, referenced: referenced.has(row.file), candidate })
  }
  await writeFile(path.join(dir, 'file-audit.json'), JSON.stringify(report, null, 2))
  await writeFile(path.join(dir, 'file-audit.md'), '# Проверка файлов форума\n\nКандидаты требуют проверки ссылок в сообщениях и отдельных страницах. Шрифты и изображения сохранены консервативно. Ничего не удалено.\n\n' + report.map(row => `- ${row.file}: ${row.comment} — ${row.candidate ? 'кандидат на удаление' : 'сохранить'}`).join('\n'))
  await files.reload()
  console.log('Design file audit: ' + JSON.stringify({ tagged: report.length, candidates: report.filter(row => row.candidate).map(row => row.file) }))
}
