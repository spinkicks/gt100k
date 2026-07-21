import type { BuildCohortArenaViewInput, CohortArenaView } from "@gt100k/cohort-arena-view";

interface ChurnBudgetMeterProps {
  readonly budget: BuildCohortArenaViewInput["churn"];
  readonly cohorts: CohortArenaView["cohorts"];
}

export function ChurnBudgetMeter({ budget, cohorts }: ChurnBudgetMeterProps) {
  const currentDelta = cohorts.reduce((total, cohort) => total + cohort.churnDelta, 0);
  const remaining = Math.max(0, budget.cap - budget.used);
  const meteredUsed = Math.min(budget.cap, Math.max(0, budget.used));
  const usedPercent = budget.cap > 0 ? (meteredUsed / budget.cap) * 100 : 0;
  const budgetStatus =
    budget.used <= budget.cap
      ? "Within base budget"
      : budget.exceptions.length > 0
        ? "Recorded exception"
        : "Base budget exceeded";

  return (
    <section
      className="churn-meter-panel"
      aria-labelledby="churn-meter-heading"
      data-churn-meter="weekly-budget"
      data-week-key={budget.weekKey}
      data-base-cap={budget.cap}
      data-used={budget.used}
      data-remaining={remaining}
      data-current-delta={currentDelta}
    >
      <header className="churn-meter-header">
        <div>
          <p>Weekly membership changes</p>
          <h3 id="churn-meter-heading">Churn capacity</h3>
        </div>
        <span className="churn-meter-state">
          <span aria-hidden="true">◇</span>
          {budgetStatus}
        </span>
      </header>

      <div
        className="churn-meter-track"
        role="meter"
        aria-label="Weekly churn used"
        aria-valuemin={0}
        aria-valuemax={budget.cap}
        aria-valuenow={meteredUsed}
        aria-valuetext={`${budget.used} of ${budget.cap} membership changes used; ${remaining} remaining`}
      >
        <span className="churn-meter-fill" style={{ width: `${usedPercent}%` }} />
      </div>

      <dl className="churn-meter-stats">
        <div>
          <dt>Base cap</dt>
          <dd>{budget.cap} base cap</dd>
        </div>
        <div>
          <dt>Used</dt>
          <dd>{budget.used} used</dd>
        </div>
        <div>
          <dt>Remaining</dt>
          <dd>{remaining} remaining</dd>
        </div>
      </dl>

      <p className="churn-meter-delta">
        <span aria-hidden="true">↔</span>
        <span>
          Current view change
          <strong>{currentDelta} members · display only</strong>
        </span>
      </p>
    </section>
  );
}
