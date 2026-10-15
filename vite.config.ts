import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

// base relativa: funciona em qualquer subcaminho do GitHub Pages
export default defineConfig({
  base: "./",
  plugins: [react()],
  test: { include: ["src/**/*.test.ts"] },
})
