import { useCallback } from "react";
import type { DeckComponent, GameComponent } from "@/types/game";
import { useEditorStore } from "@/editor/stores/editorStore";
import ActionEditor from "./ActionEditor";

interface Props {
  component: DeckComponent;
}

export default function DeckForm({ component }: Props) {
  const game = useEditorStore((s) => s.game);
  const updateComponent = useEditorStore((s) => s.updateComponent);

  const availableCards = game?.components.filter((c: GameComponent) => c.type === "card") ?? [];

  const handleIdChange = useCallback(
    (value: string) => {
      updateComponent(component.id, (c) =>
        c.type === "deck" ? { ...c, id: value } : c,
      );
    },
    [component.id, updateComponent],
  );

  const handleFaceUpToggle = useCallback(
    () => {
      updateComponent(component.id, (c) =>
        c.type === "deck" ? { ...c, faceUp: !c.faceUp } : c,
      );
    },
    [component.id, updateComponent],
  );

  const toggleCard = useCallback(
    (cardId: string) => {
      updateComponent(component.id, (c) => {
        if (c.type !== "deck") return c;
        const has = c.cards.includes(cardId);
        return {
          ...c,
          cards: has ? c.cards.filter((id) => id !== cardId) : [...c.cards, cardId],
        };
      });
    },
    [component.id, updateComponent],
  );

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        Deck Properties
      </h3>

      <Field label="ID">
        <input
          type="text"
          value={component.id}
          onChange={(e) => handleIdChange(e.target.value)}
          className="w-full rounded border border-gray-700 bg-gray-950 px-2 py-1 text-sm"
        />
      </Field>

      <Field label="Face Up">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={component.faceUp ?? false}
            onChange={handleFaceUpToggle}
            className="rounded border-gray-700 bg-gray-950"
          />
          <span className="text-sm text-gray-400">
            {component.faceUp ? "Face up" : "Face down"}
          </span>
        </label>
      </Field>

      <Field label="Cards">
        {availableCards.length === 0 && (
          <p className="text-xs text-gray-600">No cards available — create some first.</p>
        )}
        <div className="max-h-48 space-y-0.5 overflow-y-auto">
          {availableCards.map((card) => (
            <label
              key={card.id}
              className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm transition-colors hover:bg-gray-800 ${
                component.cards.includes(card.id)
                  ? "bg-blue-900/40 text-blue-200"
                  : "text-gray-400"
              }`}
            >
              <input
                type="checkbox"
                checked={component.cards.includes(card.id)}
                onChange={() => toggleCard(card.id)}
                className="rounded border-gray-700 bg-gray-950"
              />
              <span className="truncate">{card.id}</span>
            </label>
          ))}
        </div>
      </Field>

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