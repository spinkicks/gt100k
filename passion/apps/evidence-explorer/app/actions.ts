"use server";
import type { ExplorerView } from "@gt100k/evidence-explorer-view";
/**
 * Manual add-node / add-edge / reset **server actions** (P3b). The persistent pglite store is now the
 * single source of truth: each action mutates the on-disk store (hashing + validating server-side via
 * the Node SHA-256 hasher — no client crypto) and hands back a fresh, serializable render bundle so
 * the client updates immediately, while `revalidatePath('/')` ensures a later refresh reflects the
 * store too. Adds therefore PERSIST across a refresh and a dev-server restart.
 *
 * Domain rejections (`INVALID_NODE_INPUT`, `DANGLING_REF`, `CYCLE`) are caught inside the store and
 * returned as a friendly message rather than thrown, so the panel can surface them inline.
 */
import type { EvidenceGraph } from "@gt100k/evidence-graph";
import { revalidatePath } from "next/cache";
import type { AddEdgeInput, AddNodeInput } from "../components/manual-add.js";
import { addEdgeToStore, addNodeToStore, resetProject } from "../components/project-store.js";
import type { SyntheticVerification } from "../components/synthetic-view.js";

/** What the actions hand back: a fresh render bundle on success, else a friendly error string. */
export type AddResult =
  | {
      readonly ok: true;
      readonly graph: EvidenceGraph;
      readonly view: ExplorerView;
      readonly verification: SyntheticVerification;
    }
  | { readonly ok: false; readonly error: string };

/** Append a manual node to the persistent store and return the re-derived bundle. */
export async function addNodeAction(input: AddNodeInput): Promise<AddResult> {
  const result = await addNodeToStore(input);
  if (!result.ok) {
    return result;
  }
  revalidatePath("/");
  const { graph, view, verification } = result.seed;
  return { ok: true, graph, view, verification };
}

/** Append a manual edge to the persistent store and return the re-derived bundle. */
export async function addEdgeAction(input: AddEdgeInput): Promise<AddResult> {
  const result = await addEdgeToStore(input);
  if (!result.ok) {
    return result;
  }
  revalidatePath("/");
  const { graph, view, verification } = result.seed;
  return { ok: true, graph, view, verification };
}

/** Reset the persistent store back to the seed graph and return the fresh bundle. */
export async function resetAction(): Promise<AddResult> {
  const seed = await resetProject();
  revalidatePath("/");
  const { graph, view, verification } = seed;
  return { ok: true, graph, view, verification };
}
