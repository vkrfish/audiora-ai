import { useState, useEffect } from "react";
import { Settings, Share2, Play, Grid, List, Headphones, Users, Heart, Bookmark, Edit3 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useAudio } from "@/contexts/AudioContext";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { EditProfileModal } from "@/components/modals/EditProfileModal";
import { UserListModal } from "@/components/modals/UserListModal";

const formatNum = (n: number) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

interface PodcastItem {
  id: string; title: string; description?: string;
  audioUrl?: string; likes: number; duration: string; createdAt: string; coverUrl: string;
}

const PodcastGrid = ({ items, viewMode }: { items: PodcastItem[]; viewMode: "grid" | "list" }) => {
  const audio = useAudio();
  if (items.length === 0) return (
    <div className="text-center py-12 text-muted-foreground">No podcasts yet</div>
  );
  return (
    <div className={cn("grid gap-4", viewMode === "grid" ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "grid-cols-1 max-w-2xl")}>
      {items.map(p => (
        <div key={p.id} className={cn("glass-card overflow-hidden group cursor-pointer", viewMode === "list" && "flex gap-4 items-center p-3")}
          onClick={() => p.audioUrl && audio.playTrack({ id: p.id, title: p.title, creator: "You", coverUrl: p.coverUrl, audioUrl: p.audioUrl })}>
          <div className={cn("relative", viewMode === "grid" ? "aspect-square" : "w-14 h-14 shrink-0 rounded-xl overflow-hidden")}>
            <img src={p.coverUrl} alt={p.title} className={cn("object-cover", viewMode === "grid" ? "w-full h-full" : "w-full h-full")} />
            <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Play className="w-6 h-6 text-foreground" />
            </div>
          </div>
          <div className={cn(viewMode === "grid" ? "p-3" : "flex-1 min-w-0")}>
            <p className="font-medium text-sm truncate">{p.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">{p.duration}</span>
              <span className="text-xs text-muted-foreground">·</span>
              <Heart className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{formatNum(p.likes)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [profile, setProfile] = useState<any>(null);
  const [myPodcasts, setMyPodcasts] = useState<PodcastItem[]>([]);
  const [likedPodcasts, setLikedPodcasts] = useState<PodcastItem[]>([]);
  const [savedPodcasts, setSavedPodcasts] = useState<PodcastItem[]>([]);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  const coverPlaceholder = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=400&fit=crop";
  const avatarPlaceholder = "https://images.unsplash.com/photo-1531297172866-cb8d50582515?w=400&h=400&fit=crop";

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      const [{ data: prof }, { data: pods }, { data: liked }, { data: saved }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('podcasts').select('id, title, description, estimated_duration, likes_count, created_at, audio_files(file_url)')
          .eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('podcast_likes').select(`
          podcast_id, podcasts(id, title, estimated_duration, likes_count, created_at, audio_files(file_url))
        `).eq('user_id', user.id),
        supabase.from('saved_podcasts').select(`
          podcast_id, podcasts(id, title, estimated_duration, likes_count, created_at, audio_files(file_url))
        `).eq('user_id', user.id).order('created_at', { ascending: false })
      ]);
      setProfile(prof);
      const fmtPod = (p: any) => ({
        id: p.id, title: p.title || 'Untitled', description: p.description,
        audioUrl: p.audio_files?.[0]?.file_url,
        likes: p.likes_count || 0,
        duration: `${Math.floor((p.estimated_duration || 0) / 60)}:${((p.estimated_duration || 0) % 60).toString().padStart(2, '0')}`,
        createdAt: formatDistanceToNow(new Date(p.created_at), { addSuffix: true }),
        coverUrl: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=400&fit=crop"
      });
      setMyPodcasts((pods || []).map(fmtPod));
      setLikedPodcasts((liked || []).filter((l: any) => l.podcasts).map((l: any) => fmtPod(l.podcasts)));
      setSavedPodcasts((saved || []).filter((s: any) => s.podcasts).map((s: any) => fmtPod(s.podcasts)));
      setLoading(false);
    };
    fetchAll();

    // Real-time subscription for profile changes (counts)
    const channel = supabase.channel(`profile-${user.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload) => setProfile(payload.new))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (loading) return <Layout showPlayer><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" /></div></Layout>;
  if (!user) return null;

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'You';
  const username = profile?.username || 'user_' + user.id.substring(0, 8);

  return (
    <Layout showPlayer>
      {/* Cover */}
      <div className="relative h-48 md:h-64 bg-gradient-to-br from-primary/20 to-accent/20 overflow-hidden">
        <img src={profile?.cover_url || coverPlaceholder} alt="Cover" className="w-full h-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="container mx-auto px-4 -mt-20 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end gap-6 mb-8">
          {/* Avatar */}
          <div className="relative">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden ring-4 ring-background shadow-elevated">
              <img src={profile?.avatar_url || avatarPlaceholder} alt={displayName} className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="font-display text-2xl md:text-3xl font-bold">{displayName}</h1>
              {profile?.niche && <Badge variant="secondary">{profile.niche}</Badge>}
            </div>
            <p className="text-muted-foreground mb-2">@{username}</p>
            {profile?.bio && <p className="text-sm text-muted-foreground mb-4 max-w-lg">{profile.bio}</p>}

            {/* Stats */}
            <div className="flex flex-wrap gap-6">
              <UserListModal
                userId={user.id}
                type="followers"
                isOpen={showFollowers}
                onClose={() => setShowFollowers(false)}
              />
              <div
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setShowFollowers(true)}
              >
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold">{formatNum(profile?.followers_count || 0)}</span>
                <span className="text-muted-foreground text-sm hover:underline">followers</span>
              </div>

              <UserListModal
                userId={user.id}
                type="following"
                isOpen={showFollowing}
                onClose={() => setShowFollowing(false)}
              />
              <div
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setShowFollowing(true)}
              >
                <span className="font-semibold">{formatNum(profile?.following_count || 0)}</span>
                <span className="text-muted-foreground text-sm hover:underline">following</span>
              </div>

              <div className="flex items-center gap-2">
                <Headphones className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold">{formatNum(myPodcasts.length)}</span>
                <span className="text-muted-foreground text-sm">podcasts</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Link to="/settings">
              <Button variant="outline" size="icon"><Settings className="w-4 h-4" /></Button>
            </Link>
            <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Profile link copied!"); }}>
              <Share2 className="w-4 h-4" />
            </Button>

            <EditProfileModal
              isOpen={isEditingProfile}
              onClose={() => setIsEditingProfile(false)}
              userId={user.id}
              onSuccess={() => window.location.reload()}
            />
            <Button variant="hero" onClick={() => setIsEditingProfile(true)}>
              <Edit3 className="w-4 h-4 mr-2" />Edit Profile
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="podcasts" className="w-full">
          <div className="flex items-center justify-between border-b border-border mb-6">
            <TabsList className="bg-transparent h-auto p-0">
              <TabsTrigger value="podcasts" className="data-[state=active]:border-primary border-b-2 border-transparent rounded-none pb-3 px-4">
                Podcasts ({myPodcasts.length})
              </TabsTrigger>
              <TabsTrigger value="liked" className="data-[state=active]:border-primary border-b-2 border-transparent rounded-none pb-3 px-4">
                <Heart className="w-4 h-4 mr-2" />Liked ({likedPodcasts.length})
              </TabsTrigger>
              <TabsTrigger value="saved" className="data-[state=active]:border-primary border-b-2 border-transparent rounded-none pb-3 px-4">
                <Bookmark className="w-4 h-4 mr-2" />Saved ({savedPodcasts.length})
              </TabsTrigger>
            </TabsList>
            <div className="hidden sm:flex items-center gap-1 pb-3">
              <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon-sm" onClick={() => setViewMode("grid")}><Grid className="w-4 h-4" /></Button>
              <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon-sm" onClick={() => setViewMode("list")}><List className="w-4 h-4" /></Button>
            </div>
          </div>
          <TabsContent value="podcasts" className="mt-0">
            <PodcastGrid items={myPodcasts} viewMode={viewMode} />
          </TabsContent>
          <TabsContent value="liked" className="mt-0">
            <PodcastGrid items={likedPodcasts} viewMode={viewMode} />
          </TabsContent>
          <TabsContent value="saved" className="mt-0">
            <PodcastGrid items={savedPodcasts} viewMode={viewMode} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Profile;
