import { useState, useEffect } from "react";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import {
    Play, Pause, Heart, MessageSquare, Share2,
    ArrowLeft, Calendar, Clock, Headphones, User,
    MoreHorizontal
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useAudio } from "@/contexts/AudioContext";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PodcastData {
    id: string;
    title: string;
    description: string;
    user_caption?: string;
    cover_url: string;
    estimated_duration: number;
    created_at: string;
    likes_count: number;
    comments_count: number;
    user_id: string;
    audio_url?: string;
    profiles: {
        full_name: string;
        username: string;
        avatar_url: string;
    };
}

const PodcastDetail = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const audio = useAudio();
    const [podcast, setPodcast] = useState<PodcastData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isLiked, setIsLiked] = useState(false);

    useEffect(() => {
        if (!id) return;

        const fetchPodcast = async () => {
            try {
                const { data, error } = await supabase
                    .from('podcasts')
                    .select('*, audio_files(file_url), profiles(*)')
                    .eq('id', id)
                    .single();

                if (error) throw error;

                const formatted: PodcastData = {
                    ...data,
                    audio_url: data.audio_files?.[0]?.file_url,
                    cover_url: data.cover_url || "https://images.unsplash.com/photo-1620321023374-d1a1901c5cc1?q=80&w=600&h=400&auto=format&fit=crop"
                };
                setPodcast(formatted);

                if (user) {
                    const { data: like } = await supabase
                        .from('podcast_likes')
                        .select('id')
                        .eq('podcast_id', id)
                        .eq('user_id', user.id)
                        .single();
                    setIsLiked(!!like);
                }
            } catch (err: any) {
                console.error(err);
                toast.error("Could not load podcast");
            } finally {
                setLoading(false);
            }
        };

        fetchPodcast();

        // Real-time synchronization
        const podcastChannel = supabase
            .channel(`podcast-detail-${id}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'podcasts',
                filter: `id=eq.${id}`
            }, (payload: any) => {
                setPodcast(prev => prev ? {
                    ...prev,
                    likes_count: payload.new.likes_count,
                    comments_count: payload.new.comments_count,
                    title: payload.new.title,
                    user_caption: payload.new.user_caption,
                    description: payload.new.description,
                    cover_url: payload.new.cover_url || prev.cover_url
                } : null);
            })
            .subscribe();

        let likeChannel: any;
        if (user && id) {
            likeChannel = supabase
                .channel(`podcast-like-detail-${id}-${user.id}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'podcast_likes',
                    filter: `podcast_id=eq.${id}&user_id=eq.${user.id}`
                }, (payload: any) => {
                    if (payload.eventType === 'INSERT') {
                        setIsLiked(true);
                    } else if (payload.eventType === 'DELETE') {
                        setIsLiked(false);
                    }
                })
                .subscribe();
        }

        return () => {
            supabase.removeChannel(podcastChannel);
            if (likeChannel) supabase.removeChannel(likeChannel);
        };
    }, [id, user]);

    const handleLike = async () => {
        if (!user) { toast.error("Sign in to like"); return; }
        if (!podcast) return;

        // Optimistic update
        const wasLiked = isLiked;
        setIsLiked(!wasLiked);
        setPodcast(prev => prev ? { ...prev, likes_count: prev.likes_count + (wasLiked ? -1 : 1) } : null);

        try {
            if (wasLiked) {
                await supabase.from('podcast_likes').delete().eq('podcast_id', podcast.id).eq('user_id', user.id);
            } else {
                await supabase.from('podcast_likes').insert({ podcast_id: podcast.id, user_id: user.id });
                if (user.id !== podcast.user_id) {
                    await supabase.from('notifications').insert({ user_id: podcast.user_id, actor_id: user.id, type: 'like', message: 'liked your podcast' });
                }
            }
        } catch (err) {
            setIsLiked(wasLiked); // rollback
            setPodcast(prev => prev ? { ...prev, likes_count: prev.likes_count + (wasLiked ? 1 : -1) } : null);
        }
    };

    const handlePlay = () => {
        if (!podcast || !podcast.audio_url) return;
        audio.playTrack({
            id: podcast.id,
            title: podcast.title,
            creator: podcast.profiles.full_name,
            coverUrl: podcast.cover_url,
            audioUrl: podcast.audio_url
        });
    };

    const handleShare = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard!");
    };

    if (loading) return <Layout showPlayer><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" /></div></Layout>;
    if (!podcast) return <Layout showPlayer><div className="text-center py-20 text-muted-foreground">Podcast not found</div></Layout>;

    const isPlaying = audio.playingId === podcast.id && audio.isPlaying;

    return (
        <Layout showPlayer>
            <div className="container mx-auto px-4 py-8">
                <Button variant="ghost" className="mb-6 gap-2 -ml-2 text-muted-foreground hover:text-foreground" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                </Button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6 md:space-y-8">
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="w-full max-w-[240px] mx-auto md:mx-0 md:max-w-none md:w-64 aspect-square rounded-2xl overflow-hidden shadow-elevated shrink-0">
                                <img src={podcast.cover_url} alt={podcast.title} className="w-full h-full object-cover" />
                            </div>

                            <div className="flex-1 flex flex-col justify-end text-center md:text-left items-center md:items-start">
                                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                                    <Badge variant="secondary" className="bg-primary/10 text-primary border-none">Podcast</Badge>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {Math.floor(podcast.estimated_duration / 60)}:{(podcast.estimated_duration % 60).toString().padStart(2, '0')}
                                    </span>
                                </div>
                                <h1 className="text-2xl md:text-4xl font-display font-bold mb-3 md:mb-4 px-4 md:px-0">{podcast.title}</h1>

                                <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
                                    <RouterLink to={`/profile/${podcast.user_id}`} className="flex items-center gap-2 group">
                                        <img src={podcast.profiles.avatar_url || "https://images.unsplash.com/photo-1531297172866-cb8d50582515?w=50&h=50&fit=crop"} className="w-8 h-8 rounded-full object-cover" />
                                        <span className="font-medium text-sm group-hover:underline">{podcast.profiles.full_name}</span>
                                    </RouterLink>
                                    <span className="text-muted-foreground text-sm">·</span>
                                    <span className="text-muted-foreground text-sm">{formatDistanceToNow(new Date(podcast.created_at), { addSuffix: true })}</span>
                                </div>

                                <div className="flex flex-col sm:flex-row flex-wrap justify-center md:justify-start gap-3 w-full sm:w-auto px-6 sm:px-0">
                                    <Button size="lg" className="rounded-full gap-2 px-8 shadow-glow w-full sm:w-auto" onClick={handlePlay}>
                                        {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                                        <span>{isPlaying ? 'Pause' : 'Play Now'}</span>
                                    </Button>
                                    <div className="flex gap-3 w-full sm:w-auto">
                                        <Button size="lg" variant="secondary" className="rounded-full gap-2 px-6 flex-1 sm:flex-none" onClick={handleLike}>
                                            <Heart className={cn("w-5 h-5", isLiked && "fill-primary text-primary")} />
                                            <span>{podcast.likes_count}</span>
                                        </Button>
                                        <Button size="lg" variant="secondary" className="rounded-full gap-2 px-6 flex-1 sm:flex-none" onClick={handleShare}>
                                            <Share2 className="w-5 h-5" />
                                            <span>Share</span>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator className="bg-border/50" />

                        <div className="space-y-4">
                            <h2 className="text-xl font-bold">About this podcast</h2>
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {podcast.user_caption || podcast.description}
                            </p>
                        </div>

                        {/* Placeholder for Comments */}
                        <div className="space-y-6 pt-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5" />
                                    Comments ({podcast.comments_count})
                                </h2>
                            </div>
                            <div className="glass-card p-6 text-center text-muted-foreground bg-white/5">
                                Join the conversation below.
                                <p className="text-xs mt-2 italic">(Comments section shared with Feed component logic)</p>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar / More from user */}
                    <div className="space-y-6">
                        <div className="glass-card p-6">
                            <h3 className="font-bold mb-4">Quick Stats</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground flex items-center gap-2"><Headphones className="w-4 h-4" /> Total Plays</span>
                                    <span className="font-medium">1,234</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground flex items-center gap-2"><Heart className="w-4 h-4" /> Likes</span>
                                    <span className="font-medium">{podcast.likes_count}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground flex items-center gap-2"><Calendar className="w-4 h-4" /> Published</span>
                                    <span className="font-medium">{new Date(podcast.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card p-6">
                            <h3 className="font-bold mb-4">Host</h3>
                            <div className="flex items-center gap-4 mb-4">
                                <img src={podcast.profiles.avatar_url} className="w-12 h-12 rounded-xl object-cover" />
                                <div>
                                    <p className="font-bold text-sm">{podcast.profiles.full_name}</p>
                                    <p className="text-xs text-muted-foreground">@{podcast.profiles.username}</p>
                                </div>
                            </div>
                            <Button variant="outline" className="w-full text-xs h-8" asChild>
                                <RouterLink to={`/profile/${podcast.user_id}`}>View Profile</RouterLink>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default PodcastDetail;
