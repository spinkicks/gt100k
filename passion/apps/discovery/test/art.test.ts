// The wall's art has to be complete and it has to be uniform, and neither is visible from the code.
//
// A pursuit whose file is missing renders as a hole in the grid, and a pursuit whose file is
// brighter than the rest renders as the one a child clicks. Both are silent: nothing else in the
// build has an opinion about a `public/` directory. So this checks the built output rather than the
// script that built it, because what ships is the output.
import { readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { PURSUITS } from "@gt100k/pursuits";
import { describe, expect, it } from "vitest";

// Shared with `scripts/build-art.mjs`, so the test and the tool that produced the files cannot
// disagree about which binary they are talking to.
import { magick } from "../scripts/imagemagick.mjs";

const ART = resolve(dirname(fileURLToPath(import.meta.url)), "..", "public", "pursuits");

const files = readdirSync(ART);

describe("every pursuit has a tile", () => {
  it("has one webp per pursuit", () => {
    const missing = PURSUITS.filter((p) => !files.includes(`${p.id}.webp`)).map((p) => p.id);
    expect(missing).toEqual([]);
  });

  it("has no tile for a pursuit that no longer exists", () => {
    // The other direction, which matters because renaming a pursuit leaves the old file behind and
    // the wall keeps working. Nobody notices until the directory has grown a second catalogue.
    const ids = new Set(PURSUITS.map((p) => p.id));
    const orphans = files.filter((f) => !ids.has(f.replace(/\.webp$/, "")));
    expect(orphans).toEqual([]);
  });

  it("keeps every tile small enough to send thirty-seven of them at once", () => {
    // They all load on first paint, because there is no pager and lazy-loading a visible tile just
    // makes it appear late. 40KB each is the point where the set stops being a rounding error on a
    // slow connection.
    for (const p of PURSUITS) {
      expect(statSync(join(ART, `${p.id}.webp`)).size).toBeLessThan(40_000);
    }
  });
});

describe("no tile is prettier than another", () => {
  /**
   * Mean luminance of a tile, 0-1.
   *
   * Shelling out to ImageMagick rather than decoding webp in-process: it is the same tool that
   * produced the files, so a disagreement here is a real drift rather than two decoders rounding
   * differently.
   */
  function meanLuminance(id: string): number {
    return Number(
      magick([join(ART, `${id}.webp`), "-colorspace", "Gray", "-format", "%[fx:mean]", "info:"]),
    );
  }

  it("holds the brightest tile within a tenth of the dimmest", () => {
    // The confound this whole treatment exists for. Children aged 9-11 picked the prettier of two
    // versions of identical content 62% of the time (Javora et al.), so on a wall that reads a
    // click as interest, a tile that merely glows more would be recorded as a passion. The raw
    // renders spanned 3.84:1; `scripts/build-art.mjs` closes that, and this is the gate that keeps
    // a hand-dropped file from reopening it.
    const means = PURSUITS.map((p) => meanLuminance(p.id));
    expect(Math.max(...means) / Math.min(...means)).toBeLessThan(1.1);
  });
});
