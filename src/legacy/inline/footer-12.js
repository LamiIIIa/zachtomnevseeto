(function (){
  var a='Включить быстрый предпросмотр';
  var b='Отключить быстрый предпросмотр';
  var d='_PreviewToggle';
  setCookiePPrev=function(a,b,c){if(c){var d=new Date();d.setTime(d.getTime()+c);}if(a && b)document.cookie=a+'='+b+(c ? '; expires='+d.toUTCString() : '');else return false;}
  getCookiePPrev=function(a){var b=new RegExp(a+'=([^;]){1,}');var c=b.exec(document.cookie);if(c)c=c[0].split('=');else return false;return c[1] ? c[1] : false;}
  $('<small id="togglePreview"><input type="button" class="button" value="'+ b +'" onclick="togglePreview(this)"/></small>').insertAfter('#post fieldset:not(#post-preview):last legend');
  var x = ParseContent;
  window.togglePreview = function(sel){//alert(sel.value);
    if(sel.value==a){sel.value=b;setCookiePPrev(d,'0',-1000);ParseContent=x;ParseContent();$('#post-preview').show(); return}
    if(sel.value==b){sel.value=a;setCookiePPrev(d,'OFF',30*3600*24*30*1000);if($('#pun-viewtopic').length){$('#post-preview').hide()}ParseContent=function(){return};return}
  }; if(getCookiePPrev(d)=='OFF'){$('#togglePreview>.button').click()};
}())
