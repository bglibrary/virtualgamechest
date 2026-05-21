import { useEffect, useRef } from "react";
import { gameDefinitionSchema } from "@/schemas/game";
import { useEditorValidationStore } from "@/editor/stores/editorValidationStore";
import type { GameDefinition } from "@/types/game";
import type { ValidationResult } from "@/editor/stores/editorValidationStore";

/**
 * Formats Zod errors into our ValidationResult format.
 */
function formatValidationResult(
  result: ReturnType<typeof gameDefinitionSchema.safeParse>,
): ValidationResult {
  if (result.success) {
    return { isValid: true, errors: [] };
  }

  const errors = result.error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));

  return { isValid: false, errors };
}

/**
 * Hook that validates the given game definition against the Zod schema
 * whenever it changes, and stores the result in editorValidationStore.
 *
 * Validation is debounced by 300ms.
 */
export function useGameValidation(game: GameDefinition | null): ValidationResult {
  const setValidationResult = useEditorValidationStore((s) => s.setValidationResult);
  const storedResult = useEditorValidationStore((s) => s.validationResult);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (!game) {
      setValidationResult({ isValid: true, errors: [] });
      return;
    }

    timerRef.current = setTimeout(() => {
      const result = gameDefinitionSchema.safeParse(game);
      const formatted = formatValidationResult(result);
      setValidationResult(formatted);
    }, 300);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [game, setValidationResult]);

  // Return the stored result as-is; if null, default to valid (no data yet).
  return storedResult ?? { isValid: true, errors: [] };
}