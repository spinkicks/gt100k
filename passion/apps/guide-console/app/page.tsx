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
 * Load every ingested profile, and never let a bad one take the console down.
 *
 * A guide opening the console to find nothing is a worse failure than a guide opening it to find
 * three of four children: the first looks like the product is broken, the second is visibly
 * partial. So a profile that will not load is skipped rather than thrown.
 */
async function loadIngested(): Promise<readonly StudentProfile[]> {
  try {
    const store = createFsProfileStore(process.env["GT100K_PROFILE_DIR"] ?? ".profiles");
    const ids = await store.list();
    const loaded = await Promise.all(
      ids.map((id) => store.load(id).catch(() => null)),
    );
    return loaded.filter((p): p is StudentProfile => p !== null);
  } catch {
    // No directory yet, which is the normal state before anyone has played.
    return [];
  }
}

export default async function Page(): Promise<JSX.Element> {
  return <GuideConsole ingested={await loadIngested()} />;
}
