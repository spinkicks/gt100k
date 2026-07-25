import { useGame } from '../game/store'
import Cabin3D from './Cabin3D'
import CabinStatic from './CabinStatic'
import './CabinView.css'

/**
 * Picks the cabin backend (3D scene vs. static illustration) for the currently
 * open cabin, and exposes a small A/B toggle so either backend can be spot-checked
 * without leaving the screen. Renders nothing when no cabin is open.
 */
export const CabinView: React.FC = () => {
  const cabinId = useGame((s) => s.cabinId)
  const cabinBackend = useGame((s) => s.cabinBackend)

  if (!cabinId) return null

  const otherBackend = cabinBackend === '3d' ? 'static' : '3d'

  return (
    <div className="cabin-view">
      <button
        type="button"
        className="cabin-view-ab-toggle"
        onClick={() => useGame.getState().setBackend(otherBackend)}
      >
        Mode: {cabinBackend}
      </button>
      {cabinBackend === '3d' ? <Cabin3D topic={cabinId} /> : <CabinStatic topic={cabinId} />}
    </div>
  )
}

export default CabinView
