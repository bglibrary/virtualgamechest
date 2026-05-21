import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useGameStore } from "@/store/gameStore";
import { useDeckStateStore } from "@/store/deckStateStore";
import { useZoneStateStore } from "@/store/zoneStateStore";
import { loadGame } from "@/engine/loadGame";
import { executeStartupSequence } from "@/engine/actionExecutor";
import TableCanvas from "@/ui/canvas/TableCanvas";
import EditorDashboard from "@/pages/EditorDashboard";
import NewGamePage from "@/pages/NewGamePage";
import GameEditor from "@/pages/GameEditor";

const GAME_URL = "/games/poker_patience.json";

function GamePage() {
  const setGame = useGameStore((s) => s.setGame);
  const setError = useGameStore((s) => s.setError);
  const setLoading = useGameStore((s) => s.setLoading);

  useEffect(() => {
    setLoading(true);
    loadGame(GAME_URL).then((game) => {
      if (game) {
        const { initDeck, removeDeck } = useDeckStateStore.getState();
        const { initZone, removeZone } = useZoneStateStore.getState();

        const currentDeckIds = Object.keys(useDeckStateStore.getState().cards);
        const currentZoneIds = Object.keys(useZoneStateStore.getState().cards);

        const newDeckIds = new Set(game.components.filter((c) => c.type === "deck").map((c) => c.id));
        currentDeckIds.filter((id) => !newDeckIds.has(id)).forEach((id) => removeDeck(id));

        const newZoneIds = new Set(game.components.filter((c) => c.type === "zone").map((c) => c.id));
        currentZoneIds.filter((id) => !newZoneIds.has(id)).forEach((id) => removeZone(id));

        game.components.forEach((component) => {
          if (component.type === "deck") {
            initDeck(component.id, component.cards, component.faceUp ?? false);
          } else if (component.type === "zone") {
            initZone(component.id);
          }
        });

        setGame(game);

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

function App() {
  return (
    <Routes>
      <Route path="/" element={<GamePage />} />
      <Route path="/editor" element={<EditorDashboard />} />
      <Route path="/editor/new" element={<NewGamePage />} />
      <Route path="/editor/:gameId" element={<GameEditor />} />
    </Routes>
  );
}

export default App;