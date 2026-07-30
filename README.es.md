# DarkBass

**[English](README.md) · [Español](README.es.md)**

DarkBass es un proyecto personal de experimentación musical para practicar batería, explorar herramientas de DJ y controlar la reproducción de Spotify desde una app móvil.

La app combina pads de batería con sonidos locales, una consola DJ, decks de audio e integración OAuth con Spotify. Las funciones de Spotify se gestionan mediante una API local que permite buscar canciones y controlar un dispositivo Spotify activo.

## Estado actual

- App móvil nativa construida con Expo SDK 54 y React Native.
- Depuración inalámbrica de Android mediante ADB.
- Metro de DarkBass en el puerto `8082`.
- API local en el puerto `2700`.
- OAuth de Spotify configurado para desarrollo personal.
- Jamendo es opcional y actualmente no está configurado.

## Requisitos

- Node.js 20.x para la API.
- npm.
- Xcode y un simulador de iPhone para iOS.
- Android Studio, Android SDK y JDK 21 para Android.
- Un teléfono Android en la misma red Wi‑Fi para usar depuración inalámbrica.

La API utiliza `better-sqlite3`, un módulo nativo. Si cambia la versión de Node.js, recompílalo:

```bash
npm rebuild better-sqlite3
```

## Instalación

Desde la raíz del repositorio:

```bash
npm install
```

Estructura principal:

```text
darkbass/
├── apps/
│   ├── mobile/   # App Expo/React Native
│   └── api/      # API local y OAuth de Spotify
├── package.json
└── README.md
```

## Ejecutar la app móvil

DarkBass está configurada para usar el puerto `8082`, porque otro proyecto puede estar usando el `8081`.

```bash
npm run mobile
```

Metro se inicia en:

```text
http://localhost:8082
```

Para iniciar Expo en una plataforma específica:

```bash
npm run mobile:android
npm run mobile:ios
```

## Android nativo

La compilación nativa utiliza el JDK 21 incluido con Android Studio. Para compilar, instalar y abrir DarkBass en el teléfono conectado:

```bash
npm run mobile:native:android
```

El teléfono debe aparecer como `device`:

```bash
adb devices -l
```

### Depuración inalámbrica

1. Activa **Opciones de desarrollador** y **Depuración inalámbrica** en Android.
2. Selecciona **Emparejar dispositivo con código**.
3. Descubre los servicios disponibles:

```bash
adb mdns services
```

4. Empareja usando la dirección y el código mostrados por el teléfono:

```bash
adb pair IP:PUERTO_DE_EMPAREJAMIENTO CODIGO
```

5. Conecta usando el puerto `_adb-tls-connect._tcp`:

```bash
adb connect IP:PUERTO_DE_CONEXION
adb devices -l
```

El computador y el teléfono deben estar en la misma red Wi‑Fi. Si cambia la IP del computador, actualiza también las URLs locales.

## API local

La API está en `apps/api` y gestiona OAuth, almacenamiento de tokens y peticiones autenticadas a Spotify.

### Variables de entorno

Crea `apps/api/.env` con valores locales:

```env
PORT=2700
PUBLIC_URL=http://IP_DE_TU_MAC:2700
JWT_SECRET=usa-un-secreto-local-largo
SPOTIFY_CLIENT_ID=tu-client-id
SPOTIFY_CLIENT_SECRET=tu-client-secret
SPOTIFY_REDIRECT_URI=http://IP_DE_TU_MAC:2700/auth/spotify/callback
```

Nunca pongas el Client Secret en la app móvil, lo subas al repositorio ni lo compartas públicamente.

### Crear y configurar la app de Spotify

1. Abre el [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Crea una app personal llamada **DarkBass**.
3. Usa una descripción breve indicando que es un proyecto personal sin fines comerciales.
4. Agrega la misma Redirect URI usada en `SPOTIFY_REDIRECT_URI`. La configuración actual utiliza:

```text
http://192.168.40.144:2700/auth/spotify/callback
```

La URI debe coincidir exactamente, incluyendo protocolo, IP, puerto y ruta.

### Iniciar la API

```bash
npm run api
```

La API estará disponible en:

```text
http://192.168.40.144:2700
```

Comprueba su estado con:

```bash
curl http://localhost:2700/health
```

Una respuesta correcta se ve así:

```json
{"ok":true,"spotify":true,"jamendo":false}
```

Si aparece `EADDRINUSE` en el puerto `2700`, la API ya está ejecutándose. No inicies una segunda instancia. Compruébalo con:

```bash
lsof -nP -iTCP:2700 -sTCP:LISTEN
```

## Conectar la app móvil con la API

La app utiliza el archivo local `apps/mobile/.env.local`, que no debe subirse:

```env
EXPO_PUBLIC_SPOTIFY_API_URL=http://IP_DE_TU_MAC:2700
```

Después de modificarlo, reinicia Metro:

```bash
npm run mobile
```

Para el teléfono y la red actuales, la URL es:

```text
http://192.168.40.144:2700
```

## Funcionalidades

### Pads de batería

- 15 pads con sonidos `.wav` locales.
- Carga progresiva de sonidos durante el inicio.
- Respuesta táctil para practicar ritmos.

### Modo DJ

- Decks de audio locales.
- Vinilos y controles de reproducción.
- Crossfader y controles de volumen.
- Navegación entre Pads, DJ y Settings.

### Spotify

- Inicio de sesión OAuth.
- Información del perfil conectado.
- Búsqueda de canciones.
- Consulta de dispositivos y estado de reproducción.
- Controles de play, pausa, anterior, siguiente, seek y volumen.

El control remoto requiere una cuenta Spotify Premium y un dispositivo Spotify activo. DarkBass no mezcla el audio de Spotify con los decks locales.

## API de Spotify

Rutas públicas de autenticación:

```text
GET /auth/spotify/login?redirect_uri=...
GET /auth/spotify/callback
```

Rutas autenticadas:

```text
GET  /spotify/me
GET  /spotify/search?q=...
GET  /spotify/devices
GET  /spotify/player/state
PUT  /spotify/player/play
PUT  /spotify/player/pause
POST /spotify/player/next
POST /spotify/player/previous
PUT  /spotify/player/seek?position_ms=...
PUT  /spotify/player/volume?volume_percent=...
```

## Scripts principales

```bash
npm run mobile                  # Metro en el puerto 8082
npm run mobile:android          # Expo Android en el puerto 8082
npm run mobile:ios              # Expo iOS en el puerto 8082
npm run mobile:native:android   # Compilar e instalar Android
npm run mobile:native:ios       # Compilar e instalar iOS
npm run mobile:native:prebuild  # Regenerar las carpetas nativas
npm run api                     # API en modo desarrollo
npm run api:build               # Compilar la API TypeScript
```

## Notas de desarrollo

- No uses el puerto `8081` para DarkBass si otro proyecto lo está usando.
- Mantén la API y Metro en terminales separadas.
- Si cambia Node.js, ejecuta `npm rebuild better-sqlite3`.
- No inicies una segunda API en el puerto `2700`.
- Nunca subas `.env`, `.env.local`, tokens ni Client Secrets.
- Las carpetas nativas de Android e iOS pueden regenerarse con Expo.

## Licencia

Proyecto personal de experimentación musical. Las credenciales, tokens y configuraciones privadas de desarrollo pertenecen a su propietario.
