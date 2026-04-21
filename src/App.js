import { useState, useRef } from 'react';

const API = 'http://localhost:8080';

const LABELS = {
  bud:   { emoji: '🌿', color: '#4CAF50' },
  hash:  { emoji: '🟤', color: '#795548' },
  other: { emoji: '🔵', color: '#2196F3' },
  plant: { emoji: '🌱', color: '#8BC34A' },
};

export default function App() {
  const [image, setImage]     = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const inputRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError(null);
  };

  const analyze = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', image);
      const res = await fetch(`${API}/analyze`, { method: 'POST', body: form });
      const data = await res.json();
      if (data.success) setResult(data.result);
      else setError('Error al analizar la imagen.');
    } catch {
      setError('No se puede conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const cfg = result ? LABELS[result.label] : null;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🔬 PhytoLens</h1>
        <p style={styles.subtitle}>Identificación de plantas y derivados</p>
        <div style={styles.dropzone} onClick={() => inputRef.current.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}>
          {preview ? <img src={preview} alt="preview" style={styles.preview} /> : <div style={styles.placeholder}><span style={{fontSize:48}}>📷</span><p style={styles.dropText}>Haz clic o arrastra una foto aquí</p></div>}
        </div>
        <input ref={inputRef} type="file" accept="image/*" style={{display:'none'}} onChange={e => handleFile(e.target.files[0])} />
        <button style={{...styles.btn, opacity:(!image||loading)?0.5:1}} onClick={analyze} disabled={!image||loading}>
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
              <p style={styles.thcRange}>Rango típico: {result.thc_min}% — {result.thc_max}%</p>
            </div>

            <p style={styles.description}>{result.description}</p>

            <div style={styles.varietiesBox}>
              <p style={styles.varietiesTitle}>Variedades comunes</p>
              <div style={styles.varietiesList}>
                {result.varieties.map(v => (
                  <span key={v} style={{...styles.varietyTag, borderColor:cfg.color, color:cfg.color}}>{v}</span>
                ))}
              </div>
            </div>

            <div style={styles.bars}>
              {Object.entries(result.all_probs).map(([key, val]) => (
                <div key={key} style={styles.barRow}>
                  <span style={styles.barLabel}>{LABELS[key].emoji} {key}</span>
                  <div style={styles.barBg}><div style={{...styles.barFill, width:`${(val*100).toFixed(0)}%`, background:LABELS[key].color}}/></div>
                  <span style={styles.barVal}>{(val*100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container:      { minHeight:'100vh', background:'#0D0D0D', display:'flex', alignItems:'center', justifyContent:'center', padding:16 },
  card:           { background:'#1A1A1A', borderRadius:16, padding:32, width:'100%', maxWidth:480, boxShadow:'0 4px 32px rgba(0,0,0,0.5)' },
  title:          { color:'#fff', fontSize:28, fontWeight:700, margin:0, textAlign:'center' },
  subtitle:       { color:'#888', fontSize:14, textAlign:'center', marginTop:4, marginBottom:24 },
  dropzone:       { border:'2px dashed #333', borderRadius:12, minHeight:200, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', overflow:'hidden', marginBottom:16 },
  placeholder:    { textAlign:'center', color:'#555' },
  dropText:       { color:'#555', fontSize:14, marginTop:8 },
  preview:        { width:'100%', maxHeight:300, objectFit:'cover' },
  btn:            { width:'100%', padding:'14px 0', background:'#4CAF50', color:'#fff', border:'none', borderRadius:10, fontSize:16, fontWeight:600, cursor:'pointer', marginBottom:16 },
  error:          { color:'#f44336', textAlign:'center', fontSize:14 },
  result:         { border:'2px solid', borderRadius:12, padding:20, marginTop:8 },
  resultHeader:   { display:'flex', gap:16, alignItems:'center', marginBottom:16 },
  resultLabel:    { fontSize:22, fontWeight:700, margin:0 },
  resultConf:     { color:'#aaa', fontSize:14, margin:'4px 0 0' },
  resultQuality:  { color:'#aaa', fontSize:13, margin:'2px 0 0' },
  thcBox:         { background:'#111', borderRadius:8, padding:12, textAlign:'center', marginBottom:16 },
  thcTitle:       { color:'#888', fontSize:12, margin:'0 0 4px' },
  thcValue:       { fontSize:36, fontWeight:700, margin:0 },
  thcRange:       { color:'#555', fontSize:12, margin:'4px 0 0' },
  description:    { color:'#aaa', fontSize:13, marginBottom:16, lineHeight:1.5 },
  varietiesBox:   { marginBottom:16 },
  varietiesTitle: { color:'#888', fontSize:12, marginBottom:8 },
  varietiesList:  { display:'flex', flexWrap:'wrap', gap:6 },
  varietyTag:     { border:'1px solid', borderRadius:20, padding:'3px 10px', fontSize:12 },
  bars:           { display:'flex', flexDirection:'column', gap:8 },
  barRow:         { display:'flex', alignItems:'center', gap:8 },
  barLabel:       { color:'#aaa', fontSize:12, width:100, flexShrink:0 },
  barBg:          { flex:1, height:8, background:'#333', borderRadius:4, overflow:'hidden' },
  barFill:        { height:'100%', borderRadius:4, transition:'width 0.5s' },
  barVal:         { color:'#aaa', fontSize:12, width:40, textAlign:'right' },
};