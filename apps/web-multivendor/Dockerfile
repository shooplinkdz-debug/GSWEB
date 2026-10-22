# Multi-stage Dockerfile for WebManager Vendor Portal
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared ./packages/shared
COPY apps/web-multivendor ./apps/web-multivendor

RUN npm install -g pnpm && pnpm install --frozen-lockfile
RUN pnpm --filter @web-manager/shared build
RUN pnpm --filter @web-manager/web-multivendor build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3002

COPY --chown=node:node --from=builder /app/apps/web-multivendor/.output ./
USER node

EXPOSE 3002
CMD ["node", "server/index.mjs"]
