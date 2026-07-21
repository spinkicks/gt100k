import type { JSX } from "react";
import { Observatory } from "../components/Observatory.js";
import { buildSyntheticExplorerView } from "../components/synthetic-view.js";

// The deterministic view is built server-side (Node SHA-256 hasher) and rendered statically.
export const dynamic = "force-static";

export default function Page(): JSX.Element {
  const view = buildSyntheticExplorerView({ tier: "calm2d" });
  return <Observatory view={view} />;
}
