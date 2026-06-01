import { useMemo, useEffect } from "react";
import { isMobileDevice } from "@/utils/deviceDetection";
import { useLayoutStore } from "@/store/layoutStore";
import { useEditorStore } from "@/editor/stores/editorStore";
import type { Position, CardSize } from "@/types/game";

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
}

const DEFAULT_POSITION: Position = { x: 0, y: 0 };
const DEFAULT_CARD_SIZE: CardSize = { widthRatio: 0.08, minWidth: 55, aspectRatio: 1.4 };

export function useDeviceLayout(): DeviceLayout {
  // In the editor, we follow the editLayout toggle.
  // In the game, we follow the detected device.
  // gameId is null when not in the editor, so we use that to distinguish.
  const editorGameId = useEditorStore((s) => s.gameId);
  const editLayout = useEditorStore((s) => s.editLayout);
  const isMobile = useMemo(() => {
    if (editorGameId) {
      // We are in the editor — follow the toggle
      const res = editLayout === "mobile";
      console.log("[DeviceLayout] editor mode: isMobile =", res);
      return res;
    }
    // We are in game mode — use real device detection
    const detected = isMobileDevice();
    console.log("[DeviceLayout] game mode: isMobile =", detected, "href:", window.location.href, "ua:", navigator.userAgent);
    return detected;
  }, [editorGameId, editLayout]);
  const setIsMobile = useLayoutStore((s) => s.setIsMobile);

  useEffect(() => {
    setIsMobile(isMobile);
  }, [isMobile, setIsMobile]);

  const getPosition = (component: ComponentWithPosition): Position => {
    if (isMobile && component.mobilePosition) {
      return component.mobilePosition;
    }
    return component.position ?? DEFAULT_POSITION;
  };

  const getCardSize = (game: GameWithCardSize): CardSize => {
    if (isMobile && game.mobileCardSize) {
      console.log("[DeviceLayout] returning mobileCardSize:", game.mobileCardSize);
      return game.mobileCardSize;
    }
    const res = game.cardSize ?? DEFAULT_CARD_SIZE;
    console.log("[DeviceLayout] returning cardSize:", res, "isMobile:", isMobile);
    return res;
  };

  return { isMobile, getPosition, getCardSize };
}