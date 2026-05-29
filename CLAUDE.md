@AGENTS.md

# CLAUDE.md — Reproductor Aesthetic Tidal

## Descripción del proyecto

Aplicación móvil multiplataforma (Android e iOS) de reproductor de música con estética **pixel-art retro vintage** en paleta tierra/marrón, integrada con la cuenta personal de Tidal del usuario vía el **TIDAL Developer Platform** (Web API + OAuth 2.1).

El proyecto busca replicar la sensación visual de un reproductor físico (tocadiscos o cassette) sobre la funcionalidad real de streaming de Tidal, ofreciendo una experiencia más cálida y personal que las apps oficiales.

---

## Objetivos

- Reproducir música desde la biblioteca personal de Tidal del usuario
- Mantener una UI pixel-art coherente con la referencia estética inicial
- Funcionar en iOS y Android desde una sola base de código
- Permitir desarrollo y testing sin costos iniciales

---

## Alcance

### Dentro del alcance (v1)

**Autenticación**
- Login del usuario con su propia cuenta Tidal (OAuth 2.1, Authorization Code flow)
- Almacenamiento seguro del refresh token
- Logout

**Reproducción**
- Play / pause / siguiente / anterior
- Barra de progreso con tiempo actual y duración
- Reproducción en primer plano (background play queda para v2)

**Biblioteca**
- Lectura de playlists del usuario
- Lectura de tracks favoritos
- Búsqueda básica de canciones

**Metadatos visibles en UI**
- Título de la canción
- Artista
- Carátula del álbum
- Calidad de audio del track actual (Normal / High / HiFi / Master)

**UI**
- Diseño pixel-art en paleta tierra/marrón vintage
- Variante seleccionada: **cassette retro** (caja oscura, etiqueta C-90 arena, carretes animados, ecualizador de barras)
- Tipografía pixel-art (Press Start 2P + VT323)
- Animaciones de carretes girando y ecualizador reactivo durante reproducción
- SVG escalable para distintas resoluciones de pantalla

### Fuera del alcance (v1)

- Descarga de música offline
- Reproducción en background con controles en pantalla bloqueada
- Integración con CarPlay / Android Auto
- Letras sincronizadas
- Recomendaciones / radio / mixes generados
- Compartir en redes sociales
- Modo claro/oscuro (la estética es la estética)
- Publicación en App Store / Google Play (uso personal por ahora)

---

## Stack técnico

| Capa | Herramienta |
|---|---|
| Framework | React Native + Expo (managed workflow) |
| Lenguaje | TypeScript |
| Navegación | Expo Router (file-based, con tab bar inferior) |
| UI / gráficos | `react-native-svg` para los assets pixel-art |
| Animaciones | `react-native-reanimated` (carretes, ecualizador, transiciones) |
| Tipografía | `@expo-google-fonts/press-start-2p` y `@expo-google-fonts/vt323` |
| Audio | `expo-av` (v1), migrar a `react-native-track-player` si se añade background play |
| Autenticación | `expo-auth-session` para OAuth 2.1 con Tidal |
| HTTP | `axios` para llamadas a Tidal Web API |
| Almacenamiento seguro | `expo-secure-store` para tokens |
| Testing en dispositivo | Expo Go (desarrollo) |
| Build | EAS Build (cuando se necesite ejecutable) |

---

## Estrategia de testing y distribución

**Desarrollo diario:** Expo Go en iPhone y Android personal vía QR. Cero costo, recarga instantánea.

**iOS — opciones gratuitas:**
- Expo Go durante todo el desarrollo
- Personal Team de Apple con Mac (app caduca a los 7 días, solo dispositivo propio)
- Sin Mac: quedarse en Expo Go

**Android — gratuito:**
- Expo Go en desarrollo
- `eas build --platform android` genera `.apk` instalable directamente

**Si eventualmente se publica:**
- Google Play: 25 USD pago único
- App Store: 99 USD/año (Apple Developer Program)

---

## Integración con Tidal

**Plataforma:** [developer.tidal.com](https://developer.tidal.com) (actualmente en beta)

**Recursos a usar:**
- Web API (REST) — para todas las llamadas de datos
- Módulo Auth del TIDAL SDK Web — referencia para implementar OAuth en RN
- OAuth 2.1 con Authorization Code flow + Refresh Token

**Requisitos previos:**
1. Registrar la app en el Dashboard de Tidal
2. Obtener Client ID y Client Secret
3. Configurar redirect URI compatible con `expo-auth-session`

**Limitaciones conocidas:**
- El usuario final debe tener su propia suscripción Tidal activa
- La calidad de reproducción depende del tier del usuario (Normal / HiFi / HiFi Plus)
- Se deben respetar los términos del TIDAL Developer Platform para cualquier distribución

---

## Estructura propuesta del proyecto

```
reproductor-tidal/
├── app/                          # rutas (Expo Router)
│   ├── _layout.tsx               # layout raíz con auth gate
│   ├── login.tsx                 # OAuth login con Tidal
│   └── (tabs)/                   # navegación principal con tab bar
│       ├── _layout.tsx           # tab bar estilizada pixel-art
│       ├── index.tsx             # Player (pantalla principal)
│       ├── library.tsx           # playlists y favoritos
│       ├── search.tsx            # búsqueda
│       ├── queue.tsx             # cola de reproducción
│       └── settings.tsx          # cuenta, calidad, logout
├── components/
│   ├── cassette/
│   │   ├── CassetteBody.tsx      # SVG estático de la caja
│   │   ├── Reel.tsx              # carrete animado (reanimated)
│   │   └── Equalizer.tsx         # barras animadas
│   ├── Controls.tsx              # play/pause/skip con animación
│   ├── ProgressBar.tsx           # barra animada
│   └── TabBar.tsx                # tab bar custom pixel-art
├── services/
│   ├── tidalAuth.ts              # OAuth 2.1 flow
│   ├── tidalApi.ts               # wrappers de Web API
│   └── player.ts                 # control de expo-av
├── hooks/
│   ├── useAuth.ts
│   ├── usePlayer.ts
│   └── useFonts.ts               # carga de Press Start 2P + VT323
├── theme/
│   ├── colors.ts                 # paleta tierra/marrón
│   └── typography.ts             # estilos de fuentes pixel
└── app.json                      # config de Expo
```

---

## Roadmap

**Fase 0 — Setup**
- Crear proyecto Expo + TypeScript
- Registrar app en Tidal Developer Dashboard
- Configurar variables de entorno (Client ID/Secret)

**Fase 1 — Auth**
- Implementar OAuth 2.1 con `expo-auth-session`
- Guardar tokens en `expo-secure-store`
- Pantalla de login y logout

**Fase 2 — UI estática**
- Portar el SVG pixel-art elegido a `react-native-svg`
- Estructurar componentes (artwork, controles, progress bar)
- Conectar datos mock para validar layout

**Fase 3 — Datos reales de Tidal**
- Wrappers de Web API (tracks, playlists, favoritos)
- Mostrar metadatos reales (título, artista, carátula, calidad)

**Fase 4 — Reproducción**
- Integrar `expo-av` con stream de Tidal
- Conectar controles a estado de reproducción
- Barra de progreso animada

**Fase 5 — Build**
- `eas build` para Android (`.apk` personal)
- Decisión sobre iOS (Personal Team / Apple Developer / quedarse en Expo Go)

---

## Decisiones de diseño

### Variante de UI
**Cassette retro** en paleta tierra/marrón vintage. Caja oscura con etiqueta C-90 arena, dos carretes visibles, ecualizador de barras en la parte inferior, controles tipo botón físico.

### Navegación
Navegación entre múltiples pantallas usando **Expo Router** con tab bar inferior (estilizada acorde a la estética pixel-art):

- **Player** — pantalla principal con el cassette
- **Library** — playlists y favoritos del usuario
- **Search** — búsqueda de canciones, álbumes y artistas
- **Queue** — cola de reproducción actual
- **Settings** — cuenta Tidal, calidad de audio, logout

### Tipografía
Fuente **pixel-art / bitmap** para toda la app. Opciones recomendadas:
- **Press Start 2P** (Google Fonts) — muy marcada, ideal para títulos cortos
- **VT323** (Google Fonts) — estilo terminal retro, mejor para textos largos
- **Silkscreen** (Google Fonts) — limpia y legible
- Combinación sugerida: `Press Start 2P` para títulos y nombres de canción, `VT323` para descripciones, metadata y textos largos

Carga vía `expo-font` o `@expo-google-fonts/press-start-2p`.

### Animaciones
Animaciones activas durante reproducción usando **`react-native-reanimated`**:

- **Carretes del cassette** — rotación continua mientras hay reproducción, pausa al pausar la canción. Velocidad ligeramente distinta entre ambos carretes para simular el avance real de la cinta
- **Ecualizador de barras** — barras animadas reaccionando al ritmo (puede ser aleatorio sincronizado al tempo, o reactivo al audio real si la API lo permite)
- **Barra de progreso** — animación suave del avance
- **Botón de play/pause** — transición animada del ícono
- **Transiciones entre pantallas** — fade/slide acorde a la estética retro
- **Carga de carátula** — efecto de aparición pixelado (opcional, nice-to-have)
