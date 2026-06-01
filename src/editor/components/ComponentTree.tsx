import { useCallback, useState } from "react";
import type { GameComponent } from "@/types/game";
import { useEditorStore } from "@/editor/stores/editorStore";
import {
  createDefaultCard,
  createDefaultZone,
  createDefaultLabel,
} from "@/editor/utils/componentFactory";
import { Trash2 } from "lucide-react";
import BulkCardWizard from "@/editor/components/forms/BulkCardWizard";

export default function ComponentTree() {
  const game = useEditorStore((s) => s.game);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const selectComponent = useEditorStore((s) => s.selectComponent);
  const updateGame = useEditorStore((s) => s.updateGame);

  const cards =
    game?.components.filter((c: GameComponent) => c.type === "card") ?? [];
  const decks =
    game?.components.filter((c: GameComponent) => c.type === "deck") ?? [];
      const zones =
    game?.components.filter((c: GameComponent) => c.type === "zone") ?? [];
  const labels =
    game?.components.filter((c: GameComponent) => c.type === "label") ?? [];

  const handleSelect = useCallback(
    (e: React.MouseEvent, id: string) => {
      const isMulti = e.shiftKey || e.metaKey || e.ctrlKey;
      selectComponent(id, isMulti);
    },
    [selectComponent],
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (!game) return;
      if (!confirm("Delete this component? This cannot be undone.")) return;
      updateGame((g) => ({
        ...g,
        components: g.components.filter((c) => c.id !== id),
      }));
      if (selectedIds.includes(id)) {
        selectComponent(null);
      }
    },
    [game, updateGame, selectedIds, selectComponent],
  );

  const handleAddCard = useCallback(() => {
    if (!game) return;
    const existingIds = game.components.map((c) => c.id);
    const newCard = createDefaultCard(existingIds);
    updateGame((g) => ({
      ...g,
      components: [...g.components, newCard],
    }));
    selectComponent(newCard.id);
  }, [game, updateGame, selectComponent]);

  const handleAddZone = useCallback(() => {
    if (!game) return;
    const existingIds = game.components.map((c) => c.id);
    const newZone = createDefaultZone(existingIds);
    updateGame((g) => ({
      ...g,
      components: [...g.components, newZone],
    }));
    selectComponent(newZone.id);
  }, [game, updateGame, selectComponent]);

  const [showBulkWizard, setShowBulkWizard] = useState(false);

  const handleAddLabel = useCallback(() => {
    if (!game) return;
    const existingIds = game.components.map((c) => c.id);
    const newLabel = createDefaultLabel(existingIds);
    updateGame((g) => ({
      ...g,
      components: [...g.components, newLabel],
    }));
    selectComponent(newLabel.id);
  }, [game, updateGame, selectComponent]);

  if (!game) {
    return (
      <div className="text-sm text-gray-600">
        Open a game to see its components.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cards section */}
      <Section
        title="Cards"
        count={cards.length}
        onAdd={handleAddCard}
        addLabel="+ Add Card"
      >
        {cards.length === 0 && (
          <p className="px-2 text-xs text-gray-600">(no cards)</p>
        )}
        {cards.map((card) => (
          <ComponentRow
            key={card.id}
            id={card.id}
            label={card.id}
            type="card"
            isSelected={selectedIds.includes(card.id)}
            onSelect={(e) => handleSelect(e, card.id)}
            onDelete={(e) => handleDelete(e, card.id)}
          />
        ))}
      </Section>

      {/* Decks section */}
      <Section
        title="Decks"
        count={decks.length}
        onAdd={() => setShowBulkWizard(true)}
        addLabel="+ Add Deck"
      >
        {decks.length === 0 && (
          <p className="px-2 text-xs text-gray-600">(no decks)</p>
        )}
        {decks.map((deck) => (
          <ComponentRow
            key={deck.id}
            id={deck.id}
            label={deck.id}
            type="deck"
            isSelected={selectedIds.includes(deck.id)}
            onSelect={(e) => handleSelect(e, deck.id)}
            onDelete={(e) => handleDelete(e, deck.id)}
          />
        ))}
      </Section>

      {showBulkWizard && (
        <BulkCardWizard onClose={() => setShowBulkWizard(false)} />
      )}

      {/* Zones section */}
      <Section
        title="Zones"
        count={zones.length}
        onAdd={handleAddZone}
        addLabel="+ Add Zone"
      >
        {zones.length === 0 && (
          <p className="px-2 text-xs text-gray-600">(no zones)</p>
        )}
        {zones.map((zone) => (
          <ComponentRow
            key={zone.id}
            id={zone.id}
            label={zone.id}
            type="zone"
            isSelected={selectedIds.includes(zone.id)}
            onSelect={(e) => handleSelect(e, zone.id)}
            onDelete={(e) => handleDelete(e, zone.id)}
          />
        ))}
      </Section>

      {/* Labels section */}
      <Section
        title="Labels"
        count={labels.length}
        onAdd={handleAddLabel}
        addLabel="+ Add Label"
      >
        {labels.length === 0 && (
          <p className="px-2 text-xs text-gray-600">(no labels)</p>
        )}
        {labels.map((label) => (
          <ComponentRow
            key={label.id}
            id={label.id}
            label={label.id}
            type="label"
            isSelected={selectedIds.includes(label.id)}
            onSelect={(e) => handleSelect(e, label.id)}
            onDelete={(e) => handleDelete(e, label.id)}
          />
        ))}
      </Section>
    </div>
  );
}

// ─── Sub-components ───

interface SectionProps {
  title: string;
  count: number;
  onAdd: () => void;
  addLabel: string;
  children: React.ReactNode;
}

function Section({ title, count, onAdd, addLabel, children }: SectionProps) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between px-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {title}
          <span className="ml-1 font-normal text-gray-600">({count})</span>
        </h3>
      </div>
      <div className="space-y-0.5">{children}</div>
      <button
        onClick={onAdd}
        className="mt-1 w-full rounded px-2 py-1 text-left text-xs text-gray-500 hover:bg-gray-800 hover:text-gray-300"
      >
        {addLabel}
      </button>
    </div>
  );
}

interface ComponentRowProps {
  id: string;
  label: string;
  type: "card" | "deck" | "zone" | "label";
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

function ComponentRow({
  id,
  label,
  type,
  isSelected,
  onSelect,
  onDelete,
}: ComponentRowProps) {
  const typeIcon =
    type === "card" ? "\u2660" : type === "deck" ? "\u25B6" : type === "zone" ? "\u25A3" : "\u270E";

  return (
    <div
      onClick={onSelect}
      className={`group flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 text-sm transition-colors ${
        isSelected
          ? "bg-blue-900/60 text-blue-200"
          : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
      }`}
    >
      <span className="w-4 text-center text-xs opacity-60">{typeIcon}</span>
      <span className="flex-1 truncate">{label}</span>
      <button
        onClick={onDelete}
        className="invisible rounded p-0.5 text-red-400 opacity-0 transition-all hover:bg-red-900/50 group-hover:visible group-hover:opacity-100"
        title="Delete"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}