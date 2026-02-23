import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageSquare, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface UserListModalProps {
    userId: string;
    type: 'followers' | 'following';
    isOpen: boolean;
    onClose: () => void;
}

export const UserListModal = ({ userId, type, isOpen, onClose }: UserListModalProps) => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isOpen || !userId) return;
        const fetchUsers = async () => {
            setLoading(true);
            try {
                if (type === 'followers') {
                    const { data } = await supabase.from('user_follows').select('follower_id').eq('following_id', userId);
                    const ids = (data || []).map((d: any) => d.follower_id);
                    if (ids.length > 0) {
                        const { data: profs } = await supabase.from('profiles').select('id, full_name, username, avatar_url, bio').in('id', ids);
                        setUsers(profs || []);
                    } else {
                        setUsers([]);
                    }
                } else {
                    const { data } = await supabase.from('user_follows').select('following_id').eq('follower_id', userId);
                    const ids = (data || []).map((d: any) => d.following_id);
                    if (ids.length > 0) {
                        const { data: profs } = await supabase.from('profiles').select('id, full_name, username, avatar_url, bio').in('id', ids);
                        setUsers(profs || []);
                    } else {
                        setUsers([]);
                    }
                }
            } catch (e) {
                console.error("Error fetching users", e);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [isOpen, userId, type]);

    const startDM = async (otherId: string) => {
        if (!user || !otherId) return;
        if (user.id === otherId) return;
        const p1 = user.id < otherId ? user.id : otherId;
        const p2 = user.id < otherId ? otherId : user.id;
        const { data } = await supabase.from('conversations')
            .upsert({ participant_1: p1, participant_2: p2 }, { onConflict: 'participant_1,participant_2' })
            .select().single();
        if (data) {
            onClose();
            navigate(`/messages?conv=${data.id}`);
        } else {
            toast.error("Could not start conversation");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto w-[90vw]">
                <DialogHeader>
                    <DialogTitle>{type === 'followers' ? 'Followers' : 'Following'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                    {loading ? (
                        <div className="text-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary mx-auto" /></div>
                    ) : users.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">No users found.</p>
                    ) : (
                        users.map(u => (
                            <div key={u.id} className="flex items-center justify-between gap-2">
                                <Link to={`/profile/${u.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity min-w-0" onClick={onClose}>
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/10 shrink-0">
                                        <img
                                            src={u.avatar_url || "https://images.unsplash.com/photo-1531297172866-cb8d50582515?w=50&h=50&fit=crop"}
                                            alt={u.username}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="truncate">
                                        <p className="font-medium text-sm truncate">{u.full_name || u.username}</p>
                                        <p className="text-xs text-muted-foreground truncate">@{u.username || 'user'}</p>
                                    </div>
                                </Link>
                                <div className="flex gap-2 shrink-0">
                                    {user?.id !== u.id && (
                                        <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => startDM(u.id)}>
                                            <MessageSquare className="w-4 h-4" />
                                        </Button>
                                    )}
                                    <Link to={`/profile/${u.id}`}>
                                        <Button variant="outline" size="sm" onClick={onClose}>View</Button>
                                    </Link>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
