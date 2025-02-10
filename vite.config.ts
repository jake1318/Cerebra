// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import rollupNodePolyfills from "rollup-plugin-node-polyfills";

export default defineConfig({
  plugins: [react()],
  define: {
    "process.env": {},
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
        process: "({ env: {} })",
      },
    },
  },
  build: {
    rollupOptions: {
      plugins: [rollupNodePolyfills()],
    },
  },
});
