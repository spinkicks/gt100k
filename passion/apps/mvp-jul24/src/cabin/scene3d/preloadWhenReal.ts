/**
 * Preload an optional asset ONLY once we know it is really there.
 *
 * The problem this exists for is the same one `useAssetReady` guards the render path against, and
 * the preloads were quietly bypassing it. A dev or preview server answers a missing path with
 * index.html at HTTP 200 and `content-type: text/html`, so a loader handed that URL does not get a
 * rejected promise. It gets a successful response, tries to decode an HTML page as a JPEG or a GLB,
 * and throws from inside its own `onLoad`: "Cannot read properties of undefined (reading 'image')".
 *
 * That is why the old comment on these call sites was wrong. It reasoned that a missing asset was a
 * "harmless no-op ... the rejected promise just never gets read", which is true against a server
 * that 404s and false against the one we actually develop on. The fetched assets are gitignored, so
 * on a fresh clone every one of them takes this path.
 *
 * The perf intent of preloading at import time is worth keeping: it starts the real fetch in
 * parallel with the probes instead of waiting for `useAssetReady` to flip. So this keeps that and
 * only adds the same HEAD check the render path already does. The cost is one HEAD per asset, which
 * is what `useAssetReady` was going to spend anyway.
 */

/** True when the URL resolves to something that is not the SPA fallback. */
export async function assetExists(url: string): Promise<boolean> {
  try {
    const r = await fetch(url, { method: "HEAD" });
    const ct = r.headers.get("content-type") ?? "";
    return r.ok && !ct.includes("text/html");
  } catch {
    return false;
  }
}

/**
 * Run `preload` for `url` only if the asset is really there. Never rejects: a missing optional
 * asset is an expected state (the procedural fallback covers it), not an error worth surfacing.
 *
 * `url` is what gets probed; `preload` receives nothing and should close over whatever shape its
 * loader wants, since drei's preloaders take a string, a record or an options object.
 */
export function preloadWhenReal(url: string, preload: () => void): void {
  void assetExists(url).then((ok) => {
    if (!ok) return;
    try {
      preload();
    } catch {
      // A loader that throws during preload must not take the app down: the render path is gated
      // behind useAssetReady and Suspense, so the procedural fallback still renders.
    }
  });
}
