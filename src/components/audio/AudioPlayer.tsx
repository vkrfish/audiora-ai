import { useState, useEffect, useRef } from "react";
import {
  Play, Pause, SkipBack, SkipForward, Volume2, X, ListMusic
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useAudio } from "@/contexts/AudioContext";
import { Link as RouterLink } from "react-router-dom";

const formatTime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const AudioPlayer = () => {
  const {
    currentTrack, isPlaying, volume, togglePlay, seek,
    setVolume, stopTrack, getAudio, playNext, playPrevious,
    currentIndex, playlist
  } = useAudio();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const rafRef = useRef<number | null>(null);

  /* Subscribe to the shared audio element for time updates without polluting global state */
  useEffect(() => {
    const audio = getAudio();
    if (!audio) return;

    const onMeta = () => setDuration(audio.duration || 0);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onEnded = () => { setCurrentTime(0); setDuration(0); };

    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, [getAudio]);

  /* Reset time display when track changes */
  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
  }, [currentTrack?.id]);

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-40 bg-player/95 backdrop-blur-xl border-t border-border/50">
      {/* Top Close Button for Mobile/Desktop */}
      <div className="absolute top-2 right-2 z-50">
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-6 w-6 rounded-full bg-player/50 hover:bg-player text-muted-foreground hover:text-foreground"
          onClick={stopTrack}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>

      {/* Draggable Slider for Progress */}
      <div className="px-4 -mt-2.5">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={1}
          onValueChange={(v) => seek(v[0])}
          className="w-full cursor-pointer"
        />
      </div>

      <div className="container mx-auto px-3 md:px-4 py-2 mt-1">
        <div className="flex items-center justify-between gap-2 md:gap-4">
          {/* Track Info */}
          <RouterLink to={`/podcast/${currentTrack.id}`} className="flex items-center gap-2 md:gap-3 min-w-0 flex-1 hover:opacity-80 transition-opacity group">
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover shadow-sm group-hover:shadow-md transition-shadow shrink-0"
            />
            <div className="min-w-0 pr-2">
              <h4 className="font-medium text-[13px] leading-tight md:text-sm truncate group-hover:text-primary transition-colors">{currentTrack.title}</h4>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-[10px] md:text-xs text-muted-foreground truncate">{currentTrack.creator}</p>
                <span className="text-muted-foreground text-[8px] md:hidden">•</span>
                <span className="text-[10px] text-muted-foreground tabular-nums opacity-80 md:hidden">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            </div>
          </RouterLink>

          {/* Playback Controls and Time */}
          <div className="flex items-center gap-2 md:gap-4 shrink-0 md:flex-1 md:justify-center pr-6 md:pr-0">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={playPrevious}
              disabled={currentIndex <= 0}
              className="hidden sm:flex"
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button
              variant="player"
              size="icon-lg"
              onClick={togglePlay}
              className="w-10 h-10 md:w-12 md:h-12 rounded-full shadow-glow-sm shrink-0 flex items-center justify-center p-0"
            >
              {isPlaying ? <Pause className="w-4 h-4 md:w-5 md:h-5" /> : <Play className="w-4 h-4 md:w-5 md:h-5 ml-0.5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={playNext}
              disabled={currentIndex >= playlist.length - 1}
              className="hidden sm:flex"
            >
              <SkipForward className="w-4 h-4" />
            </Button>

            {/* Time display on desktop */}
            <span className="hidden md:inline text-xs text-muted-foreground tabular-nums md:ml-2">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Volume (Only on desktop) */}
          <div className="hidden md:flex items-center gap-4 flex-1 justify-end">
            <div className="flex items-center gap-2 w-32">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <Slider
                value={[volume * 100]}
                max={100}
                step={1}
                onValueChange={(v) => setVolume(v[0] / 100)}
                className="w-full"
              />
            </div>
            <Button variant="ghost" size="icon-sm">
              <ListMusic className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
