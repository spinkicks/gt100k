import { type RefObject, useEffect, useState } from "react";
import { type Fit, type FitMode, fitArt } from "./fit";

/**
 * Track how the art fits inside `ref`'s box, recomputing on resize.
 *
 * Only the warped-preview layer needs this. The backdrop image and the SVG hotspot overlay scale
 * themselves through `object-fit` and `preserveAspectRatio`, which the browser keeps in lockstep for
 * free — see fit.ts. A `matrix3d` cannot be expressed that way, so this is the one place the fit has
 * to be measured, and it is why previews (not hotspots) are the thing that would lag a resize by a
 * frame if this hook were wrong.
 *
 * NO RESIZE-OBSERVER, NO MEASUREMENT
 * jsdom implements neither `ResizeObserver` nor layout, so in tests this returns
 * `{ scale: 0, offsetX: 0, offsetY: 0 }` for the element's 0x0 box. That is a designed outcome, not a
 * gap: `fitArt` maps a degenerate box to scale 0 rather than to NaN, so the preview layer renders
 * with a zero-scale transform — present in the DOM, inspectable by tests, and drawing nothing. No
 * component needs an "unmeasured" branch. The real geometry is verified in a real browser instead
 * (verify/matrix3d.verify.ts).
 */
export function useFitToElement(
  ref: RefObject<Element | null>,
  artWidth: number,
  artHeight: number,
  mode: FitMode = "cover",
): Fit {
  const [fit, setFit] = useState<Fit>(() => fitArt(0, 0, artWidth, artHeight, mode));

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const measure = () => {
      const box = element.getBoundingClientRect();
      const next = fitArt(box.width, box.height, artWidth, artHeight, mode);
      // Compare before setting: a ResizeObserver fires on every layout pass that touches the
      // element, and re-rendering every prop's homography for an unchanged box is pure waste.
      setFit((prev) =>
        prev.scale === next.scale && prev.offsetX === next.offsetX && prev.offsetY === next.offsetY
          ? prev
          : next,
      );
    };

    measure();

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, artWidth, artHeight, mode]);

  return fit;
}
