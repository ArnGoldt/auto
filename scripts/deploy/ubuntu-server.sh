#!/usr/bin/env bash
# Установка АвтоПортала на Ubuntu 24.04+ (VPS).
# Запуск: curl -fsSL ... | bash   или   bash ubuntu-server.sh
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/ArnGoldt/auto.git}"
APP_DIR="${APP_DIR:-$HOME/auto}"
APP_PORT="${APP_PORT:-43123}"
SERVICE_NAME="${SERVICE_NAME:-autoportal}"
NODE_MAJOR="${NODE_MAJOR:-20}"

DB_USER="${DB_USER:-auto}"
DB_NAME="${DB_NAME:-autoportal}"
DB_PASS="${DB_PASS:-$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)}"
SESSION_SECRET="${SESSION_SECRET:-$(openssl rand -hex 32)}"

need_sudo() {
  if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
    echo "sudo"
  fi
}

SUDO="$(need_sudo)"

echo "==> Пакеты системы (PostgreSQL, git, build tools)"
$SUDO apt-get update -qq
$SUDO DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
  ca-certificates curl git build-essential postgresql postgresql-contrib

echo "==> Node.js ${NODE_MAJOR}.x"
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt "$NODE_MAJOR" ]]; then
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | $SUDO -E bash -
  $SUDO DEBIAN_FRONTEND=noninteractive apt-get install -y -qq nodejs
fi
node -v
npm -v

echo "==> База PostgreSQL: пользователь ${DB_USER}, БД ${DB_NAME}"
if ! $SUDO -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1; then
  $SUDO -u postgres psql -v ON_ERROR_STOP=1 <<SQL
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';
CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
SQL
else
  echo "    (пользователь ${DB_USER} уже есть — пароль не меняем; проверьте DATABASE_URL в .env)"
  DB_PASS="${DB_PASS:-auto}"
fi

echo "==> Клонирование репозитория в ${APP_DIR}"
if [[ -d "${APP_DIR}/.git" ]]; then
  git -C "${APP_DIR}" pull --ff-only
else
  git clone "${REPO_URL}" "${APP_DIR}"
fi
cd "${APP_DIR}"

echo "==> Зависимости и сборка"
npm ci
if [[ ! -f .env ]]; then
  cat > .env <<ENV
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@127.0.0.1:5432/${DB_NAME}
SESSION_SECRET=${SESSION_SECRET}
UPLOAD_DIR=./uploads
ENV
  chmod 600 .env
  echo "    Создан .env (chmod 600)"
else
  echo "    .env уже есть — не перезаписываем"
fi

mkdir -p public/uploads

export NODE_ENV=production
npm run db:push
npm run db:seed
npm run build

UNIT_PATH="/etc/systemd/system/${SERVICE_NAME}.service"
echo "==> systemd: ${UNIT_PATH}"
$SUDO tee "${UNIT_PATH}" >/dev/null <<UNIT
[Unit]
Description=Autoportal (Next.js)
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=${USER}
WorkingDirectory=${APP_DIR}
Environment=NODE_ENV=production
EnvironmentFile=${APP_DIR}/.env
ExecStart=$(command -v npm) run start -- --hostname 0.0.0.0 --port ${APP_PORT}
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT

$SUDO systemctl daemon-reload
$SUDO systemctl enable --now "${SERVICE_NAME}"

echo ""
echo "=============================================="
echo " Готово."
echo " Приложение: http://$(hostname -I | awk '{print $1}'):${APP_PORT}/"
echo " Каталог:    ${APP_DIR}"
echo " Сервис:     sudo systemctl status ${SERVICE_NAME}"
echo " Логи:       journalctl -u ${SERVICE_NAME} -f"
echo ""
echo " Демо (пароль demo1234): manager@demo.local, master1@demo.local"
echo " DATABASE_URL (если новая БД): postgresql://${DB_USER}:****@127.0.0.1:5432/${DB_NAME}"
if [[ -f .env ]] && grep -q "postgresql://${DB_USER}:${DB_PASS}" .env 2>/dev/null; then
  echo " Пароль БД ${DB_USER}: ${DB_PASS}"
fi
echo "=============================================="
echo ""
echo " Откройте порт в файрволе (если включён ufw):"
echo "   sudo ufw allow ${APP_PORT}/tcp"
echo ""
