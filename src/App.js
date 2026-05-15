import { useState, useRef, useEffect, useCallback } from 'react';
import { LABELS, EXTRA_INFO, CONTRIB_LABELS } from './shared/labels';
import { palette } from './shared/theme';
import { compressImage } from './utils/imageCompress';
import { loadHistory, saveHistory } from './utils/historyStorage';
import { shareResult } from './utils/shareCard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ResultCard } from './components/ResultCard';
import { HistoryView } from './components/HistoryView';
import { CookieBanner } from './components/CookieBanner';
import { AppFooter } from './components/AppFooter';

const API = 'https://phytolens-backend-production.up.railway.app';

// Fire GA only when user accepted analytics. Consent is gated at window.gtag init.
function track(eventName, params = {}) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    try { window.gtag('event', eventName, params); } catch {}
  }
}

const SESSION_ANALYSES_KEY = 'trichai_session_analyses';
const FIRST_ANALYSIS_KEY   = 'trichai_first_analysis_done';

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
  const [sharing, setSharing]           = useState(false);
  const [sharePreview, setSharePreview] = useState(null);
  const inputRef    = useRef();
  const contribRef  = useRef();
  const prevPreview = useRef(null);

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
    if (prevPreview.current) URL.revokeObjectURL(prevPreview.current);
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
    const slowId     = setTimeout(() => setSlowLoading(true), 4000);
    const timeoutId  = setTimeout(() => controller.abort(), 12000);
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
    } catch {
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
  };

  const cfg   = result ? LABELS[result.label] : null;
  const extra = result ? EXTRA_INFO[result.label] : null;

  if (historyOpen) {
    return <HistoryView history={history} onClose={() => setHistoryOpen(false)} onClear={clearHistory} />;
  }

  return (
    <div style={s.container}>
      <div style={s.card}>
        <div style={s.header}>
          <div>
            <h1 style={s.title}>🔬 TrichAI</h1>
            <p style={s.subtitle}>Identificación inteligente de cannabis</p>
          </div>
          {history.length > 0 && (
            <button style={s.historyBtn} onClick={() => setHistoryOpen(true)}>📋 {history.length}</button>
          )}
        </div>

        <div style={s.tabs}>
          <button style={{...s.tab, ...(mode === 'analyze' ? s.tabActive : {})}} onClick={() => { setMode('analyze'); reset(); }}>Analizar</button>
          <button style={{...s.tab, ...(mode === 'contribute' ? s.tabActive : {})}} onClick={() => { setMode('contribute'); reset(); }}>Contribuir foto</button>
        </div>

        {mode === 'analyze' && (
          <>
            <div style={s.dropzone} onClick={() => inputRef.current.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}>
              {(preview && !result)
                ? <img src={preview} alt="preview" style={s.preview} />
                : <div style={s.placeholder}>
                    <span style={{fontSize:48}}>📷</span>
                    <p style={s.dropText}>Haz clic o arrastra una foto aquí</p>
                  </div>
              }
            </div>
            <input ref={inputRef} type="file" accept="image/*" style={{display:'none'}} onChange={e => handleFile(e.target.files[0])} />

            <p style={s.disclaimer}>Herramienta informativa. Los resultados son estimaciones de IA, no sustituyen análisis de laboratorio. Solo mayores de edad donde el cannabis sea legal. <a href="/terms.html" style={{color:palette.green}}>Términos</a></p>
            <button style={{...s.btn, opacity:(!image||loading)?0.6:1, cursor:(!image||loading)?'not-allowed':'pointer'}} onClick={analyze} disabled={!image||loading}>
              {loading ? <span style={s.btnLoading}><span style={s.spinner}/>Analizando con IA…</span> : 'Analizar imagen'}
            </button>
            {loading && (
              <div style={s.skeletonCard}>
                {slowLoading && (
                  <p style={s.slowMsg}>El servidor está despertando, esto puede tardar unos segundos…</p>
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
              <div style={s.errorBox}>
                <AlertCircle size={20} strokeWidth={2} color={palette.error} style={{flexShrink:0, marginTop:1}} />
                <div>
                  <p style={s.errorTitle}>{error}</p>
                  <button style={s.errorRetry} onClick={analyze} disabled={!image||loading}>Reintentar</button>
                </div>
              </div>
            )}

            {result && cfg && extra && (
              <>
                {result.label !== 'other' && (
                  <div style={s.actionRow}>
                    <button
                      style={{...s.actionBtn, ...s.actionBtnPrimary}}
                      onClick={async () => {
                        track('result_shared', { label: result.label, surface: 'preview_card' });
                        setSharing(true);
                        await shareResult(result, cfg, extra, preview, setSharePreview);
                        setSharing(false);
                      }}
                      disabled={sharing}
                    >
                      {sharing ? <span style={s.btnLoading}><span style={s.spinnerSm}/>Generando…</span> : '↑ Compartir resultado'}
                    </button>
                    <button style={s.actionBtn} onClick={reset}>🔄 Nueva foto</button>
                  </div>
                )}

                <ResultCard result={result} imagePreview={preview} cfg={cfg} extra={extra} onRetry={reset} />

                {result.label !== 'other' && (
                  <div style={s.contributeInvite}>
                    <p style={s.contributeInviteText}>¿El resultado no es correcto?</p>
                    <button style={s.contributeInviteBtn} onClick={() => setMode('contribute')}>Corrígelo y mejora la IA →</button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {sharePreview && (
          <div style={s.modalOverlay} onClick={() => setSharePreview(null)}>
            <div style={s.modalBox} onClick={e => e.stopPropagation()}>
              <p style={s.modalTitle}>Vista previa</p>
              <img src={sharePreview} alt="share preview" style={s.modalImg} />
              <div style={s.modalBtns}>
                <button style={{...s.btn, marginBottom:0, flex:1}} onClick={async () => {
                  const res = await fetch(sharePreview);
                  const blob = await res.blob();
                  const file = new File([blob], 'trichai.png', { type: 'image/png' });




                  const text = `${result.display} · THC ${result.thc_estimate}% · Confianza ${(result.confidence * 100).toFixed(0)}%\n\nhttps://trichai.xyz`;
                  if (navigator.share && navigator.canShare?.({ files: [file] })) {
                    try { await navigator.share({ title: `TrichAI — ${result.display}`, text, files: [file] }); setSharePreview(null); return; } catch {}
                  }
                  const a = document.createElement('a');
                  a.download = 'trichai-resultado.png'; a.href = sharePreview; a.click();
                  setSharePreview(null);
                }}>↑ Compartir / Descargar</button>
                <button style={{...s.actionBtn, flex:0.4}} onClick={() => setSharePreview(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        )}

        {mode === 'contribute' && (
          <>
            <div style={s.contributeInfo}>
              <p style={s.contributeInfoText}>Cada foto que subas entrena la IA y la hace más precisa para todos.</p>
            </div>

            {contribSent ? (
              <div style={s.successBox}>
                <CheckCircle2 size={56} strokeWidth={1.5} color={palette.green} style={{display:'block', margin:'0 auto 16px'}} />
                <p style={s.successTitle}>¡Gracias por contribuir!</p>
                <p style={s.successSub}>Tu foto ayuda a mejorar TrichAI.</p>
                <button style={s.btn} onClick={reset}>Contribuir otra</button>
              </div>
            ) : (
              <>
                <div style={s.dropzone} onClick={() => contribRef.current.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}>
                  {preview
                    ? <img src={preview} alt="preview" style={s.preview} />
                    : <div style={s.placeholder}><Camera size={44} strokeWidth={1.5} color={palette.dim} /><p style={s.dropText}>Sube tu foto aquí</p></div>
                  }
                </div>
                <input ref={contribRef} type="file" accept="image/*" style={{display:'none'}} onChange={e => handleFile(e.target.files[0])} />
                <p style={s.labelTitle}>¿Qué hay en la foto?</p>
                <div style={s.labelGrid}>
                  {Object.entries(CONTRIB_LABELS).map(([key, val]) => (
                    <button key={key} style={{...s.labelBtn, ...(contribLabel === key ? {...s.labelBtnActive, borderColor:val.color, color:val.color} : {})}} onClick={() => setContribLabel(key)} title={val.help}>
                      <span style={{display:'block', fontSize:18, marginBottom:2}}>{val.emoji}</span>
                      <span style={{display:'block', fontWeight:600, fontSize:13, lineHeight:1.2}}>{val.text}</span>
                      <span style={{display:'block', fontSize:11, color:palette.dim, marginTop:3}}>{val.help}</span>
                    </button>
                  ))}
                </div>
                {contribError && <p style={s.error}>{contribError}</p>}
                <button style={{...s.btn, opacity:(!image||!contribLabel||contribLoading)?0.5:1}} onClick={contribute} disabled={!image||!contribLabel||contribLoading}>
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

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
      <AppFooter />
      <CookieBanner />
    </ErrorBoundary>
  );
}

const s = {
  container:     { minHeight:'100vh', background:palette.bg, display:'flex', alignItems:'center', justifyContent:'center', padding:16, fontFamily:"'Inter', -apple-system, sans-serif" },
  card:          { background:palette.surface, borderRadius:18, padding:32, width:'100%', maxWidth:500, boxShadow:'0 24px 60px -10px rgba(0,0,0,0.6)', border:`1px solid ${palette.border}` },

  header:        { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 },
  title:         { color:'#fff', fontSize:28, fontWeight:700, margin:0 },
  subtitle:      { color:'#555', fontSize:14, marginTop:4, marginBottom:0 },
  historyBtn:    { background:palette.card, border:`1px solid ${palette.border}`, color:palette.muted, borderRadius:8, padding:'8px 12px', fontSize:13, cursor:'pointer', flexShrink:0 },

  tabs:          { display:'flex', gap:8, marginBottom:24 },
  tab:           { flex:1, padding:'10px 0', background:palette.card, color:palette.muted, border:`1px solid ${palette.border}`, borderRadius:8, fontSize:14, cursor:'pointer', fontWeight:500 },
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

  contributeInvite:    { marginTop:20, paddingTop:16, borderTop:'1px solid #222', textAlign:'center' },
  contributeInviteText:{ color:'#555', fontSize:13, margin:'0 0 8px' },
  contributeInviteBtn: { background:'none', border:'1px solid #333', color:'#888', borderRadius:8, padding:'8px 16px', fontSize:13, cursor:'pointer' },

  contributeInfo:     { background:palette.card, borderRadius:8, padding:12, marginBottom:16 },
  contributeInfoText: { color:'#666', fontSize:13, margin:0, textAlign:'center', lineHeight:1.5 },
  labelTitle:         { color:'#666', fontSize:13, marginBottom:8 },
  labelGrid:          { display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 },
  labelBtn:           { padding:'10px 8px', background:palette.card, border:`1px solid ${palette.border}`, borderRadius:8, color:palette.muted, fontSize:13, cursor:'pointer', textAlign:'center' },
  labelBtnActive:     { background:palette.card, fontWeight:600 },

  successBox:    { textAlign:'center', padding:'24px 0' },
  successTitle:  { color:'#fff', fontSize:20, fontWeight:700, margin:'12px 0 4px' },
  successSub:    { color:'#555', fontSize:14, marginBottom:24 },

  modalOverlay:  { position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16, backdropFilter:'blur(8px)' },
  modalBox:      { background:palette.card, borderRadius:18, padding:20, width:'100%', maxWidth:420, border:`1px solid ${palette.border}` },
  modalTitle:    { color:palette.text, fontSize:16, fontWeight:700, margin:'0 0 14px', textAlign:'center', letterSpacing:'-0.2px' },
  modalImg:      { width:'100%', borderRadius:10, marginBottom:14, display:'block' },
  modalBtns:     { display:'flex', gap:8, alignItems:'center' },

  btnLoading:    { display:'inline-flex', alignItems:'center', gap:10, justifyContent:'center', width:'100%' },
  spinner:       { width:14, height:14, borderRadius:'50%', border:'2px solid rgba(0,0,0,0.2)', borderTopColor:'#000', animation:'spin 0.7s linear infinite', display:'inline-block' },
  spinnerSm:     { width:12, height:12, borderRadius:'50%', border:`2px solid ${palette.green}33`, borderTopColor:palette.green, animation:'spin 0.7s linear infinite', display:'inline-block' },
  skeletonCard:  { background:palette.surface, border:`1px solid ${palette.border}`, borderRadius:14, padding:20, marginTop:8 },
  slowMsg:       { color:'#f5a623', fontSize:12, margin:'0 0 14px', background:'#1a1200', border:'1px solid rgba(245,166,35,0.2)', borderRadius:6, padding:'8px 10px', textAlign:'center' },

  errorBox:      { display:'flex', gap:12, alignItems:'flex-start', background:'rgba(244,67,54,0.08)', border:'1px solid rgba(244,67,54,0.25)', borderRadius:12, padding:'12px 14px', marginBottom:12 },
  errorTitle:    { color:palette.text, fontSize:13, margin:'0 0 6px', lineHeight:1.4 },
  errorRetry:    { background:'transparent', border:`1px solid ${palette.error}55`, color:palette.error, borderRadius:980, padding:'4px 12px', fontSize:12, fontWeight:600, cursor:'pointer' },
};

// Inject @keyframes for spinner (shimmer is in index.css)
if (typeof document !== 'undefined' && !document.getElementById('trichai-keyframes')) {
  const tag = document.createElement('style');
  tag.id = 'trichai-keyframes';
  tag.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
  document.head.appendChild(tag);
}
