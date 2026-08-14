var get = (function(a) {
    if (a == "") return {};
    var b = {};
    for (var i = 0; i < a.length; ++i)
    {
        var p=a[i].split('=');
        if (p.length != 2) continue;
        b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
    }
    return b;
})(window.location.search.substr(1).split('&'));
var text = localStorage.getItem('topic'+get['id']);
if(text) {
  $('#post textarea#main-reply').val(text);
}
$('#post textarea#main-reply').bind('keydown keypress keyup', function(e){
  var text = $(this).val();
  localStorage.setItem('topic'+get['id'], text);
});
$('#post').submit(function() {
  localStorage.removeItem('topic'+get['id']);
});
