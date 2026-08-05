import sharp from "sharp";
import { ALLOWED_FILLS, STROKE, STROKE_WIDTH } from "../app/palette.generated";

export function parseColors(svg: string): {
  fills: string[];
  strokes: string[];
  strokeWidths: number[];
} {
  // Match single- OR double-quoted values: `fill='#abc'` must not slip past the palette lock.
  const grab = (re: RegExp) => [...svg.matchAll(re)].map((m) => m[1] ?? "");
  const fills = grab(/fill=["']([^"']+)["']/g).map((c) => c.toLowerCase());
  const strokes = grab(/stroke=["']([^"']+)["']/g).map((c) => c.toLowerCase());
  const strokeWidths = grab(/stroke-width=["']([^"']+)["']/g).map(Number);
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
  if (/<style\b/i.test(svgText)) problems.push("contains a <style> block");
  for (const m of svgText.matchAll(/style=["']([^"']*)["']/gi))
    if (/fill|stroke/i.test(m[1] ?? ""))
      problems.push(`style attribute "${m[1]}" sets fill/stroke outside the palette lock`);

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

export async function energyOf(svgPath: string): Promise<number> {
  const { data, info } = await sharp(svgPath, { density: 144 })
    .resize(240, 240, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });
  const px = info.width * info.height;
  let covered = 0;
  let satSum = 0;
  for (let i = 0; i < px; i++) {
    const r = data[i * 4] ?? 0;
    const g = data[i * 4 + 1] ?? 0;
    const b = data[i * 4 + 2] ?? 0;
    const a = data[i * 4 + 3] ?? 0;
    if (a < 32) continue; // transparent: not part of the subject
    covered++;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    satSum += max === 0 ? 0 : (max - min) / max; // sRGB saturation, 0..1
  }
  if (covered === 0) return 0;
  return (satSum / covered) * (covered / px); // mean saturation × coverage
}
