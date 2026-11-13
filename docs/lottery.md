# Lottery purchase wallet check

Managed extra `lottery` uses `src/plugins/compat/lottery.js` and keeps its topic-361 loading rule.
Workspace sources are `lottery-d100/lottery.source.js` and `transport.part.js`; build with
`node lottery-d100/build.cjs` and copy the generated `lottery-d100.js` into compat/lottery.js.
Source snapshots for review are under `src/plugins/sources/lottery*`.

Before generating dice or opening the posting form, the buyer's profile field `#pa-fld2`
provides the personal-case topic. The third existing post's wallet summary is read fresh.
Wallet history and other posts are excluded. Cost greater than balance blocks purchase
with both amounts shown. Missing or ambiguous data blocks posting. Previously published
purchases resume service confirmation without a second balance check or new ticket post.

Test: `node scripts/lottery-wallet.test.cjs`.
