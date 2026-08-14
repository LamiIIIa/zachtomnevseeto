var DefAvtr = 'https://forumstatic.ru/files/001a/12/f3/25830.jpg'; //Ссылка на аватар по умолчанию

DefAvtr='<li class="pa-avatar item2"><img class="defavtr" src="'+DefAvtr+'" alt="Аватар"/></li>';
$('#pun-viewtopic .pa-title').each(function(){if($(this).parent().find('.pa-avatar').html()==null)$(this).after(DefAvtr);});
