import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface User {
    id: string;
    name: string;
    email: string;
    plan: 'Free' | 'Pro';
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isInitialized: boolean;
    initialize: () => void;
    login: (user: User) => void;
    logout: () => Promise<void>;
    updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isInitialized: false,

    initialize: () => {
        // Obter sessão inicial
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                set({
                    user: {
                        id: session.user.id,
                        email: session.user.email || '',
                        name: session.user.user_metadata?.name || 'Criador',
                        plan: session.user.user_metadata?.plan || 'Free'
                    },
                    isAuthenticated: true,
                    isInitialized: true
                });
            } else {
                set({ isInitialized: true, isAuthenticated: false, user: null });
            }
        });

        // Ouvir mudanças de estado (login/logout em outras abas)
        supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                set({
                    user: {
                        id: session.user.id,
                        email: session.user.email || '',
                        name: session.user.user_metadata?.name || 'Criador',
                        plan: session.user.user_metadata?.plan || 'Free'
                    },
                    isAuthenticated: true
                });
            } else {
                set({ user: null, isAuthenticated: false });
            }
        });
    },

    login: (user) => {
        set({ user, isAuthenticated: true });
    },

    logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, isAuthenticated: false });
    },

    updateUser: (updates) => set((state) => {
        if (!state.user) return state;
        const updatedUser = { ...state.user, ...updates };
        return { user: updatedUser };
    }),
}));
