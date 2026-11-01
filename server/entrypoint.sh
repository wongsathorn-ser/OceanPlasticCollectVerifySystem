#!/usr/bin/env sh
# Starts FastAPI in dev (auto-reload) or prod mode - from the Render lab.
# Render injects $PORT; locally we default to 5000 (compose maps 34242:5000).
set -e

echo "APP_ENV=$APP_ENV"

if [ "$APP_ENV" = "dev" ]; then
  echo "Starting FastAPI dev server..."
  exec fastapi dev app/main.py --host 0.0.0.0 --port "${PORT:-5000}"
else
  echo "Starting FastAPI (prod)..."
  exec fastapi run app/main.py --host 0.0.0.0 --port "${PORT:-5000}"
fi
