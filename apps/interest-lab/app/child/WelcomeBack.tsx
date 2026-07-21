import type { ProbeCardView } from "@gt100k/interest-lab-view";
import { Glyph, STATE_GLYPHS } from "../ui/Glyph";

export interface WelcomeBackProps {
  quest: Pick<ProbeCardView, "returnState" | "whyCopy">;
}

export function WelcomeBack({ quest }: WelcomeBackProps) {
  if (quest.returnState === "prompted-return") {
    return (
      <span className="prompted-return" data-return-delight="none">
        <span className="prompted-return-mark" data-return-glyph="prompted" aria-hidden="true">
          <Glyph name={STATE_GLYPHS.promptedReturn} size={18} />
        </span>
        <span>Returned after a prompt.</span>
      </span>
    );
  }

  if (quest.returnState !== "voluntary-return") return null;

  return (
    <span className="welcome-back" data-return-delight="static">
      <span className="welcome-back-halo" aria-hidden="true">
        <Glyph name={STATE_GLYPHS.voluntaryReturn} size={18} />
      </span>
      <span>{quest.whyCopy}</span>
    </span>
  );
}
