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
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { MapsPanel } from "../app/maps-panel.js";
import { COMPETITION_MATH_MAP, PIANO_MAP, REVIEW_MAPS } from "../app/maps-seed.js";

const markup = (maps = REVIEW_MAPS): string => renderToStaticMarkup(<MapsPanel maps={maps} />);

describe("MapsPanel renders a map a guide can read", () => {
  it("puts every map on the screen with its milestones", () => {
    const html = markup();
    expect(html).toContain('data-testid="maps-panel"');
    expect([...html.matchAll(/data-testid="map-card"/g)]).toHaveLength(REVIEW_MAPS.length);
    const milestones = REVIEW_MAPS.reduce((n, m) => n + m.milestones.length, 0);
    expect([...html.matchAll(/data-testid="map-milestone"/g)]).toHaveLength(milestones);
  });

  it("shows the ordering ground in words, not only as a colour", () => {
    const html = markup([PIANO_MAP]);
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
    const html = markup([COMPETITION_MATH_MAP]);
    expect(html).toContain('data-testid="map-stale"');
    expect(html).toContain("Out of date");
  });

  it("does not say it about a map re-checked recently", () => {
    expect(markup([PIANO_MAP])).not.toContain('data-testid="map-stale"');
  });

  /**
   * The gate is `canPublish` and not an empty error list. This map has nothing wrong with it, so a
   * panel keyed on validity alone would offer the button, and the resources behind it have not been
   * looked at in more than half a year.
   */
  it("refuses to put a stale map into use, and says why rather than only greying the button", () => {
    const html = markup([COMPETITION_MATH_MAP]);
    expect(html).toMatch(/<button[^>]*disabled[^>]*>Put into use<\/button>/);
    expect(html).toContain('data-testid="map-refusal"');
    expect(html).toMatch(/Re-check them before putting this into use/);
  });

  it("offers the button on a map that is valid and freshly checked", () => {
    const html = markup([PIANO_MAP]);
    expect(html).toContain("Put into use");
    expect(html).not.toMatch(/<button[^>]*disabled[^>]*>Put into use<\/button>/);
    expect(html).not.toContain('data-testid="map-refusal"');
  });

  /** The affordance spec §6 asks for: a guide can correct what the software wrote. */
  it("offers one editable field per milestone, holding what the milestone currently says", () => {
    const html = markup([PIANO_MAP]);
    expect([...html.matchAll(/name="capability"/g)]).toHaveLength(PIANO_MAP.milestones.length);
    expect(html).toContain(PIANO_MAP.milestones[0]!.capability);
    expect(html).toContain("Save correction");
  });
});
