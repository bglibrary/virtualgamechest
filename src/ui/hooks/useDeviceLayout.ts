import { useMemo, useEffect } from "react";
import { isMobileDevice } from "@/utils/deviceDetection";
import { useLayoutStore } from "@/store/layoutStore";
import type { Position, CardSize, MobileOrientation } from "@/types/game";

export interface ComponentWithPosition {
  position?: Position | null;
  mobilePosition?: Position | null;
}

export interface GameWithCardSize {
  cardSize?: CardSize;
  mobileCardSize?: CardSize;
}

export interface DeviceLayout {
  isMobile: boolean;
  getPosition: (component: ComponentWithPosition) => Position;
  getCardSize: (game: GameWithCardSize) => CardSize;
  lockOrientation: (orientation?: MobileOrientation) => void;
}

const DEFAULT_POSITION: Position = { x: 0, y: 0 };
const DEFAULT_CARD_SIZE: CardSize = { widthRatio: 0.08, minWidth: 55, aspectRatio: 1.4 };

export function useDeviceLayout(): DeviceLayout {
  const isMobile = useMemo(() => {
    const detected = isMobileDevice();
    console.log("[DeviceLayout] isMobile:", detected, "href:", window.location.href, "ua:", navigator.userAgent);
    return detected;
  }, []);
  const setIsMobile = useLayoutStore((s) => s.setIsMobile);

  useEffect(() => {
    setIsMobile(isMobile);
  }, [isMobile, setIsMobile]);

  const lockOrientation = (orientation?: MobileOrientation) => {
    if (!isMobile || !orientation) return;
    try {
      if ("orientation" in screen && typeof (screen.orientation as ScreenOrientation)?.lock === "function") {
        (screen.orientation as ScreenOrientation).lock(orientation).catch(() => {
          // Silently ignore lock failures (e.g., on devices that don't support orientation lock)
        });
      }
    } catch {
      // Silently ignore
    }
  };

  const getPosition = (component: ComponentWithPosition): Position => {
    if (isMobile && component.mobilePosition) {
      return component.mobilePosition;
    }
    return component.position ?? DEFAULT_POSITION;
  };

  const getCardSize = (game: GameWithCardSize): CardSize => {
    if (isMobile && game.mobileCardSize) {
      return game.mobileCardSize;
    }
    return game.cardSize ?? DEFAULT_CARD_SIZE;
  };

  return { isMobile, getPosition, getCardSize, lockOrientation };
}