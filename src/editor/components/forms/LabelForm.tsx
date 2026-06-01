import { useCallback } from "react";
import { useEditorStore } from "@/editor/stores/editorStore";
import type { LabelComponent } from "@/types/game";

interface LabelFormProps {
  component: LabelComponent;
}

export default function LabelForm({ component }: LabelFormProps) {
  const updateGame = useEditorStore((s) => s.updateGame);

  const updateField = useCallback(
    <K extends keyof LabelComponent>(key: K, value: LabelComponent[K]) => {
      updateGame((g) => ({
        ...g,
        components: g.components.map((c) =>
          c.id === component.id ? { ...c, [key]: value } : c,
        ),
      }));
    },
    [component.id, updateGame],
  );

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        Label Settings
      </h3>

      {/* Text */}
      <div>
        <label className="block text-xs text-gray-400">Text</label>
        <textarea
          className="mt-1 w-full rounded border border-gray-700 bg-gray-900 px-2 py-1 text-sm text-gray-200"
          rows={3}
          value={component.text}
          onChange={(e) => updateField("text", e.target.value)}
        />
      </div>

      {/* Font Size */}
      <div>
        <label className="block text-xs text-gray-400">
          Font Size (ratio of viewport width)
        </label>
        <input
          type="number"
          className="mt-1 w-full rounded border border-gray-700 bg-gray-900 px-2 py-1 text-sm text-gray-200"
          step={0.001}
          min={0.001}
          max={0.5}
          value={component.fontSize}
          onChange={(e) => updateField("fontSize", parseFloat(e.target.value) || 0.03)}
        />
      </div>

      {/* Text Color */}
      <div>
        <label className="block text-xs text-gray-400">Text Color</label>
        <div className="mt-1 flex items-center gap-2">
          <input
            type="color"
            className="h-8 w-8 cursor-pointer rounded border border-gray-700 bg-transparent"
            value={component.textColor}
            onChange={(e) => updateField("textColor", e.target.value)}
          />
          <input
            type="text"
            className="flex-1 rounded border border-gray-700 bg-gray-900 px-2 py-1 text-sm text-gray-200"
            value={component.textColor}
            onChange={(e) => updateField("textColor", e.target.value)}
          />
        </div>
      </div>

      {/* Text Align */}
      <div>
        <label className="block text-xs text-gray-400">Text Align</label>
        <select
          className="mt-1 w-full rounded border border-gray-700 bg-gray-900 px-2 py-1 text-sm text-gray-200"
          value={component.textAlign}
          onChange={(e) => updateField("textAlign", e.target.value as "left" | "center" | "right")}
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>

      {/* Font Weight */}
      <div>
        <label className="block text-xs text-gray-400">Font Weight</label>
        <select
          className="mt-1 w-full rounded border border-gray-700 bg-gray-900 px-2 py-1 text-sm text-gray-200"
          value={component.fontWeight}
          onChange={(e) => updateField("fontWeight", e.target.value as "normal" | "bold")}
        >
          <option value="normal">Normal</option>
          <option value="bold">Bold</option>
        </select>
      </div>

      {/* Rotation */}
      <div>
        <label className="block text-xs text-gray-400">Rotation (degrees)</label>
        <input
          type="number"
          className="mt-1 w-full rounded border border-gray-700 bg-gray-900 px-2 py-1 text-sm text-gray-200"
          min={0}
          max={360}
          value={component.rotation}
          onChange={(e) => updateField("rotation", parseFloat(e.target.value) || 0)}
        />
      </div>

      {/* Width */}
      <div>
        <label className="block text-xs text-gray-400">
          Width (ratio of viewport)
        </label>
        <input
          type="number"
          className="mt-1 w-full rounded border border-gray-700 bg-gray-900 px-2 py-1 text-sm text-gray-200"
          step={0.01}
          min={0.001}
          max={1}
          value={component.width}
          onChange={(e) => updateField("width", parseFloat(e.target.value) || 0.3)}
        />
      </div>

      {/* Height */}
      <div>
        <label className="block text-xs text-gray-400">
          Height (ratio of viewport)
        </label>
        <input
          type="number"
          className="mt-1 w-full rounded border border-gray-700 bg-gray-900 px-2 py-1 text-sm text-gray-200"
          step={0.01}
          min={0.001}
          max={1}
          value={component.height}
          onChange={(e) => updateField("height", parseFloat(e.target.value) || 0.1)}
        />
      </div>
    </div>
  );
}