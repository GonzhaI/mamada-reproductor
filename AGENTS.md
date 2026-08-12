# AGENTS.md — mamada-reproductor

Expo SDK 54 · React Native 0.81 · React 19.1

## Entry point
`package.json` main = `expo-router/entry` (file-based routing via `app/`).
DO NOT use `App.tsx` or `index.ts` as entry — Expo Router manages that.

## Developer commands
- `npm start` — dev server
- `npm run android` / `npm run ios`
- No test/lint/typecheck scripts configured

## Key config quirks
- `legacy-peer-deps=true` in `.npmrc` — always use this when installing deps
- Babel: `babel-preset-expo` + `react-native-reanimated/plugin` required
- Path alias `@/` maps to project root
- `.env` NOT committed. Variables de Jamendo (pendiente de crear):
  - `EXPO_PUBLIC_JAMENDO_CLIENT_ID` — client_id de devportal.jamendo.com (plan "Read only", sin OAuth)
- Restos de Tidal (`EXPO_PUBLIC_TIDAL_CLIENT_ID`, scheme `reproductor://`, `services/tidalAuth.ts`, `services/tidalApi.ts`) quedan **deprecados pendientes de borrar**

## Implementation status
- **Fase 0-4 completadas.** Setup, UI cassette, Player (`expo-av` + cola + auto-advance).
- **Fase 4.5 — Modo invitado.** App funcional sin Tidal: search/library con datos demo, streaming SoundHelix.
- **Fase 5 — Build.** Dev APK EAS listo. Falta preview/production.
- **Decisión 2026-08-12: abandonar Tidal.** Login OAuth roto + sin streaming real sin acuerdo partner. Se adopta **Jamendo API** (catálogo CC, streaming MP3 completo, solo `client_id`, CORS ok → Android + Web). SoundHelix queda como fallback si no hay red/client_id.

## Rumbo de diseño (prioridad alta)
Se compensa el uso de una API genérica con una UI **excesivamente bonita, minimalista y llena de detalles**. Inspiración: `https://github.com/cupidbity/cupid-music-player` (tocadiscos pixel-art). Detalles a portar/estudiar:
- Vinilo girando + aguja animada sobre el artwork
- Animación de cambio de disco al cambiar canción (alternancia de colores/estilo)
- Título con **marquee scroll** cuando es largo
- Progress bar con indicador arrastrable
- Tema con persistencia (preferencia guardada)
- Micro-interacciones: presión de botones, transiciones entre pantallas
- El cassette actual ya tiene carretes + ecualizador — evaluar fusionar con la estética tocadiscos

## Git workflow
Feature branches from `develop`. PRs → `develop`. Only merge `develop` → `main` on completed milestones.
⚠️ `develop` está ~15 commits detrás de `main` (se mergeó a main directo) — sync antes de crear la rama de trabajo.

## PRÓXIMA SESIÓN — checklist para arrancar
1. **Crear app en Jamendo** → devportal.jamendo.com (registro gratis, plan "Read only") → copiar `client_id` → guardarlo en `.env` como `EXPO_PUBLIC_JAMENDO_CLIENT_ID` + actualizar `.env.example`.
2. **Validar catálogo lofi en vivo** con el client_id propio (la API responde; el client_id público de prueba `709fa152` está suspendido): probar `GET https://api.jamendo.com/v3.0/tracks/?client_id=...&format=json&search=lofi&audio=1&limit=10` y revisar calidad/variedad antes de escribir código.
3. **Sync git**: `git checkout develop` → `git merge main` (o rebase) → crear rama `feature/jamendo-api` desde develop.
4. **Definir plan de rediseño** basado en cupid-music-player (ver "Rumbo de diseño"): qué detalles se portan al cassette y cuáles se descartan. Actualizar `theme/` si hace falta.
5. **Implementar**: `services/jamendoApi.ts` (axios, search/library/playlists, mapear a los tipos `TidalTrack` que ya usa el player), cambiar `getTrackStreamUrl()` en `services/player.ts` para usar `track.audio`, conectar `useSearch`/`useLibrary`, simplificar login (entrar directo).
6. **Limpiar** restos de Tidal (tidalAuth/tidalApi, .env vars) y actualizar `PLAN.md`/`CLAUDE.md`/`.env.example`.
7. **Verificar**: `npx tsc --noEmit` + `expo export` (no hay scripts de test/lint configurados).

## Important warnings
- Do not remove `react-native-reanimated/plugin` from babel.config.js
- `getTrackStreamUrl()` retorna URLs de SoundHelix — reemplazar por `track.audio` de Jamendo en la migración (SoundHelix como fallback)
- `react-native-reanimated` ya no requiere el plugin con Worklets si usás el runtime nuevo — verificar babel.config.js antes de tocar
