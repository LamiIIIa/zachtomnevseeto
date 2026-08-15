import { t } from "../../i18n/index.js";

// Создаёт локализованный DOM-элемент цитаты.
export default function createQuote(translationKey) {
  // Создаём настоящий элемент вместо CSS-псевдоэлемента.
  const quote = document.createElement("span");

  // Добавляем независимый класс для будущего оформления.
  quote.classList.add("category-quote");

  // Сохраняем ключ, чтобы i18n мог обновлять текст элемента.
  quote.dataset.i18n = translationKey;

  // Устанавливаем перевод для текущего языка.
  quote.textContent = t(translationKey);

  // Возвращаем готовый элемент вызывающей странице.
  return quote;
}
