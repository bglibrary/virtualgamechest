import { useEffect } from "react";
import { useGameStore } from "@/store/gameStore";
import { useDeckStateStore } from "@/store/deckStateStore";
import { useZoneStateStore } from "@/store/zoneStateStore";
import { loadGame } from "@/engine/loadGame";
import { executeStartupSequence } from "@/engine/actionExecutor";
import TableCanvas from "@/ui/canvas/TableCanvas";

const GAME_URL = "/games/poker_patience.json";

function App() {
  const setGame = useGameStore((s) => s.setGame);
  const setError = useGameStore((s) => s.setError);
  const setLoading = useGameStore((s) => s.setLoading);

  useEffect(() => {
    setLoading(true);
    loadGame(GAME_URL).then((game) => {
      if (game) {
        // 1. Initialize stores first
        const { initDeck, removeDeck } = useDeckStateStore.getState();
        const { initZone, removeZone } = useZoneStateStore.getState();

        const currentDeckIds = Object.keys(useDeckStateStore.getState().cards);
        const currentZoneIds = Object.keys(useZoneStateStore.getState().cards);

        // Remove stale decks/zones
        const newDeckIds = new Set(game.components.filter((c) => c.type === "deck").map((c) => c.id));
        currentDeckIds.filter((id) => !newDeckIds.has(id)).forEach((id) => removeDeck(id));

        const newZoneIds = new Set(game.components.filter((c) => c.type === "zone").map((c) => c.id));
        currentZoneIds.filter((id) => !newZoneIds.has(id)).forEach((id) => removeZone(id));

        // Init new decks/zones
        game.components.forEach((component) => {
          if (component.type === "deck") {
            initDeck(component.id, component.cards, component.faceUp ?? false);
          } else if (component.type === "zone") {
            initZone(component.id);
          }
        });

        // 2. Set game state
        setGame(game);

        // 3. Execute startup sequence AFTER stores are ready
        if (game.startup && game.startup.length > 0) {
          executeStartupSequence(game.startup);
        }
      } else {
        setError(`Failed to load game from ${GAME_URL}`);
      }
    });
  }, [setGame, setError, setLoading]);

  return <TableCanvas />;
}

export default App;
