#!/usr/bin/env bash
# ==============================================================================
# Iniciador rápido multiplataforma (Linux / macOS / Git Bash / Raspberry Pi)
# Uso:
#   ./iniciar.sh                 -> Levanta Backend (:5000) + Frontend (:5173)
#   ./iniciar.sh frontend        -> Levanta solo Frontend (:5173)
#   ./iniciar.sh backend         -> Levanta solo Backend (:5000)
#   ./iniciar.sh api             -> Levanta ambos con VITE_API_URL=http://localhost:5000/api
# ==============================================================================
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODO="${1:-full}"
MODO_LOWER="$(echo "$MODO" | tr '[:upper:]' '[:lower:]')"

DOTNET_BIN="dotnet"
if ! command -v dotnet >/dev/null 2>&1 && [ -x "$HOME/.dotnet/dotnet" ]; then
  export DOTNET_ROOT="$HOME/.dotnet"
  export PATH="$DOTNET_ROOT:$PATH"
  DOTNET_BIN="$HOME/.dotnet/dotnet"
fi

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo ""
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null || true
  [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "============================================================"
echo "   VENTO MARKETPLACE (WYM) - INICIADOR DE ENTORNO LOCAL"
echo "============================================================"

if [ "$MODO_LOWER" = "full" ] || [ "$MODO_LOWER" = "backend" ] || [ "$MODO_LOWER" = "api" ]; then
  if [ ! -f "$REPO_ROOT/backend/Vento.Api/appsettings.Development.json" ] && [ -f "$REPO_ROOT/backend/Vento.Api/appsettings.Example.json" ]; then
    cp "$REPO_ROOT/backend/Vento.Api/appsettings.Example.json" "$REPO_ROOT/backend/Vento.Api/appsettings.Development.json"
  fi
  echo "[1/2] Iniciando Backend Vento.Api en http://localhost:5000 ..."
  (cd "$REPO_ROOT/backend" && "$DOTNET_BIN" run --project ./Vento.Api/Vento.Api.csproj --urls http://0.0.0.0:5000) &
  BACKEND_PID=$!
  sleep 3
fi

if [ "$MODO_LOWER" = "full" ] || [ "$MODO_LOWER" = "frontend" ] || [ "$MODO_LOWER" = "api" ]; then
  if [ ! -d "$REPO_ROOT/frontend/node_modules" ]; then
    echo "[INFO] Instalando dependencias npm en /frontend ..."
    (cd "$REPO_ROOT/frontend" && npm install)
  fi
  if [ "$MODO_LOWER" = "api" ]; then
    export VITE_API_URL="http://localhost:5000/api"
    echo "[INFO] VITE_API_URL=http://localhost:5000/api"
  fi
  echo "[2/2] Iniciando Frontend React + Vite en http://localhost:5173 ..."
  (cd "$REPO_ROOT/frontend" && npm run dev) &
  FRONTEND_PID=$!
fi

echo "------------------------------------------------------------"
echo " Presiona Ctrl + C para detener los servicios."
echo "------------------------------------------------------------"
wait
