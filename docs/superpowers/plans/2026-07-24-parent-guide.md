# The Warm-Demanding Parent Playbook Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single self-contained static webpage, `parent-guide/index.html`, that turns our family research + coaching engine into a plain-language "Warm-Demanding Parent Playbook" for homeschool parents, including a Family Check-In widget that faithfully mirrors the `@gt100k/family` engine's decision logic.

**Architecture:** One portable HTML file (inline CSS, inline JS, no build, no network, opens by double-click). The widget's branch logic is authored once as a pure ES module (`widget-logic.mjs`, the source of truth, unit-tested for exact parity against the real engine) and then inlined verbatim into `index.html`'s `<script>` (a drift test guards the copy). All prose + citations come from the approved spec.

**Tech Stack:** Plain HTML + CSS + vanilla JS (ES module for logic/testing). Vitest for tests. Dev dep `@gt100k/family` (for the parity test only).

**Spec:** `docs/superpowers/specs/2026-07-24-parent-guide-design.md` (the content, chapters, widget mapping, and Sources are all defined there; this plan builds it).

## Global Constraints

- **Single self-contained file:** `parent-guide/index.html` opens by double-click, no build step, no backend, **no external fetches** (system font stack, no CDN/analytics). Only the widget needs JS; all prose is readable with JS off.
- **No em-dashes anywhere in the page copy** (tested). Use commas, periods, colons, or "and".
- **No score, no label, no reward/gamification, no child- or family-facing verdict.** Warmth is never framed as conditional. The two escalating widget branches route the parent to a human, never to a rendered verdict.
- **Every strong body claim carries an inline citation** that resolves to an entry in the Sources section; every Sources link is a well-formed URL.
- **The widget is an EXACT mirror of `@gt100k/family` `assess.ts` `decide()`** (branch-determining outputs: risk, escalate, autonomySupport, structure, decouple, warmth). Verified by an exhaustive parity test.
- **Accessible:** WCAG AA contrast, semantic HTML, keyboard-operable widget, `prefers-reduced-motion` respected. Print-friendly (Part 0 + Part 9).
- Branch from current `main` (branch `feat/parent-guide` already exists with the spec). `pnpm install` after adding `parent-guide/package.json`.

---

### Task 0: Scaffold + widget logic module + exact-parity test

**Files:**
- Create: `parent-guide/package.json`
- Create: `parent-guide/vitest.config.mts`
- Create: `parent-guide/widget-logic.mjs`
- Test: `parent-guide/test/widget-parity.test.mjs`

**Interfaces:**
- Produces: `decide(signals) -> { branch, risk, autonomySupport, structure, warmth, decouple, escalate, offers, talkToHuman }` where `signals` is an object of the nine booleans from spec §5.1: `anyStakesEvent, anyDevaluation, anyBackOffOrRest, pressuredSpecialization, overIdentification, parentalOverValuation, conditionalRegardObserved, familyControlObserved, lowFamilyEngagement`.
- Consumes (test only): `assessFamily` + `FamilySignals` from `@gt100k/family`.

- [ ] **Step 1: Create `parent-guide/package.json`**

```json
{
  "name": "@gt100k/parent-guide",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run --config vitest.config.mts"
  },
  "devDependencies": {
    "@gt100k/family": "workspace:*"
  }
}
```

- [ ] **Step 2: Create `parent-guide/vitest.config.mts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.mjs"],
    environment: "node",
  },
});
```

- [ ] **Step 3: `pnpm install`** (from repo root). Expected: resolves, links `@gt100k/family`.

- [ ] **Step 4: Write the failing parity test** `parent-guide/test/widget-parity.test.mjs`

```js
import { describe, it, expect } from "vitest";
import { assessFamily } from "@gt100k/family";
import { decide } from "../widget-logic.mjs";

// The nine parent-observable booleans the widget exposes (spec §5.1).
const KEYS = [
  "anyStakesEvent", "anyDevaluation", "anyBackOffOrRest", "pressuredSpecialization",
  "overIdentification", "parentalOverValuation", "conditionalRegardObserved",
  "familyControlObserved", "lowFamilyEngagement",
];

// Build the full FamilySignals the engine expects from the widget's boolean subset.
function toSignals(bits) {
  return {
    kidId: "t", now: "2026-01-01T00:00:00.000Z",
    activeSpikes: bits.overIdentification ? 1 : 2,
    ...bits,
  };
}

describe("widget decide() is an exact mirror of assessFamily()", () => {
  it("agrees on branch-determining outputs across all 512 combinations", () => {
    for (let mask = 0; mask < (1 << KEYS.length); mask += 1) {
      const bits = {};
      KEYS.forEach((k, i) => { bits[k] = Boolean(mask & (1 << i)); });
      const read = assessFamily(toSignals(bits));
      const w = decide(bits);
      const ctx = JSON.stringify(bits);
      expect(w.risk, ctx).toBe(read.pressureWatch.risk);
      expect(w.escalate, ctx).toBe(read.escalateToHuman);
      expect(w.autonomySupport, ctx).toBe(read.posture.autonomySupport);
      expect(w.structure, ctx).toBe(read.posture.structure);
      expect(w.decouple, ctx).toBe(read.posture.decoupleWorthFromOutcome);
      expect(w.warmth, ctx).toBe(read.posture.warmth);
    }
  });
});
```

- [ ] **Step 5: Run it, verify it fails**

Run: `pnpm --filter @gt100k/parent-guide test`
Expected: FAIL (`widget-logic.mjs` has no `decide` export yet).

- [ ] **Step 6: Implement `parent-guide/widget-logic.mjs`** (exact mirror of `passion/packages/family/src/assess.ts` `decide()`; priority order preserved)

```js
// Pure mirror of @gt100k/family assess.ts decide(). SOURCE OF TRUTH for the inline widget.
// Inputs are the nine parent-observable booleans (spec §5.1). Outputs match the engine's
// branch-determining fields exactly (verified by test/widget-parity.test.mjs). No clock, no random.
export function decide(s) {
  const elevated =
    s.parentalOverValuation === true ||
    s.conditionalRegardObserved === true ||
    s.familyControlObserved === true ||
    (s.pressuredSpecialization === true && s.anyDevaluation === true) ||
    (s.overIdentification === true && s.anyStakesEvent === true);

  if (elevated) {
    return {
      branch: "elevated", risk: "elevated",
      autonomySupport: "up", structure: "steady", warmth: "non_contingent",
      decouple: true, escalate: true, talkToHuman: true,
      offers: ["keep_warmth_same", "reduce_evaluation",
        ...(s.overIdentification === true ? ["second_door"] : []), "logistics_only"],
    };
  }
  if (s.anyStakesEvent === true) {
    return {
      branch: "rising_stakes", risk: "watch",
      autonomySupport: "up", structure: "steady", warmth: "non_contingent",
      decouple: true, escalate: false, talkToHuman: false,
      offers: ["reduce_evaluation", "logistics_only", "access"],
    };
  }
  if (s.anyBackOffOrRest === true || s.anyDevaluation === true) {
    return {
      branch: "strain", risk: "watch",
      autonomySupport: "up", structure: "steady", warmth: "non_contingent",
      decouple: false, escalate: true, talkToHuman: true,
      offers: ["guilt_free_break", "access", "structure"],
    };
  }
  if (s.lowFamilyEngagement === true) {
    return {
      branch: "low_engagement", risk: "none",
      autonomySupport: "steady", structure: "up", warmth: "non_contingent",
      decouple: false, escalate: false, talkToHuman: false,
      offers: ["structure", "access"],
    };
  }
  return {
    branch: "healthy", risk: "none",
    autonomySupport: "steady", structure: "steady", warmth: "non_contingent",
    decouple: false, escalate: false, talkToHuman: false,
    offers: ["access", "structure", "community"],
  };
}
```

- [ ] **Step 7: Run the test, verify it passes**

Run: `pnpm --filter @gt100k/parent-guide test`
Expected: PASS (512/512 combinations agree).

- [ ] **Step 8: Commit**

```bash
git add parent-guide/package.json parent-guide/vitest.config.mts parent-guide/widget-logic.mjs parent-guide/test/widget-parity.test.mjs
git commit -m "feat(parent-guide): widget decision logic mirroring the family engine (exact parity)"
```

---

### Task 1: The static page content (Parts 0–9, Sources, sticky ToC)

**Files:**
- Create: `parent-guide/index.html`
- Test: `parent-guide/test/content.test.mjs`

**Interfaces:**
- Consumes: the chapter text and Sources list from spec §4 and §11 (transcribe them, de-jargoned and em-dash-free).
- Produces: an HTML document with stable section anchors: `#start` (Part 0), `#stance`, `#read-your-child`, `#how-talent-develops`, `#the-moves`, `#the-traps`, `#big-questions`, `#when-it-gets-hard`, `#checkin` (widget mount, filled in Task 2), `#sources`, `#self-assessment`.

- [ ] **Step 1: Write the failing content test** `parent-guide/test/content.test.mjs`

```js
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const html = readFileSync(fileURLToPath(new URL("../index.html", import.meta.url)), "utf8");

const REQUIRED_ANCHORS = [
  "start", "stance", "read-your-child", "how-talent-develops", "the-moves",
  "the-traps", "big-questions", "when-it-gets-hard", "checkin", "sources", "self-assessment",
];
// A key author must appear in the Sources block for each research pillar.
const REQUIRED_AUTHORS = [
  "Bloom", "Kim", "Mageau", "Vallerand", "Deci", "Macnamara", "Achter",
  "Marcia", "Hidi", "Nye", "Csikszentmihalyi", "Subotnik", "Renzulli",
  "Bartholomew", "Luthar", "Amato", "Buehler", "Cameron",
];

describe("parent-guide content", () => {
  it("has no em-dashes", () => {
    expect(html.includes("\u2014")).toBe(false);
  });
  it("has every required section anchor", () => {
    for (const a of REQUIRED_ANCHORS) expect(html, a).toMatch(new RegExp(`id=["']${a}["']`));
  });
  it("cites every research pillar in Sources", () => {
    for (const a of REQUIRED_AUTHORS) expect(html, a).toContain(a);
  });
  it("has at least 40 well-formed https source links", () => {
    const links = html.match(/https:\/\/[^\s"'<>)]+/g) ?? [];
    expect(links.length).toBeGreaterThanOrEqual(40);
    for (const l of links) expect(l).toMatch(/^https:\/\/\S+$/);
  });
  it("is self-contained (no external stylesheet/script/font fetches)", () => {
    expect(html).not.toMatch(/<link[^>]+rel=["']stylesheet/i);
    expect(html).not.toMatch(/<script[^>]+src=/i);
    expect(html).not.toMatch(/fonts\.googleapis|cdn\./i);
  });
});
```

- [ ] **Step 2: Run it, verify it fails** (`index.html` does not exist).

Run: `pnpm --filter @gt100k/parent-guide test`
Expected: FAIL.

- [ ] **Step 3: Create `parent-guide/index.html`** with this skeleton, then fill the prose from the spec.

Use this exact shell (self-contained; system fonts; sticky ToC; print styles). Fill each `<section>` with the corresponding spec §4 chapter text (plain language, no jargon, no em-dashes) and the §11 Sources verbatim as `<a href>` links.

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>The Warm-Demanding Parent Playbook</title>
<style>
  :root{
    --bg:#f4efe6; --surface:#fffdf9; --ink:#211d17; --muted:#5c554a;
    --accent:#9a5b2e; --line:#e0d7c7; --r:14px; --measure:68ch;
    --serif:Georgia,"Times New Roman",serif;
    --sans:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  }
  *{box-sizing:border-box}
  html{scroll-behavior:smooth}
  body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--sans);
    font-size:17px;line-height:1.6;-webkit-font-smoothing:antialiased}
  .wrap{max-width:1040px;margin:0 auto;padding:32px 20px 96px;display:grid;
    grid-template-columns:220px 1fr;gap:40px}
  nav.toc{position:sticky;top:24px;align-self:start;font-size:0.9rem}
  nav.toc a{display:block;color:var(--muted);text-decoration:none;padding:3px 0}
  nav.toc a:hover{color:var(--accent)}
  main{max-width:var(--measure)}
  h1{font-family:var(--serif);font-size:2.4rem;line-height:1.1;margin:.2em 0 .3em}
  h2{font-family:var(--serif);font-size:1.5rem;margin:1.8em 0 .4em}
  h3{font-size:1.05rem;margin:1.2em 0 .3em}
  p,li{max-width:var(--measure)}
  a{color:var(--accent)}
  section{padding:8px 0;border-top:1px solid var(--line);margin-top:24px}
  .card{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);
    padding:18px 20px;margin:16px 0}
  .cite{font-size:.82rem;color:var(--muted)}
  .sources li{margin:.4em 0}
  @media (max-width:820px){.wrap{grid-template-columns:1fr}nav.toc{position:static}}
  @media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
  @media print{
    nav.toc,#checkin{display:none}
    body{background:#fff;font-size:12pt}
    section{border:none}
    #start,#self-assessment{page-break-before:always}
  }
</style>
</head>
<body>
<div class="wrap">
  <nav class="toc" aria-label="Contents">
    <!-- anchor links to each section id -->
  </nav>
  <main>
    <header><h1>The Warm-Demanding Parent Playbook</h1></header>
    <section id="start"><!-- Part 0: the one idea + 8-line snapshot --></section>
    <section id="stance"><!-- Part 1: home matters (scoped), the stance, motivation (+limit), pressure --></section>
    <section id="read-your-child"><!-- Part 2: interest is built; voluntary return; working without grades --></section>
    <section id="how-talent-develops"><!-- Part 3: grandmaster, complex home, mentor relay, staged climb, psychosocial --></section>
    <section id="the-moves"><!-- Part 4: five moves + sample week + swap-these-phrases --></section>
    <section id="the-traps"><!-- Part 5: the four traps self-check --></section>
    <section id="big-questions"><!-- Part 6: deep-vs-broad, nothing/everything, quit, practice+rest, timing, screens, whole household, outside help --></section>
    <section id="when-it-gets-hard"><!-- Part 7 intro; the widget mounts at #checkin --></section>
    <section id="checkin"><!-- Task 2 fills this with the Family Check-In widget --></section>
    <section id="sources" class="sources"><!-- Part 8: §11 grouped links + honest-limits note --></section>
    <section id="self-assessment"><!-- Part 9: printable self-assessment / successful-parent outline --></section>
  </main>
</div>
</body>
</html>
```

- [ ] **Step 4: Fill the prose.** Transcribe spec §4 Parts 0–9 into the matching sections (translate any remaining jargon; strip em-dashes). Put each inline citation as a superscript/parenthetical `<a href="#sources">(Author Year)</a>`. Transcribe every §11 entry into `#sources` as `<li>claim — Author (Year). <a href="URL">link</a></li>`, grouped by the §11 subheads, and include the honest-limits note. Build the `nav.toc` links to every section id. Write the `#self-assessment` as a short checklist (stance, five moves, four traps, household-alignment), print-friendly.

- [ ] **Step 5: Run the content test, verify it passes**

Run: `pnpm --filter @gt100k/parent-guide test`
Expected: PASS (all content checks green).

- [ ] **Step 6: Commit**

```bash
git add parent-guide/index.html parent-guide/test/content.test.mjs
git commit -m "feat(parent-guide): the playbook page (all chapters, cited sources, self-assessment)"
```

---

### Task 2: The Family Check-In widget (inline, with a drift guard)

**Files:**
- Modify: `parent-guide/index.html` (fill `#checkin`, add an inline `<script>`)
- Test: `parent-guide/test/inline-parity.test.mjs`

**Interfaces:**
- Consumes: `decide` from `widget-logic.mjs` (inlined verbatim).
- Produces: a `#checkin` widget whose result element carries stable data attributes: `data-branch`, `data-risk`, `data-escalate`, `data-autonomy`, `data-structure`, `data-decouple` (so behavior is machine-checkable and matches the engine).

- [ ] **Step 1: Write the failing drift test** `parent-guide/test/inline-parity.test.mjs`

```js
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const html = readFileSync(fileURLToPath(new URL("../index.html", import.meta.url)), "utf8");
const mod = readFileSync(fileURLToPath(new URL("../widget-logic.mjs", import.meta.url)), "utf8");

// The inline widget must contain the exact decide() body from the source-of-truth module,
// so the page can never silently drift from the tested logic.
function decideBody(src) {
  const start = src.indexOf("export function decide(s) {");
  expect(start).toBeGreaterThan(-1);
  return src.slice(start + "export function decide(s) {".length).replace(/\s+/g, " ").trim().slice(0, 400);
}

describe("inline widget mirrors widget-logic.mjs", () => {
  it("embeds the source-of-truth decide() body", () => {
    const body = decideBody(mod);
    expect(html.replace(/\s+/g, " ")).toContain(body);
  });
  it("exposes machine-checkable result data attributes", () => {
    for (const attr of ["data-branch", "data-risk", "data-escalate", "data-autonomy", "data-structure", "data-decouple"]) {
      expect(html, attr).toContain(attr);
    }
  });
});
```

- [ ] **Step 2: Run it, verify it fails** (no inline widget yet).

Run: `pnpm --filter @gt100k/parent-guide test`
Expected: FAIL.

- [ ] **Step 3: Fill `#checkin`** with the widget markup: nine labeled checkbox toggles (exact question wording from spec §5.1), a "Show me what tends to help" button, and an output region `<div id="checkin-result" role="status" aria-live="polite">`. Then add an inline `<script>` at the end of `<body>` that (a) contains the **verbatim** `decide(s)` function copied from `widget-logic.mjs` (drop the `export` keyword), (b) reads the toggles into the nine-boolean object, (c) calls `decide`, (d) writes the parent-facing copy for that branch (reuse the spec §5.3 result language, offer-framed, em-dash-free) into `#checkin-result`, and (e) sets the data attributes (`data-branch`, `data-risk`, `data-escalate`, `data-autonomy`, `data-structure`, `data-decouple`) from the `decide` result. On the `elevated` and `strain` branches, the copy must include "talk to your guide or a trusted professional" and the widget must never render a score/label/verdict.

- [ ] **Step 4: Run the tests, verify they pass**

Run: `pnpm --filter @gt100k/parent-guide test`
Expected: PASS (parity + content + inline-drift all green).

- [ ] **Step 5: Commit**

```bash
git add parent-guide/index.html parent-guide/test/inline-parity.test.mjs
git commit -m "feat(parent-guide): Family Check-In widget (inline mirror of the engine, drift-guarded)"
```

---

### Task 3: Polish, verify, ship

**Files:** `parent-guide/index.html` (visual/a11y refinements); `docs/prd/passionApps.md` (note the new artifact, optional).

- [ ] **Step 1: Visual + a11y pass.** Open `parent-guide/index.html` in a browser (or a headless screenshot via the repo's Playwright loading the `file://` path). Check the visual direction (calm/editorial/warm palette, serif headings + sans body, 65–75ch measure, generous whitespace, restrained cards). Verify AA contrast on ink/muted/accent against the surface, visible focus on the widget controls, and that the widget is fully keyboard-operable.
- [ ] **Step 2: Print + JS-off check.** Print-preview: Part 0 and Part 9 print as a clean handout, the widget is hidden in print. Disable JS: all prose (Parts 0–9, Sources) is fully readable; only the interactive widget is inert.
- [ ] **Step 3: Drive the widget for the five situations** and confirm each shows the right branch (matches `assessFamily`): healthy (no toggles); low-engagement (only "little shared time"); strain (only "worn out"); rising-stakes (only "big event"); elevated (e.g., "approval rides on performance"). Confirm the elevated + strain results say "talk to your guide or a trusted professional" and no score appears.
- [ ] **Step 4: Full gate.** `pnpm --filter @gt100k/parent-guide test` green (parity 512/512, content, inline-drift). Re-confirm no em-dashes and all Sources links are well-formed.
- [ ] **Step 5: Commit + open PR**

```bash
git add -A
git commit -m "polish(parent-guide): visual + a11y + print pass; verified widget parity"
git push -u origin feat/parent-guide
gh pr create --title "feat(parent-guide): Warm-Demanding Parent Playbook (research-cited page + Family Check-In)" --body "Implements docs/superpowers/specs/2026-07-24-parent-guide-design.md. Single self-contained page; widget mirrors the family engine (exact parity test); every claim cited."
```
Merge after CI (admin override only if the CI is red for the known infra reasons and local tests are green).

## Self-Review (spec coverage)

- Spec §4 chapters (Parts 0–9) → Task 1 sections + Task 2 widget mount; §5 widget mapping/ladder → Task 0 logic + Task 2 UI (exact-parity test guarantees §5.3 fidelity, including the v1 fixes: `pressuredSpecialization` restored, no invented trigger, `decouple` on rising stakes, `structure` surfaced). §6 visual + §7 tech → HTML shell (Task 1) + Task 3 polish. §9 success criteria → the three test files + Task 3 checks. §11 Sources → Task 1 `#sources` + `content.test.mjs` coverage check.
- Placeholder scan: the only "fill from spec" steps are prose transcription of already-written spec content (not invented logic); all code (logic, tests, shell, widget contract) is complete here.
- Type/name consistency: `decide(s)` signature, the nine boolean keys, and the six result fields are identical across Task 0 (module), the parity test, Task 2 (inline copy), and the drift test.

## Snags (pre-solved)

- **Single-file vs testable widget:** logic lives in `widget-logic.mjs` (unit-tested for parity), and is inlined into the HTML with a drift test asserting the copy matches, so the page stays one double-clickable file with no import/CORS issues.
- **Parity is exhaustive:** all 512 boolean combinations are checked against the real `assessFamily`, so the widget cannot diverge from the engine.
- **No em-dashes / self-contained / citation coverage** are enforced by `content.test.mjs`, not left to vibes.
- **Guardrails:** escalating branches route to a human and the widget never renders a score/label (checked in Task 3 Step 3).
