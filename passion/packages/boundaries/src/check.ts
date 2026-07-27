// The product-boundary check: an executable version of the one architectural rule in this repo.
//
// `docs/decisions/evidencegraph-v1-design.md` §13a commits to the EvidenceGraph becoming its own
// product, extracted later as a mechanical `git subtree` copy. It used to state the supporting
// invariant as a fact already holding — "preserve the zero-inbound-coupling that already holds" — and
// that fact quietly stopped being true: four runtime imports crossed the line and nothing noticed for
// weeks. A parenthetical asserting a fact is not a mechanism for keeping it true. This is.
//
// THE RULES
//
//   B1  RUNTIME_IMPORT_ACROSS_BOUNDARY (error)
//       A package outside `@gt100k/evidence-*` may not import a VALUE from inside it. `import type` is
//       fine: types vanish at compile time, so they cost nothing on extraction. Exempt: the single
//       designated seam adapter, and tests whose whole purpose is to prove parity against the other
//       side (see EXEMPT_*).
//
//   B2  EVIDENCE_IMPORTS_OUTWARD (error, packages + adapters only)
//       An `evidence-*` PACKAGE or ADAPTER may not depend on anything outside the namespace, in any
//       form. This is the direction that actually decides whether extraction works: a graph package
//       that reaches back into PassionLab cannot be lifted out at all.
//
//   B3  EVIDENCE_APP_OUTWARD_DEP (warning, apps only)
//       `apps/evidence-explorer` deliberately shares the GT School design system (#188, #189), so it
//       depends on `@gt100k/design-tokens` and `@gt100k/ui`. That is a cohesion decision, not an
//       accident, and this check does not overturn it — but those two packages would have to travel
//       with the app or be replaced on extraction day, so the cost is reported rather than hidden.
//       Presentation infrastructure is not passion-domain logic; if a DOMAIN dependency ever appears
//       here it should be promoted to an error.
//
//   B4  DEEP_IMPORT_ACROSS_BOUNDARY (error)
//       Reaching past a package's barrel into `@gt100k/evidence-*/src/...` from outside the namespace.
//       Inside the namespace this is an established convention (13 sites import `ports.js` that way,
//       because the barrel does not re-export it), so it is only a problem when it crosses.
//
//   B5  UNDECLARED_BOUNDARY_DEP (warning)
//       A tsconfig `references` entry pointing into the namespace with no matching `package.json`
//       dependency. `adapters/evidence-hash-node` has done this since before the boundary existed;
//       it is a manifest inconsistency rather than a coupling problem.
//
// Pure and deterministic apart from reading the files it is asked about. No clock, no network.
import { type Dirent, readFileSync, readdirSync } from "node:fs";

/** Where workspace members live, relative to the repo root (mirrors `pnpm-workspace.yaml`). */
const WORKSPACE_DIRS = ["passion/packages", "passion/adapters", "passion/apps"] as const;

/** The namespace prefix that marks the other product. Everything keys off this, nothing else. */
const NAMESPACE_PREFIX = "@gt100k/evidence-";

/**
 * The ONE package allowed to import values across the boundary.
 *
 * An adapter bridges two sides, so it must import from one of them — the rule cannot be satisfied by
 * a seam, only by everything that is not a seam. This is that seam. It sits OUTSIDE the namespace on
 * purpose: an adapter inside it would be lifted out with the graph while still depending on
 * `@gt100k/project-workspace`, which stays behind.
 *
 * A second entry here is the signal that the seam is in the wrong place. It is not a list to grow.
 */
export const EXEMPT_PACKAGES: ReadonlySet<string> = new Set(["@gt100k/project-evidence-sink"]);

/**
 * Test files whose purpose is to compare the two sides, and which therefore cannot do their job
 * without naming both. Kept as exact paths so a new exemption is a visible diff.
 */
export const EXEMPT_FILES: ReadonlySet<string> = new Set([
  // Proves socratic-defense's copied `canonicalize` stays byte-identical to the graph's.
  "passion/packages/socratic-defense/test/canonical-parity.test.ts",
]);

export type BoundaryProblemCode =
  | "RUNTIME_IMPORT_ACROSS_BOUNDARY"
  | "EVIDENCE_IMPORTS_OUTWARD"
  | "DEEP_IMPORT_ACROSS_BOUNDARY";

export type BoundaryWarningCode = "EVIDENCE_APP_OUTWARD_DEP" | "UNDECLARED_BOUNDARY_DEP";

export interface BoundaryProblem {
  readonly code: BoundaryProblemCode;
  /** The file or manifest the problem is in, repo-relative. */
  readonly where: string;
  readonly detail: string;
}

export interface BoundaryWarning {
  readonly code: BoundaryWarningCode;
  readonly where: string;
  readonly detail: string;
}

export interface BoundaryReport {
  readonly ok: boolean;
  readonly problems: readonly BoundaryProblem[];
  readonly warnings: readonly BoundaryWarning[];
  /** Every workspace package name discovered, so a test can prove discovery actually found things. */
  readonly packagesScanned: readonly string[];
}

export interface CheckBoundariesOptions {
  /** Absolute path to the repo root. */
  readonly repoRoot: string;
  /** Restrict the scan to these workspace dirs. Defaults to all of them (used by unit tests). */
  readonly workspaceDirs?: readonly string[];
  /** Override the seam allowlist (used by unit tests to prove the exemption is what permits it). */
  readonly exemptPackages?: ReadonlySet<string>;
  /** Override the parity-test allowlist. */
  readonly exemptFiles?: ReadonlySet<string>;
}

interface DiscoveredPackage {
  readonly name: string;
  /** Repo-relative directory, e.g. `passion/packages/evidence-graph`. */
  readonly dir: string;
  /** Which workspace dir it came from — apps are treated differently by B3. */
  readonly kind: "packages" | "adapters" | "apps";
  readonly manifest: Record<string, unknown>;
}

const inNamespace = (name: string): boolean => name.startsWith(NAMESPACE_PREFIX);

/** Strip block and line comments so prose mentioning a package never counts as an import. */
export function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

/** Every `.ts`/`.tsx` file under `dir` (recursively), as repo-relative paths. */
function sourceFiles(absDir: string, relDir: string): string[] {
  let entries: Dirent[];
  try {
    entries = readdirSync(absDir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries.flatMap((entry) => {
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".next") {
      return [];
    }
    const abs = `${absDir}/${entry.name}`;
    const rel = `${relDir}/${entry.name}`;
    if (entry.isDirectory()) {
      return sourceFiles(abs, rel);
    }
    return /\.tsx?$/.test(entry.name) ? [rel] : [];
  });
}

interface ImportSite {
  readonly specifier: string;
  /** True when the whole statement is `import type ...`, or every named specifier is `type X`. */
  readonly typeOnly: boolean;
  readonly line: number;
}

/**
 * Find the imports in a source file and classify each as type-only or value.
 *
 * `verbatimModuleSyntax: true` (see `tsconfig.base.json`) is what makes this textually reliable: a
 * type import MUST be written `import type`, or with `type` on each specifier, so the text carries the
 * distinction rather than us having to infer it.
 */
export function findImports(source: string): readonly ImportSite[] {
  const code = stripComments(source);
  const sites: ImportSite[] = [];
  // `import ... from "x"`, `export ... from "x"`, and bare `import "x"`.
  const pattern =
    /(?:^|\n)\s*(import|export)\b([\s\S]*?)from\s*["']([^"']+)["']|(?:^|\n)\s*import\s*["']([^"']+)["']/g;

  for (const match of code.matchAll(pattern)) {
    const clause = match[2] ?? "";
    const specifier = match[3] ?? match[4];
    if (specifier === undefined) {
      continue;
    }
    // Count from the `import`/`export` KEYWORD, not the match start: the leading `\s*` swallows any
    // blank lines before the statement, so match.index sits above it and would under-report the line.
    const keywordOffset = Math.max(0, match[0].search(/\b(?:import|export)\b/));
    const line = code.slice(0, (match.index ?? 0) + keywordOffset).split("\n").length;

    // `import type { A, B } from` / `export type { A } from` — wholly type-level.
    const wholeStatementIsType = /^\s*type\b/.test(clause);
    // `import { type A, type B } from` — every named specifier carries `type`.
    const named = clause.match(/\{([\s\S]*)\}/)?.[1] ?? "";
    const specifiers = named
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
    const allSpecifiersAreType =
      specifiers.length > 0 && specifiers.every((part) => /^type\s/.test(part));
    // A bare `import "x"` has no clause at all and IS a runtime import (side effects).
    const isBareImport = match[4] !== undefined;

    sites.push({
      specifier,
      typeOnly: !isBareImport && (wholeStatementIsType || allSpecifiersAreType),
      line,
    });
  }

  return sites;
}

/** Read the workspace and check both directions of the boundary. */
export function checkBoundaries(options: CheckBoundariesOptions): BoundaryReport {
  const {
    repoRoot,
    workspaceDirs = WORKSPACE_DIRS,
    exemptPackages = EXEMPT_PACKAGES,
    exemptFiles = EXEMPT_FILES,
  } = options;

  const packages: DiscoveredPackage[] = [];

  // SELF-DISCOVERING, deliberately. A hard-coded package list is the drift failure
  // `guardrails/src/checks.ts` warns about, reintroduced one layer up: a new `evidence-*` package
  // would silently sit outside a list nobody remembered to update.
  for (const workspaceDir of workspaceDirs) {
    const kind = workspaceDir.split("/").pop() as DiscoveredPackage["kind"];
    let entries: Dirent[];
    try {
      entries = readdirSync(`${repoRoot}/${workspaceDir}`, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }
      const dir = `${workspaceDir}/${entry.name}`;
      let manifest: Record<string, unknown>;
      try {
        manifest = JSON.parse(readFileSync(`${repoRoot}/${dir}/package.json`, "utf8")) as Record<
          string,
          unknown
        >;
      } catch {
        continue;
      }
      const name = typeof manifest.name === "string" ? manifest.name : "";
      if (name.length > 0) {
        packages.push({ name, dir, kind, manifest });
      }
    }
  }

  const problems: BoundaryProblem[] = [];
  const warnings: BoundaryWarning[] = [];

  const dependencyNames = (manifest: Record<string, unknown>): string[] => {
    const out: string[] = [];
    for (const field of ["dependencies", "devDependencies", "peerDependencies"]) {
      const block = manifest[field];
      if (block !== null && typeof block === "object") {
        out.push(...Object.keys(block as Record<string, unknown>));
      }
    }
    return out;
  };

  for (const pkg of packages) {
    const isInside = inNamespace(pkg.name);
    const isExempt = exemptPackages.has(pkg.name);

    // ── B2 / B3: the outward direction, from inside the namespace ──────────────────────────────
    if (isInside) {
      const outward = dependencyNames(pkg.manifest).filter(
        (dep) => dep.startsWith("@gt100k/") && !inNamespace(dep),
      );
      for (const dep of outward) {
        if (pkg.kind === "apps") {
          warnings.push({
            code: "EVIDENCE_APP_OUTWARD_DEP",
            where: `${pkg.dir}/package.json`,
            detail: `${pkg.name} depends on ${dep}, which is outside the namespace. Deliberate (shared design system), but it must travel or be replaced on extraction.`,
          });
        } else {
          problems.push({
            code: "EVIDENCE_IMPORTS_OUTWARD",
            where: `${pkg.dir}/package.json`,
            detail: `${pkg.name} depends on ${dep}, outside the namespace. A graph package that reaches back into PassionLab cannot be extracted at all.`,
          });
        }
      }
    }

    // ── B5: tsconfig references the namespace without declaring the dependency ─────────────────
    try {
      const tsconfig = readFileSync(`${repoRoot}/${pkg.dir}/tsconfig.json`, "utf8");
      const declared = new Set(dependencyNames(pkg.manifest));
      for (const match of stripComments(tsconfig).matchAll(/"path"\s*:\s*"([^"]+)"/g)) {
        const referenced = match[1]?.split("/").pop() ?? "";
        if (!referenced.startsWith("evidence-")) {
          continue;
        }
        if (!declared.has(`@gt100k/${referenced}`)) {
          warnings.push({
            code: "UNDECLARED_BOUNDARY_DEP",
            where: `${pkg.dir}/tsconfig.json`,
            detail: `references @gt100k/${referenced} but package.json does not declare it.`,
          });
        }
      }
    } catch {
      // No tsconfig (or unreadable) — nothing to check.
    }

    // ── B1 / B4: the inward direction, from outside the namespace ──────────────────────────────
    if (isInside || isExempt) {
      continue;
    }
    for (const file of sourceFiles(`${repoRoot}/${pkg.dir}`, pkg.dir)) {
      if (exemptFiles.has(file)) {
        continue;
      }
      let source: string;
      try {
        source = readFileSync(`${repoRoot}/${file}`, "utf8");
      } catch {
        continue;
      }
      for (const site of findImports(source)) {
        if (!inNamespace(site.specifier)) {
          continue;
        }
        // A specifier with a path segment past the package name reaches around the barrel.
        const segments = site.specifier.split("/");
        if (segments.length > 2) {
          problems.push({
            code: "DEEP_IMPORT_ACROSS_BOUNDARY",
            where: `${file}:${site.line}`,
            detail: `imports ${site.specifier}, reaching past the package barrel across the product boundary.`,
          });
          continue;
        }
        if (!site.typeOnly) {
          problems.push({
            code: "RUNTIME_IMPORT_ACROSS_BOUNDARY",
            where: `${file}:${site.line}`,
            detail: `value-imports from ${site.specifier}. Use \`import type\`, or route it through the seam adapter (${[...exemptPackages].join(", ")}).`,
          });
        }
      }
    }
  }

  return {
    ok: problems.length === 0,
    problems,
    warnings,
    packagesScanned: packages.map((pkg) => pkg.name).sort(),
  };
}
