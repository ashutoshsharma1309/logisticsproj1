import { describe, it, expect } from "vitest";
import { simHash, simSignature, seededRandom, stringToSeed } from "@/lib/hash";

describe("simHash", () => {
  it("produces a 64-char lowercase hex digest", () => {
    const h = simHash("CR-100001|pending|Rotterdam");
    expect(h).toHaveLength(64);
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic (same input -> same output) — required for SSR/CSR parity", () => {
    expect(simHash("hello world")).toBe(simHash("hello world"));
  });

  it("is sensitive to input changes (avalanche)", () => {
    expect(simHash("payload-a")).not.toBe(simHash("payload-b"));
    // a single-character change must change the digest
    expect(simHash("block-0000")).not.toBe(simHash("block-0001"));
  });

  it("handles empty input without throwing", () => {
    expect(simHash("")).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("simSignature", () => {
  it("returns a 0x-prefixed 32-hex-char signature", () => {
    const sig = simSignature("some-payload");
    expect(sig).toMatch(/^0x[0-9a-f]{32}$/);
  });

  it("is deterministic", () => {
    expect(simSignature("x")).toBe(simSignature("x"));
  });
});

describe("seededRandom (mulberry32)", () => {
  it("produces a reproducible sequence for a given seed", () => {
    const a = seededRandom(12345);
    const b = seededRandom(12345);
    const seqA = [a(), a(), a(), a()];
    const seqB = [b(), b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it("produces different sequences for different seeds", () => {
    const a = seededRandom(1);
    const b = seededRandom(2);
    expect(a()).not.toBe(b());
  });

  it("stays within [0, 1)", () => {
    const rnd = seededRandom(99);
    for (let i = 0; i < 1000; i++) {
      const v = rnd();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("stringToSeed", () => {
  it("is deterministic and returns a non-negative 32-bit integer", () => {
    const s = stringToSeed("Rotterdam Mega Hub");
    expect(s).toBe(stringToSeed("Rotterdam Mega Hub"));
    expect(Number.isInteger(s)).toBe(true);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(0xffffffff);
  });

  it("differs for different strings", () => {
    expect(stringToSeed("a")).not.toBe(stringToSeed("b"));
  });
});
