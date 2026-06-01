import { useEffect } from "react";
import { useEditorStore } from "@/editor/stores/editorStore";
import { useEditorHistoryStore } from "@/editor/stores/editorHistoryStore";
import { getViewportSize } from "@/editor/stores/viewportStore";

/**
 * Registers global keyboard shortcuts:
 * - Ctrl+Z / Cmd+Z: Undo
 * - Ctrl+Shift+Z / Cmd+Shift+Z: Redo
 * - Arrow keys: Nudge selected component(s) by 1px
 * - Shift+Arrow keys: Nudge selected component(s) by 10px
 */
export function useEditorShortcuts() {
  const gameId = useEditorStore((s) => s.gameId);

  useEffect(() => {
    if (!gameId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts when typing in a text input/textarea/select
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable) {
        return;
      }
      const isMod = e.metaKey || e.ctrlKey;
      const editorStore = useEditorStore.getState();

      // Undo/Redo
      if (isMod && e.key === "z") {
        const historyStore = useEditorHistoryStore.getState();

        if (!e.shiftKey && historyStore.canUndo()) {
          e.preventDefault();
          const current = editorStore.game;
          const prev = historyStore.undo();
          if (prev && current) {
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
            useEditorHistoryStore.setState((s) => ({
              past: [...s.past, structuredClone(current)],
            }));
            editorStore.openGame(gameId, next);
            editorStore.markDirty();
          }
        }
        return;
      }

      // Nudge with arrow keys
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        const selectedIds = editorStore.selectedIds;
        const game = editorStore.game;
        if (!game || selectedIds.length === 0) return;

        e.preventDefault();

        const dxMap: Record<string, number> = {
          ArrowLeft: -1,
          ArrowRight: 1,
          ArrowUp: 0,
          ArrowDown: 0,
        };
        const dyMap: Record<string, number> = {
          ArrowLeft: 0,
          ArrowRight: 0,
          ArrowUp: -1,
          ArrowDown: 1,
        };

        const multiplier = e.shiftKey ? 10 : 1;
        const pixelDx = (dxMap[e.key] ?? 0) * multiplier;
        const pixelDy = (dyMap[e.key] ?? 0) * multiplier;

        const vp = getViewportSize();
        const normDx = pixelDx / vp.width;
        const normDy = pixelDy / vp.height;

        const updateComponents = useEditorStore.getState().updateComponents;
        updateComponents(selectedIds, (c) => {
          const baseX = c.position?.x ?? 0;
          const baseY = c.position?.y ?? 0;
          return {
            ...c,
            position: {
              x: Math.max(0, Math.min(1, baseX + normDx)),
              y: Math.max(0, Math.min(1, baseY + normDy)),
            },
          };
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameId]);
}