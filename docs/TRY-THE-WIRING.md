# Trying the wiring: play the game, watch it reach the console

Fifteen minutes, two terminals, no accounts. At the end a child's session in the discovery game shows
up as a real derived read in the guide console, next to the four synthetic children.

Nothing here is on by default. The game posts nowhere unless you point it somewhere, and the console
refuses everything unless a guardian's consent is on file. Both defaults are deliberate, and both are
why this page exists: without it the first thing you see is silence, and the second is a 403.

## 1. Let the console accept a child

```bash
pnpm --filter @gt100k/guide-console consent
```

Writes a consent record for `local-demo`, the game's fixed synthetic kid, into
`passion/apps/guide-console/.profiles/consent.json`. Set `GT100K_PROFILE_DIR` first if you want it
somewhere else; the console reads the same variable.

The record it writes is `method: "guide-asserted"`, which is the weakest of the three and is **not**
verifiable parental consent. Nothing here has verified anything. That matters for a pilot and not for
this walkthrough, and it is written that way so the difference stays visible.

## 2. Start the console

```bash
GT100K_INGEST_ORIGIN=http://localhost:3070 pnpm --filter @gt100k/guide-console dev   # http://localhost:3020
```

The discovery app serves on `:3070`; the route's built-in origin allowlist still names the old
`:5178` surface, so pass `GT100K_INGEST_ORIGIN` to let the browser's cross-origin post through.

## 3. Start the game, pointed at it

```bash
NEXT_PUBLIC_GT100K_INGEST_URL=http://localhost:3020/api/ingest pnpm --filter @gt100k/discovery dev
```

`http://localhost:3070`. Without that variable the game behaves exactly as it always has and writes
its log only to `localStorage`.

## 4. Play

Pick any topic on the wall, then a subtopic, then open a game from its panel and close it again. The
open is recorded when the game overlay closes, not when it opens.

A session flushes when the tab is hidden, and otherwise every 30 seconds. To force one without
waiting, switch tabs, or in devtools:

```js
window.dispatchEvent(new Event("pagehide"));
```

## 5. Look

Reload `http://localhost:3020`. **Demo Child** is in the switcher with the synthetic four, rendered by
identical code. `passion/apps/guide-console/.profiles/local-demo.json` is the record it came from.

The tag under the roster is the quickest confirmation that a batch landed: it reads *Synthetic data
only* until something is ingested and *Synthetic, plus 1 ingested* afterwards. It is worded that way
because it is the label somebody checks before deciding what they may do with what is on screen, and
a reassurance about data provenance that has quietly stopped being true is worse than none.

## What you should expect to see, and not see

**Surfaced records arrive immediately.** Every tile on a browse screen is recorded as *offered* with
its position, and so is every game in a subtopic's panel. That is half the measurement and it is the
half most systems throw away.

**One open will not produce a hypothesis, and that is correct.** An `open` resolves to no work-mode:
it proves the child was there, not that they worked. Cells form from what a child *does* — solving a
puzzle, assembling something — so solve a gadget if you want to watch a belief move. A single solve
still will not make anything *confident*: that needs voluntary returns across at least two distinct
days, which is the whole point.

**Nothing you do on the shelf's outbound links is lost.** Following one records a `follow-source`
against the card's subject.

## When nothing shows up

The uplink never disturbs the child, so it fails quietly. It does warn in devtools when the console
*refuses* a batch, because that is a configuration problem rather than a closed laptop:

- `403 ... "reason":"no-record"` — step 1 was skipped, or `GT100K_PROFILE_DIR` differs between the
  script and the console.
- `403 ... "reason":"withdrawn"` or `"expired"` — the record is there and not currently valid.
- **A CORS error** — the console is allowing a different origin than the game's. The route permits
  `http://localhost:5178` unless `GT100K_INGEST_ORIGIN` is set, so start the console with
  `GT100K_INGEST_ORIGIN=http://localhost:3070` (step 2) to match the discovery app.
- **Nothing at all in the network tab** — `NEXT_PUBLIC_GT100K_INGEST_URL` is not set. Next.js only
  reads it at startup, so restart the game after setting it.

Re-sending is safe. The receiver deduplicates, so a retry after a lost response costs a round trip
and never a doubled log.

## What this is not

A local development seam. The ingest route has **no authentication and no rate limiting**, it trusts
the `kidId` in the body, and it writes JSON files to a directory. Do not expose it.

And consent is not the only gate. Nobody can verify that the guardian who consented is the guardian,
and a child's project evidence cannot be erased, because the EvidenceGraph is content-addressed
(E1 D2, unsolved). See `docs/decisions/2026-07-27-g3-consent.md`.
