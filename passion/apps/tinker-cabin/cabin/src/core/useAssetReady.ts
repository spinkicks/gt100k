/**
 * Probe whether a fetched asset actually exists before we hand its URL to a loader. A dev server
 * (Vite) answers missing paths with index.html (HTTP 200, text/html), which would make GLTFLoader/
 * RGBELoader choke on HTML and throw an uncaught error. So we HEAD the URL and only report ready
 * when the response is OK and NOT html — letting callers mount the procedural fallback otherwise.
 */
import { useEffect, useState } from "react";

export function useAssetReady(url: string): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch(url, { method: "HEAD" })
      .then((r) => {
        const ct = r.headers.get("content-type") ?? "";
        if (alive) setReady(r.ok && !ct.includes("text/html"));
      })
      .catch(() => {
        if (alive) setReady(false);
      });
    return () => {
      alive = false;
    };
  }, [url]);
  return ready;
}
