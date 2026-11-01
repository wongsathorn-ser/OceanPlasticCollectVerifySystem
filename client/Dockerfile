# Frontend image for LOCAL development with docker compose (Vite dev server).
# In production Render builds the static site itself (npm ci && npm run build),
# so this image is not deployed.
FROM node:22-bookworm-slim

WORKDIR /app

# Install dependencies first so this layer is reused when only source changes.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
