# Backend image - same pattern as the Docker lab and the Render lab.
# Used by docker compose (APP_ENV=dev, hot reload) and by Render (APP_ENV=prod).
FROM python:3.13-slim-bookworm

WORKDIR /app

# Install dependencies first so this layer is reused when only source changes.
# requirements.txt is exported from uv.lock (see server/README.md).
COPY requirements.txt .
RUN python -m pip install --no-cache-dir -r requirements.txt

# Copy the whole backend: PaaS platforms like Render have no bind mounts.
COPY . .
RUN chmod +x /app/entrypoint.sh

# Production by default; compose.yaml sets APP_ENV=dev.
ENV APP_ENV=prod
EXPOSE 5000

ENTRYPOINT ["/app/entrypoint.sh"]
