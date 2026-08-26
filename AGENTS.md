# AGENTS.md — mamada-reproductor

Expo SDK 54 · React Native 0.81 · React 19.1

## Entry point
`package.json` main = `expo-router/entry` (file-based routing via `app/`).
DO NOT use `App.tsx` or `index.ts` as entry — Expo Router manages that.

## Developer commands
- `npm start` — dev server (Expo)
- `npm run web` — desarrollo web (destino principal ahora)
- `npm run android` / `npm run ios`
- `npm run tauri:dev` — Tauri dev mode (desde `src-tauri/`)
- `npm run tauri:build` — Build release `.exe`/`.msi` (desde `src-tauri/`)
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
- **Fase 5 — Build.** Dev APK EAS listo. **Rumbo cambiado (2026-08-22):** no se hacen más builds Android/iOS; el destino final es un **ejecutable de escritorio para PC en ventana** — envolver la build web (`expo export --platform web`) con **Tauri v2** (decisión 2026-08-24).
- **Fase 6 — Jamendo (2026-08-12).** Se abandonó Tidal (login OAuth roto + sin streaming real sin acuerdo partner). Se adopta **Jamendo API**: catálogo CC, streaming MP3 real (`audioformat=mp32`), solo `client_id`, CORS ok → Android + Web. App 100% funcional: search/library/playlists con data real, login directo (sin pantalla de login), streaming por `track.audio`. SoundHelix queda como fallback solo si un track no trae `audio`.
- **Sesión UI polish (2026-08-22, rama `feature/ui-polish`).** Temas completos, marquee y seek — **MERGEADO A MAIN 2026-08-24**:
  - Sistema de temas: `theme/themes.ts` (tierra/arena/neon) + `hooks/useTheme.tsx` (provider con persistencia en AsyncStorage, selector en Settings). Todos los componentes/pantallas consumen `useTheme()` con patrón `createStyles(colors)` + `useMemo`. `theme/colors.ts` queda como re-export estático de `tierra` solo para módulos fuera del árbol React.
  - Marquee: `components/MarqueeText.tsx` — ticker seamless de 2 copias loop sobre `-50%`; títulos ≤26 chars quedan estáticos centrados (heurística por longitud, Press Start 2P es monoespaciada).
  - Seek: `ProgressBar` arrastrable con `Gesture.Pan` → `seekTo(segundos)`; `GestureHandlerRootView` montado en la raíz de `_layout.tsx` (requerido por gesture-handler).
  - Dep nueva: `@react-native-async-storage/async-storage`.
  - Verificado: `npx tsc --noEmit` limpio + `expo export --platform web` OK.
- **Fase 7 — Tauri v2 Desktop Wrapper (2026-08-24, en progreso):**
  - Objetivo: ejecutable `.exe`/`.msi` para Windows (futuro: Linux/macOS) envolviendo `dist/` web.
  - Tauri v2 elegido sobre Electron: binario ~5-15MB, WebView del sistema, Rust backend, mobile-ready.
  - No compromete diseño: la web export es pixel-perfect, Tauri solo provee ventana nativa + APIs (fs, audio, updater).
  - Pasos: `npm create tauri-app@latest` en subcarpeta → configurar `tauri.conf.json` → `cargo tauri build`.
  - Audio: Jamendo MP3 via `<audio>`/Web Audio API en WebView — funciona nativo sin `expo-av`.
- **Sesión 2026-08-25:** sistema de **4 skins** de player (cassette/vinyl/tocadiscos/jukebox) + geometría del brazo del tocadiscos corregida + **fix v4 de seek/pausa en YouTube IFrame**. Detalles en las secciones "Skins del player" y "Awesome Mixes".
- **Sesión 2026-08-25 (b):** 4 features nuevos, un commit cada uno — atajos de teclado + mediaSession (`SystemShortcuts`), **EQ con FFT real** en web (`services/webAudioEngine.ts`), **color dinámico desde la carátula** (`services/coverPalette.ts`) y **letras sincronizadas LRCLIB** (`services/lrclibApi.ts` + `LyricsView`). Detalles en las secciones correspondientes.

## Rumbo de diseño (prioridad alta)
Se compensa el uso de una API genérica con una UI **excesivamente bonita, minimalista y llena de detalles**. Inspiración: `https://github.com/cupidbity/cupid-music-player` (tocadiscos pixel-art). Detalles a portar/estudiar:
- ~~Vinilo girando + aguja animada sobre el artwork~~ ✅ 2026-08-25 (skins `VinylDisc`/`Turntable`)
- ~~Animación de cambio de disco al cambiar canción~~ ✅ 2026-08-25 (coreografía por skin — ver "Cambio de disco animado")
- ~~Título con **marquee scroll** cuando es largo~~ ✅ 2026-08-22 (`MarqueeText.tsx`)
- ~~Progress bar con indicador arrastrable~~ ✅ 2026-08-22 (seek real)
- ~~Tema con persistencia (preferencia guardada)~~ ✅ 2026-08-22 (tierra/arena/neon)
- Micro-interacciones: presión de botones ✅ (Controls ya anima presión), transiciones entre pantallas
- ~~El cassette actual ya tiene carretes + ecualizador — evaluar fusionar con la estética tocadiscos~~ ✅ 2026-08-25 (sistema de 4 skins seleccionables)

## Git workflow
Feature branches from `develop`. PRs → `develop`. Only merge `develop` → `main` on completed milestones.
- 2026-08-12: `develop` sincronizado con `main` (fast-forward), trabajo actual en `feature/jamendo-api`.
- 2026-08-22: trabajo en `feature/ui-polish` (temas + marquee + seek). Pendiente commit/merge.

## Arquitectura de datos
- `services/types.ts` — tipos neutrales `Track` / `Artist` / `Album` / `Playlist` (el player y las pantallas solo conocen estos).
- `services/jamendoApi.ts` — axios + Jamendo v3.0:
  - `getLibrary()` → descarga los tracks de los 7 géneros UNA vez y devuelve `{ playlists, curated }`. `curated` = LOFI SELECT (primeros 30 del género lofi). Reemplaza a `getCuratedTracks`/`getPlaylists` (eliminadas — la llamada con `groupby` devolvía vacío en la app sin causa clara; derivar del endpoint de género que sí funciona).
  - `getGenreTracks(id)` / `getPlaylistTracks(id)` → tracks por tag (`GENRES`: lofi, electronic, piano, downtempo, vol1=classicrock, vol2=retro, vol3=70s — los VOL son el homenaje a Guardianes de la Galaxia; tags chillout/study/jazz están MUERTOS en Jamendo: 0-4 tracks, no usarlos).
  - `searchTracks` eliminada junto con el tab Search (catálogo curado, búsqueda innecesaria).
  - IDs propios: prefijo `jamendo-` en tracks, `artist-`/`album-` en artistas/álbumes.
- `services/player.ts` — wrapper `expo-av` (`Audio.Sound`) con listeners de progreso + `setVolume(v)` (0..1, se aplica también al cargar cada track via initial status).
- `hooks/usePlayer.tsx` — contexto global del player. Resuelve el stream con `track.audio ?? SoundHelix fallback` (const `FALLBACK_AUDIO_URL`). `position`/`duration` en segundos. Extras: `volume`/`setVolume`, `shuffleQueue()` (Fisher-Yates SOLO sobre tracks posteriores al actual).
- Temas: `theme/themes.ts` (tipo `ThemeColors`, nombres en `ThemeName`) + `hooks/useTheme.tsx` (key AsyncStorage: `app_theme`). Patrón obligatorio para estilos temizados: `const { colors } = useTheme()` + `const styles = useMemo(() => createStyles(colors), [colors])`.
- Nota Jamendo: el endpoint público `/playlists/` no trae cover/count y `/playlists/tracks/` resultó inestable (timeouts) → se evitó a propósito.

## Important warnings
- Do not remove `react-native-reanimated/plugin` from babel.config.js
- No remover `GestureHandlerRootView` de la raíz en `app/_layout.tsx` — sin él, el seek de la barra no funciona.
- No instalar `expo-auth-session` / `expo-secure-store` / `expo-web-browser` a menos que se vuelva a necesitar OAuth: ya no hay auth, y `expo-linking` (peer de expo-router) se rompe si se prunan mal las deps.
- `react-native-reanimated` ya no requiere el plugin con Worklets si usás el runtime nuevo — verificar babel.config.js antes de tocar.

## Tauri v2 config (Fase 7)
- Carpeta Tauri: `src-tauri/` (separada del proyecto Expo)
- `tauri.conf.json` → `build.distDir: "../dist"` (apunta a `expo export --platform web`)
- Ventana: título "Mamada Reproductor", **520×720 vertical** (min 420×600, **max 520**), `decorations: false` (barra de título propia: `components/TitleBar.tsx`, drag via atributo `data-tauri-drag-region` + botones min/max/close via `window.__TAURI__` — requiere `app.withGlobalTauri: true`; se oculta fuera de Tauri). TitleBar montada en la RAÍZ de `_layout.tsx` (común a tabs y pantalla de detalle).
- Permisos: `src-tauri/capabilities/default.json` — `core:default` + window allow-minimize/toggle-maximize/close/start-dragging + `window-state:default` + `opener:default`
- Memoria de ventana: plugin oficial `tauri-plugin-window-state` (guarda/restaura tamaño+posición solo). Si cambiás el tamaño default del conf, BORRAR `%APPDATA%\com.gonzalo.mamada-reproductor\.window-state.json` o restaurará la geometría vieja.
- Plugin opener (`tauri-plugin-opener` en main.rs + capability): usado por `services/openExternal.ts` para los links de YouTube.
- Audio: WebView usa codecs del SO (MP3 OK en Windows 10+ via WebView2)
- No `expo-av` en Tauri — player web usa `<audio>` + Web Audio API (ya implementado en `services/player.ts` fallback)
- Build: `cd src-tauri && cargo tauri build` → `src-tauri/target/release/bundle/msi/`
- **Requisito previo**: Rust toolchain (`rustup install stable` → `cargo --version`)

### Estructura de tabs actual (2026-08-24)
- 3 tabs: PLAY (`index`), MUSIC (`library`), SET (`settings`). Search y Queue eliminados como tabs.
- Queue integrada en el player: botón ≡ en header alterna cassette ↔ lista (`components/QueueList.tsx`, con botón ⇄ SHUFFLE).
- Volumen: slider COMPACTO en el header del player (`components/VolumeSlider.tsx` prop `compact`, patrón Gesture.Pan igual que ProgressBar).

## Awesome Mixes — homenaje Guardianes de la Galaxia (2026-08-24)
4 playlists oficiales de las películas reproducidas vía **YouTube IFrame API** (no Jamendo):
- `services/awesomeMixData.ts` — AUTO-GENERADO por `Temp\opencode\scrape-youtube.ps1` (reanudable, cachea en `Temp\opencode\yt-cache.txt`). Tracklists verificadas contra Wikipedia/Discogs/Marvel.com: Vol.1=12, Vol.2=14, Vol.3=17, Holiday Special=11 (54 tracks). videoIds = primer resultado de búsqueda YT con filtro de video, query `<artista> <título> topic`; TODOS verificados por oEmbed (título correcto). Excepción conocida: Spacehog "In the Meantime" es Re-Recorded (única versión oficial en YT).
- **Reproducción (v4, 2026-08-25 — resume fix):** el iframe de YouTube carga UN video por vez (`videoId`, sin params de playlist). Player inicia con `mute:1` para bypass de Chrome autoplay policy, luego `unMute()` tras primer play exitoso. Auto-advance: `ENDED`(0) → `next()`. `onError`: solo salta en errores fatales (100 removido, 101/150 embed bloqueado, 5 HTML5) — código 2 (param transitorio) NO salta. Mini-player flotante sin controles nativos (`controls:0, disablekb, fs:0, iv_load_policy:3` + `pointerEvents:'none'`), anclado arriba del TabBar (`bottom:64, right:10`), persiste entre tabs. Seek via puente imperativo `bind`.
- **Fix v4 — seek/pausa dejaba el video trabado (2026-08-25, `components/YtPlayer.tsx`):** dos causas raíz: (1) `onStateChange` mapeaba cualquier estado ≠1 a pausa → un seek dispara estado 3 (BUFFERING) → el contexto hacía setPlaying(false) → el engine llamaba `pauseVideo()` en pleno buffer y mataba la reproducción. FIX: estado 3 se IGNORA en onStateChange. (2) El primer play es muted-autoplay (permitido siempre), pero CUALQUIER `playVideo()` posterior sobre el player sin mute lo bloquea WebView2/Chrome en silencio (perfil sin MEI, activación de usuario no delegada al iframe cross-origin) → pausar funcionaba, reanudar no. FIX: helper `guaranteedPlay()` = `playVideo()` → verifica `getPlayerState()` a los ~500ms → si no arrancó, truco re-mute infalible (`mute()` + `playVideo()`, siempre permitido) + `unMute()` a los ~350ms ya sonando. **REGLA: usar SIEMPRE guaranteedPlay() para reproducir** (onReady, efecto `[playing]`, post-loadVideoById) — nunca playVideo() pelado. Timers del helper van a `pendingTimers` ref y se limpian al destruir el player. Interfaz YTPlayer requiere `getPlayerState()` y `mute()`.
- **Auditoría de embebibilidad (2026-08-24):** los 53 IDs únicos reportan `playableInEmbed:true`, PERO el flag NO es confiable (Dog Days Are Over lyric-video fallaba en runtime "Video unavailable" con flag true). Reemplazado por el video oficial VEVO `iWOyfLBYtuU`. Script auditor: `Temp\opencode\check-embed.ps1` (cachea en `yt-embed.txt`). Si una canción falla en runtime, el onError auto-skipea — buscar upload alternativo y actualizar línea en `Temp\opencode\yt-cache.txt` + re-correr `scrape-youtube.ps1`.
- **Lección de layout RN Web:** `StyleSheet.absoluteFill`/hijos absolutos requieren un ancestro con `position:'relative'` explícito — las Views de RN son static y los absolutos se anclan a un ancestro lejano pintándose gigantes sobre toda la UI (bug de carátulas). Además `aspectRatio` no siempre propaga altura definida a hijos con `%`: medir ancho con onLayout y setear alto px (patrón MixTile).
- `hooks/useYt.tsx` — contexto global: `start(mixId, i)`, `stop()`, `togglePlay`, `jumpTo`, `next/prev`, estado `{mix,index,playing,position,duration}`. NO se coordina con usePlayer (Jamendo): si suenan ambos se solapan — pausar uno manualmente.
- `app/playlist/[id].tsx` — detalle del mix: carátula con crossfade, controles ⏮▶⏭, tracklist numerada; tap en fila = salta a esa canción; tap en la misma = play/pausa. Filas sin videoId muestran `YT ↗` y abren búsqueda en navegador.
- `services/openExternal.ts` — abre URLs en el navegador del sistema: plugin Tauri opener si existe `__TAURI__.opener`, fallback `window.open`.
- **Carátulas triple con transición cíclica:** `assets/covers/art-{id}.png` (arte oficial Wikipedia) + `cassette-{id}.png` (casete pixel-art generado a código, color de acento por mix) + `dither-{id}.png` (poster con ordered dithering Bayer 8×8 + scanlines CRT + vignette, generado via `Temp\opencode\gen-covers.ps1` con LockBits). `components/CrossfadeCover.tsx` alterna art→overlay1→overlay2→art cada 5s con crossfade 800ms, Animated built-in de RN (reanimated vetado para loops en web). Grid MUSIC: art→cassette→art. Detalle playlist: art→dithered→art. Badges eliminados (PressStart2P no soporta ★/❄). Mapa de requires: `services/mixCovers.ts` (`ART_COVERS`/`CASSETTE_COVERS`/`DITHERED_COVERS`).
- Tab MUSIC: grid 2×2 de mixes arriba (`MixesSection`/`MixTile`), debajo filas Jamendo.

### Notas Jamendo (2026-08-24)
- `fetchTracks` reintenta ×3 con 300ms de delay: la API devuelve resultados VACÍOS al azar (~30% de requests) sin causa aparente.
- `GENRES` final: lofi, piano, downtempo (electronic eliminado por pedido del usuario).

### Animaciones web (2026-08-24)
- `react-native-reanimated` estaba CONGELADO en build web para Reel/Equalizer (rotaciones no animaban). Reescritas con el `Animated` built-in de RN (`Animated.loop(timing)`, useNativeDriver:false) en `Reel.tsx` y `Equalizer.tsx`. ProgressBar/Marquee/VolumeSlider sí usan reanimated y funcionan (gestos + estilos animados OK; el problema era solo withRepeat/loop de reanimated en web).

### Skins del player — 4 modelos (2026-08-25)
- Pieles intercambiables en el tab PLAY: `hooks/usePlayerSkin.tsx` (tipo `PlayerSkin` = `cassette | vinyl | turntable | jukebox`, persistido en AsyncStorage key `player_skin`, provider montado en `_layout.tsx` bajo ThemeProvider). `components/PlayerSkinView.tsx` pinta el switcher (TAPE/VINYL/DECK/JUKE) + spring de escala al cambiar. Para agregar un 5to modelo: tipo+array en usePlayerSkin, case en PlayerSkinView, botón en el switcher.
- `components/vinyl/VinylDisc.tsx` — disco girando (Animated built-in, loop linear 4s), surcos concéntricos, sheen, etiqueta central con carátula o fallback "33 RPM". Props: `isPlaying/coverUrl/title/artist/size`.
- `components/turntable/Turntable.tsx` — chassis HI-FI con platter (VinylDisc size 195) + brazo animado. **Geometría del brazo (lección dura, no romper):**
  - Pivote real = `transformOrigin: '50% 0%'` sobre el contenedor del brazo alineado al gimbal (`left:6, top:18` dentro del base 36×36). El hack viejo `translateY(20)/rotate/translateY(-20)` rotaba ~60px DEBAJO del pivote visible → movimiento invertido/extraño.
  - El eje de la varilla debe pasar por el centro exacto del gimbal (antes `left:14` desviaba 8px → lo "descuadrado").
  - Base del brazo junto al platter (`left:4` en rightAssembly): pivote a ~142px del centro del plato; ángulos reposo `-22°` / reproducción `+30°` → la aguja cae sobre el surco medio (r≈70px verificado a mano). Con la base vieja (`right:18`) el brazo era físicamente incapaz de tocar el disco.
  - IMPORT: VinylDisc vive en `components/vinyl/` — un import relativo `./VinylDisc` desde `components/turntable/` rompe TODO el bundle de Metro sin error claro en runtime (causa raíz de la integración fallida del 2026-08-25).
- `components/jukebox/Jukebox.tsx` — rocola pixel: arco con glow pulsante al reproducir, tubos de burbujas laterales con onda viajera (UN solo Animated.Value master + interpolación coseno desfasada por burbuja = loop seamless sin N loops), ventana circular con la carátula, placa NOW PLAYING, botonera de colores fija, rejilla y patas.
- Todas las animaciones nuevas usan `Animated` built-in de RN (reanimated vetado para loops en web — ver Animaciones web).

### Cambio de disco animado (2026-08-25)
- Al cambiar de canción, cada skin hace su propia coreografía. Mecanismo: prop `trackKey?: string` (=`currentTrack.id`) que baja desde `app/(tabs)/index.tsx` → `PlayerSkinView` → skins. Cada skin compara con un ref (`prevTrackKey`) y solo anima si cambió (sin animación en el mount inicial).
- Genérico: `PlayerSkinView` hace un pop sutil (spring 0.85→1) reutilizando el mismo `animValue` del cambio de skin.
- `VinylDisc`: burst de rotación (Animated.Value aparte apilado como segundo `{rotate}` en el transform — NO se toca el loop base de 4s) + flash accent en la etiqueta (overlay absoluteFill sobre el label, opacity 0.75→0).
- `Turntable`: el brazo levanta (240ms) → espera 380ms → cae sobre el disco nuevo (640ms). **UN SOLO useEffect maneja `armAnim`** mirando `[isPlaying, trackKey]` — nunca haber dos efectos escribiendo el mismo Animated.Value (si no, los timings se interleavean y tiembla). El burst del VinylDisc interno llega vía `trackKey` pasada al platter.
- `Jukebox`: flash accent en la ventana circular (overlay 0.7→0, 650ms).
- Cassette: solo el pop genérico (los carretes ya reinician solos con isPlaying).

### Atajos de teclado + mediaSession (2026-08-25)
- `components/SystemShortcuts.tsx` — montado en `_layout.tsx` bajo `YtProvider`, renderiza null. Motor activo = YouTube si hay mix, si no Jamendo.
- Teclado (web/Tauri): Espacio=play/pause, ←→=seek ±5s (repeat permitido para scrub), ↑↓=volumen ±0.1 (siempre Jamendo). `preventDefault` en todo; ignora INPUT/TEXTAREA/modificadores; Espacio ignora `e.repeat`.
- mediaSession: metadata (título/artista/álbum + artwork: carátula del mix o coverUrl Jamendo) + handlers play/pause/prev/next/seekto → teclas multimedia de Windows y popup del SO controlan la app.
- Patrón clave: acciones frescas en un `actionsRef` reescrito cada render; listeners/handlers registrados UNA vez delegando en el ref. Nunca capturar closures de estado.
- Todo no-op fuera de web (`'mediaSession' in navigator` / `Platform.OS !== 'web'`).

### EQ reactivo con FFT real (2026-08-25)
- `services/webAudioEngine.ts` — motor `<audio>` propio para web/Tauri (expo-av no expone su elemento interno → imposible AnalyserNode). Misma interfaz conceptual que expo-av: load/play/pause/seek/setVolume/unload + position/duration/isPlaying.
- **Probe CORS antes del stream**: HEAD (fallback GET con Range). Si OK → `crossOrigin='anonymous'` + grafo Web Audio (source→analyser→destination, fftSize 256, smoothing 0.7). Si falla → reproducción plana sin análisis. Verificado en vivo: `prod-1.storage.jamendo.com` manda ACAO.
- `getLevels(bands)` → bandas con distribución geométrica sobre los bins, ganancia por banda (graves ×0.55 damped, agudos hasta ×1.5), sqrt perceptual, decay VU (`max(nuevo, prev*0.86)`).
- `services/player.ts` refactor: misma API pública; `Platform.OS === 'web'` delega en webAudioEngine con polling propio (250ms); nativo sigue expo-av intacto. Exporta `audioPlayer.getAudioLevels(bands)` (null en nativo).
- `Equalizer`: modo reactivo ~22fps via rAF cuando hay niveles; si no, loops random por barra de siempre. Cambio de modo automático y silencioso.

### Color dinámico desde la carátula (2026-08-25)
- `services/coverPalette.ts` — color dominante sin dependencias: canvas 24×24, buckets RGB 3 bits/canal ponderados por vivacidad (s×(0.25+v)), normalizado a accent legible en UI oscura (s≥0.45, v∈[0.55,0.85]). Cache Map por URL (incluye negativos). Solo web (nativo→null).
- `hooks/useCoverAccent(coverUrl)` — wrapper reactivo con cancelación.
- Aplicación sutil vía prop `accent?: string | null` (null = accent del tema): flash/etiqueta fallback del vinilo, strobe del deck, glow+burbujas del jukebox, barras del EQ.
- Canvas tainted / imagen rota / timeout ⇒ null silencioso, nunca rompe la UI.

### Letras sincronizadas LRCLIB (2026-08-25)
- `services/lrclibApi.ts` — lrclib.net gratis/sin key/CORS abierto. Búsqueda por METADATOS (artista+título): `/api/get` exacto → fallback `/api/search` difuso. Parseo LRC multi-timestamp `[mm:ss.xx]`. Cache por clave `artista|título` lowercase. `findActiveLine(lines, pos)` búsqueda binaria (-1 antes de la primera línea).
- Funciona para **Awesome Mixes** (artistas/títulos verificados en awesomeMixData.ts — probado 5/5 en Vol.1) Y para Jamendo: la fuente es metadato, no audio.
- `components/LyricsView.tsx` — karaoke pixel (VT323): auto-scroll a la línea activa; cada fila mide su y con `onLayout` (correcto con renglones múltiples); tap en línea = seek. Línea activa en accent (dinámico o del tema), resto atenuado.
- `playlist/[id].tsx`: toggle "♪ LETRA SINCRONIZADA" bajo el seek (solo si LRCLIB tiene data), panel de 190px con LyricsView, accent DEL MIX como color.
- Tab PLAY: botón ♪ junto a ≡ en el header (visible solo con letra disponible) + overlay absoluteFill sobre `cassetteContainer` (que ahora es `position:relative` — lección RN web). Sin shift de layout.
- Deriva conocida: LRC = grabación de estudio, uploads de YT pueden desviar ±1-2s. Aceptado v1.

### Icono de la app
- Fuente pixel-art: `src-tauri/icon-src.png` (generada a código, script en Temp `gen-icon.ps1` — grilla 64×64 escalada ×16 nearest-neighbor, paleta tema tierra).
- Regenerar todos los formatos tras cambiar la fuente: `cd src-tauri && npx tauri icon icon-src.png` (crea .ico/.icns/PNGs/Appx/iOS/Android).

## Próximos pasos Fase 7
- ~~Instalar Rust~~ ✅ (GNU toolchain 1.98 en `C:\Program Files\Rust stable GNU 1.98\bin` + MinGW WinLibs UCRT)
- ~~Configurar Tauri v2~~ ✅ **BUILD EXITOSA (2026-08-24).** Artefactos en `src-tauri/target/release/bundle/{msi,nsis}/`

### Fixes aplicados para lograr el build (2026-08-24)
1. **`tauri.conf.json` migrado de formato v1 a v2**: `package.productName`→raíz (`productName`), `tauri.allowlist` eliminado (v2 usa capabilities/plugins), `distDir`→`build.frontendDist`, `identifier` movido a raíz.
2. **`beforeDevCommand`/`beforeBuildCommand` corren dentro de `src-tauri/`** → anteponer `cd .. && `.
3. **Cargo.toml:** features v1 (`fs-all`, `dialog-all`, `cli`) no existen en la crate `tauri` v2 → dejar solo `default` + `image-png` + `image-ico`.
4. **Faltaba `src-tauri/build.rs`** (requerido por `tauri::generate_context!`): `fn main() { tauri_build::build() }`.
5. **`icons/icon.ico` estaba corrupto (126 bytes)**: `create-ico.ps1` con `GetHicon()` produce ICO roto. Regenerado embebiendo PNG 256x256 directo en contenedor ICO (formato PNG-in-ICO, válido desde Vista).
6. **Windows Defender bloquea archivos de compilación** (`os error 32` aleatorio en `.rmeta`/`.o`): NO se puede agregar exclusión sin admin. Solución: compilar con `CARGO_TARGET_DIR` fuera del workspace (Temp no está vigilado).
7. **Pantalla en blanco en el exe (2026-08-24)**: el export web funcionaba en navegador pero no en Tauri → la CSP custom escrita a mano bloqueaba algo del bundle. Fix: `"csp": null` (app local personal; si algún día se distribuye, escribir una CSP correcta y probar).
8. **Capabilities**: `src-tauri/` venía SIN carpeta `capabilities/` — creada `default.json` con los permisos de window para la barra de título propia.
9. **Icono**: el `.ico` original estaba corrupto y se regeneró a mano; hoy se usa `npx tauri icon icon-src.png` (ver sección Icono).

### Comando de build que funciona (usar SIEMPRE así)
```powershell
$env:PATH = "C:\Users\ibane\AppData\Local\Microsoft\WinGet\Packages\BrechtSanders.WinLibs.POSIX.UCRT_Microsoft.Winget.Source_8wekyb3d8bbwe\mingw64\bin;" + $env:PATH + ";$env:USERPROFILE\.cargo\bin"
$env:CARGO_TARGET_DIR = "C:\Users\ibane\AppData\Local\Temp\opencode\target"  # evita locks del antivirus
cd src-tauri; npx tauri build   # CLI via npm devDependency @tauri-apps/cli (NO hay cargo-tauri instalado)
```
Primera compilación: ~15 min (432 crates). Siguientes: <1 min. Copiar artefactos finales de Temp → `src-tauri/target/release/` (exe, WebView2Loader.dll y bundle/{msi,nsis}).
