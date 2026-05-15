import { useState } from 'react';
import { Camera } from 'lucide-react';
import { LABELS, EXTRA_INFO } from '../shared/labels';
import { palette } from '../shared/theme';
import { ResultCard } from './ResultCard';

export function HistoryView({ history, onClose, onClear }) {
  const [expandedId, setExpandedId] = useState(null);
  const expanded = expandedId !== null ? history.find(h => h.id === expandedId) : null;

  return (
    <div style={s.container}>
      <div style={{...s.card, maxWidth: expanded ? 500 : 600}}>
        <div style={s.topBar}>
          <button style={s.backBtn} onClick={() => { onClose(); setExpandedId(null); }}>← Volver</button>
          <h2 style={s.topTitle}>Historial ({history.length})</h2>
          <button style={s.clearBtn} onClick={onClear}>Borrar todo</button>
        </div>

        {history.length === 0 && (
          <div style={s.empty}>
            <Camera size={44} strokeWidth={1.5} color={palette.dim} style={{display:'block', margin:'0 auto 18px'}} />
            <p style={s.emptyTitle}>Aún no has analizado nada</p>
            <p style={s.emptyText}>Cada análisis se guarda aquí automáticamente.<br/>Tu historial vive en este dispositivo.</p>
            <button style={s.emptyBtn} onClick={onClose}>Analizar mi primera foto →</button>
          </div>
        )}

        {expanded ? (
          <>
            <button style={{...s.backBtn, marginBottom:16}} onClick={() => setExpandedId(null)}>← Lista</button>
            <p style={{color:'#444', fontSize:12, marginBottom:12}}>{expanded.date}</p>
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
                <div key={item.id} style={{...s.item, borderColor: c.color}} onClick={() => setExpandedId(item.id)}>
                  <div style={s.thumbWrap}>
                    {item.imageData && <img src={item.imageData} alt="" style={s.thumb}/>}
                  </div>
                  <div style={{flex:1}}>
                    <p style={{...s.label, color: c.color}}>{c.emoji} {item.result.display}</p>
                    <p style={s.conf}>Confianza: {(item.result.confidence * 100).toFixed(1)}% · THC: {item.result.thc_estimate}%</p>
                    <p style={s.date}>{item.date}</p>
                  </div>
                  <span style={s.arrow}>›</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  container:  { minHeight:'100vh', background:palette.bg, display:'flex', alignItems:'center', justifyContent:'center', padding:16, fontFamily:"'Inter', -apple-system, sans-serif" },
  card:       { background:palette.surface, borderRadius:18, padding:32, width:'100%', boxShadow:'0 24px 60px -10px rgba(0,0,0,0.6)', border:`1px solid ${palette.border}` },
  topBar:     { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 },
  topTitle:   { color:'#fff', fontSize:18, fontWeight:700, margin:0 },
  backBtn:    { background:'none', border:'none', color:palette.green, fontSize:15, cursor:'pointer', padding:0 },
  clearBtn:   { background:'none', border:'none', color:'#f44336', fontSize:14, cursor:'pointer', padding:0 },

  empty:      { textAlign:'center', padding:'48px 24px' },
  emptyTitle: { color:palette.text, fontSize:17, fontWeight:600, margin:'0 0 8px', letterSpacing:'-0.2px' },
  emptyText:  { color:palette.muted, fontSize:13, lineHeight:1.6, margin:'0 0 24px' },
  emptyBtn:   { background:palette.greenSoft, color:palette.green, border:`1px solid ${palette.green}40`, borderRadius:980, padding:'10px 20px', fontSize:13, fontWeight:600, cursor:'pointer' },

  item:       { display:'flex', alignItems:'center', gap:12, background:'#111', borderRadius:12, padding:12, border:'1px solid', cursor:'pointer' },
  thumbWrap:  { width:56, height:56, borderRadius:8, overflow:'hidden', flexShrink:0, background:'#222' },
  thumb:      { width:'100%', height:'100%', objectFit:'cover' },
  label:      { fontSize:15, fontWeight:600, margin:'0 0 3px' },
  conf:       { color:'#666', fontSize:12, margin:'0 0 3px' },
  date:       { color:'#444', fontSize:11, margin:0 },
  arrow:      { color:'#333', fontSize:22, flexShrink:0 },
};
