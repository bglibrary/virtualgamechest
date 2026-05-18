import { create } from "zustand";
import { logZOrder } from "@/utils/debugZOrder";

interface CardZOrderStore {
  zOrder: string[];
  bringToTop: (id: string) => void;
  getZIndex: (id: string) => number;
  initZOrder: (ids: string[]) => void;
  resetZOrder: () => void;
  insertAfter: (afterId: string, newId: string) => void;
  replace: (oldId: string, newId: string) => void;
  removeFromZOrder: (id: string) => void;
}

export const useCardZOrderStore = create<CardZOrderStore>((set, get) => ({
  zOrder: [],
  bringToTop: (id: string) =>
  set((state) => {
    const idx = state.zOrder.indexOf(id);
    if (idx === -1) {
      logZOrder(`bringToTop("${id}") — unknown, append`);
      return { zOrder: [...state.zOrder, id] };
    }
    const next = [...state.zOrder];
    next.splice(idx, 1);
    next.push(id);
    logZOrder(`bringToTop("${id}")`, idx, "→", next.length - 1);
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
    logZOrder(`initZOrder([${ids.length} ids])`, "kept:", kept.length, "new:", newIds.length);
    return { zOrder: [...kept, ...newIds] };
  }),
  resetZOrder: () => set({ zOrder: [] }),
  replace: (oldId: string, newId: string) =>
    set((state) => {
      const idx = state.zOrder.indexOf(oldId);
      if (idx === -1) {
        logZOrder(`replace("${oldId}", "${newId}") — oldId not found, append`);
        return { zOrder: [...state.zOrder, newId] };
      }
      const next = [...state.zOrder];
      next[idx] = newId;
      logZOrder(`replace("${oldId}", "${newId}")`, "pos:", idx);
      return { zOrder: next };
    }),
  insertAfter: (afterId: string, newId: string) =>
  set((state) => {
    const idx = state.zOrder.indexOf(afterId);
    if (idx === -1) {
      logZOrder(`insertAfter("${afterId}", "${newId}") — afterId not found, append`);
      return { zOrder: [...state.zOrder, newId] };
    }
    const next = [...state.zOrder];
    next.splice(idx + 1, 0, newId);
    logZOrder(`insertAfter("${afterId}", "${newId}")`, "pos:", idx + 1);
    return { zOrder: next };
  }),
  removeFromZOrder: (id: string) =>
    set((state) => {
      const idx = state.zOrder.indexOf(id);
      if (idx === -1) return state;
      const next = [...state.zOrder];
      next.splice(idx, 1);
      logZOrder(`removeFromZOrder("${id}")`, "pos:", idx);
      return { zOrder: next };
    }),
}));
