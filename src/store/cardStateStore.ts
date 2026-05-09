import { create } from "zustand";

interface CardStateStore {
  faceUp: Record<string, boolean>;
  selectedCardId: string | null;
  flipCard: (id: string) => void;
  isFaceUp: (id: string) => boolean;
  selectCard: (id: string | null) => void;
}

export const useCardStateStore = create<CardStateStore>((set, get) => ({
  faceUp: {},
  selectedCardId: null,
  flipCard: (id: string) =>
    set((state) => {
      const current = state.faceUp[id] === undefined ? true : state.faceUp[id];
      return {
        faceUp: {
          ...state.faceUp,
          [id]: !current,
        },
      };
    }),
  isFaceUp: (id: string) => {
    const faceUp = get().faceUp[id];
    return faceUp === undefined ? true : faceUp;
  },
  selectCard: (id: string | null) => set({ selectedCardId: id }),
}));
