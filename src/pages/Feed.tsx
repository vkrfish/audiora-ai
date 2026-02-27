import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Home, Users, TrendingUp, Play, Heart, MessageCircle,
  Share2, MoreHorizontal, Bookmark, Trash2, Link, Pause, Download, Send, X,
  Edit, Image as ImageIcon, Sparkles, Loader2, Check
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Layout from "@/components/layout/Layout";
import { cn } from "@/lib/utils";
import { getPublicPodcasts, updatePodcast } from "@/lib/podcast-api";
import { useAudio } from "@/contexts/AudioContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Link as RouterLink } from "react-router-dom";

interface Comment {
  id: string;
  content: string;
  user_id: string;
  username: string;
  created_at: string;
}

interface AudioPost {
  id: string;
  type: "short" | "podcast";
  title: string;
  description?: string;
  caption?: string;
  creator: { name: string; username: string; avatar: string; userId: string; };
  coverUrl: string;
  durationStr: string;
  likes: number;
  comments: number;
  audioUrl?: string;
  createdAt: string;
}

const formatDuration = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
const formatNumber = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toString();

/* ── Comment panel component ── */
const CommentPanel = ({ postId, onClose, onUpdateCount }: { postId: string; onClose: () => void; onUpdateCount: (delta: number) => void }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('podcast_comments')
        .select('id, content, user_id, created_at')
        .eq('podcast_id', postId)
        .order('created_at', { ascending: true });
      setComments((data || []).map((c: any) => ({
        ...c,
        username: 'user_' + c.user_id.substring(0, 5),
      })));
      setLoading(false);
    };
    fetch();
  }, [postId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [comments]);

  const handlePost = async () => {
    if (!user || !text.trim()) return;
    setPosting(true);
    const { data, error } = await supabase
      .from('podcast_comments')
      .insert({ podcast_id: postId, user_id: user.id, content: text.trim() })
      .select()
      .single();
    if (!error && data) {
      setComments(prev => [...prev, { ...data, username: 'user_' + user.id.substring(0, 5) }]);
      setText('');
      onUpdateCount(1);
    }
    setPosting(false);
  };

  const handleDelete = async (commentId: string) => {
    await supabase.from('podcast_comments').delete().eq('id', commentId);
    setComments(prev => prev.filter(c => c.id !== commentId));
    onUpdateCount(-1);
  };

  return (
    <div className="border-t border-border/50 mt-3 pt-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium">Comments ({comments.length})</span>
        <Button variant="ghost" size="icon-sm" onClick={onClose}><X className="w-3.5 h-3.5" /></Button>
      </div>

      {/* Comment list */}
      <div className="max-h-52 overflow-y-auto space-y-3 mb-3 pr-1">
        {loading ? (
          <p className="text-xs text-muted-foreground text-center py-4">Loading...</p>
        ) : comments.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No comments yet. Be first!</p>
        ) : (
          comments.map(c => (
            <div key={c.id} className="flex gap-2 group">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                {c.username[5]?.toUpperCase() ?? 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-medium">@{c.username}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm">{c.content}</p>
              </div>
              {user?.id === c.user_id && (
                <button
                  onClick={() => handleDelete(c.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      {user ? (
        <div className="flex gap-2">
          <Input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Write a comment..."
            className="h-8 text-sm"
            maxLength={500}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePost(); } }}
          />
          <Button size="icon-sm" disabled={!text.trim() || posting} onClick={handlePost}>
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center">Sign in to comment</p>
      )}
    </div>
  );
};

/* ── Main Feed component ── */
const Feed = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [posts, setPosts] = useState<AudioPost[]>([]);
  const [followingPosts, setFollowingPosts] = useState<AudioPost[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<AudioPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [openComments, setOpenComments] = useState<string | null>(null);
  const { user } = useAuth();
  const audio = useAudio();

  // Edit states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<AudioPost | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
  const [editCoverPreview, setEditCoverPreview] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const editCoverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      // 5-second safety timeout for the main feed loading
      const safetyTimeout = setTimeout(() => {
        setLoading(false);
      }, 5000);

      try {
        const data = await getPublicPodcasts();
        const formatted: AudioPost[] = data.map((item: any) => ({
          // ... (keep same mapping)
          id: item.id,
          type: item.type === "recorded" ? "short" : "podcast",
          title: item.title || "Untitled Podcast",
          description: item.description,
          caption: item.user_caption,
          creator: {
            name: item.profiles?.full_name || "Community AI",
            username: item.profiles?.username || ("user_" + item.user_id.substring(0, 5)),
            avatar: item.profiles?.avatar_url || "https://images.unsplash.com/photo-1531297172866-cb8d50582515?w=100&h=100&fit=crop",
            userId: item.user_id,
          },
          coverUrl: item.cover_url || 'https://images.unsplash.com/photo-1620321023374-d1a1901c5cc1?q=80&w=600&h=400&auto=format&fit=crop',
          durationStr: formatDuration(item.estimated_duration || 0),
          likes: item.likes_count || 0,
          comments: item.comments_count || 0,
          audioUrl: item.audio_files?.[0]?.file_url,
          createdAt: item.created_at
        }));
        setPosts(formatted);
        // seed comment counts from DB field
        const counts: Record<string, number> = {};
        formatted.forEach(p => { counts[p.id] = p.comments; });
        setCommentCounts(counts);
      } catch (err) { console.error(err); }
      finally {
        setLoading(false);
        clearTimeout(safetyTimeout);
      }
    };

    const fetchInteractions = async () => {
      if (!user) return;
      const [{ data: likes }, { data: saves }] = await Promise.all([
        supabase.from('podcast_likes').select('podcast_id').eq('user_id', user.id),
        supabase.from('saved_podcasts').select('podcast_id').eq('user_id', user.id)
      ]);
      setLikedIds(new Set((likes || []).map((l: any) => l.podcast_id)));
      setSavedIds(new Set((saves || []).map((s: any) => s.podcast_id)));
    };

    fetchPosts();
    fetchInteractions();
  }, [user]);

  // Real-time updates for counts and user interactions
  useEffect(() => {
    // 1. Subscribe to podcast metadata changes (counts, titles, etc)
    const podcastChannel = supabase
      .channel('public:podcasts')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'podcasts' }, (payload: any) => {
        const updated = payload.new;
        const updateLists = (list: AudioPost[]) =>
          list.map(p => p.id === updated.id ? {
            ...p,
            likes: updated.likes_count,
            comments: updated.comments_count,
            title: updated.title,
            caption: updated.user_caption,
            coverUrl: updated.cover_url || p.coverUrl
          } : p);

        setPosts(prev => updateLists(prev));
        setFollowingPosts(prev => updateLists(prev));
        setTrendingPosts(prev => updateLists(prev));

        setCommentCounts(prev => ({ ...prev, [updated.id]: updated.comments_count }));
      })
      .subscribe();

    // 2. Subscribe to like changes for current user
    let likeChannel: any;
    if (user) {
      likeChannel = supabase
        .channel(`user-likes-${user.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'podcast_likes',
          filter: `user_id=eq.${user.id}`
        }, (payload: any) => {
          if (payload.eventType === 'INSERT') {
            setLikedIds(prev => new Set([...prev, payload.new.podcast_id]));
          } else if (payload.eventType === 'DELETE') {
            setLikedIds(prev => {
              const n = new Set(prev);
              n.delete(payload.old.podcast_id);
              return n;
            });
          }
        })
        .subscribe();
    }

    return () => {
      supabase.removeChannel(podcastChannel);
      if (likeChannel) supabase.removeChannel(likeChannel);
    };
  }, [user]);

  // Fetch following and trending posts dynamically when those tabs are viewed
  useEffect(() => {
    if (activeTab === "following" && user) {
      setFollowingLoading(true);
      const fetchFollowing = async () => {
        try {
          const { data: follows, error: followError } = await supabase
            .from('user_follows')
            .select('following_id')
            .eq('follower_id', user.id);

          if (followError) throw followError;

          if (!follows || follows.length === 0) {
            setFollowingPosts([]);
            return;
          }

          const followingIds = follows.map((f: any) => f.following_id);
          const { data: fpods, error: podcastError } = await supabase
            .from('podcasts')
            .select('id, title, description, user_caption, type, estimated_duration, likes_count, comments_count, created_at, user_id, cover_url, audio_files(file_url), profiles(full_name, username, avatar_url)')
            .in('user_id', followingIds)
            .order('created_at', { ascending: false });

          if (podcastError) throw podcastError;

          const fmtd = (fpods || []).map((item: any) => ({
            id: item.id,
            type: (item.type === 'recorded' ? 'short' : 'podcast') as 'short' | 'podcast',
            title: item.title || 'Untitled',
            description: item.description,
            caption: item.user_caption,
            creator: {
              name: item.profiles?.full_name || 'Unknown',
              username: item.profiles?.username || ('user_' + item.user_id.substring(0, 5)),
              avatar: item.profiles?.avatar_url || 'https://images.unsplash.com/photo-1531297172866-cb8d50582515?w=100&h=100&fit=crop',
              userId: item.user_id
            },
            coverUrl: item.cover_url || 'https://images.unsplash.com/photo-1620321023374-d1a1901c5cc1?q=80&w=600&h=400&auto=format&fit=crop',
            durationStr: formatDuration(item.estimated_duration || 0),
            likes: item.likes_count || 0,
            comments: item.comments_count || 0,
            audioUrl: item.audio_files?.[0]?.file_url,
            createdAt: item.created_at
          }));
          setFollowingPosts(fmtd);
        } catch (err) {
          console.error("Error fetching following feed:", err);
          setFollowingPosts([]);
        } finally {
          setFollowingLoading(false);
        }
      };
      fetchFollowing();
    }

    if (activeTab === "trending") {
      setTrendingLoading(true);
      const fetchTrending = async () => {
        try {
          const { data: tpods, error } = await supabase.from('trending_podcasts')
            .select('id, title, description, user_caption, type, estimated_duration, likes_count, comments_count, created_at, user_id, cover_url, score, audio_files(file_url), profiles(full_name, username, avatar_url)')
            .limit(20);

          if (error) throw error;

          const fmtT = (tpods || []).map((item: any) => ({
            id: item.id,
            type: (item.type === 'recorded' ? 'short' : 'podcast') as 'short' | 'podcast',
            title: item.title || 'Untitled',
            description: item.description,
            caption: item.user_caption,
            creator: {
              name: item.profiles?.full_name || 'Unknown',
              username: item.profiles?.username || ('user_' + item.user_id.substring(0, 5)),
              avatar: item.profiles?.avatar_url || 'https://images.unsplash.com/photo-1531297172866-cb8d50582515?w=100&h=100&fit=crop',
              userId: item.user_id
            },
            coverUrl: item.cover_url || 'https://images.unsplash.com/photo-1620321023374-d1a1901c5cc1?q=80&w=600&h=400&auto=format&fit=crop',
            durationStr: formatDuration(item.estimated_duration || 0),
            likes: item.likes_count || 0,
            comments: item.comments_count || 0,
            audioUrl: item.audio_files?.[0]?.file_url,
            createdAt: item.created_at
          }));
          setTrendingPosts(fmtT);
        } catch (err) {
          console.error("Error fetching trending feed:", err);
        } finally {
          setTrendingLoading(false);
        }
      };
      fetchTrending();
    }
  }, [activeTab, user]);

  const handleLike = async (postId: string) => {
    if (!user) { toast.error("Sign in to like"); return; }
    const isLiked = likedIds.has(postId);
    setLikedIds(prev => { const n = new Set(prev); isLiked ? n.delete(postId) : n.add(postId); return n; });

    // Update all lists
    const updateLikes = (list: AudioPost[]) =>
      list.map(p => p.id === postId ? { ...p, likes: Math.max(0, p.likes + (isLiked ? -1 : 1)) } : p);

    setPosts(prev => updateLikes(prev));
    setFollowingPosts(prev => updateLikes(prev));
    setTrendingPosts(prev => updateLikes(prev));

    if (isLiked) {
      await supabase.from('podcast_likes').delete().eq('user_id', user.id).eq('podcast_id', postId);
    } else {
      await supabase.from('podcast_likes').insert({ user_id: user.id, podcast_id: postId });
      // Notify podcast owner
      const post = [...posts, ...followingPosts].find(p => p.id === postId);
      if (post && post.creator.userId !== user.id) {
        await supabase.from('notifications').insert({ user_id: post.creator.userId, actor_id: user.id, type: 'like', podcast_id: postId });
      }
    }
  };

  const handleSave = async (postId: string) => {
    if (!user) { toast.error("Sign in to save"); return; }
    const isSaved = savedIds.has(postId);
    setSavedIds(prev => { const n = new Set(prev); isSaved ? n.delete(postId) : n.add(postId); return n; });
    if (isSaved) {
      await supabase.from('saved_podcasts').delete().eq('user_id', user.id).eq('podcast_id', postId);
      toast.success("Removed from saved");
    } else {
      await supabase.from('saved_podcasts').insert({ user_id: user.id, podcast_id: postId });
      toast.success("Saved to your library");
    }
  };

  const handleDelete = async (postId: string) => {
    if (!user) return;
    const { error } = await supabase.from('podcasts').delete().eq('id', postId).eq('user_id', user.id);
    if (error) { toast.error("Could not delete podcast"); return; }
    setPosts(prev => prev.filter(p => p.id !== postId));
    toast.success("Podcast deleted");
  };

  const handleCopyLink = (postId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/feed?podcast=${postId}`);
    toast.success("Link copied to clipboard");
  };

  const toggleComments = (postId: string) => {
    setOpenComments(prev => prev === postId ? null : postId);
  };

  const handleEditClick = (post: AudioPost) => {
    setEditingPost(post);
    setEditCaption(post.caption || "");
    setEditCoverPreview(post.coverUrl);
    setEditCoverFile(null);
    setIsEditDialogOpen(true);
  };

  const handleEditCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setEditCoverPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUpdatePodcast = async () => {
    if (!editingPost) return;
    setIsUpdating(true);
    try {
      const updatedData = await updatePodcast(editingPost.id, {
        userCaption: editCaption,
        coverFile: editCoverFile || undefined
      });

      // Update local state
      const updateList = (list: AudioPost[]) => list.map(p =>
        p.id === editingPost.id
          ? { ...p, caption: editCaption, coverUrl: updatedData.cover_url || p.coverUrl }
          : p
      );

      setPosts(updateList);
      setFollowingPosts(updateList);
      setTrendingPosts(updateList);

      toast.success("Podcast updated successfully!");
      setIsEditDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update podcast");
    } finally {
      setIsUpdating(false);
    }
  };

  /* ── Card ── */
  const AudioPostCard = ({ post }: { post: AudioPost }) => {
    const isPlaying = audio.playingId === post.id && audio.isPlaying;
    const isLoaded = audio.playingId === post.id;
    const isCurrentUser = user?.id === post.creator.userId;
    const showComments = openComments === post.id;

    const handlePlayClick = () => {
      if (!post.audioUrl) { toast.error("No audio available"); return; }

      // Determine which list we are in for the playlist
      const activeList = activeTab === "for-you" ? posts :
        activeTab === "following" ? followingPosts :
          trendingPosts.length > 0 ? trendingPosts : posts;

      const playlist = activeList.map(p => ({
        id: p.id,
        title: p.title,
        creator: p.creator.name,
        coverUrl: p.coverUrl,
        audioUrl: p.audioUrl || ""
      }));

      audio.playTrack({
        id: post.id,
        title: post.title,
        creator: post.creator.name,
        coverUrl: post.coverUrl,
        audioUrl: post.audioUrl
      }, playlist);
    };

    return (
      <div className={cn("glass-card p-3 sm:p-5 animate-fade-in transition-all border-border/20", isLoaded && "ring-1 ring-primary/40")}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <img src={post.creator.avatar} alt={post.creator.name} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover" />
            <div>
              <RouterLink to={`/profile/${post.creator.userId}`} className="font-medium text-sm hover:underline block">{post.creator.name}</RouterLink>
              <p className="text-xs text-muted-foreground">@{post.creator.username} · {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm"><MoreHorizontal className="w-4 h-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => handleSave(post.id)} className="gap-2">
                <Bookmark className={cn("w-4 h-4", savedIds.has(post.id) && "fill-primary text-primary")} />
                {savedIds.has(post.id) ? "Unsave" : "Save"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCopyLink(post.id)} className="gap-2">
                <Link className="w-4 h-4" />Copy Link
              </DropdownMenuItem>
              {post.audioUrl && (
                <DropdownMenuItem className="gap-2" onClick={() => {
                  const a = document.createElement('a');
                  a.href = post.audioUrl!;
                  a.download = `${post.title}.mp3`;
                  a.target = '_blank';
                  a.click();
                }}>
                  <Download className="w-4 h-4" />Download
                </DropdownMenuItem>
              )}
              {isCurrentUser && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleEditClick(post)} className="gap-2">
                    <Edit className="w-4 h-4" />Edit Podcast
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDelete(post.id)} className="gap-2 text-destructive focus:text-destructive">
                    <Trash2 className="w-4 h-4" />Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Caption */}
        {post.caption && (
          <p className="text-sm mb-4 leading-relaxed whitespace-pre-wrap">
            {post.caption}
          </p>
        )}

        {/* Content Section - Compact size, Play on click */}
        <div className="flex flex-row gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div
            onClick={handlePlayClick}
            className="relative group/cover cursor-pointer rounded-lg sm:rounded-xl overflow-hidden bg-muted/30 w-24 sm:w-48 shrink-0 shadow-sm border border-border/10"
          >
            <img
              src={post.coverUrl}
              alt={post.title}
              className="w-full h-[96px] sm:h-auto sm:min-h-[120px] object-cover transition-transform duration-500 group-hover/cover:scale-105"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/90 flex items-center justify-center shadow-glow">
                {isPlaying ? <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current outline-none border-none pl-0.5" />}
              </div>
            </div>

            <div className="absolute top-1 left-1 sm:top-2 sm:left-2">
              <Badge variant="secondary" className="bg-black/60 backdrop-blur-md text-white border-none text-[8px] sm:text-[10px] px-1.5 py-0 sm:py-0">
                {post.durationStr}
              </Badge>
            </div>
          </div>

          <div
            onClick={handlePlayClick}
            className="flex-1 flex flex-col py-0 sm:py-1 cursor-pointer group/text min-w-0"
          >
            <h3 className="font-display font-bold text-sm sm:text-lg leading-snug group-hover/text:text-primary transition-colors line-clamp-2 mb-1">
              {post.title}
            </h3>
            {post.caption ? (
              <p className="text-[11px] sm:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-3 italic opacity-80 mb-1">"{post.caption}"</p>
            ) : (
              <p className="text-[11px] sm:text-sm text-muted-foreground line-clamp-2 mb-1">{post.description}</p>
            )}
            <div className="mt-auto pt-1 flex items-center">
              <Badge variant="outline" className="text-[8px] sm:text-[10px] opacity-70 uppercase tracking-tighter sm:tracking-normal px-1 sm:px-2.5">
                {post.type === 'short' ? 'Short' : 'Podcast'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border/30">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => handleLike(post.id)}>
              <Heart className={cn("w-4 h-4", likedIds.has(post.id) && "fill-accent text-accent")} />
              <span className="text-xs">{formatNumber(post.likes)}</span>
            </Button>
            <Button variant="ghost" size="sm" className={cn("gap-1.5", showComments && "text-primary")} onClick={() => toggleComments(post.id)}>
              <MessageCircle className={cn("w-4 h-4", showComments && "fill-primary/20 text-primary")} />
              <span className="text-xs">{formatNumber(commentCounts[post.id] ?? 0)}</span>
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => handleCopyLink(post.id)}>
              <Share2 className="w-4 h-4" />
              <span className="text-xs">Share</span>
            </Button>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={() => handleSave(post.id)}>
            <Bookmark className={cn("w-4 h-4", savedIds.has(post.id) && "fill-primary text-primary")} />
          </Button>
        </div>

        {/* Inline Comment Panel */}
        {showComments && (
          <CommentPanel
            postId={post.id}
            onClose={() => setOpenComments(null)}
            onUpdateCount={(delta) => {
              setCommentCounts(prev => ({
                ...prev,
                [post.id]: Math.max(0, (prev[post.id] || 0) + delta)
              }));
            }}
          />
        )}
      </div>
    );
  };

  const PostList = ({ items }: { items: AudioPost[] }) => (
    <div className="space-y-4">
      {items.map(post => <AudioPostCard key={post.id} post={post} />)}
    </div>
  );

  return (
    <Layout showPlayer>
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-6 bg-card/50">
            <TabsTrigger value="home" className="gap-2"><Home className="w-4 h-4" /><span className="hidden sm:inline">For You</span></TabsTrigger>
            <TabsTrigger value="following" className="gap-2"><Users className="w-4 h-4" /><span className="hidden sm:inline">Following</span></TabsTrigger>
            <TabsTrigger value="trending" className="gap-2"><TrendingUp className="w-4 h-4" /><span className="hidden sm:inline">Trending</span></TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="mt-0">
            {loading ? (
              <div className="text-center py-10">Loading podcasts...</div>
            ) : posts.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">No public podcasts yet. Be the first to share!</div>
            ) : (
              <PostList items={posts} />
            )}
          </TabsContent>

          <TabsContent value="following" className="mt-0">
            {followingLoading ? (
              <div className="text-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary mx-auto" /></div>
            ) : followingPosts.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Nothing here yet</p>
                <p className="text-sm">Follow creators on the Discover page to see their podcasts here.</p>
              </div>
            ) : (
              <PostList items={followingPosts} />
            )}
          </TabsContent>

          <TabsContent value="trending" className="mt-0">
            {trendingLoading ? (
              <div className="text-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary mx-auto" /></div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Ranked by engagement + recency
                </div>
                <PostList items={trendingPosts.length > 0 ? trendingPosts : [...posts].sort((a, b) => ((b.likes * 2) + (b.comments * 3)) - ((a.likes * 2) + (a.comments * 3)))} />
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Podcast</DialogTitle>
            <DialogDescription>
              Update your podcast's cover image and caption.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-6 py-4">
            <div className="relative group">
              <div
                className="w-48 h-48 rounded-2xl bg-secondary flex items-center justify-center overflow-hidden border border-border shadow-inner cursor-pointer"
                onClick={() => editCoverInputRef.current?.click()}
              >
                {editCoverPreview ? (
                  <img src={editCoverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <ImageIcon className="w-10 h-10 text-muted-foreground/50" />
                    <span className="text-xs text-muted-foreground font-medium">Change Cover</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Edit className="w-8 h-8 text-white" />
                </div>
              </div>
              <input
                type="file"
                ref={editCoverInputRef}
                onChange={handleEditCoverUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div className="w-full space-y-2">
              <Label htmlFor="edit-caption" className="text-sm font-medium">Caption</Label>
              <Textarea
                id="edit-caption"
                placeholder="What's on your mind?"
                className="resize-none"
                rows={4}
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                maxLength={500}
              />
              <p className="text-[10px] text-right text-muted-foreground">{editCaption.length}/500</p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePodcast} disabled={isUpdating} className="gap-2">
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Feed;
