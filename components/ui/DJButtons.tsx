import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { Text } from "../Themed";

type ButtonProps = {
  label: string;
  onPress: () => void;
  color: string;
  icon?: string;
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
      {icon && <Text style={[styles.icon, { color }]}>{icon}</Text>}
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
}: {
  onPress: () => void;
  isPlaying: boolean;
  color: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.playButton,
        { borderColor: color },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.playIcon, { color }]}>{isPlaying ? "❚❚" : "▶"}</Text>
    </Pressable>
  );
}

export function CueButton({
  onPress,
  color,
}: {
  onPress: () => void;
  color: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.cueButton,
        { borderColor: color, backgroundColor: color + "20" },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.cueLabel, { color }]}>CUE</Text>
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
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 4,
  },
  small: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  medium: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  large: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  disabled: {
    opacity: 0.3,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  labelDisabled: {
    color: "rgba(255,255,255,0.3)",
  },
  icon: {
    fontSize: 16,
    fontWeight: "700",
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  playIcon: {
    fontSize: 24,
    fontWeight: "900",
  },
  cueButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  cueLabel: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
  },
  syncButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.15)",
  },
  syncActive: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderColor: "#fff",
  },
  syncLabel: {
    fontSize: 13,
    fontWeight: "900",
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 1,
  },
  syncLabelActive: {
    color: "#fff",
  },
});
