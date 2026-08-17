"use client";

import { useEffect } from 'react';
import { create } from 'zustand';
import { onAuthStateChanged, User, signInWithPopup, AuthProvider } from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface AuthState {
  user: User | null;
  loading: boolean;
  token: string | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setToken: (token: string | null) => void;
  loginWithProvider: (providerName: 'google' | 'github') => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,
  token: null,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setToken: (token) => set({ token }),
  
  loginWithProvider: async (providerName) => {
    try {
      const provider: AuthProvider = providerName === 'google' ? googleProvider : githubProvider;
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      set({ user: result.user, token });
      
      // Sync user to backend
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api/v1'}/auth/me`, {
        method: 'GET', // or POST if your backend expects it for first-time creation, but your GET creates if not exists
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        console.error("Backend sync failed", await res.text());
      }
      
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  },
  
  logout: async () => {
    await auth.signOut();
    set({ user: null, token: null });
  }
}));

// AuthProvider component to wrap the app
export function AuthProviderWrapper({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading, setToken } = useAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const token = await currentUser.getIdToken();
        setToken(token);
      } else {
        setToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading, setToken]);

  return <>{children}</>;
}
