import { useEditorValidationStore } from "@/editor/stores/editorValidationStore";
import { AlertCircle, CheckCircle } from "lucide-react";

export default function ValidationPanel() {
  const validationResult = useEditorValidationStore((s) => s.validationResult);

  if (!validationResult) {
    return (
      <div className="rounded border border-gray-800 bg-gray-900/50 p-3">
        <p className="text-xs text-gray-600">No validation data yet.</p>
      </div>
    );
  }

  if (validationResult.isValid) {
    return (
      <div className="rounded border border-green-900/50 bg-green-950/20 p-3">
        <div className="flex items-center gap-2">
          <CheckCircle size={14} className="text-green-400" />
          <span className="text-xs font-medium text-green-400">No errors</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded border border-red-900/50 bg-red-950/20 p-3">
      <div className="mb-2 flex items-center gap-2">
        <AlertCircle size={14} className="text-red-400" />
        <span className="text-xs font-medium text-red-400">
          {validationResult.errors.length} error(s)
        </span>
      </div>
      <ul className="space-y-1">
        {validationResult.errors.slice(0, 20).map((err, i) => (
          <li key={i} className="text-xs text-red-300">
            <span className="opacity-70">{err.path}</span>
            {err.path && ": "}
            {err.message}
          </li>
        ))}
        {validationResult.errors.length > 20 && (
          <li className="text-xs text-red-400 opacity-70">
            ...and {validationResult.errors.length - 20} more errors
          </li>
        )}
      </ul>
    </div>
  );
}