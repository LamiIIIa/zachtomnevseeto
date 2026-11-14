import { patchTestStyle } from './test-forum-style.mjs'
import assert from 'node:assert/strict'
import test from 'node:test'
import postcss from 'postcss'
test('first installation and migration keep local import before rules and preserve custom CSS',()=>{
 const local='https://forumstatic.ru/files/test.css'
 for(const original of ['@import url("https://lamiiiia.github.io/zachtomnevseeto/forum.css?v=old");\nbody{color:red}', 'body{color:red}\n/* forum-local:start */\n@import url("old.css");\n/* forum-local:end */', '@charset "utf-8";\nbody{color:red}']){
  const patched=patchTestStyle(original,local),root=postcss.parse(patched)
  const importIndex=root.nodes.findIndex(n=>n.type==='atrule'&&n.name==='import')
  assert(importIndex<root.nodes.findIndex(n=>n.type==='rule'))
  assert(!patched.includes('github.io'));assert(patched.includes('body{color:red}'))
  assert.equal(patchTestStyle(patched,local),patched)
  assert.equal(root.nodes.filter(n=>n.type==='atrule'&&n.name==='import').length,1)
 }
})
