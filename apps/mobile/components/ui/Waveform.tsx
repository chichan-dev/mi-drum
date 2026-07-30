import React, { useEffect, useMemo, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { Text } from "../Themed";

type Props = {
  width?: number;
  height?: number;
  color: string;
  isPlaying?: boolean;
  position?: number;
  duration?: number;
  trackTitle?: string;
  artist?: string;
};

export default function Waveform({
  width = 300,
  height = 60,
  color,
  isPlaying,
  position = 0,
  duration = 1,
  trackTitle,
  artist,
}: Props) {
  const barCount = 60;
  const progress = duration > 0 ? position / duration : 0;

  // Generar barras aleatorias simulando waveform
  const bars = useMemo(() => {
    return Array.from({ length: barCount }, (_, i) => {
      const intensity = Math.sin(i * 0.5) * 0.4 + Math.random() * 0.6;
      return Math.max(0.2, Math.min(1, intensity));
    });
  }, [barCount]);

  const animatedValues = useRef(bars.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (isPlaying) {
      animatedValues.forEach((anim, i) => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: 200 + i * 10,
              useNativeDriver: false,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 200 + i * 10,
              useNativeDriver: false,
            }),
          ])
        ).start();
      });
    } else {
      animatedValues.forEach((anim) => {
        anim.stopAnimation();
        anim.setValue(0);
      });
    }
  }, [isPlaying]);

  const chromeHeight = 24;
  const barsHeight = Math.max(10, height - chromeHeight);

  return (
    <View style={[styles.container, { width, height }]}>
      <View style={styles.infoRow}>
        <View style={styles.trackInfo}>
          <Text style={styles.title} numberOfLines={1}>
            {trackTitle || "No track"}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {artist || "Unknown"}
          </Text>
        </View>
        <Text style={styles.time}>{formatTime(position * 1000)}</Text>
      </View>

      <View style={[styles.waveformContainer, { height: barsHeight }]}>
        {/* Indicador de progreso */}
        <View
          style={[
            styles.progressLine,
            { left: `${progress * 100}%`, backgroundColor: color },
          ]}
        />

        {/* Barras del waveform */}
        <View style={styles.barsContainer}>
          {bars.map((barHeight, i) => {
            const isPast = i / barCount < progress;
            const barColor = isPast ? color : `${color}40`;

            return (
              <Animated.View
                key={i}
                style={[
                  styles.bar,
                  {
                    height: `${barHeight * 100}%`,
                    backgroundColor: barColor,
                    opacity: animatedValues[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.6, 1],
                    }),
                  },
                ]}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = `${totalSeconds % 60}`.padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#120d0d",
    borderRadius: 10,
    padding: 6,
    paddingBottom: 3,
    borderWidth: 1.5,
    borderColor: "#33181c",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  trackInfo: {
    flex: 1,
    marginRight: 6,
  },
  title: {
    color: "#e3e5ec",
    fontSize: 10,
    fontWeight: "900",
  },
  artist: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 9,
  },
  time: {
    color: "#ff2a3b",
    fontSize: 9,
    fontWeight: "900",
  },
  waveformContainer: {
    position: "relative",
    width: "100%",
    backgroundColor: "#0f0a0a",
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2c1618",
  },
  barsContainer: {
    flexDirection: "row",
    height: "100%",
    alignItems: "center",
    gap: 1,
  },
  bar: {
    flex: 1,
    borderRadius: 1,
    minHeight: 2,
  },
  progressLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 2,
    zIndex: 10,
    shadowColor: "#ff2a3b",
    shadowOpacity: 0.9,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 6,
  },
});
