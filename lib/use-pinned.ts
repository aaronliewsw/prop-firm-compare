import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "cpf:pinned";

/**
 * localStorage-backed pinned/shortlist state. SSR-safe: starts empty and
 * hydrates from localStorage in an effect so the first server/client render
 * matches. Persists the pinned firm-id set on every change.
 */
export function usePinned() {
  const [pinned, setPinned] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const ids = JSON.parse(raw) as unknown;
        if (Array.isArray(ids)) {
          setPinned(new Set(ids.filter((x): x is string => typeof x === "string")));
        }
      }
    } catch {
      // ignore malformed / unavailable storage
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...pinned]));
    } catch {
      // ignore quota / unavailable storage
    }
  }, [pinned, loaded]);

  const togglePin = useCallback((id: string) => {
    setPinned((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return { pinned, togglePin };
}
