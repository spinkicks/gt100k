import { deriveClues, makePuzzle, isSolved, blankGrid, type Cell } from './logic'

const sol = [[true, true, false], [false, true, false], [true, false, true]]

test('deriveClues rows/cols', () => {
  const { rowClues, colClues } = deriveClues(sol)
  expect(rowClues).toEqual([[2], [1], [1, 1]])
  expect(colClues).toEqual([[1, 1], [2], [1]])
})

test('isSolved true when filled matches solution', () => {
  const p = makePuzzle(sol)
  const g: Cell[][] = sol.map((r) => r.map((c) => (c ? 'filled' : 'empty')))
  expect(isSolved(g, p)).toBe(true)
})

test('isSolved false when a filled cell is wrong', () => {
  const p = makePuzzle(sol)
  const g = blankGrid(3)
  g[0]![0] = 'filled'
  expect(isSolved(g, p)).toBe(false)
})
