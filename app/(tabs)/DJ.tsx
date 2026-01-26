import * as ScreenOrientation from "expo-screen-orientation";
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
  type LoadingKey = "profile" | "channel" | "playlists" | "liked" | "search";
  const [loading, setLoading] = useState<Record<LoadingKey, boolean>>({
    profile: false,
    channel: false,
    playlists: false,
    liked: false,
    search: false,
  });
  const isWide = width > height;

  // Si no está autenticado, mostrar pantalla de login
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

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Responsive sizes
  const waveformWidth = isWide
    ? Math.min(width * 0.42, 520)
    : Math.max(width - 48, 200);
  const deckSize = isWide
    ? Math.min(width * 0.28, 320)
    : Math.min(width * 0.6, 260);
  const sliderHeight = isWide
    ? Math.min(height * 0.6, 260)
    : Math.min(height * 0.36, 200);

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

  useEffect(() => {
    // Only force landscape on larger devices (tablets). Small phones keep native orientation.
    const lockLandscape = width >= 700;
    if (lockLandscape) {
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE
      ).catch(() => undefined);
      return () => {
        ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT
        ).catch(() => undefined);
      };
    }
    return () => undefined;
  }, [width]);

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
          style={[styles.loadButton, { backgroundColor: "#ff8a3c" }]}
          onPress={() => loadApiTrack(deckA, track, "A")}
        >
          <Text style={styles.loadButtonText}>Deck 1</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.loadButton, { backgroundColor: "#3ba3ff" }]}
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
        {/* API y búsqueda */}
        <RNView style={styles.apiCard}>
          <RNView style={styles.userHeader}>
            {user?.picture ? (
              <Image source={{ uri: user.picture }} style={styles.userAvatar} />
            ) : (
              <RNView style={styles.userAvatarPlaceholder}>
                <Text style={styles.userAvatarInitial}>
                  {user?.name?.[0] || user?.email?.[0] || "U"}
                </Text>
              </RNView>
            )}
            <RNView style={{ flex: 1 }}>
              <Text style={styles.userName}>{user?.name || "Usuario"}</Text>
              {user?.email ? (
                <Text style={styles.userEmail}>{user.email}</Text>
              ) : null}
            </RNView>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutButtonText}>Salir</Text>
            </TouchableOpacity>
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

        {/* Header con números de deck */}
        <RNView style={styles.header}>
          <RNView
            style={[
              styles.deckNumber,
              {
                backgroundColor: "#ff8a3c",
                width: scale(36),
                height: scale(36),
                borderRadius: scale(18),
              },
            ]}
          >
            <Text style={[styles.deckNumberText, { fontSize: scale(20) }]}>
              1
            </Text>
          </RNView>
          <Text style={[styles.mainTitle, { fontSize: scale(20) }]}>
            Chichan DJ
          </Text>
          <RNView
            style={[
              styles.deckNumber,
              {
                backgroundColor: "#3ba3ff",
                width: scale(36),
                height: scale(36),
                borderRadius: scale(18),
              },
            ]}
          >
            <Text style={[styles.deckNumberText, { fontSize: scale(20) }]}>
              2
            </Text>
          </RNView>
        </RNView>

        {/* Sección de waveforms */}
        <RNView style={styles.waveformsContainer}>
          <Waveform
            width={waveformWidth}
            height={Math.min(80, Math.max(56, Math.floor(height * 0.12)))}
            color="#ff8a3c"
            isPlaying={isPlayingA}
            position={deckA.status?.positionMillis || 0}
            duration={deckA.status?.durationMillis || 1}
            trackTitle={deckA.track?.title}
            artist={deckA.track?.artist}
          />
          <Waveform
            width={waveformWidth}
            height={Math.min(80, Math.max(56, Math.floor(height * 0.12)))}
            color="#3ba3ff"
            isPlaying={isPlayingB}
            position={deckB.status?.positionMillis || 0}
            duration={deckB.status?.durationMillis || 1}
            trackTitle={deckB.track?.title}
            artist={deckB.track?.artist}
          />
        </RNView>

        {/* Controles superiores */}
        <RNView style={styles.topControls}>
          <DJButton
            label="±6"
            onPress={() => {}}
            color="#ff8a3c"
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
            color="#3ba3ff"
            size="small"
          />
        </RNView>

        {/* Decks principales con controles */}
        <RNView style={[styles.decksRow, isWide && styles.decksRowWide]}>
          {/* Control de volumen izquierdo */}
          <RNView style={styles.volumeControl}>
            <VerticalSlider
              value={volumeA}
              onChange={setVolumeA}
              height={sliderHeight}
              color="#ff8a3c"
            />
          </RNView>

          {/* Deck A */}
          <RNView style={styles.deckContainer}>
            <VinylDeck
              size={deckSize}
              accentColor="#ff8a3c"
              artwork={deckA.track?.artwork}
              player={deckA}
              isPlaying={isPlayingA}
              bpm={124}
              pitchPercent={-4.2}
              trackTitle={deckA.track?.title}
              artist={deckA.track?.artist}
            />
            <RNView style={[styles.deckControls, { gap: scale(16) }]}>
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
                  width: scale(72),
                  height: scale(72),
                  borderRadius: scale(36),
                },
              ]}
            >
              <Text style={[styles.autoMixIcon, { fontSize: scale(24) }]}>
                ⊕
              </Text>
              <Text
                style={[
                  styles.autoMixLabel,
                  { fontSize: Math.max(8, Math.round(scale(8))) },
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
              accentColor="#3ba3ff"
              artwork={deckB.track?.artwork}
              player={deckB}
              isPlaying={isPlayingB}
              bpm={124}
              pitchPercent={0}
              trackTitle={deckB.track?.title}
              artist={deckB.track?.artist}
            />
            <RNView style={[styles.deckControls, { gap: scale(16) }]}>
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
              color="#3ba3ff"
            />
          </RNView>
        </RNView>

        {/* Crossfader */}
        <RNView style={styles.crossfaderSection}>
          <Crossfader
            value={crossfader}
            onChange={setCrossfader}
            leftLabel="Deck A"
            rightLabel="Deck B"
            leftColor="#3ba3ff"
            rightColor="#ff8a3c"
          />
        </RNView>

        {/* Botones de demo */}
        <RNView style={styles.demoSection}>
          <Text style={styles.demoTitle}>Cargar pistas de demo</Text>
          <RNView style={styles.demoButtons}>
            <DJButton
              label="Demo A → Deck 1"
              onPress={() => loadDemoTrack(deckA, DEMO_TRACKS[0])}
              color="#ff8a3c"
              size="small"
            />
            <DJButton
              label="Demo B → Deck 2"
              onPress={() => loadDemoTrack(deckB, DEMO_TRACKS[1])}
              color="#3ba3ff"
              size="small"
            />
          </RNView>
        </RNView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  apiCard: {
    width: "100%",
    maxWidth: 980,
    backgroundColor: "#121212",
    borderColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    gap: 10,
  },
  apiCardTitle: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.3,
  },
  apiCardSubtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },
  apiError: {
    backgroundColor: "rgba(255,87,51,0.15)",
    borderColor: "rgba(255,87,51,0.6)",
    borderWidth: 1,
    color: "#ffb29e",
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
    backgroundColor: "#34d399",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: "#0a0a0a",
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  secondaryButton: {
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  secondaryButtonText: {
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  profileRow: {
    backgroundColor: "rgba(255,255,255,0.04)",
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
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 110,
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
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 140,
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
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#fff",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  listSection: {
    width: "100%",
    maxWidth: 980,
    gap: 10,
    marginBottom: 14,
  },
  listTitle: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
  trackCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
  },
  trackThumb: {
    width: 62,
    height: 62,
    borderRadius: 10,
    backgroundColor: "#1f1f1f",
  },
  trackThumbPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  trackThumbInitials: {
    color: "#fff",
    fontWeight: "800",
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
    color: "#0a0a0a",
    fontWeight: "800",
    letterSpacing: 0.3,
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
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  deckNumberText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#fff",
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 2,
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
    backgroundColor: "rgba(0,0,0,0.5)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  autoMixIcon: {
    fontSize: 24,
    color: "rgba(255,255,255,0.7)",
  },
  autoMixLabel: {
    fontSize: 8,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
    marginTop: 2,
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
  },
  demoTitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
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
  },
  loadingText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
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
    backgroundColor: "#34d399",
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarInitial: {
    color: "#0a0a0a",
    fontSize: 20,
    fontWeight: "900",
  },
  userName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  userEmail: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: "rgba(255,87,51,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,87,51,0.6)",
  },
  logoutButtonText: {
    color: "#ffb29e",
    fontWeight: "700",
    fontSize: 13,
  },
});
