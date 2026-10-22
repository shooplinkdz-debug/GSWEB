# Multi-stage Dockerfile for WebManager Admin Nuxt Back-Office
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV HOST=0.0.0.0
ENV PORT=3001
ENV NODE_ENV=production
COPY --chown=node:node --from=builder /app/.output ./.output
USER node
EXPOSE 3001
CMD ["node", ".output/server/index.mjs"]
