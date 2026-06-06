import { useCallback } from "react";
import type { CardAction, DeckAction, GameComponent } from "@/types/game";
import { useEditorStore } from "@/editor/stores/editorStore";
import CompositeStepEditor from "./CompositeStepEditor";
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";

const CARD_ACTION_TYPES = [
  { value: "flip", label: "Flip" },
  { value: "remove", label: "Remove" },
  { value: "composite", label: "Composite" },
] as const;

const DECK_ACTION_TYPES = [
  { value: "flip", label: "Flip" },
  { value: "draw-face-up", label: "Draw Face Up" },
  { value: "draw-face-down", label: "Draw Face Down" },
  { value: "shuffle", label: "Shuffle" },
  { value: "draw-to-zone", label: "Draw to Zone" },
  { value: "remove", label: "Remove" },
  { value: "composite", label: "Composite" },
] as const;

function createDefaultCardAction(type: string): CardAction {
  switch (type) {
    case "flip":
      return { type: "flip", label: "Retourner" };
    case "remove":
      return { type: "remove", label: "Ranger" };
    case "composite":
      return { type: "composite", label: "Composite", steps: [{ type: "flip" }] };
    default:
      return { type: "flip", label: "Retourner" };
  }
}

function createDefaultDeckAction(type: string): DeckAction {
  switch (type) {
    case "flip":
      return { type: "flip", label: "Retourner" };
    case "draw-face-up":
      return { type: "draw-face-up", label: "Piocher" };
    case "draw-face-down":
      return { type: "draw-face-down", label: "Piocher face cachée" };
    case "shuffle":
      return { type: "shuffle", label: "Mélanger" };
    case "draw-to-zone":
      return { type: "draw-to-zone", label: "Défausser", targetZone: "", faceUp: false, count: 1 };
    case "remove":
      return { type: "remove", label: "Ranger", count: 1 };
    case "composite":
      return { type: "composite", label: "Composite", steps: [{ type: "flip" }] };
    default:
      return { type: "flip", label: "Retourner" };
  }
}

const LABELS: Record<string, string> = {
  flip: "Flip",
  "draw-face-up": "Draw Face Up",
  "draw-face-down": "Draw Face Down",
  shuffle: "Shuffle",
  "draw-to-zone": "Draw to Zone",
};

interface ActionEditorProps {
  componentId: string;
}

export default function ActionEditor({ componentId }: ActionEditorProps) {
  const game = useEditorStore((s) => s.game);
  const updateComponent = useEditorStore((s) => s.updateComponent);

  const component = game?.components.find((c) => c.id === componentId);
  if (!component) return null;

  const isCard = component.type === "card";
  const actions = isCard
    ? (component as any).actions as CardAction[]
    : (component as any).actions as DeckAction[];

  const availableTypes = isCard ? CARD_ACTION_TYPES : DECK_ACTION_TYPES;
  const zones = game?.components.filter((c: GameComponent) => c.type === "zone") ?? [];

  const componentData = component as any;

  const updateActions = useCallback((newActions: any[]) => {
    updateComponent(componentId, (c) => ({
      ...c,
      actions: newActions,
    }));
  }, [componentId, updateComponent]);

  const handleDoubleClickActionChange = useCallback((label: string) => {
    updateComponent(componentId, (c) => ({
      ...c,
      doubleClickActionLabel: label || undefined,
    }));
  }, [componentId, updateComponent]);

  const handleAdd = useCallback(() => {
    const defaultType = isCard ? "flip" : "flip";
    const newAction = isCard
      ? createDefaultCardAction(defaultType)
      : createDefaultDeckAction(defaultType);
    updateActions([...actions, newAction]);
  }, [actions, isCard, updateActions]);

  const handleRemove = useCallback((index: number) => {
    const newActions = [...actions];
    newActions.splice(index, 1);
    updateActions(newActions);
  }, [actions, updateActions]);

  const handleMoveUp = useCallback((index: number) => {
    if (index === 0) return;
    const newActions = [...actions];
    [newActions[index - 1], newActions[index]] = [newActions[index], newActions[index - 1]];
    updateActions(newActions);
  }, [actions, updateActions]);

  const handleMoveDown = useCallback((index: number) => {
    if (index >= actions.length - 1) return;
    const newActions = [...actions];
    [newActions[index], newActions[index + 1]] = [newActions[index + 1], newActions[index]];
    updateActions(newActions);
  }, [actions, updateActions]);

  const handleActionTypeChange = useCallback((index: number, newType: string) => {
    const newAction = isCard
      ? createDefaultCardAction(newType)
      : createDefaultDeckAction(newType);
    const newActions = [...actions];
    newActions[index] = newAction as any;
    updateActions(newActions);
  }, [actions, isCard, updateActions]);

  const handleLabelChange = useCallback((index: number, label: string) => {
    const newActions = [...actions];
    newActions[index] = { ...newActions[index], label } as any;
    updateActions(newActions);
  }, [actions, updateActions]);

  const handleTargetZoneChange = useCallback((index: number, targetZone: string) => {
    const newActions = [...actions];
    const action = newActions[index];
    if ("targetZone" in action) {
      newActions[index] = { ...action, targetZone } as any;
      updateActions(newActions);
    }
  }, [actions, updateActions]);

  const handleFaceUpToggle = useCallback((index: number) => {
    const newActions = [...actions];
    const action = newActions[index];
    if ("faceUp" in action) {
      newActions[index] = { ...action, faceUp: !action.faceUp } as any;
      updateActions(newActions);
    }
  }, [actions, updateActions]);

  const handleStepsUpdate = useCallback((index: number, steps: any[]) => {
    const newActions = [...actions];
    const action = newActions[index];
    if (action.type === "composite") {
      newActions[index] = { ...action, steps } as any;
      updateActions(newActions);
    }
  }, [actions, updateActions]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Actions
        </h3>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-blue-400 hover:bg-blue-900/30"
        >
          <Plus size={12} />
          Add
        </button>
      </div>

      {actions.length === 0 && (
        <p className="text-xs text-gray-600">No actions defined.</p>
      )}

      <div className="space-y-2">
        {actions.map((action, index) => {
          const isComposite = action.type === "composite";
          const hasCountParam = action.type === "remove" || action.type === "draw-to-zone";
  const isDrawToZone = "targetZone" in action;

          return (
            <div
              key={index}
              className="rounded border border-gray-800 bg-gray-950/50 p-2"
            >
              {/* Action header */}
              <div className="mb-2 flex items-center gap-1">
                <select
                  value={action.type}
                  onChange={(e) => handleActionTypeChange(index, e.target.value)}
                  className="flex-1 rounded border border-gray-700 bg-gray-950 px-1.5 py-1 text-xs text-gray-200"
                >
                  {availableTypes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="rounded p-1 text-gray-500 hover:text-gray-300 disabled:opacity-30"
                  title="Move up"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  onClick={() => handleMoveDown(index)}
                  disabled={index >= actions.length - 1}
                  className="rounded p-1 text-gray-500 hover:text-gray-300 disabled:opacity-30"
                  title="Move down"
                >
                  <ChevronDown size={14} />
                </button>
                <button
                  onClick={() => handleRemove(index)}
                  className="rounded p-1 text-red-500 hover:bg-red-900/30"
                  title="Remove action"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Label */}
              <div className="mb-2">
                <label className="mb-0.5 block text-xs text-gray-500">Label</label>
                <input
                  type="text"
                  value={(action as any).label ?? ""}
                  onChange={(e) => handleLabelChange(index, e.target.value)}
                  className="w-full rounded border border-gray-700 bg-gray-950 px-2 py-1 text-xs text-gray-200"
                />
              </div>

              {/* Count parameter for remove action */}
              {action.type === "remove" && (
                <div className="mb-2">
                  <label className="mb-0.5 block text-xs text-gray-500">Count</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={(action as any).count ?? 1}
                    onChange={(e) => {
                      const newActions = [...actions];
                      newActions[index] = { ...newActions[index], count: Math.max(1, Math.min(100, parseInt(e.target.value) || 1)) } as any;
                      updateActions(newActions);
                    }}
                    className="w-full rounded border border-gray-700 bg-gray-950 px-2 py-1 text-xs text-gray-200"
                  />
                </div>
              )}

              {/* Draw-to-zone parameters */}
              {isDrawToZone && (
                <div className="mb-2 space-y-2">
                  <div>
                    <label className="mb-0.5 block text-xs text-gray-500">Target Zone</label>
                    <select
                      value={("targetZone" in action ? (action as any).targetZone : "") ?? ""}
                      onChange={(e) => handleTargetZoneChange(index, e.target.value)}
                      className="w-full rounded border border-gray-700 bg-gray-950 px-2 py-1 text-xs text-gray-200"
                    >
                      <option value="">-- Select zone --</option>
                      {zones.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.id} {z.label ? `(${z.label})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-0.5 block text-xs text-gray-500">Count (1-100)</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={(action as any).count ?? 1}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(100, parseInt(e.target.value) || 1));
                        const newActions = [...actions];
                        newActions[index] = { ...newActions[index], count: val } as any;
                        updateActions(newActions);
                      }}
                      className="w-full rounded border border-gray-700 bg-gray-950 px-2 py-1 text-xs text-gray-200"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-gray-400">
                    <input
                      type="checkbox"
                      checked={"faceUp" in action ? (action as any).faceUp : false}
                      onChange={() => handleFaceUpToggle(index)}
                      className="rounded border-gray-700 bg-gray-950"
                    />
                    Face up
                  </label>
                </div>
              )}

              {/* Composite action steps */}
              {isComposite && (
                <CompositeStepEditor
                  steps={("steps" in action ? (action as any).steps : []) ?? []}
                  onUpdateSteps={(steps) => handleStepsUpdate(index, steps)}
                  isCard={isCard}
                  zones={zones}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Double-click action configuration */}
      <hr className="border-gray-800" />
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          Double-click / Tap
        </h3>
        <select
          value={componentData.doubleClickActionLabel ?? ""}
          onChange={(e) => handleDoubleClickActionChange(e.target.value)}
          className="w-full rounded border border-gray-700 bg-gray-950 px-2 py-1 text-xs text-gray-200"
        >
          <option value="">-- None (double-click does nothing) --</option>
          {actions.map((action, i) => (
            <option key={i} value={(action as any).label ?? ""}>
              {(action as any).label ?? `Action ${i + 1}`}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-600">
          Maps double-click/tap to the selected action. If set to "None", double-click has no effect.
        </p>
      </div>
    </div>
  );
}