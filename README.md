# TrichAI Web

Identificador de cannabis con IA. Sube una foto y obtén la categoría, THC estimado, efectos, rasgos visuales y más.

[![Vercel](https://img.shields.io/badge/desplegado-Vercel-black)](https://vercel.com)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev)

**[trichai.xyz](https://trichai.xyz)**

## Stack

React 19 + Create React App. Sin router, sin librería de estado, sin framework CSS. Toda la app vive en `src/App.js` con estilos inline.

La navegación se controla con una variable de estado `mode` (`analyze | contribute`) y un booleano `historyOpen`. Sin dependencias adicionales a las que trae CRA.

## Ejecutar en local

```bash
npm install
npm start
```

La URL del backend es una constante al inicio de `src/App.js`. Cámbiala si quieres apuntar a un backend local.

## Flujo de datos

1. El usuario selecciona un archivo → `URL.createObjectURL()` para preview (se revoca al resetear)
2. `analyze()` hace POST a `/analyze` → resultado en estado → entrada guardada en `localStorage` con imagen en base64
3. El historial sobrevive recargas de página, limitado a 50 entradas bajo la clave `trichai_history`

## Despliegue

Push a `main` → Vercel despliega automáticamente. Las cabeceras de seguridad (CSP, X-Frame-Options, etc.) están configuradas en `vercel.json`.
