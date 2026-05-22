import { useEffect, useRef } from "react";
import { useEditorStore } from "@/editor/stores/editorStore";
import { useEditorHistoryStore } from "@/editor/stores/editorHistoryStore";

const DEBOUNCE_MS = 2000;

function getDraftKey(gameId: string): string {
  return `editor-draft-${gameId}`;
}

/**
 * Auto-saves the current game draft to localStorage (debounced).
 * Restores draft on mount if available.
 * Clears draft on clean/markClean.
 */
export function useDraftPersistence() {
  const gameId = useEditorStore((s) => s.gameId);
  const game = useEditorStore((s) => s.game);
  const isDirty = useEditorStore((s) => s.isDirty);
  const openGame = useEditorStore((s) => s.openGame);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore draft on mount
  useEffect(() => {
    if (!gameId) return;

    const draftKey = getDraftKey(gameId);
    try {
      const draftData = localStorage.getItem(draftKey);
      if (draftData) {
        const parsed = JSON.parse(draftData);
        if (parsed && typeof parsed === "object" && parsed.name) {
          openGame(gameId, parsed);
          // Keep dirty flag since it's a draft
          useEditorStore.getState().markDirty();
          // Clear history since we're restoring from draft
          useEditorHistoryStore.getState().clear();
        }
      }
    } catch {
      // Corrupted draft data — ignore
      localStorage.removeItem(draftKey);
    }
  }, [gameId, openGame]);

  // Auto-save debounced
  useEffect(() => {
    if (!gameId || !game || !isDirty) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      try {
        const draftKey = getDraftKey(gameId);
        localStorage.setItem(draftKey, JSON.stringify(game));
      } catch {
        // localStorage full — silently fail
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [gameId, game, isDirty]);

  // Clear draft on markClean
  useEffect(() => {
    if (!gameId) return;

    const unsub = useEditorStore.subscribe((state, prev) => {
      if (prev.isDirty && !state.isDirty && state.gameId === gameId) {
        try {
          localStorage.removeItem(getDraftKey(gameId));
        } catch {
          // Ignore
        }
      }
    });

    return unsub;
  }, [gameId]);
}

/**
 * Clears the draft for a given gameId (call on export).
 */
export function clearDraft(gameId: string): void {
  try {
    localStorage.removeItem(getDraftKey(gameId));
  } catch {
    // Ignore
  }
}