(function () {
  var themes = ['shinobi', 'oto', 'akatsuki', 'green', 'kakashi'];
  var theme = localStorage.getItem('selectedTheme') || 'shinobi';

  document.documentElement.classList.remove(...themes);
  document.documentElement.classList.add(theme);
})();
