import React, { useEffect, useMemo, useRef } from "react";
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
  const trackRef = useRef<View>(null);
  const pageYRef = useRef(0);
  const isDragging = useRef(false);
  const clampedValue = clamp01(value);

  // El progreso visual vive en un Animated.Value propio: el arrastre lo mueve
  // directamente (setValue, sin re-render) y solo lo re-sincroniza con
  // `value` cuando el cambio viene de afuera (no de un drag en curso).
  const progress = useRef(new Animated.Value(clampedValue)).current;
  const thumbScale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;

  // `onChange` (y todo lo que dispara aguas arriba: setState + audio) se
  // despacha como mucho una vez por frame, no una vez por evento táctil
  // crudo (que puede llegar a >120Hz en algunos Android) — así el hilo de
  // JS no se satura y el arrastre no se siente "robotizado".
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

  const updatePageY = () => {
    trackRef.current?.measureInWindow((_x, y) => {
      pageYRef.current = y;
    });
  };

  const setFromPageY = (pageY: number) => {
    if (height <= 0) return;
    const relativeY = pageY - pageYRef.current;
    const normalized = clamp01(1 - relativeY / height);
    progress.setValue(normalized);
    scheduleOnChange(normalized);
  };

  const onLayout = (_e: LayoutChangeEvent) => {
    updatePageY();
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
          updatePageY();
          Animated.parallel([
            Animated.spring(thumbScale, {
              toValue: 1.15,
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
          setFromPageY(evt.nativeEvent.pageY);
        },
        onPanResponderMove: (evt) => {
          setFromPageY(evt.nativeEvent.pageY);
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
    [onChange, height]
  );

  const fillTranslateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [height, 0],
  });
  const thumbTranslateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -height],
  });
  const glowOpacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 1],
  });

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
        ref={trackRef}
        style={[styles.track, { height }]}
        onLayout={onLayout}
        {...panResponder.panHandlers}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.fill,
            {
              height,
              backgroundColor: color,
              opacity: glowOpacity,
              transform: [{ translateY: fillTranslateY }],
            },
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.thumb,
            {
              borderColor: color,
              shadowColor: color,
              transform: [
                { translateY: thumbTranslateY },
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
    width: 8,
    height: 1.5,
    backgroundColor: "rgba(255,42,59,0.4)",
  },
  track: {
    width: 32,
    borderRadius: 16,
    backgroundColor: "#0f0a0a",
    position: "relative",
    justifyContent: "flex-end",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#3d1e22",
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
    bottom: -19,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#e3e5ec",
    borderWidth: 4,
    left: -5,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.9,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    elevation: 8,
  },
  grip: {
    gap: 3,
  },
  gripLine: {
    width: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: "rgba(7,8,10,0.35)",
  },
  label: {
    fontSize: 11,
    fontWeight: "900",
    color: "#ff3b4e",
    marginTop: 6,
    letterSpacing: 0.5,
  },
});
