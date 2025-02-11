import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
// (Removed import of rollup-plugin-node-polyfills)

export default defineConfig(({ mode }) => {
  // Load environment variables for the current mode
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()], // (Browser polyfills plugin removed)
    define: {
      // Make environment variables available in client code
      "process.env.NAVI_DEX_AGGREGATOR_API_BASE_URL": JSON.stringify(
        env.VITE_AGGREGATOR_URL || ""
      ),
      "process.env.VITE_NETWORK": JSON.stringify(env.VITE_NETWORK || ""),
      ...Object.fromEntries(
        Object.entries(env).map(([key, val]) => [
          `process.env.${key}`,
          JSON.stringify(val),
        ])
      ),
    },
    optimizeDeps: {
      esbuildOptions: {
        define: {
          global: "globalThis",
          process: JSON.stringify({ env: {} }), // provide empty process.env for dev
        },
      },
    },
    build: {
      // Removed rollupOptions.plugins for node polyfills – no longer needed
      rollupOptions: {
        // (No custom Rollup plugins required)
      },
    },
  };
});
