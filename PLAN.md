# PLAN DE DESARROLLO — Reproductor Aesthetic Tidal

**Equipo:** Gonzalo (Dev 1) · Amigo (Dev 2)  
**Inicio estimado:** 28 may 2026  
**Stack:** React Native + Expo 56 · TypeScript · Tidal Web API

---

## Convención de ramas

```
main          ← builds estables / releases
develop       ← integración continua (mergear features aquí, nunca directo a main)
feature/<x>   ← trabajo activo por feature
fix/<x>       ← bugfixes puntuales
```

**Regla:** siempre crear la rama desde `develop`. PR → `develop`. Solo mergear `develop` → `main` cuando un hito completo esté probado.

---

## Reparto por desarrollador

| | Gonzalo (Dev 1) | Amigo (Dev 2) |
|---|---|---|
| Foco | Auth + integración Tidal API | UI pixel-art + navegación |
| Fortaleza | Servicios, tokens, HTTP | Componentes, SVG, animaciones |

---

## FASE 0 — Setup base

> Lo hace **Gonzalo** solo. Cuando termina, el amigo hace `git pull` desde `develop` y empiezan las fases paralelas.

**Rama:** `feature/setup-base` → merge a `develop`

### Tareas (Gonzalo)

- [x] Instalar dependencias del proyecto definitivo:
  ```bash
  npx expo install expo-router expo-auth-session expo-secure-store expo-av
  npx expo install react-native-svg react-native-reanimated
  npx expo install @expo-google-fonts/press-start-2p @expo-google-fonts/vt323
  npx expo install axios
  ```
- [x] Configurar `app.json`:
  - `scheme` para deep linking OAuth (`reproductor://`)
  - `plugins: ["expo-router"]`
  - Configurar `android` y `ios` básico
- [x] Crear estructura de carpetas vacías con `.gitkeep`:
  ```
  app/(tabs)/   app/login.tsx
  components/cassette/
  services/
  hooks/
  theme/
  ```
- [x] Crear `theme/colors.ts` con la paleta tierra/marrón
- [x] Crear `theme/typography.ts` con los estilos de fuentes
- [x] Configurar `tsconfig.json` con paths alias (`@/`)
- [x] Verificar que `expo start` levanta sin errores
- [x] PR → `develop` — mergeado a `main` en `c6fd4cc` (PR #1 y #2)

**Revisado 2026-07-04:** todo lo anterior está implementado y verificado (bundling con `expo export` sin errores). Se limpiaron dos restos menores del scaffold original: se borraron `App.tsx`/`index.ts` (código muerto pre-expo-router, ya que `package.json` apunta a `"main": "expo-router/entry"`) y se actualizó `.env.example` para reflejar las variables que realmente usa el código (`EXPO_PUBLIC_TIDAL_CLIENT_ID` en vez de `TIDAL_REDIRECT_URI`, que ya no aplica porque el redirect se calcula con `AuthSession.makeRedirectUri()`).

**Paleta de colores de referencia:**
```ts
// theme/colors.ts — punto de partida
export const colors = {
  bg:        '#1A1209',   // fondo casi negro cálido
  surface:   '#2E1F0E',   // superficie oscura marrón
  label:     '#C49A4A',   // etiqueta arena dorada
  labelDark: '#8B6914',   // label secundaria
  reel:      '#3D2B10',   // carretes
  tape:      '#7A5C2E',   // cinta magnética
  text:      '#E8C97A',   // texto principal
  textMuted: '#A08040',   // texto secundario
  accent:    '#D4832A',   // naranja cálido para elementos activos
  eqBar:     '#C49A4A',   // barras del ecualizador
}
```

---

## FASE 1 — Auth con Tidal OAuth 2.1

> **Gonzalo** trabaja en esto mientras el amigo trabaja en la Fase 2.

**Rama:** `feature/auth-oauth` (desde `develop` post Fase 0)

### Tareas (Gonzalo)

- [x] Registrar la app en [developer.tidal.com](https://developer.tidal.com)
  - Obtener `TIDAL_CLIENT_ID` y `TIDAL_CLIENT_SECRET`
  - Configurar redirect URI: `reproductor://auth/callback`
  - Copiar valores al `.env`
- [x] Crear `services/tidalAuth.ts`:
  - Discovery document de Tidal (endpoints authorize/token)
  - `login()` — inicia flujo OAuth 2.1 con `expo-auth-session`
  - `refreshToken()` — renueva access token con refresh token
  - `logout()` — borra tokens del secure store
- [x] Crear `hooks/useAuth.ts`:
  - Estado: `isAuthenticated`, `accessToken`, `user`
  - Expone `login()` y `logout()`
  - Al iniciar app, intenta recuperar refresh token guardado
- [x] Crear `app/login.tsx`:
  - Pantalla de bienvenida con botón "Conectar con TIDAL"
  - Pixel-art minimalista (puede ser placeholder de texto por ahora)
- [x] Crear `app/_layout.tsx`:
  - Auth gate: si no hay token → `login.tsx`, si hay → `(tabs)/`
- [x] Guardar y recuperar tokens con `expo-secure-store`
- [ ] Prueba manual: login completo → token guardado → refresh → logout
  - **Pendiente**: requiere un development build (Expo Go no soporta el redirect URI de esquema personalizado que pide TIDAL). Ver nota abajo.
- [x] PR → `develop` — mergeado vía PR #3, y `develop` → `main` vía PR #6 (2026-07-04)

**Nota — verificar antes de la primera prueba real:**
Los endpoints de `discovery` en `services/tidalAuth.ts` (`login.tidal.com/oauth2/authorize` y `auth.tidal.com/v1/oauth2/token`) y los `SCOPES` no pudieron confirmarse contra la documentación en vivo del dashboard (el portal es una SPA protegida). Confirmá ambos valores en tu app registrada en developer.tidal.com antes de probar el login. Además, para probar el login hace falta un **development build** (`eas build --profile development` o `npx expo run:android`), no alcanza con Expo Go, porque TIDAL requiere un redirect URI de esquema personalizado (`reproductor://auth/callback`) que Expo Go no soporta.

**Endpoints Tidal OAuth:**
```
authorize: https://login.tidal.com/oauth2/authorize
token:     https://auth.tidal.com/v1/oauth2/token
```

---

## FASE 2 — UI pixel-art estática

> **Amigo** trabaja en esto mientras Gonzalo trabaja en la Fase 1.  
> Usa **datos mock** — no necesita la API real todavía.

**Ramas:**
- `feature/ui-navigation` — Expo Router + tab bar
- `feature/ui-cassette` — SVG cassette + animaciones

*(el amigo puede trabajar en ambas secuencialmente, o crear las dos ramas y alternar)*

### Tareas (Amigo) — rama `feature/ui-navigation`

- [x] Configurar `app/(tabs)/_layout.tsx` con tab bar custom:
  - Tabs: Player · Library · Search · Queue · Settings
  - Íconos pixel-art (pueden ser texto o SVG simple por ahora)
  - Colores de la paleta (`colors.bg`, `colors.accent`)
- [x] Crear pantallas placeholder para cada tab:
  - `app/(tabs)/index.tsx` — Player
  - `app/(tabs)/library.tsx` — Library
  - `app/(tabs)/search.tsx` — Search
  - `app/(tabs)/queue.tsx` — Queue
  - `app/(tabs)/settings.tsx` — Settings
- [x] Crear `components/TabBar.tsx` si se necesita tab bar completamente custom
- [x] Verificar navegación funciona en Expo Go

### Tareas (Amigo) — rama `feature/ui-cassette`

- [x] Crear `components/cassette/CassetteBody.tsx`:
  - SVG de la carcasa oscura del cassette
  - Ventana transparente mostrando los carretes
  - Etiqueta C-90 arena con espacio para título/artista
- [x] Crear `components/cassette/Reel.tsx`:
  - SVG del carrete (círculo con radios)
  - Animación de rotación con `react-native-reanimated`
  - Props: `isPlaying: boolean`, `speed?: number`
  - Los dos carretes giran a velocidades ligeramente distintas
- [x] Crear `components/cassette/Equalizer.tsx`:
  - 7-10 barras verticales animadas
  - Animación aleatoria (valores aleatorios suaves) mientras `isPlaying`
  - Se congela cuando se pausa
- [x] Crear `components/Controls.tsx`:
  - Botones: previous · play/pause · next
  - Estética de botones físicos (relieve con sombras en SVG/border)
  - Animación de presión al tocar
- [x] Crear `components/ProgressBar.tsx`:
  - Barra pixel-art con tiempo actual / duración
  - Animación suave del progreso
- [x] Armar `app/(tabs)/index.tsx` completo con datos mock
- [x] PR → `develop` — mergeado vía PR #6 (2026-07-04)

**Revisado 2026-07-04:** `feature/ui-cassette` ya traía `feature/ui-navigation` mergeada adentro. Al abrir el PR a `develop` aparecieron 3 conflictos reales contra `feature/auth-oauth` (Fase 1, mergeada primero): ambas ramas partieron del mismo commit y tocaron `app/_layout.tsx`, `app/login.tsx` y `app/index.tsx` con propósitos distintos (auth gate vs. navegación a `(tabs)`). Se resolvieron a mano combinando ambas piezas: `_layout.tsx` conserva el `AuthProvider`/gate de Fase 1 + splash/fonts de Fase 2; `login.tsx` conserva el diseño cassette con el `login()` real conectado; `app/index.tsx` se eliminó (reemplazado por `(tabs)/index.tsx`) y su botón de logout se movió a `(tabs)/settings.tsx`.

---

## FASE 3 — Datos reales de Tidal API

> **Gonzalo** toma esta fase después de que la Fase 1 esté mergeada.  
> Requiere que auth funcione.

**Rama:** `feature/tidal-api` (desde `develop` post Fase 1)

### Tareas (Gonzalo)

- [x] Crear `services/tidalApi.ts`:
  - Instancia de axios con `Authorization: Bearer <token>` automático
  - Interceptor para refrescar token expirado (401 → refresh → retry, con coalescing de refrescos concurrentes)
  - Manejo de errores tipado
- [x] Endpoints implementados (JSON:API, base `https://openapi.tidal.com/v2`):
  ```ts
  getMe()                       // GET /users/me
  getFavoriteTracks(userId)     // GET /userCollections/{userId}/relationships/tracks
  getPlaylists(userId)          // GET /userCollections/{userId}/relationships/playlists
  getPlaylistTracks(playlistId) // GET /playlists/{id}/relationships/items
  searchTracks(query)           // GET /searchResults/{query}
  getTrackStreamUrl(id)         // STUB — ver riesgo abajo, no implementado de verdad
  ```
- [x] Crear tipos TypeScript para respuestas de la API:
  - `TidalTrack`, `TidalPlaylist`, `TidalUser`, `StreamUrl`
- [x] Crear `hooks/useLibrary.ts`:
  - Favoritos y playlists del usuario
  - Estado de carga y error
- [x] Crear `hooks/useSearch.ts`:
  - Búsqueda con debounce (300ms)
- [x] Conectar datos reales a las pantallas library y search
- [ ] PR → `develop`

**Revisado 2026-07-04 — implementado en `feature/tidal-api`, `npx tsc --noEmit` limpio:**

Igual que con los endpoints de OAuth en la Fase 1, no pude verificar los paths del Open API v2 contra la documentación en vivo (portal SPA no fetcheable). Los paths y la forma JSON:API de las respuestas en `services/tidalApi.ts` son un best-effort basado en la spec pública del Open API v2 — confirmalos contra el dashboard/Postman collection de tu app antes de dar la fase por cerrada.

**⚠️ Riesgo importante para la Fase 4 — streaming de audio:** según lo reportado públicamente por desarrolladores que usan el Open API v2 de TIDAL, el acceso self-serve del Developer Platform expone catálogo (búsqueda, tracks, álbumes, playlists, favoritos) pero **no incluye un endpoint de streaming/playback para apps de terceros** fuera de un acuerdo de partner aprobado. No pude confirmar esto con una fuente en vivo (mismo bloqueo de acceso al portal), así que `getTrackStreamUrl()` quedó como **stub que tira error explícito** en vez de simular un endpoint que probablemente no existe para esta app. Antes de arrancar la Fase 4, confirmá en tu dashboard de developer.tidal.com si tenés (o podés solicitar) acceso a playback — si no lo hay, la Fase 4 tal como está planteada (reproducir streams reales de Tidal) no es viable con el Developer Platform público y hay que replantearla.

---

## FASE 4 — Reproducción de audio

> Implementado directamente sobre `main` (2026-07-05). Se saltó `develop` porque Gonzalo trabajó solo.

**Rama:** `feature/player-core`

**Nota — streaming:** El Open API v2 público de Tidal no expone un endpoint de streaming para apps de terceros sin acuerdo partner. `getTrackStreamUrl()` se modificó para retornar una URL dummy de SoundHelix en vez de fallar. Cuando se tenga acceso real al streaming de Tidal, reemplazar la URL en `services/tidalApi.ts`.

### Tareas (Gonzalo) — lógica de audio ✅

- [x] Crear `services/player.ts`:
  - Wrapper sobre `expo-av` (`Audio.Sound`) con `setOnPlaybackStatusUpdate`
  - `loadTrack(uri)`, `play()`, `pause()`, `togglePlay()`, `seek(positionMs)`, `unload()`
  - Progreso notificado a listeners vía suscripción
- [x] Crear `hooks/usePlayer.tsx`:
  - Context + Provider con estado global: `currentTrack`, `queue`, `queueIndex`, `isPlaying`, `position`, `duration`, `isLoaded`
  - Métodos: `playTrack()`, `togglePlay()`, `seekTo()`, `next()`, `previous()`, `addToQueue()`, `removeFromQueue()`, `clearQueue()`, `jumpToIndex()`
  - Auto-advance al finalizar un track (>500ms del final)
  - `getTrackStreamUrl` llamada antes de cargar audio

### Tareas (Amigo) — conectar UI al estado real ✅

- [x] Conectar `Controls.tsx` a `usePlayer` (play/pause/next/previous reactivos)
- [x] Conectar `Reel.tsx` a `isPlaying` (ya funcionaba, ahora recibe la prop real)
- [x] Conectar `Equalizer.tsx` a `isPlaying`
- [x] Conectar `ProgressBar.tsx` a `position` y `duration`
- [x] Mostrar artwork real en el cassette (`CassetteBody` acepta `coverUrl`)
- [x] Completar pantalla Queue con datos reales de la cola

### Tareas conjuntas ✅

- [x] Integrar `usePlayer` con `useLibrary` (tap en favs/playlist carga cola)
- [x] Settings screen con datos reales de `getMe()`
- [x] `PlayerScreen` con estado vacío cuando no hay track seleccionado
- [ ] Prueba end-to-end: login → buscar canción → reproducir → pausar → siguiente (pendiente — requiere dev build para login real)

**Mergeado directo a `main` vía commit `90ff169` (2026-07-05)**

---

## FASE 4.5 — Modo invitado + desactivación de Tidal

> Implementado 2026-07-05. Tidal OAuth redirige a login pero falla con error genérico (probablemente problema del lado de Tidal o de los endpoints registrados). Se agrega modo invitado para que la app sea funcional sin Tidal.

### Cambios realizados

- [x] `hooks/useAuth.tsx` — agregado `isGuest` y `skipLogin()`. Guarda flag en SecureStore.
- [x] `app/login.tsx` — botón "INGRESAR COMO INVITADO" debajo del de Tidal.
- [x] `hooks/useLibrary.ts` — en modo invitado retorna 12 tracks demo + 2 playlists demo.
- [x] `hooks/useSearch.ts` — en modo invitado filtra sobre 24 tracks demo con debounce 300ms.
- [x] `app/(tabs)/settings.tsx` — modo invitado muestra "MODO INVITADO · DEMO".
- [x] Botón de logout en invitado dice "VOLVER AL INICIO".
- [x] `.env` corregido: `TIDAL_CLIENT_ID` → `EXPO_PUBLIC_TIDAL_CLIENT_ID` (variable que Expo expone al cliente).
- [x] Build EAS development APK generado y probado.

### Streaming

`getTrackStreamUrl()` retorna URLs de [SoundHelix](https://www.soundhelix.com/) (16 pistas públicas de demostración). Funciona para desarrollo y demo. No requiere Tidal.

---

## FASE 5 — Build

> Una vez que `main` está estable y probado en Expo Go.

**Rama:** `feature/build-config` (desde `main`)

### Android (Gonzalo o Amigo)

- [x] Instalar EAS CLI: `npm install -g eas-cli`
- [x] `eas login` con cuenta Expo
- [x] `eas project:init` — proyecto creado en EAS
- [x] Crear `eas.json` con perfiles development, preview, production
- [x] Instalar `expo-dev-client`
- [x] `eas build --platform android --profile development` — APK generado y probado
- [ ] `eas build --platform android --profile preview` — APK standalone (sin dev tools)
- [ ] Instalar `.apk` en Android personal vía QR o descarga directa

### iOS (si se tiene Mac + Apple ID)

- [ ] `eas build --platform ios --profile development`
- [ ] Instalar con Personal Team (sin Apple Developer Program)
- [ ] Si no hay Mac: quedarse en Expo Go para iOS

---

## FASE 6 — Migración a Jamendo API

> Implementado 2026-08-12 en `feature/jamendo-api`. Se abandona Tidal por completo:
> login OAuth roto + sin endpoint de streaming sin acuerdo partner. Jamendo da catálogo
> CC y streaming MP3 real con solo un `client_id` público (plan "Read only", sin OAuth).

### Cambios realizados ✅

- [x] `services/types.ts` — tipos neutrales (`Track`, `Artist`, `Album`, `Playlist`) que reemplazan a los `Tidal*`. Campo `audio` con la URL de stream.
- [x] `services/jamendoApi.ts` — axios sobre `https://api.jamendo.com/v3.0`:
  - `searchTracks(q)` → `/tracks/?search=...&audioformat=mp32`
  - `getCuratedTracks()` → lofi curado (tags=lofi, groupby artist, popularidad) = "LOFI SELECT" en Library
  - `getPlaylists()` / `getPlaylistTracks(id)` → playlists por género (lofi, chillout, study, jazz)
  - El endpoint público `/playlists/tracks/` se descartó: timeouts y las playlists públicas no traen cover/count.
- [x] `hooks/usePlayer.tsx` — reproduce `track.audio` (SoundHelix solo como fallback si falta).
- [x] `hooks/useSearch.ts` / `useLibrary.ts` — data real de Jamendo, sin modo invitado/demo.
- [x] Login directo: se borraron `app/login.tsx`, `hooks/useAuth.tsx`, `services/tidalAuth.ts`, `services/tidalApi.ts`. `app/_layout.tsx` sin auth gate.
- [x] `settings.tsx` — tarjeta "FUENTE DE MÚSICA: JAMENDO", sin cuenta Tidal ni logout.
- [x] Limpieza de deps: `expo-auth-session`, `expo-secure-store`, `expo-web-browser`, `expo-application`, `expo-crypto` desinstalados; `expo-linking` reinstalado (peer de expo-router). Scheme `reproductor://` y plugins obsoletos removidos de `app.json`.
- [x] `.env` / `.env.example` → `EXPO_PUBLIC_JAMENDO_CLIENT_ID`.
- [x] Verificado: `npx tsc --noEmit` limpio + `expo export` sin errores.
- [ ] Prueba manual en device/dev build: library real → buscar "lofi" → reproducir → pausar → siguiente.

**Nota:** el `search=lofi` de Jamendo devuelve 0 resultados (búsqueda por relevancia no matchea el tag); la búsqueda libre sí responde con términos reales. Para lofi se usa el parámetro `tags`.

---

## Calendario orientativo

```
Semana 1   Fase 0 (setup) → Fases 1 y 2 en paralelo
Semana 2   Terminar Fase 1 y 2 → merge a develop → Fase 3
Semana 3   Fase 3 + inicio Fase 4
Semana 4   Terminar Fase 4 → merge a main → Fase 5
```

---

## Flujo de trabajo diario

```bash
# Al empezar el día — traer cambios de develop
git checkout develop
git pull origin develop
git checkout feature/tu-rama
git merge develop          # o rebase, como prefieran

# Al terminar una tarea — subir y abrir PR
git push origin feature/tu-rama
# Abrir PR en GitHub: feature/tu-rama → develop
# El otro lo revisa antes de mergear
```

---

## Estado de avance

| Fase | Responsable | Rama | Estado |
|---|---|---|---|---|
| 0 · Setup base | Gonzalo | `feature/setup-base` | ✅ Completado |
| 1 · Auth OAuth | Gonzalo | `feature/auth-oauth` | ❌ Descartado (login Tidal roto) — eliminado en Fase 6 |
| 2 · UI navegación | Amigo | `feature/ui-navigation` | ✅ Completado |
| 2 · UI cassette | Amigo | `feature/ui-cassette` | ✅ Completado |
| 3 · Tidal API | Gonzalo | `feature/tidal-api` | ❌ Descartado (sin acceso real) — eliminado en Fase 6 |
| 4 · Player core + UI | Gonzalo | `feature/player-core` | ✅ Completado · streaming ahora por `track.audio` (Jamendo) |
| 4.5 · Modo invitado | Gonzalo | `main` | ✅ Completado · eliminado en Fase 6 (login directo) |
| 5 · Build | Ambos | `feature/build-config` | 🔄 En progreso · dev build listo, falta preview APK |
| 6 · Jamendo API | Gonzalo | `feature/jamendo-api` | ✅ Completado (código) · falta prueba manual en device |
