import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-vite-plugin";
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), TanStackRouterVite()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          tanstack: [
            "@tanstack/react-router",
            "@tanstack/react-query",
            "@tanstack/router-vite-plugin",
          ],
          recharts: ["recharts"],
          lucide: ["lucide-react"],
          tooltip: ["react-tooltip"],
          form: ["react-hook-form"],
        },
      },
    },
  },
});
