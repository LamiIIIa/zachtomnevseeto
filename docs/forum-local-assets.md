# Local forum assets and automatic publication

The production forum loads its design CSS, fonts and JavaScript from its own
`forumstatic.ru/files/001a/12/f3/` storage. GitHub Pages remains available as a
preview; production no longer depends on it.

## Build

```sh
npm ci
npm run build:local
npm run test:assets
```

`dist/forum-local/` contains a flattened CSS file, ASCII-safe JavaScript,
content-addressed WOFF2/images in `assets/`, and `manifest.json`.
External CSS imports are resolved at build time. Fonts are separate files so
the browser downloads only the faces it needs and caches them independently.
Existing images on forumstatic.ru remain on that platform. Font Awesome Free
replaces the unavailable Pro font endpoint; its license is included in its CSS.
The missing legacy `001c/6f/41/style_cs` import was removed (HTTP 404).

The download cache is local build data, never credentials. If a dependency
cannot be fetched, packaging fails before the live forum is modified.

## Initial installation

Already installed on akatsukigood.forum.cool. The first custom-style field has
a managed import between `/* forum-local:start */` and `/* forum-local:end */`;
all custom CSS follows these markers. The second field is empty.
The HTML header contains a script with `id="forum-local-loader"`, `defer`,
`charset="utf-8"`, and `data-forum-css` pointing at the uploaded CSS.
Do not remove these markers: publication refuses to replace unmarked fields.

The first HTML-header block between `forum-prepaint:start/end` is also generated
on every commit from `scripts/prepaint.mjs`. It prevents the original table DOM
from appearing while the deferred design script loads: only the content area
is covered by a lightweight local placeholder; header and navigation remain
visible. No second CSS download is added. The block is removed immediately on
`forum-design:ready`. If initialization fails, an explicit content fallback
button appears after five seconds instead of leaving an empty page.
`scripts/prepaint.test.mjs` checks delayed real JS at mobile and desktop widths,
JavaScript-disabled/admin pages, failure recovery, and idempotent publication.

## Enable publication

In this repository's **Settings → Secrets and variables → Actions**, create:

* `FORUM_USERNAME`: forum administrator username.
* `FORUM_PASSWORD`: that account's password.

Never commit passwords, cookies, login storage state, or screenshots of admin
HTML to this repository. No credentials are included in generated assets.

The `Publish local forum assets` workflow runs on every push to `main`, and can
also be started with **Run workflow**. It signs in via the standard MyBB login,
uploads missing resources, updates only the managed CSS/JS references, and
checks that the mobile page reaches `forum-design--ready`. On failure while
switching references, it restores the previous style and header.

Existing fonts are reused by content-hash filename, not uploaded on every
commit. CSS and JS versions receive immutable new file URLs. Previous versions
remain available for rollback; files are not automatically deleted.

If credentials are absent or expired, the workflow fails with a setup/login
error and leaves the current forum design in place. A CAPTCHA must be resolved
by the account owner; this publisher does not bypass it.

The uploader uses the normal MyBB admin interface because the documented MyBB
API has no file-publishing method. If MyBB changes that interface, publication
fails instead of overwriting unrelated settings.
