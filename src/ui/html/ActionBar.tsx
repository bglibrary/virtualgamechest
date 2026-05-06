import { RotateCw } from "lucide-react";

interface ActionBarProps {
  x: number;
  y: number;
  onFlip: () => void;
  visible: boolean;
}

function ActionBar({ x, y, onFlip, visible }: ActionBarProps) {
  if (!visible) return null;

  return (
    <div
      className="absolute flex items-center gap-1 rounded-lg bg-white/95 px-3 py-1.5 shadow-lg"
      style={{
        left: x,
        top: y,
        transform: "translateX(-50%)",
      }}
    >
      <button
        onClick={onFlip}
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-100 active:bg-gray-200"
      >
        <RotateCw size={14} />
        <span>Retourner</span>
      </button>
    </div>
  );
}

export default ActionBar;
