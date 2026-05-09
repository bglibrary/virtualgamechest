import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useCardImage from "@/ui/hooks/useCardImage";

describe("useCardImage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns no image when url is undefined", () => {
    const { result } = renderHook(() => useCardImage(undefined));
    expect(result.current.image).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(false);
  });

  it("returns loading state when image is being fetched", () => {
    vi.spyOn(globalThis, "Image").mockImplementation(() => {
      const img = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: "",
        crossOrigin: "",
      };
      return img as unknown as HTMLImageElement;
    });

    const { result } = renderHook(() => useCardImage("https://example.com/card.png"));
    expect(result.current.loading).toBe(true);
    expect(result.current.image).toBeNull();
    expect(result.current.error).toBe(false);
  });

  it("returns loaded image on success", () => {
    const mockImg = {
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
      src: "",
      crossOrigin: "",
      naturalWidth: 800,
      naturalHeight: 600,
    };

    vi.spyOn(globalThis, "Image").mockImplementation(() => {
      const img = mockImg as unknown as HTMLImageElement;
      return img;
    });

    const { result } = renderHook(() => useCardImage("https://example.com/card.png"));

    act(() => {
      mockImg.onload?.();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(false);
    expect(result.current.image).not.toBeNull();
  });

  it("returns error state on image load failure", () => {
    const mockImg = {
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
      src: "",
      crossOrigin: "",
    };

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    vi.spyOn(globalThis, "Image").mockImplementation(() => {
      return mockImg as unknown as HTMLImageElement;
    });

    const { result } = renderHook(() => useCardImage("https://example.com/broken.png"));

    act(() => {
      mockImg.onerror?.();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(true);
    expect(result.current.image).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Card image failed to load"),
    );

    warnSpy.mockRestore();
  });

  it("resets state when url changes to undefined", () => {
    const mockImg = {
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
      src: "",
      crossOrigin: "",
    };

    vi.spyOn(globalThis, "Image").mockImplementation(() => {
      return mockImg as unknown as HTMLImageElement;
    });

    const { result, rerender } = renderHook(
      ({ url }: { url: string | undefined }) => useCardImage(url),
      { initialProps: { url: "https://example.com/card.png" as string | undefined } },
    );

    expect(result.current.loading).toBe(true);

    rerender({ url: undefined as string | undefined });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(false);
    expect(result.current.image).toBeNull();
  });
});
