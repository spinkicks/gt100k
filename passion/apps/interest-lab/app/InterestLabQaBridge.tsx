"use client";

import type { Qa } from "@gt100k/interest-lab-view";
import { useEffect } from "react";

declare global {
  interface Window {
    __qa?: Qa;
  }
}

export function InterestLabQaBridge({ qa }: { qa: Qa }) {
  useEffect(() => {
    window.__qa = qa;

    return () => {
      if (window.__qa === qa) {
        Reflect.deleteProperty(window, "__qa");
      }
    };
  }, [qa]);

  return null;
}
