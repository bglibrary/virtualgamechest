import { useCallback } from "react";
import { useEditorStore } from "@/editor/stores/editorStore";
import type { CardSize } from "@/types/game";

const DEFAULT_CARD_SIZE: CardSize = {
  widthRatio: 0.08,
  minWidth: 55,
  aspectRatio: 1.4,
};

export default function CardSizeForm() {
  const game = useEditorStore((s) => s.game);
  const updateGame = useEditorStore((s) => s.updateGame);
  const editLayout = useEditorStore((s) => s.editLayout);

  if (!game) return null;

  const isMobile = editLayout === "mobile";
  const currentSize = (isMobile ? game.mobileCardSize : game.cardSize) || DEFAULT_CARD_SIZE;
  const isOverridden = isMobile ? !!game.mobileCardSize : true;

  const updateSize = useCallback(
    (updates: Partial<CardSize> | null) => {
      updateGame((g) => {
        if (isMobile) {
          if (updates === null) {
            const { mobileCardSize, ...rest } = g;
            return rest;
          }
          return {
            ...g,
            mobileCardSize: {
              ...(g.mobileCardSize || g.cardSize || DEFAULT_CARD_SIZE),
              ...updates,
            },
          };
        } else {
          return {
            ...g,
            cardSize: {
              ...(g.cardSize || DEFAULT_CARD_SIZE),
              ...(updates || {}),
            },
          };
        }
      });
    },
    [isMobile, updateGame],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Card Size ({isMobile ? "Mobile" : "Desktop"})
        </h3>
        {isMobile && (
          <button
            onClick={() => updateSize(isOverridden ? null : {})}
            className="text-[10px] text-blue-400 hover:underline"
          >
            {isOverridden ? "Use Desktop Size" : "Override Desktop Size"}
          </button>
        )}
      </div>

      {(isOverridden || !isMobile) && (
        <div className="grid grid-cols-3 gap-2">
          <Field label="Width %">
            <input
              type="number"
              step="0.005"
              min="0.01"
              max="0.5"
              value={currentSize.widthRatio}
              onChange={(e) => updateSize({ widthRatio: parseFloat(e.target.value) })}
              className="w-full rounded border border-gray-700 bg-gray-950 px-2 py-1 text-sm"
            />
          </Field>
          <Field label="Min Width">
            <input
              type="number"
              step="1"
              min="10"
              max="500"
              value={currentSize.minWidth}
              onChange={(e) => updateSize({ minWidth: parseInt(e.target.value, 10) })}
              className="w-full rounded border border-gray-700 bg-gray-950 px-2 py-1 text-sm"
            />
          </Field>
          <Field label="Aspect">
            <input
              type="number"
              step="0.1"
              min="0.5"
              max="2.0"
              value={currentSize.aspectRatio}
              onChange={(e) => updateSize({ aspectRatio: parseFloat(e.target.value) })}
              className="w-full rounded border border-gray-700 bg-gray-950 px-2 py-1 text-sm"
            />
          </Field>
        </div>
      )}

      {!isOverridden && isMobile && (
        <p className="text-[10px] italic text-gray-600">
          Currently using desktop card size.
        </p>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-0.5 block text-[10px] text-gray-500">{label}</label>
      {children}
    </div>
  );
}
