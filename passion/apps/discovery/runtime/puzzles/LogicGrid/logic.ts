export interface Category {
  name: string;
  values: string[];
}

export interface LogicPuzzle {
  entities: string[];
  categories: Category[];
  clues: string[];
  solution: Record<string, Record<string, string>>;
}

export type Mark = "unknown" | "yes" | "no";
export type MarkGrid = Record<string, Mark>;

export const key = (e: string, c: string, v: string) => `${e}|${c}|${v}`;

export function emptyMarks(p: LogicPuzzle): MarkGrid {
  const m: MarkGrid = {};
  for (const e of p.entities) {
    for (const cat of p.categories) {
      for (const v of cat.values) {
        m[key(e, cat.name, v)] = "unknown";
      }
    }
  }
  return m;
}

export function isSolved(marks: MarkGrid, p: LogicPuzzle): boolean {
  for (const e of p.entities) {
    for (const cat of p.categories) {
      for (const v of cat.values) {
        const want: Mark = p.solution[e]![cat.name] === v ? "yes" : "no";
        if (marks[key(e, cat.name, v)] !== want) return false;
      }
    }
  }
  return true;
}

export const SPORTS_PUZZLE: LogicPuzzle = {
  entities: ["Brad", "Jenny", "Frank", "Susan"],
  categories: [
    {
      name: "Sport",
      values: ["Basketball", "Baseball", "Volleyball", "Soccer"],
    },
  ],
  clues: [
    "Brad plays a sport whose name starts with the letter B.",
    "Jenny is known for kicking the ball.",
    "Frank hit home-runs in his sport.",
  ],
  solution: {
    Brad: { Sport: "Basketball" },
    Jenny: { Sport: "Soccer" },
    Frank: { Sport: "Baseball" },
    Susan: { Sport: "Volleyball" },
  },
};
