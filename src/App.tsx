import { useEffect } from "react";
import { useGameStore } from "@/store/gameStore";
import { loadGame } from "@/engine/loadGame";
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
        setGame(game);
      } else {
        setError(`Failed to load game from ${GAME_URL}`);
      }
    });
  }, [setGame, setError, setLoading]);

  return <TableCanvas />;
}

export default App;
