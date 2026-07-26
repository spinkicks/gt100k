/**
 * The §6 lifecycle: a guide's edit, and the check that gates publication.
 *
 * The two are one subject. An edit is a correction to software output, and the reason it has to
 * stale the map is that the `ValidationRecord` sitting on it was earned by the text that has just
 * been replaced. A record that survived its own subject would say a map had been checked when the
 * thing checked no longer exists, which is the failure mode this whole package is written against.
 */
import type { HumanActor } from "@gt100k/hypothesis-store";
import { describe, expect, it } from "vitest";

import { cleanMap, milestone } from "../src/__fixtures__/builders.js";
import { UNVALIDATED_SINCE_EDIT, applyEdit, canPublish } from "../src/edit.js";
import { validateMap } from "../src/validate.js";

const GUIDE: HumanActor = { id: "guide-104", role: "GUIDE" };
const NOW = "2026-07-26T00:00:00.000Z";

const base = () =>
  cleanMap({
    milestones: [
      milestone({
        id: "m1",
        capability: "Produce an annotation of a finished game",
        demonstration: "A written annotation",
      }),
    ],
  });

const edit = {
  milestoneId: "m1",
  field: "capability",
  value: "Produce an annotation of a finished game and publish it",
  actor: GUIDE,
  at: NOW,
} as const;

describe("applyEdit", () => {
  it("writes the new value onto the milestone it names and no other", () => {
    const map = cleanMap({
      milestones: [milestone({ id: "m1" }), milestone({ id: "m2", title: "Untouched" })],
    });
    const edited = applyEdit(map, edit);
    expect(edited.milestones[0]?.capability).toBe(edit.value);
    expect(edited.milestones[1]).toEqual(map.milestones[1]);
  });

  /**
   * Both sides, and this is the point of the record. Keeping only the field name makes "did
   * human-edited maps produce better outcomes" unanswerable, because the edit overwrites the only
   * copy of what the model proposed and leaves nothing to compare it against.
   */
  it("records what the value was as well as what it became", () => {
    const map = base();
    const edited = applyEdit(map, edit);
    expect(edited.provenance.edits).toEqual([
      {
        milestoneId: "m1",
        actor: GUIDE,
        at: NOW,
        field: "capability",
        before: "Produce an annotation of a finished game",
        after: edit.value,
      },
    ]);
  });

  it("appends rather than replacing, so the second edit does not erase the first", () => {
    const once = applyEdit(base(), edit);
    const twice = applyEdit(once, { ...edit, value: "Produce and publish an annotation", at: NOW });
    expect(twice.provenance.edits).toHaveLength(2);
    expect(twice.provenance.edits[0]?.after).toBe(edit.value);
    expect(twice.provenance.edits[1]?.before).toBe(edit.value);
  });

  it("carries an optional note through to the record", () => {
    const edited = applyEdit(base(), { ...edit, note: "The demonstration says published." });
    expect(edited.provenance.edits[0]?.note).toBe("The demonstration says published.");
  });

  it("bumps the version, because a stored change is what the version counts", () => {
    expect(applyEdit(base(), edit).version).toBe(base().version + 1);
  });

  /** The map stops being the model's unaided output the moment a person changes it, and the record
      of who wrote what is the point of the field. */
  it("marks the edited milestone human-edited and leaves the rest alone", () => {
    const map = cleanMap({
      milestones: [milestone({ id: "m1" }), milestone({ id: "m2", authorship: "model" })],
    });
    const edited = applyEdit(map, edit);
    expect(edited.milestones[0]?.authorship).toBe("human-edited");
    expect(edited.milestones[1]?.authorship).toBe("model");
  });

  /**
   * The invariant the whole function exists for. The record on the map was earned by the sentence
   * the edit has just replaced, so it cannot survive the edit: a map claiming a passing validation
   * of text that no longer exists is worse than one claiming nothing.
   */
  it("invalidates the map, so a record earned by the old text cannot survive the edit", () => {
    const map = base();
    expect(map.validation.errors).toEqual([]);

    const edited = applyEdit(map, edit);
    expect(edited.validation.errors.map((e) => e.code)).toEqual([UNVALIDATED_SINCE_EDIT]);
    expect(canPublish(edited, NOW).ok).toBe(false);
  });

  it("returns the map to draft, whatever it was before", () => {
    const inUse = cleanMap({ status: "published", milestones: base().milestones });
    expect(applyEdit(inUse, edit).status).toBe("draft");
  });

  it("lets a re-validation clear the block, which is the way back to publishable", () => {
    const edited = applyEdit(base(), edit);
    const revalidated = { ...edited, validation: validateMap(edited, NOW), revalidatedAt: NOW };
    expect(canPublish(revalidated, NOW)).toEqual({ ok: true });
  });

  it("is pure: the map handed in is not touched", () => {
    const map = base();
    const before = structuredClone(map);
    applyEdit(map, edit);
    expect(map).toEqual(before);
  });

  /** Silently doing nothing would hide a caller's bug behind a map that looks edited and is not. */
  it("refuses an edit aimed at a milestone the map does not have", () => {
    expect(() => applyEdit(base(), { ...edit, milestoneId: "ghost" })).toThrow(/ghost/);
  });
});

describe("canPublish", () => {
  it("accepts a valid map re-checked recently", () => {
    expect(canPublish(cleanMap(), NOW)).toEqual({ ok: true });
  });

  it("refuses a map with errors, and says so in words a guide can act on", () => {
    const broken = cleanMap({
      validation: {
        validatedAt: NOW,
        validatorVersion: "v1",
        errors: [{ code: "E2_EMPTY", severity: "error", message: "nope" }],
        warnings: [],
      },
    });
    const check = canPublish(broken, NOW);
    expect(check.ok).toBe(false);
    expect(check.ok === false && check.reason.trim().length).toBeGreaterThan(0);
  });

  /**
   * The second refusal, and the reason `vm.valid` was never enough on its own. A map validated
   * before its resources rotted has an empty error list and is still not fit to put into use, and
   * spec §6 asks for both checks at the transition into `published`.
   */
  it("refuses a map whose resources were last re-checked too long ago", () => {
    const stale = cleanMap({ revalidatedAt: "2026-01-01T00:00:00.000Z" });
    expect(stale.validation.errors).toEqual([]);
    const check = canPublish(stale, NOW);
    expect(check.ok).toBe(false);
    expect(check.ok === false && check.reason).toMatch(/re-check/i);
  });

  it("accepts a map re-checked just inside the threshold", () => {
    const fresh = cleanMap({ revalidatedAt: "2026-05-01T00:00:00.000Z" });
    expect(canPublish(fresh, NOW)).toEqual({ ok: true });
  });

  /** The engine reads no clock, exactly as warning rule 5 does not. With no `now` it cannot judge
      age and does not guess: what it can still check is the error list. */
  it("judges only the errors when it is given no clock", () => {
    const ancient = cleanMap({ revalidatedAt: "2020-01-01T00:00:00.000Z" });
    expect(canPublish(ancient)).toEqual({ ok: true });
  });
});
