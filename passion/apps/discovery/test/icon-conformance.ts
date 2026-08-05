import { readdirSync } from "node:fs";
import { join } from "node:path";
import { ALLOWED_FILLS, STROKE, STROKE_WIDTH } from "../app/palette.generated";

export function listIconSvgs(dir: string): string[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".svg"))
    .sort()
    .map((f) => join(dir, f));
}

export function parseColors(svg: string): {
  fills: string[];
  strokes: string[];
  strokeWidths: number[];
} {
  const grab = (re: RegExp) => [...svg.matchAll(re)].map((m) => m[1] ?? "");
  const fills = grab(/fill="([^"]+)"/g).map((c) => c.toLowerCase());
  const strokes = grab(/stroke="([^"]+)"/g).map((c) => c.toLowerCase());
  const strokeWidths = grab(/stroke-width="([^"]+)"/g).map(Number);
  return { fills, strokes, strokeWidths };
}

// Colors that are never a "loudness" confound.
const NEUTRAL = new Set(["none", "transparent", STROKE.toLowerCase()]);

export function assertConformant(svgText: string): string[] {
  const problems: string[] = [];
  if (/<image\b/i.test(svgText)) problems.push("embeds a raster <image>");
  if (/(linear|radial)Gradient|filter=|url\(#/i.test(svgText))
    problems.push("uses a gradient or filter");
  if (/<text\b/i.test(svgText)) problems.push("contains <text>");
  if (!/viewBox="0 0 240 240"/.test(svgText)) problems.push("viewBox is not 0 0 240 240");

  const { fills, strokes, strokeWidths } = parseColors(svgText);
  for (const f of fills)
    if (!ALLOWED_FILLS.has(f) && !NEUTRAL.has(f)) problems.push(`fill ${f} not in palette`);
  for (const s of strokes)
    if (!NEUTRAL.has(s) && s !== STROKE.toLowerCase())
      problems.push(`stroke ${s} is not the locked navy`);
  for (const w of strokeWidths)
    if (w !== STROKE_WIDTH) problems.push(`stroke-width ${w} is not ${STROKE_WIDTH}`);
  return problems;
}
