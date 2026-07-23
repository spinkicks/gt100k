import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const workspaceRoot = fileURLToPath(new URL("../../../", import.meta.url));

describe("synthetic EvidenceGraph demo", () => {
  it("runs the documented pnpm command through persistence and verification", async () => {
    const { stdout, stderr } = await execFileAsync(
      "pnpm",
      ["--filter", "@gt100k/evidence-repo-memory", "demo"],
      {
        cwd: workspaceRoot,
        env: { ...process.env, FORCE_COLOR: "0" },
      },
    );

    expect(stderr).toBe("");
    expect(stdout).toContain("Synthetic project: speaker-v1");
    expect(stdout).toContain("Graph: 8 nodes, 13 edges");
    expect(stdout).toContain("Human authority: PASS");
    expect(stdout).toMatch(/Graph root: [a-f0-9]{64}/u);
    expect(stdout).toContain("Persisted graph: PASS");
    expect(stdout).toContain("Verification: PASS");
  }, 15_000);
});
