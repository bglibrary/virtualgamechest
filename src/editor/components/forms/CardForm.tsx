import { useCallback, useRef } from "react";
import type { CardComponent } from "@/types/game";
import { useEditorStore } from "@/editor/stores/editorStore";
import ActionEditor from "./ActionEditor";

interface Props {
  component: CardComponent;
}

export default function CardForm({ component }: Props) {
  const updateComponent = useEditorStore((s) => s.updateComponent);
  const faceFileInputRef = useRef<HTMLInputElement>(null);
  const backFileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFaceFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) return;
      const blobUrl = URL.createObjectURL(file);
      updateFace("image", blobUrl);
      e.target.value = "";
    },
    [updateFace],
  );

  const handleBackFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) return;
      const blobUrl = URL.createObjectURL(file);
      updateBack("image", blobUrl);
      e.target.value = "";
    },
    [updateBack],
  );

  const handleRemoveFaceImage = useCallback(() => {
    const current = component.face.image;
    if (current?.startsWith("blob:")) URL.revokeObjectURL(current);
    updateFace("image", undefined);
  }, [component.face.image, updateFace]);

  const handleRemoveBackImage = useCallback(() => {
    if (!component.back) return;
    const current = component.back.image;
    if (current?.startsWith("blob:")) URL.revokeObjectURL(current);
    updateBack("image", undefined);
  }, [component.back, updateBack]);


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

      <Field label="Face Image">
        <div className="space-y-2">
          {component.face.image ? (
            <div className="group relative inline-block">
              <img
                src={component.face.image}
                alt="Face preview"
                className="h-20 w-14 rounded border border-gray-600 object-cover"
              />
              <button
                onClick={handleRemoveFaceImage}
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white opacity-0 transition-opacity hover:bg-red-500 group-hover:opacity-100"
                title="Remove image"
              >
                ×
              </button>
            </div>
          ) : (
            <div className="flex h-20 w-14 items-center justify-center rounded border border-dashed border-gray-600 bg-gray-800 text-[10px] text-gray-500">
              no image
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => faceFileInputRef.current?.click()}
              className="rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 transition-colors hover:bg-gray-600"
            >
              Upload from computer
            </button>
            <input
              type="text"
              value={component.face.image ?? ""}
              onChange={(e) => updateFace("image", e.target.value || undefined)}
              placeholder="https://..."
              className="flex-1 rounded border border-gray-700 bg-gray-950 px-2 py-1 text-sm"
            />
          </div>
          <input
            ref={faceFileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.svg,image/*"
            onChange={handleFaceFileUpload}
            className="hidden"
          />
        </div>
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

          <Field label="Back Image">
            <div className="space-y-2">
              {component.back.image ? (
                <div className="group relative inline-block">
                  <img
                    src={component.back.image}
                    alt="Back preview"
                    className="h-20 w-14 rounded border border-gray-600 object-cover"
                  />
                  <button
                    onClick={handleRemoveBackImage}
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white opacity-0 transition-opacity hover:bg-red-500 group-hover:opacity-100"
                    title="Remove image"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="flex h-20 w-14 items-center justify-center rounded border border-dashed border-gray-600 bg-gray-800 text-[10px] text-gray-500">
                  no image
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => backFileInputRef.current?.click()}
                  className="rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 transition-colors hover:bg-gray-600"
                >
                  Upload from computer
                </button>
                <input
                  type="text"
                  value={component.back.image ?? ""}
                  onChange={(e) => updateBack("image", e.target.value || undefined)}
                  placeholder="https://..."
                  className="flex-1 rounded border border-gray-700 bg-gray-950 px-2 py-1 text-sm"
                />
              </div>
              <input
                ref={backFileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.svg,image/*"
                onChange={handleBackFileUpload}
                className="hidden"
              />
            </div>
          </Field>
        </>
      )}

      <hr className="border-gray-800" />
      <ActionEditor componentId={component.id} />
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