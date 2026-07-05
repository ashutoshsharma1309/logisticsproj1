"use client";

/**
 * Reactive, SSR-safe key-value persistence layer.
 *
 * This is the ONLY module that talks to the storage engine. Today it is backed
 * by `localStorage` (per-browser, namespaced per organization) so the app is
 * fully functional and deploys to Vercel with zero infrastructure. To move to a
 * hosted database (Supabase/Postgres/Prisma), replace the read/write bodies here
 * with async calls — the collection API and every feature above it stay unchanged.
 *
 * Reactivity is provided through `useSyncExternalStore`: each namespaced key keeps
 * a cached array whose reference only changes on mutation, so React re-renders
 * exactly the components observing a changed collection.
 */

const PREFIX = "chainroute:v1";
const EMPTY: readonly unknown[] = Object.freeze([]);

type Listener = () => void;

const cache = new Map<string, unknown[]>();
const listeners = new Set<Listener>();

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function keyFor(scope: string, collection: string): string {
  return `${PREFIX}:${scope}:${collection}`;
}

function readRaw<T>(key: string): T[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeRaw<T>(key: string, value: T[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private-mode — fail soft, cache still holds the value this session */
  }
}

/** Stable snapshot for a collection (same reference until mutated). */
export function getSnapshot<T>(key: string): T[] {
  if (!isBrowser()) return EMPTY as T[];
  if (!cache.has(key)) cache.set(key, readRaw<T>(key));
  return cache.get(key) as T[];
}

export function getServerSnapshot<T>(): T[] {
  return EMPTY as T[];
}

export function setCollection<T>(key: string, value: T[]): void {
  cache.set(key, value);
  writeRaw(key, value);
  emit();
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit(): void {
  listeners.forEach((l) => l());
}

/** Cross-tab sync: another tab wrote — invalidate cache and re-render. */
if (isBrowser()) {
  window.addEventListener("storage", (e) => {
    if (e.key && e.key.startsWith(PREFIX)) {
      cache.delete(e.key);
      emit();
    }
  });
}

// ---- single scalar values (session, flags) ---------------------------------
export function readValue<T>(key: string): T | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(`${PREFIX}:${key}`);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeValue<T>(key: string, value: T | null): void {
  if (!isBrowser()) return;
  try {
    if (value === null) window.localStorage.removeItem(`${PREFIX}:${key}`);
    else window.localStorage.setItem(`${PREFIX}:${key}`, JSON.stringify(value));
    emit();
  } catch {
    /* ignore */
  }
}

export function subscribeValue(listener: Listener): () => void {
  return subscribe(listener);
}

/** Deterministic-ish unique id without external deps. */
export function makeId(prefix: string): string {
  const rand = isBrowser() && "randomUUID" in crypto
    ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
    : Math.abs(hashString(`${prefix}${performance.now()}${listeners.size}`)).toString(36).padStart(9, "0");
  return `${prefix}_${rand}`;
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h | 0;
}
