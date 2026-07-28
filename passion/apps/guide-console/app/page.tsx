import type { JSX } from "react";

import { createFsProfileStore } from "@gt100k/profile-store-fs";
import type { StudentProfile } from "@gt100k/student-profile";
import { GuideConsole } from "./console.js";

// The guide console. Installs the `window.__qa` contract (via useConsole) that the LOOP_QA usability
// gate drives.
//
// A server component so it can read the profile store, which is a directory of files. Everything a
// real child has done arrives here and nowhere else; the console below renders synthetic and real
// children through identical code.
export const dynamic = "force-dynamic";

/**
 * Is this actually a child, or just a file that happens to be JSON?
 *
 * `ProfileStore.list()` reports every `*.json` in the directory as a kid, which is right for a
 * directory of profiles and wrong the moment anything else is in there. `consent.json` lives beside
 * them, so the console read it as a child, found no `store` on it, and crashed on the first render
 * with a stack trace instead of a roster. Parsing is not validation: that file loaded perfectly.
 *
 * Checked by shape rather than by filename, because excluding `consent.json` by name would fix this
 * one file and leave the next one to be discovered the same way.
 */
function isProfile(value: unknown): value is StudentProfile {
  if (typeof value !== "object" || value === null) return false;
  const p = value as Partial<StudentProfile>;
  return (
    typeof p.kidId === "string" &&
    Array.isArray(p.interactions) &&
    Array.isArray(p.surfaced) &&
    typeof p.store === "object" &&
    p.store !== null
  );
}

/**
 * Load every ingested profile, and never let a bad one take the console down.
 *
 * A guide opening the console to find nothing is a worse failure than a guide opening it to find
 * three of four children: the first looks like the product is broken, the second is visibly
 * partial. So a profile that will not load, or that turns out not to be one, is skipped.
 */
async function loadIngested(): Promise<readonly StudentProfile[]> {
  try {
    const store = createFsProfileStore(process.env.GT100K_PROFILE_DIR ?? ".profiles");
    const ids = await store.list();
    const loaded = await Promise.all(ids.map((id) => store.load(id).catch(() => null)));
    return loaded.filter(isProfile);
  } catch {
    // No directory yet, which is the normal state before anyone has played.
    return [];
  }
}

export default async function Page(): Promise<JSX.Element> {
  return <GuideConsole ingested={await loadIngested()} />;
}
