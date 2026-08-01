"use client";

// The seam between the light wall and the heavy games.
//
// The wall knows only ids and labels (see `gamesForCell` in model.ts). Resolving an id to a real
// puzzle pulls in the whole registry — fifteen components, the audio engine, chess.js, motion — so
// that resolution lives HERE, behind a `next/dynamic` boundary the wall loads only when a child
// opens a game. Keeping this file separate from the wall is what keeps the front door light.

import type { JSX } from "react";
import { gadgetById } from "../runtime/gadgets/registry";
import PuzzleHost from "../runtime/host/PuzzleHost";

export interface GameLauncherProps {
  /** The gadget id chosen at a cell. Resolved against the registry roster. */
  readonly gadgetId: string;
  /** Close the game and return to the wall. */
  readonly onExit: () => void;
  /** The child left the game; `activeMs` is time actually spent here (hidden time excluded). */
  readonly onOpen?: (gadgetId: string, activeMs: number) => void;
  /** The child solved — the one record that forms a work-mode cell. */
  readonly onSolve?: (gadgetId: string) => void;
  /** The child asked for a harder board (`chosen_challenge`). */
  readonly onHarder?: (gadgetId: string) => void;
}

export default function GameLauncher({
  gadgetId,
  onExit,
  onOpen,
  onSolve,
  onHarder,
}: GameLauncherProps): JSX.Element | null {
  const gadget = gadgetById(gadgetId);
  // An id with no gadget means the index and registry drifted. Fail closed and quiet rather than
  // throw under a child: the wall behind is still fully usable.
  if (!gadget) return null;
  return (
    <PuzzleHost
      gadget={gadget}
      onExit={onExit}
      onOpen={onOpen}
      onSolve={onSolve}
      onHarder={onHarder}
    />
  );
}
