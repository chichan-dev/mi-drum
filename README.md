# 🥁 Chichan DJ & Drum App (Expo)

¡Bienvenido! Esta app combina **Drum Pads** con una **consola DJ completa** construida con **React Native + Expo**. Incluye autenticación OAuth con Google, integración con YouTube Music, y control de decks de DJ profesional.

> **Marca**: parte del ecosistema **chichan‑dev** · Repos/paquetes bajo el paraguas de *chichan‑labs*.

---

## ✨ Características

### Drum Pads
* Pads táctiles con baja latencia (según dispositivo)
* Carga de **samples** locales desde `assets/`
* Mapeo de pads configurable (nombre, color, sonido, volumen, **pitch/gain**)
* Indicador visual al presionar
* Modo **Hold** / **One‑Shot**

### DJ Console
* 🎚️ **Doble deck de vinilo** con controles táctiles
* 🎵 **Waveforms** visuales en tiempo real
* 🔀 **Crossfader** suave entre decks
* 🎛️ **Controles verticales** de volumen por deck
* ▶️ **Play, Cue, Sync** buttons profesionales
* 🔍 **Búsqueda de música** en YouTube
* 📱 **Integración con YouTube**: canal, playlists, me gusta
* 🔐 **Autenticación OAuth con Google**
* 💾 **Persistencia segura** de sesión con Zustand + SecureStore

### Sistema de Autenticación
* Login con cuenta de Google
* Token JWT para todas las peticiones
* Almacenamiento encriptado del token
* Persistencia de sesión entre reinicios
* **[Ver documentación completa](AUTH_README.md)**

---

## 🚀 Inicio Rápido

### 1. Instalación
```bash
npm install
# o
npx expo install
```

### 2. Configurar Backend (para funciones DJ)
Sigue la guía en **[AUTH_README.md](AUTH_README.md)** para:
- Configurar Google OAuth
- Iniciar el backend de ejemplo
- Obtener tus credenciales de API

### 3. Iniciar la App
```bash
# Con variables de entorno para conectar al backend
EXPO_PUBLIC_API_BASE_URL="http://192.168.80.26:2600" \
EXPO_PUBLIC_AUTH_URL="http://192.168.80.26:2600/auth/google" \
expo start
```

---

## 📂 Estructura del Proyecto

```
app/
  (tabs)/
    index.tsx           # Pantalla de Drum Pads
    DJ.tsx              # Consola DJ con autenticación
    Settings.tsx        # Configuración
store/
  useAuthStore.ts       # State management de autenticación
  useDrumStore.ts       # State de drum pads
hooks/
  useGoogleAuth.ts      # Hook de OAuth con Google
  useDeckPlayer.ts      # Control de decks de DJ
  useAudio.ts           # Audio engine
components/ui/
  LoginScreen.tsx       # Pantalla de login
  VinylDeck.tsx         # Deck de vinilo visual
  Crossfader.tsx        # Crossfader entre decks
  Waveform.tsx          # Visualización de waveform
  VerticalSlider.tsx    # Control de volumen vertical
services/
  api.ts                # Cliente HTTP con autenticación
  audio.ts              # Motor de audio
```

---

## 🔐 Autenticación

El sistema de autenticación permite:
- Login con Google OAuth
- Acceso a tu canal de YouTube, playlists y me gusta
- Búsqueda de música
- Token JWT persistente y seguro

**Documentación completa:**
- **[AUTH_README.md](AUTH_README.md)** - Guía rápida
- **[OAUTH_SETUP.md](OAUTH_SETUP.md)** - Setup detallado del backend
- **[backend-example.js](backend-example.js)** - Código de servidor completo

---

## 🧱 Stack

* **React Native** + **Expo** (SDK 51+ recomendado).
* **expo-av** (reproducción de audio) u otra lib similar.
* **TypeScript** opcional.

---

## 📦 Requisitos previos

* **Node.js** LTS (18/20).
* Gestor de paquetes: `npm`, `yarn` o `pnpm`.
* **Expo Go** en tu teléfono *(Android/iOS)* o **Android Studio** / **Xcode** si usarás emuladores.
* Cuenta Expo (opcional, para builds/OTA).

---

## 🚀 Cómo correr el proyecto (Expo)

```bash
# 1) Instalar dependencias
npm install          # o: yarn | pnpm i

# 2) Iniciar el servidor de desarrollo
npx expo start -c    # limpia la caché por si acaso

# 3a) Abrir en dispositivo físico con Expo Go
#    - Escanea el QR que muestra la terminal o la web de Expo

# 3b) Abrir en emulador
#    - Android: presiona "a" en la terminal (necesitas Android Studio en ejecución)
#    - iOS: presiona "i" (solo macOS con Xcode)
```

**Comandos útiles**

```bash
npm run android   # lanza en emulador/dispositivo Android
npm run ios       # lanza en simulador iOS (macOS)
npm run web       # modo web (experimental según componentes)
```

---

## 🗂️ Estructura sugerida

```
mi-drum/
├─ app/                     # rutas Expo Router (si se usa)
├─ src/
│  ├─ components/
│  │  ├─ Pad.tsx
│  │  └─ PadGrid.tsx
│  ├─ hooks/
│  │  └─ useSound.ts        # hook para cargar/reproducir
│  ├─ config/
│  │  └─ pads.ts            # mapeo de pads (id, label, color, sample)
│  └─ screens/
│     └─ HomeScreen.tsx
├─ assets/
│  └─ samples/              # aquí van los .wav / .mp3
├─ package.json
└─ README.md
```

---

## 🎛️ Configurar pads

Define tu banco en `src/config/pads.ts`:

```ts
// src/config/pads.ts
export type Pad = {
  id: string;
  label: string;
  color?: string;
  file: any;      // require('...') o Asset
  volume?: number; // 0..1
};

export const PADS: Pad[] = [
  { id: 'kick', label: 'KICK', color: '#D64550', file: require('../../assets/samples/kick.wav'), volume: 0.9 },
  { id: 'snare', label: 'SNARE', color: '#84DD8A', file: require('../../assets/samples/snare.wav') },
  { id: 'hat', label: 'HAT', color: '#FFD166', file: require('../../assets/samples/hihat.wav') },
  // ...
];
```

En tu `Pad.tsx` usa `expo-av` para reproducir el audio del `file` del pad. Controla `volume`, `rate` (pitch) y `shouldPlay` según el modo.

---

## 🔊 Paquete de sonidos de prueba (15 samples)

Coloca tus audios en `assets/samples/` y actualiza `pads.ts`. Sugerencia de nombres:

```
assets/samples/
├─ kick.wav
├─ snare.wav
├─ hihat.wav
├─ clap.wav
├─ rim.wav
├─ tom_low.wav
├─ tom_mid.wav
├─ tom_high.wav
├─ crash.wav
├─ ride.wav
├─ perc1.wav
├─ perc2.wav
├─ fx_sweep.wav
├─ fx_riser.wav
└─ shaker.wav
```

> Tip: archivos **.wav** cortos suelen dar mejor respuesta que .mp3.

---

## 🧠 Audio Engine

* **expo-av**: sencillo y soportado en Expo sin eject. Ideal para empezar.
* **react-native-track-player** o **react-native-sound**: más control, pero puede requerir configuración nativa.
* **WebAudio (Expo Web)**: solo para web.

Empieza con `expo-av` y evalúa latencia. Optimiza con:

* Samples cortos (mono, 44.1 kHz, 16‑bit).
* Pre‑carga de sonidos (loadAsync) en la pantalla inicial.
* Evitar crear/destroy `Sound` en cada tap; reutiliza instancias si es viable.

---

## 🧪 Testing rápido

* Prueba la presión repetida en diferentes pads para chequear solapamiento.
* Mide latencia subjetiva en Android vs iOS.
* Verifica volúmenes balanceados y normaliza si es necesario.

---

## 🛠️ Scripts (ejemplos)

Agrega en `package.json` según tu gestor:

```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "web": "expo start --web",
    "clean": "rimraf node_modules .expo .expo-shared && npm i"
  }
}
```

> Ajusta `run:android/ios` si estás usando *managed workflow* con EAS o si prefieres solo `expo start`.

---

## 🧩 Personalización rápida

* **Colores** de pads: en `pads.ts` (`color`).
* **Etiquetas**: `label`.
* **Tamaño/espaciado**: en `PadGrid.tsx` (usar `Dimensions` y `aspectRatio`).
* **Feedback visual**: animación con `Pressable` + `Animated`.

---

## 🗺️ Roadmap

* [ ] Grabación y export de loops.
* [ ] Quantize / metrónomo.
* [ ] Bancos múltiples y selector.
* [ ] Import de samples del dispositivo.
* [ ] Secuenciador simple de 16 pasos.

---

## 🤝 Contribuciones

¡Se aceptan PRs! Abre un *issue* con la mejora/bug y describe:

1. Contexto, 2) Pasos para reproducir, 3) Propuesta, 4) Capturas si aplica.

**Estilo**: sigue el linter/prettier del repo. Convenciones de *commit* sugeridas: *feat/fix/chore/docs/refactor/test*.

---

## 📜 Licencia

MIT © chichan‑dev. Consulta el archivo `LICENSE`.

---

## 🧾 Créditos

* **chichan‑dev** — desarrollo y mantenimiento.
* Samples de prueba: usa material libre de royalties o propio. Atribuye si empleas librerías/catálogos de terceros.

---

## 🧩 Branding

Si reutilizas esta base en otros repos, siéntete libre de mantener el sello:

```
Made with ❤️ by chichan‑dev  |  chichan‑labs
```

---

## 📸 Screenshots (opcional)

Coloca imágenes en `assets/screens/` y enlázalas aquí:

![Home](assets/screens/home.png)
![Pad Grid](assets/screens/pads.png)

---

## ❓ FAQ

**¿No suena nada en iOS?** Verifica el *mute switch* y permisos de audio si usas motores alternativos.

**¿Se oye con retraso en Android?** Prueba con `.wav` cortos, precarga sonidos y cierra apps en segundo plano.

**¿Puedo usar teclado físico?** Sí, mapea eventos en una pantalla web o con libs que expongan key events.

---

> ¿Necesitas que deje pre‑configurado un **banco de 15 sonidos** y el `hook` de audio? Pídemelo y lo agrego al repo base.
