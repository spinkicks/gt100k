/**
 * The §6 lifecycle: the correction a guide makes to software output, and the check that gates
 * putting a map into use.
 *
 * The two belong together. A guide cannot certify that an ordering of a domain is right, and this
 * package says so everywhere, but they can see that one sentence is wrong for a nine-year-old and
 * fix it. The moment they do, the `ValidationRecord` on the map was earned by text that no longer
 * exists, so an edit has to take the record with it. A map claiming a passing validation of a
 * sentence that has been replaced is worse than one claiming nothing, because it looks checked.
 *
 * Pure, like the rest of the engine. `applyEdit` is handed the instant as part of the edit and
 * `canPublish` is handed one as an argument, and neither reads a clock: `canPublish` judges age
 * only when it is given a `now`, exactly as warning rule 5 does.
 */
import type { HumanActor } from "@gt100k/hypothesis-store";

import { STALE_AFTER_DAYS, type MapEdit, type MasteryMap, type ValidationRecord } from "./model.js";

/**
 * The milestone fields an edit may touch. All three are prose a guide can read and judge, which is
 * the whole basis on which they are allowed to change anything here. `stageFloor`, `requires` and
 * `ordering.basis` are ordering decisions and are deliberately not on this list: those are the
 * claims the validator gates, and a hand edit to one of them is a change nobody has checked.
 */
export const EDITABLE_FIELDS = ["title", "capability", "demonstration"] as const;

export type EditableField = (typeof EDITABLE_FIELDS)[number];

/** What a guide asks for. `before` is read off the map, so the caller cannot get it wrong. */
export interface EditRequest {
  readonly milestoneId: string;
  readonly field: EditableField;
  readonly value: string;
  readonly actor: HumanActor;
  /** ISO-8601. Supplied, never read from a clock. */
  readonly at: string;
  readonly note?: string;
}

/** Stable token at the head of the thrown message, so a caller keys on this and not on prose. */
export const MAP_EDIT_UNKNOWN_MILESTONE = "UNKNOWN_MILESTONE";

/**
 * The code on the record an edit leaves behind. It is an ERROR, so `canPublish` refuses until the
 * map has been through the validator again, which is spec §6's "an edit stales `validatedAt` the
 * moment it lands" expressed in the one field that actually gates publication.
 */
export const UNVALIDATED_SINCE_EDIT = "UNVALIDATED_SINCE_EDIT";

function unvalidated(at: string): ValidationRecord {
  return {
    validatedAt: at,
    // Not a validator result and it does not pretend to be one. Nothing here was checked.
    validatorVersion: "unvalidated",
    errors: [
      {
        code: UNVALIDATED_SINCE_EDIT,
        severity: "error",
        message: "this map was edited and has not been checked since, so nothing here is validated",
      },
    ],
    warnings: [],
  };
}

/**
 * Apply one guide's correction. Returns a new map: the value changed, the milestone marked as
 * human-edited, both sides of the change recorded in `provenance.edits`, the version bumped, the
 * validation record replaced by one that blocks publication, and the status back to `draft`.
 *
 * Recording BOTH sides is the point of the record. Keeping only the field name makes "did
 * human-edited maps produce better outcomes" unanswerable, because the edit overwrites the only
 * copy of what the model proposed and leaves nothing to compare against.
 *
 * Throws when the map has no such milestone. Quietly returning the map unchanged would hand the
 * caller something that looks edited, is not, and records nowhere that the edit was dropped.
 */
export function applyEdit(map: MasteryMap, edit: EditRequest): MasteryMap {
  const target = map.milestones.find((m) => m.id === edit.milestoneId);
  if (target === undefined) {
    throw new Error(
      `${MAP_EDIT_UNKNOWN_MILESTONE}: map "${map.id}" has no milestone "${edit.milestoneId}"`,
    );
  }

  const record: MapEdit = {
    milestoneId: edit.milestoneId,
    actor: edit.actor,
    at: edit.at,
    field: edit.field,
    before: target[edit.field],
    after: edit.value,
    ...(edit.note === undefined ? {} : { note: edit.note }),
  };

  return {
    ...map,
    version: map.version + 1,
    milestones: map.milestones.map((m) =>
      m.id === edit.milestoneId
        ? { ...m, [edit.field]: edit.value, authorship: "human-edited" }
        : m,
    ),
    provenance: { ...map.provenance, edits: [...map.provenance.edits, record] },
    validation: unvalidated(edit.at),
    status: "draft",
  };
}

/** Whether a map may be put into use, and if not, why not, in words a guide can act on. */
export type PublishCheck = { readonly ok: true } | { readonly ok: false; readonly reason: string };

/**
 * The gate on putting a map into use (spec §6). Two conditions, and an empty error list is only the
 * first of them: a map validated before its resources rotted still has nothing in `errors` and is
 * still not fit to hand to anyone, which is why "the errors are empty" was never the whole check.
 *
 * Age is judged only when a clock is supplied. The engine reads none of its own, so with no `now`
 * this checks the errors and says nothing about freshness rather than guessing at it.
 */
export function canPublish(map: MasteryMap, now?: string): PublishCheck {
  const count = map.validation.errors.length;
  if (count > 0) {
    return {
      ok: false,
      reason:
        count === 1
          ? "The validator found one problem that blocks use. It is shown with the milestone it concerns."
          : `The validator found ${count} problems that block use. Each is shown with what it concerns.`,
    };
  }

  if (now !== undefined) {
    const age = (Date.parse(now) - Date.parse(map.revalidatedAt)) / 86_400_000;
    if (!Number.isFinite(age)) {
      return {
        ok: false,
        reason: "There is no readable date for when the resources were last re-checked.",
      };
    }
    if (age > STALE_AFTER_DAYS) {
      return {
        ok: false,
        reason: `The resources were last re-checked ${Math.round(age)} days ago, past the ${STALE_AFTER_DAYS} day mark. Re-check them before putting this into use.`,
      };
    }
  }

  return { ok: true };
}
