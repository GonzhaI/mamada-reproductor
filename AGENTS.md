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
- **Fase 0-4 completadas.** Setup, Auth OAuth (no funcional), UI, Player.
- **Fase 4.5 — Modo invitado.** Login tiene botón "INGRESAR COMO INVITADO". Sin Tidal: search/library usan datos demo, streaming con SoundHelix.
- **Fase 5 — Build.** Dev APK generado en EAS. Falta preview/production.
- **Tidal login no funcional.** Se desconoce la causa exacta. La app funciona completamente en modo invitado.

## Git workflow
Feature branches from `develop`. PRs → `develop`. Only merge `develop` → `main` on completed milestones.

## Important warnings
- Do not remove `react-native-reanimated/plugin` from babel.config.js
- `getTrackStreamUrl()` retorna URLs de SoundHelix (no Tidal real)
