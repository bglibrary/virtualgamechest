import { useCallback } from "react";
import type { GameComponent } from "@/types/game";
import type { StartupStep } from "@/types/game";
import { useEditorStore } from "@/editor/stores/editorStore";
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";

const STEP_TYPES = [
  { value: "flip", label: "Flip" },
  { value: "draw-face-up", label: "Draw Face Up" },
  { value: "draw-face-down", label: "Draw Face Down" },
  { value: "shuffle", label: "Shuffle" },
  { value: "draw-to-zone", label: "Draw to Zone" },
  { value: "remove", label: "Remove" },
  { value: "merge", label: "Merge" },
  { value: "composite", label: "Composite" },
] as const;

function createDefaultStep(type: string): StartupStep {
  switch (type) {
    case "flip":
      return { type: "flip", target: "" };
    case "draw-face-up":
      return { type: "draw-face-up", target: "" };
    case "draw-face-down":
      return { type: "draw-face-down", target: "" };
    case "shuffle":
      return { type: "shuffle", target: "" };
    case "draw-to-zone":
      return { type: "draw-to-zone", target: "", targetZone: "", faceUp: false };
    case "remove":
      return { type: "remove", target: "", count: 1 };
    case "merge":
      return { type: "merge", target: "", targetDeck: "" };
    case "composite":
      return { type: "composite", target: "", actionLabel: "" };
    default:
      return { type: "flip", target: "" };
  }
}

export default function StartupEditor() {
  const game = useEditorStore((s) => s.game);
  const updateGame = useEditorStore((s) => s.updateGame);

  if (!game) return null;

  const components = game.components;
  const zones = components.filter((c: GameComponent) => c.type === "zone");
  const steps = game.startup ?? [];

  const updateSteps = useCallback((newSteps: StartupStep[]) => {
    updateGame((g) => ({
      ...g,
      startup: newSteps.length > 0 ? newSteps : undefined,
    }));
  }, [updateGame]);

  const handleAdd = useCallback(() => {
    updateSteps([...steps, createDefaultStep("flip")]);
  }, [steps, updateSteps]);

  const handleRemove = useCallback((index: number) => {
    const newSteps = [...steps];
    newSteps.splice(index, 1);
    updateSteps(newSteps);
  }, [steps, updateSteps]);

  const handleMoveUp = useCallback((index: number) => {
    if (index === 0) return;
    const newSteps = [...steps];
    [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];
    updateSteps(newSteps);
  }, [steps, updateSteps]);

  const handleMoveDown = useCallback((index: number) => {
    if (index >= steps.length - 1) return;
    const newSteps = [...steps];
    [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
    updateSteps(newSteps);
  }, [steps, updateSteps]);

  const handleTypeChange = useCallback((index: number, newType: string) => {
    const newSteps = [...steps];
    newSteps[index] = createDefaultStep(newType);
    updateSteps(newSteps);
  }, [steps, updateSteps]);

  const handleTargetChange = useCallback((index: number, target: string) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], target };
    updateSteps(newSteps);
  }, [steps, updateSteps]);

  const handleTargetZoneChange = useCallback((index: number, targetZone: string) => {
    const newSteps = [...steps] as StartupStep[];
    (newSteps[index] as any).targetZone = targetZone;
    updateSteps(newSteps);
  }, [steps, updateSteps]);

  const handleFaceUpToggle = useCallback((index: number) => {
    const newSteps = [...steps] as StartupStep[];
    const step = newSteps[index] as any;
    if ("faceUp" in step) {
      step.faceUp = !step.faceUp;
      updateSteps(newSteps);
    }
  }, [steps, updateSteps]);

  const handleActionLabelChange = useCallback((index: number, actionLabel: string) => {
    const newSteps = [...steps] as StartupStep[];
    (newSteps[index] as any).actionLabel = actionLabel;
    updateSteps(newSteps);
  }, [steps, updateSteps]);

  const handleCountChange = useCallback((index: number, count: number) => {
    const newSteps = [...steps] as StartupStep[];
    const step = newSteps[index] as any;
    if ("count" in step) {
      step.count = Math.max(1, Math.min(100, count));
      updateSteps(newSteps);
    }
  }, [steps, updateSteps]);

  const decks = components.filter((c: GameComponent) => c.type === "deck");

  /** For shuffle steps, only decks are valid targets */
  const targetOptionsForType = (step: StartupStep): { id: string }[] => {
    if (step.type === "shuffle") {
      return decks.map((d) => ({ id: d.id }));
    }
    return components;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Startup Sequence
        </h3>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-blue-400 hover:bg-blue-900/30"
        >
          <Plus size={12} />
          Add Step
        </button>
      </div>

      {steps.length === 0 && (
        <p className="text-xs text-gray-600">
          No startup steps defined. The game will start without any automatic actions.
        </p>
      )}

      <div className="space-y-2">
        {steps.map((step, index) => {
          const isDrawToZone = "targetZone" in step && step.type === "draw-to-zone";
          const isComposite = step.type === "composite";
          const isRemove = step.type === "remove";

          return (
            <div
              key={index}
              className="rounded border border-gray-800 bg-gray-950/50 p-2"
            >
              {/* Step header */}
              <div className="mb-2 flex items-center gap-1">
                <span className="rounded bg-gray-800 px-1.5 py-0.5 text-xs text-gray-400">
                  #{index + 1}
                </span>
                <select
                  value={step.type}
                  onChange={(e) => handleTypeChange(index, e.target.value)}
                  className="flex-1 rounded border border-gray-700 bg-gray-950 px-1.5 py-1 text-xs text-gray-200"
                >
                  {STEP_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="rounded p-1 text-gray-500 hover:text-gray-300 disabled:opacity-30"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  onClick={() => handleMoveDown(index)}
                  disabled={index >= steps.length - 1}
                  className="rounded p-1 text-gray-500 hover:text-gray-300 disabled:opacity-30"
                >
                  <ChevronDown size={14} />
                </button>
                <button
                  onClick={() => handleRemove(index)}
                  className="rounded p-1 text-red-500 hover:bg-red-900/30"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Target */}
              <div className="mb-2">
                <label className="mb-0.5 block text-xs text-gray-500">Target</label>
                <select
                  value={step.target}
                  onChange={(e) => handleTargetChange(index, e.target.value)}
                  className="w-full rounded border border-gray-700 bg-gray-950 px-2 py-1 text-xs text-gray-200"
                >
                  <option value="">-- Select component --</option>
                  {targetOptionsForType(step).map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.id}
                    </option>
                  ))}
                </select>
              </div>

              {/* Merge targetDeck selector */}
                {step.type === "merge" && "targetDeck" in step && (
                  <div className="mb-2">
                    <label className="mb-0.5 block text-xs text-gray-500">Target Deck (merge into)</label>
                    <select
                      value={(step as any).targetDeck ?? ""}
                      onChange={(e) => {
                        const newSteps = [...steps] as StartupStep[];
                        (newSteps[index] as any).targetDeck = e.target.value;
                        updateSteps(newSteps);
                      }}
                      className="w-full rounded border border-gray-700 bg-gray-950 px-2 py-1 text-xs text-gray-200"
                    >
                      <option value="">-- Select deck --</option>
                      {decks.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.id}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

              {/* Draw-to-zone parameters */}
              {isDrawToZone && (
                <div className="mb-2 space-y-2">
                  <div>
                    <label className="mb-0.5 block text-xs text-gray-500">Target Zone</label>
                    <select
                      value={"targetZone" in step ? (step as any).targetZone : ""}
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
                  <label className="flex items-center gap-2 text-xs text-gray-400">
                    <input
                      type="checkbox"
                      checked={"faceUp" in step ? (step as any).faceUp : false}
                      onChange={() => handleFaceUpToggle(index)}
                      className="rounded border-gray-700 bg-gray-950"
                    />
                    Face up
                  </label>
                </div>
              )}

              {/* Composite action label */}
              {isComposite && (
                <div>
                  <label className="mb-0.5 block text-xs text-gray-500">Action Label</label>
                  <input
                    type="text"
                    value={"actionLabel" in step ? (step as any).actionLabel ?? "" : ""}
                    onChange={(e) => handleActionLabelChange(index, e.target.value)}
                    placeholder="e.g., Shuffle & Deal"
                    className="w-full rounded border border-gray-700 bg-gray-950 px-2 py-1 text-xs text-gray-200"
                  />
                </div>
              )}

              {/* Remove count */}
              {isRemove && (
                <div>
                  <label className="mb-0.5 block text-xs text-gray-500">Count (1-100)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={"count" in step ? (step as any).count ?? 1 : 1}
                    onChange={(e) => handleCountChange(index, parseInt(e.target.value) || 1)}
                    className="w-full rounded border border-gray-700 bg-gray-950 px-2 py-1 text-xs text-gray-200"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}