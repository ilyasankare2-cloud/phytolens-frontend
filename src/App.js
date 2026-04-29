import { useState } from 'react';
import {
  View, Text, TouchableOpacity, Image,
  ScrollView, StyleSheet, ActivityIndicator, Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

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
    moderation:  'Empieza con una dosis baja. Espera 15 min antes de repetir.',
    tip:         '💡 El vaporizador preserva mejor los terpenos y reduce el daño pulmonar.',
    cbd_range:   '0.1% — 2%',
  },
  hash: {
    effects:     ['Relajación profunda', 'Sedación', 'Analgesia', 'Euforia suave'],
    aroma:       ['Terroso', 'Especiado', 'Dulce', 'Madera'],
    consumption: ['Porro mezclado', 'Pipa', 'Hookah', 'Dab'],
    moderation:  'Alta concentración. Usa cantidades muy pequeñas si eres principiante.',
    tip:         '💡 El hash marroquí suele tener entre 20-35% THC. El bubble hash puede superar el 50%.',
    cbd_range:   '1% — 5%',
  },
  other: {
    effects:     ['Variable según producto', 'Puede ser muy potente'],
    aroma:       ['Variable'],
    consumption: ['Dab', 'Vaporizador', 'Oral (aceites)'],
    moderation:  'Los extractos son muy concentrados. Dosis mínimas para empezar.',
    tip:         '💡 El rosin es el extracto más natural: solo presión y calor, sin solventes.',
    cbd_range:   'Variable',
  },
  plant: {
    effects:     ['Depende de la variedad y fase'],
    aroma:       ['Verde', 'Herbáceo', 'Floral en floración'],
    consumption: ['No aplica en esta fase'],
    moderation:  'Planta en crecimiento. El THC se desarrolla principalmente en floración.',
    tip:         '💡 Las plantas en pre-cosecha tienen los tricomas más visibles y potentes.',
    cbd_range:   'Depende de la variedad',
  },
};

function Badge({ text, color }) {
  return (
    <View style={[s.badge, { borderColor: color }]}>
      <Text style={[s.badgeText, { color }]}>{text}</Text>
    </View>
  );
}

function Section({ title, children }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function ResultCard({ result, imageUri }) {
  const cfg   = LABELS[result.label];
  const extra = EXTRA_INFO[result.label];
  const conf  = result.confidence * 100;

  return (
    <View style={[s.result, { borderColor: cfg.color }]}>
      {imageUri && <Image source={{ uri: imageUri }} style={s.resultImage} />}

      {/* Header */}
      <View style={s.resultHeader}>
        <Text style={s.resultEmoji}>{cfg.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[s.resultLabel, { color: cfg.color }]}>{result.display}</Text>
          <Text style={s.resultConf}>Confianza: {conf.toFixed(1)}%</Text>
          <View style={s.qualityRow}>
            <View style={[s.qualityDot, { backgroundColor: conf >= 85 ? '#4CAF50' : conf >= 65 ? '#FF9800' : '#f44336' }]} />
            <Text style={s.resultQuality}>Calidad del análisis: {result.quality}</Text>
          </View>
        </View>
      </View>

      {/* THC / CBD */}
      <View style={s.thcRow}>
        <View style={[s.thcBox, { flex: 1 }]}>
          <Text style={s.thcTitle}>THC estimado</Text>
          <Text style={[s.thcValue, { color: cfg.color }]}>{result.thc_estimate}%</Text>
          <Text style={s.thcRange}>{result.thc_min}% — {result.thc_max}%</Text>
        </View>
        <View style={[s.thcBox, { flex: 1, marginLeft: 8 }]}>
          <Text style={s.thcTitle}>CBD típico</Text>
          <Text style={[s.thcValue, { color: '#aaa', fontSize: 16 }]}>{extra.cbd_range}</Text>
          <Text style={s.thcRange}>Rango habitual</Text>
        </View>
      </View>

      {/* Descripción */}
      <Text style={s.description}>{result.description}</Text>

      {/* Efectos */}
      <Section title="⚡ Efectos esperados">
        <View style={s.badgeRow}>
          {extra.effects.map(e => <Badge key={e} text={e} color={cfg.color} />)}
        </View>
      </Section>

      {/* Aroma */}
      <Section title="👃 Perfil de aroma">
        <View style={s.badgeRow}>
          {extra.aroma.map(a => <Badge key={a} text={a} color="#666" />)}
        </View>
      </Section>

      {/* Modo de consumo */}
      <Section title="🔥 Formas de consumo">
        <View style={s.badgeRow}>
          {extra.consumption.map(c => <Badge key={c} text={c} color="#444" />)}
        </View>
      </Section>

      {/* Moderación */}
      <View style={s.moderationBox}>
        <Text style={s.moderationTitle}>⚠️ Moderación</Text>
        <Text style={s.moderationText}>{extra.moderation}</Text>
      </View>

      {/* Tip */}
      <View style={s.tipBox}>
        <Text style={s.tipText}>{extra.tip}</Text>
      </View>

      {/* Variedades */}
      <Section title="🌱 Variedades comunes">
        <View style={s.badgeRow}>
          {result.varieties.map(v => <Badge key={v} text={v} color={cfg.color} />)}
        </View>
      </Section>

      {/* Barras de probabilidad */}
      <Section title="📊 Análisis completo">
        {Object.entries(result.all_probs).map(([key, val]) => (
          <View key={key} style={s.barRow}>
            <Text style={s.barLabel}>{LABELS[key].emoji} {LABELS[key].text}</Text>
            <View style={s.barBg}>
              <View style={[s.barFill, { width: `${(val * 100).toFixed(0)}%`, backgroundColor: LABELS[key].color }]} />
            </View>
            <Text style={s.barVal}>{(val * 100).toFixed(1)}%</Text>
          </View>
        ))}
      </Section>
    </View>
  );
}

export default function App() {
  const [screen, setScreen]   = useState('home');
  const [image, setImage]     = useState(null);
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permiso necesario', 'Necesitamos acceso a tu galería.'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!res.canceled) { setImage(res.assets[0]); setResult(null); setScreen('home'); }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permiso necesario', 'Necesitamos acceso a tu cámara.'); return; }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!res.canceled) { setImage(res.assets[0]); setResult(null); setScreen('home'); }
  };

  const analyze = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', { uri: image.uri, type: 'image/jpeg', name: 'photo.jpg' });
      const res  = await fetch(`${API}/analyze`, { method: 'POST', body: form });
      const data = await res.json();
      if (data.success) {
        setResult(data.result);
        setHistory(prev => [{ result: data.result, imageUri: image.uri, date: new Date().toLocaleString() }, ...prev]);
        setScreen('result');
      } else {
        Alert.alert('Error', 'No se pudo analizar la imagen.');
      }
    } catch {
      Alert.alert('Error', 'No se puede conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setImage(null); setResult(null); setScreen('home'); };

  // HISTORIAL
  if (screen === 'history') {
    return (
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => setScreen('home')}>
            <Text style={s.backBtn}>← Volver</Text>
          </TouchableOpacity>
          <Text style={s.topTitle}>Historial</Text>
          <TouchableOpacity onPress={() => { setHistory([]); setScreen('home'); }}>
            <Text style={s.clearBtn}>Borrar</Text>
          </TouchableOpacity>
        </View>
        {history.length === 0
          ? <Text style={s.emptyText}>No hay análisis todavía.</Text>
          : history.map((item, i) => (
              <View key={i} style={s.historyItem}>
                <Text style={s.historyDate}>🕐 {item.date}</Text>
                <ResultCard result={item.result} imageUri={item.imageUri} />
              </View>
            ))
        }
      </ScrollView>
    );
  }

  // RESULTADO
  if (screen === 'result' && result) {
    return (
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <Text style={s.title}>🔬 PhytoLens</Text>
        <ResultCard result={result} imageUri={image?.uri} />
        <TouchableOpacity style={s.newBtn} onPress={reset}>
          <Text style={s.newBtnText}>📷 Analizar otra foto</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.historyBtn} onPress={() => setScreen('history')}>
          <Text style={s.historyBtnText}>📋 Ver historial ({history.length})</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // INICIO
  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.title}>🔬 PhytoLens</Text>
      <Text style={s.subtitle}>Identificación inteligente de cannabis</Text>

      <View style={s.btnRow}>
        <TouchableOpacity style={s.camBtn} onPress={takePhoto}>
          <Text style={s.camBtnIcon}>📷</Text>
          <Text style={s.camBtnText}>Cámara</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.camBtn} onPress={pickImage}>
          <Text style={s.camBtnIcon}>🖼️</Text>
          <Text style={s.camBtnText}>Galería</Text>
        </TouchableOpacity>
      </View>

      {image && <Image source={{ uri: image.uri }} style={s.preview} />}

      {image && (
        <TouchableOpacity style={[s.analyzeBtn, loading && s.analyzeBtnDisabled]} onPress={analyze} disabled={loading}>
          {loading
            ? <><ActivityIndicator color="#fff" /><Text style={[s.analyzeBtnText, { marginLeft: 8 }]}>Analizando...</Text></>
            : <Text style={s.analyzeBtnText}>Analizar imagen</Text>
          }
        </TouchableOpacity>
      )}

      {!image && (
        <View style={s.placeholder}>
          <Text style={s.placeholderEmoji}>🔬</Text>
          <Text style={s.placeholderText}>Haz una foto o elige una de la galería para identificar el tipo, calidad y efectos</Text>
        </View>
      )}

      {history.length > 0 && (
        <TouchableOpacity style={s.historyBtn} onPress={() => setScreen('history')}>
          <Text style={s.historyBtnText}>📋 Historial — {history.length} análisis</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#0D0D0D' },
  content:            { padding: 20, paddingTop: 60, paddingBottom: 40 },
  title:              { color: '#fff', fontSize: 26, fontWeight: '700', textAlign: 'center' },
  subtitle:           { color: '#555', fontSize: 13, textAlign: 'center', marginTop: 4, marginBottom: 24 },
  btnRow:             { flexDirection: 'row', gap: 12, marginBottom: 16 },
  camBtn:             { flex: 1, backgroundColor: '#1A1A1A', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#2a2a2a' },
  camBtnIcon:         { fontSize: 28, marginBottom: 4 },
  camBtnText:         { color: '#aaa', fontSize: 13 },
  preview:            { width: '100%', height: 260, borderRadius: 12, marginBottom: 16 },
  analyzeBtn:         { backgroundColor: '#4CAF50', borderRadius: 12, padding: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginBottom: 12 },
  analyzeBtnDisabled: { opacity: 0.5 },
  analyzeBtnText:     { color: '#fff', fontSize: 16, fontWeight: '700' },
  newBtn:             { backgroundColor: '#4CAF50', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16, marginBottom: 12 },
  newBtnText:         { color: '#fff', fontSize: 16, fontWeight: '700' },
  historyBtn:         { backgroundColor: '#1A1A1A', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#2a2a2a', marginBottom: 12 },
  historyBtnText:     { color: '#666', fontSize: 14 },
  placeholder:        { alignItems: 'center', marginTop: 40, padding: 24 },
  placeholderEmoji:   { fontSize: 48, marginBottom: 16 },
  placeholderText:    { color: '#444', textAlign: 'center', fontSize: 14, lineHeight: 22 },
  result:             { borderWidth: 1.5, borderRadius: 16, padding: 16, marginTop: 8 },
  resultImage:        { width: '100%', height: 200, borderRadius: 10, marginBottom: 16 },
  resultHeader:       { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 16 },
  resultEmoji:        { fontSize: 40 },
  resultLabel:        { fontSize: 22, fontWeight: '700' },
  resultConf:         { color: '#aaa', fontSize: 13, marginTop: 4 },
  qualityRow:         { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  qualityDot:         { width: 8, height: 8, borderRadius: 4 },
  resultQuality:      { color: '#aaa', fontSize: 12 },
  thcRow:             { flexDirection: 'row', gap: 0, marginBottom: 16 },
  thcBox:             { backgroundColor: '#111', borderRadius: 10, padding: 12, alignItems: 'center' },
  thcTitle:           { color: '#666', fontSize: 11, marginBottom: 4 },
  thcValue:           { fontSize: 28, fontWeight: '700' },
  thcRange:           { color: '#444', fontSize: 11, marginTop: 4 },
  description:        { color: '#888', fontSize: 13, marginBottom: 16, lineHeight: 20 },
  section:            { marginBottom: 16 },
  sectionTitle:       { color: '#666', fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  badgeRow:           { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge:              { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText:          { fontSize: 12, fontWeight: '500' },
  moderationBox:      { backgroundColor: '#1a0f00', borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#FF9800' },
  moderationTitle:    { color: '#FF9800', fontSize: 12, fontWeight: '700', marginBottom: 4 },
  moderationText:     { color: '#aaa', fontSize: 13, lineHeight: 18 },
  tipBox:             { backgroundColor: '#0f1a0f', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#2a4a2a' },
  tipText:            { color: '#8BC34A', fontSize: 13, lineHeight: 18 },
  barRow:             { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  barLabel:           { color: '#666', fontSize: 11, width: 100 },
  barBg:              { flex: 1, height: 5, backgroundColor: '#1a1a1a', borderRadius: 3, overflow: 'hidden' },
  barFill:            { height: '100%', borderRadius: 3 },
  barVal:             { color: '#555', fontSize: 11, width: 38, textAlign: 'right' },
  topBar:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  topTitle:           { color: '#fff', fontSize: 18, fontWeight: '700' },
  backBtn:            { color: '#4CAF50', fontSize: 15 },
  clearBtn:           { color: '#f44336', fontSize: 14 },
  historyItem:        { marginBottom: 24 },
  historyDate:        { color: '#444', fontSize: 12, marginBottom: 8 },
  emptyText:          { color: '#444', textAlign: 'center', marginTop: 60, fontSize: 15 },
});
