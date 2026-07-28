/**
 * ===========================================================================================
 * THE SHELF CONTENT. THE ONLY FILE IN `src/shelf/` THAT CONTAINS WRITING.
 * ===========================================================================================
 *
 * Everything else in this directory — the panel, the hotspot, the diagrams — is written against
 * whatever is in here, so adding a card to a room means editing this file and nothing else.
 *
 * WHAT A CARD IS
 * One honest page: a title, two short paragraphs pitched at ages 9-12 and NOT written down to them, a
 * diagram where a diagram earns its space, and a footer naming a real source. Mostly one card per
 * activity, plus exactly one `invitation` card per room — the "here is what this whole field actually
 * is" card, which is the one doing the load-bearing work (PROJECT.md: passions are *built*, not
 * found, so the card that pushes past the puzzle toward the domain is the one that can start one).
 *
 * THE SOURCES ARE REAL AND WERE CHECKED
 * Every URL below was fetched and read while this file was written — the first two decks 2026-07-26,
 * the music deck 2026-07-27, and the music deck's four re-checked against the claims made about them
 * on 2026-07-28, which is what caught the invitation card asserting that "most adults" cannot hear
 * 16 kHz where its source says only that very low sensitivity up there is not uncommon. Sourcing a
 * card and then overstating the source is the same failure one step later. That is the standard
 * because a card citing something that does not exist is worse than a card with no link: it teaches a
 * child that citations are decoration. `ShelfSource.url` is optional for exactly this reason — a
 * source we cannot confidently link gets named and left unlinked rather than given a plausible URL.
 * The link is also never load-bearing: every card reads completely offline, and nothing here is
 * fetched at runtime.
 *
 * WHAT IS DELIBERATELY ABSENT
 * No card is locked, ordered by completion, or unlocked by solving anything (see `types.ts` for why
 * that is a measurement decision and not a kindness), and no card contains a score, a point total, a
 * streak, a star or a timer — a hard constraint from PRD §11, held by a test in `cards.data.test.ts`
 * that greps this file's own prose.
 */

import type { TopicId } from "../game/types";
import type { ShelfDeck } from "./types";

const LOGIC_GAMES_DECK: ShelfDeck = {
  topic: "logic-games",
  title: "The bookshelf",
  intro: "Five pages about what is really going on in this room. Read any of them, in any order.",
  cards: [
    {
      id: "nonogram-overlap",
      kind: "activity",
      gadgetId: "nonogram",
      title: "The picture is hiding in the numbers",
      diagram: "nonogram-overlap",
      body: [
        "A clue is a list of run lengths, in order, with at least one empty cell between runs. Take the clue 4 3 in a row of ten: 4 + 1 + 3 = 8 cells at minimum, so the run of four can only start at cell 1, 2 or 3, and the run of three at cell 6, 7 or 8. You do not know which yet — but cells 3, 4 and 8 are filled in every single one of those arrangements, so you can fill them in now and be certain.",
        "That move is the whole game: mark what is true in every possibility that is still alive. It is not guessing and then checking, it is deduction, and it is why a nonogram can be finished with a pen. Nobody has found a method that solves every nonogram quickly — deciding whether one even has a solution is what computer scientists call NP-complete — which is exactly why the hand-solving tricks are worth learning.",
      ],
      source: {
        label: "Wikipedia, “Nonogram” — invented 1987 by Non Ishida; solvability is NP-complete",
        url: "https://en.wikipedia.org/wiki/Nonogram",
      },
    },
    {
      id: "pipes-graph",
      kind: "activity",
      gadgetId: "pipes",
      title: "A network is not a picture",
      diagram: "konigsberg",
      body: [
        "While you rotate the pipes it looks like a tidiness puzzle, but the only thing that decides whether water arrives is which tile is joined to which. Throw the picture away and keep the joins, and you have a graph: junctions are dots, pipes are lines between them. Everything about the puzzle — reachable, cut off, a loop that goes nowhere — is a fact about that graph.",
        "In 1736 Leonhard Euler was asked whether you could walk the seven bridges of Königsberg, crossing each exactly once. He proved you cannot, and he did it by throwing the map away: what mattered was how many bridges met at each bank. Every time you enter a bank you must leave it, so an in-between bank needs an even number of bridges. All four banks had an odd number — 5, 3, 3, 3 — so the walk cannot exist. Graph theory starts at that sentence, and it now runs the internet's routing, train timetables and social networks.",
      ],
      source: {
        label:
          "Wikipedia, “Seven Bridges of Königsberg” — Euler, 1736: the first theorem of graph theory",
        url: "https://en.wikipedia.org/wiki/Seven_Bridges_of_K%C3%B6nigsberg",
      },
    },
    {
      id: "mirror-reflection",
      kind: "activity",
      gadgetId: "mirror",
      title: "Light does exactly one thing",
      diagram: "reflection",
      body: [
        "Draw a line at right angles to the mirror where the beam lands. The angle the beam arrives at, measured from that line, is exactly the angle it leaves at, on the other side. That is the whole behaviour of a mirror, it has never needed a correction, and Hero of Alexandria wrote it down about two thousand years ago. A mirror set at 45° in a square grid therefore turns a beam by exactly 90°, which is why this maze can be solved on paper before you touch it.",
        "One consequence is worth more than the rule itself: reflection is reversible. If a beam gets from the emitter to the target along some path, then a beam fired backwards from the target follows that same path home. So when the forward trace gets messy, start at the target and work backwards — you are not cheating, you are using a symmetry the physics guarantees. The Fraction Laser in the Math cabin is this same maze with one thing changed: the beam's turns are governed by fractional quantities instead of by 45° mirrors, so the geometry solved here is the part that stays and the arithmetic is the part that arrives.",
      ],
      source: {
        label:
          "Wikipedia, “Specular reflection” — the law of reflection; Hero of Alexandria and Alhazen",
        url: "https://en.wikipedia.org/wiki/Specular_reflection",
      },
    },
    {
      id: "chess-proof",
      kind: "activity",
      gadgetId: "chess",
      title: "A mate in two is a proof, not a plan",
      body: [
        "In a game you are guessing what one opponent will choose. In a mate-in-two you are claiming something much stronger: there is a first move after which every legal reply loses. Not the likely reply, not the best reply — all of them. That is why a puzzle feels different from a game, and why the answer is either right or not: you are being asked for a small proof, and a proof has to cover the cases you would rather not look at.",
        "The way people get good at this is not by thinking further ahead. It is by recognising shapes that already have names — pin, skewer, fork, discovered attack, back-rank mate — because a named shape is one you can look for on purpose. There are maybe twenty of them worth knowing, they are all learnable in an afternoon each, and after that the board stops being 32 separate pieces.",
      ],
      source: {
        label:
          "lichess.org, “Practice” — free interactive lessons on pins, skewers, forks and checkmate patterns",
        url: "https://lichess.org/practice",
      },
    },
    {
      id: "logic-invitation",
      kind: "invitation",
      title: "All four of these are one subject wearing four coats",
      body: [
        "The nonogram, the pipes, the mirrors and the chess board look like four hobbies. They are four doors into one field: logic, the study of what must follow from what. Every move you make in this room is a tiny proof — this cell must be filled, that pipe cannot be connected, this move wins against every answer. The feeling you get when a deduction snaps shut is the feeling the whole subject is made of.",
        "It goes a very long way, and not only into puzzles. Every computer chip is built out of AND, OR and NOT; programs can be proved correct before they are ever run; and mathematicians use the same machinery to check each other's proofs. A good next step is knights-and-knaves puzzles, where some islanders always lie and some always tell the truth: they are pure logic in fancy dress, and they are the same skill you have been using here.",
      ],
      source: {
        label:
          "Mathigon, “Logic and Paradoxes” — free, with truth tables and knights-and-knaves puzzles",
        url: "https://mathigon.org/course/logic",
      },
    },
  ],
};

const MATH_DECK: ShelfDeck = {
  topic: "math",
  title: "The bookshelf",
  intro: "Six pages about what is really going on in this room. Read any of them, in any order.",
  cards: [
    {
      id: "balance-comparison",
      kind: "activity",
      gadgetId: "balance-scale",
      title: "A balance does not weigh, it compares",
      diagram: "balance-thirds",
      body: [
        "A balance never tells you what anything weighs. It answers one question — left heavier, right heavier, or level — and three answers per weighing is more than it sounds. Nine coins, one of them a lighter fake: split them three, three and three, and weigh two of the groups. If one side rises the fake is in it; if they level, the fake is in the three you did not touch. One more weighing inside that group of three finds it. Two weighings for nine coins, because 3 × 3 = 9. Twenty-seven coins would take three.",
        "An equation is the same object. x + 4 = 11 says these two sides balance. You may do anything you like to one side as long as you do the identical thing to the other, because that is what keeps a balance level. “Take 4 off both sides” is not a rule someone invented for you to memorise — it is the only kind of move a balance would allow.",
      ],
      source: {
        label:
          "Wikipedia, “Balance puzzle” — the nine-coin and twelve-coin problems, and the 3ⁿ rule",
        url: "https://en.wikipedia.org/wiki/Balance_puzzle",
      },
    },
    {
      id: "gear-teeth",
      kind: "activity",
      gadgetId: "gear-train",
      title: "Count teeth, not size",
      diagram: "gear-ratio",
      body: [
        "Mesh a 12-tooth gear with a 36-tooth gear and the small one turns exactly three times for every single turn of the big one. Not roughly — exactly, because the teeth have to march past each other one for one, so 36 ÷ 12 = 3. The metal, the weight and the diameter are all beside the point; only the counts decide it. And meshed gears always turn opposite ways.",
        "You are paid for the slowness: the big gear turns with three times the twisting force. That trade — speed for force, in an exact ratio — is the whole idea behind bicycle gears, clocks, hand drills and car gearboxes. A neat detail: put a third gear between two others and the ratio does not change at all, because its tooth count cancels out. What it does change is the direction, and that is how reverse gear works.",
      ],
      source: {
        label:
          "Wikipedia, “Gear train” — ratio equals the tooth counts; an idler reverses direction without changing the ratio",
        url: "https://en.wikipedia.org/wiki/Gear_train",
      },
    },
    {
      id: "fraction-whole",
      kind: "activity",
      gadgetId: "fraction-laser",
      title: "A whole cut into named pieces",
      diagram: "unit-fractions",
      body: [
        "Splitting a beam is splitting 1. If it divides into a half, a third and a sixth, those pieces must add back to exactly one whole — and they do, once you rename them so they are the same kind of thing: 3/6 + 2/6 + 1/6 = 6/6. That renaming is the only real skill in adding fractions. Pieces of different sizes cannot be added as they stand, any more than you can add three apples to two Tuesdays.",
        "Fractions with a 1 on top have a name, unit fractions, and ancient Egyptian scribes wrote nearly everything with them — as sums of *different* unit fractions, like 1/2 + 1/3 + 1/16. The Rhind Papyrus, copied out around 1550 BC, is essentially a lookup table for doing that. It is not only history, either: it is still unknown whether every fraction of the form 4/n can be written as three unit fractions. That question is older than your grandparents and nobody has settled it. The Mirror Maze in the Logic Games cabin is this same board with the fractions taken out: the beam still reflects, but nothing has to be divided, so what is left is the spatial reasoning on its own.",
      ],
      source: {
        label:
          "Wikipedia, “Egyptian fraction” — the Rhind Mathematical Papyrus and the Erdős–Straus conjecture",
        url: "https://en.wikipedia.org/wiki/Egyptian_fraction",
      },
    },
    {
      id: "function-rule",
      kind: "activity",
      gadgetId: "function-machine",
      title: "In, out, and the rule in between",
      diagram: "function-machine",
      body: [
        "A function machine takes a number in and gives one number out, and the same input always gives the same output — that is what makes it a function rather than a mood. Your job is the reverse: find the rule from what it does. Say 2 goes to 22, 3 goes to 28 and 4 goes to 34. The inputs step up by 1 and the outputs step up by 6, so a × 6 is hiding inside, and after that there is not much room left to hide.",
        "Here is the part worth taking away: more than one rule can fit the same examples. Add 2, times 6, take 2 turns 2 into 22 — and so does add 1, times 6, add 4. That is not a flaw in the puzzle, it is how evidence actually behaves. Examples narrow the possibilities down without always pinning one answer, so the useful question is never “what is the rule” but “what would I feed in to tell these two rules apart?”",
      ],
      source: {
        label: "NRICH, University of Cambridge — “Function Machines” (ages 7–11)",
        url: "https://nrich.maths.org/problems/function-machines",
      },
    },
    {
      id: "ratio-mixing",
      kind: "activity",
      gadgetId: "ratio-mixing",
      title: "1:3 and 1:7 do not mix into 1:5",
      diagram: "ratio-cans",
      body: [
        "Pour a can of paint mixed 1 red to 3 white into a can mixed 1 red to 7 white, and the result is not 1:5. Averaging the ratios is the trap. Count what is actually in the cans instead: the 1:3 can is 4 parts, so 8 litres of it holds 2 red and 6 white; the 1:7 can is 8 parts, so 8 litres holds 1 red and 7 white. Together that is 3 red and 13 white — a ratio of 3:13, nowhere near 1:5.",
        "The reason the trap works is that the “1” does not mean the same amount of paint in the two cans, so the ratios are not measured in the same units and cannot be added term by term. The cure is always the same and it always works: choose a real quantity, count the actual parts, and only rewrite it as a ratio at the very end.",
      ],
      source: {
        label: "NRICH, University of Cambridge — “Mixing Paints” (ages 11–14)",
        url: "https://nrich.maths.org/problems/mixing-paints",
      },
    },
    {
      id: "math-invitation",
      kind: "invitation",
      title: "Mathematics is the study of patterns, not of numbers",
      body: [
        "Look at what this room actually contains. The gears are a ratio. The paint is a ratio. The balance is an equation. The light-splitter is fractions of one whole. Four objects, one move: find the structure underneath, then say something certain about it. Arithmetic is a small tool inside that; the subject itself is about seeing the same shape in things that look unrelated, which is why a mathematician can be useful in biology, music or logistics without having studied any of them.",
        "Something else worth knowing early, because it saves years: mathematicians are stuck most of the time. Being stuck is the normal working state, right up to research level — not a sign you are not a maths person, just a sign you are near the edge of what you currently know. If you want to see where all this goes, watch working mathematicians talk about the things they love; none of it needs school maths first.",
      ],
      source: {
        label: "Numberphile — mathematicians explaining what they find beautiful, on YouTube",
        url: "https://www.youtube.com/@numberphile",
      },
    },
  ],
};

const MUSIC_DECK: ShelfDeck = {
  topic: "music",
  title: "The bookcase",
  intro:
    "Four pages about what your ears are actually doing in this room. Read any of them, in any order.",
  cards: [
    {
      id: "key-belonging",
      kind: "activity",
      gadgetId: "tune-repair",
      title: "A tune has a home, and one note has left it",
      body: [
        "There are twelve different pitches in an octave, but almost no tune uses all twelve. A tune picks seven of them and keeps coming back to one in particular — the note it feels finished on. That choice of seven is what a key is, and because any of the twelve pitches can be the home note, and there are two common flavours of scale, there are twenty-four keys altogether. The seven chosen notes are called diatonic; the five left over are chromatic.",
        "This matters for what your ear does without being asked. After a few notes you have already worked out which seven the tune is using, so strongly that when a chromatic note arrives you hear it as a mistake rather than as a new colour. Nothing about it looks different — it is an ordinary pitch, and composers use chromatic notes deliberately all the time. It only sounds wrong because your ear had already committed to a home, and that is the whole of Tune Repair.",
      ],
      source: {
        label:
          "Wikipedia, “Key (music)” — twelve possible tonics give twenty-four keys; chromatic notes are rarer, not forbidden",
        url: "https://en.wikipedia.org/wiki/Key_(music)",
      },
    },
    {
      id: "consonance-ratios",
      kind: "activity",
      gadgetId: "chord-fit",
      title: "Why some notes together sound settled and others fight",
      body: [
        "Play two notes at once and they either blend or grind. The ancient Greeks noticed that the blending pairs came from strings whose lengths were in simple whole-number ratios — two to one for the octave, three to two for the fifth, four to three for the fourth. From roughly the seventeenth century onward those same relationships were restated in terms of frequency rather than string length, and the pattern held: the simpler the ratio, the more the two notes sound like one thing rather than two.",
        "That is what you are judging in Chord Fit. A chord that already contains the melody note shares partials with it, so the two fuse; a chord that does not contain it leaves the note sticking out against the others. Consonance is not a rule somebody wrote down and it is not entirely fixed either — how harsh an interval sounds depends on the style you are used to, and a chord that unsettled listeners in one century became ordinary in the next.",
      ],
      source: {
        label:
          "Wikipedia, “Consonance and dissonance” — string-length ratios in antiquity, restated as frequency ratios from about the 17th century",
        url: "https://en.wikipedia.org/wiki/Consonance_and_dissonance",
      },
    },
    {
      id: "metre-inference",
      kind: "activity",
      gadgetId: "downbeat",
      title: "The beat is something you supply, not something you hear",
      body: [
        "A metre is a repeating pattern of strong and weak pulses, and the strange thing about it is that the strong ones do not have to be played at all. A performer can leave a downbeat silent and you will still feel exactly where it was, because by then you are the one generating the pattern. It is the same reflex that makes a clock go tick-tock when in fact it is making the identical sound over and over — the alternation is yours, not the clock's.",
        "Once your ear has settled on a grouping it holds onto it stubbornly. One writer on rhythm puts it that a listener will keep an established metre going as long as even minimal evidence for it is present. That is why Downbeat gives you several bars rather than one stressed pulse: a single loud noise is an event, and it takes a recurrence before your ear commits to a pattern it can then be tested on.",
      ],
      source: {
        label:
          "Wikipedia, “Metre (music)”, citing Lester, The Rhythms of Tonal Music (1986) — listeners maintain an established metre on minimal evidence",
        url: "https://en.wikipedia.org/wiki/Metre_(music)",
      },
    },
    {
      id: "music-is-physics",
      kind: "invitation",
      title: "Musicians and physicists are studying the same thing",
      body: [
        "Every question in this room is also a measurable physical question, and there are university physics departments that do nothing else. One of the oldest music-acoustics groups in the world sits in a physics school and publishes how a flute, a clarinet, a violin and the human voice actually work — with real measured curves, not diagrams drawn to look convincing. You can run their hearing test in a browser and plot the shape of your own ear's sensitivity.",
        "If you do, you will probably find you hear best somewhere between one and four thousand cycles a second, and that you hear sixteen thousand moderately well — where for an adult that depends on their age and how much loud sound they have been around, and very low sensitivity right at the top is not unusual. That is worth sitting with: there may be a part of a piece of music that you can hear and some of the people who made it cannot. Music is not only a thing to be good at. It is a thing that can be taken apart.",
      ],
      source: {
        label:
          "UNSW School of Physics, Music Acoustics (Joe Wolfe) — an online hearing test and measured acoustics of real instruments",
        url: "https://newt.phys.unsw.edu.au/jw/hearing.html",
      },
    },
  ],
};

export const SHELF_DECKS: readonly ShelfDeck[] = [LOGIC_GAMES_DECK, MATH_DECK, MUSIC_DECK];

/** The deck for a topic, or undefined for a cabin with no shelf contents written yet. */
export function shelfDeckFor(topic: TopicId): ShelfDeck | undefined {
  return SHELF_DECKS.find((deck) => deck.topic === topic);
}
