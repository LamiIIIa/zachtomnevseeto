document.addEventListener("DOMContentLoaded", function () {

  // вероятность показа на странице
  const chance = 0.5;

  if (Math.random() > chance) return;

  // задержка перед появлением
  const delay = 500;

  // список картинок
  const pics = [
    "https://forumstatic.ru/files/001c/6f/41/97635.png",
    "https://forumstatic.ru/files/001c/6f/41/33579.png",
    "https://forumstatic.ru/files/001c/6f/41/45115.png",
    "https://forumstatic.ru/files/001c/6f/41/88122.png",
    "https://forumstatic.ru/files/001c/6f/41/92331.png",
    "https://forumstatic.ru/files/001c/6f/41/18075.png",
    "https://forumstatic.ru/files/001c/6f/41/20851.png",
    "https://forumstatic.ru/files/001c/6f/41/44836.png"
  ];

  // берём предыдущую картинку из памяти
  let prev = localStorage.getItem("mb_last_pic");

  // фильтр чтобы не повторялась
  let available = pics.filter(p => p !== prev);

  if (available.length === 0) available = pics;

  const pic = available[Math.floor(Math.random() * available.length)];

  // сохраняем текущую
  localStorage.setItem("mb_last_pic", pic);

  setTimeout(function(){

    const box = document.createElement("div");
    box.id = "mb-soft-popup";

    const img = document.createElement("img");
    img.src = pic;

    const close = document.createElement("div");
    close.innerHTML = "✕";

    close.onclick = () => {
      box.style.transform = "translateY(120%)";
      setTimeout(()=>box.remove(),400);
    };

    box.appendChild(img);
    box.appendChild(close);

    document.body.appendChild(box);

    // запуск анимации
    requestAnimationFrame(()=>{
      box.classList.add("mb-show");
    });

  }, delay);

});
