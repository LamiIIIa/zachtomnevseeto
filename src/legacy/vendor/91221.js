/* Snapshot source: https://forumstatic.ru/files/0015/c4/3f/91221.js; source encoding: utf-8 */
/****************************************************************
* 	Сворачивание длинных цитат в постах
* 	Alex_63 03.12.2016г. / 08.04.2024г. 13:51:00
* 	v1.0.1
****************************************************************/

if($('#pun-viewtopic').length)$(document).on('pun_main_ready pun_post pun_edit',function(){

  var bgcolor = $('.quote-box:first blockquote').css('background-color');
  if(bgcolor=='transparent' || bgcolor=='rgba(0, 0, 0, 0)')bgcolor = $('.quote-box:first').css('background-color');
  var st = 'background:',st1 = 'linear-gradient(to bottom,transparent 0%,'+bgcolor+' 70%,'+bgcolor+' 100%);';
  var gradient = '<style>.quote-box .quote-after.q-resize-1{'+st+st1+st+'-moz-'+st1+st+'-webkit-'+st1+st+'-o-'+st1+st+'-khtml-'+st1+st+'-ms-'+st1+'}</style>';
  $(gradient).appendTo('head');

  $('.topic .post-content .quote-box:not(.toggle)').each(function() {
    var a = $(this),s = a.parents('.quote-box');  //alert(a.html());
    if(a.hasClass('spoiler-box') || (s.length && s.children('cite').length))return;
    if(!$(this).children('cite').length)return;
    var def_height = $(this).children('blockquote').height();
    if(def_height/parseInt($(this).css('font-size'))>=6){    $(this).addClass('toggle');
      $(this).children('blockquote').attr('data-height',def_height).css('height','6em')
      .append('<span class="quote-after q-resize-1" title="Развернуть"></span>');
    }

  });

})
.on('click', '.quote-box .quote-after',function(){
  if($(this).hasClass('q-resize-1')){
    var quote = $(this).parent('blockquote').css('height','100%');
    var def = quote.height(); quote.attr('data-height',def + 'px');
    quote.css('height','6em').animate({height:def},400);
    $(this).removeClass('q-resize-1').addClass('q-resize-2').attr('title','Свернуть');
  } else if($(this).hasClass('q-resize-2')){
    var quote = $(this).parent('blockquote');
    quote.animate({height:'6em'},400);
    $(this).removeClass('q-resize-2').addClass('q-resize-1').attr('title','Развернуть');
  }
});
