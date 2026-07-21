"use client";

import { type LedgerView, STATE_CUES } from "@gt100k/cohort-arena-view";
import { type KeyboardEvent, useMemo, useState } from "react";

import {
  type LedgerTreeStructure,
  createLedgerNavigationState,
  nextLedgerNavigationState,
  visibleLedgerNodeIds,
} from "./navigation";

interface CohortLedgerProps {
  readonly ledger: LedgerView;
}

type CohortLedgerState = "assigned" | "unassigned" | "satisfied";

const HANDLED_TREE_KEYS = new Set([
  "ArrowDown",
  "ArrowUp",
  "ArrowRight",
  "ArrowLeft",
  "Home",
  "End",
  "Enter",
  " ",
  "Escape",
]);

const STATE_MARKS = {
  assigned: "•",
  unassigned: "◇",
  satisfied: "✓",
  paused: "⛨",
  suppressed: "▧",
  observable: "•",
  off: "○",
} as const;

function cohortLedgerState(label: string): CohortLedgerState {
  if (label.endsWith(" — satisfied")) return "satisfied";
  if (label.endsWith(" — unassigned") || label.includes("still compiling")) return "unassigned";
  return "assigned";
}

function stateIcon(state: CohortLedgerState): string {
  if (state === "satisfied") return STATE_CUES.satisfied.icon;
  if (state === "unassigned") return STATE_CUES.unassigned.icon;
  return STATE_CUES.assigned.icon;
}

function rivalryState(item: string): "suppressed" | "observable" | "off" {
  const normalized = item.toLocaleLowerCase("en-US");
  if (normalized.includes("prompts suppressed")) return "suppressed";
  if (normalized.startsWith("analytics off")) return "off";
  return "observable";
}

export function CohortLedger({ ledger }: CohortLedgerProps) {
  const structure = useMemo<LedgerTreeStructure>(
    () =>
      ledger.cohortTree.map((cohort, cohortIndex) => ({
        id: `ledger-cohort-${cohortIndex + 1}`,
        childIds: cohort.children.map(
          (_, childIndex) => `ledger-cohort-${cohortIndex + 1}-detail-${childIndex + 1}`,
        ),
      })),
    [ledger.cohortTree],
  );
  const [navigation, setNavigation] = useState(() => createLedgerNavigationState(structure));
  const visibleIds = visibleLedgerNodeIds(structure, navigation);
  const activeId = visibleIds.includes(navigation.activeId ?? "")
    ? navigation.activeId
    : (visibleIds[0] ?? null);

  function handleTreeKeyDown(event: KeyboardEvent<HTMLOListElement>): void {
    if (!HANDLED_TREE_KEYS.has(event.key)) return;
    event.preventDefault();
    setNavigation((current) => nextLedgerNavigationState(structure, current, event.key));
  }

  return (
    <>
      <ol
        className="cohort-ledger-tree"
        role="tree"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: An ARIA tree is a composite widget and needs one Tab stop for aria-activedescendant.
        tabIndex={0}
        aria-label="Compiled cohort details"
        aria-describedby="ledger-keyboard-help"
        aria-activedescendant={activeId ?? undefined}
        aria-keyshortcuts="ArrowDown ArrowUp ArrowRight ArrowLeft Home End Enter Space Escape"
        onKeyDown={handleTreeKeyDown}
      >
        {ledger.cohortTree.map((cohort, cohortIndex) => {
          const branch = structure[cohortIndex]!;
          const expanded = navigation.expandedIds.includes(branch.id);

          return (
            <li
              className="ledger-cohort-item"
              id={branch.id}
              key={cohort.label}
              role="treeitem"
              aria-expanded={expanded}
              aria-level={1}
              aria-posinset={cohortIndex + 1}
              aria-setsize={ledger.cohortTree.length}
              aria-label={`${cohort.label}. ${expanded ? "Expanded" : "Collapsed"} with ${cohort.children.length} details.`}
              data-ledger-active={activeId === branch.id ? "true" : undefined}
            >
              <div className="ledger-cohort-label">
                <span className="ledger-cohort-mark" aria-hidden="true">
                  {cohortIndex + 1}
                </span>
                <span>{cohort.label}</span>
              </div>

              {/* biome-ignore lint/a11y/useSemanticElements: ARIA tree children require role=group; fieldset is not valid list structure. */}
              <ul className="ledger-node-group" role="group" hidden={!expanded}>
                {cohort.children.map((child, childIndex) => {
                  const state = cohortLedgerState(child.label);
                  const childId = branch.childIds[childIndex]!;

                  return (
                    <li
                      className="ledger-child-item"
                      id={childId}
                      key={child.label}
                      role="treeitem"
                      tabIndex={-1}
                      aria-level={2}
                      aria-posinset={childIndex + 1}
                      aria-setsize={cohort.children.length}
                      aria-label={child.label}
                      data-ledger-active={activeId === childId ? "true" : undefined}
                    >
                      <span
                        className={`ledger-state-mark ledger-state-${state}`}
                        data-ledger-state={state}
                        data-state-icon={stateIcon(state)}
                        aria-hidden="true"
                      >
                        {STATE_MARKS[state]}
                      </span>
                      <span>{child.label}</span>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ol>
      <p id="ledger-keyboard-help" className="sr-only">
        Use Tab to reach the Ledger and Enter to expand or collapse the current cohort. Arrow keys
        move through details; Escape returns to the cohort and collapses it.
      </p>

      {ledger.standingsText ? (
        <section
          id="ledger-standings-state"
          className="ledger-supporting-state"
          aria-labelledby="ledger-standings-heading"
        >
          <h3 id="ledger-standings-heading">Growth standing</h3>
          <p>{ledger.standingsText}</p>
        </section>
      ) : null}

      {ledger.rivalryList.length > 0 ? (
        <section className="ledger-supporting-state" aria-labelledby="ledger-rivalry-heading">
          <h3 id="ledger-rivalry-heading">Observable turn-taking</h3>
          <ul>
            {ledger.rivalryList.map((item) => {
              const state = rivalryState(item);
              const icon =
                state === "suppressed"
                  ? STATE_CUES.suppressed.icon
                  : state === "off"
                    ? "analytics-off"
                    : "observable";

              return (
                <li className="ledger-rivalry-item" key={item} data-ledger-state={state}>
                  <span
                    className={`ledger-state-mark ledger-state-${state}`}
                    data-state-icon={icon}
                    aria-hidden="true"
                  >
                    {STATE_MARKS[state]}
                  </span>
                  <span>{item}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {ledger.safeguardingAlert ? (
        <p
          className="ledger-safeguarding-state"
          role="alert"
          data-ledger-state="paused"
          data-state-icon={STATE_CUES.paused.icon}
        >
          <span className="ledger-state-mark ledger-state-paused" aria-hidden="true">
            {STATE_MARKS.paused}
          </span>
          <span>{ledger.safeguardingAlert}</span>
        </p>
      ) : null}

      {ledger.announce ? (
        <output className="sr-only" aria-live="polite" aria-atomic="true">
          {ledger.announce}
        </output>
      ) : null}
    </>
  );
}
