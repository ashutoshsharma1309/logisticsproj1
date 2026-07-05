"use client";

import { useMemo } from "react";
import { useCollection } from "@/hooks/use-collection";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/db/audit";
import { useAuth } from "@/components/providers/auth-provider";
import type { AppNotification } from "@/lib/db/types";

export function useNotifications() {
  const { orgId } = useAuth();
  const { items } = useCollection("notifications");

  const unread = useMemo(() => items.filter((n) => !n.read).length, [items]);

  return {
    items: items as AppNotification[],
    unread,
    markRead: (id: string) => orgId && markNotificationRead(orgId, id),
    markAllRead: () => orgId && markAllNotificationsRead(orgId),
  };
}
