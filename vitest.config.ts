import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Vitest is scoped to the pure business logic under `src/lib` — the deterministic,
 * framework-free core (ledger integrity, shipment costing, analytics, hashing,
 * formatters). Component/DOM behavior is covered by manual browser QA; unit tests
 * here protect the logic that the product's correctness claims depend on.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    globals: false,
    include: ["src/lib/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "src/lib/hash.ts",
        "src/lib/utils.ts",
        "src/lib/domain/**",
        "src/lib/analytics/**",
        "src/lib/ledger/**",
      ],
    },
  },
});
