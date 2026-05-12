import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ActionBar from "@/ui/html/ActionBar";

describe("ActionBar", () => {
  it("renders nothing when not visible", () => {
    const { container } = render(
      <ActionBar x={100} y={100} onFlip={vi.fn()} visible={false} side="right" />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders Retourner button when visible", () => {
    render(<ActionBar x={100} y={100} onFlip={vi.fn()} visible={true} side="right" />);
    expect(screen.getByTitle("Retourner")).toBeInTheDocument();
  });

  it("calls onFlip when button is clicked", () => {
    const onFlip = vi.fn();
    render(<ActionBar x={100} y={100} onFlip={onFlip} visible={true} side="right" />);
    fireEvent.click(screen.getByTitle("Retourner"));
    expect(onFlip).toHaveBeenCalledTimes(1);
  });

  it("does not render draw buttons when deck callbacks are not provided", () => {
    render(<ActionBar x={100} y={100} onFlip={vi.fn()} visible={true} side="right" />);
    expect(screen.queryByTitle("Piocher face visible")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Piocher face cachée")).not.toBeInTheDocument();
  });

  it("renders draw buttons when deck callbacks are provided", () => {
    render(
      <ActionBar
        x={100}
        y={100}
        onFlip={vi.fn()}
        onDrawFaceUp={vi.fn()}
        onDrawFaceDown={vi.fn()}
        visible={true}
        side="right"
      />,
    );
    expect(screen.getByTitle("Piocher face visible")).toBeInTheDocument();
    expect(screen.getByTitle("Piocher face cachée")).toBeInTheDocument();
  });

  it("calls onDrawFaceUp when draw face-up button is clicked", () => {
    const onDrawFaceUp = vi.fn();
    render(
      <ActionBar
        x={100}
        y={100}
        onFlip={vi.fn()}
        onDrawFaceUp={onDrawFaceUp}
        onDrawFaceDown={vi.fn()}
        visible={true}
        side="right"
      />,
    );
    fireEvent.click(screen.getByTitle("Piocher face visible"));
    expect(onDrawFaceUp).toHaveBeenCalledTimes(1);
  });

  it("calls onDrawFaceDown when draw face-down button is clicked", () => {
    const onDrawFaceDown = vi.fn();
    render(
      <ActionBar
        x={100}
        y={100}
        onFlip={vi.fn()}
        onDrawFaceUp={vi.fn()}
        onDrawFaceDown={onDrawFaceDown}
        visible={true}
        side="right"
      />,
    );
    fireEvent.click(screen.getByTitle("Piocher face cachée"));
    expect(onDrawFaceDown).toHaveBeenCalledTimes(1);
  });

  it("renders buttons with horizontal layout (icon beside text)", () => {
    const { container } = render(
      <ActionBar
        x={100}
        y={100}
        onFlip={vi.fn()}
        onDrawFaceUp={vi.fn()}
        onDrawFaceDown={vi.fn()}
        visible={true}
        side="right"
      />,
    );
    const buttons = container.querySelectorAll("button");
    buttons.forEach((btn) => {
      expect(btn.classList.contains("flex-row")).toBe(true);
    });
  });

  it("shows separator between flip and draw buttons", () => {
    const { container } = render(
      <ActionBar
        x={100}
        y={100}
        onFlip={vi.fn()}
        onDrawFaceUp={vi.fn()}
        onDrawFaceDown={vi.fn()}
        visible={true}
        side="right"
      />,
    );
    const separator = container.querySelector(".h-px.bg-gray-300");
    expect(separator).toBeInTheDocument();
  });

  it("no separator when no draw buttons", () => {
    const { container } = render(
      <ActionBar x={100} y={100} onFlip={vi.fn()} visible={true} side="right" />,
    );
    const separator = container.querySelector(".h-px.bg-gray-300");
    expect(separator).not.toBeInTheDocument();
  });

  it("applies right-side transform when side is right", () => {
    const { container } = render(
      <ActionBar x={100} y={100} onFlip={vi.fn()} visible={true} side="right" />,
    );
    const bar = container.firstElementChild!;
    expect(bar.style.transform).toBe("translateY(-50%)");
  });

  it("applies left-side transform when side is left", () => {
    const { container } = render(
      <ActionBar x={100} y={100} onFlip={vi.fn()} visible={true} side="left" />,
    );
    const bar = container.firstElementChild!;
    expect(bar.style.transform).toBe("translateX(-100%) translateY(-50%)");
  });
});
