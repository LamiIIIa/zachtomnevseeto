document.addEventListener("DOMContentLoaded", function () {

  const TOPIC_ID = 86;      // ID темы новостей
  const LIMIT = 5;          // сколько постов
  const MAX_CHARS = 600;    // сколько символов показывать

  const box = document.querySelector(".nvsscroll");
  if (!box) return;

  box.textContent = "Загрузка новостей…";

  const cb = "cb_" + Math.random().toString(36).slice(2);

  window[cb] = function (data) {
    if (!data || data.error || data.code) {
      box.textContent = "Новости временно недоступны";
      return;
    }

    const posts = Array.isArray(data.response)
      ? data.response
      : data.response?.posts;

    if (!posts || !posts.length) {
      box.textContent = "Новости отсутствуют";
      return;
    }

    box.innerHTML = "";

    posts
      .sort((a, b) => b.posted - a.posted)
      .slice(0, LIMIT)
      .forEach(post => {

        const date = new Date(post.posted * 1000)
          .toLocaleDateString("ru-RU");

        let text = post.message;

        /* --- УБИРАЕМ ЦИТАТЫ И СПОЙЛЕРЫ ПОЛНОСТЬЮ --- */
        text = text
          .replace(/\[quote[\s\S]*?\[\/quote\]/gi, "")
          .replace(/<blockquote[\s\S]*?<\/blockquote>/gi, "")
          .replace(/<div class="quote-box"[\s\S]*?<\/div>/gi, "")
          .replace(/\[spoiler[\s\S]*?\[\/spoiler\]/gi, "")
          .replace(/<div class="quote-box spoiler-box"[\s\S]*?<\/div>\s*<\/div>/gi, "")
          .replace(/\[hide[\s\S]*?\[\/hide\]/gi, "")
          .replace(/<div class="hide-box"[\s\S]*?<\/div>/gi, "")
          .replace(/\[hr\]/gi, "\n\n")
.         replace(/<hr\s*\/?>/gi, "\n\n");


        /* --- НОРМАЛИЗАЦИЯ ПЕРЕНОСОВ --- */
        text = text
          .replace(/<\/p>/gi, "\n\n")
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<p[^>]*>/gi, "")
          .trim();

        if (!text) return;

        /* --- ОГРАНИЧЕНИЕ ПО СИМВОЛАМ --- */
        if (text.length > MAX_CHARS) {
          text = text.slice(0, MAX_CHARS);
          text = text.slice(0, text.lastIndexOf(" "));
          text += "…";
        }

        /* --- ВЫВОД --- */
        const dateEl = document.createElement("p");
        dateEl.textContent = date;
        box.appendChild(dateEl);

        text.split(/\n\s*\n/).forEach(p => {
          const pEl = document.createElement("p");
          pEl.innerHTML = p.replace(/\n/g, "<br>");
          box.appendChild(pEl);
        });

      });
  };

  const s = document.createElement("script");
  s.src =
    "https://akatsukigood.forum.cool/api.php" +
    "?method=post.get" +
    "&topic_id=" + TOPIC_ID +
    "&limit=" + LIMIT +
    "&sort_dir=desc" +
    "&charset=utf-8" +
    "&callback=" + cb;

  document.body.appendChild(s);
});
