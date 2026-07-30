# Rolling the design language across the remaining surfaces

**Status:** all three decisions are now taken, and the adult surfaces are done. **The concierge went
GT, one evidence explorer survives and wears GT, and the Project Studio kept its own token set while
its undersized controls were fixed.** What is left is named at the end of §4.2 and in §5.
**Date:** 2026-07-26 · **Resolved:** 2026-07-28

> **Amended (2026-07-27):** `docs/decisions/evidencegraph-v1-design.md` §13a makes the EvidenceGraph its own
> product, extractable by `git subtree`, which gives this plan's decision about `evidence-explorer` (~38, ~115) a
> consequence it did not have on 2026-07-26. Theming that app to GT is what makes `apps/evidence-explorer` depend
> on `@gt100k/design-tokens` and `@gt100k/ui`, two packages outside the `evidence-*` namespace, so they would have
> to travel with the extraction or be replaced by the standalone product's own tokens. The new
> `@gt100k/boundaries` check records this as an accepted **warning** (rule B3, `EVIDENCE_APP_OUTWARD_DEP`, apps
> only) rather than a failure: the decision here stands, the cost is now visible. The inbound direction is still
> hard-failed — nothing outside the namespace may import `evidence-*` as a value.

## 1. What I got wrong in the first draft

The first version of this plan treated the four un-branded surfaces as a backlog to work through.
A review found sixteen defects in it, five of them blockers, and I verified the four that mattered
against the code. They change the conclusion rather than the details.

**The remaining surfaces are not un-branded by neglect. Each is deliberately different, and each
reason is written down.** Applying GT to them is not finishing a job; it is reversing three
decisions.

| Claim in the first draft | What is actually true |
|---|---|
| "Concierge to GT, no decisions needed" | It is a deliberate dark instrument: `color-scheme: dark`, and a header comment reading "A dark, near-black instrument rather than a bright reading surface." Converting it to warm paper is a product decision, and I filed it as a warm-up exercise. |
| "The decision record already calls for the studio to share the contract" | It does not. The record names guide console, parent guide and evidence explorer. **The studio's own plan specifies an "own cartoonish token set."** My plan contradicted a documented decision without saying so. |
| "The studio has six themes" | **Seven.** `cartoon-sun` was missed because its palette lives on `:root` rather than in a theme block. The audit gate in the first draft would have skipped it. |
| "Rewrite its themes as contract themes" | Hand-waving. 13 of the studio's 28 custom properties have no contract equivalent (display transform, four shadow states, lift, press, two extra accents), and the contract asks a theme to assign roughly 56 tokens, not the three the draft named. |

Two more that would have broken things on contact:

- **`cartoon-sun` has no theme block.** Importing the shared themes would make `:root` the adult MUI
  palette, so the *default* child theme would silently render adult grey and blue.
- **`data-mood="child"` would be close to a no-op.** The studio consumes no contract spacing tokens,
  so setting the mood changes almost nothing, except `--line-w`, where child mode's 2px would fight
  the studio's 3px cartoon outlines at equal specificity and import order would decide.

## 2. The actual state, corrected

| Surface | Why it looks the way it does | Is that deliberate? |
|---|---|---|
| `concierge` | Dark near-black instrument | Was deliberate; **now GT** (#188) |
| `project-studio` | Eight child themes, own token set | **Yes**, specified in its plan. GT added as the default (#188) |
| `evidence-explorer` | Plain, where the EvidenceGraph work happens | **Resolved.** GT (#188), and the sole survivor |
| `evidence-explorer-themed` | Seven themes, the README called it the observatory | **Deleted.** See below |
| `design-lab` | Multi-theme on purpose | Was the comparison surface; **no longer**. See below |

So there is no surface left that is un-branded *by accident*. That was the finding.

**Two more surfaces settled it further.** The GT identity is worn by five apps today — guide console,
parent guide, evidence explorer, concierge and the `home` front door — all through
`[data-theme="gt"]` in `@gt100k/design-tokens`. The comparison the whole exercise turned on is over:
the losing Horizon theme has been deleted from the token package rather than kept as an opt-in, and
the MUI values it lost to are now unqualified on `:root`, so importing the package is enough to get
them. Anything still setting `data-theme="horizon"` falls through to those values.

### Resolution of the duplicate, 2026-07-26

Both explorers were re-themed to GT in #188, which made them byte-identical apart from eight files,
and that comparison is what finally settled which to keep. `-themed` was ahead on two counts: its
user-visible copy had been cleared of em-dashes, and `Threads.tsx` carried a real fix, memoising the
endpoint array so drei stops rebuilding every line's geometry each time Verify re-renders. It was
behind on one: it had dropped the milestone ref from the heading, so the page no longer said which
milestone you were looking at, and its `.obs-ref` rule styled nothing.

So the survivor keeps the **name** `evidence-explorer`, because seven private palettes are gone and
"themed" now describes nothing, and the **content** of `-themed`, with the milestone ref and the
add-panel sub-label restored. The logic in the two was identical, so nothing was lost.

## 3. What is safe to do without a decision

**Nothing substantial**, which is the honest answer.

`design-lab` should gain GT as one of the themes it can display, since it is the comparison surface
and GT is now canonical. That is genuinely mechanical. It also needs the three font packages it does
not currently have, and its existing `mui` option matches no theme block, which is a small
pre-existing bug worth fixing while there.

> **Overtaken by events.** None of this was done and none of it should be: `design-lab` stopped being
> a theme-comparison surface. Its static MUI console mockup (`app/console.tsx`, `app/console.css`,
> `app/charts.tsx`) was deleted once the real console had been restyled — a second console that no
> longer matched the first taught only the wrong answer — and the lab is now an index of prototypes,
> currently the child-facing browse wall and a tile-art comparison. There is no theme switcher left
> to add GT to and no `mui` option left to fix.

## 4. The three decisions

### 4.1 Should the concierge stop being dark?

**Answered: yes.** It went GT in #188 and the dark instrument is gone. Its `globals.css` records the
trap this section predicted — a local `:root` outranks `[data-theme]` on equal specificity by coming
later — as the reason its own palette was removed rather than retuned. The reasoning below is what
the decision was taken against.

It is an adult surface, so GT would suit it. But the darkness is a deliberate choice about what the
surface *is*: a calm instrument rather than a reading surface. Changing it is reasonable and it is
not mine to decide.

If yes, the work is small: the two traps from the Playbook migration mostly do not apply, since it
already imports the package root correctly. It does redeclare fonts locally, which would silently
outrank the theme, and it uses `next/font` rather than the fontsource packages, so the swap is three
new dependencies and unwinding `fonts.ts`.

### 4.2 Should the Project Studio share the token contract?

**My recommendation is no, or not yet, and I have changed my mind on this.**

The case for: seven private palettes cannot be re-themed or contrast-audited centrally, and the
contract's researched child values (56px controls, a 76px primary target, a 17px text floor) exist
and are unused.

The case against, which I now think is stronger: it contradicts the studio's own written spec, 13 of
its properties have no home in the contract, and each of seven themes would need to assign about 56
tokens. That is a large rewrite of a working, deliberately-designed child surface for a benefit that
is mostly architectural.

**There is a cheaper version, and measuring it made it the thing I would actually do first.**

Leave the themes alone and fix what is wrong regardless of any token question. I measured every
control on the studio's main screen in a browser rather than reading the CSS: **twelve of eighteen
are below the 44px minimum.**

| control | measured | count |
|---|---|---|
| `.kindbtn` | 34px tall | 10 |
| `.themebtn` | 39px tall | 1 |
| `.btn` | 43px tall | 1 |
| `.stuck input` | 18 by 18 | checkbox |

The contract's child mode asks for a 56px minimum and a 76px primary target, citing the child-UX
literature. This surface is used by six to fourteen year olds and most of its controls are at 34px.

That is a real defect with a real user, it needs no architectural decision, and it is worth doing
whether or not the studio ever adopts the contract. **It is the only item in this document I would
start without asking.**

**Both halves happened.** The studio kept its own token set and gained `gt-school` as an eighth
preset and the default, so the recommendation stands and the contract question is still open. The
undersized controls were fixed on their own merits: `globals.css` now sets an explicit `min-height`
on the kind buttons, the theme button, the primary button and the checkbox's label, and cites the
measurements in this section as the reason. **The floor it sets is 44px, not the contract's 56px
child minimum**, which closes the accessibility defect without pre-deciding the token question —
worth knowing, since this section is the only record that 56px was the number the research asked
for.

### 4.3 Which evidence explorer survives?

**Settled the same day, as §2 records: the plain one survives, keeps the name, and takes the themed
one's content.** The four colliding theme ids stopped being a risk with the seven private palettes
they belonged to. The blocked state below is kept for the shape of the argument.

Unchanged from the first draft, and still blocked. The README calls the themed one the observatory;
the EvidenceGraph work is in the plain one. Both are on their own CSS. Theming either before this is
settled is waste, and the four theme ids they share with the studio (`minimal-slate`, `minimal-ink`,
`tech-terminal`, `tech-synth`) would collide if themes ever move into the shared package.

## 5. If any of this proceeds, verification is not free

The first draft promised a contrast audit across every theme. **There is no contrast tooling in
`passion/`.** The only implementation is in `archive/`, and the GT theme's published ratios were
measured with a one-off script. Seven themes times every text pair is a real amount of work and it
needs a tool that does not exist yet. Any plan that promises it must build it first or scope down and
say so.
