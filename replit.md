# Pulse — Social Media Platform

A full-stack Instagram-inspired social media platform with a React Native / Expo mobile + web app, a REST API server, and a PostgreSQL database.

## Architecture

```
/
├── artifacts/
│   ├── api-server/          Express REST API (port 8080)
│   │   └── src/
│   │       ├── routes/      auth, users, posts, stories, comments, likes,
│   │       │                follows, notifications, messages, search, saved
│   │       ├── middleware/  authenticate.ts (JWT)
│   │       └── lib/         auth.ts (JWT + bcrypt), logger.ts
│   └── social-app/          Expo (iOS + Android + Web)
│       ├── app/
│       │   ├── (auth)/      login, register
│       │   ├── (tabs)/      index (feed), explore, create, notifications, profile
│       │   ├── post/        [id].tsx — post detail + comments
│       │   ├── profile/     [id].tsx — user profile
│       │   ├── messages/    index.tsx, [id].tsx — DMs
│       │   ├── edit-profile.tsx
│       │   └── settings.tsx
│       ├── components/      PostCard, StoryCircle, UserAvatar, EmptyState,
│       │                    NotificationItem, ConversationItem
│       ├── context/         AuthContext.tsx (JWT + AsyncStorage)
│       ├── hooks/           useColors.ts
│       └── constants/       colors.ts (light + dark theme)
├── lib/
│   ├── db/                  Drizzle ORM + schema (10 tables)
│   │   └── src/schema/      users, posts, hashtags, stories, comments,
│   │                        likes, follows, notifications, messages, saved
│   ├── api-spec/            OpenAPI YAML
│   ├── api-zod/             Zod schemas (generated)
│   └── api-client-react/    React Query hooks (generated)
├── Dockerfile               Multi-stage production build
└── docker-compose.yml       API + Postgres services
```

## Design

- **Brand name**: Pulse
- **Color palette**: Instagram-inspired
  - Primary: `#0095F6` (blue)
  - Accent: `#E91E8C` (pink)
  - Dark mode: supported
- **Font**: Inter (via expo-google-fonts)

## Database (PostgreSQL via Drizzle ORM)

Tables: `users`, `posts`, `hashtags`, `post_hashtags`, `stories`, `story_views`, `comments`, `likes`, `follows`, `notifications`, `conversations`, `messages`, `saved_posts`

Run migrations: `pnpm --filter @workspace/db run push`

## API

Base path: `/api`

Key endpoints:
- `POST /api/auth/register` — create account
- `POST /api/auth/login` — login, returns JWT
- `GET /api/auth/me` — current user (auth required)
- `GET /api/feed` — personalized feed (auth)
- `GET /api/explore` — trending posts (auth)
- `GET /api/stories` — stories from followed users (auth)
- `POST /api/posts` — create post (auth)
- `POST /api/posts/:id/like` / `DELETE` — like/unlike
- `POST /api/posts/:id/save` / `DELETE` — save/unsave
- `POST /api/users/:id/follow` / `DELETE` — follow/unfollow
- `GET /api/notifications` — notifications (auth)
- `GET /api/conversations` — DM list (auth)
- `GET /api/search?q=...` — search users/posts/hashtags

Auth: JWT Bearer token, 30-day expiry

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (auto-set by Replit)
- `JWT_SECRET` — JWT signing secret (defaults to dev value)
- `PORT` — server port (auto-set by Replit, defaults to 8080)
- `EXPO_PUBLIC_DOMAIN` — API base domain for Expo native app (set for EAS mobile builds only; web uses `window.location.origin` at runtime)

## Development

```bash
pnpm --filter @workspace/api-server run dev   # API server
pnpm --filter @workspace/social-app run dev   # Expo app

pnpm --filter @workspace/db run push          # Push schema changes
pnpm --filter @workspace/api-spec run codegen # Regenerate API client
```

## Docker / Render Deployment

The Expo web app is **pre-built locally** and committed to the repo. Docker never runs `expo export` — it just copies the static files.

### Workflow for every deploy

1. Make your code changes
2. Rebuild the web export (if frontend changed):
   ```bash
   pnpm --filter @workspace/social-app exec expo export --platform web --output-dir web-export
   ```
3. Commit `artifacts/social-app/web-export/` alongside your code changes
4. Push to GitHub → Render auto-deploys

### Environment variables needed on Render

| Variable | Value |
|---|---|
| `DATABASE_URL` | Render Postgres internal URL |
| `JWT_SECRET` | any long random string |
| `PORT` | `8080` |

### First deploy only — run DB migrations

Open the Render Shell and run:
```bash
pnpm --filter @workspace/db run push
```

### How the web app finds the API in production

The web app uses `window.location.origin` at runtime — no build-time domain needed.
All `/api/*` calls are relative to the same Render URL, so everything works automatically.
