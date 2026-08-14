function disabled_profile(g_id) {
 $('input').show();
 if( GroupID == g_id )
 {
  $('input[type=submit]').attr('disabled', true);
  var text = $('.formsubmit').html().replace(/После обновления профиля, вы будете перенаправлены назад на эту страницу./, "<span style='color: red;'>Администратор форума запретил Вам изменять профиль.</span>");
  $('.formsubmit').html(text);
 }
}
 
if (document.URL.indexOf("profile.php") != -1)
disabled_profile("6");
