import { useCallback } from "react";
import { useEditorStore } from "@/editor/stores/editorStore";
import type { RestartButtonComponent } from "@/types/game";

interface RestartButtonFormProps {
  component: RestartButtonComponent;
}

export default function RestartButtonForm({ component }: RestartButtonFormProps) {
  const updateGame = useEditorStore((s) => s.updateGame);

  const updateField = useCallback(
    <K extends keyof RestartButtonComponent>(key: K, value: RestartButtonComponent[K]) => {
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
        Restart Button Settings
      </h3>

      {/* Label */}
      <div>
        <label className="block text-xs text-gray-400">Label</label>
        <input
          type="text"
          className="mt-1 w-full rounded border border-gray-700 bg-gray-900 px-2 py-1 text-sm text-gray-200"
          value={component.label ?? "Relancer"}
          onChange={(e) => updateField("label", e.target.value)}
        />
      </div>
    </div>
  );
}