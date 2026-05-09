import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/browser';
import App from './App';

// TD-004: error tracking. Same Sentry project as mobile, distinguished by
// `platform` tag. DSN is a public identifier (write-only), safe to hardcode.
Sentry.init({
  dsn: 'https://302d9e10f04fa979d37c0c85477a45b7@o4511355214299136.ingest.de.sentry.io/4511355220721744',
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0,           // no perf sampling for now
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0, // session replay only on errors (free tier-friendly)
  sendDefaultPii: false,
  initialScope: { tags: { platform: 'web' } },
});
window.Sentry = Sentry;          // ErrorBoundary uses window.Sentry?.captureException

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
