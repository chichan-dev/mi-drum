import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, View } from "react-native";
import { Text } from "../Themed";

type Props = {
  progress: number; // 0-100
  label?: string;
};

const EMBER_COUNT = 12;

export default function LoadingSplash({ progress, label }: Props) {
  const pulse = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const embers = useRef(
    Array.from({ length: EMBER_COUNT }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 7000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spinLoop.start();

    const timeouts: ReturnType<typeof setTimeout>[] = [];
    embers.forEach((val, i) => {
      const runEmber = () => {
        val.setValue(0);
        Animated.timing(val, {
          toValue: 1,
          duration: 2200 + ((i * 137) % 1600),
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) {
            timeouts.push(setTimeout(runEmber, (i % 5) * 120));
          }
        });
      };
      timeouts.push(setTimeout(runEmber, i * 180));
    });

    return () => {
      pulseLoop.stop();
      spinLoop.stop();
      timeouts.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const glowScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });
  const glowOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0.85],
  });
  const ringRotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#1a0603", "#07080a", "#000000"]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        style={[
          styles.glow,
          { opacity: glowOpacity, transform: [{ scale: glowScale }] },
        ]}
      />

      {embers.map((val, i) => {
        const leftPercent = 6 + ((i * 41) % 88);
        const rise = 220 + ((i * 53) % 160);
        const translateY = val.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -rise],
        });
        const translateX = val.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, i % 2 === 0 ? 12 : -12, 0],
        });
        const opacity = val.interpolate({
          inputRange: [0, 0.12, 0.8, 1],
          outputRange: [0, 1, 0.8, 0],
        });
        const scale = val.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.25],
        });
        const size = 3 + (i % 3) * 2;
        const color = i % 2 === 0 ? "#ff8a3d" : "#ffcf4d";

        return (
          <Animated.View
            key={i}
            pointerEvents="none"
            style={[
              styles.ember,
              {
                left: `${leftPercent}%`,
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: color,
                shadowColor: color,
                opacity,
                transform: [{ translateY }, { translateX }, { scale }],
              },
            ]}
          />
        );
      })}

      <View style={styles.imageWrap}>
        <Animated.View
          style={[styles.spinRing, { transform: [{ rotate: ringRotate }] }]}
        />
        <LinearGradient
          colors={["#ffd23f", "#ff8a00", "#ff2a3b"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.imageRing}
        >
          <View style={styles.imageInner}>
            <Image
              source={require("../../assets/images/portrait_main.png")}
              style={styles.image}
              resizeMode="cover"
            />
          </View>
        </LinearGradient>
      </View>

      <Text style={styles.title}>DARKBASS</Text>
      <Text style={styles.subtitle}>{label ?? "Encendiendo los pads…"}</Text>

      <View style={styles.progressTrack}>
        <LinearGradient
          colors={["#ffd23f", "#ff8a00", "#ff2a3b"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressFill, { width: `${progress}%` }]}
        />
      </View>
      <Text style={styles.progressLabel}>{Math.round(progress)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "#ff2a3b",
    shadowColor: "#ff5a1a",
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 60,
  },
  ember: {
    position: "absolute",
    bottom: "38%",
  },
  imageWrap: {
    marginBottom: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  spinRing: {
    position: "absolute",
    width: 182,
    height: 182,
    borderRadius: 91,
    borderWidth: 2,
    borderColor: "rgba(255,138,0,0.55)",
    borderStyle: "dashed",
  },
  imageRing: {
    width: 150,
    height: 150,
    borderRadius: 75,
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ff6a00",
    shadowOpacity: 0.85,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 22,
    elevation: 12,
  },
  imageInner: {
    width: "100%",
    height: "100%",
    borderRadius: 71,
    overflow: "hidden",
    backgroundColor: "#000",
    borderWidth: 2,
    borderColor: "#0d0605",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontFamily: "MetalMania_400Regular",
    fontSize: 30,
    color: "#fff",
    letterSpacing: 2,
    textShadowColor: "rgba(255,80,20,0.9)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
    marginBottom: 4,
  },
  subtitle: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    letterSpacing: 1,
    marginBottom: 24,
  },
  progressTrack: {
    width: 220,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#170f0f",
    borderWidth: 1,
    borderColor: "#33181c",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressLabel: {
    marginTop: 8,
    color: "#ffb35c",
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 1,
  },
});
