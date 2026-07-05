"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { simHash, simSignature } from "@/lib/hash";
import type { LedgerEvent, ShipmentStatus, SimRoute } from "@/types";

interface SimEventDraft {
  shipmentRef: string;
  status: ShipmentStatus;
  location: string;
  integrity: number;
}

const NODES = ["node-alpha-01", "node-gamma-07", "node-delta-02", "node-sigma-03"];
const VERIFIERS = ["Validator-EU-West", "Validator-US-East", "Validator-APAC"];

export interface SimulationState {
  running: boolean;
  speed: number;
  tick: number;
  events: LedgerEvent[];
}

/**
 * Drives the logistics simulator. Advances route progress on each animation
 * frame and, when a route crosses a checkpoint, mints a new (simulated)
 * ledger block chained to the previous hash.
 */
export function useSimulation(initialRoutes: SimRoute[]) {
  const [routes, setRoutes] = useState<SimRoute[]>(initialRoutes);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [tick, setTick] = useState(0);
  const [events, setEvents] = useState<LedgerEvent[]>([]);

  const prevHash = useRef(
    "0000000000000000000000000000000000000000000000000000000000000000",
  );
  const blockIndex = useRef(1);
  const raf = useRef<number | null>(null);
  const last = useRef<number>(0);
  const checkpoints = useRef<Record<string, number>>({});

  const mint = useCallback((draft: SimEventDraft, atTick: number) => {
    const nonce = Math.floor((atTick * 9301 + 49297) % 233280);
    const timestamp = new Date("2026-07-04T12:00:00Z").getTime() + atTick * 60000;
    const payload = `${draft.shipmentRef}|${draft.status}|${draft.location}|${timestamp}|${nonce}|${prevHash.current}`;
    const hash = simHash(payload);
    const event: LedgerEvent = {
      id: `sim_${blockIndex.current}`,
      blockIndex: blockIndex.current,
      shipmentId: draft.shipmentRef,
      shipmentRef: draft.shipmentRef,
      status: draft.status,
      node: NODES[blockIndex.current % NODES.length]!,
      location: draft.location,
      timestamp: new Date(timestamp).toISOString(),
      hash,
      previousHash: prevHash.current,
      signature: simSignature(payload),
      verifier: VERIFIERS[blockIndex.current % VERIFIERS.length]!,
      integrityScore: draft.integrity,
      nonce,
      confirmations: 1,
      gas: Math.round(((atTick % 30) / 10 + 0.4) * 1000) / 1000,
    };
    prevHash.current = hash;
    blockIndex.current += 1;
    setEvents((prev) => [event, ...prev].slice(0, 40));
  }, []);

  useEffect(() => {
    if (!running) {
      if (raf.current) cancelAnimationFrame(raf.current);
      return;
    }
    const loop = (now: number) => {
      if (!last.current) last.current = now;
      const dt = (now - last.current) / 1000;
      last.current = now;
      setTick((t) => {
        const nt = t + dt * speed * 6;
        setRoutes((rs) =>
          rs.map((r) => {
            let progress = (r.progress + dt * speed * 0.06 * (0.6 + (r.healthScore / 100))) % 1;
            const stage = Math.floor(progress * 4);
            const key = `${r.id}:${stage}`;
            if (!checkpoints.current[key] && stage > 0) {
              checkpoints.current[key] = nt;
              const statuses: ShipmentStatus[] = [
                "in_transit",
                "at_warehouse",
                "customs",
                "out_for_delivery",
              ];
              mint(
                {
                  shipmentRef: r.shipmentRef,
                  status: statuses[stage % statuses.length]!,
                  location: `${r.from} → ${r.to}`,
                  integrity: 96 + (stage % 4),
                },
                nt,
              );
            }
            return { ...r, progress };
          }),
        );
        return nt;
      });
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      last.current = 0;
    };
  }, [running, speed, mint]);

  const reset = useCallback(() => {
    setRoutes(initialRoutes.map((r) => ({ ...r, progress: 0 })));
    setEvents([]);
    setTick(0);
    checkpoints.current = {};
    prevHash.current =
      "0000000000000000000000000000000000000000000000000000000000000000";
    blockIndex.current = 1;
  }, [initialRoutes]);

  return {
    routes,
    running,
    speed,
    tick,
    events,
    setSpeed,
    toggle: () => setRunning((r) => !r),
    play: () => setRunning(true),
    pause: () => setRunning(false),
    reset,
  };
}
