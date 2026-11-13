# Character manager v89

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


Service request parsing excludes author signatures (`.post-sig`, `.signature`,
`.post-signature`) embedded inside `.post-content`. The lottery's publication confirmation
uses the same exclusion. Actual message content must still match the three-line request.
Regression: `scripts/character-manager-service-signatures.test.cjs`.


## Service cursor and receipt journal

Forum storage (app 16777215): `akcmService550v1` stores the last processed ID, scan frontier
and pending IDs. `akcmS550p<ID>` stores each completed receipt. The initial scan backfills
receipts from persistent character histories. Subsequent scans start at the cursor's page,
follow only forward pages and fetch older pending requests individually. Preview uses the
registry's rendered JSON instead of opening every edit form. Deductions reread their source
post and target record. Receipt/cursor failures can be retried without charging again.
“Просмотреть всю тему” explicitly performs a complete scan.

## Monthly post archive

`akPostCountIndex2` indexes immutable per-month server snapshots `akPCM2_*`, separated by
canonical topic selection, timezone and counting rules. Explicit save publishes one month;
new calculations are drafts and do not affect totals. Full recalculate overwrites closed months,
including zeroed old months, and leaves the current month unsaved. A manual current-month save
is supported. “Всего постов” reads saved snapshots only and does not scan topics.
The old `akPostCount1` monthly save remains readable; `akPostCountAll1` is not added to totals.
New payloads are verified before one index commit, so a failed scan or save keeps old snapshots.

Element parsing accepts both “Техники Элемента” and linked “Техника Элемента”, including
Вода, Огонь, Земля, Ветер, Молния, Кипение, Лава.


v87 persists full-scan coverage alongside monthly snapshot pointers. Months before the
first observed month of a completed full scan can be served as proven zeroes without
scanning topics again, including after reload. Legacy archives without this proof do not
silently assume zero: missing earlier months require the explicit force-month command.
Both force commands are clearly labeled. Coverage commits atomically with the archive.


v88 splits the default “Рассчитать всё и сохранить” action from explicit force refresh.
The default all action loads existing archives without scanning, and fills only newly closed
missing months when coverage is known. Old archives without coverage are reused without an
automatic full rescan. The separately labeled force-all action always rebuilds the full history.
Regression checks repeat the default all action with zero topic reads and verifies incremental
backfill leaves existing month snapshot references unchanged.


v89 excludes the storage topic starter (the manager panel p44958) from fresh registry
reads during service deduction, matching preview and ordinary registry loading.
The real-adapter regression includes both the non-character panel and an actual record.
