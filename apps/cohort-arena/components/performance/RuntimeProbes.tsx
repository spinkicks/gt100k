"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";

import { createFrameBudgetWindow, recordFrame } from "./runtime.js";

interface FrameBudgetProbeProps {
  readonly onSustainedMiss: () => void;
}

interface WebGLRuntimeProbeProps {
  readonly onContextLost: () => void;
}

export function FrameBudgetProbe({ onSustainedMiss }: FrameBudgetProbeProps) {
  const budgetWindow = useRef(createFrameBudgetWindow());

  useFrame((_, deltaSeconds) => {
    const result = recordFrame(budgetWindow.current, deltaSeconds * 1_000);
    budgetWindow.current = result.window;
    if (result.sustainedMiss) onSustainedMiss();
  });

  return null;
}

export function WebGLRuntimeProbe({ onContextLost }: WebGLRuntimeProbeProps) {
  const canvas = useThree(({ gl }) => gl.domElement);

  useEffect(() => {
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      onContextLost();
    };

    canvas.addEventListener("webglcontextlost", handleContextLost);
    return () => canvas.removeEventListener("webglcontextlost", handleContextLost);
  }, [canvas, onContextLost]);

  return null;
}
