import { useState, useEffect } from "react";
import { Play, Heart, MessageSquare, UserPlus, UserCheck, Headphones, Users, Shield, Grid, List } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useAudio } from "@/contexts/AudioContext";
import { toast } from "sonner";
import { UserListModal } from "@/components/modals/UserListModal";

const formatNum = (n: number) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

const UserProfile = () => {
    const { userId } = useParams<{ userId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const audio = useAudio();
    const [profile, setProfile] = useState<any>(null);
    const [podcasts, setPodcasts] = useState<any[]>([]);
    const [likedPodcasts, setLikedPodcasts] = useState<any[]>([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [showFollowers, setShowFollowers] = useState(false);
    const [showFollowing, setShowFollowing] = useState(false);
    const [loading, setLoading] = useState(true);

    const isOwnProfile = user?.id === userId;
    const avatarPlaceholder = "https://images.unsplash.com/photo-1531297172866-cb8d50582515?w=400&h=400&fit=crop";
    const coverPlaceholder = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=400&fit=crop";
    const coverPodcast = "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=400&fit=crop";

    useEffect(() => {
        if (!userId) return;
        const fetchAll = async () => {
            const [{ data: prof }, { data: pods }, { data: liked }] = await Promise.all([
                supabase.from('profiles').select('*').eq('id', userId).single(),
                supabase.from('podcasts').select('id, title, estimated_duration, likes_count, created_at, cover_url, audio_files(file_url)')
                    .eq('user_id', userId).order('created_at', { ascending: false }),
                supabase.from('podcast_likes').select('podcast_id, podcasts(id, title, estimated_duration, likes_count, created_at, cover_url, audio_files(file_url))')
                    .eq('user_id', userId)
            ]);

            let following = false;
            if (user && !isOwnProfile) {
                const { data: f } = await supabase.from('user_follows')
                    .select('id').eq('follower_id', user.id).eq('following_id', userId).single();
                following = !!f;
            }

            setProfile(prof);
            setIsFollowing(following);
            const fmtDur = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
            setPodcasts((pods || []).map((p: any) => ({ ...p, durationStr: fmtDur(p.estimated_duration || 0), audioUrl: p.audio_files?.[0]?.file_url })));
            setLikedPodcasts((liked || []).filter((l: any) => l.podcasts).map((l: any) => ({ ...l.podcasts, durationStr: fmtDur(l.podcasts.estimated_duration || 0), audioUrl: l.podcasts.audio_files?.[0]?.file_url })));
            setLoading(false);
        };
        fetchAll();

        // Real-time synchronization
        const profileChannel = supabase.channel(`profile-${userId}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
                (payload) => setProfile(payload.new))
            .subscribe();

        const podcastChannel = supabase.channel('public:podcasts')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'podcasts' }, (payload: any) => {
                const updated = payload.new;
                const updateLists = (list: any[]) =>
                    list.map(p => p.id === updated.id ? {
                        ...p,
                        likes_count: updated.likes_count,
                        title: updated.title,
                        cover_url: updated.cover_url || p.cover_url
                    } : p);

                setPodcasts(prev => updateLists(prev));
                setLikedPodcasts(prev => updateLists(prev));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(profileChannel);
            supabase.removeChannel(podcastChannel);
        };
    }, [userId, user]);

    const handleFollow = async () => {
        if (!user) { toast.error("Sign in to follow"); return; }
        if (isFollowing) {
            await supabase.from('user_follows').delete().eq('follower_id', user.id).eq('following_id', userId!);
            setIsFollowing(false);
            // Count is now handled by DB triggers, but we can optimistically update to match UI if needed
            // However, the subscription above will catch it nearly instantly.
        } else {
            await supabase.from('user_follows').insert({ follower_id: user.id, following_id: userId });
            setIsFollowing(true);
            // Notify
            await supabase.from('notifications').insert({ user_id: userId, actor_id: user.id, type: 'follow', message: 'started following you' });
        }
    };

    const startDM = async () => {
        if (!user || !userId) return;
        const p1 = user.id < userId ? user.id : userId;
        const p2 = user.id < userId ? userId : user.id;
        const { data, error } = await supabase.from('conversations')
            .upsert({ participant_1: p1, participant_2: p2 }, { onConflict: 'participant_1,participant_2' })
            .select().single();
        if (data) navigate(`/messages?conv=${data.id}`);
        else toast.error("Could not start conversation");
    };

    if (isOwnProfile) { navigate('/profile'); return null; }
    if (loading) return <Layout showPlayer><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" /></div></Layout>;
    if (!profile) return <Layout showPlayer><div className="text-center py-20 text-muted-foreground">User not found</div></Layout>;

    const displayName = profile.full_name || `User ${userId?.substring(0, 8)}`;
    const username = profile.username || 'user_' + userId?.substring(0, 8);

    const PodList = ({ items }: { items: any[] }) => {
        const handlePlay = (e: React.MouseEvent, p: any) => {
            e.stopPropagation();
            if (!p.audioUrl) return;

            const playlist = items.map(item => ({
                id: item.id,
                title: item.title || 'Untitled',
                creator: displayName,
                coverUrl: item.cover_url || coverPodcast,
                audioUrl: item.audioUrl || ""
            }));

            audio.playTrack({
                id: p.id,
                title: p.title || 'Untitled',
                creator: displayName,
                coverUrl: p.cover_url || coverPodcast,
                audioUrl: p.audioUrl
            }, playlist);
        };

        return items.length === 0
            ? <div className="text-center py-12 text-muted-foreground">No podcasts yet</div>
            : (
                <div className={cn("grid gap-4", viewMode === "grid" ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "grid-cols-1 max-w-2xl")}>
                    {items.map((p: any) => (
                        <div key={p.id} className={cn("glass-card overflow-hidden group cursor-pointer", viewMode === "list" && "flex gap-4 items-center p-3")}
                            onClick={() => navigate(`/podcast/${p.id}`)}>
                            <div className={cn("relative", viewMode === "grid" ? "aspect-square" : "w-14 h-14 shrink-0 rounded-xl overflow-hidden")}>
                                <img src={p.cover_url || coverPodcast} alt={p.title} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="rounded-full bg-primary/20 hover:bg-primary/40"
                                        onClick={(e) => handlePlay(e, p)}
                                    >
                                        <Play className="w-6 h-6 text-foreground" />
                                    </Button>
                                </div>
                            </div>
                            <div className={cn(viewMode === "grid" ? "p-3" : "flex-1 min-w-0")}>
                                <p className="font-medium text-sm truncate hover:text-primary transition-colors">{p.title || 'Untitled'}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-muted-foreground">{p.durationStr}</span>
                                    <Heart className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">{formatNum(p.likes_count || 0)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            );
    };

    const isPrivateAndRestricted = profile?.is_private && !isFollowing && !isOwnProfile;

    return (
        <Layout showPlayer>
            <div className="relative h-48 md:h-64 overflow-hidden">
                <img src={profile.cover_url || coverPlaceholder} alt="Cover" className="w-full h-full object-cover opacity-50" />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
            </div>

            <div className="container mx-auto px-4 -mt-20 relative z-10">
                <div className="flex flex-col md:flex-row md:items-end gap-6 mb-8">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden ring-4 ring-background shadow-elevated">
                        <img src={profile.avatar_url || avatarPlaceholder} alt={displayName} className="w-full h-full object-cover" />
                    </div>

                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-1">
                            <h1 className="font-display text-2xl md:text-3xl font-bold">{displayName}</h1>
                            {profile.niche && <Badge variant="secondary">{profile.niche}</Badge>}
                        </div>
                        <p className="text-muted-foreground mb-2">@{username}</p>
                        {profile.bio && <p className="text-sm text-muted-foreground mb-4 max-w-lg">{profile.bio}</p>}
                        <div className="flex flex-wrap gap-6">
                            <UserListModal
                                userId={userId || ''}
                                type="followers"
                                isOpen={showFollowers}
                                onClose={() => setShowFollowers(false)}
                            />
                            <div
                                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => !isPrivateAndRestricted && setShowFollowers(true)}
                            >
                                <Users className="w-4 h-4 text-muted-foreground" />
                                <span className="font-semibold">{formatNum(profile.followers_count || 0)}</span>
                                <span className="text-muted-foreground text-sm hover:underline">followers</span>
                            </div>

                            <UserListModal
                                userId={userId || ''}
                                type="following"
                                isOpen={showFollowing}
                                onClose={() => setShowFollowing(false)}
                            />
                            <div
                                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => !isPrivateAndRestricted && setShowFollowing(true)}
                            >
                                <span className="font-semibold">{formatNum(profile.following_count || 0)}</span>
                                <span className="text-muted-foreground text-sm hover:underline">following</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Headphones className="w-4 h-4 text-muted-foreground" />
                                <span className="font-semibold">{podcasts.length}</span>
                                <span className="text-muted-foreground text-sm">podcasts</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button variant="outline" className="gap-2" onClick={startDM}>
                            <MessageSquare className="w-4 h-4" />
                            <span>Message</span>
                        </Button>
                        <Button variant={isFollowing ? "outline" : "hero"} onClick={handleFollow}>
                            {isFollowing ? <><UserCheck className="w-4 h-4 mr-2" />Following</> : <><UserPlus className="w-4 h-4 mr-2" />Follow</>}
                        </Button>
                    </div>
                </div>

                {isPrivateAndRestricted ? (
                    <div className="glass-card p-12 text-center">
                        <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">This account is private</h3>
                        <p className="text-muted-foreground">Follow {displayName} to see their podcasts and activity.</p>
                    </div>
                ) : (
                    <Tabs defaultValue="podcasts" className="w-full">
                        <div className="flex items-center justify-between border-b border-border mb-6">
                            <TabsList className="bg-transparent h-auto p-0">
                                <TabsTrigger value="podcasts" className="data-[state=active]:border-primary border-b-2 border-transparent rounded-none pb-3 px-4">Podcasts ({podcasts.length})</TabsTrigger>
                                <TabsTrigger value="liked" className="data-[state=active]:border-primary border-b-2 border-transparent rounded-none pb-3 px-4"><Heart className="w-4 h-4 mr-2" />Liked ({likedPodcasts.length})</TabsTrigger>
                            </TabsList>
                            <div className="hidden sm:flex items-center gap-1 pb-3">
                                <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon-sm" onClick={() => setViewMode("grid")}><Grid className="w-4 h-4" /></Button>
                                <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon-sm" onClick={() => setViewMode("list")}><List className="w-4 h-4" /></Button>
                            </div>
                        </div>
                        <TabsContent value="podcasts" className="mt-0"><PodList items={podcasts} /></TabsContent>
                        <TabsContent value="liked" className="mt-0"><PodList items={likedPodcasts} /></TabsContent>
                    </Tabs>
                )}
            </div>
        </Layout>
    );
};

export default UserProfile;
