"use client";

import { useMemo } from "react";
import { useOrgData } from "@/hooks/use-org-data";
import { useCollection } from "@/hooks/use-collection";
import { computeHealth, totalEmissions } from "@/lib/health/score";
import { deriveAlerts } from "@/lib/alerts/derive";
import { verifyChain } from "@/lib/ledger/mint";
import { buildNetworkModel } from "@/lib/network";

/** Single reactive source for the Command Center — health, alerts, network, ledger. */
export function useCommandCenter() {
  const { shipments, warehouses, vehicles, drivers, currency, isEmpty } = useOrgData();
  const ledger = useCollection("ledger").items;

  const integrity = useMemo(() => (ledger.length ? verifyChain(ledger) : null), [ledger]);

  const health = useMemo(
    () =>
      computeHealth({
        shipments,
        warehouses,
        vehicles,
        integrityValid: integrity ? integrity.valid : null,
      }),
    [shipments, warehouses, vehicles, integrity],
  );

  const alerts = useMemo(
    () => deriveAlerts({ shipments, warehouses, vehicles, drivers }),
    [shipments, warehouses, vehicles, drivers],
  );

  const emissions = useMemo(() => totalEmissions(shipments), [shipments]);
  const network = useMemo(() => buildNetworkModel(shipments, warehouses), [shipments, warehouses]);
  const recentBlocks = useMemo(
    () => [...ledger].sort((a, b) => b.blockIndex - a.blockIndex).slice(0, 8),
    [ledger],
  );

  return { health, alerts, emissions, network, recentBlocks, integrity, currency, isEmpty };
}
