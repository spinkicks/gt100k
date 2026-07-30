# PassionLab Demo Script

**Five minutes.** One driver, one machine, three tabs.

**Say once, early:** everything on screen is sample data, and no real child has used any of this.

**Golden rule:** lead in plain language, then name the real term and gloss it in one breath ("a Merkle root, basically a digital fingerprint"). No em-dashes read aloud.

---

## Before the room fills

Every port below is pinned in the app's own `dev` script and matches the surfaces registry in
`@gt100k/ui`, so the in-product links resolve to each other. Start an app on a different port and its
neighbours will still point at the pinned one.

```bash
pnpm --filter @gt100k/guide-console consent       # once: lets the console accept `local-demo`
pnpm --filter @gt100k/guide-console seed-demo     # once: a scripted week of play, via the real route
```

Then start what you will actually open, plus anything reachable from a header switcher — **a link to
an app nobody started fails in front of the room.**

| Port | App | Needed for |
|---|---|---|
| 3080 | **Discovery Wall** | Act 1 and 2. The child's surface. |
| 3020 | **Guide Console** | Act 3. The payoff. |
| 3000 | Front Door | optional cold open |
| 3010 · 3030 · 3040 · 3055 | Studio · Evidence · Concierge · Playbook | only so the switcher never dead-ends |

Start the wall pointed at the console, or nothing will reach it:

```bash
GT100K_INGEST_ORIGIN=http://localhost:3080 pnpm --filter @gt100k/guide-console dev
NEXT_PUBLIC_GT100K_INGEST_URL=http://localhost:3020/api/ingest pnpm --filter @gt100k/discovery dev
```

**Check before you present:** the console roster shows **Demo Child** and the tag under it reads
*Synthetic, plus 1 ingested*. If it says *Synthetic data only*, the seed did not land — see
`docs/TRY-THE-WIRING.md`.

---

## 0:00 – 0:30 · The problem

> "A child cannot pick a passion off a list of school subjects. Nobody discovers they love ham radio
> by reading the word 'engineering'. So the first screen is not a menu of subjects."

Say the sample-data line here.

---

## 1. The wall · 0:30 – 1:45 · http://localhost:3080

Open it and say nothing for two seconds. Let them look.

> "Forty-four things a person can actually get good at. All of them, on one screen. No categories to
> walk through, no next page."

**Sweep the cursor slowly.** Names appear under whatever you point at.

The claim to make, because this audience will ask why:

> "This is copied from the closest study that exists. Thirty-six children, six to eleven, a
> fourteen-category hierarchy against forty-four flat concrete categories. Flat won in every grade.
> And of twelve first-graders, zero found the 'More Choices' control on their own. So there is no
> pager here, ever. Whatever is on this screen is, for a small child, the whole world."

**Two controls, quickly.** Toggle **Names** on and off. Drop **Age** to 6 and watch eight tiles
leave: *"nothing here is locked, but we do not show a nine-year-old a thing that needs a licence."*

If asked about the pictures: every tile is one render from one scaffold, normalised to the same mean
brightness, because a wall that reads a click as interest cannot afford a tile that is merely
prettier than its neighbours.

---

## 2. One pursuit · 1:45 – 3:00

**Point at Drums.** Three things in the panel, and the third is the argument.

> "Something to do right now. Somewhere to read. And who says you are good at it."

Land on the venue:

> "ABRSM grades this child, not us. Every one of the forty-four has a real external judge — a
> federation, a competition, a licensing body. A pursuit with nobody to judge it is just a topic."

**Click the game.** Play ten seconds. Close it.

> "The games are inside the pursuits now, not a separate app. Picking is one screen; doing is one
> click in."

---

## 3. The handoff · 3:00 – 4:15 · http://localhost:3020

Switch tabs and reload.

> "Same child, adult side."

**Demo Child** sits in the roster beside four synthetic children, rendered by identical code. The tag
reads **Synthetic, plus 1 ingested**.

> "That tag is the thing to notice. It says out loud that one of these is real ingested data and the
> rest are made up, because a reassurance about provenance that has quietly stopped being true is
> worse than none."

Open Demo Child. Then the honest beat, which is the strongest thirty seconds in the demo:

> "One session of opening things produces nothing here. An open proves the child was there, not that
> they worked. A belief needs them to actually do something, and a confident one needs them to come
> back on different days without being asked. What you are looking at came from a scripted week,
> because we cannot fake a week in a demo."

Show a synthetic child for the fuller read if the panels are thin. **Ari Mercado** is the one to
pick, because he has two specializations and that is what makes the next beat work.

**Click between the two rows in the Specializations rail** with **Wellbeing** open. The read changes
under you, and the banner names which one you are looking at.

> "A child is not one thing, and none of this advice is about a child. 'Hold, and lower the dose' is
> a sentence about a domain. He is steady in audio and the dance read is the one asking for a human,
> so the tab is scoped to whichever you picked and the rail says which one needs you."

If someone asks why Maps looks different, that is the honest one to take:

> "Those are the maps that exist, and none of them is his. The banner says so rather than letting a
> piano map read as his path. Writing the maps for what children are actually into is the next
> piece of work, and it is the one the whole ladder depends on."

---

## 4. Close · 4:15 – 5:00

What it does not do, said plainly before anyone asks:

- The ingest route has **no authentication and no rate limiting**. It is a local development seam.
- Consent is **guide-asserted**. Nobody has verified that the guardian who consented is the guardian.
- A child's project evidence **cannot be erased**, because the EvidenceGraph is content-addressed.
  That is E1 D2 and it is unsolved.

> "Those are the pre-live gates. They are named in the repo rather than hidden, and they are why
> nothing here has been in front of a real child."

---

## Questions this audience actually asks

**"Why not just let them search?"** A child who can search already knows the word. The whole problem
is the child who does not.

**"How do you know they like it rather than like the game?"** Voluntary return across days, with
nothing prompting it. Everything that could manufacture engagement — streaks, badges, points,
notifications, unlocks — is deliberately absent, because the signal is what a child does when
nothing is pushing them.

**"What happens when a child clicks nothing?"** Every tile on screen is logged as offered, with its
position. That is half the measurement and it is the half most systems throw away — without it, a
decline and a never-shown are the same row.

**"Is the order the same every time?"** Random per session, fixed roster. Random order decorrelates
position from preference. A random *roster* would be trigger-and-abandon, which finishes below never
having triggered the interest at all.
