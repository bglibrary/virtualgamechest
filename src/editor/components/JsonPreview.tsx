import { useMemo } from "react";
import { useEditorStore } from "@/editor/stores/editorStore";
import { Copy, Check } from "lucide-react";
import { useState, useCallback } from "react";

export default function JsonPreview() {
  const game = useEditorStore((s) => s.game);
  const [copied, setCopied] = useState(false);

  const jsonString = useMemo(() => {
    if (!game) return "// No game data";
    try {
      return JSON.stringify(game, null, 2);
    } catch {
      return "// Error serializing game data";
    }
  }, [game]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(jsonString).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [jsonString]);

  if (!game) {
    return (
      <div className="rounded border border-gray-800 bg-gray-900/50 p-3">
        <p className="text-xs text-gray-600">Open a game to preview its JSON.</p>
      </div>
    );
  }

  return (
    <div className="rounded border border-gray-800 bg-gray-900/50">
      <div className="flex items-center justify-between border-b border-gray-800 px-3 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          JSON Preview
        </h3>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-400 hover:bg-gray-800 hover:text-gray-200"
        >
          {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="max-h-96 overflow-auto p-3 text-xs text-gray-300">
        <code>{jsonString}</code>
      </pre>
    </div>
  );
}