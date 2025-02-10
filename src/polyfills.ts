// src/polyfills.ts
// Polyfill for process and process.cwd in the browser
if (typeof process === "undefined") {
  (window as any).process = {
    env: {},
    cwd: () => "",
  };
} else {
  // If process exists, ensure process.cwd is defined
  if (typeof process.cwd !== "function") {
    process.cwd = () => "";
  }
}
