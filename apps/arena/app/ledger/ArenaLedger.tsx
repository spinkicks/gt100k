"use client";

import type { InitialArenaView, NodeState } from "@gt100k/arena-world";
import * as React from "react";
import type { ArenaEventBus } from "../scene/eventBus";
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

export interface ArenaLedgerProps {
  view: InitialArenaView;
  eventBus: Pick<ArenaEventBus, "emit">;
}

export default function ArenaLedger({ view, eventBus }: ArenaLedgerProps) {
  const entries = buildLedgerEntries(view);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const itemRefs = React.useRef<Array<HTMLLIElement | null>>([]);

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
    </aside>
  );
}
