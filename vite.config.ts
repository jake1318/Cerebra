// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import rollupNodePolyfills from "rollup-plugin-node-polyfills";

export default defineConfig({
  plugins: [react()],
  define: {
    // Replace process.env with an empty object
    "process.env": {},
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        // Define global and process for esbuild as well
        global: "globalThis",
        process: "({ env: {} })",
      },
      // Include any Node polyfills if needed:
      plugins: [],
    },
  },
  build: {
    rollupOptions: {
      plugins: [
        // Use a Rollup plugin to polyfill Node built-ins, including process
        rollupNodePolyfills(),
      ],
    },
  },
});
