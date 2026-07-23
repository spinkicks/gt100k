/**
 * Camera control. Two modes:
 *  - Pinned (harness): when `?cam=x,y,z,yaw,pitch[,fov]` is present, the camera is fixed to that
 *    exact pose and no input runs — so screenshots are frame-comparable and deterministic.
 *  - Free (interactive): WASD + pointer-lock look via the intent layer, with room-bound collision.
 */
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { CamPose, Params } from "../core/params";
import { ANCHORS, ROOM } from "../scene/layout";
import { KeyboardPointerSource, createIntent } from "./intent";

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

export function FreeLookController(): null {
  const { camera, gl } = useThree();
  const intent = useRef(createIntent());
  const yaw = useRef(0);
  const pitch = useRef(-0.03);

  useEffect(() => {
    const [sx, sy, sz] = ANCHORS.spawn;
    camera.position.set(sx, sy, sz);
    applyYawPitch(camera, yaw.current, pitch.current);
    const src = new KeyboardPointerSource();
    src.attach(gl.domElement, intent.current);
    return () => src.detach();
  }, [camera, gl]);

  useFrame((_, dt) => {
    const it = intent.current;
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
export function CameraRig({ params }: { params: Params }): JSX.Element {
  return params.cam ? <PinnedCamera pose={params.cam} /> : <FreeLookController />;
}
