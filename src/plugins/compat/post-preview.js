/*********************************
  MyBB.ru,
  Мгновенный предпросмотр сообщения
  Версия: V1.3.3
  Автор: Alex_63
  Дата: 27.10.2015
  Последние изменения: 13.09.2016
  
  обновление от hagalnaud, 27.02.2025
  добавлено: поддержка block=class (в т.ч. "тихие" цитаты), media-спойлеров, вкладок в постах BB-кодом от kolobdur74 (https://forum.mybb.ru/viewtopic.php?id=40592#p985806)
*********************************/

//==== ФУНКЦИЯ PARSECONTENT() РАСПАРС КОНТЕНТА TEXTAREA ====//
function ParseContent (field) {
  var controller = window.forumPostPreview;
  if (controller && !controller.enabled) return;
  var editor = field && field.tagName === 'TEXTAREA' ? field : controller && controller.editor;
  if (!editor) editor = document.querySelector('#main-reply,textarea[name="req_message"]');
  if (!editor) return;

  //==== Распарс bbcode в контенте textarea ====//
  var cnt = editor.value; //alert(cnt);

  // Отключаем распознавание HTML кодов
  cnt = cnt.replace(/&/g,'&amp;');      cnt = cnt.replace(/</g,'&lt;');      cnt = cnt.replace(/>/g,'&gt;');

  // Распарс блока Код Ч1 - //Вынимаем блоки код;
  var arrCODE = [],j=0;
  function repl1 (str, p1, offset, s){arrCODE[j]=p1; return ';code-' + j++ +';'}
  cnt = cnt.replace(/\[code\]((?:[\s\S](?!\[\/{0,1}code\]))*[\s\S]{0,1})\[\/code\]/gm,repl1);

  function replTableTd(str,attr,txt,offset,s1){
     var attrArr = attr.split(/\s/gim),strS1 = '',strS2 = '';
     for(var i=0;i<attrArr.length;i++){
          var s = attrArr[i].split(/=/gim);
          if(s==''||!s[1])continue; 
          s[1] = s[1].replace(/^"/gim,'').replace(/"$/gim,'');
          if(s[0]=='width'){strS2 += s[0]+':'+s[1]+';';}
          if(s[0]=='colspan'||s[0]=='rowspan'){strS1 += ' '+s[0]+'="'+s[1]+'"';}
          if(s[0]=='bgcolor'){ strS2+='background-color:'+s[1]+';';};

     };   //console.log(attrArr);
     if(strS2!=''){strS2 = ' style="'+strS2+'"';};
     return ( '<td'+strS1+strS2+'>'+txt+'</td>' );// return L; 
  }

  // Распарс таблиц ч1
  cnt = cnt.replace(/(\[\/?(td|tr)\])(\n+)/mgi,'$1');   		cnt = cnt.replace(/\[\/table\](\n+)/mgi, '[/table]');
  cnt = cnt.replace(/\[table([\s\S]*?)\](\n+)/mgi, '[table$1]');	cnt = cnt.replace(/\[td([\s\S]*?)\]([\s\S]*?)\[\/td\]/mgi,replTableTd);
  cnt = cnt.replace(/\[td\]([\s\S]*?)\[\/td\]/mgi,'<td>$1</td>');	cnt = cnt.replace(/\[tr\]([\s\S]*?)\[\/tr\]/mgi,'<tr>$1</tr>');


  // Парсим переносы строк
  cnt = ('<p>'+cnt+'</p>').replace(/\n\n/g,'<\/p><p>').replace(/\n/g,'<br>');

  var RXquoteP   = /\[quote="#p(.*?),(.*?)"\](.*?)\[\/quote\]/gi, RXquoteL = /\[quote="(.*?),http:\/\/(.*?)"\](.*?)\[\/quote\]/gi;
  var RXquoteQ   = /\[quote="(.*?)"\](.*?)\[\/quote\]/gi,         RXquote  = /\[quote=(.*?)\](.*?)\[\/quote\]/gi, RXquote0   = /\[quote\](.*?)\[\/quote\]/gi;
  var BBquoteP   = '</p><div class="quote-box"><cite><a href=/viewtopic.php?pid=$1#p=$1>$2 '+PPREV.quote_cite+'</a></cite><blockquote><p>$3</p></blockquote></div><p>';
  var BBquoteL   = '</p><div class="quote-box"><cite><a href=\"http://$2\">$1 '+PPREV.quote_cite+'</a></cite><blockquote><p>$3</p></blockquote></div><p>';
  var BBquote0   = '</p><div class="quote-box"><blockquote><p>$1</p></blockquote></div><p>';
  var BBquote    = '</p><div class="quote-box"><cite>$1 '+PPREV.quote_cite+'</cite><blockquote><p>$2</p></blockquote></div><p>';
  var BBhidText  = '</p><div class="quote-box"><cite>Скрытый текст:</cite><blockquote><p>$2</p></blockquote></div><p>'; var spLlIn='$(this).toggleClass(\'visible\'); $(this).next().toggleClass(\'visible\');';
  var BBspoiler0 = '</p><div class="quote-box spoiler-box"><div onclick="'+ spLlIn +'">Свернутый текст</div><blockquote><p>$1</p></blockquote></div><p>';
  var BBspoiler  = '</p><div class="quote-box spoiler-box"><div onclick="'+ spLlIn +'">$1</div><blockquote><p>$2</p></blockquote></div><p>';
  var BBblock0 = '</p><div class="$1">$2</div><p>';
  var BBblock  = '</p><div class="$1">$2</div><p>';

  // Парсим BB коды
  cnt = cnt.replace(/\[b\](.*?)\[\/b\]/gi,'<strong>$1</strong>');		        cnt = cnt.replace(/\[i\](.*?)\[\/i\]/gi,'<span style="font-style:italic">$1</span>');
  cnt = cnt.replace(/\[u\](.*?)\[\/u\]/gi,'<em class="bbuline">$1</em>');	        cnt = cnt.replace(/\[s\](.*?)\[\/s\]/gi,'<del>$1</del>');
  cnt = cnt.replace(/\[h\](.*?)\[\/h\]/gi,'<span class="highlight-text">$1</span>');    cnt = cnt.replace(/\[hr\]/g,'<hr>');
  cnt = cnt.replace(/\[sup\](.*?)\[\/sup\]/gi,'<sup>$1</sup>');				cnt = cnt.replace(/\[sub\](.*?)\[\/sub\]/gi,'<sub>$1</sub>');
  cnt = cnt.replace(/\[you\]/g,UserLogin);

  var j=0;if(typeof(QuoteImg)=='undefined'){while(j<4){cnt = cnt.replace(RXquoteP,BBquoteP);j++};j=0;while(j<4){cnt = cnt.replace(RXquoteL,BBquoteL);j++}}
  j=0;while(j<4){cnt = cnt.replace(RXquoteQ,BBquote);j++};j=0;while(j<4){cnt = cnt.replace(RXquote,BBquote);j++};j=0;while(j<4){cnt = cnt.replace(RXquote0,BBquote0);j++}
  cnt = cnt.replace(/\[hide=(.*?)\](.*?)\[\/hide\]/gi,BBhidText);
  cnt = cnt.replace(/\[spoiler="(.*?)"\](.*?)\[\/spoiler\]/gi,BBspoiler);    		cnt = cnt.replace(/\[spoiler="(.*?)"\](.*?)\[\/spoiler\]/gi,BBspoiler);
  cnt = cnt.replace(/\[spoiler=(.*?)\](.*?)\[\/spoiler\]/gi,BBspoiler);    		cnt = cnt.replace(/\[spoiler\](.*?)\[\/spoiler\]/gi,BBspoiler0);
  cnt = cnt.replace(/\[font=(.*?)\](.*?)\[\/font\]/gi,'<span style="font-family: $1;">$2</span>');
  cnt = cnt.replace(/\[size=(.*?)\](.*?)\[\/size\]/gi,'<span style="font-size: $1px;">$2</span>');
  cnt = cnt.replace(/\[color=(.*?)\](.*?)\[\/color\]/gi,'<span style="color: $1">$2</span>');
  cnt = cnt.replace(/\[block="(.*?)"\](.*?)\[\/block\]/gi,BBblock);    		cnt = cnt.replace(/\[block="(.*?)"\](.*?)\[\/block\]/gi,BBspoiler);
  cnt = cnt.replace(/\[block=(.*?)\](.*?)\[\/block\]/gi,BBblock);    		cnt = cnt.replace(/\[block\](.*?)\[\/block\]/gi,BBblock0);
  cnt = cnt.replace(/\[align=(.*?)\](.*?)\[\/align\]/gi,'<span style="display: block; text-align: $1">$2</span>');
  cnt = cnt.replace(/\[img\](.*?)\[\/img\]/gi,'<img src="$1" class="postimg" />');
  cnt = cnt.replace(/\[img=(.*?)\](.*?)\[\/img\]/gi,'<img src="$2" class="postimg" title="$1" alt="$1" />');
  cnt = cnt.replace(/\[url=(.*?)\](.*?)\[\/url\]/gi,'<a href="$1">$2</a>');
  cnt = cnt.replace(/\[url\](.*?)\[\/url\]/gi,'<a href="$1">$1</a>');
  cnt = cnt.replace(/\[video\](.*?)\[\/video\]/gi,'<iframe width="480" height="284" src="$1" frameborder="0" allowfullscreen=""></iframe>');

  // Распарс остальных BBКодов
  cnt = cnt.replace(/\[abbr="(.*?)"\](.*?)\[\/abbr\]/gi,'<abbr title="$1">$2</abbr>');
  cnt = cnt.replace(/\[add\]/g,'<strong>Добавлено спустя</strong>');
  cnt = cnt.replace(/\[mark\](.*?)\[\/mark\]/gi,'<span class="highlight-text">$1</span>');

  // Распарс таблиц ч2
  function replTable(str,attr,txt,s){attr=attr.replace(/layout/g,'table-layout').replace(/=/g,':').replace(/^\s/,'').replace(/\s/gm,';');return '<table style="'+attr+'">'+txt+'</table>'}
  cnt = cnt.replace(/\[table(.*?)\](.*?)\[\/table\]/mgi,replTable);

  // Распарс Смайлов
  var SmileObj = FORUM.get('editor.smile.smilies');
  var SmileDir = FORUM.get('editor.smile.dir');
  for (var s in SmileObj) {
       var reg = new RegExp('\\s'+s.replace(/([\'\-\^\|\(\)])/g,'\\$1')+'\\s','gm');
       cnt = cnt.replace(reg,' <img src="'+SmileDir+'/'+SmileObj[s]+'" alt="'+s+'"> ');
  };

  // Парсим пробелы
  cnt = cnt.replace(/  /g,'&nbsp; ');

  // Распарс блока Код Ч2, - Возвращаем блоки код
  var st  = '</p><div class="code-box"><strong class="legend">Код:</strong><div class="blockcode"><div class="scrollbox" style="min-height:4.5em"><pre>';
  var end = '</pre></div></div></div><p>';
  function repl2 (str, p1, offset, s) {return st + arrCODE[+p1] + end;}
  if(arrCODE.length)cnt = cnt.replace(/;code-(\d+);/gm,repl2);

  // Поправка переносов строк
  cnt = cnt.replace(/<blockquote><br>/g,'<blockquote>');	cnt = cnt.replace(/<pre><br>/g,'<pre>');
  cnt = cnt.replace(/<\/div><p><br>/g,'<\/div><p>');		cnt = cnt.replace(/<p><\/p><div/g,'<div');
  cnt = cnt.replace(/<\/div><p><\/p><p>/g,'<\/div><p>');	cnt = cnt.replace(/<p><br>/g,'<p>');
  cnt = cnt.replace(/<hr><br><br>/g,'<hr>');			cnt = cnt.replace(/<hr><br>/g,'<hr>');

  // Обработка [media]
  cnt = cnt.replace(/\[media="([^"]*)"\](.*?)\[\/media\]/gi, function(match, title, content) {
    return `
<div class="quote-box spoiler-box media-box">
  <div onclick="toggleSpoiler(this);">${title}</div>
  <blockquote>
    <p>${content}</p>
  </blockquote>
</div>`;
  });

  // Обработка [wrap]
  cnt = cnt.replace(/\[wrap\](.*?)\[\/wrap\]/gs, function(match, content) {
    let wrapperHTML = '<div class="wrapper">';

    // Разделяем внутренний контент на секции
    let verh = '', levo = '', pravo = '', niz = '', contentw = '';
    content = content.replace(/\[verh\](.*?)\[\/verh\]/gs, function(m, v) { return (verh = processSection(v)); });
    content = content.replace(/\[levo\](.*?)\[\/levo\]/gs, function(m, v) { return (levo = processSection(v)); });
    content = content.replace(/\[pravo\](.*?)\[\/pravo\]/gs, function(m, v) { return (pravo = processSection(v)); });
    content = content.replace(/\[niz\](.*?)\[\/niz\]/gs, function(m, v) { return (niz = processSection(v)); });
    content = content.replace(/\[contentw\](.*?)\[\/contentw\]/gs, function(m, c) { return (contentw = processContent(c)); });

    // Генерация HTML для секций
    wrapperHTML += generateSection('buttop buttons', verh);
    wrapperHTML += generateSection('butleft buttons', levo);
    wrapperHTML += generateSection('butright buttons', pravo);
    wrapperHTML += generateSection('butbottom buttons', niz);

    // Генерация содержимого
    wrapperHTML += '<div class="windows">' + contentw + '</div>';

    wrapperHTML += '</div>';
    return wrapperHTML;
});

// Функция для обработки секций вкладок
function processSection(content) {
    return content
        .replace(/\[avkladka=(\d+)\](.*?)\[\/avkladka\]/g, '<div class="vkladka activevkladka" data-number="$1">$2</div>')
        .replace(/\[vkladka=(\d+)\](.*?)\[\/vkladka\]/g, '<div class="vkladka" data-number="$1">$2</div>');
}

// Функция для обработки содержимого
function processContent(content) {
    return content
        .replace(/\[acont=(\d+)\](.*?)\[\/acont\]/g, '<div class="window activevkladka" data-content="$1">$2</div>')
        .replace(/\[cont=(\d+)\](.*?)\[\/cont\]/g, '<div class="window" data-content="$1">$2</div>');
}

// Функция для генерации секций вкладок
function generateSection(className, content) {
    if (!content.trim()) return ''; // Если секция пустая, ничего не добавляем
    return `<div class="${className}">${content}</div>`;
}

  // Добавляем обработку кликов для вкладок
  $('#post-preview').off('click.forumPreviewTabs', '.vkladka').on('click.forumPreviewTabs', '.vkladka', function(event) {
      event.preventDefault();
      const id = $(this).attr('data-number');   
      $(this).closest(".wrapper").find(".vkladka, .window").removeClass("activevkladka");    
      $(this).closest(".wrapper").find(`.vkladka[data-number='${id}'], .window[data-content='${id}']`).addClass("activevkladka");
  });

  //==== Скрываем/показываем предпросмотр при вводе====//
  if(cnt === '' && $('#post-preview').css('display') != 'none')		{ $('#post-preview').css({'display':'none'}); } 
  if(cnt != '' && $('#post-preview').css('display') == 'none')		{ $('#post-preview').css({'display':'block'});}
  if(cnt === '' && $('#post-preview').css('display') == 'none')         { $('#post-preview').css({'display':'none'}); }
  if(cnt === '<p></p>' && $('#post-preview').css('display') == 'none')  { $('#post-preview').css({'display':'none'}); }
  if(cnt === '<p></p>' && $('#post-preview').css('display') != 'none')  { $('#post-preview').css({'display':'none'}); }
  $('#post-preview').find('.post-content').html(cnt);
  $('#post-preview').find('.post-box').each(function(){
    $(this).html($(this).html().replace('<\/div><p><\/p></div>','</div></div>'));
    $(this).html($(this).html().replace('<\/div><p><\/p><p><\/p></div>','</div></div>'));
  });
  if(typeof(QuoteImg)!='undefined' &&!$('#pun-messages').length){   
    $('.punbb').prepend('<style id="Hide_qCite">#post-preview .quote-box>cite{visibility:hidden!important;}</style>');
    setLinkAndAva('#post-preview'); 
  }
  window.HTMLinPost && HTMLinPost.parseTags('#post-preview');

}//Конец Функции

// Dynamic edit forms are inserted after startup and may live inside a .post.
(function () {
  if (window.forumPostPreview) return;
  var timer, lastEditor, lastValue;
  var selector = '#main-reply,textarea[name="req_message"]';
  var labels = ['Включить быстрый предпросмотр','Отключить быстрый предпросмотр'];
  var state = {editor:null,enabled:!/(?:^|;\s*)_PreviewToggle=OFF(?:;|$)/.test(document.cookie),refresh:refresh};
  window.forumPostPreview = state;
  function isEditor(node) {
    return node && node.matches && node.matches(selector) && !node.closest('#hv_preview_form,#post-preview');
  }
  function findEditor() {
    if (isEditor(document.activeElement)) return document.activeElement;
    var editing = document.querySelector('.post textarea[name="req_message"],.post #main-reply');
    if (isEditor(editing)) return editing;
    if (state.editor && state.editor.isConnected) return state.editor;
    return Array.from(document.querySelectorAll(selector)).find(isEditor);
  }
  function buttonState() {
    document.querySelectorAll('#togglePreview').forEach(function (toggle) {
      toggle.dataset.previewState = state.enabled ? 'on' : 'off';
      var button = toggle.querySelector('input,button');
      if (!button) return;
      var label = labels[state.enabled ? 1 : 0];
      if (button.tagName === 'INPUT') button.value = label; else button.textContent = label;
      button.title = label; button.setAttribute('aria-label',label);
      button.setAttribute('aria-pressed',String(state.enabled));
    });
  }
  function mount(editor) {
    var form = editor.form;
    if (!form) return null;
    var preview = document.getElementById('post-preview');
    if (!preview) {
      preview = document.createElement('fieldset'); preview.id = 'post-preview';
      preview.innerHTML = '<legend><span>Предварительный просмотр сообщения</span></legend><div class="fs-box"><div class="post-box"><div class="post-content"></div></div></div>';
    }
    if (!form.contains(preview)) {
      var fieldset = editor.closest('fieldset'), target = fieldset || editor;
      var secondColumn = form.querySelector('#PFld2');
      if (secondColumn && Number(PPREV.position) === 2) secondColumn.appendChild(preview);
      else if (Number(PPREV.position) === 0) target.parentNode.insertBefore(preview,target);
      else target.parentNode.insertBefore(preview,target.nextSibling);
    }
    if (!form.querySelector('#togglePreview')) {
      var toggle = document.createElement('small'); toggle.id = 'togglePreview';
      toggle.innerHTML = '<input type="button" class="button">';
      var legend = editor.closest('fieldset')?.querySelector(':scope > legend');
      if (legend) legend.insertAdjacentElement('afterend',toggle);
      else editor.parentNode.insertBefore(toggle,editor);
    }
    buttonState();
    return preview;
  }
  function refresh(field,force) {
    var editor = isEditor(field) ? field : findEditor();
    if (!editor) return;
    state.editor = editor;
    var preview = mount(editor);
    if (!preview) return;
    if (!state.enabled) { preview.style.setProperty('display','none','important'); return; }
    preview.style.removeProperty('display');
    if (!force && lastEditor === editor && lastValue === editor.value) return;
    lastEditor = editor; lastValue = editor.value;
    ParseContent(editor);
  }
  function schedule(editor) {
    clearTimeout(timer); timer = setTimeout(function () { refresh(editor); },40);
  }
  window.togglePreview = function (button) {
    var form = button && button.closest('form');
    var editor = form && Array.from(form.querySelectorAll(selector)).find(isEditor);
    state.enabled = !state.enabled;
    document.cookie = '_PreviewToggle='+(state.enabled?'ON':'OFF')+'; path=/; SameSite=Lax; max-age=2592000';
    buttonState(); refresh(editor,true);
  };
  document.addEventListener('click',function (event) {
    if (event.target.closest('#togglePreview input,#togglePreview button')) {
      event.preventDefault(); event.stopImmediatePropagation(); window.togglePreview(event.target); return;
    }
    if (event.target.closest('#form-buttons,.pl-quote,.pl-BBquote,.pa-author>a,div[id$="-area"],#Bubble')) schedule();
  },true);
  document.addEventListener('input',function (event) { if (isEditor(event.target)) schedule(event.target); },true);
  document.addEventListener('change',function (event) { if (isEditor(event.target)) schedule(event.target); },true);
  document.addEventListener('focusin',function (event) { if (isEditor(event.target)) refresh(event.target); },true);
  $(document).on('pun_preedit.forumPreview pun_edit.forumPreview pun_post.forumPreview',function () { schedule(); });
  new MutationObserver(function (mutations) {
    if (mutations.some(function (mutation) { return Array.from(mutation.addedNodes).some(function (node) {
      return node.nodeType === 1 && (isEditor(node) || node.querySelector(selector));
    }) })) schedule();
  }).observe(document.body,{childList:true,subtree:true});
  document.head.insertAdjacentHTML('beforeend','<style>#post-preview .code-box pre{max-height:13em}</style>');
  refresh(null,true);
})();
