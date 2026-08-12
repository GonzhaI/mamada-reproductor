@AGENTS.md

# CLAUDE.md — Reproductor Aesthetic

## Descripción del proyecto

Aplicación móvil multiplataforma (Android e iOS) de reproductor de música con estética **pixel-art retro vintage** en paleta tierra/marrón, alimentada por el catálogo Creative Commons de **Jamendo API** (v3.0).

El proyecto replica la sensación visual de un reproductor físico (cassette retro con carretes animados y ecualizador) sobre streaming MP3 real, sin necesidad de cuentas ni OAuth.

---

## Objetivos

- Reproducir música del catálogo de Jamendo (streaming directo, plan "Read only")
- Mantener una UI pixel-art coherente (cassette + estética tocadiscos en evolución)
- Funcionar en iOS y Android desde una sola base de código
- Entrar directo a la app: sin login, sin gate de autenticación

---

## Alcance

### Dentro del alcance (v1)

**Reproducción**
- Play / pause / siguiente / anterior
- Barra de progreso con tiempo actual y duración
- Cola de reproducción con auto-advance
- Reproducción en primer plano (background play queda para v2)

**Biblioteca**
- "LOFI SELECT" curado (tags=lofi, top por artista)
- Playlists por género (lofi, chillout, study, jazz)
- Búsqueda libre de canciones (debounce 300ms)

**Metadatos visibles en UI**
- Título, artista, álbum
- Carátula real (campo `image`/`album_image` de Jamendo)

**UI**
- Diseño pixel-art en paleta tierra/marrón vintage
- Cassette retro: caja oscura, etiqueta C-90 arena, carretes animados, ecualizador
- Tipografía pixel-art (Press Start 2P + VT323)
- SVG escalable (`react-native-svg`) + `react-native-reanimated`

### Fuera del alcance (v1)

- Descarga de música offline
- Reproducción en background con controles en pantalla bloqueada
- Integración con CarPlay / Android Auto
- Letras sincronizadas
- Recomendaciones personalizadas (Jamendo read-only no expone favoritos del usuario)
- Compartir en redes sociales
- Modo claro/oscuro
- Publicación en App Store / Google Play (uso personal por ahora)

---

## Stack técnico

| Capa | Herramienta |
|---|---|
| Framework | React Native + Expo (SDK 54, managed workflow) |
| Lenguaje | TypeScript |
| Navegación | Expo Router (file-based, tab bar inferior custom) |
| UI / gráficos | `react-native-svg` para los assets pixel-art |
| Animaciones | `react-native-reanimated` (carretes, ecualizador, transiciones) |
| Tipografía | `@expo-google-fonts/press-start-2p` y `@expo-google-fonts/vt323` |
| Audio | `expo-av` (v1), migrar a `react-native-track-player` si se añade background play |
| HTTP | `axios` para llamadas a Jamendo API |
| Config | `.env` → `EXPO_PUBLIC_JAMENDO_CLIENT_ID` (público, no secreto) |
| Testing en dispositivo | Expo Go (desarrollo) |
| Build | EAS Build (cuando se necesite ejecutable) |

---

## Estrategia de testing y distribución

**Desarrollo diario:** Expo Go en Android/iOS vía QR. Cero costo, recarga instantánea.

**iOS — opciones gratuitas:**
- Expo Go durante todo el desarrollo
- Personal Team de Apple con Mac (app caduca a los 7 días, solo dispositivo propio)
- Sin Mac: quedarse en Expo Go

**Android — gratuito:**
- Expo Go en desarrollo
- `eas build --platform android` genera `.apk` instalable directamente

---

## Integración con Jamendo

**Plataforma:** [devportal.jamendo.com](https://devportal.jamendo.com) — plan "Read only".

**API:** `https://api.jamendo.com/v3.0`

- Auth: solo `client_id` (público). Sin OAuth, sin tokens, sin secure store.
- Streaming: `GET /tracks/?audioformat=mp32` → campo `audio` con la URL del MP3.
- Búsqueda: `search=<texto>` (libre). Para géneros usar `tags=`/`fuzzytags=`.
- Orden: `order=popularity_total_desc`, `boost=...`.

**Endpoints usados en la app:**
- `GET /tracks/` — search, curated lofi, playlists por género
- ~~`/playlists/` y `/playlists/tracks/`~~ descartados: el listado público no trae cover/count y el endpoint de tracks dio timeouts.

**Notas conocidas:**
- `search=lofi` devuelve 0 resultados (relevancia no matchea tags); para lofi se usa `tags=lofi`.
- `audiodownload_allowed` no aplica: la app solo streamea, no descarga.
- Los streams `audio` vienen con token temporal (`from=...`).

---

## Estructura del proyecto

```
mamada-reproductor/
├── app/                          # rutas (Expo Router)
│   ├── _layout.tsx               # PlayerProvider + Stack (sin auth)
│   └── (tabs)/
│       ├── _layout.tsx           # tab bar estilizada pixel-art
│       ├── index.tsx             # Player (cassette + controls)
│       ├── library.tsx           # LOFI SELECT + playlists por género
│       ├── search.tsx            # búsqueda
│       ├── queue.tsx             # cola de reproducción
│       └── settings.tsx          # fuente Jamendo, versión
├── components/
│   ├── cassette/
│   │   ├── CassetteBody.tsx      # SVG estático de la caja
│   │   ├── Reel.tsx              # carrete animado (reanimated)
│   │   └── Equalizer.tsx         # barras animadas
│   ├── Controls.tsx              # play/pause/skip con animación
│   ├── ProgressBar.tsx           # barra animada
│   └── TabBar.tsx                # tab bar custom pixel-art
├── services/
│   ├── types.ts                  # Track / Artist / Album / Playlist (neutrales)
│   ├── jamendoApi.ts             # cliente axios + mapeo
│   └── player.ts                 # wrapper de expo-av
├── hooks/
│   ├── usePlayer.tsx             # contexto global del player
│   ├── useSearch.ts              # búsqueda con debounce
│   ├── useLibrary.ts             # curated + playlists
│   └── useFonts.ts               # carga de Press Start 2P + VT323
├── theme/
│   ├── colors.ts                 # paleta tierra/marrón
│   └── typography.ts             # estilos de fuentes pixel
└── app.json                      # config de Expo
```

---

## Roadmap

**Fase 0 — Setup** ✅
**Fase 1 — Auth OAuth Tidal** ❌ eliminado (login roto) → reemplazado por login directo
**Fase 2 — UI estática** ✅ cassette pixel-art + navegación
**Fase 3 — Datos reales (Tidal)** ❌ eliminado → Fase 6 (Jamendo)
**Fase 4 — Reproducción** ✅ expo-av + cola + auto-advance
**Fase 4.5 — Modo invitado** ✅ (funcionó) → eliminado en Fase 6
**Fase 5 — Build** 🔄 dev APK listo, falta preview/production
**Fase 6 — Jamendo API** ✅ código listo, falta prueba manual en device
**Próximo — Rediseño estético** 🔄 basado en cupid-music-player (tocadiscos pixel-art):
- Vinilo girando + aguja sobre el artwork
- Marquee scroll para títulos largos
- Progress bar arrastrable
- Tema con persistencia
- Micro-interacciones (presión de botones, transiciones)

---

## Decisiones de diseño

### Variante de UI
**Cassette retro** en paleta tierra/marrón vintage: caja oscura, etiqueta C-90 arena, dos carretes animados, ecualizador de barras, controles tipo botón físico. En evaluación: fusión con estética tocadiscos (vinilo + aguja).

### Navegación
Tab bar inferior pixel-art con 5 pantallas: **Player**, **Library**, **Search**, **Queue**, **Settings**. Sin login: la app abre directo en Player.

### Tipografía
- **Press Start 2P** — títulos y nombres de canción (corto)
- **VT323** — descripciones, metadata y textos largos (terminal retro)

### Animaciones
- Carretes del cassette: rotación continua en reproducción, pausa al pausar (velocidad distinta entre carretes)
- Ecualizador de barras animado mientras hay reproducción
- Barra de progreso suave
- Transiciones entre pantallas acordes a la estética retro (fase de rediseño)
