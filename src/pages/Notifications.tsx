import { useState, useEffect } from "react";
import { Bell, Heart, UserPlus, MessageCircle, AtSign, Check } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const iconMap: Record<string, any> = {
    like: Heart,
    follow: UserPlus,
    comment: MessageCircle,
    mention: AtSign,
    message: MessageCircle,
};

const colorMap: Record<string, string> = {
    like: "bg-red-500/20 text-red-400",
    follow: "bg-primary/20 text-primary",
    comment: "bg-blue-500/20 text-blue-400",
    mention: "bg-purple-500/20 text-purple-400",
    message: "bg-green-500/20 text-green-400",
};

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

            // Fetch actor profiles
            const withProfiles = await Promise.all((data || []).map(async (n: any) => {
                if (!n.actor_id) return { ...n, actorName: 'Someone', actorAvatar: null };
                const { data: prof } = await supabase.from('profiles').select('full_name, avatar_url, username').eq('id', n.actor_id).single();
                return { ...n, actorName: prof?.full_name || `User ${n.actor_id.substring(0, 8)}`, actorAvatar: prof?.avatar_url, actorUsername: prof?.username };
            }));
            setNotifications(withProfiles);
            setLoading(false);

            // Mark all as read
            await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
        };
        fetchNotifs();
    }, [user]);

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

    return (
        <Layout showPlayer>
            <div className="container mx-auto px-4 py-6 max-w-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                            <Bell className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold gradient-text">Notifications</h1>
                            <p className="text-sm text-muted-foreground">{notifications.filter(n => !n.is_read).length} unread</p>
                        </div>
                    </div>
                    {notifications.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={async () => {
                            await supabase.from('notifications').update({ is_read: true }).eq('user_id', user?.id || '');
                            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                        }}>
                            <Check className="w-4 h-4 mr-2" />Mark all read
                        </Button>
                    )}
                </div>

                {loading ? (
                    <div className="text-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto" /></div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground">
                        <Bell className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-medium">No notifications yet</p>
                        <p className="text-sm">When people like, comment, or follow you, it'll show here.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {notifications.map(n => {
                            const Icon = iconMap[n.type] || Bell;
                            const color = colorMap[n.type] || "bg-primary/20 text-primary";
                            return (
                                <div key={n.id} className={cn("glass-card p-4 flex items-center gap-4 transition-all", !n.is_read && "border-l-2 border-primary")}>
                                    {/* Type icon */}
                                    <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0", color)}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    {/* Actor avatar */}
                                    <img
                                        src={n.actorAvatar || "https://images.unsplash.com/photo-1531297172866-cb8d50582515?w=100&h=100&fit=crop"}
                                        className="w-10 h-10 rounded-full object-cover shrink-0"
                                        alt={n.actorName}
                                    />
                                    {/* Text */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm">
                                            <Link to={`/profile/${n.actor_id}`} className="font-semibold hover:underline">{n.actorName}</Link>
                                            {' '}{getNotifText(n)}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                        </p>
                                    </div>
                                    {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Notifications;
