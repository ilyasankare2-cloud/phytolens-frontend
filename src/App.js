import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { LABELS, EXTRA_INFO, CONTRIB_LABELS } from './shared/labels';
import { palette } from './shared/theme';
import { interpretThc } from './shared/thcInterpretation';
import { compressImage } from './utils/imageCompress';
import { ErrorBoundary } from './components/ErrorBoundary';

function CookieBanner() {
  const [visible, setVisible] = useState(() => !localStorage.getItem('trichai_cookie_consent'));
  if (!visible) return null;
  const handle = (choice) => {
    localStorage.setItem('trichai_cookie_consent', choice);
    if (choice === 'accepted' && window.gtag) {
      window.gtag('consent', 'update', { analytics_storage: 'granted' });
    }
    setVisible(false);
  };
  return (
    <div style={cookieStyles.banner}>
      <p style={cookieStyles.text}>
        Usamos Google Analytics para mejorar la app. No recopilamos datos personales.{' '}
        <a href="/terms.html" style={{color: palette.green}}>Términos</a>
      </p>
      <div style={cookieStyles.btns}>
        <button style={cookieStyles.reject} onClick={() => handle('rejected')}>Rechazar</button>
        <button style={cookieStyles.accept} onClick={() => handle('accepted')}>Aceptar</button>
      </div>
    </div>
  );
}

const cookieStyles = {
  banner: { position:'fixed', bottom:0, left:0, right:0, background:'#1a1a1a', borderTop:`1px solid #2a2a2a`, padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, zIndex:1000, flexWrap:'wrap' },
  text:   { color:'#888', fontSize:13, margin:0, flex:1 },
  btns:   { display:'flex', gap:8, flexShrink:0 },
  reject: { background:'transparent', border:'1px solid #333', color:'#666', borderRadius:8, padding:'8px 16px', fontSize:13, cursor:'pointer' },
  accept: { background:palette.green, border:'none', color:'#000', borderRadius:8, padding:'8px 16px', fontSize:13, fontWeight:600, cursor:'pointer' },
};

const API = 'https://phytolens-backend-production.up.railway.app';

// ── GA EVENTS ─────────────────────────────────────────────────────────────────
// Fire only if user accepted analytics. window.gtag exists once GA script loads;
// consent gating is handled at the consent layer in index.html.
function track(eventName, params = {}) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    try { window.gtag('event', eventName, params); } catch {}
  }
}
const SESSION_ANALYSES_KEY = 'trichai_session_analyses';
const FIRST_ANALYSIS_KEY   = 'trichai_first_analysis_done';

// ── SHARE CARD (Canvas) ───────────────────────────────────────────────────────
function _rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function buildShareCardWithImage(result, cfg, extra, imageSrc) {
  return new Promise(resolve => {
    const W = 600, H = 860, S = 2;
    const canvas = document.createElement('canvas');
    canvas.width = W * S; canvas.height = H * S;
    const ctx = canvas.getContext('2d');
    ctx.scale(S, S);

    const draw = (loadedImg) => {
      // Background
      ctx.fillStyle = '#080808'; ctx.fillRect(0, 0, W, H);

      // Glow behind image
      const grd = ctx.createRadialGradient(W/2, 220, 10, W/2, 220, 320);
      grd.addColorStop(0, cfg.color + '22');
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd; ctx.fillRect(0, 0, W, 480);

      // Photo
      if (loadedImg) {
        ctx.save();
        _rrect(ctx, 0, 0, W, 420, 0); ctx.clip();
        ctx.drawImage(loadedImg, 0, 0, W, 420);
        // gradient overlay bottom of photo
        const fade = ctx.createLinearGradient(0, 250, 0, 420);
        fade.addColorStop(0, 'transparent');
        fade.addColorStop(1, '#080808');
        ctx.fillStyle = fade; ctx.fillRect(0, 0, W, 420);
        ctx.restore();
      }

      // Top stripe glow
      const topGlow = ctx.createLinearGradient(0, 0, W, 0);
      topGlow.addColorStop(0, cfg.color);
      topGlow.addColorStop(1, cfg.color + '44');
      ctx.fillStyle = topGlow; ctx.fillRect(0, 0, W, 4);

      // Logo
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px -apple-system,sans-serif';
      ctx.fillText('🔬 TrichAI', 24, 36);
      ctx.fillStyle = '#ffffff44';
      ctx.font = '12px -apple-system,sans-serif';
      ctx.fillText('AI Cannabis Analysis', 24, 54);

      // Category pill
      ctx.fillStyle = cfg.color + '22';
      _rrect(ctx, 24, imageSrc ? 390 : 80, 180, 32, 16); ctx.fill();
      ctx.strokeStyle = cfg.color + '66'; ctx.lineWidth = 1;
      _rrect(ctx, 24, imageSrc ? 390 : 80, 180, 32, 16); ctx.stroke();
      ctx.fillStyle = cfg.color;
      ctx.font = 'bold 13px -apple-system,sans-serif';
      ctx.fillText(`${cfg.emoji}  ${result.display}`, 40, imageSrc ? 411 : 101);

      const yBase = imageSrc ? 450 : 140;

      // Big confidence
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 56px -apple-system,sans-serif';
      ctx.fillText(`${(result.confidence * 100).toFixed(0)}%`, 24, yBase + 62);
      ctx.fillStyle = '#555';
      ctx.font = '13px -apple-system,sans-serif';
      ctx.fillText('confianza del modelo', 24, yBase + 82);

      // Confidence bar
      ctx.fillStyle = '#1a1a1a'; _rrect(ctx, 24, yBase + 94, W - 48, 6, 3); ctx.fill();
      ctx.fillStyle = cfg.color; _rrect(ctx, 24, yBase + 94, (W - 48) * result.confidence, 6, 3); ctx.fill();

      // THC + CBD cards
      const cardY = yBase + 116;
      [[`${result.thc_estimate}%`, 'THC estimado', cfg.color], [extra.cbd, 'CBD típico', '#888']].forEach(([val, label, col], i) => {
        const cx = 24 + i * 188;
        ctx.fillStyle = '#111'; _rrect(ctx, cx, cardY, 175, 72, 12); ctx.fill();
        ctx.strokeStyle = col + '33'; ctx.lineWidth = 1;
        _rrect(ctx, cx, cardY, 175, 72, 12); ctx.stroke();
        ctx.fillStyle = col;
        ctx.font = 'bold 30px -apple-system,sans-serif';
        ctx.fillText(val, cx + 16, cardY + 42);
        ctx.fillStyle = '#555'; ctx.font = '12px -apple-system,sans-serif';
        ctx.fillText(label, cx + 16, cardY + 58);
      });

      // Visual traits
      if (result.visual_traits) {
        const tY = cardY + 88;
        ctx.fillStyle = '#333'; ctx.font = 'bold 10px -apple-system,sans-serif';
        ctx.fillText('RASGOS VISUALES', 24, tY);
        const traits = [
          ['Tricomas', result.visual_traits.trichomes],
          ['Textura', result.visual_traits.texture],
          ['Curación', result.visual_traits.cure],
        ];
        traits.forEach(([k, v], i) => {
          const tx = 24 + i * 190;
          ctx.fillStyle = '#1a1a1a'; _rrect(ctx, tx, tY + 10, 175, 50, 10); ctx.fill();
          ctx.fillStyle = '#666'; ctx.font = '10px -apple-system,sans-serif';
          ctx.fillText(k.toUpperCase(), tx + 12, tY + 28);
          ctx.fillStyle = '#ccc'; ctx.font = 'bold 14px -apple-system,sans-serif';
          ctx.fillText(v, tx + 12, tY + 48);
        });
      }

      // Effects
      const effY = cardY + 170;
      ctx.fillStyle = '#333'; ctx.font = 'bold 10px -apple-system,sans-serif';
      ctx.fillText('EFECTOS', 24, effY);
      let ex = 24; ctx.font = '12px -apple-system,sans-serif';
      extra.effects.slice(0, 4).forEach(e => {
        const ew = ctx.measureText(e).width + 20;
        ctx.strokeStyle = cfg.color + '55'; ctx.lineWidth = 1;
        _rrect(ctx, ex, effY + 8, ew, 24, 12); ctx.stroke();
        ctx.fillStyle = cfg.color + 'cc'; ctx.fillText(e, ex + 10, effY + 24);
        ex += ew + 8;
      });

      // Bottom CTA
      const btmY = H - 50;
      ctx.fillStyle = '#1a1a1a'; ctx.fillRect(0, btmY - 10, W, 60);
      ctx.fillStyle = '#444'; ctx.font = '13px -apple-system,sans-serif';
      ctx.fillText('phytolens-frontend.vercel.app', 24, btmY + 16);
      ctx.fillStyle = cfg.color; ctx.font = 'bold 13px -apple-system,sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('Analiza la tuya →', W - 24, btmY + 16);
      ctx.textAlign = 'left';

      resolve(canvas);
    };

    if (imageSrc) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => draw(img);
      img.onerror = () => draw(null);
      img.src = imageSrc;
    } else {
      draw(null);
    }
  });
}

async function shareResult(result, cfg, extra, imagePreview, onPreview) {
  if (onPreview) { onPreview(null); }
  const canvas = await buildShareCardWithImage(result, cfg, extra, imagePreview ? imagePreview : null);
  const dataUrl = canvas.toDataURL('image/png');
  if (onPreview) { onPreview(dataUrl); return; }

  const text = `${result.display} · THC ${result.thc_estimate}% · Confianza ${(result.confidence * 100).toFixed(0)}%\n\nhttps://phytolens-frontend.vercel.app`;
  return new Promise(resolve => {
    canvas.toBlob(async blob => {
      const file = new File([blob], 'trichai.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ title: `TrichAI — ${result.display}`, text, files: [file] }); resolve(); return; } catch {}
      }
      if (navigator.share) {
        try { await navigator.share({ title: `TrichAI — ${result.display}`, text }); resolve(); return; } catch {}
      }
      const a = document.createElement('a');
      a.download = 'trichai-resultado.png'; a.href = dataUrl; a.click();
      resolve();
    });
  });
}

function loadHistory() {
  try { return JSON.parse(localStorage.getItem('trichai_history') || '[]'); }
  catch { return []; }
}

function saveHistory(h) {
  try { localStorage.setItem('trichai_history', JSON.stringify(h)); } catch {}
}

const NotDetectedCard = memo(function NotDetectedCard({ imagePreview, onRetry }) {
  return (
    <div style={{...styles.result, borderColor: palette.border}}>
      {imagePreview && <img src={imagePreview} alt="preview" style={styles.resultImage} />}
      <div style={styles.notDetectedHeader}>
        <span style={{fontSize: 40}}>🚫</span>
        <div>
          <p style={styles.notDetectedTitle}>No veo cannabis aquí</p>
          <p style={styles.notDetectedSub}>No parece haber cogollo, hachís ni planta. Puede que sea una mano, un fondo u otra cosa que el modelo no reconoce.</p>
        </div>
      </div>
      <div style={styles.notDetectedTipsBox}>
        <p style={styles.notDetectedTipsTitle}>Cómo mejorar la foto</p>
        <ul style={styles.notDetectedTipsList}>
          <li>Acércate y ocupa el centro</li>
          <li>Buena luz, preferible natural</li>
          <li>Enfoque nítido, fondo limpio</li>
        </ul>
      </div>
      {onRetry && (
        <button style={{...styles.btn, marginTop:8, marginBottom:0}} onClick={onRetry}>Probar con otra foto</button>
      )}
    </div>
  );
});

const ResultCard = memo(function ResultCard({ result, imagePreview, cfg, extra, compact = false, onRetry }) {
  const [thcOpen, setThcOpen]   = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [techOpen, setTechOpen] = useState(false);
  if (result.label === 'other') {
    return <NotDetectedCard imagePreview={imagePreview} onRetry={onRetry} />;
  }
  const conf = result.confidence * 100;
  const thcDetail = interpretThc(result);
  return (
    <div style={{...styles.result, borderColor: cfg.color}}>
      {imagePreview && <img src={imagePreview} alt="preview" style={styles.resultImage} />}

      <div style={styles.resultHeader}>
        <span style={{fontSize: 40}}>{cfg.emoji}</span>
        <div>
          <p style={{...styles.resultLabel, color: cfg.color}}>{result.display}</p>
          <p style={styles.resultConf}>Confianza: {conf.toFixed(1)}%</p>
          {conf < 70 && (
            <p style={styles.lowConfWarning}>⚠️ Confianza baja. Este resultado puede ser incorrecto.</p>
          )}
          <div style={styles.qualityRow}>
            <div style={{...styles.qualityDot, background: conf >= 85 ? palette.green : conf >= 65 ? '#FF9800' : '#f44336'}}/>
            <p style={styles.resultQuality}>Calidad: {result.quality}</p>
          </div>
        </div>
      </div>

      <div style={styles.thcRow}>
        <div
          style={{...styles.thcBox, ...(thcDetail ? styles.thcBoxClickable : {}), ...(thcOpen ? {borderColor: cfg.color+'55'} : {})}}
          onClick={() => thcDetail && setThcOpen(o => !o)}
          role={thcDetail ? 'button' : undefined}
          tabIndex={thcDetail ? 0 : undefined}
          onKeyDown={e => { if (thcDetail && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setThcOpen(o => !o); } }}
        >
          <p style={styles.thcTitle}>THC típico</p>
          <p style={{...styles.thcValue, color: cfg.color, fontSize: 22, lineHeight: 1.2}}>{result.thc_min}% — {result.thc_max}%</p>
          {thcDetail && (
            <p style={styles.thcExpandHint}>{thcOpen ? 'Ocultar detalle ▲' : 'Toca para ver detalle ▼'}</p>
          )}
        </div>
        <div style={styles.thcBox}>
          <p style={styles.thcTitle}>CBD típico</p>
          <p style={{...styles.thcValue, color: '#aaa', fontSize: 18, paddingTop: 4}}>{extra.cbd}</p>
        </div>
      </div>
      {thcDetail && (
        <div style={{...styles.thcDetailWrap, maxHeight: thcOpen ? 600 : 0, opacity: thcOpen ? 1 : 0, marginTop: thcOpen ? 8 : 0, marginBottom: thcOpen ? 14 : 0}}>
          <div style={{...styles.thcDetailBox, borderColor: cfg.color+'33'}}>
            {thcDetail.lowConf && (
              <p style={styles.thcDetailLowConf}>⚠ Confianza baja del modelo. Esta interpretación es orientativa.</p>
            )}
            <p style={styles.thcDetailSection}>RASGOS DETECTADOS</p>
            <ul style={styles.thcDetailList}>
              {thcDetail.traits.map(t => (
                <li key={t.key} style={styles.thcDetailItem}>
                  <span style={styles.thcDetailItemLabel}>{t.label}: </span>
                  <span style={{...styles.thcDetailItemValue, color: cfg.color}}>{t.value}</span>
                  {t.sub && t.sub !== '—' && <span style={styles.thcDetailItemSub}> · {t.sub}</span>}
                </li>
              ))}
            </ul>
            <p style={styles.thcDetailSection}>INTERPRETACIÓN</p>
            <p style={styles.thcDetailText}>{thcDetail.interpretation}</p>
            <p style={styles.thcDetailDisclaimer}>⚠ Estimación visual. No sustituye análisis de laboratorio.</p>
          </div>
        </div>
      )}

      <p style={styles.description}>{result.description}</p>

      {!compact && (
        <>
          {/* Lvl 4 — Aviso obligatorio (siempre visible) */}
          <div style={styles.moderationBox}>
            <p style={styles.moderationTitle}>Moderación</p>
            <p style={styles.moderationText}>{extra.moderation}</p>
          </div>

          {/* Lvl 3 — Más detalle (colapsable) */}
          <button
            type="button"
            style={styles.disclosureBtn}
            onClick={() => setMoreOpen(o => !o)}
            aria-expanded={moreOpen}
          >
            <span style={styles.disclosureLabel}>Más detalle</span>
            <span style={{...styles.disclosureChevron, transform: moreOpen ? 'rotate(180deg)' : 'rotate(0deg)'}}>▾</span>
          </button>
          <div style={{...styles.disclosureWrap, maxHeight: moreOpen ? 1200 : 0, opacity: moreOpen ? 1 : 0, marginBottom: moreOpen ? 8 : 0}}>
            <div style={styles.disclosureInner}>
              <p style={styles.sectionTitle}>Efectos</p>
              <div style={styles.badgeRow}>
                {extra.effects.map(e => <span key={e} style={{...styles.badge, borderColor: cfg.color, color: cfg.color}}>{e}</span>)}
              </div>

              <p style={styles.sectionTitle}>Aroma</p>
              <div style={styles.badgeRow}>
                {extra.aroma.map(a => <span key={a} style={{...styles.badge, borderColor: '#555', color: '#888'}}>{a}</span>)}
              </div>

              <p style={styles.sectionTitle}>Consumo</p>
              <div style={styles.badgeRow}>
                {extra.consumption.map(c => <span key={c} style={{...styles.badge, borderColor: '#444', color: '#666'}}>{c}</span>)}
              </div>

              <p style={styles.sectionTitle}>Variedades comunes</p>
              <div style={styles.badgeRow}>
                {result.varieties.map(v => <span key={v} style={{...styles.badge, borderColor: cfg.color, color: cfg.color}}>{v}</span>)}
              </div>

              <div style={styles.tipBox}>
                <p style={styles.tipText}>{extra.tip}</p>
              </div>
            </div>
          </div>

          {/* Lvl 5 — Análisis técnico (colapsable) */}
          <button
            type="button"
            style={styles.disclosureBtn}
            onClick={() => setTechOpen(o => !o)}
            aria-expanded={techOpen}
          >
            <span style={styles.disclosureLabel}>Análisis técnico</span>
            <span style={{...styles.disclosureChevron, transform: techOpen ? 'rotate(180deg)' : 'rotate(0deg)'}}>▾</span>
          </button>
          <div style={{...styles.disclosureWrap, maxHeight: techOpen ? 1000 : 0, opacity: techOpen ? 1 : 0, marginBottom: techOpen ? 8 : 0}}>
            <div style={styles.disclosureInner}>
              {result.visual_traits && (
                <>
                  <p style={styles.sectionTitle}>Rasgos visuales</p>
                  <div style={styles.traitsGrid}>
                    <div style={styles.traitBox}>
                      <p style={styles.traitLabel}>Tricomas</p>
                      <p style={styles.traitValue}>{result.visual_traits.trichomes}</p>
                      <p style={styles.traitSub}>{result.visual_traits.trichome_coverage.toFixed(1)}% cobertura</p>
                    </div>
                    <div style={styles.traitBox}>
                      <p style={styles.traitLabel}>Textura</p>
                      <p style={styles.traitValue}>{result.visual_traits.texture}</p>
                      <p style={styles.traitSub}>Rugosidad {result.visual_traits.roughness.toFixed(0)}/100</p>
                    </div>
                    <div style={styles.traitBox}>
                      <p style={styles.traitLabel}>Curación</p>
                      <p style={styles.traitValue}>{result.visual_traits.cure}</p>
                      <p style={styles.traitSub}>Brillo {result.visual_traits.brightness.toFixed(0)}%</p>
                    </div>
                    <div style={styles.traitBox}>
                      <p style={styles.traitLabel}>Color base</p>
                      <div style={{width:24,height:24,borderRadius:'50%',background:`rgb(${result.visual_traits.dominant_color.join(',')})`,margin:'4px auto',border:'1px solid #333'}}/>
                      <p style={styles.traitSub}>RGB dominante</p>
                    </div>
                  </div>
                </>
              )}

              <p style={styles.sectionTitle}>Probabilidades</p>
              <div style={styles.bars}>
                {Object.entries(result.all_probs).map(([key, val]) => (
                  <div key={key} style={styles.barRow}>
                    <span style={styles.barLabel}>{LABELS[key].emoji} {LABELS[key].text}</span>
                    <div style={styles.barBg}><div style={{...styles.barFill, width: `${(val * 100).toFixed(0)}%`, background: LABELS[key].color}}/></div>
                    <span style={styles.barVal}>{(val * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
});

function AppInner() {
  const [image, setImage]               = useState(null);
  const [preview, setPreview]           = useState(null);
  const [result, setResult]             = useState(null);
  const [loading, setLoading]           = useState(false);
  const [slowLoading, setSlowLoading]   = useState(false);
  const [error, setError]               = useState(null);
  const [mode, setMode]                 = useState('analyze');
  const [contribLabel, setContribLabel] = useState('');
  const [contribSent, setContribSent]   = useState(false);
  const [contribLoading, setContribLoading] = useState(false);
  const [contribError, setContribError] = useState(null);
  const [history, setHistory]           = useState(loadHistory);
  const [historyOpen, setHistoryOpen]   = useState(false);
  const [expandedHistory, setExpandedHistory] = useState(null);
  const [sharing, setSharing]           = useState(false);
  const [sharePreview, setSharePreview] = useState(null);
  const inputRef    = useRef();
  const contribRef  = useRef();
  const prevPreview = useRef(null);  // tracks current object URL for revocation

  // Revoke object URL on unmount to prevent memory leak
  useEffect(() => {
    return () => {
      if (prevPreview.current) URL.revokeObjectURL(prevPreview.current);
    };
  }, []);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Formato no soportado. Usa una imagen JPG, PNG o WebP.');
      return;
    }
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) {
      setError('Formato no soportado. Usa JPG, PNG o WebP (no HEIC/GIF/SVG).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError(`La imagen pesa ${(file.size / 1024 / 1024).toFixed(1)}MB. Máximo 10MB — prueba con una foto más pequeña.`);
      return;
    }
    if (prevPreview.current) {
      URL.revokeObjectURL(prevPreview.current);
    }
    let optimized;
    try {
      optimized = await compressImage(file);
    } catch {
      setError('No se pudo procesar la imagen. Puede estar corrupta. Prueba con otra foto.');
      return;
    }
    const url = URL.createObjectURL(optimized);
    prevPreview.current = url;
    setImage(optimized);
    setPreview(url);
    setResult(null);
    setError(null);
    setContribSent(false);
    setContribError(null);
  }, []);

  const analyze = async () => {
    if (!image) return;
    setLoading(true);
    setSlowLoading(false);
    setError(null);
    const controller = new AbortController();
    const slowId     = setTimeout(() => setSlowLoading(true), 4000);  // 4s warning
    const timeoutId  = setTimeout(() => controller.abort(), 12000);   // 12s — Railway cold starts can be ~10s
    try {
      const form = new FormData();
      form.append('file', image);
      const res  = await fetch(`${API}/analyze`, { method: 'POST', body: form, signal: controller.signal });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || 'Error al analizar la imagen.');
        return;
      }
      if (data.success) {
        setResult(data.result);

        // Analytics: distinguish first analysis ever vs nth in session
        const sessionCount = parseInt(sessionStorage.getItem(SESSION_ANALYSES_KEY) || '0', 10) + 1;
        sessionStorage.setItem(SESSION_ANALYSES_KEY, String(sessionCount));
        if (!localStorage.getItem(FIRST_ANALYSIS_KEY)) {
          localStorage.setItem(FIRST_ANALYSIS_KEY, '1');
          track('first_analysis_completed', { label: data.result.label, confidence: Math.round(data.result.confidence * 100) });
        }
        if (sessionCount === 2) {
          track('second_analysis_same_session', { label: data.result.label });
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const entry = {
            id:        Date.now(),
            date:      new Date().toLocaleString('es-ES'),
            result:    data.result,
            imageData: e.target.result,
          };
          const updated = [entry, ...history].slice(0, 50);
          setHistory(updated);
          saveHistory(updated);
        };
        reader.readAsDataURL(image);
      } else {
        setError('Error al analizar la imagen.');
        track('error_occurred', { type: 'analyze_no_success' });
      }
    } catch (err) {
      setError(err.name === 'AbortError'
        ? 'El servidor está tardando más de lo normal. Inténtalo de nuevo.'
        : 'No se puede conectar con el servidor.');
      track('error_occurred', { type: err.name === 'AbortError' ? 'timeout' : 'network' });
    } finally {
      clearTimeout(slowId);
      clearTimeout(timeoutId);
      setSlowLoading(false);
      setLoading(false);
    }
  };

  const contribute = async () => {
    if (!image || !contribLabel) return;
    setContribLoading(true);
    setContribError(null);
    try {
      const form = new FormData();
      form.append('file', image);
      form.append('label', contribLabel);
      const res = await fetch(`${API}/contribute`, { method: 'POST', body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Error ${res.status}`);
      }
      const data = await res.json();
      if (!data.success) throw new Error('El servidor rechazó la foto.');
      setContribSent(true);
      track('photo_contributed', { label: contribLabel });
    } catch (err) {
      setContribError('No se pudo enviar la foto. Inténtalo de nuevo.');
      track('error_occurred', { type: 'contribute_failed' });
    } finally {
      setContribLoading(false);
    }
  };

  const reset = () => {
    if (prevPreview.current) {
      URL.revokeObjectURL(prevPreview.current);
      prevPreview.current = null;
    }
    setImage(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setContribSent(false);
    setContribLabel('');
    setContribError(null);
  };

  const clearHistory = () => {
    setHistory([]);
    saveHistory([]);
    setHistoryOpen(false);
    setExpandedHistory(null);
  };

  const cfg   = result ? LABELS[result.label] : null;
  const extra = result ? EXTRA_INFO[result.label] : null;

  // ── HISTORY VIEW ──
  if (historyOpen) {
    const expanded = expandedHistory !== null ? history.find(h => h.id === expandedHistory) : null;
    return (
      <div style={styles.container}>
        <div style={{...styles.card, maxWidth: expanded ? 500 : 600}}>
          <div style={styles.topBar}>
            <button style={styles.backBtn} onClick={() => { setHistoryOpen(false); setExpandedHistory(null); }}>← Volver</button>
            <h2 style={styles.topTitle}>Historial ({history.length})</h2>
            <button style={styles.clearBtn} onClick={clearHistory}>Borrar todo</button>
          </div>

          {history.length === 0 && (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>📷</div>
              <p style={styles.emptyTitle}>Aún no has analizado nada</p>
              <p style={styles.emptyText}>Cada análisis se guarda aquí automáticamente.<br/>Tu historial vive en este dispositivo.</p>
              <button style={styles.emptyBtn} onClick={() => { setHistoryOpen(false); }}>Analizar mi primera foto →</button>
            </div>
          )}

          {expanded ? (
            <>
              <button style={{...styles.backBtn, marginBottom:16}} onClick={() => setExpandedHistory(null)}>← Lista</button>
              <p style={{color:'#444', fontSize:12, marginBottom:12}}>🕐 {expanded.date}</p>
              <ResultCard
                result={expanded.result}
                imagePreview={expanded.imageData}
                cfg={LABELS[expanded.result.label]}
                extra={EXTRA_INFO[expanded.result.label]}
              />
            </>
          ) : (
            <div style={{display:'flex', flexDirection:'column', gap:12}}>
              {history.map(item => {
                const c = LABELS[item.result.label];
                return (
                  <div key={item.id} style={{...styles.historyItem, borderColor: c.color}} onClick={() => setExpandedHistory(item.id)}>
                    <div style={styles.historyThumbWrap}>
                      {item.imageData && <img src={item.imageData} alt="" style={styles.historyThumb}/>}
                    </div>
                    <div style={{flex:1}}>
                      <p style={{...styles.historyLabel, color: c.color}}>{c.emoji} {item.result.display}</p>
                      <p style={styles.historyConf}>Confianza: {(item.result.confidence * 100).toFixed(1)}% · THC: {item.result.thc_estimate}%</p>
                      <p style={styles.historyDate}>🕐 {item.date}</p>
                    </div>
                    <span style={styles.historyArrow}>›</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── MAIN VIEW ──
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>🔬 TrichAI</h1>
            <p style={styles.subtitle}>Identificación inteligente de cannabis</p>
          </div>
          {history.length > 0 && (
            <button style={styles.historyBtn} onClick={() => setHistoryOpen(true)}>
              📋 {history.length}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button style={{...styles.tab, ...(mode === 'analyze' ? styles.tabActive : {})}} onClick={() => { setMode('analyze'); reset(); }}>Analizar</button>
          <button style={{...styles.tab, ...(mode === 'contribute' ? styles.tabActive : {})}} onClick={() => { setMode('contribute'); reset(); }}>Contribuir foto</button>
        </div>

        {/* ── ANALYZE MODE ── */}
        {mode === 'analyze' && (
          <>
            <div style={styles.dropzone} onClick={() => inputRef.current.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}>
              {(preview && !result)
                ? <img src={preview} alt="preview" style={styles.preview} />
                : <div style={styles.placeholder}>
                    <span style={{fontSize:48}}>📷</span>
                    <p style={styles.dropText}>Haz clic o arrastra una foto aquí</p>
                  </div>
              }
            </div>
            <input ref={inputRef} type="file" accept="image/*" style={{display:'none'}} onChange={e => handleFile(e.target.files[0])} />

            <p style={styles.disclaimer}>Herramienta informativa. Los resultados son estimaciones de IA, no sustituyen análisis de laboratorio. Solo mayores de edad donde el cannabis sea legal. <a href="/terms.html" style={{color:palette.green}}>Términos</a></p>
            <button style={{...styles.btn, opacity:(!image||loading)?0.6:1, cursor:(!image||loading)?'not-allowed':'pointer'}} onClick={analyze} disabled={!image||loading}>
              {loading ? <span style={styles.btnLoading}><span style={styles.spinner}/>Analizando con IA…</span> : 'Analizar imagen'}
            </button>
            {loading && (
              <div style={styles.skeletonCard}>
                {slowLoading && (
                  <p style={styles.slowMsg}>⏳ El servidor está despertando, esto puede tardar unos segundos…</p>
                )}
                <div className="skeleton" style={{width:120, height:14, marginBottom:10}}/>
                <div className="skeleton" style={{width:'60%', height:24, marginBottom:8}}/>
                <div className="skeleton" style={{width:'40%', height:14, marginBottom:18}}/>
                <div style={{display:'flex', gap:8, marginBottom:14}}>
                  <div className="skeleton" style={{flex:1, height:62}}/>
                  <div className="skeleton" style={{flex:1, height:62}}/>
                </div>
                <div className="skeleton" style={{width:'100%', height:32}}/>
              </div>
            )}
            {error && (
              <div style={styles.errorBox}>
                <span style={{fontSize:18}}>⚠️</span>
                <div>
                  <p style={styles.errorTitle}>{error}</p>
                  <button style={styles.errorRetry} onClick={analyze} disabled={!image||loading}>Reintentar</button>
                </div>
              </div>
            )}

            {result && cfg && extra && (
              <>
                {result.label !== 'other' && (
                  <div style={styles.actionRow}>
                    <button
                      style={{...styles.actionBtn, ...styles.actionBtnPrimary}}
                      onClick={async () => {
                        track('result_shared', { label: result.label, surface: 'preview_card' });
                        setSharing(true);
                        await shareResult(result, cfg, extra, preview, setSharePreview);
                        setSharing(false);
                      }}
                      disabled={sharing}
                    >
                      {sharing ? <span style={styles.btnLoading}><span style={styles.spinnerSm}/>Generando…</span> : '↑ Compartir resultado'}
                    </button>
                    <button style={styles.actionBtn} onClick={reset}>
                      🔄 Nueva foto
                    </button>
                  </div>
                )}

                <ResultCard result={result} imagePreview={preview} cfg={cfg} extra={extra} onRetry={reset} />

                {result.label !== 'other' && (
                  <div style={styles.contributeInvite}>
                    <p style={styles.contributeInviteText}>¿El resultado no es correcto?</p>
                    <button style={styles.contributeInviteBtn} onClick={() => setMode('contribute')}>Corrígelo y mejora la IA →</button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── SHARE PREVIEW MODAL ── */}
        {sharePreview && (
          <div style={styles.modalOverlay} onClick={() => setSharePreview(null)}>
            <div style={styles.modalBox} onClick={e => e.stopPropagation()}>
              <p style={styles.modalTitle}>Vista previa</p>
              <img src={sharePreview} alt="share preview" style={styles.modalImg} />
              <div style={styles.modalBtns}>
                <button style={{...styles.btn, marginBottom:0, flex:1}} onClick={async () => {
                  const res = await fetch(sharePreview);
                  const blob = await res.blob();
                  const file = new File([blob], 'trichai.png', { type: 'image/png' });
                  const text = `${result.display} · THC ${result.thc_estimate}% · Confianza ${(result.confidence * 100).toFixed(0)}%\n\nhttps://phytolens-frontend.vercel.app`;
                  if (navigator.share && navigator.canShare?.({ files: [file] })) {
                    try { await navigator.share({ title: `TrichAI — ${result.display}`, text, files: [file] }); setSharePreview(null); return; } catch {}
                  }
                  const a = document.createElement('a');
                  a.download = 'trichai-resultado.png'; a.href = sharePreview; a.click();
                  setSharePreview(null);
                }}>
                  ↑ Compartir / Descargar
                </button>
                <button style={{...styles.actionBtn, flex:0.4}} onClick={() => setSharePreview(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        )}

        {/* ── CONTRIBUTE MODE ── */}
        {mode === 'contribute' && (
          <>
            <div style={styles.contributeInfo}>
              <p style={styles.contributeInfoText}>Cada foto que subas entrena la IA y la hace más precisa para todos.</p>
            </div>

            {contribSent ? (
              <div style={styles.successBox}>
                <span style={{fontSize:48}}>🙌</span>
                <p style={styles.successTitle}>¡Gracias por contribuir!</p>
                <p style={styles.successSub}>Tu foto ayuda a mejorar TrichAI.</p>
                <button style={styles.btn} onClick={reset}>Contribuir otra</button>
              </div>
            ) : (
              <>
                <div style={styles.dropzone} onClick={() => contribRef.current.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}>
                  {preview
                    ? <img src={preview} alt="preview" style={styles.preview} />
                    : <div style={styles.placeholder}><span style={{fontSize:48}}>📷</span><p style={styles.dropText}>Sube tu foto aquí</p></div>
                  }
                </div>
                <input ref={contribRef} type="file" accept="image/*" style={{display:'none'}} onChange={e => handleFile(e.target.files[0])} />
                <p style={styles.labelTitle}>¿Qué hay en la foto?</p>
                <div style={styles.labelGrid}>
                  {Object.entries(CONTRIB_LABELS).map(([key, val]) => (
                    <button key={key} style={{...styles.labelBtn, ...(contribLabel === key ? {...styles.labelBtnActive, borderColor:val.color, color:val.color} : {})}} onClick={() => setContribLabel(key)} title={val.help}>
                      <span style={{display:'block', fontSize:18, marginBottom:2}}>{val.emoji}</span>
                      <span style={{display:'block', fontWeight:600, fontSize:13, lineHeight:1.2}}>{val.text}</span>
                      <span style={{display:'block', fontSize:11, color:palette.dim, marginTop:3}}>{val.help}</span>
                    </button>
                  ))}
                </div>
                {contribError && <p style={styles.error}>{contribError}</p>}
                <button style={{...styles.btn, opacity:(!image||!contribLabel||contribLoading)?0.5:1}} onClick={contribute} disabled={!image||!contribLabel||contribLoading}>
                  {contribLoading ? 'Enviando...' : 'Enviar foto'}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const FEEDBACK_EMAIL = 'trichaiphy@gmail.com';
const GMAIL_COMPOSE  = `https://mail.google.com/mail/?view=cm&fs=1&to=${FEEDBACK_EMAIL}&su=${encodeURIComponent('Feedback TrichAI')}`;

function FeedbackModal({ onClose }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(FEEDBACK_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };
  return (
    <div style={feedbackStyles.overlay} onClick={onClose}>
      <div style={feedbackStyles.box} onClick={e => e.stopPropagation()}>
        <p style={feedbackStyles.title}>✉️ Mándanos feedback</p>
        <p style={feedbackStyles.sub}>Bugs, sugerencias o lo que sea — leemos todo.</p>
        <div style={feedbackStyles.emailRow}>
          <span style={feedbackStyles.emailText}>{FEEDBACK_EMAIL}</span>
          <button style={feedbackStyles.copyBtn} onClick={copy}>{copied ? '✓ Copiado' : 'Copiar'}</button>
        </div>
        <a href={GMAIL_COMPOSE} target="_blank" rel="noreferrer" style={feedbackStyles.gmailBtn}>Abrir en Gmail</a>
        <a href={`mailto:${FEEDBACK_EMAIL}?subject=Feedback%20TrichAI`} style={feedbackStyles.mailBtn}>Abrir cliente de correo</a>
        <button style={feedbackStyles.closeBtn} onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
}

function AppFooter() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div style={footerStyles.bar}>
        <button style={footerStyles.linkBtn} onClick={() => setOpen(true)}>✉️ Feedback</button>
        <span style={footerStyles.sep}>·</span>
        <a href="/terms.html" style={footerStyles.link}>Términos</a>
      </div>
      {open && <FeedbackModal onClose={() => setOpen(false)} />}
    </>
  );
}
const footerStyles = {
  bar:     { textAlign:'center', padding:'24px 16px 80px', color:'#444', fontSize:13 },
  link:    { color:'#666', textDecoration:'none' },
  linkBtn: { color:'#666', textDecoration:'none', background:'none', border:'none', font:'inherit', cursor:'pointer', padding:0 },
  sep:     { margin:'0 10px', color:'#222' },
};
const feedbackStyles = {
  overlay:   { position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1100, padding:16, backdropFilter:'blur(8px)' },
  box:       { background:palette.card, borderRadius:18, padding:24, width:'100%', maxWidth:380, border:`1px solid ${palette.border}` },
  title:     { color:palette.text, fontSize:17, fontWeight:700, margin:'0 0 6px', textAlign:'center' },
  sub:       { color:palette.muted, fontSize:13, margin:'0 0 18px', textAlign:'center', lineHeight:1.5 },
  emailRow:  { display:'flex', alignItems:'center', gap:8, background:'#0a0a0a', border:`1px solid ${palette.border}`, borderRadius:10, padding:'10px 12px', marginBottom:14 },
  emailText: { color:palette.text, fontSize:14, flex:1, fontFamily:'monospace' },
  copyBtn:   { background:palette.green, color:'#000', border:'none', borderRadius:8, padding:'6px 12px', fontSize:12, fontWeight:700, cursor:'pointer', flexShrink:0 },
  gmailBtn:  { display:'block', textAlign:'center', background:palette.greenSoft, color:palette.green, border:`1px solid ${palette.green}40`, borderRadius:10, padding:'12px', fontSize:14, fontWeight:600, textDecoration:'none', marginBottom:8 },
  mailBtn:   { display:'block', textAlign:'center', background:'#111', color:palette.muted, border:`1px solid ${palette.border}`, borderRadius:10, padding:'12px', fontSize:13, textDecoration:'none', marginBottom:14 },
  closeBtn:  { width:'100%', background:'transparent', color:'#555', border:'none', fontSize:13, cursor:'pointer', padding:'6px 0' },
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
      <AppFooter />
      <CookieBanner />
    </ErrorBoundary>
  );
}

const styles = {
  container:     { minHeight:'100vh', background:palette.bg, display:'flex', alignItems:'center', justifyContent:'center', padding:16, fontFamily:"'Inter', -apple-system, sans-serif" },
  card:          { background:palette.surface, borderRadius:18, padding:32, width:'100%', maxWidth:500, boxShadow:'0 24px 60px -10px rgba(0,0,0,0.6)', border:`1px solid ${palette.border}` },

  header:        { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 },
  title:         { color:'#fff', fontSize:28, fontWeight:700, margin:0 },
  subtitle:      { color:'#555', fontSize:14, marginTop:4, marginBottom:0 },
  historyBtn:    { background:'#111', border:'1px solid #222', color:'#666', borderRadius:8, padding:'8px 12px', fontSize:13, cursor:'pointer', flexShrink:0 },

  tabs:          { display:'flex', gap:8, marginBottom:24 },
  tab:           { flex:1, padding:'10px 0', background:'#111', color:'#555', border:'1px solid #222', borderRadius:8, fontSize:14, cursor:'pointer', fontWeight:500 },
  tabActive:     { background:palette.green, color:'#000', border:`1px solid ${palette.green}`, fontWeight:700 },

  dropzone:      { border:'2px dashed #2a2a2a', borderRadius:12, minHeight:200, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', overflow:'hidden', marginBottom:16 },
  placeholder:   { textAlign:'center', color:'#444' },
  dropText:      { color:'#444', fontSize:14, marginTop:8 },
  disclaimer:    { color:'#3a3a3a', fontSize:12, lineHeight:1.5, marginBottom:12, textAlign:'center' },
  preview:       { width:'100%', maxHeight:300, objectFit:'cover' },
  btn:           { width:'100%', padding:'14px 0', background:palette.green, color:'#fff', border:'none', borderRadius:10, fontSize:16, fontWeight:600, cursor:'pointer', marginBottom:16 },
  error:         { color:'#f44336', textAlign:'center', fontSize:14, marginBottom:12 },

  actionRow:        { display:'flex', gap:8, marginBottom:16 },
  actionBtn:        { flex:1, padding:'11px 0', background:palette.card, border:`1px solid ${palette.border}`, color:palette.muted, borderRadius:980, fontSize:13, fontWeight:500, cursor:'pointer' },
  actionBtnPrimary: { flex:2, background:palette.greenSoft, color:palette.green, border:`1px solid ${palette.green}40`, fontWeight:700, fontSize:14 },

  result:        { border:'2px solid', borderRadius:12, padding:20, marginTop:8 },
  resultImage:   { width:'100%', maxHeight:220, objectFit:'cover', borderRadius:8, marginBottom:16 },
  resultHeader:  { display:'flex', gap:16, alignItems:'center', marginBottom:16 },
  resultLabel:   { fontSize:22, fontWeight:700, margin:0 },
  resultConf:    { color:'#aaa', fontSize:14, margin:'4px 0 0' },
  lowConfWarning:{ color:'#f5a623', fontSize:12, margin:'6px 0 0', background:'#1a1200', border:'1px solid rgba(245,166,35,.2)', borderRadius:6, padding:'4px 8px', display:'inline-block' },
  qualityRow:    { display:'flex', alignItems:'center', gap:6, marginTop:4 },
  qualityDot:    { width:8, height:8, borderRadius:'50%', flexShrink:0 },
  resultQuality: { color:'#aaa', fontSize:13, margin:0 },

  thcRow:        { display:'flex', gap:8, marginBottom:16 },
  thcBox:        { flex:1, background:'#111', borderRadius:8, padding:12, textAlign:'center', border:'1px solid transparent', transition:'border-color 200ms cubic-bezier(.22,1,.36,1)' },
  thcBoxClickable:{ cursor:'pointer', userSelect:'none' },
  thcTitle:      { color:'#666', fontSize:12, margin:'0 0 4px' },
  thcValue:      { fontSize:28, fontWeight:700, margin:0 },
  thcRange:      { color:'#444', fontSize:12, margin:'4px 0 0' },
  thcExpandHint: { color:'#555', fontSize:11, margin:'6px 0 0', letterSpacing:'0.2px' },
  thcDetailWrap: { overflow:'hidden', transition:'max-height 280ms cubic-bezier(.22,1,.36,1), opacity 280ms cubic-bezier(.22,1,.36,1), margin 280ms cubic-bezier(.22,1,.36,1)' },
  thcDetailBox:  { background:'#0a0a0a', border:'1px solid', borderRadius:12, padding:'14px 16px' },
  thcDetailLowConf:{ color:'#f5a623', fontSize:12, margin:'0 0 12px', background:'#1a1200', border:'1px solid rgba(245,166,35,0.2)', borderRadius:6, padding:'6px 10px' },
  thcDetailSection:{ color:'#555', fontSize:10, fontWeight:700, letterSpacing:'0.8px', margin:'0 0 8px' },
  thcDetailList: { listStyle:'none', padding:0, margin:'0 0 14px' },
  thcDetailItem: { color:'#aaa', fontSize:13, margin:'0 0 5px', lineHeight:1.5 },
  thcDetailItemLabel:{ color:'#888' },
  thcDetailItemValue:{ fontWeight:700 },
  thcDetailItemSub:{ color:'#555', fontSize:12 },
  thcDetailText: { color:'#ccc', fontSize:13, margin:'0 0 14px', lineHeight:1.55 },
  thcDetailDisclaimer:{ color:'#555', fontSize:11, margin:0, fontStyle:'italic' },

  disclosureBtn:    { display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', padding:'14px 0', background:'transparent', border:'none', borderTop:'1px solid #1a1a1a', color:'#aaa', fontSize:14, fontWeight:500, cursor:'pointer', textAlign:'left', fontFamily:'inherit', letterSpacing:'-0.1px' },
  disclosureLabel:  { color:'#ccc' },
  disclosureChevron:{ color:'#555', fontSize:14, transition:'transform 250ms cubic-bezier(.22,1,.36,1)', display:'inline-block' },
  disclosureWrap:   { overflow:'hidden', transition:'max-height 250ms cubic-bezier(.22,1,.36,1), opacity 250ms cubic-bezier(.22,1,.36,1), margin 250ms cubic-bezier(.22,1,.36,1)' },
  disclosureInner:  { paddingTop:4 },

  description:   { color:'#888', fontSize:13, marginBottom:12, lineHeight:1.6 },
  sectionTitle:  { color:'#666', fontSize:11, fontWeight:600, margin:'12px 0 8px', textTransform:'uppercase', letterSpacing:0.5 },
  badgeRow:      { display:'flex', flexWrap:'wrap', gap:6, marginBottom:8 },
  badge:         { border:'1px solid', borderRadius:20, padding:'3px 10px', fontSize:12 },

  moderationBox: { background:'#1a0f00', borderRadius:10, padding:12, marginTop:8, marginBottom:8, border:'1px solid #FF9800' },
  moderationTitle:{ color:'#FF9800', fontSize:12, fontWeight:700, margin:'0 0 4px' },
  moderationText:{ color:'#aaa', fontSize:13, margin:0, lineHeight:1.5 },

  tipBox:        { background:'#0f1a0f', borderRadius:10, padding:12, marginBottom:8, border:'1px solid #2a4a2a' },
  tipText:       { color:'#8BC34A', fontSize:13, margin:0, lineHeight:1.5 },

  traitsGrid:    { display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 },
  traitBox:      { background:'#111', borderRadius:10, padding:12, textAlign:'center' },
  traitLabel:    { color:'#555', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:0.5, margin:'0 0 4px' },
  traitValue:    { color:'#ddd', fontSize:13, fontWeight:700, margin:'0 0 3px' },
  traitSub:      { color:'#444', fontSize:11, margin:0 },

  bars:          { display:'flex', flexDirection:'column', gap:8 },
  barRow:        { display:'flex', alignItems:'center', gap:8 },
  barLabel:      { color:'#666', fontSize:12, width:120, flexShrink:0 },
  barBg:         { flex:1, height:5, background:'#111', borderRadius:3, overflow:'hidden' },
  barFill:       { height:'100%', borderRadius:3, transition:'width 0.6s ease' },
  barVal:        { color:'#555', fontSize:12, width:40, textAlign:'right' },

  contributeInvite:    { marginTop:20, paddingTop:16, borderTop:'1px solid #222', textAlign:'center' },
  contributeInviteText:{ color:'#555', fontSize:13, margin:'0 0 8px' },
  contributeInviteBtn: { background:'none', border:'1px solid #333', color:'#888', borderRadius:8, padding:'8px 16px', fontSize:13, cursor:'pointer' },

  contributeInfo:     { background:'#111', borderRadius:8, padding:12, marginBottom:16 },
  contributeInfoText: { color:'#666', fontSize:13, margin:0, textAlign:'center', lineHeight:1.5 },
  labelTitle:         { color:'#666', fontSize:13, marginBottom:8 },
  labelGrid:          { display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 },
  labelBtn:           { padding:'10px 8px', background:'#111', border:'1px solid #222', borderRadius:8, color:'#555', fontSize:13, cursor:'pointer', textAlign:'center' },
  labelBtnActive:     { background:'#111', fontWeight:600 },

  successBox:    { textAlign:'center', padding:'24px 0' },
  successTitle:  { color:'#fff', fontSize:20, fontWeight:700, margin:'12px 0 4px' },
  successSub:    { color:'#555', fontSize:14, marginBottom:24 },

  topBar:        { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 },
  topTitle:      { color:'#fff', fontSize:18, fontWeight:700, margin:0 },
  backBtn:       { background:'none', border:'none', color:palette.green, fontSize:15, cursor:'pointer', padding:0 },
  clearBtn:      { background:'none', border:'none', color:'#f44336', fontSize:14, cursor:'pointer', padding:0 },
  historyItem:   { display:'flex', alignItems:'center', gap:12, background:'#111', borderRadius:12, padding:12, border:'1px solid', cursor:'pointer' },
  historyThumbWrap: { width:56, height:56, borderRadius:8, overflow:'hidden', flexShrink:0, background:'#222' },
  historyThumb:  { width:'100%', height:'100%', objectFit:'cover' },
  historyLabel:  { fontSize:15, fontWeight:600, margin:'0 0 3px' },
  historyConf:   { color:'#666', fontSize:12, margin:'0 0 3px' },
  historyDate:   { color:'#444', fontSize:11, margin:0 },
  historyArrow:  { color:'#333', fontSize:22, flexShrink:0 },

  modalOverlay:  { position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16, backdropFilter:'blur(8px)' },
  modalBox:      { background:palette.card, borderRadius:18, padding:20, width:'100%', maxWidth:420, border:`1px solid ${palette.border}` },
  modalTitle:    { color:palette.text, fontSize:16, fontWeight:700, margin:'0 0 14px', textAlign:'center', letterSpacing:'-0.2px' },
  modalImg:      { width:'100%', borderRadius:10, marginBottom:14, display:'block' },
  modalBtns:     { display:'flex', gap:8, alignItems:'center' },

  // Not detected state (label === 'other')
  notDetectedHeader:    { display:'flex', gap:14, alignItems:'center', marginBottom:18 },
  notDetectedTitle:     { color:palette.text, fontSize:20, fontWeight:700, margin:'0 0 4px', letterSpacing:'-0.3px' },
  notDetectedSub:       { color:palette.muted, fontSize:13, margin:0, lineHeight:1.5 },
  notDetectedTipsBox:   { background:palette.card, border:`1px solid ${palette.border}`, borderRadius:12, padding:'14px 16px', marginBottom:14 },
  notDetectedTipsTitle: { color:palette.text, fontSize:13, fontWeight:600, margin:'0 0 8px' },
  notDetectedTipsList:  { color:palette.muted, fontSize:13, lineHeight:1.7, paddingLeft:20, margin:0 },

  // Empty state
  empty:         { textAlign:'center', padding:'48px 24px' },
  emptyIcon:     { fontSize:48, marginBottom:18, opacity:0.6 },
  emptyTitle:    { color:palette.text, fontSize:17, fontWeight:600, margin:'0 0 8px', letterSpacing:'-0.2px' },
  emptyText:     { color:palette.muted, fontSize:13, lineHeight:1.6, margin:'0 0 24px' },
  emptyBtn:      { background:palette.greenSoft, color:palette.green, border:`1px solid ${palette.green}40`, borderRadius:980, padding:'10px 20px', fontSize:13, fontWeight:600, cursor:'pointer' },

  // Skeleton + loading
  btnLoading:    { display:'inline-flex', alignItems:'center', gap:10, justifyContent:'center', width:'100%' },
  spinner:       { width:14, height:14, borderRadius:'50%', border:'2px solid rgba(0,0,0,0.2)', borderTopColor:'#000', animation:'spin 0.7s linear infinite', display:'inline-block' },
  spinnerSm:     { width:12, height:12, borderRadius:'50%', border:`2px solid ${palette.green}33`, borderTopColor:palette.green, animation:'spin 0.7s linear infinite', display:'inline-block' },
  skeletonCard:  { background:palette.surface, border:`1px solid ${palette.border}`, borderRadius:14, padding:20, marginTop:8 },
  slowMsg:       { color:'#f5a623', fontSize:12, margin:'0 0 14px', background:'#1a1200', border:'1px solid rgba(245,166,35,0.2)', borderRadius:6, padding:'8px 10px', textAlign:'center' },

  // Error box (premium)
  errorBox:      { display:'flex', gap:12, alignItems:'flex-start', background:'rgba(244,67,54,0.08)', border:'1px solid rgba(244,67,54,0.25)', borderRadius:12, padding:'12px 14px', marginBottom:12 },
  errorTitle:    { color:palette.text, fontSize:13, margin:'0 0 6px', lineHeight:1.4 },
  errorRetry:    { background:'transparent', border:`1px solid ${palette.error}55`, color:palette.error, borderRadius:980, padding:'4px 12px', fontSize:12, fontWeight:600, cursor:'pointer' },
};

// Inject keyframes for spinner (shimmer is in index.css)
if (typeof document !== 'undefined' && !document.getElementById('trichai-keyframes')) {
  const s = document.createElement('style');
  s.id = 'trichai-keyframes';
  s.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
  document.head.appendChild(s);
}
