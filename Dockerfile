FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY app/package.json app/package-lock.json ./
RUN npm ci
COPY app/ ./
RUN npm run build

FROM node:20-alpine AS backend
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci --include=dev
COPY server/ ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app

# Server compiled output + deps
COPY --from=backend /app/server/dist ./server/dist
COPY --from=backend /app/server/node_modules ./server/node_modules
COPY --from=backend /app/server/package.json ./server/package.json

# Migration SQL files
COPY --from=backend /app/server/drizzle ./server/drizzle

# Frontend built assets
COPY --from=frontend /app/frontend/dist ./app/dist

ENV NODE_ENV=production
ENV PORT=3200
EXPOSE 3200

WORKDIR /app/server
CMD ["sh", "-c", "node dist/db/migrate.js && node dist/db/seed-safe.js && node dist/index.js"]
