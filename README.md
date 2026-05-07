# TrichAI Web

Cannabis identification tool powered by AI. Upload a photo, get category, estimated THC, effects, visual traits and more.

[![Vercel](https://img.shields.io/badge/deployed-Vercel-black)](https://vercel.com)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev)

**[trichai.vercel.app](https://trichai.vercel.app)**

## Stack

React 19 + Create React App. No router, no state library, no CSS framework. The whole app is `src/App.js` with inline styles.

Navigation is handled by a `mode` state variable (`analyze | contribute`) and a `historyOpen` boolean. No dependencies beyond what CRA ships with.

## Running locally

```bash
npm install
npm start
```

The backend URL is a constant at the top of `src/App.js`. Point it to your local backend if needed.

## How the data flows

1. User picks a file → `URL.createObjectURL()` for preview (revoked on reset)
2. `analyze()` posts to `/analyze` → result stored in state → entry saved to `localStorage` with base64 image
3. History survives page refreshes, capped at 50 entries under key `trichai_history`

## Deployment

Push to `main` → Vercel deploys automatically. Security headers (CSP, X-Frame-Options, etc.) are set in `vercel.json`.
