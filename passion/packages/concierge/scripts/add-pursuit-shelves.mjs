#!/usr/bin/env node
// One-shot: stocks the 20 browse tiles that had no shelf of their own, or fewer than three things
// on it, and re-emits `seed-library.ts` in its documented order.
//
// Kept in the tree for the same reason as `tag-pursuits.mjs`: this is where the material came from
// and why, and a hundred-odd diff hunks record neither. Not idempotent, not meant to run twice.
//
// PROVENANCE. Seven parallel research passes, one per group of tiles, each working from
// `docs/decisions/2026-07-27-curated-library-standard.md` and each required to fetch every URL and
// read the body rather than trust the status code. That second step earned its keep — between them
// they caught a dozen pages that answer 200 and are dead, listed in `NOTES` at the foot of this
// file. Everything below returned 200 with content that matches its title.
//
// WHAT WAS REJECTED, so the bar is visible rather than implied:
//   - Anything behind a Cloudflare interactive challenge, per the standard. That cost real
//     material: Cornell's Bird Song Hero and Merlin (the two best song-ID resources in existence,
//     and `birding`'s blurb is literally about song ID), Demozoo, ProCon, Seek by iNaturalist, and
//     Kids Web Japan, which was the only young-child manga route anyone found.
//   - `rbo.org.uk`, which serves a byte-identical JavaScript shell for every path including an
//     invented control. Unverifiable by the standard's method, so dropped rather than assumed good,
//     even though the Royal Ballet and Opera's Create & Sing is exactly right for `singing`.
//   - `youcandothecube.com`, the official Rubik's K-12 programme and the one thing that would have
//     given `speedcubing` a 6-8 tier. Its TLS certificate does not match its hostname, so a child's
//     browser fails the same way curl does.
//   - `scijinks.gov` (NOAA/NASA's own children's weather site) — expired TLS certificate.
//   - Individual creators, throughout. This is where most of the instrument-tuition and maker web
//     lives and none of it clears rule 1.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const LIB = resolve(dirname(fileURLToPath(import.meta.url)), "..", "src", "seed-library.ts");

const P = "curated:seed-2026-07";
/** Marks the entries added by this pass, so a later reader can tell them from the original 157. */
const P2 = "curated:shelves-2026-07";

/**
 * `[domainPath, pursuits, title, url, modes, reputation, ageTiers]`.
 *
 * Positional because a hundred-odd object literals with nine keys each is unreadable, and the
 * shape never varies. The generated file is the object form.
 */
const NEW = [
  // ---------------------------------------------------------------- games & strategy
  // Every game in this cabin was filed at `board-games`, so Backgammon served Go links. These are
  // national governing bodies almost throughout, which is what this domain has instead of museums.
  [
    ["games-strategy", "board-games"],
    ["go"],
    "Capture Go (British Go Association)",
    "https://media-iframe.britgo.org/capturego",
    ["perform", "investigate"],
    0.85,
    ["6-8", "9-11"],
  ],
  [
    ["games-strategy", "board-games"],
    ["go"],
    "How to Play Go (British Go Association)",
    "https://www.britgo.org/intro/intro2.html",
    ["investigate"],
    0.85,
    ["9-11", "12-14"],
  ],
  [
    ["games-strategy", "board-games"],
    ["go"],
    "Learn to Play (American Go Foundation)",
    "https://www.agfgo.org/learn-to-play",
    ["investigate", "perform"],
    0.8,
    ["6-8", "9-11"],
  ],
  [
    ["games-strategy", "board-games"],
    ["go"],
    "What Is Go? (Sensei's Library)",
    "https://senseis.xmp.net/?WhatIsGo",
    ["investigate"],
    0.7,
    ["12-14"],
  ],

  [
    ["games-strategy", "odds-and-chance"],
    ["bridge"],
    "4 Steps to Playing MiniBridge (English Bridge Union)",
    "https://www.ebu.co.uk/new-players/4-steps-playing-minibridge",
    ["investigate", "perform", "collaborate"],
    0.85,
    ["9-11", "12-14"],
  ],
  [
    ["games-strategy", "odds-and-chance"],
    ["bridge"],
    "11 Easy Steps to Play MiniBridge (English Bridge Union)",
    "https://www.ebu.co.uk/information-resources/11-easy-steps-play-minibridge",
    ["investigate", "perform"],
    0.85,
    ["9-11", "12-14"],
  ],
  [
    ["games-strategy", "odds-and-chance"],
    ["bridge"],
    "Learn Bridge Online Young Player Course (Australian Bridge Federation)",
    "https://www.abf.com.au/learn-bridge-online-young-player-course/",
    ["perform", "collaborate"],
    0.85,
    ["9-11", "12-14"],
  ],
  [
    ["games-strategy", "odds-and-chance"],
    ["bridge"],
    "Learn Bridge (American Contract Bridge League)",
    "https://www.acbl.org/learn/",
    ["investigate", "perform"],
    0.85,
    ["9-11", "12-14"],
  ],

  // The publisher is commercial and is still the authoritative rules source, so the ALA's library
  // clubs page is on the same shelf as the non-commercial counterweight — a free local room to play
  // in rather than a shop.
  [
    ["games-strategy", "board-games"],
    ["pokemon-tcg"],
    "Learn to Play the Pokémon Trading Card Game",
    "https://tcg.pokemon.com/en-us/learn/",
    ["investigate", "perform"],
    0.85,
    ["6-8", "9-11"],
  ],
  [
    ["games-strategy", "board-games"],
    ["pokemon-tcg"],
    "Pokémon Trading Card Game Rulebook",
    "https://www.pokemon.com/us/pokemon-tcg/rules",
    ["investigate"],
    0.85,
    ["9-11", "12-14"],
  ],
  [
    ["games-strategy", "board-games"],
    ["pokemon-tcg"],
    "Pokémon Clubs at Your Library (American Library Association)",
    "https://www.ala.org/pokemon",
    ["collaborate", "perform"],
    0.9,
    ["9-11", "12-14"],
  ],
  [
    ["games-strategy", "board-games"],
    ["pokemon-tcg"],
    "Pokémon TCG API Documentation",
    "https://docs.pokemontcg.io/",
    ["build", "investigate"],
    0.75,
    ["12-14"],
  ],

  [
    ["games-strategy", "odds-and-chance"],
    ["backgammon"],
    "New to Backgammon (U.S. Backgammon Federation)",
    "https://usbgf.org/learn/new-to-backgammon/",
    ["investigate"],
    0.85,
    ["9-11", "12-14"],
  ],
  [
    ["games-strategy", "odds-and-chance"],
    ["backgammon"],
    "Backgammon Basics: How To Play (USBGF)",
    "https://usbgf.org/backgammon-basics-how-to-play/",
    ["investigate", "perform"],
    0.85,
    ["9-11", "12-14"],
  ],
  [
    ["games-strategy", "odds-and-chance"],
    ["backgammon"],
    "Backgammon for Complete Beginners Video Series (USBGF)",
    "https://usbgf.org/backgammon-for-complete-beginners-video-series/",
    ["investigate"],
    0.85,
    ["6-8", "9-11"],
  ],
  // The UK federation's domain does not resolve at all, so this shelf would otherwise sit entirely
  // on one host. MathWorld also covers the probability the tile's own blurb is about.
  [
    ["games-strategy", "odds-and-chance"],
    ["backgammon"],
    "Backgammon (Wolfram MathWorld)",
    "https://mathworld.wolfram.com/Backgammon.html",
    ["investigate"],
    0.8,
    ["12-14"],
  ],

  [
    ["games-strategy", "board-games"],
    ["scrabble"],
    "NASPA Youth SCRABBLE",
    "https://www.scrabbleplayers.org/w/NASPA_Youth_SCRABBLE",
    ["perform", "collaborate"],
    0.85,
    ["9-11", "12-14"],
  ],
  [
    ["games-strategy", "board-games"],
    ["scrabble"],
    "Youth SCRABBLE Resources (NASPA)",
    "https://www.scrabbleplayers.org/w/Youth_SCRABBLE_Resources",
    ["investigate"],
    0.85,
    ["9-11", "12-14"],
  ],
  [
    ["games-strategy", "board-games"],
    ["scrabble"],
    "Youth Scrabble (WESPA)",
    "https://wespa.org/community/youth-scrabble",
    ["perform", "collaborate"],
    0.85,
    ["9-11", "12-14"],
  ],
  [
    ["games-strategy", "board-games"],
    ["scrabble"],
    "New Players' Guide to Tournaments (ABSP)",
    "https://www.absp.org.uk/play/newplayers.shtml",
    ["investigate", "perform"],
    0.8,
    ["12-14"],
  ],

  // ---------------------------------------------------------------- puzzles & numbers
  [
    ["math-puzzles", "logic-puzzles"],
    ["speedcubing"],
    "WCA Regulations and Guidelines",
    "https://www.worldcubeassociation.org/regulations/",
    ["investigate"],
    0.85,
    ["12-14"],
  ],
  [
    ["math-puzzles", "logic-puzzles"],
    ["speedcubing"],
    "WCA Competitions",
    "https://www.worldcubeassociation.org/competitions",
    ["perform", "collaborate"],
    0.85,
    ["9-11", "12-14"],
  ],
  // `debug` rather than `investigate` alone: a scrambled cube is a fault state a child diagnoses.
  [
    ["math-puzzles", "logic-puzzles"],
    ["speedcubing"],
    "Rubik's Official Solution Guides",
    "https://www.rubiks.com/solution-guides",
    ["debug", "investigate"],
    0.85,
    ["9-11", "12-14"],
  ],
  [
    ["math-puzzles", "logic-puzzles"],
    ["speedcubing"],
    "Rubik's Cube (Plus magazine, University of Cambridge)",
    "https://plus.maths.org/tags/rubiks-cube",
    ["investigate"],
    0.95,
    ["12-14"],
  ],

  [
    ["math-puzzles", "logic-puzzles"],
    ["ciphers"],
    "Codes and Cryptography (NRICH, University of Cambridge)",
    "https://nrich.maths.org/tags/codes-and-cryptography",
    ["investigate", "debug"],
    0.95,
    ["9-11", "12-14"],
  ],
  [
    ["math-puzzles", "logic-puzzles"],
    ["ciphers"],
    "Cryptography (Plus magazine, University of Cambridge)",
    "https://plus.maths.org/tags/cryptography",
    ["investigate"],
    0.95,
    ["12-14"],
  ],
  [
    ["math-puzzles", "logic-puzzles"],
    ["ciphers"],
    "The Turing-Welchman Bombe (The National Museum of Computing)",
    "https://www.tnmoc.org/bombe",
    ["investigate"],
    0.9,
    ["9-11", "12-14"],
  ],
  [
    ["math-puzzles", "logic-puzzles"],
    ["ciphers"],
    "Learning at Bletchley Park",
    "https://www.bletchleypark.org.uk/learning/",
    ["investigate"],
    0.9,
    ["9-11", "12-14"],
  ],

  // ---------------------------------------------------------------- code & computers
  // ON `ctf` AND THE LEGAL BOUNDARY, which was a condition on this shelf rather than a nicety.
  // Three of the four state or structurally enforce it: the picoCTF Primer says in words that
  // attacking a system without permission is illegal, CyberPatriot is defence-only on images the
  // team is given, and CyberFirst is published by GCHQ to named 11-14 year olds. OverTheWire does
  // not say it anywhere — its rules page is community conduct only. It is kept because Bandit runs
  // on OverTheWire's own machines, so the sandbox is sanctioned by construction, and because the
  // Primer outranks it on this shelf and therefore renders above it.
  [
    ["code-computers", "security"],
    ["ctf"],
    "The CTF Primer (picoCTF, Carnegie Mellon CyLab)",
    "https://primer.picoctf.org/",
    ["investigate", "debug"],
    0.95,
    ["12-14"],
  ],
  [
    ["code-computers", "security"],
    ["ctf"],
    "CyberFirst Navigators (NCSC)",
    "https://www.ncsc.gov.uk/collection/cyberfirstnavigators",
    ["investigate"],
    0.95,
    ["12-14"],
  ],
  [
    ["code-computers", "security"],
    ["ctf"],
    "What is CyberPatriot?",
    "https://www.uscyberpatriot.org/what-is-cyberpatriot/",
    ["debug", "collaborate", "perform"],
    0.85,
    ["12-14"],
  ],
  [
    ["code-computers", "security"],
    ["ctf"],
    "Bandit (OverTheWire wargames)",
    "https://overthewire.org/wargames/bandit/",
    ["debug", "investigate"],
    0.7,
    ["12-14"],
  ],

  // Filed under `game-dev` rather than a cell of its own: real-time graphics on constrained
  // hardware is the nearest belief the taxonomy already holds, and the subculture is too small to
  // justify a cell nothing else would ever fill.
  [
    ["code-computers", "game-dev"],
    ["demoscene"],
    "Demo Scene (Inventory of Intangible Heritage, Netherlands)",
    "https://www.immaterieelerfgoed.nl/en/democene",
    ["investigate"],
    0.9,
    ["12-14"],
  ],
  [
    ["code-computers", "game-dev"],
    ["demoscene"],
    "About the Demoscene (Art of Coding)",
    "https://demoscene-the-art-of-coding.net/the-demoscene/",
    ["investigate"],
    0.75,
    ["12-14"],
  ],
  // Twenty-six years on one domain is a stronger empirical durability claim than most nonprofits
  // can make, which is the longevity-as-institution case the standard allows for.
  [
    ["code-computers", "game-dev"],
    ["demoscene"],
    "Pouët production archive",
    "https://www.pouet.net/prodlist.php",
    ["investigate"],
    0.7,
    ["12-14"],
  ],
  [
    ["code-computers", "game-dev"],
    ["demoscene"],
    "Revision demoparty",
    "https://revision-party.net/",
    ["build", "compose", "perform", "collaborate"],
    0.7,
    ["12-14"],
  ],

  // ---------------------------------------------------------------- making & building
  [
    ["making-engineering", "electronics"],
    ["amateur-radio"],
    "ARRL Kids Day",
    "https://www.arrl.org/kids-day",
    ["perform", "collaborate"],
    0.85,
    ["6-8", "9-11"],
  ],
  [
    ["making-engineering", "electronics"],
    ["amateur-radio"],
    "ARRL Youth Licensing Grant Program",
    "https://www.arrl.org/youth-licensing-grant-program",
    ["investigate"],
    0.85,
    ["9-11", "12-14"],
  ],
  [
    ["making-engineering", "electronics"],
    ["amateur-radio"],
    "Getting Licensed (ARRL)",
    "https://www.arrl.org/getting-licensed",
    ["investigate"],
    0.85,
    ["12-14"],
  ],
  [
    ["making-engineering", "electronics"],
    ["amateur-radio"],
    "Radio Merit Badge (Scouting America)",
    "https://www.scouting.org/merit-badges/radio/",
    ["build", "investigate", "explain"],
    0.8,
    ["9-11", "12-14"],
  ],

  // Both NASA builds are propellant-free — a film canister with an antacid tablet, and a paper tube
  // blown through a straw. They are the only two tagged 6-8 on purpose, and the NAR safety code
  // (adult supervision required under 12) sits on the same shelf rather than a page away. Tripoli
  // was excluded deliberately: it governs high-power rocketry, which is the wrong authority for a
  // seven-year-old.
  [
    ["making-engineering", "rocketry"],
    ["rocketry"],
    "Build a Bubble-Powered Rocket (NASA Space Place)",
    "https://spaceplace.nasa.gov/pop-rocket/en/",
    ["build"],
    0.95,
    ["6-8", "9-11"],
  ],
  [
    ["making-engineering", "rocketry"],
    ["rocketry"],
    "Make a Straw Rocket (NASA STEM)",
    "https://www.nasa.gov/stem-content/make-a-straw-rocket/",
    ["build", "investigate"],
    0.95,
    ["6-8", "9-11"],
  ],
  [
    ["making-engineering", "rocketry"],
    ["rocketry"],
    "Model Rocket Safety Code (National Association of Rocketry)",
    "https://www.nar.org/content.aspx?page_id=22&club_id=114127&module_id=669234",
    ["investigate"],
    0.85,
    ["9-11", "12-14"],
  ],
  [
    ["making-engineering", "rocketry"],
    ["rocketry"],
    "Educational Resources (National Association of Rocketry)",
    "https://www.nar.org/content.aspx?page_id=22&club_id=114127&module_id=669619",
    ["build", "investigate"],
    0.85,
    ["9-11", "12-14"],
  ],

  // The BBC entry is first on purpose: it specifies a junior hacksaw, a bench hook and a G-clamp,
  // so the technique and the safety are the same lesson rather than a warning bolted on.
  [
    ["making-engineering", "handcraft"],
    ["woodworking"],
    "Cutting wood safely (BBC Bitesize)",
    "https://www.bbc.co.uk/bitesize/articles/zdftvj6",
    ["build", "investigate"],
    0.9,
    ["6-8", "9-11"],
  ],
  [
    ["making-engineering", "handcraft"],
    ["woodworking"],
    "Joining wood without screws (BBC Bitesize)",
    "https://www.bbc.co.uk/bitesize/articles/z9pms82",
    ["build", "investigate"],
    0.9,
    ["6-8", "9-11"],
  ],
  [
    ["making-engineering", "handcraft"],
    ["woodworking"],
    "Wood construction and joining techniques (Oak National Academy)",
    "https://www.thenational.academy/teachers/programmes/design-technology-primary-ks2/units/cams-automatas/lessons/wood-construction-and-joining-techniques",
    ["build", "debug"],
    0.85,
    ["9-11", "12-14"],
  ],
  [
    ["making-engineering", "handcraft"],
    ["woodworking"],
    "Woodworking Wonders Curriculum (Wisconsin 4-H)",
    "https://4h.extension.wisc.edu/4h-resources/woodworking-wonders-curriculum/",
    ["build"],
    0.9,
    ["9-11", "12-14"],
  ],

  // This shelf escalates hand-stitch to machine, and the order matters: the Oak KS1 lesson is
  // written for five- and six-year-olds and outranks nothing, while the 4-H unit where a sewing
  // machine appears states its own 8+ floor.
  [
    ["making-engineering", "handcraft"],
    ["sewing"],
    "Simple sewing techniques (Oak National Academy, KS1)",
    "https://www.thenational.academy/teachers/programmes/design-technology-primary-ks1/units/templates-in-textiles-puppets/lessons/simple-sewing-techniques",
    ["build"],
    0.85,
    ["6-8"],
  ],
  [
    ["making-engineering", "handcraft"],
    ["sewing"],
    "How can fabrics be joined together? (BBC Bitesize)",
    "https://www.bbc.co.uk/bitesize/articles/zy3ng2p",
    ["build", "investigate"],
    0.9,
    ["6-8", "9-11"],
  ],
  [
    ["making-engineering", "handcraft"],
    ["sewing"],
    "Running stitch (RSN StitchBank, Royal School of Needlework)",
    "https://rsnstitchbank.org/stitch/running-stitch",
    ["build"],
    0.85,
    ["9-11", "12-14"],
  ],
  [
    ["making-engineering", "handcraft"],
    ["sewing"],
    "Clothing Construction Project (Colorado 4-H)",
    "https://co4h.colostate.edu/4h-project/4-h-clothing-construction-project/",
    ["build"],
    0.9,
    ["9-11", "12-14"],
  ],

  // ---------------------------------------------------------------- music & sound
  // The four orchestral overviews that used to be all eight music tiles' entire shelf are still
  // here, still tagged to the orchestral instruments. What follows is the instrument-specific
  // material they were standing in for.
  [
    ["music-sound", "instruments"],
    ["piano"],
    "Keyboard fundamentals (Oak National Academy, Y7)",
    "https://www.thenational.academy/teachers/programmes/music-secondary-ks3/units/keyboard-fundamentals/lessons",
    ["perform"],
    0.9,
    ["12-14"],
  ],
  [
    ["music-sound", "instruments"],
    ["piano"],
    "Minor, major and developing keyboard skills (Oak National Academy, Y8)",
    "https://www.thenational.academy/teachers/programmes/music-secondary-ks3/units/minor-major-and-developing-keyboard-skills/lessons",
    ["perform"],
    0.9,
    ["12-14"],
  ],
  [
    ["music-sound", "instruments"],
    ["piano"],
    "Shared Piano (Chrome Music Lab)",
    "https://musiclab.chromeexperiments.com/Shared-Piano/",
    ["perform", "collaborate", "compose"],
    0.75,
    ["6-8", "9-11", "12-14"],
  ],
  [
    ["music-sound", "instruments"],
    ["piano"],
    "Notebook for Anna Magdalena Bach (IMSLP)",
    "https://imslp.org/wiki/Notebook_for_Anna_Magdalena_Bach_(Bach,_Johann_Sebastian)",
    ["perform"],
    0.7,
    ["9-11", "12-14"],
  ],
  // One page, two tiles: the Ten Pieces arrangements carry a part for every instrument at once, so
  // a child tapping Piano and a child tapping Guitar land in the same place on a different line.
  [
    ["music-sound", "instruments"],
    ["piano", "guitar"],
    "Nutcracker instrumental arrangements (BBC Ten Pieces)",
    "https://www.bbc.co.uk/teach/ten-pieces/articles/zkjp7nb",
    ["perform", "collaborate"],
    0.9,
    ["6-8", "9-11", "12-14"],
  ],

  [
    ["music-sound", "instruments"],
    ["violin"],
    "Violin First Access (SoundStorm Music Education Agency)",
    "https://soundstorm-music.org.uk/schools-teachers/ks1-2-hub-member-school/violin-first-access/",
    ["perform"],
    0.8,
    ["6-8", "9-11"],
  ],
  [
    ["music-sound", "instruments"],
    ["violin"],
    "With Nicky (The Benedetti Foundation)",
    "https://www.benedettifoundation.org/with-nicky",
    ["perform", "investigate"],
    0.8,
    ["9-11", "12-14"],
  ],
  [
    ["music-sound", "instruments"],
    ["violin"],
    "A Night on the Bare Mountain arrangements (BBC Ten Pieces)",
    "https://www.bbc.co.uk/teach/ten-pieces/articles/zvp8pg8",
    ["perform", "collaborate"],
    0.9,
    ["6-8", "9-11", "12-14"],
  ],
  [
    ["music-sound", "instruments"],
    ["violin"],
    "Practice Schedule (Violin Masterclass, Starling Project Foundation)",
    "https://www.violinmasterclass.com/p/practice-schedule",
    ["perform"],
    0.75,
    ["9-11", "12-14"],
  ],

  [
    ["music-sound", "instruments"],
    ["drums"],
    "International Drum Rudiments (Percussive Arts Society)",
    "https://pas.org/rudiments/",
    ["perform"],
    0.85,
    ["9-11", "12-14"],
  ],
  [
    ["music-sound", "instruments"],
    ["drums"],
    "Groove Pizza (NYU Music Experience Design Lab)",
    "https://apps.musedlab.org/groovepizza/",
    ["compose", "perform"],
    0.9,
    ["6-8", "9-11", "12-14"],
  ],
  [
    ["music-sound", "instruments"],
    ["drums"],
    "Feel the beat (BBC Bitesize Play It!)",
    "https://www.bbc.co.uk/bitesize/articles/zfhc239",
    ["perform", "compose"],
    0.9,
    ["6-8"],
  ],
  [
    ["music-sound", "instruments"],
    ["drums"],
    "Fundamental drum grooves (Oak National Academy, Y7)",
    "https://www.thenational.academy/teachers/programmes/music-secondary-ks3/units/fundamental-drum-grooves/lessons",
    ["compose", "perform"],
    0.9,
    ["12-14"],
  ],
  [
    ["music-sound", "instruments"],
    ["drums"],
    "Djembe drumming and rhythms from West Africa (Oak National Academy, Y8)",
    "https://www.thenational.academy/teachers/programmes/music-secondary-ks3/units/djembe-drumming-and-rhythms-from-the-regions-of-west-africa/lessons",
    ["perform", "collaborate"],
    0.9,
    ["12-14"],
  ],

  [
    ["music-sound", "instruments"],
    ["guitar"],
    "Guitar Pick Up lessons (BBC Radio 2)",
    "https://www.bbc.co.uk/programmes/articles/3yMSBMmDqBCJdVYLrMlnCH3/radio-2s-guitar-pick-up-lessons",
    ["perform"],
    0.9,
    ["12-14"],
  ],
  [
    ["music-sound", "instruments"],
    ["guitar"],
    "JamZone guitar songs and lessons (Music Will)",
    "https://jamzone.musicwill.org/search?instruments=Guitar",
    ["perform", "collaborate"],
    0.8,
    ["9-11", "12-14"],
  ],
  [
    ["music-sound", "instruments"],
    ["guitar"],
    "What makes a good guitar riff? (BBC Bitesize)",
    "https://www.bbc.co.uk/bitesize/articles/ztkftrd",
    ["compose", "investigate"],
    0.9,
    ["12-14"],
  ],

  [
    ["music-sound", "instruments"],
    ["singing"],
    "Bring the Noise: Play It! (BBC Teach)",
    "https://www.bbc.co.uk/teach/bring-the-noise/articles/z4sq92p",
    ["perform", "compose"],
    0.9,
    ["6-8"],
  ],
  [
    ["music-sound", "instruments"],
    ["singing"],
    "Start with singing: finding my singing voice (Oak National Academy, Y1)",
    "https://www.thenational.academy/teachers/programmes/music-primary-ks1/units/start-with-singing-finding-my-singing-voice/lessons",
    ["perform"],
    0.9,
    ["6-8"],
  ],
  [
    ["music-sound", "instruments"],
    ["singing"],
    "Singing in harmony (Oak National Academy, Y4)",
    "https://www.thenational.academy/teachers/programmes/music-primary-ks2/units/singing-for-performance-discovering-different-ways-to-sing-in-harmony/lessons",
    ["perform", "collaborate"],
    0.9,
    ["9-11"],
  ],
  [
    ["music-sound", "instruments"],
    ["singing"],
    "Free songs and teaching videos (Sing Up)",
    "https://www.singup.org/free-resources",
    ["perform"],
    0.8,
    ["6-8", "9-11"],
  ],
  [
    ["music-sound", "instruments"],
    ["singing"],
    "Year 7 song guides (Oak National Academy)",
    "https://www.thenational.academy/teachers/programmes/music-secondary-ks3/units/year-7-song-guides/lessons",
    ["perform", "collaborate"],
    0.9,
    ["12-14"],
  ],

  // ---------------------------------------------------------------- art & animation
  [
    ["art-motion", "visual"],
    ["photography"],
    "Photography challenges (Tate Kids)",
    "https://www.tate.org.uk/kids/make/photography",
    ["compose", "investigate"],
    0.9,
    ["6-8", "9-11"],
  ],
  [
    ["art-motion", "visual"],
    ["photography"],
    "Pinhole Magnifier (Exploratorium Science Snacks)",
    "https://www.exploratorium.edu/snacks/pinhole-magnifier",
    ["build", "investigate"],
    0.9,
    ["9-11", "12-14"],
  ],
  [
    ["art-motion", "visual"],
    ["photography"],
    "Wildlife Photographer of the Year gallery (Natural History Museum)",
    "https://www.nhm.ac.uk/wpy/gallery",
    ["investigate"],
    0.9,
    ["6-8", "9-11", "12-14"],
  ],
  [
    ["art-motion", "visual"],
    ["photography"],
    "Young Wildlife Photographer of the Year (Natural History Museum)",
    "https://www.nhm.ac.uk/wpy/competition/young-wpy",
    ["compose"],
    0.9,
    ["9-11", "12-14"],
  ],
  [
    ["art-motion", "visual"],
    ["photography"],
    "Introduction to the Camera Obscura (National Science and Media Museum)",
    "https://blog.scienceandmediamuseum.org.uk/introduction-camera-obscura/",
    ["investigate"],
    0.9,
    ["12-14"],
  ],
  [
    ["art-motion", "visual"],
    ["photography"],
    "Exploring Photographs (Getty Museum)",
    "https://www.getty.edu/education/teachers/classroom_resources/curricula/exploring_photographs/",
    ["investigate", "explain"],
    0.95,
    ["12-14"],
  ],
  [
    ["art-motion", "visual"],
    ["photography"],
    "George Eastman Museum (YouTube)",
    "https://www.youtube.com/@GeorgeEastmanMuseum",
    ["investigate"],
    0.9,
    ["12-14"],
  ],

  [
    ["art-motion", "visual"],
    ["comics"],
    "Free Resources (The Cartoon Museum)",
    "https://www.cartoonmuseum.org/free-resources",
    ["build", "compose"],
    0.8,
    ["6-8", "9-11"],
  ],
  [
    ["art-motion", "visual"],
    ["comics"],
    "Make your own comic strip (Words for Life, National Literacy Trust)",
    "https://wordsforlife.org.uk/activities/summer-writing-challenge-to-make-your-own-comic/",
    ["compose", "build"],
    0.8,
    ["6-8", "9-11"],
  ],
  [
    ["art-motion", "visual"],
    ["comics"],
    "Making a Comics Jam (BookTrust)",
    "https://www.booktrust.org.uk/resources/find-resources/sarah-mcintyres-writing-workshop-making-a-comics-jam-2/",
    ["compose", "collaborate"],
    0.8,
    ["6-8", "9-11"],
  ],
  [
    ["art-motion", "visual"],
    ["comics"],
    "How to write a comic (BBC Bitesize)",
    "https://www.bbc.co.uk/bitesize/articles/zbk47nb",
    ["compose", "explain"],
    0.9,
    ["9-11"],
  ],
  [
    ["art-motion", "visual"],
    ["comics"],
    "How to make a comic, with Beano (BBC Teach)",
    "https://www.bbc.co.uk/teach/class-clips-video/articles/zr7rdnb",
    ["compose", "build"],
    0.9,
    ["9-11"],
  ],
  [
    ["art-motion", "visual"],
    ["comics"],
    "Comics and Comic Books: A Research Guide (Library of Congress)",
    "https://guides.loc.gov/comic-books",
    ["investigate"],
    0.95,
    ["12-14"],
  ],
  [
    ["art-motion", "visual"],
    ["comics"],
    "Digital Exhibits (Billy Ireland Cartoon Library & Museum)",
    "https://cartoons.osu.edu/exhibits/digital-exhibits",
    ["investigate"],
    0.95,
    ["12-14"],
  ],
  [
    ["art-motion", "visual"],
    ["comics"],
    "The Wall of Manga (Kyoto International Manga Museum)",
    "https://kyotomm.jp/en/manga-wall/",
    ["investigate"],
    0.85,
    ["12-14"],
  ],

  // ---------------------------------------------------------------- science & nature
  // These three tiles are the ones where a child can put a real observation into a real dataset, so
  // each shelf carries at least one participation route and not only identification guides.
  [
    ["science-nature", "wildlife"],
    ["wildlife-id"],
    "Wildlife Explorer species directory (The Wildlife Trusts)",
    "https://www.wildlifetrusts.org/wildlife-explorer",
    ["investigate"],
    0.8,
    ["6-8", "9-11", "12-14"],
  ],
  [
    ["science-nature", "wildlife"],
    ["wildlife-id"],
    "Guide to British Trees (Woodland Trust)",
    "https://www.woodlandtrust.org.uk/trees-woods-and-wildlife/british-trees/",
    ["investigate"],
    0.8,
    ["6-8", "9-11", "12-14"],
  ],
  [
    ["science-nature", "wildlife"],
    ["wildlife-id"],
    "Identify nature (Natural History Museum)",
    "https://www.nhm.ac.uk/take-part/identify-nature.html",
    ["investigate"],
    0.9,
    ["9-11", "12-14"],
  ],
  [
    ["science-nature", "wildlife"],
    ["wildlife-id"],
    "Community science (Natural History Museum)",
    "https://www.nhm.ac.uk/take-part/monitor-and-encourage-nature/community-science.html",
    ["investigate", "collaborate"],
    0.9,
    ["9-11", "12-14"],
  ],
  [
    ["science-nature", "wildlife"],
    ["wildlife-id"],
    "Nature's Notebook (USA National Phenology Network)",
    "https://www.usanpn.org/natures_notebook",
    ["investigate", "collaborate"],
    0.9,
    ["9-11", "12-14"],
  ],
  [
    ["science-nature", "wildlife"],
    ["wildlife-id"],
    "iRecord (UK Biological Records Centre)",
    "https://irecord.org.uk/",
    ["investigate", "collaborate"],
    0.9,
    ["12-14"],
  ],

  [
    ["science-nature", "wildlife"],
    ["birding"],
    "How to Start Birding (Audubon)",
    "https://www.audubon.org/birding/how-to-start-birding",
    ["investigate"],
    0.85,
    ["9-11", "12-14"],
  ],
  [
    ["science-nature", "wildlife"],
    ["birding"],
    "Bird identification skills (British Trust for Ornithology)",
    "https://www.bto.org/learn/skills/bird-identification",
    ["investigate"],
    0.85,
    ["12-14"],
  ],
  [
    ["science-nature", "wildlife"],
    ["birding"],
    "About eBird (Cornell Lab of Ornithology)",
    "https://ebird.org/about",
    ["investigate", "collaborate"],
    0.9,
    ["12-14"],
  ],
  // `care` is literal here: the child keeps a feeder through a season and logs what visits it.
  [
    ["science-nature", "wildlife"],
    ["birding"],
    "How to Participate in Project FeederWatch",
    "https://feederwatch.org/about/how-to-participate/",
    ["care", "investigate", "collaborate"],
    0.9,
    ["9-11", "12-14"],
  ],
  [
    ["science-nature", "wildlife"],
    ["birding"],
    "Big Garden Birdwatch (RSPB)",
    "https://www.rspb.org.uk/whats-happening/big-garden-birdwatch",
    ["investigate", "collaborate"],
    0.85,
    ["9-11", "12-14"],
  ],

  [
    ["science-nature", "weather"],
    ["weather"],
    "Weather and Climate (NASA Science for kids)",
    "https://science.nasa.gov/kids/earth/weather-and-climate/",
    ["investigate"],
    0.95,
    ["6-8", "9-11"],
  ],
  [
    ["science-nature", "weather"],
    ["weather"],
    "Owlie Skywarn weather activity book (NOAA National Weather Service)",
    "https://www.weather.gov/owlie/",
    ["investigate"],
    0.95,
    ["6-8", "9-11"],
  ],
  // The tile's blurb is "measure the rain where you live, every single day", and this is the free
  // way to start doing it. Worth knowing that the gauge it builds is NOT the one CoCoRaHS accepts.
  [
    ["science-nature", "weather"],
    ["weather"],
    "Make a Rain Gauge (MetLink, Royal Meteorological Society)",
    "https://www.metlink.org/experiment/make-a-rain-gauge/",
    ["build", "investigate"],
    0.85,
    ["6-8", "9-11", "12-14"],
  ],
  [
    ["science-nature", "weather"],
    ["weather"],
    "Learning Lesson: It's the Rain, Man (NOAA JetStream)",
    "https://www.noaa.gov/jetstream/global/earning-lesson-its-rain-man",
    ["build", "investigate"],
    0.95,
    ["9-11", "12-14"],
  ],
  [
    ["science-nature", "weather"],
    ["weather"],
    "CoCoRaHS observer training",
    "https://www.cocorahs.org/Content.aspx?page=training",
    ["investigate", "collaborate"],
    0.85,
    ["12-14"],
  ],
  [
    ["science-nature", "weather"],
    ["weather"],
    "Weather Observations Website (Met Office WOW)",
    "https://wow.metoffice.gov.uk/",
    ["investigate", "collaborate"],
    0.95,
    ["9-11", "12-14"],
  ],
  [
    ["science-nature", "weather"],
    ["weather"],
    "GLOBE Observer Clouds Toolkit",
    "https://observer.globe.gov/toolkit/clouds-toolkit",
    ["investigate", "collaborate"],
    0.95,
    ["9-11", "12-14"],
  ],

  // ---------------------------------------------------------------- words & persuasion
  [
    ["influence-media", "publishing"],
    ["podcasting"],
    "Sound Advice: the NPR guide to student podcasting",
    "https://www.npr.org/2023/02/18/1149984588/how-to-start-a-podcast-student",
    ["compose", "build"],
    0.9,
    ["9-11", "12-14"],
  ],
  [
    ["influence-media", "publishing"],
    ["podcasting"],
    "How to Create a Podcast (BBC Bitesize)",
    "https://www.bbc.co.uk/bitesize/articles/zgt2tcw",
    ["build", "compose"],
    0.9,
    ["9-11", "12-14"],
  ],
  [
    ["influence-media", "publishing"],
    ["podcasting"],
    "Great Questions (StoryCorps)",
    "https://storycorps.org/participate/great-questions/",
    ["collaborate", "investigate"],
    0.8,
    ["9-11", "12-14"],
  ],
  [
    ["influence-media", "publishing"],
    ["podcasting"],
    "Making news for radio or a podcast (BBC Young Reporter)",
    "https://www.bbc.co.uk/teach/young-reporter/articles/z4njcmn",
    ["compose", "explain"],
    0.9,
    ["9-11", "12-14"],
  ],
  // Also replaces the pursuit's own venue URL, which 404s — see the catalogue fix in this pass.
  [
    ["influence-media", "publishing"],
    ["podcasting"],
    "NPR Student Podcast Challenge",
    "https://www.npr.org/series/662609200/npr-student-podcast-challenge",
    ["compose", "build"],
    0.9,
    ["9-11", "12-14"],
  ],

  // The tile is "argue the side you were given", so this shelf is case construction and rebuttal
  // rather than persuasion technique. Debatabase is the closest match in existence: 700+ motions,
  // each published with both the proposition and the opposition case.
  [
    ["influence-media", "rhetoric"],
    ["debate"],
    "How to discuss and debate (BBC Bitesize)",
    "https://www.bbc.co.uk/bitesize/articles/z79mm39",
    ["persuade", "perform"],
    0.9,
    ["9-11", "12-14"],
  ],
  [
    ["influence-media", "rhetoric"],
    ["debate"],
    "How to build an argument (BBC Bitesize)",
    "https://www.bbc.co.uk/bitesize/articles/zn4pf4j",
    ["persuade", "explain"],
    0.9,
    ["9-11", "12-14"],
  ],
  [
    ["influence-media", "rhetoric"],
    ["debate"],
    "Speech and debate resources (English-Speaking Union)",
    "https://www.esu.org/resources/",
    ["persuade", "perform", "collaborate"],
    0.85,
    ["9-11", "12-14"],
  ],
  [
    ["influence-media", "rhetoric"],
    ["debate"],
    "Debatabase (International Debate Education Association)",
    "https://idebate.net/resources/debatabase",
    ["investigate", "persuade"],
    0.85,
    ["12-14"],
  ],
  [
    ["influence-media", "rhetoric"],
    ["debate"],
    "Rebuttal Basics in Debate (National Speech & Debate Association)",
    "https://www.speechanddebate.org/rebuttal-basics-in-debate/",
    ["persuade", "perform"],
    0.85,
    ["12-14"],
  ],
];

function slug(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** The existing id scheme: `res-<cabin>-<subtopic>-<title slug, truncated to 44>`. */
function idFor(domainPath, title) {
  const tail = slug(title).slice(0, 44).replace(/-+$/, "");
  return `res-${domainPath.join("-")}-${tail}`;
}

const src = readFileSync(LIB, "utf8");
const openAt = src.indexOf("export const SEED_LIBRARY: readonly CuratedResource[] = [");
const bodyFrom = src.indexOf("\n", openAt) + 1;
const closeAt = src.lastIndexOf("];");

/** Parse the existing entries back out. Safe because the array is uniform and comment-free. */
const existing = [
  ...src.slice(bodyFrom, closeAt).matchAll(/ {2}\{\n((?: {4}.*\n)+) {2}\},\n/g),
].map((m) => {
  const o = {};
  for (const line of m[1].split("\n")) {
    const kv = /^ {4}(\w+): (.*),$/.exec(line);
    if (kv) o[kv[1]] = kv[2];
  }
  return o;
});
if (existing.length !== 157) throw new Error(`parsed ${existing.length} entries, expected 157`);

const added = NEW.map(([domainPath, pursuits, title, url, modes, reputation, ageTiers]) => ({
  id: JSON.stringify(idFor(domainPath, title)),
  title: JSON.stringify(title),
  url: JSON.stringify(url),
  domainPath: `[${domainPath.map((s) => JSON.stringify(s)).join(", ")}]`,
  pursuits: `[${pursuits.map((s) => JSON.stringify(s)).join(", ")}]`,
  affordedModes: `[${modes.map((s) => JSON.stringify(s)).join(", ")}]`,
  reputation: String(reputation),
  ageTiers: `[${ageTiers.map((s) => JSON.stringify(s)).join(", ")}]`,
  provenance: JSON.stringify(P2),
}));

const all = [...existing, ...added];

const dupeId = all.map((r) => r.id).filter((v, i, a) => a.indexOf(v) !== i);
if (dupeId.length > 0) throw new Error(`duplicate ids: ${dupeId.join(", ")}`);

// The file's documented order: domain path, then id.
all.sort((a, b) => {
  const pa = a.domainPath + a.id;
  const pb = b.domainPath + b.id;
  return pa < pb ? -1 : pa > pb ? 1 : 0;
});

const KEYS = [
  "id",
  "title",
  "url",
  "domainPath",
  "pursuits",
  "affordedModes",
  "reputation",
  "ageTiers",
  "provenance",
];
const body = all
  .map((r) => `  {\n${KEYS.map((k) => `    ${k}: ${r[k]},`).join("\n")}\n  },\n`)
  .join("");

writeFileSync(LIB, src.slice(0, bodyFrom) + body + src.slice(closeAt));
console.log(`${existing.length} + ${added.length} = ${all.length} resources`);
console.log(`(${P} original, ${P2} added by this pass)`);
