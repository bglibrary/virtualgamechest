import { useEffect } from "react";
import { useEditorStore } from "@/editor/stores/editorStore";
import { useEditorHistoryStore } from "@/editor/stores/editorHistoryStore";

/**
 * Registers global keyboard shortcuts:
 * - Ctrl+Z / Cmd+Z: Undo
 * - Ctrl+Shift+Z / Cmd+Shift+Z: Redo
 */
export function useEditorShortcuts() {
  const gameId = useEditorStore((s) => s.gameId);

  useEffect(() => {
    if (!gameId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod || e.key !== "z") return;

      const historyStore = useEditorHistoryStore.getState();
      const editorStore = useEditorStore.getState();

      if (!e.shiftKey && historyStore.canUndo()) {
        e.preventDefault();
        const current = editorStore.game;
        const prev = historyStore.undo();
        if (prev && current) {
          // Push current to future for redo
          useEditorHistoryStore.setState((s) => ({
            future: [...s.future, structuredClone(current)],
          }));
          editorStore.openGame(gameId, prev);
          editorStore.markDirty();
        }
      } else if (e.shiftKey && historyStore.canRedo()) {
        e.preventDefault();
        const current = editorStore.game;
        const next = historyStore.redo();
        if (next && current) {
          // Push current back to past for undo
          useEditorHistoryStore.setState((s) => ({
            past: [...s.past, structuredClone(current)],
          }));
          editorStore.openGame(gameId, next);
          editorStore.markDirty();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameId]);
}