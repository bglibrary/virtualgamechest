import { create } from "zustand";

export interface ValidationError {
  path: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface EditorValidationState {
  validationResult: ValidationResult | null;
  lastValidated: number | null;

  // Actions
  setValidationResult: (result: ValidationResult) => void;
  clearValidation: () => void;
}

export const useEditorValidationStore = create<EditorValidationState>((set) => ({
  validationResult: null,
  lastValidated: null,

  setValidationResult: (result) =>
    set({ validationResult: result, lastValidated: Date.now() }),

  clearValidation: () =>
    set({ validationResult: null, lastValidated: null }),
}));