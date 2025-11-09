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
* **expo-av** (reproducción de audio).
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

## 📜 Licencia

MIT © chichan‑dev. Consulta el archivo `LICENSE`.

---

## 🧾 Créditos

* **chichan‑dev** — desarrollo y mantenimiento.
  
---

## 🧩 Branding

```
Made with ❤️ by chichan‑dev  |  chichan‑labs
```

---

## 📸 Screenshots


---

## ❓ FAQ

**¿No suena nada en iOS?** Verifica el *mute switch* y permisos de audio si usas motores alternativos.

**¿Se oye con retraso en Android?** Prueba con `.wav` cortos, precarga sonidos y cierra apps en segundo plano.

**¿Puedo usar teclado físico?** Sí, mapea eventos en una pantalla web o con libs que expongan key events.

---
