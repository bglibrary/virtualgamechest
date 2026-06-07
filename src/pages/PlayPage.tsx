import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGameStore } from "@/store/gameStore";
import { useDeckStateStore } from "@/store/deckStateStore";
import { useZoneStateStore } from "@/store/zoneStateStore";
import { loadGame } from "@/engine/loadGame";
import { executeStartupSequence } from "@/engine/actionExecutor";
import { getGameById, getGameUrl } from "@/editor/data/gameRegistry";
import { preloadCardImagesForGame } from "@/ui/hooks/preloadCardImages";
import TableCanvas from "@/ui/canvas/TableCanvas";

export default function PlayPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const setGame = useGameStore((s) => s.setGame);
  const game = useGameStore((s) => s.game);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) return;

    let cancelled = false;

    const meta = getGameById(gameId);
    if (!meta) {
      setLoadError(`Jeu inconnu : "${gameId}"`);
      return;
    }

    setLoading(true);
    loadGame(getGameUrl(gameId)).then(async (loadedGame) => {
      if (cancelled || !loadedGame) {
        if (!loadedGame && !cancelled) {
          setLoadError(`Échec du chargement du jeu depuis ${getGameUrl(gameId)}`);
        }
        return;
      }

      console.log(`[PlayPage] Game "${loadedGame.name}" loaded, ${loadedGame.components.length} components, ${loadedGame.startup?.length ?? 0} startup steps`);

      // Initialize stores BEFORE setting game, so executeStartupSequence
      // can use the stores (deckState, zoneState) which are populated here.
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

      // Set the game FIRST so executeStartupSequence can find components via the store
      setGame(loadedGame);

      // Execute startup sequence (await it so it completes before showing canvas)
      if (loadedGame.startup && loadedGame.startup.length > 0) {
        console.log(`[PlayPage] Executing startup sequence (${loadedGame.startup.length} steps)...`);
        await executeStartupSequence(loadedGame.startup);
        console.log(`[PlayPage] Startup sequence completed`);
      }

      // Preload all card images into the shared useCardImage store
      // AFTER startup (startup may have merged cards into decks, reducing visible cards)
      await preloadCardImagesForGame(loadedGame);

      if (!cancelled) {
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [gameId, setGame, setLoading]);

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

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Erreur de chargement</h1>
          <p className="text-gray-500 mb-6">{loadError}</p>
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