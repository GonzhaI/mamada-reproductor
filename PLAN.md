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

- [ ] Instalar dependencias del proyecto definitivo:
  ```bash
  npx expo install expo-router expo-auth-session expo-secure-store expo-av
  npx expo install react-native-svg react-native-reanimated
  npx expo install @expo-google-fonts/press-start-2p @expo-google-fonts/vt323
  npx expo install axios
  ```
- [ ] Configurar `app.json`:
  - `scheme` para deep linking OAuth (`reproductor://`)
  - `plugins: ["expo-router"]`
  - Configurar `android` y `ios` básico
- [ ] Crear estructura de carpetas vacías con `.gitkeep`:
  ```
  app/(tabs)/   app/login.tsx
  components/cassette/
  services/
  hooks/
  theme/
  ```
- [ ] Crear `theme/colors.ts` con la paleta tierra/marrón
- [ ] Crear `theme/typography.ts` con los estilos de fuentes
- [ ] Configurar `tsconfig.json` con paths alias (`@/`)
- [ ] Verificar que `expo start` levanta sin errores
- [ ] PR → `develop`

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

- [ ] Registrar la app en [developer.tidal.com](https://developer.tidal.com)
  - Obtener `TIDAL_CLIENT_ID` y `TIDAL_CLIENT_SECRET`
  - Configurar redirect URI: `reproductor://auth/callback`
  - Copiar valores al `.env`
- [ ] Crear `services/tidalAuth.ts`:
  - Discovery document de Tidal (endpoints authorize/token)
  - `login()` — inicia flujo OAuth 2.1 con `expo-auth-session`
  - `refreshToken()` — renueva access token con refresh token
  - `logout()` — borra tokens del secure store
- [ ] Crear `hooks/useAuth.ts`:
  - Estado: `isAuthenticated`, `accessToken`, `user`
  - Expone `login()` y `logout()`
  - Al iniciar app, intenta recuperar refresh token guardado
- [ ] Crear `app/login.tsx`:
  - Pantalla de bienvenida con botón "Conectar con TIDAL"
  - Pixel-art minimalista (puede ser placeholder de texto por ahora)
- [ ] Crear `app/_layout.tsx`:
  - Auth gate: si no hay token → `login.tsx`, si hay → `(tabs)/`
- [ ] Guardar y recuperar tokens con `expo-secure-store`
- [ ] Prueba manual: login completo → token guardado → refresh → logout
- [ ] PR → `develop`

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

- [ ] Configurar `app/(tabs)/_layout.tsx` con tab bar custom:
  - Tabs: Player · Library · Search · Queue · Settings
  - Íconos pixel-art (pueden ser texto o SVG simple por ahora)
  - Colores de la paleta (`colors.bg`, `colors.accent`)
- [ ] Crear pantallas placeholder para cada tab:
  - `app/(tabs)/index.tsx` — Player
  - `app/(tabs)/library.tsx` — Library
  - `app/(tabs)/search.tsx` — Search
  - `app/(tabs)/queue.tsx` — Queue
  - `app/(tabs)/settings.tsx` — Settings
- [ ] Crear `components/TabBar.tsx` si se necesita tab bar completamente custom
- [ ] Verificar navegación funciona en Expo Go

### Tareas (Amigo) — rama `feature/ui-cassette`

- [ ] Crear `components/cassette/CassetteBody.tsx`:
  - SVG de la carcasa oscura del cassette
  - Ventana transparente mostrando los carretes
  - Etiqueta C-90 arena con espacio para título/artista
- [ ] Crear `components/cassette/Reel.tsx`:
  - SVG del carrete (círculo con radios)
  - Animación de rotación con `react-native-reanimated`
  - Props: `isPlaying: boolean`, `speed?: number`
  - Los dos carretes giran a velocidades ligeramente distintas
- [ ] Crear `components/cassette/Equalizer.tsx`:
  - 7-10 barras verticales animadas
  - Animación aleatoria (valores aleatorios suaves) mientras `isPlaying`
  - Se congela cuando se pausa
- [ ] Crear `components/Controls.tsx`:
  - Botones: previous · play/pause · next
  - Estética de botones físicos (relieve con sombras en SVG/border)
  - Animación de presión al tocar
- [ ] Crear `components/ProgressBar.tsx`:
  - Barra pixel-art con tiempo actual / duración
  - Animación suave del progreso
- [ ] Armar `app/(tabs)/index.tsx` completo con datos mock:
  ```ts
  const mockTrack = {
    title: "TRACK NAME",
    artist: "ARTIST",
    album: "ALBUM",
    duration: 213,
    quality: "HiFi",
    artwork: null,
  }
  ```
- [ ] PR → `develop`

---

## FASE 3 — Datos reales de Tidal API

> **Gonzalo** toma esta fase después de que la Fase 1 esté mergeada.  
> Requiere que auth funcione.

**Rama:** `feature/tidal-api` (desde `develop` post Fase 1)

### Tareas (Gonzalo)

- [ ] Crear `services/tidalApi.ts`:
  - Instancia de axios con `Authorization: Bearer <token>` automático
  - Interceptor para refrescar token expirado (401 → refresh → retry)
  - Manejo de errores tipado
- [ ] Endpoints a implementar:
  ```ts
  getMe()                    // GET /v2/users/me
  getFavoriteTracks()        // GET /v2/favorites/tracks
  getPlaylists()             // GET /v2/playlists
  getPlaylistTracks(id)      // GET /v2/playlists/{id}/tracks
  searchTracks(query)        // GET /v2/catalog/search?type=TRACKS
  getTrackStreamUrl(id)      // GET /v2/tracks/{id}/streamUrl
  ```
- [ ] Crear tipos TypeScript para respuestas de la API:
  - `TidalTrack`, `TidalPlaylist`, `TidalUser`, `StreamUrl`
- [ ] Crear `hooks/useLibrary.ts`:
  - Favoritos y playlists del usuario
  - Estado de carga y error
- [ ] Crear `hooks/useSearch.ts`:
  - Búsqueda con debounce (300ms)
- [ ] Conectar datos reales a las pantallas library y search
- [ ] PR → `develop`

---

## FASE 4 — Reproducción de audio

> Ambos trabajan juntos en esta fase. Coordinarse para no pisar el mismo archivo.

**Rama:** `feature/player-core` (desde `develop` post Fase 2 y 3)

### Tareas (Gonzalo) — lógica de audio

- [ ] Crear `services/player.ts`:
  - Wrapper sobre `expo-av` (`Audio.Sound`)
  - `loadTrack(streamUrl)` — carga y prepara el audio
  - `play()`, `pause()`, `seek(positionMs)`
  - `next()`, `previous()` — avanza en la cola
  - Listener de progreso (actualiza posición cada segundo)
- [ ] Crear `hooks/usePlayer.ts`:
  - Estado global del reproductor: `currentTrack`, `isPlaying`, `position`, `duration`, `queue`
  - Expone controles al resto de la app
  - Conecta `getTrackStreamUrl` de la API antes de cargar audio

### Tareas (Amigo) — conectar UI al estado real

- [ ] Conectar `Controls.tsx` a `usePlayer`:
  - Play/pause reactivo al estado real
  - Next/previous llaman al hook
- [ ] Conectar `Reel.tsx` a `isPlaying` del hook
- [ ] Conectar `Equalizer.tsx` a `isPlaying`
- [ ] Conectar `ProgressBar.tsx` a `position` y `duration` del hook
- [ ] Mostrar artwork real (imagen desde URL de Tidal) en el cassette
- [ ] Completar pantalla Queue (`app/(tabs)/queue.tsx`):
  - Lista de tracks en la cola
  - Track activo resaltado
  - Tap en track → salta a ese track

### Tareas conjuntas

- [ ] Integrar `usePlayer` con `useLibrary` para cargar playlists en la cola
- [ ] Settings screen: mostrar cuenta del usuario, calidad actual, botón logout
- [ ] Prueba end-to-end: login → buscar canción → reproducir → pausar → siguiente

**PR → `develop` → merge a `main` cuando todo funcione**

---

## FASE 5 — Build

> Una vez que `main` está estable y probado en Expo Go.

**Rama:** `feature/build-config` (desde `main`)

### Android (Gonzalo o Amigo)

- [ ] Instalar EAS CLI: `npm install -g eas-cli`
- [ ] `eas login` con cuenta Expo
- [ ] `eas build:configure`
- [ ] `eas build --platform android --profile preview`
- [ ] Instalar `.apk` en Android personal vía QR o descarga directa

### iOS (si se tiene Mac + Apple ID)

- [ ] `eas build --platform ios --profile development`
- [ ] Instalar con Personal Team (sin Apple Developer Program)
- [ ] Si no hay Mac: quedarse en Expo Go para iOS

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
|---|---|---|---|
| 0 · Setup base | Gonzalo | `feature/setup-base` | Pendiente |
| 1 · Auth OAuth | Gonzalo | `feature/auth-oauth` | Pendiente |
| 2 · UI navegación | Amigo | `feature/ui-navigation` | Pendiente |
| 2 · UI cassette | Amigo | `feature/ui-cassette` | Pendiente |
| 3 · Tidal API | Gonzalo | `feature/tidal-api` | Pendiente |
| 4 · Player core | Gonzalo | `feature/player-core` | Pendiente |
| 4 · UI conectada | Amigo | `feature/player-core` | Pendiente |
| 5 · Build | Ambos | `feature/build-config` | Pendiente |
