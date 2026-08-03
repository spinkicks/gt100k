import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { recoveryFor } from "@gt100k/wellbeing";
import { RecoveryPanel } from "../app/recovery-panel.js";

function render(trigger: string): string {
  return renderToStaticMarkup(<RecoveryPanel plan={recoveryFor(trigger)!} />);
}

describe("RecoveryPanel", () => {
  test("shows the plan headline and every move's instruction", () => {
    const html = render("BURNOUT_TIP");
    expect(html).toContain("Ease the pressure");
    expect(html).toContain("Stop using rewards");
    expect(html).toContain("Keep tasks hard enough to matter");
  });

  test("always renders both guardrails as things to avoid", () => {
    const html = render("ENGAGEMENT_FADING");
    // renderToStaticMarkup HTML-escapes the apostrophe (&#x27;), so the literal below matches the
    // actual SSR output rather than the source string.
    expect(html).toContain("Don&#x27;t make the child quit");
    expect(html).toContain("Don&#x27;t rely on the break alone");
    // Guardrails carry the avoid modifier so they read as a warning, not another step.
    expect(html).toContain("recmove--avoid");
  });

  test("shows the break block only when the plan has one", () => {
    expect(render("EARLY_BURNOUT")).toContain("A few days to about a week");
    expect(render("BURNOUT_TIP")).not.toContain("A few days to about a week");
  });

  test("always shows the dip-vs-dead-end guidance", () => {
    expect(render("BURNOUT_TIP")).toContain("Is this a dip or a dead end?");
  });

  test("renders a why button for a cited move (claim resolves)", () => {
    // WhyThis renders its info button (className "why-btn") only when the claim id resolves, so its
    // presence proves the move's citation is wired through to the registry.
    expect(render("ENGAGEMENT_FADING")).toContain("why-btn");
  });

  test("offers to record a decision when a logger is supplied", () => {
    const html = renderToStaticMarkup(
      <RecoveryPanel plan={recoveryFor("EARLY_BURNOUT")!} onLog={() => {}} />,
    );
    expect(html).toContain("Record what you chose");
  });
});
