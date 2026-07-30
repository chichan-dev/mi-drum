import { Hourglass } from "lucide-react-native";
import React from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";

type Props = {
  id: string;
  label?: string;
  color?: string;
  onPress?: (id: string) => void;
  style?: ViewStyle;
  loading?: boolean;
};

export default function DrumPad({
  id,
  label,
  color = "#ff6b6b",
  onPress,
  style,
  loading,
}: Props) {
  const isLoading = (loading ?? (style as any)?._loading) || false;

  const scale = React.useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  return (
    <Pressable
      onPress={() => onPress && onPress(id)}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      android_ripple={{ color: "rgba(255,255,255,0.2)" }}
      accessibilityLabel={`Drum pad ${label ?? id}`}
    >
      <Animated.View
        style={[
          styles.pad,
          {
            borderColor: color || "#ff2a3b",
            shadowColor: color || "#ff2a3b",
            opacity: isLoading ? 0.65 : 1,
            transform: [{ scale }],
          },
          style,
        ]}
      >
        {/* Fondo interior con acabado de metal oscuro */}
        <Animated.View style={[styles.innerSurface, { backgroundColor: color + "22" }]}>
          <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.label, { color: "#ffffff" }]}>
            {label ?? id}
          </Text>
          {isLoading ? (
            <Hourglass
              size={14}
              color="rgba(255,255,255,0.95)"
              style={styles.loadingSmall}
            />
          ) : null}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pad: {
    borderRadius: 12,
    alignItems: "stretch",
    justifyContent: "center",
    margin: 6,
    padding: 3,
    backgroundColor: "#120d0d",
    borderWidth: 2.5,
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 6,
  },
  innerSurface: {
    flex: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#181011",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  pressed: {
    opacity: 0.9,
  },
  label: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 0.5,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  loadingSmall: {
    position: "absolute",
    bottom: 6,
  },
  iosShadow: {},
  androidShadow: {},
});
