import { useState, useEffect, useRef } from "react";
import {
  Play, Pause, SkipBack, SkipForward, Volume2, Heart, ListMusic
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useAudio } from "@/contexts/AudioContext";

const formatTime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const AudioPlayer = () => {
  const { currentTrack, isPlaying, volume, togglePlay, seek, setVolume, getAudio } = useAudio();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
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

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-40 bg-player/95 backdrop-blur-xl border-t border-border/50">
      {/* Clickable progress bar */}
      <div
        className="h-1 bg-waveform-inactive cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          seek(((e.clientX - rect.left) / rect.width) * duration);
        }}
      >
        <div
          className="h-full bg-gradient-to-r from-primary to-accent transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Track Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div className="min-w-0">
              <h4 className="font-medium text-sm truncate">{currentTrack.title}</h4>
              <p className="text-xs text-muted-foreground truncate">{currentTrack.creator}</p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              className="hidden sm:flex shrink-0"
              onClick={() => setIsLiked(!isLiked)}
            >
              <Heart className={cn("w-4 h-4", isLiked && "fill-accent text-accent")} />
            </Button>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon-sm" className="hidden sm:flex">
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button
              variant="player"
              size="icon-lg"
              onClick={togglePlay}
              className="shadow-glow-sm"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </Button>
            <Button variant="ghost" size="icon-sm" className="hidden sm:flex">
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          {/* Time & Volume */}
          <div className="hidden md:flex items-center gap-4 flex-1 justify-end">
            <span className="text-xs text-muted-foreground w-24 text-right tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
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
