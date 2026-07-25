/**
 * Vision verification: does this image actually show the position we asked for?
 *
 * The checker is asked for a structured verdict rather than prose because the
 * result drives control flow (retry or stop), and because naming each wrong
 * square is what makes the next attempt's prompt useful. It is also told to read
 * the board off the image before comparing, which stops it from pattern-matching
 * the expected description back at us — the most common way an automated visual
 * check quietly passes everything.
 */

import { askVision } from "./gateway.mjs";

const INSTRUCTIONS = `You are a strict board-position checker. Work in this order:

1. FIRST, read the board straight off the image, ignoring the target below. Note
   the grid dimensions and, square by square, which pieces you can see and where.
2. THEN compare what you read against the target description.
3. Report only real, visible discrepancies. Do not assume the image is correct
   because the target says so, and do not invent errors you cannot see.

Judge every property the target states — grid dimensions, which piece of which
colour sits on which square, and, when the target names them, which corner squares
are light and which are dark. Purely artistic choices the target does not mention
(materials, lighting, camera angle, exact hues, piece styling, presence of a frame)
are NOT errors.

If the target states square colours, check them deliberately: name the shade you
actually see on each named corner square before deciding. An inverted checkerboard
is a real error and an easy one to skim past, because the board still looks
perfectly plausible.

Reply with a single JSON object in a \`\`\`json fenced block, and nothing else:

{
  "grid_seen": "<dimensions you actually counted, e.g. 8x8>",
  "grid_ok": <true|false>,
  "corner_squares": "<the shade you see on each corner square the target names, e.g. 'a1 light, h1 dark'; \\"not specified\\" if the target says nothing>",
  "square_colors_ok": <true|false — true if the target says nothing about square colours>,
  "pieces_seen": "<brief square-by-square summary of what you read>",
  "errors": ["<one concrete discrepancy per entry, e.g. 'd1 shows a king but target says queen'>"],
  "extra_or_missing": ["<pieces present that should not be, or absent that should be>"],
  "accurate": <true only if grid_ok and square_colors_ok are true and errors and extra_or_missing are both empty>
}`;

/** Extract the first JSON object from a model reply, tolerating stray prose. */
export function parseVerdict(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  try {
    const v = JSON.parse(candidate);
    const errors = [...(v.errors || []), ...(v.extra_or_missing || [])].filter(
      (e) => e && !/^\s*(none|n\/?a|no errors)\s*\.?$/i.test(String(e)),
    );
    // A structured false flag has to become a visible error, or the run reports a
    // clean verdict with a hidden defect behind it.
    if (v.square_colors_ok === false) {
      errors.push(`square colours are wrong (checker saw: ${v.corner_squares ?? "unspecified"})`);
    }
    if (v.grid_ok === false) errors.push(`grid is wrong (checker counted ${v.grid_seen ?? "?"})`);
    return {
      accurate: Boolean(v.accurate) && errors.length === 0,
      gridSeen: v.grid_seen ?? null,
      gridOk: v.grid_ok !== false,
      cornerSquares: v.corner_squares ?? null,
      piecesSeen: v.pieces_seen ?? null,
      errors,
      raw: text,
    };
  } catch {
    // A malformed verdict must not read as success, so fail closed.
    return {
      accurate: false,
      gridSeen: null,
      gridOk: false,
      cornerSquares: null,
      piecesSeen: null,
      errors: ["Checker did not return parseable JSON; treating as not verified."],
      raw: text,
    };
  }
}

/**
 * @param {{imageBytes: Buffer, description: string, model?: string}} args
 * @returns {Promise<{accurate: boolean, errors: string[], gridSeen: string|null, piecesSeen: string|null, raw: string}>}
 */
export async function verifyImage({ imageBytes, description, model }) {
  const prompt = `${INSTRUCTIONS}\n\nTARGET DESCRIPTION:\n${description}`;
  const reply = await askVision({ imageBytes, prompt, ...(model ? { model } : {}) });
  return parseVerdict(reply);
}

/** Compact one-line summary for logs. */
export function summarize(verdict) {
  if (verdict.accurate) return "ACCURATE";
  const n = verdict.errors.length;
  return `${n} issue${n === 1 ? "" : "s"}: ${verdict.errors.slice(0, 4).join(" | ")}${n > 4 ? " | ..." : ""}`;
}
