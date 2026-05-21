import { useEditorStore } from "@/editor/stores/editorStore";
import { useEditorValidationStore } from "@/editor/stores/editorValidationStore";
import CardForm from "./CardForm";
import DeckForm from "./DeckForm";
import ZoneForm from "./ZoneForm";
import StartupEditor from "./StartupEditor";

export default function PropertyPanel() {
  const game = useEditorStore((s) => s.game);
  const selectedId = useEditorStore((s) => s.selectedId);
  const validationResult = useEditorValidationStore((s) => s.validationResult);

  if (!game) {
    return (
      <div className="text-sm text-gray-600">
        Open a game to begin editing.
      </div>
    );
  }

  if (!selectedId) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          Select a component to edit its properties, or configure the startup sequence below.
        </div>
        <StartupEditor />
      </div>
    );
  }

  const component = game.components.find((c) => c.id === selectedId);
  if (!component) {
    return (
      <div className="text-sm text-gray-600">
        Component not found.
      </div>
    );
  }

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

      {component.type === "card" && <CardForm component={component} />}
      {component.type === "deck" && <DeckForm component={component} />}
      {component.type === "zone" && <ZoneForm component={component} />}
    </div>
  );
}