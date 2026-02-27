import { useState, useEffect } from "react";
import { Play, Heart, MessageSquare, UserPlus, UserCheck, Headphones, Users, Shield, Grid3x3, List, Pause, Mic, Music2, Radio } from "lucide-react";
import { motion as _motion } from "framer-motion";

const FloatingIcon = ({ icon: Icon, style, delay }: { icon: any; style: string; delay: number }) => (
    <_motion.div
        className={`absolute opacity-[0.06] text-primary pointer-events-none ${style}`}
        animate={{ y: [0, -12, 0], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 6 + delay, repeat: Infinity, ease: "easeInOut", delay }}
    >
        <Icon className="w-12 h-12" />
    </_motion.div>
);
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
import { motion } from "framer-motion";

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
    const coverPodcast = "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400&h=400&fit=crop";

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

        const profileChannel = supabase.channel(`profile-${userId}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
                (payload) => setProfile(payload.new))
            .subscribe();

        const podcastChannel = supabase.channel('public:podcasts')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'podcasts' }, (payload: any) => {
                const updated = payload.new;
                const updateLists = (list: any[]) =>
                    list.map(p => p.id === updated.id ? { ...p, likes_count: updated.likes_count, title: updated.title, cover_url: updated.cover_url || p.cover_url } : p);
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
        } else {
            await supabase.from('user_follows').insert({ follower_id: user.id, following_id: userId });
            setIsFollowing(true);
            await supabase.from('notifications').insert({ user_id: userId, actor_id: user.id, type: 'follow', message: 'started following you' });
        }
    };

    const startDM = async () => {
        if (!user || !userId) return;
        const p1 = user.id < userId ? user.id : userId;
        const p2 = user.id < userId ? userId : user.id;
        const { data } = await supabase.from('conversations')
            .upsert({ participant_1: p1, participant_2: p2 }, { onConflict: 'participant_1,participant_2' })
            .select().single();
        if (data) navigate(`/messages?conv=${data.id}`);
        else toast.error("Could not start conversation");
    };

    if (isOwnProfile) { navigate('/profile'); return null; }
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
    if (!profile) return <Layout showPlayer><div className="text-center py-20 text-muted-foreground">User not found</div></Layout>;

    const displayName = profile.full_name || `User ${userId?.substring(0, 8)}`;
    const username = profile.username || 'user_' + userId?.substring(0, 8);
    const isPrivateAndRestricted = profile?.is_private && !isFollowing && !isOwnProfile;

    const PodList = ({ items }: { items: any[] }) => {
        const handlePlay = (e: React.MouseEvent, p: any) => {
            e.stopPropagation();
            if (!p.audioUrl) return;
            const playlist = items.map(item => ({ id: item.id, title: item.title || 'Untitled', creator: displayName, coverUrl: item.cover_url || coverPodcast, audioUrl: item.audioUrl || "" }));
            audio.playTrack({ id: p.id, title: p.title || 'Untitled', creator: displayName, coverUrl: p.cover_url || coverPodcast, audioUrl: p.audioUrl }, playlist);
        };

        if (items.length === 0) return (
            <div className="text-center py-20 text-muted-foreground/40">
                <Headphones className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium text-sm">No podcasts yet</p>
            </div>
        );

        return viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((p: any, i: number) => {
                    const isPlaying = audio.playingId === p.id && audio.isPlaying;
                    return (
                        <motion.div
                            key={p.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="group cursor-pointer rounded-2xl overflow-hidden bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300"
                            onClick={() => navigate(`/podcast/${p.id}`)}
                        >
                            <div className="relative aspect-square overflow-hidden">
                                <img src={p.cover_url || coverPodcast} alt={p.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                    <button
                                        onClick={(e) => handlePlay(e, p)}
                                        className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-300"
                                    >
                                        {isPlaying ? <Pause className="w-5 h-5 text-black fill-current" /> : <Play className="w-5 h-5 text-black fill-current ml-0.5" />}
                                    </button>
                                </div>
                                <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md text-[9px] font-bold px-2 py-0.5 rounded-full border border-white/10">
                                    {p.durationStr}
                                </div>
                                {isPlaying && (
                                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-primary/90 px-2 py-0.5 rounded-full">
                                        <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                                        <span className="text-black text-[9px] font-black">PLAYING</span>
                                    </div>
                                )}
                            </div>
                            <div className="p-3">
                                <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">{p.title || 'Untitled'}</p>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <Heart className="w-3 h-3 text-muted-foreground/50" />
                                    <span className="text-[10px] text-muted-foreground/50 font-medium">{formatNum(p.likes_count || 0)}</span>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        ) : (
            <div className="space-y-2 max-w-2xl">
                {items.map((p: any, i: number) => {
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
                                <img src={p.cover_url || coverPodcast} alt={p.title} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity" onClick={(e) => handlePlay(e, p)}>
                                    {isPlaying ? <Pause className="w-4 h-4 text-white fill-current" /> : <Play className="w-4 h-4 text-white fill-current ml-0.5" />}
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">{p.title || 'Untitled'}</p>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-[10px] text-muted-foreground/50 font-medium">{p.durationStr}</span>
                                    <span className="flex items-center gap-1">
                                        <Heart className="w-3 h-3 text-muted-foreground/50" />
                                        <span className="text-[10px] text-muted-foreground/50">{formatNum(p.likes_count || 0)}</span>
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        );
    };

    return (
        <Layout showPlayer>
            <div className="relative min-h-screen">
                {/* Ambient background glows */}
                <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[120px] -z-10" />
                <div className="absolute top-0 right-1/4 w-[400px] h-[300px] bg-accent/5 rounded-full blur-[100px] -z-10" />

                {/* Glossy Animated Hero Banner */}
                <div className="relative h-52 md:h-64 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0d1f1c] via-[#0A0A0A] to-[#1a1008]" />
                    <div className="absolute top-0 left-1/4 w-80 h-80 bg-primary/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
                    <div className="absolute top-0 right-1/4 w-80 h-80 bg-accent/15 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
                    <div className="absolute bottom-0 left-1/2 w-60 h-40 bg-primary/10 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '0.5s' }} />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(61,218,186,0.07)_0%,transparent_70%)]" />
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                    <FloatingIcon icon={Headphones} style="top-6 left-12" delay={0} />
                    <FloatingIcon icon={Mic} style="top-4 left-1/3" delay={1.2} />
                    <FloatingIcon icon={Music2} style="top-8 left-1/2" delay={2.5} />
                    <FloatingIcon icon={Radio} style="top-3 right-1/3" delay={0.7} />
                    <FloatingIcon icon={Headphones} style="top-6 right-16" delay={3} />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                </div>

                <div className="container mx-auto px-4 md:px-8 max-w-6xl -mt-24 relative z-10 pb-32">
                    {/* Profile Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row md:items-end gap-6 mb-10"
                    >
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <div className="w-28 h-28 md:w-36 md:h-36 rounded-[2rem] p-[3px] bg-gradient-to-br from-primary/60 via-accent/40 to-primary/20 shadow-2xl">
                                <img
                                    src={profile.avatar_url || avatarPlaceholder}
                                    alt={displayName}
                                    className="w-full h-full rounded-[1.75rem] object-cover border-2 border-[#0A0A0A]"
                                />
                            </div>
                            <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-[#0A0A0A] rounded-full border border-white/10 flex items-center justify-center">
                                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
                            </div>
                        </div>

                        {/* Name & Stats */}
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-1">
                                <h1 className="text-2xl md:text-4xl font-black tracking-tight">{displayName}</h1>
                                {profile.niche && (
                                    <Badge variant="outline" className="rounded-full bg-primary/10 border-primary/20 text-primary text-[10px] font-bold px-3 uppercase tracking-wider">
                                        {profile.niche}
                                    </Badge>
                                )}
                            </div>
                            <p className="text-muted-foreground/60 text-sm font-medium mb-3">@{username}</p>
                            {profile.bio && <p className="text-sm text-muted-foreground/80 mb-4 max-w-md leading-relaxed">{profile.bio}</p>}

                            {/* Stats Row */}
                            <div className="flex flex-wrap gap-6">
                                <UserListModal userId={userId || ''} type="followers" isOpen={showFollowers} onClose={() => setShowFollowers(false)} />
                                <button
                                    className="flex flex-col items-start hover:opacity-80 transition-opacity"
                                    onClick={() => !isPrivateAndRestricted && setShowFollowers(true)}
                                >
                                    <span className="text-xl font-black tracking-tight">{formatNum(profile.followers_count || 0)}</span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Followers</span>
                                </button>

                                <UserListModal userId={userId || ''} type="following" isOpen={showFollowing} onClose={() => setShowFollowing(false)} />
                                <button
                                    className="flex flex-col items-start hover:opacity-80 transition-opacity"
                                    onClick={() => !isPrivateAndRestricted && setShowFollowing(true)}
                                >
                                    <span className="text-xl font-black tracking-tight">{formatNum(profile.following_count || 0)}</span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Following</span>
                                </button>

                                <div className="flex flex-col items-start">
                                    <span className="text-xl font-black tracking-tight">{podcasts.length}</span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Podcasts</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3 shrink-0">
                            <Button
                                variant="outline"
                                className="gap-2 rounded-full border-white/10 bg-white/[0.03] hover:bg-white/[0.08] backdrop-blur-sm"
                                onClick={startDM}
                            >
                                <MessageSquare className="w-4 h-4" />
                                <span className="hidden sm:inline font-semibold">Message</span>
                            </Button>

                            <div className="relative group/btn">
                                {!isFollowing && (
                                    <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#3DDABA] to-[#F19861] blur-md opacity-0 group-hover/btn:opacity-40 transition-opacity" />
                                )}
                                <Button
                                    onClick={handleFollow}
                                    className={cn(
                                        "relative rounded-full px-6 gap-2 font-bold transition-all",
                                        isFollowing
                                            ? "bg-white/5 border border-white/10 hover:bg-white/10 text-foreground"
                                            : "bg-gradient-to-r from-[#3DDABA] to-[#F19861] text-black border-none hover:brightness-110"
                                    )}
                                >
                                    {isFollowing
                                        ? <><UserCheck className="w-4 h-4" />Following</>
                                        : <><UserPlus className="w-4 h-4" />Follow</>
                                    }
                                </Button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Content */}
                    {isPrivateAndRestricted ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card p-16 text-center rounded-[3rem] bg-white/[0.01] border-white/5"
                        >
                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                                <Shield className="w-10 h-10 text-muted-foreground/30" />
                            </div>
                            <h3 className="text-xl font-black mb-2">Private Account</h3>
                            <p className="text-muted-foreground/60 text-sm max-w-xs mx-auto">Follow {displayName} to see their podcasts and activity.</p>
                        </motion.div>
                    ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                            <Tabs defaultValue="podcasts" className="w-full">
                                <div className="flex items-center justify-between mb-6">
                                    <TabsList className="bg-white/[0.03] border border-white/5 rounded-full p-1 h-auto gap-1">
                                        <TabsTrigger
                                            value="podcasts"
                                            className="rounded-full text-xs font-bold px-5 py-2 data-[state=active]:bg-white/10 data-[state=active]:text-foreground text-muted-foreground/60 transition-all"
                                        >
                                            <Headphones className="w-3.5 h-3.5 mr-2" />Podcasts ({podcasts.length})
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="liked"
                                            className="rounded-full text-xs font-bold px-5 py-2 data-[state=active]:bg-white/10 data-[state=active]:text-foreground text-muted-foreground/60 transition-all"
                                        >
                                            <Heart className="w-3.5 h-3.5 mr-2" />Liked ({likedPodcasts.length})
                                        </TabsTrigger>
                                    </TabsList>

                                    <div className="flex items-center gap-1 bg-white/[0.03] border border-white/5 rounded-full p-1">
                                        <button
                                            onClick={() => setViewMode("grid")}
                                            className={cn("p-2 rounded-full transition-all", viewMode === "grid" ? "bg-white/10 text-foreground" : "text-muted-foreground/40 hover:text-muted-foreground")}
                                        >
                                            <Grid3x3 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => setViewMode("list")}
                                            className={cn("p-2 rounded-full transition-all", viewMode === "list" ? "bg-white/10 text-foreground" : "text-muted-foreground/40 hover:text-muted-foreground")}
                                        >
                                            <List className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                <TabsContent value="podcasts" className="mt-0"><PodList items={podcasts} /></TabsContent>
                                <TabsContent value="liked" className="mt-0"><PodList items={likedPodcasts} /></TabsContent>
                            </Tabs>
                        </motion.div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default UserProfile;
