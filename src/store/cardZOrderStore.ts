import { create } from "zustand";

interface CardZOrderStore {
  zOrder: string[];
  bringToTop: (id: string) => void;
  getZIndex: (id: string) => number;
  initZOrder: (ids: string[]) => void;
  resetZOrder: () => void;
  insertAfter: (afterId: string, newId: string) => void;
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
  initZOrder: (ids: string[]) =>
    set((state) => {
      const existingSet = new Set(state.zOrder);
      const newIds = ids.filter((id) => !existingSet.has(id));
      const removedSet = new Set(ids);
      const kept = state.zOrder.filter((id) => removedSet.has(id));
      return { zOrder: [...kept, ...newIds] };
    }),
  resetZOrder: () => set({ zOrder: [] }),
  insertAfter: (afterId: string, newId: string) =>
    set((state) => {
      const idx = state.zOrder.indexOf(afterId);
      if (idx === -1) {
        return { zOrder: [...state.zOrder, newId] };
      }
      const next = [...state.zOrder];
      next.splice(idx + 1, 0, newId);
      return { zOrder: next };
    }),
}));
