# Wanderlust Trails — API Server

Express + TypeScript REST API powering the Wanderlust Trails travel experience marketplace. Serves the experience catalog (search, filter, sort, pagination) and two AI features backed by Google's free-tier Gemini API.

## Tech stack

- Node.js + Express
- TypeScript
- JSON file storage (`src/data/experiences.json`) — no database setup required
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

### AI features

| Method | Path | Description |
|---|---|---|
| POST | `/api/ai/recommend` | **AI Trip Concierge.** Body: `{ "prompt": "a relaxing beach trip under $300" }`. Returns 3 catalog matches with reasons. |
| POST | `/api/ai/highlight` | **AI Highlight Generator.** Body: `{ "experienceId": "patagonia-trekking", "interest": "photography" }` (`interest` optional). Returns a short personalized blurb. |

## Project structure

```
src/
  server.ts            App entry point
  types.ts             Shared TypeScript types
  data/experiences.json  12-item seed catalog
  routes/experiences.ts  Listing + details endpoints
  routes/ai.ts            AI concierge + highlight endpoints
  lib/llm.ts               Gemini API wrapper
```

## Notes

- Storage is a static JSON file — fine for this scope. To swap in MongoDB, replace the `experiencesData` import in `routes/experiences.ts` and `routes/ai.ts` with a Mongoose model query.
- CORS is restricted to `CLIENT_ORIGIN` (defaults to `http://localhost:3000`) — update this when deploying.
