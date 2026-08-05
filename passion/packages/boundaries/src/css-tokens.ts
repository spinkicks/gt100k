// An executable rule about CSS custom properties: every `var(--x)` in this repo must name a token
// that something, somewhere, actually defines.
//
// It exists because an unresolved `var()` is not a no-op. The declaration containing it becomes
// invalid at computed-value time and the browser throws the whole declaration away, silently. A
// stylesheet full of dead tokens type-checks, lints and builds perfectly — see the note at the top of
// `test/css-tokens.test.ts` for the panel that reached a reviewer with every padding rule voided this
// way while the `border` beside them applied fine.
//
// Two severities, because the two failure modes are different:
//
//   UNDEFINED_TOKEN                — no fallback. The declaration is DROPPED. Layout collapses to
//                                    whatever the cascade said before, which usually means zero.
//   UNDEFINED_TOKEN_WITH_FALLBACK  — `var(--x, something)`. The declaration survives and renders the
//                                    fallback, so the page looks finished and is wrong. An amber debt
//                                    marker came out navy this way. A warning rather than an error
//                                    because the fallback may be deliberate, but it is never free:
//                                    the name promises a token that does not exist.
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";

export type CssTokenProblemCode = "UNDEFINED_TOKEN";
export type CssTokenWarningCode = "UNDEFINED_TOKEN_WITH_FALLBACK";

export interface CssTokenProblem {
  readonly code: CssTokenProblemCode;
  readonly token: string;
  /** Repo-relative path and 1-based line, as `path:line`. */
  readonly where: string;
  readonly detail: string;
}

export interface CssTokenWarning {
  readonly code: CssTokenWarningCode;
  readonly token: string;
  readonly where: string;
  readonly detail: string;
}

export interface CssTokenReport {
  readonly ok: boolean;
  readonly problems: readonly CssTokenProblem[];
  readonly warnings: readonly CssTokenWarning[];
  /** Repo-relative paths of the stylesheets read, so a clean report cannot mean an empty scan. */
  readonly stylesheetsScanned: readonly string[];
  /** Every token name found defined anywhere, for the same reason. */
  readonly tokensDefined: readonly string[];
}

export interface CheckCssTokensOptions {
  readonly repoRoot: string;
}

export interface TokenReference {
  readonly token: string;
  readonly hasFallback: boolean;
  readonly line: number;
}

const SKIP_DIRECTORIES: ReadonlySet<string> = new Set([
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".git",
  ".next",
  ".turbo",
  // Explicitly archived code (the prior full-program PRD and its packages live here per AGENTS.md).
  // Nothing under it is built or served, and it still references a token vocabulary that was retired
  // with it, so scanning it would report nine dead tokens that no browser will ever evaluate.
  "archive",
  // A fixture is allowed to be broken on purpose — that is what makes it a fixture.
  "__fixtures__",
  "__mocks__",
  // Third-party build output we vendor rather than install, so the same reasoning as node_modules
  // applies: we do not own the token vocabulary and cannot fix it. It also defeats the scanner
  // outright. `maskSourceComments` blanks from `//` to end of line, and a minified bundle is one
  // enormous line, so a `//` inside any regex literal hides every `setProperty("--token", …)` after
  // it and the tokens read as undefined.
  "vendor",
]);

const STYLESHEET = /\.css$/;
const SOURCE = /\.(tsx?|jsx?|mjs|cjs)$/;
/**
 * Tests are excluded from the scan, in BOTH directions, and the reason is not convenience.
 *
 * A test file is never served to a browser, so a `var()` inside one cannot void a declaration on a
 * page — the failure this rule exists to catch is impossible there. Meanwhile a test about dead
 * tokens necessarily contains dead tokens: the regression fixture in `test/css-tokens.test.ts` writes
 * `var(--sp-4)` on purpose, and its assertions quote `"--sp-4"` as an expected value. Scanning tests
 * would make this rule fail on its own proof, and — worse in the other direction — would count that
 * quoted assertion as a DEFINITION of `--sp-4`, which is exactly how the first run of this checker
 * decided the token behind the original bug was defined after all.
 */
const TEST_FILE = /\.(test|spec)\.[jt]sx?$/;

/** `--name` in `--name:` position. A `var(--name)` puts a `)` there instead, so it cannot match. */
const DEFINITION = /(?:^|[;{}\s])(--[A-Za-z0-9_-]+)\s*:/g;
/** `@property --name { … }` registers a custom property without ever writing `--name:`. */
const AT_PROPERTY = /@property\s+(--[A-Za-z0-9_-]+)/g;
/**
 * `style={{ "--name": v }}` — an object key, so a colon must follow. Deliberately NOT `[:,)]`: a
 * trailing comma or paren also matches any quoted string that merely looks like a token, and the
 * markdown separator `"---"` sitting in an array was duly reported as a defined custom property.
 */
const DEFINITION_IN_SOURCE = /["'](--[A-Za-z0-9_-]+)["']\s*:/g;
/** `el.style.setProperty("--name", v)` — the other real definition site, where a comma does follow. */
const SET_PROPERTY = /setProperty\(\s*["'](--[A-Za-z0-9_-]+)["']/g;
/**
 * `localFont({ variable: "--font-sans" })` / `Inter({ variable: "--font-ui" })` — next/font emits the
 * declaration itself at build time, so the token is real even though no file in the repo writes
 * `--font-sans:`. Here the token is the VALUE rather than the key, which is why the object-key pattern
 * above cannot see it.
 *
 * This is the case that proves the general hazard: a definition a framework generates is invisible to
 * a static scan, and a checker that does not know the pattern reports correct CSS as dead. It nearly
 * cost `design-lab` its typeface — the "fix" for the false positive was to swap `--font-sans` for a
 * generic token, and only reading the computed style in a browser showed the original was right. If
 * another generated token ever trips this rule, the fix is to teach this file the pattern, never to
 * exempt the file that uses it.
 */
const FONT_LOADER_VARIABLE = /\bvariable\s*:\s*["'](--[A-Za-z0-9_-]+)["']/g;
const REFERENCE = /var\(\s*(--[A-Za-z0-9_-]+)\s*(,)?/g;

/**
 * Removes `/* … *​/` comments outright. CSS has no `//` form, and treating one as a comment would
 * eat the rest of any line holding a `url(https://…)`.
 */
export function stripCssComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "");
}

/**
 * Same removal, but every deleted character becomes a space and newlines survive, so byte offsets and
 * therefore line numbers still line up with the original file. Reported positions have to be the
 * real ones or the report cannot be acted on.
 */
function maskCssComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, " "));
}

const lineAt = (source: string, index: number): number => source.slice(0, index).split("\n").length;

export function findTokenDefinitions(source: string): readonly string[] {
  const clean = stripCssComments(source);
  const found = new Set<string>();
  for (const match of clean.matchAll(DEFINITION)) found.add(match[1] as string);
  for (const match of clean.matchAll(AT_PROPERTY)) found.add(match[1] as string);
  return [...found];
}

/**
 * Masks `/* … *​/` and `// …` while keeping every newline, so prose in a comment cannot read as code
 * and reported line numbers stay true. A `//` inside a string literal (`"https://…"`) is masked too;
 * that can only cause a missed reference, never a false one, which is the safe direction for a gate.
 */
function maskSourceComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, " "))
    .replace(/\/\/[^\n]*/g, (comment) => " ".repeat(comment.length));
}

function findTokenDefinitionsInSource(source: string): readonly string[] {
  const clean = maskSourceComments(source);
  const found = new Set<string>();
  for (const match of clean.matchAll(DEFINITION_IN_SOURCE)) found.add(match[1] as string);
  for (const match of clean.matchAll(SET_PROPERTY)) found.add(match[1] as string);
  for (const match of clean.matchAll(FONT_LOADER_VARIABLE)) found.add(match[1] as string);
  return [...found];
}

export function findTokenReferences(source: string): readonly TokenReference[] {
  const masked = maskCssComments(source);
  const refs: TokenReference[] = [];
  for (const match of masked.matchAll(REFERENCE)) {
    refs.push({
      token: match[1] as string,
      hasFallback: match[2] === ",",
      line: lineAt(masked, match.index ?? 0),
    });
  }
  return refs;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRECTORIES.has(entry.name)) continue;
      walk(join(dir, entry.name), out);
    } else if (entry.isFile()) {
      out.push(join(dir, entry.name));
    }
  }
  return out;
}

export function checkCssTokens(options: CheckCssTokensOptions): CssTokenReport {
  const { repoRoot } = options;
  const files = walk(repoRoot);
  const rel = (file: string) => relative(repoRoot, file).split(sep).join("/");

  const shipped = files.filter((file) => !TEST_FILE.test(file));
  const stylesheets = shipped.filter((file) => STYLESHEET.test(file)).sort();
  const sources = shipped.filter((file) => SOURCE.test(file)).sort();

  const defined = new Set<string>();
  for (const file of stylesheets) {
    for (const token of findTokenDefinitions(readFileSync(file, "utf8"))) defined.add(token);
  }
  for (const file of sources) {
    for (const token of findTokenDefinitionsInSource(readFileSync(file, "utf8"))) {
      defined.add(token);
    }
  }

  const problems: CssTokenProblem[] = [];
  const warnings: CssTokenWarning[] = [];
  // Stylesheets and components alike: a component's inline style reads the same cascade. Source is
  // comment-masked first, so a doc comment describing `var(--x)` is not read as a use of it — which
  // this file's own opening paragraph did on the first run.
  const sites = [
    ...stylesheets.map((file) => ({ file, body: readFileSync(file, "utf8") })),
    ...sources.map((file) => ({ file, body: maskSourceComments(readFileSync(file, "utf8")) })),
  ].sort((left, right) => left.file.localeCompare(right.file));

  for (const { file, body } of sites) {
    for (const ref of findTokenReferences(body)) {
      if (defined.has(ref.token)) continue;
      const where = `${rel(file)}:${ref.line}`;
      if (ref.hasFallback) {
        warnings.push({
          code: "UNDEFINED_TOKEN_WITH_FALLBACK",
          token: ref.token,
          where,
          detail: `${ref.token} is not defined anywhere, so this always renders the fallback. Either define it or drop the name and use the fallback value directly.`,
        });
      } else {
        problems.push({
          code: "UNDEFINED_TOKEN",
          token: ref.token,
          where,
          detail: `${ref.token} is not defined anywhere, so this whole declaration is invalid at computed-value time and the browser discards it. Check the token vocabulary in @gt100k/design-tokens for the real name.`,
        });
      }
    }
  }

  return {
    ok: problems.length === 0,
    problems,
    warnings,
    stylesheetsScanned: stylesheets.map(rel),
    tokensDefined: [...defined].sort(),
  };
}
