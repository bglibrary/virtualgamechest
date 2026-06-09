import { useCallback } from "react";
import type { ZoneComponent } from "@/types/game";
import { useEditorStore } from "@/editor/stores/editorStore";

interface Props {
  component: ZoneComponent;
}

export default function ZoneForm({ component }: Props) {
  const updateComponent = useEditorStore((s) => s.updateComponent);

  const handleChange = useCallback(
    <K extends keyof ZoneComponent>(key: K, value: ZoneComponent[K]) => {
      updateComponent(component.id, (c) =>
        c.type === "zone" ? { ...c, [key]: value } : c,
      );
    },
    [component.id, updateComponent],
  );

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        Zone Properties
      </h3>

      <Field label="ID">
        <input
          type="text"
          value={component.id}
          onChange={(e) => handleChange("id", e.target.value)}
          className="w-full rounded border border-gray-700 bg-gray-950 px-2 py-1 text-sm"
        />
      </Field>

      <Field label="Label">
        <input
          type="text"
          value={component.label ?? ""}
          onChange={(e) => handleChange("label", e.target.value || undefined)}
          placeholder="e.g., Discard"
          maxLength={30}
          className="w-full rounded border border-gray-700 bg-gray-950 px-2 py-1 text-sm"
        />
      </Field>

      <Field label="Snap Radius (px)">
        <input
          type="number"
          value={component.snapRadius ?? ""}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            handleChange("snapRadius", isNaN(v) ? undefined : v);
          }}
          min={1}
          className="w-full rounded border border-gray-700 bg-gray-950 px-2 py-1 text-sm"
        />
      </Field>

      <Field label="Hide Count Badge">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={component.hideCountBadge ?? false}
            onChange={() => handleChange("hideCountBadge", !(component.hideCountBadge ?? false))}
            className="rounded border-gray-700 bg-gray-950"
          />
          <span className="text-sm text-gray-400">
            {component.hideCountBadge ? "Hidden" : "Visible"}
          </span>
        </label>
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-0.5 block text-xs text-gray-500">{label}</label>
      {children}
    </div>
  );
}