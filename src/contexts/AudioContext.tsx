import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { useSettings } from './SettingsContext';

export interface CurrentTrack {
    id: string;
    title: string;
    creator: string;
    coverUrl: string;
    audioUrl: string;
}

interface AudioContextType {
    currentTrack: CurrentTrack | null;
    isPlaying: boolean;
    volume: number;
    playTrack: (track: CurrentTrack) => void;
    togglePlay: () => void;
    seek: (time: number) => void;
    setVolume: (vol: number) => void;
    stopTrack: () => void;
    playingId: string | null;
    /** Direct access to the underlying <audio> element for time-sensitive consumers */
    getAudio: () => HTMLAudioElement | null;
}

const AudioCtx = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider = ({ children }: { children: ReactNode }) => {
    const { settings } = useSettings();
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [currentTrack, setCurrentTrack] = useState<CurrentTrack | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolState] = useState(0.8);

    useEffect(() => {
        const audio = new Audio();
        audio.volume = 0.8;
        audioRef.current = audio;

        audio.addEventListener('play', () => setIsPlaying(true));
        audio.addEventListener('pause', () => setIsPlaying(false));
        audio.addEventListener('ended', () => setIsPlaying(false));

        return () => { audio.pause(); audio.src = ''; };
    }, []);

    // Reactively apply speed
    useEffect(() => {
        if (audioRef.current && settings.audio.defaultSpeed) {
            audioRef.current.playbackRate = Number(settings.audio.defaultSpeed);
        }
    }, [settings.audio.defaultSpeed]);

    const playTrack = async (track: CurrentTrack) => {
        if (!audioRef.current) return;
        if (currentTrack?.id === track.id) {
            isPlaying ? audioRef.current.pause() : await audioRef.current.play();
            return;
        }
        setCurrentTrack(track);
        audioRef.current.src = track.audioUrl;
        audioRef.current.load();
        try { await audioRef.current.play(); } catch (e) { console.error('Play failed:', e); }
    };

    const togglePlay = async () => {
        if (!audioRef.current) return;
        isPlaying ? audioRef.current.pause() : await audioRef.current.play();
    };

    const seek = (time: number) => {
        if (audioRef.current) audioRef.current.currentTime = time;
    };

    const setVolume = (vol: number) => {
        if (audioRef.current) audioRef.current.volume = vol;
        setVolState(vol);
    };

    const stopTrack = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
            setCurrentTrack(null);
            setIsPlaying(false);
        }
    };

    return (
        <AudioCtx.Provider value={{
            currentTrack,
            isPlaying,
            volume,
            playTrack,
            togglePlay,
            seek,
            setVolume,
            stopTrack,
            playingId: currentTrack?.id ?? null,
            getAudio: () => audioRef.current,
        }}>
            {children}
        </AudioCtx.Provider>
    );
};

export const useAudio = () => {
    const ctx = useContext(AudioCtx);
    if (!ctx) throw new Error('useAudio must be used within AudioProvider');
    return ctx;
};
