import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface BlockedUsersModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
}

export function BlockedUsersModal({ isOpen, onClose, userId }: BlockedUsersModalProps) {
    const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen || !userId) return;

        const fetchBlockedUsers = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('user_blocks')
                    .select('blocked_id')
                    .eq('blocker_id', userId);

                if (error) throw error;

                const ids = (data || []).map((d: any) => d.blocked_id);

                if (ids.length > 0) {
                    const { data: profs, error: profsError } = await supabase
                        .from('profiles')
                        .select('id, full_name, username, avatar_url')
                        .in('id', ids);

                    if (profsError) throw profsError;
                    setBlockedUsers(profs || []);
                } else {
                    setBlockedUsers([]);
                }
            } catch (err: any) {
                console.error("Error fetching blocked users", err);
                toast.error("Could not load blocked users.");
            } finally {
                setLoading(false);
            }
        };

        fetchBlockedUsers();
    }, [isOpen, userId]);

    const handleUnblock = async (blockedId: string) => {
        try {
            const { error } = await supabase
                .from('user_blocks')
                .delete()
                .eq('blocker_id', userId)
                .eq('blocked_id', blockedId);

            if (error) throw error;

            setBlockedUsers(prev => prev.filter(u => u.id !== blockedId));
            toast.success("User unblocked successfully");
        } catch (err: any) {
            toast.error(err.message || "Failed to unblock user");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Blocked Users</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                    {loading ? (
                        <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary mx-auto" />
                        </div>
                    ) : blockedUsers.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">You have not blocked anyone.</p>
                    ) : (
                        blockedUsers.map(u => (
                            <div key={u.id} className="flex items-center justify-between">
                                <Link to={`/profile/${u.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity" onClick={onClose}>
                                    <img src={u.avatar_url || "https://images.unsplash.com/photo-1531297172866-cb8d50582515?w=50&h=50&fit=crop"} alt={u.username} className="w-10 h-10 rounded-full object-cover" />
                                    <div>
                                        <p className="font-medium text-sm">{u.full_name || u.username}</p>
                                        <p className="text-xs text-muted-foreground">@{u.username || 'user'}</p>
                                    </div>
                                </Link>
                                <Button variant="outline" size="sm" onClick={() => handleUnblock(u.id)}>Unblock</Button>
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
