var themes = ['shinobi', 'oto', 'akatsuki', 'green', 'kakashi'];

var array = [
  { class: 'shinobi', title: 'Даттебайо!' },
  { class: 'oto', title: 'Я бессмертен!' },
  { class: 'akatsuki', title: 'Познай боль!' },
  { class: 'green', title: 'Сила Юности!' },
  { class: 'kakashi', title: 'Как бы это сказать...' }
];

var switchers = '';

$.each(array, function(index, value) {
  switchers += '<li title="' + value.title + '">' +
    '<span class="radio">' +
      '<input type="radio" name="switcher" id="' + value.class + '" value="' + value.class + '">' +
      '<label for="' + value.class + '">' + value.title + '</label>' +
    '</span>' +
  '</li>';
});

$('#theme_switcher').append(switchers);

function setTheme(theme) {
  $('html').removeClass(themes.join(' ')).addClass(theme);
  localStorage.setItem('selectedTheme', theme);
  $('#theme_switcher input[value="' + theme + '"]').prop('checked', true);
}

$('#theme_switcher input').on('click', function () {
  setTheme($(this).val());
});

var currentTheme = localStorage.getItem('selectedTheme') || 'shinobi';
setTheme(currentTheme);
