// THE STANDING GATE for CSS custom properties, plus the unit tests behind it.
//
// Why this exists. On 2026-07-28 the guide console's "What to offer next" panel reached a reviewer as
// a wall of text with its first letter jammed against its own border. The cause was not a missing
// padding rule: `.offer-next` asked for `padding: 0 var(--sp-4) var(--sp-4)` and `gap: var(--sp-2)`,
// and NO token named `--sp-*` has ever existed in this repo. An unresolved `var()` makes the whole
// declaration invalid at computed-value time, so the browser dropped every padding and gap in the
// block while the `border` beside them applied fine.
//
// `tsc -b`, `biome check` and `next build` were all green on that stylesheet. Nothing we run reads
// CSS, so nothing could have caught it. This does.
//
// It runs in CI through the root `pnpm test` (the root vitest config globs
// `passion/packages/**/test/**/*.test.ts`), so it needs no CI configuration of its own — the same way
// `boundaries.test.ts` enforces the EvidenceGraph product boundary.
//
// Fixtures are written to a temp directory rather than committed under `__fixtures__`, because a
// committed fixture of deliberately-broken CSS would be found by the repo-wide scan below and fail it.
// The alternative was to teach the scan to skip fixture directories, which would put a hole in the
// gate to make room for its own tests.
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  checkCssTokens,
  findTokenDefinitions,
  findTokenReferences,
  stripCssComments,
} from "../src/css-tokens.js";

const REPO_ROOT = fileURLToPath(new URL("../../../..", import.meta.url));

/** Builds a throwaway tree of files; keys are relative paths. */
function tree(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "css-tokens-"));
  for (const [rel, body] of Object.entries(files)) {
    const full = join(root, rel);
    mkdirSync(join(full, ".."), { recursive: true });
    writeFileSync(full, body, "utf8");
  }
  return root;
}

describe("stripCssComments", () => {
  it("removes a block comment", () => {
    expect(stripCssComments("a{/* --ghost: 1px; */color:red}")).toBe("a{color:red}");
  });

  it("leaves a URL containing slashes alone", () => {
    const css = "a{background:url(https://example.com/x.png)}";
    expect(stripCssComments(css)).toBe(css);
  });
});

describe("findTokenDefinitions", () => {
  it("finds a custom property declaration", () => {
    expect(findTokenDefinitions(":root{--space-4:16px}")).toEqual(["--space-4"]);
  });

  it("does not treat a var() reference as a definition", () => {
    // The bug this guards: counting references as definitions makes every undefined token look
    // defined by its own use, and the checker reports a permanently clean repo.
    expect(findTokenDefinitions("a{padding:var(--sp-4)}")).toEqual([]);
  });

  it("finds an @property declaration", () => {
    expect(findTokenDefinitions("@property --angle{syntax:'<angle>'}")).toEqual(["--angle"]);
  });

  it("ignores a definition that only appears inside a comment", () => {
    expect(findTokenDefinitions("/* --sp-4: 16px; */")).toEqual([]);
  });
});

describe("findTokenReferences", () => {
  it("finds a reference with no fallback", () => {
    expect(findTokenReferences("a{padding:var(--sp-4)}")).toEqual([
      { token: "--sp-4", hasFallback: false, line: 1 },
    ]);
  });

  it("marks a reference that supplies a fallback", () => {
    // Distinguished because the consequences differ: with no fallback the declaration is dropped,
    // whereas a fallback renders something plausible and wrong. `var(--warn-fg, var(--accent))` is
    // how an amber debt marker came out navy.
    expect(findTokenReferences("a{border-color:var(--warn-fg, var(--accent))}")[0]).toEqual({
      token: "--warn-fg",
      hasFallback: true,
      line: 1,
    });
  });

  it("reports the line each reference sits on", () => {
    const refs = findTokenReferences("a{\n  color:red;\n  padding:var(--sp-4);\n}");
    expect(refs).toEqual([{ token: "--sp-4", hasFallback: false, line: 3 }]);
  });
});

describe("checkCssTokens", () => {
  it("reports an undefined token with no fallback as a problem", () => {
    const root = tree({ "a.css": ":root{--real:1px}\n.x{padding:var(--sp-4)}" });
    const report = checkCssTokens({ repoRoot: root });

    expect(report.ok).toBe(false);
    expect(report.problems).toHaveLength(1);
    expect(report.problems[0]?.code).toBe("UNDEFINED_TOKEN");
    expect(report.problems[0]?.token).toBe("--sp-4");
    expect(report.problems[0]?.where).toBe("a.css:2");
  });

  it("reports an undefined token that has a fallback as a warning, not a problem", () => {
    const root = tree({ "a.css": ":root{--accent:navy}\n.x{color:var(--warn-fg, var(--accent))}" });
    const report = checkCssTokens({ repoRoot: root });

    expect(report.problems).toEqual([]);
    expect(report.ok).toBe(true);
    expect(report.warnings.map((w) => w.token)).toEqual(["--warn-fg"]);
    expect(report.warnings[0]?.code).toBe("UNDEFINED_TOKEN_WITH_FALLBACK");
  });

  it("accepts a token a font loader declares, because the framework materialises it", () => {
    // The false positive that nearly shipped a regression. `design-lab/app/lab.css` reads
    // `var(--font-sans)`, and nothing in the repo writes `--font-sans:` anywhere — but
    // `localFont({ variable: "--font-sans" })` makes next/font emit the definition at build time, and
    // the browser confirms it resolves to a real font. Read statically and naively, correct CSS looks
    // dead, and "fixing" it swaps the app's typeface for a generic one.
    const root = tree({
      "app/layout.tsx": 'const sans = localFont({ variable: "--font-sans", display: "swap" });\n',
      "app/lab.css": "body{font-family:var(--font-sans), system-ui}",
    });
    expect(checkCssTokens({ repoRoot: root }).problems).toEqual([]);
  });

  it("accepts a token defined in a different stylesheet in the tree", () => {
    // Tokens live in @gt100k/design-tokens and are used in every app, so a per-file check would
    // report the entire repo as broken.
    const root = tree({
      "tokens/index.css": ":root{--ink-muted:#33505c}",
      "app/globals.css": ".x{color:var(--ink-muted)}",
    });
    expect(checkCssTokens({ repoRoot: root }).problems).toEqual([]);
  });

  it("accepts a token set from TypeScript rather than CSS", () => {
    // `style={{ "--control-min": … }}` is a real definition site in this repo; treating CSS as the
    // only source would flag working code.
    const root = tree({
      "app/Thing.tsx": 'const s = { "--control-min": "44px" };\n',
      "app/thing.css": ".x{min-height:var(--control-min)}",
    });
    expect(checkCssTokens({ repoRoot: root }).problems).toEqual([]);
  });

  it("ignores a reference that only appears inside a comment", () => {
    const root = tree({ "a.css": "/* .x{padding:var(--sp-4)} */\n.y{color:red}" });
    expect(checkCssTokens({ repoRoot: root }).problems).toEqual([]);
  });

  it("flags an undefined token referenced from a component's inline style", () => {
    // Not every reference lives in a stylesheet — `progress.tsx` reads tokens straight out of the
    // cascade — and a dead token is exactly as invisible there as in a .css file.
    const root = tree({
      "app/Thing.tsx": 'const s = { background: "var(--surface-nope)" };\n',
      "app/thing.css": ".x{color:red}",
    });
    const report = checkCssTokens({ repoRoot: root });
    expect(report.problems.map((p) => p.token)).toEqual(["--surface-nope"]);
    expect(report.problems[0]?.where).toBe("app/Thing.tsx:1");
  });

  it("skips node_modules and build output", () => {
    const root = tree({
      "node_modules/pkg/x.css": ".a{padding:var(--vendor-thing)}",
      "dist/x.css": ".b{padding:var(--built-thing)}",
      "app.css": ".c{color:red}",
    });
    const report = checkCssTokens({ repoRoot: root });
    expect(report.problems).toEqual([]);
    expect(report.stylesheetsScanned).toEqual(["app.css"]);
  });

  it("catches the exact declarations that shipped the cramped offer-next panel", () => {
    // The regression this file exists for, verbatim from `globals.css` before #227.
    const root = tree({
      "tokens.css": ":root{--line:#ddd;--radius-sm:4px;--surface-2:#fff}",
      "globals.css": [
        ".offer-next {",
        "  padding: 0 var(--sp-4) var(--sp-4);",
        "  gap: var(--sp-2);",
        "}",
        ".offer-next li {",
        "  gap: var(--sp-3);",
        "  padding: var(--sp-3);",
        "  border: 1px solid var(--line);",
        "  border-radius: var(--radius-sm);",
        "  background: var(--surface-2);",
        "}",
      ].join("\n"),
    });
    const report = checkCssTokens({ repoRoot: root });

    expect(report.ok).toBe(false);
    expect([...new Set(report.problems.map((p) => p.token))].sort()).toEqual([
      "--sp-2",
      "--sp-3",
      "--sp-4",
    ]);
    // The border resolved while the padding did not, which is precisely why it looked like cramped
    // text rather than like broken CSS.
    expect(report.problems.map((p) => p.token)).not.toContain("--line");
  });
});

describe("every CSS custom property this repo uses is defined somewhere", () => {
  const report = checkCssTokens({ repoRoot: REPO_ROOT });

  it("finds no undefined token", () => {
    // Printed in full on failure: "a token is missing" is useless without the name, file and line.
    expect(report.problems, JSON.stringify(report.problems, null, 2)).toEqual([]);
    expect(report.ok).toBe(true);
  });

  it("actually discovered the stylesheets, so a passing run cannot mean an empty scan", () => {
    // The failure mode this guards, borrowed from boundaries.test.ts: a path typo makes the scan find
    // nothing, report zero problems, and read as a clean repo forever. The threshold only has to be
    // high enough that a near-empty scan trips it: mvp-jul24 (32 stylesheets) was archived out of the
    // workspace, so the live count fell from ~68 to ~36 — 30 keeps the guard meaningful below that.
    expect(report.stylesheetsScanned.length).toBeGreaterThan(30);
    expect(report.stylesheetsScanned).toContain("passion/apps/guide-console/app/globals.css");
    expect(report.stylesheetsScanned).toContain("passion/packages/design-tokens/src/index.css");
    // The discovery app's ported theme — a real app stylesheet, pinned so the scan reaching into
    // passion/apps at all stays proven after mvp-jul24 (which used to anchor this) was archived.
    expect(report.stylesheetsScanned).toContain(
      "passion/apps/discovery/runtime/host/theme-tokens.css",
    );
  });

  it("actually collected the token vocabulary, so a passing run cannot mean an empty dictionary", () => {
    // The mirror-image failure: if definitions were never collected, every token would be undefined
    // and the suite would scream. If they were collected too eagerly (references counted as
    // definitions) nothing could ever fail. Pin real tokens from the shared package.
    expect(report.tokensDefined.length).toBeGreaterThan(150);
    expect(report.tokensDefined).toContain("--ink-muted");
    expect(report.tokensDefined).toContain("--space-4");
    // And pin the absence of the ones that caused the bug, so this test fails if `--sp-*` is ever
    // introduced as a real token and the regression fixture above quietly stops meaning anything.
    expect(report.tokensDefined).not.toContain("--sp-4");
  });
});
