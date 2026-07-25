import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { PointLight } from 'three'

/**
 * Shared room dimensions (metres). Floor at y=0; the fixed camera sits at z≈4
 * looking toward the back wall at z=ROOM.backZ, so there is deliberately no
 * front wall — the camera is "outside" the open fourth wall looking in.
 */
export const ROOM = {
  halfWidth: 3.5,
  backZ: -3,
  frontZ: 4.4,
  height: 3.4,
  wallThickness: 0.2,
} as const

const WOOD_WALL = '#8a5a3c'
const WOOD_DARK = '#5c3b26'
const FLOOR = '#6b4530'
const BRICK = '#7a4a3a'
const RUG = '#8c2f2f'

/** Self-contained procedural cozy-cabin room: no external textures or models. */
export function Room(): JSX.Element {
  return (
    <group>
      <Floor />
      <BackWall />
      <SideWall side={-1} />
      <SideWall side={1} />
      <Fireplace />
      <Rug />
      <Window />
      <CozyLights />
    </group>
  )
}

function Floor(): JSX.Element {
  const depth = ROOM.frontZ - ROOM.backZ
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, ROOM.backZ + depth / 2]} receiveShadow>
      <planeGeometry args={[ROOM.halfWidth * 2, depth]} />
      <meshStandardMaterial color={FLOOR} roughness={0.85} />
    </mesh>
  )
}

function BackWall(): JSX.Element {
  return (
    <mesh position={[0, ROOM.height / 2, ROOM.backZ]} receiveShadow>
      <boxGeometry args={[ROOM.halfWidth * 2, ROOM.height, ROOM.wallThickness]} />
      <meshStandardMaterial color={WOOD_WALL} roughness={0.9} />
    </mesh>
  )
}

function SideWall({ side }: { side: -1 | 1 }): JSX.Element {
  const depth = ROOM.frontZ - ROOM.backZ
  return (
    <mesh position={[side * ROOM.halfWidth, ROOM.height / 2, ROOM.backZ + depth / 2]} receiveShadow>
      <boxGeometry args={[ROOM.wallThickness, ROOM.height, depth]} />
      <meshStandardMaterial color={WOOD_DARK} roughness={0.9} />
    </mesh>
  )
}

/** Brick fireplace on the back wall with an emissive "embers" panel + a gently flickering point light. */
function Fireplace(): JSX.Element {
  const glowRef = useRef<PointLight>(null)
  useFrame(({ clock }) => {
    const light = glowRef.current
    if (light) {
      const t = clock.elapsedTime
      light.intensity = 1.6 + Math.sin(t * 6) * 0.15 + Math.sin(t * 13.3) * 0.08
    }
  })

  const z = ROOM.backZ + ROOM.wallThickness / 2 + 0.15

  return (
    <group position={[0, 0, z]}>
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[2.2, 1.8, 0.3]} />
        <meshStandardMaterial color={BRICK} roughness={1} />
      </mesh>
      <mesh position={[0, 0.55, 0.05]}>
        <boxGeometry args={[1.3, 1, 0.2]} />
        <meshStandardMaterial color="#241512" roughness={1} />
      </mesh>
      <mesh position={[0, 0.35, 0.16]}>
        <boxGeometry args={[1.1, 0.5, 0.05]} />
        <meshStandardMaterial color="#ff7a30" emissive="#ff5a10" emissiveIntensity={1.8} />
      </mesh>
      <pointLight ref={glowRef} position={[0, 0.6, 0.6]} color="#ff9d52" intensity={1.6} distance={6} decay={2} />
      <mesh position={[0, 1.85, 0.05]}>
        <boxGeometry args={[2.4, 0.15, 0.4]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.7} />
      </mesh>
    </group>
  )
}

function Rug(): JSX.Element {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, ROOM.backZ + 1.6]}>
      <circleGeometry args={[1.4, 32]} />
      <meshStandardMaterial color={RUG} roughness={0.95} />
    </mesh>
  )
}

/** A warm-glowing window set into the right-hand side wall. */
function Window(): JSX.Element {
  const x = ROOM.halfWidth - ROOM.wallThickness / 2 - 0.01
  return (
    <group position={[x, 1.7, ROOM.backZ + 1.4]} rotation={[0, -Math.PI / 2, 0]}>
      <mesh>
        <boxGeometry args={[1.1, 1.3, 0.08]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.05]}>
        <planeGeometry args={[0.9, 1.1]} />
        <meshStandardMaterial color="#8fb3d9" emissive="#7fa8d0" emissiveIntensity={0.5} />
      </mesh>
    </group>
  )
}

function CozyLights(): JSX.Element {
  return (
    <>
      <ambientLight intensity={0.35} color="#ffdcb0" />
      <hemisphereLight args={['#4a3626', '#1a1310', 0.4]} />
      <pointLight position={[0, 2.6, 1]} intensity={0.5} color="#ffdcb0" distance={8} decay={2} />
    </>
  )
}
