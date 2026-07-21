import type { LedgerView } from "@gt100k/cohort-arena-view";

interface CohortLedgerProps {
  readonly ledger: LedgerView;
}

function isSatisfied(label: string): boolean {
  return label.endsWith(" — satisfied");
}

export function CohortLedger({ ledger }: CohortLedgerProps) {
  return (
    <>
      <ol
        className="cohort-ledger-tree"
        role="tree"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: An ARIA tree is a composite widget and needs one Tab stop for aria-activedescendant.
        tabIndex={0}
        aria-label="Compiled cohort details"
        aria-activedescendant={ledger.cohortTree.length > 0 ? "ledger-cohort-1" : undefined}
      >
        {ledger.cohortTree.map((cohort, cohortIndex) => (
          <li
            className="ledger-cohort-item"
            id={`ledger-cohort-${cohortIndex + 1}`}
            key={cohort.label}
            role="treeitem"
            aria-expanded="true"
            aria-level={1}
            aria-posinset={cohortIndex + 1}
            aria-setsize={ledger.cohortTree.length}
            aria-label={`${cohort.label}. Expanded with ${cohort.children.length} details.`}
          >
            <div className="ledger-cohort-label">
              <span className="ledger-cohort-mark" aria-hidden="true">
                {cohortIndex + 1}
              </span>
              <span>{cohort.label}</span>
            </div>

            {/* biome-ignore lint/a11y/useSemanticElements: ARIA tree children require role=group; fieldset is not valid list structure. */}
            <ul className="ledger-node-group" role="group">
              {cohort.children.map((child, childIndex) => {
                const satisfied = isSatisfied(child.label);

                return (
                  <li
                    className="ledger-child-item"
                    key={child.label}
                    role="treeitem"
                    tabIndex={-1}
                    aria-level={2}
                    aria-posinset={childIndex + 1}
                    aria-setsize={cohort.children.length}
                    aria-label={child.label}
                  >
                    <span
                      className={
                        satisfied
                          ? "ledger-state-mark ledger-state-satisfied"
                          : "ledger-state-mark ledger-state-assigned"
                      }
                      data-ledger-state={satisfied ? "satisfied" : "assigned"}
                      aria-hidden="true"
                    >
                      {satisfied ? "✓" : "•"}
                    </span>
                    <span>{child.label}</span>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>

      {ledger.standingsText ? (
        <section className="ledger-supporting-state" aria-labelledby="ledger-standings-heading">
          <h3 id="ledger-standings-heading">Growth standing</h3>
          <p>{ledger.standingsText}</p>
        </section>
      ) : null}

      {ledger.rivalryList.length > 0 ? (
        <section className="ledger-supporting-state" aria-labelledby="ledger-rivalry-heading">
          <h3 id="ledger-rivalry-heading">Observable turn-taking</h3>
          <ul>
            {ledger.rivalryList.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {ledger.safeguardingAlert ? (
        <p className="ledger-safeguarding-state" role="alert">
          {ledger.safeguardingAlert}
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
