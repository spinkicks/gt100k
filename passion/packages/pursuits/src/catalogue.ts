import type { Pursuit } from "./model.js";

/**
 * The thirty-seven things a child can actually do, and who will tell them they are getting better.
 *
 * TWO TESTS, AND AN ENTRY HAS TO PASS BOTH. The first is the original one
 * (`docs/research/2026-07-28-discovery-catalogue.md` §1): a real venue, reachable by a child in this
 * product's 6-14 band, that renders a verdict. The second arrived later
 * (`docs/decisions/2026-07-30-catalogue-scope.md`): a documented path to a distinction near the end
 * of school that an admissions reader can check, recorded per entry in `ceiling`.
 *
 * They are separate because they select differently, and the gap between them is the single most
 * important thing in this file. Scholastic opens at 13, YoungArts at 15, and Presidential Scholar
 * needs a graduating senior — so for most of a child's time here, the `ceiling` is not reachable and
 * the `venue` is the whole story. An entry whose `ceiling` is absent has no documented route to that
 * later distinction, which is a fact worth surfacing rather than a reason to remove it.
 *
 * SEVEN WERE CUT on 2026-07-30 for failing the second test with nothing to appeal to, and each for a
 * structural reason rather than for sounding unserious — the SFFA rubric grades level and never
 * domain, and "low status" was explicitly rejected as a criterion. Speaker Design and Demoscene have
 * no under-18 venue at all; the AES competition that names loudspeaker design requires college
 * enrolment, so a child is disqualified rather than unlikely. Backgammon's world under-18 event drew
 * eleven registrants. Weather Watching has no ceiling: its two honours need twenty and twenty-five
 * years of service. Codes & Ciphers has no world championship. Sudoku's under-18 gold is a
 * side-classification in an adult event, and Pokémon's divisions are age-graded children's brackets.
 *
 * Their curated resources were NOT deleted. A resource keeps its `domainPath` and loses only its
 * `pursuits` tag, so the concierge still answers with Bletchley Park and NOAA; they simply no longer
 * stock a tile.
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
 *   SPORT, ENTIRELY, and on scope rather than on evidence. Track and field, orienteering and sport
 *   stacking were all verified as passing the four tests -- USATF Rule 306.1(g) lets an athlete
 *   "withdraw their club affiliation and compete unattached" all the way to Nationals, and
 *   orienteering's Junior Nationals name homeschooling in eligibility. They are still out.
 *
 *   Two reasons. It is already well understood that children reach selective universities through
 *   sport, so it is not a route anybody needs us to find. And it needs a world-class coach, which is
 *   the opposite of this catalogue's premise: an unaffiliated child clears the ENTRY gate in
 *   athletics and clears nothing at the TRAINING gate, because entering a meet without a club is
 *   not the same as becoming competitive without one. The absence is deliberate; see
 *   `docs/decisions/2026-08-02-catalogue-additions.md` before re-opening it.
 *
 *   Mahjong. No youth division.
 *
 *   PUBLIC SPEAKING WAS CUT ON A FACT THAT IS WRONG, and the correction is worth keeping visible.
 *   The note here said it "needs a chartered Gavel Club that an individual child cannot start."
 *   Toastmasters' Gavel Clubs do work that way, but they are not the only door. LAMDA runs Speaking
 *   in Public as an Ofqual-regulated graded ladder from Entry Level to Grade 8, the examiner is
 *   external by regulation and cannot be the child's own teacher, and a parent books it directly:
 *   "Your teacher may arrange for you to take an exam, but you can also book one yourself." The
 *   syllabus states "There are no minimum age restrictions."
 *
 *   The same mechanism reaches acting and recitation. Verified but NOT YET ADDED, because two of
 *   the three have no cabin to live in and that is a wider decision than an append; see
 *   `docs/decisions/2026-08-02-catalogue-additions.md`.
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
    ceiling: {
      name: "International Mathematical Olympiad",
      url: "https://www.imo-official.org/",
      opensAt: 15,
      precedent:
        "Reid Barton (4x IMO gold) and Luke Robitaille (4x IMO gold) to MIT. MIT states it has enrolled almost every American IMO medalist of the last decade, which is the only place on this list where the causal gap is closed.",
    },
    minAge: 5,
    minAgeBasis: "verified",
    minAgeQuote: "Kindergarten students are welcome to participate at grade 1.",
    minAgeSource: "https://mathkangaroo.org/mks/faqs/about-the-test/",
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
    ceiling: {
      name: "WCA World Championship",
      url: "https://www.worldcubeassociation.org/competitions",
      opensAt: 0,
      precedent:
        "Collin Burns, 3x3 world record at 15, to Columbia. The WCA runs no age divisions at all, so a teenager competes against adults and can hold an outright world record.",
    },
    minAge: 5,
    minAgeBasis: "judgement",
    costUsd: 150,
    cadence: "several-yearly",
    reach: "alone",
    region: "international",
    skew: { male: 0.9, source: "community queries against the public WCA export, not official" },
    note: "No minimum age; delegates issue DNFs and +2s on the spot and results publish worldwide.",
  },

  // ── Games & Strategy ──────────────────────────────────────────────────────────────────────
  {
    id: "chess",
    label: "Chess",
    blurb: "Out-think the person across the board.",
    cabin: "games-strategy",
    standard: "US Chess rating system and Official Rules of Chess",
    venue: { name: "US Chess MSA", url: "https://ratings.uschess.org/" },
    ceiling: {
      name: "FIDE Grandmaster title",
      url: "https://ratings.fide.com/",
      opensAt: 0,
      precedent:
        "Daniel Naroditsky (GM at 17) and Carissa Yip to Stanford; Andrew Tang (GM at 17) to Princeton. Chess scholarships exist but only at Webster, SLU, UT Dallas and Texas Tech, never at a top-ranked school.",
    },
    // US Chess publishes UPPER age limits per grade and no lower one, and its scholastic
    // regulations admit Pre-K by name. Five is therefore verified as admissible rather than assumed.
    minAge: 5,
    minAgeBasis: "verified",
    minAgeQuote:
      "A “K-8 Championship” section is open to all age-eligible players currently enrolled in Grades K through 8 (and Pre-K).",
    minAgeSource:
      "https://new.uschess.org/sites/default/files/media/documents/us-chess-scholastic-regulations-2025-2026-2026.01.22-v2.1.pdf",
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
    ceiling: {
      name: "Redmond Cup, Senior division",
      url: "https://www.usgo-archive.org/redmond-cup",
      opensAt: 13,
      precedent:
        "Aaron Ye, seven-time Redmond Cup champion, to Cornell. No source links the record to the admission.",
    },
    minAge: 6,
    minAgeBasis: "judgement",
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
    venue: { name: "Youth NABC", url: "https://acbl.org/portfolio/ynabc/" },
    ceiling: {
      name: "World Youth Bridge Teams, Under-16 Koc Trophy",
      url: "http://www.worldbridge.org/",
      opensAt: 0,
    },
    minAge: 8,
    minAgeBasis: "judgement",
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
    id: "scrabble",
    label: "Scrabble",
    blurb: "Find the word the board is hiding.",
    cabin: "games-strategy",
    standard: "NASPA School Word List 2023",
    venue: {
      name: "NASPA Youth SCRABBLE",
      url: "https://www.scrabbleplayers.org/w/NASPA_Youth_SCRABBLE",
    },
    ceiling: {
      name: "WESPA World Youth Scrabble Championship",
      url: "https://www.wespa.org/",
      opensAt: 0,
      precedent:
        "Mack Meller, youngest player ever to reach expert rating at 11 and highest-rated under-18 in North America 2012-18, to Columbia.",
    },
    minAge: 7,
    minAgeBasis: "judgement",
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
    ceiling: {
      name: "International Olympiad in Informatics",
      url: "https://ioinformatics.org/",
      opensAt: 0,
      precedent:
        "Brian Xue (IOI gold, third in the world) and Benjamin Chen (IOI gold) to MIT. Also feeds MIT PRIMES, whose alumni were 12 of the top 25 Putnam scorers in 2025.",
    },
    minAge: 9,
    minAgeBasis: "judgement",
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
    ceiling: {
      // Not picoCTF: that is already this pursuit's `venue`, so naming it here would record nothing.
      // MITRE eCTF is the step above, and a high-school team placed sixth nationally in 2024, ahead
      // of teams from MIT and UCLA.
      name: "MITRE Embedded Capture the Flag",
      url: "https://ectf.mitre.org/",
      opensAt: 14,
    },
    minAge: 13,
    minAgeBasis: "verified",
    minAgeQuote:
      "Be at least 13 years old (if under 18, have consent of parent or legal guardian).",
    minAgeSource: "https://picoctf.org/competitions/2026-spring.html",
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
    standard: "G4C Student Challenge rubric: social impact, creativity and theme",
    venue: {
      name: "Games for Change Student Challenge",
      url: "https://learn.gamesforchange.org/student-challenge/competition",
    },
    minAge: 10,
    minAgeBasis: "verified",
    minAgeQuote:
      "Creators must be between the ages of 10 and 25. If they are aged 10-13, they will submit to the \u201cJunior\u201d competition categories.",
    minAgeSource: "https://g4cstudentchallenge.secure-platform.com/a/page/faq",
    costUsd: 0,
    cadence: "annual",
    reach: "alone",
    region: "international",
    // "Game development" failed the action-program test as written: art, audio, code and level
    // design share no motor sequence. Narrowed to shipping a game to a deadline, it passes.
    //
    // VENUE MOVED FROM LUDUM DARE, and the reason is worth keeping because it corrected a mistake in
    // how this entry was being judged. Ludum Dare went offline in May 2026 on an expired certificate,
    // cancelled its 2025 events and has announced a wind-down. The instinct was to find an equally
    // prestigious jam, and that was the wrong instinct: MIT's Maker Portfolio is a CHANNEL rather
    // than a distinction (see `2026-07-30-catalogue-scope.md` §3), so what reaches an admissions
    // reader for this pursuit is the shipped game, never a jam placing. Nobody is admitted anywhere
    // for a Ludum Dare rank. The venue therefore has to be alive and judged, not famous.
    //
    // G4C is better than Ludum Dare on every test this catalogue applies, not merely a substitute.
    // It is externally judged by industry and theme experts rather than by fellow entrants, so the
    // verdict is not captive. It states a floor, which Ludum Dare never did -- this entry's old 13
    // had no published basis at all and appears to have been assumed from COPPA. It admits an
    // unaffiliated child by name: "It's not required to be formally enrolled in an educational
    // institution to enter." And its Game of the Year carries a $10,000 scholarship, which is the
    // same reason Pokemon TCG survived the scope audit: a prize awarded as a scholarship produces an
    // artefact that reads as an award.
    //
    // NO CEILING, AND THAT IS A FINDING RATHER THAN A GAP. G4C was this entry's ceiling and is now
    // its venue, and the `ctf` entry already argues that naming one programme as both records
    // nothing. The honest position is the scope decision's: this pursuit's route to a selective
    // admissions reader is the Maker Portfolio, which is a channel and not a distinction, so there
    // is no pre-college distinction to name here.
    note: "Judged by outside experts against a published rubric. Regional and global rounds run November to April.",
  },

  // ── Making & Building ─────────────────────────────────────────────────────────────────────
  {
    id: "amateur-radio",
    label: "Ham Radio",
    blurb: "Get licensed, then talk to a stranger a continent away.",
    cabin: "making-engineering",
    // The FCC designates the element number; the pool is written and maintained by the NCVEC
    // Question Pool Committee and shared by all fourteen VECs. A standard that names the wrong
    // author is one a reader cannot go and check.
    standard: "NCVEC Technician (Element 2) question pool, published verbatim",
    venue: {
      name: "ARRL VEC exam session",
      url: "https://www.arrl.org/find-an-amateur-radio-license-exam-session",
    },
    ceiling: {
      name: "ARRL Hiram Percy Maxim Memorial Award",
      url: "https://www.arrl.org/hiram-percy-maxim-award",
      opensAt: 0,
    },
    minAge: 8,
    minAgeBasis: "judgement",
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
    ceiling: {
      name: "FAI World Championship for Space Models, Junior class",
      url: "https://www.fai.org/page/cia-space-models",
      opensAt: 0,
    },
    minAge: 7,
    minAgeBasis: "verified",
    minAgeQuote:
      "A Division 7 - 13 years old. If the member turns 7 during the contest year, he/she may compete after his/her 7th birthday.",
    minAgeSource: "https://www.nar.org/CompetitionMeets",
    costUsd: 30,
    cadence: "several-yearly",
    reach: "adult-action",
    region: "us",
    note: "A Division is 7-13 by age on 1 July. The school-sponsored national challenge is grades 6-12 and $800-1200, which is the wrong route for us.",
  },
  // ── The county-fair mechanism, through OPEN CLASS rather than 4-H ─────────────────────────────
  //
  // `woodworking` and `growing-plants` reach the fair through 4-H, which costs a membership, a
  // county residency and a floor of 8 -- Cloverbuds, the 5-7 band, are barred from competitive
  // judging and receive a participation ribbon rather than a verdict. Almost every county fair also
  // runs an OPEN CLASS beside 4-H, and for an unaffiliated child it is the better door on every
  // count: no membership, no residency ("Exhibitors do not need to be Larimer County residents to
  // enter"), and no published age floor at all. Its youth classes are still competitively placed,
  // carry premium money and award Champion and Reserve Champion, so the verdict is real.
  //
  // That is what restores making activities to the bottom of the band. The same fair's Creative
  // Crafts department runs a judged class for "Children, 4 and under, any craft".
  //
  // A NAMED FAIR, DELIBERATELY. Open-class rules are set fair by fair and vary in both directions --
  // Erie County's Needle Arts competition is "Anyone 13 years old and older", which would exclude
  // most of this band. So these entries name Larimer County's fair books rather than gesturing at
  // county fairs in general, and the floors below are judgements about the activity rather than
  // quoted rules, because the venue publishes none.
  {
    id: "baking",
    label: "Baking",
    blurb: "Get the rise right, get the crumb right, then let a stranger cut into it.",
    cabin: "making-engineering",
    standard:
      "Larimer County Fair Open Class Baked Products rules: outside, inside and eating quality",
    venue: {
      name: "Larimer County Fair Open Class",
      url: "https://www.treventscomplex.com/assets/doc/Baked-Products-Fairbook-9e1f0a8593.pdf",
    },
    minAge: 7,
    minAgeBasis: "judgement",
    costUsd: 30,
    cadence: "annual",
    reach: "adult-action",
    region: "us",
    skew: {
      male: 0.43,
      source: "Mintel UK home-baking, adults; no youth competitive figure exists",
    },
    // NO CEILING, AND ONE WAS LOST RATHER THAN NEVER EXISTING. The National Festival of Breads ran a
    // youth division with a published floor of eight -- "open to any AMATEUR YOUTH baker 8 to 17
    // years of age" in 2017 -- and its 2025 rules read "open to ADULT home bakers, 18 years of age
    // and older". SkillsUSA's Baking contest is restricted to CTE programmes with baking as the
    // occupational objective, and C-CAP requires attending a partner high school, so both disqualify
    // a home baker outright rather than merely disfavouring one.
    note: "Cake decorating is a different action program and is not folded in: piping and fondant share no motor sequence with mixing, proving and baking, and the fair judges them separately.",
  },
  {
    id: "food-preservation",
    label: "Preserving Food",
    blurb: "Put summer in a jar so it is still good in February.",
    cabin: "making-engineering",
    standard:
      "Larimer County Fair Open Class Preserved Food Products rules: seal, pack, headspace, clarity",
    venue: {
      name: "Larimer County Fair Open Class",
      url: "https://www.treventscomplex.com/assets/doc/Preserved-Food-Products-Fair-Book-0ae44a83f0.pdf",
    },
    // Nine rather than the seven used for baking. The venue publishes no floor for either, but this
    // is the one activity in the cluster carrying a scald and a botulism risk.
    minAge: 9,
    minAgeBasis: "judgement",
    costUsd: 40,
    cadence: "annual",
    reach: "adult-action",
    region: "us",
    note: "The dried-product class is the cheap way in: no jars, no canner, no pressure equipment. No national youth distinction exists above the county fair, so this pursuit has no ceiling.",
  },
  {
    id: "knitting",
    label: "Knitting",
    blurb: "Two needles and one long piece of string, turned into something with a shape.",
    cabin: "making-engineering",
    standard: "Larimer County Fair Open Class rules: workmanship, design, suitability to purpose",
    venue: {
      name: "Larimer County Fair Open Class",
      url: "https://www.treventscomplex.com/assets/doc/Knitting-Crochet-Felting-Fairbook-69c7935e74.pdf",
    },
    minAge: 7,
    minAgeBasis: "judgement",
    costUsd: 25,
    cadence: "annual",
    reach: "adult-action",
    region: "us",
    skew: { male: 0.29, source: "AFCI craft participation study, adults" },
    // NOT "FIBRE CRAFT". Knitting is two needles, crochet is one hook, weaving is a loom, and they
    // share no motor sequence -- the "crafts" failure mode one level down. The fair books refuse to
    // bundle them either, listing crochet, hand knit and felted items as separate judged classes.
    // Weaving is left out on cost: a floor loom is $200 to $1,500 before any yarn, and there is no
    // ceiling above the county ribbon to justify it.
    //
    // NO CEILING, and this is a real gap rather than a failed search. Scholastic removed its Craft &
    // Design category for 2026, and both Handweavers Guild scholarships require current enrolment in
    // an accredited undergraduate or graduate programme.
    note: "Crochet would be an equally defensible separate entry on identical evidence; it is left out only to avoid two near-identical tiles.",
  },
  {
    id: "pottery",
    label: "Pottery",
    blurb: "Push wet clay into a shape, then fire it so it stays that way forever.",
    cabin: "making-engineering",
    standard: "Colorado 4-H Ceramics unit score sheets and the Colorado Guide for Ceramic Judges",
    // THROUGH 4-H, NOT OPEN CLASS, and it is the one entry in this group where that is right. Open
    // class has no ceramics department: clay appears only inside a Creative Crafts class for an
    // "item of paper, clay, stone, or any other medium not listed", judged on "workmanship, beauty
    // of design, general appearance, creativity". That names nothing about clay -- no wall
    // thickness, no glaze fault, no firing -- so it is a bundle judged by a generic rubric. The 4-H
    // score sheets are genuinely criterion-referenced, and the price of that door is the floor of 8.
    venue: {
      name: "4-H county fair, Ceramics",
      url: "https://co4h.colostate.edu/4h-project/4-h-ceramics-project/",
    },
    ceiling: {
      name: "National K-12 Ceramic Exhibition",
      url: "https://www.k12clay.org/",
      opensAt: 5,
      precedent:
        "Juried by a single named juror from the ceramic art world, 150 pieces from over a thousand entries, with scholarships. Teacher-submitted, and no precedent linking a selection to a university was found.",
    },
    minAge: 8,
    minAgeBasis: "verified",
    minAgeQuote: "Designed for members 8-18 years old.",
    minAgeSource: "https://co4h.colostate.edu/4h-project/4-h-ceramics-project/",
    costUsd: 120,
    cadence: "annual",
    reach: "adult-action",
    region: "us",
    note: "Needs a kiln. Units 1-2 must be bisque fired and the glaze units fired again, so a child with no club and no school art room has to buy firing from a community studio; where that does not exist locally this is effectively needs-organisation.",
  },
  {
    id: "woodworking",
    label: "Woodworking",
    blurb: "Cut it square, join it tight, finish it properly.",
    cabin: "making-engineering",
    standard: "County fairbook standards, Danish judging system",
    venue: { name: "4-H county fair", url: "https://4-h.org/" },
    ceiling: {
      name: "SkillsUSA National Cabinetmaking Championship",
      url: "https://www.skillsusa.org/competitions/skillsusa-championships/",
      opensAt: 14,
      precedent:
        "Ethan Graham, two-time national champion, to Dartmouth on a full scholarship. Note the path needs a school shop programme; an unaffiliated child with a garage cannot enter.",
    },
    minAge: 8,
    minAgeBasis: "verified",
    minAgeQuote:
      "4-H programs are available for youth and teens ages 8-18. 4-H Cloverbud programs are available for youth ages 5-7.",
    minAgeSource: "https://4-h.org/programs/",
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
    ceiling: {
      name: "Scholastic Art Awards, Fashion category",
      url: "https://www.artandwriting.org/",
      opensAt: 13,
    },
    // 6 -> 8. Make It With Wool states divisions rather than a floor, so this stays a judgement, but
    // the reason it was wrong is one already recorded on `growing-plants` and missing here. Where the
    // optional 5-7 "Young Sewers" split is used that division is explicitly non-competitive -- "No
    // placing or ranking of participants is permitted" -- so a six-year-old gets a certificate and a
    // gift rather than a verdict, which fails the test this catalogue exists to apply.
    minAge: 8,
    minAgeBasis: "judgement",
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
    venue: { name: "Make:able Challenge", url: "https://www.makeablechallenge.com/" },
    ceiling: {
      name: "Regeneron International Science and Engineering Fair",
      url: "https://www.societyforscience.org/isef/",
      opensAt: 13,
      precedent:
        "Kavya Kopparapu, who built a retinopathy screening tool for her grandfather, ISEF finalist, to Harvard.",
    },
    minAge: 8,
    minAgeBasis: "judgement",
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
    // Challenge instruments, and the floor above is now Challenge's 9 rather than Explore's 6. The
    // two used to disagree: Explore has neither a Robot Game nor a Robot Design rubric, so a
    // six-year-old was priced in at one division and judged by another division's rubric.
    standard: "FLL Robot Game Rulebook, plus Core Values, Innovation and Robot Design rubrics",
    venue: { name: "FIRST LEGO League", url: "https://www.firstinspires.org/robotics/fll" },
    ceiling: {
      name: "FIRST Dean's List Award",
      url: "https://www.firstinspires.org/",
      opensAt: 14,
      precedent:
        "Seth Berg, one of ten inaugural Dean's List winners in 2010, to MIT, reported on the MIT Admissions blog by an officer who was present.",
    },
    minAge: 9,
    minAgeBasis: "verified",
    minAgeQuote:
      "Participants must not be younger than 9 years old or older than 14 years old for US/Canada.",
    minAgeSource:
      "https://firstinspires.blob.core.windows.net/fll/challenge/2024-25/fll-challenge-submerged-participation-rules.pdf",
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
    ceiling: {
      name: "Cliburn International Junior Competition",
      url: "https://cliburn.org/",
      opensAt: 13,
      precedent:
        "Christopher Shin, YoungArts finalist and US Presidential Scholar in the Arts, to Harvard.",
    },
    minAge: 5,
    minAgeBasis: "judgement",
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
    ceiling: {
      name: "Menuhin Competition, Junior division",
      url: "https://menuhincompetition.org/",
      opensAt: 0,
      precedent:
        "Jinan Laurentia Woo, youngest ever first prize at the Johansen International and sole YoungArts Gold 2023, to Yale.",
    },
    minAge: 5,
    minAgeBasis: "judgement",
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
    ceiling: {
      name: "NAfME All-National Jazz Ensemble",
      url: "https://nafme.org/programs/all-national-honor-ensembles/",
      opensAt: 14,
      precedent:
        "Raghav Mehrotra to Harvard, on professional experience rather than competition: principal cast drummer in School of Rock on Broadway.",
    },
    minAge: 5,
    minAgeBasis: "judgement",
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
    ceiling: {
      name: "Guitar Foundation of America International Youth Competition",
      url: "https://guitarfoundation.org/",
      opensAt: 0,
    },
    minAge: 5,
    minAgeBasis: "judgement",
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
    // Was "RSL Vocals / Trinity Initial syllabus", which named two awarding bodies while the venue
    // is one of them. Trinity Initial is Trinity College London's grade and RSL does not judge
    // against it, so a child working to the half of that string that did not belong here would have
    // prepared for an examination nobody was going to give them. The same fault as FLL Explore, and
    // the provenance test in `catalogue.test.ts` now catches this class on sight.
    standard: "RSL Vocals Debut syllabus",
    venue: { name: "RSL Awards Debut", url: "https://www.rslawards.com/" },
    ceiling: {
      name: "YoungArts, Voice",
      url: "https://youngarts.org/",
      opensAt: 15,
      precedent: "Evelyn Carr and Kate Vandermel, both Juilliard Pre-College, to Harvard.",
    },
    minAge: 5,
    minAgeBasis: "judgement",
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
    ceiling: {
      name: "GRAMMY Camp, Music Production",
      url: "https://www.grammymuseum.org/education/grammy-camp/",
      opensAt: 15,
    },
    minAge: 8,
    minAgeBasis: "judgement",
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
    ceiling: {
      name: "YoungArts, Voice - Singer-Songwriter",
      url: "https://youngarts.org/",
      opensAt: 15,
    },
    minAge: 7,
    minAgeBasis: "judgement",
    costUsd: 70,
    cadence: "on-demand",
    reach: "alone",
    region: "international",
    note: "Lowest equipment barrier in the music group: a voice and a phone.",
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
    ceiling: {
      name: "US Presidential Scholar in the Arts, Photography",
      url: "https://youngarts.org/",
      opensAt: 17,
      precedent:
        "Zakiriya Gladney, Presidential Scholar for the series Black Hermeneutics, admitted to Princeton early and chose Harvard.",
    },
    minAge: 5,
    minAgeBasis: "judgement",
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
    // Toyota weights its three criteria equally. The old 33.4/33.3/33.3 was invented precision, and
    // false precision in a standard is worse than vagueness: it implies we read a rubric that says
    // something it does not say.
    standard: "Toyota criteria: message, uniqueness and artistry, weighted equally",
    venue: { name: "Toyota Dream Car Art Contest", url: "https://www.toyota-dreamcarart.com/" },
    ceiling: {
      name: "Scholastic Art Awards, Gold Medal Portfolio",
      url: "https://www.artandwriting.org/",
      opensAt: 13,
      precedent:
        "Matthew Yu, Scholastic Gold Medal, YoungArts Winner with Distinction and Presidential Scholar, to Stanford.",
    },
    minAge: 4,
    minAgeBasis: "judgement",
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
    ceiling: {
      name: "YoungArts, Film",
      url: "https://youngarts.org/",
      opensAt: 15,
      precedent:
        "Ian Kim, YoungArts Winner with Distinction for the stop-motion documentary My Sisters In The Stars and Presidential Scholar, to Harvard in Art, Film and Visual Studies.",
    },
    minAge: 11,
    minAgeBasis: "verified",
    minAgeQuote: "Free to enter, open to anyone 11-22 living in the UK.",
    minAgeSource: "https://younganimator.uk/",
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
    ceiling: {
      name: "US Presidential Scholar in the Arts, Film",
      url: "https://youngarts.org/",
      opensAt: 17,
      precedent:
        "A Presidential Scholar in Film is named every year; Ian Kim's 2024 award was for animation work.",
    },
    minAge: 5,
    minAgeBasis: "verified",
    minAgeQuote: "Filmmakers must be aged between 5-19 years at the time of submitting.",
    minAgeSource: "https://www.intofilm.org/into-film-awards-entry-criteria",
    costUsd: 0,
    cadence: "annual",
    // Into Film requires the submitter to be 20 or over, so a child cannot file this alone.
    reach: "adult-action",
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
      url: "https://kitakyushu-mangataisho.com/",
    },
    ceiling: {
      name: "Scholastic Art Awards, Comic Art",
      url: "https://www.artandwriting.org/",
      opensAt: 13,
    },
    minAge: 6,
    minAgeBasis: "judgement",
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
    ceiling: {
      name: "National Film Festival for Talented Youth, Best Animation",
      url: "https://www.nffty.org/",
      opensAt: 0,
    },
    minAge: 11,
    minAgeBasis: "verified",
    minAgeQuote: "Free to enter, open to anyone 11-22 living in the UK.",
    minAgeSource: "https://younganimator.uk/",
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
    ceiling: {
      name: "First authorship on a peer-reviewed species description",
      url: "https://zookeys.pensoft.net/",
      opensAt: 0,
      precedent:
        "Harper Forbes and Prakrit Jain, 17 and 18, are first authors of the ZooKeys paper naming two scorpion species, found through iNaturalist. They went to Arizona and Berkeley, not to a target school.",
    },
    minAge: 5,
    minAgeBasis: "judgement",
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
    ceiling: {
      name: "ABA Young Birder of the Year",
      url: "https://www.aba.org/aba-young-birder-of-the-year/",
      opensAt: 10,
      precedent:
        "Dessi Sieburth, Young Birder of the Year 2015, to Stanford. Benjamin Van Doren turned migration study into an Intel STS finalist place and went to Cornell.",
    },
    minAge: 13,
    minAgeBasis: "verified",
    minAgeQuote: "If you're under the age of 13, do not use or access our Services.",
    minAgeSource: "https://www.birds.cornell.edu/home/terms-of-use/",
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
    // NO CEILING, DELIBERATELY, and this is the clearest case in the catalogue of what an absent
    // one means. There is nothing above the venue that a child can reach before they apply: a
    // provisional designation is the venue's own output, and the terminal honour — numbering, and
    // the right to name what you found — takes six to ten years and arrives after the application.
    // Of roughly 3,800 to 7,000 provisional detections since 2006, about 100 have ever been
    // numbered. Recording the venue again under a second name would manufacture a ceiling.
    minAge: 10,
    minAgeBasis: "judgement",
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
    ceiling: {
      name: "Regeneron ISEF, Plant Sciences",
      url: "https://www.societyforscience.org/isef/",
      opensAt: 13,
      precedent:
        "Lillian Kay Petersen, Regeneron STS first place for forecasting African crop yields from satellite data, to Harvard. Rohan Wagh, ninth place for a bacteria-powered soil sensor, to MIT. Both computational rather than horticultural.",
    },
    minAge: 8,
    minAgeBasis: "verified",
    minAgeQuote:
      "4-H programs are available for youth and teens ages 8-18. 4-H Cloverbud programs are available for youth ages 5-7.",
    minAgeSource: "https://4-h.org/programs/",
    costUsd: 20,
    cadence: "annual",
    reach: "adult-action",
    region: "us",
    note: "Cloverbuds aged 5-7 are frequently barred from competitive judging, which is the point of entering.",
  },
  {
    id: "variable-stars",
    label: "Watching Stars Change",
    blurb: "Some stars get brighter and dimmer. Write down when.",
    cabin: "science-nature",
    standard: "AAVSO Visual Observing Manual",
    venue: { name: "AAVSO", url: "https://www.aavso.org/" },
    ceiling: {
      name: "A new variable star accepted into the AAVSO Variable Star Index",
      url: "https://www.aavso.org/vsx",
      opensAt: 0,
      precedent:
        "The AAVSO reports that 26% of its 2024 journal articles had student first or corresponding authors, half of them high schoolers.",
    },
    minAge: 10,
    minAgeBasis: "judgement",
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
    ceiling: {
      name: "US Presidential Scholar in the Arts, Writing",
      url: "https://www.artandwriting.org/",
      opensAt: 13,
      precedent:
        "Jessie Leitzel and Isabella Cho, both Presidential Scholars in writing, to Harvard. Amanda Gorman, LA Youth Poet Laureate at 16, to Harvard.",
    },
    minAge: 6,
    minAgeBasis: "judgement",
    costUsd: 25,
    cadence: "continuous",
    // Stone Soup requires a parent or guardian name, email and signature on every submission by a minor.
    reach: "adult-action",
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
    ceiling: {
      name: "NPR Student Podcast Challenge",
      url: "https://www.npr.org/podcastchallenge",
      opensAt: 14,
    },
    minAge: 9,
    minAgeBasis: "verified",
    minAgeQuote:
      "The Contest is open only to individual 4th - 12th grade teachers who are legal residents of the fifty (50) United States.",
    minAgeSource:
      "https://www.npr.org/2018/11/15/662979069/npr-student-podcast-challenge-official-rules",
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
    ceiling: {
      name: "JEA National High School Journalist of the Year",
      url: "https://jea.org/wp/home/awards-honors/",
      opensAt: 14,
      precedent:
        "None at a target school: the last three national winners went to Northwestern, Northwestern and Missouri, which reads as self-selection toward Medill.",
    },
    minAge: 10,
    minAgeBasis: "verified",
    minAgeQuote:
      "Applicants must be between 10 and 14 years old at the start of the school year, or enrolled in fifth through eighth grade.",
    minAgeSource: "https://kpcnotebook.scholastic.com/page/about-scholastic-kids-press",
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
    ceiling: {
      name: "NSDA National Tournament champion",
      url: "https://www.speechanddebate.org/",
      opensAt: 13,
      precedent:
        "Rohan Lingam, 2024 NSDA policy co-champion, stated on the record he would attend Stanford.",
    },
    minAge: 11,
    minAgeBasis: "verified",
    minAgeQuote: "Eligibility: All students currently enrolled in grades 6-12.",
    minAgeSource:
      "https://coolidgefoundation.org/debate/national-debate-tournament-series/coolidge-north-carolina-open/",
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
