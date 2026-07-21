import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InterestLabClient } from "../app/InterestLabClient";
import {
  ChildComfortControls,
  type ChildComfortControlsProps,
} from "../app/ui/controls/ChildComfortControls";
import { resolveStaffDebugMode } from "../app/ui/controls/settings";

const comfort: ChildComfortControlsProps = {
  ageBand: "9-11",
  calm: false,
  onCalmChange: () => undefined,
};

describe("staff debug flag", () => {
  it("stays off for a plain child URL", () => {
    expect(resolveStaffDebugMode("")).toBe(false);
    expect(resolveStaffDebugMode("?age=6-8")).toBe(false);
    expect(resolveStaffDebugMode("?surface=guide")).toBe(false);
  });

  it("turns on for the staff/debug flags in any truthy form", () => {
    expect(resolveStaffDebugMode("?debug")).toBe(true);
    expect(resolveStaffDebugMode("?debug=1")).toBe(true);
    expect(resolveStaffDebugMode("?debug=true")).toBe(true);
    expect(resolveStaffDebugMode("debug=yes")).toBe(true);
    expect(resolveStaffDebugMode("?staff")).toBe(true);
    expect(resolveStaffDebugMode("?foo=bar&staff=on")).toBe(true);
  });

  it("treats explicit falsey values as off (a shared link can disable it)", () => {
    expect(resolveStaffDebugMode("?debug=0")).toBe(false);
    expect(resolveStaffDebugMode("?debug=false")).toBe(false);
    expect(resolveStaffDebugMode("?debug=no")).toBe(false);
    expect(resolveStaffDebugMode("?staff=off")).toBe(false);
  });
});

describe("child comfort controls", () => {
  it("renders a single calm-mode toggle and a help disclosure, not a control wall", () => {
    const markup = renderToStaticMarkup(createElement(ChildComfortControls, comfort));

    // The one child-facing control: calm mode.
    expect(markup).toContain('name="calm-mode"');
    expect(markup).toContain("Calm mode");
    // A help affordance the child can open.
    expect(markup).toContain("<details");
    expect(markup).toContain("<summary");

    // NONE of the QA-harness controls leak into the child bar.
    expect(markup).not.toContain('name="age-band"');
    expect(markup).not.toContain('name="render-tier"');
    expect(markup).not.toContain('name="plain-mode"');
    expect(markup).not.toContain('name="surface"');
    expect(markup).not.toContain("Interest Lab controls");
  });

  it("reflects the effective calm state on the toggle", () => {
    const off = renderToStaticMarkup(createElement(ChildComfortControls, comfort));
    expect(off).not.toContain('data-on="true"');
    expect(off).not.toContain("checked");

    const on = renderToStaticMarkup(
      createElement(ChildComfortControls, { ...comfort, calm: true }),
    );
    expect(on).toContain('data-on="true"');
    expect(on).toContain("checked");
  });

  it("sizes touch targets by age band like the world does", () => {
    const younger = renderToStaticMarkup(
      createElement(ChildComfortControls, { ...comfort, ageBand: "6-8" }),
    );
    expect(younger).toContain("--control-target:56px");
  });
});

describe("child build hides the QA harness by default", () => {
  it("renders only the child comfort bar, no surface/age/tier/plain controls", () => {
    const markup = renderToStaticMarkup(createElement(InterestLabClient));

    // Child chrome is present.
    expect(markup).toContain('name="calm-mode"');
    // The default surface is still the child world.
    expect(markup).toContain('data-active-surface="child"');

    // The QA harness is gone from the default (non-debug) child build.
    expect(markup).not.toContain('name="surface"');
    expect(markup).not.toContain('name="age-band"');
    expect(markup).not.toContain('name="render-tier"');
    expect(markup).not.toContain("Interest Lab controls");
    expect(markup).not.toContain("Mission deck");
    expect(markup).not.toContain("Preview settings");
  });
});
