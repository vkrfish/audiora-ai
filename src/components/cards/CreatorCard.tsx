import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Users, Headphones, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface CreatorCardProps {
  name: string;
  username: string;
  avatarUrl: string;
  category: string;
  followers: number;
  totalListens: number;
  isVerified?: boolean;
  isFollowing?: boolean;
  className?: string;
}

const CreatorCard = ({
  name,
  username,
  avatarUrl,
  category,
  followers,
  totalListens,
  isVerified = false,
  isFollowing: initialFollowing = false,
  className
}: CreatorCardProps) => {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className={cn("glass-card-hover p-5 text-center", className)}>
      {/* Avatar */}
      <div className="relative inline-block mb-4">
        <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-border">
          <img
            src={avatarUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
        {isVerified && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
            <BadgeCheck className="w-4 h-4 text-primary-foreground" />
          </div>
        )}
        {/* Play Audio Bio */}
        <Button
          variant="player"
          size="icon-sm"
          className="absolute -bottom-1 -left-1 w-7 h-7"
        >
          <Play className="w-3 h-3 ml-0.5" />
        </Button>
      </div>

      {/* Info */}
      <h4 className="font-semibold mb-1">{name}</h4>
      <p className="text-sm text-muted-foreground mb-2">@{username}</p>
      <Badge variant="secondary" className="mb-4">{category}</Badge>

      {/* Stats */}
      <div className="flex justify-center gap-6 mb-4 text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>{formatNumber(followers)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Headphones className="w-4 h-4" />
          <span>{formatNumber(totalListens)}</span>
        </div>
      </div>

      {/* Follow Button */}
      <Button
        variant={isFollowing ? "outline" : "default"}
        size="sm"
        className="w-full"
        onClick={() => setIsFollowing(!isFollowing)}
      >
        {isFollowing ? "Following" : "Follow"}
      </Button>
    </div>
  );
};

export default CreatorCard;
