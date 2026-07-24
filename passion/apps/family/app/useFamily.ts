"use client";

// Controller for the family co-engagement surface: owns the selected child, the per-child set of
// guide-approved coaching cards, the human "approve for the family" action, and the `window.__qa`
// install. The family read for each child is pure + derived (family-data), so switching children never
// mutates anything — only the approved set is state, and approvals are scoped per child.
import { useEffect, useMemo, useRef, useState } from "react";
import type { FamilyRead } from "@gt100k/family";
import {
  CHILDREN,
  familyReadForKid,
  observationsForKid,
  rosterEscalationCount,
  type Child,
} from "./family-data.js";
import {
  applyApproveTop,
  approvedCards,
  buildFamilyQaState,
  coachingCards,
  topCoachingCardId,
  type CoachingCard,
} from "./family-state.js";
import { installQa } from "./qa.js";

// A safe, non-throwing baseline read for the (impossible) case of an unknown kid — keeps the surface
// from ever rendering `undefined`.
const EMPTY_READ: FamilyRead = {
  kidId: "unknown",
  posture: {
    autonomySupport: "steady",
    structure: "steady",
    warmth: "non_contingent",
    decoupleWorthFromOutcome: false,
  },
  asks: [],
  sharedActivities: [],
  pressureWatch: { risk: "none", antecedents: [] },
  escalateToHuman: false,
  rationale: "",
  guardrailNotes: [],
};

export function useFamily() {
  const [kid, setKidRaw] = useState<string>(CHILDREN[0]!.id);
  // Approved coaching-card ids across the whole roster (ids embed the kid id, so they never collide).
  const [approved, setApproved] = useState<ReadonlySet<string>>(() => new Set());

  const read = useMemo(() => familyReadForKid(kid) ?? EMPTY_READ, [kid]);
  const observations = useMemo(() => observationsForKid(kid), [kid]);
  const cards = useMemo(() => coachingCards(read), [read]);
  const escalations = useMemo(() => rosterEscalationCount(), []);
  const familyPreview = useMemo(() => approvedCards(read, approved), [read, approved]);

  function setKid(id: string): void {
    setKidRaw(id);
  }

  function approve(card: CoachingCard): void {
    setApproved((prev) => {
      if (prev.has(card.id)) return prev;
      const next = new Set(prev);
      next.add(card.id);
      return next;
    });
  }

  const isApproved = (card: CoachingCard): boolean => approved.has(card.id);

  // Per-child summaries for the switcher: the risk + whether the read escalates ("needs your review").
  const summaries = useMemo(() => {
    const m = new Map<string, { risk: string; escalate: boolean }>();
    for (const child of CHILDREN) {
      const r = familyReadForKid(child.id);
      m.set(child.id, {
        risk: r?.pressureWatch.risk ?? "none",
        escalate: r?.escalateToHuman ?? false,
      });
    }
    return m;
  }, []);

  const ref = useRef({ kid, read, approved, escalations });
  ref.current = { kid, read, approved, escalations };

  useEffect(() => {
    installQa(
      () =>
        buildFamilyQaState(
          ref.current.kid,
          ref.current.read,
          ref.current.approved,
          ref.current.escalations,
        ),
      () => {
        const next = applyApproveTop(ref.current.read, ref.current.approved);
        if (next) setApproved(next);
      },
    );
  }, []);

  // The top coaching card the primary action targets (for the "approve" affordance highlight).
  const topId = topCoachingCardId(read);
  const activeChild: Child | undefined = CHILDREN.find((c) => c.id === kid);

  return {
    children: CHILDREN,
    kid,
    setKid,
    activeChild,
    read,
    observations,
    cards,
    topId,
    escalations,
    summaries,
    familyPreview,
    approve,
    isApproved,
  };
}

export type FamilyController = ReturnType<typeof useFamily>;
