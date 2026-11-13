# Bingo origin-village filter

The public widget exposes “Деревня происхождения” with “Все деревни” as default.
It filters the record's `affiliation` against the village dictionary, independently of
listing books, listing sources and organization tags. It combines with name search,
rank and status, resets pagination to page 1 and remains selected after data refresh.

Canonical source: backend/modules/bingo/client/bingo.js and bingo.css. Build only
`node modules/bingo/build.mjs` in the backend, then copy public/modules/bingo/bingo.js
into src/plugins/bingo-book.js. Regression: backend/modules/bingo/tests/public-browser.mjs,
covering 390/800/1280 px and a listing book different from the character's origin.
