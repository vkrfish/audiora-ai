import { useState, useEffect } from "react";
import { Bookmark, Play, Heart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useAudio } from "@/contexts/AudioContext";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Waveform from "@/components/audio/Waveform";

interface SavedPodcast {
    saveId: string;
    id: string;
    title: string;
    description?: string;
    createdAt: string;
    audioUrl?: string;
    durationStr: string;
    likes: number;
}

const Saved = () => {
    const [savedPodcasts, setSavedPodcasts] = useState<SavedPodcast[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const audio = useAudio();

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        const fetchSaved = async () => {
            if (!user) return;
            const { data, error } = await supabase
                .from('saved_podcasts')
                .select(`
          id,
          podcast_id,
          created_at,
          podcasts (
            id, title, description, estimated_duration, likes_count, created_at,
            audio_files ( file_url )
          )
        `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) { console.error(error); setLoading(false); return; }

            const formatted = (data || []).map((item: any) => ({
                saveId: item.id,
                id: item.podcasts.id,
                title: item.podcasts.title || "Untitled",
                description: item.podcasts.description,
                createdAt: formatDistanceToNow(new Date(item.podcasts.created_at), { addSuffix: true }),
                audioUrl: item.podcasts.audio_files?.[0]?.file_url,
                durationStr: formatDuration(item.podcasts.estimated_duration || 0),
                likes: item.podcasts.likes_count || 0,
            }));
            setSavedPodcasts(formatted);
            setLoading(false);
        };
        fetchSaved();
    }, [user]);

    const handleUnsave = async (saveId: string, podcastId: string) => {
        await supabase.from('saved_podcasts').delete().eq('id', saveId);
        setSavedPodcasts(prev => prev.filter(p => p.saveId !== saveId));
        toast.success("Removed from saved");
    };

    return (
        <Layout showPlayer>
            <div className="container mx-auto px-4 py-6 max-w-2xl">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                        <Bookmark className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold gradient-text">Saved Podcasts</h1>
                        <p className="text-sm text-muted-foreground">{savedPodcasts.length} saved</p>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto" />
                    </div>
                ) : savedPodcasts.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground">
                        <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-medium mb-1">Nothing saved yet</p>
                        <p className="text-sm">Tap the bookmark icon on any podcast to save it here.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {savedPodcasts.map((podcast) => {
                            const isPlaying = audio.playingId === podcast.id && audio.isPlaying;
                            const isLoaded = audio.playingId === podcast.id;

                            return (
                                <div key={podcast.saveId} className="glass-card p-4 flex gap-4 items-center">
                                    {/* Play Button */}
                                    <div
                                        className="relative shrink-0 cursor-pointer group w-16 h-16 rounded-xl bg-secondary/50 flex items-center justify-center"
                                        onClick={() => {
                                            if (!podcast.audioUrl) { toast.error("No audio available"); return; }
                                            audio.playTrack({
                                                id: podcast.id,
                                                title: podcast.title,
                                                creator: "Audiora",
                                                coverUrl: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400&h=400&fit=crop",
                                                audioUrl: podcast.audioUrl,
                                            });
                                        }}
                                    >
                                        {isLoaded && isPlaying ? (
                                            <Waveform isPlaying barCount={4} className="h-5" />
                                        ) : (
                                            <Play className={cn("w-7 h-7 ml-0.5", isLoaded ? "text-primary" : "text-muted-foreground group-hover:text-primary transition-colors")} />
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold truncate">{podcast.title}</h3>
                                        {podcast.description && (
                                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{podcast.description}</p>
                                        )}
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <span className="text-xs text-muted-foreground">{podcast.durationStr}</span>
                                            <span className="text-xs text-muted-foreground">·</span>
                                            <span className="text-xs text-muted-foreground">{podcast.createdAt}</span>
                                            <div className="flex items-center gap-1">
                                                <Heart className="w-3 h-3 text-muted-foreground" />
                                                <span className="text-xs text-muted-foreground">{podcast.likes}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Unsave */}
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        className="shrink-0 text-muted-foreground hover:text-destructive"
                                        onClick={() => handleUnsave(podcast.saveId, podcast.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Saved;
