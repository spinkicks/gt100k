// scripts/mastery-map-live.ts: OPT-IN manual harness
// (`pnpm --filter @gt100k/mastery-map-live map:live`). Generates ONE real mastery map for a seeded
// domain via TFY, verifies its citations over the network, and prints the map plus a citation
// report. Requires TFY_API_KEY. NEVER run in the gate (not a test); the domain gate stays offline
// and deterministic.
//
// The report is the thing worth watching. It shows what the model claimed and what survived being
// checked, which is the only way to see, by hand, whether a given model fabricates under this
// prompt.
import { TfyMapGenerator, tfyConfigFromEnv } from "../src/index.js";
import type { CuratedResource } from "@gt100k/concierge";
import type { MapContext, MasteryMap } from "@gt100k/mastery-map";

/** Human-vetted in the concierge's library, upstream of here. The generator attaches, never fetches. */
const SEED_RESOURCES: readonly CuratedResource[] = [
  {
    id: "cr-abrsm-piano",
    title: "ABRSM: piano exam requirements and syllabus downloads",
    url: "https://www.abrsm.org/en-gb/instruments/piano",
    domainPath: ["music-sound", "instruments"],
    pursuits: ["piano"],
    affordedModes: ["perform"],
    reputation: 0.95,
    ageTiers: ["9-11", "12-14"],
    provenance: "curated-library:human-vetted",
  },
];

// Piano on purpose: a domain with real published syllabuses, so a model that wanted to cite one
// honestly could, and a model that fabricates has no excuse to.
const CTX: MapContext = {
  domainPath: ["music-sound", "instruments"],
  modes: ["perform", "compose"],
  ageBands: ["9-11", "12-14"],
  resources: SEED_RESOURCES,
};

function citationReport(map: MasteryMap): string {
  const lines = map.milestones.map((m) => {
    const urls = m.ordering.sources.map((s) => s.url).join(", ");
    return `  ${m.ordering.basis.padEnd(9)} ${m.id}${urls === "" ? "" : `  <- ${urls}`}`;
  });
  const onModel = map.milestones.filter((m) => m.ordering.basis === "model").length;
  return [
    "Ordering basis per milestone, AFTER every cited url was fetched:",
    ...lines,
    `\n${onModel} of ${map.milestones.length} rest on the model's own reasoning.`,
    "Anything that says `model` either said so itself or had a citation that did not resolve.",
  ].join("\n");
}

async function main(): Promise<void> {
  const cfg = tfyConfigFromEnv();
  const generator = new TfyMapGenerator(cfg);
  const map = await generator.generate(CTX);

  console.log(JSON.stringify(map, null, 2));
  console.log(`\n${citationReport(map)}`);
  console.log(
    `\nprovenance.model=${map.provenance.model} ` +
      `(${map.provenance.model === "stub" ? "the coerced fallback" : "a real TFY map"})`,
  );
  console.log(
    `errors=${map.validation.errors.length} ` +
      `warnings=${map.validation.warnings.map((w) => w.code).join(", ") || "none"}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
