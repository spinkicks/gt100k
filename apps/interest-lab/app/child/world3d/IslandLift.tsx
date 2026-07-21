"use client";

import { useFrame } from "@react-three/fiber";
import { type ReactNode, useRef } from "react";
import { type Group, MathUtils } from "three";

// How high a focused island rises — arrival lifts it out of the ring so the visit reads spatially.
export const ISLAND_FOCUS_LIFT = 0.42;

export interface IslandLiftProps {
  focused: boolean;
  children: ReactNode;
}

/**
 * Raises its subtree when the island is focused, giving "arrival" a physical payoff. Kept as its
 * own component so the `useFrame` hook is only invoked inside a real R3F render — `Island` stays a
 * hook-free function that unit tests can call directly.
 */
export function IslandLift({ focused, children }: IslandLiftProps) {
  const groupRef = useRef<Group>(null);

  useFrame((_state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    group.position.y = MathUtils.damp(group.position.y, focused ? ISLAND_FOCUS_LIFT : 0, 6, delta);
  });

  return <group ref={groupRef}>{children}</group>;
}
