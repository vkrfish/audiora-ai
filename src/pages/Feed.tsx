import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Home, Users, TrendingUp, Play, Heart, MessageCircle,
  Share2, MoreHorizontal, Bookmark, Trash2, Link, Pause, Download, Send, X
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import Layout from "@/components/layout/Layout";
import { cn } from "@/lib/utils";
import { getPublicPodcasts } from "@/lib/podcast-api";
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
  creator: { name: string; username: string; avatar: string; userId: string; };
  coverUrl: string;
  durationStr: string;
  likes: number;
  comments: number;
  audioUrl?: string;
}

const formatDuration = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
const formatNumber = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toString();

/* ── Comment panel component ── */
const CommentPanel = ({ postId, onClose }: { postId: string; onClose: () => void }) => {
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
    }
    setPosting(false);
  };

  const handleDelete = async (commentId: string) => {
    await supabase.from('podcast_comments').delete().eq('id', commentId);
    setComments(prev => prev.filter(c => c.id !== commentId));
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

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await getPublicPodcasts();
        const formatted: AudioPost[] = data.map((item: any) => ({
          id: item.id,
          type: item.type === "recorded" ? "short" : "podcast",
          title: item.title || "Untitled Podcast",
          description: item.description,
          creator: {
            name: item.profiles?.full_name || "Community AI",
            username: "user_" + item.user_id.substring(0, 5),
            avatar: "https://images.unsplash.com/photo-1531297172866-cb8d50582515?w=100&h=100&fit=crop",
            userId: item.user_id,
          },
          coverUrl: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=400&fit=crop",
          durationStr: formatDuration(item.estimated_duration || 0),
          likes: item.likes_count || 0,
          comments: item.comments_count || 0,
          audioUrl: item.audio_files?.[0]?.file_url
        }));
        setPosts(formatted);
        // seed comment counts from DB field
        const counts: Record<string, number> = {};
        formatted.forEach(p => { counts[p.id] = p.comments; });
        setCommentCounts(counts);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
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

  // Fetch following and trending posts dynamically when those tabs are viewed
  useEffect(() => {
    if (activeTab === "following" && user) {
      setFollowingLoading(true);
      supabase.from('user_follows').select('following_id').eq('follower_id', user.id).then(async ({ data: follows }) => {
        if (!follows || follows.length === 0) {
          setFollowingPosts([]);
          setFollowingLoading(false);
          return;
        }
        const followingIds = follows.map((f: any) => f.following_id);
        const { data: fpods } = await supabase
          .from('podcasts')
          .select('id, title, description, type, estimated_duration, likes_count, comments_count, created_at, user_id, audio_files(file_url), profiles(full_name)')
          .in('user_id', followingIds)
          .order('created_at', { ascending: false });

        const fmtd = (fpods || []).map((item: any) => ({
          id: item.id, type: (item.type === 'recorded' ? 'short' : 'podcast') as 'short' | 'podcast',
          title: item.title || 'Untitled', description: item.description,
          creator: { name: item.profiles?.full_name || 'Unknown', username: 'user_' + item.user_id.substring(0, 5), avatar: 'https://images.unsplash.com/photo-1531297172866-cb8d50582515?w=100&h=100&fit=crop', userId: item.user_id },
          coverUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=400&fit=crop',
          durationStr: formatDuration(item.estimated_duration || 0),
          likes: item.likes_count || 0, comments: item.comments_count || 0, audioUrl: item.audio_files?.[0]?.file_url
        }));
        setFollowingPosts(fmtd);
        setFollowingLoading(false);
      });
    }

    if (activeTab === "trending") {
      setTrendingLoading(true);
      supabase.from('trending_podcasts')
        .select('id, title, description, type, estimated_duration, likes_count, comments_count, created_at, user_id, score, audio_files(file_url), profiles(full_name)')
        .limit(20)
        .then(({ data: tpods }) => {
          const fmtT = (tpods || []).map((item: any) => ({
            id: item.id, type: (item.type === 'recorded' ? 'short' : 'podcast') as 'short' | 'podcast',
            title: item.title || 'Untitled', description: item.description,
            creator: { name: item.profiles?.full_name || 'Unknown', username: 'user_' + item.user_id.substring(0, 5), avatar: 'https://images.unsplash.com/photo-1531297172866-cb8d50582515?w=100&h=100&fit=crop', userId: item.user_id },
            coverUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=400&fit=crop',
            durationStr: formatDuration(item.estimated_duration || 0),
            likes: item.likes_count || 0, comments: item.comments_count || 0, audioUrl: item.audio_files?.[0]?.file_url
          }));
          setTrendingPosts(fmtT);
          setTrendingLoading(false);
        });
    }
  }, [activeTab, user]);

  const handleLike = async (postId: string) => {
    if (!user) { toast.error("Sign in to like"); return; }
    const isLiked = likedIds.has(postId);
    setLikedIds(prev => { const n = new Set(prev); isLiked ? n.delete(postId) : n.add(postId); return n; });
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes + (isLiked ? -1 : 1) } : p));
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

  /* ── Card ── */
  const AudioPostCard = ({ post }: { post: AudioPost }) => {
    const isPlaying = audio.playingId === post.id && audio.isPlaying;
    const isLoaded = audio.playingId === post.id;
    const isCurrentUser = user?.id === post.creator.userId;
    const showComments = openComments === post.id;

    const handlePlayClick = () => {
      if (!post.audioUrl) { toast.error("No audio available"); return; }
      audio.playTrack({ id: post.id, title: post.title, creator: post.creator.name, coverUrl: post.coverUrl, audioUrl: post.audioUrl });
    };

    return (
      <div className={cn("glass-card p-4 sm:p-5 animate-fade-in transition-all", isLoaded && "ring-1 ring-primary/50")}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img src={post.creator.avatar} alt={post.creator.name} className="w-10 h-10 rounded-full object-cover" />
            <div>
              <RouterLink to={`/profile/${post.creator.userId}`} className="font-medium text-sm hover:underline block">{post.creator.name}</RouterLink>
              <p className="text-xs text-muted-foreground">@{post.creator.username} · {formatDistanceToNow(new Date(), { addSuffix: true })}</p>
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
                  <DropdownMenuItem onClick={() => handleDelete(post.id)} className="gap-2 text-destructive focus:text-destructive">
                    <Trash2 className="w-4 h-4" />Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content */}
        <div className="flex gap-4 mb-4">
          <div className="relative shrink-0 cursor-pointer group" onClick={handlePlayClick}>
            <img src={post.coverUrl} alt={post.title} className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover" />
            <div className={cn(
              "absolute inset-0 bg-background/60 rounded-xl flex items-center justify-center transition-opacity",
              isLoaded ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}>
              {isPlaying
                ? <Pause className="w-8 h-8 text-foreground" />
                : <Play className="w-8 h-8 text-foreground" />}
            </div>
            <div className="absolute bottom-1 right-1 bg-background/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-xs">
              {post.durationStr}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <Badge variant="secondary" className="text-xs mb-1">{post.type === "short" ? "Short" : "Podcast"}</Badge>
            <h3 className="font-semibold line-clamp-2 mb-1">{post.title}</h3>
            {post.description && <p className="text-sm text-muted-foreground line-clamp-2">{post.description}</p>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
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
                  Ranked by recent engagement + recency
                </div>
                <PostList items={trendingPosts.length > 0 ? trendingPosts : [...posts].sort((a, b) => b.likes - a.likes)} />
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Feed;
