/**
 * URL resolution is the one thing here that can ship a broken experience to a real parent, so the
 * production fallback is pinned first and hardest: told nothing, production offers nothing.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import { readSurfaceEnv, resolveSurfaces, type SurfaceEnv } from "../src/surfaces.js";

const NO_URLS: SurfaceEnv["urls"] = {};

describe("resolveSurfaces", () => {
  it("resolves every surface to null in production when nothing is configured", () => {
    const surfaces = resolveSurfaces({ nodeEnv: "production", urls: NO_URLS });

    expect(surfaces.length).toBe(5);
    expect(surfaces.filter((s) => s.url !== null)).toEqual([]);
  });

  it("falls back to the established localhost ports in development", () => {
    const byId = new Map(
      resolveSurfaces({ nodeEnv: "development", urls: NO_URLS }).map((s) => [s.id, s.url]),
    );

    expect(byId.get("guide")).toBe("http://localhost:3020");
    expect(byId.get("parent")).toBe("http://localhost:3055");
    expect(byId.get("studio")).toBe("http://localhost:3010");
    expect(byId.get("evidence")).toBe("http://localhost:3030");
    expect(byId.get("concierge")).toBe("http://localhost:3040");
  });

  it("prefers an explicit URL over both fallbacks", () => {
    const urls = { parent: "https://playbook.example.com" } as const;

    const inProd = resolveSurfaces({ nodeEnv: "production", urls });
    const inDev = resolveSurfaces({ nodeEnv: "development", urls });

    expect(inProd.find((s) => s.id === "parent")?.url).toBe("https://playbook.example.com");
    expect(inDev.find((s) => s.id === "parent")?.url).toBe("https://playbook.example.com");
    // The others are untouched by one surface being configured.
    expect(inProd.find((s) => s.id === "guide")?.url).toBeNull();
  });

  it("treats an empty or whitespace env var as unset", () => {
    const surfaces = resolveSurfaces({ nodeEnv: "production", urls: { guide: "   " } });

    expect(surfaces.find((s) => s.id === "guide")?.url).toBeNull();
  });

  it("keeps the audience of each surface, so the front door can address a role", () => {
    const surfaces = resolveSurfaces({ nodeEnv: "development", urls: NO_URLS });

    expect(surfaces.map((s) => `${s.id}:${s.audience}`)).toEqual([
      "guide:guide",
      "parent:parent",
      "studio:child",
      "evidence:record",
      "concierge:record",
    ]);
  });
});

describe("readSurfaceEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reads each NEXT_PUBLIC_SURFACE_URL_* var by its literal name", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SURFACE_URL_GUIDE", "https://guide.example.com");

    const surfaces = resolveSurfaces(readSurfaceEnv());

    expect(surfaces.find((s) => s.id === "guide")?.url).toBe("https://guide.example.com");
    expect(surfaces.filter((s) => s.url !== null).length).toBe(1);
  });
});
