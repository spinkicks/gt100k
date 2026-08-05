# Discovery Wall icon authoring brief

Draw one flat-SVG icon per pursuit, "Bold Sticker" style. Read this in full.

- Canvas: `<svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg">`. Transparent
  background (no background rect). Subject centered, filling ~80% of the canvas.
- Outline: every shape edge is stroked with the locked navy `#002a3a`, `stroke-width="9"`,
  `stroke-linecap="round"`, `stroke-linejoin="round"`. No other stroke color or width.
- Fills: flat only, and ONLY the hex values exported in `app/palette.generated.ts` (the 8 `FILLS`,
  plus `#ffffff` and the off-white `#fcf4ef` for highlights/eyes). Never invent a color.
- The navy `#002a3a` may also be used as a FILL for small solid ink marks (eyes, pupils, dots) — it
  is ink, not a palette color, and is allowed.
- Set colors with `fill=`/`stroke=` attributes, never a CSS `style=` attribute or a `<style>` block.
- Forbidden: gradients, filters, `<text>`, embedded `<image>`, drop shadows, 3D shading.
- One subject, instantly legible to a 9–12-year-old — the fixed subject is in the plan's subject map.
- Living things may carry a simple friendly eye. Keep ink weight even across the icon so it does not
  read as louder than its neighbours.
- Validate before finishing: `pnpm --filter @gt100k/discovery test -- icon-conformance` must pass.
