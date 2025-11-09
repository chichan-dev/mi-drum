import React from "react";
import {
  Animated,
  Platform,
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
            backgroundColor: color,
            opacity: isLoading ? 0.65 : 1,
            transform: [{ scale }],
          },
          style,
          Platform.OS === "ios" ? styles.iosShadow : styles.androidShadow,
        ]}
      >
        <Text numberOfLines={1} ellipsizeMode="tail" style={styles.label}>
          {label ?? id}
        </Text>
        {isLoading ? <Text style={styles.loadingSmall}>⏳</Text> : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // no fixed width/height here so parent can control sizing responsively
  pad: {
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    margin: 6,
    padding: 8,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    color: "#fff",
    fontWeight: "700",
  },
  loadingSmall: {
    position: "absolute",
    bottom: 6,
    fontSize: 14,
    color: "rgba(255,255,255,0.95)",
  },
  iosShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  androidShadow: {
    elevation: 3,
  },
});
