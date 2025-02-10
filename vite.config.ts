import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import rollupNodePolyfills from "rollup-plugin-node-polyfills";

export default defineConfig(({ mode }) => {
  // Load environment variables for the current mode (e.g. .env, .env.development)
  const env = loadEnv(mode, process.cwd(), ""); // '' to load all keys, including non-VITE_

  return {
    plugins: [react()],
    define: {
      // Provide process.env with our environment variables (as strings)
      "process.env.NAVI_DEX_AGGREGATOR_API_BASE_URL": JSON.stringify(
        env.VITE_AGGREGATOR_URL || ""
      ),
      "process.env.VITE_NETWORK": JSON.stringify(env.VITE_NETWORK || ""),
      // Spread all loaded env keys into process.env.* definitions.
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
          // Polyfill process for dependencies during dev bundling using a valid JSON value
          process: JSON.stringify({ env: {} }),
        },
      },
    },
    build: {
      rollupOptions: {
        plugins: [rollupNodePolyfills()], // Polyfill Node built-ins for production build
      },
    },
  };
});
