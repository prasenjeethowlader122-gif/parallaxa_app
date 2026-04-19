FROM node:24 AS deps
RUN npm install -g pnpm
WORKDIR /app

COPY package.json pnpm-workspace.yaml ./
COPY lib/db/package.json ./lib/db/
COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY artifacts/social-app/package.json ./artifacts/social-app/

RUN pnpm install

# ── Build Expo web ─────────────────────────────────────────────────────────
FROM deps AS expo-builder

COPY lib/ ./lib/
COPY artifacts/social-app/ ./artifacts/social-app/

RUN pnpm --filter @workspace/social-app exec expo export --platform web --output-dir web-export

# ── Build API ───────────────────────────────────────────────────────────
FROM deps AS api-builder

COPY lib/ ./lib/
COPY artifacts/api-server/ ./artifacts/api-server/

RUN pnpm --filter @workspace/api-server run build

# ── Production image ────────────────────────────────────────────────────────
FROM node:24 AS runner
RUN npm install -g pnpm
WORKDIR /app

COPY package.json pnpm-workspace.yaml ./
COPY lib/db/package.json ./lib/db/
COPY lib/db/drizzle.config.ts ./lib/db/
COPY lib/db/src ./lib/db/src
COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY artifacts/api-server/package.json ./artifacts/api-server/

# Install all dependencies including dev dependencies needed for drizzle-kit
RUN pnpm install

COPY --from=api-builder /app/artifacts/api-server/dist ./artifacts/api-server/dist

# Expo web built in CI → served as static files by Express
COPY --from=expo-builder /app/artifacts/social-app/web-export ./artifacts/api-server/public

# Create migration entrypoint script
RUN echo '#!/bin/sh\n\
set -e\n\
\n\
echo "Wiping existing database schema..."\n\
# Assuming PostgreSQL: This drops the public schema and recreates it empty\n\
# You must have the DATABASE_URL environment variable available\n\
pnpm drizzle-kit exec --content "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" \n\
\n\
echo "Running database migrations..."\n\
pnpm --filter @workspace/db run push-force\n\
\n\
echo "Starting API server..."\n\
node --enable-source-maps ./artifacts/api-server/dist/index.mjs' > /app/start.sh && chmod +x /app/start.sh

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["/app/start.sh"]