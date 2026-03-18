import { test, expect, type Page } from "@playwright/test";

const STAGES = [
  { stage: "plot", seeds: [1, 42, 123, 999], hasRenderer: true },
  { stage: "massing", seeds: [1, 42, 123, 999], hasRenderer: true },
  { stage: "element", seeds: [1, 42, 123, 999], hasRenderer: true },
  { stage: "facade", seeds: [1, 2, 3, 4, 5], hasRenderer: true },
  { stage: "building", seeds: [1, 42, 123, 999], hasRenderer: true },
  { stage: "pipeline", seeds: [1, 42, 123, 999], hasRenderer: true },
];

// WebGL/WebGPU context warnings from headless Chromium are infrastructure noise
const IGNORED_ERROR_PATTERNS = [
  /WebGL context could not be created/,
  /Error creating WebGL context/,
  /WebGPU/i,
  /Failed to mount tool renderer/,
];

function isIgnoredError(msg: string): boolean {
  return IGNORED_ERROR_PATTERNS.some((p) => p.test(msg));
}

type WorkbenchState = {
  stage: string;
  seed: number;
  config: unknown;
  result: unknown;
  invariants: Array<{ name: string; passed: boolean }>;
};

async function loadFixture(page: Page, stage: string, seed: number) {
  await page.getByTestId(`seed-${stage}-${seed}`).click();
  await page.waitForFunction(
    ([s, sd]) => {
      const state = (window as unknown as Record<string, unknown>)
        .__workbenchState as WorkbenchState | undefined;
      return state?.stage === s && state?.seed === sd;
    },
    [stage, seed] as const,
    { timeout: 10_000 },
  );
}

async function getWorkbenchState(page: Page): Promise<WorkbenchState> {
  return page.evaluate(
    () =>
      (window as unknown as Record<string, unknown>)
        .__workbenchState as WorkbenchState,
  );
}

for (const { stage, seeds, hasRenderer } of STAGES) {
  test.describe(`${stage} stage`, () => {
    for (const seed of seeds) {
      test.describe(`seed ${seed}`, () => {
        let consoleErrors: string[];

        test.beforeEach(async ({ page }) => {
          consoleErrors = [];
          page.on("pageerror", (err) => {
            consoleErrors.push(err.message);
          });
          page.on("console", (msg) => {
            if (msg.type() === "error" && !isIgnoredError(msg.text())) {
              consoleErrors.push(msg.text());
            }
          });
          await page.goto("/src/workbench/index.html");
          await page.waitForSelector('[data-testid="workbench-empty"]');
          await loadFixture(page, stage, seed);
        });

        test("loads without console errors", async () => {
          expect(consoleErrors).toEqual([]);
        });

        if (hasRenderer) {
          test("canvas appears in viewport", async ({ page }) => {
            const canvas = page.getByTestId("workbench-viewport").locator("canvas");
            await expect(canvas).toBeVisible({ timeout: 5_000 });
          });
        }

        test("workbench state is populated correctly", async ({ page }) => {
          const state = await getWorkbenchState(page);
          expect(state.stage).toBe(stage);
          expect(state.seed).toBe(seed);
          expect(state.config).toBeTruthy();
          expect(state.result).toBeTruthy();
          expect(state.invariants.length).toBeGreaterThan(0);
        });

        test("all invariants pass", async ({ page }) => {
          const state = await getWorkbenchState(page);
          const failed = state.invariants.filter((inv) => !inv.passed);
          if (failed.length > 0) {
            const names = failed.map((f) => f.name).join(", ");
            throw new Error(`Failed invariants: ${names}`);
          }
        });
      });
    }
  });
}

// Environment tool section — verifies the env lab integration into the workbench.
// WebGPU may not be available in headless CI, so we test that the section
// appears and clicking it does not produce unexpected errors.
test.describe("environment tool section", () => {
  test("env presets appear in sidebar", async ({ page }) => {
    await page.goto("/src/workbench/index.html");
    await page.waitForSelector('[data-testid="workbench-empty"]');

    const envItem = page.getByTestId("tool-environment-Backdrop Ocean");
    await expect(envItem).toBeVisible({ timeout: 5_000 });
  });

  test("clicking env preset does not crash", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => {
      if (!isIgnoredError(err.message)) errors.push(err.message);
    });
    page.on("console", (msg) => {
      if (msg.type() === "error" && !isIgnoredError(msg.text())) {
        errors.push(msg.text());
      }
    });

    await page.goto("/src/workbench/index.html");
    await page.waitForSelector('[data-testid="workbench-empty"]');

    await page.getByTestId("tool-environment-Backdrop Ocean").click();
    await page.waitForTimeout(1_000);

    expect(errors).toEqual([]);
  });

  test("switching from fixture to env and back", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => {
      if (!isIgnoredError(err.message)) errors.push(err.message);
    });
    page.on("console", (msg) => {
      if (msg.type() === "error" && !isIgnoredError(msg.text())) {
        errors.push(msg.text());
      }
    });

    await page.goto("/src/workbench/index.html");
    await page.waitForSelector('[data-testid="workbench-empty"]');

    // Load a fixture first
    await loadFixture(page, "plot", 1);
    await page.waitForTimeout(200);

    // Switch to env tool
    await page.getByTestId("tool-environment-Backdrop Ocean").click();
    await page.waitForTimeout(500);

    // Switch back to a fixture
    await loadFixture(page, "massing", 1);
    await page.waitForTimeout(200);

    expect(errors).toEqual([]);

    const state = await getWorkbenchState(page);
    expect(state.stage).toBe("massing");
  });
});

// Test switching between stages — catches effect ordering bugs where
// the renderer gets a result from the wrong stage type.
test.describe("stage switching", () => {
  const TRANSITIONS = [
    { from: { stage: "plot", seed: 1 }, to: { stage: "massing", seed: 1 } },
    { from: { stage: "element", seed: 1 }, to: { stage: "facade", seed: 1 } },
    { from: { stage: "massing", seed: 42 }, to: { stage: "pipeline", seed: 1 } },
    { from: { stage: "facade", seed: 1 }, to: { stage: "plot", seed: 42 } },
  ];

  for (const { from, to } of TRANSITIONS) {
    test(`${from.stage} → ${to.stage} without errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (err) => errors.push(err.message));
      page.on("console", (msg) => {
        if (msg.type() === "error" && !isIgnoredError(msg.text())) {
          errors.push(msg.text());
        }
      });

      await page.goto("/src/workbench/index.html");
      await page.waitForSelector('[data-testid="workbench-empty"]');

      await loadFixture(page, from.stage, from.seed);
      // Small delay to let React effects settle
      await page.waitForTimeout(200);

      await loadFixture(page, to.stage, to.seed);
      await page.waitForTimeout(200);

      expect(errors).toEqual([]);

      const canvas = page.getByTestId("workbench-viewport").locator("canvas");
      await expect(canvas).toBeVisible({ timeout: 5_000 });

      const state = await getWorkbenchState(page);
      expect(state.stage).toBe(to.stage);
      expect(state.seed).toBe(to.seed);
    });
  }
});
