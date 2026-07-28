// Turning a child's quest log into evidence they can point at.
//
// `@gt100k/project-evidence-sink` has been built, tested and unused: this app kept a local journal
// and never materialized it. The journal is a list of things that happened; the graph is a
// content-addressed record where every node's id IS the hash of its content, so a changed entry
// gets a different id and the change is visible rather than silent. That is the whole point of E1,
// and it is worth nothing while it runs nowhere.
//
// Server-side because the hasher is. `graphEvidenceSink` defaults to `NodeCryptoHasher`, real
// SHA-256; the browser alternative would be `stubHasher`, which is FNV-1a and explicitly for CI
// reproduction. Shipping a non-cryptographic hash under the word "fingerprint" would be the kind of
// quiet lie the graph exists to prevent, so this runs where the real one does.
//
// It goes through the sink and never touches `@gt100k/evidence-graph` directly, which is the
// boundary `@gt100k/boundaries` enforces: the graph is its own product and this adapter is the one
// declared seam into it.
import { NextResponse } from "next/server";
import { graphEvidenceSink } from "@gt100k/project-evidence-sink";
import type { Project } from "@gt100k/project-workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  let project: Project;
  try {
    project = (await request.json()) as Project;
  } catch {
    return NextResponse.json({ error: "body is not JSON" }, { status: 400 });
  }

  if (typeof project?.id !== "string" || !Array.isArray(project?.events)) {
    return NextResponse.json({ error: "not a project" }, { status: 400 });
  }

  try {
    const graph = graphEvidenceSink().record(project);
    const nodes = Object.values(graph.nodes);
    return NextResponse.json({
      projectId: project.id,
      nodes: nodes.length,
      edges: graph.edges.length,
      // Every entry that produced a node, so the studio can show a child which of their own
      // entries are on the record and which were skipped for being malformed.
      recorded: nodes.map((n) => n.id),
    });
  } catch (error) {
    // The sink skips malformed events rather than throwing, so reaching here means something
    // structural. Reported rather than swallowed: a child whose work silently fails to be recorded
    // is the failure this whole subsystem exists to make impossible.
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "could not record" },
      { status: 422 },
    );
  }
}
