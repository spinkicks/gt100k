import type { Claim } from "./model.js";

/**
 * Every measurement and recommendation this product makes, with the research behind it.
 *
 * Content rules (see the design doc): `why` is one plain sentence; every `evidence` and
 * `policy` claim carries a resolvable source; every `chosen` claim explains why that value
 * was picked and admits it is a default; limits are stated wherever the evidence is thin,
 * contested, or extrapolated from a different population.
 */
export const CLAIMS: readonly Claim[] = [
  // ---------------------------------------------------------------- Reading the child
  {
    id: "voluntary-returns",
    label: "Voluntary returns",
    area: "Reading the child",
    basis: "evidence",
    band: "adult",
    why: "What a child comes back to on their own, once nobody is prompting them, is the most trustworthy sign of real interest.",
    sources: [
      {
        authors: "Nye, Su, Rounds & Drasgow",
        year: 2012,
        url: "https://doi.org/10.1177/1745691612449021",
      },
      {
        authors: "Harackiewicz, Durik, Barron, Linnenbrink-Garcia & Tauer",
        year: 2008,
        url: "https://doi.org/10.1037/0022-0663.100.1.105",
      },
    ],
    limit:
      "What a child says they like still tells you something, it is just a weaker predictor of what they actually do (roughly r = .20 to .36).",
  },
  {
    id: "prompted-vs-voluntary",
    label: "Voluntary vs prompted",
    area: "Reading the child",
    basis: "evidence",
    band: "adult",
    why: "We separate visits the child chose from visits we nudged them into, because only the unprompted ones tell you the interest is theirs.",
    sources: [
      { authors: "Ryan & Deci", year: 2000, url: "https://doi.org/10.1037/0003-066X.55.1.68" },
      {
        authors: "Nye, Su, Rounds & Drasgow",
        year: 2012,
        url: "https://doi.org/10.1177/1745691612449021",
      },
    ],
    limit:
      "Behaviour that depends on outside pressure tends to stop when the pressure does, which is exactly why the split matters.",
  },
  {
    id: "depth-signals",
    label: "Depth signals",
    area: "Reading the child",
    basis: "evidence",
    band: "6-14",
    why: "Moments where a child redid something nobody asked them to, chose the harder path, or recovered from a failure count for more than simply showing up.",
    sources: [
      { authors: "Kapur", year: 2008, url: "https://doi.org/10.1080/07370000802212669" },
      {
        authors: "Fredricks, Blumenfeld & Paris",
        year: 2004,
        url: "https://doi.org/10.3102/00346543074001059",
      },
    ],
  },
  {
    id: "coverage",
    label: "Coverage",
    area: "Reading the child",
    basis: "evidence",
    band: "adult",
    why: "An empty area means we have not given this child a real chance at it yet, not that they dislike it.",
    sources: [
      { authors: "Hidi & Renninger", year: 2006, url: "https://doi.org/10.1207/s15326985ep4102_4" },
      {
        authors: "O'Keefe, Dweck & Walton",
        year: 2018,
        url: "https://doi.org/10.1177/0956797618780643",
      },
    ],
    limit:
      "Interest is built through repeated, varied exposure, so gaps are a to-do list rather than a result.",
  },
  {
    id: "novelty-discount",
    label: "Novelty discount",
    area: "Reading the child",
    basis: "chosen",
    why: "First-time excitement is cheap, so visits in the first few days after a child meets something new count for less.",
    sources: [],
    limit:
      "The three-day window is our default, picked to be short enough to catch genuine repeat visits. It is not a measured constant.",
  },
  {
    id: "cross-area-comparison",
    label: "Comparing areas",
    area: "Reading the child",
    basis: "evidence",
    band: "9-11",
    why: "Read this as where a child spent time, not as which area they like most, because some activities are simply more appealing regardless of their subject.",
    sources: [
      {
        authors: "Habgood & Ainsworth",
        year: 2011,
        url: "https://doi.org/10.1080/10508406.2010.508029",
      },
      {
        authors: "Nye, Su, Rounds & Drasgow",
        year: 2012,
        url: "https://doi.org/10.1177/1745691612449021",
      },
    ],
    limit:
      "General appeal of the activity itself predicted coming back independently of the subject, and we have no baseline yet to subtract it, so comparisons across areas are confounded.",
  },
  {
    id: "plural-reversible",
    label: "Plural and reversible",
    area: "Reading the child",
    basis: "evidence",
    band: "adult",
    why: "A child can hold more than one interest and can always park one, because the damage attributed to specialising early is really the damage of being locked in.",
    sources: [
      {
        authors: "Vallerand, Blanchard, Mageau et al.",
        year: 2003,
        url: "https://doi.org/10.1037/0022-3514.85.4.756",
      },
      { authors: "Marcia", year: 1966, url: "https://doi.org/10.1037/h0023281" },
      { authors: "Sala & Gobet", year: 2017, url: "https://doi.org/10.1177/0963721417712760" },
    ],
    limit:
      "A second interest is a second real pursuit. Skill does not transfer between unrelated fields on its own.",
  },

  // ---------------------------------------------------------------- How we measure
  {
    id: "confidence-lower-bound",
    label: "Confidence",
    area: "How we measure",
    basis: "chosen",
    why: "We show the cautious end of our estimate rather than the middle, so a read is more likely to understate than overstate what we know.",
    sources: [],
    limit:
      "The threshold at which we call something a spike is our default, not a measured cut-off. It will be re-tuned once real outcomes accumulate.",
  },
  {
    id: "not-sure-yet",
    label: "Not sure yet",
    area: "How we measure",
    basis: "evidence",
    band: "structural",
    why: "When the evidence is thin we say so plainly instead of showing a confident-looking number.",
    sources: [
      {
        authors: "IPCC uncertainty guidance (Mastrandrea et al.)",
        year: 2011,
        url: "https://doi.org/10.1007/s10584-011-0178-6",
      },
    ],
    limit:
      "Where a quantity cannot be estimated honestly, the right answer is to state the evidence and the agreement and give no number at all.",
  },
  {
    id: "no-single-score",
    label: "No single score",
    area: "How we measure",
    basis: "evidence",
    band: "structural",
    why: "We never reduce a child to one number, because a single score invites comparison and ranking rather than a decision about what to do next.",
    sources: [
      {
        authors: "Manolev, Sullivan & Slee",
        year: 2019,
        url: "https://doi.org/10.1080/17439884.2018.1558237",
      },
      { authors: "Mueller & Dweck", year: 1998, url: "https://doi.org/10.1037/0022-3514.75.1.33" },
    ],
  },
  {
    id: "no-gamification",
    label: "No points or streaks",
    area: "How we measure",
    basis: "evidence",
    band: "6-14",
    why: "Rewarding something a child already enjoys reliably reduces how much they choose to do it later, and the effect is worse in children than adults.",
    sources: [
      {
        authors: "Deci, Koestner & Ryan",
        year: 1999,
        url: "https://doi.org/10.1037/0033-2909.125.6.627",
      },
      { authors: "Lepper, Greene & Nisbett", year: 1973, url: "https://doi.org/10.1037/h0035519" },
    ],
    limit:
      "This is debated. Rewards can help start a task a child genuinely does not care about; it is rewards on the thing they already love that backfire (Cameron, Banko & Pierce, 2001).",
  },

  // ---------------------------------------------------------------- Wellbeing
  {
    id: "wellbeing-behaviour-only",
    label: "Behaviour only, never a camera",
    area: "Wellbeing",
    basis: "policy",
    why: "We read what a child does, never their face, because emotion cannot be reliably read from facial expressions and inferring it in schools is prohibited in the EU.",
    sources: [
      {
        authors: "Barrett, Adolphs, Marsella, Martinez & Pollak",
        year: 2019,
        url: "https://doi.org/10.1177/1529100619832930",
      },
      {
        authors: "EU AI Act, Article 5(1)(f)",
        year: 2024,
        url: "https://artificialintelligenceact.eu/article/5/",
      },
    ],
    limit:
      "Behavioural engagement is a different thing from facial emotion, and unlike emotion it is measurable and predicts learning.",
  },
  {
    id: "wellbeing-devaluation",
    label: "Quiet devaluation",
    area: "Wellbeing",
    basis: "evidence",
    band: "12-14",
    why: "A child going quietly through the motions matters more than a child saying they are tired, because that quiet fade is what predicts dropping out.",
    sources: [
      { authors: "Raedeke & Smith", year: 2001, url: "https://doi.org/10.1123/jsep.23.4.281" },
      {
        authors: "Isoard-Gautheur, Guillet-Descas & Gustafsson",
        year: 2016,
        url: "https://doi.org/10.1123/tsp.2014-0140",
      },
    ],
  },
  {
    id: "wellbeing-counter-cyclical",
    label: "Pressure down before challenge down",
    area: "Wellbeing",
    basis: "evidence",
    band: "12-14",
    why: "When the stakes rise we suggest more freedom and less evaluation, which is the opposite of the usual adult reflex to tighten up.",
    sources: [
      {
        authors: "Bartholomew, Ntoumanis, Ryan, Bosch & Thøgersen-Ntoumani",
        year: 2011,
        url: "https://doi.org/10.1177/0146167211413125",
      },
      { authors: "Luthar, Kumar & Zillmer", year: 2020, url: "https://doi.org/10.1037/amp0000556" },
    ],
    limit:
      "Sustained achievement pressure is now recognised as a top adolescent-health risk, which is why this is a default rather than an option.",
  },
  {
    id: "optimal-difficulty",
    label: "Hard but doable",
    area: "Wellbeing",
    basis: "evidence",
    band: "structural",
    why: "Learning is fastest when a child succeeds about 85% of the time, so we aim difficulty at that band rather than at always winning.",
    sources: [
      {
        authors: "Wilson, Shenhav, Straccia & Cohen",
        year: 2019,
        url: "https://doi.org/10.1038/s41467-019-12552-4",
      },
      {
        authors: "Wood, Bruner & Ross",
        year: 1976,
        url: "https://doi.org/10.1111/j.1469-7610.1976.tb00381.x",
      },
    ],
    limit:
      "The 85% figure has never been tested on a child, or on any person. Wilson et al. derived it mathematically for gradient-descent learners and demonstrated it on three simulations: a one-layer Perceptron with artificial stimuli, a two-layer network sorting MNIST handwritten digits, and a model of monkeys learning a Random Dot Motion task. The scaffolding work alongside it studied thirty children aged three to five, below this product's whole range. Treating 85% as a target for a nine-year-old is an extrapolation across species and substrate, not only across age. The idea that difficulty has a sweet spot is well supported; the number is not a finding about children.",
  },

  // ---------------------------------------------------------------- The plan
  {
    id: "plan-stages",
    label: "Staged climb",
    area: "The plan",
    basis: "evidence",
    band: "adult",
    why: "Talent develops in stages, each needing a different kind of teacher, so the plan moves by readiness rather than by age.",
    sources: [
      {
        authors: "Subotnik, Olszewski-Kubilius & Worrell",
        year: 2011,
        url: "https://doi.org/10.1177/1529100611418056",
      },
      {
        authors: "Bloom",
        year: 1985,
        url: "https://www.penguinrandomhouse.com/books/15009/developing-talent-in-young-people-by-benjamin-bloom/",
      },
    ],
    limit:
      "The stages describe childhood but were established from ADULTS looking back: Bloom interviewed roughly 120 people who had already reached world-class level by about 35, and their parents. Nobody watched these stages happen.",
  },
  {
    id: "plan-type-iii",
    label: "Real projects for a real audience",
    area: "The plan",
    basis: "evidence",
    band: "6-14",
    why: "Progress comes from widening who the work is for, not from adding practice hours.",
    sources: [
      {
        authors: "Renzulli",
        year: 1977,
        url: "https://gifted.uconn.edu/schoolwide-enrichment-model/the-enrichment-triad-model/",
      },
      {
        authors: "Macnamara, Hambrick & Oswald",
        year: 2014,
        url: "https://doi.org/10.1177/0956797614535810",
      },
    ],
    limit:
      "Practice matters, but it explains only a limited share of the difference between people, so bounded practice serving a real project beats endless drilling.",
  },
  {
    id: "psychosocial-skills",
    label: "The teachable bottleneck",
    area: "The plan",
    basis: "evidence",
    band: "adult",
    why: "What usually stalls a talented child is a set of learnable skills, like coping with feedback and setting their own goals, not a lack of ability.",
    sources: [
      {
        authors: "MacNamara, Button & Collins",
        year: 2010,
        url: "https://doi.org/10.1123/tsp.24.1.52",
      },
      {
        authors: "Subotnik, Olszewski-Kubilius & Worrell",
        year: 2011,
        url: "https://doi.org/10.1177/1529100611418056",
      },
    ],
    limit:
      "Established on adult elite performers recalling their development (7 world-class athletes aged 21 to 37, then 24 performers aged 25 to 56), not on children being observed. Which of these skills can be taught at 9 rather than recognised at 30 is not something these studies can tell us.",
  },

  // ---------------------------------------------------------------- Family
  {
    id: "family-autonomy-support",
    label: "Autonomy support",
    area: "Family",
    basis: "evidence",
    band: "6-14",
    why: "Families who support a child's own choices grow a calm, durable love of the thing; families who take it over grow an anxious one.",
    sources: [
      {
        authors: "Mageau, Vallerand, Charest et al.",
        year: 2009,
        url: "https://doi.org/10.1111/j.1467-6494.2009.00559.x",
      },
      {
        authors: "Grolnick & Pomerantz",
        year: 2009,
        url: "https://doi.org/10.1111/j.1750-8606.2009.00099.x",
      },
    ],
    limit:
      "Structure is not the same as control. Offering a regular time helps; managing the method does not.",
  },
  {
    id: "family-conditional-regard",
    label: "Warmth that does not depend on results",
    area: "Family",
    basis: "evidence",
    band: "12-14",
    why: "When affection rises and falls with performance it carries real emotional costs, so we watch for it and coach against it.",
    sources: [
      {
        authors: "Assor, Roth & Deci",
        year: 2004,
        url: "https://doi.org/10.1111/j.0022-3506.2004.00256.x",
      },
      {
        authors: "Kim, Wang, Orozco-Lapray, Shen & Murtuza",
        year: 2013,
        url: "https://doi.org/10.1037/a0030612",
      },
    ],
  },
  {
    id: "human-decides",
    label: "A human always decides",
    area: "How we measure",
    basis: "evidence",
    band: "adult",
    why: "The software only ever proposes; a person owns every decision about a child, because human override is what catches the model when it is wrong.",
    sources: [
      {
        authors: "De-Arteaga, Fogliato & Chouldechova",
        year: 2020,
        url: "https://doi.org/10.1145/3313831.3376565",
      },
      {
        authors: "Goddard, Roudsari & Wyatt",
        year: 2012,
        url: "https://doi.org/10.1136/amiajnl-2011-000089",
      },
    ],
    limit:
      "Automation bias is real: prominent advice gets followed more often, correct or not. That is why the numbers here are deliberately not the loudest thing on the screen.",
  },
];

const BY_ID: ReadonlyMap<string, Claim> = new Map(CLAIMS.map((c) => [c.id, c]));

export function claim(id: string): Claim | undefined {
  return BY_ID.get(id);
}

export const AREAS = [
  "Reading the child",
  "How we measure",
  "Wellbeing",
  "The plan",
  "Family",
] as const;
