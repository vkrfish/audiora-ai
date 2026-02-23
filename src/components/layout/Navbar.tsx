import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Home, Search, Plus, User, Menu, Headphones, LogOut,
  Bookmark, Bell, MessageSquare, Compass
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Load unread counts
  useEffect(() => {
    if (!user) return;
    const fetchCounts = async () => {
      const [{ count: notifs }, { count: msgs }] = await Promise.all([
        supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false),
        supabase.from('messages').select('*', { count: 'exact', head: true }).neq('sender_id', user.id).eq('is_read', false)
      ]);
      setUnreadNotifs(notifs || 0);
      setUnreadMessages(msgs || 0);
    };
    fetchCounts();

    // Real-time subscriptions for badges
    const channel = supabase.channel('navbar-sync')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => setUnreadNotifs(n => n + 1))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => fetchCounts())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload: any) => {
          if (payload.new.sender_id !== user.id) {
            setUnreadMessages(m => m + 1);
          }
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' },
        () => fetchCounts()) // Refresh when messages are marked as read
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const navLinks = [
    { to: "/feed", label: "Feed", icon: Home },
    { to: "/explore", label: "Explore", icon: Compass },
    { to: "/discover", label: "Discover", icon: Search },
    { to: "/create", label: "Create", icon: Plus },
    { to: "/messages", label: "Messages", icon: MessageSquare, badge: unreadMessages },
    { to: "/notifications", label: "Alerts", icon: Bell, badge: unreadNotifs },
    { to: "/profile", label: "Profile", icon: User },
  ];

  const isActive = (path: string) => location.pathname === path;

  const NavBadge = ({ count }: { count: number }) => count > 0 ? (
    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
      {count > 9 ? '9+' : count}
    </span>
  ) : null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow-sm group-hover:shadow-glow transition-shadow duration-300">
                <Headphones className="w-5 h-5 text-primary-foreground" />
              </div>
            </div>
            <span className="font-display font-bold text-xl gradient-text">Audiora</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.to} to={link.to}>
                  <Button variant="ghost" className={cn("gap-2 px-3 relative", isActive(link.to) && "bg-secondary text-primary")}>
                    <div className="relative">
                      <Icon className="w-4 h-4" />
                      {link.badge !== undefined && <NavBadge count={link.badge} />}
                    </div>
                    {link.label}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Auth (desktop) */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <span className="hidden lg:inline">{user.user_metadata?.full_name || user.email?.split('@')[0]}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate('/login'); }} className="gap-2">
                  <LogOut className="w-4 h-4" />Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
                <Link to="/signup"><Button variant="hero" size="sm">Get Started</Button></Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <Button variant="ghost" size="icon" className="md:hidden relative" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Menu className="w-5 h-5" />
            {(unreadNotifs + unreadMessages) > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
            )}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-fade-in">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link key={link.to} to={link.to} onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className={cn("w-full justify-start gap-3", isActive(link.to) && "bg-secondary text-primary")}>
                      <div className="relative">
                        <Icon className="w-4 h-4" />
                        {link.badge !== undefined && <NavBadge count={link.badge} />}
                      </div>
                      {link.label}
                      {link.badge !== undefined && link.badge > 0 && (
                        <span className="ml-auto text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">{link.badge}</span>
                      )}
                    </Button>
                  </Link>
                );
              })}
              <div className="flex gap-2 mt-4 pt-4 border-t border-border/50">
                {user ? (
                  <Button variant="outline" className="w-full gap-2" onClick={async () => { await signOut(); navigate('/login'); setMobileMenuOpen(false); }}>
                    <LogOut className="w-4 h-4" />Sign Out
                  </Button>
                ) : (
                  <>
                    <Link to="/login" className="flex-1"><Button variant="outline" className="w-full">Log in</Button></Link>
                    <Link to="/signup" className="flex-1"><Button variant="hero" className="w-full">Get Started</Button></Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
