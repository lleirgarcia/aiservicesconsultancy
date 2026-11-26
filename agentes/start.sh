#!/usr/bin/env bash
# Backend de la demo de agentes de Kroomix. Next lo sirve en /demos/agentes (rewrite /agentes-app → este puerto).
# Puertos de port-allocator del proyecto: Next = BASE_PORT, este backend = BASE_PORT+1.
#   ./start.sh            → construye el frontend, arranca el backend y abre la demo en Next
#   ./start.sh --no-open  → sin abrir el navegador
# Next debe estar arrancado aparte (`npm run dev` en la raíz de calculadora-ahorro).
set -euo pipefail
cd "$(dirname "$0")"

if command -v port-allocator >/dev/null 2>&1; then eval "$(port-allocator env)"; fi
NEXT_PORT="${BASE_PORT:-5520}"
PORT="${API_PORT:-$((NEXT_PORT+1))}"

command -v uv >/dev/null || { echo "Falta uv (https://docs.astral.sh/uv/)"; exit 1; }
command -v claude >/dev/null || echo "Aviso: no se encuentra el CLI «claude»; solo funcionará la reproducción grabada."

( cd backend && uv sync -q && { [ -f data/kroomix.db ] || uv run python -m app.seed.generate; } )
( cd frontend && { [ -d node_modules ] || npm install --silent; } && npm run build --silent >/dev/null )

# Credenciales de la bandeja de entrada (opcional): backend/.env, fuera de git. Ver backend/.env.example.
if [ -f backend/.env ]; then set -a; . backend/.env; set +a; fi

# Si se lanza desde dentro de una sesión de Claude Code, el agente debe arrancar como proceso independiente.
unset CLAUDECODE CLAUDE_CODE_ENTRYPOINT || true

URL="http://127.0.0.1:${NEXT_PORT}/demos/agentes"
echo "Kroomix · backend de agentes en :${PORT} · demo en ${URL}"
if [ "${1:-}" != "--no-open" ]; then (sleep 2 && open "$URL" >/dev/null 2>&1 || true) & fi
cd backend && exec uv run uvicorn app.api.main:app --host 127.0.0.1 --port "${PORT}" --log-level warning
