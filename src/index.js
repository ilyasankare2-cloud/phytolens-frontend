import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/browser';
import App from './App';
import './index.css';

// TD-004: error tracking. Same Sentry project as mobile, distinguished by
// `platform` tag. Only initialised when VITE_SENTRY_DSN is set (empty in dev).
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    sendDefaultPii: false,
    initialScope: { tags: { platform: 'web' } },
  });
}
window.Sentry = Sentry;          // ErrorBoundary uses window.Sentry?.captureException

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
