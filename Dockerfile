FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY app/package.json app/package-lock.json ./
RUN npm ci
COPY app/ ./
RUN npm run build

FROM node:20-alpine AS backend
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=backend /app/server/dist ./server/dist
COPY --from=backend /app/server/node_modules ./server/node_modules
COPY --from=backend /app/server/package.json ./server/package.json
COPY --from=backend /app/server/drizzle.config.ts ./server/drizzle.config.ts
COPY --from=backend /app/server/drizzle ./server/drizzle
COPY --from=backend /app/server/src/db/schema ./server/src/db/schema
COPY --from=frontend /app/frontend/dist ./app/dist

ENV NODE_ENV=production
ENV PORT=3200
EXPOSE 3200

WORKDIR /app/server
CMD ["sh", "-c", "npx drizzle-kit push --force && node dist/index.js"]
