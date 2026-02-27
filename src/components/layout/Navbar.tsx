import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Home, Search, Plus, User, Headphones, LogOut,
  Bell, MessageSquare, Compass, Menu, X, Settings
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

  return (
    <>
      {/* ── Desktop Left Sidebar ── */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 z-50 flex-col group/sidebar transition-all duration-300 ease-in-out w-[68px] hover:w-[210px] overflow-hidden bg-[#070707]/80 backdrop-blur-xl border-r border-white/[0.03]">

        {/* Subtle right-edge glow */}
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/15 to-transparent pointer-events-none" />

        {/* Logo */}
        <Link to="/" className="flex items-center h-16 px-[18px] shrink-0 group/logo">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#3DDABA] to-[#F19861] flex items-center justify-center shrink-0 shadow-[0_0_14px_rgba(61,218,186,0.30)] group-hover/logo:shadow-[0_0_22px_rgba(61,218,186,0.45)] transition-all duration-300">
            <Headphones className="w-5 h-5 text-black" />
          </div>
          <span className="ml-3.5 font-black text-sm tracking-tight whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-all duration-200 delay-75 bg-gradient-to-r from-[#3DDABA] to-[#F19861] bg-clip-text text-transparent">
            Audiora
          </span>
        </Link>

        {/* Divider with extra gap below logo */}
        <div className="mx-3 mb-3 h-px bg-white/[0.04]" />

        {/* Nav Links */}
        <div className="flex-1 py-2 flex flex-col gap-0.5 px-2.5 overflow-hidden">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.to);
            return (
              <Link key={link.to} to={link.to} className="relative group/item">
                <div className={cn(
                  "flex items-center gap-3.5 px-3 py-3.5 rounded-xl transition-all duration-200 relative overflow-hidden",
                  active
                    ? "bg-primary/8 text-primary"
                    : "text-muted-foreground/40 hover:text-muted-foreground/80 hover:bg-white/[0.03]"
                )}>
                  {active && <div className="absolute inset-0 bg-primary/5 rounded-xl" />}
                  <div className="relative shrink-0">
                    <Icon
                      className={cn("transition-transform group-hover/item:scale-110", active && "drop-shadow-[0_0_5px_rgba(61,218,186,0.5)]")}
                      style={{ width: '22px', height: '22px' }}
                    />
                    {link.badge !== undefined && link.badge > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-primary text-black text-[8px] flex items-center justify-center font-black ring-2 ring-[#070707]">
                        {link.badge > 9 ? '9+' : link.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-all duration-200 delay-75 relative tracking-wide">
                    {link.label}
                  </span>
                </div>
                {/* Active left-bar indicator */}
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full shadow-[0_0_8px_rgba(61,218,186,0.7)]" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Bottom section: Settings + Sign Out */}
        <div className="shrink-0 px-2.5 pb-6">
          <div className="mx-0 mb-3 h-px bg-white/[0.03]" />

          {/* Settings */}
          <Link to="/settings" className="relative group/item">
            <div className={cn(
              "flex items-center gap-3.5 px-3 py-3.5 rounded-xl transition-all duration-200",
              isActive('/settings')
                ? "bg-primary/8 text-primary"
                : "text-muted-foreground/30 hover:text-muted-foreground/70 hover:bg-white/[0.03]"
            )}>
              <Settings style={{ width: '22px', height: '22px' }} className="shrink-0 transition-transform group-hover/item:rotate-45 duration-300" />
              <span className="text-xs font-semibold whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-all duration-200 delay-75 tracking-wide">
                Settings
              </span>
            </div>
          </Link>

          {/* Sign Out */}
          {user ? (
            <button
              onClick={async () => { await signOut(); navigate('/login'); }}
              className="flex items-center gap-3.5 px-3 py-3.5 rounded-xl w-full text-muted-foreground/25 hover:text-red-400/80 hover:bg-red-500/[0.04] transition-all duration-200 group/item"
            >
              <LogOut style={{ width: '22px', height: '22px' }} className="shrink-0 transition-transform group-hover/item:translate-x-0.5 duration-200" />
              <span className="text-xs font-semibold whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-all duration-200 delay-75 tracking-wide">
                Sign Out
              </span>
            </button>
          ) : (
            <Link to="/login" className="flex items-center gap-3.5 px-3 py-3.5 rounded-xl text-muted-foreground/25 hover:text-primary/80 hover:bg-primary/[0.04] transition-all duration-200">
              <User style={{ width: '22px', height: '22px' }} className="shrink-0" />
              <span className="text-xs font-semibold whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-all duration-200 delay-75 tracking-wide">
                Sign In
              </span>
            </Link>
          )}
        </div>
      </nav>

      {/* ── Mobile Top Bar ── */}
      <nav className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#070707]/80 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="flex items-center justify-between h-14 px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#3DDABA] to-[#F19861] flex items-center justify-center shadow-[0_0_12px_rgba(61,218,186,0.28)]">
              <Headphones className="w-4 h-4 text-black" />
            </div>
            <span className="font-black text-base tracking-tight bg-gradient-to-r from-[#3DDABA] to-[#F19861] bg-clip-text text-transparent">Audiora</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-9 h-9 rounded-xl bg-white/[0.03] flex items-center justify-center border border-white/[0.05]"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            {(unreadNotifs + unreadMessages) > 0 && !mobileMenuOpen && (
              <span className="absolute top-2.5 right-3 w-2 h-2 rounded-full bg-primary ring-2 ring-background" />
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="bg-[#070707]/95 backdrop-blur-2xl border-t border-white/[0.04] px-3 py-3 flex flex-col gap-1 animate-in fade-in slide-in-from-top-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.to);
              return (
                <Link key={link.to} to={link.to} onClick={() => setMobileMenuOpen(false)}>
                  <div className={cn(
                    "flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all",
                    active ? "bg-primary/8 text-primary border border-primary/15" : "text-muted-foreground/50 hover:text-foreground hover:bg-white/[0.03]"
                  )}>
                    <Icon style={{ width: '18px', height: '18px' }} />
                    <span className="text-sm font-semibold">{link.label}</span>
                    {link.badge !== undefined && link.badge > 0 && (
                      <span className="ml-auto text-[10px] bg-primary text-black px-2 py-0.5 rounded-full font-black">{link.badge}</span>
                    )}
                  </div>
                </Link>
              );
            })}
            <Link to="/settings" onClick={() => setMobileMenuOpen(false)}>
              <div className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-muted-foreground/40 hover:text-foreground hover:bg-white/[0.03] transition-all">
                <Settings style={{ width: '18px', height: '18px' }} />
                <span className="text-sm font-semibold">Settings</span>
              </div>
            </Link>
            {user && (
              <button
                onClick={async () => { await signOut(); navigate('/login'); setMobileMenuOpen(false); }}
                className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-muted-foreground/30 hover:text-red-400/80 hover:bg-red-500/[0.04] transition-all w-full border-t border-white/[0.04] mt-1 pt-3"
              >
                <LogOut style={{ width: '18px', height: '18px' }} />
                <span className="text-sm font-semibold">Sign Out</span>
              </button>
            )}
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
