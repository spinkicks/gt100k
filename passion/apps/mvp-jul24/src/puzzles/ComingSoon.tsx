import type { PuzzleProps } from '../game/types'

export default function ComingSoon({ onExit }: PuzzleProps) {
  return (
    <div className="coming-soon">
      <button type="button" className="coming-soon-exit" onClick={onExit}>
        ← Back
      </button>
      <p className="coming-soon-message">Coming soon</p>
    </div>
  )
}
