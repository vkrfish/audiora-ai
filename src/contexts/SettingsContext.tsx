import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Settings {
    notifications: {
        newFollowers: boolean;
        likes: boolean;
        comments: boolean;
        newEpisodes: boolean;
        marketing: boolean;
    };
    audio: {
        autoPlay: boolean;
        backgroundPlay: boolean;
        defaultSpeed: string;
    };
    theme: 'dark' | 'light' | 'system';
    language: string;
    isPrivate: boolean;
}

interface SettingsContextType {
    settings: Settings;
    updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
    loading: boolean;
}

const defaultSettings: Settings = {
    notifications: {
        newFollowers: true,
        likes: true,
        comments: true,
        newEpisodes: true,
        marketing: false,
    },
    audio: {
        autoPlay: true,
        backgroundPlay: true,
        defaultSpeed: '1',
    },
    theme: 'dark',
    language: 'en',
    isPrivate: false,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const [settings, setSettings] = useState<Settings>(() => {
        const saved = localStorage.getItem('audiora_settings_cache');
        return saved ? JSON.parse(saved) : defaultSettings;
    });
    const [loading, setLoading] = useState(true);

    // Fetch from Supabase
    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchSettings = async () => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('settings, is_private, language')
                    .eq('id', user.id)
                    .single();

                if (error) throw error;

                if (data) {
                    const mergedSettings: Settings = {
                        ...defaultSettings,
                        ...data.settings,
                        isPrivate: data.is_private ?? false,
                        language: data.language ?? 'en',
                    };
                    setSettings(mergedSettings);
                    localStorage.setItem('audiora_settings_cache', JSON.stringify(mergedSettings));
                }
            } catch (err) {
                console.error('Error fetching settings:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [user]);

    // Apply Theme & Language
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');

        if (settings.theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            root.classList.add(systemTheme);
        } else {
            root.classList.add(settings.theme);
        }

        // Set language globally if needed (e.g. for i18n)
        document.documentElement.lang = settings.language;
    }, [settings.theme, settings.language]);

    const updateSettings = async (newSettings: Partial<Settings>) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);
        localStorage.setItem('audiora_settings_cache', JSON.stringify(updated));

        if (user) {
            try {
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        settings: {
                            notifications: updated.notifications,
                            audio: updated.audio,
                            theme: updated.theme,
                        },
                        is_private: updated.isPrivate,
                        language: updated.language,
                    })
                    .eq('id', user.id);

                if (error) throw error;
            } catch (err) {
                console.error('Error updating settings:', err);
                toast.error('Failed to sync settings to cloud');
            }
        }
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
