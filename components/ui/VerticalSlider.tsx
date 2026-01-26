import React, { useMemo, useRef } from "react";
import {
  LayoutChangeEvent,
  PanResponder,
  PanResponderInstance,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "../Themed";

type Props = {
  value: number;
  onChange: (next: number) => void;
  height?: number;
  color?: string;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export default function VerticalSlider({
  value,
  onChange,
  height = 180,
  color = "#4CAF50",
}: Props) {
  const heightRef = useRef(0);
  const clampedValue = clamp01(value);

  const setFromY = (y: number) => {
    if (heightRef.current <= 0) return;
    const normalized = clamp01(1 - y / heightRef.current);
    onChange(normalized);
  };

  const onLayout = (e: LayoutChangeEvent) => {
    heightRef.current = e.nativeEvent.layout.height;
  };

  const panResponder: PanResponderInstance = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onPanResponderGrant: (evt) => setFromY(evt.nativeEvent.locationY),
        onPanResponderMove: (evt) => setFromY(evt.nativeEvent.locationY),
      }),
    [onChange]
  );

  return (
    <View style={styles.container}>
      {/* Marcadores de nivel */}
      <View style={styles.markers}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <View key={i} style={styles.marker} />
        ))}
      </View>

      {/* Track del slider */}
      <View
        style={[styles.track, { height }]}
        onLayout={onLayout}
        {...panResponder.panHandlers}
      >
        <View
          style={[
            styles.fill,
            {
              height: `${clampedValue * 100}%`,
              backgroundColor: color,
            },
          ]}
        />
        <View
          style={[
            styles.thumb,
            { bottom: `${clampedValue * 100}%`, borderColor: color },
          ]}
        />
      </View>

      {/* Indicador numérico */}
      <Text style={styles.label}>{Math.round(clampedValue * 100)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  markers: {
    position: "absolute",
    left: -12,
    height: "100%",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  marker: {
    width: 6,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  track: {
    width: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    position: "relative",
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  fill: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 16,
  },
  thumb: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1a1a1a",
    borderWidth: 3,
    left: -4,
    marginBottom: -20,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
    marginTop: 6,
  },
});
