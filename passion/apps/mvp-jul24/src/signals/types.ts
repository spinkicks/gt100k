/**
 * Record shapes mirroring `@gt100k/signal-pipeline`'s input contract
 * (`passion/packages/signal-pipeline/src/model.ts`) — the source of truth.
 *
 * Mirrored rather than imported because this app is a standalone Vite demo with
 * no workspace engine dependencies. `log.test.ts` asserts the exact key set, so
 * drift shows up as a failing test rather than a silent mismatch at wiring time.
 *
 * Deliberately absent: any duration-shaped field. Proposal E1 removed
 * `Interaction.depth` precisely so an emitter cannot smuggle time into the
 * belief math; re-adding one here would reopen that hole from the app side.
 */

export interface DepthSignal {
  readonly kind: string;
  readonly value: number;
}

export interface Interaction {
  readonly kidId: string;
  readonly artifactId: string;
  readonly actionType: string;
  readonly timestamp: string; // ISO-8601
  readonly prompted: boolean; // true = the system surfaced/nudged the child here
  readonly sessionId: string;
  readonly depthSignals?: readonly DepthSignal[];
}

/** An artifact that was shown or available in a session — i.e. declinable. */
export interface SurfacedRecord {
  readonly kidId: string;
  readonly artifactId: string;
  readonly sessionId: string;
  readonly timestamp: string; // ISO-8601
}
