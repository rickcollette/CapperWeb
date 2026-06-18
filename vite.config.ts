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
  server: {
    proxy: {
      "/api/v1": {
        target: "http://127.0.0.1:8687",
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("monaco-editor") || id.includes("@monaco-editor")) return "monaco";
          if (id.includes("@xterm")) return "xterm";
          if (id.includes("recharts") || id.includes("d3-") || id.includes("victory-")) return "charts";
          if (id.includes("react-dom") || id.includes("react-router") || id.includes("@tanstack")) return "vendor";
        },
      },
    },
  },
});
