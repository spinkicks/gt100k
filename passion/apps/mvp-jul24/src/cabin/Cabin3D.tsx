import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import type { TopicId } from '../game/types'
import { gadgetAnchors } from './scene3d/anchors'
import { GadgetMarker } from './scene3d/GadgetMarker'
import { Room } from './scene3d/Room'

/**
 * 3D cabin backend: a fixed-camera, procedurally-built cozy room (warm wood walls + floor,
 * a glowing brick fireplace, a rug and window — all `three.js` primitives + `MeshStandardMaterial`,
 * no external textures/models) with drei `<Html>` "+" markers over each gadget's wall anchor.
 * The camera is static — no OrbitControls/PointerLock/WASD/physics; the view never moves.
 */
export const Cabin3D: React.FC<{ topic: TopicId }> = ({ topic }) => {
  const anchors = gadgetAnchors(topic)

  return (
    <div className="cabin3d-canvas-wrap" style={{ width: '100%', height: '100%' }}>
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 1.5, 4]} fov={60} />
        <Suspense fallback={null}>
          <Room />
          {anchors.map((anchor) => (
            <GadgetMarker key={anchor.id} anchor={anchor} />
          ))}
        </Suspense>
      </Canvas>
    </div>
  )
}

export default Cabin3D
