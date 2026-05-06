import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useClickOrDblClick from "@/ui/hooks/useClickOrDblClick";

describe("useClickOrDblClick", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("fires onClick after delay on single click", () => {
    const onClick = vi.fn();
    const onDblClick = vi.fn();
    const { result } = renderHook(() =>
      useClickOrDblClick({ onClick, onDblClick, delay: 250 }),
    );

    result.current.onClick();
    expect(onClick).not.toHaveBeenCalled();
    expect(onDblClick).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onDblClick).not.toHaveBeenCalled();
  });

  it("fires onDblClick and cancels pending onClick on double click", () => {
    const onClick = vi.fn();
    const onDblClick = vi.fn();
    const { result } = renderHook(() =>
      useClickOrDblClick({ onClick, onDblClick, delay: 250 }),
    );

    result.current.onClick();
    result.current.onClick();

    expect(onDblClick).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(onClick).not.toHaveBeenCalled();
  });

  it("resets after single click completes", () => {
    const onClick = vi.fn();
    const onDblClick = vi.fn();
    const { result } = renderHook(() =>
      useClickOrDblClick({ onClick, onDblClick, delay: 250 }),
    );

    result.current.onClick();
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(onClick).toHaveBeenCalledTimes(1);

    result.current.onClick();
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(onClick).toHaveBeenCalledTimes(2);
  });
});
