// scripts/timeback-live.ts
// OPT-IN manual verification — makes a REAL TimeBack API call. NEVER in the gate; never imported by a
// test. There is NO real API yet — this is the ready-to-flip scaffold. Requires TIMEBACK_BASE_URL +
// TIMEBACK_API_KEY. Run:
//   TIMEBACK_BASE_URL=… TIMEBACK_API_KEY=… pnpm --filter @gt100k/timeback-live timeback:live kid-synthetic-001
//
// It fetches the kid's snapshot, then prints the resulting `DomainPrior[]` (the ONE-WAY school→passion
// starting hint — never a gate) + the per-cabin provenance. A down/absent API prints an empty snapshot.
import { explainPriors, toDomainPriors } from "@gt100k/timeback";
import { TimeBackClient, timeBackConfigFromEnv } from "../src/index.js";

async function main() {
  const cfg = timeBackConfigFromEnv();
  const kidId = process.argv[2] ?? "live-kid";
  const client = new TimeBackClient(cfg);

  const snapshot = await client.fetchSnapshot(kidId);
  console.log("=== TimeBack snapshot ===");
  console.log(JSON.stringify(snapshot, null, 2));

  console.log("\n=== DomainPriors (starting hint only — NEVER a gate) ===");
  console.log(JSON.stringify(toDomainPriors(snapshot), null, 2));

  console.log("\n=== Provenance (offered contributing subjects per cabin) ===");
  console.log(JSON.stringify([...explainPriors(snapshot)], null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
