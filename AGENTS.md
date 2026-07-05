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
- Auth redirect scheme: `reproductor://`
- `.env` contains real Tidal credentials — do not commit

## Implementation status
- **Fase 0-4 completadas.** Setup, Auth OAuth, UI (navegación + cassette), Tidal API, Player con expo-av.
- **Streaming:** usa URL dummy de SoundHelix (`services/tidalApi.ts`). Reemplazar cuando Tidal confirme acceso.
- **Player:** `services/player.ts` + `hooks/usePlayer.tsx` (Context global).
- **Pendiente:** Fase 5 (build EAS), prueba manual de login (requiere dev build).

## Git workflow
Feature branches from `develop`. PRs → `develop`. Only merge `develop` → `main` on completed milestones.

## Important warnings
- Do not remove `react-native-reanimated/plugin` from babel.config.js
- `getTrackStreamUrl()` retorna URL dummy — no es un endpoint real de Tidal
