import { readFileSync, readdirSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packagesRoot = resolve(packageRoot, "..");

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return sourceFiles(path);
    }
    return [".ts", ".tsx"].includes(extname(entry.name)) ? [path] : [];
  });
}

function importSources(path: string): string[] {
  const source = readFileSync(path, "utf8");
  return [...source.matchAll(/(?:from\s+|import\s*\()\s*["']([^"']+)["']/g)].map(
    (match) => match[1]!,
  );
}

describe("Interest Lab core import graph", () => {
  it("keeps the domain and pure-view packages free of React and Three", () => {
    const violations = ["interest-lab", "interest-lab-view"].flatMap((packageName) =>
      sourceFiles(join(packagesRoot, packageName, "src")).flatMap((path) =>
        importSources(path)
          .filter(
            (source) =>
              source === "react" || source === "three" || source.startsWith("@react-three/"),
          )
          .map((source) => `${path}: ${source}`),
      ),
    );

    expect(violations).toEqual([]);
  });

  it("keeps every interest-zone package independent of other zones and the app", () => {
    const zonePackages = readdirSync(packagesRoot, { withFileTypes: true }).filter(
      (entry) => entry.isDirectory() && entry.name.startsWith("interest-zone-"),
    );
    const violations = zonePackages.flatMap((entry) =>
      sourceFiles(join(packagesRoot, entry.name, "src")).flatMap((path) =>
        importSources(path)
          .filter(
            (source) =>
              (source.startsWith("@gt100k/interest-zone-") && source !== `@gt100k/${entry.name}`) ||
              source === "@gt100k/interest-lab-app" ||
              source.includes("/apps/interest-lab"),
          )
          .map((source) => `${path}: ${source}`),
      ),
    );

    expect(violations).toEqual([]);
  });
});
