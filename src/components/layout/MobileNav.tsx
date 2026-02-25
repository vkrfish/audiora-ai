import { Link, useLocation } from "react-router-dom";
import { Home, Search, Plus, User, Bell, MessageSquare, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/contexts/NotificationContext";

const MobileNav = () => {
  const location = useLocation();
  const { unreadMessages } = useNotifications();

  const navItems = [
    { to: "/feed", label: "Home", icon: Home },
    { to: "/explore", label: "Explore", icon: Compass },
    { to: "/create", label: "Create", icon: Plus, isCreate: true },
    { to: "/messages", label: "DMs", icon: MessageSquare, badge: unreadMessages },
    { to: "/profile", label: "Profile", icon: User },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-t border-border/50 pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);

          if (item.isCreate) {
            return (
              <Link
                key={item.to}
                to={item.to}
                className="flex flex-col items-center gap-1"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow-sm -mt-4">
                  <Icon className="w-5 h-5 text-primary-foreground" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center gap-1 py-2 px-4 transition-colors relative",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn("w-5 h-5", active && "text-primary")} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold shadow-sm">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
