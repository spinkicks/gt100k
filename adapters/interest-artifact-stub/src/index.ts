import { acceptArtifactSignal } from "@gt100k/interest-lab";
import type { ArtifactSignalSource, ArtifactTransition } from "@gt100k/interest-lab";

/** Finite synthetic source that validates every payload before it can enter the queue. */
export class StubArtifactSignalSource implements ArtifactSignalSource<ArtifactTransition> {
  private readonly queue: ArtifactTransition[];
  private index = 0;

  constructor(payloads: readonly unknown[] = []) {
    this.queue = payloads.map((payload) => acceptArtifactSignal(payload));
  }

  next(): Promise<ArtifactTransition | null> {
    const transition = this.queue[this.index];
    this.index += 1;
    return Promise.resolve(transition === undefined ? null : { ...transition });
  }
}
