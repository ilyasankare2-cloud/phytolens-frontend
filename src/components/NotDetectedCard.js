import { memo } from 'react';
import { Ban } from 'lucide-react';
import { palette } from '../shared/theme';

export const NotDetectedCard = memo(function NotDetectedCard({ imagePreview, onRetry }) {
  return (
    <div style={{...s.result, borderColor: palette.border}}>
      {imagePreview && <img src={imagePreview} alt="preview" style={s.resultImage} />}
      <div style={s.header}>
        <Ban size={44} strokeWidth={1.5} color={palette.muted} style={{flexShrink:0}} />
        <div>
          <p style={s.title}>No veo cannabis aquí</p>
          <p style={s.sub}>No parece haber cogollo, hachís ni planta. Puede que sea una mano, un fondo u otra cosa que el modelo no reconoce.</p>
        </div>
      </div>
      <div style={s.tipsBox}>
        <p style={s.tipsTitle}>Cómo mejorar la foto</p>
        <ul style={s.tipsList}>
          <li>Acércate y ocupa el centro</li>
          <li>Buena luz, preferible natural</li>
          <li>Enfoque nítido, fondo limpio</li>
        </ul>
      </div>
      {onRetry && (
        <button style={s.retryBtn} onClick={onRetry}>Probar con otra foto</button>
      )}
    </div>
  );
});

const s = {
  result:     { border:'2px solid', borderRadius:12, padding:20, marginTop:8 },
  resultImage:{ width:'100%', maxHeight:220, objectFit:'cover', borderRadius:8, marginBottom:16 },
  header:     { display:'flex', gap:14, alignItems:'center', marginBottom:18 },
  title:      { color:palette.text, fontSize:20, fontWeight:700, margin:'0 0 4px', letterSpacing:'-0.3px' },
  sub:        { color:palette.muted, fontSize:13, margin:0, lineHeight:1.5 },
  tipsBox:    { background:palette.card, border:`1px solid ${palette.border}`, borderRadius:12, padding:'14px 16px', marginBottom:14 },
  tipsTitle:  { color:palette.text, fontSize:13, fontWeight:600, margin:'0 0 8px' },
  tipsList:   { color:palette.muted, fontSize:13, lineHeight:1.7, paddingLeft:20, margin:0 },
  retryBtn:   { width:'100%', padding:'14px 0', background:palette.green, color:'#fff', border:'none', borderRadius:10, fontSize:16, fontWeight:600, cursor:'pointer', marginTop:8 },
};
