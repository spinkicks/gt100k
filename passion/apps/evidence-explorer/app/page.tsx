import type { JSX } from "react";
import { Observatory } from "../components/Observatory.js";
import { loadProject } from "../components/project-store.js";

// The persistent pglite store is the source of truth: the page reads the project (auto-seeding
// tiny-runner-v1 on first run) server-side (Node SHA-256 hasher). Rendered dynamically so a refresh
// after a manual add reflects the current store rather than a build-time snapshot.
export const dynamic = "force-dynamic";

export default async function Page(): Promise<JSX.Element> {
  const seed = await loadProject();
  return <Observatory seed={seed} />;
}
