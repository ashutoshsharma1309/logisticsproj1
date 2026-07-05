"use client";

import * as React from "react";
import {
  keyFor,
  getSnapshot,
  getServerSnapshot,
  subscribe,
} from "@/lib/db/client";
import { repo, makeId } from "@/lib/db/collections";
import { logAudit } from "@/lib/db/audit";
import { useAuth } from "@/components/providers/auth-provider";
import type { CollectionMap, CollectionName, AuditLog } from "@/lib/db/types";

type WithMeta = { id: string; orgId: string; createdAt: string };

const ENTITY_LABEL: Record<CollectionName, string> = {
  warehouses: "Warehouse",
  vehicles: "Vehicle",
  drivers: "Driver",
  customers: "Customer",
  shipments: "Shipment",
  ledger: "Ledger block",
  invoices: "Invoice",
  audit: "Audit log",
  notifications: "Notification",
};

export interface UseCollectionResult<T> {
  items: T[];
  orgId: string | null;
  ready: boolean;
  getById: (id: string) => T | undefined;
  add: (data: Omit<T, "id" | "orgId" | "createdAt"> & Partial<WithMeta>, label?: string) => T | null;
  edit: (id: string, patch: Partial<T>, label?: string) => T | undefined;
  remove: (id: string, label?: string) => void;
  replaceAll: (records: T[]) => void;
}

/**
 * Reactive access to one org-scoped collection. Every mutation persists and
 * writes an audit-log entry. Returns empty until an org/session exists, so all
 * surfaces render proper empty states with zero fabricated data.
 */
export function useCollection<K extends CollectionName>(
  name: K,
): UseCollectionResult<CollectionMap[K]> {
  type T = CollectionMap[K];
  const { orgId, account } = useAuth();
  const key = orgId ? keyFor(orgId, name) : keyFor("__none__", name);

  const items = React.useSyncExternalStore(
    subscribe,
    () => getSnapshot<T>(key),
    () => getServerSnapshot<T>(),
  );

  const api = React.useMemo(() => {
    const r = orgId ? repo<T>(orgId, name) : null;
    const actor = { id: account?.id ?? "system", name: account?.name ?? "System" };

    return {
      getById: (id: string) => (r ? r.get(id) : undefined),
      add: (
        data: Omit<T, "id" | "orgId" | "createdAt"> & Partial<WithMeta>,
        label?: string,
      ): T | null => {
        if (!r || !orgId) return null;
        const record = {
          ...(data as object),
          id: (data as Partial<WithMeta>).id ?? makeId(name.slice(0, 3)),
          orgId,
          createdAt: (data as Partial<WithMeta>).createdAt ?? new Date().toISOString(),
        } as T;
        r.insert(record);
        logAudit({
          orgId,
          actorId: actor.id,
          actorName: actor.name,
          action: "create" as AuditLog["action"],
          entity: name,
          entityId: (record as WithMeta).id,
          summary: label ?? `Created ${ENTITY_LABEL[name].toLowerCase()}`,
        });
        return record;
      },
      edit: (id: string, patch: Partial<T>, label?: string) => {
        if (!r || !orgId) return undefined;
        const updated = r.update(id, patch);
        if (updated) {
          logAudit({
            orgId,
            actorId: actor.id,
            actorName: actor.name,
            action: "update",
            entity: name,
            entityId: id,
            summary: label ?? `Updated ${ENTITY_LABEL[name].toLowerCase()}`,
          });
        }
        return updated;
      },
      remove: (id: string, label?: string) => {
        if (!r || !orgId) return;
        r.remove(id);
        logAudit({
          orgId,
          actorId: actor.id,
          actorName: actor.name,
          action: "delete",
          entity: name,
          entityId: id,
          summary: label ?? `Deleted ${ENTITY_LABEL[name].toLowerCase()}`,
        });
      },
      replaceAll: (records: T[]) => r?.replaceAll(records),
    };
  }, [orgId, account, name]);

  return {
    items,
    orgId,
    ready: orgId !== null,
    ...api,
  };
}
