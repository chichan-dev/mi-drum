import { LinearGradient } from "expo-linear-gradient";
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
  leftLabel?: string;
  rightLabel?: string;
  leftColor?: string;
  rightColor?: string;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export default function Crossfader({
  value,
  onChange,
  leftLabel = "A",
  rightLabel = "B",
  leftColor = "#3ba3ff",
  rightColor = "#ff8a3c",
}: Props) {
  const widthRef = useRef(0);
  const clampedValue = clamp01(value);

  const setFromX = (x: number) => {
    if (widthRef.current <= 0) return;
    const normalized = clamp01(x / widthRef.current);
    onChange(normalized);
  };

  const onLayout = (e: LayoutChangeEvent) => {
    widthRef.current = e.nativeEvent.layout.width;
  };

  const panResponder: PanResponderInstance = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onPanResponderGrant: (evt) => setFromX(evt.nativeEvent.locationX),
        onPanResponderMove: (evt) => setFromX(evt.nativeEvent.locationX),
      }),
    [onChange]
  );

  return (
    <View style={styles.wrapper}>
      <View style={styles.labelsRow}>
        <Text style={[styles.sideLabel, { color: leftColor }]}>
          {leftLabel}
        </Text>
        <Text style={[styles.sideLabel, { color: rightColor }]}>
          {rightLabel}
        </Text>
      </View>
      <View
        style={styles.track}
        onLayout={onLayout}
        {...panResponder.panHandlers}
      >
        <LinearGradient
          colors={[leftColor, rightColor]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        />
        <View style={[styles.thumb, { left: `${clampedValue * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
  },
  labelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  sideLabel: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  track: {
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.4)",
    overflow: "hidden",
    position: "relative",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.8,
  },
  thumb: {
    position: "absolute",
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#fff",
    marginLeft: -26,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: "#1a1a1a",
  },
});
