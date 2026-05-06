import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ActionBar from "@/ui/html/ActionBar";

describe("ActionBar", () => {
  it("renders nothing when not visible", () => {
    const { container } = render(
      <ActionBar x={100} y={100} onFlip={vi.fn()} visible={false} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders Retourner button when visible", () => {
    render(<ActionBar x={100} y={100} onFlip={vi.fn()} visible={true} />);
    expect(screen.getByText("Retourner")).toBeInTheDocument();
  });

  it("calls onFlip when button is clicked", () => {
    const onFlip = vi.fn();
    render(<ActionBar x={100} y={100} onFlip={onFlip} visible={true} />);
    fireEvent.click(screen.getByText("Retourner"));
    expect(onFlip).toHaveBeenCalledTimes(1);
  });
});
