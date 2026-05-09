import { create } from "zustand";

interface CardZOrderStore {
  zOrder: string[];
  bringToTop: (id: string) => void;
  getZIndex: (id: string) => number;
  initZOrder: (ids: string[]) => void;
  resetZOrder: () => void;
}

export const useCardZOrderStore = create<CardZOrderStore>((set, get) => ({
  zOrder: [],
  bringToTop: (id: string) =>
    set((state) => {
      const idx = state.zOrder.indexOf(id);
      if (idx === -1) {
        return { zOrder: [...state.zOrder, id] };
      }
      const next = [...state.zOrder];
      next.splice(idx, 1);
      next.push(id);
      return { zOrder: next };
    }),
  getZIndex: (id: string) => {
    const idx = get().zOrder.indexOf(id);
    return idx === -1 ? 0 : idx;
  },
  initZOrder: (ids: string[]) => set({ zOrder: ids }),
  resetZOrder: () => set({ zOrder: [] }),
}));
