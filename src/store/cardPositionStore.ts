import { create } from "zustand";
import type { Position } from "@/types/game";

interface CardPositionStore {
  positions: Record<string, Position>;
  isDragging: boolean;
  updateCardPosition: (id: string, position: Position) => void;
  getCardPosition: (id: string) => Position | undefined;
  setDragging: (dragging: boolean) => void;
  resetPositions: () => void;
}

export const useCardPositionStore = create<CardPositionStore>((set, get) => ({
  positions: {},
  isDragging: false,
  updateCardPosition: (id, position) =>
    set((state) => ({
      positions: {
        ...state.positions,
        [id]: {
          x: Math.max(0, Math.min(1, position.x)),
          y: Math.max(0, Math.min(1, position.y)),
        },
      },
    })),
  getCardPosition: (id) => get().positions[id],
  setDragging: (dragging) => set({ isDragging: dragging }),
  resetPositions: () => set({ positions: {} }),
}));
