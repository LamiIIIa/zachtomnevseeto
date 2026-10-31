import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { pluginDefinitions } from './plugin-config.mjs'
const repo = fileURLToPath(new URL('../', import.meta.url))
const workspace = path.resolve(process.argv[2] || path.join(repo, '..'))
// Run the relevant module's existing build first; import only these four files.
const sources = await Promise.all(pluginDefinitions.map(async plugin => ({ plugin, source: await readFile(path.join(workspace, plugin.filename), 'utf8') })))
for (const { plugin, source } of sources) {
  await writeFile(path.join(repo, 'src/plugins', plugin.filename), source.replace(/^\uFEFF/, '').replace(/\r/g, ''))
  console.log(`Imported ${plugin.filename}`)
}
