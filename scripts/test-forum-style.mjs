export function patchTestStyle(source, cssUrl){
 const rest=source.replace(/\/\* forum-local:start \*\/[\s\S]*?\/\* forum-local:end \*\//g,'').replace(/@import\s+(?:url\(\s*)?["']?https?:\/\/lamiiiia\.github\.io\/zachtomnevseeto\/forum\.css[^;]*;/gi,'').trim()
 const charset=/^@charset\s+[^;]+;\s*/i.exec(rest)?.[0]||''
 return charset+`/* forum-local:start */\n@import url("${cssUrl}");\n/* forum-local:end */\n`+rest.slice(charset.length)
}
