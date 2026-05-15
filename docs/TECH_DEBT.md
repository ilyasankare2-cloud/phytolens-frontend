# TECH_DEBT

Registro vivo de la deuda técnica conocida del proyecto TrichAI.
Cada item tiene severidad (🔴 alto, 🟡 medio, 🟢 bajo), repo afectado y un plan.

> Regla: **se documenta aquí antes de arreglarlo.** Si no está aquí, no es deuda — es sólo trabajo pendiente.

---

## 🔴 ALTO

### TD-001 · Modelos versionados en git
- **Repo:** `phytolens-backend`
- **Problema:** `model/phytolens_v1.onnx` (79MB), `phytolens_v2.onnx` (77MB) y `phytolens_best.pt` (79MB) trackeados en git. 234MB en cada clone/deploy.
- **Plan:** Mover a Cloudflare R2. `inference.py` descarga en startup y cachea en disco. Permite hot-swap sin redeploy.
- **Estado:** ✅ Resuelto. Reusa el bucket `trichai-contributions` con prefijo `models/`. Env var `MODEL_KEY` (default `models/phytolens_v2.onnx`) elige el modelo. `git rm --cached` aplicado, `.gitignore` excluye `*.onnx` y `*.pt`. Para deployar nuevo modelo: subir a R2 → cambiar `MODEL_KEY` en Railway → restart. Blobs antiguos siguen en historial git (no se hizo `filter-repo`); clones futuros son slim a partir del commit.

### TD-002 · Rate limiting in-memory
- **Repo:** `phytolens-backend`
- **Problema:** `_rate_store: dict = defaultdict(list)` se reinicia en cada deploy y no funciona con múltiples workers. En cuanto Railway escale a 2 workers, el rate limit deja de tener efecto.
- **Plan:** Usar Upstash Redis (ya conectado para analytics) con `INCR + EXPIRE` por IP/minute.
- **Estado:** ✅ Resuelto. `check_rate()` usa Redis con pipeline `INCR + EXPIRE` cuando `redis` está disponible. Fallback transparente a in-memory si Redis falla. Multi-worker safe.

### TD-003 · Tests son teatro
- **Repo:** `phytolens-frontendcd`
- **Problema:** El único test (`App.test.js`) es el default de CRA y **falla** si se ejecuta.
- **Plan:** Suite de smoke tests reales (home render, result render, history empty state).
- **Estado:** ✅ Resuelto. 4 smoke tests pasan: brand, dropzone, analyze button disabled, tabs.

### TD-004 · Sin observabilidad
- **Repos:** todos
- **Problema:** Cero error tracking. Bugs en producción (ej. el `drawImage` con string en vez de Image) llevan minutos diagnosticar a ojo.
- **Plan:** Sentry free tier (5k events/mes). DSN como env var en Railway/Vercel/EAS.
- **Estado:** ✅ Resuelto. Un único proyecto Sentry para los 3 surfaces, distinguidos por `tag: platform=web|mobile|landing`. Mobile usa `@sentry/react-native` (init en `_layout.tsx`). Web usa `@sentry/browser` (init en `src/index.js`, expuesto a `window.Sentry` que la `ErrorBoundary` ya consumía). Landing usa el bundle CDN inline. DSN hardcoded (es un identificador público write-only). Backend Railway sin Sentry todavía — bajo prioridad porque los logs de Railway ya cubren errores de servidor.

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
- **Estado:** ✅ Resuelto (nivel 2). `App.js` partido de 1068 → 428 líneas. Extraídos: `components/CookieBanner.js`, `AppFooter.js` (incl. FeedbackModal), `NotDetectedCard.js`, `ResultCard.js`, `HistoryView.js`, `utils/historyStorage.js`, `utils/shareCard.js`. Componentes ya memoizados (`ResultCard`, `NotDetectedCard`). Hex codes hardcodeados migrados a tokens `palette`. Grises de texto intermedios (#555, #888, #aaa) sin equivalente en palette — se dejan.

### TD-007 · Sin compresión client-side de imágenes
- **Repos:** `phytolens-frontendcd`, `phytolens-app`
- **Problema:** Web sube el archivo original (foto iPhone moderno = 3-5 MB). Inferencia sólo necesita 224×224. Estamos moviendo 20× más bytes de los necesarios.
- **Plan:** Resize a max 1280px + JPEG 0.85 antes de POST.
- **Estado:** ✅ Resuelto en web (`utils/imageCompress`) y mobile (`shared/compressImage` con `expo-image-manipulator`).

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
- **Estado:** ✅ Resuelto. `package.json` y `package-lock.json` ahora dicen `"name": "trichai"`. Slug de Expo (`trichai-app`) y `projectId` de EAS sin cambios para no romper builds.

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
- **Estado:** ✅ Resuelto.

### TD-015 · Heurísticas de hash derivadas en cliente
- **Repos:** `phytolens-frontendcd`, `phytolens-app`
- **Problema:** "Uniformidad" e "indicio de tonos verdes" para hash se calculan en `thcInterpretation.{js,ts}` a partir de `roughness` y `dominant_color`. La regla vive en cliente y está duplicada en web/mobile (mismo problema que TD-005).
- **Plan:** Mover a `visual_traits.py` cuando se haga el siguiente deploy de backend. Añadir campos `uniformity` y `green_tint` al payload. Ver ADR-0002.
- **Estado:** ✅ Resuelto. `visual_traits.py` (backend) ahora emite `uniformity` y `green_tint` con la misma regla que tenían los clientes. Web y mobile usan `v.uniformity ?? uniformityFromRoughness(...)` y `v.green_tint ?? hasGreenTint(...)` — toman lo del backend si llega, si no caen al cálculo local. Las heurísticas client-side quedan como fallback defensivo (clientes viejos contra backends nuevos no rompen, y viceversa) y pueden retirarse en una limpieza futura cuando todos los clientes activos consuman backend ≥ commit con `uniformity`.
- **Nota conceptual:** La cobertura de tricomas no aplica a hash (resina prensada no preserva la estructura cristalina). Por eso el módulo de interpretación la ignora explícitamente para `label === 'hash'`.

---

## 🛡️ SEGURIDAD (auditoría 2026-05-14)

Hallazgos abiertos de la auditoría completa sobre los 3 repos. Top-3 ya cerrados en commit `1143ed2` del backend (CORS allowlist, stats fail-closed, decompression-bomb cap).

### SEC-03 · 28 CVEs en deps de frontend (16 high) — 🟠 medio
- **Repo:** `trichai-frontend`
- **Problema:** `react-scripts@5.0.1` arrastra `@svgr/webpack`, `@babel/plugin-transform-modules-systemjs` con CVEs altos. Sólo afectan al build (no van al bundle de producción), pero `npm audit fix --force` rompe el build porque exige downgrade major.
- **Plan:** Migrar de Create React App a Vite. CRA está abandonado desde 2023. Mientras tanto, aceptar el riesgo (build-time only).

### SEC-04 · Rate-limit bypass vía `X-Forwarded-For` — 🟠 medio
- **Repo:** `trichai-backend`
- **Problema:** `_get_ip()` confía en el primer valor de `X-Forwarded-For`, que el cliente puede inyectar para saltarse las 20 req/min rotando IPs falsas.
- **Plan:** Identificar qué header pone Railway para la client IP real (revisar docs Railway). Si no, usar el **último** valor del XFF (más cercano a la infra), no el primero.

### SEC-05 · CSP con `'unsafe-inline'` en script-src — 🟠 medio
- **Repo:** `trichai-frontend`
- **Problema:** `vercel.json` lleva `script-src 'self' 'unsafe-inline' ...`. Cualquier XSS reflejado podría ejecutar scripts inline. Aceptable hoy porque el bootstrap GA en `public/index.html` es inline.
- **Plan:** Mover bootstrap GA a `public/gtag-init.js` y quitar `'unsafe-inline'` de script-src. `'unsafe-inline'` en style-src se queda (la app usa estilos inline en todas partes).

### SEC-06 · CSP probablemente bloquea Google Fonts — 🟠 medio
- **Repo:** `trichai-frontend`
- **Problema:** CSP declara `font-src 'self'` y `style-src 'self' 'unsafe-inline'` pero `index.html` carga `fonts.googleapis.com` + `fonts.gstatic.com`. La consola debería estar mostrando violaciones y los fonts cayendo a `-apple-system`.
- **Plan:** Añadir `https://fonts.googleapis.com` a `style-src` y `https://fonts.gstatic.com` a `font-src`. Alternativa: self-host Inter (elimina dependencia externa).

### SEC-08 · Sentry session replay al 10% en mobile — 🟠 medio (privacidad)
- **Repo:** `trichai-app`
- **Problema:** `_layout.tsx` tiene `replaysSessionSampleRate: 0.1`, sube screenshots a Sentry sin trigger de error. La app muestra fotos personales del usuario (cannabis, mano, fondos privados) que pueden quedar en un tercero.
- **Plan:** Bajar a `0` (mismo patrón que web). Activar `maskAllImages: true` en `mobileReplayIntegration()`.

### SEC-09 · Comparación de `STATS_API_KEY` no constant-time — 🟡 bajo
- **Repo:** `trichai-backend`
- **Estado:** ✅ Resuelto en commit `1143ed2` (junto con SEC-02). Ahora usa `hmac.compare_digest`.

### SEC-10 · `enableLogs: true` en Sentry mobile — 🟡 bajo
- **Repo:** `trichai-app`
- **Problema:** Envía `console.log` a Sentry. Si en futuro alguien hace `console.log(result)` para debug, esos datos salen del dispositivo.
- **Plan:** `enableLogs: false` salvo en dev (`__DEV__`).

### SEC-11 · Historial guardado con imagen base64 sin cifrar — 🟡 bajo
- **Repos:** `trichai-frontend`, `trichai-app`
- **Problema:** Web localStorage y mobile AsyncStorage guardan hasta 50 entries con `imageData: <base64>` sin cifrar. XSS o root al dispositivo accede a todo.
- **Plan:** Cifrar `imageData` con clave en `expo-secure-store` (mobile). En web considerar opt-in.

### SEC-12 · Logs filtran exception de Redis con URL — 🟡 bajo
- **Repo:** `trichai-backend`
- **Problema:** `main.py` imprime `{e}` directamente en errores de Redis. La excepción puede incluir la URL de Upstash con token.
- **Plan:** `print(f"[rate] Redis error: {type(e).__name__}")` sin interpolar `{e}`.

### SEC-13 · `/health` filtra fingerprint del stack — 🟡 bajo
- **Repo:** `trichai-backend`
- **Problema:** Devuelve `model`, `storage`, `analytics`. Ayuda a perfilar la infra antes de buscar exploits.
- **Plan:** Endpoint público con solo `{"status": "ok"}`. Versión detallada detrás de `require_stats_key`.

### SEC-14 · Validación de content-type confía en el cliente — 🟡 bajo
- **Repo:** `trichai-backend`
- **Problema:** Se valida `file.content_type` antes que magic bytes. El cliente puede mentir. La magic-byte check después sí filtra, así que es defensa redundante pero da falsa sensación.
- **Plan:** Quitar el primer check de content_type — `validate_image_magic` ya es suficiente.

### SEC-15 · Imágenes contribuidas sin strip EXIF + retención indefinida — 🟡 bajo
- **Repos:** `trichai-backend` (relacionado con TD-012)
- **Problema:** Fotos subidas a `/contribute` pueden traer GPS en EXIF. R2 las guarda para siempre. Si Europa: posible problema GDPR.
- **Plan:** En `save_contribution`, re-encode con Pillow para descartar EXIF antes de subir. Lifecycle rule en R2 (auto-delete 1y) — ya listado en TD-012.

### SEC-16 · Faltan headers de seguridad modernos — 🟠 medio
- **Repos:** `trichai-frontend`, `trichai-landing`
- **Problema:** `vercel.json` del frontend tenía 6 headers básicos pero faltaban HSTS, COOP, CORP. El landing no tenía `vercel.json` en absoluto, así que no aplicaba ningún header.
- **Estado:** ✅ Resuelto. Frontend amplía a 9 headers (incluido HSTS con preload, COOP same-origin, CORP same-origin). CSP corregido para permitir Google Fonts y Sentry. Landing tiene `vercel.json` nuevo con el conjunto base sin CSP (CSP se añadirá cuando se inventaríe bien lo que carga la página).

### SEC-17 · Sin escaneo automático de secretos en CI — 🟠 medio
- **Repos:** todos
- **Problema:** Si en el futuro alguien committea un `.env` o un token por error, tardas días en detectarlo a ojo.
- **Plan:** GitHub secret scanning se activa automáticamente para repos públicos. Para repos privados o capa extra: añadir `gitleaks` como GitHub Action. Pendiente: el usuario debe verificar en Settings → Security & analysis que "Secret scanning" y "Push protection" están on.

### SEC-18 · Sin `SECURITY.md` ni canal de disclosure — 🟡 bajo
- **Repos:** todos
- **Estado:** ✅ Resuelto. `SECURITY.md` en los 4 repos con email `trichaiphy@gmail.com` y SLA de 5 días laborables.

### SEC-19 · Sin escaneo de CVEs en deps de backend — 🟡 bajo
- **Repo:** `trichai-backend`
- **Estado:** ✅ Resuelto. CI job `audit` corre `pip-audit` en cada push y PR (informational, no bloquea).

### SEC-20 · Sin CI ni gates de calidad antes de deploy — 🟠 medio
- **Repos:** todos
- **Problema:** Cada `git push origin main` desplegaba a producción sin tests, lint, type-check ni audit. Cualquiera con write access podía meter cualquier cosa.
- **Estado:** ✅ Resuelto parcialmente. CI workflows en frontend (test + build + npm audit), backend (pytest + pip-audit), mobile (tsc + lint + npm audit). CodeQL SAST semanal en los 3. Faltaría: branch protection rules en GitHub para que main solo acepte commits que pasen CI — el usuario debe activarlo en Settings → Branches.

### SEC-21 · 2FA en GitHub sin verificar — 🟠 medio
- **Repo:** N/A (cuenta GitHub `ilyasankare2-cloud`)
- **Problema:** Sin 2FA, el producto entero depende de una contraseña. Una filtración compromete los 4 repos y los deploys (Vercel/Railway/EAS usan la cuenta GitHub para auth).
- **Plan:** Pendiente acción manual del usuario. Settings → Password and authentication → Two-factor authentication. Recomendado: passkey o app autenticadora (no SMS).

### SEC-22 · Sin estrategia de backup para R2 — 🟡 bajo
- **Repo:** `trichai-backend`
- **Problema:** Las contribuciones en R2 son el único activo de datos futuro (entrenamiento). Si Cloudflare suspende la cuenta o pierde la región, se pierde todo.
- **Plan:** Script periódico que sincronice R2 a otro proveedor (B2, S3 Glacier) o a disco local. Bajo riesgo hoy (volumen pequeño) pero crítico el día que tengas dataset valioso.

---

## Histórico (resuelto)

- ✅ TD-001 modelos a R2
- ✅ TD-002 rate limit a Redis
- ✅ TD-003 smoke tests reales
- ✅ TD-004 Sentry en web + mobile + landing
- ✅ TD-005 labels compartidos (mitigación)
- ✅ TD-007 image compression (web + mobile)
- ✅ TD-008 paleta unificada
- ✅ TD-010 rename package mobile a `trichai`
- ✅ TD-011 error boundary
- ✅ TD-014 `mediaTypes` array en image-picker
- ✅ TD-006 memoización + tokens de palette en styles
- ✅ TD-015 `uniformity` + `green_tint` migrados al backend (cliente con fallback)
- ✅ SEC-01 CORS allowlist (backend)
- ✅ SEC-02 stats fail-closed + constant-time compare (backend)
- ✅ SEC-07 decompression-bomb cap en Pillow (backend)
- ✅ SEC-09 `hmac.compare_digest` en stats key (incluido en SEC-02)
- ✅ SEC-16 HSTS + COOP + CORP en vercel.json (frontend + landing)
- ✅ SEC-18 SECURITY.md en los 4 repos
- ✅ SEC-19 pip-audit en CI del backend
- ✅ SEC-20 CI workflows + CodeQL en los 3 repos con código
