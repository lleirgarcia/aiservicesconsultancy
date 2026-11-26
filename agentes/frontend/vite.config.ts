import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// Puertos de port-allocator: PORT = frontend (dev), API_PORT = backend.
const base = Number(process.env.BASE_PORT ?? 5520)
const port = Number(process.env.PORT ?? base)
const apiPort = Number(process.env.API_PORT ?? base + 1)

// Next sirve esta app bajo /agentes-app/ (rewrite hacia el backend). Ver ../README.md.
export default defineConfig({
  base: "/agentes-app/",
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  server: {
    port,
    strictPort: true,
    proxy: { "/api": { target: `http://127.0.0.1:${apiPort}`, changeOrigin: false } },
  },
})
