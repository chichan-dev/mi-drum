import { LinearGradient } from "expo-linear-gradient";
import { Volume1, Volume2, VolumeX } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Animated, Platform, StyleSheet, View } from "react-native";
import { VolumeManager } from "react-native-volume-manager";

const AUTO_HIDE_MS = 1600;

export default function VolumeOverlay() {
  const [volume, setVolume] = useState(0);
  const [mounted, setMounted] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (Platform.OS === "web") return;

    // En Expo Go (o un dev client viejo sin este módulo nativo) cualquier
    // acceso a VolumeManager lanza sincrónicamente: si eso pasa, no hay
    // overlay propio posible y dejamos que el sistema use su HUD nativo.
    let subscription: { remove: () => void } | undefined;
    try {
      VolumeManager.showNativeVolumeUI({ enabled: false }).catch(() => undefined);
      VolumeManager.getVolume()
        .then((result) => setVolume(result.volume))
        .catch(() => undefined);
      subscription = VolumeManager.addVolumeListener((result) => {
        setVolume(result.volume);
        reveal();
      });
    } catch {
      return;
    }

    return () => {
      subscription?.remove();
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
      try {
        VolumeManager.showNativeVolumeUI({ enabled: true }).catch(() => undefined);
      } catch {
        // native module not linked, nothing to restore
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reveal = () => {
    setMounted(true);
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 120,
      useNativeDriver: true,
    }).start();
    hideTimeout.current = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(() => setMounted(false));
    }, AUTO_HIDE_MS);
  };

  if (!mounted || Platform.OS === "web") return null;

  const Icon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const fillPercent = `${Math.round(volume * 100)}%` as const;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrap, { opacity }]}
    >
      <View style={styles.card}>
        <Icon size={18} color="#ff5f6e" />
        <View style={styles.track}>
          <View style={[styles.fillWrap, { height: fillPercent }]}>
            <LinearGradient
              colors={["#ff3b4e", "#8a0d18"]}
              style={styles.fill}
            />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: "18%",
    right: 14,
    zIndex: 999,
    elevation: 999,
  },
  card: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: "rgba(12,9,8,0.92)",
    borderWidth: 1,
    borderColor: "#4a2126",
    shadowColor: "#ff2a3b",
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
  },
  track: {
    width: 6,
    height: 110,
    borderRadius: 3,
    backgroundColor: "#2a1416",
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  fillWrap: {
    width: "100%",
  },
  fill: {
    flex: 1,
    borderRadius: 3,
  },
});
