"use client";

import { useMemo } from "react";
import { useCollection } from "@/hooks/use-collection";
import { useAuth } from "@/components/providers/auth-provider";
import { computeStats, type DataBundle, type Stat } from "@/lib/analytics/compute";

export interface OrgData extends DataBundle {
  currency: string;
  stats: Stat[];
  isEmpty: boolean;
  ready: boolean;
}

/** One-stop reactive read of every org collection plus derived KPIs. */
export function useOrgData(): OrgData {
  const { org, orgId } = useAuth();
  const shipments = useCollection("shipments").items;
  const warehouses = useCollection("warehouses").items;
  const vehicles = useCollection("vehicles").items;
  const drivers = useCollection("drivers").items;
  const customers = useCollection("customers").items;
  const invoices = useCollection("invoices").items;

  const currency = org?.currency ?? "USD";

  const bundle = useMemo<DataBundle>(
    () => ({ shipments, warehouses, vehicles, drivers, customers, invoices }),
    [shipments, warehouses, vehicles, drivers, customers, invoices],
  );

  const stats = useMemo(() => computeStats(bundle, currency), [bundle, currency]);

  const isEmpty =
    shipments.length + warehouses.length + vehicles.length + drivers.length + customers.length === 0;

  return { ...bundle, currency, stats, isEmpty, ready: orgId !== null };
}
