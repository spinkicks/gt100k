import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("arena app manifest", () => {
  it("pins the React 18-compatible 3D stack", () => {
    const manifestUrl = new URL("../../../apps/arena/package.json", import.meta.url);

    expect(existsSync(manifestUrl), "apps/arena/package.json should exist").toBe(true);

    const manifest = JSON.parse(readFileSync(manifestUrl, "utf8"));

    expect(manifest).toEqual({
      name: "@gt100k/arena-world-app",
      version: "0.1.0",
      private: true,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
      },
      dependencies: {
        "@gt100k/arena-world": "workspace:*",
        "@gt100k/learning-loop": "workspace:*",
        "@react-three/drei": "^9.114.0",
        "@react-three/fiber": "^8.17.10",
        "@react-three/postprocessing": "^2.16.3",
        motion: "^12",
        next: "^14.2.15",
        react: "^18.3.1",
        "react-dom": "^18.3.1",
        three: "^0.169.0",
      },
      devDependencies: {
        "@types/react": "^18.3.12",
        "@types/react-dom": "^18.3.1",
        "@types/three": "^0.169.0",
      },
    });
  });
});
