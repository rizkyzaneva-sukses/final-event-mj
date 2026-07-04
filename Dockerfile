FROM node:22-slim AS base

RUN apt-get update && apt-get install -y curl openssl && rm -rf /var/lib/apt/lists/*

# Dependencies
FROM base AS deps
WORKDIR /app
ARG DATABASE_URL="postgresql://postgres:postgres@localhost:5432/muda_juara?schema=public"
ENV DATABASE_URL=$DATABASE_URL
COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma/
RUN npm ci

# Build
FROM base AS builder
WORKDIR /app
ARG DATABASE_URL="postgresql://postgres:postgres@localhost:5432/muda_juara?schema=public"
ENV DATABASE_URL=$DATABASE_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
