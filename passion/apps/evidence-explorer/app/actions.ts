"use server";
import type { ExplorerView } from "@gt100k/evidence-explorer-view";
/**
 * Manual add-node / add-edge **server actions** (Phase 4). The app builds the graph + views
 * SERVER-SIDE (Node SHA-256 hasher — no client crypto), so a manual add round-trips through here: the
 * client passes its current working `EvidenceGraph` + the small form input, the action news up the
 * hasher, runs the pure `manual-add` core, and returns a fresh, serializable render bundle.
 *
 * Adds are **ephemeral this pass** — nothing is persisted (no pglite / DB wiring in the Next runtime).
 * Domain errors (`INVALID_NODE_INPUT`, `DANGLING_REF`, `CYCLE`) are caught and returned as a friendly
 * message rather than thrown, so the panel can surface them inline instead of tripping an error page.
 */
import type { EvidenceGraph } from "@gt100k/evidence-graph";
import { NodeCryptoHasher } from "@gt100k/evidence-hash-node";
import {
  type AddEdgeInput,
  type AddNodeInput,
  applyAddEdge,
  applyAddNode,
  rebuildBundle,
  tamperSubject,
} from "../components/manual-add.js";
import type { SyntheticVerification } from "../components/synthetic-view.js";

/** Stable per-session refs the client holds from the initial synthetic seed. */
export interface AddContext {
  readonly projectRef: string;
  /** Content id of the released-artifact node the graph attests to (the verify/tamper subject). */
  readonly subjectDigest: string;
}

/** What the action hands back: a fresh render bundle on success, else a friendly error string. */
export type AddResult =
  | {
      readonly ok: true;
      readonly graph: EvidenceGraph;
      readonly view: ExplorerView;
      readonly verification: SyntheticVerification;
    }
  | { readonly ok: false; readonly error: string };

/** Map a thrown domain error to a calm, non-accusatory sentence for the panel. */
function friendlyError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (message.startsWith("INVALID_NODE_INPUT")) {
    return "Enter a title and an actor reference before adding a node.";
  }
  if (message.startsWith("CYCLE")) {
    return "That edge would create a cycle — evidence flows one way, from sources to outcomes.";
  }
  if (message.startsWith("DANGLING_REF")) {
    return "That edge points to a node that isn't in the graph yet.";
  }
  return "That add could not be applied.";
}

/**
 * Re-derive the full `{ graph, view, verification }` bundle for the working graph, including both the
 * honest and the (deterministically) tampered verification views so the Verify/Tamper demo keeps
 * working after manual adds. The tamper targets the released-artifact byte-body — never a person.
 */
async function finalize(graph: EvidenceGraph, ctx: AddContext): Promise<AddResult> {
  const hasher = new NodeCryptoHasher();
  const honest = await rebuildBundle(graph, ctx.projectRef, ctx.subjectDigest, hasher);
  const tampered = await rebuildBundle(
    tamperSubject(graph, ctx.subjectDigest),
    ctx.projectRef,
    ctx.subjectDigest,
    hasher,
  );
  return {
    ok: true,
    graph,
    view: honest.view,
    verification: {
      verified: honest.verification,
      tampered: tampered.verification,
      tamperNodeId: ctx.subjectDigest,
    },
  };
}

/** Append a manual node to the client's working graph and return the re-derived bundle. */
export async function addNodeAction(
  currentGraph: EvidenceGraph,
  input: AddNodeInput,
  ctx: AddContext,
): Promise<AddResult> {
  try {
    const hasher = new NodeCryptoHasher();
    const { graph } = applyAddNode(currentGraph, input, hasher);
    return await finalize(graph, ctx);
  } catch (err) {
    return { ok: false, error: friendlyError(err) };
  }
}

/** Append a manual edge to the client's working graph and return the re-derived bundle. */
export async function addEdgeAction(
  currentGraph: EvidenceGraph,
  input: AddEdgeInput,
  ctx: AddContext,
): Promise<AddResult> {
  try {
    const { graph } = applyAddEdge(currentGraph, input);
    return await finalize(graph, ctx);
  } catch (err) {
    return { ok: false, error: friendlyError(err) };
  }
}
