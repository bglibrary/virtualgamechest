import GameSelectionPage from "@/pages/GameSelectionPage";
import PlayPage from "@/pages/PlayPage";
import EditorDashboard from "@/pages/EditorDashboard";
import NewGamePage from "@/pages/NewGamePage";
import GameEditor from "@/pages/GameEditor";

export const routes = [
  {
    path: "/",
    element: <GameSelectionPage />,
  },
  {
    path: "/play/:gameId",
    element: <PlayPage />,
  },
  {
    path: "/editor",
    element: <EditorDashboard />,
  },
  {
    path: "/editor/new",
    element: <NewGamePage />,
  },
  {
    path: "/editor/:gameId",
    element: <GameEditor />,
  },
];
