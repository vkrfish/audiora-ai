import { useState, useEffect, useCallback } from "react";
import { Search, TrendingUp, UserPlus, UserCheck, Play, Headphones, Users } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useAudio } from "@/contexts/AudioContext";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const avatarPlaceholder = "https://images.unsplash.com/photo-1531297172866-cb8d50582515?w=100&h=100&fit=crop";
const coverPodcast = "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=400&fit=crop";
const formatNum = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

const Discover = () => {
  const { user } = useAuth();
  const audio = useAudio();
  const [searchQuery, setSearchQuery] = useState("");
  const [userResults, setUserResults] = useState<any[]>([]);
  const [podcastResults, setPodcastResults] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Load trending + suggested on mount
  useEffect(() => {
    const load = async () => {
      const [{ data: pods }, { data: users }] = await Promise.all([
        supabase.from('podcasts')
          .select('id, title, description, estimated_duration, likes_count, created_at, audio_files!inner(file_url), profiles(full_name)')
          .eq('is_public', true)
          .order('likes_count', { ascending: false }).limit(8),
        supabase.from('profiles').select('id, full_name, username, avatar_url, followers_count, podcasts_count')
          .neq('id', user?.id || '').limit(6)
      ]);
      setTrending(pods || []);
      setSuggestedUsers(users || []);

      if (user) {
        const { data: follows } = await supabase.from('user_follows').select('following_id').eq('follower_id', user.id);
        setFollowingIds(new Set((follows || []).map((f: any) => f.following_id)));
      }
    };
    load();
  }, [user]);

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setSearched(false); setUserResults([]); setPodcastResults([]); return; }
    setLoading(true);
    setSearched(true);
    const [{ data: users }, { data: pods }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, username, avatar_url, followers_count, podcasts_count')
        .or(`full_name.ilike.%${q}%,username.ilike.%${q}%`).neq('id', user?.id || '').limit(10),
      supabase.from('podcasts')
        .select('id, title, description, estimated_duration, likes_count, audio_files!inner(file_url), profiles(full_name)')
        .eq('is_public', true)
        .ilike('title', `%${q}%`).limit(10)
    ]);
    setUserResults(users || []);
    setPodcastResults(pods || []);
    setLoading(false);
  }, [user]);

  const handleFollow = async (targetId: string) => {
    if (!user) { toast.error("Sign in to follow"); return; }
    if (followingIds.has(targetId)) {
      await supabase.from('user_follows').delete().eq('follower_id', user.id).eq('following_id', targetId);
      setFollowingIds(prev => { const n = new Set(prev); n.delete(targetId); return n; });
    } else {
      await supabase.from('user_follows').insert({ follower_id: user.id, following_id: targetId });
      setFollowingIds(prev => new Set([...prev, targetId]));
      await supabase.from('notifications').insert({ user_id: targetId, actor_id: user.id, type: 'follow' });
      toast.success("Following!");
    }
  };

  const UserCard = ({ u }: { u: any }) => (
    <div className="glass-card p-4 flex items-center gap-3">
      <Link to={`/profile/${u.id}`}>
        <img src={u.avatar_url || avatarPlaceholder} className="w-12 h-12 rounded-full object-cover" alt={u.full_name} />
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/profile/${u.id}`}>
          <p className="font-semibold text-sm hover:underline truncate">{u.full_name || `User ${u.id.substring(0, 8)}`}</p>
        </Link>
        <p className="text-xs text-muted-foreground">@{u.username || 'user'} · {formatNum(u.followers_count || 0)} followers</p>
      </div>
      <Button variant={followingIds.has(u.id) ? "outline" : "hero"} size="sm" onClick={() => handleFollow(u.id)}>
        {followingIds.has(u.id) ? <><UserCheck className="w-3 h-3 mr-1" />Following</> : <><UserPlus className="w-3 h-3 mr-1" />Follow</>}
      </Button>
    </div>
  );

  const PodcastCard = ({ p }: { p: any }) => {
    const dur = `${Math.floor((p.estimated_duration || 0) / 60)}:${((p.estimated_duration || 0) % 60).toString().padStart(2, '0')}`;
    const audioUrl = p.audio_files?.[0]?.file_url;
    return (
      <div className="glass-card overflow-hidden group cursor-pointer" onClick={() => audioUrl && audio.playTrack({ id: p.id, title: p.title, creator: p.profiles?.full_name || 'Unknown', coverUrl: coverPodcast, audioUrl })}>
        <div className="relative aspect-video">
          <img src={coverPodcast} alt={p.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Play className="w-8 h-8 text-foreground" />
          </div>
          <div className="absolute bottom-2 right-2 bg-background/80 px-1.5 py-0.5 rounded text-xs">{dur}</div>
        </div>
        <div className="p-3">
          <p className="font-medium text-sm line-clamp-2">{p.title}</p>
          <p className="text-xs text-muted-foreground mt-1">{p.profiles?.full_name || 'Unknown'} · {formatNum(p.likes_count || 0)} likes</p>
        </div>
      </div>
    );
  };

  return (
    <Layout showPlayer>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search people or podcasts..."
            className="pl-12 py-6 text-base"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); handleSearch(e.target.value); }}
          />
        </div>

        {loading && <div className="text-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary mx-auto" /></div>}

        {searched && !loading ? (
          <div className="space-y-8">
            {/* People results */}
            {userResults.length > 0 && (
              <section>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-primary" />People</h2>
                <div className="space-y-3">
                  {userResults.map(u => <UserCard key={u.id} u={u} />)}
                </div>
              </section>
            )}
            {/* Podcast results */}
            {podcastResults.length > 0 && (
              <section>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Headphones className="w-5 h-5 text-primary" />Podcasts</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {podcastResults.map(p => <PodcastCard key={p.id} p={p} />)}
                </div>
              </section>
            )}
            {userResults.length === 0 && podcastResults.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No results for "{searchQuery}"</p>
              </div>
            )}
          </div>
        ) : !searched ? (
          <div className="space-y-10">
            {/* Suggested Creators */}
            {suggestedUsers.length > 0 && (
              <section>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><UserPlus className="w-5 h-5 text-primary" />Suggested Creators</h2>
                <div className="space-y-3">
                  {suggestedUsers.map(u => <UserCard key={u.id} u={u} />)}
                </div>
              </section>
            )}
            {/* Trending Podcasts */}
            {trending.length > 0 && (
              <section>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" />Trending Podcasts</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {trending.map(p => <PodcastCard key={p.id} p={p} />)}
                </div>
              </section>
            )}
          </div>
        ) : null}
      </div>
    </Layout>
  );
};

export default Discover;
