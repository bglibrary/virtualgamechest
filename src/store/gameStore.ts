import { create } from "zustand";
import type { GameDefinition, GameComponent, Position } from "@/types/game";

interface GameStore {
  game: GameDefinition | null;
  loading: boolean;
  error: string | null;
  mergeCounter: number;
  setGame: (game: GameDefinition | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  replaceComponent: (id: string, newComponent: GameComponent) => void;
  removeComponent: (id: string) => void;
  addComponent: (component: GameComponent) => void;
  updateComponentPosition: (id: string, position: Position) => void;
  getNextMergeId: () => string;
}

export const useGameStore = create<GameStore>((set, get) => ({
  game: null,
  loading: false,
  error: null,
  mergeCounter: 0,
  setGame: (game) => set({ game, loading: false, error: null, mergeCounter: 0 }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
  replaceComponent: (id, newComponent) =>
    set((state) => {
      if (!state.game) return state;
      return {
        game: {
          ...state.game,
          components: state.game.components.map((c) =>
            c.id === id ? newComponent : c,
          ),
        },
      };
    }),
  removeComponent: (id) =>
    set((state) => {
      if (!state.game) return state;
      return {
        game: {
          ...state.game,
          components: state.game.components.filter((c) => c.id !== id),
        },
      };
    }),
  addComponent: (component) =>
    set((state) => {
      if (!state.game) return state;
      return {
        game: {
          ...state.game,
          components: [...state.game.components, component],
        },
      };
    }),
  updateComponentPosition: (id, position) =>
    set((state) => {
      if (!state.game) return state;
      return {
        game: {
          ...state.game,
          components: state.game.components.map((c) => {
            if (c.id !== id || c.type !== "card") return c;
            return { ...c, position };
          }),
        },
      };
    }),

  getNextMergeId: () => {
    const state = get();
    const existingIds = new Set(state.game?.components.map((c) => c.id) ?? []);
    let candidate = `merge--${state.mergeCounter}`;
    while (existingIds.has(candidate)) {
      set({ mergeCounter: state.mergeCounter + 1 });
      candidate = `merge--${get().mergeCounter}`;
    }
    set({ mergeCounter: get().mergeCounter + 1 });
    return candidate;
  },
}));
