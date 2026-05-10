# ADR-0003 — ResultCard: jerarquía + lenguaje humano

**Status:** Accepted
**Date:** 2026-05-10
**Deciders:** Principal Engineer (con autorización del founder)

## Context

La pantalla de resultado se sentía saturada y "generada por IA":
1. **9-10 emojis decorativos** en una sola pantalla (⚡ 👃 🔥 ⚠️ 💡 🌱 🔬 📊 + retry 📷). Estética de Discord, no de producto premium.
2. **Cero jerarquía**: 11 secciones (Efectos, Aroma, Consumo, Moderación, Tip, Variedades, Rasgos, Probabilidades, etc.) todas con el mismo peso visual. El usuario no podía distinguir qué era importante.
3. **Lenguaje neutro** tipo Wikipedia ("Concentrado de resina de cannabis prensada"), suena a output de modelo.

## Decision

Tres cambios en serie, sin perder información:

### 1. Despojar emojis decorativos
Mantener sólo:
- Emoji de la categoría en el header (`🌿/🟤/🌱/🚫`) — protagonista
- Emojis en barras de probabilidad (`LABELS[key].emoji`) — identificador rápido

Quitar todos los demás. Reemplazar `📊 Análisis completo` → `Probabilidades` (más honesto).

### 2. Jerarquía en 5 niveles

| Nivel | Qué | Visibilidad |
|-------|-----|-------------|
| 1 | Foto + categoría + confianza + calidad | Siempre |
| 2 | THC (expandible, ADR-0002) + CBD + descripción corta | Siempre |
| 4 | Caja Moderación | Siempre (aviso de seguridad, no se oculta) |
| 3 | "Más detalle" → Efectos, Aroma, Consumo, Variedades, Tip | Colapsado por defecto |
| 5 | "Análisis técnico" → Rasgos visuales, Probabilidades | Colapsado por defecto |

Orden visual: 1 → 2 → 4 → 3 → 5. Moderación entre Lvl 2 y los acordeones para que sea imposible perdérsela.

Animación: 250 ms `cubic-bezier(.22,1,.36,1)` (mismo easing que el expandible THC). Web usa `max-height + opacity` con CSS transition. Mobile usa `LayoutAnimation` con `easeInEaseOut`. Acceso por teclado en web con `aria-expanded`.

### 3. Reescribir copy en voz humana
- Frases cortas, tuteo directo, sin lenguaje pasivo de manual
- Mantener exactitud técnica
- Aplicado a: descripciones (backend `inference.py`), moderation y tip (frontend `labels.{js,ts}`), texto de NotDetectedCard

Ejemplos:
- ANTES: "Alta concentración. Usa cantidades muy pequeñas si eres principiante."
- DESPUÉS: "Esto va fuerte. Si vienes de fumar flor, baja la cantidad a la mitad o menos."

## Consequences

### Positivas
- Pantalla por defecto: foto, categoría, THC/CBD/descripción, moderación. Limpia, se procesa en 2 segundos.
- Información completa sigue ahí — un click la revela.
- El producto se siente Linear/Apple Health, no Discord.
- Copy diferenciado de cualquier app genérica de cannabis.

### Negativas
- Más estado por componente (3 useState: thc, more, tech). Aceptable.
- Web mantiene patrones inline para colapsables; podría DRY-arse contra el expandible THC pero sería refactor scope creep.
- Texto reescrito requiere revisión humana periódica (memoria de marca). Las plantillas no.

### Notas de seguimiento
- `EXTRA_INFO['other']` en labels todavía tiene texto incorrecto sobre extractos (legacy del rebranding a "rejection class"). NO se mostraba en UI antes y sigue sin mostrarse, así que no se tocó. Si se reusa en otro contexto, hay que limpiarlo.

## References
- ADR-0001 Foundation Overhaul
- ADR-0002 THC Expandible Interpretation (mismo patrón de easing y animación)
- TD-005 (labels duplicados en web/mobile, mismo principio)
