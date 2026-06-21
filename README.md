# Wanderlust Trails — API Server

Express + TypeScript REST API powering the Wanderlust Trails travel experience marketplace. Serves the experience catalog (search, filter, sort, pagination) and two AI features backed by Google's free-tier Gemini API.

## Tech stack

- Node.js + Express
- TypeScript
- JSON file storage (`src/data/experiences.json`, `src/data/users.json`) — no database setup required
- bcryptjs + jsonwebtoken for password hashing and auth
- Google Gemini API (free tier) for the AI features

## Setup

```bash
npm install
cp .env.example .env
```

Open `.env` and set `GEMINI_API_KEY` to a free key from https://aistudio.google.com/app/apikey (no credit card required). The catalog endpoints work without a key; the two AI endpoints will return a 503 with a clear message until a key is set.

```bash
npm run dev
```

The API runs on `http://localhost:4000` by default.

## Endpoints

### Catalog

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/experiences` | List experiences. Query params: `search`, `category`, `minPrice`, `maxPrice`, `minRating`, `sort` (`rating-desc` \| `price-asc` \| `price-desc` \| `newest`), `page`, `limit` |
| GET | `/api/experiences/categories` | List of distinct categories |
| GET | `/api/experiences/:id` | Single experience with full detail, reviews, and related items |

### Auth

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Create an account. Body: `{ "name", "email", "password" }` (password min 8 chars). Self-registration always creates a `user`-role account. Returns `{ token, user }`. |
| POST | `/api/auth/login` | Body: `{ "email", "password" }`. Returns `{ token, user }`. |
| GET | `/api/auth/me` | Requires `Authorization: Bearer <token>`. Returns the current user. |

Auth uses JWTs (7-day expiry) signed with `JWT_SECRET`, and passwords are hashed with bcrypt — nothing is stored in plain text. Two demo accounts are auto-seeded into `src/data/users.json` the first time the server starts:

| Role | Email | Password |
|---|---|---|
| User | `demo.user@wanderlusttrails.example` | `DemoUser123!` |
| Admin | `demo.admin@wanderlusttrails.example` | `DemoAdmin123!` |

### AI features

| Method | Path | Description |
|---|---|---|
| POST | `/api/ai/recommend` | **AI Trip Concierge.** Body: `{ "prompt": "a relaxing beach trip under $300" }`. Returns 3 catalog matches with reasons. |
| POST | `/api/ai/highlight` | **AI Highlight Generator.** Body: `{ "experienceId": "patagonia-trekking", "interest": "photography" }` (`interest` optional). Returns a short personalized blurb. |

## Project structure

```
src/
  server.ts                App entry point
  types.ts                 Shared TypeScript types
  data/experiences.json     12-item seed catalog
  data/users.json            Auth users store (auto-seeded with demo accounts)
  routes/experiences.ts      Listing + details endpoints
  routes/ai.ts                AI concierge + highlight endpoints
  routes/auth.ts               Register / login / me endpoints
  middleware/auth.ts           JWT verification middleware
  lib/llm.ts                    Gemini API wrapper
  lib/auth.ts                    Password hashing, JWT signing, demo-account seeding
  lib/users-store.ts             JSON-file read/write helpers for users
  lib/demoAccounts.ts             Shared demo credential constants
```

## Notes

- Storage is a static JSON file — fine for this scope. To swap in MongoDB, replace the `experiencesData` import in `routes/experiences.ts` and `routes/ai.ts` with a Mongoose model query.
- CORS is restricted to `CLIENT_ORIGIN` (defaults to `http://localhost:3000`) — update this when deploying.
