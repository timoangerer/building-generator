import type { FacadeGrammar } from "@/contracts";

/**
 * Mediterranean facade grammar — encodes the behavior of the original
 * hardcoded facade generator as a declarative grammar.
 *
 * Ground floor: entry door at center, primary windows elsewhere.
 * Middle floors: mostly primary windows, with accent windows or balcony doors.
 * Top floor (3+ floors): primary windows, occasional small square windows.
 */
export const mediterraneanGrammar: FacadeGrammar = {
  grammarId: "mediterranean",
  name: "Mediterranean",
  description: "Warm Mediterranean style with arched windows, shutters, and iron balconies",
  floorRules: [
    {
      match: "ground",
      bayPattern: [
        {
          position: "center",
          rules: [
            { slot: { kind: "by-id", elementId: "door-arched" }, weight: 1 },
            { slot: { kind: "by-id", elementId: "door-paneled" }, weight: 1 },
          ],
        },
        {
          position: "all",
          rules: [
            { slot: { kind: "by-id", elementId: "window-tall" }, weight: 1 },
            { slot: { kind: "by-id", elementId: "window-shuttered" }, weight: 1 },
            { slot: { kind: "by-id", elementId: "window-arched" }, weight: 0.5 },
          ],
        },
      ],
    },
    {
      match: "top",
      bayPattern: [
        {
          position: "all",
          rules: [
            { slot: { kind: "by-id", elementId: "window-tall" }, weight: 1 },
            { slot: { kind: "by-id", elementId: "window-shuttered" }, weight: 0.8 },
            { slot: { kind: "by-id", elementId: "window-small-sq" }, weight: 0.3 },
          ],
        },
      ],
    },
    {
      match: "middle",
      bayPattern: [
        {
          position: "all",
          rules: [
            { slot: { kind: "by-id", elementId: "window-tall" }, weight: 1 },
            { slot: { kind: "by-id", elementId: "window-shuttered" }, weight: 0.8 },
            { slot: { kind: "by-id", elementId: "window-arch-shut" }, weight: 0.3 },
            { slot: { kind: "by-id", elementId: "balcony-door-iron" }, weight: 0.3 },
            { slot: { kind: "by-id", elementId: "balcony-door-stone" }, weight: 0.2 },
          ],
        },
      ],
    },
  ],
  defaultSlot: { kind: "by-id", elementId: "window-tall" },
};
