# RFC-0001 — Design System Unificado

**Estado:** Aprobado · **Autor:** Principal Engineer · **Fecha:** 2026-05-07

## Problema

TrichAI vive en 3 superficies (web, móvil, landing) y cada una tiene su propia paleta, tipografía y radios. Resultado: la marca no es reconocible. Linear, Notion, Cal.com **nunca** harían esto — su lenguaje visual es uno solo en todas las plataformas.

Concretamente:
- Web: verde `#4CAF50` (Material Design)
- Landing: verde `#30d158` (Apple)
- Mobile: verde `#4CAF50` (Material)
- Tipografías mezcladas: web usa system fonts genéricas, landing usa Inter, mobile usa system default
- Radios: web usa 8/10/12, landing 14/18/980, mobile 8/10/12/16
- Espaciados ad-hoc en cada lugar

## Opciones consideradas

### A — Mantener cada plataforma con su estilo
- ❌ Genera trabajo de marketing distinto para cada superficie
- ❌ Usuario percibe productos distintos
- ❌ Sigue divergiendo cada cambio

### B — Adoptar Material Design completo (`#4CAF50`)
- ❌ Demasiado "Android genérico", no premium
- ❌ Hay que rehacer el landing entero
- ❌ Inter + Material no encaja

### C — Adoptar paleta Apple-style del landing (`#30d158`) ✅
- ✅ Landing ya está ahí — sólo migran web y mobile
- ✅ Estética premium reconocible (es el verde de iOS)
- ✅ Inter ya usado en landing, fácil añadir a web
- ✅ Compatible con material design para móvil porque es un verde similar

## Decisión

**Adoptar la paleta y tipografía del landing como source of truth.**

### Tokens canónicos

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#000000` | Fondo de página |
| `--surface` | `#0a0a0a` | Fondo de cards primarios |
| `--card` | `#111111` | Fondo de cards anidados |
| `--border` | `rgba(255,255,255,0.06)` | Bordes sutiles |
| `--green` | `#30d158` | Acento primario |
| `--green-glow` | `rgba(48,209,88,0.15)` | Glow detrás del botón |
| `--green-dim` | `rgba(48,209,88,0.06)` | Background sutil verde |
| `--text` | `#f5f5f7` | Texto primario |
| `--muted` | `#6e6e73` | Texto secundario |
| `--dim` | `#3d3d3f` | Texto terciario / placeholders |
| `--radius-sm` | `8px` | Pequeño |
| `--radius-md` | `14px` | Cards medianas |
| `--radius-lg` | `18px` | Cards grandes |
| `--radius-pill` | `980px` | Botones tipo píldora |

### Tipografía

`Inter` con weights 400/500/600/700/800/900 desde Google Fonts. Fallback: `-apple-system, sans-serif`.

### Easings

| Token | Valor |
|---|---|
| `--ease-out` | `cubic-bezier(.22, 1, .36, 1)` |
| `--ease-in-out` | `cubic-bezier(.4, 0, .2, 1)` |

Linear nunca usa `ease` o `linear`. Siempre cubic-beziers naturales.

### Espaciados

Sistema de 4px: `4, 8, 12, 16, 20, 24, 32, 40, 48, 60, 80`. Nunca valores entre medio.

## Implementación

1. **Web (`phytolens-frontendcd`):**
   - Definir variables CSS en `index.css`
   - Crear `src/shared/theme.js` con los mismos valores como objeto JS para inline styles
   - Importar Inter desde Google Fonts en `public/index.html`
   - Migrar `App.js` a usar tokens

2. **Mobile (`phytolens-app`):**
   - Crear `app/shared/theme.ts` con los mismos valores
   - Migrar StyleSheet a usar tokens
   - Cargar Inter con `expo-font` (opcional, dejar para v2)

3. **Landing:** ya cumple, sólo confirmar valores.

4. **Backend:** no aplica.

## Riesgos

- Cambio visual perceptible. Verde nuevo es ligeramente distinto al actual.
- Inter no soporta todos los rangos Unicode (no afecta ES/EN).

## Métricas de éxito

- Una persona que ve los 3 productos los percibe como el mismo
- Cero hex codes hardcoded en componentes (todos vía tokens)
