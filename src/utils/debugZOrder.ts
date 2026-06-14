import { useCardZOrderStore } from "@/store/cardZOrderStore";

const DEBUG_KEY = "debug_zorder";

let initialised = false;

function isEnabled(): boolean {
  return (
    localStorage.getItem(DEBUG_KEY) === "1" ||
    (window as unknown as Record<string, unknown>).__DEBUG_ZORDER === true
  );
}

export function enableZOrderDebug(): void {
  localStorage.setItem(DEBUG_KEY, "1");
  console.debug("[zOrder] DEBUG ENABLED");
}

export function disableZOrderDebug(): void {
  localStorage.removeItem(DEBUG_KEY);
  console.debug("[zOrder] DEBUG DISABLED");
}

export function initZOrderDebug(): void {
  if (initialised) return;
  initialised = true;

  if (!isEnabled()) return;

  logZOrder("initialise");

  useCardZOrderStore.subscribe((state, prevState) => {
    if (state.zOrder !== prevState.zOrder) {
      logZOrder("[STORE]", JSON.stringify(prevState.zOrder), "→", JSON.stringify(state.zOrder));
    }
  });
}

export function logZOrder(...args: unknown[]): void {
  console.debug("[zOrder]", ...args);
}

export function logZOrderGroup(label: string, ...args: unknown[]): void {
  if (!isEnabled()) return;
  console.group(`[zOrder] ${label}`);
  for (const arg of args) {
    console.debug(arg);
  }
  console.groupEnd();
}

declare global {
  interface Window {
    __DEBUG_ZORDER?: boolean;
  }
}