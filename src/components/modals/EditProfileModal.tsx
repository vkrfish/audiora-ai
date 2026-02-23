import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    onSuccess?: () => void;
}

export function EditProfileModal({ isOpen, onClose, userId, onSuccess }: EditProfileModalProps) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        full_name: "",
        username: "",
        bio: "",
        niche: "",
        avatar_url: "",
        cover_url: ""
    });

    useEffect(() => {
        if (!isOpen || !userId) return;

        const fetchProfile = async () => {
            setLoading(true);
            const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
            if (!error && data) {
                setFormData({
                    full_name: data.full_name || "",
                    username: data.username || "",
                    bio: data.bio || "",
                    niche: data.niche || "",
                    avatar_url: data.avatar_url || "",
                    cover_url: data.cover_url || ""
                });
            }
            setLoading(false);
        };

        fetchProfile();
    }, [isOpen, userId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSave = async () => {
        if (!userId) return;
        setSaving(true);

        const updates = {
            ...formData,
            updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId);

        if (error) {
            toast.error(error.message);
        } else {
            toast.success("Profile updated successfully!");
            if (onSuccess) onSuccess();
            onClose();
        }
        setSaving(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                </DialogHeader>
                {loading ? (
                    <div className="py-8 flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="full_name">Full Name</Label>
                            <Input id="full_name" value={formData.full_name} onChange={handleChange} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="username">Username</Label>
                            <Input id="username" value={formData.username} onChange={handleChange} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea id="bio" value={formData.bio} onChange={handleChange} rows={3} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="niche">Niche (e.g. Technology, Comedy)</Label>
                            <Input id="niche" value={formData.niche} onChange={handleChange} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="avatar_url">Profile Picture URL</Label>
                            <Input id="avatar_url" value={formData.avatar_url} onChange={handleChange} placeholder="https://..." />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="cover_url">Cover Image URL</Label>
                            <Input id="cover_url" value={formData.cover_url} onChange={handleChange} placeholder="https://..." />
                        </div>
                    </div>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving || loading}>
                        {saving ? "Saving..." : "Save changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
