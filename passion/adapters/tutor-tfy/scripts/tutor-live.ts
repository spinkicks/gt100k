import { TfyTutor, tfyConfigFromEnv } from "../src/index.js";
import type { ProjectProfile } from "@gt100k/socratic-defense";

async function main() {
  const t = new TfyTutor(tfyConfigFromEnv());
  const profile: ProjectProfile = {
    id: "live-1",
    studentId: "stu-live",
    title: "DIY Subwoofer",
    domain: "making-engineering",
    summary: "A ported box tuned with Thiele-Small params.",
    artifactRefs: [],
  };
  // Full port context (the adapter methods are typed to the exact interface params).
  const q = await t.nextQuestion({
    profile,
    transcript: [],
    targetFacet: "how",
    isFollowUp: false,
    readinessLevel: "developing",
  });
  const j = await t.judge({
    profile,
    facet: "how",
    question: q,
    answer: "The port length tunes the resonant frequency to the driver's Fs.",
    readinessLevel: "developing",
  });
  console.log(JSON.stringify({ q, j }, null, 2));
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
