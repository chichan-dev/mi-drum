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
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  disabled: {
    opacity: 0.3,
  },
  label: {
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  labelDisabled: {
    color: "rgba(255,255,255,0.3)",
  },
  icon: {
    fontSize: 16,
    fontWeight: "900",
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    backgroundColor: "#171010",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ff2a3b",
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 6,
  },
  playIcon: {
    fontSize: 22,
    fontWeight: "900",
  },
  cueButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    backgroundColor: "#181416",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FFA500",
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 6,
    elevation: 5,
  },
  cueLabel: {
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  syncButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: "#170f0f",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ff2a3b80",
    shadowColor: "#ff2a3b",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 6,
    elevation: 4,
  },
  syncActive: {
    backgroundColor: "#ff2a3b30",
    borderColor: "#ff2a3b",
  },
  syncLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: "#ff2a3b",
    letterSpacing: 1.5,
  },
  syncLabelActive: {
    color: "#fff",
  },
});
