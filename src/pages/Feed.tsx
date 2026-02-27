import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ArrowLeft, Home, Users, TrendingUp, Play, Heart, MessageCircle,
  Share2, MoreHorizontal, Bookmark, Trash2, Link, Pause, Download, Send, X,
  Edit, Image as ImageIcon, Loader2, Check, Headphones, Mic, Music2, Radio,
  Volume2, Music, Sparkles, Zap, MessageSquare
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

interface ChatConversation {
  id: string;
  otherUserId: string;
  otherName: string;
  otherAvatar: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: boolean;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
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

  // Suggested users state
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  // Chat window state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [chatConversations, setChatConversations] = useState<ChatConversation[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

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

    const fetchSuggestions = async () => {
      if (!user) return;
      setSuggestionsLoading(true);
      try {
        // 1. Get current user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setCurrentUserProfile(profile);

        // 2. Get who user follows
        const { data: follows } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', user.id);
        const fIds = new Set((follows || []).map((f: any) => f.following_id));
        setFollowingIds(fIds);

        // 3. Get potential suggestions (users not followed and not current user)
        const { data: others } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', user.id)
          .limit(20);

        // Filter out already followed
        const suggested = (others || [])
          .filter((u: any) => !fIds.has(u.id))
          .slice(0, 5);

        setSuggestedUsers(suggested);
      } catch (err) {
        console.error("Error fetching suggestions:", err);
      } finally {
        setSuggestionsLoading(false);
      }
    };

    fetchPosts();
    fetchInteractions();
    fetchSuggestions();
  }, [user]);

  // Messages and Conversations fetching for floating chat
  useEffect(() => {
    if (!user || !isChatOpen) return;

    const fetchConvs = async () => {
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (!data) return;

      const formatted: ChatConversation[] = await Promise.all(data.map(async (c: any) => {
        const otherId = c.participant_1 === user.id ? c.participant_2 : c.participant_1;
        const { data: prof } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', otherId).single();
        return {
          id: c.id,
          otherUserId: otherId,
          otherName: prof?.full_name || `User ${otherId.substring(0, 5)}`,
          otherAvatar: prof?.avatar_url || "https://images.unsplash.com/photo-1531297172866-cb8d50582515?w=100&h=100&fit=crop",
          lastMessage: c.last_message || 'New conversation',
          lastMessageAt: c.last_message_at ? formatDistanceToNow(new Date(c.last_message_at), { addSuffix: true }) : '',
          unread: false // Simplified for now
        };
      }));
      setChatConversations(formatted);
    };

    fetchConvs();

    // Subscribe to new messages globally to refresh conversation list
    const channel = supabase.channel('chat-pill-sync')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        fetchConvs();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, isChatOpen]);

  useEffect(() => {
    if (!activeConvId || !user || !isChatOpen) return;

    const fetchMsgs = async () => {
      setIsMessagesLoading(true);
      const { data } = await supabase.from('messages')
        .select('*').eq('conversation_id', activeConvId)
        .order('created_at', { ascending: true });
      setChatMessages(data || []);
      setIsMessagesLoading(false);
    };
    fetchMsgs();

    const channel = supabase.channel(`mini-chat-${activeConvId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeConvId}` },
        (payload) => {
          const msg = payload.new as ChatMessage;
          setChatMessages(prev => [...prev, msg]);
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeConvId, user, isChatOpen]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const handleSendChatMessage = async () => {
    if (!user || !activeConvId || !chatInput.trim()) return;
    setChatSending(true);
    const content = chatInput.trim();
    setChatInput('');
    try {
      await supabase.from('messages').insert({ conversation_id: activeConvId, sender_id: user.id, content });
      await supabase.from('conversations').update({ last_message: content, last_message_at: new Date().toISOString() }).eq('id', activeConvId);
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message");
    } finally {
      setChatSending(false);
    }
  };

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

  const handleSidebarFollow = async (targetUserId: string) => {
    if (!user) { toast.error("Sign in to follow"); return; }

    // Optimistic UI
    setFollowingIds(prev => new Set([...prev, targetUserId]));
    setSuggestedUsers(prev => prev.filter(u => u.id !== targetUserId));

    try {
      const { error } = await supabase
        .from('user_follows')
        .insert({ follower_id: user.id, following_id: targetUserId });

      if (error) throw error;

      // Notify
      await supabase.from('notifications').insert({
        user_id: targetUserId,
        actor_id: user.id,
        type: 'follow'
      });

      toast.success("Following");
    } catch (err) {
      console.error(err);
      toast.error("Failed to follow");
      // Rollback optimistic UI (simplified)
      setFollowingIds(prev => {
        const next = new Set(prev);
        next.delete(targetUserId);
        return next;
      });
    }
  };

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

  /* ── Sleek Card ── */
  const AudioPostCard = ({ post, index }: { post: AudioPost; index: number }) => {
    const isPlaying = audio.playingId === post.id && audio.isPlaying;
    const isLoaded = audio.playingId === post.id;
    const isCurrentUser = user?.id === post.creator.userId;
    const showComments = openComments === post.id;

    const handlePlayClick = () => {
      if (!post.audioUrl) { toast.error("No audio available"); return; }
      const activeList = activeTab === "for-you" ? posts :
        activeTab === "following" ? followingPosts :
          trendingPosts.length > 0 ? trendingPosts : posts;
      const playlist = activeList.map(p => ({ id: p.id, title: p.title, creator: p.creator.name, coverUrl: p.coverUrl, audioUrl: p.audioUrl || "" }));
      audio.playTrack({ id: post.id, title: post.title, creator: post.creator.name, coverUrl: post.coverUrl, audioUrl: post.audioUrl }, playlist);
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className={cn(
          "group rounded-2xl border transition-all duration-300 overflow-hidden",
          isLoaded
            ? "border-primary/40 bg-white/[0.07] shadow-[0_0_28px_rgba(61,218,186,0.12)]"
            : "border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.07] hover:border-white/[0.14]"
        )}
      >
        {/* Playing bar */}
        {isLoaded && (
          <div className="h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        )}

        <div className="p-4">
          {/* Header row */}
          <div className="flex items-center justify-between mb-3">
            <RouterLink to={`/profile/${post.creator.userId}`} className="flex items-center gap-2.5 group/author">
              <img src={post.creator.avatar} alt={post.creator.name} className="w-8 h-8 rounded-xl object-cover border border-white/10" />
              <div>
                <p className="font-bold text-xs group-hover/author:text-primary transition-colors">{post.creator.name}</p>
                <p className="text-[10px] text-muted-foreground/40">@{post.creator.username} · {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</p>
              </div>
            </RouterLink>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full hover:bg-white/[0.06] flex items-center justify-center transition-all">
                  <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
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
                  <DropdownMenuItem className="gap-2" onClick={() => { const a = document.createElement('a'); a.href = post.audioUrl!; a.download = `${post.title}.mp3`; a.target = '_blank'; a.click(); }}>
                    <Download className="w-4 h-4" />Download
                  </DropdownMenuItem>
                )}
                {isCurrentUser && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleEditClick(post)} className="gap-2"><Edit className="w-4 h-4" />Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(post.id)} className="gap-2 text-destructive focus:text-destructive"><Trash2 className="w-4 h-4" />Delete</DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Caption */}
          {post.caption && (
            <p className="text-xs text-muted-foreground/70 mb-3 leading-relaxed line-clamp-2 pl-[2.625rem]">{post.caption}</p>
          )}

          {/* Cover + info row */}
          <div className="flex gap-3 cursor-pointer" onClick={handlePlayClick}>
            <div className="relative w-32 sm:w-44 shrink-0 rounded-2xl overflow-hidden bg-white/5 aspect-[4/3]">
              <img src={post.coverUrl} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-lg">
                  {isPlaying ? <Pause className="w-4 h-4 text-black fill-current" /> : <Play className="w-4 h-4 text-black fill-current ml-0.5" />}
                </div>
              </div>
              <div className="absolute top-1.5 left-1.5 bg-black/50 backdrop-blur-sm text-[9px] font-bold px-2 py-0.5 rounded-full border border-white/10 text-white">{post.durationStr}</div>
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <h3 className="font-bold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-1">{post.title}</h3>
              {!post.caption && <p className="text-[11px] text-muted-foreground/40 line-clamp-2">{post.description}</p>}
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[9px] font-bold uppercase tracking-widest text-primary/60 bg-primary/10 px-2 py-0.5 rounded-full">{post.type === 'short' ? 'Short' : 'Podcast'}</span>
              </div>
            </div>
          </div>

          {/* Action row */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
            <div className="flex items-center gap-1">
              <button onClick={() => handleLike(post.id)} className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all",
                likedIds.has(post.id) ? "bg-rose-500/10 text-rose-400" : "hover:bg-white/[0.04] text-muted-foreground/40 hover:text-muted-foreground"
              )}>
                <Heart className={cn("w-3.5 h-3.5", likedIds.has(post.id) && "fill-current")} />
                {formatNumber(post.likes)}
              </button>
              <button onClick={() => toggleComments(post.id)} className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all",
                showComments ? "bg-primary/10 text-primary" : "hover:bg-white/[0.04] text-muted-foreground/40 hover:text-muted-foreground"
              )}>
                <MessageCircle className={cn("w-3.5 h-3.5", showComments && "fill-primary/20")} />
                {formatNumber(commentCounts[post.id] ?? 0)}
              </button>
              <button onClick={() => handleCopyLink(post.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-muted-foreground/40 hover:text-muted-foreground hover:bg-white/[0.04] transition-all">
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <button onClick={() => handleSave(post.id)} className={cn(
              "p-1.5 rounded-full transition-all",
              savedIds.has(post.id) ? "text-primary" : "text-muted-foreground/30 hover:text-muted-foreground"
            )}>
              <Bookmark className={cn("w-3.5 h-3.5", savedIds.has(post.id) && "fill-current")} />
            </button>
          </div>

          {/* Comment panel */}
          {showComments && (
            <CommentPanel postId={post.id} onClose={() => setOpenComments(null)}
              onUpdateCount={(delta) => setCommentCounts(prev => ({ ...prev, [post.id]: Math.max(0, (prev[post.id] || 0) + delta) }))} />
          )}
        </div>
      </motion.div>
    );
  };

  const PostList = ({ items }: { items: AudioPost[] }) => (
    <div className="space-y-2.5">
      <AnimatePresence>
        {items.map((post, i) => <AudioPostCard key={post.id} post={post} index={i} />)}
      </AnimatePresence>
    </div>
  );

  return (
    <Layout showPlayer>
      <div className="relative min-h-screen">
        {/* ── Rich glossy background ── */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#020d0b] via-[#050505] to-[#0d0805]" />

          {/* Primary teal glow — top left */}
          <div className="absolute -top-32 -left-32 w-[700px] h-[700px] bg-[#3DDABA]/12 rounded-full blur-[160px] animate-pulse" style={{ animationDuration: '5s' }} />
          {/* Orange accent — bottom right */}
          <div className="absolute -bottom-40 -right-20 w-[600px] h-[600px] bg-[#F19861]/10 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} />
          {/* Purple mid accent */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#7B5EA7]/8 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '9s', animationDelay: '2s' }} />
          {/* Small teal top-right */}
          <div className="absolute top-10 right-1/4 w-72 h-72 bg-[#3DDABA]/8 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '0.5s' }} />

          {/* Radial shimmer center */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_40%,rgba(61,218,186,0.07)_0%,transparent_70%)]" />

          {/* Subtle mesh grid */}
          <div className="absolute inset-0 opacity-[0.018]" style={{ backgroundImage: 'linear-gradient(rgba(61,218,186,1) 1px,transparent 1px),linear-gradient(90deg,rgba(61,218,186,1) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />

          {/* Light shafts */}
          <div className="absolute top-0 left-1/3 w-px h-full bg-gradient-to-b from-[#3DDABA]/20 via-transparent to-transparent" />
          <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-[#F19861]/12 via-transparent to-transparent" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#3DDABA]/20 to-transparent" />

          {/* Floating icons */}
          {[
            { Icon: Headphones, top: '8%', left: '6%', size: 40, dur: 8, delay: 0, rot: -12 },
            { Icon: Mic, top: '12%', right: '8%', size: 32, dur: 6.5, delay: 1, rot: 8 },
            { Icon: Radio, top: '65%', left: '4%', size: 36, dur: 9, delay: 0.5, rot: 15 },
            { Icon: Music2, top: '75%', right: '6%', size: 28, dur: 7, delay: 2, rot: -8 },
            { Icon: Sparkles, top: '30%', left: '2%', size: 24, dur: 5.5, delay: 1.5, rot: 6 },
            { Icon: Volume2, top: '45%', right: '3%', size: 30, dur: 8.5, delay: 0.8, rot: -15 },
            { Icon: Zap, top: '20%', left: '18%', size: 22, dur: 6, delay: 2.5, rot: 10 },
            { Icon: Music, top: '80%', left: '22%', size: 26, dur: 7.5, delay: 1.2, rot: -6 },
          ].map(({ Icon, top, left, right, size, dur, delay, rot }, i) => (
            <div
              key={i}
              className="absolute text-primary/[0.06] pointer-events-none"
              style={{
                top, left, right,
                animation: `float-icon ${dur}s ease-in-out ${delay}s infinite alternate`,
              }}
            >
              <Icon style={{ width: size, height: size, transform: `rotate(${rot}deg)` }} />
            </div>
          ))}
        </div>

        <style>{`
          @keyframes float-icon {
            0%   { transform: translateY(0px) scale(1); }
            100% { transform: translateY(-18px) scale(1.06); }
          }
        `}</style>

        <div className="container px-4 py-6 max-w-6xl flex flex-col lg:flex-row lg:gap-24 lg:ml-[10%]">
          {/* Main Feed Column */}
          <div className="flex-1 max-w-2xl">
            {/* Pill Tab Bar */}
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center bg-white/[0.07] border border-white/[0.1] rounded-full p-1 gap-1 backdrop-blur-md">
                {[
                  { value: 'home', label: 'For You', icon: Home },
                  { value: 'following', label: 'Following', icon: Users },
                  { value: 'trending', label: 'Trending', icon: TrendingUp }
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setActiveTab(value)}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all relative",
                      activeTab === value
                        ? "lg:bg-transparent lg:text-primary lg:scale-110 bg-white/10 text-foreground"
                        : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-white/5"
                    )}
                  >
                    <Icon className={cn("w-3.5 h-3.5", activeTab === value && "lg:drop-shadow-[0_0_10px_rgba(61,218,186,0.8)]")} />
                    <span className={cn(activeTab === value && "lg:drop-shadow-[0_0_8px_rgba(61,218,186,0.6)]")}>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'home' && (
              loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="relative"><div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" /><div className="absolute inset-0 flex items-center justify-center"><Headphones className="w-5 h-5 text-primary animate-pulse" /></div></div>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4"><Headphones className="w-7 h-7 text-muted-foreground/20" /></div>
                  <p className="font-bold text-muted-foreground/40">No podcasts yet</p>
                  <p className="text-xs text-muted-foreground/25 mt-1">Be the first to share something!</p>
                </div>
              ) : <PostList items={posts} />
            )}

            {activeTab === 'following' && (
              followingLoading ? (
                <div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" /></div>
              ) : followingPosts.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4"><Users className="w-7 h-7 text-muted-foreground/20" /></div>
                  <p className="font-bold text-muted-foreground/40">Nothing here yet</p>
                  <p className="text-xs text-muted-foreground/25 mt-1">Follow creators on Discover to see their posts.</p>
                </div>
              ) : <PostList items={followingPosts} />
            )}

            {activeTab === 'trending' && (
              trendingLoading ? (
                <div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" /></div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-3 text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">
                    <TrendingUp className="w-3 h-3 text-primary/50" />Ranked by engagement
                  </div>
                  <PostList items={trendingPosts.length > 0 ? trendingPosts : [...posts].sort((a, b) => ((b.likes * 2) + (b.comments * 3)) - ((a.likes * 2) + (a.comments * 3)))} />
                </>
              )
            )}
          </div>

          {/* Right Sidebar - Suggested for you */}
          <div className="hidden lg:block w-[320px] shrink-0">
            <div className="sticky top-10 flex flex-col gap-8">
              {/* Current User Profile Summary */}
              {user && (
                <RouterLink to="/profile" className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary/20 group-hover:border-primary/40 transition-all p-0.5">
                      <img
                        src={currentUserProfile?.avatar_url || "https://images.unsplash.com/photo-1531297172866-cb8d50582515?w=100&h=100&fit=crop"}
                        alt="My Profile"
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    <div>
                      <p className="font-black text-sm group-hover:text-primary transition-colors">
                        {currentUserProfile?.full_name || user.email?.split('@')[0] || "My Account"}
                      </p>
                      <p className="text-xs text-muted-foreground/40 font-medium">
                        @{currentUserProfile?.username || ("user_" + user.id.substring(0, 5))}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-tighter text-primary/60">Switch</span>
                </RouterLink>
              )}

              {/* Suggestions List */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-black text-muted-foreground/50 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-primary" />
                    Suggested for you
                  </h3>
                  <RouterLink to="/discover" className="text-[10px] font-black text-foreground/80 hover:text-primary transition-colors">See All</RouterLink>
                </div>

                <div className="space-y-4">
                  {suggestionsLoading ? (
                    [...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between opacity-50 animate-pulse">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/10" />
                          <div className="space-y-1.5">
                            <div className="w-20 h-2 bg-white/10 rounded" />
                            <div className="w-12 h-1.5 bg-white/5 rounded" />
                          </div>
                        </div>
                        <div className="w-12 h-6 bg-white/5 rounded-full" />
                      </div>
                    ))
                  ) : suggestedUsers.length > 0 ? (
                    suggestedUsers.map((item) => (
                      <div key={item.id} className="flex items-center justify-between group">
                        <RouterLink to={`/profile/${item.id}`} className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-white/5 group-hover:border-primary/30 transition-all p-0.5">
                            <img src={item.avatar_url || "https://images.unsplash.com/photo-1531297172866-cb8d50582515?w=100&h=100&fit=crop"} alt={item.full_name} className="w-full h-full object-cover rounded-full" />
                          </div>
                          <div>
                            <p className="font-bold text-xs truncate max-w-[120px] group-hover:text-primary transition-colors">{item.full_name || item.username}</p>
                            <p className="text-[10px] text-muted-foreground/40 font-medium truncate max-w-[120px]">Suggested for you</p>
                          </div>
                        </RouterLink>
                        <button
                          onClick={() => handleSidebarFollow(item.id)}
                          className="text-[10px] font-black text-primary hover:text-white hover:bg-primary/20 px-3 py-1 rounded-full transition-all border border-primary/20"
                        >
                          Follow
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-muted-foreground/30 text-center py-4 bg-white/[0.02] rounded-xl border border-dashed border-white/5">No suggestions available</p>
                  )}
                </div>
              </div>

              {/* Footer Links (Mini) */}
              <div className="px-1 pt-4 border-t border-white/[0.03]">
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tighter">
                  <RouterLink to="/about" className="hover:text-primary transition-colors">About</RouterLink>
                  <RouterLink to="/terms" className="hover:text-primary transition-colors">Help</RouterLink>
                  <RouterLink to="/privacy" className="hover:text-primary transition-colors">Privacy</RouterLink>
                  <RouterLink to="/terms" className="hover:text-primary transition-colors">Terms</RouterLink>
                </div>
                <p className="text-[9px] font-black text-muted-foreground/20 mt-4 tracking-widest">© 2026 AUDIORA FROM META</p>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Messages Pill & Window */}
        <div className="hidden lg:block fixed bottom-6 right-[60px] z-[60]">
          <AnimatePresence>
            {isChatOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9, x: 20 }}
                animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
                exit={{ opacity: 0, y: 20, scale: 0.9, x: 20 }}
                className="absolute bottom-16 right-0 w-[360px] h-[520px] bg-black/60 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden"
              >
                {/* Chat Header */}
                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    {activeConvId && (
                      <button
                        onClick={() => setActiveConvId(null)}
                        className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                      </button>
                    )}
                    <h3 className="font-black text-sm tracking-tight">
                      {activeConvId ? chatConversations.find(c => c.id === activeConvId)?.otherName : "Messages"}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
                      <Search className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => setIsChatOpen(false)}
                      className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                {/* Chat Content */}
                <div className="flex-1 overflow-y-auto">
                  {!activeConvId ? (
                    /* Conversation List */
                    <div className="flex flex-col">
                      {chatConversations.length > 0 ? (
                        chatConversations.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => setActiveConvId(c.id)}
                            className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.07] transition-all text-left border-b border-white/[0.02] active:bg-white/[0.1]"
                          >
                            <img src={c.otherAvatar} alt="" className="w-12 h-12 rounded-full object-cover border border-white/10 shadow-lg" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <p className="font-bold text-sm truncate">{c.otherName}</p>
                                <p className="text-[10px] text-muted-foreground/30">{c.lastMessageAt}</p>
                              </div>
                              <p className="text-[11px] text-muted-foreground/50 truncate font-medium">{c.lastMessage}</p>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-20 px-10 text-center">
                          <div className="w-16 h-16 rounded-full bg-white/[0.03] flex items-center justify-center mb-4">
                            <MessageSquare className="w-8 h-8 text-muted-foreground/20" />
                          </div>
                          <p className="font-bold text-sm text-muted-foreground/40">No conversations yet</p>
                          <p className="text-[10px] text-muted-foreground/20 mt-1">Direct message someone to start chatting!</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Active Chat Messages */
                    <div className="flex flex-col p-4 space-y-4">
                      {isMessagesLoading ? (
                        <div className="flex items-center justify-center py-10">
                          <Loader2 className="w-6 h-6 text-primary animate-spin" />
                        </div>
                      ) : (
                        chatMessages.map((m) => {
                          const isMe = m.sender_id === user?.id;
                          return (
                            <div key={m.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                              <div className={cn(
                                "max-w-[75%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-sm",
                                isMe
                                  ? "bg-primary text-black font-semibold rounded-br-sm"
                                  : "bg-white/[0.08] text-foreground border border-white/5 rounded-bl-sm"
                              )}>
                                {m.content}
                                <p className={cn("text-[8px] mt-1.5 opacity-40", isMe ? "text-right" : "text-left")}>
                                  {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  )}
                </div>

                {/* Chat Input (only in chat view) */}
                {activeConvId && (
                  <div className="p-4 border-t border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-2 bg-white/[0.05] border border-white/10 rounded-2xl px-3 py-1.5 focus-within:border-primary/40 transition-all">
                      <input
                        className="flex-1 bg-transparent text-[13px] placeholder:text-muted-foreground/30 focus:outline-none py-1"
                        placeholder="Type a message..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSendChatMessage(); }}
                      />
                      <button
                        onClick={handleSendChatMessage}
                        disabled={!chatInput.trim() || chatSending}
                        className={cn(
                          "p-2 rounded-xl transition-all",
                          chatInput.trim() ? "text-primary hover:bg-primary/10" : "text-muted-foreground/20"
                        )}
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="flex items-center gap-3 bg-white/[0.08] hover:bg-white/[0.12] backdrop-blur-xl border border-white/[0.1] rounded-full px-5 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_15px_rgba(61,218,186,0.1)] transition-all hover:scale-105 active:scale-95 group"
          >
            <div className="flex items-center gap-2.5">
              <MessageSquare className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-xs font-black tracking-tight text-foreground">Messages</span>
            </div>

            {/* Mini Avatar Stack */}
            <div className="flex -space-x-2.5 ml-1">
              {(suggestedUsers.length > 0 ? suggestedUsers.slice(0, 3) : [...Array(3)]).map((u, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full border-2 border-[#121212] overflow-hidden bg-white/5"
                  style={{ zIndex: 3 - i }}
                >
                  {u?.avatar_url ? (
                    <img src={u.avatar_url} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">
                      {i + 1}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </button>
        </div>
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
