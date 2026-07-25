import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import type { PuzzleProps } from '../../game/types'
import { blankGrid, isSolved, makePuzzle, type Cell } from './logic'
import { PUZZLES } from './puzzles.data'
import './Nonogram.css'

const next = (c: Cell): Cell => (c === 'empty' ? 'filled' : c === 'filled' ? 'crossed' : 'empty')

const clueText = (clue: number[]): string => (clue.length === 1 && clue[0] === 0 ? '' : clue.join(' '))

export default function Nonogram({ seed, onSolved, onExit }: PuzzleProps) {
  const puzzle = useMemo(() => makePuzzle(PUZZLES[seed % PUZZLES.length]!), [seed])
  const [grid, setGrid] = useState<Cell[][]>(() => blankGrid(puzzle.size))
  const solvedRef = useRef(false)

  // Reset the board whenever a new puzzle is loaded (seed change).
  useEffect(() => {
    setGrid(blankGrid(puzzle.size))
    solvedRef.current = false
  }, [puzzle])

  useEffect(() => {
    if (!solvedRef.current && isSolved(grid, puzzle)) {
      solvedRef.current = true
      onSolved()
    }
  }, [grid, puzzle, onSolved])

  const toggle = (r: number, c: number) => {
    setGrid((g) => g.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? next(cell) : cell)) : row)))
  }

  return (
    <div className="ng">
      <button type="button" className="ng-exit" onClick={onExit}>
        ← Back
      </button>
      <div
        className="ng-board"
        style={{ gridTemplateColumns: `auto repeat(${puzzle.size}, 2.5rem)`, gridTemplateRows: `auto repeat(${puzzle.size}, 2.5rem)` }}
      >
        <div className="ng-cell ng-corner" />
        {puzzle.colClues.map((clue, c) => (
          <div key={`col-${c}`} className="ng-cell ng-clue ng-clue-col">
            {clue.map((n, i) => (
              <span key={i}>{n}</span>
            ))}
          </div>
        ))}
        {grid.map((row, r) => (
          <Fragment key={`row-${r}`}>
            <div className="ng-cell ng-clue ng-clue-row">{clueText(puzzle.rowClues[r]!)}</div>
            {row.map((cell, c) => (
              <button
                key={`${r}-${c}`}
                type="button"
                className={`ng-cell ng-grid-cell ng-${cell}`}
                data-fill={puzzle.solution[r]![c] ? '1' : '0'}
                aria-label={`row ${r + 1} column ${c + 1}`}
                onClick={() => toggle(r, c)}
              />
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
