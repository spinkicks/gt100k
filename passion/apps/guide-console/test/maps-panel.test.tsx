/**
 * The Maps panel rendered to static markup, which is the surface two of this slice's guarantees are
 * actually about.
 *
 * THE COMPLETION-PERCENTAGE BAN IS THE REASON THIS FILE EXISTS. Spec §5 says in as many words that
 * the data model cannot enforce it: `milestones` is an array, `done / total` is one division away
 * for any consumer, and no engine rule over that shape can prevent it. The ban is therefore a
 * UI-layer invariant "with its own test", and a test that only inspects the view model does not
 * meet that: a progress bar written straight into the JSX passes every assertion about a view
 * model, because it never touches one. So this renders the component and reads the HTML.
 *
 * `renderToStaticMarkup` and no jsdom, the same way `packages/ui` and `apps/home` test their
 * components, so the console suite stays headless.
 */
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { MasteryMap } from "@gt100k/mastery-map";
import type { HypothesisCard } from "@gt100k/hypothesis-store";

import { workForKid, type ChildWork } from "../app/map-evidence.js";
import { MapsPanel } from "../app/maps-panel.js";
import {
  CONSOLE_COMPETITION_MATH_MAP,
  CONSOLE_GAME_DEV_MAP,
  CONSOLE_PIANO_MAP,
  REVIEW_MAPS,
} from "../app/maps-seed.js";
import { REVIEW_NOW, withStatus } from "../app/maps.js";

const markup = (maps = REVIEW_MAPS, work?: ChildWork): string =>
  renderToStaticMarkup(<MapsPanel maps={maps} work={work} />);

/** The stylesheet this markup is rendered under. Read as text, because two of the guarantees below
    are about what CSS can do to a row without touching a line of the markup. */
const CSS = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

/** "N of M" written out, with both sides a quantity. An article is allowed between them, because
    "three of the five" is the same tally as "three of five". */
const WORD_NUMBER = "one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|\\d+";
const TALLY_IN_WORDS = new RegExp(
  `\\b(?:${WORD_NUMBER})\\s+of\\s+(?:the\\s+)?(?:${WORD_NUMBER})\\b`,
  "i",
);

const ARI = workForKid("kid-synthetic-001"); // one recording, and an override on the rung before it
const BEX = workForKid("kid-synthetic-002"); // one paper sat, nothing behind the rung after it
const DULCE = workForKid("kid-synthetic-004"); // four artefacts over three projects, two milestones

/** The maths seed put into use and re-checked, because a child is only read against a map that is
    in use and fit to be, and that seed is deliberately a stale draft. */
const MATH_IN_USE: MasteryMap = {
  ...CONSOLE_COMPETITION_MATH_MAP,
  status: "published",
  revalidatedAt: REVIEW_NOW,
};

describe("MapsPanel renders a map a guide can read", () => {
  it("puts every map on the screen with its milestones", () => {
    const html = markup();
    expect(html).toContain('data-testid="maps-panel"');
    expect([...html.matchAll(/data-testid="map-card"/g)]).toHaveLength(REVIEW_MAPS.length);
    const milestones = REVIEW_MAPS.reduce((n, m) => n + m.milestones.length, 0);
    expect([...html.matchAll(/data-testid="map-milestone"/g)]).toHaveLength(milestones);
  });

  it("shows the ordering ground in words, not only as a colour", () => {
    const html = markup([CONSOLE_PIANO_MAP]);
    expect(html).toContain("Published syllabus");
    expect(html).toContain("Our own reasoning");
  });
});

/**
 * Each assertion below is one shape the ban takes in real markup. A `<progress>` element, a percent
 * sign, an ARIA progressbar and an "N of M" or "completed" phrasing are the four ways a count of
 * finished milestones actually reaches a screen, and none of them may appear.
 */
describe("MapsPanel renders no completion measure of any kind", () => {
  const html = markup();

  it("renders no progress element", () => {
    expect(html).not.toMatch(/<progress\b/i);
  });

  it("renders no percentage anywhere", () => {
    expect(html).not.toContain("%");
  });

  it("renders nothing announced to a screen reader as a progress bar", () => {
    expect(html).not.toMatch(/role="progressbar"/i);
  });

  it("renders no 'complete', 'completed' or 'N of M' phrasing", () => {
    expect(html).not.toMatch(/\bcompleted?\b/i);
    expect(html).not.toMatch(/\bof\s+\d+\b/i);
  });

  /**
   * And the reason none of the above can be computed rather than merely being absent today: the map
   * is domain knowledge about a DOMAIN, and nothing in it, or in the view model built from it, says
   * whether any particular child has done any particular milestone. A percentage here has no
   * numerator to divide by the count of milestones, which is the honest form of this ban. The
   * denominator on its own is harmless; `test/maps.test.ts` pins the shape that keeps it that way.
   */
  it("has no numerator to divide, because no per-child doneness is rendered at all", () => {
    expect(html).not.toMatch(/\bdone\b/i);
    expect(html).not.toMatch(/\bfinished\s+milestones?\b/i);
    expect(html).not.toMatch(/\bremaining\b/i);
    expect(html).not.toMatch(/\bmilestones?\s+(?:left|to go)\b/i);
  });
});

describe("MapsPanel and the decision about use", () => {
  /** Spec §7: staleness is surfaced in the review screen. With only maps re-checked inside the
      window in the queue, this path could never run at all. */
  it("says out loud that a map is overdue a re-check", () => {
    const html = markup([CONSOLE_COMPETITION_MATH_MAP]);
    expect(html).toContain('data-testid="map-stale"');
    expect(html).toContain("Out of date");
  });

  it("does not say it about a map re-checked recently", () => {
    expect(markup([CONSOLE_PIANO_MAP])).not.toContain('data-testid="map-stale"');
  });

  /**
   * The gate is `canPublish` and not an empty error list. This map has nothing wrong with it, so a
   * panel keyed on validity alone would offer the button, and the resources behind it have not been
   * looked at in more than half a year.
   */
  it("refuses to put a stale map into use, and says why rather than only greying the button", () => {
    const html = markup([CONSOLE_COMPETITION_MATH_MAP]);
    expect(html).toMatch(/<button[^>]*disabled[^>]*>Put into use<\/button>/);
    expect(html).toContain('data-testid="map-refusal"');
    expect(html).toMatch(/Re-check them before putting this into use/);
  });

  /** A draft, because the affordance is the move INTO use and two of the three seeds are already
      there. Valid and freshly checked, so nothing is in the way of making it. */
  it("offers the button on a draft that is valid and freshly checked", () => {
    const html = markup([withStatus(CONSOLE_PIANO_MAP, "draft")]);
    expect(html).toContain("Put into use");
    expect(html).not.toMatch(/<button[^>]*disabled[^>]*>Put into use<\/button>/);
    expect(html).not.toContain('data-testid="map-refusal"');
  });

  /** The affordance spec §6 asks for: a guide can correct what the software wrote. */
  it("offers one editable field per milestone, holding what the milestone currently says", () => {
    const html = markup([CONSOLE_PIANO_MAP]);
    expect([...html.matchAll(/name="capability"/g)]).toHaveLength(
      CONSOLE_PIANO_MAP.milestones.length,
    );
    expect(html).toContain(CONSOLE_PIANO_MAP.milestones[0]!.capability);
    expect(html).toContain("Save correction");
  });
});

// ── Slice 2: the map read against the selected child ─────────────────────────────────────────────

describe("MapsPanel reads a map against the child a guide has selected", () => {
  it("shows nothing about any child until one is selected", () => {
    const html = markup([CONSOLE_PIANO_MAP]);
    expect(html).not.toContain('data-testid="map-child"');
    expect(html).not.toContain('data-testid="map-read"');
  });

  it("puts one row on the screen for every milestone, in the order the engine returned", () => {
    const html = markup([CONSOLE_GAME_DEV_MAP], DULCE);
    const ids = [...html.matchAll(/data-testid="map-read" data-id="([^"]+)"/g)].map((m) => m[1]);
    expect(ids).toEqual([
      "gd-one-screen-game",
      "gd-reproduce-a-bug",
      "gd-playtest",
      "gd-version-control",
      "gd-profile-a-scene",
    ]);
  });

  it("says how much was made in words, and says in the same breath what that is not", () => {
    const html = markup([CONSOLE_GAME_DEV_MAP], DULCE);
    expect(html).toContain("Several things made");
    expect(html).toContain("Nothing made here yet");
    expect(html).toMatch(/nowhere near enough to say the capability is there|still well short/i);
    // The two questions are told apart on the screen, not only in the data.
    expect(html).toContain("Could be offered next");
    expect(html).toContain("Not on offer yet");
  });

  it("says what is in the way, and tells a ceiling apart from a placement", () => {
    const html = markup([CONSOLE_GAME_DEV_MAP], DULCE);
    expect(html).toContain('data-testid="map-read-blocked"');
    expect(html).toContain("Gated at Foundations, and the planner has Dulce Park at Ignition.");
    // Profiling sits at Authorship, which nobody can currently be placed at, so the caveat about
    // the product is true here and is rendered.
    expect(html).toContain('data-testid="map-ceiling"');
    expect(html).toMatch(/not for anything this child did/i);
    // And the two rungs at Foundations get the other sentence, which is about a placement and says
    // whose call moving her is.
    expect(html).toContain('data-testid="map-stage-gate"');
    expect(html).toMatch(/where the planner has Dulce Park today/i);
  });

  /**
   * The defect this pins, and it was a false sentence rendered to a guide about a real child. The
   * caveat fired on ANY stage floor and then said nothing above Foundations can be reached by any
   * child. On this map nothing sits above Foundations at all, and Bex is at Ignition, so the rungs
   * in the way are reachable, the block is about where the planner has put her, and every clause of
   * the caveat was false.
   */
  it("claims no ceiling on a map whose gates the planner could pass tomorrow", () => {
    const html = markup([MATH_IN_USE], BEX);
    expect(html).toContain('data-testid="map-read-blocked"');
    expect(html).not.toContain('data-testid="map-ceiling"');
    expect(html).not.toMatch(/reached by any child/i);
    expect(html).toContain('data-testid="map-stage-gate"');
    expect(html).toMatch(/where the planner has Bex Ito today/i);
  });

  it("shows a guide's override with its note, and says it puts no standing on the milestone", () => {
    const html = markup([CONSOLE_PIANO_MAP], ARI);
    expect(html).toContain('data-testid="map-read-override"');
    expect(html).toContain("none of it was kept");
    expect(html).toMatch(/puts no standing on this milestone/i);
    // And the milestone it sits on still reads as empty, because an override is not a tick.
    expect(html).toMatch(
      /data-testid="map-read" data-id="pf-one-whole-piece" data-strength="none"/,
    );
  });

  it("offers the override affordance only where there is nothing behind the milestone", () => {
    const html = markup([CONSOLE_GAME_DEV_MAP], DULCE);
    const rows = html.split('data-testid="map-read"').slice(1);
    const offered = rows.filter((r) => r.includes('name="note"'));
    const empty = rows.filter((r) => r.includes('data-strength="none"'));
    expect(offered).toHaveLength(empty.length);
    expect(offered.length).toBeGreaterThan(0);
    // The two rows with artefacts behind them get no button, because it would change nothing.
    expect(rows.filter((r) => r.includes('data-strength="multiple"'))).toHaveLength(2);
    for (const row of rows.filter((r) => r.includes('data-strength="multiple"'))) {
      expect(row).not.toContain('name="note"');
    }
  });

  /** And no second one on a milestone a guide has already spoken about. The engine reads overrides
      as a log and keeps the last, so the form was an invitation to overwrite a signed record. */
  it("offers no second override on a milestone that already carries one", () => {
    const html = markup([CONSOLE_PIANO_MAP], ARI);
    const row = html
      .split('data-testid="map-read"')
      .find((r) => r.startsWith(' data-id="pf-one-whole-piece"'))!;
    expect(row).toContain('data-testid="map-read-override"');
    expect(row).toContain('data-strength="none"');
    expect(row).not.toContain('name="note"');
  });
});

/**
 * Slice 1 §8: a map with a problem on it never reaches what a plan consumes, and the review path
 * was justified on the grounds that no child was downstream of it. A per-child standing put one
 * there. The map still goes on the screen in every state below, because the review surface is where
 * a map that cannot be used gets fixed; the reading does not.
 */
describe("MapsPanel reads no child against a map that is not in use, or not fit to be", () => {
  const REFUSAL = 'data-testid="map-standing-refusal"';

  it("shows the reason instead of a standing on a draft", () => {
    const html = markup([withStatus(CONSOLE_PIANO_MAP, "draft")], ARI);
    expect(html).toContain(REFUSAL);
    expect(html).toMatch(/not in use yet/i);
    expect(html).not.toContain('data-testid="map-read"');
  });

  it("shows the reason instead of a standing on a withdrawn map", () => {
    const html = markup([withStatus(CONSOLE_PIANO_MAP, "withdrawn")], ARI);
    expect(html).toContain(REFUSAL);
    expect(html).toMatch(/taken out of use/i);
    expect(html).not.toContain('data-testid="map-read"');
  });

  it("shows the reason instead of a standing on a map the validator refuses", () => {
    const html = markup([CONSOLE_COMPETITION_MATH_MAP], BEX);
    expect(html).toContain(REFUSAL);
    expect(html).toMatch(/re-check/i);
    expect(html).not.toContain('data-testid="map-read"');
  });

  it("puts the standing back the moment the map is in use and fit to be", () => {
    const html = markup([MATH_IN_USE], BEX);
    expect(html).not.toContain(REFUSAL);
    expect([...html.matchAll(/data-testid="map-read"/g)]).toHaveLength(
      MATH_IN_USE.milestones.length,
    );
  });

  it("renders the map itself in every one of those states, because this is where it gets fixed", () => {
    for (const status of ["draft", "withdrawn", "published"] as const) {
      const html = markup([withStatus(CONSOLE_PIANO_MAP, status)], ARI);
      expect([...html.matchAll(/data-testid="map-milestone"/g)]).toHaveLength(
        CONSOLE_PIANO_MAP.milestones.length,
      );
      expect(html).toContain("Save correction");
    }
  });
});

/**
 * Butler (1988), which is decision 4 and the reason this test is an invariant over EVERY row rather
 * than a spot check. In 132 children aged roughly 10 to 12, a bare verdict with no task anchoring
 * behaved like a grade and depressed both interest and later performance. So a standing may never
 * reach the screen on its own, including when the honest answer is that there is nothing there.
 */
describe("MapsPanel never renders a standing without the work under it", () => {
  it("puts the work inside every read row, on every map, for both children", () => {
    for (const work of [ARI, DULCE]) {
      const rows = markup(REVIEW_MAPS, work).split('data-testid="map-read"').slice(1);
      expect(rows.length).toBeGreaterThan(0);
      for (const row of rows) expect(row).toContain('data-testid="map-read-work"');
    }
  });

  /**
   * The invariant itself, which the block above does not assert: a row saying something was made
   * has to have the thing it was made of rendered inside it. A `data-testid` that is rendered
   * unconditionally proves only that the element exists, and a standing over "nothing has been
   * linked to this milestone" is precisely the bare verdict Butler (1988) is about.
   */
  it("renders at least one artefact in every row that says something was made", () => {
    let checked = 0;
    for (const work of [ARI, DULCE]) {
      for (const row of markup(REVIEW_MAPS, work).split('data-testid="map-read"').slice(1)) {
        if (row.includes('data-strength="none"')) {
          expect(row).toContain("Nothing has been linked to this milestone.");
          continue;
        }
        expect(row).not.toContain("Nothing has been linked to this milestone.");
        expect(row).toMatch(/<ul class="mapwork">[\s\S]*?<li>/);
        expect([...row.matchAll(/class="mapwork__at"/g)].length).toBeGreaterThan(0);
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it("says out loud that nothing has been linked rather than leaving a bare standing", () => {
    const html = markup([CONSOLE_PIANO_MAP], ARI);
    expect(html).toContain("Nothing has been linked to this milestone.");
  });

  /**
   * And the artefacts rendered are the ones on the link the standing was derived from, so "one
   * thing made" cannot appear over two artefacts or over somebody else's. Every artefact the
   * child's record holds for that milestone, and nothing besides.
   */
  it("lists exactly the artefacts on the link, by name, beside the standing they produced", () => {
    const html = markup([CONSOLE_GAME_DEV_MAP], DULCE);
    const rowOf = (id: string): string =>
      html.split('data-testid="map-read"').find((r) => r.startsWith(` data-id="${id}"`))!;

    for (const project of DULCE.projects) {
      // One milestone per project, the way a real `Project` carries it, so the whole of a
      // project's work lands in one row and none of it anywhere else.
      const row = rowOf(project.milestoneId!);
      for (const thing of project.made) {
        expect(row).toContain(project.title);
        expect(row).toContain(thing.title);
      }
    }
    // Two artefacts under the rung whose standing says several things were made, one under each
    // project for the rung evidenced twice, and nothing of Dulce's anywhere it does not belong.
    expect(rowOf("gd-one-screen-game")).toContain("Playable link her cousin got to the end of");
    expect(rowOf("gd-reproduce-a-bug")).not.toContain("Playable link her cousin got to the end of");
    expect(rowOf("gd-playtest")).not.toContain("Rescue the Toaster");
  });
});

/**
 * The percentage ban, over the surface that first has something to divide. Slice 1 could rest on
 * "a map holds nothing about any child"; a per-child read is a numerator by construction, so from
 * here the ban is a thing the markup has to keep obeying rather than a thing it cannot express.
 *
 * Every assertion below is one shape the ban takes in real markup, and each of them fails if a
 * progress bar, a fraction, an "N of M", a percentage or a tally of standings is added.
 */
describe("MapsPanel renders no completion measure over a child either", () => {
  const html = markup(REVIEW_MAPS, DULCE) + markup(REVIEW_MAPS, ARI);

  it("renders no progress element and nothing announced as one", () => {
    expect(html).not.toMatch(/<progress\b/i);
    expect(html).not.toMatch(/role="progressbar"/i);
    expect(html).not.toMatch(/aria-valuenow=/i);
  });

  it("renders no percentage anywhere", () => {
    expect(html).not.toContain("%");
  });

  it("renders no 'complete', 'completed' or 'N of M' phrasing", () => {
    expect(html).not.toMatch(/\bcompleted?\b/i);
    expect(html).not.toMatch(/\bof\s+\d+\b/i);
  });

  /**
   * And "N of M" written out in words, because "Three of five rungs" is the same tally and walks
   * straight through a regex looking for digits. Both sides have to be a quantity: "one of a
   * scale" is ordinary domain language in a demonstration and is not a count of anything.
   */
  it("renders no 'N of M' spelled out in words either", () => {
    expect(html).not.toMatch(TALLY_IN_WORDS);
    // The guard itself bites, on the phrasing it exists to catch.
    for (const phrase of ["Three of five rungs", "three of the five", "3 of five", "two of 5"]) {
      expect(phrase).toMatch(TALLY_IN_WORDS);
    }
    // And leaves alone the phrasing that is not a tally.
    for (const phrase of ["one of a scale and one of a short piece", "one of the last eight"]) {
      expect(phrase).not.toMatch(TALLY_IN_WORDS);
    }
  });

  it("renders no doneness word about a child", () => {
    expect(html).not.toMatch(/\bdone\b/i);
    expect(html).not.toMatch(/\bfinished\s+milestones?\b/i);
    expect(html).not.toMatch(/\bremaining\b/i);
    expect(html).not.toMatch(/\bmilestones?\s+(?:left|to go)\b/i);
  });

  /** New in slice 2, because these are the shapes a numerator actually arrives in. */
  it("renders no fraction of one thing over another", () => {
    expect(html).not.toMatch(/\d\s*\/\s*\d/);
    expect(html).not.toMatch(/\b\d+\s+out\s+of\b/i);
  });

  it("renders no tally of milestones, artefacts or standings", () => {
    expect(html).not.toMatch(/\b\d+\s+(?:milestones?|artefacts?|artifacts?|things|steps? done)\b/i);
    expect(html).not.toMatch(/\b(?:reached|evidenced|unlocked|earned)\s+\d+\b/i);
  });

  /** And no verdict word, which is the other thing a standing must never become. */
  it("renders no word that reads as a pass", () => {
    expect(html).not.toMatch(/\b(?:passed|mastered|achieved|proficient)\b/i);
  });
});

/**
 * The half of the ban the markup cannot hold. Every read row carries `data-strength` and
 * `data-reachable`, which is right: they are what the row IS, and a test can read them. But an
 * attribute is also a selector, and a CSS counter keyed on one renders a running tally with no
 * change to a single line of markup and nothing for any assertion above to catch. `content:
 * counter(rungs)` in the stylesheet is a completion measure on the screen, and the stylesheet is
 * the only place it can be seen.
 */
describe("The stylesheet cannot turn a read row into a tally either", () => {
  /** Selector and body per rule. Rules inside an at-rule come out on their own, which is what
      matters: what a rule is keyed on is its selector. */
  const rulesOf = (css: string): readonly { selector: string; body: string }[] =>
    [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
      selector: m[1]!.trim(),
      body: m[2]!,
    }));

  const COUNTER = /counter-(?:increment|reset|set)\s*:|counters?\s*\(/;
  /** The attributes every read row carries, and the classes the read section is built from. A
      counter needs two rules, one to start it and one to step it, so both have to be shut. */
  const READ_SELECTOR = /\[data-strength|\[data-reachable|\.mapread|\.mapstrength|\.mapoffer/;

  it("keys no CSS counter on a read row or on the attributes it carries", () => {
    const rules = rulesOf(CSS);
    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules) {
      if (READ_SELECTOR.test(rule.selector)) expect(rule.body).not.toMatch(COUNTER);
    }
    // The check bites: this is the rule it exists to refuse, and it is two lines of stylesheet.
    const tally = '.mapread[data-strength="none"] { counter-increment: rungs; }';
    for (const rule of rulesOf(tally)) {
      expect(READ_SELECTOR.test(rule.selector)).toBe(true);
      expect(rule.body).toMatch(COUNTER);
    }
  });

  /**
   * And the offer chip is as quiet as the standings beside it. All three standings are deliberately
   * grey, so a filled accent on "could be offered next" made reachability the row's visual verdict:
   * the one thing on the row that is NOT a claim about the child was the only thing the eye landed
   * on, which undid in the stylesheet what the copy spends three sentences saying.
   */
  it("gives the offer chip no fill the standings do not have", () => {
    const chip = rulesOf(CSS).filter((r) => r.selector.includes(".mapoffer--yes"));
    expect(chip).toHaveLength(1);
    expect((chip[0] as { body: string }).body).not.toMatch(/accent/);
  });
});

/**
 * The coverage line, which exists because this tab is the one place the rail and the main pane can
 * describe disjoint sets. Every seeded map is for a domain no synthetic child specializes in, so
 * "Where Ari would go next on this map" renders under domains Ari has never touched. That is a
 * legitimate review surface and a misleading read on a child at the same time, and the difference
 * between them is entirely in whether the tab says so.
 */
describe("what the maps do and do not cover of this child", () => {
  const spec = (path: readonly string[]): HypothesisCard =>
    ({
      id: `h-${path.join("-")}`,
      domainPath: path,
      state: "EMERGING",
      mode: "BUILD",
    }) as unknown as HypothesisCard;

  const withSpecs = (specs: readonly HypothesisCard[], maps = REVIEW_MAPS): string =>
    renderToStaticMarkup(<MapsPanel maps={maps} specs={specs} />);

  it("says plainly when nothing below is this child's domain", () => {
    // Ari's real case: audio-systems and dance, against maps for instruments and game-dev.
    const html = withSpecs([spec(["music-sound", "audio-systems"]), spec(["art-motion", "dance"])]);
    expect(html).toContain("No map yet for what this child is actually into");
  });

  it("names the unmapped specializations, so the gap is actionable rather than a mood", () => {
    const html = withSpecs([spec(["music-sound", "audio-systems"])]);
    expect(html.toLowerCase()).toContain("audio systems");
  });

  it("recognises a map that serves the child's exact domain", () => {
    const html = withSpecs([spec(["music-sound", "instruments"])]);
    expect(html).toContain("Every one of this child");
    expect(html).not.toContain("No map yet");
  });

  it("splits mapped from unmapped when the child is partly covered", () => {
    const html = withSpecs([spec(["music-sound", "instruments"]), spec(["art-motion", "dance"])]);
    expect(html).toContain("Not yet mapped");
    expect(html).not.toContain("No map yet");
  });

  it("says nothing at all when no child is loaded", () => {
    // The tab is a coherent thing to look at with no child in it, and a coverage line about nobody
    // would be noise on the surface whose whole job is reviewing the maps themselves.
    expect(renderToStaticMarkup(<MapsPanel maps={REVIEW_MAPS} />)).not.toContain("mapcover");
  });

  it("keeps the progress ban: coverage counts specializations, never milestones", () => {
    // The line reports how many DOMAINS have a map, which is a fact about the library. The moment
    // it reported how far along a map anyone is, it would be the banned number wearing a new label.
    const html = withSpecs([spec(["music-sound", "instruments"]), spec(["art-motion", "dance"])]);
    const cover = html.slice(html.indexOf("mapcover"), html.indexOf("mapcover") + 400);
    expect(cover).not.toMatch(TALLY_IN_WORDS);
    expect(cover).not.toMatch(/\d+\s*%/);
  });
});
