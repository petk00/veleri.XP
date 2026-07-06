#!/usr/bin/env bash
# ============================================================
# reset_demo.sh — vraća bazu i uploads/ na demo stanje
# za prezentaciju (npr. nakon što e2e testovi napune bazu).
#
# Pokretanje:  ./db/reset_demo.sh
# Koristi kredencijale iz server/.env (DB_HOST/USER/PASSWORD/NAME).
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Učitaj DB kredencijale iz server/.env
set -a
# shellcheck disable=SC1091
source "$ROOT/server/.env"
set +a

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-root}"
DB_NAME="${DB_NAME:-XP}"
export MYSQL_PWD="${DB_PASSWORD:-}"

echo "→ Učitavam demo seed u bazu '$DB_NAME'..."
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" "$DB_NAME" < "$ROOT/db/03_demo_seed.sql"

echo "→ Čistim server/uploads/attachments i kopiram demo priloge..."
UPLOADS="${UPLOADS_DIR:-$ROOT/server/uploads}"
rm -rf "$UPLOADS/attachments"
mkdir -p "$UPLOADS"
cp -R "$ROOT/db/demo_files/attachments" "$UPLOADS/attachments"

echo "✓ Demo stanje vraćeno: 14 zahtjeva, 4 korisnika, 6 odjela, 6 kategorija, 10 priloga."
