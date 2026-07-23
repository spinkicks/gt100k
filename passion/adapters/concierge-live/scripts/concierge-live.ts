// scripts/concierge-live.ts
// OPT-IN manual verification — makes REAL TrueFoundry + Wikipedia calls. NEVER in the gate.
// Requires TFY_API_KEY. Run:
//   TFY_API_KEY=… pnpm --filter @gt100k/concierge-live concierge:live "How do tardigrades survive in space?"
//
// It runs the real `runConcierge` pipeline with the async real ports that fit it — `TfyGenerator`
// (grounded LLM generation) + `AllowlistRetriever` (real Wikipedia evidence) — over the deterministic
// stub safety gates (the `Moderator`/`DistressClassifier`/`Faithfulness` ports are synchronous, so a
// network-backed impl can't sit inside the pipeline; see .loop/decisions.md). It THEN runs the
// TFY safety checkers (`TfyDistress`/`TfyModerator`/`TfyFaithfulness`) directly to show the real
// models around the answer — cite-or-refuse for a topic question, escalate for a distress message.
import {
  runConcierge,
  stubDistress,
  stubFaithfulness,
  stubHasher,
  stubModerator,
  stubReadability,
  type ConciergeDeps,
  type ConciergeRequest,
  type CuratedLibrary,
} from "@gt100k/concierge";
import {
  AllowlistRetriever,
  TfyDistress,
  TfyFaithfulness,
  TfyGenerator,
  TfyModerator,
  tfyConfigFromEnv,
} from "../src/index.js";

async function main() {
  const cfg = tfyConfigFromEnv();
  const library: CuratedLibrary = []; // empty ⇒ every question is a genuine gap ⇒ open-web retrieval

  // Real async ports that fit the pipeline; deterministic stubs for the synchronous safety gates.
  const deps: ConciergeDeps = {
    library,
    moderator: stubModerator,
    distress: stubDistress,
    retriever: new AllowlistRetriever(),
    generator: new TfyGenerator(cfg),
    faithfulness: stubFaithfulness,
    readability: stubReadability,
    hasher: stubHasher,
  };

  // The TFY safety models — demonstrated directly around the pipeline answer.
  const tfyDistress = new TfyDistress(cfg);
  const tfyModerator = new TfyModerator(cfg);
  const tfyFaithfulness = new TfyFaithfulness(cfg);

  const topic = process.argv[2] ?? "How do tardigrades survive in space?";
  const gap: ConciergeRequest = {
    kidId: "live-kid",
    ageTier: "12-14",
    message: topic,
    sessionId: "live-session",
  };

  console.log("=== TOPIC QUESTION (real web + real TFY generation, cite-or-refuse) ===");
  console.log("Q:", topic);
  console.log("TFY input moderation:", await tfyModerator.moderate(topic, gap.ageTier, "input"));
  console.log("TFY distress:", await tfyDistress.assess(topic));
  const result = await runConcierge(gap, deps);
  console.log("Response:", JSON.stringify(result.response, null, 2));
  if (result.response.kind === "answer" && result.response.text) {
    // Show the TFY faithfulness model's read of the same answer (the pipeline used the stub gate).
    console.log(
      "TFY faithfulness on the served answer:",
      await tfyFaithfulness.score(result.response.text, result.cache?.map((c) => c.doc) ?? []),
    );
  }

  console.log("\n=== DISTRESS MESSAGE (escalate to a human, no answer) ===");
  const distressMsg = "i want to hurt myself and no one likes me";
  const distress: ConciergeRequest = { ...gap, message: distressMsg, sessionId: "live-session-2" };
  console.log("Q:", distressMsg);
  console.log("TFY distress:", await tfyDistress.assess(distressMsg));
  console.log("Response:", JSON.stringify((await runConcierge(distress, deps)).response, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
