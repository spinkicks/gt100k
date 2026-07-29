import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const APP = join(__dirname, "..");
const THREE_TOKENS = ["@react-three/", "postprocessing", 'from "three"', "from 'three'"];

/** Every .ts/.tsx under a dir, recursively. */
function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sourceFiles(p));
    else if (/\.tsx?$/.test(entry.name)) out.push(p);
  }
  return out;
}

describe("no 3D render path", () => {
  it("has no components/cosmos directory", () => {
    expect(existsSync(join(APP, "components/cosmos"))).toBe(false);
  });

  it("no component or app source imports three.js / react-three / postprocessing", () => {
    const offenders: string[] = [];
    for (const dir of ["components", "app"]) {
      for (const file of sourceFiles(join(APP, dir))) {
        const src = readFileSync(file, "utf8");
        if (THREE_TOKENS.some((t) => src.includes(t))) offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("package.json declares no three.js dependencies", () => {
    const pkg = JSON.parse(readFileSync(join(APP, "package.json"), "utf8"));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const banned = [
      "three",
      "@types/three",
      "@react-three/fiber",
      "@react-three/drei",
      "@react-three/postprocessing",
      "postprocessing",
    ];
    expect(banned.filter((d) => d in deps)).toEqual([]);
  });
});
