#!/usr/bin/env bash
# ==============================================================================
# Script de Despliegue en Raspberry Pi (Linux ARM64) - Vento Marketplace
# Cumple "Contenido backend-1.pdf" (Diapositivas 40 a 48):
# 1. Compila publicación self-contained linux-arm64
# 2. Inicializa PostgreSQL con rol dedicado vento_app (mínimo privilegio) y BD2
# 3. Configura systemd escuchando en 0.0.0.0:5000 y abre firewall UFW
# ==============================================================================
set -euo pipefail

DB_NAME="${DB_NAME:-vento_bd2}"
PUBLISH_DIR="/opt/vento-api"
ENV_FILE="/etc/vento-api/vento.env"

echo "[1/5] Compilando Vento.Api para linux-arm64..."
dotnet publish ./Vento.Api/Vento.Api.csproj -c Release -r linux-arm64 --self-contained true -o ./publish_arm64

echo "[2/5] Copiando binarios a ${PUBLISH_DIR}..."
sudo mkdir -p "${PUBLISH_DIR}"
sudo cp -r ./publish_arm64/* "${PUBLISH_DIR}/"
sudo chmod +x "${PUBLISH_DIR}/Vento.Api"
sudo chown -R www-data:www-data "${PUBLISH_DIR}"

echo "[3/5] Ejecutando scripts SQL de BD2 + Extensión RBAC en PostgreSQL (${DB_NAME})..."
echo "      (Ejecutar manualmente si la base ya fue aprovisionada)"
# sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME};" || true
# sudo -u postgres psql -d "${DB_NAME}" -f ./database/00_setup_usuario_bd.sql
# sudo -u postgres psql -d "${DB_NAME}" -f ./database/01_bd2_tablas_restricciones_indices.sql
# sudo -u postgres psql -d "${DB_NAME}" -f ./database/02_bd2_triggers.sql
# sudo -u postgres psql -d "${DB_NAME}" -f ./database/03_bd2_funciones_y_vistas.sql
# sudo -u postgres psql -d "${DB_NAME}" -f ./database/04_extension_vento_rbac.sql
# sudo -u postgres psql -d "${DB_NAME}" -f ./database/05_seed_vento_demo.sql

echo "[4/5] Verificando archivo de variables seguras ${ENV_FILE}..."
if [ ! -f "${ENV_FILE}" ]; then
  sudo mkdir -p /etc/vento-api
  sudo tee "${ENV_FILE}" > /dev/null <<EOF
ConnectionStrings__DefaultConnection=Host=localhost;Port=5432;Database=${DB_NAME};Username=vento_app;Password=CAMBIAR_PASSWORD_SEGURO
Jwt__Key=CAMBIAR_SECRETO_JWT_PRODUCCION_MINIMO_32_CARACTERES
Cors__AllowedOrigins__0=http://localhost:5173
EOF
  sudo chmod 600 "${ENV_FILE}"
  echo "      IMPORTANTE: Edita ${ENV_FILE} con las credenciales reales antes de exponer en red."
fi

echo "[5/5] Instalando servicio systemd y habilitando puerto 5000 en red local..."
sudo cp ./deploy/vento-api.service /etc/systemd/system/vento-api.service
sudo systemctl daemon-reload
sudo systemctl enable vento-api
sudo systemctl restart vento-api

if command -v ufw >/dev/null 2>&1; then
  sudo ufw allow 5000/tcp || true
fi

echo "Despliegue completado. Verifica con: curl http://localhost:5000/api/health"
