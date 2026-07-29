import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  StyleSheet,
  View,
} from "react-native";

type Props = {
  size?: number;
  accentColor: string;
  artwork?: ImageSourcePropType;
  isPlaying?: boolean;
};

export default function SpinningDisc({
  size = 180,
  accentColor,
  artwork,
  isPlaying,
}: Props) {
  const rotation = useRef(new Animated.Value(0)).current;
  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;

    if (isPlaying) {
      rotation.setValue(0);
      loop = Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration: 6000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      loop.start();
    } else {
      rotation.stopAnimation();
    }

    return () => {
      loop?.stop();
    };
  }, [isPlaying, rotation]);

  return (
    <Animated.View
      style={[
        styles.discOuter,
        { width: size, height: size, borderColor: accentColor, transform: [{ rotate: spin }] },
      ]}
    >
      <View style={[styles.discInner, { borderColor: accentColor }]}>
        {artwork ? (
          <Image source={artwork} style={styles.artwork} resizeMode="cover" />
        ) : (
          <View style={[styles.artwork, { backgroundColor: accentColor, opacity: 0.4 }]} />
        )}
        <View style={styles.centerHole} />
      </View>
      <View style={[styles.ring, { borderColor: accentColor }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  discOuter: {
    borderWidth: 2,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 8,
  },
  discInner: {
    width: "76%",
    height: "76%",
    borderRadius: 999,
    borderWidth: 3,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  artwork: {
    width: "100%",
    height: "100%",
  },
  centerHole: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#170d0d",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.6)",
  },
  ring: {
    position: "absolute",
    width: "92%",
    height: "92%",
    borderRadius: 999,
    borderWidth: 1,
    borderStyle: "dashed",
    opacity: 0.6,
  },
});
