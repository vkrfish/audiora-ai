import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { toast } from "sonner";
import { AudioProvider } from "@/contexts/AudioContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { CreationProvider } from "@/contexts/CreationContext";
import Index from "./pages/Index";
import Create from "./pages/Create";
import Feed from "./pages/Feed";
import Discover from "./pages/Discover";
import Explore from "./pages/Explore";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Settings from "./pages/Settings";
import UpdatePassword from "./pages/UpdatePassword";
import NotFound from "./pages/NotFound";
import AuthCallback from "./pages/AuthCallback";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
  if (user) return <Navigate to="/feed" replace />;
  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/create" element={<ProtectedRoute><Create /></ProtectedRoute>} />
    <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
    <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
    <Route path="/discover" element={<ProtectedRoute><Discover /></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    <Route path="/profile/:userId" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
    <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
    <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
    <Route path="/update-password" element={<ProtectedRoute><UpdatePassword /></ProtectedRoute>} />
    <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
    <Route path="/signup" element={<AuthRoute><Signup /></AuthRoute>} />
    <Route path="/auth/callback" element={<AuthCallback />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SettingsProvider>
        <CreationProvider>
          <AudioProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </TooltipProvider>
          </AudioProvider>
        </CreationProvider>
      </SettingsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
