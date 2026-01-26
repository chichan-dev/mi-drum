import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { Text } from "@/components/Themed";
import type { DeckPlayerHandle, DeckTrack } from "@/hooks/useDeckPlayer";
import SpinningDisc from "./SpinningDisc";

type Props = {
  label: string;
  side: "A" | "B";
  accentColor: string;
  player: DeckPlayerHandle;
  demoTracks: DeckTrack[];
};

const formatTime = (ms?: number | null) => {
  if (ms === undefined || ms === null) return "--:--";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = `${totalSeconds % 60}`.padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const DeckButton = ({
  label,
  onPress,
  disabled,
  color,
  loading,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  color?: string;
  loading?: boolean;
}) => (
  <Pressable
    onPress={disabled ? undefined : onPress}
    style={[
      styles.button,
      { backgroundColor: color ?? "rgba(255,255,255,0.08)" },
      disabled ? styles.buttonDisabled : null,
    ]}
    accessibilityLabel={label}
  >
    {loading ? (
      <ActivityIndicator color="#fff" size="small" />
    ) : (
      <Text style={styles.buttonLabel}>{label}</Text>
    )}
  </Pressable>
);

export default function DJDeck({
  label,
  side,
  accentColor,
  player,
  demoTracks,
}: Props) {
  const [url, setUrl] = useState("");
  const isPlaying = useMemo(
    () => Boolean(player.status?.isLoaded && player.status.isPlaying),
    [player.status]
  );
  const progress = useMemo(() => {
    if (!player.status?.isLoaded || !player.status.durationMillis) return 0;
    return player.status.positionMillis / player.status.durationMillis;
  }, [player.status]);

  const handleUrlLoad = async () => {
    if (!url.trim()) return;
    await player.loadTrack({
      id: `url-${Date.now()}`,
      title: "Stream desde enlace",
      artist: "URL directa",
      origin: "url",
      source: { uri: url.trim() },
      artwork: undefined,
    });
    setUrl("");
  };

  const cueToStart = async () => {
    await player.restart();
  };

  return (
    <View style={[styles.card, { borderColor: accentColor }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.deckLabel}>{label}</Text>
          <Text style={styles.sideLabel}>Deck {side}</Text>
        </View>
        <View style={styles.badges}>
          <View style={[styles.pill, { backgroundColor: accentColor }]}>
            <Text style={styles.pillText}>LIVE</Text>
          </View>
          <View style={[styles.dotOnline, { backgroundColor: accentColor }]} />
        </View>
      </View>

      <View style={styles.deckBody}>
        <SpinningDisc
          size={180}
          accentColor={accentColor}
          artwork={player.track?.artwork}
          isPlaying={isPlaying}
        />

        <View style={styles.meta}>
          <Text numberOfLines={1} style={styles.trackTitle}>
            {player.track?.title ?? "Sin pista cargada"}
          </Text>
          <Text numberOfLines={1} style={styles.trackArtist}>
            {player.track?.artist ?? "Elige una demo o pega un enlace"}
          </Text>
          <Text style={styles.trackOrigin}>
            {player.track?.origin
              ? `Origen: ${player.track.origin}`
              : "Soporta archivos locales y URLs directas"}
          </Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(100, Math.max(0, progress * 100))}%`,
                    backgroundColor: accentColor,
                  },
                ]}
              />
            </View>
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>
                {player.status?.isLoaded ? formatTime(player.status.positionMillis) : "--:--"}
              </Text>
              <Text style={styles.timeText}>
                {player.status?.isLoaded ? formatTime(player.status.durationMillis) : "--:--"}
              </Text>
            </View>
          </View>

          <View style={styles.controlsRow}>
            <DeckButton
              label={player.status?.isPlaying ? "Pausa" : "Play"}
              onPress={player.togglePlay}
              disabled={!player.track || player.loading}
              color={accentColor}
              loading={player.loading}
            />
            <DeckButton
              label="Cue"
              onPress={cueToStart}
              disabled={!player.track || player.loading}
            />
            <DeckButton
              label="Stop"
              onPress={player.stop}
              disabled={!player.track || player.loading}
            />
          </View>
        </View>
      </View>

      <View style={styles.demoRow}>
        {demoTracks.map((demo) => (
          <Pressable
            key={`${side}-${demo.id}`}
            onPress={() => player.loadTrack(demo)}
            style={[styles.demoChip, { borderColor: accentColor }]}
          >
            <Text numberOfLines={1} style={[styles.demoText, { color: accentColor }]}>
              {demo.title}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.urlRow}>
        <TextInput
          value={url}
          onChangeText={setUrl}
          placeholder="Pega URL (YouTube Music necesita backend)"
          placeholderTextColor="rgba(255,255,255,0.65)"
          style={[styles.input, { borderColor: accentColor }]}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <DeckButton
          label="Cargar URL"
          onPress={handleUrlLoad}
          disabled={!url.trim() || player.loading}
          color={accentColor}
        />
      </View>

      {player.error ? <Text style={styles.errorText}>{player.error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#0c132b",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  deckLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  sideLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
  badges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  pillText: {
    color: "#0f172a",
    fontWeight: "800",
    fontSize: 11,
  },
  dotOnline: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#3ba3ff",
  },
  deckBody: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  meta: {
    flex: 1,
    gap: 8,
  },
  trackTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  trackArtist: {
    color: "rgba(255,255,255,0.85)",
  },
  trackOrigin: {
    marginTop: 2,
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },
  progressContainer: {
    marginTop: 4,
  },
  progressBar: {
    height: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  timeText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonLabel: {
    color: "#fff",
    fontWeight: "800",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  demoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  demoChip: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  demoText: {
    fontWeight: "700",
  },
  urlRow: {
    marginTop: 12,
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: "#fff",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  errorText: {
    marginTop: 8,
    color: "#fca5a5",
  },
});
