import { describe, it, expect } from "vitest";
import { generatePlans, optimize, type ObjectiveWeights } from "@/lib/optimize/plan";

const LANE = { distanceKm: 5000, weightKg: 8000 };
const even: ObjectiveWeights = { cost: 1, time: 1, co2: 1, reliability: 1 };

describe("generatePlans", () => {
  it("produces one plan per mode with sane relative ordering", () => {
    const plans = generatePlans(LANE);
    expect(plans.map((p) => p.mode).sort()).toEqual(["plane", "rail", "ship", "truck"]);
    const byMode = Object.fromEntries(plans.map((p) => [p.mode, p]));
    // Air is fastest, ocean is slowest
    expect(byMode.plane!.transitDays).toBeLessThan(byMode.ship!.transitDays);
    // Air is most expensive, ocean cheapest
    expect(byMode.plane!.costUsd).toBeGreaterThan(byMode.ship!.costUsd);
    // Ocean is greenest, air dirtiest
    expect(byMode.ship!.co2Kg).toBeLessThan(byMode.plane!.co2Kg);
  });
});

describe("optimize", () => {
  it("recommends the cheapest/greenest lane when cost+CO₂ dominate the weighting", () => {
    const r = optimize(LANE, { cost: 5, time: 0, co2: 5, reliability: 0 });
    expect(r.recommended!.mode).toBe("ship");
  });

  it("recommends air when speed is the only objective", () => {
    const r = optimize(LANE, { cost: 0, time: 1, co2: 0, reliability: 0 });
    expect(r.recommended!.mode).toBe("plane");
  });

  it("changes the recommendation as weights change (interactive frontier)", () => {
    const green = optimize(LANE, { cost: 0, time: 0, co2: 1, reliability: 0 }).recommended!.mode;
    const fast = optimize(LANE, { cost: 0, time: 1, co2: 0, reliability: 0 }).recommended!.mode;
    expect(green).not.toBe(fast);
  });

  it("flags Pareto-optimal plans on the frontier", () => {
    const r = optimize(LANE, even);
    const frontier = r.plans.filter((p) => p.onFrontier).map((p) => p.mode);
    // Air (fastest) and Ocean (cheapest+greenest) are never fully dominated.
    expect(frontier).toContain("plane");
    expect(frontier).toContain("ship");
  });

  it("scores every plan 0–100 and sorts by score desc", () => {
    const r = optimize(LANE, even);
    for (const p of r.plans) {
      expect(p.score).toBeGreaterThanOrEqual(0);
      expect(p.score).toBeLessThanOrEqual(100);
    }
    for (let i = 1; i < r.plans.length; i++) expect(r.plans[i - 1]!.score).toBeGreaterThanOrEqual(r.plans[i]!.score);
  });

  it("falls back to equal weights when all weights are zero", () => {
    const r = optimize(LANE, { cost: 0, time: 0, co2: 0, reliability: 0 });
    expect(r.recommended).not.toBeNull();
  });
});
