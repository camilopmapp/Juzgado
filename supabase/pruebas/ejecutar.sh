#!/usr/bin/env bash
# Prueba la migración y sus políticas RLS en un Postgres 15+ vacío, sin Docker.
# Uso: supabase/pruebas/ejecutar.sh "postgresql://postgres@localhost:5432/postgres"
# Crea y borra la base temporal "copiloto_pruebas".
set -euo pipefail
URL="${1:?Falta la URL de conexión a Postgres}"
DIR="$(cd "$(dirname "$0")" && pwd)"
DB=copiloto_pruebas
psql "$URL" -q -c "drop database if exists $DB" -c "create database $DB"
psql "$URL" -q -v ON_ERROR_STOP=1 -c "\\connect $DB" -f "$DIR/simulacion_supabase.sql"
for f in "$DIR"/../migrations/*.sql; do psql "$URL" -q -v ON_ERROR_STOP=1 -c "\\connect $DB" -c "begin" -f "$f" -c "commit"; done
SALIDA="$(psql "$URL" -q -v ON_ERROR_STOP=1 -c "\\connect $DB" -f "$DIR/rls.sql" 2>&1)" || { echo "$SALIDA"; exit 1; }
echo "$SALIDA" | grep -oE '(OK|FALLA) .*' | sed 's/ (rechazado.*//'
psql "$URL" -q -c "drop database $DB"
echo "$SALIDA" | grep -q 'FIN2' && echo "Todas las pruebas pasaron."
