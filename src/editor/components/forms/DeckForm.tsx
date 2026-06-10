import { useCallback, useMemo } from "react";
import type { CardComponent, DeckComponent, GameComponent } from "@/types/game";
import { useEditorStore } from "@/editor/stores/editorStore";
import ActionEditor from "./ActionEditor";

interface Props {
  component: DeckComponent;
}

export default function DeckForm({ component }: Props) {
  const game = useEditorStore((s) => s.game);
  const updateComponent = useEditorStore((s) => s.updateComponent);

  const allCards = (game?.components.filter(
    (c: GameComponent) => c.type === "card",
  ) ?? []) as CardComponent[];

  const otherDeckCards = useMemo(() => {
    if (!game) return new Set<string>();
    const otherDecks = game.components.filter(
      (c): c is DeckComponent => c.type === "deck" && c.id !== component.id,
    );
    return new Set(otherDecks.flatMap((d) => d.cards));
  }, [game, component.id]);

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
      const isCurrentlyInDeck = component.cards.includes(cardId);

      updateComponent(component.id, (c) => {
        if (c.type !== "deck") return c;
        return {
          ...c,
          cards: isCurrentlyInDeck
            ? c.cards.filter((id) => id !== cardId)
            : [...c.cards, cardId],
        };
      });

      updateComponent(cardId, (c) => {
        if (c.type !== "card") return c;
        return {
          ...c,
          position: isCurrentlyInDeck ? { x: 0.5, y: 0.5 } : null,
        };
      });
    },
    [component.id, component.cards, updateComponent],
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

      <Field label="Masquer le compteur">
        <input
          type="checkbox"
          checked={component.hideCountBadge ?? false}
          onChange={() => updateComponent(component.id, (c) =>
            c.type === "deck" ? { ...c, hideCountBadge: !c.hideCountBadge } : c,
          )}
          className="rounded border-gray-700 bg-gray-950"
        />
      </Field>

      <Field label="Cards">
        {allCards.length === 0 && (
          <p className="text-xs text-gray-600">No cards available — create some first.</p>
        )}
        <div className="max-h-48 space-y-0.5 overflow-y-auto">
          {[...allCards]
            .sort((a, b) => {
              const aInDeck = component.cards.includes(a.id) ? 0 : 1;
              const bInDeck = component.cards.includes(b.id) ? 0 : 1;
              return aInDeck - bInDeck;
            })
            .map((card) => {
            const isInCurrentDeck = component.cards.includes(card.id);
            const isInOtherDeck = otherDeckCards.has(card.id);
            const isDisabled = isInOtherDeck;
            return (
              <label
                key={card.id}
                className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm transition-colors ${
                  isDisabled
                    ? "cursor-not-allowed text-gray-700"
                    : isInCurrentDeck
                      ? "bg-blue-900/40 text-blue-200"
                      : "text-gray-400 hover:bg-gray-800"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isInCurrentDeck}
                  disabled={isDisabled}
                  onChange={() => toggleCard(card.id)}
                  className="rounded border-gray-700 bg-gray-950"
                />
                <span className="truncate">{card.id}</span>
                {isInOtherDeck && (
                  <span className="ml-auto shrink-0 text-xs text-gray-600">
                    in use
                  </span>
                )}
              </label>
            );
          })}
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