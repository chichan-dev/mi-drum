import { Pause, Play } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { Text } from "../Themed";

type ButtonProps = {
  label: string;
  onPress: () => void;
  color: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  size?: "small" | "medium" | "large";
};

export function DJButton({
  label,
  onPress,
  color,
  icon,
  disabled,
  size = "medium",
}: ButtonProps) {
  const sizeStyle =
    size === "small"
      ? styles.small
      : size === "large"
      ? styles.large
      : styles.medium;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.button,
        sizeStyle,
        { borderColor: color },
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {icon}
      <Text style={[styles.label, { color }, disabled && styles.labelDisabled]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function PlayButton({
  onPress,
  isPlaying,
  color,
  size = 60,
}: {
  onPress: () => void;
  isPlaying: boolean;
  color: string;
  size?: number;
}) {
  const IconComponent = isPlaying ? Pause : Play;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.playButton,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
        },
        pressed && styles.pressed,
      ]}
    >
      <IconComponent
        size={size * 0.4}
        color={color}
        fill={color}
        strokeWidth={0}
      />
    </Pressable>
  );
}

export function CueButton({
  onPress,
  color,
  size = 60,
}: {
  onPress: () => void;
  color: string;
  size?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.cueButton,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
          backgroundColor: color + "20",
        },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.cueLabel, { color, fontSize: size * 0.25 }]}>
        CUE
      </Text>
    </Pressable>
  );
}

export function SyncButton({
  onPress,
  synced,
}: {
  onPress: () => void;
  synced?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.syncButton,
        synced && styles.syncActive,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.syncLabel, synced && styles.syncLabelActive]}>
        SYNC
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 2,
    borderRadius: 8,
    backgroundColor: "#170f0f",
    borderColor: "#3d1e22",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 4,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  small: {
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  medium: {
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  large: {
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  disabled: {
    opacity: 0.3,
  },
  label: {
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  labelDisabled: {
    color: "rgba(255,255,255,0.3)",
  },
  playButton: {
    borderWidth: 2,
    backgroundColor: "#171010",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ff2a3b",
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 6,
    elevation: 5,
  },
  cueButton: {
    borderWidth: 2,
    backgroundColor: "#181416",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FFA500",
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 5,
    elevation: 4,
  },
  cueLabel: {
    fontWeight: "900",
    letterSpacing: 1,
  },
  syncButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: "#170f0f",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#ff2a3b80",
    shadowColor: "#ff2a3b",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 5,
    elevation: 3,
  },
  syncActive: {
    backgroundColor: "#ff2a3b30",
    borderColor: "#ff2a3b",
  },
  syncLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#ff2a3b",
    letterSpacing: 1,
  },
  syncLabelActive: {
    color: "#fff",
  },
});
