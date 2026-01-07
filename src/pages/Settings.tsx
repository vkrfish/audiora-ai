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

const Settings = () => {
  const [notifications, setNotifications] = useState({
    newFollowers: true,
    likes: true,
    comments: true,
    newEpisodes: true,
    marketing: false
  });

  const [audioSettings, setAudioSettings] = useState({
    autoPlay: true,
    backgroundPlay: true,
    defaultSpeed: "1"
  });

  const settingsSections = [
    {
      title: "Account",
      icon: User,
      items: [
        { label: "Edit Profile", href: "#" },
        { label: "Change Password", href: "#" },
        { label: "Email Preferences", href: "#" }
      ]
    },
    {
      title: "Privacy & Security",
      icon: Shield,
      items: [
        { label: "Privacy Settings", href: "#" },
        { label: "Blocked Users", href: "#" },
        { label: "Two-Factor Authentication", href: "#" }
      ]
    },
    {
      title: "Subscription",
      icon: CreditCard,
      items: [
        { label: "Manage Subscription", href: "#" },
        { label: "Billing History", href: "#" }
      ]
    }
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="font-display text-2xl font-bold mb-8">Settings</h1>

        {/* Account Sections */}
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.title} className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Icon className="w-5 h-5 text-primary" />
                <h2 className="font-display font-semibold">{section.title}</h2>
              </div>
              <div className="glass-card overflow-hidden">
                {section.items.map((item, i) => (
                  <button
                    key={item.label}
                    className={cn(
                      "w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors text-left",
                      i !== section.items.length - 1 && "border-b border-border"
                    )}
                  >
                    <span>{item.label}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        {/* Notifications */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="font-display font-semibold">Notifications</h2>
          </div>
          <div className="glass-card p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="newFollowers">New followers</Label>
              <Switch
                id="newFollowers"
                checked={notifications.newFollowers}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, newFollowers: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="likes">Likes on your content</Label>
              <Switch
                id="likes"
                checked={notifications.likes}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, likes: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="comments">Comments and replies</Label>
              <Switch
                id="comments"
                checked={notifications.comments}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, comments: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="newEpisodes">New episodes from followed creators</Label>
              <Switch
                id="newEpisodes"
                checked={notifications.newEpisodes}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, newEpisodes: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="marketing">Marketing emails</Label>
              <Switch
                id="marketing"
                checked={notifications.marketing}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, marketing: checked })
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
                checked={audioSettings.autoPlay}
                onCheckedChange={(checked) =>
                  setAudioSettings({ ...audioSettings, autoPlay: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="backgroundPlay">Background playback</Label>
              <Switch
                id="backgroundPlay"
                checked={audioSettings.backgroundPlay}
                onCheckedChange={(checked) =>
                  setAudioSettings({ ...audioSettings, backgroundPlay: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="playbackSpeed">Default playback speed</Label>
              <Select
                value={audioSettings.defaultSpeed}
                onValueChange={(value) =>
                  setAudioSettings({ ...audioSettings, defaultSpeed: value })
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
              <Select defaultValue="en">
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
              <Select defaultValue="dark">
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
        <Button variant="outline" className="w-full text-destructive hover:text-destructive gap-2">
          <LogOut className="w-4 h-4" />
          Sign out
        </Button>
      </div>
    </Layout>
  );
};

export default Settings;
