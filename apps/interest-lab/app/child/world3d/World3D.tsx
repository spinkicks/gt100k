"use client";

import type { SceneView } from "@gt100k/interest-lab-view";
import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const ClientWorld3DCanvas = dynamic(
  () => import("./World3DCanvas").then((module) => module.World3DCanvas),
  { ssr: false },
);

export interface World3DProps {
  scene: SceneView;
  children?: ReactNode;
  onContextLost?: () => void;
}

export function World3D(props: World3DProps) {
  return <ClientWorld3DCanvas {...props} />;
}
