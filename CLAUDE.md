# TrichAI Frontend

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

TrichAI — React web app (Create React App) deployed on Vercel. Identifies cannabis type from photos using a FastAPI backend on Railway.

## Commands

```bash
npm start        # dev server on localhost:3000
npm run build    # production build → /build
npm test         # run tests (watch mode)
```

## Architecture

The entire app lives in a single file: `src/App.js`. No routing library, no state management library — navigation is handled by a `mode` state variable (`'analyze' | 'contribute'`) and a `historyOpen` boolean.

**Data flow:**
1. User picks a file → `handleFile()` creates an object URL for preview (revoked on reset/new file)
2. `analyze()` posts to `POST /analyze` → result stored in state → saved to `localStorage` as base64
3. `contribute()` posts to `POST /contribute` with a user-selected label

**API:** hardcoded in `const API` at the top of `App.js` — points to the Railway backend.

**History:** stored in `localStorage` under key `trichai_history`, max 50 entries. Each entry contains the full result object + base64 image data.

**Styles:** all inline JS objects in the `styles` const at the bottom of `App.js`. No CSS modules, no Tailwind.

## Backend (separate repo)

The Railway backend (`phytolens-backend`) exposes:
- `POST /analyze` — returns `{ success, result }` where result includes `label`, `confidence`, `thc_estimate`, `visual_traits`, etc.
- `POST /contribute` — accepts `file` + `label` form fields
- `GET /stats` — protected by `x-api-key` header (env var `STATS_API_KEY`)

## Deployment

Push to `main` → Vercel auto-deploys. Security headers (CSP, X-Frame-Options, etc.) are configured in `vercel.json`.
