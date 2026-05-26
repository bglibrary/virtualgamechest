import { describe, it, expect, beforeEach } from "vitest";
import { useEditorStore } from "@/editor/stores/editorStore";
import type { GameDefinition, ZoneComponent, CardComponent } from "@/types/game";

function createMinimalGame(): GameDefinition {
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
  const card: CardComponent = {
    type: "card",
    id: "card-1",
    face: { type: "text", text: "Test" },
    position: { x: 0.1, y: 0.1 },
    actions: [{ type: "flip", label: "Flip" }],
  };
  return {
    name: "test-game",
    version: "1.0",
    components: [zone1, zone2, card],
  };
}

describe("editorStore multi-select actions", () => {
  beforeEach(() => {
    useEditorStore.setState({
      gameId: null,
      game: null,
      selectedIds: [],
      isDirty: false,
    });
  });

  describe("selectComponent", () => {
    it("should set selectedIds to [id] when called without multi", () => {
      useEditorStore.getState().selectComponent("zone-1");
      expect(useEditorStore.getState().selectedIds).toEqual(["zone-1"]);
    });

    it("should clear selection when called with null", () => {
      useEditorStore.setState({ selectedIds: ["zone-1", "zone-2"] });
      useEditorStore.getState().selectComponent(null);
      expect(useEditorStore.getState().selectedIds).toEqual([]);
    });

    it("should add id to selection when called with multi=true and id not selected", () => {
      useEditorStore.setState({ selectedIds: ["zone-1"] });
      useEditorStore.getState().selectComponent("zone-2", true);
      expect(useEditorStore.getState().selectedIds).toEqual(["zone-1", "zone-2"]);
    });

    it("should remove id from selection when called with multi=true and id already selected", () => {
      useEditorStore.setState({ selectedIds: ["zone-1", "zone-2"] });
      useEditorStore.getState().selectComponent("zone-1", true);
      expect(useEditorStore.getState().selectedIds).toEqual(["zone-2"]);
    });

    it("should replace selection when called without multi even if id was already selected", () => {
      useEditorStore.setState({ selectedIds: ["zone-1", "zone-2"] });
      useEditorStore.getState().selectComponent("zone-1");
      expect(useEditorStore.getState().selectedIds).toEqual(["zone-1"]);
    });
  });

  describe("selectComponents", () => {
    it("should set selectedIds to the given array", () => {
      useEditorStore.getState().selectComponents(["zone-1", "card-1"]);
      expect(useEditorStore.getState().selectedIds).toEqual(["zone-1", "card-1"]);
    });

    it("should clear selection when called with empty array", () => {
      useEditorStore.setState({ selectedIds: ["zone-1"] });
      useEditorStore.getState().selectComponents([]);
      expect(useEditorStore.getState().selectedIds).toEqual([]);
    });

    it("should replace previous selection", () => {
      useEditorStore.setState({ selectedIds: ["zone-1"] });
      useEditorStore.getState().selectComponents(["card-1"]);
      expect(useEditorStore.getState().selectedIds).toEqual(["card-1"]);
    });
  });

  describe("updateComponents", () => {
    beforeEach(() => {
      const game = createMinimalGame();
      useEditorStore.getState().openGame("test", game);
    });

    it("should update multiple components by applying the updater", () => {
      useEditorStore.getState().updateComponents(["zone-1", "zone-2"], (c) => ({
        ...c,
        position: { x: 0.9, y: 0.9 },
      }));
      const state = useEditorStore.getState();
      const zone1 = state.game?.components.find((c) => c.id === "zone-1");
      const zone2 = state.game?.components.find((c) => c.id === "zone-2");
      const card = state.game?.components.find((c) => c.id === "card-1");
      expect(zone1?.position?.x).toBe(0.9);
      expect(zone2?.position?.x).toBe(0.9);
      expect(card?.position?.x).toBe(0.1);
    });

    it("should set isDirty to true", () => {
      useEditorStore.getState().updateComponents(["zone-1"], (c) => c);
      expect(useEditorStore.getState().isDirty).toBe(true);
    });

    it("should not crash when game is null", () => {
      useEditorStore.setState({ game: null });
      useEditorStore.getState().updateComponents(["zone-1"], (c) => c);
    });

    it("should not modify components not in the list", () => {
      useEditorStore.getState().updateComponents(["zone-1"], (c) => ({
        ...c,
        position: { x: 0.99, y: 0.99 },
      }));
      const state = useEditorStore.getState();
      const zone2 = state.game?.components.find((c) => c.id === "zone-2");
      expect(zone2?.position?.x).toBe(0.5);
    });
  });

  describe("openGame and closeGame", () => {
    it("should clear selectedIds when opening a new game", () => {
      useEditorStore.setState({ selectedIds: ["zone-1"] });
      const game = createMinimalGame();
      useEditorStore.getState().openGame("test", game);
      expect(useEditorStore.getState().selectedIds).toEqual([]);
    });

    it("should clear selectedIds when closing a game", () => {
      useEditorStore.setState({ selectedIds: ["zone-1"], game: {} as GameDefinition });
      useEditorStore.getState().closeGame();
      expect(useEditorStore.getState().selectedIds).toEqual([]);
    });
  });
});