import { Play, Clock, Heart, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Waveform from "@/components/audio/Waveform";
import { useState } from "react";

interface PodcastCardProps {
  title: string;
  creator: string;
  coverUrl: string;
  duration: string;
  likes?: number;
  isPlaying?: boolean;
  className?: string;
  variant?: "default" | "compact" | "featured";
}

const PodcastCard = ({
  title,
  creator,
  coverUrl,
  duration,
  likes = 0,
  isPlaying = false,
  className,
  variant = "default"
}: PodcastCardProps) => {
  const [isLiked, setIsLiked] = useState(false);

  if (variant === "compact") {
    return (
      <div className={cn("glass-card-hover p-3 flex items-center gap-3", className)}>
        <div className="relative">
          <img
            src={coverUrl}
            alt={title}
            className="w-12 h-12 rounded-lg object-cover"
          />
          {isPlaying && (
            <div className="absolute inset-0 bg-background/60 rounded-lg flex items-center justify-center">
              <Waveform isPlaying={true} barCount={3} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{title}</h4>
          <p className="text-xs text-muted-foreground truncate">{creator}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          {duration}
        </div>
      </div>
    );
  }

  if (variant === "featured") {
    return (
      <div className={cn("group relative overflow-hidden rounded-2xl", className)}>
        <img
          src={coverUrl}
          alt={title}
          className="w-full aspect-[16/9] object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-end justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-primary font-medium mb-1">Featured</p>
              <h3 className="font-display text-2xl font-bold mb-2 line-clamp-2">{title}</h3>
              <p className="text-muted-foreground">{creator}</p>
            </div>
            <Button variant="hero" size="icon-lg" className="shrink-0">
              <Play className="w-5 h-5 ml-0.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("glass-card-hover overflow-hidden group", className)}>
      <div className="relative aspect-square">
        <img
          src={coverUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="hero" size="icon-lg">
            <Play className="w-5 h-5 ml-0.5" />
          </Button>
        </div>

        {/* Playing indicator */}
        {isPlaying && (
          <div className="absolute bottom-3 left-3">
            <Waveform isPlaying={true} />
          </div>
        )}

        {/* Duration badge */}
        <div className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md">
          <span className="text-xs font-medium">{duration}</span>
        </div>
      </div>

      <div className="p-4">
        <h4 className="font-semibold line-clamp-2 mb-1 group-hover:text-primary transition-colors">
          {title}
        </h4>
        <p className="text-sm text-muted-foreground mb-3">{creator}</p>
        
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 -ml-2"
            onClick={() => setIsLiked(!isLiked)}
          >
            <Heart className={cn("w-4 h-4", isLiked && "fill-accent text-accent")} />
            <span className="text-xs">{isLiked ? likes + 1 : likes}</span>
          </Button>
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PodcastCard;
