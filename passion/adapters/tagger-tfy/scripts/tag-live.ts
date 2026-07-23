// scripts/tag-live.ts
// Opt-in manual verification — makes ONE real TrueFoundry call. NEVER in the gate.
// Requires TFY_API_KEY. Run: pnpm --filter @gt100k/tagger-tfy tag:live "<resource label>"
import { TfyTagger, tfyConfigFromEnv } from "../src/index.js";

async function main() {
  const tagger = new TfyTagger(tfyConfigFromEnv());
  const s = await tagger.suggest({
    id: "live-1",
    kind: "resource",
    label: process.argv[2] ?? "How to build a subwoofer box (Thiele-Small basics)",
  });
  console.log(JSON.stringify(s, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
