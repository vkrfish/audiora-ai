import { useState } from "react";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2,
  Maximize2,
  Heart,
  ListMusic
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const AudioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(35);
  const [volume, setVolume] = useState(80);
  const [isLiked, setIsLiked] = useState(false);

  // Mock data
  const currentTrack = {
    title: "The Future of AI in Daily Life",
    creator: "TechTalk",
    coverUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=100&h=100&fit=crop",
    duration: "24:35",
    currentTime: "8:37"
  };

  return (
    <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-40 bg-player/95 backdrop-blur-xl border-t border-border/50">
      {/* Progress bar */}
      <div className="h-1 bg-waveform-inactive">
        <div 
          className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Track Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative group">
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <Maximize2 className="w-4 h-4 text-foreground" />
              </div>
            </div>
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
              onClick={() => setIsPlaying(!isPlaying)}
              className="shadow-glow-sm"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </Button>
            <Button variant="ghost" size="icon-sm" className="hidden sm:flex">
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          {/* Time & Volume */}
          <div className="hidden md:flex items-center gap-4 flex-1 justify-end">
            <span className="text-xs text-muted-foreground w-20 text-right">
              {currentTrack.currentTime} / {currentTrack.duration}
            </span>
            <div className="flex items-center gap-2 w-32">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <Slider
                value={[volume]}
                max={100}
                step={1}
                onValueChange={(value) => setVolume(value[0])}
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
