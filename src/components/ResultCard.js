import { memo, useState } from 'react';
import { LABELS } from '../shared/labels';
import { palette } from '../shared/theme';
import { interpretThc } from '../shared/thcInterpretation';
import { NotDetectedCard } from './NotDetectedCard';

export const ResultCard = memo(function ResultCard({ result, imagePreview, cfg, extra, compact = false, onRetry }) {
  const [thcOpen, setThcOpen]   = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [techOpen, setTechOpen] = useState(false);
  if (result.label === 'other') {
    return <NotDetectedCard imagePreview={imagePreview} onRetry={onRetry} />;
  }
  const conf = result.confidence * 100;
  const thcDetail = interpretThc(result);
  return (
    <div style={{...s.result, borderColor: cfg.color}}>
      {imagePreview && <img src={imagePreview} alt="preview" style={s.resultImage} />}

      <div style={s.resultHeader}>
        <span style={{fontSize: 40}}>{cfg.emoji}</span>
        <div>
          <p style={{...s.resultLabel, color: cfg.color}}>{result.display}</p>
          <p style={s.resultConf}>Confianza: {conf.toFixed(1)}%</p>
          {conf < 70 && (
            <p style={s.lowConfWarning}>⚠️ Confianza baja. Este resultado puede ser incorrecto.</p>
          )}
          <div style={s.qualityRow}>
            <div style={{...s.qualityDot, background: conf >= 85 ? palette.green : conf >= 65 ? '#FF9800' : '#f44336'}}/>
            <p style={s.resultQuality}>Calidad: {result.quality}</p>
          </div>
        </div>
      </div>

      <div style={s.thcRow}>
        <div
          style={{...s.thcBox, ...(thcDetail ? s.thcBoxClickable : {}), ...(thcOpen ? {borderColor: cfg.color+'55'} : {})}}
          onClick={() => thcDetail && setThcOpen(o => !o)}
          role={thcDetail ? 'button' : undefined}
          tabIndex={thcDetail ? 0 : undefined}
          onKeyDown={e => { if (thcDetail && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setThcOpen(o => !o); } }}
        >
          <p style={s.thcTitle}>THC típico</p>
          <p style={{...s.thcValue, color: cfg.color, fontSize: 22, lineHeight: 1.2}}>{result.thc_min}% — {result.thc_max}%</p>
          {thcDetail && (
            <p style={s.thcExpandHint}>{thcOpen ? 'Ocultar detalle ▲' : 'Toca para ver detalle ▼'}</p>
          )}
        </div>
        <div style={s.thcBox}>
          <p style={s.thcTitle}>CBD típico</p>
          <p style={{...s.thcValue, color: '#aaa', fontSize: 18, paddingTop: 4}}>{extra.cbd}</p>
        </div>
      </div>
      {thcDetail && (
        <div style={{...s.thcDetailWrap, maxHeight: thcOpen ? 600 : 0, opacity: thcOpen ? 1 : 0, marginTop: thcOpen ? 8 : 0, marginBottom: thcOpen ? 14 : 0}}>
          <div style={{...s.thcDetailBox, borderColor: cfg.color+'33'}}>
            {thcDetail.lowConf && (
              <p style={s.thcDetailLowConf}>⚠ Confianza baja del modelo. Esta interpretación es orientativa.</p>
            )}
            <p style={s.thcDetailSection}>RASGOS DETECTADOS</p>
            <ul style={s.thcDetailList}>
              {thcDetail.traits.map(t => (
                <li key={t.key} style={s.thcDetailItem}>
                  <span style={s.thcDetailItemLabel}>{t.label}: </span>
                  <span style={{...s.thcDetailItemValue, color: cfg.color}}>{t.value}</span>
                  {t.sub && t.sub !== '—' && <span style={s.thcDetailItemSub}> · {t.sub}</span>}
                </li>
              ))}
            </ul>
            <p style={s.thcDetailSection}>INTERPRETACIÓN</p>
            <p style={s.thcDetailText}>{thcDetail.interpretation}</p>
            <p style={s.thcDetailDisclaimer}>⚠ Estimación visual. No sustituye análisis de laboratorio.</p>
          </div>
        </div>
      )}

      <p style={s.description}>{result.description}</p>

      {!compact && (
        <>
          <div style={s.moderationBox}>
            <p style={s.moderationTitle}>Moderación</p>
            <p style={s.moderationText}>{extra.moderation}</p>
          </div>

          <button type="button" style={s.disclosureBtn} onClick={() => setMoreOpen(o => !o)} aria-expanded={moreOpen}>
            <span style={s.disclosureLabel}>Más detalle</span>
            <span style={{...s.disclosureChevron, transform: moreOpen ? 'rotate(180deg)' : 'rotate(0deg)'}}>▾</span>
          </button>
          <div style={{...s.disclosureWrap, maxHeight: moreOpen ? 1200 : 0, opacity: moreOpen ? 1 : 0, marginBottom: moreOpen ? 8 : 0}}>
            <div style={s.disclosureInner}>
              <p style={s.sectionTitle}>Efectos</p>
              <div style={s.badgeRow}>
                {extra.effects.map(e => <span key={e} style={{...s.badge, borderColor: cfg.color, color: cfg.color}}>{e}</span>)}
              </div>
              <p style={s.sectionTitle}>Aroma</p>
              <div style={s.badgeRow}>
                {extra.aroma.map(a => <span key={a} style={{...s.badge, borderColor: '#555', color: '#888'}}>{a}</span>)}
              </div>
              <p style={s.sectionTitle}>Consumo</p>
              <div style={s.badgeRow}>
                {extra.consumption.map(c => <span key={c} style={{...s.badge, borderColor: '#444', color: '#666'}}>{c}</span>)}
              </div>
              <p style={s.sectionTitle}>Variedades comunes</p>
              <div style={s.badgeRow}>
                {result.varieties.map(v => <span key={v} style={{...s.badge, borderColor: cfg.color, color: cfg.color}}>{v}</span>)}
              </div>
              <div style={s.tipBox}>
                <p style={s.tipText}>{extra.tip}</p>
              </div>
            </div>
          </div>

          <button type="button" style={s.disclosureBtn} onClick={() => setTechOpen(o => !o)} aria-expanded={techOpen}>
            <span style={s.disclosureLabel}>Análisis técnico</span>
            <span style={{...s.disclosureChevron, transform: techOpen ? 'rotate(180deg)' : 'rotate(0deg)'}}>▾</span>
          </button>
          <div style={{...s.disclosureWrap, maxHeight: techOpen ? 1000 : 0, opacity: techOpen ? 1 : 0, marginBottom: techOpen ? 8 : 0}}>
            <div style={s.disclosureInner}>
              {result.visual_traits && (
                <>
                  <p style={s.sectionTitle}>Rasgos visuales</p>
                  <div style={s.traitsGrid}>
                    <div style={s.traitBox}>
                      <p style={s.traitLabel}>Tricomas</p>
                      <p style={s.traitValue}>{result.visual_traits.trichomes}</p>
                      <p style={s.traitSub}>{result.visual_traits.trichome_coverage.toFixed(1)}% cobertura</p>
                    </div>
                    <div style={s.traitBox}>
                      <p style={s.traitLabel}>Textura</p>
                      <p style={s.traitValue}>{result.visual_traits.texture}</p>
                      <p style={s.traitSub}>Rugosidad {result.visual_traits.roughness.toFixed(0)}/100</p>
                    </div>
                    <div style={s.traitBox}>
                      <p style={s.traitLabel}>Curación</p>
                      <p style={s.traitValue}>{result.visual_traits.cure}</p>
                      <p style={s.traitSub}>Brillo {result.visual_traits.brightness.toFixed(0)}%</p>
                    </div>
                    <div style={s.traitBox}>
                      <p style={s.traitLabel}>Color base</p>
                      <div style={{width:24,height:24,borderRadius:'50%',background:`rgb(${result.visual_traits.dominant_color.join(',')})`,margin:'4px auto',border:'1px solid #333'}}/>
                      <p style={s.traitSub}>RGB dominante</p>
                    </div>
                  </div>
                </>
              )}
              <p style={s.sectionTitle}>Probabilidades</p>
              <div style={s.bars}>
                {Object.entries(result.all_probs).map(([key, val]) => (
                  <div key={key} style={s.barRow}>
                    <span style={s.barLabel}>{LABELS[key].emoji} {LABELS[key].text}</span>
                    <div style={s.barBg}><div style={{...s.barFill, width: `${(val * 100).toFixed(0)}%`, background: LABELS[key].color}}/></div>
                    <span style={s.barVal}>{(val * 100).toFixed(1)}%</span>
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

const s = {
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
  thcBox:        { flex:1, background:palette.card, borderRadius:8, padding:12, textAlign:'center', border:'1px solid transparent', transition:'border-color 200ms cubic-bezier(.22,1,.36,1)' },
  thcBoxClickable:{ cursor:'pointer', userSelect:'none' },
  thcTitle:      { color:'#666', fontSize:12, margin:'0 0 4px' },
  thcValue:      { fontSize:28, fontWeight:700, margin:0 },
  thcExpandHint: { color:'#555', fontSize:11, margin:'6px 0 0', letterSpacing:'0.2px' },
  thcDetailWrap: { overflow:'hidden', transition:'max-height 280ms cubic-bezier(.22,1,.36,1), opacity 280ms cubic-bezier(.22,1,.36,1), margin 280ms cubic-bezier(.22,1,.36,1)' },
  thcDetailBox:  { background:palette.surface, border:'1px solid', borderRadius:12, padding:'14px 16px' },
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

  moderationBox: { background:palette.warnBg, borderRadius:10, padding:12, marginTop:8, marginBottom:8, border:`1px solid ${palette.warn}` },
  moderationTitle:{ color:'#FF9800', fontSize:12, fontWeight:700, margin:'0 0 4px' },
  moderationText:{ color:'#aaa', fontSize:13, margin:0, lineHeight:1.5 },

  tipBox:        { background:'#0f1a0f', borderRadius:10, padding:12, marginBottom:8, border:'1px solid #2a4a2a' },
  tipText:       { color:'#8BC34A', fontSize:13, margin:0, lineHeight:1.5 },

  traitsGrid:    { display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 },
  traitBox:      { background:palette.card, borderRadius:10, padding:12, textAlign:'center' },
  traitLabel:    { color:'#555', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:0.5, margin:'0 0 4px' },
  traitValue:    { color:'#ddd', fontSize:13, fontWeight:700, margin:'0 0 3px' },
  traitSub:      { color:'#444', fontSize:11, margin:0 },

  bars:          { display:'flex', flexDirection:'column', gap:8 },
  barRow:        { display:'flex', alignItems:'center', gap:8 },
  barLabel:      { color:'#666', fontSize:12, width:120, flexShrink:0 },
  barBg:         { flex:1, height:5, background:'#111', borderRadius:3, overflow:'hidden' },
  barFill:       { height:'100%', borderRadius:3, transition:'width 0.6s ease' },
  barVal:        { color:'#555', fontSize:12, width:40, textAlign:'right' },
};
