import { Audio } from 'expo-av';
import { useEffect } from 'react';
import audioEngine from '../services/audio';

export function useAudio() {
    useEffect(() => {
        // Configurar modo de audio para iOS y comportamiento general
        // Esto permite reproducir aunque el dispositivo esté en silencio.
        Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
        }).catch((e) => {
            console.warn('useAudio: setAudioModeAsync failed', e);
        });

        return () => {
            // al desmontar la app, descargar sonidos
            audioEngine.unloadAll();
        };
    }, []);

    return audioEngine;
}
