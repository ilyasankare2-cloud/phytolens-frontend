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

    const draw = () => {
      // Background
      ctx.fillStyle = '#080808'; ctx.fillRect(0, 0, W, H);

      // Glow behind image
      const grd = ctx.createRadialGradient(W/2, 220, 10, W/2, 220, 320);
      grd.addColorStop(0, cfg.color + '22');
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd; ctx.fillRect(0, 0, W, 480);

      // Photo
      if (imageSrc) {
        ctx.save();
        _rrect(ctx, 0, 0, W, 420, 0); ctx.clip();
        ctx.drawImage(imageSrc, 0, 0, W, 420);
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
      ctx.fillText('trichai.vercel.app', 24, btmY + 16);
      ctx.fillStyle = cfg.color; ctx.font = 'bold 13px -apple-system,sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('Analiza la tuya →', W - 24, btmY + 16);
      ctx.textAlign = 'left';

      resolve(canvas);
    };

    if (imageSrc) {
      const img = new Image();
      img.onload = draw;
      img.onerror = () => { /* draw without photo */ draw(); };
      img.src = imageSrc;
    } else {
      draw();
    }
  });
}

async function shareResult(result, cfg, extra, imagePreview, onPreview) {
  if (onPreview) { onPreview(null); }
  const canvas = await buildShareCardWithImage(result, cfg, extra, imagePreview ? imagePreview : null);
  const dataUrl = canvas.toDataURL('image/png');
  if (onPreview) { onPreview(dataUrl); return; }

  const text = `${result.display} · THC ${result.thc_estimate}% · Confianza ${(result.confidence * 100).toFixed(0)}%\n\ntrichai.vercel.app`;
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

          {result.visual_traits && (
            <>
              <p style={styles.sectionTitle}>🔬 Rasgos visuales</p>
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
  const [contribError, setContribError] = useState(null);
  const [history, setHistory]           = useState(loadHistory);
  const [historyOpen, setHistoryOpen]   = useState(false);
  const [expandedHistory, setExpandedHistory] = useState(null);
  const [copied, setCopied]             = useState(false);
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

  const handleFile = (file) => {
    if (!file) return;
    // Revoke the previous object URL before creating a new one
    if (prevPreview.current) {
      URL.revokeObjectURL(prevPreview.current);
    }
    const url = URL.createObjectURL(file);
    prevPreview.current = url;
    setImage(file);
    setPreview(url);
    setResult(null);
    setError(null);
    setContribSent(false);
    setContribError(null);
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
      if (!res.ok) {
        setError(data.detail || 'Error al analizar la imagen.');
        return;
      }
      if (data.success) {
        setResult(data.result);
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
    } catch (err) {
      setContribError('No se pudo enviar la foto. Inténtalo de nuevo.');
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

  const copyResult = () => {
    if (!result) return;
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
                <div style={styles.actionRow}>
                  <button style={styles.actionBtn} onClick={copyResult}>
                    {copied ? '✅ Copiado' : '📋 Copiar'}
                  </button>
                  <button
                    style={{...styles.actionBtn, borderColor:'#4CAF5066', color:'#4CAF50'}}
                    onClick={async () => {
                      setSharing(true);
                      await shareResult(result, cfg, extra, preview, setSharePreview);
                      setSharing(false);
                    }}
                    disabled={sharing}
                  >
                    {sharing ? '⏳' : '↑ Compartir'}
                  </button>
                  <button style={styles.actionBtn} onClick={reset}>
                    🔄 Nueva
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
                  const text = `${result.display} · THC ${result.thc_estimate}% · Confianza ${(result.confidence * 100).toFixed(0)}%\n\ntrichai.vercel.app`;
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
                  {Object.entries(LABELS).map(([key, val]) => (
                    <button key={key} style={{...styles.labelBtn, ...(contribLabel === key ? {...styles.labelBtnActive, borderColor:val.color, color:val.color} : {})}} onClick={() => setContribLabel(key)}>
                      {val.emoji} {val.text}
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
  error:         { color:'#f44336', textAlign:'center', fontSize:14, marginBottom:12 },

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
  backBtn:       { background:'none', border:'none', color:'#4CAF50', fontSize:15, cursor:'pointer', padding:0 },
  clearBtn:      { background:'none', border:'none', color:'#f44336', fontSize:14, cursor:'pointer', padding:0 },
  historyItem:   { display:'flex', alignItems:'center', gap:12, background:'#111', borderRadius:12, padding:12, border:'1px solid', cursor:'pointer' },
  historyThumbWrap: { width:56, height:56, borderRadius:8, overflow:'hidden', flexShrink:0, background:'#222' },
  historyThumb:  { width:'100%', height:'100%', objectFit:'cover' },
  historyLabel:  { fontSize:15, fontWeight:600, margin:'0 0 3px' },
  historyConf:   { color:'#666', fontSize:12, margin:'0 0 3px' },
  historyDate:   { color:'#444', fontSize:11, margin:0 },
  historyArrow:  { color:'#333', fontSize:22, flexShrink:0 },

  modalOverlay:  { position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 },
  modalBox:      { background:'#111', borderRadius:16, padding:20, width:'100%', maxWidth:420, border:'1px solid #222' },
  modalTitle:    { color:'#fff', fontSize:16, fontWeight:700, margin:'0 0 14px', textAlign:'center' },
  modalImg:      { width:'100%', borderRadius:10, marginBottom:14, display:'block' },
  modalBtns:     { display:'flex', gap:8, alignItems:'center' },
};
