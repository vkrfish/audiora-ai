import { useState, useRef, useEffect } from "react";
import {
    X, Heart, Share2, MessageCircle, MoreVertical,
    Play, Pause, Volume2, UserPlus, UserCheck, Music,
    ChevronDown, ChevronUp, Send
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAudio } from "@/contexts/AudioContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Podcast {
    id: string;
    title: string;
    description?: string;
    audioUrl?: string;
    creatorName: string;
    creatorId: string;
    likes: number;
    comments: number;
    duration: string;
    coverUrl?: string;
}

interface PodcastReelsProps {
    podcasts: Podcast[];
    initialIndex: number;
    onClose: () => void;
}

const PodcastReels = ({ podcasts: initialPodcasts, initialIndex, onClose }: PodcastReelsProps) => {
    const [activeIndex, setActiveIndex] = useState(initialIndex);
    const [podcasts, setPodcasts] = useState(initialPodcasts);
    const containerRef = useRef<HTMLDivElement>(null);
    const audio = useAudio();
    const { user } = useAuth();
    const [showComments, setShowComments] = useState(false);
    const [activeComments, setActiveComments] = useState<any[]>([]);
    const [commentText, setCommentText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Scroll to initial index on mount
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTo({
                top: initialIndex * window.innerHeight,
                behavior: "auto"
            });
        }
    }, [initialIndex]);

    // Handle scroll to update active index and play audio
    const handleScroll = () => {
        if (!containerRef.current) return;
        const scrollPos = containerRef.current.scrollTop;
        const newIndex = Math.round(scrollPos / window.innerHeight);

        if (newIndex !== activeIndex && newIndex >= 0 && newIndex < podcasts.length) {
            setActiveIndex(newIndex);
        }
    };

    // Sync audio with active index
    useEffect(() => {
        const pod = podcasts[activeIndex];
        if (!pod || !pod.audioUrl) return;

        // Small delay to ensure user stopped scrolling
        const timer = setTimeout(() => {
            if (audio.playingId !== pod.id) {
                audio.playTrack({
                    id: pod.id,
                    title: pod.title,
                    creator: pod.creatorName,
                    coverUrl: pod.coverUrl || "",
                    audioUrl: pod.audioUrl
                });
            }
        }, 400); // 400ms delay to feel snap but ignore fast passes

        return () => clearTimeout(timer);
    }, [activeIndex, audio.playingId, podcasts]); // Added podcasts to dependency array

    // Fetch comments for active podcast
    useEffect(() => {
        const pod = podcasts[activeIndex];
        if (showComments && pod) {
            const fetchComments = async () => {
                const { data } = await supabase
                    .from('podcast_comments')
                    .select(`
                    id, content, created_at, user_id,
                    profiles(username, avatar_url)
                `)
                    .eq('podcast_id', pod.id)
                    .order('created_at', { ascending: false });
                setActiveComments(data || []);
            };
            fetchComments();
        }
    }, [activeIndex, showComments, podcasts]);

    const handleAddComment = async () => {
        if (!user || !commentText.trim() || isSubmitting) return;
        setIsSubmitting(true);
        const pod = podcasts[activeIndex];

        const { data: newComment, error } = await supabase
            .from('podcast_comments')
            .insert({
                podcast_id: pod.id,
                user_id: user.id,
                content: commentText.trim()
            })
            .select(`
            id, content, created_at, user_id,
            profiles(username, avatar_url)
        `)
            .single();

        if (!error && newComment) {
            setActiveComments(prev => [newComment, ...prev]);
            setCommentText("");
            // Update comment count in local state
            setPodcasts(prev => prev.map(p => p.id === pod.id ? { ...p, comments: p.comments + 1 } : p));
        }
        setIsSubmitting(false);
    };


    return (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center overflow-hidden h-[100dvh] w-full">
            {/* Top Controls */}
            <div className="absolute top-0 inset-x-0 z-50 p-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
                <h2 className="text-white font-display text-xl font-bold flex items-center gap-2 pointer-events-auto">
                    <Music className="w-5 h-5 text-primary" />
                    Audiora Reels
                </h2>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10 rounded-full pointer-events-auto"
                    onClick={onClose}
                >
                    <X className="w-6 h-6" />
                </Button>
            </div>

            {/* Reel Container */}
            <div
                ref={containerRef}
                onScroll={handleScroll}
                className="w-full h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
                style={{ scrollBehavior: 'smooth' }}
            >
                {podcasts.map((pod, i) => (
                    <ReelItem
                        key={pod.id}
                        pod={pod}
                        isActive={i === activeIndex}
                        onPlayToggle={() => audio.togglePlay()}
                        isPlaying={audio.isPlaying && audio.playingId === pod.id}
                        user={user}
                        onUpdate={(newData) => {
                            setPodcasts(prev => prev.map(p => p.id === pod.id ? { ...p, ...newData } : p));
                        }}
                        onShowComments={() => setShowComments(true)}
                    />
                ))}
            </div>

            {/* Comment Sheet Placeholder */}
            <AnimatePresence>
                {showComments && (
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="absolute inset-x-0 bottom-0 z-[110] h-[70vh] bg-zinc-900 rounded-t-3xl border-t border-white/10 p-6 flex flex-col shadow-2xl"
                    >
                        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" onClick={() => setShowComments(false)} />
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-white font-bold text-xl">Comments</h3>
                            <Button variant="ghost" size="icon" className="text-white" onClick={() => setShowComments(false)}>
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-5 mb-4 pr-2 scrollbar-thin">
                            {activeComments.length > 0 ? (
                                activeComments.map(comment => (
                                    <div key={comment.id} className="flex gap-3">
                                        <img
                                            src={comment.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.profiles?.username}`}
                                            className="w-10 h-10 rounded-full bg-zinc-800 object-cover"
                                            alt=""
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-white font-bold text-sm">@{comment.profiles?.username}</span>
                                                <span className="text-white/30 text-[10px]">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                                            </div>
                                            <p className="text-white/80 text-sm leading-relaxed">{comment.content}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-20 text-white/40 italic flex flex-col items-center gap-3">
                                    <MessageCircle className="w-12 h-12 opacity-20" />
                                    <p>No comments yet. Be the first to start the conversation!</p>
                                </div>
                            )}
                        </div>
                        <div className="relative mt-auto pt-4 border-t border-white/10 flex gap-3">
                            <input
                                type="text"
                                value={commentText}
                                onChange={e => setCommentText(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && handleAddComment()}
                                placeholder="Add a comment..."
                                className="flex-1 bg-white/5 border border-white/10 rounded-full py-3.5 px-6 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm transition-all"
                            />
                            <Button
                                variant="hero"
                                size="icon"
                                className="rounded-full w-12 h-12 shadow-glow-sm shrink-0"
                                onClick={handleAddComment}
                                disabled={!commentText.trim() || isSubmitting}
                            >
                                <Send className={cn("w-5 h-5", isSubmitting && "animate-pulse")} />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Navigation Indicators */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50 pointer-events-none opacity-50 hidden md:flex">
                <div className="text-white/40 text-xs font-medium text-center mb-1">
                    {activeIndex + 1} / {podcasts.length}
                </div>
                <div className="flex flex-col gap-1.5 items-center">
                    {podcasts.map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "w-1 h-1 rounded-full bg-white transition-all duration-300",
                                i === activeIndex ? "h-4 bg-primary" : "opacity-30"
                            )}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

const ReelItem = ({ pod, isActive, onPlayToggle, isPlaying, user, onUpdate, onShowComments }: {
    pod: Podcast,
    isActive: boolean,
    onPlayToggle: () => void,
    isPlaying: boolean,
    user: any,
    onUpdate: (data: Partial<Podcast>) => void,
    onShowComments: () => void
}) => {
    const [liked, setLiked] = useState(false);
    const [followed, setFollowed] = useState(false);
    const [likeCount, setLikeCount] = useState(pod.likes);

    // Initial check for likes/follows
    useEffect(() => {
        if (!user) return;

        const checkStatus = async () => {
            const { data: like } = await supabase.from('podcast_likes').select('id').eq('podcast_id', pod.id).eq('user_id', user.id).maybeSingle();
            setLiked(!!like);

            const { data: follow } = await supabase.from('user_follows').select('id').eq('following_id', pod.creatorId).eq('follower_id', user.id).maybeSingle();
            setFollowed(!!follow);
        };
        checkStatus();
    }, [pod.id, pod.creatorId, user]);

    const handleLike = async () => {
        if (!user) { toast.error("Sign in to like"); return; }

        const newLiked = !liked;
        const newCount = newLiked ? likeCount + 1 : Math.max(0, likeCount - 1);
        setLiked(newLiked);
        setLikeCount(newCount);
        onUpdate({ likes: newCount });

        if (newLiked) {
            await supabase.from('podcast_likes').insert({ user_id: user.id, podcast_id: pod.id });
        } else {
            await supabase.from('podcast_likes').delete().eq('user_id', user.id).eq('podcast_id', pod.id);
        }
    };

    const handleFollow = async () => {
        if (!user) { toast.error("Sign in to follow"); return; }

        const newFollowed = !followed;
        setFollowed(newFollowed);

        if (newFollowed) {
            await supabase.from('user_follows').insert({ follower_id: user.id, following_id: pod.creatorId });
            toast.success(`Following @${pod.creatorName}`);
        } else {
            await supabase.from('user_follows').delete().eq('follower_id', user.id).eq('following_id', pod.creatorId);
        }
    };
    return (
        <div className="w-full h-[100dvh] snap-start relative flex items-center justify-center overflow-hidden bg-zinc-950">
            {/* Blurred Background */}
            <div className="absolute inset-0 z-0">
                <img
                    src={pod.coverUrl}
                    alt=""
                    className="w-full h-full object-cover scale-110 blur-3xl opacity-30"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
            </div>

            {/* Main Content Area */}
            <div className="relative z-10 h-full w-full max-w-lg mx-auto flex flex-col justify-end pb-12 px-4 sm:px-6">

                {/* Cover Art Container */}
                <div
                    className="absolute inset-x-4 top-24 bottom-56 flex items-center justify-center p-4"
                    onClick={onPlayToggle}
                >
                    <motion.div
                        initial={false}
                        animate={{
                            scale: isActive ? 1 : 0.85,
                            opacity: isActive ? 1 : 0.4,
                            rotate: isPlaying ? 0 : [0, -1, 1, 0]
                        }}
                        className="relative aspect-square w-full max-w-sm rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/10 group cursor-pointer"
                    >
                        <img
                            src={pod.coverUrl}
                            alt={pod.title}
                            className="w-full h-full object-cover"
                        />

                        {/* Play/Pause Overlay */}
                        <div className={cn(
                            "absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity duration-300",
                            !isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        )}>
                            <div className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center scale-90 group-hover:scale-100 transition-transform shadow-glow">
                                {isPlaying ? (
                                    <Pause className="w-10 h-10 text-white" />
                                ) : (
                                    <Play className="w-10 h-10 text-white ml-1.5" />
                                )}
                            </div>
                        </div>

                        {/* Vinyl Effect (Decorative) */}
                        <div className="absolute -inset-2 rounded-full border border-white/5 opacity-20 pointer-events-none ring-1 ring-white/10" />
                    </motion.div>
                </div>

                {/* Right Side Actions */}
                <div className="absolute right-4 bottom-32 flex flex-col items-center gap-7 z-20">
                    <div className="flex flex-col items-center gap-1.5">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleLike}
                            className={cn(
                                "w-14 h-14 rounded-full bg-white/10 text-white backdrop-blur-md transition-all",
                                liked ? "text-rose-500 bg-rose-500/10 scale-110" : "hover:bg-white/20"
                            )}
                        >
                            <Heart className={cn("w-7 h-7", liked && "fill-current")} />
                        </Button>
                        <span className="text-white text-xs font-bold drop-shadow-lg">{likeCount}</span>
                    </div>

                    <div className="flex flex-col items-center gap-1.5">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onShowComments}
                            className="w-14 h-14 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-md transition-all"
                        >
                            <MessageCircle className="w-7 h-7" />
                        </Button>
                        <span className="text-white text-xs font-bold drop-shadow-lg">{pod.comments}</span>
                    </div>

                    <Button variant="ghost" size="icon" className="w-14 h-14 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-md transition-all">
                        <Share2 className="w-7 h-7" />
                    </Button>

                    <Button variant="ghost" size="icon" className="w-14 h-14 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-md transition-all">
                        <MoreVertical className="w-7 h-7" />
                    </Button>

                    {/* Rotating Disk Animation */}
                    <motion.div
                        animate={isPlaying ? { rotate: 360 } : {}}
                        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                        className="w-12 h-12 rounded-full border-2 border-white/20 p-1 mt-4"
                    >
                        <img
                            src={pod.coverUrl}
                            className="w-full h-full rounded-full object-cover"
                        />
                    </motion.div>
                </div>

                {/* Bottom Info Overlay */}
                <div className="w-full space-y-5">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full border-2 border-primary overflow-hidden shadow-2xl ring-4 ring-black/20">
                                <img
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${pod.creatorName}`}
                                    alt={pod.creatorName}
                                    className="w-full h-full bg-zinc-800"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col flex-1">
                            <div className="flex items-center gap-3">
                                <p className="text-white font-bold text-xl drop-shadow-lg tracking-tight truncate max-w-[150px]">@{pod.creatorName}</p>
                                <Button
                                    variant={followed ? "secondary" : "hero"}
                                    size="sm"
                                    onClick={(e) => { e.stopPropagation(); handleFollow(); }}
                                    className={cn(
                                        "h-8 px-5 text-[11px] font-bold uppercase tracking-[0.2em] rounded-full transition-all flex items-center gap-1.5",
                                        followed ? "bg-white/10 text-white border-white/10 hover:bg-white/20" : "shadow-glow-sm ring-1 ring-primary/20"
                                    )}
                                >
                                    {followed ? <><UserCheck className="w-3 h-3" />Following</> : <><UserPlus className="w-3 h-3" />Follow</>}
                                </Button>
                            </div>
                            <p className="text-white/50 text-[10px] flex items-center gap-1.5 font-medium mt-1">
                                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <Music className="w-3 h-3 text-primary/70" /> Original Source
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2.5">
                        <h3 className="text-white font-display text-2xl font-black leading-tight drop-shadow-2xl">
                            {pod.title}
                        </h3>
                        <p className="text-white/90 text-base line-clamp-2 leading-relaxed drop-shadow-lg font-medium">
                            {pod.description || "No description provided for this podcast."}
                        </p>
                    </div>
                </div>

                {/* Progress Bar (Mockup for now) */}
                <div className="pt-2">
                    <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: "0%" }}
                            animate={isPlaying ? { width: "100%" } : { width: "30%" }}
                            transition={isPlaying ? { duration: 60, ease: "linear" } : { duration: 0 }}
                            className="h-full bg-primary"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PodcastReels;
