"use client";

import { useEffect, useState } from "react";

export type DeviceType = "phone" | "tablet" | "desktop";

const PHONE_QUERY = "(max-width: 767px)";
const TABLET_QUERY = "(min-width: 768px) and (max-width: 1023px)";

function detectDevice(): DeviceType {
  if (typeof window === "undefined") return "desktop";
  const shortestSide = Math.min(window.innerWidth, window.innerHeight);
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;

  // Real phones in landscape can exceed 767px width, so classify by shortest side.
  if (shortestSide <= 767) return "phone";

  if (window.matchMedia(PHONE_QUERY).matches) return "phone";

  // Touch-first medium screens are usually tablets.
  if (isCoarsePointer && shortestSide <= 1024) return "tablet";

  if (window.matchMedia(TABLET_QUERY).matches) return "tablet";
  return "desktop";
}

/**
 * Resolves the active device type from media queries. Returns `null` until the
 * component has mounted on the client so callers can render an SSR-safe
 * placeholder and avoid hydration mismatches.
 */
export function useDeviceType(): DeviceType | null {
  const [device, setDevice] = useState<DeviceType | null>(null);

  useEffect(() => {
    setDevice(detectDevice());

    const phoneMql = window.matchMedia(PHONE_QUERY);
    const tabletMql = window.matchMedia(TABLET_QUERY);
    const update = () => setDevice(detectDevice());

    phoneMql.addEventListener("change", update);
    tabletMql.addEventListener("change", update);

    return () => {
      phoneMql.removeEventListener("change", update);
      tabletMql.removeEventListener("change", update);
    };
  }, []);

  return device;
}
