import { useState } from "react";
import { 
  Settings, 
  Share2, 
  Play, 
  Grid, 
  List, 
  Headphones, 
  Users, 
  Heart,
  Edit3,
  BadgeCheck,
  MoreHorizontal
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import PodcastCard from "@/components/cards/PodcastCard";
import Waveform from "@/components/audio/Waveform";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const Profile = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isPlayingBio, setIsPlayingBio] = useState(false);

  const profile = {
    name: "Alex Thompson",
    username: "alexthompson",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    coverUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=400&fit=crop",
    bio: "Tech enthusiast & storyteller. Creating podcasts about innovation, startups, and the future of work.",
    category: "Technology",
    isVerified: true,
    followers: 12500,
    following: 342,
    totalListens: 450000,
    joinedDate: "January 2023"
  };

  const podcasts = [
    {
      title: "The Innovation Mindset",
      creator: profile.name,
      coverUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=400&fit=crop",
      duration: "24:15",
      likes: 1247
    },
    {
      title: "Building in Public: A Guide",
      creator: profile.name,
      coverUrl: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=400&fit=crop",
      duration: "32:08",
      likes: 892
    },
    {
      title: "Remote Work Revolution",
      creator: profile.name,
      coverUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=400&fit=crop",
      duration: "18:42",
      likes: 2341
    },
    {
      title: "AI in Creative Industries",
      creator: profile.name,
      coverUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=400&fit=crop",
      duration: "28:33",
      likes: 1876
    }
  ];

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Layout showPlayer>
      {/* Cover Image */}
      <div className="relative h-48 md:h-64 bg-gradient-to-br from-primary/20 to-accent/20 overflow-hidden">
        <img
          src={profile.coverUrl}
          alt="Cover"
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="container mx-auto px-4 -mt-20 relative z-10">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row md:items-end gap-6 mb-8">
          {/* Avatar */}
          <div className="relative">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden ring-4 ring-background shadow-elevated">
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            </div>
            {profile.isVerified && (
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-glow-sm">
                <BadgeCheck className="w-6 h-6 text-primary-foreground" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="font-display text-2xl md:text-3xl font-bold">{profile.name}</h1>
              <Badge variant="secondary">{profile.category}</Badge>
            </div>
            <p className="text-muted-foreground mb-1">@{profile.username}</p>
            <p className="text-sm text-muted-foreground mb-4 max-w-lg">{profile.bio}</p>

            {/* Audio Bio */}
            <button
              onClick={() => setIsPlayingBio(!isPlayingBio)}
              className="flex items-center gap-3 glass-card px-4 py-2 mb-4 hover:bg-card/80 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Play className={cn("w-4 h-4 text-primary", isPlayingBio && "hidden")} />
                {isPlayingBio && <Waveform isPlaying barCount={3} />}
              </div>
              <span className="text-sm font-medium">Listen to audio bio</span>
              <span className="text-xs text-muted-foreground">0:32</span>
            </button>

            {/* Stats */}
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold">{formatNumber(profile.followers)}</span>
                <span className="text-muted-foreground text-sm">followers</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{formatNumber(profile.following)}</span>
                <span className="text-muted-foreground text-sm">following</span>
              </div>
              <div className="flex items-center gap-2">
                <Headphones className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold">{formatNumber(profile.totalListens)}</span>
                <span className="text-muted-foreground text-sm">listens</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Link to="/settings">
              <Button variant="outline" size="icon">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
            <Button variant="outline" size="icon">
              <Share2 className="w-4 h-4" />
            </Button>
            <Button variant="hero">
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="podcasts" className="w-full">
          <div className="flex items-center justify-between border-b border-border mb-6">
            <TabsList className="bg-transparent h-auto p-0">
              <TabsTrigger
                value="podcasts"
                className="data-[state=active]:border-primary border-b-2 border-transparent rounded-none pb-3 px-4"
              >
                Podcasts
              </TabsTrigger>
              <TabsTrigger
                value="shorts"
                className="data-[state=active]:border-primary border-b-2 border-transparent rounded-none pb-3 px-4"
              >
                Shorts
              </TabsTrigger>
              <TabsTrigger
                value="liked"
                className="data-[state=active]:border-primary border-b-2 border-transparent rounded-none pb-3 px-4"
              >
                <Heart className="w-4 h-4 mr-2" />
                Liked
              </TabsTrigger>
            </TabsList>

            <div className="hidden sm:flex items-center gap-1 pb-3">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon-sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon-sm"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <TabsContent value="podcasts" className="mt-0">
            <div className={cn(
              "grid gap-4",
              viewMode === "grid" ? "sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 max-w-2xl"
            )}>
              {podcasts.map((podcast, i) => (
                <PodcastCard
                  key={i}
                  {...podcast}
                  variant={viewMode === "list" ? "compact" : "default"}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="shorts" className="mt-0">
            <div className="text-center py-12 text-muted-foreground">
              <p>No shorts yet</p>
            </div>
          </TabsContent>

          <TabsContent value="liked" className="mt-0">
            <div className="text-center py-12 text-muted-foreground">
              <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Liked content will appear here</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Profile;
