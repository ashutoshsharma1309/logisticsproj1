import { describe, it, expect } from "vitest";
import { verifyChain } from "@/lib/ledger/mint";
import { simHash } from "@/lib/hash";
import type { LedgerBlock } from "@/lib/db/types";
import type { ShipmentStatus } from "@/types";

const ZERO = "0".repeat(64);

/** Build a valid, correctly hash-chained ledger exactly as `verifyChain` expects. */
function buildChain(n: number): LedgerBlock[] {
  const blocks: LedgerBlock[] = [];
  let previousHash = ZERO;
  for (let i = 1; i <= n; i++) {
    const shipmentRef = `CR-10000${i}`;
    const status: ShipmentStatus = "in_transit";
    const location = `Hub ${i}`;
    const timestamp = `2026-07-05T10:0${i}:00.000Z`;
    const nonce = 1000 + i;
    const payload = `${shipmentRef}|${status}|${location}|${timestamp}|${nonce}|${previousHash}`;
    const hash = simHash(payload);
    blocks.push({
      id: `blk_${i}`,
      orgId: "org_1",
      blockIndex: i,
      shipmentId: `shp_${i}`,
      shipmentRef,
      status,
      action: "Departed origin",
      location,
      node: "node-alpha-01",
      verifier: "Validator-Primary",
      hash,
      previousHash,
      signature: "0x0",
      integrityScore: 100,
      nonce,
      timestamp,
    });
    previousHash = hash;
  }
  return blocks;
}

describe("verifyChain", () => {
  it("accepts an empty ledger", () => {
    expect(verifyChain([])).toEqual({ valid: true, brokenAt: null });
  });

  it("accepts a single genesis block", () => {
    expect(verifyChain(buildChain(1))).toEqual({ valid: true, brokenAt: null });
  });

  it("accepts a well-formed multi-block chain", () => {
    expect(verifyChain(buildChain(5))).toEqual({ valid: true, brokenAt: null });
  });

  it("verifies regardless of array order (sorts by blockIndex)", () => {
    const reversed = [...buildChain(4)].reverse(); // newest-first, as stored
    expect(verifyChain(reversed)).toEqual({ valid: true, brokenAt: null });
  });

  it("detects a tampered field (location changed without re-hashing)", () => {
    const chain = buildChain(4);
    chain[2] = { ...chain[2]!, location: "TAMPERED" };
    expect(verifyChain(chain)).toEqual({ valid: false, brokenAt: 3 });
  });

  it("detects a broken previousHash link", () => {
    const chain = buildChain(4);
    chain[1] = { ...chain[1]!, previousHash: ZERO };
    expect(verifyChain(chain)).toEqual({ valid: false, brokenAt: 2 });
  });

  it("detects a directly forged hash", () => {
    const chain = buildChain(3);
    chain[1] = { ...chain[1]!, hash: simHash("forged") };
    const result = verifyChain(chain);
    expect(result.valid).toBe(false);
    // the forged block itself fails hash recomputation
    expect(result.brokenAt).toBe(2);
  });

  it("detects a changed nonce", () => {
    const chain = buildChain(3);
    chain[0] = { ...chain[0]!, nonce: chain[0]!.nonce + 1 };
    expect(verifyChain(chain)).toEqual({ valid: false, brokenAt: 1 });
  });
});
