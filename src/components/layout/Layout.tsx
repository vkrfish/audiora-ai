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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradient mesh */}
      <div className="fixed inset-0 bg-mesh-gradient pointer-events-none" />
      
      {/* Navbar */}
      {!hideNav && <Navbar />}
      
      {/* Main Content */}
      <main className={`relative z-10 ${!hideNav ? 'pt-16' : ''} ${showPlayer ? 'pb-32 md:pb-24' : 'pb-20 md:pb-0'}`}>
        {children}
      </main>
      
      {/* Mobile Navigation */}
      {!hideNav && <MobileNav />}
      
      {/* Audio Player */}
      {showPlayer && <AudioPlayer />}
    </div>
  );
};

export default Layout;
