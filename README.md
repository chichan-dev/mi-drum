# DarkBass

DarkBass is a personal music experimentation project for practicing drums, exploring DJ tools, and controlling Spotify playback from a mobile app.

The app combines local drum pads, a DJ console, audio decks, and Spotify OAuth integration. Spotify features are handled through a local API that can search tracks and control an active Spotify device.

## Current status

- Native mobile app built with Expo SDK 54 and React Native.
- Android wireless debugging supported through ADB.
- DarkBass Metro server runs on port `8082`.
- Local API runs on port `2700`.
- Spotify OAuth configured for personal development.
- Jamendo remains optional and is not currently configured.

## Requirements

- Node.js 20.x for the API.
- npm.
- Xcode and an iPhone simulator for iOS.
- Android Studio, Android SDK, and JDK 21 for Android.
- An Android phone on the same Wi-Fi network when using wireless debugging.

The API uses `better-sqlite3`, a native module. If the Node.js version changes, rebuild it:

```bash
npm rebuild better-sqlite3
```

## Installation

From the repository root:

```bash
npm install
```

Main project structure:

```text
darkbass/
├── apps/
│   ├── mobile/   # Expo/React Native app
│   └── api/      # Local API and Spotify OAuth
├── package.json
└── README.md
```

## Run the mobile app

DarkBass is configured to use port `8082` because another project may be using `8081`.

```bash
npm run mobile
```

Metro starts at:

```text
http://localhost:8082
```

To start Expo for a specific platform:

```bash
npm run mobile:android
npm run mobile:ios
```

## Native Android

The native build uses the JDK 21 bundled with Android Studio. To build, install, and open DarkBass on the connected phone:

```bash
npm run mobile:native:android
```

The phone must appear as a `device`:

```bash
adb devices -l
```

### Wireless debugging

1. Enable **Developer options** and **Wireless debugging** on Android.
2. Select **Pair device with pairing code**.
3. Discover the available services:

```bash
adb mdns services
```

4. Pair using the pairing address and code shown on the phone:

```bash
adb pair IP:PAIRING_PORT CODE
```

5. Connect using the `_adb-tls-connect._tcp` port:

```bash
adb connect IP:CONNECTION_PORT
adb devices -l
```

The computer and phone must be on the same Wi-Fi network. If the computer's IP changes, update the local development URLs as well.

## Local API

The API lives in `apps/api` and handles OAuth, token storage, and authenticated Spotify requests.

### Environment variables

Create `apps/api/.env` with local values:

```env
PORT=2700
PUBLIC_URL=http://YOUR_MAC_IP:2700
JWT_SECRET=use-a-long-local-secret
SPOTIFY_CLIENT_ID=your-client-id
SPOTIFY_CLIENT_SECRET=your-client-secret
SPOTIFY_REDIRECT_URI=http://YOUR_MAC_IP:2700/auth/spotify/callback
```

Never put the Client Secret in the mobile app, commit it to the repository, or share it publicly.

### Create and configure the Spotify app

1. Open the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Create a personal app named **DarkBass**.
3. Use a short description stating that it is a personal, non-commercial project.
4. Add the same Redirect URI used in `SPOTIFY_REDIRECT_URI`. The current development setup uses:

```text
http://192.168.40.144:2700/auth/spotify/callback
```

The URI must match exactly, including the protocol, IP address, port, and path.

### Start the API

```bash
npm run api
```

The API is available at:

```text
http://192.168.40.144:2700
```

Check its status with:

```bash
curl http://localhost:2700/health
```

A healthy response looks like this:

```json
{"ok":true,"spotify":true,"jamendo":false}
```

If you see `EADDRINUSE` on port `2700`, the API is already running. Do not start a second instance. Check it with:

```bash
lsof -nP -iTCP:2700 -sTCP:LISTEN
```

## Connect the mobile app to the API

The mobile app uses the local file `apps/mobile/.env.local`, which must not be committed:

```env
EXPO_PUBLIC_SPOTIFY_API_URL=http://YOUR_MAC_IP:2700
```

After changing it, restart Metro on the configured port:

```bash
npm run mobile
```

For the current phone and network, the URL is:

```text
http://192.168.40.144:2700
```

## Features

### Drum pads

- 15 drum pads with local `.wav` sounds.
- Progressive sound loading during startup.
- Touch response for rhythm practice.

### DJ mode

- Local audio decks.
- Vinyl and playback controls.
- Crossfader and volume controls.
- Navigation between Pads, DJ, and Settings.

### Spotify

- OAuth sign-in.
- Connected profile information.
- Track search.
- Device and playback state lookup.
- Play, pause, previous, next, seek, and volume controls.

Remote playback control requires a Spotify Premium account and an active Spotify device. DarkBass does not mix Spotify audio with the local decks.

## Spotify API

Public authentication routes:

```text
GET /auth/spotify/login?redirect_uri=...
GET /auth/spotify/callback
```

Authenticated routes:

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

## Main scripts

```bash
npm run mobile                  # Metro on port 8082
npm run mobile:android          # Expo Android on port 8082
npm run mobile:ios              # Expo iOS on port 8082
npm run mobile:native:android   # Build and install Android
npm run mobile:native:ios       # Build and install iOS
npm run mobile:native:prebuild  # Regenerate native folders
npm run api                     # API in development mode
npm run api:build               # Build the TypeScript API
```

## Development notes

- Do not use port `8081` for DarkBass when another project is using it.
- Keep the API and Metro running in separate terminals.
- If Node.js changes, run `npm rebuild better-sqlite3`.
- Do not start a second API on port `2700`.
- Never commit `.env`, `.env.local`, tokens, or Client Secrets.
- Android and iOS native folders can be regenerated with Expo.

## License

Personal music experimentation project. Credentials, tokens, and private development configuration belong to their owner.
