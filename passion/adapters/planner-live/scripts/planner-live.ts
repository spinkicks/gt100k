// scripts/planner-live.ts — OPT-IN manual harness (`pnpm --filter @gt100k/planner-live planner:live`).
// Generates ONE real, grounded Type III brief for a seeded S3 spike via TFY and prints it. Requires
// TFY_API_KEY. NEVER run in the gate (not a test); the domain gate stays offline + deterministic.
import { TfyBriefGenerator, tfyConfigFromEnv } from "../src/index.js";
import type { BriefContext, CuratedResource } from "@gt100k/specialization-planner";

const SEED_RESOURCES: readonly CuratedResource[] = [
  {
    id: "res-music-prod-01",
    title: "Home Studio: Recording & Mixing Basics",
    url: "https://curated.example/music/home-studio-basics",
    domainPath: ["music-sound", "production"],
    affordedModes: ["build", "compose"],
    reputation: 0.92,
    ageTiers: ["12-14"],
    provenance: "synthetic-seed",
  },
];

const CTX: BriefContext = {
  domainPath: ["music-sound", "production"],
  mode: "build",
  stage: "S3_AUTHORSHIP",
  audience: "REAL_COMMUNITY",
  craftFloorHint: "one chosen, capped practice on a mix technique the audience will notice",
  resources: SEED_RESOURCES,
};

async function main(): Promise<void> {
  const cfg = tfyConfigFromEnv();
  const generator = new TfyBriefGenerator(cfg);
  const brief = await generator.generate(CTX);
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(brief, null, 2));
  // eslint-disable-next-line no-console
  console.log(`\nsource=${brief.source} (llm = real TFY brief; stub = coerced fallback)`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});
