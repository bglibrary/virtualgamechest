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

    const e = getOrCreateStore(url);
    e.image = null;
    e.loading = true;
    e.error = false;
    e.version++;
    e.listeners.forEach((l) => l());

    const img = new window.Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      e.image = img;
      e.loading = false;
      e.error = false;
      e.version++;
      e.listeners.forEach((l) => l());
    };

    img.onerror = () => {
      console.warn(`Card image failed to load: ${url} — falling back to text`);
      e.image = null;
      e.loading = false;
      e.error = true;
      e.version++;
      e.listeners.forEach((l) => l());
    };

    img.src = url;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [url]);

  if (!url || !entry) return EMPTY_RESULT;

  return { image: entry.image, loading: entry.loading, error: entry.error };
}

export default useCardImage;
export type { UseCardImageResult };
