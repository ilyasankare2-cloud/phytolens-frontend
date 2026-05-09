# ADR-0002 — THC box: range only + expandable interpretation

**Status:** Accepted
**Date:** 2026-05-09
**Deciders:** Principal Engineer (con autorización del founder)

## Context

La caja "THC estimado" mostraba un número grande (`28%`) calculado como `thc_min + (thc_max - thc_min) * confidence`. Es una **interpolación lineal sobre la confianza del clasificador**, no una medida. El número implicaba precisión que el modelo no tiene.

Al mismo tiempo, el backend ya calcula rasgos visuales reales (`trichome_coverage`, `texture`, `cure`, `dominant_color`, etc.) que no se aprovechaban más allá de la sección "Rasgos visuales" estática.

## Decision

1. **Quitar el valor central inventado.** La caja muestra sólo el rango (`20% — 60%`) como número principal. El campo `thc_estimate` sigue en la respuesta del backend (lo usa la share card y no queremos romper compatibilidad), pero la UI deja de mostrarlo.
2. **Hacer la caja expandible.** Al pulsar, despliega un panel con:
   - 2-3 rasgos visuales reales detectados (cambian según categoría)
   - Una interpretación en lenguaje natural sobre dónde cae el THC dentro del rango ("mitad superior", "mitad inferior", "centro", "no determinable")
   - Aviso de "Estimación visual, no sustituye análisis de laboratorio"
3. **Lógica centralizada** en `src/shared/thcInterpretation.js` (web) y copia en `app/shared/thcInterpretation.ts` (mobile). Función pura: recibe el resultado del backend, devuelve `{ traits, interpretation, lowConf }`.

### Reglas de interpretación

| Categoría | Rasgos mostrados | Cómo se decide |
|-----------|------------------|----------------|
| `bud` | Tricomas, Textura, Curación | Alta si `trichomes==Alta && textura cristalina && bien curado`. Baja si alguno es Baja/Lisa/Muy oscura. Media en el resto. Ambigua si `brightness<25 \|\| brightness>92`. |
| `hash` | Color dominante, Uniformidad (de roughness invertido), Tonos verdes (de RGB) | Alta si uniforme y sin verde. Baja si verde presente o irregular. Media si no. **Tricomas se ignoran deliberadamente** — no aplican al concentrado prensado. |
| `plant` | Color dominante, Brillo | Mensaje fijo: el THC depende de la fase de maduración. |
| `other` | — | Se oculta toda la caja THC+CBD. Ya estaba así por la rama `NotDetectedCard`. |

### Reglas estrictas
- Nunca dar un número concreto en la conclusión. Sólo expresiones cualitativas.
- Sólo usar campos que el backend realmente calcula. Hash uniformidad y verde se derivan localmente con las funciones del módulo compartido.
- Si `confidence < 0.60`: bandera amarilla "Confianza baja del modelo. Esta interpretación es orientativa." encima del detalle.

## Consequences

### Positivas
- La UI deja de mentir sobre la precisión del modelo.
- El usuario entiende **por qué** el modelo da ese rango — pasamos de output a explicación.
- La lógica está centralizada y testeable como función pura.

### Negativas
- Más superficie de UI. Más estados a probar (4 categorías × abierto/cerrado × low-conf/normal).
- Web y mobile mantienen copias del módulo compartido (TD-005). Cambiar reglas requiere editar dos archivos.
- La derivación de "uniformidad" y "tonos verdes" para hash es una heurística simple en cliente. Se podría mover a backend (ver TD-015).

### Alternativas descartadas
- **Mover la lógica al backend en `visual_traits.py`**: requería deploy de Railway y bloqueaba el cambio. Decisión: hacerlo en cliente ahora, dejar como TD-015 si se quiere migrar.
- **Hacer también CBD expandible**: CBD viene de un string hardcoded en `EXTRA_INFO`, no hay señal visual real para interpretar. Sería ruido.
- **Hacer crecer la caja THC en sí (no panel debajo)**: descuadraba el grid de dos columnas. Panel separado debajo es más limpio.

## References
- TD-005 — labels duplicados (mismo patrón aplica a `thcInterpretation`)
- TD-015 — derivar uniformidad/tonos-verdes en backend (nuevo)
