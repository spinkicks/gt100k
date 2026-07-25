// Hand-authored 5x5 nonogram solutions. `true` = filled cell.
// seed % PUZZLES.length picks one (see Nonogram.tsx).

const PLUS: boolean[][] = [
  [false, false, true, false, false],
  [false, false, true, false, false],
  [true, true, true, true, true],
  [false, false, true, false, false],
  [false, false, true, false, false],
]

const DIAMOND: boolean[][] = [
  [false, false, true, false, false],
  [false, true, false, true, false],
  [true, false, false, false, true],
  [false, true, false, true, false],
  [false, false, true, false, false],
]

export const PUZZLES: boolean[][][] = [PLUS, DIAMOND]
