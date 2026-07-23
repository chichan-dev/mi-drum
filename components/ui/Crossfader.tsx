import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
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
  leftColor = "#6e0f1f",
  rightColor = "#ff1f3d",
}: Props) {
  const trackRef = useRef<View>(null);
  const pageXRef = useRef(0);
  const isDragging = useRef(false);
  const clampedValue = clamp01(value);
  const [trackWidth, setTrackWidth] = useState(0);

  // Igual que en VerticalSlider: el progreso visual se mueve directo (sin
  // pasar por React) mientras se arrastra, y solo se re-sincroniza con
  // `value` cuando el cambio no viene de un drag en curso.
  const progress = useRef(new Animated.Value(clampedValue)).current;
  const thumbScale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;

  // `onChange` se despacha como mucho una vez por frame (no por cada evento
  // táctil crudo) para no saturar el hilo de JS y que el arrastre no se
  // sienta robotizado.
  const pendingValue = useRef<number | null>(null);
  const rafId = useRef<number | null>(null);

  const flushPending = () => {
    rafId.current = null;
    if (pendingValue.current !== null) {
      onChange(pendingValue.current);
      pendingValue.current = null;
    }
  };

  const scheduleOnChange = (next: number) => {
    pendingValue.current = next;
    if (rafId.current == null) {
      rafId.current = requestAnimationFrame(flushPending);
    }
  };

  useEffect(
    () => () => {
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
    },
    []
  );

  useEffect(() => {
    if (isDragging.current) return;
    Animated.timing(progress, {
      toValue: clampedValue,
      duration: 140,
      useNativeDriver: true,
    }).start();
  }, [clampedValue, progress]);

  const updatePageX = () => {
    trackRef.current?.measureInWindow((x) => {
      pageXRef.current = x;
    });
  };

  const setFromPageX = (pageX: number, width: number) => {
    if (width <= 0) return;
    const relativeX = pageX - pageXRef.current;
    const normalized = clamp01(relativeX / width);
    progress.setValue(normalized);
    scheduleOnChange(normalized);
  };

  const onLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
    updatePageX();
  };

  const panResponder: PanResponderInstance = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderGrant: (evt) => {
          isDragging.current = true;
          updatePageX();
          Animated.parallel([
            Animated.spring(thumbScale, {
              toValue: 1.1,
              useNativeDriver: true,
              speed: 30,
              bounciness: 10,
            }),
            Animated.timing(glow, {
              toValue: 1,
              duration: 120,
              useNativeDriver: true,
            }),
          ]).start();
          setFromPageX(evt.nativeEvent.pageX, trackWidth);
        },
        onPanResponderMove: (evt) => {
          setFromPageX(evt.nativeEvent.pageX, trackWidth);
        },
        onPanResponderRelease: () => {
          isDragging.current = false;
          Animated.parallel([
            Animated.spring(thumbScale, {
              toValue: 1,
              useNativeDriver: true,
              speed: 30,
              bounciness: 10,
            }),
            Animated.timing(glow, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        },
        onPanResponderTerminate: () => {
          isDragging.current = false;
          Animated.parallel([
            Animated.spring(thumbScale, {
              toValue: 1,
              useNativeDriver: true,
              speed: 30,
              bounciness: 10,
            }),
            Animated.timing(glow, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onChange, trackWidth]
  );

  const thumbTranslateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, trackWidth],
  });
  const glowShadowOpacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });
  const glowShadowRadius = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 18],
  });

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
        ref={trackRef}
        style={styles.track}
        onLayout={onLayout}
        {...panResponder.panHandlers}
      >
        <LinearGradient
          pointerEvents="none"
          colors={[leftColor, rightColor]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        />
        <View pointerEvents="none" style={styles.centerNotch} />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.thumb,
            {
              shadowOpacity: glowShadowOpacity,
              shadowRadius: glowShadowRadius,
              transform: [
                { translateX: thumbTranslateX },
                { scale: thumbScale },
              ],
            },
          ]}
        >
          <View style={styles.grip}>
            <View style={styles.gripLine} />
            <View style={styles.gripLine} />
            <View style={styles.gripLine} />
          </View>
        </Animated.View>
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
    paddingHorizontal: 6,
    marginBottom: 8,
  },
  sideLabel: {
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  track: {
    height: 46,
    borderRadius: 23,
    backgroundColor: "#0f0a0a",
    overflow: "visible",
    position: "relative",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#3d1e22",
    shadowColor: "#000",
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 6,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.85,
    borderRadius: 21,
  },
  centerNotch: {
    position: "absolute",
    left: "50%",
    top: 6,
    bottom: 6,
    width: 2,
    marginLeft: -1,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  thumb: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e3e5ec",
    marginLeft: -24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ff2a3b",
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
    borderWidth: 4,
    borderColor: "#190f10",
  },
  grip: {
    gap: 3,
  },
  gripLine: {
    width: 20,
    height: 2,
    borderRadius: 1,
    backgroundColor: "rgba(7,8,10,0.35)",
  },
});
