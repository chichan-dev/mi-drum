import * as DocumentPicker from "expo-document-picker";
import * as ScreenOrientation from "expo-screen-orientation";
import { useFocusEffect } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  View as RNView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { Text } from "@/components/Themed";
import Crossfader from "@/components/ui/Crossfader";
import {
  CueButton,
  DJButton,
  PlayButton,
  SyncButton,
} from "@/components/ui/DJButtons";
import LoginScreen from "@/components/ui/LoginScreen";
import VerticalSlider from "@/components/ui/VerticalSlider";
import VinylDeck from "@/components/ui/VinylDeck";
import Waveform from "@/components/ui/Waveform";
import { useAudio } from "@/hooks/useAudio";
import { DeckTrack, useDeckPlayer } from "@/hooks/useDeckPlayer";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import {
  API_BASE,
  ApiChannel,
  ApiPlaylist,
  ApiProfile,
  ApiTrack,
  fetchChannel,
  fetchLiked,
  fetchPlaylists,
  fetchProfile,
  searchMusic,
} from "@/services/api";
import { useAuthStore } from "@/store/useAuthStore";

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
    artwork: require("../../assets/images/splash-icon.png"),
  },
];

export default function DJScreen() {
  useAudio();
  const { isAuthenticated, isLoading: authLoading, user } = useAuthStore();
  const { logout } = useGoogleAuth();
  const deckA = useDeckPlayer();
  const deckB = useDeckPlayer();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [crossfader, setCrossfader] = useState(0.5);
  const [volumeA, setVolumeA] = useState(0.8);
  const [volumeB, setVolumeB] = useState(0.8);
  const [profile, setProfile] = useState<ApiProfile | null>(null);
  const [channel, setChannel] = useState<ApiChannel | null>(null);
  const [playlists, setPlaylists] = useState<ApiPlaylist[]>([]);
  const [likedTracks, setLikedTracks] = useState<ApiTrack[]>([]);
  const [searchResults, setSearchResults] = useState<ApiTrack[]>([]);
  const [searchQuery, setSearchQuery] = useState("bad bunny");
  const [apiMessage, setApiMessage] = useState<string | null>(null);
  const [localTracks, setLocalTracks] = useState<DeckTrack[]>(DEMO_TRACKS);
  type LoadingKey = "profile" | "channel" | "playlists" | "liked" | "search";
  const [loading, setLoading] = useState<Record<LoadingKey, boolean>>({
    profile: false,
    channel: false,
    playlists: false,
    liked: false,
    search: false,
  });
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

  // Responsive sizes (platos y consola más compactos)
  const waveformWidth = isWide
    ? Math.min(width * 0.35, 360)
    : Math.max(width - 48, 180);
  const deckSize = isWide
    ? Math.min(width * 0.18, 160)
    : Math.min(width * 0.4, 150);
  const sliderHeight = isWide
    ? Math.min(height * 0.38, 130)
    : Math.min(height * 0.25, 120);

  // Scale helper: reduce sizes on narrow screens (phones)
  const scale = (value: number) => {
    const base = 390; // reference width (iPhone 12/13)
    const factor = Math.min(1, width / base);
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
        // Al salir del modo DJ, volver a portrait para los pads
        ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT
        ).catch(() => undefined);
      };
    }, [])
  );

  const setLoadingFor = (key: LoadingKey, value: boolean) => {
    setLoading((prev) => ({ ...prev, [key]: value }));
  };

  const handleApiError = (err: unknown) => {
    if (err instanceof Error) {
      setApiMessage(err.message);
      return;
    }
    setApiMessage("Error inesperado al llamar la API");
  };

  const runWithLoading = async <T,>(
    key: LoadingKey,
    task: () => Promise<T>
  ): Promise<T | undefined> => {
    setLoadingFor(key, true);
    setApiMessage(null);
    try {
      return await task();
    } catch (err) {
      handleApiError(err);
      return undefined;
    } finally {
      setLoadingFor(key, false);
    }
  };

  const refreshProfile = async () => {
    const data = await runWithLoading<ApiProfile>("profile", fetchProfile);
    if (data) {
      setProfile(data);
    }
  };

  const refreshChannel = async () => {
    const data = await runWithLoading<ApiChannel | null>(
      "channel",
      fetchChannel
    );
    setChannel(data ?? null);
  };

  const refreshPlaylists = async () => {
    const data = await runWithLoading<ApiPlaylist[]>(
      "playlists",
      fetchPlaylists
    );
    if (data) {
      setPlaylists(data);
    }
  };

  const refreshLiked = async () => {
    const data = await runWithLoading<ApiTrack[]>("liked", fetchLiked);
    if (data) {
      setLikedTracks(data);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setApiMessage("Escribe algo para buscar.");
      return;
    }
    const tracks = await runWithLoading<ApiTrack[]>("search", () =>
      searchMusic(searchQuery)
    );
    if (tracks) {
      setSearchResults(tracks);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshProfile();
    }
  }, [isAuthenticated]);

  const isPlayingA = Boolean(deckA.status?.isLoaded && deckA.status.isPlaying);
  const isPlayingB = Boolean(deckB.status?.isLoaded && deckB.status.isPlaying);

  const loadApiTrack = async (
    deck: typeof deckA,
    track: ApiTrack,
    deckLabel: string
  ) => {
    if (!track.streamUrl) {
      setApiMessage(
        "La pista no tiene streamUrl/audioUrl. Revisa que el backend devuelva una URL reproducible."
      );
      return;
    }

    setApiMessage(null);
    const playable: DeckTrack = {
      id: `${track.id}-${deckLabel}`,
      title: track.title || "Pista",
      artist: track.artist || "YouTube",
      origin: "stream",
      source: { uri: track.streamUrl },
      artwork: track.thumbnail ? { uri: track.thumbnail } : undefined,
    };
    try {
      await deck.loadTrack(playable);
    } catch (err) {
      handleApiError(err);
    }
  };

  const loadDemoTrack = async (deck: typeof deckA, track: DeckTrack) => {
    await deck.loadTrack(track);
  };

  const renderTrackCard = (track: ApiTrack, index?: number) => (
    <RNView key={`${track.id}-${index ?? track.id}`} style={styles.trackCard}>
      {track.thumbnail ? (
        <Image
          source={{ uri: track.thumbnail }}
          style={styles.trackThumb}
          resizeMode="cover"
        />
      ) : (
        <RNView style={[styles.trackThumb, styles.trackThumbPlaceholder]}>
          <Text style={styles.trackThumbInitials}>♪</Text>
        </RNView>
      )}
      <RNView style={{ flex: 1, gap: 2 }}>
        <Text style={styles.trackTitle} numberOfLines={2}>
          {track.title}
        </Text>
        {track.artist ? (
          <Text style={styles.trackMeta} numberOfLines={1}>
            {track.artist}
          </Text>
        ) : null}
        {track.streamUrl ? (
          <Text style={styles.trackMetaSmall} numberOfLines={1}>
            {track.streamUrl}
          </Text>
        ) : (
          <Text style={styles.trackMetaSmall} numberOfLines={1}>
            Sin URL reproducible
          </Text>
        )}
      </RNView>
      <RNView style={styles.trackActions}>
        <TouchableOpacity
          style={[styles.loadButton, { backgroundColor: "#ff1f3d" }]}
          onPress={() => loadApiTrack(deckA, track, "A")}
        >
          <Text style={styles.loadButtonText}>Deck 1</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.loadButton, { backgroundColor: "#6e0f1f" }]}
          onPress={() => loadApiTrack(deckB, track, "B")}
        >
          <Text style={styles.loadButtonText}>Deck 2</Text>
        </TouchableOpacity>
      </RNView>
    </RNView>
  );

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right", "bottom"]}
    >
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 16, flexGrow: 1 },
        ]}
      >
        {/* 1. Header con números de deck */}
        <RNView style={styles.header}>
          <RNView
            style={[
              styles.deckNumber,
              {
                backgroundColor: "#ff1f3d",
                width: scale(30),
                height: scale(30),
                borderRadius: scale(15),
              },
            ]}
          >
            <Text style={[styles.deckNumberText, { fontSize: scale(16) }]}>
              1
            </Text>
          </RNView>
          <Text style={[styles.mainTitle, { fontSize: scale(18) }]}>
            Chxchx DJ
          </Text>
          <RNView
            style={[
              styles.deckNumber,
              {
                backgroundColor: "#6e0f1f",
                width: scale(30),
                height: scale(30),
                borderRadius: scale(15),
              },
            ]}
          >
            <Text style={[styles.deckNumberText, { fontSize: scale(16) }]}>
              2
            </Text>
          </RNView>
        </RNView>

        {/* 2. Sección de waveforms */}
        <RNView style={styles.waveformsContainer}>
          <Waveform
            width={waveformWidth}
            height={Math.min(50, Math.max(36, Math.floor(height * 0.09)))}
            color="#ff1f3d"
            isPlaying={isPlayingA}
            position={deckA.status?.positionMillis || 0}
            duration={deckA.status?.durationMillis || 1}
            trackTitle={deckA.track?.title}
            artist={deckA.track?.artist}
          />
          <Waveform
            width={waveformWidth}
            height={Math.min(50, Math.max(36, Math.floor(height * 0.09)))}
            color="#6e0f1f"
            isPlaying={isPlayingB}
            position={deckB.status?.positionMillis || 0}
            duration={deckB.status?.durationMillis || 1}
            trackTitle={deckB.track?.title}
            artist={deckB.track?.artist}
          />
        </RNView>

        {/* 3. Controles superiores */}
        <RNView style={styles.topControls}>
          <DJButton
            label="±6"
            onPress={() => {}}
            color="#ff1f3d"
            size="small"
          />
          <DJButton
            label="SLIP"
            onPress={() => {}}
            color="rgba(255,255,255,0.5)"
            size="small"
          />
          <DJButton
            label="SLIP"
            onPress={() => {}}
            color="rgba(255,255,255,0.5)"
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
        <RNView style={[styles.decksRow, isWide && styles.decksRowWide]}>
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
            <RNView style={[styles.deckControls, { gap: scale(12) }]}>
              <CueButton onPress={() => deckA.restart()} color="#FFA500" />
              <PlayButton
                onPress={() => deckA.togglePlay()}
                isPlaying={isPlayingA}
                color="#4CAF50"
              />
            </RNView>
          </RNView>

          {/* Controles centrales */}
          <RNView style={styles.centerControls}>
            <SyncButton onPress={() => {}} />
            <RNView
              style={[
                styles.autoMixButton,
                {
                  width: scale(56),
                  height: scale(56),
                  borderRadius: scale(28),
                },
              ]}
            >
              <Text style={[styles.autoMixIcon, { fontSize: scale(18) }]}>
                ⊕
              </Text>
              <Text
                style={[
                  styles.autoMixLabel,
                  { fontSize: Math.max(7, Math.round(scale(7))) },
                ]}
              >
                AUTOMIX
              </Text>
            </RNView>
            <SyncButton onPress={() => {}} />
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
            <RNView style={[styles.deckControls, { gap: scale(12) }]}>
              <CueButton onPress={() => deckB.restart()} color="#FFA500" />
              <PlayButton
                onPress={() => deckB.togglePlay()}
                isPlaying={isPlayingB}
                color="#4CAF50"
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
        <RNView style={styles.crossfaderSection}>
          <Crossfader
            value={crossfader}
            onChange={setCrossfader}
            leftLabel="Deck A"
            rightLabel="Deck B"
            leftColor="#ff1f3d"
            rightColor="#6e0f1f"
          />
        </RNView>

        {/* 6. Botones de demo y archivos locales */}
        <RNView style={styles.demoSection}>
          <Text style={styles.demoTitle}>Pistas Demos y Archivos del Dispositivo</Text>
          <TouchableOpacity
            style={[styles.primaryButton, { marginBottom: 12, backgroundColor: "#34d399" }]}
            onPress={handlePickLocalAudio}
          >
            <Text style={[styles.primaryButtonText, { color: "#000", fontWeight: "700" }]}>
              📂 Cargar audio del dispositivo
            </Text>
          </TouchableOpacity>

          <RNView style={{ gap: 8, width: "100%" }}>
            {localTracks.map((t) => (
              <RNView key={t.id} style={styles.trackCard}>
                <RNView style={[styles.trackThumb, styles.trackThumbPlaceholder]}>
                  <Text style={styles.trackThumbInitials}>🎵</Text>
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
        </RNView>

        {/* 7. Sección de Música, Búsqueda y Perfil (Ubicada abajo) */}
        <RNView style={[styles.apiCard, { marginTop: 24 }]}>
          <RNView style={styles.userHeader}>
            {user?.picture ? (
              <Image source={{ uri: user.picture }} style={styles.userAvatar} />
            ) : (
              <RNView style={styles.userAvatarPlaceholder}>
                <Text style={styles.userAvatarInitial}>
                  {user?.name?.[0] || user?.email?.[0] || "🎧"}
                </Text>
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

          <Text style={styles.apiCardTitle}>Música y búsqueda</Text>
          <Text style={styles.apiCardSubtitle} numberOfLines={2}>
            API: {API_BASE}
          </Text>
          {apiMessage ? (
            <Text style={styles.apiError}>{apiMessage}</Text>
          ) : null}

          <RNView style={styles.apiActionsRow}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={refreshProfile}
              disabled={loading.profile}
            >
              {loading.profile ? (
                <ActivityIndicator color="#0a0a0a" />
              ) : (
                <Text style={styles.secondaryButtonText}>
                  Actualizar perfil
                </Text>
              )}
            </TouchableOpacity>
          </RNView>

          <RNView style={styles.apiActionsRow}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={refreshChannel}
              disabled={loading.channel}
            >
              {loading.channel ? (
                <ActivityIndicator color="#0a0a0a" />
              ) : (
                <Text style={styles.secondaryButtonText}>Mi canal</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={refreshPlaylists}
              disabled={loading.playlists}
            >
              {loading.playlists ? (
                <ActivityIndicator color="#0a0a0a" />
              ) : (
                <Text style={styles.secondaryButtonText}>Playlists</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={refreshLiked}
              disabled={loading.liked}
            >
              {loading.liked ? (
                <ActivityIndicator color="#0a0a0a" />
              ) : (
                <Text style={styles.secondaryButtonText}>Me gusta</Text>
              )}
            </TouchableOpacity>
          </RNView>

          <RNView style={styles.infoGrid}>
            <RNView style={styles.infoItem}>
              <Text style={styles.infoLabel}>Canal</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {channel?.title ?? "—"}
              </Text>
            </RNView>
            <RNView style={styles.infoItem}>
              <Text style={styles.infoLabel}>Playlists</Text>
              <Text style={styles.infoValue}>{playlists.length || "—"}</Text>
            </RNView>
            <RNView style={styles.infoItem}>
              <Text style={styles.infoLabel}>Likes</Text>
              <Text style={styles.infoValue}>
                {likedTracks.length ? likedTracks.length : "—"}
              </Text>
            </RNView>
          </RNView>
          {channel?.description ? (
            <Text style={styles.mutedText} numberOfLines={2}>
              {channel.description}
            </Text>
          ) : null}

          {playlists.length ? (
            <RNView style={styles.playlistList}>
              {playlists.slice(0, 4).map((pl, idx) => (
                <RNView
                  key={pl.id ?? pl.title ?? `pl-${idx}`}
                  style={styles.playlistPill}
                >
                  <Text style={styles.playlistTitle} numberOfLines={1}>
                    {pl.title ?? "Playlist"}
                  </Text>
                  {pl.itemCount ? (
                    <Text style={styles.playlistCount}>
                      {pl.itemCount} tracks
                    </Text>
                  ) : null}
                </RNView>
              ))}
            </RNView>
          ) : null}

          <RNView style={styles.divider} />

          <Text style={styles.apiCardTitle}>Buscar canciones</Text>
          <RNView style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Bad Bunny, Bizarrap..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleSearch}
              disabled={loading.search}
            >
              {loading.search ? (
                <ActivityIndicator color="#0a0a0a" />
              ) : (
                <Text style={styles.primaryButtonText}>Buscar</Text>
              )}
            </TouchableOpacity>
          </RNView>
        </RNView>

        {searchResults.length ? (
          <RNView style={styles.listSection}>
            <Text style={styles.listTitle}>Resultados</Text>
            <RNView style={{ gap: 10 }}>
              {searchResults.map((track, idx) => renderTrackCard(track, idx))}
            </RNView>
          </RNView>
        ) : null}

        {likedTracks.length ? (
          <RNView style={styles.listSection}>
            <Text style={styles.listTitle}>Tus me gusta</Text>
            <RNView style={{ gap: 10 }}>
              {likedTracks.map((track, idx) => renderTrackCard(track, idx))}
            </RNView>
          </RNView>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07080a",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  apiCard: {
    width: "100%",
    maxWidth: 980,
    backgroundColor: "#120d0d",
    borderColor: "#33181c",
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    gap: 10,
    shadowColor: "#ff2a3b",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  apiCardTitle: {
    color: "#e3e5ec",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 1,
  },
  apiCardSubtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
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
  apiActionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
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
  secondaryButton: {
    backgroundColor: "#1a1112",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#4a2126",
  },
  secondaryButtonText: {
    color: "#e3e5ec",
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  profileRow: {
    backgroundColor: "#170f0f",
    padding: 10,
    borderRadius: 10,
    gap: 4,
  },
  profileName: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
  profileEmail: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },
  mutedText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
  },
  infoGrid: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  infoItem: {
    backgroundColor: "#170f0f",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 110,
    borderWidth: 1,
    borderColor: "#33181c",
  },
  infoLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    marginBottom: 2,
  },
  infoValue: {
    color: "#fff",
    fontWeight: "700",
  },
  playlistList: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  playlistPill: {
    backgroundColor: "#170f0f",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 140,
    borderWidth: 1,
    borderColor: "#33181c",
  },
  playlistTitle: {
    color: "#fff",
    fontWeight: "700",
  },
  playlistCount: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#33181c",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  listSection: {
    width: "100%",
    maxWidth: 980,
    gap: 10,
    marginBottom: 14,
  },
  listTitle: {
    color: "#e3e5ec",
    fontWeight: "900",
    fontSize: 15,
    letterSpacing: 0.8,
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
  trackThumbInitials: {
    color: "#ff2a3b",
    fontWeight: "900",
    fontSize: 18,
  },
  trackTitle: {
    color: "#fff",
    fontWeight: "800",
  },
  trackMeta: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
  },
  trackMetaSmall: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
  },
  trackActions: {
    gap: 8,
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
    marginBottom: 12,
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
    fontSize: 22,
    fontWeight: "900",
    color: "#e3e5ec",
    letterSpacing: 3,
    textTransform: "uppercase",
    textShadowColor: "rgba(255, 42, 59, 0.6)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  waveformsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  topControls: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  decksRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginBottom: 16,
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
    gap: 12,
  },
  deckControls: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  centerControls: {
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 12,
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
  autoMixIcon: {
    fontSize: 22,
    color: "#ff2a3b",
    fontWeight: "900",
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
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  demoSection: {
    width: "100%",
    maxWidth: 500,
    alignItems: "center",
    gap: 8,
    backgroundColor: "#120d0d",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#33181c",
  },
  demoTitle: {
    color: "#e3e5ec",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 6,
    letterSpacing: 0.8,
  },
  demoButtons: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
    justifyContent: "center",
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
