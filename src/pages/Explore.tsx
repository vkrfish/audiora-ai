import { useState, useEffect, useCallback } from "react";
import { Search, X, Play, Heart, MessageCircle, Pause } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useAudio } from "@/contexts/AudioContext";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const CATEGORIES = [
    { id: "all", label: "All" },
    { id: "technology", label: "Technology" },
    { id: "business", label: "Business" },
    { id: "lifestyle", label: "Lifestyle" },
    { id: "education", label: "Education" },
    { id: "health", label: "Health & Wellness" },
    { id: "entertainment", label: "Entertainment" },
    { id: "science", label: "Science" },
    { id: "arts", label: "Arts & Culture" },
    { id: "general", label: "General" },
];

// Masonry tile sizes for variation like Instagram
const SIZES = [
    "col-span-1 row-span-1",
    "col-span-1 row-span-2",
    "col-span-1 row-span-1",
    "col-span-1 row-span-1",
    "col-span-2 row-span-1",
    "col-span-1 row-span-1",
    "col-span-1 row-span-1",
    "col-span-1 row-span-2",
    "col-span-1 row-span-1",
];

// Vibrant gradient overlays for visual variety
const GRADIENTS = [
    "from-purple-900/80 via-purple-900/40 to-transparent",
    "from-blue-900/80 via-blue-900/40 to-transparent",
    "from-emerald-900/80 via-emerald-900/40 to-transparent",
    "from-rose-900/80 via-rose-900/40 to-transparent",
    "from-amber-900/80 via-amber-900/40 to-transparent",
    "from-cyan-900/80 via-cyan-900/40 to-transparent",
    "from-violet-900/80 via-violet-900/40 to-transparent",
    "from-teal-900/80 via-teal-900/40 to-transparent",
];

const COVERS = [
    "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1509909756405-be0199881695?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1524585388814-7d6abf7caea4?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1598750155948-038e38c0dc04?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1462965326201-d02e4f455804?w=600&h=600&fit=crop",
];

interface ExplorePodcast {
    id: string;
    title: string;
    description?: string;
    audioUrl?: string;
    creatorName: string;
    creatorId: string;
    likes: number;
    comments: number;
    duration: string;
    coverIdx: number;
    gradientIdx: number;
    niche?: string;
}

const ExploreTile = ({
    pod, sizeClass, isFirst
}: {
    pod: ExplorePodcast;
    sizeClass: string;
    isFirst: boolean;
}) => {
    const audio = useAudio();
    const { user } = useAuth();
    const [hovered, setHovered] = useState(false);
    const [liked, setLiked] = useState(false);
    const isPlaying = audio.playingId === pod.id && audio.isPlaying;
    const isLoaded = audio.playingId === pod.id;
    const coverUrl = COVERS[pod.coverIdx % COVERS.length];
    const gradient = GRADIENTS[pod.gradientIdx % GRADIENTS.length];

    const handlePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!pod.audioUrl) { toast.error("No audio available"); return; }
        audio.playTrack({ id: pod.id, title: pod.title, creator: pod.creatorName, coverUrl, audioUrl: pod.audioUrl });
    };

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) { toast.error("Sign in to like"); return; }
        setLiked(!liked);
        if (!liked) {
            await supabase.from('podcast_likes').insert({ user_id: user.id, podcast_id: pod.id });
        } else {
            await supabase.from('podcast_likes').delete().eq('user_id', user.id).eq('podcast_id', pod.id);
        }
    };

    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-xl cursor-pointer group",
                sizeClass,
                isLoaded && "ring-2 ring-primary/60"
            )}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Cover image */}
            <img
                src={coverUrl}
                alt={pod.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                style={{ minHeight: isFirst ? '300px' : '150px' }}
            />

            {/* Always-on gradient at bottom for text */}
            <div className={cn("absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t", gradient)} />

            {/* Hover overlay with controls */}
            <div className={cn(
                "absolute inset-0 bg-background/70 flex flex-col items-center justify-center gap-2 transition-opacity duration-200",
                hovered ? "opacity-100" : "opacity-0"
            )}>
                <button
                    onClick={handlePlay}
                    className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center shadow-glow hover:scale-110 transition-transform"
                >
                    {isPlaying
                        ? <Pause className="w-5 h-5 text-primary-foreground" />
                        : <Play className="w-5 h-5 text-primary-foreground ml-0.5" />}
                </button>
                <div className="flex items-center gap-4 text-sm">
                    <button onClick={handleLike} className="flex items-center gap-1">
                        <Heart className={cn("w-4 h-4", liked && "fill-rose-500 text-rose-500")} />
                        <span>{pod.likes + (liked ? 1 : 0)}</span>
                    </button>
                    <span className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        <span>{pod.comments}</span>
                    </span>
                </div>
            </div>

            {/* Bottom info - always visible */}
            <div className="absolute bottom-0 inset-x-0 p-2.5">
                <p className="text-white font-semibold text-xs line-clamp-1 drop-shadow">{pod.title}</p>
                <Link
                    to={`/profile/${pod.creatorId}`}
                    onClick={e => e.stopPropagation()}
                    className="text-white/70 text-xs hover:text-white transition-colors"
                >
                    @{pod.creatorName}
                </Link>
            </div>

            {/* Duration badge */}
            <div className="absolute top-2 right-2 bg-background/80 px-1.5 py-0.5 rounded text-xs backdrop-blur-sm">
                {pod.duration}
            </div>

            {/* Playing indicator */}
            {isLoaded && (
                <div className="absolute top-2 left-2 flex items-center gap-1 bg-primary/90 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground animate-pulse" />
                    <span className="text-primary-foreground text-xs font-medium">Playing</span>
                </div>
            )}
        </div>
    );
};

const Explore = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [podcasts, setPodcasts] = useState<ExplorePodcast[]>([]);
    const [filtered, setFiltered] = useState<ExplorePodcast[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            const { data, error } = await supabase
                .from('podcasts')
                .select(`
                    id, title, description, niche, estimated_duration, 
                    likes_count, comments_count, user_id,
                    audio_files!inner(file_url),
                    profiles!inner(full_name, username)
                `)
                .eq('is_public', true)
                .order('likes_count', { ascending: false })
                .limit(50);

            if (error) {
                console.error("Explore fetch error:", error);
                setLoading(false);
                return;
            }

            const formatted: ExplorePodcast[] = (data || []).map((p: any, i: number) => ({
                id: p.id,
                title: p.title || 'Untitled',
                description: p.description,
                audioUrl: p.audio_files?.[0]?.file_url,
                creatorName: p.profiles?.username || p.profiles?.full_name || 'user_' + p.user_id.substring(0, 5),
                creatorId: p.user_id,
                likes: p.likes_count || 0,
                comments: p.comments_count || 0,
                duration: `${Math.floor((p.estimated_duration || 0) / 60)}:${((p.estimated_duration || 0) % 60).toString().padStart(2, '0')}`,
                coverIdx: i,
                gradientIdx: i,
                niche: p.niche || 'general'
            }));
            setPodcasts(formatted);
            setFiltered(formatted);
            setLoading(false);
        };
        fetch();
    }, []);

    const applyFilter = useCallback((query: string, category: string) => {
        let result = [...podcasts];

        // Filter by category first
        if (category !== "all") {
            const targetCat = category.toLowerCase().trim();
            result = result.filter(p =>
                p.niche && p.niche.toLowerCase().trim() === targetCat
            );
        }

        // Then filter by search query
        if (query.trim()) {
            const q = query.toLowerCase();
            result = result.filter(p =>
                p.title.toLowerCase().includes(q) ||
                p.creatorName.toLowerCase().includes(q)
            );
        }
        setFiltered(result);
    }, [podcasts]);

    const handleSearch = (q: string) => {
        setSearchQuery(q);
        applyFilter(q, selectedCategory);
    };

    const handleCategory = (cat: string) => {
        setSelectedCategory(cat);
        applyFilter(searchQuery, cat);
    };

    return (
        <Layout showPlayer>
            <div className="container mx-auto px-4 py-6 max-w-6xl">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold gradient-text mb-1">Explore</h1>
                    <p className="text-muted-foreground text-sm">Discover podcasts from creators around the world</p>
                </div>

                {/* Search Bar */}
                <div className="relative mb-5">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                        placeholder="Search podcasts, creators..."
                        className="pl-12 h-12 text-base"
                        value={searchQuery}
                        onChange={e => handleSearch(e.target.value)}
                    />
                    {searchQuery && (
                        <button className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => handleSearch("")}>
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Category pills */}
                <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => handleCategory(cat.id)}
                            className={cn(
                                "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                                selectedCategory === cat.id
                                    ? "bg-primary text-primary-foreground shadow-glow-sm scale-105"
                                    : "bg-card/80 text-muted-foreground hover:bg-card hover:text-foreground border border-border/50"
                            )}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Content Grid */}
                {loading ? (
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        {Array.from({ length: 9 }).map((_, i) => (
                            <div key={i} className={cn("rounded-xl bg-card/50 animate-pulse", i === 1 || i === 7 ? "row-span-2" : "row-span-1")} style={{ height: i === 1 || i === 7 ? '320px' : '160px' }} />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground">
                        <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-medium">No results found</p>
                        <p className="text-sm">Try a different search or category</p>
                    </div>
                ) : (
                    <>
                        {/* Instagram-style masonry grid */}
                        <div className="grid grid-cols-3 gap-1 sm:gap-2 auto-rows-[160px]">
                            {filtered.map((pod, i) => (
                                <ExploreTile
                                    key={pod.id}
                                    pod={pod}
                                    sizeClass={SIZES[i % SIZES.length]}
                                    isFirst={i === 0}
                                />
                            ))}
                        </div>

                        {filtered.length < 6 && (
                            <p className="text-center text-sm text-muted-foreground mt-8">
                                {filtered.length} podcast{filtered.length !== 1 ? 's' : ''} found
                            </p>
                        )}
                    </>
                )}
            </div>
        </Layout>
    );
};

export default Explore;
