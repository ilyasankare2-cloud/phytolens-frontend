import { useState } from 'react';
import { Check } from 'lucide-react';
import { LABELS } from '../shared/labels';
import { palette } from '../shared/theme';

const API = 'https://phytolens-backend-production.up.railway.app';

const VALID = ['bud', 'hash', 'plant', 'other'];

/**
 * Discrete feedback prompt shown under a result. Three visible states:
 *   idle       -> "¿Te ha sido útil?   Sí / No, era..."
 *   correcting -> "¿Qué era realmente?   [4 chips]"
 *   done       -> "Gracias por mejorar TrichAI"
 *
 * Apple-style restraint: hairline divider, muted text, ghost buttons,
 * no celebration, no scale-on-hover, no emojis.
 */
export function FeedbackPrompt({ image, result, onTrack }) {
  const [state, setState] = useState('idle');
  const [submitting, setSubmitting] = useState(false);

  if (!image || !result || !result.label) return null;
  if (!VALID.includes(result.label)) return null;

  const send = async (isCorrect, realLabel) => {
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('file', image);
      form.append('predicted', result.label);
      form.append('is_correct', isCorrect ? 'true' : 'false');
      form.append('confidence', String(result.confidence ?? 0));
      if (!isCorrect && realLabel) form.append('real_label', realLabel);
      const res = await fetch(`${API}/feedback`, { method: 'POST', body: form });
      if (!res.ok) throw new Error('feedback rejected');
      if (onTrack) {
        onTrack(isCorrect ? 'feedback_positive' : 'feedback_correction', {
          predicted: result.label,
          real:      realLabel || result.label,
        });
      }
      setState('done');
    } catch {
      // Silently swallow — feedback is best-effort. Don't bother the user.
      setState('done');
    } finally {
      setSubmitting(false);
    }
  };

  if (state === 'done') {
    return (
      <div style={s.wrap}>
        <div style={s.thanks}>
          <Check size={14} strokeWidth={2.5} color={palette.green} />
          <span>Gracias por mejorar TrichAI</span>
        </div>
      </div>
    );
  }

  if (state === 'correcting') {
    return (
      <div style={s.wrap}>
        <p style={s.question}>¿Qué era realmente?</p>
        <div style={s.chipRow}>
          {VALID.map(key => {
            const lbl = LABELS[key];
            const isPrediction = key === result.label;
            return (
              <button
                key={key}
                type="button"
                disabled={submitting || isPrediction}
                onClick={() => send(false, key)}
                style={{
                  ...s.chip,
                  ...(isPrediction ? s.chipDisabled : {}),
                }}
              >
                {lbl.text}
              </button>
            );
          })}
        </div>
        <button type="button" style={s.cancel} onClick={() => setState('idle')} disabled={submitting}>
          Cancelar
        </button>
      </div>
    );
  }

  // idle
  return (
    <div style={s.wrap}>
      <p style={s.question}>¿Te ha sido útil este resultado?</p>
      <div style={s.btnRow}>
        <button type="button" style={s.btnYes} onClick={() => send(true)} disabled={submitting}>
          Sí, correcto
        </button>
        <button type="button" style={s.btnNo} onClick={() => setState('correcting')} disabled={submitting}>
          No, era otra cosa
        </button>
      </div>
    </div>
  );
}

const s = {
  wrap:       { marginTop: 20, paddingTop: 18, borderTop: `1px solid ${palette.border}` },
  question:   { color: palette.muted, fontSize: 13, margin: '0 0 12px', letterSpacing: '-0.1px' },
  btnRow:     { display: 'flex', gap: 8 },
  btnYes:     {
    flex: 1, padding: '9px 0',
    background: 'transparent',
    border: `1px solid ${palette.border}`,
    color: palette.text,
    borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer',
    letterSpacing: '-0.1px',
    transition: 'background 0.2s cubic-bezier(.22,1,.36,1), border-color 0.2s cubic-bezier(.22,1,.36,1)',
  },
  btnNo:      {
    flex: 1, padding: '9px 0',
    background: 'transparent',
    border: `1px solid ${palette.border}`,
    color: palette.muted,
    borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer',
    letterSpacing: '-0.1px',
    transition: 'background 0.2s cubic-bezier(.22,1,.36,1), border-color 0.2s cubic-bezier(.22,1,.36,1)',
  },
  chipRow:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 },
  chip:       {
    padding: '8px 0',
    background: 'transparent',
    border: `1px solid ${palette.border}`,
    color: palette.text,
    borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
    letterSpacing: '-0.1px',
    transition: 'background 0.2s cubic-bezier(.22,1,.36,1), border-color 0.2s cubic-bezier(.22,1,.36,1)',
  },
  chipDisabled: { color: palette.dim, cursor: 'not-allowed', opacity: 0.5 },
  cancel:     {
    background: 'none', border: 'none', color: palette.dim, fontSize: 12,
    cursor: 'pointer', padding: '4px 0', width: '100%', textAlign: 'center',
  },
  thanks:     {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    color: palette.muted, fontSize: 13, letterSpacing: '-0.1px',
  },
};
