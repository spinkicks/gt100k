import type {
  EvidenceRecordEmission,
  ProjectProfile,
} from "../../../packages/passion-tutor/src/public.js";

function clone<T>(value: T): T {
  return structuredClone(value);
}

const CANONICAL_SEEDED_PROJECTS: readonly ProjectProfile[] = [
  {
    id: "project-synthetic-solar-oven",
    studentId: "student-synthetic-river",
    title: "Sunrise Solar Oven",
    domain: "renewable energy engineering",
    summary: "A cardboard solar oven prototype for warming an afternoon snack.",
    artifactRefs: ["artifact-synthetic-oven-sketch", "artifact-synthetic-heat-log"],
  },
  {
    id: "project-synthetic-bird-atlas",
    studentId: "student-synthetic-sage",
    title: "Backyard Bird Atlas",
    domain: "urban ecology mapping",
    summary: "An illustrated map of fictional bird sightings across a neighborhood park.",
    artifactRefs: ["artifact-synthetic-field-map", "artifact-synthetic-bird-cards"],
  },
];

export const SEEDED_PROJECTS: readonly ProjectProfile[] = clone(CANONICAL_SEEDED_PROJECTS);

/** In-memory project source seeded only with explicit synthetic profiles. */
export class InMemoryProjectRepository {
  private readonly projects: Map<string, ProjectProfile>;

  constructor(projects: readonly ProjectProfile[] = CANONICAL_SEEDED_PROJECTS) {
    this.projects = new Map(projects.map((project) => [project.id, clone(project)]));
  }

  async getById(id: string): Promise<ProjectProfile | null> {
    const project = this.projects.get(id);
    return project === undefined ? null : clone(project);
  }
}

/** In-memory evidence sink with an inspection seam for headless acceptance tests. */
export class InMemoryEvidenceSink {
  private readonly records: EvidenceRecordEmission[] = [];

  async save(emission: EvidenceRecordEmission): Promise<void> {
    this.records.push(clone(emission));
  }

  async getRecords(): Promise<readonly EvidenceRecordEmission[]> {
    return clone(this.records);
  }
}
