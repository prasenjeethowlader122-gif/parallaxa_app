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
COPY artifacts/social-app/package.json ./artifacts/social-app/

RUN pnpm install --frozen-lockfile

# ── Build Expo web ─────────────────────────────────────────────────────────────
FROM deps AS expo-builder

COPY lib/ ./lib/
COPY artifacts/social-app/ ./artifacts/social-app/

RUN pnpm --filter @workspace/social-app exec expo export --platform web --output-dir web-export

# ── Build API ──────────────────────────────────────────────────────────────────
FROM deps AS api-builder

COPY lib/ ./lib/
COPY artifacts/api-server/ ./artifacts/api-server/

RUN pnpm --filter @workspace/api-server run build

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

# Expo web built in CI → served as static files by Express
COPY --from=expo-builder /app/artifacts/social-app/web-export ./artifacts/api-server/public

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", "--enable-source-maps", "./artifacts/api-server/dist/index.mjs"]