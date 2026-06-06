#!/bin/sh
set -e

# Run pending database migrations before starting the server.
# Safe to run on every boot — already-applied migrations are skipped.
echo "→ Running database migrations..."
node ace migration:run --force

echo "→ Starting application..."
exec "$@"
