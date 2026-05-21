import { useNavigate } from "react-router-dom";
import { getGameList, type GameMeta } from "@/editor/data/gameRegistry";
import { useEffect, useState } from "react";
import { loadGame } from "@/engine/loadGame";
import { getGameUrl } from "@/editor/data/gameRegistry";
import type { GameDefinition } from "@/types/game";

interface GameEntry {
  meta: GameMeta;
  game: GameDefinition | null;
  error: string | null;
  loading: boolean;
}

export default function EditorDashboard() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<GameEntry[]>([]);

  useEffect(() => {
    const games = getGameList();
    const loaded = games.map((meta) => ({
      meta,
      game: null as GameDefinition | null,
      error: null as string | null,
      loading: true,
    }));
    setEntries(loaded);

    games.forEach((meta, index) => {
      loadGame(getGameUrl(meta.id))
        .then((game) => {
          setEntries((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], game, loading: false };
            return next;
          });
        })
        .catch((err) => {
          setEntries((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], error: String(err), loading: false };
            return next;
          });
        });
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 bg-gray-900 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-xl font-bold">Game Editor</h1>
          <button
            onClick={() => navigate("/editor/new")}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
          >
            + New Game
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {entries.length === 0 && (
          <div className="mt-16 text-center text-gray-500">
            <p className="text-lg">No games found.</p>
            <button
              onClick={() => navigate("/editor/new")}
              className="mt-4 rounded bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
            >
              Create your first game
            </button>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <div
              key={entry.meta.id}
              className="rounded-lg border border-gray-800 bg-gray-900 p-4 transition hover:border-gray-700"
            >
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <h2 className="font-semibold">{entry.meta.label}</h2>
                  {entry.game && (
                    <p className="text-sm text-gray-500">
                      v{entry.game.version} &middot; {entry.game.components.length} components
                    </p>
                  )}
                  {entry.loading && (
                    <p className="text-sm text-gray-500">Loading...</p>
                  )}
                  {entry.error && (
                    <p className="text-sm text-red-400">Invalid</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => navigate(`/editor/${entry.meta.id}`)}
                disabled={!entry.game && !entry.loading}
                className="mt-2 w-full rounded bg-gray-800 px-3 py-1.5 text-sm font-medium hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {entry.loading ? "Loading..." : "Edit"}
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}