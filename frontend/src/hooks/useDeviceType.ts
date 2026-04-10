"use client";

import { useEffect, useState } from "react";

export type DeviceType = "phone" | "tablet" | "desktop";

const PHONE_QUERY = "(max-width: 767px)";
const TABLET_QUERY = "(min-width: 768px) and (max-width: 1023px)";

function detectDevice(): DeviceType {
  if (typeof window === "undefined") return "desktop";
  if (window.matchMedia(PHONE_QUERY).matches) return "phone";
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
