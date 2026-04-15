FROM node:24-alpine AS base

RUN apk add --no-cache git python3 make g++
RUN npm install -g pnpm

WORKDIR /app

# Install all workspace dependencies
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY lib/db/package.json ./lib/db/
COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY artifacts/social-app/package.json ./artifacts/social-app/

RUN pnpm install --frozen-lockfile

# Copy all source
COPY lib/ ./lib/
COPY artifacts/api-server/ ./artifacts/api-server/
COPY artifacts/social-app/ ./artifacts/social-app/

# ── Build API ──────────────────────────────────────────────────────────────────
FROM base AS api-builder
RUN pnpm --filter @workspace/api-server run build

# ── Build Expo web ─────────────────────────────────────────────────────────────
# No EXPO_PUBLIC_DOMAIN needed at build time — the web app uses
# window.location.origin at runtime to call /api/* on the same host.
FROM base AS web-builder
RUN pnpm --filter @workspace/social-app exec expo export \
      --platform web \
      --output-dir dist

# ── Production image ───────────────────────────────────────────────────────────
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

COPY --from=api-builder /app/artifacts/api-server/dist ./artifacts/api-server/dist
COPY --from=web-builder /app/artifacts/social-app/dist ./artifacts/api-server/public

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", "--enable-source-maps", "./artifacts/api-server/dist/index.mjs"]
