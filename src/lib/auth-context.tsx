'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from './supabase/client';
import { Profile } from '@/types/database';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  isDemoMode: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (data: { name: string; username: string; email: string; phone?: string; password: string }) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error?: string }>;
  refreshProfile: () => Promise<void>;
  setOnlineStatus: (isOnline: boolean) => Promise<void>;
  switchDemoUser: (index: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Realistic demo fallback users for instant out-of-the-box local testing before SQL migration
export const DEMO_USERS: Profile[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Alex Johnson',
    username: 'alex_j',
    phone: '+1 555-0192',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    about: 'Building real-time apps with PUNDA 🚀',
    last_seen: new Date().toISOString(),
    is_online: true,
    privacy_last_seen: 'everyone',
    privacy_avatar: 'everyone',
    privacy_about: 'everyone',
    wallpaper: 'default',
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Sarah Connor',
    username: 'sarah_c',
    phone: '+1 555-0144',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    about: 'Available | WhatsApp enthusiast',
    last_seen: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    is_online: true,
    privacy_last_seen: 'everyone',
    privacy_avatar: 'everyone',
    privacy_about: 'everyone',
    wallpaper: 'emerald',
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Michael Chen',
    username: 'mchen',
    phone: '+1 555-0188',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    about: 'In a meeting 📞',
    last_seen: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    is_online: false,
    privacy_last_seen: 'everyone',
    privacy_avatar: 'everyone',
    privacy_about: 'everyone',
    wallpaper: 'default',
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  // Rate limiting map for client requests (IP or local token)
  const [rateLimitTimestamps, setRateLimitTimestamps] = useState<number[]>([]);

  const checkRateLimit = (maxAttempts = 5, windowMs = 60000): boolean => {
    const now = Date.now();
    const recent = rateLimitTimestamps.filter((ts) => now - ts < windowMs);
    if (recent.length >= maxAttempts) {
      return false; // Rate limited
    }
    setRateLimitTimestamps([...recent, now]);
    return true;
  };

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Could not fetch profile from Supabase:', error.message);
        return null;
      }
      return data as Profile;
    } catch (err) {
      console.error('Error fetching profile:', err);
      return null;
    }
  }, []);

  const setOnlineStatus = useCallback(async (isOnline: boolean) => {
    if (!profile?.id) return;
    if (isDemo) {
      setProfile((prev) => (prev ? { ...prev, is_online: isOnline, last_seen: new Date().toISOString() } : null));
      return;
    }

    try {
      const supabase = getSupabaseClient();
      await supabase
        .from('profiles')
        .update({
          is_online: isOnline,
          last_seen: new Date().toISOString(),
        })
        .eq('id', profile.id);
    } catch (err) {
      console.warn('Failed to update online status:', err);
    }
  }, [profile?.id, isDemo]);

  // Initial session restoration
  useEffect(() => {
    const initAuth = async () => {
      const configured = isSupabaseConfigured();

      if (!configured) {
        // Fallback to local persistent demo session if not configured yet
        setIsDemo(true);
        const savedDemo = typeof window !== 'undefined' ? localStorage.getItem('punda_demo_user') : null;
        if (savedDemo) {
          try {
            const activeProfile = JSON.parse(savedDemo);
            setProfile(activeProfile);
            setUser({ id: activeProfile.id, email: `${activeProfile.username}@punda.app` } as unknown as User);
          } catch {
            setProfile(null);
            setUser(null);
          }
        } else {
          setProfile(null);
          setUser(null);
        }
        setLoading(false);
        return;
      }

      try {
        const supabase = getSupabaseClient();
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          const prof = await fetchProfile(initialSession.user.id);
          setProfile(prof);
        }
      } catch (err) {
        console.error('Supabase getSession failed, falling back to demo session:', err);
        setIsDemo(true);
        setProfile(DEMO_USERS[0]);
        setUser({ id: DEMO_USERS[0].id, email: 'alex_j@punda.app' } as unknown as User);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen to Supabase auth state changes if configured
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          const prof = await fetchProfile(newSession.user.id);
          setProfile(prof);
        } else {
          setProfile(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [fetchProfile]);

  // Handle visibility & window beforeunload online status
  useEffect(() => {
    if (!profile?.id) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setOnlineStatus(true);
      } else {
        setOnlineStatus(false);
      }
    };

    const handleBeforeUnload = () => {
      setOnlineStatus(false);
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    setOnlineStatus(true);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [profile?.id, setOnlineStatus]);

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    if (!checkRateLimit(6, 60000)) {
      return { error: 'Too many login attempts. Please wait 1 minute before trying again.' };
    }

    if (isDemo || !isSupabaseConfigured()) {
      try {
        const res = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'login', email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          const matched = DEMO_USERS.find(
            (u) => u.username.toLowerCase() === email.toLowerCase() || email.includes(u.username)
          );
          if (matched) {
            setProfile(matched);
            setUser({ id: matched.id, email: `${matched.username}@punda.app` } as unknown as User);
            localStorage.setItem('punda_demo_user', JSON.stringify(matched));
            return {};
          }
          return { error: data.error || 'User not found. Please create an account.' };
        }
        setProfile(data.profile);
        setUser({ id: data.profile.id, email: `${data.profile.username}@punda.app` } as unknown as User);
        localStorage.setItem('punda_demo_user', JSON.stringify(data.profile));
        return {};
      } catch {
        const matched = DEMO_USERS.find(
          (u) => u.username.toLowerCase() === email.toLowerCase() || email.includes(u.username)
        ) || DEMO_USERS[0];
        setProfile(matched);
        setUser({ id: matched.id, email: `${matched.username}@punda.app` } as unknown as User);
        localStorage.setItem('punda_demo_user', JSON.stringify(matched));
        return {};
      }
    }

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        setUser(data.user);
        const prof = await fetchProfile(data.user.id);
        setProfile(prof);
      }
      return {};
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to sign in. Please check your network connection.';
      return { error: message };
    }
  };

  const signUp = async (data: {
    name: string;
    username: string;
    email: string;
    phone?: string;
    password: string;
  }): Promise<{ error?: string }> => {
    if (!checkRateLimit(4, 60000)) {
      return { error: 'Too many signup attempts. Please try again in a minute.' };
    }

    if (isDemo || !isSupabaseConfigured()) {
      try {
        const res = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'register', data }),
        });
        const result = await res.json();
        if (!res.ok) {
          return { error: result.error || 'Failed to create account.' };
        }
        setProfile(result.profile);
        setUser({ id: result.profile.id, email: data.email } as unknown as User);
        localStorage.setItem('punda_demo_user', JSON.stringify(result.profile));
        return {};
      } catch (err: unknown) {
        return { error: err instanceof Error ? err.message : 'Network error during signup' };
      }
    }

    try {
      const supabase = getSupabaseClient();

      // Check if username already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', data.username.trim())
        .maybeSingle();

      if (existingUser) {
        return { error: 'Username is already taken. Please choose another one.' };
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name.trim(),
            username: data.username.trim().toLowerCase(),
            phone: data.phone?.trim() || null,
          },
        },
      });

      if (authError) {
        return { error: authError.message };
      }

      if (authData.user) {
        setUser(authData.user);
        const prof = await fetchProfile(authData.user.id);
        setProfile(prof);
      }
      return {};
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Signup failed. Please try again.';
      return { error: message };
    }
  };

  const signOut = async () => {
    await setOnlineStatus(false);
    if (isDemo || !isSupabaseConfigured()) {
      localStorage.removeItem('punda_demo_user');
      setUser(null);
      setProfile(null);
      return;
    }

    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Signout error:', err);
    } finally {
      setUser(null);
      setProfile(null);
      setSession(null);
    }
  };

  const updateProfile = async (updates: Partial<Profile>): Promise<{ error?: string }> => {
    if (!profile?.id) return { error: 'Not authenticated' };

    if (isDemo || !isSupabaseConfigured()) {
      const updated = { ...profile, ...updates, updated_at: new Date().toISOString() };
      setProfile(updated);
      localStorage.setItem('punda_demo_user', JSON.stringify(updated));
      return {};
    }

    try {
      const supabase = getSupabaseClient();

      // If username is being updated, ensure uniqueness
      if (updates.username && updates.username.toLowerCase() !== profile.username.toLowerCase()) {
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .ilike('username', updates.username.trim())
          .neq('id', profile.id)
          .maybeSingle();

        if (existing) {
          return { error: 'This username is already taken. Please choose another.' };
        }
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (error) return { error: error.message };
      setProfile(data as Profile);
      return {};
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update profile.';
      return { error: message };
    }
  };

  const refreshProfile = async () => {
    if (!user?.id) return;
    if (isDemo) return;
    const p = await fetchProfile(user.id);
    if (p) setProfile(p);
  };

  const switchDemoUser = (index: number) => {
    const target = DEMO_USERS[index % DEMO_USERS.length];
    setProfile(target);
    setUser({ id: target.id, email: `${target.username}@punda.app` } as unknown as User);
    localStorage.setItem('punda_demo_user', JSON.stringify(target));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        isDemoMode: isDemo,
        signIn,
        signUp,
        signOut,
        updateProfile,
        refreshProfile,
        setOnlineStatus,
        switchDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
