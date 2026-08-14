/* Snapshot source: https://forumstatic.ru/files/001c/6f/41/17655.js?v=18; source encoding: windows-1251 */
/***********************************************************
  MyBB.ru — Аватар и ник в цитате (FIX под IM / AJAX)
***********************************************************/

(function(){

function setLinkAndAva(sel){

    var arr = [];
    if(!sel){sel = '.post';}
    if($('#pun-post,#pun-edit').length && typeof(PPREV)=='undefined'){
        sel = '#post-preview,.post';
    }
    if($('#pun-delete').length){
        sel = '.container .fs-box';
    }

    // === Сбор PID и UID ===
    $(sel).find('.quote-box').each(function(){
        var cite = $(this).find('>cite');
        if(!cite.length) return;

        var L = $.trim(cite.text());
        if(!/^\d+,\d+$/.test(L)) return;

        var pid = L.split(',')[0];
        var uid = L.split(',')[1];

        $(this).attr('id','u'+uid);
        cite.attr('id','p'+pid);

        arr.push(uid);
    });

    if(!arr.length){
        $('#Hide_qCite').remove();
        return;
    }

    // === Подстановка ника и аватара ===
    function parseQuote(user_id, ava, username){

        if(!username) return;

        // аватар: если имя файла — приводим к пути
        if(ava && ava.indexOf('/') === -1){
            ava = '/img/avatars/' + ava;
        }
        if(!ava){
            ava = '/img/avatars/default.png';
        }

        var htmlAva =
            '<span class="author-avatar">' +
            '<img src="'+ava+'" alt="'+username+'" title="'+username+'">' +
            '</span>';

        var htmlName =
            '<span class="qcn">Сообщение от</span> ' +
            '<span class="qc-uname">'+username+'</span> ' +
            '<span class="qc-post-link">';

        $('.quote-box#u'+user_id).each(function(){
            var cite = $(this).find('>cite');
            var pid = cite.attr('id').replace('p','');

            var href = $('#p'+pid+'.post').length
                ? '#p'+pid
                : '/viewtopic.php?pid='+pid+'#p'+pid;

            cite.html(
                htmlAva +
                htmlName +
                '<a href="'+href+'">' +
                '<img src="'+QuoteImg+'" title="Перейти к сообщению">' +
                '</a></span>'
            );

            $(this).addClass('with-avatar');
        });
    }

    // === API ===
    $.get('/api.php',{
        method: 'users.get',
        user_id: arr.join(','),
        fields: 'user_id,username,avatar'
    }, function(data){

        $('#Hide_qCite').remove();

        if(!data || !data.response || !data.response.users) return;

        var users = data.response.users;
        for(var i=0;i<users.length;i++){
            var u = users[i];
            parseQuote(u.user_id, u.avatar, u.username);
        }
    }, 'json');
}

// === Скрываем cite ДО подстановки ===
if($('#pun-viewtopic').length){
    if(!$('#Hide_qCite').length){
        $('head').append(
            '<style id="Hide_qCite">.quote-box>cite{display:none!important}</style>'
        );
    }
}

// === АВТОВЫЗОВ (ГЛАВНОЕ) ===
$(document).on(
    'DOMContentLoaded pun_post ajaxComplete',
    function(){
        setLinkAndAva();
    }
);

})();

