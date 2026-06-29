# Stage 1 — Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# VITE_* are compiled into the client bundle, so the prod API origin must be
# known at build time. Passed as build args by the deploy pipeline.
ARG VITE_API_URL
ARG VITE_WS_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
RUN npm run build

# Stage 2 — Production (Node SSR server, see server.prod.mjs)
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/server.prod.mjs ./
EXPOSE 3000
CMD ["node", "server.prod.mjs"]
