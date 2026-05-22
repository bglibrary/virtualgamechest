import { useEffect } from "react";
import { useEditorStore } from "@/editor/stores/editorStore";
import { useBlocker } from "react-router-dom";

export function useUnsavedChangesGuard() {
  const isDirty = useEditorStore((s) => s.isDirty);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty &&
      currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (blocker.state === "blocked") {
      const confirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to leave?",
      );
      if (confirmed) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker]);
}