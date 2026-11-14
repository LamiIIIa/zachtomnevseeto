# Technique and artifact builders

The existing forum file is `84381.js`; publication updates it in place and refreshes
its footer version. Sources are in `src/plugins/sources/akatsuki-*-builder.source.js`.
`src/plugins/akatsuki-builders.js` is the ASCII bundle built in the workspace with
`build-akatsuki-technique-builder.ps1` (embedded weapon catalog preserved).

Version 16 provides separate read-only parameter-link outputs and copy buttons.
The output is exactly `[url=post][color=rank]Russian name[/color][/url]`.
Full-card code contains the same link in its code block; generated full cards strip
widepost markers. The publication script checks the previous source hash and rolls
back the file/footer on verification failure. It never edits published techniques.

Test: `node scripts/builders-output.browser-test.cjs`.
