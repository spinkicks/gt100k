# Discovery Wall Icon Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 44 AI-generated `.webp` pursuit tiles on the Discovery Wall with bright, clear, bespoke flat-SVG "Bold Sticker" icons, while keeping the measurement rule that no tile may out-shine another.

**Architecture:** Icons are hand-authored SVGs drawn from a locked, equal-lightness/equal-chroma palette on one navy stroke — so uniformity holds *by construction*. They are authored into a staging source dir, checked by a palette-conformance + color-energy guard, then moved into `public/pursuits/` and served directly (`<img src=".svg">`) on a warm-white card. The old raster pipeline (`build-art.mjs`, ImageMagick, the luminance test) is retired.

**Tech Stack:** Next.js 14, React 18, TypeScript, vitest, `sharp` (SVG raster for the guard, already used by `tinker-cabin`), `playwright` (QA screenshots via existing `scripts/shoot.mjs`). pnpm workspace.

## Global Constraints

- **Package manager:** pnpm. Run app-scoped commands as `pnpm --filter @gt100k/discovery <script>`.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`). PR body ends with `Closes #<id>`.
- **No AI-generated art.** Every icon is bespoke hand-authored SVG.
- **Keep the measurement constraint.** No tile may be perceptibly brighter/prettier than another; this is enforced by palette-lock (static) + a color-energy band (rasterized), replacing the old mean-luminance test.
- **Palette-lock:** every `fill`/`stroke` in every icon SVG must be a token from `app/palette.generated.ts`; stroke width is the single locked value; no gradients, no filters, no embedded raster.
- **Canvas:** every icon is `viewBox="0 0 240 240"`, transparent background, subject centered, no `<text>`.
- **Target band:** 9–12-year-olds. Legibility beats detail; no ambiguous pairs.
- **Lanes:** default owner is `@spinkicks @f15cubing` (CODEOWNERS does not gate; `ci` does). Prefer new files; the shared files touched (`model.ts`, `browse.css`, `test/art.test.ts`) are all owned by the default owner, so no cross-lane edit.
- **Do not touch** the catalogue of 44 pursuits, the wall layout/shuffle/age-filter, the detail panel, or the cabin filter logic.

The 44 pursuit ids (source of truth: `passion/packages/pursuits/src/catalogue.ts`), in catalogue order:
`competition-maths, speedcubing, chess, go, bridge, scrabble, programming, ctf, game-jam, amateur-radio, rocketry, baking, food-preservation, knitting, pottery, woodworking, sewing, assistive-design, robotics, piano, violin, drums, guitar, singing, making-tracks, songwriting, acting, reciting, speaking-in-public, photography, drawing, stop-motion, filmmaking, comics, 3d-animation, wildlife-id, birding, asteroid-hunting, growing-plants, variable-stars, writing, podcasting, journalism, debate`

## Per-pursuit subject map (fixed so parallel drawers cannot diverge)

| id | subject to draw |
|---|---|
| competition-maths | a card/worksheet showing a bold equation (e.g. `x²`) with a small spark |
| speedcubing | a Rubik's-style cube caught mid-turn (one layer rotated) |
| chess | a chess knight piece *(gold master)* |
| go | a Go board corner with black and white stones |
| bridge | a fanned hand of playing cards with suit pips |
| scrabble | two lettered tiles crossing to form a short word |
| programming | a screen/terminal showing `</>` and a cursor line |
| ctf | a padlock with a small pennant flag on top |
| game-jam | a game controller with a clock/spark |
| amateur-radio | a radio set with an antenna emitting a wave arc |
| rocketry | a small finned rocket with a flame |
| baking | a round scored loaf of bread |
| food-preservation | a sealed mason jar with fruit inside |
| knitting | a ball of yarn with two crossed needles |
| pottery | a thrown vase/pot |
| woodworking | a plank with a hand saw |
| sewing | a spool of thread with a threaded needle |
| assistive-design | an open hand cradling a small gadget with a heart spark |
| robotics | a friendly little robot *(gold master)* |
| piano | piano keys / small keyboard *(gold master)* |
| violin | a violin with a bow |
| drums | a drum with crossed sticks |
| guitar | an acoustic guitar (body + neck) |
| singing | a microphone with two music notes |
| making-tracks | a waveform with a mixer slider |
| songwriting | a notebook page with a music note and a pencil |
| acting | a theatre mask |
| reciting | an open book with a small sound arc |
| speaking-in-public | a lectern/podium with a microphone |
| photography | a camera |
| drawing | a pencil drawing a wavy line with a star |
| stop-motion | a posable figure mid-step with a dotted motion path |
| filmmaking | a clapperboard |
| comics | a 4-panel grid with a "!" speech bubble |
| 3d-animation | a solid rounded 3D shape with rotation arrows |
| wildlife-id | a magnifying glass over a paw print |
| birding | a songbird *(gold master)* |
| asteroid-hunting | a telescope on a tripod with a streaking rock |
| growing-plants | a potted seedling |
| variable-stars | a star beside a small up-and-down brightness graph |
| writing | a sheet of paper with a pen and a story swirl |
| podcasting | a microphone with headphones |
| journalism | a folded newspaper with a headline |
| debate | two opposing speech bubbles (one filled, one navy-outlined white) |

Ambiguity guards (drawers must honor): microphone appears in three subjects — `singing` = mic + notes, `podcasting` = mic + headphones, `speaking-in-public` = mic on a lectern. Books appear in two — `reciting` = book + sound arc, `writing` = loose paper + pen. Speech bubbles appear in two — `comics` = panel grid, `debate` = two facing bubbles.

## File structure

- **Create** `passion/apps/discovery/scripts/gen-palette.mjs` — self-contained OKLCH→sRGB generator; prints `app/palette.generated.ts`.
- **Create** `passion/apps/discovery/app/palette.generated.ts` — frozen palette (`FILLS`, `STROKE`, `HIGHLIGHT`, `STROKE_WIDTH`). Generated, committed.
- **Create** `passion/apps/discovery/test/palette.test.ts` — unit test for the palette shape.
- **Create** `passion/apps/discovery/app/pursuit-icons/<id>.svg` × 44 — staging source SVGs (moved to `public/` at integration).
- **Create** `passion/apps/discovery/test/icon-conformance.ts` — shared helpers: `listIconSvgs(dir)`, `parseColors(svg)`, `assertConformant(svg)`, `energyOf(svgPath)`.
- **Create** `passion/apps/discovery/test/icon-conformance.test.ts` — palette-conformance over the staging dir (runs during authoring).
- **Create** `docs/superpowers/specs/icon-authoring-brief.md` — the one-page brief every drawer reads.
- **Modify** `passion/apps/discovery/app/model.ts:48-50` — `artFor` → `.svg`.
- **Modify** `passion/apps/discovery/app/browse.css:377-391` — `.tile__art` to `object-fit: contain` on a warm-white card.
- **Rewrite** `passion/apps/discovery/test/art.test.ts` — completeness + orphans + size + palette + energy over `public/pursuits/*.svg`.
- **Delete** `passion/apps/discovery/test/icon-conformance.test.ts` (staging-dir test; role subsumed by the rewritten `art.test.ts` once icons live in `public/pursuits/`). The `test/icon-conformance.ts` *helper* stays — `art.test.ts` imports it.
- **Delete** `passion/apps/discovery/scripts/build-art.mjs`, `passion/apps/discovery/scripts/imagemagick.mjs`, all `public/pursuits/*.webp`, and the `build-art` package script.
- **Modify** `passion/apps/discovery/package.json` — add `sharp` devDep; drop `build-art` script.

---

### Task 1: Locked palette module

**Files:**
- Create: `passion/apps/discovery/scripts/gen-palette.mjs`
- Create: `passion/apps/discovery/app/palette.generated.ts` (generator output, committed)
- Test: `passion/apps/discovery/test/palette.test.ts`

**Interfaces:**
- Produces: `app/palette.generated.ts` exporting
  `export const STROKE = "#002a3a";`
  `export const HIGHLIGHT = "#fcf4ef";`
  `export const STROKE_WIDTH = 9;`
  `export const FILLS: readonly string[]` — 8 lowercase `#rrggbb` hex, all at OKLCH `L=0.72, C=0.13`, hues `[25,60,110,150,200,255,300,340]`.
  `export const ALLOWED_FILLS: ReadonlySet<string>` — `FILLS` ∪ `{ "#ffffff", HIGHLIGHT }`.

- [ ] **Step 1: Write the failing test**

```ts
// passion/apps/discovery/test/palette.test.ts
import { describe, expect, it } from "vitest";
import { FILLS, STROKE, STROKE_WIDTH, ALLOWED_FILLS, HIGHLIGHT } from "../app/palette.generated";

describe("locked palette", () => {
  it("has 8 distinct 6-digit hex fills", () => {
    expect(FILLS).toHaveLength(8);
    for (const c of FILLS) expect(c).toMatch(/^#[0-9a-f]{6}$/);
    expect(new Set(FILLS).size).toBe(8);
  });
  it("exposes a single navy stroke and width", () => {
    expect(STROKE).toBe("#002a3a");
    expect(STROKE_WIDTH).toBe(9);
  });
  it("allows the fills plus white and the off-white highlight", () => {
    expect(ALLOWED_FILLS.has("#ffffff")).toBe(true);
    expect(ALLOWED_FILLS.has(HIGHLIGHT)).toBe(true);
    for (const c of FILLS) expect(ALLOWED_FILLS.has(c)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @gt100k/discovery test -- palette`
Expected: FAIL — cannot resolve `../app/palette.generated`.

- [ ] **Step 3: Write the generator**

```js
// passion/apps/discovery/scripts/gen-palette.mjs
// Emits app/palette.generated.ts: 8 fills at a single OKLCH lightness+chroma, hues rotated.
// Equal L and C is the whole measurement point — only hue changes, so no fill is "brighter".
// Self-contained OKLCH -> linear sRGB -> gamma, no dependency.
const L = 0.72, C = 0.13, HUES = [25, 60, 110, 150, 200, 255, 300, 340];

function oklchToRgb(l, c, hDeg) {
  const h = (hDeg * Math.PI) / 180;
  const a = c * Math.cos(h), b = c * Math.sin(h);
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b;
  const [L3, M3, S3] = [l_ ** 3, m_ ** 3, s_ ** 3];
  const lin = [
    +4.0767416621 * L3 - 3.3077115913 * M3 + 0.2309699292 * S3,
    -1.2684380046 * L3 + 2.6097574011 * M3 - 0.3413193965 * S3,
    -0.0041960863 * L3 - 0.7034186147 * M3 + 1.7076147010 * S3,
  ];
  const g = (x) => {
    const v = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
    return Math.max(0, Math.min(1, v));
  };
  return lin.map((x) => Math.round(g(x) * 255));
}
const hex = ([r, g, b]) =>
  "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
const fills = HUES.map((h) => hex(oklchToRgb(L, C, h)));

process.stdout.write(
  `// GENERATED by scripts/gen-palette.mjs — do not edit by hand.\n` +
    `// 8 fills at OKLCH L=${L} C=${C}, hues ${JSON.stringify(HUES)}.\n` +
    `export const STROKE = "#002a3a";\n` +
    `export const HIGHLIGHT = "#fcf4ef";\n` +
    `export const STROKE_WIDTH = 9;\n` +
    `export const FILLS = ${JSON.stringify(fills)} as const;\n` +
    `export const ALLOWED_FILLS: ReadonlySet<string> = new Set([...FILLS, "#ffffff", HIGHLIGHT]);\n`,
);
```

- [ ] **Step 4: Generate and commit the palette module**

Run: `cd passion/apps/discovery && node scripts/gen-palette.mjs > app/palette.generated.ts && cd -`
Then verify it is well-formed TS: `pnpm --filter @gt100k/discovery typecheck`
Expected: `app/palette.generated.ts` exists with 8 fills; typecheck passes.

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @gt100k/discovery test -- palette`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add passion/apps/discovery/scripts/gen-palette.mjs passion/apps/discovery/app/palette.generated.ts passion/apps/discovery/test/palette.test.ts
git commit -m "feat(discovery): add locked equal-lightness icon palette"
```

---

### Task 2: Conformance guard + authoring brief + gold-master icons

**Files:**
- Create: `passion/apps/discovery/test/icon-conformance.ts`
- Create: `passion/apps/discovery/test/icon-conformance.test.ts`
- Create: `docs/superpowers/specs/icon-authoring-brief.md`
- Create: `passion/apps/discovery/app/pursuit-icons/{chess,piano,birding,robotics}.svg`

**Interfaces:**
- Consumes: `FILLS, STROKE, STROKE_WIDTH, ALLOWED_FILLS` from `app/palette.generated.ts` (Task 1).
- Produces: helper API relied on by Tasks 3–8 and Task 10:
  `listIconSvgs(dir: string): string[]` — absolute paths to `*.svg` in `dir`.
  `parseColors(svg: string): { fills: string[]; strokes: string[]; strokeWidths: number[] }` — lowercased hex, from `fill="…"`, `stroke="…"`, `stroke-width="…"` attributes.
  `assertConformant(svgText: string): string[]` — returns an array of human-readable violations (empty = OK).

- [ ] **Step 1: Write the failing test**

```ts
// passion/apps/discovery/test/icon-conformance.test.ts
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { assertConformant, listIconSvgs } from "./icon-conformance";

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), "..", "app", "pursuit-icons");

describe("every staged icon conforms to the locked style", () => {
  const svgs = listIconSvgs(SRC);
  it("finds staged icons", () => {
    expect(svgs.length).toBeGreaterThan(0);
  });
  it.each(svgs)("%s uses only palette colors and the locked stroke", (path) => {
    expect(assertConformant(readFileSync(path, "utf8"))).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @gt100k/discovery test -- icon-conformance`
Expected: FAIL — cannot resolve `./icon-conformance`.

- [ ] **Step 3: Write the conformance helper**

```ts
// passion/apps/discovery/test/icon-conformance.ts
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { ALLOWED_FILLS, STROKE, STROKE_WIDTH } from "../app/palette.generated";

export function listIconSvgs(dir: string): string[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".svg"))
    .sort()
    .map((f) => join(dir, f));
}

export function parseColors(svg: string): {
  fills: string[];
  strokes: string[];
  strokeWidths: number[];
} {
  const grab = (re: RegExp) => [...svg.matchAll(re)].map((m) => m[1]);
  const fills = grab(/fill="([^"]+)"/g).map((c) => c.toLowerCase());
  const strokes = grab(/stroke="([^"]+)"/g).map((c) => c.toLowerCase());
  const strokeWidths = grab(/stroke-width="([^"]+)"/g).map(Number);
  return { fills, strokes, strokeWidths };
}

// Colors that are never a "loudness" confound.
const NEUTRAL = new Set(["none", "transparent", STROKE.toLowerCase()]);

export function assertConformant(svgText: string): string[] {
  const problems: string[] = [];
  if (/<image\b/i.test(svgText)) problems.push("embeds a raster <image>");
  if (/(linear|radial)Gradient|filter=|url\(#/i.test(svgText))
    problems.push("uses a gradient or filter");
  if (/<text\b/i.test(svgText)) problems.push("contains <text>");
  if (!/viewBox="0 0 240 240"/.test(svgText)) problems.push("viewBox is not 0 0 240 240");

  const { fills, strokes, strokeWidths } = parseColors(svgText);
  for (const f of fills)
    if (!ALLOWED_FILLS.has(f) && !NEUTRAL.has(f)) problems.push(`fill ${f} not in palette`);
  for (const s of strokes)
    if (!NEUTRAL.has(s) && s !== STROKE.toLowerCase()) problems.push(`stroke ${s} is not the locked navy`);
  for (const w of strokeWidths)
    if (w !== STROKE_WIDTH) problems.push(`stroke-width ${w} is not ${STROKE_WIDTH}`);
  return problems;
}
```

- [ ] **Step 4: Write the authoring brief**

Create `docs/superpowers/specs/icon-authoring-brief.md` with this content:

```markdown
# Discovery Wall icon authoring brief

Draw one flat-SVG icon per pursuit, "Bold Sticker" style. Read this in full.

- Canvas: `<svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg">`. Transparent
  background (no background rect). Subject centered, filling ~80% of the canvas.
- Outline: every shape edge is stroked with the locked navy `#002a3a`, `stroke-width="9"`,
  `stroke-linecap="round"`, `stroke-linejoin="round"`. No other stroke color or width.
- Fills: flat only, and ONLY the hex values exported in `app/palette.generated.ts` (the 8 `FILLS`,
  plus `#ffffff` and the off-white `#fcf4ef` for highlights/eyes). Never invent a color.
- Forbidden: gradients, filters, `<text>`, embedded `<image>`, drop shadows, 3D shading.
- One subject, instantly legible to a 9–12-year-old — the fixed subject is in the plan's subject map.
- Living things may carry a simple friendly eye. Keep ink weight even across the icon so it does not
  read as louder than its neighbours.
- Validate before finishing: `pnpm --filter @gt100k/discovery test -- icon-conformance` must pass.
```

- [ ] **Step 5: Draw the four gold-master icons**

Refine the four approved Style-A samples (available at `$CLAUDE_JOB_DIR/tmp/styles/A/{chess,piano,birding,robotics}.svg`) so every color is a `palette.generated.ts` token and every stroke is width 9 navy. Write them to `passion/apps/discovery/app/pursuit-icons/{chess,piano,birding,robotics}.svg`. These are the canonical reference for all later drawers.

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm --filter @gt100k/discovery test -- icon-conformance`
Expected: PASS — 4 icons found, all conformant.

- [ ] **Step 7: Commit**

```bash
git add passion/apps/discovery/test/icon-conformance.ts passion/apps/discovery/test/icon-conformance.test.ts docs/superpowers/specs/icon-authoring-brief.md passion/apps/discovery/app/pursuit-icons
git commit -m "feat(discovery): add icon conformance guard, brief, and gold masters"
```

---

## Batch Authoring Procedure (shared by Tasks 3–8)

Each batch task draws the icons for its id list and is fully independent (disjoint files), so the six batches may run in parallel. For a batch:

1. Read `docs/superpowers/specs/icon-authoring-brief.md`, `app/palette.generated.ts`, and the four gold masters in `app/pursuit-icons/` for reference.
2. For each id in the batch, draw its subject from the plan's subject map as a `viewBox="0 0 240 240"` SVG and write it to `passion/apps/discovery/app/pursuit-icons/<id>.svg`.
3. Run `pnpm --filter @gt100k/discovery test -- icon-conformance`. Expected: PASS for all present icons (the batch's plus any already committed). Fix any reported violation before continuing.
4. Commit: `git add passion/apps/discovery/app/pursuit-icons && git commit -m "feat(discovery): draw <cabin> pursuit icons"`.

Each batch's deliverable is its conformant SVGs with the conformance test green.

### Task 3: Icons — Puzzles, Games & Code (batch)
Ids: `competition-maths, speedcubing, go, bridge, scrabble, programming, ctf, game-jam`. Follow the Batch Authoring Procedure.

### Task 4: Icons — Making & Building (batch)
Ids: `amateur-radio, rocketry, baking, food-preservation, knitting, pottery, woodworking, sewing, assistive-design`. Follow the Batch Authoring Procedure.

### Task 5: Icons — Music & Sound (batch)
Ids: `violin, drums, guitar, singing, making-tracks, songwriting`. Follow the Batch Authoring Procedure.

### Task 6: Icons — Art & Animation (batch)
Ids: `acting, reciting, photography, drawing, stop-motion, filmmaking, comics, 3d-animation`. Follow the Batch Authoring Procedure.

### Task 7: Icons — Science & Nature (batch)
Ids: `wildlife-id, asteroid-hunting, growing-plants, variable-stars`. Follow the Batch Authoring Procedure.

### Task 8: Icons — Words & Persuasion (batch)
Ids: `speaking-in-public, writing, podcasting, journalism, debate`. Follow the Batch Authoring Procedure.

*(Ids across Tasks 2–8 sum to 44: 4 + 8 + 9 + 6 + 8 + 4 + 5 = 44.)*

---

### Task 9: Color-energy normalization pass

**Files:**
- Modify: `passion/apps/discovery/package.json` (add `sharp` devDep)
- Modify: `passion/apps/discovery/test/icon-conformance.ts` (add `energyOf`)
- Modify: any `app/pursuit-icons/<id>.svg` that is an energy outlier

**Interfaces:**
- Produces: `energyOf(svgPath: string): Promise<number>` — rasterizes the SVG at 240×240 on transparent, returns `meanSaturation × coverage` over opaque pixels; relied on by Task 10's guard.

- [ ] **Step 1: Add sharp**

Run: `pnpm --filter @gt100k/discovery add -D sharp@^0.33.5`
Expected: `sharp` appears in the app's devDependencies.

- [ ] **Step 2: Write the failing test (energy spread)**

Append to `passion/apps/discovery/test/icon-conformance.test.ts`:

```ts
import { energyOf } from "./icon-conformance";

describe("no staged icon is louder than another", () => {
  it("holds color-energy spread within 1.6x", async () => {
    const svgs = listIconSvgs(SRC);
    const energies = await Promise.all(svgs.map(energyOf));
    expect(Math.max(...energies) / Math.min(...energies)).toBeLessThan(1.6);
  });
});
```

- [ ] **Step 2b: Run to verify it fails**

Run: `pnpm --filter @gt100k/discovery test -- icon-conformance`
Expected: FAIL — `energyOf` is not exported.

- [ ] **Step 3: Implement `energyOf`**

Append to `passion/apps/discovery/test/icon-conformance.ts`:

```ts
import sharp from "sharp";

export async function energyOf(svgPath: string): Promise<number> {
  const { data, info } = await sharp(svgPath, { density: 144 })
    .resize(240, 240, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });
  const px = info.width * info.height;
  let covered = 0;
  let satSum = 0;
  for (let i = 0; i < px; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2], a = data[i * 4 + 3];
    if (a < 32) continue; // transparent: not part of the subject
    covered++;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    satSum += max === 0 ? 0 : (max - min) / max; // sRGB saturation, 0..1
  }
  if (covered === 0) return 0;
  return (satSum / covered) * (covered / px); // mean saturation × coverage
}
```

- [ ] **Step 4: Run the energy test; normalize outliers**

Run: `pnpm --filter @gt100k/discovery test -- icon-conformance`
If it FAILS on the spread: identify the highest- and lowest-energy icons (temporarily `console.log` the `svgs.map`/`energies` pairs), then adjust the outliers toward the median — a too-loud icon usually over-uses a high-saturation fill over a large area (swap some area to `#ffffff`/`#fcf4ef` or a calmer palette hue); a too-quiet icon is mostly white (give it more palette-fill coverage). Re-run until PASS. All fills must remain palette tokens (the conformance test still guards this).
Expected: PASS — spread < 1.6.

- [ ] **Step 5: Commit**

```bash
git add passion/apps/discovery/package.json passion/apps/discovery/pnpm-lock.yaml passion/apps/discovery/test/icon-conformance.ts passion/apps/discovery/test/icon-conformance.test.ts passion/apps/discovery/app/pursuit-icons
git commit -m "feat(discovery): normalize icon color-energy within band"
```
*(If the lockfile updates at the workspace root instead, add the root `pnpm-lock.yaml`.)*

---

### Task 10: Integrate into the wall and retire the raster pipeline

**Files:**
- Modify: `passion/apps/discovery/app/model.ts:48-50`
- Modify: `passion/apps/discovery/app/browse.css:377-391`
- Move: `app/pursuit-icons/*.svg` → `public/pursuits/*.svg` (git mv)
- Rewrite: `passion/apps/discovery/test/art.test.ts`
- Delete: `scripts/build-art.mjs`, `scripts/imagemagick.mjs`, `public/pursuits/*.webp`
- Modify: `passion/apps/discovery/package.json` (drop `build-art` script)

**Interfaces:**
- Consumes: `listIconSvgs`, `assertConformant`, `energyOf` from `test/icon-conformance.ts`; `PURSUITS` from `@gt100k/pursuits`.

- [ ] **Step 1: Move icons into public and delete the old tiles**

```bash
cd passion/apps/discovery
git mv app/pursuit-icons/*.svg public/pursuits/
git rm public/pursuits/*.webp
git rm scripts/build-art.mjs scripts/imagemagick.mjs
cd -
```
Then remove the `"build-art": "node scripts/build-art.mjs",` line from `passion/apps/discovery/package.json`.

Also delete the now-redundant staging-dir test (its coverage moves into `art.test.ts` in Step 4, which checks the shipped `public/pursuits/`):
```bash
git rm passion/apps/discovery/test/icon-conformance.test.ts
```
Keep `passion/apps/discovery/test/icon-conformance.ts` — `art.test.ts` imports `listIconSvgs`, `assertConformant`, and `energyOf` from it.

- [ ] **Step 2: Point `artFor` at SVG**

In `passion/apps/discovery/app/model.ts`, change the body of `artFor` (line 49) from
`return `/pursuits/${p.id}.webp`;` to `return `/pursuits/${p.id}.svg`;`
and update the two lines of doc comment above it that say "Built by `scripts/build-art.mjs`" to reference the palette + conformance guard instead.

- [ ] **Step 3: Flip the tile art box to a warm-white card**

In `passion/apps/discovery/app/browse.css`, replace the `.tile__art` rule (lines 377–391) with:

```css
.tile__art {
  width: 100%;
  height: auto;
  aspect-ratio: 3 / 2;
  display: block;
  /* Square icons on a wider card: contain (never cover) so nothing is cropped, centered with
     side margins that read as a framed sticker. */
  object-fit: contain;
  object-position: 50% 50%;
  padding: 10px;
  box-sizing: border-box;
  /* Was #1c1510 for dark renders; the flat icons sit on one warm-white card so no tile's
     background can out-shine another. */
  background: #ffffff;
}
```

- [ ] **Step 4: Rewrite the art guard for SVG**

Replace `passion/apps/discovery/test/art.test.ts` entirely with:

```ts
// The wall's art must be complete, on-palette, and uniform, and none of that is visible from code.
// This checks the shipped files in public/pursuits: one SVG per pursuit, no orphans, on-palette,
// small, and within the color-energy band that replaces the old luminance rule.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PURSUITS } from "@gt100k/pursuits";
import { describe, expect, it } from "vitest";
import { assertConformant, energyOf, listIconSvgs } from "./icon-conformance";

const ART = resolve(dirname(fileURLToPath(import.meta.url)), "..", "public", "pursuits");
const files = readdirSync(ART);

describe("every pursuit has a tile", () => {
  it("has one svg per pursuit", () => {
    const missing = PURSUITS.filter((p) => !files.includes(`${p.id}.svg`)).map((p) => p.id);
    expect(missing).toEqual([]);
  });
  it("has no tile for a pursuit that no longer exists", () => {
    const ids = new Set(PURSUITS.map((p) => p.id));
    const orphans = files.filter((f) => !ids.has(f.replace(/\.svg$/, "")));
    expect(orphans).toEqual([]);
  });
  it("keeps every tile small enough to send forty-four at once", () => {
    for (const p of PURSUITS)
      expect(statSync(join(ART, `${p.id}.svg`)).size).toBeLessThan(15_000);
  });
});

describe("no tile is prettier than another", () => {
  it("uses only the locked palette and stroke", () => {
    for (const p of PURSUITS)
      expect(assertConformant(readFileSync(join(ART, `${p.id}.svg`), "utf8"))).toEqual([]);
  });
  it("holds color-energy spread within 1.6x", async () => {
    const energies = await Promise.all(PURSUITS.map((p) => energyOf(join(ART, `${p.id}.svg`))));
    expect(Math.max(...energies) / Math.min(...energies)).toBeLessThan(1.6);
  });
});
```

- [ ] **Step 5: Grep for any leftover `.webp` / render references**

Run: `grep -rn "\.webp\|build-art\|imagemagick" passion/apps/discovery/app passion/apps/discovery/test`
Expected: no references to `pursuits/*.webp` or the removed scripts remain in app or test code. Fix any (e.g. `gallery/page.tsx`) to use `artFor`/`.svg`. `paper-ground.webp` is the wall background and is unrelated — leave it.

- [ ] **Step 6: Run the full app gates**

Run:
```
pnpm --filter @gt100k/discovery test
pnpm --filter @gt100k/discovery typecheck
pnpm lint
```
Expected: all PASS. (`art.test.ts` now asserts completeness + palette + energy over the 44 SVGs.)

- [ ] **Step 7: Visual QA against the live wall**

Run:
```
pnpm --filter @gt100k/discovery dev &
# wait for "Ready" on http://localhost:3080
node passion/apps/discovery/scripts/shoot.mjs http://localhost:3080/ /tmp/wall-rest.png 1440 900
node passion/apps/discovery/scripts/shoot.mjs http://localhost:3080/ /tmp/wall-names.png 1440 900 "9-11" ".tile"
```
Read `/tmp/wall-rest.png` and `/tmp/wall-names.png`. Confirm: every tile shows its icon (no gaps), icons read clearly at tile size, no single tile visibly pops, and names overlay legibly. `shoot.mjs` also prints fit/overflow/missing-image problems — expect none. Kill the dev server when done.

- [ ] **Step 8: Commit**

```bash
git add -A passion/apps/discovery
git commit -m "feat(discovery): serve bespoke SVG icons and retire the raster pipeline"
```

---

### Task 11: Finish the branch and open the PR

- [ ] **Step 1: Rename the branch to the lane convention**

Run: `git branch -m dev/prd/discovery-wall-icons`

- [ ] **Step 2: Rebase on latest main and re-run gates**

```bash
git fetch origin
git rebase origin/main
pnpm --filter @gt100k/discovery test && pnpm --filter @gt100k/discovery typecheck && pnpm lint
```
Expected: clean rebase, all gates green. Resolve conflicts if the catalogue changed (add/remove an SVG so completeness holds).

- [ ] **Step 3: Push and open a draft PR as the operator**

```bash
git push -u origin dev/prd/discovery-wall-icons
gh pr create --draft --title "Bright, child-friendly SVG icons for the Discovery Wall" \
  --body "$(cat <<'EOF'
Replaces the 44 AI-generated .webp pursuit tiles with bespoke flat "Bold Sticker" SVG icons.

- Bright, clear, child-friendly; no AI art.
- Uniformity kept by construction: one navy stroke + a locked equal-lightness/equal-chroma fill
  palette, on one warm-white card. The old mean-luminance test is replaced by a palette-conformance
  + color-energy guard (see docs/superpowers/specs/2026-08-04-discovery-wall-icons-design.md).
- Retires scripts/build-art.mjs + ImageMagick.

Spec: docs/superpowers/specs/2026-08-04-discovery-wall-icons-design.md
Plan: docs/superpowers/plans/2026-08-04-discovery-wall-icons.md

Closes #<id>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
Attach the two QA screenshots to the PR. Fill `#<id>` with the tracking issue (create one with `gh issue create` if none exists).

---

## Self-Review

**Spec coverage:**
- Style "Bold Sticker" rules → Task 2 brief + gold masters; enforced by conformance guard.
- Equal-brightness by construction (locked OKLCH palette, single stroke, uniform card) → Task 1 palette, Task 10 CSS card.
- New CI guard (palette-conformance + color-energy, replacing luminance; ported completeness/orphan/size) → Tasks 2, 9, 10.
- SVG served directly + `artFor` `.svg` + card CSS → Task 10.
- Retire `build-art.mjs` + `.webp` → Task 10.
- Per-pursuit subject map (ambiguity fixed once) → subject map table; drawn in Tasks 2–8.
- Parallel production → Tasks 3–8 (disjoint files, shared procedure).
- CODEOWNERS/lane note → Global Constraints.
- Success criteria (all 44, no AI art, legible, guard green, gates green) → Tasks 10 (gates + visual QA) and 11.

**Placeholder scan:** No "TBD"/"handle edge cases". `#<id>` in the PR is an intentional runtime value with an instruction to fill it. The palette hex are produced by the committed generator in Task 1 Step 4 (deterministic), not left blank.

**Type consistency:** `listIconSvgs`, `parseColors`, `assertConformant`, `energyOf` are defined in `test/icon-conformance.ts` (Tasks 2, 9) and consumed with matching signatures in Task 10's `art.test.ts`. `FILLS`/`STROKE`/`STROKE_WIDTH`/`ALLOWED_FILLS`/`HIGHLIGHT` are defined in Task 1 and consumed unchanged in Task 2. The 44 ids partition exactly across Tasks 2–8.
