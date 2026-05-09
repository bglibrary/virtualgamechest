import { create } from "zustand";
import type { Position } from "@/types/game";

interface CardPositionStore {
  positions: Record<number, Position>;
  isDragging: boolean;
  updateCardPosition: (index: number, position: Position) => void;
  getCardPosition: (index: number) => Position | undefined;
  setDragging: (dragging: boolean) => void;
  resetPositions: () => void;
}

export const useCardPositionStore = create<CardPositionStore>((set, get) => ({
  positions: {},
  isDragging: false,
  updateCardPosition: (index, position) =>
    set((state) => ({
      positions: {
        ...state.positions,
        [index]: {
          x: Math.max(0, Math.min(1, position.x)),
          y: Math.max(0, Math.min(1, position.y)),
        },
      },
    })),
  getCardPosition: (index) => get().positions[index],
  setDragging: (dragging) => set({ isDragging: dragging }),
  resetPositions: () => set({ positions: {} }),
}));
