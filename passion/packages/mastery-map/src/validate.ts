/**
 * The validator IS the gate (spec §6). No human certifies domain correctness for a map, because
 * nobody available to us can: a guide is not a chess master, and a signature from someone with no
 * basis for giving it is worse than no signature, because it looks like review.
 *
 * So these rules are the whole of the machine-checkable claim a published map makes. Pure,
 * synchronous, total: every problem is collected, nothing throws, nothing stops at the first.
 */
import { GAMIFICATION_KEYS, SCALAR_KEYS, scanBannedKeys } from "@gt100k/guardrails";
import { STAGES } from "@gt100k/specialization-planner";

import {
  EXPERT_ENTRY_STAGE,
  MODEL_BASIS_MAX_SHARE,
  STALE_AFTER_DAYS,
  TRUNK_MIN_SHARE,
  type MasteryMap,
  type Milestone,
  type ValidationProblem,
  type ValidationRecord,
} from "./model.js";

export const VALIDATOR_VERSION = "v1";

/** Words too common to count as naming an artefact. Error 3 would otherwise pass on "a" or "the". */
const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "of",
  "in",
  "on",
  "at",
  "to",
  "for",
  "with",
  "and",
  "or",
  "your",
  "their",
  "this",
  "that",
  "from",
  "by",
  "into",
  "as",
  "is",
  "it",
  "you",
  "one",
  "own",
]);

/** Openers that suggest a milestone can be finished by consuming something. A WARNING only: it is
    incomplete (misses gerunds and noun phrases) and it penalises the analytic mode, which is the
    highest-yield one. Error 3 is the check that actually catches consumption. */
const CONSUMPTION_OPENERS = [
  "watch",
  "read",
  "listen to",
  "review",
  "study",
  "learn about",
  "understand",
];

/** One to twenty, in digits or written out. "by age ten" is the same claim as "by age 10", and a
    rule that saw only the digit form was defeated by anyone who wrote the number as a word. */
const NUMBER = String.raw`(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)`;

/** Ordinals, for the one phrasing that needs them: a birthday. */
const ORDINAL = String.raw`(?:\d+(?:st|nd|rd|th)|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|thirteenth|fourteenth|fifteenth|sixteenth|seventeenth|eighteenth|nineteenth|twentieth)`;

const UNIT = String.raw`(?:day|week|month|year)s?`;

/**
 * A forecast is a claim about WHEN a child will arrive, which turns into a quota, which is the
 * family pressure the wellbeing engine exists to catch. Scoped to three prose fields on purpose:
 * our own timestamp fields obviously contain dates and are not forecasts about anyone.
 *
 * Every pattern below is a DEADLINE: it says a child should be somewhere by some point. That is
 * deliberate, and it is why two phrasings the first version of this rule matched are gone.
 * "after ten years of practice" is a quantity of practice somebody measured, and "revised in five
 * year cycles" is how often a document is reissued; neither is a date a child has to meet, and
 * every pattern general enough to catch the forecast reading of "after N years" catches those too.
 * Where the two cannot be told apart this rule prefers to MISS the forecast. It is an error-level
 * gate, a guide reads the prose it would block, and blocking honest domain writing costs more than
 * letting one loose sentence through, which a person reading the map can still see.
 */
const FORECAST_PATTERNS: readonly RegExp[] = [
  // "by age ten", "by the age of 11"
  new RegExp(String.raw`\bby\s+(?:the\s+age\s+of|age)\s+${NUMBER}\b`, "i"),
  // "by their eleventh birthday"
  new RegExp(String.raw`\bby\s+(?:\w+\s+)?${ORDINAL}\s+birthday\b`, "i"),
  // "by the time they are nine"
  new RegExp(
    String.raw`\bby\s+the\s+time\s+(?:they|he|she|you)\s+(?:are|is|turn|reach)\s+${NUMBER}\b`,
    "i",
  ),
  // "by grade 4", "by the end of Year 6"
  new RegExp(String.raw`\bby\s+(?:the\s+end\s+of\s+)?(?:grade|year)\s+${NUMBER}\b`, "i"),
  // "within six months", "within 2 years of starting"
  new RegExp(String.raw`\bwithin\s+${NUMBER}\s+${UNIT}\b`, "i"),
  // "two years from now"
  new RegExp(String.raw`\b${NUMBER}\s+${UNIT}\s+from\s+now\b`, "i"),
];

/**
 * The content words of a sentence: lowercased, split on anything that is not a letter or a digit,
 * stopwords dropped, and anything shorter than two characters dropped with them.
 *
 * THE LENGTH FLOOR IS LOAD-BEARING. Splitting on non-alphanumerics turns "a peer's game" into
 * `peer`, `s`, `game`, and a bare `s` is not a stopword, so before the floor existed any two
 * sentences that each contained one possessive shared a content word and error rule 3 passed on
 * nothing whatsoever.
 *
 * NO STEMMING, deliberately. "Compose a fugue" against "A finished composition" fails rule 3, and
 * that is a known false positive we are keeping: `compose` and `composition` are the same word to a
 * reader and different words here. A stemmer would fix that sentence and would also make `play`
 * match `player` and `rate` match `rating`, widening an error-level gate into passing milestones it
 * exists to catch. A false PASS is the expensive direction: the author of a rejected milestone
 * rewords a demonstration in a sentence, while a milestone waved through is one nobody looks at
 * again.
 */
const words = (s: string): readonly string[] =>
  s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));

const err = (code: string, message: string, milestoneId?: string): ValidationProblem => ({
  code,
  severity: "error",
  message,
  ...(milestoneId === undefined ? {} : { milestoneId }),
});

const warn = (code: string, message: string, milestoneId?: string): ValidationProblem => ({
  code,
  severity: "warning",
  message,
  ...(milestoneId === undefined ? {} : { milestoneId }),
});

const stageIndex = (s: string): number => STAGES.indexOf(s as (typeof STAGES)[number]);

/** Depth-first cycle detection over `requires`. Returns true if any cycle exists. */
function hasCycle(byId: ReadonlyMap<string, Milestone>): boolean {
  const state = new Map<string, "open" | "done">();
  const visit = (id: string): boolean => {
    const seen = state.get(id);
    if (seen === "open") return true;
    if (seen === "done") return false;
    state.set(id, "open");
    for (const dep of byId.get(id)?.requires ?? []) {
      if (byId.has(dep) && visit(dep)) return true;
    }
    state.set(id, "done");
    return false;
  };
  for (const id of byId.keys()) if (visit(id)) return true;
  return false;
}

export function validateMap(map: MasteryMap, now?: string): ValidationRecord {
  const errors: ValidationProblem[] = [];
  const warnings: ValidationProblem[] = [];
  const byId = new Map(map.milestones.map((m) => [m.id, m]));

  // E10: milestone ids are unique. Not one of the spec's nine, and found in review. `byId` above is
  // last-wins, so a duplicate id hides one whole milestone: a cycle running through the hidden one
  // is invisible to E1, E6 compares against the wrong floor, and the review screen puts the wrong
  // title beside the wrong problem. It is reported once per duplicated id, not once per copy.
  const seen = new Set<string>();
  const duplicated = new Set<string>();
  for (const m of map.milestones) {
    if (seen.has(m.id)) duplicated.add(m.id);
    seen.add(m.id);
  }
  for (const id of duplicated) {
    errors.push(
      err(
        "E10_DUPLICATE_ID",
        "more than one milestone claims this id, so one of them is hidden",
        id,
      ),
    );
  }

  // E1: the requires graph is a DAG.
  for (const m of map.milestones) {
    for (const dep of m.requires) {
      if (!byId.has(dep)) {
        errors.push(err("E1_DANGLING", `requires "${dep}", which is not in this map`, m.id));
      }
    }
  }
  if (hasCycle(byId)) {
    errors.push(err("E1_CYCLE", "the requires graph contains a cycle, so nothing can start"));
  }

  for (const m of map.milestones) {
    // E2: capability and demonstration are present.
    if (m.capability.trim() === "" || m.demonstration.trim() === "") {
      errors.push(err("E2_EMPTY", "capability and demonstration must both be present", m.id));
    }

    // E3: capability references the artefact in demonstration. A milestone you can finish by
    // consuming something is one whose capability names nothing you made. An artefact set with no
    // content word in it FAILS rather than skipping the rule: a demonstration made only of
    // stopwords is the emptiest one that gets past rule 2, and treating it as nothing to check
    // meant the worst demonstration on the map switched off the check it exists to feed.
    const artefact = new Set(words(m.demonstration));
    const claimed = words(m.capability);
    if (artefact.size === 0) {
      errors.push(
        err("E3_NO_ARTEFACT", "demonstration names no artefact, so nothing can point at one", m.id),
      );
    } else if (!claimed.some((w) => artefact.has(w))) {
      errors.push(
        err(
          "E3_NO_ARTEFACT",
          "capability names nothing from demonstration, so this could be finished by consuming",
          m.id,
        ),
      );
    }

    // E4: sources match the basis. Two codes, because they are two different faults with two
    // different fixes: one milestone owes a citation, the other claimed support it had just said
    // in the same breath it did not have.
    const isModel = m.ordering.basis === "model";
    if (isModel && m.ordering.sources.length > 0) {
      errors.push(err("E4_SOURCES_ON_MODEL_BASIS", "a model basis must carry no sources", m.id));
    }
    if (!isModel && m.ordering.sources.length === 0) {
      errors.push(
        err("E4_MISSING_SOURCES", `a ${m.ordering.basis} basis needs at least one source`, m.id),
      );
    }

    // E5: resources have provenance and cover at least one band the map claims. Two codes again: a
    // resource with no provenance is a different problem from one pitched at the wrong ages, and
    // reporting it under a code named for the age gap sent a guide looking at the wrong thing.
    for (const r of m.resources) {
      if (r.provenance.trim() === "") {
        errors.push(err("E5_MISSING_PROVENANCE", `resource "${r.id}" has no provenance`, m.id));
      }
      if (!r.ageTiers.some((t) => map.ageBands.includes(t))) {
        errors.push(
          err("E5_AGE_BAND_GAP", `resource "${r.id}" covers no age band this map claims`, m.id),
        );
      }
    }

    // E6: a prerequisite cannot be gated later than the thing it unlocks.
    for (const dep of m.requires) {
      const prereq = byId.get(dep);
      if (prereq && stageIndex(prereq.stageFloor) > stageIndex(m.stageFloor)) {
        errors.push(
          err("E6_FLOOR_ORDER", `requires "${dep}", which is gated later than this is`, m.id),
        );
      }
    }

    // E7: a branch cannot claim a mode the domain does not afford.
    for (const mode of m.modes) {
      if (!map.modes.includes(mode)) {
        errors.push(
          err("E7_MODE", `claims mode "${mode}", which this domain does not afford`, m.id),
        );
      }
    }

    // E9: no forecast in the named prose fields.
    const prose = [
      m.ordering.reason,
      ...m.practice.map((p) => p.description),
      ...m.opportunities.map((o) => o.readinessNote),
    ];
    if (prose.some((t) => FORECAST_PATTERNS.some((re) => re.test(t)))) {
      errors.push(
        err(
          "E9_FORECAST",
          "names a time by which a child should arrive, which becomes a quota",
          m.id,
        ),
      );
    }

    // W6: consumption opener. A warning, never an error: see CONSUMPTION_OPENERS.
    const opener = m.capability.trim().toLowerCase();
    if (CONSUMPTION_OPENERS.some((v) => opener.startsWith(`${v} `))) {
      warnings.push(
        warn("W6_CONSUMPTION_VERB", "capability opens with a consumption verb; check it", m.id),
      );
    }
  }

  // E8: banned field names. The real lists from @gt100k/guardrails, never a second copy, and the
  // scan is over KEYS: prose mentioning a rating is legitimate domain language.
  //
  // Scanned in two passes so a hit can name the milestone it is on. The review screen places a
  // problem at the milestone in its `milestoneId`, so a single scan over the whole map, which can
  // only report a bare key name, pushed every banned key to the top of the card and left the guide
  // to find which of a dozen milestones it came from. The shell pass sees the map with its
  // milestones emptied out, so nothing is reported twice.
  const banned = [...SCALAR_KEYS, ...GAMIFICATION_KEYS];
  scanBannedKeys({ ...map, milestones: [] }, banned, (key) => {
    errors.push(err("E8_BANNED_KEY", `field "${key}" is a banned name`));
  });
  for (const m of map.milestones) {
    scanBannedKeys(m, banned, (key) => {
      errors.push(err("E8_BANNED_KEY", `field "${key}" is a banned name`, m.id));
    });
  }

  // W1: mostly the model's own confidence.
  const total = map.milestones.length;
  if (total > 0) {
    const modelShare = map.milestones.filter((m) => m.ordering.basis === "model").length / total;
    if (modelShare > MODEL_BASIS_MAX_SHARE) {
      warnings.push(
        warn(
          "W1_MODEL_HEAVY",
          `${Math.round(modelShare * 100)}% of milestones rest on the model's own reasoning`,
        ),
      );
    }

    // W4: trunk share.
    const trunkShare = map.milestones.filter((m) => m.modes.length === 0).length / total;
    if (trunkShare < TRUNK_MIN_SHARE) {
      warnings.push(
        warn("W4_THIN_TRUNK", `only ${Math.round(trunkShare * 100)}% of this map is trunk`),
      );
    }
  }

  // W2: nothing externally anchored.
  if (!map.milestones.some((m) => m.ordering.basis === "syllabus")) {
    warnings.push(warn("W2_NO_SYLLABUS", "no milestone is anchored to a published syllabus"));
  }

  // W3: a branch below expert entry. The caveat rides in the message, because the guide reads the
  // message and not the spec: no branch is reachable at ANY height today.
  for (const m of map.milestones) {
    if (m.modes.length > 0 && stageIndex(m.stageFloor) < stageIndex(EXPERT_ENTRY_STAGE)) {
      warnings.push(
        warn(
          "W3_EARLY_BRANCH",
          "this branch sits below expert entry, where divergence is usually expected. Note that no " +
            "child can currently be placed above S2_FOUNDATIONS at all, so every branch is " +
            "unreachable at every height until chosen_challenge is emitted.",
          m.id,
        ),
      );
    }
  }

  // W5: staleness. Only when a clock is supplied; the engine never reads one itself.
  if (now !== undefined) {
    const age = (Date.parse(now) - Date.parse(map.revalidatedAt)) / 86_400_000;
    if (Number.isFinite(age) && age > STALE_AFTER_DAYS) {
      warnings.push(warn("W5_STALE", `resources were last re-checked ${Math.round(age)} days ago`));
    }
  }

  return {
    validatedAt: now ?? map.revalidatedAt,
    validatorVersion: VALIDATOR_VERSION,
    errors,
    warnings,
  };
}
