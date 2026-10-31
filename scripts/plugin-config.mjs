import { createHash } from 'node:crypto'
export const pluginContentHash = source => createHash('sha256').update(source.replace(/^\uFEFF/, '').replace(/\r/g, '').trim()).digest('hex')

export const pluginDefinitions = [
  { id: 'shop', filename: 'akatsuki-shop.js', tag: 'Магазин', forumFile: '11008.js' },
  { id: 'battle-assistant', filename: 'mubb-battle-assistant.js', tag: 'Боевка', forumFile: '28054.js' },
  { id: 'technique-search', filename: 'mubb-technique-search.js', tag: 'Поиск_Техник', forumFile: '24002.js' },
  { id: 'npc-gallery', filename: 'akatsuki-npc-gallery.js', tag: 'Нужные', forumFile: '80230.js' },
]
