"use client";

import { repo, makeId } from "@/lib/db/collections";
import type { AuditLog, AppNotification, NotificationKind } from "@/lib/db/types";

export function logAudit(input: {
  orgId: string;
  actorId: string;
  actorName: string;
  action: AuditLog["action"];
  entity: string;
  entityId?: string;
  summary: string;
}): void {
  if (!input.orgId) return;
  const log: AuditLog = {
    id: makeId("aud"),
    orgId: input.orgId,
    actorId: input.actorId,
    actorName: input.actorName,
    action: input.action,
    entity: input.entity,
    entityId: input.entityId ?? "",
    summary: input.summary,
    createdAt: new Date().toISOString(),
  };
  repo<AuditLog>(input.orgId, "audit").insert(log);
}

export function pushNotification(input: {
  orgId: string;
  title: string;
  body: string;
  kind?: NotificationKind;
  href?: string;
}): void {
  if (!input.orgId) return;
  const note: AppNotification = {
    id: makeId("ntf"),
    orgId: input.orgId,
    title: input.title,
    body: input.body,
    kind: input.kind ?? "info",
    href: input.href ?? "",
    read: false,
    createdAt: new Date().toISOString(),
  };
  repo<AppNotification>(input.orgId, "notifications").insert(note);
}

export function markNotificationRead(orgId: string, id: string): void {
  repo<AppNotification>(orgId, "notifications").update(id, { read: true });
}

export function markAllNotificationsRead(orgId: string): void {
  const r = repo<AppNotification>(orgId, "notifications");
  r.replaceAll(r.all().map((n) => ({ ...n, read: true })));
}
