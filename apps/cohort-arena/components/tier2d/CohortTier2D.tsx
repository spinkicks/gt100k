import { type CohortArenaView, LAYOUT } from "@gt100k/cohort-arena-view";

import type { Tier2DReason } from "./mode.js";

interface CohortTier2DProps {
  readonly view: CohortArenaView;
  readonly reason: Tier2DReason;
}

function reasonLabel(reason: Tier2DReason): string {
  return reason === "plain" ? "Plain mode" : "Reduced motion";
}

export function CohortTier2D({ view, reason }: CohortTier2DProps) {
  const assignedCount = view.cohorts.reduce((total, cohort) => total + cohort.members.length, 0);
  const cohortByIndex = new Map(view.cohorts.map((cohort) => [cohort.cohortIndex, cohort]));

  return (
    <section
      className="scene-panel tier2d-panel"
      aria-labelledby="tier-heading"
      data-region="tier-2d"
      data-static-reason={reason}
    >
      <div className="region-heading">
        <div>
          <p className="region-label">Equal static tier</p>
          <h2 id="tier-heading">Cohorts compiled in 2D</h2>
        </div>
        <span className="status-chip">{reasonLabel(reason)}</span>
      </div>

      {view.constellation.hexes.length === 0 ? (
        <p className="tier2d-empty">Nothing compiled yet. The cohort bench remains available.</p>
      ) : (
        <figure className="tier2d-figure">
          <svg
            className="tier2d-map"
            viewBox={`0 0 ${view.constellation.world.width} ${view.constellation.world.height}`}
            aria-hidden="true"
            focusable="false"
          >
            <title>Static orthographic projection of the compiled cohorts</title>
            {view.constellation.hexes.map((hex) => (
              <g
                key={hex.cohortIndex}
                data-cohort-index={hex.cohortIndex}
                data-cohort-formation="settled"
              >
                <circle
                  className="tier2d-floor-halo"
                  cx={hex.center2d.x}
                  cy={hex.center2d.y}
                  r={hex.floorHalo.radius * LAYOUT.PROJECT.scale}
                />
                <polygon
                  className="tier2d-hex"
                  points={hex.members.map(({ pos2d }) => `${pos2d.x},${pos2d.y}`).join(" ")}
                />
                {hex.members.map((member) => (
                  <g
                    key={member.ref}
                    data-learner-ref={member.ref}
                    data-role={member.role}
                    data-x={member.pos2d.x}
                    data-y={member.pos2d.y}
                    data-learner-state={member.state}
                    transform={`translate(${member.pos2d.x} ${member.pos2d.y})`}
                  >
                    <circle className="tier2d-learner" r="34" />
                    <text className="tier2d-learner-label" textAnchor="middle" y="7">
                      {member.ref}
                    </text>
                  </g>
                ))}
              </g>
            ))}
            {view.constellation.bench.map((member) => (
              <g
                key={member.ref}
                data-learner-ref={member.ref}
                data-role="unassigned"
                data-x={member.pos2d.x}
                data-y={member.pos2d.y}
                data-learner-state={member.state}
                transform={`translate(${member.pos2d.x} ${member.pos2d.y})`}
              >
                <rect className="tier2d-bench-learner" x="-34" y="-24" width="68" height="48" />
                <text className="tier2d-learner-label" textAnchor="middle" y="7">
                  {member.ref}
                </text>
              </g>
            ))}
          </svg>
          <figcaption>
            Settled orthographic positions from the same compiled view. No camera, drift, or WebGL
            is required.
          </figcaption>
        </figure>
      )}

      <div className="tier2d-state-grid">
        {view.constellation.hexes.map((hex) => {
          const cohort = cohortByIndex.get(hex.cohortIndex);
          if (!cohort) return null;

          return (
            <section className="tier2d-cohort-state" key={cohort.cohortIndex}>
              <h3>Cohort {cohort.cohortIndex + 1}</h3>
              <p className="tier2d-floor-readout">
                Non-harm floor {cohort.nonHarmFloor.minBenefit} ≥ {cohort.nonHarmFloor.floor} —
                satisfied
              </p>
              <ul
                className="tier2d-member-list"
                aria-label={`Cohort ${cohort.cohortIndex + 1} roles`}
              >
                {cohort.members.map((member) => (
                  <li key={member.ref}>
                    {member.ref} — {member.role} — assigned
                  </li>
                ))}
              </ul>
              <ul
                className="tier2d-badge-list"
                aria-label={`Cohort ${cohort.cohortIndex + 1} satisfied constraints`}
              >
                {cohort.badges.map((badge) => (
                  <li
                    key={badge.constraint}
                    data-constraint-state={badge.satisfied ? "satisfied" : "unsatisfied"}
                  >
                    <span aria-hidden="true">✓</span> {badge.constraint} —{" "}
                    {badge.satisfied ? "satisfied" : "unsatisfied"}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <output className="sr-only" aria-live="polite" aria-atomic="true">
        Static compiled state. {view.cohorts.length} cohorts and {assignedCount} assigned learners.
      </output>
    </section>
  );
}
