/**
 * The regression this guards: every optional 3D asset is gitignored, and a dev server answers a
 * missing path with index.html at HTTP 200. Handing that to a loader is what produced
 * "Cannot read properties of undefined (reading 'image')" on the map screen, before any 3D scene
 * had even mounted, because the preloads ran at import time and skipped the existence probe the
 * render path already does.
 */
import { afterEach, describe, expect, test, vi } from "vitest";

import { assetExists, preloadWhenReal } from "./preloadWhenReal";

const respond = (init: { ok: boolean; contentType: string }) =>
  vi.fn().mockResolvedValue({
    ok: init.ok,
    headers: { get: (h: string) => (h === "content-type" ? init.contentType : null) },
  });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("assetExists", () => {
  test("false for the SPA fallback, which is a 200 with an HTML body", async () => {
    vi.stubGlobal("fetch", respond({ ok: true, contentType: "text/html" }));
    await expect(assetExists("/assets/env/vista.jpg")).resolves.toBe(false);
  });

  test("true for a real asset", async () => {
    vi.stubGlobal("fetch", respond({ ok: true, contentType: "image/jpeg" }));
    await expect(assetExists("/assets/env/vista.jpg")).resolves.toBe(true);
  });

  test("false on a 404, and false when the network throws", async () => {
    vi.stubGlobal("fetch", respond({ ok: false, contentType: "image/jpeg" }));
    await expect(assetExists("/x.jpg")).resolves.toBe(false);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(assetExists("/x.jpg")).resolves.toBe(false);
  });

  test("probes with HEAD, so it never downloads the asset twice", async () => {
    const f = respond({ ok: true, contentType: "image/jpeg" });
    vi.stubGlobal("fetch", f);
    await assetExists("/a.jpg");
    expect(f).toHaveBeenCalledWith("/a.jpg", { method: "HEAD" });
  });
});

describe("preloadWhenReal", () => {
  const flush = async () => {
    await Promise.resolve();
    await Promise.resolve();
  };

  test("does NOT preload when the server returns the HTML fallback", async () => {
    vi.stubGlobal("fetch", respond({ ok: true, contentType: "text/html" }));
    const preload = vi.fn();
    preloadWhenReal("/assets/models/cat.glb", preload);
    await flush();
    expect(preload).not.toHaveBeenCalled();
  });

  test("does preload when the asset is real", async () => {
    vi.stubGlobal("fetch", respond({ ok: true, contentType: "model/gltf-binary" }));
    const preload = vi.fn();
    preloadWhenReal("/assets/models/cat.glb", preload);
    await flush();
    expect(preload).toHaveBeenCalledOnce();
  });

  test("a loader that throws during preload does not escape", async () => {
    vi.stubGlobal("fetch", respond({ ok: true, contentType: "image/jpeg" }));
    preloadWhenReal("/a.jpg", () => {
      throw new Error("loader blew up");
    });
    await expect(flush()).resolves.toBeUndefined();
  });

  test("a failed probe is not an error: a missing optional asset is an expected state", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const preload = vi.fn();
    preloadWhenReal("/a.jpg", preload);
    await flush();
    expect(preload).not.toHaveBeenCalled();
  });
});
