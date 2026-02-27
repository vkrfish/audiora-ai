import { ReactNode } from "react";
import Navbar from "./Navbar";
import MobileNav from "./MobileNav";
import AudioPlayer from "@/components/audio/AudioPlayer";

interface LayoutProps {
  children: ReactNode;
  showPlayer?: boolean;
  hideNav?: boolean;
}

const Layout = ({ children, showPlayer = false, hideNav = false }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-[#050505] relative overflow-hidden text-slate-50 selection:bg-primary/30 selection:text-primary">
      {/* Background depth & accents */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[50%] bg-primary/10 rounded-full blur-[120px] animate-pulse-slow opacity-60" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[50%] bg-accent/10 rounded-full blur-[120px] animate-pulse-slow opacity-60" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(var(--primary),0.02)_0%,transparent_70%)]" />
      </div>

      {/* Navbar */}
      {!hideNav && <Navbar />}

      {/* Main Content */}
      <main className={`relative z-10 ${!hideNav ? 'pt-14 md:pt-0 md:pl-[68px]' : ''} ${showPlayer ? 'pb-32 md:pb-24' : 'pb-20 md:pb-0'}`}>
        <div className="animate-in fade-in duration-700 ease-out">
          {children}
        </div>
      </main>

      {/* Mobile Navigation */}
      {!hideNav && <MobileNav />}

      {/* Audio Player */}
      {showPlayer && <AudioPlayer />}
    </div>
  );
};

export default Layout;
