/**
 * Every activity actually mounts the teach-in.
 *
 * `rules.test.tsx` proves a rule *exists* for every activity; this proves the activity *shows* it.
 * Both halves are needed: a rule in the table that no puzzle mounts explains nothing, and this is the
 * cheapest possible guard on PROJECT.md's binding condition that every activity is explained.
 *
 * The list is the sixteen components in the tree, not the nine in the registry, because three are
 * parked rather than deleted (see src/gadgets/registry.ts) and re-adding one is meant to be a
 * one-line change — and Tune Repair is built but not yet registered, because the music room needs an
 * art pass before it can hold a gadget (see docs/superpowers/specs/2026-07-27-music-cabin-design.md).
 */
import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, test } from "vitest";
import type { PuzzleProps } from "../game/types";
import BalanceScale from "../puzzles/BalanceScale/BalanceScale";
import Chess from "../puzzles/Chess/Chess";
import ChordFit from "../puzzles/ChordFit/ChordFit";
import Downbeat from "../puzzles/Downbeat/Downbeat";
import FractionLaser from "../puzzles/FractionLaser/FractionLaser";
import FunctionMachine from "../puzzles/FunctionMachine/FunctionMachine";
import GearTrain from "../puzzles/GearTrain/GearTrain";
import LITS from "../puzzles/LITS/LITS";
import LogicGrid from "../puzzles/LogicGrid/LogicGrid";
import Minesweeper from "../puzzles/Minesweeper/Minesweeper";
import Mirror from "../puzzles/Mirror/Mirror";
import Nonogram from "../puzzles/Nonogram/Nonogram";
import Pipes from "../puzzles/Pipes/Pipes";
import RatioMixing from "../puzzles/RatioMixing/RatioMixing";
import SpriteLoop from "../puzzles/SpriteLoop/SpriteLoop";
import TuneRepair from "../puzzles/TuneRepair/TuneRepair";
import { TEACH_INS, type TeachInId } from "./rules";

const ACTIVITIES: Array<[TeachInId, ComponentType<PuzzleProps>]> = [
  ["nonogram", Nonogram],
  ["pipes", Pipes],
  ["mirror", Mirror],
  ["chess", Chess],
  ["logic-grid", LogicGrid],
  ["lits", LITS],
  ["minesweeper", Minesweeper],
  ["balance-scale", BalanceScale],
  ["gear-train", GearTrain],
  ["fraction-laser", FractionLaser],
  ["function-machine", FunctionMachine],
  ["ratio-mixing", RatioMixing],
  ["tune-repair", TuneRepair],
  ["chord-fit", ChordFit],
  ["downbeat", Downbeat],
  ["sprite-loop", SpriteLoop],
];

test("the mounted list and the rule table describe the same sixteen activities", () => {
  expect(ACTIVITIES.map(([id]) => id).sort()).toEqual(Object.keys(TEACH_INS).sort());
});

describe.each(ACTIVITIES)("%s", (id, Activity) => {
  test("opens with its rule already on screen", () => {
    render(<Activity seed={7} onSolved={() => {}} onExit={() => {}} />);
    const panel = screen.getByRole("note");
    expect(panel.textContent).toContain(TEACH_INS[id].rule);
  });

  test("keeps a persistent `?` that brings the rule back", () => {
    render(<Activity seed={7} onSolved={() => {}} onExit={() => {}} />);
    const helpName = new RegExp(`how ${TEACH_INS[id].title} works`, "i");
    // Dismissed by an ordinary interaction with the activity...
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(screen.queryByRole("note")).toBeNull();
    // ...and reachable again without restarting.
    fireEvent.click(screen.getByRole("button", { name: helpName }));
    expect(screen.getByRole("note")).toBeInTheDocument();
  });

  test("the teach-in does not fire onSolved, and Back still exits from under the panel", () => {
    // The panel is `pointer-events: none`, so the chrome it covers stays live. Cheap regression
    // guard on the PuzzleProps contract: mounting an explanation must not disturb either callback.
    const calls: string[] = [];
    render(
      <Activity seed={7} onSolved={() => calls.push("solved")} onExit={() => calls.push("exit")} />,
    );
    expect(calls).toEqual([]);
    fireEvent.click(screen.getByRole("button", { name: "← Back" }));
    expect(calls).toEqual(["exit"]);
  });
});
