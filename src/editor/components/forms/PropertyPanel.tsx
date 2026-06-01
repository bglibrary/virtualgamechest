import { useEditorStore } from "@/editor/stores/editorStore";
import { useEditorValidationStore } from "@/editor/stores/editorValidationStore";
import CardForm from "./CardForm";
import DeckForm from "./DeckForm";
import ZoneForm from "./ZoneForm";
import LabelForm from "./LabelForm";
import StartupEditor from "./StartupEditor";
import PositionForm from "./PositionForm";
import LayoutTools from "./LayoutTools";
import CardSizeForm from "./CardSizeForm";

export default function PropertyPanel() {
  const game = useEditorStore((s) => s.game);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const validationResult = useEditorValidationStore((s) => s.validationResult);

  if (!game) {
    return (
      <div className="text-sm text-gray-600">Open a game to begin editing.</div>
    );
  }

  if (selectedIds.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          Select a component to edit its properties, or configure game settings
          below.
        </div>
        <CardSizeForm />
        <hr className="border-gray-800" />
        <StartupEditor />
      </div>
    );
  }

  const selectedComponents = game.components.filter((c) =>
    selectedIds.includes(c.id),
  );

  if (selectedComponents.length === 0) {
    return <div className="text-sm text-gray-600">Component not found.</div>;
  }

  if (selectedComponents.length > 1) {
    return (
      <div className="space-y-6">
        <div className="rounded border border-blue-900/50 bg-blue-950/30 px-3 py-2">
          <p className="text-xs font-medium text-blue-400">
            {selectedComponents.length} components selected
          </p>
        </div>
        <PositionForm components={selectedComponents} />
        <LayoutTools components={selectedComponents} />
      </div>
    );
  }

  const component = selectedComponents[0];

  return (
    <div className="space-y-4">
      {/* Validation error count */}
      {validationResult && !validationResult.isValid && (
        <div className="rounded border border-red-900/50 bg-red-950/30 px-3 py-2">
          <p className="text-xs font-medium text-red-400">
            {validationResult.errors.length} validation error(s)
          </p>
        </div>
      )}

      <PositionForm components={[component]} />
      <hr className="border-gray-800" />

      {component.type === "card" && <CardForm component={component} />}
      {component.type === "deck" && <DeckForm component={component} />}
      {component.type === "zone" && <ZoneForm component={component} />}
      {component.type === "label" && <LabelForm component={component} />}
    </div>
  );
}