# MyBB forum design

Проект собирает один JavaScript-файл и один CSS-файл для существующей разметки MyBB. HTML-страницы здесь не создаются: тестовым стендом служит `https://zachtomnewseeto.mybb.ru/`.

## Команды

```bash
npm run build
npm run build:watch
```

Результат в `dist/`: `forum.js`, `forum.css` и импортированные ресурсы в `assets/`.

## Подключение к тестовому стилю MyBB

1. Загрузить файлы из `dist/` в **Администрирование → Файлы**.
2. Открыть **Администрирование → Формы → Основные**.
3. В **HTML верх для тестового стиля** добавить:

```html
<link rel="stylesheet" href="URL_ЗАГРУЖЕННОГО_FORUM_CSS">
```

4. В **HTML низ для тестового стиля** добавить:

```html
<script src="URL_ЗАГРУЖЕННОГО_FORUM_JS"></script>
```

Поля основного стиля не менять до переноса дизайна на рабочий форум.

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

## Старые скрипты форума

Администраторские скрипты сохранены в `src/legacy/`:

- `inline/` — код из HTML-полей MyBB, разложенный по месту и порядку выполнения;
- `vendor/` — локальные снимки подключённых внешних `.js`-файлов;
- `external-scripts.json` — исходные URL и порядок подключений.

Они пока не импортируются в `main.js`. На тестовом форуме продолжает работать исходное подключение, поэтому автоматическое включение копий вызвало бы двойные обработчики и дублирование интерфейса. План переноса и расшифровка файлов находятся в `src/legacy/README.md`.
