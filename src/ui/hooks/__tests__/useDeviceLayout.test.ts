import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDeviceLayout } from "@/ui/hooks/useDeviceLayout";
import * as deviceDetection from "@/utils/deviceDetection";
import type { CardSize, Position } from "@/types/game";

vi.mock("@/utils/deviceDetection", () => ({
  isMobileDevice: vi.fn(),
}));

vi.mock("@/store/layoutStore", () => ({
  useLayoutStore: vi.fn(() => vi.fn()),
}));

vi.mock("@/editor/stores/editorStore", () => ({
  useEditorStore: vi.fn(() => undefined),
}));

describe("useDeviceLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const desktopCardSize: CardSize = { widthRatio: 0.1, minWidth: 60, aspectRatio: 1.5 };
  const mobileCardSize: CardSize = { widthRatio: 0.2, minWidth: 100, aspectRatio: 1.0 };
  const game = { cardSize: desktopCardSize, mobileCardSize };

  const desktopPos: Position = { x: 0.1, y: 0.1 };
  const mobilePos: Position = { x: 0.5, y: 0.5 };
  const component = { position: desktopPos, mobilePosition: mobilePos };

  it("returns desktop values when not mobile", () => {
    vi.mocked(deviceDetection.isMobileDevice).mockReturnValue(false);
    
    const { result } = renderHook(() => useDeviceLayout());
    
    expect(result.current.isMobile).toBe(false);
    expect(result.current.getCardSize(game)).toEqual(desktopCardSize);
    expect(result.current.getPosition(component)).toEqual(desktopPos);
  });

  it("returns mobile values when mobile", () => {
    vi.mocked(deviceDetection.isMobileDevice).mockReturnValue(true);
    
    const { result } = renderHook(() => useDeviceLayout());
    
    expect(result.current.isMobile).toBe(true);
    expect(result.current.getCardSize(game)).toEqual(mobileCardSize);
    expect(result.current.getPosition(component)).toEqual(mobilePos);
  });

  it("falls back to desktop values on mobile when mobile values are missing", () => {
    vi.mocked(deviceDetection.isMobileDevice).mockReturnValue(true);
    
    const { result } = renderHook(() => useDeviceLayout());
    
    const gameNoMobile = { cardSize: desktopCardSize };
    const componentNoMobile = { position: desktopPos };
    
    expect(result.current.getCardSize(gameNoMobile)).toEqual(desktopCardSize);
    expect(result.current.getPosition(componentNoMobile)).toEqual(desktopPos);
  });
});
