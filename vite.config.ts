import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        workbench: "src/workbench/index.html",
        gallery: "src/gallery/index.html",
        "env-lab": "src/env-lab/index.html",
        "facade-lab": "src/facade-lab/index.html",
        "plot-lab": "src/plot-lab/index.html",
      },
    },
  },
});
