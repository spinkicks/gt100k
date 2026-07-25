import { useEffect, useRef, useState } from 'react'
import type { PuzzleProps } from '../../game/types'
import { SPORTS_PUZZLE, emptyMarks, isSolved, key, type Mark, type MarkGrid } from './logic'
import './LogicGrid.css'

const next = (m: Mark): Mark => (m === 'unknown' ? 'yes' : m === 'yes' ? 'no' : 'unknown')

const symbol = (m: Mark): string => (m === 'yes' ? '✓' : m === 'no' ? '✗' : '')

export default function LogicGrid({ onSolved, onExit }: PuzzleProps) {
  const puzzle = SPORTS_PUZZLE
  const [marks, setMarks] = useState<MarkGrid>(() => emptyMarks(puzzle))
  const solvedRef = useRef(false)

  useEffect(() => {
    if (!solvedRef.current && isSolved(marks, puzzle)) {
      solvedRef.current = true
      onSolved()
    }
  }, [marks, puzzle, onSolved])

  const cycle = (e: string, c: string, v: string) => {
    const k = key(e, c, v)
    setMarks((m) => ({ ...m, [k]: next(m[k]!) }))
  }

  return (
    <div className="lg">
      <button type="button" className="lg-exit" onClick={onExit}>
        ← Back
      </button>
      <ul className="lg-clues">
        {puzzle.clues.map((clue, i) => (
          <li key={i}>{clue}</li>
        ))}
      </ul>
      <table className="lg-table">
        <thead>
          <tr>
            <th className="lg-corner" />
            {puzzle.categories.map((cat) =>
              cat.values.map((v) => (
                <th key={`${cat.name}-${v}`} className="lg-col-head">
                  {v}
                </th>
              )),
            )}
          </tr>
        </thead>
        <tbody>
          {puzzle.entities.map((e) => (
            <tr key={e}>
              <th className="lg-row-head">{e}</th>
              {puzzle.categories.map((cat) =>
                cat.values.map((v) => {
                  const k = key(e, cat.name, v)
                  const mark = marks[k]!
                  return (
                    <td key={k} className="lg-td">
                      <button
                        type="button"
                        className={`lg-cell lg-${mark}`}
                        data-cell={k}
                        aria-label={`${e} ${cat.name} ${v}`}
                        onClick={() => cycle(e, cat.name, v)}
                      >
                        {symbol(mark)}
                      </button>
                    </td>
                  )
                }),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
