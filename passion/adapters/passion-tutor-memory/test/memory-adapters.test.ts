import { describe, expect, it } from "vitest";

import type {
  EvidenceRecordEmission,
  PassionTutorEvidenceRecord,
  ProjectProfile,
} from "../../../packages/passion-tutor/src/public.js";

interface ProjectRepositoryView {
  getById(id: string): Promise<ProjectProfile | null>;
}

interface EvidenceSinkView {
  save(emission: EvidenceRecordEmission): Promise<void>;
  getRecords(): Promise<readonly EvidenceRecordEmission[]>;
}

type ProjectRepositoryConstructor = new (
  projects?: readonly ProjectProfile[],
) => ProjectRepositoryView;
type EvidenceSinkConstructor = new () => EvidenceSinkView;

const EXPECTED_SEEDED_PROJECTS: readonly ProjectProfile[] = [
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

async function adapterApi() {
  const api = (await import("../src/public.js")) as Record<string, unknown>;

  expect(api.InMemoryProjectRepository).toBeTypeOf("function");
  expect(api.InMemoryEvidenceSink).toBeTypeOf("function");
  expect(api.SEEDED_PROJECTS).toEqual(EXPECTED_SEEDED_PROJECTS);

  if (
    typeof api.InMemoryProjectRepository !== "function" ||
    typeof api.InMemoryEvidenceSink !== "function" ||
    !Array.isArray(api.SEEDED_PROJECTS)
  ) {
    throw new Error("P2 in-memory adapter API is not implemented");
  }

  return {
    InMemoryProjectRepository: api.InMemoryProjectRepository as ProjectRepositoryConstructor,
    InMemoryEvidenceSink: api.InMemoryEvidenceSink as EvidenceSinkConstructor,
    seededProjects: api.SEEDED_PROJECTS as readonly ProjectProfile[],
  };
}

function makeEmission(
  project: ProjectProfile,
  createdAt: string,
  contentHash: string,
): EvidenceRecordEmission {
  const record: PassionTutorEvidenceRecord = {
    studentId: project.studentId,
    projectId: project.id,
    transcript: [],
    coverageByFacet: {
      what: 0,
      why: 0,
      how: 0,
      challenge: 0,
      next: 0,
      audience: 0,
    },
    gaps: ["what", "why", "how", "challenge", "next", "audience"],
    createdAt,
  };

  return { record, canonicalJson: JSON.stringify(record), contentHash };
}

describe("P2 in-memory project repository", () => {
  it("resolves the seeded synthetic projects by ID and returns null for a missing ID", async () => {
    const { InMemoryProjectRepository, seededProjects } = await adapterApi();
    const repository = new InMemoryProjectRepository();

    await expect(repository.getById(seededProjects[0]!.id)).resolves.toEqual(seededProjects[0]);
    await expect(repository.getById(seededProjects[1]!.id)).resolves.toEqual(seededProjects[1]);
    await expect(repository.getById("project-synthetic-missing")).resolves.toBeNull();
  });

  it("copy-isolates injected, seeded, and returned project profiles", async () => {
    const { InMemoryProjectRepository } = await adapterApi();
    const injected = structuredClone(EXPECTED_SEEDED_PROJECTS);
    const repository = new InMemoryProjectRepository(injected);

    (injected[0]!.artifactRefs as string[]).push("artifact-synthetic-late-mutation");
    const firstRead = await repository.getById(EXPECTED_SEEDED_PROJECTS[0]!.id);
    (firstRead!.artifactRefs as string[]).push("artifact-synthetic-return-mutation");

    await expect(repository.getById(EXPECTED_SEEDED_PROJECTS[0]!.id)).resolves.toEqual(
      EXPECTED_SEEDED_PROJECTS[0],
    );
  });

  it("keeps the default seed canonical if the exported fixture view is mutated", async () => {
    const { InMemoryProjectRepository, seededProjects } = await adapterApi();
    const exportedRefs = seededProjects[0]!.artifactRefs as string[];

    exportedRefs.push("artifact-synthetic-export-mutation");
    const repository = new InMemoryProjectRepository();
    exportedRefs.pop();

    await expect(repository.getById(EXPECTED_SEEDED_PROJECTS[0]!.id)).resolves.toEqual(
      EXPECTED_SEEDED_PROJECTS[0],
    );
  });
});

describe("P2 in-memory evidence sink", () => {
  it("retains emitted records in insertion order for deterministic inspection", async () => {
    const { InMemoryEvidenceSink, seededProjects } = await adapterApi();
    const sink = new InMemoryEvidenceSink();
    const first = makeEmission(seededProjects[0]!, "2026-07-21T13:00:00.000Z", "hash-synthetic-1");
    const second = makeEmission(seededProjects[1]!, "2026-07-21T14:00:00.000Z", "hash-synthetic-2");

    await sink.save(first);
    await sink.save(second);

    await expect(sink.getRecords()).resolves.toEqual([first, second]);
  });

  it("copy-isolates saved and returned evidence emissions", async () => {
    const { InMemoryEvidenceSink, seededProjects } = await adapterApi();
    const sink = new InMemoryEvidenceSink();
    const emission = makeEmission(
      seededProjects[0]!,
      "2026-07-21T13:00:00.000Z",
      "hash-synthetic-1",
    );

    await sink.save(emission);
    (emission.record.gaps as string[]).splice(0);
    const records = await sink.getRecords();
    (records[0]!.record.gaps as string[]).splice(0);

    expect((await sink.getRecords())[0]?.record.gaps).toEqual([
      "what",
      "why",
      "how",
      "challenge",
      "next",
      "audience",
    ]);
  });
});
