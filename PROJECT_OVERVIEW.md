# Wanderlust Trails

A small full-stack travel experience marketplace built with Next.js + TypeScript (client) and Express + TypeScript (server), featuring two AI-powered features backed by Google's free-tier Gemini API, and real authentication via Firebase + MongoDB.

## Quick start

### 1. One-time setup (free, no credit card)

- Create a free **MongoDB Atlas** M0 cluster: https://cloud.mongodb.com
- Create a free **Firebase** project with Email/Password + Google sign-in enabled: https://console.firebase.google.com
- Get a free **Gemini** API key: https://aistudio.google.com/app/apikey

Full step-by-step instructions are in `server/README.md`.

### 2. Run it

Two terminals:

```bash
# Terminal 1 — API server
cd server
npm install
cp .env.example .env   # fill in MongoDB, Firebase Admin, and Gemini credentials
npm run seed:demo       # creates the two demo accounts (one-time)
npm run dev              # http://localhost:4000

# Terminal 2 — Next.js client
cd client
npm install
cp .env.local.example .env.local   # fill in your Firebase client config
npm run dev                          # http://localhost:3000
```

Open http://localhost:3000.

## What this is

A curated catalog of 12 real-feeling travel experiences (Patagonia trekking, a Tuscany truffle hunt, a Galápagos cruise, and so on) with full search, filtering, sorting, and pagination, an experience details page with reviews and related trips, and two genuine AI features:

1. **AI Trip Concierge** — describe what you want in plain language; the model reads the live catalog and recommends matches with reasons.
2. **AI Highlight Generator** — generates a short, specific "why you'll love this" blurb for any experience, optionally tailored to a stated interest.

Auth is real, built on three pieces working together: **Firebase Authentication** handles sign-in and issues the JWT (its ID tokens are JWTs), **MongoDB** stores the app-specific profile data Firebase doesn't (like `role`), and the Express backend verifies that JWT via the Firebase Admin SDK on every request. Google sign-in is fully functional; email/password works too. One-click demo logins:

| Role | Email | Password |
|---|---|---|
| User | `demo.user@wanderlusttrails.example` | `DemoUser123!` |
| Admin | `demo.admin@wanderlusttrails.example` | `DemoAdmin123!` |

Logging in routes you to a simple per-role landing page (`/account` for users, `/admin` for admins with live catalog stats).

See `server/README.md` and `client/README.md` for full setup details and what was intentionally left out of scope (the multi-page sidebar/charts dashboard system) versus the full original spec.

## Requirements

- Node.js 18.18+
- Free accounts: MongoDB Atlas, Firebase, Google AI Studio (Gemini) — none require a credit card for this scope.
