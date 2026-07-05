"use client";

import { repo, makeId } from "@/lib/db/collections";
import { simHash, simSignature } from "@/lib/hash";
import type { LedgerBlock, Shipment } from "@/lib/db/types";
import type { ShipmentStatus } from "@/types";

const ZERO_HASH = "0".repeat(64);
const NODES = ["node-alpha-01", "node-beta-04", "node-gamma-07", "node-delta-02", "node-sigma-03"];
const VERIFIERS = ["Validator-Primary", "Validator-Secondary", "Validator-Regional"];

const STATUS_ACTION: Record<ShipmentStatus, string> = {
  pending: "Shipment registered",
  in_transit: "Departed origin",
  at_warehouse: "Arrived at hub",
  customs: "Customs clearance",
  out_for_delivery: "Out for delivery",
  delivered: "Delivery confirmed",
  delayed: "Delay recorded",
  exception: "Exception flagged",
};

/**
 * Mint a new simulated ledger block for a shipment event, chained to the org's
 * current ledger head. This is the real decentralized-simulation ledger — every
 * block derives from a shipment the user actually created.
 */
export function mintLedgerBlock(
  orgId: string,
  shipment: Shipment,
  status: ShipmentStatus,
  location: string,
): LedgerBlock {
  const ledger = repo<LedgerBlock>(orgId, "ledger");
  const existing = ledger.all(); // newest-first
  const head = existing[0];
  const previousHash = head ? head.hash : ZERO_HASH;
  const blockIndex = existing.length + 1;
  const timestamp = new Date().toISOString();
  const nonce = Math.abs(
    (blockIndex * 2654435761 + shipment.reference.length * 40503) % 999983,
  );
  const payload = `${shipment.reference}|${status}|${location}|${timestamp}|${nonce}|${previousHash}`;
  const hash = simHash(payload);

  const block: LedgerBlock = {
    id: makeId("blk"),
    orgId,
    blockIndex,
    shipmentId: shipment.id,
    shipmentRef: shipment.reference,
    status,
    action: STATUS_ACTION[status],
    location,
    node: NODES[blockIndex % NODES.length]!,
    verifier: VERIFIERS[blockIndex % VERIFIERS.length]!,
    hash,
    previousHash,
    signature: simSignature(payload),
    integrityScore: 100,
    nonce,
    timestamp,
  };
  ledger.insert(block);
  return block;
}

/** Recompute chain integrity — a real verification over stored blocks. */
export function verifyChain(blocks: LedgerBlock[]): {
  valid: boolean;
  brokenAt: number | null;
} {
  // blocks are newest-first; verify oldest→newest.
  const chrono = [...blocks].sort((a, b) => a.blockIndex - b.blockIndex);
  let previousHash = ZERO_HASH;
  for (const b of chrono) {
    const payload = `${b.shipmentRef}|${b.status}|${b.location}|${b.timestamp}|${b.nonce}|${previousHash}`;
    if (b.previousHash !== previousHash || simHash(payload) !== b.hash) {
      return { valid: false, brokenAt: b.blockIndex };
    }
    previousHash = b.hash;
  }
  return { valid: true, brokenAt: null };
}
