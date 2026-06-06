import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getGameList, getGameUrl, type GameMeta } from "@/editor/data/gameRegistry";
import { loadGame } from "@/engine/loadGame";
import type { GameDefinition } from "@/types/game";

interface GameEntry {
  meta: GameMeta;
  game: GameDefinition | null;
  error: string | null;
  loading: boolean;
}

export default function GameSelectionPage() {
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
          <h1 className="text-xl font-bold">Choisir un jeu</h1>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {entries.length === 0 && (
          <div className="mt-16 text-center text-gray-500">
            <p className="text-lg">Aucun jeu trouvé.</p>
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
                      v{entry.game.version} &middot; {entry.game.components.length} composants
                    </p>
                  )}
                  {entry.loading && (
                    <p className="text-sm text-gray-500">Chargement...</p>
                  )}
                  {entry.error && (
                    <p className="text-sm text-red-400">Invalide</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => navigate(`/play/${entry.meta.id}`)}
                disabled={!entry.game && !entry.loading}
                className="mt-2 w-full rounded bg-green-700 px-3 py-1.5 text-sm font-medium hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {entry.loading ? "Chargement..." : "Jouer"}
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}