#!/bin/sh
set -e

# ── Wait for PostgreSQL to be ready ──────────────────────────
if [ -n "$DATABASE_URL" ]; then
  DB_HOST=$(echo "$DATABASE_URL" | sed -e 's|.*@||' -e 's|/.*||' -e 's|:.*||')
  DB_PORT=$(echo "$DATABASE_URL" | sed -e 's|.*@||' -e 's|/.*||' -e 's|.*:||')
  DB_PORT=${DB_PORT:-5432}

  echo "Waiting for PostgreSQL at $DB_HOST:$DB_PORT ..."
  MAX_RETRIES=30
  COUNT=0
  until nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; do
    COUNT=$((COUNT + 1))
    if [ "$COUNT" -ge "$MAX_RETRIES" ]; then
      echo "WARNING: PostgreSQL not reachable after ${MAX_RETRIES} attempts. Starting anyway..."
      break
    fi
    echo "  [$COUNT/$MAX_RETRIES] Postgres not ready, retrying in 2s..."
    sleep 2
  done
  echo "PostgreSQL is up — starting Spring Boot"
fi

exec java \
  -XX:+UseContainerSupport \
  -XX:MaxRAMPercentage=75.0 \
  -jar /app/app.jar
