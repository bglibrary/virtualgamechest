import { useCallback } from "react";
import type { GameComponent } from "@/types/game";
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";

const CARD_STEP_TYPES = [
  { value: "flip", label: "Flip" },
] as const;

const DECK_STEP_TYPES = [
  { value: "flip", label: "Flip" },
  { value: "draw-face-up", label: "Draw Face Up" },
  { value: "draw-face-down", label: "Draw Face Down" },
  { value: "shuffle", label: "Shuffle" },
  { value: "draw-to-zone", label: "Draw to Zone" },
] as const;

function createDefaultStep(type: string, isCard: boolean): any {
  switch (type) {
    case "flip":
      return { type: "flip" };
    case "draw-face-up":
      return { type: "draw-face-up" };
    case "draw-face-down":
      return { type: "draw-face-down" };
    case "shuffle":
      return { type: "shuffle" };
    case "draw-to-zone":
      return { type: "draw-to-zone", targetZone: "", faceUp: false };
    default:
      return { type: "flip" };
  }
}

interface CompositeStepEditorProps {
  steps: any[];
  onUpdateSteps: (steps: any[]) => void;
  isCard: boolean;
  zones: GameComponent[];
}

export default function CompositeStepEditor({
  steps,
  onUpdateSteps,
  isCard,
  zones,
}: CompositeStepEditorProps) {
  const stepTypes = isCard ? CARD_STEP_TYPES : DECK_STEP_TYPES;

  const handleAdd = useCallback(() => {
    const defaultType = isCard ? "flip" : "flip";
    onUpdateSteps([...steps, createDefaultStep(defaultType, isCard)]);
  }, [steps, isCard, onUpdateSteps]);

  const handleRemove = useCallback((index: number) => {
    const newSteps = [...steps];
    newSteps.splice(index, 1);
    onUpdateSteps(newSteps);
  }, [steps, onUpdateSteps]);

  const handleMoveUp = useCallback((index: number) => {
    if (index === 0) return;
    const newSteps = [...steps];
    [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];
    onUpdateSteps(newSteps);
  }, [steps, onUpdateSteps]);

  const handleMoveDown = useCallback((index: number) => {
    if (index >= steps.length - 1) return;
    const newSteps = [...steps];
    [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
    onUpdateSteps(newSteps);
  }, [steps, onUpdateSteps]);

  const handleTypeChange = useCallback((index: number, newType: string) => {
    const newSteps = [...steps];
    newSteps[index] = createDefaultStep(newType, isCard);
    onUpdateSteps(newSteps);
  }, [steps, isCard, onUpdateSteps]);

  const handleTargetZoneChange = useCallback((index: number, targetZone: string) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], targetZone };
    onUpdateSteps(newSteps);
  }, [steps, onUpdateSteps]);

  const handleFaceUpToggle = useCallback((index: number) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], faceUp: !newSteps[index].faceUp };
    onUpdateSteps(newSteps);
  }, [steps, onUpdateSteps]);

  return (
    <div className="space-y-1 border-t border-gray-800 pt-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium text-gray-500">Steps</h4>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-blue-400 hover:bg-blue-900/30"
        >
          <Plus size={10} />
          Step
        </button>
      </div>

      {steps.length === 0 && (
        <p className="text-xs text-gray-600">No steps defined.</p>
      )}

      <div className="space-y-1">
        {steps.map((step, index) => {
          const isDrawToZone = step.type === "draw-to-zone";

          return (
            <div
              key={index}
              className="flex items-start gap-1 rounded bg-gray-900/50 p-1.5"
            >
              <div className="flex-1 space-y-1">
                <select
                  value={step.type}
                  onChange={(e) => handleTypeChange(index, e.target.value)}
                  className="w-full rounded border border-gray-700 bg-gray-950 px-1.5 py-1 text-xs text-gray-200"
                >
                  {stepTypes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>

                {isDrawToZone && (
                  <div className="space-y-1">
                    <select
                      value={step.targetZone ?? ""}
                      onChange={(e) => handleTargetZoneChange(index, e.target.value)}
                      className="w-full rounded border border-gray-700 bg-gray-950 px-1.5 py-1 text-xs text-gray-200"
                    >
                      <option value="">-- Zone --</option>
                      {zones.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.id} {z.label ? `(${z.label})` : ""}
                        </option>
                      ))}
                    </select>
                    <label className="flex items-center gap-1.5 text-xs text-gray-400">
                      <input
                        type="checkbox"
                        checked={step.faceUp ?? false}
                        onChange={() => handleFaceUpToggle(index)}
                        className="rounded border-gray-700 bg-gray-950"
                      />
                      Face up
                    </label>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="rounded p-0.5 text-gray-500 hover:text-gray-300 disabled:opacity-30"
                >
                  <ChevronUp size={12} />
                </button>
                <button
                  onClick={() => handleMoveDown(index)}
                  disabled={index >= steps.length - 1}
                  className="rounded p-0.5 text-gray-500 hover:text-gray-300 disabled:opacity-30"
                >
                  <ChevronDown size={12} />
                </button>
                <button
                  onClick={() => handleRemove(index)}
                  className="rounded p-0.5 text-red-500 hover:bg-red-900/30"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}