export type Cell = "empty" | "filled" | "crossed";

export interface NonogramPuzzle {
  size: number;
  solution: boolean[][];
  rowClues: number[][];
  colClues: number[][];
}

const runs = (line: boolean[]): number[] => {
  const out: number[] = [];
  let n = 0;
  for (const v of line) {
    if (v) n++;
    else if (n) {
      out.push(n);
      n = 0;
    }
  }
  if (n) out.push(n);
  return out.length ? out : [0];
};

export function deriveClues(solution: boolean[][]) {
  const rowClues = solution.map(runs);
  const firstRow = solution[0];
  const colClues = firstRow ? firstRow.map((_, c) => runs(solution.map((r) => r[c]!))) : [];
  return { rowClues, colClues };
}

export function makePuzzle(solution: boolean[][]): NonogramPuzzle {
  return { size: solution.length, solution, ...deriveClues(solution) };
}

export function blankGrid(size: number): Cell[][] {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => "empty" as Cell));
}

export function isSolved(grid: Cell[][], p: NonogramPuzzle): boolean {
  for (let r = 0; r < p.size; r++)
    for (let c = 0; c < p.size; c++)
      if ((grid[r]?.[c] === "filled") !== p.solution[r]?.[c]) return false;
  return true;
}
