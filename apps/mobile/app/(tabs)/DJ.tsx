import * as DocumentPicker from "expo-document-picker";
import * as ScreenOrientation from "expo-screen-orientation";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  LayoutChangeEvent,
  View as RNView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  FolderOpen,
  Headphones,
  LayoutGrid,
  Music,
  Music2,
  Pause,
  Play,
  Settings as SettingsIcon,
  Shuffle,
  SkipBack,
  SkipForward,
  User,
} from "lucide-react-native";

import { Text } from "@/components/Themed";
import Crossfader from "@/components/ui/Crossfader";
import {
  CueButton,
  DJButton,
  PlayButton,
  SyncButton,
} from "@/components/ui/DJButtons";
import FullScreenModal from "@/components/ui/FullScreenModal";
import VerticalSlider from "@/components/ui/VerticalSlider";
import VinylDeck from "@/components/ui/VinylDeck";
import Waveform from "@/components/ui/Waveform";
import { useAudio } from "@/hooks/useAudio";
import { DeckTrack, useDeckPlayer } from "@/hooks/useDeckPlayer";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { useSpotifyAuth } from "@/hooks/useSpotifyAuth";
import {
  SpotifyPlayerState,
  SpotifyTrack,
  fetchSpotifyPlayerState,
  nextSpotifyTrack,
  pauseSpotifyPlayback,
  playSpotifyTrack,
  previousSpotifyTrack,
  resumeSpotifyPlayback,
  searchSpotifyTracks,
} from "@/services/spotifyApi";
import { useAuthStore } from "@/store/useAuthStore";
import { useSpotifyStore } from "@/store/useSpotifyStore";

const DEMO_TRACKS: DeckTrack[] = [
  {
    id: "demo-local",
    title: "Demo Groove (local)",
    artist: "Sample pack",
    origin: "local",
    source: {
      uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    },
    artwork: require("../../assets/images/icon.png"),
  },
  {
    id: "demo-stream",
    title: "Demo Stream (SoundHelix)",
    artist: "Stream libre",
    origin: "stream",
    source: {
      uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    },
    artwork: require("../../assets/images/portrait_main.png"),
  },
];

export default function DJScreen() {
  useAudio();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuthStore();
  const { logout } = useGoogleAuth();
  const {
    connect: connectSpotify,
    isLoading: spotifyConnecting,
    error: spotifyAuthError,
  } = useSpotifyAuth();
  const { isConnected: spotifyConnected, profile: spotifyProfile } =
    useSpotifyStore();
  const deckA = useDeckPlayer();
  const deckB = useDeckPlayer();
  const { width, height } = useWindowDimensions();
  const [crossfader, setCrossfader] = useState(0.5);
  const [volumeA, setVolumeA] = useState(0.8);
  const [volumeB, setVolumeB] = useState(0.8);
  const [apiMessage, setApiMessage] = useState<string | null>(null);
  const [localTracks, setLocalTracks] = useState<DeckTrack[]>(DEMO_TRACKS);
  const [activeModal, setActiveModal] = useState<
    "perfil" | "archivos" | "spotify" | null
  >(null);
  const [spotifyQuery, setSpotifyQuery] = useState("");
  const [spotifyResults, setSpotifyResults] = useState<SpotifyTrack[]>([]);
  const [spotifySearching, setSpotifySearching] = useState(false);
  const [spotifyPlayerError, setSpotifyPlayerError] = useState<string | null>(
    null
  );
  const [spotifyPlayerState, setSpotifyPlayerState] =
    useState<SpotifyPlayerState | null>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const handleStageLayout = (event: LayoutChangeEvent) => {
    const { width: w, height: h } = event.nativeEvent.layout;
    setStageSize({ width: w, height: h });
  };
  const isWide = width > height;

  const handlePickLocalAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newTrack: DeckTrack = {
          id: `local-${Date.now()}`,
          title: asset.name || "Audio local",
          artist: "Dispositivo",
          origin: "local",
          source: { uri: asset.uri },
        };
        setLocalTracks((prev) => [newTrack, ...prev]);
        setApiMessage(null);
      }
    } catch (err) {
      console.warn("Error seleccionando audio:", err);
      setApiMessage("No se pudo abrir el explorador de archivos de audio.");
    }
  };

  // Permite acceder inmediatamente en modo local/invitado sin necesidad de login obligatorio
  if (authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <RNView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#34d399" />
          <Text style={styles.loadingText}>Cargando...</Text>
        </RNView>
      </SafeAreaView>
    );
  }

  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

  // Usamos el tamaño realmente disponible (medido con onLayout, ya sin
  // la barra de tabs ni los insets) en vez del alto crudo de la ventana,
  // para que todo el contenido quepa sin necesidad de scroll en cualquier
  // dispositivo. Antes de la primera medición usamos la ventana como stub.
  const stageWidth = stageSize.width || width;
  const stageHeight = stageSize.height || height;

  const GAP = 6;
  const headerH = clamp(stageHeight * 0.11, 26, 36);
  const waveformH = clamp(stageHeight * 0.12, 36, 50);
  const topControlsH = clamp(stageHeight * 0.07, 18, 28);
  const crossfaderH = clamp(stageHeight * 0.13, 42, 56);
  const decksRowH = Math.max(
    80,
    stageHeight - headerH - waveformH - topControlsH - crossfaderH - GAP * 4
  );

  // Responsive sizes (platos y consola más compactos)
  const waveformWidth = isWide
    ? Math.min(stageWidth * 0.32, 320)
    : Math.max(stageWidth - 48, 180);
  const controlSize = clamp(decksRowH * 0.26, 28, 44);
  const deckSizeFromHeight = decksRowH - controlSize - 10;
  const deckSizeFromWidth = isWide
    ? Math.min(stageWidth * 0.16, 140)
    : Math.min(stageWidth * 0.36, 130);
  const deckSize = clamp(
    Math.min(deckSizeFromHeight, deckSizeFromWidth),
    50,
    150
  );
  const sliderHeight = clamp(decksRowH * 0.72, 46, 120);

  // Scale helper: reduce sizes on narrow screens (phones)
  const scale = (value: number) => {
    const base = 390; // reference width (iPhone 12/13)
    const factor = Math.min(1, stageWidth / base);
    return Math.round(value * factor);
  };

  const { leftGain, rightGain } = useMemo(() => {
    const left = Math.cos(crossfader * (Math.PI / 2));
    const right = Math.sin(crossfader * (Math.PI / 2));
    return { leftGain: left, rightGain: right };
  }, [crossfader]);

  useEffect(() => {
    deckA.setCrossGain(leftGain * volumeA);
    deckB.setCrossGain(rightGain * volumeB);
  }, [deckA, deckB, leftGain, rightGain, volumeA, volumeB]);

  useFocusEffect(
    React.useCallback(() => {
      // Forzar siempre modo horizontal (LANDSCAPE) al entrar al modo DJ
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE
      ).catch(() => undefined);

      return () => {
        // Al salir del modo DJ, liberar la orientación: Pads no se bloquea
        // a vertical, se puede usar libremente en ambas orientaciones.
        ScreenOrientation.unlockAsync().catch(() => undefined);
      };
    }, [])
  );

  // Poll del estado de reproducción de Spotify mientras el panel está
  // abierto: es control remoto sobre el dispositivo activo del usuario, no
  // audio que pasa por nuestro motor, así que no hay evento nativo al que
  // suscribirse.
  useEffect(() => {
    if (activeModal !== "spotify" || !spotifyConnected) return;

    let cancelled = false;
    const poll = async () => {
      try {
        const state = await fetchSpotifyPlayerState();
        if (!cancelled) setSpotifyPlayerState(state);
      } catch {
        // silencioso: puede no haber dispositivo activo todavía
      }
    };
    poll();
    const id = setInterval(poll, 3000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [activeModal, spotifyConnected]);

  const handleSpotifySearch = async () => {
    if (!spotifyQuery.trim()) return;
    setSpotifySearching(true);
    setSpotifyPlayerError(null);
    try {
      const results = await searchSpotifyTracks(spotifyQuery);
      setSpotifyResults(results);
    } catch (err) {
      setSpotifyPlayerError(
        err instanceof Error ? err.message : "No se pudo buscar en Spotify"
      );
    } finally {
      setSpotifySearching(false);
    }
  };

  const handleSpotifyPlayTrack = async (uri: string) => {
    setSpotifyPlayerError(null);
    try {
      await playSpotifyTrack(uri);
      const state = await fetchSpotifyPlayerState();
      setSpotifyPlayerState(state);
    } catch (err) {
      setSpotifyPlayerError(
        err instanceof Error
          ? err.message
          : "No se pudo reproducir. ¿Tenés Spotify abierto en algún dispositivo?"
      );
    }
  };

  const handleSpotifyTogglePlay = async () => {
    setSpotifyPlayerError(null);
    try {
      if (spotifyPlayerState?.is_playing) {
        await pauseSpotifyPlayback();
      } else {
        await resumeSpotifyPlayback();
      }
      const state = await fetchSpotifyPlayerState();
      setSpotifyPlayerState(state);
    } catch (err) {
      setSpotifyPlayerError(
        err instanceof Error ? err.message : "No se pudo controlar la reproducción"
      );
    }
  };

  const handleSpotifySkip = async (direction: "next" | "previous") => {
    setSpotifyPlayerError(null);
    try {
      if (direction === "next") await nextSpotifyTrack();
      else await previousSpotifyTrack();
      const state = await fetchSpotifyPlayerState();
      setSpotifyPlayerState(state);
    } catch (err) {
      setSpotifyPlayerError(
        err instanceof Error ? err.message : "No se pudo cambiar de pista"
      );
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const isPlayingA = Boolean(deckA.status?.isLoaded && deckA.status.isPlaying);
  const isPlayingB = Boolean(deckB.status?.isLoaded && deckB.status.isPlaying);

  const loadDemoTrack = async (deck: typeof deckA, track: DeckTrack) => {
    await deck.loadTrack(track);
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right", "bottom"]}
    >
      <RNView style={styles.stage} onLayout={handleStageLayout}>
        {/* Navegación de vuelta a Pads: reemplaza la tab bar inferior (oculta en DJ) */}
        <RNView style={styles.navTriggersLeft} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.modalTriggerButton}
            onPress={() => router.push("/")}
          >
            <LayoutGrid size={16} color="#e3e5ec" />
          </TouchableOpacity>
        </RNView>

        {/* Botones que abren las secciones no esenciales en modales de pantalla completa,
            más el acceso a Settings (overlay, no ocupan alto) */}
        <RNView style={styles.modalTriggers} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.modalTriggerButton}
            onPress={() => setActiveModal("perfil")}
          >
            <User size={16} color="#e3e5ec" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modalTriggerButton}
            onPress={() => setActiveModal("archivos")}
          >
            <FolderOpen size={16} color="#e3e5ec" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modalTriggerButton}
            onPress={() => setActiveModal("spotify")}
          >
            <Music size={16} color="#1DB954" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modalTriggerButton}
            onPress={() => router.push("/Settings")}
          >
            <SettingsIcon size={16} color="#e3e5ec" />
          </TouchableOpacity>
        </RNView>

        {/* 1. Header con números de deck */}
        <RNView style={[styles.header, { height: headerH }]}>
          <RNView
            style={[
              styles.deckNumber,
              {
                backgroundColor: "#ff1f3d",
                width: scale(22),
                height: scale(22),
                borderRadius: scale(11),
              },
            ]}
          >
            <Text style={[styles.deckNumberText, { fontSize: scale(12) }]}>
              1
            </Text>
          </RNView>
          <Text style={[styles.mainTitle, { fontSize: scale(23) }]}>
            DarkBass DJ
          </Text>
          <RNView
            style={[
              styles.deckNumber,
              {
                backgroundColor: "#6e0f1f",
                width: scale(22),
                height: scale(22),
                borderRadius: scale(11),
              },
            ]}
          >
            <Text style={[styles.deckNumberText, { fontSize: scale(12) }]}>
              2
            </Text>
          </RNView>
        </RNView>

        {/* 2. Sección de waveforms */}
        <RNView style={[styles.waveformsContainer, { height: waveformH }]}>
          <Waveform
            width={waveformWidth}
            height={waveformH}
            color="#ff1f3d"
            isPlaying={isPlayingA}
            position={deckA.status?.positionMillis || 0}
            duration={deckA.status?.durationMillis || 1}
            trackTitle={deckA.track?.title}
            artist={deckA.track?.artist}
          />
          <Waveform
            width={waveformWidth}
            height={waveformH}
            color="#6e0f1f"
            isPlaying={isPlayingB}
            position={deckB.status?.positionMillis || 0}
            duration={deckB.status?.durationMillis || 1}
            trackTitle={deckB.track?.title}
            artist={deckB.track?.artist}
          />
        </RNView>

        {/* 3. Controles superiores: rango de pitch por deck */}
        <RNView style={[styles.topControls, { height: topControlsH }]}>
          <DJButton
            label="±6"
            onPress={() => {}}
            color="#ff1f3d"
            size="small"
          />
          <DJButton
            label="±6"
            onPress={() => {}}
            color="#6e0f1f"
            size="small"
          />
        </RNView>

        {/* 4. Decks principales con controles (Vinilos + Sliders) */}
        <RNView
          style={[
            styles.decksRow,
            isWide && styles.decksRowWide,
            { height: decksRowH },
          ]}
        >
          {/* Control de volumen izquierdo */}
          <RNView style={styles.volumeControl}>
            <VerticalSlider
              value={volumeA}
              onChange={setVolumeA}
              height={sliderHeight}
              color="#ff1f3d"
            />
          </RNView>

          {/* Deck A */}
          <RNView style={styles.deckContainer}>
            <VinylDeck
              size={deckSize}
              accentColor="#ff1f3d"
              artwork={deckA.track?.artwork}
              player={deckA}
              isPlaying={isPlayingA}
              bpm={124}
              pitchPercent={-4.2}
              trackTitle={deckA.track?.title}
              artist={deckA.track?.artist}
            />
            <RNView style={[styles.deckControls, { gap: scale(8) }]}>
              <CueButton
                onPress={() => deckA.restart()}
                color="#FFA500"
                size={controlSize}
              />
              <PlayButton
                onPress={() => deckA.togglePlay()}
                isPlaying={isPlayingA}
                color="#4CAF50"
                size={controlSize}
              />
            </RNView>
          </RNView>

          {/* Controles centrales: SYNC+SLIP agrupados a cada lado del AUTOMIX */}
          <RNView style={styles.centerControls}>
            <RNView style={styles.centerColumn}>
              <SyncButton onPress={() => {}} />
              <DJButton
                label="SLIP"
                onPress={() => {}}
                color="rgba(255,255,255,0.5)"
                size="small"
              />
            </RNView>

            <RNView
              style={[
                styles.autoMixButton,
                {
                  width: scale(42),
                  height: scale(42),
                  borderRadius: scale(21),
                },
              ]}
            >
              <Shuffle
                size={Math.max(12, scale(16))}
                color="#ff2a3b"
                strokeWidth={2.5}
              />
              <Text
                style={[
                  styles.autoMixLabel,
                  { fontSize: Math.max(6, Math.round(scale(6))) },
                ]}
              >
                AUTOMIX
              </Text>
            </RNView>

            <RNView style={styles.centerColumn}>
              <SyncButton onPress={() => {}} />
              <DJButton
                label="SLIP"
                onPress={() => {}}
                color="rgba(255,255,255,0.5)"
                size="small"
              />
            </RNView>
          </RNView>

          {/* Deck B */}
          <RNView style={styles.deckContainer}>
            <VinylDeck
              size={deckSize}
              accentColor="#6e0f1f"
              artwork={deckB.track?.artwork}
              player={deckB}
              isPlaying={isPlayingB}
              bpm={124}
              pitchPercent={0}
              trackTitle={deckB.track?.title}
              artist={deckB.track?.artist}
            />
            <RNView style={[styles.deckControls, { gap: scale(8) }]}>
              <CueButton
                onPress={() => deckB.restart()}
                color="#FFA500"
                size={controlSize}
              />
              <PlayButton
                onPress={() => deckB.togglePlay()}
                isPlaying={isPlayingB}
                color="#4CAF50"
                size={controlSize}
              />
            </RNView>
          </RNView>

          {/* Control de volumen derecho */}
          <RNView style={styles.volumeControl}>
            <VerticalSlider
              value={volumeB}
              onChange={setVolumeB}
              height={sliderHeight}
              color="#6e0f1f"
            />
          </RNView>
        </RNView>

        {/* 5. Crossfader */}
        <RNView style={[styles.crossfaderSection, { height: crossfaderH }]}>
          <Crossfader
            value={crossfader}
            onChange={setCrossfader}
            leftLabel="Deck A"
            rightLabel="Deck B"
            leftColor="#ff1f3d"
            rightColor="#6e0f1f"
          />
        </RNView>
      </RNView>

      {/* Modal: Perfil (usuario, canal, playlists) */}
      <FullScreenModal
        visible={activeModal === "perfil"}
        onClose={() => setActiveModal(null)}
        title="Perfil"
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.modalContent}
        >
          <RNView style={styles.userHeader}>
            {user?.picture ? (
              <Image source={{ uri: user.picture }} style={styles.userAvatar} />
            ) : (
              <RNView style={styles.userAvatarPlaceholder}>
                {user?.name?.[0] || user?.email?.[0] ? (
                  <Text style={styles.userAvatarInitial}>
                    {user?.name?.[0] || user?.email?.[0]}
                  </Text>
                ) : (
                  <Headphones size={22} color="#ffffff" />
                )}
              </RNView>
            )}
            <RNView style={{ flex: 1 }}>
              <Text style={styles.userName}>
                {user?.name || (isAuthenticated ? "Usuario" : "Modo Local / Demo")}
              </Text>
              <Text style={styles.userEmail}>
                {user?.email || (isAuthenticated ? "" : "Acceso libre sin inicio de sesión")}
              </Text>
            </RNView>
            {isAuthenticated ? (
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Text style={styles.logoutButtonText}>Salir</Text>
              </TouchableOpacity>
            ) : null}
          </RNView>

          <Text style={styles.mutedText}>
            {isAuthenticated
              ? "Sesión iniciada con Google."
              : "Estás usando la app en modo local/invitado. Podés cargar tu propia música desde Archivos sin necesidad de iniciar sesión."}
          </Text>
        </ScrollView>
      </FullScreenModal>

      {/* Modal: Archivos (pistas demo y audio local del dispositivo) */}
      <FullScreenModal
        visible={activeModal === "archivos"}
        onClose={() => setActiveModal(null)}
        title="Archivos"
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.modalContent}
        >
          {apiMessage ? (
            <Text style={styles.apiError}>{apiMessage}</Text>
          ) : null}
          <TouchableOpacity
            style={[
              styles.primaryButton,
              {
                marginBottom: 12,
                backgroundColor: "#34d399",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              },
            ]}
            onPress={handlePickLocalAudio}
          >
            <FolderOpen size={16} color="#000" />
            <Text style={[styles.primaryButtonText, { color: "#000", fontWeight: "700" }]}>
              Cargar audio del dispositivo
            </Text>
          </TouchableOpacity>

          <RNView style={{ gap: 8, width: "100%" }}>
            {localTracks.map((t) => (
              <RNView key={t.id} style={styles.trackCard}>
                <RNView style={[styles.trackThumb, styles.trackThumbPlaceholder]}>
                  <Music2 size={22} color="#ff2a3b" />
                </RNView>
                <RNView style={{ flex: 1 }}>
                  <Text style={styles.trackTitle} numberOfLines={1}>
                    {t.title}
                  </Text>
                  <Text style={styles.trackMeta} numberOfLines={1}>
                    {t.artist || "Audio local"}
                  </Text>
                </RNView>
                <RNView style={styles.trackActions}>
                  <TouchableOpacity
                    style={[styles.loadButton, { backgroundColor: "#ff1f3d" }]}
                    onPress={() => loadDemoTrack(deckA, t)}
                  >
                    <Text style={styles.loadButtonText}>Deck 1</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.loadButton, { backgroundColor: "#6e0f1f" }]}
                    onPress={() => loadDemoTrack(deckB, t)}
                  >
                    <Text style={styles.loadButtonText}>Deck 2</Text>
                  </TouchableOpacity>
                </RNView>
              </RNView>
            ))}
          </RNView>
        </ScrollView>
      </FullScreenModal>

      {/* Modal: Spotify (control remoto — no mezcla audio con los decks locales) */}
      <FullScreenModal
        visible={activeModal === "spotify"}
        onClose={() => setActiveModal(null)}
        title="Spotify"
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.modalContent}
        >
          {!spotifyConnected ? (
            <>
              <Text style={styles.mutedText}>
                Conectá tu cuenta de Spotify Premium para buscar canciones y
                controlar la reproducción de forma remota (play, pausa,
                siguiente). No se mezcla el audio de Spotify con los decks
                locales: es un control remoto sobre tu dispositivo Spotify
                activo.
              </Text>
              {spotifyAuthError ? (
                <Text style={styles.apiError}>{spotifyAuthError}</Text>
              ) : null}
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: "#1DB954", borderColor: "#1ed760" }]}
                onPress={connectSpotify}
                disabled={spotifyConnecting}
              >
                {spotifyConnecting ? (
                  <ActivityIndicator color="#04250f" />
                ) : (
                  <Text style={[styles.primaryButtonText, { color: "#04250f" }]}>
                    Conectar con Spotify
                  </Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <RNView style={styles.userHeader}>
                <RNView style={styles.userAvatarPlaceholder}>
                  <Music size={22} color="#1DB954" />
                </RNView>
                <RNView style={{ flex: 1 }}>
                  <Text style={styles.userName}>
                    {spotifyProfile?.display_name || "Cuenta de Spotify"}
                  </Text>
                  <Text style={styles.userEmail}>
                    {spotifyProfile?.product === "premium"
                      ? "Premium"
                      : "Necesitás Spotify Premium para controlar la reproducción"}
                  </Text>
                </RNView>
              </RNView>

              {spotifyPlayerError ? (
                <Text style={styles.apiError}>{spotifyPlayerError}</Text>
              ) : null}

              <RNView style={styles.userHeader}>
                <RNView style={{ flex: 1 }}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {spotifyPlayerState?.item?.name ?? "Sin reproducción activa"}
                  </Text>
                  <Text style={styles.userEmail} numberOfLines={1}>
                    {spotifyPlayerState?.item?.artists
                      ?.map((a) => a.name)
                      .join(", ") || "Abrí Spotify en un dispositivo para controlarlo desde acá"}
                  </Text>
                </RNView>
              </RNView>

              <RNView style={styles.spotifyControlsRow}>
                <TouchableOpacity
                  style={[styles.loadButton, { backgroundColor: "#1a1112" }]}
                  onPress={() => handleSpotifySkip("previous")}
                >
                  <SkipBack size={18} color="#e3e5ec" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.loadButton, { backgroundColor: "#1DB954" }]}
                  onPress={handleSpotifyTogglePlay}
                >
                  {spotifyPlayerState?.is_playing ? (
                    <Pause size={18} color="#04250f" />
                  ) : (
                    <Play size={18} color="#04250f" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.loadButton, { backgroundColor: "#1a1112" }]}
                  onPress={() => handleSpotifySkip("next")}
                >
                  <SkipForward size={18} color="#e3e5ec" />
                </TouchableOpacity>
              </RNView>

              <RNView style={styles.searchRow}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar en Spotify..."
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={spotifyQuery}
                  onChangeText={setSpotifyQuery}
                  autoCapitalize="none"
                  returnKeyType="search"
                  onSubmitEditing={handleSpotifySearch}
                />
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleSpotifySearch}
                  disabled={spotifySearching}
                >
                  {spotifySearching ? (
                    <ActivityIndicator color="#0a0a0a" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Buscar</Text>
                  )}
                </TouchableOpacity>
              </RNView>

              <RNView style={{ gap: 8, width: "100%" }}>
                {spotifyResults.map((track) => (
                  <RNView key={track.id} style={styles.trackCard}>
                    {track.album?.images?.[0]?.url ? (
                      <Image
                        source={{ uri: track.album.images[0].url }}
                        style={styles.trackThumb}
                        resizeMode="cover"
                      />
                    ) : (
                      <RNView style={[styles.trackThumb, styles.trackThumbPlaceholder]}>
                        <Music2 size={22} color="#1DB954" />
                      </RNView>
                    )}
                    <RNView style={{ flex: 1 }}>
                      <Text style={styles.trackTitle} numberOfLines={1}>
                        {track.name}
                      </Text>
                      <Text style={styles.trackMeta} numberOfLines={1}>
                        {track.artists.map((a) => a.name).join(", ")}
                      </Text>
                    </RNView>
                    <TouchableOpacity
                      style={[styles.loadButton, { backgroundColor: "#1DB954" }]}
                      onPress={() => handleSpotifyPlayTrack(track.uri)}
                    >
                      <Play size={16} color="#04250f" />
                    </TouchableOpacity>
                  </RNView>
                ))}
              </RNView>
            </>
          )}
        </ScrollView>
      </FullScreenModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07080a",
  },
  stage: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  modalContent: {
    alignItems: "center",
    gap: 10,
    padding: 16,
  },
  apiError: {
    backgroundColor: "rgba(255,42,59,0.15)",
    borderColor: "#ff2a3b",
    borderWidth: 1,
    color: "#ff808c",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  primaryButton: {
    backgroundColor: "#d91625",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ff4d5a",
    shadowColor: "#ff2a3b",
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 6,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "900",
    letterSpacing: 1,
  },
  mutedText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
  },
  trackCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#121319",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#341a1c",
  },
  trackThumb: {
    width: 62,
    height: 62,
    borderRadius: 10,
    backgroundColor: "#1c1213",
  },
  trackThumbPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  trackTitle: {
    color: "#fff",
    fontWeight: "800",
  },
  trackMeta: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
  },
  trackActions: {
    gap: 8,
  },
  spotifyControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#0f0a0a",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#4a2126",
  },
  loadButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  loadButtonText: {
    color: "#ffffff",
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  deckNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ff2a3b",
    shadowOpacity: 0.8,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 6,
    elevation: 6,
  },
  deckNumberText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#fff",
  },
  mainTitle: {
    fontFamily: "MetalMania_400Regular",
    fontSize: 22,
    color: "#e3e5ec",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    textShadowColor: "rgba(255, 42, 59, 0.75)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  waveformsContainer: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
  },
  topControls: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  decksRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    width: "100%",
    paddingHorizontal: 20,
    gap: 10,
    flexWrap: "wrap",
  },
  decksRowWide: {
    flexWrap: "nowrap",
  },
  volumeControl: {
    alignItems: "center",
  },
  deckContainer: {
    alignItems: "center",
    gap: 6,
  },
  deckControls: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
    maxWidth: 170,
  },
  centerControls: {
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
  },
  centerColumn: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  autoMixButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#171010",
    borderWidth: 2,
    borderColor: "#ff2a3b80",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ff2a3b",
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 6,
  },
  autoMixLabel: {
    fontSize: 8,
    fontWeight: "900",
    color: "#ff2a3b",
    marginTop: 2,
    letterSpacing: 1,
  },
  crossfaderSection: {
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  navTriggersLeft: {
    position: "absolute",
    top: 2,
    left: 8,
    zIndex: 10,
    flexDirection: "row",
    gap: 6,
  },
  modalTriggers: {
    position: "absolute",
    top: 2,
    right: 8,
    zIndex: 10,
    flexDirection: "row",
    gap: 6,
  },
  modalTriggerButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(23,15,15,0.85)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#4a2126",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#07080a",
  },
  loadingText: {
    color: "#ff2a3b",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 1,
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#170f0f",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#33181c",
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#cc1422",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ff4d5a",
  },
  userAvatarInitial: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
  },
  userName: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  userEmail: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: "#2a1215",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ff2a3b",
  },
  logoutButtonText: {
    color: "#ff808c",
    fontWeight: "800",
    fontSize: 13,
  },
});
