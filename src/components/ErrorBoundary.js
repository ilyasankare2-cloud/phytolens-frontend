import { Component } from 'react';
import { palette } from '../shared/theme';

export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // When Sentry is wired (TD-004), report here
    if (window.Sentry?.captureException) {
      window.Sentry.captureException(error, { extra: info });
    }
  }

  reload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={s.wrap}>
        <div style={s.box}>
          <span style={s.emoji}>🔧</span>
          <h2 style={s.title}>Algo se rompió</h2>
          <p style={s.text}>
            La app encontró un error inesperado. Recarga para volver a empezar — tu historial está a salvo.
          </p>
          <button style={s.btn} onClick={this.reload}>Recargar</button>
        </div>
      </div>
    );
  }
}

const s = {
  wrap:  { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: palette.bg, padding: 24, fontFamily: "'Inter', -apple-system, sans-serif" },
  box:   { maxWidth: 420, textAlign: 'center', background: palette.card, border: `1px solid ${palette.border}`, borderRadius: 18, padding: 32 },
  emoji: { fontSize: 48, display: 'block', marginBottom: 16 },
  title: { color: palette.text, fontSize: 22, fontWeight: 700, margin: '0 0 12px', letterSpacing: '-0.3px' },
  text:  { color: palette.muted, fontSize: 14, lineHeight: 1.5, margin: '0 0 24px' },
  btn:   { background: palette.green, color: '#000', border: 'none', borderRadius: 980, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer' },
};
