# 🥁 Drum App (Expo) — by **chichan‑dev**

¡Bienvenido! Este repositorio contiene una app **Drum Pads** construida con **React Native + Expo**. El objetivo es ofrecer una base limpia para disparar samples, personalizar bancos de sonidos y practicar ritmos desde el móvil o emulador.

> **Marca**: parte del ecosistema **chichan‑dev** · Repos/paquetes bajo el paraguas de *chichan‑labs*.

---

## ✨ Características

* Pads táctiles con baja latencia (según dispositivo).
* Carga de **samples** locales desde `assets/`.
* Mapeo de pads configurable (nombre, color, sonido, volumen, **pitch/gain** si aplica).
* Indicador visual al presionar.
* Modo **Hold** / **One‑Shot** (dependiendo de implementación de audio).
* Soporte Expo (sin configuración nativa compleja para empezar).

> **Nota:** El rendimiento y la latencia dependen del hardware y del motor de audio seleccionado. Ver sección [Audio Engine](#-audio-engine) para opciones.

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
