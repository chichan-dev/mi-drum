import React, { useEffect, useState } from "react";
import {
  FlatList,
  View as RNView,
  StyleSheet,
  useWindowDimensions,
} from "react-native";

import DrumPad from "@/components/DrumPad";
import { Text, View } from "@/components/Themed";
import { useAudio } from "../../src/hooks/useAudio";
import audioEngine from "../../src/services/audio";
import { Pad, useDrumStore } from "../../src/store/useDrumStore";

const DEFAULT_PADS: Pad[] = [
  {
    id: "kick",
    label: "Kick",
    soundUri: require("../../assets/sounds/kick.wav"),
    color: "#ff6b6b",
  },
  {
    id: "snare",
    label: "Snare",
    soundUri: require("../../assets/sounds/snare.wav"),
    color: "#4d96ff",
  },
  {
    id: "hihat_closed",
    label: "Hi-Hat (Closed)",
    soundUri: require("../../assets/sounds/hihat_closed.wav"),
    color: "#ffd166",
  },
  {
    id: "hihat_open",
    label: "Hi-Hat (Open)",
    soundUri: require("../../assets/sounds/hihat_open.wav"),
    color: "#ffd166",
  },
  {
    id: "tom_high",
    label: "Tom High",
    soundUri: require("../../assets/sounds/tom_high.wav"),
    color: "#06d6a0",
  },
  {
    id: "tom_mid",
    label: "Tom Mid",
    soundUri: require("../../assets/sounds/tom_mid.wav"),
    color: "#06d6a0",
  },
  {
    id: "tom_low",
    label: "Tom Low",
    soundUri: require("../../assets/sounds/tom_low.wav"),
    color: "#ffd166",
  },
  {
    id: "clap",
    label: "Clap",
    soundUri: require("../../assets/sounds/clap.wav"),
    color: "#a66cff",
  },
  {
    id: "rimshot",
    label: "Rimshot",
    soundUri: require("../../assets/sounds/rimshot.wav"),
    color: "#ff9f1c",
  },
  {
    id: "cowbell",
    label: "Cowbell",
    soundUri: require("../../assets/sounds/cowbell.wav"),
    color: "#f15bb5",
  },
  {
    id: "ride_bell",
    label: "Ride Bell",
    soundUri: require("../../assets/sounds/ride_bell.wav"),
    color: "#2ec4b6",
  },
  {
    id: "crash",
    label: "Crash",
    soundUri: require("../../assets/sounds/crash.wav"),
    color: "#2ec4b6",
  },
  {
    id: "shaker",
    label: "Shaker",
    soundUri: require("../../assets/sounds/shaker.wav"),
    color: "#00b4d8",
  },
  {
    id: "bongo",
    label: "Bongo",
    soundUri: require("../../assets/sounds/bongo.wav"),
    color: "#ffb4a2",
  },
  {
    id: "clave",
    label: "Clave",
    soundUri: require("../../assets/sounds/clave.wav"),
    color: "#8ac926",
  },
];

export default function TabOneScreen() {
  useAudio(); // set up audio lifecycle (unload on unmount)

  const setPads = useDrumStore((s: any) => s.setPads);
  const pads = useDrumStore((s: any) => s.pads);
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
    <View style={styles.container}>
      <Text style={styles.title}>Mi Drum — By Chichan-Dev</Text>
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
          key={columns} // force re-layout when columns change
          data={pads.length ? pads : DEFAULT_PADS}
          keyExtractor={(item) => item.id}
          numColumns={columns}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.columnWrapper}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
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
