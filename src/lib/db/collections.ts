"use client";

import { keyFor, getSnapshot, setCollection, makeId } from "@/lib/db/client";

/**
 * A typed repository over one namespaced collection. All feature code goes
 * through this — never `localStorage` directly. Swapping the storage engine
 * means changing `@/lib/db/client`, not this file.
 */
export interface Repo<T extends { id: string }> {
  key: string;
  all(): T[];
  get(id: string): T | undefined;
  insert(record: T): T;
  update(id: string, patch: Partial<T>): T | undefined;
  remove(id: string): void;
  replaceAll(records: T[]): void;
}

export function repo<T extends { id: string }>(scope: string, name: string): Repo<T> {
  const key = keyFor(scope, name);
  return {
    key,
    all: () => getSnapshot<T>(key),
    get: (id) => getSnapshot<T>(key).find((r) => r.id === id),
    insert: (record) => {
      const next = [record, ...getSnapshot<T>(key)];
      setCollection(key, next);
      return record;
    },
    update: (id, patch) => {
      const items = getSnapshot<T>(key);
      let updated: T | undefined;
      const next = items.map((r) => {
        if (r.id === id) {
          updated = { ...r, ...patch };
          return updated;
        }
        return r;
      });
      if (updated) setCollection(key, next);
      return updated;
    },
    remove: (id) => {
      const next = getSnapshot<T>(key).filter((r) => r.id !== id);
      setCollection(key, next);
    },
    replaceAll: (records) => setCollection(key, records),
  };
}

export { makeId };
