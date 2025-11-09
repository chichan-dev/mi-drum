import { Audio, AVPlaybackSource } from 'expo-av';

type SoundMap = Map<string, Audio.Sound>;

class AudioEngine {
    private sounds: SoundMap = new Map();

    async loadSound(id: string, source: AVPlaybackSource) {
        // si el id ya existe, primero descargar
        const existing = this.sounds.get(id);
        if (existing) {
            await existing.unloadAsync();
            this.sounds.delete(id);
        }

        const { sound } = await Audio.Sound.createAsync(source, { shouldPlay: false });
        this.sounds.set(id, sound);
    }

    async play(id: string) {
        const s = this.sounds.get(id);
        if (!s) return;
        try {
            await s.replayAsync();
        } catch (e) {
            // manejar errores de reproducción (log por ahora)
            console.warn('AudioEngine.play error', e);
        }
    }

    async stop(id: string) {
        const s = this.sounds.get(id);
        if (!s) return;
        try {
            await s.stopAsync();
        } catch (e) {
            console.warn('AudioEngine.stop error', e);
        }
    }

    async setVolume(id: string, volume: number) {
        const s = this.sounds.get(id);
        if (!s) return;
        try {
            await s.setStatusAsync({ volume });
        } catch (e) {
            console.warn('AudioEngine.setVolume error', e);
        }
    }

    async unloadAll() {
        for (const [, s] of this.sounds) {
            try {
                await s.unloadAsync();
            } catch (_) {
                // seguir
            }
        }
        this.sounds.clear();
    }
}

const audioEngine = new AudioEngine();
export default audioEngine;
export type { SoundMap };

