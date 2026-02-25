import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface NotificationContextType {
    unreadNotifs: number;
    unreadMessages: number;
    refreshCounts: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const [unreadNotifs, setUnreadNotifs] = useState(0);
    const [unreadMessages, setUnreadMessages] = useState(0);

    const fetchCounts = async () => {
        if (!user) return;
        try {
            const [{ count: notifs }, { count: msgs }] = await Promise.all([
                supabase
                    .from('notifications')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .eq('is_read', false),
                supabase
                    .from('messages')
                    .select('*', { count: 'exact', head: true })
                    .neq('sender_id', user.id)
                    .eq('is_read', false)
            ]);
            setUnreadNotifs(notifs || 0);
            setUnreadMessages(msgs || 0);
        } catch (error) {
            console.error("Failed to fetch notification counts", error);
        }
    };

    useEffect(() => {
        if (!user) {
            setUnreadNotifs(0);
            setUnreadMessages(0);
            return;
        }

        fetchCounts();

        const channel = supabase.channel('global-notifications-sync')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
                (payload: any) => {
                    setUnreadNotifs(n => n + 1);
                    // Show toast for new notification
                    toast.info("New Notification", {
                        description: payload.new.message || "Someone interacted with you.",
                    });
                })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
                () => fetchCounts())
            // For messages, filter doesn't support neq directly in postgres_changes easily, so we check sender_id in JS
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload: any) => {
                    if (payload.new.sender_id !== user.id) {
                        setUnreadMessages(m => m + 1);
                        toast.message("New Message", {
                            description: payload.new.content ? `"${payload.new.content}"` : "You received a new message.",
                        });
                    }
                })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' },
                () => fetchCounts())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    return (
        <NotificationContext.Provider value={{ unreadNotifs, unreadMessages, refreshCounts: fetchCounts }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
