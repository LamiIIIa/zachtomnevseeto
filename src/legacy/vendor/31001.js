/* Snapshot source: https://forumstatic.ru/files/0015/c4/3f/31001.js; source encoding: utf-8 */
/*********************************
  MyBB.ru
  Регулировка размера шрифта в постах
  Версия: V1.1.2
  Автор: Alex_63
  Дата: 24.02.2016
  Последние изменения: 27.12.2024
*********************************/

if($('.post,#messages').length)(function(){

  var sld = '<div id="fntSlider" class="FNTslider"><div class="before"></div><div class="thumb"></div></div>';
  var pstSp = $('.post:first h3 > span');
  pstSp.find('strong').length ? pstSp.find('strong').after(sld) : pstSp.append(sld);
  var sliderElem = $('#fntSlider')[0];
  var thumbElem = $('#fntSlider > .thumb')[0];
  var thumbBefor= $('#fntSlider > .before')[0];
  var slideWidth = $('#fntSlider').width();
  var p00 = parseInt($('#fntSlider').css('padding-left'));

  if(thumbElem)thumbElem.title='Размер шрифта';
  $('#fntSlider > .thumb').tipsy({fade:true,gravity:'nw'});

  var lSFont, st_Size = '';
  function setFont0(selector) {
    if (!selector) selector = '.post,#post-preview,#profile-signature,.parsedsig';
    lSFont=localStorage.getItem('FNTsize');
    st_Size = '';
    if(lSFont){lSFont=lSFont.split(',');
      var k01=lSFont[0];var k02=lSFont[1];
      if(thumbElem) thumbElem.style.left=k01+'px';
      if(thumbBefor) thumbBefor.style.width=k01+'px';
      $(selector).find('.post-content p').css('font-size',k02+'px');
      st_Size=lSFont[2];
    } else if($('.post-content').length) {
      var Fnt=$('.post-content p:first').css('font-size');
      if(Fnt){Fnt=Fnt.replace('px','');Fnt=Math.round(parseFloat(Fnt));
      st_Size=''+Fnt;Fnt-=6;Fnt=Fnt*5;
      if(thumbElem) thumbElem.style.left=Fnt+'px';
      if(thumbBefor) thumbBefor.style.width=Fnt+'px';}
    }
  }
  setFont0();
  $(document).on('pun_post pun_edit pun_preview', function(e) {
    if (e.pid) setFont0('#p' + e.pid);
    else setFont0('.post.new-ajax,#post-preview');
  });
  $(document).on('messenger:post messenger:messages_ready messenger:messages_load', function(e) {
    if (e.pid) setFont0('#p' + e.pid);
    else setFont0('.post');
  });

  function setFont(f) {
    var k00=parseInt(f/5);k00+=6;
    if(k00>30){k00=30;}
    $('.post-content p').css('font-size',k00+'px');
    localStorage.setItem('FNTsize',f+','+k00+','+st_Size.replace('px',''));
  }
  function getCoords(elem) {var b=elem.getBoundingClientRect();return{top:b.top+pageYOffset,left:b.left+pageXOffset};}
  $(thumbElem).on('mousedown touchstart',function(e) {
      var thumbCoords = getCoords(thumbElem);
      var pageX = ( e.type=='mousedown' ? e.pageX : e.originalEvent ? e.originalEvent.touches[0].pageX : e.touches[0].pageX );
      var shiftX = pageX - thumbCoords.left;

      var sliderCoords = getCoords(sliderElem);
      sliderCoords.left += p00;
      document.onmousemove = document.ontouchmove = function(e) {
        var pageX = ( e.type=='mousemove' ? e.pageX : e.originalEvent ? e.originalEvent.touches[0].pageX : e.touches[0].pageX );
        var newLeft = pageX - shiftX - sliderCoords.left;
        if (newLeft < 0) {newLeft = 0;}
        var rightEdge = slideWidth - thumbElem.offsetWidth;
        if (newLeft > rightEdge) {newLeft = rightEdge;}
        thumbElem.style.left = newLeft + 'px';
        thumbBefor.style.width=newLeft + 'px';
        setFont(newLeft);
      }
      document.onmouseup = document.ontouchend = function(){document.onmousemove=document.onmouseup=document.ontouchend=document.ontouchmove=null;};
      return false;
  });
  thumbElem.ondragstart = function() {return false;};

  sliderElem.ondblclick = function(){
    var stFnt=st_Size;//alert(stFnt);
    $('.post-content p').css('font-size',stFnt+'px');
    stFnt=parseInt(stFnt);stFnt-=6;stFnt=stFnt*5;
    localStorage.removeItem('FNTsize');
    thumbElem.style.left=stFnt+'px';//alert(Fnt);
    thumbBefor.style.width=stFnt+'px';
  };

}())
