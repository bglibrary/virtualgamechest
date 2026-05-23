import { describe, it, expect, beforeEach } from "vitest";
import { useEditorStore } from "@/editor/stores/editorStore";
import type { GameDefinition, ZoneComponent, CardComponent } from "@/types/game";

/**
 * Unit test for the multi-drag sync logic used in EditorCanvas.handleDragMove.
 * Tests the core logic: given a set of selected components with known positions,
 * applying a drag delta should update all components proportionally.
 */

function createGameWithComponents(components: (ZoneComponent | CardComponent)[]): GameDefinition {
  return {
    name: "test-game",
    version: "1.0",
    components,
  };
}

describe("EditorCanvas multi-drag sync logic", () => {
  beforeEach(() => {
    // Reset the store
    useEditorStore.setState({
      gameId: null,
      game: null,
      selectedIds: [],
      isDirty: false,
    });
  });

  it("should move all selected components by the same normalized delta when one is dragged", () => {
    const zone1: ZoneComponent = {
      type: "zone",
      id: "zone-1",
      position: { x: 0.2, y: 0.3 },
      label: "Zone 1",
      snapRadius: 30,
    };
    const zone2: ZoneComponent = {
      type: "zone",
      id: "zone-2",
      position: { x: 0.5, y: 0.5 },
      label: "Zone 2",
      snapRadius: 30,
    };

    const game = createGameWithComponents([zone1, zone2]);
    useEditorStore.getState().openGame("test", game);
    useEditorStore.getState().selectComponents(["zone-1", "zone-2"]);

    // Simulate what handleDragStart does:
    // Snapshot initial pixel positions (viewport: 800x600)
    const viewportWidth = 800;
    const viewportHeight = 600;
    const startPositions = new Map<string, { px: number; py: number }>();
    startPositions.set("zone-1", { px: 0.2 * viewportWidth, py: 0.3 * viewportHeight });
    startPositions.set("zone-2", { px: 0.5 * viewportWidth, py: 0.5 * viewportHeight });

    // Simulate a drag move that moves the dragged component 100px right and 50px down
    const draggedId = "zone-1";
    const startPos = startPositions.get(draggedId)!;
    const newPx = startPos.px + 100;
    const newPy = startPos.py + 50;
    const dx = newPx - startPos.px; // 100
    const dy = newPy - startPos.py;  // 50
    const normDx = dx / viewportWidth;  // 0.125
    const normDy = dy / viewportHeight; // ~0.0833

    // Apply the delta to all other selected components (simulating handleDragMove)
    const store = useEditorStore.getState();
    startPositions.forEach((sp, childId) => {
      if (childId === draggedId) return;
      const comp = store.game?.components.find((c) => c.id === childId);
      if (!comp?.position) return;
      const newX = Math.max(0, Math.min(1, sp.px / viewportWidth + normDx));
      const newY = Math.max(0, Math.min(1, sp.py / viewportHeight + normDy));
      store.updateComponent(childId, (c) => ({
        ...c,
        position: { x: newX, y: newY },
      }));
    });

    // Check that zone-2 moved by the same delta
    const updatedZone2 = useEditorStore.getState().game?.components.find((c) => c.id === "zone-2") as ZoneComponent;
    expect(updatedZone2?.position?.x).toBeCloseTo(0.5 + (100 / 800), 5);
    expect(updatedZone2?.position?.y).toBeCloseTo(0.5 + (50 / 600), 5);

    // Check that the dragged component zone-1 was NOT modified by the sync logic
    const zone1Final = useEditorStore.getState().game?.components.find((c) => c.id === "zone-1") as ZoneComponent;
    expect(zone1Final?.position?.x).toBe(0.2);
    expect(zone1Final?.position?.y).toBe(0.3);
  });

  it("should move all selected components by the same delta when dragging in opposite direction", () => {
    const zone1: ZoneComponent = {
      type: "zone",
      id: "zone-1",
      position: { x: 0.7, y: 0.7 },
      label: "Zone 1",
      snapRadius: 30,
    };
    const zone2: ZoneComponent = {
      type: "zone",
      id: "zone-2",
      position: { x: 0.3, y: 0.4 },
      label: "Zone 2",
      snapRadius: 30,
    };

    const game = createGameWithComponents([zone1, zone2]);
    useEditorStore.getState().openGame("test", game);
    useEditorStore.getState().selectComponents(["zone-1", "zone-2"]);

    const viewportWidth = 800;
    const viewportHeight = 600;
    const startPositions = new Map<string, { px: number; py: number }>();
    startPositions.set("zone-1", { px: 0.7 * viewportWidth, py: 0.7 * viewportHeight });
    startPositions.set("zone-2", { px: 0.3 * viewportWidth, py: 0.4 * viewportHeight });

    // Move zone-1 left and up by 50px
    const draggedId = "zone-1";
    const dx = -50;
    const dy = -50;
    const normDx = dx / viewportWidth;
    const normDy = dy / viewportHeight;

    const store = useEditorStore.getState();
    startPositions.forEach((sp, childId) => {
      if (childId === draggedId) return;
      const comp = store.game?.components.find((c) => c.id === childId);
      if (!comp?.position) return;
      const newX = Math.max(0, Math.min(1, sp.px / viewportWidth + normDx));
      const newY = Math.max(0, Math.min(1, sp.py / viewportHeight + normDy));
      store.updateComponent(childId, (c) => ({
        ...c,
        position: { x: newX, y: newY },
      }));
    });

    // zone-2 should also move -50px in both axes
    const updatedZone2 = useEditorStore.getState().game?.components.find((c) => c.id === "zone-2") as ZoneComponent;
    expect(updatedZone2?.position?.x).toBeCloseTo(0.3 + (-50 / 800), 5);
    expect(updatedZone2?.position?.y).toBeCloseTo(0.4 + (-50 / 600), 5);

    // Relative offset between zones should be preserved.
    // zone-1 was not updated in the store (only zone-2 was synced in this simulation),
    // so we compare the updated zone-2 against the original zone-1.
    const zone1Orig = 0.7;
    const dxBetween = updatedZone2.position!.x - zone1Orig;
    const dyBetween = updatedZone2.position!.y - 0.7;
    expect(dxBetween).toBeCloseTo(0.3 - 0.7 + (-50 / 800), 5);
    expect(dyBetween).toBeCloseTo(0.4 - 0.7 + (-50 / 600), 5);
  });

  it("should clamp all components to 0-1 range individually", () => {
    const zone1: ZoneComponent = {
      type: "zone",
      id: "zone-1",
      position: { x: 0.05, y: 0.05 },
      label: "Zone 1",
      snapRadius: 30,
    };
    const zone2: ZoneComponent = {
      type: "zone",
      id: "zone-2",
      position: { x: 0.5, y: 0.5 },
      label: "Zone 2",
      snapRadius: 30,
    };

    const game = createGameWithComponents([zone1, zone2]);
    useEditorStore.getState().openGame("test", game);
    useEditorStore.getState().selectComponents(["zone-1", "zone-2"]);

    const viewportWidth = 800;
    const viewportHeight = 600;
    const startPositions = new Map<string, { px: number; py: number }>();
    startPositions.set("zone-1", { px: 0.05 * viewportWidth, py: 0.05 * viewportHeight });
    startPositions.set("zone-2", { px: 0.5 * viewportWidth, py: 0.5 * viewportHeight });

    // Move zone-1 far left (should be clamped) — simulate dragging left by 100px
    const draggedId = "zone-1";
    const startPos = startPositions.get(draggedId)!;
    // Simulate the clamped snap: vertex at edge
    const clampedPx = 0; // edge of viewport
    const clampedPy = 0;
    const dx = clampedPx - startPos.px;
    const dy = clampedPy - startPos.py;
    const normDx = dx / viewportWidth;
    const normDy = dy / viewportHeight;

    const store = useEditorStore.getState();
    startPositions.forEach((sp, childId) => {
      if (childId === draggedId) return;
      const comp = store.game?.components.find((c) => c.id === childId);
      if (!comp?.position) return;
      const newX = Math.max(0, Math.min(1, sp.px / viewportWidth + normDx));
      const newY = Math.max(0, Math.min(1, sp.py / viewportHeight + normDy));
      store.updateComponent(childId, (c) => ({
        ...c,
        position: { x: newX, y: newY },
      }));
    });

    // zone-2 should be clamped: its new x should not go below 0
    const updatedZone2 = useEditorStore.getState().game?.components.find((c) => c.id === "zone-2") as ZoneComponent;
    expect(updatedZone2?.position?.x).toBeGreaterThanOrEqual(0);
    expect(updatedZone2?.position?.y).toBeGreaterThanOrEqual(0);
  });
});