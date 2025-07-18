import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: "../frontend",
  build: {
    outDir: "../backend/frontend/dist",
    emptyOutDir: true,
  },
});
