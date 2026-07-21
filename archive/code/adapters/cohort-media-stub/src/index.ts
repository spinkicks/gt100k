import type { TurnEvent } from "../../../packages/cohort-compiler/src/model";
import type { MediaTurnSource } from "../../../packages/cohort-compiler/src/ports";

export const MEDIA_TURN_SOURCE_STATUS = {
  production: false,
  deferred: ["WebRTC", "AudioWorklet", "LiveKit"],
  specSection: "15.1",
} as const;

function cloneTurns(turns: readonly TurnEvent[]): TurnEvent[] {
  return turns.map((turn) => ({ ...turn }));
}

/** Synthetic-only stub. The real media capture and transport plane remain deferred. */
export class SyntheticMediaTurnSource implements MediaTurnSource {
  private readonly turnsByRoom: ReadonlyMap<string, readonly TurnEvent[]>;

  constructor(turnsByRoom: Readonly<Record<string, readonly TurnEvent[]>>) {
    this.turnsByRoom = new Map(
      Object.entries(turnsByRoom).map(([roomRef, turns]) => [roomRef, cloneTurns(turns)]),
    );
  }

  async turns(roomRef: string): Promise<TurnEvent[]> {
    return cloneTurns(this.turnsByRoom.get(roomRef) ?? []);
  }
}
