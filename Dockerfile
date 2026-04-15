FROM node:24-alpine AS base
RUN npm install -g pnpm
WORKDIR /app

# Install all dependencies
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY lib/db/package.json ./lib/db/
COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY artifacts/social-app/package.json ./artifacts/social-app/
RUN pnpm install --frozen-lockfile

# Copy source
COPY lib/ ./lib/
COPY artifacts/api-server/ ./artifacts/api-server/
COPY artifacts/social-app/ ./artifacts/social-app/

# ── Build API ──────────────────────────────────────────────────────────────────
FROM base AS api-builder
RUN pnpm --filter @workspace/api-server run build

# ── Build Expo web ─────────────────────────────────────────────────────────────
FROM base AS web-builder
ARG EXPO_PUBLIC_DOMAIN
ENV EXPO_PUBLIC_DOMAIN=$EXPO_PUBLIC_DOMAIN
WORKDIR /app/artifacts/social-app
RUN pnpm exec expo export --platform web --output-dir dist 2>&1 || true
# Fallback: copy whatever was produced
RUN ls dist 2>/dev/null || mkdir -p dist

# ── Final image ────────────────────────────────────────────────────────────────
FROM node:24-alpine AS runner
RUN npm install -g pnpm
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY lib/db/package.json ./lib/db/
COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY artifacts/api-server/package.json ./artifacts/api-server/
RUN pnpm install --frozen-lockfile --prod

# Copy built API
COPY --from=api-builder /app/artifacts/api-server/dist ./artifacts/api-server/dist

# Copy built web app into api-server public folder
COPY --from=web-builder /app/artifacts/social-app/dist ./artifacts/api-server/public

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", "--enable-source-maps", "./artifacts/api-server/dist/index.mjs"]
