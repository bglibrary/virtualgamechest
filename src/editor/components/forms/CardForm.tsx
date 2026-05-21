import { useCallback } from "react";
import type { CardComponent } from "@/types/game";
import { useEditorStore } from "@/editor/stores/editorStore";

interface Props {
  component: CardComponent;
}

export default function CardForm({ component }: Props) {
  const updateComponent = useEditorStore((s) => s.updateComponent);

  const updateField = useCallback(
    (key: keyof CardComponent, value: unknown) => {
      updateComponent(component.id, (c) =>
        c.type === "card" ? { ...c, [key]: value } : c,
      );
    },
    [component.id, updateComponent],
  );

  const updateFace = useCallback(
    (key: keyof CardComponent["face"], value: string | undefined) => {
      if (value === undefined) {
        updateComponent(component.id, (c) =>
          c.type === "card" ? { ...c, face: { type: "text", text: c.face.text } } : c,
        );
      } else {
        updateComponent(component.id, (c) =>
          c.type === "card" ? { ...c, face: { ...c.face, [key]: value } } : c,
        );
      }
    },
    [component.id, updateComponent],
  );

  const updateBack = useCallback(
    (key: keyof NonNullable<CardComponent["back"]>, value: string | undefined) => {
      updateComponent(component.id, (c) => {
        if (c.type !== "card") return c;
        if (!c.back) return c;
        if (value === undefined) {
          return { ...c, back: { type: "text", text: c.back.text } as typeof c.back };
        }
        return { ...c, back: { ...c.back, [key]: value } };
      });
    },
    [component.id, updateComponent],
  );

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        Card Properties
      </h3>

      <Field label="ID">
        <input
          type="text"
          value={component.id}
          onChange={(e) => updateField("id", e.target.value)}
          className="w-full rounded border border-gray-700 bg-gray-950 px-2 py-1 text-sm"
        />
      </Field>

      <Field label="Face Text *">
        <input
          type="text"
          value={component.face.text}
          onChange={(e) => updateFace("text", e.target.value)}
          className="w-full rounded border border-gray-700 bg-gray-950 px-2 py-1 text-sm"
        />
      </Field>

      <Field label="Face Image (URL)">
        <input
          type="text"
          value={component.face.image ?? ""}
          onChange={(e) => updateFace("image", e.target.value || undefined)}
          placeholder="https://..."
          className="w-full rounded border border-gray-700 bg-gray-950 px-2 py-1 text-sm"
        />
      </Field>

      {component.back && (
        <>
          <Field label="Back Text">
            <input
              type="text"
              value={component.back.text}
              onChange={(e) => updateBack("text", e.target.value)}
              className="w-full rounded border border-gray-700 bg-gray-950 px-2 py-1 text-sm"
            />
          </Field>

          <Field label="Back Image (URL)">
            <input
              type="text"
              value={component.back.image ?? ""}
              onChange={(e) => updateBack("image", e.target.value || undefined)}
              placeholder="https://..."
              className="w-full rounded border border-gray-700 bg-gray-950 px-2 py-1 text-sm"
            />
          </Field>
        </>
      )}
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