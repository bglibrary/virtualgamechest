import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createDefaultGameDefinition } from "@/editor/utils/componentFactory";
import { generateUniqueGameId } from "@/editor/utils/idGenerator";

export default function NewGamePage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [version, setVersion] = useState("1.0.0");
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
    // For now, we don't persist the game definition — it lives in the editor store.
    // The user will be redirected to the editor.
    navigate(`/editor/${gameId}`, {
      state: {
        newGame: true,
        defaultDefinition: createDefaultGameDefinition(trimmedName, version.trim()),
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