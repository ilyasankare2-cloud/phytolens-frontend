// Source of truth for category metadata. Mirror at app/shared/labels.ts (mobile).
// CRITICAL: keep both files identical. See TD-005 in docs/TECH_DEBT.md

import { palette } from './theme';

export const LABELS = {
  bud:   { emoji: '🌿', color: palette.green,     text: 'Cogollo seco' },
  hash:  { emoji: '🟤', color: palette.hashBrown, text: 'Hachís / Resina' },
  other: { emoji: '🚫', color: palette.muted,     text: 'No es cannabis' },
  plant: { emoji: '🌱', color: palette.plantLime, text: 'Planta viva' },
};

// Labels users can pick when contributing a photo.
// Note: 'other' = "this is NOT cannabis" (rejection class for training).
// Helps the AI to not false-positive on hands, backgrounds, random objects.
export const CONTRIB_LABELS = {
  bud:   { emoji: '🌿', color: palette.green,     text: 'Cogollo seco', help: 'Flor seca, lista para consumir' },
  hash:  { emoji: '🟤', color: palette.hashBrown, text: 'Hachís',       help: 'Resina prensada' },
  plant: { emoji: '🌱', color: palette.plantLime, text: 'Planta viva',  help: 'En crecimiento o floración' },
  other: { emoji: '🚫', color: palette.muted,     text: 'No aplica',    help: 'Foto sin cannabis: mano, fondo, objeto…' },
};

export const EXTRA_INFO = {
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
