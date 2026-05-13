import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ActionBar from "@/ui/html/ActionBar";

describe("ActionBar", () => {
  it("renders nothing when not visible", () => {
    const { container } = render(
      <ActionBar
        x={100}
        y={100}
        actions={[{ id: "flip", label: "Retourner", onClick: vi.fn() }]}
        visible={false}
        side="right"
      />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders Retourner button when visible", () => {
    render(
      <ActionBar
        x={100}
        y={100}
        actions={[{ id: "flip", label: "Retourner", onClick: vi.fn() }]}
        visible={true}
        side="right"
      />,
    );
    expect(screen.getByTitle("Retourner")).toBeInTheDocument();
  });

  it("calls onClick when button is clicked", () => {
    const onFlip = vi.fn();
    render(
      <ActionBar
        x={100}
        y={100}
        actions={[{ id: "flip", label: "Retourner", onClick: onFlip }]}
        visible={true}
        side="right"
      />,
    );
    fireEvent.click(screen.getByTitle("Retourner"));
    expect(onFlip).toHaveBeenCalledTimes(1);
  });

  it("does not render draw buttons when only flip action is provided", () => {
    render(
      <ActionBar
        x={100}
        y={100}
        actions={[{ id: "flip", label: "Retourner", onClick: vi.fn() }]}
        visible={true}
        side="right"
      />,
    );
    expect(screen.queryByTitle("Piocher face visible")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Piocher face cachée")).not.toBeInTheDocument();
  });

  it("renders draw buttons when draw actions are provided", () => {
    render(
      <ActionBar
        x={100}
        y={100}
        actions={[
          { id: "flip", label: "Retourner", onClick: vi.fn() },
          { id: "draw-face-up", label: "Piocher face visible", onClick: vi.fn() },
          { id: "draw-face-down", label: "Piocher face cachée", onClick: vi.fn() },
        ]}
        visible={true}
        side="right"
      />,
    );
    expect(screen.getByTitle("Piocher face visible")).toBeInTheDocument();
    expect(screen.getByTitle("Piocher face cachée")).toBeInTheDocument();
  });

  it("calls draw face-up onClick when button is clicked", () => {
    const onDrawFaceUp = vi.fn();
    render(
      <ActionBar
        x={100}
        y={100}
        actions={[
          { id: "flip", label: "Retourner", onClick: vi.fn() },
          { id: "draw-face-up", label: "Piocher face visible", onClick: onDrawFaceUp },
          { id: "draw-face-down", label: "Piocher face cachée", onClick: vi.fn() },
        ]}
        visible={true}
        side="right"
      />,
    );
    fireEvent.click(screen.getByTitle("Piocher face visible"));
    expect(onDrawFaceUp).toHaveBeenCalledTimes(1);
  });

  it("calls draw face-down onClick when button is clicked", () => {
    const onDrawFaceDown = vi.fn();
    render(
      <ActionBar
        x={100}
        y={100}
        actions={[
          { id: "flip", label: "Retourner", onClick: vi.fn() },
          { id: "draw-face-up", label: "Piocher face visible", onClick: vi.fn() },
          { id: "draw-face-down", label: "Piocher face cachée", onClick: onDrawFaceDown },
        ]}
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
        actions={[
          { id: "flip", label: "Retourner", onClick: vi.fn() },
          { id: "draw-face-up", label: "Piocher face visible", onClick: vi.fn() },
          { id: "draw-face-down", label: "Piocher face cachée", onClick: vi.fn() },
        ]}
        visible={true}
        side="right"
      />,
    );
    const buttons = container.querySelectorAll("button");
    buttons.forEach((btn) => {
      expect(btn.classList.contains("flex-row")).toBe(true);
    });
  });

  it("shows separator between buttons", () => {
    const { container } = render(
      <ActionBar
        x={100}
        y={100}
        actions={[
          { id: "flip", label: "Retourner", onClick: vi.fn() },
          { id: "draw-face-up", label: "Piocher face visible", onClick: vi.fn() },
        ]}
        visible={true}
        side="right"
      />,
    );
    const separator = container.querySelector(".h-px.bg-gray-300");
    expect(separator).toBeInTheDocument();
  });

  it("no separator when only one button", () => {
    const { container } = render(
      <ActionBar
        x={100}
        y={100}
        actions={[{ id: "flip", label: "Retourner", onClick: vi.fn() }]}
        visible={true}
        side="right"
      />,
    );
    const separator = container.querySelector(".h-px.bg-gray-300");
    expect(separator).not.toBeInTheDocument();
  });

  it("applies right-side transform when side is right", () => {
    const { container } = render(
      <ActionBar
        x={100}
        y={100}
        actions={[{ id: "flip", label: "Retourner", onClick: vi.fn() }]}
        visible={true}
        side="right"
      />,
    );
    const bar = container.firstElementChild!;
    expect(bar.style.transform).toBe("translateY(-50%)");
  });

  it("applies left-side transform when side is left", () => {
    const { container } = render(
      <ActionBar
        x={100}
        y={100}
        actions={[{ id: "flip", label: "Retourner", onClick: vi.fn() }]}
        visible={true}
        side="left"
      />,
    );
    const bar = container.firstElementChild!;
    expect(bar.style.transform).toBe("translateX(-100%) translateY(-50%)");
  });

  it("renders buttons in the order of actions array", () => {
    render(
      <ActionBar
        x={100}
        y={100}
        actions={[
          { id: "flip", label: "Retourner", onClick: vi.fn() },
          { id: "draw-face-up", label: "Piocher face visible", onClick: vi.fn() },
          { id: "draw-face-down", label: "Piocher face cachée", onClick: vi.fn() },
        ]}
        visible={true}
        side="right"
      />,
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toHaveAttribute("title", "Retourner");
    expect(buttons[1]).toHaveAttribute("title", "Piocher face visible");
    expect(buttons[2]).toHaveAttribute("title", "Piocher face cachée");
  });

  it("with 1 action renders 1 button", () => {
    render(
      <ActionBar
        x={100}
        y={100}
        actions={[{ id: "flip", label: "Retourner", onClick: vi.fn() }]}
        visible={true}
        side="right"
      />,
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveAttribute("title", "Retourner");
  });

  it("with 3 actions renders 3 buttons in order", () => {
    render(
      <ActionBar
        x={100}
        y={100}
        actions={[
          { id: "flip", label: "Retourner", onClick: vi.fn() },
          { id: "draw-face-up", label: "Piocher face visible", onClick: vi.fn() },
          { id: "draw-face-down", label: "Piocher face cachée", onClick: vi.fn() },
        ]}
        visible={true}
        side="right"
      />,
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
    expect(buttons[0]).toHaveAttribute("title", "Retourner");
    expect(buttons[1]).toHaveAttribute("title", "Piocher face visible");
    expect(buttons[2]).toHaveAttribute("title", "Piocher face cachée");
  });

  it("does not render buttons for actions not in the array", () => {
    render(
      <ActionBar
        x={100}
        y={100}
        actions={[{ id: "flip", label: "Retourner", onClick: vi.fn() }]}
        visible={true}
        side="right"
      />,
    );
    expect(screen.getByTitle("Retourner")).toBeInTheDocument();
    expect(screen.queryByTitle("Piocher face visible")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Piocher face cachée")).not.toBeInTheDocument();
  });

  it("custom order: actions with draw-face-down first shows Piocher face cachée first", () => {
    render(
      <ActionBar
        x={100}
        y={100}
        actions={[
          { id: "draw-face-down", label: "Piocher face cachée", onClick: vi.fn() },
          { id: "flip", label: "Retourner", onClick: vi.fn() },
        ]}
        visible={true}
        side="right"
      />,
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveAttribute("title", "Piocher face cachée");
    expect(buttons[1]).toHaveAttribute("title", "Retourner");
  });
});
