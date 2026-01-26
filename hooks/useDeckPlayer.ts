import { Audio, AVPlaybackSource, AVPlaybackStatus, AVPlaybackStatusSuccess } from "expo-av";
import { useCallback, useEffect, useRef, useState } from "react";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export type DeckTrack = {
  id: string;
  title: string;
  artist?: string;
  artwork?: any;
  origin?: "local" | "url" | "stream" | "youtube";
  source: AVPlaybackSource;
};

export type DeckPlayerHandle = {
  track: DeckTrack | null;
  status: AVPlaybackStatusSuccess | null;
  loading: boolean;
  error: string | null;
  trim: number;
  crossGain: number;
  rate: number;
  loadTrack: (track: DeckTrack) => Promise<void>;
  togglePlay: () => Promise<void>;
  stop: () => Promise<void>;
  restart: () => Promise<void>;
  seek: (millis: number) => Promise<void>;
  setTrim: (value: number) => Promise<void>;
  setCrossGain: (value: number) => Promise<void>;
  setRate: (value: number) => Promise<void>;
};

export function useDeckPlayer(initialTrack?: DeckTrack | null): DeckPlayerHandle {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [track, setTrack] = useState<DeckTrack | null>(initialTrack ?? null);
  const [status, setStatus] = useState<AVPlaybackStatusSuccess | null>(null);
  const statusRef = useRef<AVPlaybackStatusSuccess | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trim, setTrim] = useState(1);
  const [crossGain, setCrossGain] = useState(1);
  const [rate, setRate] = useState(1);

  const applyVolume = useCallback(
    async (sound?: Audio.Sound | null, nextTrim?: number, nextCross?: number) => {
      const volume = clamp01((nextTrim ?? trim) * (nextCross ?? crossGain));
      if (sound) {
        await sound.setStatusAsync({ volume }).catch(() => undefined);
      }
      return volume;
    },
    [trim, crossGain]
  );

  useEffect(() => {
    applyVolume(soundRef.current).catch(() => undefined);
  }, [trim, crossGain, applyVolume]);

  // Throttled synchronization from the audio callback ref into React state.
  useEffect(() => {
    let mounted = true;
    const equal = (a: AVPlaybackStatusSuccess | null, b: AVPlaybackStatusSuccess | null) => {
      if (a === b) return true;
      if (!a || !b) return false;
      return (
        a.isPlaying === b.isPlaying &&
        a.positionMillis === b.positionMillis &&
        a.durationMillis === b.durationMillis &&
        (a as any).playbackRate === (b as any).playbackRate
      );
    };

    const id = setInterval(() => {
      if (!mounted) return;
      const next = statusRef.current;
      setStatus((prev) => {
        if (equal(prev, next)) return prev;
        return next;
      });
    }, 250);

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => undefined);
      soundRef.current = null;
    };
  }, []);

  const loadTrack = useCallback(
    async (nextTrack: DeckTrack) => {
      setLoading(true);
      setError(null);
      try {
        if (soundRef.current) {
          await soundRef.current.stopAsync().catch(() => undefined);
          await soundRef.current.unloadAsync().catch(() => undefined);
        }

        const { sound, status: initialStatus } = await Audio.Sound.createAsync(
          nextTrack.source,
          {
            shouldPlay: false,
            volume: clamp01(trim * crossGain),
            progressUpdateIntervalMillis: 200,
          },
          (s: AVPlaybackStatus) => {
            // Write frequent playback updates to a ref; React state will be
            // synced on a throttled interval to avoid excessive re-renders.
            if (!s.isLoaded) {
              statusRef.current = null;
              return;
            }
            statusRef.current = s as AVPlaybackStatusSuccess;
          }
        );

        soundRef.current = sound;
        setTrack(nextTrack);

        if (initialStatus && (initialStatus as AVPlaybackStatusSuccess).isLoaded) {
          statusRef.current = initialStatus as AVPlaybackStatusSuccess;
          setStatus(initialStatus as AVPlaybackStatusSuccess);
        } else {
          statusRef.current = null;
          setStatus(null);
        }
      } catch (e) {
        setError(
          "No se pudo cargar la pista. Usa un enlace directo (mp3/aac) o un archivo local soportado."
        );
        setTrack(null);
        setStatus(null);
      } finally {
        setLoading(false);
      }
    },
    [crossGain, trim]
  );

  const togglePlay = useCallback(async () => {
    const sound = soundRef.current;
    if (!sound) return;

    if (status?.isLoaded && status.isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
  }, [status]);

  const stop = useCallback(async () => {
    const sound = soundRef.current;
    if (!sound) return;
    await sound.stopAsync().catch(() => undefined);
  }, []);

  const restart = useCallback(async () => {
    const sound = soundRef.current;
    if (!sound) return;
    await sound.setPositionAsync(0).catch(() => undefined);
  }, []);

  const seek = useCallback(async (millis: number) => {
    const sound = soundRef.current;
    if (!sound) return;
    await sound.setPositionAsync(millis).catch(() => undefined);
  }, []);

  const setPlaybackRate = useCallback(async (value: number) => {
    const r = Math.max(0.25, Math.min(2, value));
    setRate(r);
    const sound = soundRef.current;
    if (!sound) return;
    // setRateAsync(rate, shouldCorrectPitch)
    await (sound as any).setRateAsync?.(r, true).catch(() => undefined);
  }, []);

  const setTrimVolume = useCallback(
    async (value: number) => {
      const v = clamp01(value);
      setTrim(v);
      await applyVolume(soundRef.current, v).catch(() => undefined);
    },
    [applyVolume]
  );

  const setCrossGainVolume = useCallback(
    async (value: number) => {
      const v = clamp01(value);
      setCrossGain(v);
      await applyVolume(soundRef.current, undefined, v).catch(() => undefined);
    },
    [applyVolume]
  );

  return {
    track,
    status,
    loading,
    error,
    trim,
    crossGain,
    loadTrack,
    togglePlay,
    stop,
    restart,
    seek,
    setTrim: setTrimVolume,
    setCrossGain: setCrossGainVolume,
    setRate: setPlaybackRate,
    rate,
  };
}
