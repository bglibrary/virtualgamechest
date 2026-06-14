import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEditorStore } from "@/editor/stores/editorStore";
import LayoutTools from "../LayoutTools";
import type { GameDefinition, ZoneComponent } from "@/types/game";

function createGameWithComponents(components: ZoneComponent[]): GameDefinition {
  return {
    name: "test-game",
    version: "1.0",
    components,
  };
}

describe("LayoutTools", () => {
  beforeEach(() => {
    useEditorStore.setState({
      gameId: null,
      game: null,
      selectedIds: [],
      isDirty: false,
    });
  });

  describe("alignment", () => {
    it("should align left to minimum X", async () => {
      const zones = [
        { type: "zone" as const, id: "z1", position: { x: 0.5, y: 0.5 }, label: "Z1", snapRadius: 30, hideCountBadge: false },
        { type: "zone" as const, id: "z2", position: { x: 0.3, y: 0.7 }, label: "Z2", snapRadius: 30, hideCountBadge: false },
        { type: "zone" as const, id: "z3", position: { x: 0.8, y: 0.2 }, label: "Z3", snapRadius: 30, hideCountBadge: false },
      ];
      const game = createGameWithComponents(zones);
      useEditorStore.getState().openGame("test", game);

      render(<LayoutTools components={zones} />);
      await userEvent.click(screen.getByTitle("Align Left"));

      const updated = useEditorStore.getState().game?.components;
      expect(updated?.find((c) => c.id === "z1")?.position?.x).toBe(0.3);
      expect(updated?.find((c) => c.id === "z2")?.position?.x).toBe(0.3);
      expect(updated?.find((c) => c.id === "z3")?.position?.x).toBe(0.3);
    });

    it("should align right to maximum X", async () => {
      const zones = [
        { type: "zone" as const, id: "z1", position: { x: 0.5, y: 0.5 }, label: "Z1", snapRadius: 30, hideCountBadge: false },
        { type: "zone" as const, id: "z2", position: { x: 0.3, y: 0.7 }, label: "Z2", snapRadius: 30, hideCountBadge: false },
        { type: "zone" as const, id: "z3", position: { x: 0.8, y: 0.2 }, label: "Z3", snapRadius: 30, hideCountBadge: false },
      ];
      const game = createGameWithComponents(zones);
      useEditorStore.getState().openGame("test", game);

      render(<LayoutTools components={zones} />);
      await userEvent.click(screen.getByTitle("Align Right"));

      const updated = useEditorStore.getState().game?.components;
      expect(updated?.find((c) => c.id === "z1")?.position?.x).toBe(0.8);
      expect(updated?.find((c) => c.id === "z2")?.position?.x).toBe(0.8);
      expect(updated?.find((c) => c.id === "z3")?.position?.x).toBe(0.8);
    });

    it("should align center to average X", async () => {
      const zones = [
        { type: "zone" as const, id: "z1", position: { x: 0.5, y: 0.5 }, label: "Z1", snapRadius: 30, hideCountBadge: false },
        { type: "zone" as const, id: "z2", position: { x: 0.3, y: 0.7 }, label: "Z2", snapRadius: 30, hideCountBadge: false },
        { type: "zone" as const, id: "z3", position: { x: 0.8, y: 0.2 }, label: "Z3", snapRadius: 30, hideCountBadge: false },
      ];
      const game = createGameWithComponents(zones);
      useEditorStore.getState().openGame("test", game);

      render(<LayoutTools components={zones} />);
      await userEvent.click(screen.getByTitle("Align Center (H)"));

      const updated = useEditorStore.getState().game?.components;
      const avg = (0.5 + 0.3 + 0.8) / 3;
      expect(updated?.find((c) => c.id === "z1")?.position?.x).toBeCloseTo(avg, 5);
      expect(updated?.find((c) => c.id === "z2")?.position?.x).toBeCloseTo(avg, 5);
      expect(updated?.find((c) => c.id === "z3")?.position?.x).toBeCloseTo(avg, 5);
    });

    it("should align top to minimum Y", async () => {
      const zones = [
        { type: "zone" as const, id: "z1", position: { x: 0.5, y: 0.5 }, label: "Z1", snapRadius: 30, hideCountBadge: false },
        { type: "zone" as const, id: "z2", position: { x: 0.3, y: 0.7 }, label: "Z2", snapRadius: 30, hideCountBadge: false },
        { type: "zone" as const, id: "z3", position: { x: 0.8, y: 0.2 }, label: "Z3", snapRadius: 30, hideCountBadge: false },
      ];
      const game = createGameWithComponents(zones);
      useEditorStore.getState().openGame("test", game);

      render(<LayoutTools components={zones} />);
      await userEvent.click(screen.getByTitle("Align Top"));

      const updated = useEditorStore.getState().game?.components;
      expect(updated?.find((c) => c.id === "z1")?.position?.y).toBe(0.2);
      expect(updated?.find((c) => c.id === "z2")?.position?.y).toBe(0.2);
      expect(updated?.find((c) => c.id === "z3")?.position?.y).toBe(0.2);
    });

    it("should align middle to average Y", async () => {
      const zones = [
        { type: "zone" as const, id: "z1", position: { x: 0.5, y: 0.5 }, label: "Z1", snapRadius: 30, hideCountBadge: false },
        { type: "zone" as const, id: "z2", position: { x: 0.3, y: 0.7 }, label: "Z2", snapRadius: 30, hideCountBadge: false },
        { type: "zone" as const, id: "z3", position: { x: 0.8, y: 0.2 }, label: "Z3", snapRadius: 30, hideCountBadge: false },
      ];
      const game = createGameWithComponents(zones);
      useEditorStore.getState().openGame("test", game);

      render(<LayoutTools components={zones} />);
      await userEvent.click(screen.getByTitle("Align Middle (V)"));

      const updated = useEditorStore.getState().game?.components;
      const avg = (0.5 + 0.7 + 0.2) / 3;
      expect(updated?.find((c) => c.id === "z1")?.position?.y).toBeCloseTo(avg, 5);
      expect(updated?.find((c) => c.id === "z2")?.position?.y).toBeCloseTo(avg, 5);
      expect(updated?.find((c) => c.id === "z3")?.position?.y).toBeCloseTo(avg, 5);
    });

    it("should align bottom to maximum Y", async () => {
      const zones = [
        { type: "zone" as const, id: "z1", position: { x: 0.5, y: 0.5 }, label: "Z1", snapRadius: 30, hideCountBadge: false },
        { type: "zone" as const, id: "z2", position: { x: 0.3, y: 0.7 }, label: "Z2", snapRadius: 30, hideCountBadge: false },
        { type: "zone" as const, id: "z3", position: { x: 0.8, y: 0.2 }, label: "Z3", snapRadius: 30, hideCountBadge: false },
      ];
      const game = createGameWithComponents(zones);
      useEditorStore.getState().openGame("test", game);

      render(<LayoutTools components={zones} />);
      await userEvent.click(screen.getByTitle("Align Bottom"));

      const updated = useEditorStore.getState().game?.components;
      expect(updated?.find((c) => c.id === "z1")?.position?.y).toBe(0.7);
      expect(updated?.find((c) => c.id === "z2")?.position?.y).toBe(0.7);
      expect(updated?.find((c) => c.id === "z3")?.position?.y).toBe(0.7);
    });

    it("should only affect the relevant axis for horizontal alignment", async () => {
      const zones = [
        { type: "zone" as const, id: "z1", position: { x: 0.5, y: 0.5 }, label: "Z1", snapRadius: 30, hideCountBadge: false },
        { type: "zone" as const, id: "z2", position: { x: 0.3, y: 0.7 }, label: "Z2", snapRadius: 30, hideCountBadge: false },
      ];
      const game = createGameWithComponents(zones);
      useEditorStore.getState().openGame("test", game);

      render(<LayoutTools components={zones} />);
      await userEvent.click(screen.getByTitle("Align Left"));

      const updated = useEditorStore.getState().game?.components;
      expect(updated?.find((c) => c.id === "z1")?.position?.y).toBe(0.5);
      expect(updated?.find((c) => c.id === "z2")?.position?.y).toBe(0.7);
    });

    it("should only affect the relevant axis for vertical alignment", async () => {
      const zones = [
        { type: "zone" as const, id: "z1", position: { x: 0.5, y: 0.5 }, label: "Z1", snapRadius: 30, hideCountBadge: false },
        { type: "zone" as const, id: "z2", position: { x: 0.3, y: 0.7 }, label: "Z2", snapRadius: 30, hideCountBadge: false },
      ];
      const game = createGameWithComponents(zones);
      useEditorStore.getState().openGame("test", game);

      render(<LayoutTools components={zones} />);
      await userEvent.click(screen.getByTitle("Align Top"));

      const updated = useEditorStore.getState().game?.components;
      expect(updated?.find((c) => c.id === "z1")?.position?.x).toBe(0.5);
      expect(updated?.find((c) => c.id === "z2")?.position?.x).toBe(0.3);
    });

    it("should be a no-op with fewer than 2 components", async () => {
      const zone = { type: "zone" as const, id: "z1", position: { x: 0.5, y: 0.5 }, label: "Z1", snapRadius: 30, hideCountBadge: false };
      const game = createGameWithComponents([zone]);
      useEditorStore.getState().openGame("test", game);

      render(<LayoutTools components={[zone]} />);
      await userEvent.click(screen.getByTitle("Align Left"));

      const updated = useEditorStore.getState().game?.components[0];
      expect(updated?.position?.x).toBe(0.5);
    });
  });

  describe("distribution", () => {
    it("should distribute horizontally evenly", async () => {
      const zones = [
        { type: "zone" as const, id: "z1", position: { x: 0.1, y: 0.5 }, label: "Z1", snapRadius: 30, hideCountBadge: false },
        { type: "zone" as const, id: "z2", position: { x: 0.3, y: 0.5 }, label: "Z2", snapRadius: 30, hideCountBadge: false },
        { type: "zone" as const, id: "z3", position: { x: 0.9, y: 0.5 }, label: "Z3", snapRadius: 30, hideCountBadge: false },
      ];
      const game = createGameWithComponents(zones);
      useEditorStore.getState().openGame("test", game);

      render(<LayoutTools components={zones} />);
      await userEvent.click(screen.getByTitle("Distribute Horizontally"));

      const updated = useEditorStore.getState().game?.components;
      const z1 = updated?.find((c) => c.id === "z1");
      const z2 = updated?.find((c) => c.id === "z2");
      const z3 = updated?.find((c) => c.id === "z3");
      expect(z1?.position?.x).toBe(0.1);
      expect(z2?.position?.x).toBeCloseTo(0.5, 5);
      expect(z3?.position?.x).toBe(0.9);
    });

    it("should distribute vertically evenly", async () => {
      const zones = [
        { type: "zone" as const, id: "z1", position: { x: 0.5, y: 0.1 }, label: "Z1", snapRadius: 30, hideCountBadge: false },
        { type: "zone" as const, id: "z2", position: { x: 0.5, y: 0.3 }, label: "Z2", snapRadius: 30, hideCountBadge: false },
        { type: "zone" as const, id: "z3", position: { x: 0.5, y: 0.9 }, label: "Z3", snapRadius: 30, hideCountBadge: false },
      ];
      const game = createGameWithComponents(zones);
      useEditorStore.getState().openGame("test", game);

      render(<LayoutTools components={zones} />);
      await userEvent.click(screen.getByTitle("Distribute Vertically"));

      const updated = useEditorStore.getState().game?.components;
      const z1 = updated?.find((c) => c.id === "z1");
      const z2 = updated?.find((c) => c.id === "z2");
      const z3 = updated?.find((c) => c.id === "z3");
      expect(z1?.position?.y).toBe(0.1);
      expect(z2?.position?.y).toBeCloseTo(0.5, 5);
      expect(z3?.position?.y).toBe(0.9);
    });

    it("should be a no-op with fewer than 3 components", async () => {
      const zones = [
        { type: "zone" as const, id: "z1", position: { x: 0.1, y: 0.5 }, label: "Z1", snapRadius: 30, hideCountBadge: false },
        { type: "zone" as const, id: "z2", position: { x: 0.9, y: 0.5 }, label: "Z2", snapRadius: 30, hideCountBadge: false },
      ];
      const game = createGameWithComponents(zones);
      useEditorStore.getState().openGame("test", game);

      render(<LayoutTools components={zones} />);
      await userEvent.click(screen.getByTitle("Distribute Horizontally"));

      const updated = useEditorStore.getState().game?.components;
      expect(updated?.find((c) => c.id === "z1")?.position?.x).toBe(0.1);
      expect(updated?.find((c) => c.id === "z2")?.position?.x).toBe(0.9);
    });

    it("should keep first and last component positions when distributing", async () => {
      const zones = [
        { type: "zone" as const, id: "z1", position: { x: 0.1, y: 0.5 }, label: "Z1", snapRadius: 30, hideCountBadge: false },
        { type: "zone" as const, id: "z2", position: { x: 0.3, y: 0.5 }, label: "Z2", snapRadius: 30, hideCountBadge: false },
        { type: "zone" as const, id: "z3", position: { x: 0.7, y: 0.5 }, label: "Z3", snapRadius: 30, hideCountBadge: false },
        { type: "zone" as const, id: "z4", position: { x: 0.9, y: 0.5 }, label: "Z4", snapRadius: 30, hideCountBadge: false },
      ];
      const game = createGameWithComponents(zones);
      useEditorStore.getState().openGame("test", game);

      render(<LayoutTools components={zones} />);
      await userEvent.click(screen.getByTitle("Distribute Horizontally"));

      const updated = useEditorStore.getState().game?.components;
      expect(updated?.find((c) => c.id === "z1")?.position?.x).toBe(0.1);
      expect(updated?.find((c) => c.id === "z4")?.position?.x).toBe(0.9);
    });
  });

  describe("rendering", () => {
    it("should render all alignment buttons", () => {
      const zones = [
        { type: "zone" as const, id: "z1", position: { x: 0.5, y: 0.5 }, label: "Z1", snapRadius: 30, hideCountBadge: false },
        { type: "zone" as const, id: "z2", position: { x: 0.3, y: 0.7 }, label: "Z2", snapRadius: 30, hideCountBadge: false },
      ];
      render(<LayoutTools components={zones} />);

      expect(screen.getByTitle("Align Left")).toBeInTheDocument();
      expect(screen.getByTitle("Align Center (H)")).toBeInTheDocument();
      expect(screen.getByTitle("Align Right")).toBeInTheDocument();
      expect(screen.getByTitle("Align Top")).toBeInTheDocument();
      expect(screen.getByTitle("Align Middle (V)")).toBeInTheDocument();
      expect(screen.getByTitle("Align Bottom")).toBeInTheDocument();
      expect(screen.getByTitle("Distribute Horizontally")).toBeInTheDocument();
      expect(screen.getByTitle("Distribute Vertically")).toBeInTheDocument();
    });
  });
});