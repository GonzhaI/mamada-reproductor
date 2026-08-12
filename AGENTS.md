# AGENTS.md — mamada-reproductor

Expo SDK 54 · React Native 0.81 · React 19.1

## Entry point
`package.json` main = `expo-router/entry` (file-based routing via `app/`).
DO NOT use `App.tsx` or `index.ts` as entry — Expo Router manages that.

## Developer commands
- `npm start` — dev server
- `npm run android` / `npm run ios`
- No test/lint/typecheck scripts configurados. Verificación: `npx tsc --noEmit` + `npx expo export`

## Key config quirks
- `legacy-peer-deps=true` in `.npmrc` — always use this when installing deps
- Babel: `babel-preset-expo` + `react-native-reanimated/plugin` required
- Path alias `@/` maps to project root
- `.env` NOT committed. Variable requerida:
  - `EXPO_PUBLIC_JAMENDO_CLIENT_ID` — client_id de devportal.jamendo.com (plan "Read only", sin OAuth)
- Tidal eliminado por completo (auth OAuth, API y scheme `reproductor://`). No quedan restos.

## Implementation status
- **Fase 0-4 completadas.** Setup, UI cassette, Player (`expo-av` + cola + auto-advance).
- **Fase 4.5 — Modo invitado.** Se eliminó al migrar a Jamendo (login directo, sin gate de auth).
- **Fase 5 — Build.** Dev APK EAS listo. Falta preview/production.
- **Fase 6 — Jamendo (2026-08-12).** Se abandonó Tidal (login OAuth roto + sin streaming real sin acuerdo partner). Se adopta **Jamendo API**: catálogo CC, streaming MP3 real (`audioformat=mp32`), solo `client_id`, CORS ok → Android + Web. App 100% funcional: search/library/playlists con data real, login directo (sin pantalla de login), streaming por `track.audio`. SoundHelix queda como fallback solo si un track no trae `audio`.

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
- 2026-08-12: `develop` sincronizado con `main` (fast-forward), trabajo actual en `feature/jamendo-api`.

## Arquitectura de datos
- `services/types.ts` — tipos neutrales `Track` / `Artist` / `Album` / `Playlist` (el player y las pantallas solo conocen estos).
- `services/jamendoApi.ts` — axios + Jamendo v3.0:
  - `searchTracks(q)` → `/tracks/?search=...&audioformat=mp32&limit=50`
  - `getCuratedTracks()` → `/tracks/?tags=lofi&groupby=artist_id&order=popularity_total_desc&limit=30` (es el "LOFI SELECT" de Library)
  - `getPlaylists()` / `getPlaylistTracks(id)` → playlists armadas por género (`GENRES`: lofi, chillout, study, jazz) vía `/tracks/?tags=...`
  - IDs propios: prefijo `jamendo-` en tracks, `artist-`/`album-` en artistas/álbumes.
- `services/player.ts` — wrapper `expo-av` (`Audio.Sound`) con listeners de progreso.
- `hooks/usePlayer.tsx` — contexto global del player. Resuelve el stream con `track.audio ?? SoundHelix fallback` (const `FALLBACK_AUDIO_URL`).
- Nota Jamendo: el endpoint público `/playlists/` no trae cover/count y `/playlists/tracks/` resultó inestable (timeouts) → se evitó a propósito.

## Important warnings
- Do not remove `react-native-reanimated/plugin` from babel.config.js
- No instalar `expo-auth-session` / `expo-secure-store` / `expo-web-browser` a menos que se vuelva a necesitar OAuth: ya no hay auth, y `expo-linking` (peer de expo-router) se rompe si se prunan mal las deps.
- `react-native-reanimated` ya no requiere el plugin con Worklets si usás el runtime nuevo — verificar babel.config.js antes de tocar.
