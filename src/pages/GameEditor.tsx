import { useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEditorStore } from "@/editor/stores/editorStore";
import { useGameValidation } from "@/editor/validation/useGameValidation";
import { getGameById, getGameUrl } from "@/editor/data/gameRegistry";
import { loadGame } from "@/engine/loadGame";
import ComponentTree from "@/editor/components/ComponentTree";
import EditorCanvas from "@/editor/components/forms/EditorCanvas";
import PropertyPanel from "@/editor/components/forms/PropertyPanel";
import type { GameDefinition } from "@/types/game";

export default function GameEditor() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // We use unknown here because navigation state loses the exact type.
  // The actual value is a valid GameDefinition created by createDefaultGameDefinition.
  const state = location.state as { newGame?: boolean; defaultDefinition?: unknown } | null;

  const game = useEditorStore((s) => s.game);
  const isDirty = useEditorStore((s) => s.isDirty);
  const openGame = useEditorStore((s) => s.openGame);
  const closeGame = useEditorStore((s) => s.closeGame);

  // Run validation whenever the game changes
  useGameValidation(game);

  // Load game on mount
  useEffect(() => {
    if (!gameId) return;

    // Handle new game creation via navigation state
    if (state?.newGame && state?.defaultDefinition) {
      openGame(gameId, state.defaultDefinition as unknown as GameDefinition);
      // Clear the navigation state so reload doesn't re-create
      window.history.replaceState({}, document.title);
      return;
    }

    // Load existing game
    const meta = getGameById(gameId);
    if (!meta) {
      // Unknown game — show error
      return;
    }

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

  // If unknown game ID
  if (gameId && !getGameById(gameId) && !state?.newGame) {
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
      </header>

      {/* 3-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: Component tree */}
        <aside className="w-64 overflow-y-auto border-r border-gray-800 bg-gray-900 p-4">
          <ComponentTree />
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