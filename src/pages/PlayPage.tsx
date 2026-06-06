import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGameStore } from "@/store/gameStore";
import { useDeckStateStore } from "@/store/deckStateStore";
import { useZoneStateStore } from "@/store/zoneStateStore";
import { loadGame } from "@/engine/loadGame";
import { executeStartupSequence } from "@/engine/actionExecutor";
import { getGameById, getGameUrl } from "@/editor/data/gameRegistry";
import TableCanvas from "@/ui/canvas/TableCanvas";

export default function PlayPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const setGame = useGameStore((s) => s.setGame);
  const setError = useGameStore((s) => s.setError);
  const setLoading = useGameStore((s) => s.setLoading);
  const game = useGameStore((s) => s.game);
  const loading = useGameStore((s) => s.loading);
  const error = useGameStore((s) => s.error);

  useEffect(() => {
    if (!gameId) return;

    const meta = getGameById(gameId);
    if (!meta) {
      setError(`Jeu inconnu : "${gameId}"`);
      return;
    }

    setLoading(true);
    loadGame(getGameUrl(gameId)).then((loadedGame) => {
      if (loadedGame) {
        const { initDeck, removeDeck } = useDeckStateStore.getState();
        const { initZone, removeZone } = useZoneStateStore.getState();

        const currentDeckIds = Object.keys(useDeckStateStore.getState().cards);
        const currentZoneIds = Object.keys(useZoneStateStore.getState().cards);

        const newDeckIds = new Set(loadedGame.components.filter((c) => c.type === "deck").map((c) => c.id));
        currentDeckIds.filter((id) => !newDeckIds.has(id)).forEach((id) => removeDeck(id));

        const newZoneIds = new Set(loadedGame.components.filter((c) => c.type === "zone").map((c) => c.id));
        currentZoneIds.filter((id) => !newZoneIds.has(id)).forEach((id) => removeZone(id));

        loadedGame.components.forEach((component) => {
          if (component.type === "deck") {
            initDeck(component.id, component.cards, component.faceUp ?? false);
          } else if (component.type === "zone") {
            initZone(component.id);
          }
        });

        setGame(loadedGame);

        if (loadedGame.startup && loadedGame.startup.length > 0) {
          executeStartupSequence(loadedGame.startup);
        }
      } else {
        setError(`Échec du chargement du jeu depuis ${getGameUrl(gameId)}`);
      }
    });
  }, [gameId, setGame, setError, setLoading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Chargement...</h1>
          <p className="text-gray-500">Chargement de {gameId}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Erreur de chargement</h1>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
          >
            Retour à la sélection
          </button>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Jeu non trouvé</h1>
          <p className="text-gray-500 mb-6">Aucune donnée de jeu disponible.</p>
          <button
            onClick={() => navigate("/")}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
          >
            Retour à la sélection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="flex items-center justify-between border-b border-gray-800 bg-gray-900 px-4 py-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-gray-400 hover:text-white"
          >
            &larr; Jeux
          </button>
          <span className="text-gray-700">/</span>
          <h1 className="text-lg font-semibold">{game.name}</h1>
        </div>
      </header>
      <div className="h-[calc(100vh-48px)]">
        <TableCanvas />
      </div>
    </div>
  );
}