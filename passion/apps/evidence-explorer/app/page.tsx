import type { JSX } from "react";
import { Observatory } from "../components/Observatory.js";
import {
  buildSyntheticExplorerView,
  buildSyntheticVerification,
} from "../components/synthetic-view.js";

// The deterministic view + verification are built server-side (Node SHA-256 hasher) and static.
export const dynamic = "force-static";

export default async function Page(): Promise<JSX.Element> {
  const view = buildSyntheticExplorerView({ tier: "calm2d" });
  const verification = await buildSyntheticVerification();
  return <Observatory view={view} verification={verification} />;
}
