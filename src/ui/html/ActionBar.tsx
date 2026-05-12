import { RotateCw, Eye, EyeOff } from "lucide-react";

interface ActionBarProps {
  x: number;
  y: number;
  onFlip: () => void;
  onDrawFaceUp?: () => void;
  onDrawFaceDown?: () => void;
  visible: boolean;
  side: "left" | "right";
}

const ICON_SIZE = 16;
const labelStyle: React.CSSProperties = {
  maxWidth: "6.5rem",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  lineHeight: 1.25,
};

function ActionBar({ x, y, onFlip, onDrawFaceUp, onDrawFaceDown, visible, side }: ActionBarProps) {
  if (!visible) return null;

  const isDeck = onDrawFaceUp !== undefined && onDrawFaceDown !== undefined;

  const transform =
    side === "right"
      ? "translateY(-50%)"
      : "translateX(-100%) translateY(-50%)";

  return (
    <div
      className="absolute flex flex-col items-stretch gap-1 rounded-lg bg-white/95 px-1.5 py-2 shadow-lg"
      style={{
        left: x,
        top: y,
        transform,
      }}
    >
      <button
        onClick={onFlip}
        title="Retourner"
        className="flex flex-row items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-gray-800 transition-colors hover:bg-gray-100 active:bg-gray-200"
      >
        <RotateCw size={ICON_SIZE} className="shrink-0" />
        <span className="text-xs font-medium" style={labelStyle}>Retourner</span>
      </button>
      {isDeck && (
        <>
          <div className="mx-1 h-px bg-gray-300" />
          <button
            onClick={onDrawFaceUp}
            title="Piocher face visible"
            className="flex flex-row items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-gray-800 transition-colors hover:bg-gray-100 active:bg-gray-200"
          >
            <Eye size={ICON_SIZE} className="shrink-0" />
            <span className="text-xs font-medium" style={labelStyle}>Piocher face visible</span>
          </button>
          <button
            onClick={onDrawFaceDown}
            title="Piocher face cachée"
            className="flex flex-row items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-gray-800 transition-colors hover:bg-gray-100 active:bg-gray-200"
          >
            <EyeOff size={ICON_SIZE} className="shrink-0" />
            <span className="text-xs font-medium" style={labelStyle}>Piocher face cachée</span>
          </button>
        </>
      )}
    </div>
  );
}

export default ActionBar;
