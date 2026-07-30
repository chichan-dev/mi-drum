import { X } from "lucide-react-native";
import React from "react";
import {
  BackHandler,
  StyleSheet,
  TouchableOpacity,
  View as RNView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text } from "@/components/Themed";

type FullScreenModalProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export default function FullScreenModal({
  visible,
  onClose,
  title,
  children,
}: FullScreenModalProps) {
  // No usamos el componente Modal nativo de RN: al abrirlo mientras la
  // orientación está bloqueada en horizontal (modo DJ) provoca un cierre
  // nativo de la app en Android. Renderizamos un overlay absoluto dentro
  // de la misma pantalla en su lugar, evitando el diálogo/ventana nativa.
  React.useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <RNView style={styles.overlay}>
      <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
        <RNView style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={18} color="#ff808c" />
          </TouchableOpacity>
        </RNView>
        {children}
      </SafeAreaView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    elevation: 100,
  },
  container: {
    flex: 1,
    backgroundColor: "#07080a",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#33181c",
  },
  title: {
    color: "#e3e5ec",
    fontWeight: "900",
    fontSize: 18,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1a1112",
    borderWidth: 1,
    borderColor: "#4a2126",
    alignItems: "center",
    justifyContent: "center",
  },
});
