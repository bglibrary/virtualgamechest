import { create } from "zustand";
import type { GameDefinition, GameComponent } from "@/types/game";
import { useEditorHistoryStore } from "@/editor/stores/editorHistoryStore";

export interface EditorState {
  /** The ID of the game being edited (filename without .json). */
  gameId: string | null;
  /** The full game definition being edited. */
  game: GameDefinition | null;
  /** The currently selected component IDs. */
  selectedIds: string[];
  /** Whether there are unsaved changes. */
  isDirty: boolean;

  // Actions
  openGame: (gameId: string, game: GameDefinition) => void;
  closeGame: () => void;
  selectComponent: (id: string | null, multi?: boolean) => void;
  selectComponents: (ids: string[]) => void;
  markDirty: () => void;
  markClean: () => void;
  updateGame: (updater: (game: GameDefinition) => GameDefinition) => void;
  updateComponent: (
    componentId: string,
    updater: (component: GameComponent) => GameComponent,
  ) => void;
  updateComponents: (
    componentIds: string[],
    updater: (component: GameComponent) => GameComponent,
  ) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  gameId: null,
  game: null,
  selectedIds: [],
  isDirty: false,

  openGame: (gameId, game) =>
    set({
      gameId,
      game,
      selectedIds: [],
      isDirty: false,
    }),

  closeGame: () =>
    set({
      gameId: null,
      game: null,
      selectedIds: [],
      isDirty: false,
    }),

  selectComponent: (id, multi) =>
    set((state) => {
      if (!id) return { selectedIds: [] };
      if (multi) {
        const isSelected = state.selectedIds.includes(id);
        return {
          selectedIds: isSelected
            ? state.selectedIds.filter((sid) => sid !== id)
            : [...state.selectedIds, id],
        };
      }
      return { selectedIds: [id] };
    }),

  selectComponents: (ids) => set({ selectedIds: ids }),

  markDirty: () => set({ isDirty: true }),

  markClean: () => set({ isDirty: false }),

  updateGame: (updater) =>
    set((state) => {
      if (!state.game) return state;
      // Push snapshot before modification for undo
      useEditorHistoryStore.getState().pushSnapshot(state.game);
      return {
        game: updater(structuredClone(state.game)),
        isDirty: true,
      };
    }),

  updateComponent: (componentId, updater) =>
    set((state) => {
      if (!state.game) return state;
      // Push snapshot before modification for undo
      useEditorHistoryStore.getState().pushSnapshot(state.game);
      return {
        game: {
          ...state.game,
          components: state.game.components.map((c) =>
            c.id === componentId ? updater(c) : c,
          ),
        },
        isDirty: true,
      };
    }),

  updateComponents: (componentIds, updater) =>
    set((state) => {
      if (!state.game) return state;
      // Push snapshot before modification for undo
      useEditorHistoryStore.getState().pushSnapshot(state.game);
      return {
        game: {
          ...state.game,
          components: state.game.components.map((c) =>
            componentIds.includes(c.id) ? updater(c) : c,
          ),
        },
        isDirty: true,
      };
    }),
}));
