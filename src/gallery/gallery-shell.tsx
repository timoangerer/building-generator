import React, { useState, useEffect, useRef, useCallback } from "react";
import { Leva, useControls, button } from "leva";
import { allFixtures } from "@/test-fixtures";
import type { GeneratorFixture } from "@/test-fixtures";
import type { RenderOptions, InvariantResult, GalleryState } from "./types";
import { getRenderer } from "./renderers";

type Selection = {
  fixtureIndex: number;
  seedIndex: number;
};

export function GalleryShell() {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [invariantResults, setInvariantResults] = useState<InvariantResult[]>([]);
  const [generatedResult, setGeneratedResult] = useState<unknown>(null);
  const [generatedConfig, setGeneratedConfig] = useState<unknown>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<ReturnType<typeof getRenderer> | null>(null);
  const resultRef = useRef<unknown>(null);

  const selectedFixture = selection !== null ? allFixtures[selection.fixtureIndex] : null;
  const selectedSeed = selection !== null && selectedFixture
    ? selectedFixture.seeds[selection.seedIndex]
    : null;

  const { wireframe, colorMode, showBounds, showJson } = useControls("Display", {
    wireframe: false,
    colorMode: {
      options: {
        Role: "role" as const,
        "Element Type": "element-type" as const,
        Building: "building" as const,
        Flat: "flat" as const,
      },
      value: "role" as const,
    },
    showBounds: false,
    showJson: false,
  });

  const renderOptions: RenderOptions = { wireframe, colorMode, showBounds };

  useControls("Seed", () => ({
    info: {
      value: selectedSeed !== null ? `seed ${selectedSeed}` : "none",
      disabled: true,
      editable: false,
    },
    "< prev": button(() => handleSeedStep(-1)),
    "next >": button(() => handleSeedStep(1)),
  }), [selection, selectedFixture]);

  const runFixture = useCallback((fixture: GeneratorFixture<unknown, unknown>, seed: number) => {
    const config = fixture.configFactory(seed);
    const result = fixture.generator(config);

    const schemaResult = fixture.schema.safeParse(result);
    const results: InvariantResult[] = [
      {
        name: "validates against schema",
        passed: schemaResult.success,
      },
      ...fixture.invariants.map((inv) => ({
        name: inv.name,
        passed: inv.check(result),
      })),
    ];

    setGeneratedConfig(config);
    setGeneratedResult(result);
    setInvariantResults(results);

    const state: GalleryState = {
      stage: fixture.stage,
      seed,
      config,
      result,
      invariants: results,
    };
    (window as unknown as Record<string, unknown>).__galleryState = state;

    return result;
  }, []);

  useEffect(() => {
    if (!selection || !viewportRef.current || !selectedFixture || selectedSeed === null) return;

    const result = runFixture(selectedFixture, selectedSeed);
    resultRef.current = result;

    if (rendererRef.current) {
      rendererRef.current.dispose();
      rendererRef.current = null;
    }

    const renderer = getRenderer(selectedFixture.stage);
    if (renderer) {
      renderer.mount(viewportRef.current, result, renderOptions);
      rendererRef.current = renderer;
    }

    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
    };
  }, [selection, selectedFixture, selectedSeed, runFixture]);

  useEffect(() => {
    if (rendererRef.current && resultRef.current) {
      rendererRef.current.update(resultRef.current, renderOptions);
    }
  }, [renderOptions]);

  const handleSeedStep = (delta: number) => {
    if (!selection || !selectedFixture) return;
    const newIndex = selection.seedIndex + delta;
    if (newIndex >= 0 && newIndex < selectedFixture.seeds.length) {
      setSelection({ ...selection, seedIndex: newIndex });
    }
  };

  const passedCount = invariantResults.filter((r) => r.passed).length;

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-200">
      {/* Sidebar */}
      <div className="w-64 border-r border-zinc-800 overflow-y-auto flex-shrink-0">
        <div className="p-3 border-b border-zinc-800">
          <h1 className="text-sm font-semibold text-zinc-100">Generator Gallery</h1>
        </div>
        {allFixtures.map((fixture, fi) => (
          <div key={fixture.stage}>
            <div className="px-3 py-2 text-xs font-medium text-zinc-400 uppercase tracking-wider">
              {fixture.stage}
            </div>
            {fixture.seeds.map((seed, si) => {
              const isSelected = selection?.fixtureIndex === fi && selection?.seedIndex === si;
              return (
                <button
                  key={seed}
                  data-testid={`seed-${fixture.stage}-${seed}`}
                  className={`w-full text-left px-4 py-1.5 text-sm ${
                    isSelected
                      ? "bg-zinc-800 text-zinc-100"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                  }`}
                  onClick={() => setSelection({ fixtureIndex: fi, seedIndex: si })}
                >
                  seed {seed}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Viewport + Leva */}
        <div className="flex-1 flex min-h-0">
          <div className="flex-1 relative min-w-0">
            <Leva collapsed={false} titleBar={{ title: "Gallery" }} />
            <div ref={viewportRef} className="absolute inset-0" data-testid="gallery-viewport" />
            {!selection && (
              <div className="absolute inset-0 flex items-center justify-center text-zinc-600" data-testid="gallery-empty">
                Select a fixture from the sidebar
              </div>
            )}
          </div>

          {/* Right panel: invariants + JSON inspector */}
          {selection !== null && (
            <div className="w-72 border-l border-zinc-800 overflow-y-auto flex-shrink-0">
              <div className="p-3 border-b border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Invariants
                  </span>
                  <span data-testid="gallery-invariants" className={`text-xs font-medium ${
                    passedCount === invariantResults.length ? "text-green-400" : "text-red-400"
                  }`}>
                    {passedCount}/{invariantResults.length} passed
                  </span>
                </div>
                {invariantResults.map((inv) => (
                  <div key={inv.name} className="flex items-start gap-2 py-1">
                    <span className={`mt-0.5 text-xs ${inv.passed ? "text-green-400" : "text-red-400"}`}>
                      {inv.passed ? "✓" : "✗"}
                    </span>
                    <span className="text-xs text-zinc-300">{inv.name}</span>
                  </div>
                ))}
              </div>

              {showJson && generatedResult !== null && (
                <div className="p-3">
                  <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
                    Result JSON
                  </div>
                  <pre className="text-xs text-zinc-400 overflow-auto max-h-96 whitespace-pre-wrap break-all">
                    {JSON.stringify(generatedResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
