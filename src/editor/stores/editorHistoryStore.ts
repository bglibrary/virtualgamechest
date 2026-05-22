import { create } from "zustand";
import type { GameDefinition } from "@/types/game";

const MAX_HISTORY = 50;

export interface EditorHistoryState {
  past: GameDefinition[];
  future: GameDefinition[];

  pushSnapshot: (game: GameDefinition) => void;
  undo: () => GameDefinition | null;
  redo: () => GameDefinition | null;
  clear: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const useEditorHistoryStore = create<EditorHistoryState>((set, get) => ({
  past: [],
  future: [],

  pushSnapshot: (game) =>
    set((state) => {
      const snapshot = structuredClone(game);
      const past = [...state.past, snapshot];
      if (past.length > MAX_HISTORY) {
        past.shift();
      }
      return { past, future: [] };
    }),

  undo: () => {
    const state = get();
    if (state.past.length === 0) return null;
    const prev = state.past[state.past.length - 1];
    set({ past: state.past.slice(0, -1) });
    return prev;
  },

  redo: () => {
    const state = get();
    if (state.future.length === 0) return null;
    const next = state.future[state.future.length - 1];
    set({ future: state.future.slice(0, -1) });
    return next;
  },

  clear: () => set({ past: [], future: [] }),

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
}));