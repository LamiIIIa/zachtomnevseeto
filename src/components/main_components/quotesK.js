import { t } from "../../i18n/index.js";

// Создаёт локализованный DOM-элемент цитаты с нужным классом.
export default function createQuote(translationKey, quoteClass) {
  // Создаём настоящий элемент вместо CSS-псевдоэлемента.
  const quote = document.createElement("span");

  // Добавляем класс конкретного вида цитаты: категории или статистики.
  quote.classList.add(quoteClass);

  // Сохраняем ключ, чтобы i18n мог обновлять текст элемента.
  quote.dataset.i18n = translationKey;

  // Устанавливаем перевод для текущего языка.
  quote.textContent = t(translationKey);

  // Возвращаем готовый элемент вызывающей странице.
  return quote;
}
