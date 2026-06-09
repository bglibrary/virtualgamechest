import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createDefaultGameDefinition } from "@/editor/utils/componentFactory";
import { generateUniqueGameId } from "@/editor/utils/idGenerator";
import { createStandard52CardDeck } from "@/editor/utils/standardDeckFactory";

export default function NewGamePage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [version, setVersion] = useState("1.0.0");
  const [includeStandardDeck, setIncludeStandardDeck] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Game name is required.");
      return;
    }

    if (!version.trim()) {
      setError("Version is required.");
      return;
    }

    const gameId = generateUniqueGameId(trimmedName);
    let defaultDefinition = createDefaultGameDefinition(trimmedName, version.trim());

    if (includeStandardDeck) {
      const { deck, cards } = createStandard52CardDeck(defaultDefinition.components.map((c) => c.id));
      defaultDefinition = {
        ...defaultDefinition,
        components: [...defaultDefinition.components, deck, ...cards],
      };
    }

    navigate(`/editor/${gameId}`, {
      state: {
        newGame: true,
        defaultDefinition,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 bg-gray-900 px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <h1 className="text-xl font-bold">New Game</h1>
          <button
            onClick={() => navigate("/editor")}
            className="rounded bg-gray-800 px-4 py-2 text-sm font-medium hover:bg-gray-700"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="mx-auto mt-8 max-w-2xl px-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300">
              Game Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="e.g., Poker Patience"
              className="mt-1 block w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="version" className="block text-sm font-medium text-gray-300">
              Version *
            </label>
            <input
              id="version"
              type="text"
              value={version}
              onChange={(e) => {
                setVersion(e.target.value);
                setError(null);
              }}
              placeholder="e.g., 1.0.0"
              className="mt-1 block w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-gray-800 bg-gray-900 p-4">
            <input
              id="includeStandardDeck"
              type="checkbox"
              checked={includeStandardDeck}
              onChange={(e) => setIncludeStandardDeck(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <label htmlFor="includeStandardDeck" className="cursor-pointer text-sm font-medium text-gray-200">
                Inclure un jeu de 52 cartes standard
              </label>
              <p className="mt-1 text-xs text-gray-500">
                Crée un deck "draw-pile" avec les 52 cartes (2→As, ♥ ♦ ♣ ♠), images des faces et
                dos compris.
              </p>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded bg-blue-600 px-6 py-2 text-sm font-medium hover:bg-blue-500"
            >
              Create Game
            </button>
            <button
              type="button"
              onClick={() => navigate("/editor")}
              className="rounded bg-gray-800 px-6 py-2 text-sm font-medium hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}