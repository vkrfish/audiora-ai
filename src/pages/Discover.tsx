import { useState, useEffect, useCallback } from "react";
import { Search, UserPlus, UserCheck, Users, ChevronRight, Music2, Brain, Radio, MessageSquare, Sparkles } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const avatarPlaceholder = "https://images.unsplash.com/photo-1531297172866-cb8d50582515?w=100&h=100&fit=crop";
const formatNum = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

const Discover = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [userResults, setUserResults] = useState<any[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Load suggested creators on mount
  useEffect(() => {
    const load = async () => {
      const { data: users } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, followers_count, podcasts_count')
        .neq('id', user?.id || '')
        .limit(9);
      setSuggestedUsers(users || []);

      if (user) {
        const { data: follows } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', user.id);
        setFollowingIds(new Set((follows || []).map((f: any) => f.following_id)));
      }
    };
    load();
  }, [user]);

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setSearched(false); setUserResults([]); return; }
    setLoading(true);
    setSearched(true);
    const { data: users } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, followers_count, podcasts_count')
      .or(`full_name.ilike.%${q}%,username.ilike.%${q}%`)
      .neq('id', user?.id || '')
      .limit(15);
    setUserResults(users || []);
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="glass-card p-4 flex items-center gap-4 group/user border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 rounded-[1.5rem]"
    >
      <Link to={`/profile/${u.id}`} className="relative">
        <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-br from-primary/30 to-accent/30 group-hover/user:from-primary group-hover/user:to-accent transition-all duration-500">
          <img src={u.avatar_url || avatarPlaceholder} className="w-full h-full rounded-full object-cover border-2 border-[#0A0A0A]" alt={u.full_name} />
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#0A0A0A] rounded-full border border-white/10 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/profile/${u.id}`}>
          <p className="font-bold text-sm hover:text-primary transition-colors truncate mb-0.5">{u.full_name || `User ${u.id.substring(0, 8)}`}</p>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground/60 font-medium">@{u.username || 'user'}</span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span className="text-[10px] font-bold text-primary/70">{formatNum(u.followers_count || 0)} followers</span>
        </div>
      </div>

      <div className="relative group/btn">
        <div className={cn(
          "absolute -inset-1 rounded-full blur-md opacity-0 group-hover/btn:opacity-40 transition-opacity",
          !followingIds.has(u.id) ? "bg-gradient-to-r from-[#3DDABA] to-[#F19861]" : "bg-white/10"
        )} />
        <Button
          size="sm"
          onClick={() => handleFollow(u.id)}
          className={cn(
            "relative h-9 rounded-full px-4 text-[11px] font-bold transition-all gap-2",
            followingIds.has(u.id)
              ? "bg-white/5 border border-white/10 hover:bg-white/10 text-foreground"
              : "bg-gradient-to-r from-[#3DDABA] to-[#F19861] text-black border-none hover:brightness-110"
          )}
        >
          {followingIds.has(u.id) ? (
            <><UserCheck className="w-3.5 h-3.5" />Following</>
          ) : (
            <><UserPlus className="w-3.5 h-3.5" />Follow</>
          )}
        </Button>
      </div>
    </motion.div>
  );

  return (
    <Layout showPlayer>
      <div className="relative min-h-screen overflow-hidden pb-32">
        {/* Background Ambient Glows */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] -z-10 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[120px] -z-10 animate-pulse delay-1000" />

        <div className="container mx-auto px-6 py-12 max-w-6xl relative z-10">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <Badge variant="outline" className="px-4 py-1 rounded-full bg-primary/5 border-primary/20 text-primary uppercase text-[10px] font-black tracking-[0.2em] mb-4">
              Explore the Network
            </Badge>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">
              Discover <span className="gradient-text">Creators</span>
            </h1>
            <p className="text-muted-foreground text-sm max-w-lg mx-auto font-medium opacity-70">
              Find incredible creators and the newest voices in the Audiora universe. Follow them to stay up to date.
            </p>
          </motion.div>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto mb-16">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-2xl blur-xl opacity-50" />
            <div className="relative group/search">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within/search:text-primary transition-colors" />
              <Input
                placeholder="Search creators by name or username..."
                className="pl-14 py-8 text-lg bg-white/[0.02] border-white/5 focus-visible:ring-primary/20 focus-visible:border-primary/40 rounded-2xl transition-all shadow-2xl"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); handleSearch(e.target.value); }}
              />
              <AnimatePresence>
                {searchQuery && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
              {[
                { label: 'Technology', icon: Brain },
                { label: 'Music', icon: Music2 },
                { label: 'Live', icon: Radio },
                { label: 'Discussions', icon: MessageSquare }
              ].map((cat) => (
                <button
                  key={cat.label}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/5 hover:border-primary/30 hover:bg-primary/5 transition-all group"
                >
                  <cat.icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-[11px] font-bold tracking-tight text-muted-foreground group-hover:text-foreground">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-24 animate-in fade-in zoom-in duration-500">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-primary/10 border-t-primary animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                </div>
              </div>
              <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">Scanning Neural Network...</p>
            </div>
          )}

          <AnimatePresence mode="wait">
            {searched && !loading ? (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {userResults.length > 0 ? (
                  <section>
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-xl font-black tracking-tighter flex items-center gap-3">
                        <Users className="w-6 h-6 text-primary" /> People
                      </h2>
                      <Badge variant="outline" className="text-[10px] uppercase font-bold text-muted-foreground/50">{userResults.length} found</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {userResults.map(u => <UserCard key={u.id} u={u} />)}
                    </div>
                  </section>
                ) : (
                  <div className="text-center py-24 glass-card bg-white/[0.01] border-white/5 rounded-[3rem]">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                      <Search className="w-10 h-10 text-muted-foreground/20" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">No creators found</h3>
                    <p className="text-sm text-muted-foreground/60 max-w-xs mx-auto font-medium">We couldn't find anyone matching "{searchQuery}".</p>
                  </div>
                )}
              </motion.div>
            ) : !searched && !loading ? (
              <motion.div
                key="default"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {suggestedUsers.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-2xl font-black tracking-tighter flex items-center gap-3">
                        <UserPlus className="w-7 h-7 text-primary" /> Suggested <span className="text-primary/10">Creators</span>
                      </h2>
                      <Button variant="outline" className="text-xs font-bold gap-2 text-muted-foreground hover:text-primary rounded-full px-4">
                        View All <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {suggestedUsers.map(u => <UserCard key={u.id} u={u} />)}
                    </div>
                  </section>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
};

export default Discover;
