import { Home, Twitter, MessageSquareQuote, Clapperboard, Settings, LogOut, Rocket } from 'lucide-react';
import { useAppStore, type TabId } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '../../lib/utils'; // Assuming you have this utility

const principalItems: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
];

const creatorItems: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'twitter', label: 'Post Twitter', icon: Twitter },
    { id: 'quote', label: 'Frase de Efeito', icon: MessageSquareQuote },
    { id: 'reels', label: 'Criador de Reels AI', icon: Clapperboard },
];

interface SidebarProps {
    className?: string;
    onItemClick?: () => void;
}

export function Sidebar({ className, onItemClick }: SidebarProps) {
    const { activeTab, setActiveTab } = useAppStore();
    const { user, logout } = useAuthStore();

    return (
        <aside className={cn("w-64 border-r border-zinc-800 bg-zinc-950 flex-col h-screen sticky top-0 flex", className)}>
            <div className="p-6 border-b border-zinc-800 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-sky-500/10 rounded-lg">
                        <Rocket className="w-6 h-6 text-sky-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-sky-300 to-sky-500 bg-clip-text text-transparent leading-none">
                            Viralize AI
                        </h1>
                        <p className="text-xs text-zinc-500 mt-1.5">O Hub do Criador Digital</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-6">
                <div>
                    <h2 className="px-3 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                        Principal
                    </h2>
                    <div className="space-y-1">
                        {principalItems.map((item) => {
                            const isActive = activeTab === item.id;
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setActiveTab(item.id);
                                        onItemClick?.();
                                    }}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                        isActive
                                            ? "bg-sky-400/10 text-sky-400 border border-sky-400/20 shadow-[0_0_15px_-3px_rgba(234,179,8,0.2)]"
                                            : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                                    )}
                                >
                                    <Icon className={cn("w-5 h-5", isActive ? "text-sky-400" : "text-zinc-500")} />
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <h2 className="px-3 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                        Criadores
                    </h2>
                    <div className="space-y-1">
                        {creatorItems.map((item) => {
                            const isActive = activeTab === item.id;
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setActiveTab(item.id);
                                        onItemClick?.();
                                    }}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                        isActive
                                            ? "bg-sky-400/10 text-sky-400 border border-sky-400/20 shadow-[0_0_15px_-3px_rgba(56,189,248,0.2)]"
                                            : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                                    )}
                                >
                                    <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-sky-400" : "text-zinc-500")} />
                                    <span className="flex-1 text-left truncate">{item.label}</span>
                                    {item.id === 'reels' && (
                                        <span className="shrink-0 ml-auto px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-sky-950 bg-sky-400 rounded shadow-[0_0_8px_rgba(56,189,248,0.4)] relative overflow-hidden group">
                                            <span className="relative z-10">Novo</span>
                                            <div className="absolute inset-0 bg-white/30 translate-x-[-100%] group-hover:animate-[shimmer_1s_infinite]"></div>
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </nav>

            <div className="px-3 mb-4">
                <button
                    onClick={() => {
                        setActiveTab('settings');
                        onItemClick?.();
                    }}
                    className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                        activeTab === 'settings'
                            ? "bg-sky-400/10 text-sky-400 border border-sky-400/20 shadow-[0_0_15px_-3px_rgba(234,179,8,0.2)]"
                            : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                    )}
                >
                    <Settings className={cn("w-5 h-5", activeTab === 'settings' ? "text-sky-400" : "text-zinc-500")} />
                    Configurações
                </button>
            </div>

            <div className="p-4 border-t border-zinc-900 shrink-0">
                <div className="flex items-center gap-3 px-2 py-2 mb-2 rounded-md bg-zinc-900/50 border border-zinc-800/50">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 to-sky-500 flex items-center justify-center text-zinc-950 font-bold text-sm shrink-0">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="text-xs truncate overflow-hidden">
                        <p className="text-zinc-200 font-medium truncate">{user?.name || 'Usuário'}</p>
                        <p className="text-sky-400 font-bold">{user?.plan || 'Free'} Plan</p>
                    </div>
                </div>

                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/20"
                >
                    <LogOut className="w-4 h-4" />
                    Sair da conta
                </button>
            </div>
        </aside>
    );
}
