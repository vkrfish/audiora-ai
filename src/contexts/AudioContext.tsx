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
    playlist: CurrentTrack[];
    currentIndex: number;
    volume: number;
    playTrack: (track: CurrentTrack, playlist?: CurrentTrack[]) => void;
    playNext: () => void;
    playPrevious: () => void;
    togglePlay: () => void;
    seek: (time: number) => void;
    setVolume: (vol: number) => void;
    stopTrack: () => void;
    playingId: string | null;
    getAudio: () => HTMLAudioElement | null;
}

const AudioCtx = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider = ({ children }: { children: ReactNode }) => {
    const { settings } = useSettings();
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [currentTrack, setCurrentTrack] = useState<CurrentTrack | null>(null);
    const [playlist, setPlaylist] = useState<CurrentTrack[]>([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolState] = useState(0.8);

    useEffect(() => {
        if (!audioRef.current) {
            const audio = new Audio();
            audio.volume = 0.8;
            audioRef.current = audio;

            audio.addEventListener('play', () => setIsPlaying(true));
            audio.addEventListener('pause', () => setIsPlaying(false));
            audio.addEventListener('ended', () => {
                setIsPlaying(false);
                // We'll use a functional update or a ref to handle the 'next' logic
                // to avoid stale closures and unnecessary re-attachments and re-creations
            });
        }

        // Handle 'ended' with a more robust strategy - using a separate effect for playlist logic
        // is cleaner than re-binding listeners repeatedly.
    }, []);

    // Effect to handle 'ended' logic without rebuilding the audio object
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const onEnded = () => {
            if (playlist.length > 0 && currentIndex < playlist.length - 1) {
                playAtIndex(currentIndex + 1);
            }
        };

        audio.addEventListener('ended', onEnded);
        return () => audio.removeEventListener('ended', onEnded);
    }, [playlist, currentIndex]);

    // Wrapped handleNext to use in event listener
    const handleNext = () => {
        if (playlist.length > 0 && currentIndex < playlist.length - 1) {
            playAtIndex(currentIndex + 1);
        }
    };

    const playAtIndex = async (index: number) => {
        if (!audioRef.current || index < 0 || index >= playlist.length) return;
        const track = playlist[index];
        setCurrentIndex(index);
        setCurrentTrack(track);
        audioRef.current.src = track.audioUrl;
        audioRef.current.load();
        try { await audioRef.current.play(); } catch (e) { console.error('Play failed:', e); }
    };

    const playTrack = async (track: CurrentTrack, newPlaylist?: CurrentTrack[]) => {
        if (!audioRef.current) return;

        if (newPlaylist) {
            setPlaylist(newPlaylist);
            const idx = newPlaylist.findIndex(t => t.id === track.id);
            setCurrentIndex(idx !== -1 ? idx : 0);
        }

        if (currentTrack?.id === track.id) {
            isPlaying ? audioRef.current.pause() : await audioRef.current.play();
            return;
        }

        setCurrentTrack(track);
        audioRef.current.src = track.audioUrl;
        audioRef.current.load();
        try { await audioRef.current.play(); } catch (e) { console.error('Play failed:', e); }
    };

    const playNext = () => {
        if (currentIndex < playlist.length - 1) {
            playAtIndex(currentIndex + 1);
        }
    };

    const playPrevious = () => {
        if (currentIndex > 0) {
            playAtIndex(currentIndex - 1);
        }
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
            setPlaylist([]);
            setCurrentIndex(-1);
            setIsPlaying(false);
        }
    };

    return (
        <AudioCtx.Provider value={{
            currentTrack,
            isPlaying,
            playlist,
            currentIndex,
            volume,
            playTrack,
            playNext,
            playPrevious,
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
