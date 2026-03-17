import React, { useState, useEffect, useRef, useCallback } from "react";
import { Leva, useControls, button } from "leva";
import { allFixtures } from "@/test-fixtures";
import type { GeneratorFixture } from "@/test-fixtures";
import type { RenderOptions, InvariantResult, GalleryState } from "./types";
import { getRenderer } from "./renderers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

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
    <TooltipProvider>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <span className="text-sm font-semibold">Generator Gallery</span>
          </SidebarHeader>
          <SidebarContent>
            {allFixtures.map((fixture, fi) => (
              <SidebarGroup key={fixture.stage}>
                <SidebarGroupLabel>{fixture.stage}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {fixture.seeds.map((seed, si) => {
                      const isSelected = selection?.fixtureIndex === fi && selection?.seedIndex === si;
                      const label = fixture.labels?.[si] ?? `seed ${seed}`;
                      return (
                        <SidebarMenuItem key={seed}>
                          <SidebarMenuButton
                            isActive={isSelected}
                            data-testid={`seed-${fixture.stage}-${seed}`}
                            onClick={() => setSelection({ fixtureIndex: fi, seedIndex: si })}
                          >
                            {label}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>
        </Sidebar>

        <SidebarInset>
          {/* Top bar */}
          <div className="flex items-center gap-2 px-3 py-2 border-b">
            <span className="text-sm text-muted-foreground">
              {selectedFixture && selection
                ? `${selectedFixture.stage} / ${selectedFixture.labels?.[selection.seedIndex] ?? `seed ${selectedSeed}`}`
                : "No selection"}
            </span>
            <div className="flex-1" />
            {selection !== null && (
              <Dialog>
                <DialogTrigger render={<Button variant="outline" size="sm" />}>
                  <span data-testid="gallery-invariants" className={
                    passedCount === invariantResults.length ? "text-green-400" : "text-red-400"
                  }>
                    {passedCount}/{invariantResults.length} passed
                  </span>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invariants & Result</DialogTitle>
                    <DialogDescription>
                      {selectedFixture?.stage} / seed {selectedSeed}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Invariants</h4>
                      {invariantResults.map((inv) => (
                        <div key={inv.name} className="flex items-start gap-2 py-1">
                          <span className={`mt-0.5 text-xs ${inv.passed ? "text-green-400" : "text-red-400"}`}>
                            {inv.passed ? "✓" : "✗"}
                          </span>
                          <span className="text-sm">{inv.name}</span>
                        </div>
                      ))}
                    </div>

                    {showJson && generatedResult !== null && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Result JSON</h4>
                        <pre className="text-xs text-muted-foreground overflow-auto max-h-96 whitespace-pre-wrap break-all rounded-md bg-muted p-3">
                          {JSON.stringify(generatedResult, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Viewport */}
          <div className="flex-1 relative min-h-0">
            <div className="absolute top-2 right-2 z-10 w-[300px]">
              <Leva fill collapsed={false} titleBar={{ title: "Controls" }} />
            </div>
            <div ref={viewportRef} className="absolute inset-0" data-testid="gallery-viewport" />
            {!selection && (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground" data-testid="gallery-empty">
                Select a fixture from the sidebar
              </div>
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
