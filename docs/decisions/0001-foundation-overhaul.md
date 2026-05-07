# ADR-0001 — Foundation Overhaul

**Status:** Accepted
**Date:** 2026-05-07
**Deciders:** Principal Engineer (con autorización del founder)

## Context

Auditoría reveló deuda crítica: tests falsos, paleta divergente, cero observabilidad, sin compresión de imágenes, datos duplicados entre plataformas, render performance frágil.

El founder pidió "elevar el producto al nivel Linear/Notion" sin gastar dinero. Las opciones son hacer **mucho mediocre** o **poco bien**.

## Decision

Arreglar las foundations antes de añadir features. Concretamente, en una sola sesión:

1. **Design system unificado** (RFC-0001)
2. **Shared labels** entre web y mobile (mitigación de monorepo)
3. **Image compression** client-side
4. **Skeleton loader** + **empty states** diseñados
5. **Memoization** en componentes críticos
6. **Tests reales** (smoke + integration)
7. **Error boundary** en web
8. **Reproducibility** (`runtime.txt`, `.nvmrc`)
9. **Haptic feedback** móvil
10. **Sentry scaffolding** (DSN como env var, free tier)

## Consequences

### Positivas
- Web/mobile/landing se ven del mismo producto
- Bugs futuros se detectan: tests + Sentry
- Render perf no se va a degradar al añadir features
- Imágenes 5× más rápidas de subir
- App móvil se siente nativa (haptics)

### Negativas
- Cambio visual del verde `#4CAF50` → `#30d158` perceptible
- App.js todavía es monolítico (781 líneas) — la deuda persiste pero no empeora
- Los tests son smoke, no unit completos. Mejor que nada.

### No abordado en esta sesión (documentado en TECH_DEBT)
- TD-001 modelos en git → R2 (requiere refactor de `inference.py`)
- TD-002 rate limit a Redis (requiere Upstash existente, scope creep)
- TD-009 tipos generados desde OpenAPI (necesita pipeline)
- TD-013 staging environment (requiere config Vercel/Railway)

## References

- RFC-0001 Design System
- TECH_DEBT.md
