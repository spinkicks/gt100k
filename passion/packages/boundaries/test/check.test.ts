// Unit tests for the checker itself — including the negative tests that prove it BITES.
//
// A gate nobody has watched fail is not a gate. The two "without the exemption" cases below are the
// important ones: they take real code that legitimately crosses the boundary, remove its exemption, and
// assert the check catches it. That proves in one step that detection works AND that the exemption is
// what permits those two places, rather than the check being blind to them.
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  EXEMPT_FILES,
  EXEMPT_PACKAGES,
  checkBoundaries,
  findImports,
  stripComments,
} from "../src/check.js";

const REPO_ROOT = fileURLToPath(new URL("../../../..", import.meta.url));
const specifiersOf = (source: string) => findImports(source).map((site) => site.specifier);

describe("findImports — the type-vs-value distinction the whole rule rests on", () => {
  const isValue = (source: string) => findImports(source).some((site) => !site.typeOnly);

  it("treats `import type { … } from` as type-only", () => {
    expect(isValue('import type { EvidenceGraph } from "@gt100k/evidence-graph";')).toBe(false);
  });

  it("treats a plain named import as a value import", () => {
    expect(isValue('import { addNode } from "@gt100k/evidence-graph";')).toBe(true);
  });

  it("treats `import { type A, type B }` — every specifier inline-typed — as type-only", () => {
    expect(isValue('import { type A, type B } from "@gt100k/evidence-graph";')).toBe(false);
  });

  it("treats a MIXED inline import as a value import", () => {
    // The dangerous middle case: one real value smuggled in among type specifiers.
    expect(isValue('import { type A, addNode } from "@gt100k/evidence-graph";')).toBe(true);
  });

  it("treats a bare side-effect import as a value import", () => {
    expect(isValue('import "@gt100k/evidence-graph";')).toBe(true);
  });

  it("treats a default and a namespace import as value imports", () => {
    expect(isValue('import graph from "@gt100k/evidence-graph";')).toBe(true);
    expect(isValue('import * as graph from "@gt100k/evidence-graph";')).toBe(true);
  });

  it("sees `export … from` re-exports, which are runtime edges too", () => {
    expect(isValue('export { addNode } from "@gt100k/evidence-graph";')).toBe(true);
    expect(isValue('export type { EvidenceGraph } from "@gt100k/evidence-graph";')).toBe(false);
  });

  it("handles a multi-line import clause", () => {
    expect(isValue('import {\n  addNode,\n  addEdge,\n} from "@gt100k/evidence-graph";')).toBe(
      true,
    );
    expect(isValue('import type {\n  EvidenceGraph,\n} from "@gt100k/evidence-graph";')).toBe(
      false,
    );
  });

  it("reports the line number, so a violation is navigable", () => {
    const source = '// a comment\n\nimport { addNode } from "@gt100k/evidence-graph";';
    expect(findImports(source)[0]?.line).toBe(3);
  });
});

describe("comment stripping — the false-positive case that actually occurred", () => {
  it("ignores a package named only in a comment", () => {
    // `project-workspace/src/plan.ts` and `socratic-defense/src/canonical.ts` both explain the boundary
    // in prose that names `@gt100k/evidence-graph`. A naive grep flags both. This is why the check
    // strips comments first rather than scanning raw text.
    const source = [
      "// WHY THIS IS A COPY, and not an import of `@gt100k/evidence-graph`'s canonicalize:",
      "/* also see @gt100k/evidence-graph for the original */",
      'import { canonicalize } from "./canonical.js";',
    ].join("\n");
    expect(findImports(source).map((site) => site.specifier)).toEqual(["./canonical.js"]);
  });

  it("strips both comment styles but leaves code intact", () => {
    expect(stripComments("const a = 1; // trailing\n/* block */ const b = 2;")).toContain(
      "const a = 1;",
    );
    expect(stripComments("// only a comment")).not.toContain("comment");
  });

  it("does not treat a specifier inside a string as an import", () => {
    expect(specifiersOf('const name = "@gt100k/evidence-graph";')).toEqual([]);
  });
});

describe("the check BITES — removing an exemption surfaces the real crossing", () => {
  it("flags the seam adapter as a violation once it is no longer exempt", () => {
    // `@gt100k/project-evidence-sink` genuinely value-imports `addNode`/`addEdge`. With the allowlist
    // emptied it must be caught — which proves detection works on real code, and that the exemption is
    // precisely what permits it.
    const report = checkBoundaries({ repoRoot: REPO_ROOT, exemptPackages: new Set() });

    expect(report.ok).toBe(false);
    const offending = report.problems.filter(
      (problem) => problem.code === "RUNTIME_IMPORT_ACROSS_BOUNDARY",
    );
    expect(offending.length).toBeGreaterThan(0);
    expect(
      offending.some((problem) => problem.where.includes("project-evidence-sink/src/index.ts")),
    ).toBe(true);
  });

  it("flags the canonicalize parity test once its file exemption is removed", () => {
    const report = checkBoundaries({ repoRoot: REPO_ROOT, exemptFiles: new Set() });

    expect(report.ok).toBe(false);
    expect(
      report.problems.some((problem) =>
        problem.where.includes("socratic-defense/test/canonical-parity.test.ts"),
      ),
    ).toBe(true);
  });

  it("keeps the exemption lists minimal, and pins their exact membership", () => {
    // Growing these is how the boundary would erode without any single change looking wrong: each
    // addition is individually defensible and the rule dies by a thousand cuts. Pinning the membership
    // means widening it requires editing this assertion, in the open.
    expect([...EXEMPT_PACKAGES]).toEqual(["@gt100k/project-evidence-sink"]);
    expect([...EXEMPT_FILES]).toEqual([
      "passion/packages/socratic-defense/test/canonical-parity.test.ts",
    ]);
  });
});

describe("scan scoping", () => {
  it("returns an empty, ok report for a workspace dir that does not exist", () => {
    // Guards the silent-success failure mode: a bad path must not read as "the boundary holds".
    const report = checkBoundaries({ repoRoot: REPO_ROOT, workspaceDirs: ["does/not/exist"] });
    expect(report.packagesScanned).toEqual([]);
    // ...which is exactly why boundaries.test.ts separately asserts the scan found real packages.
    expect(report.ok).toBe(true);
  });
});
