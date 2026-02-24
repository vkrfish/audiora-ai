import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, ArrowLeft, Search, Plus } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

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

    // Load conversations
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

                // Get unread count for this specific conversation
                const { count } = await supabase
                    .from('messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('conversation_id', c.id)
                    .eq('is_read', false)
                    .neq('sender_id', user.id);

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

            // Auto-open conv from query param
            const convId = searchParams.get('conv');
            if (convId && formatted.find(c => c.id === convId)) {
                setActiveConv(convId);
            } else if (formatted.length > 0) {
                // On mobile, don't auto-select a conversation so the sidebar is visible.
                // On desktop, auto-select the first conversation.
                setActiveConv(prev => {
                    if (prev) return prev;
                    if (window.innerWidth < 768) return null;
                    return formatted[0].id;
                });
            }
        };
        fetchConvs();

        // Subscribe to NEW messages in ANY conversation I'm part of to update the sidebar
        const convChannel = supabase.channel('sidebar-sync')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages'
            }, () => {
                fetchConvs(); // Refresh everything to get new last_message and sort
            })
            .subscribe();

        return () => { supabase.removeChannel(convChannel); };
    }, [user, searchParams]);

    // Load messages for active conversation
    useEffect(() => {
        if (!activeConv || !user) return;
        const fetchMsgs = async () => {
            const { data } = await supabase.from('messages')
                .select('*').eq('conversation_id', activeConv)
                .order('created_at', { ascending: true });
            setMessages(data || []);

            // Mark as read
            await supabase.from('messages').update({ is_read: true })
                .eq('conversation_id', activeConv).neq('sender_id', user.id);
        };
        fetchMsgs();

        // Profile sync
        const conv = conversations.find(c => c.id === activeConv);
        if (conv) {
            supabase.from('profiles').select('*').eq('id', conv.otherUserId).single()
                .then(({ data }) => setOtherProfile(data));
        }

        // Real-time subscription for active chat
        const channel = supabase.channel(`conv-${activeConv}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${activeConv}`
            }, async (payload) => {
                const newMessage = payload.new as Message;
                setMessages(prev => [...prev, newMessage]);

                // If it's from the other person, mark it as read immediately
                if (newMessage.sender_id !== user.id) {
                    await supabase.from('messages').update({ is_read: true }).eq('id', newMessage.id);
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
        await supabase.from('conversations').update({ last_message: content, last_message_at: new Date().toISOString() })
            .eq('id', activeConv);
        setSending(false);
    };

    // User search for new DM
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
            <div className="container mx-auto px-4 py-6 max-w-5xl">
                <div className="glass-card overflow-hidden" style={{ height: 'calc(100vh - 13rem)' }}>
                    <div className="flex h-full">
                        {/* Sidebar */}
                        <div className={cn("w-full md:w-80 border-r border-border/50 flex flex-col", activeConv && "hidden md:flex")}>
                            <div className="p-4 border-b border-border/50">
                                <h2 className="font-bold text-lg mb-3">Messages</h2>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input placeholder="Search users..." className="pl-9 h-9" value={searchQuery} onChange={e => handleSearch(e.target.value)} />
                                </div>
                                {userResults.length > 0 && (
                                    <div className="mt-2 border border-border/50 rounded-lg overflow-hidden">
                                        {userResults.map(u => (
                                            <button key={u.id} onClick={() => startNewConv(u.id)}
                                                className="w-full flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors text-left">
                                                <img src={u.avatar_url || avatarPlaceholder} className="w-8 h-8 rounded-full object-cover" alt={u.full_name} />
                                                <div>
                                                    <p className="text-sm font-medium">{u.full_name}</p>
                                                    <p className="text-xs text-muted-foreground">@{u.username}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {conversations.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                        <p className="text-sm">No conversations yet</p>
                                        <p className="text-xs">Search for a user to start messaging</p>
                                    </div>
                                ) : (
                                    conversations.map(c => (
                                        <button key={c.id} onClick={() => setActiveConv(c.id)}
                                            className={cn("w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors text-left border-b border-border/30",
                                                activeConv === c.id && "bg-secondary/50")}>
                                            <img src={c.otherAvatar} className="w-10 h-10 rounded-full object-cover shrink-0" alt={c.otherName} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-medium truncate">{c.otherName}</p>
                                                    <p className="text-xs text-muted-foreground shrink-0 ml-2">{c.lastMessageAt}</p>
                                                </div>
                                                <p className="text-xs text-muted-foreground truncate">{c.lastMessage}</p>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Chat Panel */}
                        <div className={cn("flex-1 flex flex-col", !activeConv && "hidden md:flex")}>
                            {activeConv && activeConvData ? (
                                <>
                                    {/* Header */}
                                    <div className="p-4 border-b border-border/50 flex items-center gap-3">
                                        <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={() => setActiveConv(null)}>
                                            <ArrowLeft className="w-4 h-4" />
                                        </Button>
                                        <img src={activeConvData.otherAvatar} className="w-9 h-9 rounded-full object-cover" alt={activeConvData.otherName} />
                                        <div>
                                            <p className="font-medium text-sm">{activeConvData.otherName}</p>
                                            {otherProfile?.username && <p className="text-xs text-muted-foreground">@{otherProfile.username}</p>}
                                        </div>
                                    </div>

                                    {/* Messages */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                        {messages.map(m => {
                                            const isMe = m.sender_id === user?.id;
                                            return (
                                                <div key={m.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                                                    <div className={cn("max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm",
                                                        isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-secondary text-secondary-foreground rounded-bl-sm")}>
                                                        <p>{m.content}</p>
                                                        <p className={cn("text-xs mt-1", isMe ? "text-primary-foreground/70 text-right" : "text-muted-foreground")}>
                                                            {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={endRef} />
                                    </div>

                                    {/* Input */}
                                    <div className="p-4 border-t border-border/50 flex gap-2">
                                        <Input
                                            value={newMsg}
                                            onChange={e => setNewMsg(e.target.value)}
                                            placeholder="Type a message..."
                                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                        />
                                        <Button size="icon" disabled={!newMsg.trim() || sending} onClick={handleSend}>
                                            <Send className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                                    <div className="text-center">
                                        <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                        <p className="text-lg font-medium">Select a conversation</p>
                                        <p className="text-sm">or search for a user to start chatting</p>
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
