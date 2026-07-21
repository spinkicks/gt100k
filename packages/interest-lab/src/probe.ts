export const WORK_MODES = [
  "build",
  "investigate",
  "compose",
  "explain",
  "perform",
  "debug",
  "collaborate",
  "care",
  "persuade",
] as const;

export type WorkMode = (typeof WORK_MODES)[number];

export const DIFFICULTY_BANDS = ["foundational", "stretch"] as const;

export type DifficultyBand = (typeof DIFFICULTY_BANDS)[number];

export const AUDIENCE_CONDITIONS = ["audience", "no_audience"] as const;

export type AudienceCondition = (typeof AUDIENCE_CONDITIONS)[number];

export const SOCIAL_MODES = ["solo", "group"] as const;

export type SocialMode = (typeof SOCIAL_MODES)[number];

export const SAFETY_CLASSES = ["cleared", "review_required", "blocked"] as const;

export type SafetyClass = (typeof SAFETY_CLASSES)[number];

export const PROVENANCES = ["GUIDE", "RULE", "SHADOW_MODEL"] as const;

export type Provenance = (typeof PROVENANCES)[number];

/** Catalog-supplied broad theme; deliberately not a fixed identity taxonomy. */
export type Domain = string;

export interface Probe {
  id: string;
  familyId: string;
  domain: Domain;
  workMode: WorkMode;
  prerequisites: string[];
  difficulty: DifficultyBand;
  autonomy: "low" | "medium" | "high";
  social: SocialMode;
  audience: AudienceCondition;
  equipment: string[];
  accessibilityVariants: string[];
  expectedBurden: number;
  safetyClass: SafetyClass;
  artifactEvidence: string;
}

export interface ProbeFamily {
  familyId: string;
  variants: Probe[];
}
