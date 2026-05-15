import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, "/");
          if (normalizedId.indexOf("/node_modules/") === -1) return undefined;
          if (normalizedId.indexOf("/node_modules/three/") >= 0) return "three";
          if (normalizedId.indexOf("/node_modules/katex/") >= 0) return "katex";
          if (normalizedId.indexOf("/node_modules/lucide-react/") >= 0) return "icons";
          if (
            normalizedId.indexOf("/node_modules/react/") >= 0 ||
            normalizedId.indexOf("/node_modules/react-dom/") >= 0
          ) {
            return "react";
          }
          return "vendor";
        },
      },
    },
  },
});
