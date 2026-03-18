import React, { useState, useEffect, useRef, useCallback } from "react";
import { Leva, useControls, button } from "leva";
import { allFixtures } from "@/test-fixtures";
import type { GeneratorFixture } from "@/test-fixtures";
import type {
  RenderOptions,
  InvariantResult,
  WorkbenchState,
  WorkbenchSection,
  FixtureSection,
  ToolSection,
} from "./types";
import {
  getRenderer,
  getToolRenderer,
  EnvLabControls,
  type EnvRendererHandle,
  type EnvSceneApi,
  presets,
} from "@/viewers";
import type { ToolRenderer } from "./types";
import { Button } from "@/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/components/dialog";
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
} from "@/ui/components/sidebar";
import { TooltipProvider } from "@/ui/components/tooltip";

// Build sections from fixtures + tools
const fixtureSections: FixtureSection[] = allFixtures.map((fixture) => ({
  kind: "fixture",
  stage: fixture.stage,
  fixture,
}));

const envToolSection: ToolSection = {
  kind: "tool",
  id: "environment",
  label: "environment",
  items: presets.map((p) => ({ id: p.name, label: p.name })),
};

const allSections: WorkbenchSection[] = [...fixtureSections, envToolSection];

type Selection =
  | { kind: "fixture"; sectionIndex: number; itemIndex: number }
  | { kind: "tool"; sectionIndex: number; itemIndex: number };

export function WorkbenchShell() {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [invariantResults, setInvariantResults] = useState<InvariantResult[]>([]);
  const [generatedResult, setGeneratedResult] = useState<unknown>(null);
  const [envApi, setEnvApi] = useState<EnvSceneApi | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<ReturnType<typeof getRenderer> | null>(null);
  const toolRendererRef = useRef<ToolRenderer | null>(null);
  const resultRef = useRef<unknown>(null);

  const selectedSection = selection !== null ? allSections[selection.sectionIndex] : null;

  const isFixtureSelection = selection?.kind === "fixture" && selectedSection?.kind === "fixture";
  const isToolSelection = selection?.kind === "tool" && selectedSection?.kind === "tool";

  const selectedFixture = isFixtureSelection ? (selectedSection as FixtureSection).fixture : null;
  const selectedSeed = isFixtureSelection && selectedFixture
    ? selectedFixture.seeds[selection.itemIndex]
    : null;

  const selectedPresetName = isToolSelection
    ? (selectedSection as ToolSection).items[selection.itemIndex].id
    : presets[0].name;

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

    setGeneratedResult(result);
    setInvariantResults(results);

    const state: WorkbenchState = {
      stage: fixture.stage,
      seed,
      config,
      result,
      invariants: results,
    };
    (window as unknown as Record<string, unknown>).__workbenchState = state;

    return result;
  }, []);

  // Cleanup helper
  const disposeCurrentRenderer = useCallback(() => {
    if (rendererRef.current) {
      rendererRef.current.dispose();
      rendererRef.current = null;
    }
    if (toolRendererRef.current) {
      toolRendererRef.current.dispose();
      toolRendererRef.current = null;
      mountedToolRef.current = null;
      setEnvApi(null);
    }
  }, []);

  // Track which stage/tool is currently mounted so we can reuse the renderer
  // when only the seed or preset changes (avoids destroying/recreating WebGL contexts).
  const mountedStageRef = useRef<string | null>(null);
  const mountedToolRef = useRef<string | null>(null);

  // Mount fixture renderer (or update if same stage)
  useEffect(() => {
    if (!isFixtureSelection || !viewportRef.current || !selectedFixture || selectedSeed === null) {
      // Selection cleared or switched away from fixture — dispose
      if (rendererRef.current) {
        disposeCurrentRenderer();
        mountedStageRef.current = null;
      }
      return;
    }

    const result = runFixture(selectedFixture, selectedSeed);
    resultRef.current = result;

    // Same stage: reuse existing renderer, just swap scene content
    if (rendererRef.current && mountedStageRef.current === selectedFixture.stage) {
      rendererRef.current.update(result, renderOptions);
      return;
    }

    // Different stage (or first mount): full dispose + mount
    disposeCurrentRenderer();
    mountedStageRef.current = selectedFixture.stage;

    const renderer = getRenderer(selectedFixture.stage);
    if (renderer) {
      renderer.mount(viewportRef.current, result, renderOptions);
      rendererRef.current = renderer;
    }
  }, [selection, selectedFixture, selectedSeed, runFixture, isFixtureSelection, disposeCurrentRenderer]);

  // Mount tool renderer (reuse if same tool, only preset changed)
  useEffect(() => {
    if (!isToolSelection || !viewportRef.current || !selectedSection) return;
    const toolSection = selectedSection as ToolSection;

    // If the same tool is already mounted, skip remount — preset change
    // flows through the presetName prop to EnvLabControls
    if (mountedToolRef.current === toolSection.id) return;

    disposeCurrentRenderer();
    mountedStageRef.current = null;
    setInvariantResults([]);
    setGeneratedResult(null);

    mountedToolRef.current = toolSection.id;

    const toolRenderer = getToolRenderer(toolSection.id);
    if (toolRenderer) {
      toolRendererRef.current = toolRenderer;
      toolRenderer.mount(viewportRef.current).then(() => {
        const envHandle = toolRenderer as EnvRendererHandle;
        if (typeof envHandle.getApi === "function") {
          setEnvApi(envHandle.getApi());
        }
      }).catch((err) => {
        console.error(`Failed to mount tool renderer "${toolSection.id}":`, err);
      });
    }

    return () => {
      disposeCurrentRenderer();
      mountedToolRef.current = null;
    };
  }, [selection, isToolSelection, selectedSection, disposeCurrentRenderer]);

  // Dispose on unmount
  useEffect(() => {
    return () => { disposeCurrentRenderer(); };
  }, [disposeCurrentRenderer]);

  // Update fixture renderer on option changes
  useEffect(() => {
    if (rendererRef.current && resultRef.current) {
      rendererRef.current.update(resultRef.current, renderOptions);
    }
  }, [renderOptions]);

  const handleSeedStep = (delta: number) => {
    if (!selection || selection.kind !== "fixture" || !selectedFixture) return;
    const newIndex = selection.itemIndex + delta;
    if (newIndex >= 0 && newIndex < selectedFixture.seeds.length) {
      setSelection({ ...selection, itemIndex: newIndex });
    }
  };

  const passedCount = invariantResults.filter((r) => r.passed).length;

  // Build sidebar label for current selection
  const selectionLabel = (() => {
    if (!selection || !selectedSection) return "No selection";
    if (selection.kind === "fixture" && selectedSection.kind === "fixture") {
      const fixture = selectedSection.fixture;
      return `${fixture.stage} / ${fixture.labels?.[selection.itemIndex] ?? `seed ${selectedSeed}`}`;
    }
    if (selection.kind === "tool" && selectedSection.kind === "tool") {
      return `${selectedSection.label} / ${selectedSection.items[selection.itemIndex].label}`;
    }
    return "No selection";
  })();

  return (
    <TooltipProvider>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <span className="text-sm font-semibold">Generator Workbench</span>
          </SidebarHeader>
          <SidebarContent>
            {allSections.map((section, si) => {
              if (section.kind === "fixture") {
                const fixture = section.fixture;
                return (
                  <SidebarGroup key={section.stage}>
                    <SidebarGroupLabel>{section.stage}</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {fixture.seeds.map((seed, ii) => {
                          const isSelected = selection?.sectionIndex === si && selection?.itemIndex === ii;
                          const label = fixture.labels?.[ii] ?? `seed ${seed}`;
                          return (
                            <SidebarMenuItem key={seed}>
                              <SidebarMenuButton
                                isActive={isSelected}
                                data-testid={`seed-${fixture.stage}-${seed}`}
                                onClick={() => setSelection({ kind: "fixture", sectionIndex: si, itemIndex: ii })}
                              >
                                {label}
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        })}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                );
              }

              // Tool section
              return (
                <SidebarGroup key={section.id}>
                  <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {section.items.map((item, ii) => {
                        const isSelected = selection?.sectionIndex === si && selection?.itemIndex === ii;
                        return (
                          <SidebarMenuItem key={item.id}>
                            <SidebarMenuButton
                              isActive={isSelected}
                              data-testid={`tool-${section.id}-${item.id}`}
                              onClick={() => setSelection({ kind: "tool", sectionIndex: si, itemIndex: ii })}
                            >
                              {item.label}
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              );
            })}
          </SidebarContent>
        </Sidebar>

        <SidebarInset>
          {/* Top bar */}
          <div className="flex items-center gap-2 px-3 py-2 border-b">
            <span className="text-sm text-muted-foreground">
              {selectionLabel}
            </span>
            <div className="flex-1" />
            {isFixtureSelection && invariantResults.length > 0 && (
              <Dialog>
                <DialogTrigger render={<Button variant="outline" size="sm" />}>
                  <span data-testid="workbench-invariants" className={
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
            <div className="absolute top-2 right-2 z-10 w-[300px] max-h-[calc(100%-1rem)] overflow-y-auto flex flex-col gap-1">
              <Leva fill collapsed={false} titleBar={{ title: "Controls" }} />
              {isToolSelection && <EnvLabControls key={selectedPresetName} api={envApi} presetName={selectedPresetName} />}
            </div>
            <div ref={viewportRef} className="absolute inset-0 z-0" data-testid="workbench-viewport" />
            {!selection && (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground" data-testid="workbench-empty">
                Select an item from the sidebar
              </div>
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
