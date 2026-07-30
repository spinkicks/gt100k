#!/usr/bin/env node
// One-shot: adds the `pursuits` field to every entry in `seed-library.ts`.
//
// Kept in the tree rather than run and deleted, because the assignment below IS the crosswalk
// between the taxonomy and the browse wall, and it is the kind of judgement that gets questioned
// later. Reading 157 diff hunks tells you nothing about why the Getty's Royal Game of Ur ended up
// on Backgammon; this table does.
//
// It is not idempotent and is not meant to run twice — after it has run, edit the library directly.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const LIB = resolve(dirname(fileURLToPath(import.meta.url)), "..", "src", "seed-library.ts");

/**
 * Resource id (minus the `res-` prefix) → the tiles it stocks.
 *
 * An empty array is a real answer and appears about twenty times. It means the entry stocks a
 * taxonomy cell that the wall does not currently name — the perception and illusions material, the
 * general maths foundations, the statistics set. Those are gaps in the CATALOGUE, not in the
 * library, and inventing a tile-shaped home for them here would hide that.
 */
const PURSUITS = {
  // --- art-motion ---
  "art-motion-3d-modeling-blender-5-2-lts-manual": ["3d-animation"],
  "art-motion-3d-modeling-blender-youtube": ["3d-animation"],
  // CAD rather than character work, so it serves the tile about designing a thing for someone too.
  "art-motion-3d-modeling-freecad-your-own-3d-parametric-modeler": [
    "3d-animation",
    "assistive-design",
  ],
  "art-motion-3d-modeling-training-blender-studio": ["3d-animation"],
  "art-motion-3d-modeling-tutorials-blender": ["3d-animation"],
  "art-motion-3d-modeling-sculptgl-a-webgl-sculpting-app": ["3d-animation"],
  "art-motion-3d-modeling-looking-to-use-blockscad-in-the-classroom-bl": [
    "3d-animation",
    "assistive-design",
  ],

  "art-motion-animation-acmi-school-programs-and-resources": ["stop-motion", "filmmaking"],
  "art-motion-animation-animation-nfb": ["stop-motion", "3d-animation"],
  "art-motion-animation-nfb-education-national-film-board-of-canada": ["stop-motion", "filmmaking"],
  "art-motion-animation-opentoonz": ["stop-motion"],
  "art-motion-animation-the-wick-editor": ["stop-motion"],
  "art-motion-animation-how-can-we-make-digital-pictures-move-bbc-bi": ["stop-motion"],
  "art-motion-animation-easy-stop-motion-animation-for-beginners-par": ["stop-motion"],
  "art-motion-animation-how-do-we-make-digital-animations-bbc-bitesi": [
    "stop-motion",
    "3d-animation",
  ],
  "art-motion-animation-abcya-animate-abcya": ["stop-motion"],

  "art-motion-video-editing-filmmaking-into-film": ["filmmaking"],
  "art-motion-video-editing-kdenlive-26-04-manual": ["filmmaking"],
  "art-motion-video-editing-shotcut-tutorial-videos": ["filmmaking"],
  "art-motion-video-editing-what-are-digital-photos-and-videos-bbc-bites": [
    "filmmaking",
    "photography",
  ],
  "art-motion-video-editing-how-are-digital-photos-and-videos-made-bbc-b": [
    "filmmaking",
    "photography",
  ],
  "art-motion-video-editing-how-to-help-your-child-make-a-film-at-home-p": ["filmmaking"],

  "art-motion-visual-kids-and-families-education-at-the-getty": ["drawing"],
  "art-motion-visual-krita-digital-painting-creative-freedom": ["drawing", "comics"],
  "art-motion-visual-street-art-google-arts-culture": ["drawing"],
  "art-motion-visual-tate-kids-youtube": ["drawing"],

  // --- code-computers ---
  "code-computers-agentic-engineering-code-org-ai-curriculum": ["programming"],
  "code-computers-agentic-engineering-day-of-ai-mit-raise": ["programming"],
  "code-computers-agentic-engineering-machine-learning-for-kids": ["programming"],
  "code-computers-agentic-engineering-teachable-machine": ["programming"],
  "code-computers-agentic-engineering-code-org": ["programming"],
  "code-computers-agentic-engineering-quick-draw": ["programming"],

  "code-computers-game-dev-code-org-game-lab": ["game-jam", "programming"],
  "code-computers-game-dev-godot-docs-step-by-step": ["game-jam"],
  "code-computers-game-dev-invent-your-own-computer-games-with-python": ["game-jam", "programming"],
  "code-computers-game-dev-microsoft-makecode-arcade": ["game-jam"],
  "code-computers-game-dev-scratch-imagine-program-share": ["game-jam", "programming"],

  "code-computers-hardware-arduino-documentation": ["robotics"],
  "code-computers-hardware-cs-unplugged": ["programming"],
  "code-computers-hardware-make-it-code-it-micro-bit-foundation": ["programming", "robotics"],
  "code-computers-hardware-nand-to-tetris": ["programming"],

  "code-computers-python-computer-science-circles-university-of-water": ["programming"],
  "code-computers-python-futurecoder": ["programming"],
  "code-computers-python-raspberry-pi-foundation-projects": ["programming"],
  "code-computers-python-the-python-tutorial-python-org": ["programming"],
  "code-computers-python-welcome-to-pygame-zero": ["programming", "game-jam"],
  "code-computers-python-edublocks": ["programming"],

  // --- games-strategy ---
  "games-strategy-board-games-american-go-association": ["go"],
  "games-strategy-board-games-learn-to-play-go-online-go-server": ["go"],
  // The two NRICH entries are Nim variants: perfect-information games about reading ahead, which is
  // what the Go tile is for. Filed there rather than nowhere because they are the only material in
  // this cabin a six-year-old can use unaided, and Go's floor is six.
  "games-strategy-board-games-nim-7-nrich": ["go"],
  "games-strategy-board-games-solving-together-got-it-nrich": ["go"],
  // Ur is a dice race game and the direct ancestor of backgammon, so this is the tile, not a stretch.
  "games-strategy-board-games-royal-game-of-ur-information-and-rules-the-g": ["backgammon"],

  "games-strategy-chess-chess-basics-practice-lichess": ["chess"],
  "games-strategy-chess-how-to-play-chess-7-rules-to-get-you-started": ["chess"],
  "games-strategy-chess-learn-chess-by-playing-lichess": ["chess"],
  "games-strategy-chess-saint-louis-chess-club-youtube-channel": ["chess"],

  "games-strategy-odds-and-chance-odds-and-evens-nrich-university-of-cambridge": [
    "backgammon",
    "bridge",
  ],
  "games-strategy-odds-and-chance-poker-theory-and-analytics-mit-opencoursewar": [
    "bridge",
    "backgammon",
  ],
  "games-strategy-odds-and-chance-pig-challenging-math-game-for-ages-5-ba-play": ["backgammon"],
  "games-strategy-odds-and-chance-pick-your-pony-challenging-math-game-for-age": ["backgammon"],
  "games-strategy-odds-and-chance-incey-wincey-spider-nrich": ["backgammon"],

  // --- influence-media ---
  // Media literacy is a reporting skill — working out what is true — so it stocks Reporting rather
  // than Debating. The one exception is the BBC's page on persuasive technique, which is both.
  "influence-media-marketing-admongo-lesson-plans-ftc": ["journalism"],
  "influence-media-marketing-co-co-s-adversmarts": ["journalism"],
  "influence-media-marketing-persuasion-in-the-media-bbc-bitesize": ["debate", "journalism"],
  "influence-media-marketing-spotting-media-influence-grade-5-lesson": ["journalism"],
  "influence-media-marketing-understanding-ads-grade-1-lesson": ["journalism"],

  // The whole psychology cell is orphaned, and deliberately. Illusions, perception and how brains
  // work are excellent and there is no tile for them: the catalogue's forty-four are things a child
  // DOES, and "find out how seeing works" is not one of them yet. Left visible as a candidate tile
  // rather than forced onto Reporting, which is not what any of this is about.
  "influence-media-psychology-156-optical-illusions-visual-phenomena": [],
  "influence-media-psychology-best-illusion-of-the-year-contest": [],
  "influence-media-psychology-neuroscience-and-psychology-frontiers-for-yo": [],
  "influence-media-psychology-neuroscience-for-kids": [],
  "influence-media-psychology-science-snacks-perception-exploratorium": [],
  "influence-media-psychology-thinking-sensing-behaving-brainfacts-org": [],
  "influence-media-psychology-science-snacks-optical-illusions-exploratori": [],

  "influence-media-publishing-bbc-young-reporter": ["journalism"],
  "influence-media-publishing-kid-reporters-notebook-scholastic": ["journalism"],
  "influence-media-publishing-read-gov-kids-library-of-congress": ["writing"],
  "influence-media-publishing-stone-soup": ["writing"],

  "influence-media-storytelling-1001-stories-the-story-museum": ["writing"],
  "influence-media-storytelling-creative-writing-ks2-english-bbc-bitesize": ["writing"],
  "influence-media-storytelling-how-to-plan-your-story-bbc-bitesize": ["writing"],
  "influence-media-storytelling-pixar-in-a-box-the-art-of-storytelling": ["writing", "filmmaking"],
  "influence-media-storytelling-storyline-online": ["writing"],

  // --- making-engineering ---
  "making-engineering-3d-printing-3d-resources-nasa-science": ["assistive-design", "rocketry"],
  "making-engineering-3d-printing-nih-3d": ["assistive-design"],
  "making-engineering-3d-printing-prusa-academy": ["assistive-design"],
  "making-engineering-3d-printing-prusa-knowledge-base": ["assistive-design"],
  "making-engineering-3d-printing-tinkercad-learn-designs": ["assistive-design"],
  "making-engineering-3d-printing-how-3d-printers-work-how-things-work-with-ka": [
    "assistive-design",
  ],
  "making-engineering-3d-printing-collections-3d-digitization": ["assistive-design"],

  "making-engineering-electronics-adafruit-learning-system": ["robotics", "speaker-design"],
  "making-engineering-electronics-arduino-education": ["robotics"],
  "making-engineering-electronics-sparkfun-learn-tutorials": ["robotics", "amateur-radio"],
  "making-engineering-electronics-tinkercad-learn-circuits": ["robotics"],
  "making-engineering-electronics-circuit-construction-kit-dc-ohm-s-law-kircho": [
    "robotics",
    "speaker-design",
  ],
  "making-engineering-electronics-ks2-science-how-do-electrical-circuits-work-": ["robotics"],
  // Static electricity is physics, not building anything. Robotics already has three entries a
  // young child can use, so this would be padding a stocked shelf with something off-topic.
  "making-engineering-electronics-balloons-and-static-electricity-static-elect": [],

  "making-engineering-robotics-first-lego-league": ["robotics"],
  "making-engineering-robotics-microsoft-makecode-for-micro-bit": ["robotics"],
  "making-engineering-robotics-raspberry-pi-foundation-projects": ["robotics"],
  "making-engineering-robotics-explore-mars-a-mars-rover-game-nasa-space-pl": ["robotics"],
  "making-engineering-robotics-how-do-you-program-a-robot-bbc-bitesize": ["robotics"],
  "making-engineering-robotics-ks1-ks2-computing-programming-a-robotic-toy-": ["robotics"],

  // --- math-puzzles ---
  "math-puzzles-competition-math-alcumus-art-of-problem-solving": ["competition-maths"],
  "math-puzzles-competition-math-mathcounts-trainer-aops": ["competition-maths"],
  "math-puzzles-competition-math-past-amc-8-10-12-aime-problems-and-solutions": [
    "competition-maths",
  ],
  "math-puzzles-competition-math-problem-of-the-week-archive-mathcounts": ["competition-maths"],
  "math-puzzles-competition-math-math-kangaroo-practice-materials-grades-1-2-": [
    "competition-maths",
  ],
  "math-puzzles-competition-math-free-sample-questions-practice-math-kangaroo": [
    "competition-maths",
  ],
  "math-puzzles-competition-math-playground-free-challenging-math-game-for-al": [
    "competition-maths",
  ],
  "math-puzzles-competition-math-early-years-foundation-stage-activities-nric": [
    "competition-maths",
  ],

  // Foundations is general school maths. The nearest tile is Competition Maths, and it is not near:
  // that tile is "hard problems with elegant answers, against the clock", which a fractions
  // simulation is not. It already has four entries a young child can use, so this stays orphaned.
  "math-puzzles-foundations-phet-fractions-intro": [],
  "math-puzzles-foundations-phet-balancing-act": [],
  "math-puzzles-foundations-phet-proportion-playground": [],
  "math-puzzles-foundations-bbc-bitesize-fractions-ks1": [],
  "math-puzzles-foundations-illuminations-pan-balance": [],
  "math-puzzles-foundations-math-is-fun-what-is-a-function": [],

  "math-puzzles-logic-puzzles-cs-unplugged": ["sudoku", "ciphers"],
  "math-puzzles-logic-puzzles-maths-puzzles-transum": ["sudoku"],
  "math-puzzles-logic-puzzles-national-cipher-challenge-university-of-sout": ["ciphers"],
  "math-puzzles-logic-puzzles-nrich-university-of-cambridge": ["sudoku", "competition-maths"],
  "math-puzzles-logic-puzzles-puzzle-calendars-mathigon": ["sudoku"],

  // No tile names working with data. Another catalogue gap rather than a library one.
  "math-puzzles-statistics-censusatschool-new-zealand": [],
  "math-puzzles-statistics-data-nuggets": [],
  "math-puzzles-statistics-dollar-street-gapminder": [],
  "math-puzzles-statistics-seeing-theory-brown-university": [],
  "math-puzzles-statistics-statistics-in-schools-u-s-census-bureau": [],

  // --- music-sound ---
  "music-sound-audio-systems-chapter-17-sound-waves-the-physics-classroom": ["speaker-design"],
  "music-sound-audio-systems-music-acoustics-unsw-school-of-physics": ["speaker-design"],
  "music-sound-audio-systems-physclips-waves-and-sound-unsw": ["speaker-design"],
  "music-sound-audio-systems-sound-ks2-science-bbc-bitesize": ["speaker-design"],

  // These four are why the re-tag was needed: as one cell they were the entire shelf for all eight
  // music tiles. They are orchestral overviews, so they go to the orchestral instruments and stop.
  "music-sound-instruments-classics-for-kids-90-9-wguc": ["piano", "violin", "drums", "guitar"],
  "music-sound-instruments-dso-kids-dallas-symphony-orchestra": ["piano", "violin", "drums"],
  "music-sound-instruments-instruments-philharmonia-orchestra": ["piano", "violin", "drums"],
  "music-sound-instruments-sfs-kids-san-francisco-symphony": ["piano", "violin", "drums"],
  // Ableton's synth tutorial is production, not an instrument a child picks up.
  "music-sound-instruments-learning-synths-ableton": ["making-tracks"],

  "music-sound-music-theory-learning-resources-new-york-philharmonic": ["songwriting"],
  "music-sound-music-theory-musictheory-net-lessons": ["songwriting", "piano"],
  "music-sound-music-theory-open-music-theory-version-2": ["songwriting"],
  "music-sound-music-theory-teoria-music-theory-web": ["songwriting", "singing"],

  "music-sound-production-audacity-manual": ["making-tracks", "podcasting"],
  "music-sound-production-beepbox": ["making-tracks", "songwriting"],
  "music-sound-production-chrome-music-lab": ["making-tracks", "songwriting"],
  "music-sound-production-learning-music-ableton": ["making-tracks", "songwriting"],

  // --- science-nature ---
  "science-nature-astronomy-astronomy-picture-of-the-day": ["asteroid-hunting", "variable-stars"],
  "science-nature-astronomy-esa-space-for-kids": ["asteroid-hunting"],
  "science-nature-astronomy-eyes-on-the-solar-system-nasa-jpl": ["asteroid-hunting"],
  "science-nature-astronomy-stellarium-web-online-star-map": ["asteroid-hunting", "variable-stars"],
  "science-nature-astronomy-the-schools-observatory": ["asteroid-hunting", "variable-stars"],

  "science-nature-botany-activities-kidsgardening": ["growing-plants"],
  "science-nature-botany-learn-discover-missouri-botanical-garden": [
    "growing-plants",
    "wildlife-id",
  ],
  "science-nature-botany-outdoor-learning-resources-for-schools-woodl": [
    "growing-plants",
    "wildlife-id",
  ],
  "science-nature-botany-plants-ks1-science-bbc-bitesize": ["growing-plants"],
  "science-nature-botany-school-gardening-rhs": ["growing-plants"],

  // Rockets are forces and motion, so the PhET sim is genuinely the tile's material.
  "science-nature-physics-forces-and-motion-basics-phet-interactive-si": ["rocketry"],
  "science-nature-physics-fermilab-education-and-public-engagement": [],
  "science-nature-physics-ks3-science-bbc-bitesize": [],
  "science-nature-physics-scishow-kids-youtube": [],
};

const src = readFileSync(LIB, "utf8");
const seen = new Set();

const out = src.replace(
  /( {4}id: "res-([a-z0-9-]+)",\n(?:.*\n)*? {4})(domainPath: .*,\n)/g,
  (whole, head, id, domainLine) => {
    const tiles = PURSUITS[id];
    if (tiles === undefined) {
      console.error(`no pursuit assignment for: ${id}`);
      process.exitCode = 1;
      return whole;
    }
    seen.add(id);
    const rendered = tiles.length === 0 ? "[]" : `[${tiles.map((t) => `"${t}"`).join(", ")}]`;
    return `${head}${domainLine}    pursuits: ${rendered},\n`;
  },
);

const unused = Object.keys(PURSUITS).filter((k) => !seen.has(k));
if (unused.length > 0) {
  console.error(`assignment for an id not in the library: ${unused.join(", ")}`);
  process.exitCode = 1;
}

if (process.exitCode !== 1) {
  writeFileSync(LIB, out);
  console.log(`tagged ${seen.size} resources`);
}
