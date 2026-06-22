# Wanderlust Trails — API Server

Express + TypeScript REST API powering the Wanderlust Trails travel experience marketplace. Serves the experience catalog (search, filter, sort, pagination) and two AI features backed by Google's free-tier Gemini API. Auth is handled by Firebase Authentication + MongoDB.

## Tech stack

- Node.js + Express
- TypeScript
- JSON file storage for the catalog (`src/data/experiences.json`) — no database needed for that part
- **MongoDB** (via Mongoose) for user profiles
- **Firebase Authentication** (Admin SDK) for verifying signed-in users
- Google Gemini API (free tier) for the AI features

## How auth works here

Passwords never touch this server. The client signs users in directly against Firebase (email/password or Google), which issues a Firebase ID token — that token *is* a JWT. Every request to a protected endpoint sends that token as `Authorization: Bearer <token>`; this server verifies it with the Firebase Admin SDK, then looks up (or creates) a matching profile in MongoDB that stores the app-specific stuff Firebase doesn't know about, like `role`.

```
Client → Firebase Auth (sign in, get ID token)
Client → Express API, Authorization: Bearer <id token>
Express → Firebase Admin SDK (verify token) → MongoDB (load/create profile)
```

## Setup

### 1. Install dependencies

```bash
npm install
cp .env.example .env
```

### 2. MongoDB Atlas (free, no credit card)

1. Go to https://cloud.mongodb.com and create a free account.
2. Create a cluster on the **M0 (free)** tier.
3. Under **Security > Database Access**, add a database user with a password.
4. Under **Security > Network Access**, allow access from your IP (or `0.0.0.0/0` for an easy demo setup).
5. Click **Connect > Drivers**, copy the connection string, and paste it into `MONGODB_URI` in `.env`, replacing `<password>` with your database user's password.

### 3. Firebase Authentication (free Spark plan, no credit card)

1. Go to https://console.firebase.google.com and create a project.
2. Go to **Build > Authentication > Sign-in method** and enable **Email/Password** and **Google**.
3. Go to **Project settings (gear icon) > Service accounts > Generate new private key**. This downloads a JSON file.
4. From that file, copy `project_id`, `client_email`, and `private_key` into `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` in `.env` (keep the quotes around the private key — it contains literal `\n` sequences the SDK needs).
5. You'll also need a **client-side** Firebase config for the Next.js app — see `client/README.md`.

### 4. Gemini (free, no credit card)

Get a key at https://aistudio.google.com/app/apikey and set `GEMINI_API_KEY`. Optional — only the two AI endpoints need it, everything else works without it.

### 5. Seed the demo accounts

```bash
npm run seed:demo
```

This creates the two demo accounts (one regular user, one admin) in both Firebase and MongoDB, so the login page's demo buttons work immediately. Safe to re-run.

### 6. Run it

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
| POST | `/api/auth/register` | Requires `Authorization: Bearer <firebase-id-token>`. Body: `{ "name"? }`. Creates the MongoDB profile right after the client creates a Firebase account. Always creates a `user`-role profile. |
| GET | `/api/auth/me` | Requires `Authorization: Bearer <firebase-id-token>`. Returns the current user's profile, auto-creating one (role `user`) if it doesn't exist yet — covers Google sign-in, which never calls `/register`. |

Demo accounts (created by `npm run seed:demo`):

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
  data/experiences.json      12-item seed catalog
  routes/experiences.ts        Listing + details endpoints
  routes/ai.ts                  AI concierge + highlight endpoints
  routes/auth.ts                  Profile sync (/register) + /me endpoints
  middleware/auth.ts                Verifies Firebase ID tokens, loads the Mongo profile
  models/User.ts                     Mongoose User schema
  lib/llm.ts                          Gemini API wrapper
  lib/firebaseAdmin.ts                 Firebase Admin SDK init
  lib/db.ts                             MongoDB connection helper
  lib/demoAccounts.ts                    Shared demo credential constants
scripts/
  seedDemoUsers.ts          One-time script: npm run seed:demo
```

## Notes

- The experience catalog stays as a static JSON file — fine for this scope. Swap it for a Mongo collection the same way `models/User.ts` works, if you want everything in one database.
- CORS is restricted to `CLIENT_ORIGIN` (defaults to `http://localhost:3000`) — update this when deploying.
- The Firebase Admin SDK and MongoDB connection both log a warning (not a crash) at startup if their env vars are missing, so the catalog and AI endpoints keep working even before you've finished auth setup.
