# Plataforma de agentes (demo)

Copia de la demo de `../demos`: backend FastAPI + frontend Vite/React. Next la sirve en **`/demos/agentes`**.

- `frontend/` se construye con `base: "/agentes-app/"`; `src/lib/api.ts` (`withBase`) prefija todas las llamadas.
- `next.config.ts` reescribe `/agentes-app/:path*` → backend (`AGENTES_URL`, por defecto `http://127.0.0.1:BASE_PORT+1`).
- `src/app/demos/agentes/page.tsx` la incrusta en un iframe (`/agentes-app/index.html`).

Arranque local (dos procesos, desde `calculadora-ahorro/`):

```bash
PORT=$BASE_PORT npm run dev      # Next → http://localhost:$BASE_PORT/demos/agentes
./agentes/start.sh --no-open     # backend en BASE_PORT+1
```

Los agentes en vivo llaman al CLI `claude`: no funcionan en Vercel. Docs: `docs/` (API, specs, guion de venta).
