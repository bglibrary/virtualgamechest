import { useCallback } from "react";
import { useEditorStore } from "@/editor/stores/editorStore";
import type { GameComponent } from "@/types/game";

interface Props {
  components: GameComponent[];
}

/** SVG icon: three rectangles aligned to the left edge */
function AlignLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="10" height="3" rx="0.5" fill="currentColor" />
      <rect x="2" y="6.5" width="7" height="3" rx="0.5" fill="currentColor" />
      <rect x="2" y="11" width="12" height="3" rx="0.5" fill="currentColor" />
    </svg>
  );
}

/** SVG icon: three rectangles aligned to the center (horizontal) */
function AlignCenterHIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="2" width="10" height="3" rx="0.5" fill="currentColor" />
      <rect x="4.5" y="6.5" width="7" height="3" rx="0.5" fill="currentColor" />
      <rect x="2" y="11" width="12" height="3" rx="0.5" fill="currentColor" />
    </svg>
  );
}

/** SVG icon: three rectangles aligned to the right edge */
function AlignRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="2" width="10" height="3" rx="0.5" fill="currentColor" />
      <rect x="7" y="6.5" width="7" height="3" rx="0.5" fill="currentColor" />
      <rect x="2" y="11" width="12" height="3" rx="0.5" fill="currentColor" />
    </svg>
  );
}

/** SVG icon: three rectangles aligned to top edge */
function AlignTopIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="3" height="12" rx="0.5" fill="currentColor" />
      <rect x="6.5" y="2" width="3" height="8" rx="0.5" fill="currentColor" />
      <rect x="11" y="2" width="3" height="10" rx="0.5" fill="currentColor" />
    </svg>
  );
}

/** SVG icon: three rectangles aligned to middle (vertical) */
function AlignMiddleVIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="3" width="3" height="10" rx="0.5" fill="currentColor" />
      <rect x="6.5" y="4.5" width="3" height="7" rx="0.5" fill="currentColor" />
      <rect x="11" y="2" width="3" height="12" rx="0.5" fill="currentColor" />
    </svg>
  );
}

/** SVG icon: three rectangles aligned to bottom edge */
function AlignBottomIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="3" height="12" rx="0.5" fill="currentColor" />
      <rect x="6.5" y="6" width="3" height="8" rx="0.5" fill="currentColor" />
      <rect x="11" y="4" width="3" height="10" rx="0.5" fill="currentColor" />
    </svg>
  );
}

/** SVG icon: three rectangles evenly spaced horizontally */
function DistributeHIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="3" width="3" height="10" rx="0.5" fill="currentColor" />
      <rect x="6.5" y="3" width="3" height="10" rx="0.5" fill="currentColor" />
      <rect x="12" y="3" width="3" height="10" rx="0.5" fill="currentColor" />
      <line x1="2.5" y1="8" x2="6.5" y2="8" stroke="currentColor" strokeWidth="0.6" />
      <line x1="8" y1="8" x2="12" y2="8" stroke="currentColor" strokeWidth="0.6" />
    </svg>
  );
}

/** SVG icon: three rectangles evenly spaced vertically */
function DistributeVIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="1" width="10" height="3" rx="0.5" fill="currentColor" />
      <rect x="3" y="6.5" width="10" height="3" rx="0.5" fill="currentColor" />
      <rect x="3" y="12" width="10" height="3" rx="0.5" fill="currentColor" />
      <line x1="8" y1="2.5" x2="8" y2="6.5" stroke="currentColor" strokeWidth="0.6" />
      <line x1="8" y1="8" x2="8" y2="12" stroke="currentColor" strokeWidth="0.6" />
    </svg>
  );
}

export default function LayoutTools({ components }: Props) {
  const updateComponents = useEditorStore((s) => s.updateComponents);
  const editLayout = useEditorStore((s) => s.editLayout);
  const isMobile = editLayout === "mobile";

  const getPosition = useCallback(
    (c: { position?: { x: number; y: number } | null; mobilePosition?: { x: number; y: number } | null }): { x: number; y: number } => {
      return isMobile && c.mobilePosition ? c.mobilePosition : (c.position ?? { x: 0, y: 0 });
    },
    [isMobile],
  );

  const getPosKey = isMobile ? "mobilePosition" : "position";

  const align = useCallback(
    (type: "left" | "center" | "right" | "top" | "middle" | "bottom") => {
      if (components.length < 2) return;

      const positions = components.map((c) => getPosition(c)).filter((p) => !!(p.x !== undefined && p.y !== undefined));
      if (positions.length === 0) return;

      let targetX = 0;
      let targetY = 0;

      switch (type) {
        case "left":
          targetX = Math.min(...positions.map((p) => p.x));
          break;
        case "right":
          targetX = Math.max(...positions.map((p) => p.x));
          break;
        case "center":
          targetX = positions.reduce((acc, p) => acc + p.x, 0) / positions.length;
          break;
        case "top":
          targetY = Math.min(...positions.map((p) => p.y));
          break;
        case "bottom":
          targetY = Math.max(...positions.map((p) => p.y));
          break;
        case "middle":
          targetY = positions.reduce((acc, p) => acc + p.y, 0) / positions.length;
          break;
      }

      updateComponents(
        components.map((c) => c.id),
        (c) => {
          const currentPos = isMobile ? (c.mobilePosition ?? c.position ?? { x: 0, y: 0 }) : c.position ?? { x: 0, y: 0 };
          return {
            ...c,
            [getPosKey]: {
              x: ["left", "right", "center"].includes(type) ? targetX : currentPos.x,
              y: ["top", "bottom", "middle"].includes(type) ? targetY : currentPos.y,
            },
          };
        },
      );
    },
    [components, updateComponents, getPosition, getPosKey, isMobile],
  );

  const distribute = useCallback(
    (axis: "h" | "v") => {
      if (components.length < 3) return;

      const getVal = (c: { position?: { x: number; y: number } | null; mobilePosition?: { x: number; y: number } | null }): number => {
        return axis === "h" ? getPosition(c).x : getPosition(c).y;
      };

      const sorted = [...components]
        .filter((c) => getPosition(c))
        .sort((a, b) => getVal(a) - getVal(b));

      if (sorted.length < 3) return;

      const start = getVal(sorted[0]);
      const end = getVal(sorted[sorted.length - 1]);
      const step = (end - start) / (sorted.length - 1);

      sorted.forEach((c, i) => {
        updateComponents([c.id], (comp) => {
          const currentPos = isMobile ? (comp.mobilePosition ?? comp.position ?? { x: 0, y: 0 }) : comp.position ?? { x: 0, y: 0 };
          return {
            ...comp,
            [getPosKey]: {
              x: axis === "h" ? start + step * i : currentPos.x,
              y: axis === "v" ? start + step * i : currentPos.y,
            },
          };
        });
      });
    },
    [components, updateComponents, getPosition, getPosKey, isMobile],
  );

  return (
    <div className="space-y-3 rounded border border-gray-800 bg-gray-900/50 p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        Alignment & Distribution
      </h3>

      <div className="grid grid-cols-3 gap-2">
        <AlignmentButton onClick={() => align("left")} tooltip="Align Left" icon={<AlignLeftIcon />} />
        <AlignmentButton onClick={() => align("center")} tooltip="Align Center (H)" icon={<AlignCenterHIcon />} />
        <AlignmentButton onClick={() => align("right")} tooltip="Align Right" icon={<AlignRightIcon />} />

        <AlignmentButton onClick={() => align("top")} tooltip="Align Top" icon={<AlignTopIcon />} />
        <AlignmentButton onClick={() => align("middle")} tooltip="Align Middle (V)" icon={<AlignMiddleVIcon />} />
        <AlignmentButton onClick={() => align("bottom")} tooltip="Align Bottom" icon={<AlignBottomIcon />} />
      </div>

      <div className="mt-2 flex gap-2">
        <AlignmentButton onClick={() => distribute("h")} tooltip="Distribute Horizontally" icon={<DistributeHIcon />} className="flex-1" />
        <AlignmentButton onClick={() => distribute("v")} tooltip="Distribute Vertically" icon={<DistributeVIcon />} className="flex-1" />
      </div>
    </div>
  );
}

function AlignmentButton({
  onClick,
  tooltip,
  icon,
  className = "",
}: {
  onClick: () => void;
  tooltip: string;
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      className={`flex items-center justify-center rounded border border-gray-700 bg-gray-800 p-1.5 text-gray-400 hover:bg-gray-700 hover:text-gray-200 transition-colors ${className}`}
    >
      {icon}
    </button>
  );
}