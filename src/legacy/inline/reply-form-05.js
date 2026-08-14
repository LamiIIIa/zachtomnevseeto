if ((form = document.getElementById("form-buttons"))) {
    var buttonCell = form.getElementsByTagName("tr")[0].insertCell(20);
    buttonCell.id = "button-dice";
    buttonCell.title = "Кубики";
    buttonCell.innerHTML =
      '<img onclick="dice();" src="http://forumstatic.ru/files/001a/12/f3/38524.svg" style="max-width:30%">';
  }
