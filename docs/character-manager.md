# Character manager v84

Managed payload `src/plugins/character-manager.js` updates existing forum file `45688.js`.
The manager keeps its direct global script connection because the bundle also contains events.
The standalone manager source is in `src/plugins/sources/character-manager.source.js`.

`currentPlayerId` binds a profile ID to a character. Explicit binding takes priority over the
personal-case link in the author's profile; ambiguous or conflicting mappings block writes.
The service-topic tab previews topic 550 requests before applying selected wallet deductions.
Persistent history uses `service:550:p<ID>` and comment `... p<ID>` to skip repeat deductions.
Source message, ownership and storage state are reread before writes. Partial synchronization
can be resumed from the same tab without deducting money a second time.

Tests: `scripts/character-manager-service.test.cjs` and
`scripts/character-manager-service.browser-test.cjs` (Playwright).


## Personal-case updates: elements

The new tab selects characters and reads `Техники Элемента …` headings from part 2.
`elements` is persisted and rendered after specializations in part 3. Source posts are read
only, and wallet/XP totals are unchanged. Basic inflected element names are normalized.
Empty source lists render “Не указаны”. Pending `elements:UUID` operations resume safely.

The per-character `akcm-refreshElements` checkbox rereads the second post during preview
and apply. When unchecked, stored elements are preserved through normal operations.
Tests: `scripts/character-manager-elements.test.cjs` and
`scripts/character-manager-elements.browser-test.cjs`.
