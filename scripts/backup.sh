#!/usr/bin/env bash
# ============================================================
# backup.sh — backup produkcijske baze i uploadanih dokumenata
# iz Docker kontejnera (servisi: mysql, backend).
#
# Pokretanje iz korijena projekta:  ./scripts/backup.sh
#   BACKUP_DIR      — odredište (default ./backups)
#   RETENTION_DAYS  — koliko dana čuvati stare backupe (default 14)
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
STAMP="$(date +%F_%H%M)"

mkdir -p "$BACKUP_DIR"
cd "$ROOT"

echo "→ Dump baze XP..."
docker compose exec -T mysql sh -c 'exec mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" --single-transaction --routines XP' \
  | gzip > "$BACKUP_DIR/db_$STAMP.sql.gz"

echo "→ Arhiva uploadanih dokumenata..."
docker compose exec -T backend tar -czf - -C / app/uploads \
  > "$BACKUP_DIR/uploads_$STAMP.tar.gz"

echo "→ Brišem backupe starije od $RETENTION_DAYS dana..."
find "$BACKUP_DIR" -name 'db_*.sql.gz' -mtime "+$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -name 'uploads_*.tar.gz' -mtime "+$RETENTION_DAYS" -delete

echo "✓ Backup gotov: $BACKUP_DIR/db_$STAMP.sql.gz + uploads_$STAMP.tar.gz"
