import type { TopicId } from '../game/types'
import { gadgetsForTopic } from '../gadgets/registry'
import { useGame } from '../game/store'
import { hotspotStyle } from './hotspots'
import './CabinStatic.css'

/**
 * Static-image cabin backend: a background cabin illustration with
 * absolutely-positioned gadget hotspot buttons layered on top. The image
 * itself is decorative — if `/art/cabin-${topic}.png` 404s (art is generated
 * in a later task), the container's fallback background color keeps the
 * scene looking intentional and never blocks the hotspot layer.
 */
export const CabinStatic: React.FC<{ topic: TopicId }> = ({ topic }) => {
  const gadgets = gadgetsForTopic(topic)

  return (
    <div className="cabin-static">
      <img className="cabin-static-bg" src={`/art/cabin-${topic}.png`} alt="" aria-hidden="true" />
      {gadgets.map((gadget) => {
        const isComingSoon = gadget.status === 'coming-soon'
        return (
          <button
            key={gadget.id}
            type="button"
            className={`cabin-static-hotspot${isComingSoon ? ' coming-soon' : ''}`}
            style={hotspotStyle(gadget)}
            data-gadget={gadget.id}
            onClick={() => useGame.getState().focusGadget(gadget.id)}
          >
            {gadget.hotspot.label}
            {isComingSoon ? <span className="cabin-static-hotspot-badge">soon</span> : null}
          </button>
        )
      })}
    </div>
  )
}

export default CabinStatic
