import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const APP_ROOT = new URL("../../../apps/arena/", import.meta.url);

function readAppFile(relativePath: string): string {
  const fileUrl = new URL(relativePath, APP_ROOT);
  expect(existsSync(fileUrl), `apps/arena/${relativePath} should exist`).toBe(true);
  return readFileSync(fileUrl, "utf8");
}

function declarations(source: string): Record<string, string> {
  return Object.fromEntries(
    [...source.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)].map((match) => [
      match[1],
      match[2]?.trim(),
    ]),
  );
}

function ruleBody(source: string, selector: string): string {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\}`));
  expect(match, `${selector} should be defined`).not.toBeNull();
  return match?.[1] ?? "";
}

describe("arena App Router foundation", () => {
  it("provides a server-rendered placeholder shell with document metadata", () => {
    const layout = readAppFile("app/layout.tsx");
    const page = readAppFile("app/page.tsx");

    expect(layout).toContain('import "./globals.css";');
    expect(layout).toContain('title: "GT100K — Arena"');
    expect(layout).toContain('<html lang="en">');
    expect(layout).toContain("<body>{children}</body>");

    expect(page).not.toContain('"use client"');
    expect(page).toContain('<main className="arena-shell">');
    expect(page).toContain('<h1 id="arena-title">GT100K Arena</h1>');
    expect(page).toContain('<output className="arena-status">');
    expect(page).toContain("Synthetic learner world");
  });

  it("maps every exact palette and typography value to CSS custom properties", () => {
    const css = readAppFile("app/globals.css");
    const rootTokens = declarations(ruleBody(css, ":root"));

    expect(rootTokens).toMatchObject({
      "sea-deep": "#0e2a3b",
      "sea-mid": "#14384c",
      "sky-dawn": "#f4c77b",
      ink: "#14202b",
      "ink-hi": "#f5f9fc",
      sun: "#f6a23a",
      "sun-hi": "#ffc66b",
      gold: "#f2c14e",
      ember: "#e8623b",
      locked: "#5a6b78",
      "not-yet": "#7fb6d6",
      focus: "#ffd166",
      "font-display": '"Fredoka", "Baloo 2", ui-rounded, "Segoe UI Rounded", system-ui, sans-serif',
      "font-body": '"Nunito", ui-rounded, system-ui, sans-serif',
      "text-display-size": "2.5rem",
      "text-display-line-height": "1.05",
      "text-display-letter-spacing": "-0.02em",
      "text-h1-size": "1.75rem",
      "text-h1-line-height": "1.1",
      "text-h1-letter-spacing": "-0.01em",
      "text-h2-size": "1.25rem",
      "text-h2-line-height": "1.2",
      "text-h2-letter-spacing": "0",
      "text-body-size": "1rem",
      "text-body-line-height": "1.5",
      "text-body-letter-spacing": "0",
      "text-label-size": "0.8125rem",
      "text-label-line-height": "1.4",
      "text-label-letter-spacing": "0.01em",
      numeric: "tabular-nums",
    });

    expect(ruleBody(css, "body")).toMatch(/background:\s*var\(--sea-deep\)/);
    expect(ruleBody(css, "body")).toMatch(/color:\s*var\(--ink-hi\)/);
  });

  it("defines equal preference, plain-mode, and visible-focus hooks", () => {
    const css = readAppFile("app/globals.css");

    expect(css).toMatch(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?--motion-duration:\s*0ms;[\s\S]*?--ambient-motion-play-state:\s*paused;/,
    );
    expect(css).toMatch(
      /@media\s*\(prefers-reduced-transparency:\s*reduce\)[\s\S]*?--surface:\s*var\(--sea-deep\);[\s\S]*?--surface-backdrop:\s*none;/,
    );
    expect(css).toMatch(
      /@media\s*\(prefers-contrast:\s*more\)[\s\S]*?--surface:\s*var\(--sea-deep\);[\s\S]*?--surface-border:\s*var\(--ink-hi\);/,
    );

    const plainMode = ruleBody(css, ".plain-mode");
    expect(plainMode).toMatch(/--motion-duration:\s*0ms;/);
    expect(plainMode).toMatch(/--surface-backdrop:\s*none;/);

    const focusVisible = ruleBody(css, ":focus-visible");
    expect(focusVisible).toMatch(/outline:\s*3px solid var\(--focus\);/);
    expect(focusVisible).toMatch(/outline-offset:\s*3px;/);
  });

  it("documents only the four safe public settings and ignores local output", () => {
    const env = Object.fromEntries(
      readAppFile(".env.local.example")
        .split("\n")
        .map((line) => line.replace(/\s+#.*$/, "").trim())
        .filter(Boolean)
        .map((line) => line.split("=", 2)),
    );
    const ignored = readAppFile(".gitignore").split(/\r?\n/).filter(Boolean);

    expect(env).toEqual({
      NEXT_PUBLIC_ARENA_SEED: "42",
      NEXT_PUBLIC_REDUCED_MOTION_DEFAULT: "system",
      NEXT_PUBLIC_DEFAULT_AGE_BAND: "9-11",
      NEXT_PUBLIC_QUALITY_TIER: "auto",
    });
    expect(Object.keys(env).every((name) => name.startsWith("NEXT_PUBLIC_"))).toBe(true);
    expect(ignored).toEqual([".env.local", "!.env.local.example", ".next"]);
  });
});
