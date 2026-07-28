#!/usr/bin/env node
/**
 * gen-art.mjs — generate the game's art (world map + cabin backgrounds) via
 * the TrueFoundry image gateway.
 *
 * NOTE: the cabin BACKDROPS used by the backdrop renderer
 * (`public/art/cabin-backdrop-*.png`) are NOT produced here — they are built by
 * scripts/gen-cabins.mjs, which edits approved concept stills in place rather
 * than generating a room, so that the composition cannot drift. The
 * `cabin-math` / `cabin-logic-games` targets below produce the older
 * whole-room images still loaded by src/cabin/CabinStatic.tsx. Running them
 * will not touch the backdrops.
 *
 * Usage:
 *   node scripts/gen-art.mjs [target...] [--model <gpt-image-1|gpt-image-1.5|gemini-3-pro-image-preview>]
 *
 * With no target, generates every target in TARGETS. Writes PNG/JPEG bytes
 * straight to public/art/<target>.<ext>.
 *
 * Auth: reads the gateway key out of process.env.ANTHROPIC_CUSTOM_HEADERS,
 * which holds a string like "x-tfy-api-key: tfy_...". The key is extracted,
 * trimmed, and sent as both the x-tfy-api-key header and an Authorization:
 * Bearer header. The key is never logged, printed, or written to a file.
 */

import { writeFileSync } from "node:fs";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ART_DIR = join(__dirname, "..", "public", "art");

const GATEWAY_URL = "https://tfy.promptlens.trilogy.com/api/llm/images/generations";
const DEFAULT_MODEL = "gpt-image-1.5";
const VALID_MODELS = new Set(["gpt-image-1", "gpt-image-1.5", "gemini-3-pro-image-preview"]);

/**
 * Shared negative-constraint tail. Image models bake lettering into signage,
 * clock dials and framed art unless told repeatedly not to, so every prompt
 * ends with this.
 */
const NO_TEXT =
  "Absolutely no text, no letters, no words, no writing, no numbers, no " +
  "numerals, no digits, no labels, no captions, no signs, no signposts, no " +
  "banners, no scrolls, no map legend, no compass rose, no watermark and no " +
  "UI elements of any kind anywhere in the image. Every surface, frame, dial " +
  "and board is blank of writing.";

/** Named art targets: prompt + output filename. */
const TARGETS = {
  map: {
    file: "map.png",
    prompt: `A warm, painterly parchment-style fantasy world map, like an illustrated overworld from a cozy storybook game. Flat hand-painted 2D illustration on aged parchment texture with soft muted colors — an illustrated map, not a 3D render, not a photograph. Five small wooden cabins sit in the landscape, and the composition is deliberately split into a bright near half and a hazy far half. NEAR, large and prominent in the foreground and midground, two cozy cabins glow with warm inviting light, sharply painted and richly coloured, each on its own green hillock, joined to the bottom edge of the map by a wide sunlit winding path: on the left a puzzle den with a lantern on its porch, a chequered board, scattered coloured wooden pegs and interlocking block shapes on the grass outside; on the right a clockmaker's workshop with brass cogs and gears leaning against its wall, a swinging pendulum under the eaves and a big plain round dial with two simple hands and a completely blank empty face on its gable. FAR AWAY near the horizon, three much smaller cabins are faint, pale, dim and half-swallowed by cool blue mist and rolling hills — clearly visible but distant, shuttered and unlit with dark empty windows, washed-out and desaturated, with no paths leading to them: one tucked among trees with faint ghostly silhouettes of a harp and a horn beside it, one with a faint web of thin branching glowing threads and tiny firefly-like dots of light creeping over the ground around it like a circuit, and one with a small easel, a palette and pale watery paint splashes on the grass beside it. Gentle rolling hills, soft clouds, hand-drawn storybook illustration style, strong depth: crisp golden light and saturated colour on the two near cabins, soft grey-blue atmospheric haze on the three distant ones. ${NO_TEXT}`,
  },
  "cabin-math": {
    file: "cabin-math.png",
    prompt: `The inside of a clockmaker's workshop in a cozy wooden cabin, viewed from a fixed first-person perspective looking straight at the far wall. A long dark-wood workbench strewn with brass gears, cogs, springs, coiled mainsprings, tiny screwdrivers, tweezers and half-assembled clock movements. Behind it the wood-plank wall is hung with pendulum clocks whose faces have been removed to show their exposed brass clockwork, plus a few completely blank plain round dials with simple hands and no markings at all, swinging brass pendulums, and weights on chains. A wall of small parts drawers, a pair of brass balance scales, brass calipers and a set square. Warm lantern and candle light, dust motes drifting in a shaft of afternoon sun through a small window, exposed beams overhead, worn wooden floorboards and a small rug. Painterly storybook illustration style, rich warm brass-and-amber palette, snug and inviting. No people, no characters. ${NO_TEXT}`,
  },
  /**
   * The music room's shipping plate, 1536x1024 to match the other two backdrops.
   *
   * The ONLY backdrop this file produces, and the reason it can: the other two rooms are a concept
   * still plus `gen-cabins.mjs` prop surgery, because their props are combinatorial boards a
   * diffusion model gets wrong. Nothing in the music room is a board — a lute, an organ, a drum and a
   * bookcase are just objects — so one text-to-image pass is the whole pipeline here. Hence the
   * `cabin-backdrop-` name: this writes the file the room actually loads, not a reference for a later
   * stage. (It wrote `cabin-music.png`, the legacy `CabinStatic` name, while there was no room.)
   *
   * FOUR SURFACES: three props and a shelf. `quads.data.test.ts` matches prop polygons to registered
   * gadgets exactly in both directions, so the painting has to contain exactly one clearly-bounded,
   * traceable surface for each of tune-repair, chord-fit and downbeat — and no fourth *prop*, because
   * `echo` is not built and a surface with no gadget breaks the build. The bookcase is the fourth
   * object but not a fourth prop: a `ShelfProp` is a separate field and is not gadget-backed. Adding
   * echo later means a repaint; that is the trade the roster note in PROJECT.md records.
   *
   * Equal polish with the other two rooms is a MEASUREMENT requirement, not a finish nicety (PRD §5.3):
   * uneven art makes the topic ranking inherit the production schedule. Hence the same framing, the same
   * fixed first-person view of the far wall, the same lantern-lit palette and the same painterly
   * storybook language as cabin-logic-games and cabin-math above.
   */
  "cabin-backdrop-music": {
    file: "cabin-backdrop-music.png",
    size: "1536x1024",
    prompt: `The inside of a musician's workshop in a cozy wooden cabin, viewed from a fixed first-person perspective looking straight at the far wall, wide landscape composition. FOUR clearly separated objects, each isolated with empty wall or floor around it so none overlaps another, spread evenly across the width of the room. On the far LEFT, hanging flat against the wood-plank wall, a warm honey-coloured lute with a rounded body and a long straight neck, seen face-on and complete. In the CENTRE, standing against the back wall, a small upright wooden pump organ with a plain keyboard of pale and dark keys and a simple carved music desk above it, seen straight on. To the RIGHT of the organ, resting on the floorboards, a single round hand drum on a low wooden stand with a taut pale skin head facing the viewer. On the far RIGHT against the right-hand wall, a short open wooden bookcase of two or three shelves, packed with worn leather-bound books and a few rolled papers standing upright, seen straight on with its whole front visible and unobstructed. Between them the room is quiet and uncluttered: a lantern casting warm light, a plain wooden stool, a rolled rug, exposed beams overhead, worn floorboards, and a small window on the left letting in a soft shaft of afternoon light with dust motes. Painterly storybook illustration style, rich warm amber-and-honey palette, snug and inviting, the same cozy hand-painted look as a clockmaker's workshop or a puzzle den. No people, no characters, no sheet music, no notation, no staves. ${NO_TEXT}`,
  },
  /**
   * Candidate replacement map with THREE near cabins instead of two.
   *
   * Written to its own file rather than over `map.png` on purpose. Generated art can come back worse
   * than the composition it replaces, and the current map was built deliberately for the two-playable
   * split — so the old one stays until a human approves this.
   *
   * Why regenerate at all: `cabins.data.ts` documents that the map paints the playable cabins large and
   * warm in the foreground and the coming-soon ones small and mist-washed on the horizon. Promoting
   * `music` while leaving it on a distant misty cabin would ship a topic whose choice affordance is
   * visibly worse than its competitors', which is the Javora confound the surface-owner ruling names as
   * one of two rules the game does not satisfy. Topic choice is the primary signal, so it must not be
   * biased by paint.
   */
  "map-v2": {
    file: "map-v2.png",
    prompt: `A warm, painterly parchment-style fantasy world map, like an illustrated overworld from a cozy storybook game. Flat hand-painted 2D illustration on aged parchment texture with soft muted colors — an illustrated map, not a 3D render, not a photograph. Five small wooden cabins sit in the landscape, and the composition is deliberately split into a bright near half and a hazy far half. NEAR, large and prominent across the foreground and midground, THREE cozy cabins glow with warm inviting light, sharply painted and richly coloured, each on its own green hillock, each joined to the bottom edge of the map by a wide sunlit winding path, and each given equal size, equal prominence and equally golden light: on the left a puzzle den with a lantern on its porch, a chequered board, scattered coloured wooden pegs and interlocking block shapes on the grass outside; in the centre a musician's cabin with a honey-coloured lute leaning by its door, a small round hand drum on the grass and a lantern glowing on its porch; on the right a clockmaker's workshop with brass cogs and gears leaning against its wall, a swinging pendulum under the eaves and a big plain round dial with two simple hands and a completely blank empty face on its gable. FAR AWAY near the horizon, only TWO much smaller cabins are faint, pale, dim and half-swallowed by cool blue mist and rolling hills — clearly visible but distant, shuttered and unlit with dark empty windows, washed-out and desaturated, with no paths leading to them: one with a faint web of thin branching glowing threads and tiny firefly-like dots of light creeping over the ground around it like a circuit, and one with a small easel, a palette and pale watery paint splashes on the grass beside it. Gentle rolling hills, soft clouds, hand-drawn storybook illustration style, strong depth: crisp golden light and saturated colour on the three near cabins, soft grey-blue atmospheric haze on the two distant ones. ${NO_TEXT}`,
  },
  "cabin-logic-games": {
    file: "cabin-logic-games.png",
    prompt: `The inside of a puzzle den in a cozy wooden cabin, viewed from a fixed first-person perspective looking straight at the far wall. Large framed grid puzzles hang on the wood-plank wall — big empty chequered lattices and blank grids of plain squares studded with coloured wooden pegs, no writing on them. To one side a tall wooden pegboard is threaded with looping bright coloured pipes and rubber tubes running between its holes. In the middle of the room a small round table holds a carved wooden chess set mid-game. On the other side stands a narrow mirror maze of tall angled mirrors reflecting warm lamplight into infinity. A shelf of interlocking wooden block puzzles and flat tangram shapes, a lantern casting warm light, exposed beams overhead, worn floorboards and a patterned rug. Painterly storybook illustration style, warm inviting palette with bright pops of puzzle-piece colour. No people, no characters. ${NO_TEXT}`,
  },
};

function parseArgs(argv) {
  const targets = [];
  let model = DEFAULT_MODEL;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--model") {
      model = argv[++i];
    } else if (arg.startsWith("--model=")) {
      model = arg.slice("--model=".length);
    } else if (!arg.startsWith("--")) {
      targets.push(arg);
    }
  }
  if (!VALID_MODELS.has(model)) {
    console.error(`Unknown --model "${model}". Valid models: ${[...VALID_MODELS].join(", ")}`);
    process.exit(1);
  }
  return { targets: targets.length > 0 ? targets : Object.keys(TARGETS), model };
}

function extractApiKey() {
  const raw = process.env.ANTHROPIC_CUSTOM_HEADERS;
  if (!raw) {
    throw new Error(
      'ANTHROPIC_CUSTOM_HEADERS is not set. Expected something like "x-tfy-api-key: tfy_...".',
    );
  }
  const match = raw.match(/x-tfy-api-key:\s*(.+)/i);
  if (!match) {
    throw new Error("ANTHROPIC_CUSTOM_HEADERS is set but does not contain an x-tfy-api-key entry.");
  }
  const key = match[1].trim();
  if (!key) {
    throw new Error("Extracted x-tfy-api-key value is empty.");
  }
  return key;
}

async function generateImage({ model, prompt, apiKey, size = "1024x1024" }) {
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tfy-api-key": apiKey,
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, prompt, n: 1, size }),
  });

  if (!res.ok) {
    const bodyText = await res.text().catch(() => "<no body>");
    const snippet = bodyText.slice(0, 500);
    throw new Error(`Gateway request failed: HTTP ${res.status} ${res.statusText}\n${snippet}`);
  }

  const json = await res.json();
  const item = json?.data?.[0];
  if (!item) {
    throw new Error(`Unexpected gateway response shape: ${JSON.stringify(json).slice(0, 500)}`);
  }

  if (item.b64_json) {
    return Buffer.from(item.b64_json, "base64");
  }

  if (item.url) {
    const imgRes = await fetch(item.url);
    if (!imgRes.ok) {
      throw new Error(`Failed to fetch generated image URL: HTTP ${imgRes.status}`);
    }
    return Buffer.from(await imgRes.arrayBuffer());
  }

  throw new Error("Gateway response contained neither b64_json nor url.");
}

/**
 * Re-encode a PNG losslessly at max compression. The gateway's PNGs are
 * under-compressed (~2.4 MB for 1024x1024); this shaves ~13% off with
 * pixel-identical output, which matters because public/art/ is committed.
 * Returns the original bytes if sharp is unavailable or does not help.
 */
async function shrinkPng(bytes) {
  try {
    const { default: sharp } = await import("sharp");
    const out = await sharp(bytes)
      .png({ compressionLevel: 9, adaptiveFiltering: true, palette: false })
      .toBuffer();
    return out.length < bytes.length ? out : bytes;
  } catch {
    return bytes;
  }
}

async function main() {
  const { targets, model } = parseArgs(process.argv.slice(2));

  const unknown = targets.filter((t) => !(t in TARGETS));
  if (unknown.length > 0) {
    console.error(`Unknown target(s): ${unknown.join(", ")}`);
    console.error(`Valid targets: ${Object.keys(TARGETS).join(", ")}`);
    process.exit(1);
  }

  let apiKey;
  try {
    apiKey = extractApiKey();
  } catch (err) {
    console.error(`Auth error: ${err.message}`);
    process.exit(1);
  }

  mkdirSync(ART_DIR, { recursive: true });

  console.log(`Generating ${targets.length} art target(s) with model "${model}"...`);

  let hadError = false;
  for (const name of targets) {
    const { file, prompt, size } = TARGETS[name];
    const outPath = join(ART_DIR, file);
    try {
      console.log(`  -> ${name}: requesting...`);
      const raw = await generateImage({ model, prompt, apiKey, size });
      const bytes = await shrinkPng(raw);
      writeFileSync(outPath, bytes);
      console.log(`  -> ${name}: wrote ${outPath} (${bytes.length} bytes)`);
    } catch (err) {
      hadError = true;
      console.error(`  -> ${name}: FAILED — ${err.message}`);
    }
  }

  if (hadError) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`Unexpected error: ${err.message}`);
  process.exit(1);
});
