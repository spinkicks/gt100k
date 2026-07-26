// The Overview dashboard's derivations (app/overview.ts). These run headless over the same synthetic
// roster the app renders, so they check the real numbers a guide will see — and, just as importantly,
// that a chart never renders with data it cannot draw (NaN axis, zero denominator, 0% donut slice).
import { describe, expect, test } from "vitest";
import { consoleViewModel, type HypothesisCard } from "@gt100k/hypothesis-store";
import { buildRosterGates, buildRosterStore, CHILDREN } from "../app/console-data.js";
import { wellbeingForKid } from "../app/wellbeing.js";
import { buildOverview, type Overview } from "../app/overview.js";

const store = buildRosterStore();
const gates = buildRosterGates(store);

function cardsFor(kidId: string): readonly HypothesisCard[] {
  return consoleViewModel(store, kidId, gates).cards;
}

function overviewFor(kidId: string): Overview {
  return buildOverview(kidId, cardsFor(kidId), wellbeingForKid(kidId));
}

const ARI = "kid-synthetic-001";
const BEX = "kid-synthetic-002";
const CYRUS = "kid-synthetic-003";
const DULCE = "kid-synthetic-004";

describe("every child renders something drawable or an honest empty state", () => {
  for (const child of CHILDREN) {
    test(child.name, () => {
      const ov = overviewFor(child.id);

      for (const t of ov.tiles) {
        expect(t.value).not.toMatch(/NaN|Infinity|undefined/);
        expect(t.context).not.toMatch(/NaN|Infinity|undefined/);
        if (t.trend) expect(t.trend.label).not.toMatch(/NaN|Infinity/);
        // A sparkline the Spark primitive cannot draw meaningfully is omitted, not faked.
        if (t.spark) {
          expect(t.spark.length).toBeGreaterThanOrEqual(2);
          expect(new Set(t.spark).size).toBeGreaterThan(1);
          expect(t.spark.every(Number.isFinite)).toBe(true);
        }
      }

      // AreaChart / BarChart divide by (labels.length - 1) and by the series max, so both must be safe.
      for (const s of [ov.returns, ov.engagement]) {
        if (!s.ok) {
          expect(s.reason.length).toBeGreaterThan(0);
          continue;
        }
        expect(s.labels.length).toBeGreaterThanOrEqual(2);
        expect(s.a).toHaveLength(s.labels.length);
        expect(s.b).toHaveLength(s.labels.length);
        expect(Math.max(...s.a, ...s.b)).toBeGreaterThan(0);
        expect([...s.a, ...s.b].every(Number.isFinite)).toBe(true);
      }

      // Donut divides by the slice total, and a 0% wedge draws nothing.
      if (ov.share.ok) {
        expect(ov.share.slices.length).toBeGreaterThan(0);
        expect(ov.share.slices.every((s) => s.percent > 0)).toBe(true);
        expect(ov.share.slices.reduce((a, s) => a + s.percent, 0)).toBe(100);
      } else {
        expect(ov.share.reason.length).toBeGreaterThan(0);
      }

      // Every colour-coded status carries a text label.
      expect(ov.wellbeing.badge.length).toBeGreaterThan(0);
      for (const c of ov.wellbeing.checks) expect(c.value.length).toBeGreaterThan(0);
      for (const r of ov.rows) {
        expect(r.statusLabel.length).toBeGreaterThan(0);
        expect(Number.isFinite(r.confidence)).toBe(true);
        expect(r.confidence).toBeGreaterThanOrEqual(0);
        expect(r.confidence).toBeLessThanOrEqual(100);
      }
    });
  }
});

test("derives Ari's headline numbers from the interaction log", () => {
  const ov = overviewFor(ARI);
  // 14 audio visits (one first exposure, three gate-spread returns, a ten-visit March run) plus
  // three dance visits. The March run grew from five to ten under E6 — a cell only reads
  // confident on six units of mass across two distinct days now, and five half-decayed returns
  // do not carry that.
  expect(ov.events).toBe(17);
  const by = new Map(ov.tiles.map((t) => [t.key, t]));
  expect(by.get("voluntary")?.value).toBe("16"); // only the prompted dance visit is not
  expect(by.get("depth")?.value).toBe("1");
  expect(by.get("sessions")?.value).toBe("17");
  expect(by.get("coverage")?.context).toBe("2 of 11 areas we can observe");
  // Second half of the observed window against the first: 5 voluntary returns became 11.
  expect(by.get("voluntary")?.trend).toEqual({
    dir: "up",
    label: "+120%",
    aria: "Voluntary returns up 120 percent versus the previous period",
  });
  // Dec / Jan / Feb / Mar, with February's real zero left in rather than skipped.
  expect(ov.returns.ok).toBe(true);
  expect(ov.returns.labels).toEqual(["Dec", "Jan", "Feb", "Mar"]);
  expect(ov.returns.a).toEqual([3, 2, 0, 11]);
  expect(ov.returns.b).toEqual([0, 0, 0, 1]);
  // 14 of 17 visits is 82.35%, apportioned by largest remainder so the legend sums to 100.
  expect(ov.share.slices.map((s) => [s.label, s.percent])).toEqual([
    ["Music & Sound", 82],
    ["Art & Motion", 18],
  ]);
});

test("omits a trend chip rather than inventing one when there is nothing to compare against", () => {
  const depth = overviewFor(ARI).tiles.find((t) => t.key === "depth");
  // Ari's single depth signal has no counterpart in the earlier half, so no percentage exists.
  expect(depth?.value).toBe("1");
  expect(depth?.trend).toBeNull();
});

test("weekly engagement counts distinct sessions and depth signals per week", () => {
  const ov = overviewFor(BEX);
  expect(ov.engagement.ok).toBe(true);
  expect(ov.engagement.labels).toHaveLength(8);
  // Weeks beginning Feb 9 … Mar 30. Bex's chess and python runs both step every other day
  // through March, so the two cells contribute a session each on the same dates.
  expect(ov.engagement.a).toEqual([0, 0, 0, 1, 4, 6, 8, 2]);
  expect(ov.engagement.b).toEqual([0, 0, 0, 0, 0, 0, 0, 2]);
});

describe("the sparse child (003 Cyrus) reads as intentional, not broken", () => {
  test("thin trends fall back to an explained empty state", () => {
    const ov = overviewFor(CYRUS);
    expect(ov.events).toBe(4);
    expect(ov.returns.ok).toBe(false);
    expect(ov.returns.reason).toMatch(/Only 4 visits/);
    expect(ov.engagement.ok).toBe(false);
    expect(ov.engagement.reason).toMatch(/only one of the last eight weeks/);
  });

  test("what can still be said honestly is still said", () => {
    const ov = overviewFor(CYRUS);
    // Two areas, evenly split, out of four logged visits — no time axis needed to state that.
    expect(ov.share.ok).toBe(true);
    expect(ov.share.slices.map((s) => s.percent)).toEqual([50, 50]);
    const voluntary = ov.tiles.find((t) => t.key === "voluntary");
    // He came twice on his own early on and not once since; both later visits were prompted.
    expect(voluntary?.value).toBe("2");
    expect(voluntary?.trend?.dir).toBe("down");
    expect(voluntary?.trend?.label).toBe("\u2212100%");
    // No depth signals at all: no number to trend and no line to draw.
    const depth = ov.tiles.find((t) => t.key === "depth");
    expect(depth?.value).toBe("0");
    expect(depth?.spark).toBeNull();
    expect(depth?.trend).toBeNull();
  });
});

test("row status is derived at the view layer from wellbeing and calibration", () => {
  const rows = overviewFor(DULCE).rows;
  const cards = cardsFor(DULCE);
  for (const r of rows) {
    const card = cards[r.index]!;
    expect(r.confidence).toBe(Math.round(card.lowerBound * 100));
    const escalates =
      wellbeingForKid(DULCE).find((w) => w.id === card.id)?.read.escalateToHuman ?? false;
    const expected = escalates ? "bad" : card.confident ? "good" : "warn";
    expect(r.status).toBe(expected);
  }
  expect(rows.map((r) => r.statusLabel)).toEqual(["On track", "On track", "Needs review"]);
  // Bex has no escalations anywhere, so his wellbeing card says so in words.
  expect(overviewFor(BEX).wellbeing.badge).toBe("Looks steady");
});

test("deriving the overview never mutates the hypothesis cards", () => {
  const cards = cardsFor(ARI);
  const before = JSON.stringify(cards);
  buildOverview(ARI, cards, wellbeingForKid(ARI));
  expect(JSON.stringify(cards)).toBe(before);
  // Guardrails GC1/GC6: status lives on the view row, never on the data model.
  for (const card of cards) {
    expect(card).not.toHaveProperty("score");
    expect(card).not.toHaveProperty("grade");
    expect(card).not.toHaveProperty("rank");
  }
});
