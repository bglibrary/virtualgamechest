import { useCallback } from "react";
import { useEditorStore } from "@/editor/stores/editorStore";
import type { GameComponent } from "@/types/game";

interface Props {
  components: GameComponent[];
}

export default function PositionForm({ components }: Props) {
  const updateComponents = useEditorStore((s) => s.updateComponents);

  // If multiple components, we show the values of the first one but indicate it affects all
  // or we show empty if they differ. For simplicity here, we'll use the first one's values
  // but allow updating all of them to the same value if changed.
  const firstPos = components[0]?.position || { x: 0, y: 0 };

  const roundToCentieme = (v: number) => Math.round(v * 100) / 100;

  const handleUpdate = useCallback(
    (axis: "x" | "y", value: string) => {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return;

      // Clamp 0-1 and round to centième
      const clampedValue = roundToCentieme(Math.max(0, Math.min(1, numValue)));

      updateComponents(
        components.map((c) => c.id),
        (c) => ({
          ...c,
          position: {
            x: c.position?.x ?? 0,
            y: c.position?.y ?? 0,
            [axis]: clampedValue,
          },
        }),
      );
    },
    [components, updateComponents],
  );

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        Position (0 to 1)
      </h3>
      <div className="flex gap-4">
        <div className="flex-1">
          <label htmlFor="pos-x" className="mb-0.5 block text-xs text-gray-500">X</label>
          <input
            id="pos-x"
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={typeof firstPos.x === "number" ? roundToCentieme(firstPos.x).toFixed(2) : "0"}
            onChange={(e) => handleUpdate("x", e.target.value)}
            className="w-full rounded border border-gray-700 bg-gray-950 px-2 py-1 text-sm"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="pos-y" className="mb-0.5 block text-xs text-gray-500">Y</label>
          <input
            id="pos-y"
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={typeof firstPos.y === "number" ? roundToCentieme(firstPos.y).toFixed(2) : "0"}
            onChange={(e) => handleUpdate("y", e.target.value)}
            className="w-full rounded border border-gray-700 bg-gray-950 px-2 py-1 text-sm"
          />
        </div>
      </div>
      {components.length > 1 && (
        <p className="text-[10px] italic text-gray-500">
          Updating will set all {components.length} components to the same position.
        </p>
      )}
    </div>
  );
}
