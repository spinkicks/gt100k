// Procedural Logic-Grid (zebra deduction) puzzle generator: gives the
// subgame effectively unlimited themed puzzles instead of the single
// hand-authored SPORTS_PUZZLE in logic.ts.
//
// Algorithm:
//   1. Pick a kid-friendly theme (entity name pool + several category
//      definitions with natural-language phrasing) and, from it, N=4
//      entities and M=3 (easy) or M=4 (hard) categories.
//   2. Build a uniformly random solution: an independent random bijection
//      entities <-> values for each category.
//   3. Generate a pool of natural-language clues that are all TRUE of that
//      solution (direct, negative, and cross-category/relational).
//   4. Verify the full pool pins a unique solution, then greedily drop
//      clues (in random order) while `countSolutions` still reports exactly
//      one candidate solution, leaving a minimal, uniquely-solvable set.
// Determinism comes entirely from the seed via a seeded PRNG — no clue ever
// depends on Math.random.
import type { Category, LogicPuzzle } from "./logic";
// The app's one seeded PRNG. Its exact arithmetic decides which puzzles this file produces, so see
// the warning in src/lib/rng.ts before touching it.
import { mulberry32 } from "../../lib/rng";

export type Difficulty = "easy" | "hard";

/** Deterministically combine a base seed with a "which puzzle this session"
 * counter, so the same `seed` prop stays reproducible for tests while a
 * bumped counter (e.g. from a "Next puzzle" click) always yields a
 * different generated puzzle. Mirrors Pipes/generate.ts's nextSeed. */
export function nextSeed(seed: number, counter: number): number {
  return (Math.imul(seed ^ 0x9e3779b9, counter + 1) + counter * 0x2545f491) >>> 0;
}

function randInt(rng: () => number, n: number): number {
  return Math.floor(rng() * n);
}

function shuffled<T>(rng: () => number, arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(rng, i + 1);
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function pickN<T>(rng: () => number, arr: readonly T[], n: number): T[] {
  return shuffled(rng, arr).slice(0, n);
}

/** Number of entities per puzzle. Fixed per the spec: small enough that
 * brute-forcing all (N!)^M candidate solutions is trivial. */
const N = 4;

// ---------------------------------------------------------------------------
// Themes: each supplies a pool of entity names plus several category
// definitions with natural-language phrasing hooks. A puzzle picks N names
// and M categories from a single theme so the whole grid reads as one
// coherent kid-friendly scenario.
// ---------------------------------------------------------------------------

interface ThemeCategory {
  name: string;
  /** Exactly N distinct values, as shown in the grid header. */
  values: string[];
  /** Base-form verb, used after "does not", e.g. "have", "play", "like". */
  verbBase: string;
  /** Third-person-singular form, e.g. "has", "plays", "likes". */
  verbThird: string;
  /** Renders a value as the object of the verb, e.g. "the dog", "soccer". */
  noun: (value: string) => string;
}

interface Theme {
  id: string;
  entityPool: string[];
  categories: ThemeCategory[];
}

const lower = (v: string) => v.toLowerCase();
const theNoun = (v: string) => `the ${v.toLowerCase()}`;

const THEMES: Theme[] = [
  {
    id: "playground",
    entityPool: ["Ava", "Ben", "Cleo", "Dee", "Eli", "Fay"],
    categories: [
      {
        name: "Pet",
        values: ["Dog", "Cat", "Fish", "Bird"],
        verbBase: "have",
        verbThird: "has",
        noun: theNoun,
      },
      {
        name: "Sport",
        values: ["Soccer", "Tennis", "Swimming", "Karate"],
        verbBase: "practice",
        verbThird: "practices",
        noun: lower,
      },
      {
        name: "Color",
        values: ["Red", "Blue", "Green", "Yellow"],
        verbBase: "like",
        verbThird: "likes",
        noun: lower,
      },
      {
        name: "Fruit",
        values: ["Apple", "Banana", "Grape", "Mango"],
        verbBase: "like",
        verbThird: "likes",
        noun: theNoun,
      },
    ],
  },
  {
    id: "space-camp",
    entityPool: ["Mia", "Sam", "Lily", "Noah", "Kira", "Theo"],
    categories: [
      {
        name: "Vehicle",
        values: ["Rocket", "Rover", "Shuttle", "Satellite"],
        verbBase: "pilot",
        verbThird: "pilots",
        noun: theNoun,
      },
      {
        name: "Snack",
        values: ["Cookies", "Crackers", "Popcorn", "Pretzels"],
        verbBase: "pack",
        verbThird: "packs",
        noun: lower,
      },
      {
        name: "Planet",
        values: ["Mars", "Venus", "Jupiter", "Saturn"],
        verbBase: "study",
        verbThird: "studies",
        noun: (v) => v,
      },
      {
        name: "Badge",
        values: ["Pilot", "Navigator", "Engineer", "Scientist"],
        verbBase: "earn",
        verbThird: "earns",
        noun: (v) => `the ${v.toLowerCase()} badge`,
      },
    ],
  },
  {
    id: "backyard-chefs",
    entityPool: ["Zoe", "Max", "Ivy", "Leo", "Priya", "Owen"],
    categories: [
      {
        name: "Dish",
        values: ["Pizza", "Tacos", "Pasta", "Sushi"],
        verbBase: "cook",
        verbThird: "cooks",
        noun: (v) => v,
      },
      {
        name: "Fruit",
        values: ["Apple", "Mango", "Kiwi", "Peach"],
        verbBase: "pick",
        verbThird: "picks",
        noun: theNoun,
      },
      {
        name: "Drink",
        values: ["Lemonade", "Milk", "Juice", "Water"],
        verbBase: "pour",
        verbThird: "pours",
        noun: lower,
      },
      {
        name: "Apron",
        values: ["Red", "Blue", "Green", "Yellow"],
        verbBase: "wear",
        verbThird: "wears",
        noun: (v) => `a ${v.toLowerCase()} apron`,
      },
    ],
  },
  {
    id: "music-band",
    entityPool: ["Nina", "Jax", "Ruth", "Cole", "Amara", "Diego"],
    categories: [
      {
        name: "Instrument",
        values: ["Guitar", "Drums", "Piano", "Violin"],
        verbBase: "play",
        verbThird: "plays",
        noun: theNoun,
      },
      {
        name: "Genre",
        values: ["Rock", "Jazz", "Pop", "Folk"],
        verbBase: "love",
        verbThird: "loves",
        noun: lower,
      },
      {
        name: "Practice Day",
        values: ["Monday", "Wednesday", "Friday", "Saturday"],
        verbBase: "practice",
        verbThird: "practices",
        noun: (v) => `on ${v}`,
      },
      {
        name: "Mascot",
        values: ["Fox", "Owl", "Wolf", "Otter"],
        verbBase: "choose",
        verbThird: "chooses",
        noun: (v) => `the ${v.toLowerCase()} mascot`,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Clue specs: each pairs the rendered clue text with a predicate that can
// check it against any candidate solution, via a `getValue(entity, category)`
// lookup. The predicate is what `countSolutions` uses to brute-force
// uniqueness; the text is what's rendered in the UI.
// ---------------------------------------------------------------------------

export type GetValue = (entity: string, categoryName: string) => string;

export interface ClueSpec {
  text: string;
  /** Names of the categories this clue's `test` reads via `getValue`. Lets
   * `countSolutions` check (and prune on) a clue as soon as every category
   * it depends on has been fixed, instead of only at a full leaf. */
  categories: string[];
  test: (getValue: GetValue) => boolean;
}

export interface Structure {
  entities: string[];
  categories: Category[];
}

function directClue(entity: string, cat: ThemeCategory, value: string, negate: boolean): ClueSpec {
  if (!negate) {
    return {
      text: `${entity} ${cat.verbThird} ${cat.noun(value)}.`,
      categories: [cat.name],
      test: (getValue) => getValue(entity, cat.name) === value,
    };
  }
  return {
    text: `${entity} does not ${cat.verbBase} ${cat.noun(value)}.`,
    categories: [cat.name],
    test: (getValue) => getValue(entity, cat.name) !== value,
  };
}

function crossClue(
  entities: string[],
  catA: ThemeCategory,
  valueA: string,
  catB: ThemeCategory,
  valueB: string,
  negate: boolean,
): ClueSpec {
  const owner = (getValue: GetValue) => entities.find((e) => getValue(e, catA.name) === valueA)!;
  if (!negate) {
    return {
      text: `Whoever ${catA.verbThird} ${catA.noun(valueA)} ${catB.verbThird} ${catB.noun(valueB)}.`,
      categories: [catA.name, catB.name],
      test: (getValue) => getValue(owner(getValue), catB.name) === valueB,
    };
  }
  return {
    text: `Whoever ${catA.verbThird} ${catA.noun(valueA)} does not ${catB.verbBase} ${catB.noun(valueB)}.`,
    categories: [catA.name, catB.name],
    test: (getValue) => getValue(owner(getValue), catB.name) !== valueB,
  };
}

function identityClue(
  entities: string[],
  catA: ThemeCategory,
  valueA: string,
  target: string,
): ClueSpec {
  return {
    text: `Whoever ${catA.verbThird} ${catA.noun(valueA)} is not ${target}.`,
    categories: [catA.name],
    test: (getValue) => entities.find((e) => getValue(e, catA.name) === valueA)! !== target,
  };
}

/** Build the pool of every candidate TRUE clue for a solution, mixing
 * direct, negative, cross-category, and identity-style relational clues. */
function buildCluePool(
  rng: () => number,
  entities: string[],
  categories: ThemeCategory[],
  solution: Record<string, Record<string, string>>,
): ClueSpec[] {
  const pool: ClueSpec[] = [];

  for (const cat of categories) {
    for (const entity of entities) {
      const value = solution[entity]![cat.name]!;
      pool.push(directClue(entity, cat, value, false));
      const wrong = cat.values.filter((v) => v !== value);
      pool.push(directClue(entity, cat, wrong[randInt(rng, wrong.length)]!, true));
    }
  }

  for (const catA of categories) {
    for (const catB of categories) {
      if (catA === catB) continue;
      for (const entity of entities) {
        const valueA = solution[entity]![catA.name]!;
        const valueB = solution[entity]![catB.name]!;
        pool.push(crossClue(entities, catA, valueA, catB, valueB, false));
        const wrong = catB.values.filter((v) => v !== valueB);
        pool.push(
          crossClue(entities, catA, valueA, catB, wrong[randInt(rng, wrong.length)]!, true),
        );
      }
    }
  }

  for (const cat of categories) {
    for (const entity of entities) {
      const value = solution[entity]![cat.name]!;
      const others = entities.filter((e) => e !== entity);
      pool.push(identityClue(entities, cat, value, others[randInt(rng, others.length)]!));
    }
  }

  return pool;
}

/** Brute-force count of candidate solutions (over all (N!)^M relative
 * bijections) satisfying every clue, capped early once `cap` is reached —
 * callers only ever need to know "is it exactly 1". Clues are bucketed by
 * the last category (in `structure.categories` order) they depend on and
 * checked as soon as that category is fixed during the search, so a single
 * failing direct clue prunes a whole subtree of the (N!)^M search space
 * instead of only being caught at a full leaf assignment. */
export function countSolutions(clues: ClueSpec[], structure: Structure, cap = 2): number {
  const { entities, categories } = structure;
  const entityIndex = new Map(entities.map((e, i) => [e, i]));
  const catIndex = new Map(categories.map((c, i) => [c.name, i]));
  const perms = permutations(entities.length);

  const combo: number[][] = new Array(categories.length);
  const getValue: GetValue = (entity, categoryName) => {
    const ci = catIndex.get(categoryName)!;
    const ei = entityIndex.get(entity)!;
    return categories[ci]!.values[combo[ci]![ei]!]!;
  };

  const buckets: ClueSpec[][] = categories.map(() => []);
  for (const clue of clues) {
    let maxPos = 0;
    for (const catName of clue.categories) {
      const p = catIndex.get(catName);
      if (p !== undefined && p > maxPos) maxPos = p;
    }
    buckets[maxPos]!.push(clue);
  }

  let count = 0;
  const rec = (pos: number): void => {
    if (count >= cap) return;
    if (pos === categories.length) {
      count++;
      return;
    }
    const bucket = buckets[pos]!;
    for (const perm of perms) {
      combo[pos] = perm;
      let ok = true;
      for (const clue of bucket) {
        if (!clue.test(getValue)) {
          ok = false;
          break;
        }
      }
      if (ok) {
        rec(pos + 1);
        if (count >= cap) return;
      }
    }
  };
  rec(0);
  return count;
}

/** `solve` — brute-force whether a clue set pins exactly one solution. */
export function solve(clues: ClueSpec[], structure: Structure): number {
  return countSolutions(clues, structure, 2);
}

const permCache = new Map<number, number[][]>();
function permutations(n: number): number[][] {
  const cached = permCache.get(n);
  if (cached) return cached;
  const result: number[][] = [];
  const used = new Array<boolean>(n).fill(false);
  const cur: number[] = [];
  const rec = () => {
    if (cur.length === n) {
      result.push(cur.slice());
      return;
    }
    for (let i = 0; i < n; i++) {
      if (used[i]) continue;
      used[i] = true;
      cur.push(i);
      rec();
      cur.pop();
      used[i] = false;
    }
  };
  rec();
  permCache.set(n, result);
  return result;
}

export interface GeneratedPuzzleData {
  entities: string[];
  categories: Category[];
  solution: Record<string, Record<string, string>>;
  clueSpecs: ClueSpec[];
}

/** Core generator, exposed separately from `generatePuzzle` so tests can
 * verify uniqueness directly against the structured clue predicates that
 * back each rendered clue string. */
export function buildPuzzleData(
  seed: number,
  difficulty: Difficulty = "easy",
): GeneratedPuzzleData {
  const rng = mulberry32(seed);
  const theme = THEMES[randInt(rng, THEMES.length)]!;
  const entities = pickN(rng, theme.entityPool, N);
  const m = difficulty === "hard" ? Math.min(4, theme.categories.length) : 3;
  const themeCategories = pickN(rng, theme.categories, m);

  const solution: Record<string, Record<string, string>> = {};
  for (const e of entities) solution[e] = {};
  const categories: Category[] = [];
  for (const cat of themeCategories) {
    const values = shuffled(rng, cat.values);
    categories.push({ name: cat.name, values });
    const assignment = shuffled(rng, values);
    for (let i = 0; i < entities.length; i++) {
      solution[entities[i]!]![cat.name] = assignment[i]!;
    }
  }

  const structure: Structure = { entities, categories };
  // The pool always includes every direct+ clue (one per entity/category),
  // which alone fully pins the solution — so the full pool is guaranteed to
  // yield a unique solution before any minimization starts.
  const pool = shuffled(rng, buildCluePool(rng, entities, themeCategories, solution));
  if (countSolutions(pool, structure) !== 1) {
    throw new Error("Logic-Grid generator: full clue pool did not pin a unique solution");
  }

  // Greedily drop clues (visiting them in a random order, by identity) while
  // the remaining set still pins exactly one solution.
  let kept = pool.slice();
  const dropOrder = shuffled(rng, pool);
  for (const candidateClue of dropOrder) {
    const withoutOne = kept.filter((c) => c !== candidateClue);
    if (withoutOne.length === kept.length) continue; // already dropped earlier
    if (countSolutions(withoutOne, structure) === 1) {
      kept = withoutOne;
    }
  }

  return { entities, categories, solution, clueSpecs: kept };
}

export function generatePuzzle(seed: number, difficulty: Difficulty = "easy"): LogicPuzzle {
  const { entities, categories, solution, clueSpecs } = buildPuzzleData(seed, difficulty);
  return {
    entities,
    categories,
    clues: clueSpecs.map((c) => c.text),
    solution,
  };
}
