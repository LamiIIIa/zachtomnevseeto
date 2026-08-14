/* Snapshot source: https://forumstatic.ru/files/0015/c4/3f/77306.js; source encoding: utf-8 */
/***********************************************************
                        MyBB.ru
      Аватарка в цитате V.2 (Ч.1 в начало HTML верх)
           Автор: Alex_63  |  Версия: V2.1.8
       Создан: 01.02.2016  |  Изменен 05.04.2024
***********************************************************/


//====   function setLinkAndAva()    ====//
function setLinkAndAva(sel){

    var arr = [];
    var Ltest=false;
    if(!sel){sel = '.post';}
    if($('#pun-post,#pun-edit').length && typeof(PPREV)=='undefined')sel = '#post-preview,.post';
    if($('#pun-delete').length)sel = '.container .fs-box';
    var stAva = 'http://forum.mybb.ru/files/0000/14/1c/20038.jpg';

    $(sel).find('.quote-box').each(function (){
      var L=$(this).find('>cite').text(); 
      if(L=='HTML+ написал(а):'||L=='HTML написал(а):')return;
      if(L.search(/^Скрытый\sтекст/)!=-1)return;
      if(L){L=L.split(' написал')[0];}
      if(L.search(/^(\d+)\,(\d+)$/g)==-1){return;}
      var St = L.replace(/^(\d+)\,(\d+)$/g,'$1');
      var End= L.replace(/^(\d+)\,(\d+)$/g,'$2');
      $(this).attr('id','u'+End);
      $(this).find('>cite').attr('id','p'+St); 
      arr.push(End);
    });

    arr = arr.join(',');//alert('UserID > ' +arr);
    if(arr.length < 1){ Ltest = true;}

    $(sel).find('.quote-box:not([id]):not(.with-avatar)').each(function(){
      if(!$(this).find('>cite').length){return;}
      if($(this).find('>cite').text()=='HTML+ написал(а):'||$(this).find('>cite').text()=='HTML написал(а):')return;
      if($(this).find('>cite').text().search(/^Скрытый\sтекст/)!=-1)return;
      var cT = $(this).find('>cite').text();
      if(cT.indexOf('http://')!=-1){
        var autq = cT.replace(/^(.*?)\,http\:\/\/(.*?)\sнаписал.*$/mgi,'$1');
        var Lnkq = cT.replace(/^(.*?)\,http\:\/\/(.*?)\sнаписал.*$/mgi,'http://$2');
        if(Lnkq.indexOf('|')!=-1){Lnkq = Lnkq.replace(/\|(.*?)$/mgi,'');}
        var avaq = cT.replace(/^(.*?)\,http\:\/\/(.*?)\|(.*?)\sнаписал.*$/mgi,'$3');
        if(avaq==cT){avaq='';}if(avaq){avaq='/img/avatars/'+avaq;}var img=QuoteImg;if(!avaq){avaq=stAva;}
        var a = '<span class="author-avatar"><img src="'+ avaq +'" alt="'+ autq +'" title="'+ autq +'"/></span>';
        var S = '<span class="qcn">Сообщение от</span>&nbsp;<span class="qc-uname">'+ autq +'</span>&nbsp;<span class="qc-post-link">';
        var E = '<img src="'+ img +'" title="Перейти к сообщению"/></a></span>';
        $(this).children('cite').html(a+S+'<a class="qc-post-link" href="'+Lnkq+'">'+E);
        $(this).addClass('with-avatar');
      } else if(cT.indexOf('#p')!=-1){
        var autq = cT.replace(/^#p(\d+)\,(.*?)\sнаписал.*$/mgi,'$2');
        if(autq.indexOf('|')!=-1){autq=autq.replace(/\|(.*?)$/mgi,'');}
        var Lnkq = cT.replace(/^#p(\d+)\,(.*?)\sнаписал.*$/mgi,'#p$1');
        if(!$(Lnkq+'.post').length){ Lnkq='/viewtopic.php?pid='+Lnkq.split('#p')[1]+Lnkq;}
        var avaq = cT.replace(/^#p(\d+)\,(.*?)\|(.*?)\sнаписал.*$/mgi,'$3');
        if(avaq==cT){avaq='';}if(avaq){avaq='/img/avatars/'+avaq;}var img=QuoteImg;if(!avaq){avaq=stAva;}
        var a = '<span class="author-avatar"><img src="'+ avaq +'" alt="'+ autq +'" title="'+ autq +'"/></span>';
        var S = '<span class="qcn">Сообщение от</span>&nbsp;<span class="qc-uname">'+ autq +'</span>&nbsp;<span class="qc-post-link">';
        var E = '<img src="'+ img +'" title="Перейти к сообщению"/></a></span>';
        $(this).children('cite').html(a+S+'<a class="qc-post-link" href="'+Lnkq+'">'+E);
        $(this).addClass('with-avatar');
      } else {
        var autq = cT.replace(/^(.*?)\sнаписал.*$/mgi,'$1');
        var avaq=stAva; if(autq.match(/,undefined$/))autq = 'Гость';
        var a = '<span class="author-avatar"><img src="'+ avaq +'" alt="'+ autq +'" title="'+ autq +'"/></span>';
        var S = '<span class="qcn">Сообщение от</span>&nbsp;<span class="qc-uname">'+ autq +'</span>';
        $(this).children('cite').html(a+S);$(this).addClass('with-avatar');
        if($('#pun-messages').length){$(this).removeClass('with-avatar');$(this).find('.author-avatar').remove();}
      }
    });

    if(Ltest){$('style#Hide_qCite').remove();return;}

    function parseQuote(user_id,ava,username,img){
        if(ava == ''){ava = stAva;}
        var a = '<span class="author-avatar"><img src="'+ ava +'" alt="'+ username +'" title="'+ username +'"/></span>';
        var S = '<span class="qcn">Сообщение от</span>&nbsp;<span class="qc-uname">'+ username +'</span>&nbsp;<span class="qc-post-link">';
        var E = '<img src="'+ img +'" title="Перейти к сообщению"/></a></span>';
        $(sel).find('.quote-box[id="u'+ user_id +'"]').each(function(){
          var C = $(this).find('>cite');
          var id= C.attr('id');
          if(id){id=id.split('p')[1];}
          var href = '/viewtopic.php?pid='+id+'#p'+id;
          if($('#p'+id+'.post').length){href = '#p'+id;}
          C.html(a+S+'<a class="qc-post-link" href="'+href+'">'+E);
          C.parent().addClass('with-avatar');
        });
    }

    function getAPIdata(dataObj){
        $.get('/api.php',dataObj,function(data){
          $('style#Hide_qCite').remove();
          var obj = data.response.users;
          var ObjData={};
          for(var i in obj){
            var v = obj[i];
            var img=QuoteImg;
            var ava = v.avatar;
            parseQuote(v.user_id,ava,v.username,img);
            ObjData[''+v.user_id] = v.username+'|-|'+ava;
          }
          sessionStorage.setItem('UserAVA',JSON.stringify(ObjData));
        },'json');
    }


    var dataObj ={method: 'users.get', user_id: ''+arr, fields: 'user_id,username,avatar'};

    if(sel == '#post-preview' && sessionStorage.getItem('UserAVA')){
      var obj_ = sessionStorage.getItem('UserAVA');
      obj_ = JSON.parse(obj_);
      for(var j in obj_){var uID=j;var SS=obj_[j].split('|-|');var uNick=SS[0];var ava=SS[1];
        parseQuote(uID,ava,uNick,QuoteImg);
        if($(sel).find('.quote-box:not(.with-avatar)').length){getAPIdata(dataObj);}
        else {$('style#Hide_qCite').remove();return false;}
      }
    }

    getAPIdata(dataObj);

}
//==== End/ -  setLinkAndAva()        ====//


if($('#pun-viewtopic').length){

  document.write('<style id="Hide_qCite">.quote-box > cite{display:none!important;}</style>');

  //==== Обработка кнопки "Цитировать" ====//
  $(document).on('DOMContentLoaded pun_post', function(){

    $('.post[id]').each(function(){
      var _quote = $(this).find('.pl-quote > a');
      if (_quote.hasClass('with-ava')) return;
      var id=$(this).attr('id'),tst = false; if(id)id = id.split('p')[1];
      var user =  $(this).find('.pl-email a[href*="profile."]').attr('href');
      if(user ){user = user.split('id=')[1];}else{tst = true;user = $(this).find('.pa-author').clone();user.find('.acchide').remove();user = user.text()}
      var qLnk = _quote.attr('href'); if(tst)id = '#p'+ id;
      qLnk = qLnk.replace(/quote\(\'(.*?)\',\s(\d+)\)/mgi,'quote(\''+id+','+user+'\', $2)');
      $(this).find('.pl-quote > a').attr('href',qLnk).addClass('with-ava');
    });

  });
  //=End/ Обработка кнопки "Цитировать"====//

}
