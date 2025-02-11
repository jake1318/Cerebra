import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Load environment variables (VITE_ and NAVI_ will be automatically exposed if prefixed)
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    // Remove custom Node polyfills since our API backend handles those functions.
    // Use Vite's standard env system (access via import.meta.env)
    envPrefix: ["VITE_", "NAVI_"],
    server: {
      // Proxy API requests in development to our backend server
      proxy: {
        "/api": {
          target: "http://localhost:3001",
          changeOrigin: true,
        },
      },
    },
    build: {
      // No additional Rollup plugins needed for Node polyfills
    },
  };
});
