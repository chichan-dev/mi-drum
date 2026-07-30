import { useRouter } from "expo-router";
import { LogOut, Music2, Smartphone } from "lucide-react-native";
import { StyleSheet, TouchableOpacity, View as RNView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";

import { Text } from "@/components/Themed";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { useAuthStore } from "@/store/useAuthStore";

export default function SettingsScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { logout } = useGoogleAuth();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Configuración</Text>

      <RNView style={styles.section}>
        <Text style={styles.sectionLabel}>Cuenta</Text>
        <RNView style={styles.row}>
          <Smartphone size={18} color="#ff2a3b" />
          <Text style={styles.rowText}>
            {isAuthenticated
              ? user?.name || user?.email || "Sesión activa"
              : "Modo local / invitado"}
          </Text>
        </RNView>
        {isAuthenticated ? (
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <LogOut size={16} color="#ff808c" />
            <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
          </TouchableOpacity>
        ) : null}
      </RNView>

      <RNView style={styles.section}>
        <Text style={styles.sectionLabel}>Música</Text>
        <TouchableOpacity
          style={styles.row}
          onPress={() => router.push("/DJ")}
        >
          <Music2 size={18} color="#ff2a3b" />
          <Text style={styles.rowText}>
            Cargar audio del dispositivo (modo DJ → Archivos)
          </Text>
        </TouchableOpacity>
      </RNView>

      <RNView style={styles.section}>
        <Text style={styles.sectionLabel}>Acerca de</Text>
        <RNView style={styles.row}>
          <Text style={styles.rowText}>
            {Constants.expoConfig?.name ?? "DarkBass"} v
            {Constants.expoConfig?.version ?? "1.0.0"}
          </Text>
        </RNView>
      </RNView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07080a",
    padding: 20,
    gap: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#e3e5ec",
    letterSpacing: 1,
  },
  section: {
    backgroundColor: "#120c0c",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#33181c",
    padding: 14,
    gap: 10,
  },
  sectionLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rowText: {
    color: "#e3e5ec",
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    backgroundColor: "#2a1215",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ff2a3b",
  },
  logoutButtonText: {
    color: "#ff808c",
    fontWeight: "800",
    fontSize: 13,
  },
});
