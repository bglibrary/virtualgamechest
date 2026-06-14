import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useEditorStore } from "@/editor/stores/editorStore";
import PositionForm from "../PositionForm";
import type { GameDefinition, ZoneComponent, CardComponent } from "@/types/game";

function createGameWithComponents(components: (ZoneComponent | CardComponent)[]): GameDefinition {
  return {
    name: "test-game",
    version: "1.0",
    components,
  };
}

describe("PositionForm", () => {
  beforeEach(() => {
    useEditorStore.setState({
      gameId: null,
      game: null,
      selectedIds: [],
      isDirty: false,
    });
  });

  it("should render X and Y inputs with step 0.01", () => {
    const zone: ZoneComponent = {
      type: "zone",
      id: "zone-1",
      position: { x: 0.5, y: 0.3 },
      label: "Zone 1",
      snapRadius: 30,
      hideCountBadge: false,
    };
    const game = createGameWithComponents([zone]);
    useEditorStore.getState().openGame("test", game);

    render(<PositionForm components={[zone]} />);

    const xInput = screen.getByLabelText("X");
    const yInput = screen.getByLabelText("Y");
    expect(xInput).toHaveValue(0.5);
    expect(yInput).toHaveValue(0.3);
    expect(xInput).toHaveAttribute("step", "0.01");
    expect(yInput).toHaveAttribute("step", "0.01");
    expect(xInput).toHaveAttribute("min", "0");
    expect(xInput).toHaveAttribute("max", "1");
  });

  it("should update component position when X changes", () => {
    const zone: ZoneComponent = {
      type: "zone",
      id: "zone-1",
      position: { x: 0.5, y: 0.3 },
      label: "Zone 1",
      snapRadius: 30,
      hideCountBadge: false,
    };
    const game = createGameWithComponents([zone]);
    useEditorStore.getState().openGame("test", game);

    render(<PositionForm components={[zone]} />);

    const xInput = screen.getByLabelText("X");
    fireEvent.change(xInput, { target: { value: "0.75" } });

    const updated = useEditorStore.getState().game?.components.find((c) => c.id === "zone-1");
    expect(updated?.position?.x).toBe(0.75);
  });

  it("should clamp value to 0-1 range", () => {
    const zone: ZoneComponent = {
      type: "zone",
      id: "zone-1",
      position: { x: 0.5, y: 0.3 },
      label: "Zone 1",
      snapRadius: 30,
      hideCountBadge: false,
    };
    const game = createGameWithComponents([zone]);
    useEditorStore.getState().openGame("test", game);

    render(<PositionForm components={[zone]} />);

    const xInput = screen.getByLabelText("X");
    fireEvent.change(xInput, { target: { value: "2.5" } });

    const updated = useEditorStore.getState().game?.components.find((c) => c.id === "zone-1");
    expect(updated?.position?.x).toBe(1);
  });

  it("should round value to 2 decimal places (centième)", () => {
    const zone: ZoneComponent = {
      type: "zone",
      id: "zone-1",
      position: { x: 0.5, y: 0.3 },
      label: "Zone 1",
      snapRadius: 30,
      hideCountBadge: false,
    };
    const game = createGameWithComponents([zone]);
    useEditorStore.getState().openGame("test", game);

    render(<PositionForm components={[zone]} />);

    const xInput = screen.getByLabelText("X");
    fireEvent.change(xInput, { target: { value: "0.333" } });

    const updated = useEditorStore.getState().game?.components.find((c) => c.id === "zone-1");
    expect(updated?.position?.x).toBe(0.33);
  });

  it("should show precision to 2 decimal places in display", () => {
    const zone: ZoneComponent = {
      type: "zone",
      id: "zone-1",
      position: { x: 0.33333, y: 0.11111 },
      label: "Zone 1",
      snapRadius: 30,
      hideCountBadge: false,
    };
    const game = createGameWithComponents([zone]);
    useEditorStore.getState().openGame("test", game);

    render(<PositionForm components={[zone]} />);

    const xInput = screen.getByLabelText("X");
    const yInput = screen.getByLabelText("Y");
    expect(xInput).toHaveValue(0.33);
    expect(yInput).toHaveValue(0.11);
  });

  it("should show warning when multiple components are selected", () => {
    const zone1: ZoneComponent = {
      type: "zone",
      id: "zone-1",
      position: { x: 0.2, y: 0.3 },
      label: "Zone 1",
      snapRadius: 30,
      hideCountBadge: false,
    };
    const zone2: ZoneComponent = {
      type: "zone",
      id: "zone-2",
      position: { x: 0.5, y: 0.5 },
      label: "Zone 2",
      snapRadius: 30,
      hideCountBadge: false,
    };
    const game = createGameWithComponents([zone1, zone2]);
    useEditorStore.getState().openGame("test", game);

    render(<PositionForm components={[zone1, zone2]} />);

    expect(screen.getByText(/updating will set all/i)).toBeInTheDocument();
    expect(screen.getByText(/2 components/i)).toBeInTheDocument();
  });

  it("should not show warning for single component", () => {
    const zone: ZoneComponent = {
      type: "zone",
      id: "zone-1",
      position: { x: 0.5, y: 0.3 },
      label: "Zone 1",
      snapRadius: 30,
      hideCountBadge: false,
    };
    const game = createGameWithComponents([zone]);
    useEditorStore.getState().openGame("test", game);

    render(<PositionForm components={[zone]} />);

    expect(screen.queryByText(/updating will set all/i)).not.toBeInTheDocument();
  });

  it("should update all components when multiple are selected and a value changes", () => {
    const zone1: ZoneComponent = {
      type: "zone",
      id: "zone-1",
      position: { x: 0.2, y: 0.3 },
      label: "Zone 1",
      snapRadius: 30,
      hideCountBadge: false,
    };
    const zone2: ZoneComponent = {
      type: "zone",
      id: "zone-2",
      position: { x: 0.5, y: 0.5 },
      label: "Zone 2",
      snapRadius: 30,
      hideCountBadge: false,
    };
    const game = createGameWithComponents([zone1, zone2]);
    useEditorStore.getState().openGame("test", game);

    render(<PositionForm components={[zone1, zone2]} />);

    const xInput = screen.getByLabelText("X");
    fireEvent.change(xInput, { target: { value: "0.9" } });

    const updated1 = useEditorStore.getState().game?.components.find((c) => c.id === "zone-1");
    const updated2 = useEditorStore.getState().game?.components.find((c) => c.id === "zone-2");
    expect(updated1?.position?.x).toBe(0.9);
    expect(updated2?.position?.x).toBe(0.9);
  });
});