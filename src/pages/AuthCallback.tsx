import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function AuthCallback() {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                // Log the full URL for debugging
                console.log("Auth callback URL:", window.location.href);
                console.log("Auth callback hash:", location.hash);

                // Check for error in hash
                if (location.hash && location.hash.includes('error_description=')) {
                    const params = new URLSearchParams(location.hash.replace('#', '?'));
                    const errorDesc = params.get('error_description');
                    if (errorDesc) {
                        const message = decodeURIComponent(errorDesc).replace(/\+/g, ' ');
                        toast.error(`Login failed: ${message}`);
                        navigate('/login', { replace: true });
                        return;
                    }
                }

                // Wait a short delay to allow supabase.auth.onAuthStateChange in useAuth to fire
                setTimeout(async () => {
                    const { data: { session }, error } = await supabase.auth.getSession();

                    if (error) {
                        console.error('Error fetching session in callback:', error);
                        toast.error(error.message);
                        navigate('/login', { replace: true });
                        return;
                    }

                    if (session) {
                        console.log("Session found, redirecting to feed...");
                        navigate('/feed', { replace: true });
                    } else {
                        console.warn("No session found after callback, redirecting to login. Make sure Site URL is correct.");
                        navigate('/login', { replace: true });
                    }
                }, 1000); // 1 second delay

            } catch (err: any) {
                console.error('Error during auth callback:', err);
                toast.error(err.message || 'An error occurred during sign in');
                navigate('/login', { replace: true });
            }
        };

        handleAuthCallback();
    }, [navigate, location]);

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <p className="text-muted-foreground animate-pulse">Completing sign in...</p>
        </div>
    );
}
