/**
 * The one place that decides whether an artefact's address becomes a clickable link.
 *
 * Every surface that shows a child's work wants to offer "go and look at it", and every one of them
 * was building that link itself. On a synthetic roster all those addresses are invented, so the demo
 * offered clicks that answered with a 404 — and one of them, before this, was a Rickroll.
 *
 * Attestation genuinely needs the address, because it is the half of a claim a child cannot fake, so
 * the field is required and stays required. What changes is that only a real address becomes a link.
 */
import type { JSX } from "react";

import { isDemoUrl } from "./maps.js";

export function Look({ url }: { url?: string }): JSX.Element | null {
  if (url === undefined) return null;
  if (isDemoUrl(url)) {
    // Named as demo rather than silently dropped. A guide reading the pilot roster should be able to
    // tell the difference between "this child linked nothing" and "this child is not real".
    return <span className="look look--demo">demo link</span>;
  }
  return (
    <a className="look mapwork__src" href={url} target="_blank" rel="noreferrer noopener">
      Look at it
    </a>
  );
}
