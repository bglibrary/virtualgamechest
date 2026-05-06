import { create } from "zustand";

interface CardStateStore {
  faceUp: Record<number, boolean>;
  selectedCardIndex: number | null;
  flipCard: (index: number) => void;
  isFaceUp: (index: number) => boolean;
  selectCard: (index: number | null) => void;
}

export const useCardStateStore = create<CardStateStore>((set, get) => ({
  faceUp: {},
  selectedCardIndex: null,
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
  selectCard: (index: number | null) => set({ selectedCardIndex: index }),
}));
