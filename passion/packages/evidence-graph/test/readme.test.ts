import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const readmeUrl = new URL("../README.md", import.meta.url);

async function readReadme(): Promise<string> {
  return readFile(readmeUrl, "utf8");
}

describe("EvidenceGraph package README", () => {
  it("documents the public domain API", async () => {
    const readme = await readReadme();

    for (const apiName of [
      "canonicalize",
      "addNode",
      "addEdge",
      "assertHumanAuthority",
      "merkleRoot",
      "orderedGraphNodeIds",
      "graphMerkleRoot",
      "buildAttestation",
      "buildGraphAttestation",
      "traceEvidence",
    ]) {
      expect(readme).toContain(`\`${apiName}\``);
    }
  });

  it("documents each port and its current adapter", async () => {
    const readme = await readReadme();

    for (const portName of [
      "Hasher",
      "Verifier",
      "EvidenceRepository",
      "TransparencyLog",
      "ErasureService",
    ]) {
      expect(readme).toContain(`\`${portName}\``);
    }
    for (const adapterName of [
      "NodeCryptoHasher",
      "DeterministicStubVerifier",
      "InMemoryEvidenceRepository",
      "StubTransparencyLog",
      "StubErasureService",
    ]) {
      expect(readme).toContain(`\`${adapterName}\``);
    }
  });

  it("marks deferred decisions D1-D4 and D6 as non-production", async () => {
    const readme = await readReadme();

    expect(readme).toContain("NON-PRODUCTION");
    for (const decision of ["D1", "D2", "D3", "D4", "D6"]) {
      expect(readme).toContain(`**${decision}`);
    }
    expect(readme).toContain("unsigned");
  });
});
