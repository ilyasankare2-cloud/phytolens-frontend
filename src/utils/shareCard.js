// Canvas-based share card builder. Generates a 600x860 PNG with the result
// and (optionally) the user's photo, then opens the system share sheet or
// falls back to download.

function rrect(ctx, x, y, w, h, r) {
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
      ctx.fillStyle = '#080808'; ctx.fillRect(0, 0, W, H);

      const grd = ctx.createRadialGradient(W/2, 220, 10, W/2, 220, 320);
      grd.addColorStop(0, cfg.color + '22');
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd; ctx.fillRect(0, 0, W, 480);

      if (loadedImg) {
        ctx.save();
        rrect(ctx, 0, 0, W, 420, 0); ctx.clip();
        ctx.drawImage(loadedImg, 0, 0, W, 420);
        const fade = ctx.createLinearGradient(0, 250, 0, 420);
        fade.addColorStop(0, 'transparent');
        fade.addColorStop(1, '#080808');
        ctx.fillStyle = fade; ctx.fillRect(0, 0, W, 420);
        ctx.restore();
      }

      const topGlow = ctx.createLinearGradient(0, 0, W, 0);
      topGlow.addColorStop(0, cfg.color);
      topGlow.addColorStop(1, cfg.color + '44');
      ctx.fillStyle = topGlow; ctx.fillRect(0, 0, W, 4);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px -apple-system,sans-serif';
      ctx.fillText('🔬 TrichAI', 24, 36);
      ctx.fillStyle = '#ffffff44';
      ctx.font = '12px -apple-system,sans-serif';
      ctx.fillText('AI Cannabis Analysis', 24, 54);

      ctx.fillStyle = cfg.color + '22';
      rrect(ctx, 24, imageSrc ? 390 : 80, 180, 32, 16); ctx.fill();
      ctx.strokeStyle = cfg.color + '66'; ctx.lineWidth = 1;
      rrect(ctx, 24, imageSrc ? 390 : 80, 180, 32, 16); ctx.stroke();
      ctx.fillStyle = cfg.color;
      ctx.font = 'bold 13px -apple-system,sans-serif';
      ctx.fillText(`${cfg.emoji}  ${result.display}`, 40, imageSrc ? 411 : 101);

      const yBase = imageSrc ? 450 : 140;

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 56px -apple-system,sans-serif';
      ctx.fillText(`${(result.confidence * 100).toFixed(0)}%`, 24, yBase + 62);
      ctx.fillStyle = '#555';
      ctx.font = '13px -apple-system,sans-serif';
      ctx.fillText('confianza del modelo', 24, yBase + 82);

      ctx.fillStyle = '#1a1a1a'; rrect(ctx, 24, yBase + 94, W - 48, 6, 3); ctx.fill();
      ctx.fillStyle = cfg.color; rrect(ctx, 24, yBase + 94, (W - 48) * result.confidence, 6, 3); ctx.fill();

      const cardY = yBase + 116;
      [[`${result.thc_estimate}%`, 'THC estimado', cfg.color], [extra.cbd, 'CBD típico', '#888']].forEach(([val, label, col], i) => {
        const cx = 24 + i * 188;
        ctx.fillStyle = '#111'; rrect(ctx, cx, cardY, 175, 72, 12); ctx.fill();
        ctx.strokeStyle = col + '33'; ctx.lineWidth = 1;
        rrect(ctx, cx, cardY, 175, 72, 12); ctx.stroke();
        ctx.fillStyle = col;
        ctx.font = 'bold 30px -apple-system,sans-serif';
        ctx.fillText(val, cx + 16, cardY + 42);
        ctx.fillStyle = '#555'; ctx.font = '12px -apple-system,sans-serif';
        ctx.fillText(label, cx + 16, cardY + 58);
      });

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
          ctx.fillStyle = '#1a1a1a'; rrect(ctx, tx, tY + 10, 175, 50, 10); ctx.fill();
          ctx.fillStyle = '#666'; ctx.font = '10px -apple-system,sans-serif';
          ctx.fillText(k.toUpperCase(), tx + 12, tY + 28);
          ctx.fillStyle = '#ccc'; ctx.font = 'bold 14px -apple-system,sans-serif';
          ctx.fillText(v, tx + 12, tY + 48);
        });
      }

      const effY = cardY + 170;
      ctx.fillStyle = '#333'; ctx.font = 'bold 10px -apple-system,sans-serif';
      ctx.fillText('EFECTOS', 24, effY);
      let ex = 24; ctx.font = '12px -apple-system,sans-serif';
      extra.effects.slice(0, 4).forEach(e => {
        const ew = ctx.measureText(e).width + 20;
        ctx.strokeStyle = cfg.color + '55'; ctx.lineWidth = 1;
        rrect(ctx, ex, effY + 8, ew, 24, 12); ctx.stroke();
        ctx.fillStyle = cfg.color + 'cc'; ctx.fillText(e, ex + 10, effY + 24);
        ex += ew + 8;
      });

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

export async function shareResult(result, cfg, extra, imagePreview, onPreview) {
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
