import { describe, expect, it } from "vitest";
import type { TurnEvent } from "../../../packages/cohort-compiler/src/model";
import type { MediaTurnSource } from "../../../packages/cohort-compiler/src/ports";
import { turnsFixtures } from "../../../packages/cohort-compiler/test/fixtures/turns";
import { MEDIA_TURN_SOURCE_STATUS, SyntheticMediaTurnSource } from "../src/index";

type Equal<Left, Right> = (<Value>() => Value extends Left ? 1 : 2) extends <
  Value,
>() => Value extends Right ? 1 : 2
  ? true
  : false;

const exactTurnsSignature: Equal<
  MediaTurnSource["turns"],
  (roomRef: string) => Promise<TurnEvent[]>
> = true;

function cloneTurns(turns: readonly TurnEvent[]): TurnEvent[] {
  return turns.map((turn) => ({ ...turn }));
}

describe("MediaTurnSource synthetic adapter (T030, FR-025, SC-008)", () => {
  it("yields the injected synthetic turns through the exact port", async () => {
    const source: MediaTurnSource = new SyntheticMediaTurnSource({
      "room-dominance": turnsFixtures.dominance.turns,
    });

    expect(exactTurnsSignature).toBe(true);
    await expect(source.turns("room-dominance")).resolves.toEqual(turnsFixtures.dominance.turns);
  });

  it("isolates stored turns from input and reader mutation", async () => {
    const injected = cloneTurns(turnsFixtures.interruption.turns);
    const source = new SyntheticMediaTurnSource({ "room-interruption": injected });

    injected[0]!.speaker = "MUTATED-INPUT";
    const firstRead = await source.turns("room-interruption");
    firstRead[0]!.speaker = "MUTATED-READ";

    await expect(source.turns("room-interruption")).resolves.toEqual(
      turnsFixtures.interruption.turns,
    );
  });

  it("represents missing analytics as an empty turn array", async () => {
    const source: MediaTurnSource = new SyntheticMediaTurnSource({});

    await expect(source.turns("missing-room")).resolves.toEqual([]);
  });

  it("is explicitly non-production with the real media plane deferred", () => {
    expect(MEDIA_TURN_SOURCE_STATUS).toEqual({
      production: false,
      deferred: ["WebRTC", "AudioWorklet", "LiveKit"],
      specSection: "15.1",
    });
  });
});
