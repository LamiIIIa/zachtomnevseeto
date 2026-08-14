/* Snapshot source: https://forumstatic.ru/f/ru/bestbb/realtime.disable.js; source encoding: utf-8 */
realtime._disabledKey = 'realtime.disabled';
realtime._disabledText = {
    enable: 'Включить автообновление',
    disable: 'Отключить автообновление'
}

realtime.disable = function() {
    this.enabled = false;
    clearTimeout(this._timer);
    localStorage.setItem(this._disabledKey, 1);
    $setCookie(this._disabledKey, 1, 365*24*3600);
    $('#realtime-toggle a').text(realtime._disabledText.enable);
}
realtime.enable = function() {
    localStorage.removeItem(this._disabledKey);
    $deleteCookie(this._disabledKey);
    location.reload();
}


$('#pun-viewtopic,#pun-searchtopics').find('.linksb').after('<div id="realtime-toggle" style="text-align:right"><a href="javascript://"></a></div>');

if (localStorage.getItem(realtime._disabledKey) || $getCookie(realtime._disabledKey)) {
    realtime.enabled = false;
    $('#realtime-toggle a').text(realtime._disabledText.enable);
} else {
    $('#realtime-toggle a').text(realtime._disabledText.disable);
}

$(document).on('click', '#realtime-toggle a', function(e) {
    e.preventDefault();
    if ($(this).text() == realtime._disabledText.enable)
        realtime.enable();
    else
        realtime.disable();
})
