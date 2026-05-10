import { create } from "zustand";
import type { GameDefinition, GameComponent } from "@/types/game";

interface GameStore {
  game: GameDefinition | null;
  loading: boolean;
  error: string | null;
  setGame: (game: GameDefinition | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  replaceComponent: (id: string, newComponent: GameComponent) => void;
  removeComponent: (id: string) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  game: null,
  loading: false,
  error: null,
  setGame: (game) => set({ game, loading: false, error: null }),
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
}));
