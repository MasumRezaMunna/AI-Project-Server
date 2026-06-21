# Wanderlust Trails

A small full-stack travel experience marketplace built with Next.js + TypeScript (client) and Express + TypeScript (server), featuring two AI-powered features backed by Google's free-tier Gemini API.

## Quick start

Two terminals:

```bash
# Terminal 1 — API server
cd server
npm install
cp .env.example .env   # then add your free GEMINI_API_KEY
npm run dev             # http://localhost:4000

# Terminal 2 — Next.js client
cd client
npm install
cp .env.local.example .env.local
npm run dev             # http://localhost:3000
```

Open http://localhost:3000.

## What this is

A curated catalog of 12 real-feeling travel experiences (Patagonia trekking, a Tuscany truffle hunt, a Galápagos cruise, and so on) with full search, filtering, sorting, and pagination, an experience details page with reviews and related trips, and two genuine AI features:

1. **AI Trip Concierge** — describe what you want in plain language; the model reads the live catalog and recommends matches with reasons.
2. **AI Highlight Generator** — generates a short, specific "why you'll love this" blurb for any experience, optionally tailored to a stated interest.

It also has real authentication — JWT-based with bcrypt-hashed passwords — with a login page, a registration page, and one-click demo logins:

| Role | Email | Password |
|---|---|---|
| User | `demo.user@wanderlusttrails.example` | `DemoUser123!` |
| Admin | `demo.admin@wanderlusttrails.example` | `DemoAdmin123!` |

See `server/README.md` and `client/README.md` for details on each half, including what was intentionally left out of scope (role-based dashboards) versus the full original spec.

## Requirements

- Node.js 18.18+
- A free Google Gemini API key (https://aistudio.google.com/app/apikey, no credit card required) to power the two AI features — the rest of the app works without one.
