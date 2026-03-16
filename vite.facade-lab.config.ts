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
  root: ".",
  build: {
    rollupOptions: {
      input: "src/facade-lab/index.html",
    },
  },
  server: {
    open: "/src/facade-lab/index.html",
  },
});
