import { useState, useEffect } from "react";
import { Bell, Heart, UserPlus, MessageCircle, AtSign, CheckCheck, Sparkles } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const iconMap: Record<string, any> = {
    like: Heart,
    follow: UserPlus,
    comment: MessageCircle,
    mention: AtSign,
    message: MessageCircle,
};

const colorMap: Record<string, { bg: string; glow: string; icon: string }> = {
    like: { bg: "bg-rose-500/10", glow: "shadow-[0_0_12px_rgba(244,63,94,0.2)]", icon: "text-rose-400" },
    follow: { bg: "bg-primary/10", glow: "shadow-[0_0_12px_rgba(61,218,186,0.2)]", icon: "text-primary" },
    comment: { bg: "bg-blue-500/10", glow: "shadow-[0_0_12px_rgba(59,130,246,0.2)]", icon: "text-blue-400" },
    mention: { bg: "bg-violet-500/10", glow: "shadow-[0_0_12px_rgba(139,92,246,0.2)]", icon: "text-violet-400" },
    message: { bg: "bg-emerald-500/10", glow: "shadow-[0_0_12px_rgba(16,185,129,0.2)]", icon: "text-emerald-400" },
};

const avatarPlaceholder = "https://images.unsplash.com/photo-1531297172866-cb8d50582515?w=100&h=100&fit=crop";

const Notifications = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const fetchNotifs = async () => {
            const { data } = await supabase.from('notifications')
                .select('*').eq('user_id', user.id)
                .order('created_at', { ascending: false }).limit(50);

            const withProfiles = await Promise.all((data || []).map(async (n: any) => {
                if (!n.actor_id) return { ...n, actorName: 'Someone', actorAvatar: null };
                const { data: prof } = await supabase.from('profiles').select('full_name, avatar_url, username').eq('id', n.actor_id).single();
                return { ...n, actorName: prof?.full_name || `User ${n.actor_id.substring(0, 8)}`, actorAvatar: prof?.avatar_url, actorUsername: prof?.username };
            }));
            setNotifications(withProfiles);
            setLoading(false);
            await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
        };
        fetchNotifs();
    }, [user]);

    const markAllRead = async () => {
        await supabase.from('notifications').update({ is_read: true }).eq('user_id', user?.id || '');
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    };

    const getNotifText = (n: any) => {
        switch (n.type) {
            case 'like': return 'liked your podcast';
            case 'follow': return 'started following you';
            case 'comment': return 'commented on your podcast';
            case 'mention': return 'mentioned you in a comment';
            case 'message': return 'sent you a message';
            default: return n.message || 'interacted with you';
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <Layout showPlayer>
            <div className="relative min-h-screen">
                {/* Ambient glows */}
                <div className="fixed top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/4 rounded-full blur-[150px] -z-10 pointer-events-none" />

                <div className="container mx-auto px-4 py-10 max-w-2xl">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between mb-8"
                    >
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_0_24px_rgba(61,218,186,0.15)]">
                                    <Bell className="w-5 h-5 text-primary" />
                                </div>
                                {unreadCount > 0 && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                        <span className="text-[9px] font-black text-black">{unreadCount > 9 ? '9+' : unreadCount}</span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tight">Notifications</h1>
                                <p className="text-[11px] text-muted-foreground/40 font-bold uppercase tracking-widest mt-0.5">
                                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                                </p>
                            </div>
                        </div>

                        {notifications.length > 0 && unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all text-xs font-bold text-muted-foreground/60 hover:text-foreground"
                            >
                                <CheckCheck className="w-3.5 h-3.5" />
                                Mark all read
                            </button>
                        )}
                    </motion.div>

                    {/* Content */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32">
                            <div className="relative">
                                <div className="w-14 h-14 rounded-full border-2 border-primary/10 border-t-primary animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                                </div>
                            </div>
                        </div>
                    ) : notifications.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-32 rounded-[3rem] bg-white/[0.01] border border-white/5"
                        >
                            <div className="w-20 h-20 rounded-3xl bg-white/[0.03] flex items-center justify-center mx-auto mb-6">
                                <Bell className="w-9 h-9 text-muted-foreground/15" />
                            </div>
                            <h3 className="text-lg font-black mb-2">All quiet here</h3>
                            <p className="text-sm text-muted-foreground/40 max-w-xs mx-auto">When people like, comment, or follow you — it'll show here.</p>
                        </motion.div>
                    ) : (
                        <div className="space-y-2">
                            <AnimatePresence>
                                {notifications.map((n, i) => {
                                    const Icon = iconMap[n.type] || Bell;
                                    const style = colorMap[n.type] || colorMap.like;
                                    return (
                                        <motion.div
                                            key={n.id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.04 }}
                                            className={cn(
                                                "flex items-center gap-4 px-4 py-3.5 rounded-2xl border transition-all group",
                                                !n.is_read
                                                    ? "bg-white/[0.04] border-white/8 border-l-2 border-l-primary"
                                                    : "bg-white/[0.01] border-white/[0.03] hover:bg-white/[0.03] hover:border-white/5"
                                            )}
                                        >
                                            {/* Type icon */}
                                            <div className={cn(
                                                "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-white/5",
                                                style.bg, style.glow
                                            )}>
                                                <Icon className={cn("w-4 h-4", style.icon)} />
                                            </div>

                                            {/* Actor avatar */}
                                            <div className="relative shrink-0">
                                                <img
                                                    src={n.actorAvatar || avatarPlaceholder}
                                                    className="w-10 h-10 rounded-2xl object-cover"
                                                    alt={n.actorName}
                                                />
                                            </div>

                                            {/* Text */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm leading-relaxed">
                                                    <Link
                                                        to={`/profile/${n.actor_id}`}
                                                        className="font-bold hover:text-primary transition-colors"
                                                    >
                                                        {n.actorName}
                                                    </Link>
                                                    <span className="text-foreground/70"> {getNotifText(n)}</span>
                                                </p>
                                                <p className="text-[10px] text-muted-foreground/30 mt-0.5 font-medium">
                                                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                                </p>
                                            </div>

                                            {/* Unread dot */}
                                            {!n.is_read && (
                                                <div className="w-2 h-2 rounded-full bg-primary shrink-0 shadow-[0_0_8px_rgba(61,218,186,0.5)]" />
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default Notifications;
