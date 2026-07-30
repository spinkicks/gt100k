import type { Pursuit } from "./model.js";

/**
 * The forty-five things a child can actually do, and who will tell them they are getting better.
 *
 * A CUT IS PENDING against this list (`docs/decisions/2026-07-30-catalogue-scope.md`). The bar is
 * whether a pursuit credibly helps a child reach a top-ranked university, tested per entry as: can
 * someone under 18 reach national-or-regional distinction at a named venue, does it route into a
 * verification channel, and is there a documented admit whose hook was this. Do not add an entry
 * without an answer to those, and read that decision's recorded dissent before removing one — the
 * admissions rubric that leaked in the SFFA litigation grades level and never domain, so "this
 * sounds unserious" is not the test and was explicitly rejected as one.
 *
 * Every venue below was checked against a primary source on 2026-07-28. Where a claim could not be
 * verified it is written into `note` rather than smoothed over, because a catalogue whose venues do
 * not exist is worse than a short one. The full working, including the seven candidates that failed
 * and why, is in `docs/research/2026-07-28-discovery-catalogue.md`.
 *
 * WHAT IS NOT HERE, and each absence is a finding:
 *
 *   Machine learning. Kaggle bars under-13s outright, 13-16 needs per-competition verified parental
 *   consent, and the prize rules require 18. No under-14 venue exists anywhere.
 *
 *   Catan. Every level of the US championship series, down to the local game-shop qualifier,
 *   requires entrants to be 18. Catan Junior is a product, not a competition.
 *
 *   Electronics. Hackaday and Tindie publish and sell; neither will reject a child's circuit
 *   against a published rubric. Amateur radio replaces it and is stronger than the thing it
 *   replaced.
 *
 *   Fossils and rocks. myFOSSIL was sunsetted on 20 June 2025 with no successor, and the AFMS rules
 *   require membership of an affiliated club that hosts competitive exhibits.
 *
 *   Poetry, as a separate entry. The Rattle Young Poets Anthology ended in 2024 and Poetry Out Loud
 *   is grades 9-12 and recitation rather than composition. Poetry is a mode of writing here.
 *
 *   Mahjong, and public speaking as its own leaf. No youth division in the first; the second needs
 *   a chartered Gavel Club that an individual child cannot start.
 */
export const PURSUITS: readonly Pursuit[] = [
  // ── Puzzles & Numbers ─────────────────────────────────────────────────────────────────────
  {
    id: "competition-maths",
    label: "Competition Maths",
    blurb: "Hard problems with elegant answers, against the clock.",
    cabin: "math-puzzles",
    standard: "Math Kangaroo problem sets",
    venue: { name: "Math Kangaroo", url: "https://mathkangaroo.org/" },
    minAge: 5,
    costUsd: 25,
    cadence: "annual",
    reach: "alone",
    region: "us",
    // AMC 8 is the natural second step and deliberately not the entry: its 2026 Teacher's Manual
    // states "Home schools are not allowed" and "Under no circumstances may a parent or guardian of
    // an AMC student register". For an unsupported child that is a closed door whatever its
    // prestige. Math Kangaroo lets a parent register directly and waives the fee on request.
    note: "AMC 8 is the second step; its eligibility is grade 8 or below AND under 15.5, not 14.5.",
  },
  {
    id: "speedcubing",
    label: "Speedcubing",
    blurb: "Solve the cube, then solve it faster.",
    cabin: "math-puzzles",
    standard: "WCA Regulations and Guidelines",
    venue: { name: "World Cube Association", url: "https://www.worldcubeassociation.org/" },
    minAge: 5,
    costUsd: 150,
    cadence: "several-yearly",
    reach: "alone",
    region: "international",
    skew: { male: 0.9, source: "community queries against the public WCA export, not official" },
    note: "No minimum age; delegates issue DNFs and +2s on the spot and results publish worldwide.",
  },
  {
    id: "sudoku",
    label: "Sudoku",
    blurb: "One number per row, and only one way it all fits.",
    cabin: "math-puzzles",
    standard: "WPF Grand Prix answer keys",
    venue: { name: "WPF Sudoku Grand Prix", url: "https://gp.worldpuzzle.org/" },
    minAge: 7,
    costUsd: 0,
    cadence: "monthly",
    reach: "alone",
    region: "international",
    // Sixteen machine-scored verdicts a year for the price of printer paper: the best value in the
    // catalogue. Narrowed from "logic puzzles" on purpose — nonograms, sudoku and logic grids share
    // no motor sequence, which is the Scrabble-and-Catan problem in miniature.
    note: "Eight Sudoku GP rounds and eight Puzzle GP rounds a year, free, email address only.",
  },
  {
    id: "ciphers",
    label: "Codes & Ciphers",
    blurb: "Read the message someone tried to hide.",
    cabin: "math-puzzles",
    standard: "National Cipher Challenge staged problems",
    venue: {
      name: "National Cipher Challenge",
      url: "https://www.cipherchallenge.org/",
    },
    minAge: 11,
    costUsd: 0,
    cadence: "annual",
    reach: "alone",
    region: "uk",
    note: "Free and open worldwide, but prizes are UK-only and the organisers say it is not designed for the junior age group.",
  },

  // ── Games & Strategy ──────────────────────────────────────────────────────────────────────
  {
    id: "chess",
    label: "Chess",
    blurb: "Out-think the person across the board.",
    cabin: "games-strategy",
    standard: "US Chess rating system and Official Rules of Chess",
    venue: { name: "US Chess MSA", url: "https://new.uschess.org/civicrm/player-search" },
    minAge: 5,
    costUsd: 24,
    cadence: "monthly",
    reach: "alone",
    region: "us",
    skew: { male: 0.873, source: "US Chess, active members, July 2024" },
    note: "Sections through 3rd grade do not require membership to be rated, so the first taste is free.",
  },
  {
    id: "go",
    label: "Go",
    blurb: "Surround more of the board than they do.",
    cabin: "games-strategy",
    standard: "AGA Tournament Rules; kyu and dan ratings",
    venue: { name: "North American Kyu Championship", url: "https://www.usgo.org/" },
    minAge: 6,
    costUsd: 10,
    cadence: "annual",
    reach: "alone",
    region: "us",
    note: "Cheapest governing-body membership found, but the rated calendar is thin — most play happens on servers that do not feed the rating.",
  },
  {
    id: "bridge",
    label: "Bridge",
    blurb: "Win tricks with a partner who cannot tell you their hand.",
    cabin: "games-strategy",
    standard: "ACBL masterpoint ranking",
    venue: { name: "Youth NABC", url: "https://www.acbl.org/youth/" },
    minAge: 8,
    costUsd: 5,
    cadence: "monthly",
    reach: "alone",
    region: "us",
    // Five dollars a year buys an externally audited cumulative ranking held by a body that is not
    // us, plus free entry to the Youth NABC with lunch. Nothing else in the catalogue comes close
    // on cost per verdict.
    note: "No stated minimum age was found, only that Youth means under 21.",
  },
  {
    id: "pokemon-tcg",
    label: "Pokémon Cards",
    blurb: "Build a deck, then find out what it cannot beat.",
    cabin: "games-strategy",
    standard: "Play! Pokémon Junior division rules and Championship Points",
    venue: {
      name: "Play! Pokémon League Challenge",
      url: "https://www.pokemon.com/us/play-pokemon",
    },
    minAge: 6,
    costUsd: 150,
    cadence: "monthly",
    reach: "alone",
    region: "international",
    // The only entry where cost scales with wanting to win AND the purchase mechanic is randomised
    // packs. For a catalogue aimed at children without family resources that is a different kind of
    // risk from a membership fee, and it should be said on the tile rather than discovered.
    note: "Highest verdict cadence in the group; entry is often free for Juniors. Deck cost is unverified and unbounded.",
  },
  {
    id: "backgammon",
    label: "Backgammon",
    blurb: "Play the odds the dice give you.",
    cabin: "games-strategy",
    standard: "FIBS rating formula",
    venue: { name: "USBGF Kids Backgammon Club", url: "https://usbgf.org/" },
    minAge: 8,
    costUsd: 0,
    cadence: "weekly",
    reach: "alone",
    region: "international",
    note: "Best cadence anywhere: weekly, free, rated. Weakest judge: an encouraging club, and dice variance in every result.",
  },
  {
    id: "scrabble",
    label: "Scrabble",
    blurb: "Find the word the board is hiding.",
    cabin: "games-strategy",
    standard: "NASPA School Word List 2023",
    venue: {
      name: "NASPA Youth SCRABBLE",
      url: "https://www.scrabbleplayers.org/w/NASPA_Youth_SCRABBLE",
    },
    minAge: 7,
    costUsd: 15,
    cadence: "annual",
    reach: "adult-action",
    region: "us",
    note: "NASPA stopped running School Scrabble in 2016. The championship is played in two-player teams, which is a real barrier for an isolated child.",
  },

  // ── Code & Computers ──────────────────────────────────────────────────────────────────────
  {
    id: "programming",
    label: "Programming",
    blurb: "Tell a machine exactly what to do, and find out if you did.",
    cabin: "code-computers",
    standard: "USACO contest instructions; 1000-point test-data scoring",
    venue: { name: "USACO", url: "https://usaco.org/" },
    minAge: 9,
    costUsd: 0,
    cadence: "several-yearly",
    reach: "alone",
    region: "international",
    // "Python" and "competitive programming" were two names for one activity with one venue, so
    // they are one entry. No age floor, no registration, an autograder that rejects, and published
    // promotion cutoffs: the strongest free entry in the catalogue.
    note: "Open to all; only training camp and IOI selection are restricted to US pre-college students.",
  },
  {
    id: "ctf",
    label: "Hacking Puzzles",
    blurb: "Break into the system on purpose, and legally.",
    cabin: "code-computers",
    standard: "picoCTF challenge set and scoring",
    venue: { name: "picoCTF", url: "https://picoctf.org/" },
    minAge: 13,
    costUsd: 0,
    cadence: "annual",
    reach: "alone",
    region: "international",
    note: "The 13 floor is COPPA and cannot be worked around. A free year-round practice gym sits alongside the spring competition.",
  },
  {
    id: "game-jam",
    label: "Making Games",
    blurb: "Build a whole small game before the clock runs out.",
    cabin: "code-computers",
    standard: "Ludum Dare eight-category peer rating",
    venue: { name: "Ludum Dare", url: "https://ldjam.com/" },
    minAge: 13,
    costUsd: 0,
    cadence: "several-yearly",
    reach: "alone",
    region: "international",
    // "Game development" failed the action-program test as written: art, audio, code and level
    // design share no motor sequence. Narrowed to shipping a game to a jam deadline, it passes.
    //
    // THE ONE VENUE `check-links.ts` CANNOT CLEAR, and it is kept rather than swapped. `ldjam.com`
    // resolves (Cloudflare DoH returns both A and AAAA records) but is unreachable from this
    // machine over either family, including by direct IP — an egress limitation here, not evidence
    // about the site, which has run since 2002. Global Game Jam was the obvious substitute and was
    // rejected on the merits: it is not judged at all, so taking it would have cost this pursuit its
    // external-validation test to satisfy a network fault. Re-verify from somewhere else before
    // concluding anything.
    note: "Peer votes are a real non-captive verdict but there is no published rubric, so the standard is weaker than it looks.",
  },
  {
    id: "demoscene",
    label: "Demoscene",
    blurb: "Make a computer do something it should not be able to.",
    cabin: "code-computers",
    standard: "Revision competition rules with jury preselection",
    venue: { name: "Revision", url: "https://revision-party.net/" },
    minAge: 12,
    costUsd: 40,
    cadence: "annual",
    reach: "adult-action",
    region: "international",
    note: "Jury preselection genuinely rejects entries. No age policy found; a remote ticket avoids the all-night in-person event.",
  },

  // ── Making & Building ─────────────────────────────────────────────────────────────────────
  {
    id: "amateur-radio",
    label: "Ham Radio",
    blurb: "Get licensed, then talk to a stranger a continent away.",
    cabin: "making-engineering",
    standard: "FCC Element 2 question pool, published verbatim",
    venue: {
      name: "ARRL VEC exam session",
      url: "https://www.arrl.org/find-an-amateur-radio-license-exam-session",
    },
    minAge: 8,
    costUsd: 5,
    cadence: "on-demand",
    reach: "alone",
    region: "us",
    // The best hardware-to-verdict ratio in the catalogue, and the only entry whose judge is
    // non-captive BY REGULATION: the FCC bars your close relatives from serving as your volunteer
    // examiners. Fifteen dollars for adults, five for under-18s, and you can retake.
    note: "No explicit FCC minimum age was found, only strongly implied by ARRL's youth licensing programme.",
  },
  {
    id: "rocketry",
    label: "Model Rockets",
    blurb: "Build it, launch it, and get it back in one piece.",
    cabin: "making-engineering",
    standard: "US Model Rocket Sporting Code",
    venue: {
      name: "NAR National Rocketry Competition, A Division",
      url: "https://nar.org/NRCCompetition",
    },
    minAge: 7,
    costUsd: 30,
    cadence: "several-yearly",
    reach: "adult-action",
    region: "us",
    note: "A Division is 7-13 by age on 1 July. The school-sponsored national challenge is grades 6-12 and $800-1200, which is the wrong route for us.",
  },
  {
    id: "woodworking",
    label: "Woodworking",
    blurb: "Cut it square, join it tight, finish it properly.",
    cabin: "making-engineering",
    standard: "County fairbook standards, Danish judging system",
    venue: { name: "4-H county fair", url: "https://4-h.org/" },
    minAge: 8,
    costUsd: 20,
    cadence: "annual",
    reach: "adult-action",
    region: "us",
    // The Danish system judges against a written standard rather than against other children, so
    // every exhibit in a class can receive the same colour. That is criterion-referenced feedback
    // of exactly the kind the motivation evidence says is safe.
    note: "Independent membership exists for children with no club, but requires a filed project plan and an adult mentor.",
  },
  {
    id: "sewing",
    label: "Sewing",
    blurb: "Make something you can wear out of a flat piece of cloth.",
    cabin: "making-engineering",
    standard: "Make It With Wool construction and fashion criteria",
    venue: {
      name: "Make It With Wool, Preteen division",
      url: "https://www.makeitwithwool.com/",
    },
    minAge: 6,
    costUsd: 45,
    cadence: "annual",
    reach: "adult-action",
    region: "us",
    skew: {
      male: 0.05,
      source: "no published figure; format and imagery are near-entirely female",
    },
    note: "Preteen is 12 and under and competes at state level only; Junior 13-16 and Senior advance to Nationals.",
  },
  {
    id: "assistive-design",
    label: "Designing For Someone",
    blurb: "Design a thing that solves one real person's problem.",
    cabin: "making-engineering",
    standard: "Make:able challenge toolkit, six named criteria",
    venue: { name: "Make:able Challenge", url: "https://www.makeable.org/" },
    minAge: 8,
    costUsd: 0,
    cadence: "annual",
    reach: "adult-action",
    region: "international",
    note: "Explicit Under-14 division, free entry, external panel shortlists. Needs access to a 3D printer, and under-14 prizes go to the organisation rather than the child.",
  },
  {
    id: "robotics",
    label: "Robotics",
    blurb: "Build a machine that senses and moves on its own.",
    cabin: "making-engineering",
    standard: "FLL Robot Game Rulebook, plus Core Values, Innovation and Robot Design rubrics",
    venue: { name: "FIRST LEGO League", url: "https://www.firstinspires.org/robotics/fll" },
    minAge: 6,
    costUsd: 700,
    cadence: "annual",
    reach: "needs-organisation",
    region: "international",
    skew: { male: 0.7, source: "FIRST 2012-13 impact study; unchanged since 2003" },
    // Listed because a child who can reach it should, and flagged because most of ours cannot.
    // There is no free path in and no team for an unaffiliated child to join.
    note: "The near-parity figure in circulation describes a grant subprogramme, not the programme.",
  },

  // ── Music & Sound ─────────────────────────────────────────────────────────────────────────
  {
    id: "piano",
    label: "Piano",
    blurb: "Both hands, doing different things, on purpose.",
    cabin: "music-sound",
    standard: "ABRSM Music Performance Grades specification",
    venue: { name: "ABRSM Initial Performance Grade", url: "https://www.abrsm.org/" },
    minAge: 5,
    costUsd: 65,
    cadence: "on-demand",
    reach: "alone",
    region: "international",
    // The fear that graded exams would require a teacher was wrong, and it is the best news in the
    // verification: ABRSM's spec says "Learners may be entered at any age", Performance Grades are
    // video submissions with no booking window, and only the booking adult must be 18.
    note: "Recorded at home and uploaded; no teacher required. Only MTNA is teacher-gated.",
  },
  {
    id: "violin",
    label: "Violin",
    blurb: "Find the note with your finger, not a key.",
    cabin: "music-sound",
    standard: "ABRSM Bowed Strings syllabus",
    venue: { name: "ABRSM Initial Performance Grade", url: "https://www.abrsm.org/" },
    minAge: 5,
    costUsd: 65,
    cadence: "on-demand",
    reach: "alone",
    region: "international",
    skew: { male: 0.35, source: "Hallam, Rogers & Creech 2008, all 150 English Music Services" },
  },
  {
    id: "drums",
    label: "Drums",
    blurb: "Keep time so well that nobody notices you doing it.",
    cabin: "music-sound",
    standard: "ABRSM Drum Kit Performance Grades",
    venue: { name: "ABRSM Initial / RSL Debut", url: "https://www.abrsm.org/" },
    minAge: 5,
    costUsd: 70,
    cadence: "on-demand",
    reach: "alone",
    region: "international",
    skew: { male: 0.75, source: "Hallam, Rogers & Creech 2008" },
  },
  {
    id: "guitar",
    label: "Guitar",
    blurb: "Six strings, and the chord shapes that unlock most songs.",
    cabin: "music-sound",
    standard: "RSL Debut syllabus",
    venue: { name: "RSL Awards Debut", url: "https://www.rslawards.com/" },
    minAge: 5,
    costUsd: 75,
    cadence: "on-demand",
    reach: "alone",
    region: "international",
    skew: { male: 0.81, source: "Hallam, Rogers & Creech 2008, electric guitar" },
    note: "ABRSM has no Initial grade for guitar; RSL Debut and Trinity Initial cover the beginner gap.",
  },
  {
    id: "singing",
    label: "Singing",
    blurb: "The one instrument you already own.",
    cabin: "music-sound",
    standard: "RSL Vocals / Trinity Initial syllabus",
    venue: { name: "RSL Awards Debut", url: "https://www.rslawards.com/" },
    minAge: 5,
    costUsd: 70,
    cadence: "on-demand",
    reach: "alone",
    region: "international",
    skew: { male: 0.2, source: "Hallam, Rogers & Creech 2008, voice" },
  },
  {
    id: "making-tracks",
    label: "Making Tracks",
    blurb: "Record it, layer it, and mix it until it sits right.",
    cabin: "music-sound",
    standard: "ABRSM Creative Musicianship specification",
    venue: { name: "ABRSM CM: Music Production", url: "https://www.abrsm.org/" },
    minAge: 8,
    costUsd: 70,
    cadence: "on-demand",
    reach: "alone",
    region: "international",
    note: "New: assessments live from May 2026. BandLab, the obvious free tool, requires age 13, so under-13s need a local one.",
  },
  {
    id: "songwriting",
    label: "Songwriting",
    blurb: "Write the thing other people want to sing.",
    cabin: "music-sound",
    standard: "ABRSM Creative Musicianship specification",
    venue: { name: "ABRSM CM: Songwriting", url: "https://www.abrsm.org/" },
    minAge: 7,
    costUsd: 70,
    cadence: "on-demand",
    reach: "alone",
    region: "international",
    note: "Lowest equipment barrier in the music group: a voice and a phone.",
  },
  {
    id: "speaker-design",
    label: "Speaker Design",
    blurb: "Build a box that moves air exactly the way you meant.",
    cabin: "music-sound",
    standard: "ANSI/CTA-2010-C maximum output measurement",
    venue: {
      name: "Ohio Speaker Design Competition",
      url: "https://www.parts-express.com/speaker-design-competition",
    },
    minAge: 8,
    costUsd: 480,
    cadence: "annual",
    reach: "adult-action",
    region: "us",
    // The standard and the venue are two unconnected paths, not one. The competition judges by
    // subjective listening to three one-minute clips and uses a microphone only to level-match; it
    // does not use CTA-2010. Self-measurement against the standard is the real validation, and it
    // needs a car park: the spec wants the nearest reflector 0.75 wavelengths away, about 26m at
    // 20 Hz.
    note: "No age policy found in either direction. Midwest Audiofest no longer exists; Parts Express rebranded it in 2024.",
  },

  // ── Art & Animation ───────────────────────────────────────────────────────────────────────
  {
    id: "photography",
    label: "Photography",
    blurb: "Be in the right place, and press it at the right moment.",
    cabin: "art-motion",
    standard: "Young Wildlife Photographer of the Year judging criteria",
    venue: {
      name: "Young Wildlife Photographer of the Year",
      url: "https://www.nhm.ac.uk/wpy/competition",
    },
    minAge: 5,
    costUsd: 0,
    cadence: "annual",
    reach: "alone",
    region: "international",
    note: "Free to enter with age bands at 10-and-under and 11-14, while the adult competition costs £35. A phone qualifies.",
  },
  {
    id: "drawing",
    label: "Drawing",
    blurb: "Make something people want to keep looking at.",
    cabin: "art-motion",
    standard: "Toyota criteria: concept 33.4%, uniqueness 33.3%, artistry 33.3%",
    venue: { name: "Toyota Dream Car Art Contest", url: "https://www.toyota-dreamcarart.com/" },
    minAge: 4,
    costUsd: 0,
    cadence: "annual",
    reach: "alone",
    region: "international",
    note: "Bands at 7-and-under, 8-11 and 12-15, free, with national then world juries. Scholastic is grades 7-12 and excludes most of the band.",
  },
  {
    id: "stop-motion",
    label: "Stop-Motion",
    blurb: "Move it a little, take a photo, and do that four hundred times.",
    cabin: "art-motion",
    standard: "Young Animator of the Year UK category rules",
    venue: { name: "Young Animator of the Year UK", url: "https://younganimator.uk/" },
    minAge: 11,
    costUsd: 0,
    cadence: "annual",
    reach: "alone",
    region: "uk",
    note: "Free, judged by 40+ working animators, winners premiered at the Manchester Animation Festival. NFFTY takes any age but costs $30-60.",
  },
  {
    id: "filmmaking",
    label: "Filmmaking",
    blurb: "Cut it so it feels the way you meant it to.",
    cabin: "art-motion",
    standard: "Into Film Awards criteria",
    venue: { name: "Into Film Awards", url: "https://www.intofilm.org/awards" },
    minAge: 5,
    costUsd: 0,
    cadence: "annual",
    reach: "alone",
    region: "uk",
    note: "Bands at 5-11 and 12-15, free. NFFTY is the international alternative and its youngest ever director was 5.",
  },
  {
    id: "comics",
    label: "Comics & Manga",
    blurb: "Tell the story in four panels and no more.",
    cabin: "art-motion",
    standard: "Kitakyushu Junior Division rules, set theme",
    venue: {
      name: "Kitakyushu International Manga Competition",
      url: "https://www.city.kitakyushu.lg.jp/",
    },
    minAge: 6,
    costUsd: 0,
    cadence: "annual",
    reach: "alone",
    region: "international",
    note: "Junior Division is 12 and under; 13-14 year olds fall into the open division against professionals. Entry fee unconfirmed.",
  },
  {
    id: "3d-animation",
    label: "3D Animation",
    blurb: "Build it in the computer, then make it move.",
    cabin: "art-motion",
    standard: "Young Animator of the Year UK 3D category rules",
    venue: { name: "Young Animator of the Year UK", url: "https://younganimator.uk/" },
    minAge: 11,
    costUsd: 0,
    cadence: "annual",
    reach: "alone",
    region: "uk",
    note: "Blender is free. Its own Suzanne Awards have no youth category and are audience-voted, so this borrows a youth venue instead.",
  },

  // ── Science & Nature ──────────────────────────────────────────────────────────────────────
  {
    id: "wildlife-id",
    label: "Finding Wildlife",
    blurb: "Photograph what you find, and get it named.",
    cabin: "science-nature",
    standard: "iNaturalist Research Grade criteria, two-thirds community agreement",
    venue: { name: "iNaturalist to GBIF", url: "https://www.inaturalist.org/" },
    minAge: 5,
    costUsd: 0,
    cadence: "continuous",
    reach: "alone",
    region: "international",
    // The lowest-friction entry in the catalogue: a phone is the whole instrument. Research Grade is
    // a real external verdict that can be revoked when the community disagrees, though it is
    // consensus rather than gatekeeping — nobody stops a bad record, they decline to promote it.
    note: "Under-13s need parental permission on file; accounts are suspended if an adult does not respond within seven days.",
  },
  {
    id: "birding",
    label: "Birding",
    blurb: "Learn to know the bird before you see it properly.",
    cabin: "science-nature",
    standard: "eBird Reviewer Handbook and per-county filters",
    venue: { name: "eBird", url: "https://ebird.org/about" },
    minAge: 13,
    costUsd: 0,
    cadence: "continuous",
    reach: "alone",
    region: "international",
    note: "Cornell's terms bar under-13s outright and the ABA's youngest division is 10-13, so ages 6-9 have no route at all.",
  },
  {
    id: "asteroid-hunting",
    label: "Asteroid Hunting",
    blurb: "Find a rock nobody has ever seen, and name it.",
    cabin: "science-nature",
    standard: "Minor Planet Center astrometric report format",
    venue: { name: "IASC", url: "https://iasc.cosmosearch.org/" },
    minAge: 10,
    costUsd: 0,
    cadence: "monthly",
    reach: "adult-action",
    region: "international",
    // The highest ceiling in the catalogue: detections reach the Minor Planet Center, roughly 1%
    // become provisional, and discoverers name what they find. An eleven-year-old has done it,
    // through an astronomy club rather than a school.
    note: "No telescope needed, but Astrometrica needs a Windows PC, which in a low-resource home is the harder ask. Teams need two members; a parent counts.",
  },
  {
    id: "growing-plants",
    label: "Growing Things",
    blurb: "Living things that solve problems slowly.",
    cabin: "science-nature",
    standard: "County fairbook horticulture standards, Danish judging",
    venue: { name: "4-H county fair", url: "https://4-h.org/" },
    minAge: 8,
    costUsd: 20,
    cadence: "annual",
    reach: "adult-action",
    region: "us",
    note: "Cloverbuds aged 5-7 are frequently barred from competitive judging, which is the point of entering.",
  },
  {
    id: "weather",
    label: "Weather Watching",
    blurb: "Measure the rain where you live, every single day.",
    cabin: "science-nature",
    standard: "CoCoRaHS observer protocol",
    venue: { name: "CoCoRaHS", url: "https://www.cocorahs.org/" },
    minAge: 7,
    costUsd: 45,
    cadence: "continuous",
    reach: "alone",
    region: "us",
    note: "The National Weather Service uses the data, but nothing was found that rejects an individual report, so the verdict is the weak link.",
  },
  {
    id: "variable-stars",
    label: "Watching Stars Change",
    blurb: "Some stars get brighter and dimmer. Write down when.",
    cabin: "science-nature",
    standard: "AAVSO Visual Observing Manual",
    venue: { name: "AAVSO", url: "https://www.aavso.org/" },
    minAge: 10,
    costUsd: 0,
    cadence: "continuous",
    reach: "adult-action",
    region: "international",
    note: "Needs no equipment at all — naked-eye estimates against free charts. But the site is directed at 18+, so a parent holds the account, and nothing rejects a beginner's estimate.",
  },

  // ── Words & Persuasion ────────────────────────────────────────────────────────────────────
  {
    id: "writing",
    label: "Writing Stories",
    blurb: "Hold someone's attention all the way to the end.",
    cabin: "influence-media",
    standard: "Stone Soup editorial criteria",
    venue: { name: "Stone Soup", url: "https://stonesoup.com/submission-guidelines/" },
    minAge: 6,
    costUsd: 25,
    cadence: "continuous",
    reach: "alone",
    region: "international",
    // The only writing venue found with no lower age bound, and its published criteria are unusually
    // explicit about rejection: "We do not ask whether a piece is good for the writer's age. We do
    // not grade on a curve... We decline work that is competent but lifeless."
    note: "200-300 submissions a month, 10-12 week response. Submission fee is behind the Submittable login and unverified.",
  },
  {
    id: "podcasting",
    label: "Podcasting",
    blurb: "Say it out loud so a stranger wants to keep listening.",
    cabin: "influence-media",
    standard: "NPR Student Podcast Challenge rules",
    venue: {
      name: "NPR Student Podcast Challenge",
      url: "https://www.npr.org/series/662609200/npr-student-podcast-challenge",
    },
    minAge: 9,
    costUsd: 0,
    cadence: "annual",
    reach: "adult-action",
    region: "us",
    note: "Opens at grade 4 and disqualifies adult production. NPR's page says a family member may submit; a member station's page says teachers only. Unresolved.",
  },
  {
    id: "journalism",
    label: "Reporting",
    blurb: "Go and ask someone, then write down what is true.",
    cabin: "influence-media",
    standard: "Scholastic Kids Press selection criteria",
    venue: {
      name: "Scholastic Kids Press",
      url: "https://kpcnotebook.scholastic.com/page/about-scholastic-kids-press",
    },
    minAge: 10,
    costUsd: 0,
    cadence: "annual",
    reach: "alone",
    region: "us",
    note: "Roughly eight reporters chosen nationally per year on a 400-word reported article with real interviews. IndyKids is the lower-barrier on-ramp beneath it.",
  },
  {
    id: "debate",
    label: "Debating",
    blurb: "Argue the side you were given, and argue it well.",
    cabin: "influence-media",
    standard: "Coolidge Foundation online opens format",
    venue: { name: "Coolidge Foundation debate", url: "https://coolidgefoundation.org/debate/" },
    minAge: 11,
    costUsd: 0,
    cadence: "several-yearly",
    reach: "alone",
    region: "us",
    skew: { male: 0.58, source: "Public Forum participation; female finalists are 6%" },
    // The only venue found that anticipates our exact user: a separate registration form for
    // "students attending without the formal support of their school" and homeschoolers, with
    // volunteer citizen judges supplied so the child need not bring one.
    note: "The gender gap here is manufactured by the activity, not brought to it: a 125,087-round study found no gap among novices, and girls 30% more likely to quit.",
  },
];
