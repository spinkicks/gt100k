import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { buildExplorerView, buildFixtureGraph } from "@gt100k/evidence-explorer-view";
import { NodeCryptoHasher } from "@gt100k/evidence-hash-node";
import { describe, expect, it } from "vitest";

const SRC = fileURLToPath(new URL("../src", import.meta.url));
/** Read source with comments stripped, so guardrails scan executable code (not prose). */
const code = (rel: string): string =>
  readFileSync(`${SRC}/${rel}`, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");

/** Every `.ts` file in `src` (recursively) — so a new file can never slip a guardrail. */
function allSrcFiles(dir = SRC, prefix = ""): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) return allSrcFiles(`${dir}/${entry.name}`, rel);
    return entry.name.endsWith(".ts") ? [rel] : [];
  });
}

/** Verification is the ONLY place `mismatch`/red may surface (SC-E11). */
const VERIFICATION_SOURCES = new Set(["verify.ts", "model.ts", "ledger.ts"]);

/** Structural guardrails (§U8.14 / SC-E11). */
describe("guardrails", () => {
  const FORBIDDEN =
    /\b(price|currency|leaderboard|percentile|outOf|streak|countdown|urgency|dropRate|rarity|accusation)\b/;

  it("view types expose no gamified / accusatory fields (depthRank is allowed)", () => {
    const bundle = buildFixtureGraph(new NodeCryptoHasher());
    const view = buildExplorerView(bundle.graph, bundle);
    const serialized = JSON.stringify(view);
    // `depthRank` is the allowed neutral provenance index; scrub it before scanning for `rank`.
    const scrubbed = serialized.replace(/depthRank/g, "");
    expect(FORBIDDEN.test(scrubbed)).toBe(false);
    expect(/"rank"/.test(scrubbed)).toBe(false);
  });

  it("no Math.random anywhere in src (every file, recursively)", () => {
    for (const file of allSrcFiles()) {
      expect(code(file), file).not.toMatch(/Math\.random/);
    }
  });

  it("no Math.sin / Math.cos in the golden layout path", () => {
    for (const file of ["ranks.ts", "layout2d.ts", "layout3d.ts"]) {
      expect(code(file)).not.toMatch(/Math\.(sin|cos)/);
    }
  });

  it("red / `mismatch` appears only in the verification sources, never the base view", () => {
    for (const file of allSrcFiles()) {
      const base = file.split("/").pop() ?? file;
      if (VERIFICATION_SOURCES.has(base)) continue;
      expect(code(file), file).not.toMatch(/mismatch/i);
    }
  });
});
