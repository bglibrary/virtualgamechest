import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEditorStore } from "@/editor/stores/editorStore";
import { useEditorHistoryStore } from "@/editor/stores/editorHistoryStore";
import { useEditorValidationStore } from "@/editor/stores/editorValidationStore";
import { useGameValidation } from "@/editor/validation/useGameValidation";
import { getGameById, getGameUrl } from "@/editor/data/gameRegistry";
import { loadGame } from "@/engine/loadGame";
import { useEditorShortcuts } from "@/editor/hooks/useEditorShortcuts";
import { useDraftPersistence } from "@/editor/hooks/useDraftPersistence";
import { useUnsavedChangesGuard } from "@/editor/hooks/useUnsavedChangesGuard";
import ComponentTree from "@/editor/components/ComponentTree";
import EditorCanvas from "@/editor/components/forms/EditorCanvas";
import PropertyPanel from "@/editor/components/forms/PropertyPanel";
import ValidationPanel from "@/editor/components/ValidationPanel";
import JsonPreview from "@/editor/components/JsonPreview";
import { downloadGameZip } from "@/editor/utils/gameExportZip";
import type { GameDefinition } from "@/types/game";
import { AlertCircle, CheckCircle, Download, Code, Undo2, Redo2, Smartphone, Monitor } from "lucide-react";

export default function GameEditor() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [showJsonPreview, setShowJsonPreview] = useState(false);

  const state = location.state as { newGame?: boolean; defaultDefinition?: unknown } | null;

  const game = useEditorStore((s) => s.game);
  const isDirty = useEditorStore((s) => s.isDirty);
  const markClean = useEditorStore((s) => s.markClean);
  const openGame = useEditorStore((s) => s.openGame);
  const closeGame = useEditorStore((s) => s.closeGame);
  const editLayout = useEditorStore((s) => s.editLayout);

  const validationResult = useEditorValidationStore((s) => s.validationResult);
  const isValid = validationResult?.isValid ?? true;
  const errorCount = validationResult?.errors.length ?? 0;

  // Run validation whenever the game changes
  useGameValidation(game);

  // Phase 8: Undo/redo shortcuts, draft persistence, unsaved changes guard
  useEditorShortcuts();
  useDraftPersistence();
  useUnsavedChangesGuard();

  // Store the game definition from location.state for re-opening in Strict Mode
  const gameDefRef = useRef<GameDefinition | null>(null);

  // Undo/redo handlers
  const canUndo = useEditorHistoryStore((s) => s.past.length > 0);
  const canRedo = useEditorHistoryStore((s) => s.future.length > 0);

  const handleUndo = useCallback(() => {
    const historyStore = useEditorHistoryStore.getState();
    const editorStore = useEditorStore.getState();
    if (!historyStore.canUndo() || !editorStore.game || !editorStore.gameId) return;

    const current = editorStore.game;
    const prev = historyStore.undo();
    if (prev) {
      useEditorHistoryStore.setState((s) => ({
        future: [...s.future, structuredClone(current)],
      }));
      editorStore.openGame(editorStore.gameId, prev);
      editorStore.markDirty();
    }
  }, []);

  const handleRedo = useCallback(() => {
    const historyStore = useEditorHistoryStore.getState();
    const editorStore = useEditorStore.getState();
    if (!historyStore.canRedo() || !editorStore.game || !editorStore.gameId) return;

    const current = editorStore.game;
    const next = historyStore.redo();
    if (next) {
      useEditorHistoryStore.setState((s) => ({
        past: [...s.past, structuredClone(current)],
      }));
      editorStore.openGame(editorStore.gameId, next);
      editorStore.markDirty();
    }
  }, []);

  // Load game on mount
  useEffect(() => {
    if (!gameId) return;

    // Handle new game from NewGamePage (via location state)
    if (state?.newGame && state?.defaultDefinition) {
      const gameDef = state.defaultDefinition as unknown as GameDefinition;
      gameDefRef.current = gameDef;
      openGame(gameId, gameDef);

      // Clear the location state so it doesn't interfere with subsequent navigations
      window.history.replaceState({}, document.title);
      return;
    }

    // On Strict Mode remount: re-open from the ref if we already consumed location.state
    if (gameDefRef.current) {
      openGame(gameId, gameDefRef.current);
      return;
    }

    const meta = getGameById(gameId);
    if (!meta) return;

    loadGame(getGameUrl(gameId))
      .then((loadedGame) => {
        if (!loadedGame) {
          console.error(`Failed to load game ${gameId}: game is null`);
          return;
        }
        openGame(gameId, loadedGame);
      })
      .catch((err) => {
        console.error(`Failed to load game ${gameId}:`, err);
      });

    return () => {
      closeGame();
    };
  }, [gameId, openGame, closeGame]);

  const handleExport = useCallback(() => {
    if (!game || !gameId) return;
    if (!isValid) {
      alert(`Cannot export: ${errorCount} validation error(s) remain.`);
      return;
    }
    downloadGameZip(game, gameId).then(() => markClean());
  }, [game, gameId, isValid, errorCount, markClean]);

  // If unknown game ID (new games from location.state pass through when state is still present,
  // or when gameDefRef was populated on previous Strict Mode mount)
  if (gameId && !getGameById(gameId) && !state?.newGame && !gameDefRef.current) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Game Not Found</h1>
          <p className="text-gray-500 mb-6">
            No game with ID &ldquo;{gameId}&rdquo; exists.
          </p>
          <button
            onClick={() => navigate("/editor")}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-800 bg-gray-900 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/editor")}
            className="text-sm text-gray-400 hover:text-white"
          >
            &larr; Dashboard
          </button>
          <span className="text-gray-700">/</span>
          <h1 className="text-lg font-semibold">
            {game?.name ?? (gameId ? `Loading ${gameId}...` : "Editor")}
          </h1>
          {isDirty && (
            <span className="rounded bg-yellow-900/50 px-2 py-0.5 text-xs text-yellow-400">
              Modified
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Desktop/Mobile layout toggle */}
          <div className="flex items-center rounded border border-gray-700 bg-gray-800 p-0.5">
            <button
              onClick={() => useEditorStore.getState().setEditLayout("desktop")}
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                editLayout === "desktop"
                  ? "bg-blue-700 text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
              title="Edit desktop layout"
            >
              <Monitor size={12} />
              Desktop
            </button>
            <button
              onClick={() => useEditorStore.getState().setEditLayout("mobile")}
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                editLayout === "mobile"
                  ? "bg-blue-700 text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
              title="Edit mobile layout"
            >
              <Smartphone size={12} />
              Mobile
            </button>
          </div>

          {/* Validation status */}
          {validationResult && (
            <div className="flex items-center gap-1.5">
              {isValid ? (
                <CheckCircle size={14} className="text-green-400" />
              ) : (
                <div className="flex items-center gap-1">
                  <AlertCircle size={14} className="text-red-400" />
                  <span className="text-xs text-red-400">{errorCount}</span>
                </div>
              )}
            </div>
          )}

          {/* Undo/Redo buttons */}
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className="rounded p-1.5 text-gray-400 hover:bg-gray-800 hover:text-gray-200 disabled:opacity-30"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={14} />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className="rounded p-1.5 text-gray-400 hover:bg-gray-800 hover:text-gray-200 disabled:opacity-30"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 size={14} />
          </button>

          <span className="text-gray-700">|</span>

          {/* JSON Preview toggle */}
          <button
            onClick={() => setShowJsonPreview(!showJsonPreview)}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-400 hover:bg-gray-800 hover:text-gray-200"
            title="Toggle JSON Preview"
          >
            <Code size={14} />
            JSON
          </button>

          {/* Export button */}
          <button
            onClick={handleExport}
            disabled={!game || !isValid}
            className={`flex items-center gap-1 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
              !game || !isValid
                ? "cursor-not-allowed bg-gray-800 text-gray-600"
                : "bg-blue-600 text-white hover:bg-blue-500"
            }`}
          >
            <Download size={14} />
            Export
          </button>
        </div>
      </header>

      {/* 3-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: Component tree + Validation + JSON Preview */}
        <aside className="flex w-64 flex-col overflow-y-auto border-r border-gray-800 bg-gray-900">
          <div className="flex-1 p-4">
            <ComponentTree />
          </div>

          {/* Validation panel */}
          <div className="border-t border-gray-800 p-4">
            <ValidationPanel />
          </div>

          {/* JSON Preview (collapsible) */}
          {showJsonPreview && (
            <div className="border-t border-gray-800">
              <JsonPreview />
            </div>
          )}
        </aside>

        {/* Center panel: Canvas */}
        <main className="flex-1 overflow-hidden bg-gray-950">
          <EditorCanvas />
        </main>

        {/* Right panel: Properties */}
        <aside className="w-72 overflow-y-auto border-l border-gray-800 bg-gray-900 p-4">
          <PropertyPanel />
        </aside>
      </div>
    </div>
  );
}