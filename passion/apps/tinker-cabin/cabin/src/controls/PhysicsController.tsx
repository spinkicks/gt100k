import { useFrame, useThree } from "@react-three/fiber";
/**
 * First-person physics character controller (@react-three/rapier). A kinematic capsule does real
 * collide-and-slide against the room walls + props with gravity, driven by the shared intent layer;
 * the camera follows the capsule. Only mounted in free-walk mode — the harness pins the camera and
 * never instantiates physics, so screenshots stay deterministic.
 */
import {
  CapsuleCollider,
  CuboidCollider,
  type RapierRigidBody,
  RigidBody,
  useRapier,
} from "@react-three/rapier";
import { type MutableRefObject, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { ANCHORS, ROOM } from "../scene/layout";
import { KeyboardPointerSource, type MoveIntent } from "./intent";

// capsule (halfHeight 0.45 + radius 0.32) rests with its centre ~0.77m up, so EYE≈0.9 → ~1.65m eye
const EYE = 0.9;

/** Static colliders approximating the room shell + the big props the player can bump into. */
export function RoomColliders(): JSX.Element {
  const { hx, hz, height } = ROOM;
  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[hx, 0.1, hz]} position={[0, -0.1, 0]} /> {/* floor */}
      <CuboidCollider args={[hx, height / 2, 0.15]} position={[0, height / 2, -hz]} /> {/* back */}
      <CuboidCollider args={[hx, height / 2, 0.15]} position={[0, height / 2, hz]} /> {/* front */}
      <CuboidCollider args={[0.15, height / 2, hz]} position={[-hx, height / 2, 0]} /> {/* left */}
      <CuboidCollider args={[0.15, height / 2, hz]} position={[hx, height / 2, 0]} /> {/* right */}
      {/* fireplace + hearth block */}
      <CuboidCollider args={[1.2, 1.1, 0.5]} position={[ANCHORS.fireplace[0], 1.1, -hz + 0.55]} />
      {/* desk block */}
      <CuboidCollider
        args={[0.4, 0.75, 0.85]}
        position={[ANCHORS.desk[0] + 0.2, 0.75, ANCHORS.desk[2]]}
      />
    </RigidBody>
  );
}

export function PhysicsController({
  intentRef,
}: { intentRef: MutableRefObject<MoveIntent> }): JSX.Element {
  const { camera, gl } = useThree();
  const { world } = useRapier();
  const body = useRef<RapierRigidBody>(null);
  const yaw = useRef(0);
  const pitch = useRef(-0.03);
  const vy = useRef(0);

  const controller = useMemo(() => {
    const c = world.createCharacterController(0.02);
    c.enableAutostep(0.35, 0.2, true);
    c.enableSnapToGround(0.4);
    c.setMaxSlopeClimbAngle((50 * Math.PI) / 180);
    return c;
  }, [world]);

  useEffect(() => {
    const src = new KeyboardPointerSource();
    src.attach(gl.domElement, intentRef.current);
    return () => {
      src.detach();
      world.removeCharacterController(controller);
    };
  }, [gl, intentRef, world, controller]);

  useFrame((_, dt) => {
    const it = intentRef.current;
    yaw.current += it.dyaw;
    pitch.current = Math.max(-1.4, Math.min(1.4, pitch.current + it.dpitch));
    it.dyaw = 0;
    it.dpitch = 0;
    camera.quaternion.setFromEuler(new THREE.Euler(pitch.current, yaw.current, 0, "YXZ"));

    const rb = body.current;
    if (!rb) return;
    const step = Math.min(dt, 0.05);
    const speed = (it.sprint ? 4.4 : 2.4) * step;
    const sin = Math.sin(yaw.current);
    const cos = Math.cos(yaw.current);
    vy.current = Math.max(-8, vy.current - 9.81 * step);
    const desired = {
      x: (-sin * it.forward + cos * it.strafe) * speed,
      y: vy.current * step,
      z: (-cos * it.forward - sin * it.strafe) * speed,
    };
    const collider = rb.collider(0);
    controller.computeColliderMovement(collider, desired);
    if (controller.computedGrounded()) vy.current = 0;
    const m = controller.computedMovement();
    const t = rb.translation();
    const nx = t.x + m.x;
    const ny = t.y + m.y;
    const nz = t.z + m.z;
    rb.setNextKinematicTranslation({ x: nx, y: ny, z: nz });
    camera.position.set(nx, ny + EYE, nz);
  });

  const [sx, , sz] = ANCHORS.spawn;
  return (
    <RigidBody ref={body} type="kinematicPosition" colliders={false} position={[sx, 0.9, sz]}>
      <CapsuleCollider args={[0.45, 0.32]} />
    </RigidBody>
  );
}
