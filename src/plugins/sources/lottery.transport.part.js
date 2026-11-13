  async function forumPage(url) {
    const u = new URL(url, location.href);
    if (u.origin !== location.origin) throw Error('Неожиданный адрес форума.');
    const controller = new AbortController(), timer = setTimeout(()=>controller.abort(),18000);
    try {
      const response = await fetch(u.href, {credentials:'same-origin',cache:'no-store',signal:controller.signal});
      if (!response.ok) throw Error('Форум вернул HTTP ' + response.status);
      const charset = /charset\s*=\s*["']?([^;\s"']+)/i.exec(response.headers.get('content-type') || '');
      const html = new TextDecoder(charset ? charset[1] : document.characterSet || 'windows-1251').decode(await response.arrayBuffer());
      return new DOMParser().parseFromString(html,'text/html');
    } finally { clearTimeout(timer); }
  }
  function readPosts(doc) {
    const rows = [];
    doc.querySelectorAll('.post[id^="p"]').forEach(post => {
      const pid = /^p(\d+)$/.exec(post.id), link = post.querySelector('.pa-author a[href*="profile.php?id="], .post-author a[href*="profile.php?id="], .pl-profile a[href*="profile.php?id="], .post-links a[href*="profile.php?id="]');
      const uid = post.getAttribute('data-user-id') || (link && /[?&]id=(\d+)/.exec(link.getAttribute('href') || '') || [])[1];
      const node = post.querySelector('.post-content');
      if (!pid || !node) return;
      const clone = node.cloneNode(true);
      clone.querySelectorAll('blockquote,.quote-box,.spoiler-box .quote-box,script,style,#lottery-d100').forEach(n => n.remove());
      clone.querySelectorAll('br').forEach(n=>n.replaceWith('\n'));
      clone.querySelectorAll('p,pre').forEach(n=>n.appendChild(doc.createTextNode('\n')));
      if(!uid){if(clone.textContent.includes('LOTTERY361:'))throw Error('Не удалось определить ID автора результата в сообщении #'+pid[1]+'.');return;}
      const author=post.querySelector('.pa-author');
      rows.push(...extract(clone.textContent,uid,pid[1],author?.textContent||link?.textContent));
    });
    return rows;
  }
  async function forumHistory() {
    const queue=[1], visited=new Set(), rows=[];
    while(queue.length) {
      const p=queue.shift(); if(visited.has(p)) continue;
      visited.add(p); if(visited.size>200) throw Error('История слишком велика. Нужна архивная версия квеста.');
      const doc=await forumPage('/viewtopic.php?id='+TOPIC+'&p='+p+'&lottery_history='+Date.now());
      if(!doc.querySelector('.post[id^="p"] .post-content')) throw Error('Тема 361 недоступна. Войдите на форум и проверьте права доступа.');
      rows.push(...readPosts(doc));
      doc.querySelectorAll('.pagelink a[href],.pagination a[href]').forEach(a=>{
        const u=new URL(a.getAttribute('href'),location.href), n=Number(u.searchParams.get('p')||1);
        if(u.origin===location.origin&&u.pathname==='/viewtopic.php'&&u.searchParams.get('id')===String(TOPIC)&&Number.isInteger(n)&&n>0&&!visited.has(n)&&!queue.includes(n))queue.push(n);
      });
    }
    return rows;
  }
  function forumIdentity() {
    const n=Number(global.UserID||global.uid||0);
    if(Number.isSafeInteger(n)&&n>0) return String(n);
    const link=document.querySelector('#navprofile a[href*="profile.php?id="],#pun-status a[href*="profile.php?id="]');
    return (link && /[?&]id=(\d+)/.exec(link.getAttribute('href')||'') || [])[1] || '';
  }
