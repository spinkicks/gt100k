import type {
  EvidenceEdge,
  EvidenceNode,
  EvidencePacket,
} from "../../../packages/evidence-graph/src/model.js";
import type { EvidenceRepository } from "../../../packages/evidence-graph/src/ports.js";

function clone<T>(value: T): T {
  return structuredClone(value);
}

/** In-memory synthetic EvidenceRepository with copy-isolated storage boundaries. */
export class InMemoryEvidenceRepository implements EvidenceRepository {
  private readonly nodes = new Map<string, EvidenceNode>();
  private readonly edges: EvidenceEdge[] = [];
  private readonly packets = new Map<string, EvidencePacket>();

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

  async savePacket(packet: EvidencePacket): Promise<void> {
    this.packets.set(packet.milestoneRef, clone(packet));
  }

  async getPacket(milestoneRef: string): Promise<EvidencePacket | null> {
    const packet = this.packets.get(milestoneRef);
    return packet === undefined ? null : clone(packet);
  }
}
