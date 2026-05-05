import { create } from "zustand";

interface CardStateStore {
  faceUp: Record<number, boolean>;
  flipCard: (index: number) => void;
  isFaceUp: (index: number) => boolean;
}

export const useCardStateStore = create<CardStateStore>((set, get) => ({
  faceUp: {},
  flipCard: (index: number) =>
    set((state) => {
      const current = state.faceUp[index] === undefined ? true : state.faceUp[index];
      return {
        faceUp: {
          ...state.faceUp,
          [index]: !current,
        },
      };
    }),
  isFaceUp: (index: number) => {
    const faceUp = get().faceUp[index];
    return faceUp === undefined ? true : faceUp;
  },
}));
