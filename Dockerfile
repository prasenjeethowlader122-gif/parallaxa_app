FROM node:24-alpine AS deps
RUN apk add --no-cache git python3 make g++
RUN npm install -g pnpm
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY lib/db/package.json ./lib/db/
COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY artifacts/api-server/package.json ./artifacts/api-server/

RUN pnpm install --frozen-lockfile

# ── Build API ──────────────────────────────────────────────────────────────────
FROM deps AS api-builder

COPY lib/ ./lib/
COPY artifacts/api-server/ ./artifacts/api-server/

RUN pnpm --filter @workspace/api-server run build

# ── Production image ───────────────────────────────────────────────────────────
# The Expo web app is pre-built locally:
#   pnpm --filter @workspace/social-app exec expo export --platform web --output-dir web-export
# Commit artifacts/social-app/web-export/ — Docker copies the static files directly.
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

# Pre-built Expo web → served as static files by Express
COPY artifacts/social-app/web-export ./artifacts/api-server/public

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", "--enable-source-maps", "./artifacts/api-server/dist/index.mjs"]
