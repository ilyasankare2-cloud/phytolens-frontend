// Pure interpretation of visual_traits → traits to display + conclusion text.
// No React imports. Same logic mirrored in:
//   phytolens-app/app/shared/thcInterpretation.ts
// Update both when changing rules.

const LOW_CONF_THRESHOLD = 0.60;

function colorName([r, g, b]) {
  if (g > r && g > b + 10) return 'Verdoso';
  if (r > g + 20 && r > b + 20) return 'Rojizo';
  if (r > 150 && g > 110 && b < 100) return 'Dorado';
  if (r < 60 && g < 60 && b < 60) return 'Oscuro';
  if (r > 180 && g > 180 && b > 180) return 'Claro';
  return 'Mixto';
}

function uniformityFromRoughness(roughness) {
  if (roughness < 25) return 'Uniforme';
  if (roughness < 45) return 'Media';
  return 'Irregular';
}

function hasGreenTint([r, g, b]) {
  return g > r && g > b + 10;
}

export function interpretThc(result) {
  if (!result || !result.visual_traits || result.label === 'other') return null;
  const v = result.visual_traits;
  const lowConf = result.confidence < LOW_CONF_THRESHOLD;

  if (result.label === 'bud') {
    const traits = [
      { key: 'tricomas', label: 'Tricomas', value: v.trichomes, sub: `${v.trichome_coverage.toFixed(1)}% cobertura` },
      { key: 'textura',  label: 'Textura',  value: v.texture,   sub: `rugosidad ${v.roughness.toFixed(0)}/100` },
      { key: 'curacion', label: 'Curación', value: v.cure,      sub: `brillo ${v.brightness.toFixed(0)}%` },
    ];
    const goodTrich = v.trichomes === 'Alta';
    const goodTex   = v.texture === 'Cristalina' || v.texture === 'Muy cristalina';
    const goodCure  = v.cure === 'Bien curada' || v.cure === 'Muy seca';
    const badTrich  = v.trichomes === 'Baja';
    const badTex    = v.texture === 'Lisa';
    const badCure   = v.cure === 'Muy oscura';
    const badPhoto  = v.brightness < 25 || v.brightness > 92;

    let interpretation;
    if (badPhoto) {
      interpretation = 'Los rasgos visuales no permiten estrechar más el rango.';
    } else if (goodTrich && goodTex && goodCure) {
      interpretation = 'Los rasgos sugieren un producto de calidad alta. THC probable en la mitad superior del rango.';
    } else if (badTrich || badTex || badCure) {
      interpretation = 'Calidad aparente baja. THC probable en la mitad inferior del rango.';
    } else {
      interpretation = 'Calidad aparente media. THC probable en el centro del rango.';
    }
    return { traits, interpretation, lowConf };
  }

  if (result.label === 'hash') {
    // Trichomes deliberately ignored — they don't apply to pressed resin.
    const uniformity = uniformityFromRoughness(v.roughness);
    const green      = hasGreenTint(v.dominant_color);
    const traits = [
      { key: 'color',   label: 'Color',        value: colorName(v.dominant_color), sub: `RGB ${v.dominant_color.join(', ')}` },
      { key: 'uniform', label: 'Uniformidad',  value: uniformity, sub: `rugosidad ${v.roughness.toFixed(0)}/100` },
      { key: 'green',   label: 'Tonos verdes', value: green ? 'Presentes' : 'No detectados', sub: green ? 'Posible material vegetal' : '—' },
    ];
    let interpretation;
    if (uniformity === 'Uniforme' && !green) {
      interpretation = 'Apariencia consistente con hash de calidad. THC probable en la mitad superior del rango.';
    } else if (green || uniformity === 'Irregular') {
      interpretation = 'Posible presencia de material vegetal o irregularidad. THC probable en la mitad inferior del rango.';
    } else {
      interpretation = 'Los rasgos visuales no permiten estrechar más el rango.';
    }
    return { traits, interpretation, lowConf };
  }

  if (result.label === 'plant') {
    const traits = [
      { key: 'color',  label: 'Color',  value: colorName(v.dominant_color), sub: `RGB ${v.dominant_color.join(', ')}` },
      { key: 'brillo', label: 'Brillo', value: `${v.brightness.toFixed(0)}%`, sub: '—' },
    ];
    const interpretation = 'El THC en plantas vivas depende de la fase de maduración. Si está en floración avanzada, valores cercanos al máximo del rango.';
    return { traits, interpretation, lowConf };
  }

  return null;
}
