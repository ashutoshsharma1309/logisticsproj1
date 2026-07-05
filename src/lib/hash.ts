/**
 * Deterministic, dependency-free hashing utilities used by the
 * "Blockchain Simulation Mode" ledger. These are NOT cryptographic —
 * they exist to produce stable, realistic-looking digests for the
 * decentralized simulation without pulling in Node crypto (keeps the
 * bundle edge/Vercel friendly and identical across server & client).
 */

/** FNV-1a 64-bit style hash rendered as a 64-char hex string. */
export function simHash(input: string): string {
  // Two interleaved 32-bit FNV-1a accumulators give us 64 hex chars.
  let h1 = 0x811c9dc5;
  let h2 = 0x1000193;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= (c << 3) | (c >>> 5);
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  const block = (n: number): string =>
    (n >>> 0).toString(16).padStart(8, "0");
  // Expand to 64 chars by chaining derived words deterministically.
  let out = "";
  let a = h1 >>> 0;
  let b = h2 >>> 0;
  for (let i = 0; i < 8; i++) {
    a = (Math.imul(a ^ (b >>> 2), 0x27d4eb2f) + 0x165667b1) >>> 0;
    b = (Math.imul(b ^ (a >>> 3), 0x9e3779b1) + 0x85ebca77) >>> 0;
    out += block(a ^ b);
  }
  return out.slice(0, 64);
}

/** Produce a short simulated digital signature (like an ECDSA fragment). */
export function simSignature(input: string): string {
  const h = simHash(`sig::${input}`);
  return `0x${h.slice(0, 16)}${h.slice(40, 56)}`;
}

/** Deterministic seeded PRNG (mulberry32). Stable across SSR/CSR. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Turn a string into a stable numeric seed. */
export function stringToSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
