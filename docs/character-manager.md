# Character manager v83

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
