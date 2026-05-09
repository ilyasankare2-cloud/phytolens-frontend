# TECH_DEBT

Registro vivo de la deuda técnica conocida del proyecto TrichAI.
Cada item tiene severidad (🔴 alto, 🟡 medio, 🟢 bajo), repo afectado y un plan.

> Regla: **se documenta aquí antes de arreglarlo.** Si no está aquí, no es deuda — es sólo trabajo pendiente.

---

## 🔴 ALTO

### TD-001 · Modelos versionados en git
- **Repo:** `phytolens-backend`
- **Problema:** `model/phytolens_v1.onnx` (79MB) y `model/phytolens_best.pt` (80MB) están trackeados en git. Cada clone descarga 163MB. Cada deploy de Railway descarga 163MB.
- **Plan:** Mover a Cloudflare R2 (`models/v{N}.onnx`). `inference.py` los descarga en `app.startup` y cachea en disco. Permite hot-swap sin redeploy.
- **Bloqueado por:** decisión sobre versionado del modelo.

### TD-002 · Rate limiting in-memory
- **Repo:** `phytolens-backend`
- **Problema:** `_rate_store: dict = defaultdict(list)` se reinicia en cada deploy y no funciona con múltiples workers. En cuanto Railway escale a 2 workers, el rate limit deja de tener efecto.
- **Plan:** Usar Upstash Redis (ya conectado para analytics) con `INCR + EXPIRE` por IP/minute.

### TD-003 · Tests son teatro
- **Repo:** `phytolens-frontendcd`
- **Problema:** El único test (`App.test.js`) es el default de CRA y **falla** si se ejecuta.
- **Plan:** Suite de smoke tests reales (home render, result render, history empty state).
- **Estado:** En progreso.

### TD-004 · Sin observabilidad
- **Repos:** todos
- **Problema:** Cero error tracking. Bugs en producción (ej. el `drawImage` con string en vez de Image) llevan minutos diagnosticar a ojo.
- **Plan:** Sentry free tier (5k events/mes). DSN como env var en Railway/Vercel/EAS.
- **Estado:** Scaffolding hecho, pendiente DSN del founder.

---

## 🟡 MEDIO

### TD-005 · LABELS y EXTRA_INFO duplicados 3 veces
- **Repos:** `phytolens-frontendcd`, `phytolens-app`, `trichai-landing`
- **Problema:** La misma data (categorías, efectos, aroma, consumo) está hardcoded en 3 sitios. Cualquier cambio requiere editar 3 archivos.
- **Plan:** Monorepo con `@trichai/shared` como package compartido. Mientras tanto: módulo único en `src/shared/labels.js` que se copia a mobile manualmente.
- **Mitigación temporal:** ✅ Hecho. Ambos archivos importan de un módulo idéntico, con header advirtiendo que son copias.

### TD-006 · 124 inline styles en App.js, cero memoization
- **Repo:** `phytolens-frontendcd`
- **Problema:** Cada keystroke dispara re-render del modal share, result card y historial. Funciona porque la app es pequeña, deja de funcionar al añadir features.
- **Plan:** Component splitting + React.memo + useCallback en handlers críticos.
- **Estado:** En progreso (memoization en handlers principales).

### TD-007 · Sin compresión client-side de imágenes
- **Repos:** `phytolens-frontendcd`, `phytolens-app`
- **Problema:** Web sube el archivo original (foto iPhone moderno = 3-5 MB). Inferencia sólo necesita 224×224. Estamos moviendo 20× más bytes de los necesarios.
- **Plan:** Resize a max 1280px + JPEG 0.85 antes de POST. Móvil ya usa quality 0.8 pero no hace resize.
- **Estado:** Resuelto en web. Mobile pendiente.

### TD-008 · Inconsistencia de paleta entre plataformas
- **Repos:** todos
- **Problema:** Web usa `#4CAF50` (Material), landing `#30d158` (Apple), mobile `#4CAF50`. Productos distintos.
- **Plan:** Migrar todo a `#30d158` (más premium, ya en landing). Tokens compartidos vía CSS vars + `theme.ts`.
- **Estado:** ✅ Resuelto.

### TD-009 · TypeScript con `Record<string, any>`
- **Repo:** `phytolens-app`
- **Problema:** EXTRA_INFO y result están tipados como `any`. TypeScript no aporta nada.
- **Plan:** Generar tipos desde el OpenAPI del backend con `openapi-typescript`. Mientras tanto, escribir tipos manualmente.

---

## 🟢 BAJO

### TD-010 · Mobile package sigue siendo `phytolens-app`
- **Repo:** `phytolens-app`
- **Problema:** `package.json` tiene `"name": "phytolens-app"`. La marca dice TrichAI. Sólo es cosmético hasta que se publique en stores.
- **Plan:** Renombrar antes de submit a Play Store.

### TD-011 · No hay error boundaries en web
- **Repo:** `phytolens-frontendcd`
- **Problema:** Si un render falla por un null inesperado, toda la app revienta con pantalla blanca.
- **Plan:** Wrap App con `<ErrorBoundary>`.
- **Estado:** ✅ Resuelto.

### TD-012 · Sin política de retención en R2
- **Repo:** `phytolens-backend`
- **Problema:** Las contribuciones se acumulan indefinidamente sin proceso de revisión/borrado.
- **Plan:** Lifecycle rule en R2 (delete after 1 year) + revisión manual en proceso de retraining.

### TD-013 · Sin staging environment
- **Repos:** todos
- **Problema:** Cada push a main va directo a producción.
- **Plan:** Branch `staging` con preview deploys en Vercel y Railway environment separado.

### TD-014 · Mobile usa `MediaTypeOptions.Images` (deprecated)
- **Repo:** `phytolens-app`
- **Problema:** En expo-image-picker 17+ está deprecated, hay que usar `mediaTypes: ['images']`.
- **Plan:** Migrar API.

### TD-015 · Heurísticas de hash derivadas en cliente
- **Repos:** `phytolens-frontendcd`, `phytolens-app`
- **Problema:** "Uniformidad" e "indicio de tonos verdes" para hash se calculan en `thcInterpretation.{js,ts}` a partir de `roughness` y `dominant_color`. La regla vive en cliente y está duplicada en web/mobile (mismo problema que TD-005).
- **Plan:** Mover a `visual_traits.py` cuando se haga el siguiente deploy de backend. Añadir campos `uniformity` y `green_tint` al payload. Ver ADR-0002.
- **Nota conceptual:** La cobertura de tricomas no aplica a hash (resina prensada no preserva la estructura cristalina). Por eso el módulo de interpretación la ignora explícitamente para `label === 'hash'`.

---

## Histórico (resuelto)

- ✅ TD-008 paleta unificada
- ✅ TD-011 error boundary
- ✅ TD-007 image compression web
- ✅ TD-005 labels compartidos (mitigación)
