import type { FacadeGrammar } from "@/contracts";

/**
 * Neoclassical facade grammar — symmetrical, ordered, with classical elements.
 *
 * Ground floor: rusticated base with arched entry at center.
 * Piano nobile (2nd floor): grand arched windows with balconies, pilasters at edges.
 * Upper floors: uniform rectangular windows.
 * Top floor / attic: small windows or oculus, with cornice placeholder.
 *
 * Uses placeholder elements for architectural features not yet in the element catalog.
 */
export const neoclassicalGrammar: FacadeGrammar = {
  grammarId: "neoclassical",
  name: "Neoclassical",
  description: "Symmetrical classical facade with rusticated base, piano nobile, and cornice",
  symmetry: "mirror",
  floorRules: [
    {
      match: "ground",
      bayPattern: [
        {
          position: "center",
          rules: [
            { slot: { kind: "by-id", elementId: "door-arched" } },
          ],
        },
        {
          position: "edges",
          rules: [
            { slot: { kind: "placeholder", label: "rusticated-panel", width: 2.0, height: 2.8 } },
          ],
        },
        {
          position: "all",
          rules: [
            { slot: { kind: "placeholder", label: "rusticated-window", width: 0.9, height: 1.4 } },
          ],
        },
      ],
    },
    {
      match: { index: 1 },
      bayPattern: [
        {
          position: "edges",
          rules: [
            { slot: { kind: "placeholder", label: "pilaster", width: 0.4, height: 2.8 } },
          ],
        },
        {
          position: "center",
          rules: [
            { slot: { kind: "by-id", elementId: "balcony-door-stone" } },
          ],
        },
        {
          position: "all",
          rules: [
            { slot: { kind: "by-id", elementId: "window-arched" }, weight: 1 },
            { slot: { kind: "by-id", elementId: "balcony-door-iron" }, weight: 0.4 },
          ],
        },
      ],
    },
    {
      match: "top",
      bayPattern: [
        {
          position: "edges",
          rules: [
            { slot: { kind: "placeholder", label: "pilaster", width: 0.4, height: 2.5 } },
          ],
        },
        {
          position: "center",
          rules: [
            { slot: { kind: "placeholder", label: "oculus", width: 0.8, height: 0.8 } },
          ],
        },
        {
          position: "all",
          rules: [
            { slot: { kind: "by-id", elementId: "window-small-sq" } },
          ],
        },
      ],
    },
    {
      match: "middle",
      bayPattern: [
        {
          position: "edges",
          rules: [
            { slot: { kind: "placeholder", label: "pilaster", width: 0.4, height: 2.8 } },
          ],
        },
        {
          position: "all",
          rules: [
            { slot: { kind: "by-id", elementId: "window-tall" } },
          ],
        },
      ],
    },
  ],
  defaultSlot: { kind: "by-id", elementId: "window-tall" },
};
