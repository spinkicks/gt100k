import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { NodeCryptoHasher } from "@gt100k/evidence-hash-node";
import { buildExplorerView, buildFixtureGraph } from "@gt100k/evidence-explorer-view";
import { describe, expect, it } from "vitest";

const SRC = fileURLToPath(new URL("../src", import.meta.url));
/** Read source with comments stripped, so guardrails scan executable code (not prose). */
const code = (rel: string): string =>
  readFileSync(`${SRC}/${rel}`, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");

/** Structural guardrails (§U8.14 / SC-E11). */
describe("guardrails", () => {
  const FORBIDDEN =
    /\b(price|currency|leaderboard|percentile|outOf|streak|countdown|urgency|dropRate|rarity|accusation)\b/;

  it("view types expose no gamified / accusatory fields (depthRank is allowed)", () => {
    const { graph, packet } = buildFixtureGraph(new NodeCryptoHasher());
    const view = buildExplorerView(graph, packet);
    const serialized = JSON.stringify(view);
    // `depthRank` is the allowed neutral provenance index; scrub it before scanning for `rank`.
    const scrubbed = serialized.replace(/depthRank/g, "");
    expect(FORBIDDEN.test(scrubbed)).toBe(false);
    expect(/"rank"/.test(scrubbed)).toBe(false);
  });

  it("no Math.random anywhere in src", () => {
    for (const file of [
      "ranks.ts",
      "layout2d.ts",
      "layout3d.ts",
      "timeline.ts",
      "view.ts",
      "motion.ts",
      "camera.ts",
      "tiers.ts",
    ]) {
      expect(code(file)).not.toMatch(/Math\.random/);
    }
  });

  it("no Math.sin / Math.cos in the golden layout path", () => {
    for (const file of ["ranks.ts", "layout2d.ts", "layout3d.ts"]) {
      expect(code(file)).not.toMatch(/Math\.(sin|cos)/);
    }
  });
});
