import { RotateCw, Eye, EyeOff, Shuffle, Target } from "lucide-react";

export interface ActionButton {
  id: string;
  label: string;
  onClick: () => void;
}

interface ActionBarProps {
  x: number;
  y: number;
  actions: ActionButton[];
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

const ACTION_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  flip: RotateCw,
  "draw-face-up": Eye,
  "draw-face-down": EyeOff,
  shuffle: Shuffle,
  "draw-to-zone": Target,
};

function ActionBar({ x, y, actions, visible, side }: ActionBarProps) {
  if (!visible || actions.length === 0) return null;

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
      {actions.map((action, index) => {
        const IconComponent = ACTION_ICONS[action.id];
        return (
          <div key={action.id}>
            {index > 0 && <div className="mx-1 h-px bg-gray-300" />}
            <button
              onClick={action.onClick}
              title={action.label}
              className="flex flex-row items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-gray-800 transition-colors hover:bg-gray-100 active:bg-gray-200"
            >
              {IconComponent && <span className="shrink-0"><IconComponent size={ICON_SIZE} /></span>}
              <span className="text-xs font-medium" style={labelStyle}>{action.label}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default ActionBar;
