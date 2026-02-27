import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, ArrowLeft, Search, Zap } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface Conversation {
    id: string;
    otherUserId: string;
    otherName: string;
    otherAvatar: string;
    lastMessage: string;
    lastMessageAt: string;
    unread: boolean;
}

interface Message {
    id: string;
    sender_id: string;
    content: string;
    created_at: string;
    is_read: boolean;
}

const avatarPlaceholder = "https://images.unsplash.com/photo-1531297172866-cb8d50582515?w=100&h=100&fit=crop";

const Messages = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConv, setActiveConv] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMsg, setNewMsg] = useState('');
    const [sending, setSending] = useState(false);
    const [otherProfile, setOtherProfile] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [userResults, setUserResults] = useState<any[]>([]);
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!user) return;
        const fetchConvs = async () => {
            const { data } = await supabase
                .from('conversations')
                .select('*')
                .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
                .order('last_message_at', { ascending: false });

            if (!data) return;

            const formatted: Conversation[] = await Promise.all(data.map(async (c: any) => {
                const otherId = c.participant_1 === user.id ? c.participant_2 : c.participant_1;
                const { data: prof } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', otherId).single();
                const { count } = await supabase
                    .from('messages').select('*', { count: 'exact', head: true })
                    .eq('conversation_id', c.id).eq('is_read', false).neq('sender_id', user.id);
                return {
                    id: c.id,
                    otherUserId: otherId,
                    otherName: prof?.full_name || `User ${otherId.substring(0, 8)}`,
                    otherAvatar: prof?.avatar_url || avatarPlaceholder,
                    lastMessage: c.last_message || 'No messages yet',
                    lastMessageAt: c.last_message_at ? formatDistanceToNow(new Date(c.last_message_at), { addSuffix: true }) : '',
                    unread: (count || 0) > 0,
                };
            }));
            setConversations(formatted);

            const convId = searchParams.get('conv');
            if (convId && formatted.find(c => c.id === convId)) {
                setActiveConv(convId);
            } else if (formatted.length > 0) {
                setActiveConv(prev => {
                    if (prev) return prev;
                    if (window.innerWidth < 768) return null;
                    return formatted[0].id;
                });
            }
        };
        fetchConvs();

        const convChannel = supabase.channel('sidebar-sync')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => { fetchConvs(); })
            .subscribe();

        return () => { supabase.removeChannel(convChannel); };
    }, [user, searchParams]);

    useEffect(() => {
        if (!activeConv || !user) return;
        const fetchMsgs = async () => {
            const { data } = await supabase.from('messages')
                .select('*').eq('conversation_id', activeConv)
                .order('created_at', { ascending: true });
            setMessages(data || []);
            await supabase.from('messages').update({ is_read: true })
                .eq('conversation_id', activeConv).neq('sender_id', user.id);
        };
        fetchMsgs();

        const conv = conversations.find(c => c.id === activeConv);
        if (conv) {
            supabase.from('profiles').select('*').eq('id', conv.otherUserId).single()
                .then(({ data }) => setOtherProfile(data));
        }

        const channel = supabase.channel(`conv-${activeConv}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeConv}` },
                async (payload) => {
                    const msg = payload.new as Message;
                    setMessages(prev => [...prev, msg]);
                    if (msg.sender_id !== user.id) {
                        await supabase.from('messages').update({ is_read: true }).eq('id', msg.id);
                    }
                })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [activeConv, user]);

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const handleSend = async () => {
        if (!user || !activeConv || !newMsg.trim()) return;
        setSending(true);
        const content = newMsg.trim();
        setNewMsg('');
        await supabase.from('messages').insert({ conversation_id: activeConv, sender_id: user.id, content });
        await supabase.from('conversations').update({ last_message: content, last_message_at: new Date().toISOString() }).eq('id', activeConv);
        setSending(false);
    };

    const handleSearch = async (q: string) => {
        setSearchQuery(q);
        if (q.length < 2) { setUserResults([]); return; }
        const { data } = await supabase.from('profiles').select('id, full_name, username, avatar_url')
            .ilike('full_name', `%${q}%`).neq('id', user?.id || '').limit(5);
        setUserResults(data || []);
    };

    const startNewConv = async (otherId: string) => {
        if (!user) return;
        const p1 = user.id < otherId ? user.id : otherId;
        const p2 = user.id < otherId ? otherId : user.id;
        const { data } = await supabase.from('conversations')
            .upsert({ participant_1: p1, participant_2: p2 }, { onConflict: 'participant_1,participant_2' })
            .select().single();
        if (data) { setActiveConv(data.id); setSearchQuery(''); setUserResults([]); }
    };

    const activeConvData = conversations.find(c => c.id === activeConv);

    return (
        <Layout showPlayer>
            <div className="container mx-auto px-4 py-6 max-w-6xl">
                <div
                    className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-white/[0.01] backdrop-blur-xl"
                    style={{ height: 'calc(100vh - 11rem)' }}
                >
                    {/* Ambient glow */}
                    <div className="absolute top-0 left-1/3 w-96 h-64 bg-primary/5 rounded-full blur-[100px] -z-0 pointer-events-none" />
                    <div className="absolute bottom-0 right-1/3 w-80 h-48 bg-accent/5 rounded-full blur-[80px] -z-0 pointer-events-none" />

                    <div className="flex h-full relative z-10">
                        {/* ── Sidebar ── */}
                        <div className={cn(
                            "w-full md:w-72 border-r border-white/5 flex flex-col bg-white/[0.01]",
                            activeConv && "hidden md:flex"
                        )}>
                            {/* Header */}
                            <div className="px-5 py-4 border-b border-white/5">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="font-black text-lg tracking-tight">Messages</h2>
                                    <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                                        <Zap className="w-3.5 h-3.5 text-primary" />
                                    </div>
                                </div>
                                {/* Search */}
                                <div className="relative">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
                                    <input
                                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30 focus:bg-white/[0.05] transition-all"
                                        placeholder="Find a conversation..."
                                        value={searchQuery}
                                        onChange={e => handleSearch(e.target.value)}
                                    />
                                </div>

                                {/* User search results */}
                                <AnimatePresence>
                                    {userResults.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -4 }}
                                            className="mt-2 rounded-xl overflow-hidden border border-white/5 bg-[#0A0A0A]"
                                        >
                                            {userResults.map(u => (
                                                <button key={u.id} onClick={() => startNewConv(u.id)}
                                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors text-left">
                                                    <img src={u.avatar_url || avatarPlaceholder} className="w-8 h-8 rounded-full object-cover" alt={u.full_name} />
                                                    <div>
                                                        <p className="text-sm font-bold">{u.full_name}</p>
                                                        <p className="text-[10px] text-muted-foreground/50">@{u.username}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Conversation list */}
                            <div className="flex-1 overflow-y-auto">
                                {conversations.length === 0 ? (
                                    <div className="text-center py-16 px-6">
                                        <div className="w-16 h-16 rounded-full bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
                                            <MessageSquare className="w-7 h-7 text-muted-foreground/20" />
                                        </div>
                                        <p className="text-sm font-bold text-muted-foreground/40">No conversations</p>
                                        <p className="text-xs text-muted-foreground/25 mt-1">Search a user to start chatting</p>
                                    </div>
                                ) : (
                                    conversations.map((c, i) => (
                                        <motion.button
                                            key={c.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            onClick={() => setActiveConv(c.id)}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.03] transition-all text-left border-b border-white/[0.03]",
                                                activeConv === c.id && "bg-white/[0.05] border-l-2 border-l-primary"
                                            )}
                                        >
                                            <div className="relative shrink-0">
                                                <img src={c.otherAvatar} className="w-10 h-10 rounded-2xl object-cover" alt={c.otherName} />
                                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0A0A0A]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <p className={cn("text-sm truncate", c.unread ? "font-bold text-foreground" : "font-medium text-foreground/80")}>{c.otherName}</p>
                                                    <p className="text-[9px] text-muted-foreground/30 shrink-0 ml-2 font-medium">{c.lastMessageAt}</p>
                                                </div>
                                                <p className={cn("text-xs truncate", c.unread ? "text-primary/70 font-semibold" : "text-muted-foreground/40")}>{c.lastMessage}</p>
                                            </div>
                                            {c.unread && <div className="w-2 h-2 rounded-full bg-primary shrink-0 shadow-[0_0_6px_rgba(var(--primary),0.6)]" />}
                                        </motion.button>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* ── Chat Panel ── */}
                        <div className={cn("flex-1 flex flex-col", !activeConv && "hidden md:flex")}>
                            {activeConv && activeConvData ? (
                                <>
                                    {/* Chat header */}
                                    <div className="px-5 py-3.5 border-b border-white/5 flex items-center gap-3 bg-white/[0.01]">
                                        <button className="md:hidden p-2 rounded-xl hover:bg-white/[0.05] transition-colors" onClick={() => setActiveConv(null)}>
                                            <ArrowLeft className="w-4 h-4" />
                                        </button>
                                        <div className="relative">
                                            <img src={activeConvData.otherAvatar} className="w-9 h-9 rounded-xl object-cover" alt={activeConvData.otherName} />
                                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0A0A0A]" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">{activeConvData.otherName}</p>
                                            {otherProfile?.username && <p className="text-[10px] text-muted-foreground/40 font-medium">@{otherProfile.username}</p>}
                                        </div>
                                    </div>

                                    {/* Messages area */}
                                    <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
                                        {messages.length === 0 && (
                                            <div className="flex items-center justify-center h-full">
                                                <div className="text-center">
                                                    <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-3">
                                                        <MessageSquare className="w-6 h-6 text-muted-foreground/20" />
                                                    </div>
                                                    <p className="text-xs text-muted-foreground/30 font-medium">No messages yet. Say hello!</p>
                                                </div>
                                            </div>
                                        )}
                                        <AnimatePresence initial={false}>
                                            {messages.map((m) => {
                                                const isMe = m.sender_id === user?.id;
                                                return (
                                                    <motion.div
                                                        key={m.id}
                                                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        className={cn("flex items-end gap-2", isMe ? "justify-end" : "justify-start")}
                                                    >
                                                        {!isMe && (
                                                            <img src={activeConvData.otherAvatar} className="w-6 h-6 rounded-full object-cover shrink-0 mb-1" alt="" />
                                                        )}
                                                        <div className={cn(
                                                            "max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                                                            isMe
                                                                ? "bg-gradient-to-br from-[#3DDABA] to-[#2EC4AD] text-black font-medium rounded-br-md"
                                                                : "bg-white/[0.05] border border-white/5 text-foreground/90 rounded-bl-md"
                                                        )}>
                                                            <p>{m.content}</p>
                                                            <p className={cn("text-[9px] mt-1.5 font-medium", isMe ? "text-black/50 text-right" : "text-muted-foreground/30")}>
                                                                {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                                                            </p>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </AnimatePresence>
                                        <div ref={endRef} />
                                    </div>

                                    {/* Input bar */}
                                    <div className="px-4 py-3.5 border-t border-white/5 bg-white/[0.01]">
                                        <div className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-2 focus-within:border-primary/30 transition-all">
                                            <input
                                                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none"
                                                value={newMsg}
                                                onChange={e => setNewMsg(e.target.value)}
                                                placeholder="Type a message..."
                                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                            />
                                            <button
                                                disabled={!newMsg.trim() || sending}
                                                onClick={handleSend}
                                                className={cn(
                                                    "w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0",
                                                    newMsg.trim()
                                                        ? "bg-gradient-to-br from-[#3DDABA] to-[#2EC4AD] text-black shadow-[0_0_16px_rgba(61,218,186,0.3)]"
                                                        : "bg-white/[0.05] text-muted-foreground/30"
                                                )}
                                            >
                                                <Send className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="w-20 h-20 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center mx-auto mb-5">
                                            <MessageSquare className="w-9 h-9 text-muted-foreground/15" />
                                        </div>
                                        <p className="text-lg font-black tracking-tight mb-1">Your Messages</p>
                                        <p className="text-sm text-muted-foreground/40">Select a conversation or search for a creator</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Messages;
