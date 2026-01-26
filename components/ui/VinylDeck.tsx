import type { DeckPlayerHandle } from "@/hooks/useDeckPlayer";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  GestureResponderEvent,
  Image,
  ImageSourcePropType,
  PanResponder,
  PanResponderGestureState,
  PanResponderInstance,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "../Themed";

type Props = {
  size?: number;
  accentColor: string;
  artwork?: ImageSourcePropType;
  isPlaying?: boolean;
  bpm?: number;
  pitchPercent?: number; // si ya tienes slider de pitch, úsalo acá
  trackTitle?: string;
  artist?: string;
  player?: DeckPlayerHandle | null;
};

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

/** normaliza delta angular a [-PI, PI] para evitar saltos al cruzar el -PI/PI */
function normalizeDeltaAngle(delta: number) {
  let d = delta;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export default function VinylDeck({
  size = 280,
  accentColor,
  artwork,
  isPlaying,
  bpm = 120,
  pitchPercent = 0,
  trackTitle,
  artist,
  player = null,
}: Props) {
  // rotación visual (en grados, pero sin límite)
  const rotationDeg = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const panRef = useRef<PanResponderInstance | null>(null);

  const [scratching, setScratching] = useState(false);

  // refs para scratch
  const initialPosRef = useRef<number>(0);
  const wasPlayingRef = useRef<boolean>(false);

  const lastAngleRef = useRef<number>(0);
  const accumAngleRef = useRef<number>(0);
  const baseRotationDegRef = useRef<number>(0);
  const lastMoveTsRef = useRef<number>(0);

  // throttle RAF
  const rafRef = useRef<number | null>(null);
  const pendingSeekRef = useRef<number | null>(null);
  const pendingRateRef = useRef<number | null>(null);

  // Ajustes “feel”
  const SCRATCH_MS_PER_REV = 6000; // 1 vuelta completa del dedo = 6s de audio (sube/baja a gusto)
  const MS_PER_RAD = SCRATCH_MS_PER_REV / (Math.PI * 2);

  const RATE_SENSITIVITY = 0.09; // rate extra por rad/s (distorsión)
  const FLUTTER = 0.018; // vibración leve cuando scratch

  const baseRate = useMemo(() => {
    // pitchPercent: 0 => 1.0 ; +8 => 1.08 ; -8 => 0.92
    return clamp(1 + pitchPercent / 100, 0.5, 1.6);
  }, [pitchPercent]);

  // rotación visual final (usa rotación modulo 360 para mostrar)
  const spin = useMemo(() => {
    // Animated.modulo existe, pero el typing a veces molesta; esta forma funciona bien en RN.
    // @ts-ignore
    const mod = Animated.modulo(rotationDeg, 360);
    return mod.interpolate({
      inputRange: [0, 360],
      outputRange: ["0deg", "360deg"],
    });
  }, [rotationDeg]);

  const stopSpin = () => {
    animationRef.current?.stop();
    animationRef.current = null;
    rotationDeg.stopAnimation((v) => {
      baseRotationDegRef.current = typeof v === "number" ? v : 0;
    });
  };

  const startSpin = (msPerRev: number) => {
    // animación “por tramos” de +360 para que nunca pegue saltos
    const step = () => {
      rotationDeg.stopAnimation((cur) => {
        const from = typeof cur === "number" ? cur : 0;
        animationRef.current = Animated.timing(rotationDeg, {
          toValue: from + 360,
          duration: msPerRev,
          easing: Easing.linear,
          useNativeDriver: true,
        });
        animationRef.current.start(({ finished }) => {
          if (!finished) return;
          // seguir girando si aplica
          if (isPlaying && !scratching) step();
        });
      });
    };
    step();
  };

  useEffect(() => {
    // gira el vinilo cuando está reproduciendo y NO estás rascando
    if (isPlaying && !scratching) {
      const visualMsPerRev = Math.round(1800 / baseRate); // 33rpm ~ 1800ms/rev, ajustado por pitch
      startSpin(visualMsPerRev);
    } else {
      // si paras o rascas, detenemos animación
      stopSpin();
    }

    return () => {
      stopSpin();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, scratching, baseRate]);

  useEffect(() => {
    const flushAudioOps = () => {
      rafRef.current = null;
      if (!player) return;

      const seekTo = pendingSeekRef.current;
      const rateTo = pendingRateRef.current;

      pendingSeekRef.current = null;
      pendingRateRef.current = null;

      if (typeof seekTo === "number") {
        player.seek(seekTo).catch(() => undefined);
      }
      if (typeof rateTo === "number" && player.setRate) {
        player.setRate(rateTo).catch(() => undefined);
      }
    };

    const scheduleFlush = () => {
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(flushAudioOps);
    };

    panRef.current = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,

      onPanResponderGrant: (evt: GestureResponderEvent) => {
        if (!player || !player.status?.isLoaded) return;

        const pos = player.status.positionMillis ?? 0;
        initialPosRef.current = pos;

        wasPlayingRef.current = Boolean(player.status.isPlaying);

        // Guardamos rotación actual para que el disco “agarre” desde donde iba
        stopSpin();

        // Ángulo inicial del dedo respecto al centro
        const x = evt.nativeEvent.locationX - size / 2;
        const y = evt.nativeEvent.locationY - size / 2;
        const a0 = Math.atan2(y, x);

        lastAngleRef.current = a0;
        accumAngleRef.current = 0;
        lastMoveTsRef.current = Date.now();

        // pausa si estaba sonando (opcional; si quieres scratch “más vivo”, comenta esto)
        if (wasPlayingRef.current) {
          player.togglePlay().catch(() => undefined);
        }

        setScratching(true);
      },

      onPanResponderMove: (
        evt: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        if (!player || !player.status?.isLoaded) return;

        const dur = player.status.durationMillis ?? 0;
        if (!dur) return;

        // ángulo actual
        const x = evt.nativeEvent.locationX - size / 2;
        const y = evt.nativeEvent.locationY - size / 2;
        const a1 = Math.atan2(y, x);

        const now = Date.now();
        const dt = Math.max(1, now - lastMoveTsRef.current);

        // delta angular “sin saltos”
        const delta = normalizeDeltaAngle(a1 - lastAngleRef.current);
        accumAngleRef.current += delta;

        lastAngleRef.current = a1;
        lastMoveTsRef.current = now;

        // SEEK: convertimos ángulo acumulado a ms
        const newPosRaw =
          initialPosRef.current + accumAngleRef.current * MS_PER_RAD;
        const newPos = clamp(Math.round(newPosRaw), 0, dur);

        // Visual: el vinilo sigue el giro del dedo (grados)
        rotationDeg.setValue(
          baseRotationDegRef.current + (accumAngleRef.current * 180) / Math.PI
        );

        // “Distorsión”: rate dinámico por velocidad angular + flutter (vibración)
        // vel rad/s
        const vel = (delta / dt) * 1000;

        // OJO: muchas librerías no soportan rate negativo, esto “simula” reversa + drag.
        const dynamicRate = clamp(baseRate + vel * RATE_SENSITIVITY, 0.5, 1.6);

        const flutter = Math.sin(now / 25) * FLUTTER;
        const rateWithFlutter = clamp(dynamicRate + flutter, 0.5, 1.6);

        // (opcional) vertical como “pitch bend” extra encima del scratch:
        // dy > 0 => baja pitch; dy < 0 => sube pitch
        const bend = clamp(1 - gestureState.dy * 0.0018, 0.75, 1.25);
        const finalRate = clamp(rateWithFlutter * bend, 0.5, 1.6);

        pendingSeekRef.current = newPos;
        pendingRateRef.current = finalRate;
        scheduleFlush();
      },

      onPanResponderRelease: () => {
        if (!player) return;

        // limpiar RAF pendiente
        if (rafRef.current != null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        pendingSeekRef.current = null;
        pendingRateRef.current = null;

        // restaurar rate al pitch base
        if (player.setRate) player.setRate(baseRate).catch(() => undefined);

        // reanudar si estaba reproduciendo
        if (wasPlayingRef.current) {
          player.togglePlay().catch(() => undefined);
        }

        setScratching(false);

        // volver a girar si debe estar en play
        if (isPlaying) {
          const visualMsPerRev = Math.round(1800 / baseRate);
          startSpin(visualMsPerRev);
        }
      },

      onPanResponderTerminate: () => {
        // por seguridad, mismo comportamiento que release
        if (!player) return;

        if (rafRef.current != null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        pendingSeekRef.current = null;
        pendingRateRef.current = null;

        if (player.setRate) player.setRate(baseRate).catch(() => undefined);

        if (wasPlayingRef.current) {
          player.togglePlay().catch(() => undefined);
        }

        setScratching(false);

        if (isPlaying) {
          const visualMsPerRev = Math.round(1800 / baseRate);
          startSpin(visualMsPerRev);
        }
      },
    });

    return () => {
      panRef.current = null;
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player, size, isPlaying, baseRate]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View
        {...(panRef.current?.panHandlers ?? {})}
        style={[
          styles.vinyl,
          {
            width: size,
            height: size,
            borderColor: accentColor,
            transform: [{ rotate: spin }, { scale: scratching ? 0.985 : 1 }],
          },
        ]}
      >
        <View style={[styles.grooves, { borderColor: accentColor + "15" }]} />
        <View style={[styles.grooves2, { borderColor: accentColor + "20" }]} />
        <View style={[styles.grooves3, { borderColor: accentColor + "25" }]} />

        <View style={[styles.artworkContainer, { borderColor: accentColor }]}>
          {artwork ? (
            <Image source={artwork} style={styles.artwork} resizeMode="cover" />
          ) : (
            <View
              style={[
                styles.artworkPlaceholder,
                { backgroundColor: accentColor + "30" },
              ]}
            />
          )}
        </View>
      </Animated.View>

      <View style={styles.overlay}>
        <View style={styles.bpmContainer}>
          <Text style={styles.bpmValue}>{bpm.toFixed(1)}</Text>
          <Text style={styles.bpmLabel}>BPM</Text>
        </View>
        {pitchPercent !== 0 && (
          <Text style={styles.pitchText}>
            {pitchPercent > 0 ? "+" : ""}
            {pitchPercent.toFixed(1)}%
          </Text>
        )}
      </View>

      {isPlaying && (
        <View style={[styles.needle, { borderLeftColor: accentColor }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  vinyl: {
    borderRadius: 999,
    borderWidth: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a1a1a",
    shadowColor: "#000",
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 12,
    position: "relative",
  },
  grooves: {
    position: "absolute",
    width: "85%",
    height: "85%",
    borderRadius: 999,
    borderWidth: 2,
  },
  grooves2: {
    position: "absolute",
    width: "75%",
    height: "75%",
    borderRadius: 999,
    borderWidth: 2,
  },
  grooves3: {
    position: "absolute",
    width: "65%",
    height: "65%",
    borderRadius: 999,
    borderWidth: 2,
  },
  artworkContainer: {
    width: "50%",
    height: "50%",
    borderRadius: 999,
    borderWidth: 3,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0d0d0d",
  },
  artwork: {
    width: "100%",
    height: "100%",
  },
  artworkPlaceholder: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  bpmContainer: {
    alignItems: "center",
  },
  bpmValue: {
    fontSize: 32,
    fontWeight: "900",
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  bpmLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.75)",
    marginTop: -4,
  },
  pitchText: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
  },
  needle: {
    position: "absolute",
    top: "25%",
    right: "15%",
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderStyle: "solid",
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "transparent",
    transform: [{ rotate: "45deg" }],
  },
});
