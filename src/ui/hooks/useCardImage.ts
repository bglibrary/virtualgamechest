import { useRef, useEffect, useCallback, useSyncExternalStore } from "react";

interface UseCardImageResult {
  image: HTMLImageElement | null;
  loading: boolean;
  error: boolean;
}

interface StoreEntry {
  image: HTMLImageElement | null;
  loading: boolean;
  error: boolean;
  listeners: Set<() => void>;
  version: number;
}

const EMPTY_RESULT: UseCardImageResult = Object.freeze({
  image: null,
  loading: false,
  error: false,
});

const stores = new Map<string, StoreEntry>();

function getOrCreateStore(url: string): StoreEntry {
  let entry = stores.get(url);
  if (!entry) {
    entry = { image: null, loading: false, error: false, listeners: new Set(), version: 0 };
    stores.set(url, entry);
  }
  return entry;
}

function subscribeToStore(entry: StoreEntry, listener: () => void) {
  entry.listeners.add(listener);
  return () => {
    entry.listeners.delete(listener);
  };
}

function getStoreVersion(entry: StoreEntry | null) {
  return entry?.version ?? -1;
}

function useCardImage(url: string | undefined): UseCardImageResult {
  const entry = url ? getOrCreateStore(url) : null;

  const subscribe = useCallback(
    (listener: () => void) => {
      if (!entry) return () => {};
      return subscribeToStore(entry, listener);
    },
    [entry],
  );

  const getSnapshot = useCallback(() => {
    return getStoreVersion(entry);
  }, [entry]);

  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const prevUrlRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    prevUrlRef.current = url;
    if (!url) return;

    // Critical: DO NOT delete+recreate the store entry.
    // The entry was already created (or retrieved) during render (line ~51) and
    // captured by subscribe/getSnapshot callbacks.  If we delete and recreate
    // here, the effect writes to a *different* object (E2) while the component
    // reads from the stale original (E1), so `useSyncExternalStore` never fires
    // a re-render — the image stays stuck in loading/fallback forever.
    //
    // Instead, just reset the SAME entry's state to force a fresh load:
    const e = getOrCreateStore(url);
    e.image = null;
    e.loading = true;
    e.error = false;
    e.version++;
    e.listeners.forEach((l) => l());

    const img = new window.Image();
    // crossOrigin="anonymous" prevents CORS issues for external URLs,
    // but breaks blob URLs (blob: URLs are same-origin by default)
    if (!url.startsWith("blob:")) {
      img.crossOrigin = "anonymous";
    }

    const loadingTimeout = setTimeout(() => {
      console.warn(
        `[useCardImage] LOADING TIMEOUT 3s: url=${url.substring(0, 50)} ` +
        `img.complete=${img.complete} img.naturalWidth=${img.naturalWidth} ` +
        `stores.has=${stores.has(url)} loading=${e.loading} error=${e.error}`,
      );
    }, 3000);

    img.onload = () => {
      clearTimeout(loadingTimeout);
      console.warn(`[useCardImage] loaded: ${url.substring(0, 50)} (${img.naturalWidth}x${img.naturalHeight})`);
      e.image = img;
      e.loading = false;
      e.error = false;
      e.version++;
      e.listeners.forEach((l) => l());
    };

    img.onerror = () => {
      clearTimeout(loadingTimeout);
      console.warn(`[useCardImage] FAILED to load: ${url.substring(0, 50)} — falling back to text`);
      e.image = null;
      e.loading = false;
      e.error = true;
      e.version++;
      e.listeners.forEach((l) => l());
    };

    img.src = url;

    return () => {
      clearTimeout(loadingTimeout);
      img.onload = null;
      img.onerror = null;
    };
  }, [url]);

  if (!url || !entry) return EMPTY_RESULT;

  return { image: entry.image, loading: entry.loading, error: entry.error };
}

export default useCardImage;
export type { UseCardImageResult };
