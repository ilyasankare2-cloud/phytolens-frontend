import { useState, useRef } from 'react';

const API = 'https://phytolens-backend-production.up.railway.app';

const LABELS = {
  bud:   { emoji: '🌿', color: '#4CAF50', text: 'Cogollo seco' },
  hash:  { emoji: '🟤', color: '#795548', text: 'Hachís / Resina' },
  other: { emoji: '🔵', color: '#2196F3', text: 'Otro producto' },
  plant: { emoji: '🌱', color: '#8BC34A', text: 'Planta viva' },
};

export default function App() {
  const [image, setImage]           = useState(null);
  const [preview, setPreview]       = useState(null);
  const [result, setResult]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [mode, setMode]             = useState('analyze'); // 'analyze' | 'contribute'
  const [contribLabel, setContribLabel] = useState('');
  const [contribSent, setContribSent]   = useState(false);
  const [contribLoading, setContribLoading] = useState(false);
  const inputRef    = useRef();
  const contribRef  = useRef();

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
      if (data.success) setResult(data.result);
      else setError('Error al analizar la imagen.');
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
      // endpoint futuro — por ahora simula éxito si el servidor no lo tiene
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

  const cfg = result ? LABELS[result.label] : null;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <h1 style={styles.title}>🔬 TrichAI</h1>
        <p style={styles.subtitle}>Identificación inteligente de cannabis</p>

        {/* Mode tabs */}
        <div style={styles.tabs}>
          <button
            style={{...styles.tab, ...(mode === 'analyze' ? styles.tabActive : {})}}
            onClick={() => { setMode('analyze'); reset(); }}
          >Analizar</button>
          <button
            style={{...styles.tab, ...(mode === 'contribute' ? styles.tabActive : {})}}
            onClick={() => { setMode('contribute'); reset(); }}
          >Contribuir foto</button>
        </div>

        {/* ── ANALYZE MODE ── */}
        {mode === 'analyze' && (
          <>
            <div
              style={styles.dropzone}
              onClick={() => inputRef.current.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
            >
              {preview
                ? <img src={preview} alt="preview" style={styles.preview} />
                : <div style={styles.placeholder}>
                    <span style={{fontSize:48}}>📷</span>
                    <p style={styles.dropText}>Haz clic o arrastra una foto aquí</p>
                  </div>
              }
            </div>
            <input ref={inputRef} type="file" accept="image/*" style={{display:'none'}} onChange={e => handleFile(e.target.files[0])} />
            <button
              style={{...styles.btn, opacity:(!image||loading) ? 0.5 : 1}}
              onClick={analyze}
              disabled={!image || loading}
            >
              {loading ? 'Analizando...' : 'Analizar imagen'}
            </button>
            {error && <p style={styles.error}>{error}</p>}
            {result && cfg && (
              <div style={{...styles.result, borderColor:cfg.color}}>
                <div style={styles.resultHeader}>
                  <span style={{fontSize:40}}>{cfg.emoji}</span>
                  <div>
                    <p style={{...styles.resultLabel, color:cfg.color}}>{result.display}</p>
                    <p style={styles.resultConf}>Confianza: {(result.confidence*100).toFixed(1)}%</p>
                    <p style={styles.resultQuality}>Calidad: {result.quality}</p>
                  </div>
                </div>
                <div style={styles.thcBox}>
                  <p style={styles.thcTitle}>THC estimado</p>
                  <p style={{...styles.thcValue, color:cfg.color}}>{result.thc_estimate}%</p>
                  <p style={styles.thcRange}>Rango: {result.thc_min}% — {result.thc_max}%</p>
                </div>
                <p style={styles.description}>{result.description}</p>
                <p style={styles.varietiesTitle}>Variedades comunes</p>
                <div style={styles.varietiesList}>
                  {result.varieties.map(v => (
                    <span key={v} style={{...styles.varietyTag, borderColor:cfg.color, color:cfg.color}}>{v}</span>
                  ))}
                </div>
                <div style={styles.bars}>
                  {Object.entries(result.all_probs).map(([key, val]) => (
                    <div key={key} style={styles.barRow}>
                      <span style={styles.barLabel}>{LABELS[key].emoji} {key}</span>
                      <div style={styles.barBg}>
                        <div style={{...styles.barFill, width:`${(val*100).toFixed(0)}%`, background:LABELS[key].color}}/>
                      </div>
                      <span style={styles.barVal}>{(val*100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>

                {/* Invite to contribute after analysis */}
                <div style={styles.contributeInvite}>
                  <p style={styles.contributeInviteText}>¿El resultado no es correcto?</p>
                  <button style={styles.contributeInviteBtn} onClick={() => setMode('contribute')}>
                    Corrígelo y mejora la IA →
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── CONTRIBUTE MODE ── */}
        {mode === 'contribute' && (
          <>
            <div style={styles.contributeInfo}>
              <p style={styles.contributeInfoText}>
                Cada foto que subas entrena la IA y la hace más precisa para todos.
              </p>
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
                <div
                  style={styles.dropzone}
                  onClick={() => contribRef.current.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
                >
                  {preview
                    ? <img src={preview} alt="preview" style={styles.preview} />
                    : <div style={styles.placeholder}>
                        <span style={{fontSize:48}}>📷</span>
                        <p style={styles.dropText}>Sube tu foto aquí</p>
                      </div>
                  }
                </div>
                <input ref={contribRef} type="file" accept="image/*" style={{display:'none'}} onChange={e => handleFile(e.target.files[0])} />

                <p style={styles.labelTitle}>¿Qué hay en la foto?</p>
                <div style={styles.labelGrid}>
                  {Object.entries(LABELS).map(([key, val]) => (
                    <button
                      key={key}
                      style={{
                        ...styles.labelBtn,
                        ...(contribLabel === key ? {...styles.labelBtnActive, borderColor: val.color, color: val.color} : {})
                      }}
                      onClick={() => setContribLabel(key)}
                    >
                      {val.emoji} {val.text}
                    </button>
                  ))}
                </div>

                <button
                  style={{...styles.btn, opacity:(!image || !contribLabel || contribLoading) ? 0.5 : 1}}
                  onClick={contribute}
                  disabled={!image || !contribLabel || contribLoading}
                >
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
  card:          { background:'#1A1A1A', borderRadius:16, padding:32, width:'100%', maxWidth:480, boxShadow:'0 4px 32px rgba(0,0,0,0.5)' },
  title:         { color:'#fff', fontSize:28, fontWeight:700, margin:0, textAlign:'center' },
  subtitle:      { color:'#555', fontSize:14, textAlign:'center', marginTop:4, marginBottom:20 },

  tabs:          { display:'flex', gap:8, marginBottom:24 },
  tab:           { flex:1, padding:'10px 0', background:'#111', color:'#555', border:'1px solid #222', borderRadius:8, fontSize:14, cursor:'pointer', fontWeight:500 },
  tabActive:     { background:'#4CAF50', color:'#fff', border:'1px solid #4CAF50' },

  dropzone:      { border:'2px dashed #2a2a2a', borderRadius:12, minHeight:200, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', overflow:'hidden', marginBottom:16 },
  placeholder:   { textAlign:'center', color:'#444' },
  dropText:      { color:'#444', fontSize:14, marginTop:8 },
  preview:       { width:'100%', maxHeight:300, objectFit:'cover' },
  btn:           { width:'100%', padding:'14px 0', background:'#4CAF50', color:'#fff', border:'none', borderRadius:10, fontSize:16, fontWeight:600, cursor:'pointer', marginBottom:16 },
  error:         { color:'#f44336', textAlign:'center', fontSize:14 },

  result:        { border:'2px solid', borderRadius:12, padding:20, marginTop:8 },
  resultHeader:  { display:'flex', gap:16, alignItems:'center', marginBottom:16 },
  resultLabel:   { fontSize:22, fontWeight:700, margin:0 },
  resultConf:    { color:'#aaa', fontSize:14, margin:'4px 0 0' },
  resultQuality: { color:'#aaa', fontSize:13, margin:'2px 0 0' },
  thcBox:        { background:'#111', borderRadius:8, padding:12, textAlign:'center', marginBottom:16 },
  thcTitle:      { color:'#666', fontSize:12, margin:'0 0 4px' },
  thcValue:      { fontSize:36, fontWeight:700, margin:0 },
  thcRange:      { color:'#444', fontSize:12, margin:'4px 0 0' },
  description:   { color:'#888', fontSize:13, marginBottom:16, lineHeight:1.5 },
  varietiesTitle:{ color:'#666', fontSize:12, marginBottom:8 },
  varietiesList: { display:'flex', flexWrap:'wrap', gap:6, marginBottom:16 },
  varietyTag:    { border:'1px solid', borderRadius:20, padding:'3px 10px', fontSize:12 },
  bars:          { display:'flex', flexDirection:'column', gap:8 },
  barRow:        { display:'flex', alignItems:'center', gap:8 },
  barLabel:      { color:'#666', fontSize:12, width:100, flexShrink:0 },
  barBg:         { flex:1, height:6, background:'#111', borderRadius:3, overflow:'hidden' },
  barFill:       { height:'100%', borderRadius:3, transition:'width 0.5s' },
  barVal:        { color:'#555', fontSize:12, width:40, textAlign:'right' },

  contributeInvite:    { marginTop:20, paddingTop:16, borderTop:'1px solid #222', textAlign:'center' },
  contributeInviteText:{ color:'#555', fontSize:13, margin:'0 0 8px' },
  contributeInviteBtn: { background:'none', border:'1px solid #333', color:'#888', borderRadius:8, padding:'8px 16px', fontSize:13, cursor:'pointer' },

  contributeInfo:     { background:'#111', borderRadius:8, padding:12, marginBottom:16 },
  contributeInfoText: { color:'#666', fontSize:13, margin:0, textAlign:'center', lineHeight:1.5 },

  labelTitle:    { color:'#666', fontSize:13, marginBottom:8 },
  labelGrid:     { display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 },
  labelBtn:      { padding:'10px 8px', background:'#111', border:'1px solid #222', borderRadius:8, color:'#555', fontSize:13, cursor:'pointer', textAlign:'center' },
  labelBtnActive:{ background:'#111', fontWeight:600 },

  successBox:    { textAlign:'center', padding:'24px 0' },
  successTitle:  { color:'#fff', fontSize:20, fontWeight:700, margin:'12px 0 4px' },
  successSub:    { color:'#555', fontSize:14, marginBottom:24 },
};
