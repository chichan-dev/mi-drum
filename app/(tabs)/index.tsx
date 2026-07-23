import * as ScreenOrientation from "expo-screen-orientation";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  View as RNView,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import DrumPad from "@/components/DrumPad";
import { Text } from "@/components/Themed";
import { useAudio } from "@/hooks/useAudio";
import audioEngine from "@/services/audio";
import DEFAULT_PADS from "@/store/defaultPads";
import { useDrumStore } from "@/store/useDrumStore";
import type { DrumState } from "@/types";

export default function TabOneScreen() {
  useAudio();
  const insets = useSafeAreaInsets();

  const setPads = useDrumStore((s: DrumState) => s.setPads);
  const pads = useDrumStore((s: DrumState) => s.pads);
  const [loadingSounds, setLoadingSounds] = useState(true);
  const [loadedCount, setLoadedCount] = useState(0);
  const totalPads = DEFAULT_PADS.length;
  const [loadedPads, setLoadedPads] = useState<Record<string, boolean>>({});
  const { width: windowWidth } = useWindowDimensions();
  // enforce a 3-column grid (3x5 for 15 pads)
  const columns = 3;
  // container padding is 16 on both sides (styles.container.padding)
  const horizontalPadding = 16 * 2;
  // gap between columns: items have horizontal margin of 6 each, so gap approx 12 per column gap
  const gap = 12 * (columns - 1);
  const padSize = Math.floor((windowWidth - horizontalPadding - gap) / columns);

  useEffect(() => {
    ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.PORTRAIT
    ).catch(() => undefined);
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
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <RNView style={styles.grid}>
        {loadingSounds && (
          <RNView style={styles.loadingWrap}>
            <Text style={styles.loadingText}>
              Cargando sonidos… {Math.round((loadedCount / totalPads) * 100)}%
            </Text>
            <RNView style={styles.loadingBarContainer}>
              <RNView
                style={[
                  styles.loadingBar,
                  { width: `${Math.round((loadedCount / totalPads) * 100)}%` },
                ]}
              />
            </RNView>
          </RNView>
        )}
        <FlatList
          key={columns}
          data={pads.length ? pads : DEFAULT_PADS}
          keyExtractor={(item) => item.id}
          numColumns={columns}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.columnWrapper}
          contentInsetAdjustmentBehavior="never"
          contentContainerStyle={[
            styles.gridContent,
            { paddingBottom: insets.bottom + 16 },
          ]}
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
  grid: {
    flex: 1,
    alignItems: "stretch",
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
  loadingWrap: {
    position: "absolute",
    top: 8,
    left: 16,
    right: 16,
    alignItems: "center",
    zIndex: 2,
  },
  loadingText: {
    backgroundColor: "#120d0d",
    borderColor: "#ff2a3b",
    borderWidth: 1,
    color: "#ff2a3b",
    fontWeight: "900",
    letterSpacing: 0.5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#ff2a3b",
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 6,
  },
  loadingBarContainer: {
    height: 8,
    width: "80%",
    backgroundColor: "#170f0f",
    borderColor: "#33181c",
    borderWidth: 1,
    borderRadius: 6,
    marginTop: 8,
    overflow: "hidden",
  },
  loadingBar: {
    height: "100%",
    backgroundColor: "#ff2a3b",
  },
});
