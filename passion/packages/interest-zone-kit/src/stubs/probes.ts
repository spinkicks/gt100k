import type {
  AudienceCondition,
  DifficultyBand,
  Domain,
  Probe,
  SocialMode,
  WorkMode,
} from "@gt100k/interest-lab";

export function stubProbe(input: {
  id: string;
  domain: Domain;
  workMode: WorkMode;
  difficulty: DifficultyBand;
  social: SocialMode;
  audience: AudienceCondition;
}): Probe {
  return {
    ...input,
    familyId: input.id,
    prerequisites: [],
    autonomy: "high",
    equipment: [],
    accessibilityVariants: [],
    expectedBurden: 1,
    safetyClass: "cleared",
    artifactEvidence: "Synthetic stub activity artifact.",
  };
}
