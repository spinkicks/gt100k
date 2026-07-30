# What gets into the curated library, and what keeps it there

**Status:** In force. Implemented as `validateLibrary` plus `scripts/check-links.ts`.
**Date:** 2026-07-27
**Why now:** the launcher decision made the library the product rather than a fallback.

> **Note added 2026-07-27, after the surface owner kept the game**
> (`2026-07-27-discovery-surface.md` §-1). The premise in the line above is now **conditional**: the
> library is the surface only if the child leaves the product to learn, which is deliberately still
> open. **Every rule below stands unchanged regardless**, and the argument is the same one, one step
> weaker: a subtopic offered with nothing behind it raises a domain and fails to maintain it, which
> §2.3's n = 212 finding says leaves a child *below* where they started. That holds whether the empty
> shelf is the whole surface or one shelf inside a room. ~~What is *not* yet true is the wiring — the
> game's shelf reads its own hand-authored `cards.data.ts`, not this library.~~
>
> **Wired 2026-07-27.** Every shelf card ends in a "Where to go next" list drawn from this library by
> `curatedForCell`, keyed by the card's own subject: an activity card by its gadget's subtopic, the
> invitation by its cabin. The card prose stays hand-authored and should: a card is an argument for
> caring about something, and a link is somewhere to go once that argument has worked.

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
| No repeated URL under one path, or under one pursuit | A child would see the same thing twice on one shelf. Checked over both filing systems, because either one can be the shelf. |
| Every named pursuit exists | A tag naming no tile stocks nothing, silently. |
| **No empty subtopic** | The dead end above. Counted per subtopic, not per cabin: an entry filed at the cabin is about the whole cabin and does not stock the shelf a child actually opened. |
| **No empty pursuit** | The same dead end, over the partition a child actually experiences. See below. |

### Warnings, which inform

**No maximum, on purpose.** Eleven shelves hold more than Patall's 3-5, one of them nine. That is
not a defect to fix by deletion. The library is a *store*; 3-5 is a property of a *choice moment*,
and which subset a child sees is the surface's decision. The number is also weaker than it is
usually quoted as: the option-count moderator is marginal (Q(2) = 5.62, p < .06 fixed effects, and
not significant at p = .20 under random effects). Trimming verified resources to satisfy a
presentation rule would be the wrong trade in both directions.

**A shelf with fewer than two things on it.** A child who does not like the first has nowhere to go
but back. Not an error, because one genuinely good resource beats three padded ones. Patall, Cooper
& Robinson (2008) put the useful range at 3–5 options per choice moment
(<https://doi.org/10.1037/0033-2909.134.2.270>), so two is a floor and not a target.

**An age tier with nothing in it.** Reported rather than blocked, deliberately. The tempting fix is
to re-tag a 12–14 resource as 6–8, which produces a dead end wearing a label: the child taps, gets
something they cannot use, and learns the same lesson as an empty shelf. An honest gap is better
than a dishonest fill, so this stays visible until someone finds real material.

---

## Amended 2026-07-29: coverage is two questions, not one

The rules above shipped a library that satisfied every one of them and still handed a child the
wrong shelf. Worth recording precisely, because the failure was invisible from inside the standard.

**What happened.** A resource was filed at a `domainPath` — a cabin and a subtopic — and the
validator counted coverage per subtopic. All 29 were stocked, so it reported zero errors and zero
warnings. But the browse wall's tiles are the 44 entries of `@gt100k/pursuits`, which is a
*different partition of the same material*: `music-sound/instruments` is one subtopic and four
tiles, `math-puzzles/logic-puzzles` holds both Sudoku and Codes & Ciphers, and
`math-puzzles/statistics` holds no tile at all. Having no key in common, the wall resolved a tap
against the pursuit's **cabin**. So all eight music tiles returned one shelf, and a child who tapped
Speaker Design was handed four links about orchestral instruments.

That is worse than a thin shelf. A thin shelf is honest about having little; a wrong one tells the
child the app did not understand what they just chose.

**Why it could not be fixed by mapping.** The obvious repair is a crosswalk from pursuit to
subtopic, and it does not work, because the partitions genuinely differ rather than being the same
cuts at different depths. Twenty-two of the 44 tiles had no subtopic that was about them — there is
no cell for Sewing, Birding, Podcasting, Speedcubing or Comics — while seven cells (perception,
statistics, maths foundations, general physics) name no tile. Neither direction is derivable from
the other, so both are now written by hand: `CuratedResource.pursuits` sits alongside `domainPath`,
and the validator asks its coverage question twice.

**`pursuits: []` is a real answer.** It means the entry stocks a cell the wall does not name. About
twenty entries carry it. Those are gaps in the CATALOGUE — candidates for a forty-fifth tile, most
obviously one about perception and how minds work, which would rehome seven strong resources — and
forcing them onto an ill-fitting tile would hide that rather than fix it.

**The rule this produces, stated generally so it survives the next surface.** *A coverage check is
only as good as its choice of partition, and the partition to check is the one the child's tap
lands on.* The subtopic check protects the concierge, which resolves by domain path. It cannot
protect a surface that resolves by anything else, and it will report success while that surface
fails.

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

**It now sweeps the pursuits catalogue's venue URLs too, and that found five broken ones.** Three
domains did not resolve at all and two had 404ed after their organisations rebuilt. Each was a
plausible guess at a real institution's address rather than an address anyone had opened — the
Toyota Dream Car Art Contest is real and lives at `toyota-dreamcarart.com`, not `toyota-dreamcar.com`;
Young Animator of the Year is real and lives at `younganimator.uk`. A venue answers "who will judge
this?", so a dead one is a promise the product cannot keep, and it sat one field away from a library
where every URL had been verified. **The rule: a collection of URLs that no sweep covers will rot,
and "it is not the library" is not a reason it will not.**

Four new soft-404 detectors came out of the same pass, each defeating the title check the previous
one relied on: an effective URL ending `/pages/display/error404` (ARRL redirects bad paths there and
answers 200), MediaWiki's `noarticletext` class (NASPA's wiki renders a plausible title for a page
that does not exist), Imperva's "Pardon Our Interruption" interstitial (served at 200), and a body
under 1KB (NYPL answers 200 with 212 bytes; two CoCoRaHS pages answer 200 with navigation and no
content).

### The checker now separates "dead" from "cannot tell", because otherwise it is unreadable

The first full sweep of 318 URLs reported 23 failures. Every single one was a false alarm: WAFs
rejecting an automated client, a rate limit, or this machine's own network. A report that is
twenty-three parts noise and zero parts signal is a report people skim, and skimming is exactly how
the one real dead link survives. Three changes, in order of how much they mattered:

1. **Send a browser's user agent.** Thirteen of the twenty-three were institutions — the
   Exploratorium, NOAA, the Smithsonian, 4-H, the American Go Association — refusing a request that
   identified itself as a tool. The question the script asks is "would a child reach this page", so
   the request should look like the one a child's browser makes.
2. **Send `accept: */*`.** A narrower `text/html` Accept header made the RHS school-gardening site
   answer 404 to a request it serves 278KB of HTML to without one. That is one header away from
   deleting a good resource on the strength of a fabricated 404.
3. **Classify, and retry once.** A `403`, a `429` or a recognised challenge body is now **blocked**,
   not dead: printed, counted, and left to a human, because it is not evidence about the page behind
   it. A `5xx` or a network failure gets one retry after a pause — `scrabbleplayers.org` answered 200
   in the morning and 500 in the afternoon, and `pokemon.com` serves an interstitial to bursts and the
   real rulebook when asked again. Only genuine deaths fail the run.

The general lesson is about maintenance tooling rather than about links: **a checker that cannot
distinguish "this is broken" from "I could not tell" will be ignored, and an ignored checker is worse
than none, because it is also believed.**

The content tests in `test/seed-library.test.ts` are the part that can run offline, and they cover
the failures that happen through editing rather than through rot: an emptied subtopic, a shelf
padded down to one, an entry that can no longer be tagged, a mode axis that has collapsed to a
single value.

`test/pursuit-coverage.test.ts` is the same idea over the other partition, and it holds one property
the validator cannot express: **no two tiles may show an identical shelf.** Two tiles sharing a
resource is fine and often right — Photography and Filmmaking both want the BBC's page on how
digital images are made. Two tiles whose shelves match exactly means neither was tagged and both are
resolving against something coarser, which is the original bug returning by a different route.

---

## Current state

**274 resources, all 35 subtopics stocked, all 44 pursuits stocked, zero errors.**

Was 157 across 29 subtopics before the pursuit re-tag on 2026-07-29. The 117 added are marked
`curated:shelves-2026-07` so they can be told from the original pass; `scripts/add-pursuit-shelves.mjs`
records where each came from and what was rejected.

Six subtopics were minted to hold material the coordinate system had no cell for: `handcraft` and
`rocketry` under Making & Building, `wildlife` and `weather` under Science & Nature, `security` under
Code & Computers, and `rhetoric` under Words & Persuasion. Filing those at the cabin instead was the
tempting shortcut and is a bug — a cabin-level path is compatible with every subtopic beneath it, so
a woodworking entry filed at `making-engineering` would surface on the robotics shelf.

**Eleven warnings, all of them honest gaps rather than work not done.** Two subtopics have no
material for the youngest tiers (`code-computers/security`, `influence-media/rhetoric`) and nine
pursuits have none for 6-8. Every one is a tile whose own minimum age sits above the tier it misses —
Hacking Puzzles starts at 13, Debating at 11 — so filling them would be fabrication, not curation.
`test/seed-library.test.ts` names the two allowed subtopics explicitly rather than loosening the
assertion, so a third still fails.

Three gaps are worth someone's attention because real material exists and we cannot reach it:
Cornell's Bird Song Hero and Merlin are behind Cloudflare and are the two best song-identification
resources in existence for a tile whose blurb is *about* song identification; `youcandothecube.com`,
the official Rubik's K-12 programme, has a TLS certificate that does not match its hostname, which is
why Speedcubing has no 6-8 tier; and `scijinks.gov`, NOAA and NASA's own children's weather site, has
an expired certificate.

This read 151 across 28 subtopics when it was written. The difference is the whole of #218: minting
`math-puzzles/foundations` for the game's balance-and-ratio activities immediately failed the
empty-subtopic rule, and six verified resources were added to clear it. That is the rule below doing
the job it was written to do, rather than a drift in the numbers.

The eleven subtopics that had nothing for six-to-eight-year-olds are filled, and full tier coverage
is now a test rather than a warning, so losing it fails instead of merely printing.

One caveat is recorded in the library itself rather than resolved, because resolving it would mean
lying: the only `code-computers/python` entry tagged 6-8 is EduBlocks, a block-to-Python bridge
rather than Python. Nothing that teaches Python itself is usable by a six-year-old, since Python is a
text language, and the obvious candidates are explicitly older (Hedy is text entry from level one;
the Raspberry Pi Foundation's Python pathway says 9+). It should read as "on the way to Python"
wherever it is surfaced.

### What this cost, and the rule it produced

One of the compiling agents noticed that `projects.raspberrypi.org` answers HTTP 200 for **every**
path, including ones it invented as a control. That arrived after two generic hub URLs had already
been replaced with deep links and "verified" by status code. Checked in a real browser,
`pathways/python-intro` was genuine and `pathways/robotics-intro` rendered "Something's gone wrong",
identical to a made-up URL. A dead end had been shipped by someone who believed they had verified it.

So: **on a single-page-app domain, prefer a collection URL you have seen working over a deep link
you inferred**, and `check-links.ts` now reads the body rather than only the status. The heuristic
will not catch a soft 404 that renders a cheerful empty page, which is why the rule stands on its
own instead of being replaced by the check.

All 151 URLs in the library at that point were swept in a real browser, matching soft-404 markers
against titles and headings. Two entries were dropped for being unverifiable behind Cloudflare rather
than assumed good, which is the same standard applied consistently: unverifiable and unavailable cost
a child the same thing. The six later added for `math-puzzles/foundations` were verified on the way
in; the sweep itself has not been re-run since.
