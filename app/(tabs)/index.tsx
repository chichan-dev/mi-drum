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
    <SafeAreaView style={styles.container}>
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
          contentContainerStyle={[
            styles.gridContent,
            { paddingBottom: Math.max(16, insets.bottom + 16) },
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
    marginHorizontal: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  grid: {
    flex: 1,
    alignItems: "stretch",
  },
  gridContent: {
    paddingBottom: 16,
  },
  pad: {
    // pad sizing is now controlled dynamically from the parent (width/height passed inline)
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
    backgroundColor: "rgba(0,0,0,0.6)",
    color: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    overflow: "hidden",
  },
  loadingBarContainer: {
    height: 8,
    width: "80%",
    backgroundColor: "rgba(0,0,0,0.12)",
    borderRadius: 6,
    marginTop: 8,
    overflow: "hidden",
  },
  loadingBar: {
    height: "100%",
    backgroundColor: "#4d96ff",
  },
});
