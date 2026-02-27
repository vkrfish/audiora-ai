import { useState, useEffect } from "react";
import { Settings, Share2, Play, Headphones, Users, Heart, Bookmark, Edit3, Mic, Music2, Radio, Pause, Grid3x3, List } from "lucide-react";
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
import { motion } from "framer-motion";

const formatNum = (n: number) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

interface PodcastItem {
  id: string; title: string; description?: string;
  audioUrl?: string; likes: number; duration: string; createdAt: string; coverUrl: string;
}

// Floating ambient icon (used in hero)
const FloatingIcon = ({ icon: Icon, style, delay }: { icon: any; style: string; delay: number }) => (
  <motion.div
    className={cn("absolute opacity-[0.06] text-primary pointer-events-none", style)}
    animate={{ y: [0, -12, 0], rotate: [0, 5, -5, 0] }}
    transition={{ duration: 6 + delay, repeat: Infinity, ease: "easeInOut", delay }}
  >
    <Icon className="w-12 h-12" />
  </motion.div>
);

const PodcastGrid = ({ items, viewMode }: { items: PodcastItem[]; viewMode: "grid" | "list" }) => {
  const audio = useAudio();
  const navigate = useNavigate();

  if (items.length === 0) return (
    <div className="text-center py-16 text-muted-foreground/30">
      <Headphones className="w-10 h-10 mx-auto mb-3 opacity-30" />
      <p className="text-sm font-medium">Nothing here yet</p>
    </div>
  );

  const handlePlay = (e: React.MouseEvent, p: PodcastItem) => {
    e.stopPropagation();
    if (!p.audioUrl) return;
    const playlist = items.map(item => ({ id: item.id, title: item.title, creator: "You", coverUrl: item.coverUrl, audioUrl: item.audioUrl || "" }));
    audio.playTrack({ id: p.id, title: p.title, creator: "You", coverUrl: p.coverUrl, audioUrl: p.audioUrl }, playlist);
  };

  return viewMode === "grid" ? (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((p, i) => {
        const isPlaying = audio.playingId === p.id && audio.isPlaying;
        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group cursor-pointer rounded-2xl overflow-hidden bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300"
            onClick={() => navigate(`/podcast/${p.id}`)}
          >
            <div className="relative aspect-square overflow-hidden">
              <img src={p.coverUrl} alt={p.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                <button onClick={e => handlePlay(e, p)} className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-300">
                  {isPlaying ? <Pause className="w-5 h-5 text-black fill-current" /> : <Play className="w-5 h-5 text-black fill-current ml-0.5" />}
                </button>
              </div>
              <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md text-[9px] font-bold px-2 py-0.5 rounded-full border border-white/10">{p.duration}</div>
              {isPlaying && (
                <div className="absolute top-2 left-2 flex items-center gap-1 bg-primary/90 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                  <span className="text-black text-[9px] font-black">PLAYING</span>
                </div>
              )}
            </div>
            <div className="p-3">
              <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">{p.title}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <Heart className="w-3 h-3 text-muted-foreground/40" />
                <span className="text-[10px] text-muted-foreground/40 font-medium">{formatNum(p.likes)}</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  ) : (
    <div className="space-y-2 max-w-2xl">
      {items.map((p, i) => {
        const isPlaying = audio.playingId === p.id && audio.isPlaying;
        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="group flex items-center gap-4 p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all cursor-pointer"
            onClick={() => navigate(`/podcast/${p.id}`)}
          >
            <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0">
              <img src={p.coverUrl} alt={p.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity" onClick={e => handlePlay(e, p)}>
                {isPlaying ? <Pause className="w-4 h-4 text-white fill-current" /> : <Play className="w-4 h-4 text-white fill-current ml-0.5" />}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">{p.title}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] text-muted-foreground/40">{p.duration}</span>
                <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-muted-foreground/40" /><span className="text-[10px] text-muted-foreground/40">{formatNum(p.likes)}</span></span>
                <span className="text-[10px] text-muted-foreground/25">{p.createdAt}</span>
              </div>
            </div>
          </motion.div>
        );
      })}
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

  const avatarPlaceholder = "https://images.unsplash.com/photo-1531297172866-cb8d50582515?w=400&h=400&fit=crop";

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      const [{ data: prof }, { data: pods }, { data: liked }, { data: saved }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('podcasts').select('id, title, description, estimated_duration, likes_count, created_at, cover_url, audio_files(file_url)')
          .eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('podcast_likes').select(`podcast_id, podcasts(id, title, estimated_duration, likes_count, created_at, cover_url, audio_files(file_url))`).eq('user_id', user.id),
        supabase.from('saved_podcasts').select(`podcast_id, podcasts(id, title, estimated_duration, likes_count, created_at, cover_url, audio_files(file_url))`).eq('user_id', user.id).order('created_at', { ascending: false })
      ]);
      setProfile(prof);
      const fmtPod = (p: any) => ({
        id: p.id, title: p.title || 'Untitled', description: p.description,
        audioUrl: p.audio_files?.[0]?.file_url, likes: p.likes_count || 0,
        duration: `${Math.floor((p.estimated_duration || 0) / 60)}:${((p.estimated_duration || 0) % 60).toString().padStart(2, '0')}`,
        createdAt: formatDistanceToNow(new Date(p.created_at), { addSuffix: true }),
        coverUrl: p.cover_url || "https://images.unsplash.com/photo-1620321023374-d1a1901c5cc1?q=80&w=600&h=400&auto=format&fit=crop"
      });
      setMyPodcasts((pods || []).map(fmtPod));
      setLikedPodcasts((liked || []).filter((l: any) => l.podcasts).map((l: any) => fmtPod(l.podcasts)));
      setSavedPodcasts((saved || []).filter((s: any) => s.podcasts).map((s: any) => fmtPod(s.podcasts)));
      setLoading(false);
    };
    fetchAll();

    const profileChannel = supabase.channel(`profile-${user.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, (payload) => setProfile(payload.new))
      .subscribe();

    const podcastChannel = supabase.channel('public:podcasts')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'podcasts' }, (payload: any) => {
        const updated = payload.new;
        const upd = (list: any[]) => list.map(p => p.id === updated.id ? { ...p, likes: updated.likes_count, title: updated.title, coverUrl: updated.cover_url || p.coverUrl } : p);
        setMyPodcasts(prev => upd(prev));
        setLikedPodcasts(prev => upd(prev));
        setSavedPodcasts(prev => upd(prev));
      }).subscribe();

    return () => { supabase.removeChannel(profileChannel); supabase.removeChannel(podcastChannel); };
  }, [user]);

  if (loading) return (
    <Layout showPlayer>
      <div className="flex items-center justify-center h-screen">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Headphones className="w-6 h-6 text-primary animate-pulse" />
          </div>
        </div>
      </div>
    </Layout>
  );
  if (!user) return null;

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'You';
  const username = profile?.username || 'user_' + user.id.substring(0, 8);

  return (
    <Layout showPlayer>
      <div className="relative min-h-screen">

        {/* ── Glossy Hero Banner (no image) ── */}
        <div className="relative h-52 md:h-64 overflow-hidden">
          {/* Gradient base */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0d1f1c] via-[#0A0A0A] to-[#1a1008]" />
          {/* App palette glows */}
          <div className="absolute top-0 left-1/4 w-80 h-80 bg-primary/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-accent/15 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
          <div className="absolute bottom-0 left-1/2 w-60 h-40 bg-primary/10 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '0.5s' }} />
          {/* Subtle radial shimmer */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(61,218,186,0.07)_0%,transparent_70%)]" />
          {/* Glossy top edge highlight */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          {/* Floating ambient icons */}
          <FloatingIcon icon={Headphones} style="top-6 left-12" delay={0} />
          <FloatingIcon icon={Mic} style="top-4 left-1/3" delay={1.2} />
          <FloatingIcon icon={Music2} style="top-8 left-1/2" delay={2.5} />
          <FloatingIcon icon={Radio} style="top-3 right-1/3" delay={0.7} />
          <FloatingIcon icon={Headphones} style="top-6 right-16" delay={3} />
          {/* Bottom fade into page */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        </div>

        {/* ── Profile Content ── */}
        <div className="container mx-auto px-4 md:px-8 max-w-6xl -mt-24 relative z-10 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-end gap-6 mb-10"
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-[2rem] p-[3px] bg-gradient-to-br from-primary/70 via-accent/40 to-primary/20 shadow-2xl">
                <img
                  src={profile?.avatar_url || avatarPlaceholder}
                  alt={displayName}
                  className="w-full h-full rounded-[1.75rem] object-cover border-2 border-[#0A0A0A]"
                />
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-[#0A0A0A] rounded-full border border-white/10 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h1 className="text-2xl md:text-4xl font-black tracking-tight">{displayName}</h1>
                {profile?.niche && (
                  <Badge variant="outline" className="rounded-full bg-primary/10 border-primary/20 text-primary text-[10px] font-bold px-3 uppercase tracking-wider">
                    {profile.niche}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground/50 text-sm font-medium mb-3">@{username}</p>
              {profile?.bio && <p className="text-sm text-muted-foreground/70 mb-4 max-w-md leading-relaxed">{profile.bio}</p>}

              {/* Stats */}
              <div className="flex flex-wrap gap-6">
                <UserListModal userId={user.id} type="followers" isOpen={showFollowers} onClose={() => setShowFollowers(false)} />
                <button className="flex flex-col items-start hover:opacity-80 transition-opacity" onClick={() => setShowFollowers(true)}>
                  <span className="text-xl font-black tracking-tight">{formatNum(profile?.followers_count || 0)}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Followers</span>
                </button>

                <UserListModal userId={user.id} type="following" isOpen={showFollowing} onClose={() => setShowFollowing(false)} />
                <button className="flex flex-col items-start hover:opacity-80 transition-opacity" onClick={() => setShowFollowing(true)}>
                  <span className="text-xl font-black tracking-tight">{formatNum(profile?.following_count || 0)}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Following</span>
                </button>

                <div className="flex flex-col items-start">
                  <span className="text-xl font-black tracking-tight">{formatNum(myPodcasts.length)}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Podcasts</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 shrink-0">
              <Link to="/settings">
                <button className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-white/10 flex items-center justify-center transition-all">
                  <Settings className="w-4 h-4 text-muted-foreground" />
                </button>
              </Link>
              <button
                onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Profile link copied!"); }}
                className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-white/10 flex items-center justify-center transition-all"
              >
                <Share2 className="w-4 h-4 text-muted-foreground" />
              </button>

              <EditProfileModal isOpen={isEditingProfile} onClose={() => setIsEditingProfile(false)} userId={user.id} onSuccess={() => window.location.reload()} />
              <div className="relative group/btn">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#3DDABA] to-[#F19861] blur-md opacity-0 group-hover/btn:opacity-40 transition-opacity" />
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="relative flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#3DDABA] to-[#F19861] text-black font-bold text-sm hover:brightness-110 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                </button>
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <Tabs defaultValue="podcasts" className="w-full">
              <div className="flex items-center justify-between mb-6">
                <TabsList className="bg-white/[0.03] border border-white/5 rounded-full p-1 h-auto gap-1">
                  <TabsTrigger value="podcasts" className="rounded-full text-xs font-bold px-5 py-2 data-[state=active]:bg-white/10 data-[state=active]:text-foreground text-muted-foreground/50 transition-all">
                    <Headphones className="w-3.5 h-3.5 mr-2" />Podcasts ({myPodcasts.length})
                  </TabsTrigger>
                  <TabsTrigger value="liked" className="rounded-full text-xs font-bold px-5 py-2 data-[state=active]:bg-white/10 data-[state=active]:text-foreground text-muted-foreground/50 transition-all">
                    <Heart className="w-3.5 h-3.5 mr-2" />Liked ({likedPodcasts.length})
                  </TabsTrigger>
                  <TabsTrigger value="saved" className="rounded-full text-xs font-bold px-5 py-2 data-[state=active]:bg-white/10 data-[state=active]:text-foreground text-muted-foreground/50 transition-all">
                    <Bookmark className="w-3.5 h-3.5 mr-2" />Saved ({savedPodcasts.length})
                  </TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-1 bg-white/[0.03] border border-white/5 rounded-full p-1">
                  <button onClick={() => setViewMode("grid")} className={cn("p-2 rounded-full transition-all", viewMode === "grid" ? "bg-white/10 text-foreground" : "text-muted-foreground/40 hover:text-muted-foreground")}>
                    <Grid3x3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setViewMode("list")} className={cn("p-2 rounded-full transition-all", viewMode === "list" ? "bg-white/10 text-foreground" : "text-muted-foreground/40 hover:text-muted-foreground")}>
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <TabsContent value="podcasts" className="mt-0"><PodcastGrid items={myPodcasts} viewMode={viewMode} /></TabsContent>
              <TabsContent value="liked" className="mt-0"><PodcastGrid items={likedPodcasts} viewMode={viewMode} /></TabsContent>
              <TabsContent value="saved" className="mt-0"><PodcastGrid items={savedPodcasts} viewMode={viewMode} /></TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
