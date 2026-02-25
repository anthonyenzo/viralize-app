import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TabId = 'dashboard' | 'twitter' | 'quote' | 'reels' | 'settings';

interface UserCounts {
    twitterCount: number;
    quoteCount: number;
    reelsCount: number;
}

interface AppState {
    activeTab: TabId;
    setActiveTab: (tab: TabId) => void;
    userCounts: Record<string, UserCounts>;
    incrementTwitter: (userId: string) => void;
    incrementQuote: (userId: string) => void;
    incrementReels: (userId: string) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            activeTab: 'dashboard',
            userCounts: {},
            setActiveTab: (tab) => set({ activeTab: tab }),

            incrementTwitter: (userId: string) => set((state) => {
                const current = state.userCounts[userId] || { twitterCount: 0, quoteCount: 0, reelsCount: 0 };
                return {
                    userCounts: {
                        ...state.userCounts,
                        [userId]: { ...current, twitterCount: current.twitterCount + 1 }
                    }
                };
            }),

            incrementQuote: (userId: string) => set((state) => {
                const current = state.userCounts[userId] || { twitterCount: 0, quoteCount: 0, reelsCount: 0 };
                return {
                    userCounts: {
                        ...state.userCounts,
                        [userId]: { ...current, quoteCount: current.quoteCount + 1 }
                    }
                };
            }),

            incrementReels: (userId: string) => set((state) => {
                const current = state.userCounts[userId] || { twitterCount: 0, quoteCount: 0, reelsCount: 0 };
                return {
                    userCounts: {
                        ...state.userCounts,
                        [userId]: { ...current, reelsCount: current.reelsCount + 1 }
                    }
                };
            }),
        }),
        {
            name: 'viralize-app-storage',
            partialize: (state) => ({
                userCounts: state.userCounts,
            }),
        }
    )
);
