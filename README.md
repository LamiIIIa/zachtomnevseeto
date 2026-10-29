# MyBB forum design

Проект собирает один JavaScript-файл и один CSS-файл для существующей разметки MyBB. HTML-страницы здесь не создаются: тестовым стендом служит `https://zachtomnewseeto.mybb.ru/`.

## Команды

```bash
npm run build
npm run build:watch
```

Результат в `dist/`: `forum.js`, `forum.css` и импортированные ресурсы в `assets/`.

## Подключение к MyBB

`forum.css` подключается первым `@import` в окне стиля MyBB. Это сохраняет
оформление админки и страниц перенаправления, где HTML-верх не выводится.

`forum.js` сам проверяет CSS-маркер перед преобразованием DOM. Если импорт не
сработал, он один раз пробует прямой резервный `link`, а при повторной ошибке
оставляет исходную разметку MyBB нетронутой. Актуальная схема подключения
описана в разделе [HTML-верх](docs/mybb-integration.md#html-верх).

## Маршрутизация

| Корень MyBB | Модуль |
| --- | --- |
| `#pun-index` | `pages/forum-index.js` |
| `#pun-viewforum` | `pages/forum-view.js` |
| `#pun-viewtopic` | `pages/topic-view.js` |
| `#pun-profile` | `pages/profile.js` |
| `#pun-userlist` | `pages/user-list.js` |
| `#pun-search` | `pages/search.js` |
| `#pun-messages` | `pages/messages.js` |
| `#pun-post`, `#pun-edit` | `pages/post-editor.js` |
| `#pun-login`, `#pun-register` | `pages/auth.js` |

Неизвестная страница получает общую инициализацию. Админка не имеет корня `.punbb` и намеренно исключена из дизайна.

## Локализация

Локализация построена на `i18next`. Доступны русский (`ru`) и английский (`en`), выбранный язык сохраняется в `localStorage` под ключом `forumLanguage`.

Для перевода текста добавьте ключ в `src/i18n/locales/ru.js` и `src/i18n/locales/en.js`, затем пометьте существующий DOM-элемент:

```html
<span data-i18n="language.label"></span>
```

Перевод атрибутов задается списком `атрибут:ключ`, разделенным точкой с запятой:

```html
<button data-i18n="actions.save" data-i18n-attr="title:actions.save;aria-label:actions.save"></button>
```

Параметры интерполяции можно передать JSON-объектом в `data-i18n-options`. Для старых скриптов доступен глобальный API `window.ForumI18n` с методами `t`, `changeLanguage`, `getLanguage` и `translateDom`.
