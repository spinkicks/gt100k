import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// The app lives in cabin/ (index.html + src). Tools live outside and drive it over HTTP on :5173.
export default defineConfig({
  root: "cabin",
  plugins: [react()],
  server: { port: 5177, strictPort: true },
  build: { outDir: "../dist", emptyOutDir: true },
});
