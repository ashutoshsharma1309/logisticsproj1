import { describe, it, expect } from "vitest";
import {
  cn,
  formatCurrency,
  formatCompact,
  formatPercent,
  truncateHash,
  clamp,
  initials,
} from "@/lib/utils";

describe("cn", () => {
  it("merges conflicting tailwind classes (last wins)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
  it("drops falsy values", () => {
    expect(cn("a", false && "b", undefined, "c")).toBe("a c");
  });
});

describe("formatCurrency", () => {
  it("formats in the given currency with no fraction digits by default", () => {
    expect(formatCurrency(1500, "USD")).toBe("$1,500");
  });
  it("respects a different currency", () => {
    // exact symbol placement varies by ICU, so assert the amount is present
    expect(formatCurrency(2600, "EUR")).toMatch(/2,600/);
  });
});

describe("formatCompact", () => {
  it("shortens large numbers", () => {
    expect(formatCompact(1500)).toBe("1.5K");
    expect(formatCompact(2_000_000)).toBe("2M");
  });
});

describe("formatPercent", () => {
  it("adds a sign and one decimal", () => {
    expect(formatPercent(12.4)).toBe("+12.4%");
    expect(formatPercent(-3.2)).toBe("-3.2%");
  });
});

describe("truncateHash", () => {
  it("keeps head and tail with an ellipsis", () => {
    const h = "0123456789abcdef0123456789abcdef";
    expect(truncateHash(h, 6, 4)).toBe("012345…cdef");
  });
  it("returns short strings unchanged", () => {
    expect(truncateHash("abcd", 6, 4)).toBe("abcd");
  });
});

describe("clamp", () => {
  it("bounds a value to a range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });
});

describe("initials", () => {
  it("takes up to two uppercase initials", () => {
    expect(initials("Alex Rivera")).toBe("AR");
    expect(initials("madonna")).toBe("M");
    expect(initials("Jean Luc Picard")).toBe("JL");
  });
});
