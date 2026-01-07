import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Users, 
  TrendingUp, 
  Play, 
  Heart, 
  MessageCircle, 
  Share2,
  MoreHorizontal,
  Clock,
  Bookmark
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import Waveform from "@/components/audio/Waveform";
import { cn } from "@/lib/utils";

interface AudioPost {
  id: string;
  type: "short" | "podcast";
  title: string;
  description?: string;
  creator: {
    name: string;
    username: string;
    avatar: string;
    isVerified: boolean;
  };
  coverUrl: string;
  duration: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  isSaved: boolean;
  createdAt: string;
}

const Feed = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [playingId, setPlayingId] = useState<string | null>(null);

  const posts: AudioPost[] = [
    {
      id: "1",
      type: "podcast",
      title: "Why Remote Work Is Here to Stay",
      description: "Exploring the lasting impact of remote work on productivity, culture, and the future of offices.",
      creator: {
        name: "Sarah Chen",
        username: "sarahtalks",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
        isVerified: true
      },
      coverUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=400&fit=crop",
      duration: "24:15",
      likes: 1247,
      comments: 89,
      shares: 234,
      isLiked: false,
      isSaved: false,
      createdAt: "2h ago"
    },
    {
      id: "2",
      type: "short",
      title: "Quick Tip: Morning Productivity Hack",
      creator: {
        name: "Marcus Johnson",
        username: "marcuspod",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
        isVerified: true
      },
      coverUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=400&fit=crop",
      duration: "1:12",
      likes: 892,
      comments: 45,
      shares: 123,
      isLiked: true,
      isSaved: false,
      createdAt: "4h ago"
    },
    {
      id: "3",
      type: "podcast",
      title: "The Art of Storytelling in Business",
      description: "How the world's best companies use narrative to connect with customers and build lasting brands.",
      creator: {
        name: "Elena Rodriguez",
        username: "elenavoice",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
        isVerified: true
      },
      coverUrl: "https://images.unsplash.com/photo-1553484771-371a605b060b?w=400&h=400&fit=crop",
      duration: "32:08",
      likes: 2341,
      comments: 156,
      shares: 412,
      isLiked: false,
      isSaved: true,
      createdAt: "6h ago"
    },
    {
      id: "4",
      type: "short",
      title: "Voice Note: Thoughts on AI Ethics",
      creator: {
        name: "David Kim",
        username: "davidkim",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
        isVerified: false
      },
      coverUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=400&fit=crop",
      duration: "0:58",
      likes: 567,
      comments: 34,
      shares: 78,
      isLiked: false,
      isSaved: false,
      createdAt: "8h ago"
    }
  ];

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const AudioPostCard = ({ post }: { post: AudioPost }) => {
    const [liked, setLiked] = useState(post.isLiked);
    const [saved, setSaved] = useState(post.isSaved);
    const [likes, setLikes] = useState(post.likes);
    const isPlaying = playingId === post.id;

    const handleLike = () => {
      setLiked(!liked);
      setLikes(liked ? likes - 1 : likes + 1);
    };

    return (
      <div className="glass-card p-4 sm:p-5 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img
              src={post.creator.avatar}
              alt={post.creator.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-sm">{post.creator.name}</span>
                {post.creator.isVerified && (
                  <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                    </svg>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                @{post.creator.username} · {post.createdAt}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex gap-4 mb-4">
          {/* Cover */}
          <div 
            className="relative shrink-0 cursor-pointer group"
            onClick={() => setPlayingId(isPlaying ? null : post.id)}
          >
            <img
              src={post.coverUrl}
              alt={post.title}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover"
            />
            <div className={cn(
              "absolute inset-0 bg-background/60 rounded-xl flex items-center justify-center transition-opacity",
              isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}>
              {isPlaying ? (
                <Waveform isPlaying barCount={4} className="h-6" />
              ) : (
                <Play className="w-8 h-8 text-foreground" />
              )}
            </div>
            {/* Duration badge */}
            <div className="absolute bottom-1 right-1 bg-background/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-xs">
              {post.duration}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="text-xs">
                {post.type === "short" ? "Short" : "Podcast"}
              </Badge>
            </div>
            <h3 className="font-semibold line-clamp-2 mb-1">{post.title}</h3>
            {post.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {post.description}
              </p>
            )}
          </div>
        </div>

        {/* Audio Progress (when playing) */}
        {isPlaying && (
          <div className="mb-4 p-3 bg-secondary/50 rounded-lg">
            <Waveform isPlaying barCount={30} className="h-8 mb-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>0:45</span>
              <span>{post.duration}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-1.5"
              onClick={handleLike}
            >
              <Heart className={cn("w-4 h-4", liked && "fill-accent text-accent")} />
              <span className="text-xs">{formatNumber(likes)}</span>
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs">{formatNumber(post.comments)}</span>
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <Share2 className="w-4 h-4" />
              <span className="text-xs">{formatNumber(post.shares)}</span>
            </Button>
          </div>
          <Button 
            variant="ghost" 
            size="icon-sm"
            onClick={() => setSaved(!saved)}
          >
            <Bookmark className={cn("w-4 h-4", saved && "fill-primary text-primary")} />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Layout showPlayer>
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Feed Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-6 bg-card/50">
            <TabsTrigger value="home" className="gap-2">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">For You</span>
            </TabsTrigger>
            <TabsTrigger value="following" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Following</span>
            </TabsTrigger>
            <TabsTrigger value="trending" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Trending</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-4 mt-0">
            {posts.map((post) => (
              <AudioPostCard key={post.id} post={post} />
            ))}
          </TabsContent>

          <TabsContent value="following" className="space-y-4 mt-0">
            {posts.filter((_, i) => i % 2 === 0).map((post) => (
              <AudioPostCard key={post.id} post={post} />
            ))}
          </TabsContent>

          <TabsContent value="trending" className="space-y-4 mt-0">
            {[...posts].reverse().map((post) => (
              <AudioPostCard key={post.id} post={post} />
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Feed;
