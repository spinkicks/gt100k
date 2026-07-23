import type {
  EvidenceEdge,
  EvidenceGraph,
  EvidenceNode,
} from "../../../packages/evidence-graph/src/model.js";
import type { EvidenceRepository } from "../../../packages/evidence-graph/src/ports.js";

function clone<T>(value: T): T {
  return structuredClone(value);
}

/** In-memory synthetic EvidenceRepository with copy-isolated storage boundaries (one graph per project). */
export class InMemoryEvidenceRepository implements EvidenceRepository {
  private readonly nodes = new Map<string, EvidenceNode>();
  private readonly edges: EvidenceEdge[] = [];
  private readonly graphs = new Map<string, EvidenceGraph>();

  async saveNode(node: EvidenceNode): Promise<void> {
    this.nodes.set(node.id, clone(node));
  }

  async getNode(id: string): Promise<EvidenceNode | null> {
    const node = this.nodes.get(id);
    return node === undefined ? null : clone(node);
  }

  async saveEdge(edge: EvidenceEdge): Promise<void> {
    this.edges.push(clone(edge));
  }

  /** Adapter-local read seam for contract tests; the domain port remains write-only for edges. */
  async getEdges(): Promise<EvidenceEdge[]> {
    return clone(this.edges);
  }

  async saveGraph(projectId: string, graph: EvidenceGraph): Promise<void> {
    this.graphs.set(projectId, clone(graph));
  }

  async getGraph(projectId: string): Promise<EvidenceGraph | null> {
    const graph = this.graphs.get(projectId);
    return graph === undefined ? null : clone(graph);
  }

  /** Erasure: drop the whole project graph (the v1 delete-the-project story). */
  async deleteGraph(projectId: string): Promise<void> {
    this.graphs.delete(projectId);
  }
}
