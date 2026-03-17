export { withinBounds, noOverlaps, isFiniteCoord } from "./geometry-checks";

// testGeneratorInvariants is intentionally NOT re-exported here.
// It imports vitest at module level, so re-exporting it would pull vitest
// into any browser bundle that touches @/test-utils (e.g., the gallery).
// Test files should import it directly:
//   import { testGeneratorInvariants } from "@/test-utils/generator-test-factory";
