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
The manifest also lists four named plugin payloads from `src/plugins/`, updated
in place on the forum with its native file version. They are not imported by the design bundle.
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
on every commit from `scripts/prepaint.mjs`. On the forum index it decorates the
native rows with the final card classes as HTML is parsed. Actual content is
visible without waiting for forum.js, DOMContentLoaded, images, or fonts. It
keeps the table cells intact for forum plugins; the full initializer later
converts them to articles without duplicating cards. The small structural CSS
uses the same classes and theme variables as the built design. No second CSS
download is added. Old `forum-early-render-style` fallback rules are removed by
the publisher to prevent conflicting table display rules.
All pages show their content immediately. The inline helper never hides the
main content and never adds a loading placeholder, timer, or fallback button.
Index cards are decorated progressively as their rows arrive.
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

## Optional plugins after the first paint

The HTML footer is patched only for these four known plugins. Their previous
blocking script elements become inert JSON descriptors, preserving data
attributes (including the technique search bridge settings). Existing inline
configuration and unrelated HTML/scripts are preserved. A managed
`forum-background:start/end` block is regenerated on each push, just like the
header's first-paint block. Failed deployment restores the previous footer too.

| Source | Plugin | Loading rule |
|---|---|---|
| `src/plugins/akatsuki-shop.js` (previously 11008.js) | Shop | Only `/viewtopic.php?id=202`, preserving post 2235 configuration |
| `src/plugins/mubb-technique-search.js` (previously 24002.js) | Technique search | Only pages with a reply form, groups 1/2/5 |
| `src/plugins/mubb-battle-assistant.js` (previously 28054.js) | Battle assistant | Only pages with a reply form, groups 1/2/5 |
| `src/plugins/akatsuki-npc-gallery.js` (previously 80230.js) | NPC gallery | Pages containing the forum 8 gallery target |

Groups were verified in the forum administration: 1 Administrators,
2 Moderators, 5 Players. Admin configuration pages do not load these tools.
This client-side loading rule does not replace the forum API's permissions.

The loader waits for both `forum-design:ready` (or its root class) and window
load, then allows two animation frames and an idle callback before fetching
optional scripts. The technique search and battle assistant are fetched only
when an actual reply/edit textarea exists, for groups 1/2/5. They retain their
original buttons inside that reply form. There are no global launchers or
buttons above the page. A late-inserted reply form triggers background loading
once it appears. There are no exceptions that load editor tools without a
reply form, including hidden frames.
Plugin data is fetched when the tool is opened, as in the original implementation.

The shop no longer imports the complete design from GitHub a second time.
The gallery still reads topic 214 and retains its cache, weighted rotation,
navigation and links. It initializes its data when within 200px of the viewport;
images load only near the visible horizontal gallery window. `warmImages()`
and its all-image prefetch have been removed. Original image URLs are retained;
this saves initial traffic without claiming to compress originals. For smaller
downloads when viewing the gallery, a future image resizing service could
generate thumbnails automatically from topic image URLs; manual topic edits
are not needed. Browser canvas thumbnailing would still download each original
first and therefore would not solve the first-visit bandwidth problem.

Edit these repository sources for future changes; every main-branch push
publishes updated plugins and updates their footer descriptors automatically.
`scripts/background-plugins.test.mjs` runs the actual packaged plugins against
isolated fixtures: loading order, group filtering, reply-only launchers and late-inserted forms,
shop topic filtering, no GitHub CSS import, image requests only on visibility,
and idempotent footer publication with preserved bridge attributes.

Existing fonts are reused by content-hash filename, not uploaded on every
commit. CSS and JS versions receive immutable new file URLs. Previous versions
remain available for rollback; files are not automatically deleted.

If credentials are absent or expired, the workflow fails with a setup/login
error and leaves the current forum design in place. A CAPTCHA must be resolved
by the account owner; this publisher does not bypass it.

The uploader uses the normal MyBB admin interface because the documented MyBB
API has no file-publishing method. If MyBB changes that interface, publication
fails instead of overwriting unrelated settings.

## Named managed plugin files

See [plugin deployment and workspace import](plugin-deployment.md) for canonical
filenames, forum tags, frequent update workflow, and safe archive cleanup.
