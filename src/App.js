import { useState, useRef, useEffect } from 'react';

const API = 'https://phytolens-backend-production.up.railway.app';

const LABELS = {
  bud:   { emoji: '🌿', color: '#4CAF50', text: 'Cogollo seco' },
  hash:  { emoji: '🟤', color: '#795548', text: 'Hachís / Resina' },
  other: { emoji: '🔵', color: '#2196F3', text: 'Otro producto' },
  plant: { emoji: '🌱', color: '#8BC34A', text: 'Planta viva' },
};

const EXTRA_INFO = {
  bud: {
    effects:     ['Euforia', 'Relajación', 'Creatividad', 'Hambre'],
    aroma:       ['Terroso', 'Cítrico', 'Pino', 'Dulce'],
    consumption: ['Pipa', 'Porro', 'Vaporizador', 'Bong'],
    moderation:  'Empieza con dosis baja. Espera 15 min antes de repetir.',
    tip:         '💡 El vaporizador preserva mejor los terpenos y reduce el daño pulmonar.',
    cbd:         '0.1% — 2%',
  },
  hash: {
    effects:     ['Relajación profunda', 'Sedación', 'Analgesia', 'Euforia suave'],
    aroma:       ['Terroso', 'Especiado', 'Dulce', 'Madera'],
    consumption: ['Porro mezclado', 'Pipa', 'Hookah', 'Dab'],
    moderation:  'Alta concentración. Usa cantidades muy pequeñas si eres principiante.',
    tip:         '💡 El hash marroquí suele tener entre 20-35% THC. El bubble hash puede superar el 50%.',
    cbd:         '1% — 5%',
  },
  other: {
    effects:     ['Variable según producto', 'Puede ser muy potente'],
    aroma:       ['Variable'],
    consumption: ['Dab', 'Vaporizador', 'Oral'],
    moderation:  'Los extractos son muy concentrados. Dosis mínimas para empezar.',
    tip:         '💡 El rosin es el extracto más natural: solo presión y calor, sin solventes.',
    cbd:         'Variable',
  },
  plant: {
    effects:     ['Depende de variedad y fase'],
    aroma:       ['Verde', 'Herbáceo', 'Floral'],
    consumption: ['No aplica en esta fase'],
    moderation:  'Planta en crecimiento. El THC se desarrolla en floración.',
    tip:         '💡 Las plantas en pre-cosecha tienen los tricomas más visibles y potentes.',
    cbd:         'Depende de variedad',
  },
};

function loadHistory() {
  try { return JSON.parse(localStorage.getItem('trichai_history') || '[]'); }
  catch { return []; }
}

function saveHistory(h) {
  try { localStorage.setItem('trichai_history', JSON.stringify(h)); } catch {}
}

function ResultCard({ result, imagePreview, cfg, extra, compact = false }) {
  const conf = result.confidence * 100;
  return (
    <div style={{...styles.result, borderColor: cfg.color}}>
      {imagePreview && <img src={imagePreview} alt="preview" style={styles.resultImage} />}

      <div style={styles.resultHeader}>
        <span style={{fontSize: 40}}>{cfg.emoji}</span>
        <div>
          <p style={{...styles.resultLabel, color: cfg.color}}>{result.display}</p>
          <p style={styles.resultConf}>Confianza: {conf.toFixed(1)}%</p>
          <div style={styles.qualityRow}>
            <div style={{...styles.qualityDot, background: conf >= 85 ? '#4CAF50' : conf >= 65 ? '#FF9800' : '#f44336'}}/>
            <p style={styles.resultQuality}>Calidad: {result.quality}</p>
          </div>
        </div>
      </div>

      <div style={styles.thcRow}>
        <div style={styles.thcBox}>
          <p style={styles.thcTitle}>THC estimado</p>
          <p style={{...styles.thcValue, color: cfg.color}}>{result.thc_estimate}%</p>
          <p style={styles.thcRange}>{result.thc_min}% — {result.thc_max}%</p>
        </div>
        <div style={styles.thcBox}>
          <p style={styles.thcTitle}>CBD típico</p>
          <p style={{...styles.thcValue, color: '#aaa', fontSize: 16, paddingTop: 6}}>{extra.cbd}</p>
        </div>
      </div>

      <p style={styles.description}>{result.description}</p>

      {!compact && (
        <>
          <p style={styles.sectionTitle}>⚡ Efectos</p>
          <div style={styles.badgeRow}>
            {extra.effects.map(e => <span key={e} style={{...styles.badge, borderColor: cfg.color, color: cfg.color}}>{e}</span>)}
          </div>

          <p style={styles.sectionTitle}>👃 Aroma</p>
          <div style={styles.badgeRow}>
            {extra.aroma.map(a => <span key={a} style={{...styles.badge, borderColor: '#555', color: '#888'}}>{a}</span>)}
          </div>

          <p style={styles.sectionTitle}>🔥 Consumo</p>
          <div style={styles.badgeRow}>
            {extra.consumption.map(c => <span key={c} style={{...styles.badge, borderColor: '#444', color: '#666'}}>{c}</span>)}
          </div>

          <div style={styles.moderationBox}>
            <p style={styles.moderationTitle}>⚠️ Moderación</p>
            <p style={styles.moderationText}>{extra.moderation}</p>
          </div>

          <div style={styles.tipBox}>
            <p style={styles.tipText}>{extra.tip}</p>
          </div>

          <p style={styles.sectionTitle}>🌱 Variedades comunes</p>
          <div style={styles.badgeRow}>
            {result.varieties.map(v => <span key={v} style={{...styles.badge, borderColor: cfg.color, color: cfg.color}}>{v}</span>)}
          </div>

          <p style={styles.sectionTitle}>📊 Análisis completo</p>
          <div style={styles.bars}>
            {Object.entries(result.all_probs).map(([key, val]) => (
              <div key={key} style={styles.barRow}>
                <span style={styles.barLabel}>{LABELS[key].emoji} {LABELS[key].text}</span>
                <div style={styles.barBg}><div style={{...styles.barFill, width: `${(val * 100).toFixed(0)}%`, background: LABELS[key].color}}/></div>
                <span style={styles.barVal}>{(val * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function App() {
  const [image, setImage]               = useState(null);
  const [preview, setPreview]           = useState(null);
  const [result, setResult]             = useState(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  const [mode, setMode]                 = useState('analyze');
  const [contribLabel, setContribLabel] = useState('');
  const [contribSent, setContribSent]   = useState(false);
  const [contribLoading, setContribLoading] = useState(false);
  const [history, setHistory]           = useState(loadHistory);
  const [historyOpen, setHistoryOpen]   = useState(false);
  const [expandedHistory, setExpandedHistory] = useState(null);
  const [copied, setCopied]             = useState(false);
  const inputRef   = useRef();
  const contribRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError(null);
    setContribSent(false);
  };

  const analyze = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', image);
      const res  = await fetch(`${API}/analyze`, { method: 'POST', body: form });
      const data = await res.json();
      if (data.success) {
        setResult(data.result);
        // save to history with image as base64
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
      }
    } catch {
      setError('No se puede conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const contribute = async () => {
    if (!image || !contribLabel) return;
    setContribLoading(true);
    try {
      const form = new FormData();
      form.append('file', image);
      form.append('label', contribLabel);
      await fetch(`${API}/contribute`, { method: 'POST', body: form }).catch(() => {});
      setContribSent(true);
    } finally {
      setContribLoading(false);
    }
  };

  const reset = () => {
    setImage(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setContribSent(false);
    setContribLabel('');
  };

  const clearHistory = () => {
    setHistory([]);
    saveHistory([]);
    setHistoryOpen(false);
    setExpandedHistory(null);
  };

  const copyResult = () => {
    if (!result) return;
    const cfg   = LABELS[result.label];
    const extra = EXTRA_INFO[result.label];
    const text = [
      `🔬 TrichAI — Resultado`,
      `Categoría: ${result.display}`,
      `Confianza: ${(result.confidence * 100).toFixed(1)}%`,
      `THC estimado: ${result.thc_estimate}% (${result.thc_min}%–${result.thc_max}%)`,
      `CBD típico: ${extra.cbd}`,
      `Efectos: ${extra.effects.join(', ')}`,
      `Variedades: ${result.varieties.join(', ')}`,
    ].join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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
            <p style={{color:'#444', textAlign:'center', marginTop:40}}>No hay análisis todavía.</p>
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
              {preview
                ? <img src={preview} alt="preview" style={styles.preview} />
                : <div style={styles.placeholder}>
                    <span style={{fontSize:48}}>📷</span>
                    <p style={styles.dropText}>Haz clic o arrastra una foto aquí</p>
                  </div>
              }
            </div>
            <input ref={inputRef} type="file" accept="image/*" style={{display:'none'}} onChange={e => handleFile(e.target.files[0])} />

            <button style={{...styles.btn, opacity:(!image||loading)?0.5:1}} onClick={analyze} disabled={!image||loading}>
              {loading ? '🔍 Analizando...' : 'Analizar imagen'}
            </button>
            {error && <p style={styles.error}>{error}</p>}

            {result && cfg && extra && (
              <>
                {/* Action buttons */}
                <div style={styles.actionRow}>
                  <button style={styles.actionBtn} onClick={copyResult}>
                    {copied ? '✅ Copiado' : '📋 Copiar resultado'}
                  </button>
                  <button style={styles.actionBtn} onClick={reset}>
                    🔄 Nueva foto
                  </button>
                </div>

                <ResultCard result={result} imagePreview={preview} cfg={cfg} extra={extra} />

                <div style={styles.contributeInvite}>
                  <p style={styles.contributeInviteText}>¿El resultado no es correcto?</p>
                  <button style={styles.contributeInviteBtn} onClick={() => setMode('contribute')}>Corrígelo y mejora la IA →</button>
                </div>
              </>
            )}
          </>
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
                  {Object.entries(LABELS).map(([key, val]) => (
                    <button key={key} style={{...styles.labelBtn, ...(contribLabel === key ? {...styles.labelBtnActive, borderColor:val.color, color:val.color} : {})}} onClick={() => setContribLabel(key)}>
                      {val.emoji} {val.text}
                    </button>
                  ))}
                </div>
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

const styles = {
  container:     { minHeight:'100vh', background:'#0D0D0D', display:'flex', alignItems:'center', justifyContent:'center', padding:16 },
  card:          { background:'#1A1A1A', borderRadius:16, padding:32, width:'100%', maxWidth:500, boxShadow:'0 4px 32px rgba(0,0,0,0.5)' },

  header:        { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 },
  title:         { color:'#fff', fontSize:28, fontWeight:700, margin:0 },
  subtitle:      { color:'#555', fontSize:14, marginTop:4, marginBottom:0 },
  historyBtn:    { background:'#111', border:'1px solid #222', color:'#666', borderRadius:8, padding:'8px 12px', fontSize:13, cursor:'pointer', flexShrink:0 },

  tabs:          { display:'flex', gap:8, marginBottom:24 },
  tab:           { flex:1, padding:'10px 0', background:'#111', color:'#555', border:'1px solid #222', borderRadius:8, fontSize:14, cursor:'pointer', fontWeight:500 },
  tabActive:     { background:'#4CAF50', color:'#fff', border:'1px solid #4CAF50' },

  dropzone:      { border:'2px dashed #2a2a2a', borderRadius:12, minHeight:200, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', overflow:'hidden', marginBottom:16 },
  placeholder:   { textAlign:'center', color:'#444' },
  dropText:      { color:'#444', fontSize:14, marginTop:8 },
  preview:       { width:'100%', maxHeight:300, objectFit:'cover' },
  btn:           { width:'100%', padding:'14px 0', background:'#4CAF50', color:'#fff', border:'none', borderRadius:10, fontSize:16, fontWeight:600, cursor:'pointer', marginBottom:16 },
  error:         { color:'#f44336', textAlign:'center', fontSize:14 },

  actionRow:     { display:'flex', gap:8, marginBottom:16 },
  actionBtn:     { flex:1, padding:'9px 0', background:'#111', border:'1px solid #222', color:'#888', borderRadius:8, fontSize:13, cursor:'pointer' },

  result:        { border:'2px solid', borderRadius:12, padding:20, marginTop:8 },
  resultImage:   { width:'100%', maxHeight:220, objectFit:'cover', borderRadius:8, marginBottom:16 },
  resultHeader:  { display:'flex', gap:16, alignItems:'center', marginBottom:16 },
  resultLabel:   { fontSize:22, fontWeight:700, margin:0 },
  resultConf:    { color:'#aaa', fontSize:14, margin:'4px 0 0' },
  qualityRow:    { display:'flex', alignItems:'center', gap:6, marginTop:4 },
  qualityDot:    { width:8, height:8, borderRadius:'50%', flexShrink:0 },
  resultQuality: { color:'#aaa', fontSize:13, margin:0 },

  thcRow:        { display:'flex', gap:8, marginBottom:16 },
  thcBox:        { flex:1, background:'#111', borderRadius:8, padding:12, textAlign:'center' },
  thcTitle:      { color:'#666', fontSize:12, margin:'0 0 4px' },
  thcValue:      { fontSize:28, fontWeight:700, margin:0 },
  thcRange:      { color:'#444', fontSize:12, margin:'4px 0 0' },

  description:   { color:'#888', fontSize:13, marginBottom:12, lineHeight:1.6 },
  sectionTitle:  { color:'#666', fontSize:11, fontWeight:600, margin:'12px 0 8px', textTransform:'uppercase', letterSpacing:0.5 },
  badgeRow:      { display:'flex', flexWrap:'wrap', gap:6, marginBottom:8 },
  badge:         { border:'1px solid', borderRadius:20, padding:'3px 10px', fontSize:12 },

  moderationBox: { background:'#1a0f00', borderRadius:10, padding:12, marginTop:8, marginBottom:8, border:'1px solid #FF9800' },
  moderationTitle:{ color:'#FF9800', fontSize:12, fontWeight:700, margin:'0 0 4px' },
  moderationText:{ color:'#aaa', fontSize:13, margin:0, lineHeight:1.5 },

  tipBox:        { background:'#0f1a0f', borderRadius:10, padding:12, marginBottom:8, border:'1px solid #2a4a2a' },
  tipText:       { color:'#8BC34A', fontSize:13, margin:0, lineHeight:1.5 },

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

  // History view
  topBar:        { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 },
  topTitle:      { color:'#fff', fontSize:18, fontWeight:700, margin:0 },
  backBtn:       { background:'none', border:'none', color:'#4CAF50', fontSize:15, cursor:'pointer', padding:0 },
  clearBtn:      { background:'none', border:'none', color:'#f44336', fontSize:14, cursor:'pointer', padding:0 },
  historyItem:   { display:'flex', alignItems:'center', gap:12, background:'#111', borderRadius:12, padding:12, border:'1px solid', cursor:'pointer' },
  historyThumbWrap: { width:56, height:56, borderRadius:8, overflow:'hidden', flexShrink:0, background:'#222' },
  historyThumb:  { width:'100%', height:'100%', objectFit:'cover' },
  historyLabel:  { fontSize:15, fontWeight:600, margin:'0 0 3px' },
  historyConf:   { color:'#666', fontSize:12, margin:'0 0 3px' },
  historyDate:   { color:'#444', fontSize:11, margin:0 },
  historyArrow:  { color:'#333', fontSize:22, flexShrink:0 },
};
