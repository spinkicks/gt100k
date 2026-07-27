# What gets into the curated library, and what keeps it there

**Status:** In force. Implemented as `validateLibrary` plus `scripts/check-links.ts`.
**Date:** 2026-07-27
**Why now:** the launcher decision made the library the product rather than a fallback.

---

## The change in stakes

In the game, the library was a first-resort cache: a thin one only meant the concierge fell through
to open-web retrieval, which is degraded but still answers. Under a launcher the library **is** the
surface. A child taps a subtopic and sees exactly what is filed under it.

So the failure modes changed shape. An empty subtopic is no longer a quality issue, it is a child
walking into a dead end, and a dead URL is the same event arriving a year later.

This matters more than "bad UX" because of what we already know about triggering.
`06-activity-design-ages-6-8` §2.3: in a multi-session study (n = 212), children whose situational
interest was not maintained showed a marked decline in domain interest pre-to-post — a domain that
is raised and then not sustained leaves a child **below** where they started. Offering a subtopic
with an empty shelf is the cleanest possible way to do that to someone.

---

## The rules, and why each one

### Errors, which block

| Rule | Reason |
|---|---|
| Domain and subtopic must exist in the taxonomy | An entry filed under a name nothing renders is invisible. |
| At least one afforded mode | A resource affording nothing forms no cell, so it is invisible to the ENGINE rather than merely unhelpful. Silent, and therefore worse than loud. |
| At least one age tier | The tier decides who sees it. None means nobody. |
| Reputation at or above the retrieval floor (0.5) | Curating something the pipeline would itself discard is a contradiction: it says a human vouched for a source the system does not trust. |
| `https` only, and parseable | A child follows these off our site. Plain `http` is both interceptable and, in practice, a rot signal. |
| Provenance begins `curated:` | `promote` can add web-derived candidates to the same collection. Only hand-authored entries may claim `gold`/`TRUSTED` tagging downstream. |
| Unique id | The catalog is keyed by id, so a duplicate silently shadows an entry. |
| No repeated URL under one path | A child would see the same thing twice on one shelf. |
| **No empty subtopic** | The dead end above. Counted per subtopic, not per cabin: an entry filed at the cabin is about the whole cabin and does not stock the shelf a child actually opened. |

### Warnings, which inform

**A shelf with fewer than two things on it.** A child who does not like the first has nowhere to go
but back. Not an error, because one genuinely good resource beats three padded ones. Patall, Cooper
& Robinson (2008) put the useful range at 3–5 options per choice moment
(<https://doi.org/10.1037/0033-2909.134.2.270>), so two is a floor and not a target.

**An age tier with nothing in it.** Reported rather than blocked, deliberately. The tempting fix is
to re-tag a 12–14 resource as 6–8, which produces a dead end wearing a label: the child taps, gets
something they cannot use, and learns the same lesson as an empty shelf. An honest gap is better
than a dishonest fill, so this stays visible until someone finds real material.

---

## What gets in

**Institutions over individuals, as a durability judgement rather than a snobbery one.** Pew
Research Center, "When Online Content Disappears" (2024), sampling roughly a million pages from
Common Crawl: 38% of pages that existed in 2013 were gone within a decade, 25% of all pages from
2013–2023 were gone, and **about one in five pages from 2021 were inaccessible just two years
later**. <https://www.pewresearch.org/data-labs/2024/05/17/when-online-content-disappears/>

A library of personal blogs and one-off uploads would be a fifth dead before the children using it
finished primary school. Public broadcasters, universities, museums, national agencies, official
project documentation and long-running nonprofits are not better because they are prestigious; they
are better because they are still there.

**Verified, not asserted.** Every URL is fetched and its status recorded before it is written down.
Three practical wrinkles, all of which came up in the first pass:

- Some good sites return 403 to scripted requests and load perfectly for a person. Those are
  re-checked in a real browser and kept when they resolve.
- Some sit behind a Cloudflare challenge that headless browsers cannot clear. **Those are dropped.**
  Unverifiable and unavailable cost a child the same thing, and the standard has to survive
  someone else applying it later without the context.
- A generic hub filed under a specific subtopic is a **soft** dead end: the child taps "robotics" and
  lands on a general project index. Prefer the deep link when one exists.

**Modes describe what the child does, not what the resource is.** A video explaining how synths work
is `investigate`; a build-a-synth walkthrough is `build`. This is the only place the mode axis enters
a launcher at all, because picking a subtopic says nothing about how a child wants to work, so the
accuracy of this field is the difference between a live second axis and a dead one.

---

## What keeps it there

`scripts/check-links.ts` re-fetches everything and reports what died. **Deliberately not in the test
gate:** it needs the network, and a gate that fails because someone else's server is down is a gate
people learn to ignore, which then hides the real failures. Run it on a schedule and before a
release.

The content tests in `test/seed-library.test.ts` are the part that can run offline, and they cover
the failures that happen through editing rather than through rot: an emptied subtopic, a shelf
padded down to one, an entry that can no longer be tagged, a mode axis that has collapsed to a
single value.

---

## Current state

123 resources, all 28 subtopics stocked, zero errors. Eleven subtopics have nothing for
six-to-eight-year-olds and the validator says so on every run rather than letting it pass quietly.
