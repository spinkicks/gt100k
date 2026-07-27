# A session with no choice yields no disconfirming evidence

**Date:** 2026-07-27
**Status:** implemented
**Touches:** `signal-pipeline/src/skips.ts`, `student-profile/src/orchestrator.ts`

## What was wrong

`deriveSkips` treated every surfaced cell a session did not engage as passed over. It applied that
rule to sessions in which the child engaged *nothing*, so a child who loaded the map, could not find
a way in, and left earned one disconfirming event against every cabin on screen.

The damage scaled with the catalogue rather than with the child: four cabins produced four declines,
forty-four produced forty-four. A browse-style surface would have made it far worse than the current
room-with-doors, which matters because the child surface is under active redesign.

## Why it was worse than noise

The bias is systematic and it points somewhere specific. Sessions that end with no engagement
cluster wherever the surface is hardest to read, and findability is a property of the art and the
layout, not of the child's interest. So the error correlates with cabin design. A cabin that is
beautiful and illegible would accumulate evidence that children dislike its topic.

It is also a feedback loop against exposure. Only *surfaced* cells take the decrement, so the model
penalises whatever the system chose to show. That is the exposure-propensity problem
`hardening/06` already flags (Ensign 2018; Chaney 2018; Perdomo 2020), arriving through the
disconfirming path rather than the recommending one.

Memo 07 §4 D9 reaches the same conclusion from the child-UX side: a six-year-old who cannot locate a
hotspot is recorded as having rejected the topic, which makes every visual-search finding in that
memo a sign-inversion risk in this package rather than a usability nit.

## What licensed the old behaviour, and how far it actually went

Memo 06 §8.4 P2 is the source: "a return to the only available cabin is not a preference", choice is
only interpretable against the alternatives, and `CellEvent` had no field for what else was on
offer. That argument licenses `choiceSetSize` as the normaliser of a *taken* option. Emitting a
negative event per unchosen cell is a further step, and it is the step that needs a choice to have
happened. The implementation took the step without noticing it was one.

## The rule

A session that recorded no engagement produces no `skip` and no `decline`. `choiceSetSize` is
untouched. Presence counts as choosing, so a mode-less open still re-enables the signal: the rule
keys on whether the child acted, not on whether the action was scoreable.

## What this does not fix

A child who engages A while never perceiving B still declines B. That cannot be settled inside the
engine, because rendering and perceiving are indistinguishable from here. It needs the attention
data memo 07 D9 proposes to emit (hover-without-click, target reentry, open-then-exit). The engine
side of that is a field on `SurfacedRecord`; it is not built, because a field nothing populates is
worse than an honest absence.

## A test that asserted the opposite

`presence-is-not-rejection.test.ts` contained "a session where the child opened nothing still
declines everything offered". It was written to guard against over-suppression while fixing a
neighbouring sign inversion, and it was wrong. It is removed, with a note in place pointing here,
rather than deleted quietly.

Two other test files had fixtures whose sessions surfaced things and engaged nothing. They passed
before for the wrong reason and would have passed after for the wrong reason, so each gained a
second artifact the child actually takes. Without that, "the synth was passed over" and "the session
was empty" are the same input.

## Observability

The suppression is reported, not silent: `deriveSkips` returns `silentSessions` and `deriveSignals`
passes it out. The failure mode this makes visible is a surface that stamps a different `sessionId`
on its surfacings than on its interactions, which would now silence every skip and decline in the
product while every other number kept moving.

`student-profile`'s orchestrator currently discards it, along with the older `dropped`. That is a
real gap and it predates this change. Closing it means widening the persisted `StudentProfile` or
adding a second return value, and it should follow a decision about what the console shows rather
than precede it.
