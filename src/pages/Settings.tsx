import { useState } from "react";
import {
  User,
  Bell,
  Shield,
  Globe,
  Palette,
  Volume2,
  CreditCard,
  ChevronRight,
  LogOut
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useSettings } from "@/contexts/SettingsContext";
import { EditProfileModal } from "@/components/modals/EditProfileModal";
import { BlockedUsersModal } from "@/components/modals/BlockedUsersModal";
import { useAuth } from "@/hooks/useAuth";

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings, updateSettings, loading: settingsLoading } = useSettings();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isViewingBlocked, setIsViewingBlocked] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate('/login');
  };

  const handleResetPassword = async () => {
    if (!user?.email) return toast.error("No email associated with this user.");
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password reset email sent! Check your inbox.");
    }
  };

  const accountItems = [
    { label: "Edit Profile", onClick: () => setIsEditingProfile(true) },
    { label: "Change Password", onClick: handleResetPassword },
    {
      label: "Email Preferences", onClick: () => {
        document.getElementById('notifications-section')?.scrollIntoView({ behavior: 'smooth' });
        toast.info("Adjust your marketing email preferences below.");
      }
    }
  ];

  const privSecItems = [
    { label: "Blocked Users", onClick: () => setIsViewingBlocked(true) },
    { label: "Two-Factor Authentication", onClick: () => toast.info("Supabase MFA integration coming soon.") }
  ];

  const subscriptionItems = [
    { label: "Manage Subscription", onClick: () => toast.info("You are currently on the Free Tier.") },
    { label: "Billing History", onClick: () => toast.info("No active payment method on file.") }
  ];

  if (settingsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="font-display text-2xl font-bold mb-8">Settings</h1>

        {user && (
          <>
            <EditProfileModal
              isOpen={isEditingProfile}
              onClose={() => setIsEditingProfile(false)}
              userId={user.id}
            />
            <BlockedUsersModal
              isOpen={isViewingBlocked}
              onClose={() => setIsViewingBlocked(false)}
              userId={user.id}
            />
          </>
        )}

        {/* Account Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-primary" />
            <h2 className="font-display font-semibold">Account</h2>
          </div>
          <div className="glass-card overflow-hidden">
            {accountItems.map((item, i) => (
              <button
                key={item.label}
                className={cn(
                  "w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors text-left",
                  i !== accountItems.length - 1 && "border-b border-border"
                )}
                onClick={item.onClick}
              >
                <span>{item.label}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>

        {/* Privacy Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="font-display font-semibold">Privacy & Security</h2>
          </div>
          <div className="glass-card p-4 space-y-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isPrivate">Private Account</Label>
                <p className="text-xs text-muted-foreground">Only your followers can see your content.</p>
              </div>
              <Switch
                id="isPrivate"
                checked={settings.isPrivate}
                onCheckedChange={(checked) => updateSettings({ isPrivate: checked })}
              />
            </div>
          </div>
          <div className="glass-card overflow-hidden">
            {privSecItems.map((item, i) => (
              <button
                key={item.label}
                className={cn(
                  "w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors text-left",
                  i !== privSecItems.length - 1 && "border-b border-border"
                )}
                onClick={item.onClick}
              >
                <span>{item.label}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>

        {/* Subscription Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-primary" />
            <h2 className="font-display font-semibold">Subscription</h2>
          </div>
          <div className="glass-card overflow-hidden">
            {subscriptionItems.map((item, i) => (
              <button
                key={item.label}
                className={cn(
                  "w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors text-left",
                  i !== subscriptionItems.length - 1 && "border-b border-border"
                )}
                onClick={item.onClick}
              >
                <span>{item.label}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="mb-8" id="notifications-section">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="font-display font-semibold">Notifications</h2>
          </div>
          <div className="glass-card p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="newFollowers">New followers</Label>
              <Switch
                id="newFollowers"
                checked={settings.notifications.newFollowers}
                onCheckedChange={(checked) =>
                  updateSettings({ notifications: { ...settings.notifications, newFollowers: checked } })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="likes">Likes on your content</Label>
              <Switch
                id="likes"
                checked={settings.notifications.likes}
                onCheckedChange={(checked) =>
                  updateSettings({ notifications: { ...settings.notifications, likes: checked } })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="comments">Comments and replies</Label>
              <Switch
                id="comments"
                checked={settings.notifications.comments}
                onCheckedChange={(checked) =>
                  updateSettings({ notifications: { ...settings.notifications, comments: checked } })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="newEpisodes">New episodes from followed creators</Label>
              <Switch
                id="newEpisodes"
                checked={settings.notifications.newEpisodes}
                onCheckedChange={(checked) =>
                  updateSettings({ notifications: { ...settings.notifications, newEpisodes: checked } })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="marketing">Marketing emails</Label>
              <Switch
                id="marketing"
                checked={settings.notifications.marketing}
                onCheckedChange={(checked) =>
                  updateSettings({ notifications: { ...settings.notifications, marketing: checked } })
                }
              />
            </div>
          </div>
        </div>

        {/* Audio Settings */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Volume2 className="w-5 h-5 text-primary" />
            <h2 className="font-display font-semibold">Audio</h2>
          </div>
          <div className="glass-card p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="autoPlay">Auto-play next episode</Label>
              <Switch
                id="autoPlay"
                checked={settings.audio.autoPlay}
                onCheckedChange={(checked) =>
                  updateSettings({ audio: { ...settings.audio, autoPlay: checked } })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="backgroundPlay">Background playback</Label>
              <Switch
                id="backgroundPlay"
                checked={settings.audio.backgroundPlay}
                onCheckedChange={(checked) =>
                  updateSettings({ audio: { ...settings.audio, backgroundPlay: checked } })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="playbackSpeed">Default playback speed</Label>
              <Select
                value={settings.audio.defaultSpeed}
                onValueChange={(value) =>
                  updateSettings({ audio: { ...settings.audio, defaultSpeed: value } })
                }
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">0.5x</SelectItem>
                  <SelectItem value="0.75">0.75x</SelectItem>
                  <SelectItem value="1">1x</SelectItem>
                  <SelectItem value="1.25">1.25x</SelectItem>
                  <SelectItem value="1.5">1.5x</SelectItem>
                  <SelectItem value="2">2x</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Language */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="font-display font-semibold">Language & Region</h2>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center justify-between">
              <Label>Display Language</Label>
              <Select value={settings.language} onValueChange={(v) => updateSettings({ language: v })}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-primary" />
            <h2 className="font-display font-semibold">Appearance</h2>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center justify-between">
              <Label>Theme</Label>
              <Select value={settings.theme} onValueChange={(v: any) => updateSettings({ theme: v })}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Logout */}
        <Button onClick={handleLogout} variant="outline" className="w-full text-destructive hover:text-destructive gap-2">
          <LogOut className="w-4 h-4" />
          Sign out
        </Button>
      </div>
    </Layout>
  );
};

export default Settings;
