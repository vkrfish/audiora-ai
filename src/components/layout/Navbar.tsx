import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Home, Search, Plus, User, Menu, Headphones, LogOut,
  Bell, MessageSquare, Compass
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/contexts/NotificationContext";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { unreadNotifs, unreadMessages } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center font-bold ring-2 ring-background">
      {count > 9 ? '9+' : count}
    </span>
  ) : null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-2xl border-b border-border/40 shadow-sm">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group transition-transform active:scale-95">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center shadow-[0_0_15px_rgba(var(--primary),0.3)] group-hover:shadow-[0_0_20px_rgba(var(--primary),0.5)] transition-all duration-300">
                <Headphones className="w-4 h-4 text-primary-foreground" />
              </div>
            </div>
            <span className="font-display font-black text-lg tracking-tighter gradient-text">Audiora</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 bg-secondary/30 p-1 rounded-full border border-border/20">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.to);
              return (
                <Link key={link.to} to={link.to} className="relative group">
                  <div className={cn(
                    "flex items-center gap-2 px-4 py-1.5 rounded-full transition-all duration-300 relative overflow-hidden",
                    active
                      ? "bg-primary/10 text-primary shadow-[inset_0_0_10px_rgba(var(--primary),0.1)]"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}>
                    {active && (
                      <div className="absolute inset-0 bg-primary/10 animate-pulse-slow" />
                    )}
                    <div className="relative z-10">
                      <Icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", active && "drop-shadow-glow")} />
                      {link.badge !== undefined && <NavBadge count={link.badge} />}
                    </div>
                    <span className="text-xs font-bold tracking-tight relative z-10">{link.label}</span>
                  </div>
                  {active && (
                    <div className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 w-4 h-[2px] bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Auth (desktop) */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2.5 pl-3 border-l border-border/40 group cursor-pointer">
                  <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                    {user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0]}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary to-secondary/50 border border-border/40 flex items-center justify-center group-hover:border-primary/30 transition-all shadow-inner">
                    <User className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => { await signOut(); navigate('/login'); }}
                  className="h-8 px-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-red-400 hover:bg-red-500/5 transition-all gap-1.5"
                >
                  <LogOut className="w-3 h-3" />
                  Exit
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login"><Button variant="ghost" size="sm" className="h-8 text-xs font-bold">Sign In</Button></Link>
                <Link to="/signup"><Button variant="hero" size="sm" className="h-8 text-xs font-bold rounded-lg shadow-glow-sm">Get Started</Button></Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <Button variant="ghost" size="icon" className="md:hidden relative h-9 w-9 rounded-lg bg-secondary/50" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Menu className="w-5 h-5" />
            {(unreadNotifs + unreadMessages) > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary ring-2 ring-background ring-offset-1 ring-offset-transparent" />
            )}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/40 animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-col gap-1.5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.to);
                return (
                  <Link key={link.to} to={link.to} onClick={() => setMobileMenuOpen(false)}>
                    <div className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all",
                      active ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground active:bg-white/5"
                    )}>
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-bold">{link.label}</span>
                      {link.badge !== undefined && link.badge > 0 && (
                        <span className="ml-auto text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-bold">{link.badge}</span>
                      )}
                    </div>
                  </Link>
                );
              })}
              <div className="mt-4 pt-4 border-t border-border/40 space-y-2">
                {user ? (
                  <Button variant="outline" className="w-full h-10 rounded-xl gap-2 font-bold text-xs shadow-sm hover:bg-red-500/5 hover:text-red-400 hover:border-red-500/20" onClick={async () => { await signOut(); navigate('/login'); setMobileMenuOpen(false); }}>
                    <LogOut className="w-4 h-4" />Sign Out
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Link to="/login" className="flex-1"><Button variant="outline" className="w-full h-10 rounded-xl font-bold text-xs">Sign In</Button></Link>
                    <Link to="/signup" className="flex-1"><Button variant="hero" className="w-full h-10 rounded-xl font-bold text-xs shadow-glow-sm">Join Now</Button></Link>
                  </div>
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
