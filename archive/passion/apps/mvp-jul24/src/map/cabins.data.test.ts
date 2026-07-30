import { CABINS } from "./cabins.data";

test("the map holds exactly the five cabins, in the documented order", () => {
  expect(CABINS.map((c) => c.id)).toEqual(["logic-games", "math", "music", "code", "art"]);
});

test("logic-games, math, music and code are the active cabins; art is coming soon", () => {
  // `music` moved across on 2026-07-27, when the map was repainted so its cabin stands in the
  // foreground at the same size and light as the other two — see cabins.data.ts on why equal
  // prominence is a measurement requirement rather than a finish preference.
  expect(CABINS.filter((c) => c.active).map((c) => c.id)).toEqual([
    "logic-games",
    "math",
    "music",
    "code",
  ]);
  expect(CABINS.filter((c) => !c.active).map((c) => c.id)).toEqual(["art"]);
});

// accent/emblem are authored ahead of the visual pass that consumes them, so nothing renders them
// yet — these assertions are what keeps them from silently rotting or going missing on a new cabin.
test("every cabin carries a hex accent and a non-empty emblem id", () => {
  for (const cabin of CABINS) {
    expect(cabin.accent).toMatch(/^#[0-9a-f]{6}$/);
    expect(cabin.emblem).not.toBe("");
  }
});

test("the two active cabins use their agreed accent + emblem", () => {
  const byId = new Map(CABINS.map((c) => [c.id, c]));
  expect(byId.get("logic-games")).toMatchObject({ accent: "#5b7fa6", emblem: "grid" });
  expect(byId.get("math")).toMatchObject({ accent: "#c9962f", emblem: "gear" });
});

test("accents and emblems are unique per cabin", () => {
  expect(new Set(CABINS.map((c) => c.accent)).size).toBe(CABINS.length);
  expect(new Set(CABINS.map((c) => c.emblem)).size).toBe(CABINS.length);
});

test("every node sits inside the frame at a distinct point", () => {
  const points = new Set<string>();
  for (const cabin of CABINS) {
    expect(cabin.xPct).toBeGreaterThan(0);
    expect(cabin.xPct).toBeLessThan(100);
    expect(cabin.yPct).toBeGreaterThan(0);
    expect(cabin.yPct).toBeLessThan(100);
    points.add(`${cabin.xPct},${cabin.yPct}`);
  }
  expect(points.size).toBe(CABINS.length);
});

/**
 * Nodes are pills centered on their point, so two on the same visual row will collide if their
 * horizontal extents overlap. Approximate each pill's width from its label (the widest, "Logic
 * Games", comes out around 14% of the 1080px-wide frame) and assert that any two nodes within one
 * pill-height of each other vertically stay clear horizontally.
 */
test("no two nodes on the same row overlap horizontally", () => {
  const widthPct = (cabin: (typeof CABINS)[number]): number =>
    // ~9px per display-font character + pill padding + the spark/badge on the right, over 1080px.
    ((cabin.label.length * 9 + 32 + (cabin.active ? 16 : 84)) / 1080) * 100;
  const ROW_HEIGHT_PCT = 6; // ~34px pill in a 607px-tall 16:9 frame

  for (const a of CABINS) {
    for (const b of CABINS) {
      if (a === b) continue;
      if (Math.abs(a.yPct - b.yPct) > ROW_HEIGHT_PCT) continue;
      const gap = Math.abs(a.xPct - b.xPct) - (widthPct(a) + widthPct(b)) / 2;
      expect(gap, `${a.id} overlaps ${b.id}`).toBeGreaterThan(0);
    }
  }
});
