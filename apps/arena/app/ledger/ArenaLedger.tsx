"use client";

import { CATALOG, type Cosmetic, type InitialArenaView, type NodeState } from "@gt100k/arena-world";
import * as React from "react";
import { buildHudCosmeticEntries } from "../hud/Hud";
import type { ArenaEventBus } from "../scene/eventBus";
import {
  type SequencedArenaFeedback,
  resolveArenaFeedback,
  resolveFeedbackAnnouncement,
} from "../scene/feedback";
import styles from "./ArenaLedger.module.css";

const STATE_ICON: Readonly<Record<NodeState, string>> = {
  locked: "■",
  available: "⚑",
  unlocked: "★",
};

const STATE_LABEL: Readonly<Record<NodeState, string>> = {
  locked: "Locked",
  available: "Available",
  unlocked: "Unlocked",
};

const COSMETIC_LISTBOX_ROLE: React.AriaRole = "listbox";
const COSMETIC_OPTION_ROLE: React.AriaRole = "option";

export interface LedgerEntry {
  nodeId: string;
  landmark: string;
  state: NodeState;
  region: string;
  regionLabel: string;
  accessibleName: string;
  icon: string;
}

export interface LedgerTreeCommand {
  nextIndex: number;
  activate: boolean;
}

export interface LedgerCosmeticCommand {
  nextIndex: number;
  equip: boolean;
}

function labelRegion(region: string): string {
  return region
    .split("-")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

export function buildLedgerEntries(view: InitialArenaView): LedgerEntry[] {
  const stateByNode = new Map(view.nodeStates.map(({ nodeId, state }) => [nodeId, state]));

  return view.world.nodes.map((node) => {
    const state = stateByNode.get(node.id);
    if (!state) throw new Error(`Arena Ledger is missing state for node: ${node.id}`);

    const regionLabel = labelRegion(node.region);
    return {
      nodeId: node.id,
      landmark: node.landmark,
      state,
      region: node.region,
      regionLabel,
      accessibleName: `${node.landmark}, ${state}, ${regionLabel}`,
      icon: STATE_ICON[state],
    };
  });
}

export function resolveLedgerTreeCommand(
  currentIndex: number,
  key: string,
  itemCount: number,
): LedgerTreeCommand | null {
  if (itemCount <= 0) return null;

  const boundedIndex = Math.max(0, Math.min(currentIndex, itemCount - 1));
  if (key === "ArrowDown") {
    return { nextIndex: Math.min(boundedIndex + 1, itemCount - 1), activate: false };
  }
  if (key === "ArrowUp") {
    return { nextIndex: Math.max(boundedIndex - 1, 0), activate: false };
  }
  if (key === "Home") return { nextIndex: 0, activate: false };
  if (key === "End") return { nextIndex: itemCount - 1, activate: false };
  if (key === "Enter") return { nextIndex: boundedIndex, activate: true };

  return null;
}

export function resolveCosmeticListboxCommand(
  currentIndex: number,
  key: string,
  itemCount: number,
): LedgerCosmeticCommand | null {
  if (itemCount <= 0) return null;

  const boundedIndex = Math.max(0, Math.min(currentIndex, itemCount - 1));
  if (key === "ArrowDown") {
    return { nextIndex: Math.min(boundedIndex + 1, itemCount - 1), equip: false };
  }
  if (key === "ArrowUp") {
    return { nextIndex: Math.max(boundedIndex - 1, 0), equip: false };
  }
  if (key === "Home") return { nextIndex: 0, equip: false };
  if (key === "End") return { nextIndex: itemCount - 1, equip: false };
  if (key === "Enter" || key === " ") return { nextIndex: boundedIndex, equip: true };

  return null;
}

export interface ArenaLedgerProps {
  view: InitialArenaView;
  catalog?: readonly Cosmetic[];
  eventBus: Pick<ArenaEventBus, "emit">;
  feedback?: SequencedArenaFeedback;
}

export default function ArenaLedger({
  view,
  catalog = CATALOG,
  eventBus,
  feedback,
}: ArenaLedgerProps) {
  const entries = buildLedgerEntries(view);
  const cosmetics = buildHudCosmeticEntries(view, catalog);
  const ledgerFeedback = feedback ? resolveArenaFeedback(feedback.signal) : null;
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [activeCosmeticIndex, setActiveCosmeticIndex] = React.useState(0);
  const itemRefs = React.useRef<Array<HTMLLIElement | null>>([]);
  const cosmeticRefs = React.useRef<Array<HTMLDivElement | null>>([]);

  const activateNode = (nodeId: string) => {
    eventBus.emit("focus-node", { nodeId });
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLLIElement>,
    index: number,
    nodeId: string,
  ) => {
    const command = resolveLedgerTreeCommand(index, event.key, entries.length);
    if (!command) return;

    event.preventDefault();
    if (command.activate) {
      activateNode(nodeId);
      return;
    }

    setActiveIndex(command.nextIndex);
    itemRefs.current[command.nextIndex]?.focus();
  };

  const equipCosmetic = (index: number) => {
    const cosmetic = cosmetics[index];
    if (!cosmetic?.eligible || cosmetic.equipped) return;
    eventBus.emit("equip-cosmetic", { cosmeticId: cosmetic.id });
  };

  const handleCosmeticKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, index: number) => {
    const command = resolveCosmeticListboxCommand(index, event.key, cosmetics.length);
    if (!command) return;

    event.preventDefault();
    setActiveCosmeticIndex(command.nextIndex);
    if (command.equip) {
      equipCosmetic(command.nextIndex);
      return;
    }
    cosmeticRefs.current[command.nextIndex]?.focus();
  };

  return (
    <aside className={styles.ledger} aria-labelledby="arena-ledger-title">
      <header className={styles.header}>
        <h2 className={styles.title} id="arena-ledger-title">
          Arena Ledger
        </h2>
        <p className={styles.hint} id="arena-ledger-help">
          Use Arrow keys to explore the landmarks. Press Enter to focus one in the world.
        </p>
      </header>

      <ul
        aria-describedby="arena-ledger-help"
        aria-label="Quest world"
        className={styles.tree}
        role="tree"
      >
        {entries.map((entry, index) => (
          <li
            aria-keyshortcuts="ArrowUp ArrowDown Home End Enter"
            aria-label={entry.accessibleName}
            aria-level={1}
            className={styles.treeItem}
            data-node-id={entry.nodeId}
            data-state={entry.state}
            key={entry.nodeId}
            onClick={() => {
              setActiveIndex(index);
              activateNode(entry.nodeId);
            }}
            onFocus={() => setActiveIndex(index)}
            onKeyDown={(event) => handleKeyDown(event, index, entry.nodeId)}
            ref={(element) => {
              itemRefs.current[index] = element;
            }}
            role="treeitem"
            tabIndex={index === activeIndex ? 0 : -1}
          >
            <span aria-hidden="true" className={styles.icon}>
              {entry.icon}
            </span>
            <span className={styles.content}>
              <strong className={styles.landmark}>{entry.landmark}</strong>
              <span className={styles.meta}>
                <span className={styles.state}>{STATE_LABEL[entry.state]}</span>
                <span aria-hidden="true"> · </span>
                <span>{entry.regionLabel}</span>
              </span>
            </span>
          </li>
        ))}
      </ul>

      <section className={styles.cosmetics} aria-labelledby="arena-ledger-cosmetics-title">
        <header className={styles.cosmeticsHeader}>
          <h3 id="arena-ledger-cosmetics-title">Cosmetics</h3>
          <p id="arena-ledger-cosmetics-help">
            Use Arrow keys to browse. Press Enter to equip an earned look.
          </p>
        </header>
        <div
          aria-describedby="arena-ledger-cosmetics-help"
          aria-label="Competence-earned cosmetics"
          aria-orientation="vertical"
          className={styles.cosmeticListbox}
          role={COSMETIC_LISTBOX_ROLE}
          tabIndex={-1}
        >
          {cosmetics.map((cosmetic, index) => (
            <div
              aria-disabled={!cosmetic.eligible}
              aria-label={`${cosmetic.look}, ${
                cosmetic.equipped
                  ? "equipped"
                  : cosmetic.eligible
                    ? "earned, press Enter to equip"
                    : `locked, earn goal: ${cosmetic.earnGoal}`
              }`}
              aria-selected={cosmetic.equipped}
              className={styles.cosmeticOption}
              data-active={index === activeCosmeticIndex ? "true" : "false"}
              data-eligible={cosmetic.eligible ? "true" : "false"}
              id={`arena-cosmetic-option-${cosmetic.id}`}
              key={cosmetic.id}
              onClick={() => {
                setActiveCosmeticIndex(index);
                equipCosmetic(index);
              }}
              onMouseEnter={() => setActiveCosmeticIndex(index)}
              onFocus={() => setActiveCosmeticIndex(index)}
              onKeyDown={(event) => handleCosmeticKeyDown(event, index)}
              ref={(element) => {
                cosmeticRefs.current[index] = element;
              }}
              role={COSMETIC_OPTION_ROLE}
              tabIndex={index === activeCosmeticIndex ? 0 : -1}
            >
              <span aria-hidden="true" className={styles.cosmeticIcon}>
                {cosmetic.equipped ? "✓" : cosmetic.eligible ? "✦" : "■"}
              </span>
              <span className={styles.cosmeticContent}>
                <strong>{cosmetic.look}</strong>
                <span>{cosmetic.equipEffect}</span>
                {!cosmetic.eligible ? (
                  <span className={styles.cosmeticGoal}>Earn goal: {cosmetic.earnGoal}</span>
                ) : cosmetic.equipped ? (
                  <span className={styles.cosmeticEquipped}>Equipped</span>
                ) : (
                  <span className={styles.cosmeticEarned}>Earned · press Enter to equip</span>
                )}
              </span>
            </div>
          ))}
        </div>
      </section>
      <div
        aria-atomic="true"
        aria-live="polite"
        className={styles.feedback}
        data-feedback-kind={ledgerFeedback?.kind ?? "idle"}
      >
        {ledgerFeedback ? (
          <>
            <span aria-hidden="true" className={styles.feedbackIcon}>
              {ledgerFeedback.kind === "not-yet"
                ? "○"
                : ledgerFeedback.event.intensity === "high"
                  ? "★"
                  : "✦"}
            </span>
            <span className={styles.feedbackCopy}>
              <strong>{resolveFeedbackAnnouncement(view, ledgerFeedback)}</strong>
              <span>{ledgerFeedback.soundCue.caption}</span>
            </span>
          </>
        ) : null}
      </div>
    </aside>
  );
}
