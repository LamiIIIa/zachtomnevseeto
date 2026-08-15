# Исходное состояние тестового форума

Дата фиксации: 2026-08-14.

## Страницы

| Страница | Корень MyBB | Основные области |
| --- | --- | --- |
| Главная | `#pun-index` | `.category`, `[id^="forum_f"]`, `#pun-stats` |
| Раздел | `#pun-viewforum` | `.forum`, `.linkst`, `.linksb` |
| Тема | `#pun-viewtopic` | `.topic`, `.post`, `.post-author`, `.post-content` |
| Профиль | `#pun-profile` | `.formal`, `.id-N`, `.groupN` |
| Участники | `#pun-userlist` | `form#userlist`, `.usertable` |
| Поиск | `#pun-search` | `form#punbbsearch`, `.formal` |
| Сообщения | `#pun-messages` | `form#messages`, `.messages-container` |
| Ответ | `#pun-post` | `form#post`, `.post-box`, `.formsubmit` |
| Редактирование | `#pun-edit` | `form#post`, `.post-box`, `.formsubmit` |

Панель администрирования использует `#pun-admin_*` и не имеет класса `.punbb`; новый дизайн на неё не распространяется.

## Шапка

Шапка состоит из существующих областей MyBB:

- `#pun-title` — название и логотип;
- `#pun-navlinks` — основная навигация;
- `#pun-ulinks` — пользовательские ссылки;
- `#pun-announcement` — визуальная шапка, меню, администрация и новости;
- `#pun-status` — состояние авторизации.

Основная разметка визуальной шапки находится в поле объявления MyBB. Её стили находятся в основном собственном стиле, а не в отдельном `92410.css`.

## Зафиксированные CSS-источники

| Локальный снимок | Исходный URL |
| --- | --- |
| `legacy/styles/header-external.css` | `forumstatic.ru/files/0017/95/29/92410.css` |
| `legacy/styles/theme.css` | сгенерированный собственный стиль MyBB |
| `legacy/styles/extra.css` | `/style/extra.css` |
| `legacy/styles/mobile.css` | `/style/mobile.css` |
| `legacy/styles/admin-main.css` | поле `form[content1]` |
| `legacy/styles/admin-secondary.css` | поле `form[content2]` |

`header-external.css` исторически назван так в проекте, но фактически содержит стили системы масок профиля.

Все найденные `url(...)` перечислены в `src/legacy/styles/assets-manifest.json`. В активных копиях относительные URL преобразованы в абсолютные, чтобы сохранить изображения и шрифты после объединения CSS.

## Результат шагов 0–2

- объединённый CSS тестовой сборки: `forum.css`;
- объединённый JavaScript и модуль шапки: `forum.js`;
- шапка получает классы `.forum-header`, `.forum-header__title`, `.forum-header__navigation` и `.forum-header__status`;
- переключатель тем работает из `components/header/theme-switcher.js`;
- исходные CSS-снимки остаются неизменными в `src/legacy/styles/`;
- общие переменные находятся в `src/styles/settings/variables.css`;
- наборы цветов и изображений находятся в `src/styles/themes/`;
- все части стилей подключаются напрямую через `src/styles/main.css`;
- исходный снимок остаётся неизменным в `src/legacy/styles/theme.css`.

Проверены `#pun-index`, `#pun-viewforum` и `#pun-viewtopic`: общий CSS/JS загружается, маршрутизация и шапка инициализируются, ошибок нового пакета в консоли нет.

## Единый источник CSS

Поле `Свой стиль` на тестовом форуме сокращено до одного импорта:

```css
@import url('https://forumstatic.ru/files/001c/6f/41/32025.css?v=1');
```

Второе CSS-поле очищено, выбран режим `Да. Отключить extra.css`. Дублирующий CSS из тестового HTML удалён; тестовый JavaScript остаётся доступен администраторам.

Проверка после переключения:

- `extra.css` больше не загружается отдельно;
- объединённый `32025.css` загружается один раз;
- системный `mobile.css` продолжает подключаться движком MyBB;
- переменные темы, фон, шапка и переключатель тем работают;
- ошибок объединённого пакета в консоли нет.
