import type { JSX } from "react";
import { Observatory } from "../components/Observatory.js";
import { buildSyntheticSeed } from "../components/synthetic-view.js";

// The deterministic seed (graph + view + verification) is built server-side (Node SHA-256 hasher).
export const dynamic = "force-static";

export default async function Page(): Promise<JSX.Element> {
  const seed = await buildSyntheticSeed({ tier: "calm2d" });
  return <Observatory seed={seed} />;
}
