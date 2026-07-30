import { LinearGradient } from "expo-linear-gradient";
import * as ScreenOrientation from "expo-screen-orientation";
import { useFocusEffect, useRouter } from "expo-router";
import { Disc3, Settings as SettingsIcon } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  LayoutChangeEvent,
  View as RNView,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import DrumPad from "@/components/DrumPad";
import LoadingSplash from "@/components/ui/LoadingSplash";
import { useAudio } from "@/hooks/useAudio";
import audioEngine from "@/services/audio";
import DEFAULT_PADS from "@/store/defaultPads";
import { useDrumStore } from "@/store/useDrumStore";
import type { DrumState } from "@/types";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export default function TabOneScreen() {
  useAudio();
  const router = useRouter();

  const setPads = useDrumStore((s: DrumState) => s.setPads);
  const pads = useDrumStore((s: DrumState) => s.pads);
  const [loadingSounds, setLoadingSounds] = useState(true);
  const [minSplashElapsed, setMinSplashElapsed] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const totalPads = DEFAULT_PADS.length;
  const [loadedPads, setLoadedPads] = useState<Record<string, boolean>>({});
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [gridSize, setGridSize] = useState({ width: 0, height: 0 });
  const handleGridLayout = (event: LayoutChangeEvent) => {
    const { width: w, height: h } = event.nativeEvent.layout;
    setGridSize({ width: w, height: h });
  };

  // enforce a 3-column grid (3x5 for 15 pads)
  const columns = 3;
  const rows = Math.ceil(totalPads / columns);
  // Medimos el área real disponible (ya sin tab bar ni fila de navegación) en
  // vez del ancho crudo de la ventana, para que la grilla se adapte al
  // espacio real de cada dispositivo y quepa sin scroll.
  const gridWidth = gridSize.width || windowWidth;
  const gridHeight = gridSize.height || windowHeight * 0.7;
  // cada pad tiene margin:6 en todos sus lados (ver DrumPad.tsx), o sea
  // 12px de "aire" por celda tanto en ancho como en alto
  const padSizeFromWidth = gridWidth / columns - 12;
  const padSizeFromHeight = gridHeight / rows - 12;
  const padSize = clamp(
    Math.floor(Math.min(padSizeFromWidth, padSizeFromHeight)),
    56,
    140
  );

  useFocusEffect(
    React.useCallback(() => {
      // Forzar siempre modo vertical (PORTRAIT) al entrar al modo Pads,
      // incluso si veníamos de DJ, que queda fijo en horizontal.
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP
      ).catch(() => undefined);
    }, [])
  );

  useEffect(() => {
    // Los sonidos cargan casi instantáneo (son locales), así que forzamos
    // un mínimo de tiempo en pantalla para que la animación del splash se
    // pueda apreciar en vez de parpadear.
    const timer = setTimeout(() => setMinSplashElapsed(true), 2800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // set default pads once
    if (!pads || pads.length === 0) {
      setPads(DEFAULT_PADS);
      // load sounds into audio engine (use the require() result or URL directly)
      (async () => {
        try {
          const loads = DEFAULT_PADS.map((p) =>
            audioEngine
              .loadSound(p.id, p.soundUri)
              .then(() => {
                setLoadedCount((c) => c + 1);
                setLoadedPads((m) => ({ ...m, [p.id]: true }));
                return p.id;
              })
              .catch((e) => {
                console.warn("failed loading sound", p.id, e);
                setLoadedCount((c) => c + 1);
                setLoadedPads((m) => ({ ...m, [p.id]: true }));
                return p.id;
              })
          );
          await Promise.all(loads);
        } catch (e) {
          console.warn("failed loading some sounds", e);
        } finally {
          setLoadingSounds(false);
        }
      })();
    } else {
      // pads already present: assume sounds might still need loading
      setLoadedCount(totalPads);
      setLoadingSounds(false);
    }
  }, []);

  const handlePress = (id: string) => {
    if (loadingSounds) return;
    audioEngine.play(id);
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right", "bottom"]}
    >
      {/* Navegación: reemplaza la tab bar inferior (oculta en Pads), visible y a mano */}
      <RNView style={styles.navRow}>
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.navLogo}
          resizeMode="contain"
        />
        <RNView style={styles.navButtons}>
          <Pressable
            onPress={() => router.push("/DJ")}
            style={({ pressed }) => [
              styles.navButtonWrap,
              pressed && styles.navButtonPressed,
            ]}
          >
            <LinearGradient
              colors={["#ff3b4e", "#8a0d18"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.navButtonPrimary}
            >
              <Disc3 size={20} color="#ffffff" />
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={() => router.push("/Settings")}
            style={({ pressed }) => [
              styles.navButtonWrap,
              pressed && styles.navButtonPressed,
            ]}
          >
            <RNView style={styles.navButtonSecondary}>
              <SettingsIcon size={20} color="#e3e5ec" />
            </RNView>
          </Pressable>
        </RNView>
      </RNView>

      <RNView style={styles.grid} onLayout={handleGridLayout}>
        <FlatList
          key={columns}
          data={pads.length ? pads : DEFAULT_PADS}
          keyExtractor={(item) => item.id}
          numColumns={columns}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          columnWrapperStyle={styles.columnWrapper}
          contentInsetAdjustmentBehavior="never"
          contentContainerStyle={styles.gridContent}
          renderItem={({ item }) => (
            <DrumPad
              id={item.id}
              label={item.label}
              color={item.color}
              onPress={loadingSounds ? undefined : handlePress}
              loading={!loadedPads[item.id]}
              style={{ width: padSize, height: padSize }}
            />
          )}
        />
      </RNView>

      {(loadingSounds || !minSplashElapsed) && (
        <LoadingSplash progress={(loadedCount / totalPads) * 100} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07080a",
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 12,
    color: "#e3e5ec",
    letterSpacing: 1.5,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 4,
  },
  navLogo: {
    width: 96,
    height: 40,
  },
  navButtons: {
    flexDirection: "row",
    gap: 16,
  },
  navButtonWrap: {
    alignItems: "center",
  },
  navButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  navButtonPrimary: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 23,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    shadowColor: "#ff2a3b",
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 6,
  },
  navButtonSecondary: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#170f0f",
    borderRadius: 23,
    borderWidth: 1,
    borderColor: "#33181c",
  },
  grid: {
    flex: 1,
    alignItems: "stretch",
    justifyContent: "center",
  },
  gridContent: {
    paddingBottom: 16,
  },
  pad: {
    margin: 6,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
});
