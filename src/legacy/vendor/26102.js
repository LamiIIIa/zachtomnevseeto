/* Snapshot source: https://forumstatic.ru/files/0015/c4/3f/26102.js; source encoding: utf-8 */
/* Выделение кода в блоках [code], новая версия, 29.04.2017 © Alex_63 / updated 08.08.2020 © */
/* адаптировано под ajax отправку, мессенджер и визуальный редактор 28.12.2024 */

function select_text(c) {
  var d = window.getSelection || document.getSelection;
  if (d) {
    var a = d();
    if (a.selectAllChildren) {
      a.selectAllChildren(c);
    } else if (a.setBaseAndExtent) {
      a.setBaseAndExtent(c, 0, c, c.innerText.length - 1)
    } else {
      var b = document.createRange();
      b.selectNodeContents(c);
      a.removeAllRanges();
      a.addRange(b)
    }
  } else if (document.selection) {
    var b = document.body.createTextRange();
    b.moveToElementText(c);
    b.select()
  }
}
select_text.defaultText = {ru: 'Выделить код', en: 'Select code'}[$(document.documentElement).attr('lang')];
select_text.init = function() {
  select_text.legend = '<a href="javascript://" onclick="select_text($(this).parent().next().find(\'pre\').get(0));return!1">'
    + (select_text.linkText || select_text.defaultText) + '</a>';
  $('.code-box .legend:not(.legend-processed)').html(select_text.legend).addClass('legend-processed');
}
$(document).on('pun_post pun_edit pun_preview messenger:post messenger:messages_ready messenger:messages_load WYSI_init WYSI_insert', select_text.init)
.pun_mainReady(select_text.init);
$('.punbb').on('click', '.spoiler-box > div', function() {
  $(this).next('blockquote').find('.code-box .legend:not(.legend-processed)').html(select_text.legend).addClass('legend-processed');
})
