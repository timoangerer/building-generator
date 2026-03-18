export type RenderOptions = {
  wireframe: boolean;
  colorMode: "role" | "element-type" | "building" | "flat";
  showBounds: boolean;
};

export type StageRenderer<T> = {
  mount(container: HTMLElement, result: T, options: RenderOptions): void;
  update(result: T, options: RenderOptions): void;
  dispose(): void;
};

export type ToolRenderer = {
  mount(container: HTMLElement): Promise<void>;
  dispose(): void;
};
