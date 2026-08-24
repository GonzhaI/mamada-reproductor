# AGENTS.md — mamada-reproductor

Expo SDK 54 · React Native 0.81 · React 19.1

## Entry point
`package.json` main = `expo-router/entry` (file-based routing via `app/`).
DO NOT use `App.tsx` or `index.ts` as entry — Expo Router manages that.

## Developer commands
- `npm start` — dev server
- `npm run web` — desarrollo web (destino principal ahora)
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
- **Fase 5 — Build.** Dev APK EAS listo. **Rumbo cambiado (2026-08-22):** no se hacen más builds Android/iOS; el destino final es un **ejecutable de escritorio para PC en ventana** — envolver la build web (`expo export --platform web`) con Tauri o Electron. Pendiente decidir cuál.
- **Fase 6 — Jamendo (2026-08-12).** Se abandonó Tidal (login OAuth roto + sin streaming real sin acuerdo partner). Se adopta **Jamendo API**: catálogo CC, streaming MP3 real (`audioformat=mp32`), solo `client_id`, CORS ok → Android + Web. App 100% funcional: search/library/playlists con data real, login directo (sin pantalla de login), streaming por `track.audio`. SoundHelix queda como fallback solo si un track no trae `audio`.
- **Sesión UI polish (2026-08-22, rama `feature/ui-polish`).** Temas completos, marquee y seek:
  - Sistema de temas: `theme/themes.ts` (tierra/arena/neon) + `hooks/useTheme.tsx` (provider con persistencia en AsyncStorage, selector en Settings). Todos los componentes/pantallas consumen `useTheme()` con patrón `createStyles(colors)` + `useMemo`. `theme/colors.ts` queda como re-export estático de `tierra` solo para módulos fuera del árbol React.
  - Marquee: `components/MarqueeText.tsx` — ticker seamless de 2 copias loop sobre `-50%`; títulos ≤26 chars quedan estáticos centrados (heurística por longitud, Press Start 2P es monoespaciada).
  - Seek: `ProgressBar` arrastrable con `Gesture.Pan` → `seekTo(segundos)`; `GestureHandlerRootView` montado en la raíz de `_layout.tsx` (requerido por gesture-handler).
  - Dep nueva: `@react-native-async-storage/async-storage`.
  - Verificado: `npx tsc --noEmit` limpio + `expo export --platform web` OK. Falta prueba visual manual (`npm run web`).

## Rumbo de diseño (prioridad alta)
Se compensa el uso de una API genérica con una UI **excesivamente bonita, minimalista y llena de detalles**. Inspiración: `https://github.com/cupidbity/cupid-music-player` (tocadiscos pixel-art). Detalles a portar/estudiar:
- Vinilo girando + aguja animada sobre el artwork
- Animación de cambio de disco al cambiar canción (alternancia de colores/estilo)
- ~~Título con **marquee scroll** cuando es largo~~ ✅ 2026-08-22 (`MarqueeText.tsx`)
- ~~Progress bar con indicador arrastrable~~ ✅ 2026-08-22 (seek real)
- ~~Tema con persistencia (preferencia guardada)~~ ✅ 2026-08-22 (tierra/arena/neon)
- Micro-interacciones: presión de botones ✅ (Controls ya anima presión), transiciones entre pantallas
- El cassette actual ya tiene carretes + ecualizador — evaluar fusionar con la estética tocadiscos

## Git workflow
Feature branches from `develop`. PRs → `develop`. Only merge `develop` → `main` on completed milestones.
- 2026-08-12: `develop` sincronizado con `main` (fast-forward), trabajo actual en `feature/jamendo-api`.
- 2026-08-22: trabajo en `feature/ui-polish` (temas + marquee + seek). Pendiente commit/merge.

## Arquitectura de datos
- `services/types.ts` — tipos neutrales `Track` / `Artist` / `Album` / `Playlist` (el player y las pantallas solo conocen estos).
- `services/jamendoApi.ts` — axios + Jamendo v3.0:
  - `searchTracks(q)` → `/tracks/?search=...&audioformat=mp32&limit=50`
  - `getCuratedTracks()` → `/tracks/?tags=lofi&groupby=artist_id&order=popularity_total_desc&limit=30` (es el "LOFI SELECT" de Library)
  - `getPlaylists()` / `getPlaylistTracks(id)` → playlists armadas por género (`GENRES`: lofi, chillout, study, jazz) vía `/tracks/?tags=...`
  - IDs propios: prefijo `jamendo-` en tracks, `artist-`/`album-` en artistas/álbumes.
- `services/player.ts` — wrapper `expo-av` (`Audio.Sound`) con listeners de progreso.
- `hooks/usePlayer.tsx` — contexto global del player. Resuelve el stream con `track.audio ?? SoundHelix fallback` (const `FALLBACK_AUDIO_URL`). `position`/`duration` en segundos.
- Temas: `theme/themes.ts` (tipo `ThemeColors`, nombres en `ThemeName`) + `hooks/useTheme.tsx` (key AsyncStorage: `app_theme`). Patrón obligatorio para estilos temizados: `const { colors } = useTheme()` + `const styles = useMemo(() => createStyles(colors), [colors])`.
- Nota Jamendo: el endpoint público `/playlists/` no trae cover/count y `/playlists/tracks/` resultó inestable (timeouts) → se evitó a propósito.

## Important warnings
- Do not remove `react-native-reanimated/plugin` from babel.config.js
- No remover `GestureHandlerRootView` de la raíz en `app/_layout.tsx` — sin él, el seek de la barra no funciona.
- No instalar `expo-auth-session` / `expo-secure-store` / `expo-web-browser` a menos que se vuelva a necesitar OAuth: ya no hay auth, y `expo-linking` (peer de expo-router) se rompe si se prunan mal las deps.
- `react-native-reanimated` ya no requiere el plugin con Worklets si usás el runtime nuevo — verificar babel.config.js antes de tocar.
