import { create } from "zustand";

interface CardStateStore {
  faceUp: Record<string, boolean>;
  selectedComponentId: string | null;
  flipCard: (id: string) => void;
  isFaceUp: (id: string) => boolean;
  selectComponent: (id: string | null) => void;
  setFaceUp: (id: string, faceUp: boolean) => void;
}

export const useCardStateStore = create<CardStateStore>((set, get) => ({
  faceUp: {},
  selectedComponentId: null,
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
  selectComponent: (id: string | null) => set({ selectedComponentId: id }),
  setFaceUp: (id: string, faceUp: boolean) =>
    set((state) => ({
      faceUp: { ...state.faceUp, [id]: faceUp },
    })),
}));
