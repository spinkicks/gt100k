/**
 * Camera control. Two modes:
 *  - Pinned (harness): when `?cam=x,y,z,yaw,pitch[,fov]` is present, the camera is fixed to that
 *    exact pose and no input runs — so screenshots are frame-comparable and deterministic.
 *  - Free (interactive): WASD + pointer-lock look via the intent layer, with room-bound collision.
 */
import { useFrame, useThree } from "@react-three/fiber";
import { type MutableRefObject, useEffect, useRef } from "react";
import * as THREE from "three";
import type { CamPose, Params } from "../core/params";
import { ANCHORS, ROOM } from "../scene/layout";
import { KeyboardPointerSource, type MoveIntent } from "./intent";

function applyYawPitch(camera: THREE.Camera, yaw: number, pitch: number): void {
  const e = new THREE.Euler(pitch, yaw, 0, "YXZ");
  camera.quaternion.setFromEuler(e);
}

export function PinnedCamera({ pose }: { pose: CamPose }): null {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(pose.x, pose.y, pose.z);
    applyYawPitch(camera, pose.yaw, pose.pitch);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = pose.fov;
      camera.updateProjectionMatrix();
    }
  }, [camera, pose]);
  return null;
}

export function FreeLookController({
  intentRef,
}: {
  intentRef: MutableRefObject<MoveIntent>;
}): null {
  const { camera, gl } = useThree();
  const yaw = useRef(0);
  const pitch = useRef(-0.03);

  useEffect(() => {
    const [sx, sy, sz] = ANCHORS.spawn;
    camera.position.set(sx, sy, sz);
    applyYawPitch(camera, yaw.current, pitch.current);
    const src = new KeyboardPointerSource();
    src.attach(gl.domElement, intentRef.current);
    return () => src.detach();
  }, [camera, gl, intentRef]);

  useFrame((_, dt) => {
    const it = intentRef.current;
    yaw.current += it.dyaw;
    pitch.current = Math.max(-1.4, Math.min(1.4, pitch.current + it.dpitch));
    it.dyaw = 0;
    it.dpitch = 0;
    applyYawPitch(camera, yaw.current, pitch.current);

    const speed = (it.sprint ? 4.2 : 2.2) * Math.min(dt, 0.05);
    // move in the horizontal plane relative to yaw
    const sin = Math.sin(yaw.current);
    const cos = Math.cos(yaw.current);
    // forward is -Z in view space
    const fx = -sin * it.forward + cos * it.strafe;
    const fz = -cos * it.forward - sin * it.strafe;
    camera.position.x += fx * speed;
    camera.position.z += fz * speed;
    // collide with room bounds
    const lim = ROOM.margin;
    camera.position.x = Math.max(-ROOM.hx + lim, Math.min(ROOM.hx - lim, camera.position.x));
    camera.position.z = Math.max(-ROOM.hz + lim, Math.min(ROOM.hz - lim, camera.position.z));
    camera.position.y = ROOM.eyeY;
  });

  return null;
}

/** Switch: pin the camera for the harness when `?cam` is present, else free-walk. */
export function CameraRig({
  params,
  intentRef,
}: {
  params: Params;
  intentRef: MutableRefObject<MoveIntent>;
}): JSX.Element {
  return params.cam ? (
    <PinnedCamera pose={params.cam} />
  ) : (
    <FreeLookController intentRef={intentRef} />
  );
}

/**
 * Watches camera proximity to an anchor and fires `onInteract` on a press-E edge while in range;
 * reports range changes via `onNear`. Drives the "press E at the desk → open taste app" flow.
 */
export function InteractionZone({
  intentRef,
  target,
  radius,
  onNear,
  onInteract,
}: {
  intentRef: MutableRefObject<MoveIntent>;
  target: readonly [number, number, number];
  radius: number;
  onNear: (near: boolean) => void;
  onInteract: () => void;
}): null {
  const { camera } = useThree();
  const wasNear = useRef(false);
  useFrame(() => {
    const dx = camera.position.x - target[0];
    const dz = camera.position.z - target[2];
    const near = dx * dx + dz * dz <= radius * radius;
    if (near !== wasNear.current) {
      wasNear.current = near;
      onNear(near);
    }
    if (near && intentRef.current.interact) onInteract();
    intentRef.current.interact = false; // consume the edge every frame
  });
  return null;
}
