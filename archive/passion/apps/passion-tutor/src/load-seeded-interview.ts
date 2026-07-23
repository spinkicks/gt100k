import { InMemoryProjectRepository } from "../../../adapters/passion-tutor-memory/src/public.js";
import { startSession } from "../../../packages/passion-tutor/src/public.js";

const SEEDED_PROJECT_ID = "project-synthetic-solar-oven";
const INTERVIEW_SEED = 7;

export async function loadSeededInterview() {
  const repository = new InMemoryProjectRepository();
  const project = await repository.getById(SEEDED_PROJECT_ID);

  if (!project) throw new Error("SEEDED_PROJECT_NOT_FOUND");

  return {
    project,
    session: startSession({ profile: project, seed: INTERVIEW_SEED }),
  };
}
