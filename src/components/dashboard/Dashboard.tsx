import { Clapperboard, MessageSquareQuote, Twitter } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';

export function Dashboard() {
    const { setActiveTab, userCounts } = useAppStore();
    const { user } = useAuthStore();

    // Get user-specific counts (defaulting to 0 if not exist)
    const counts = user?.id && userCounts[user.id]
        ? userCounts[user.id]
        : { twitterCount: 0, quoteCount: 0, reelsCount: 0 };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <h1 className="text-3xl font-bold">Olá, {user?.name?.split(' ')[0] || 'Criador'}! 👋</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: 'Posts Tweets Gerados', value: counts.twitterCount, color: 'text-sky-400' },
                    { label: 'Frases de Efeito Geradas', value: counts.quoteCount, color: 'text-sky-300' },
                    { label: 'Reels Gerados com IA', value: counts.reelsCount, color: 'text-blue-400' },
                ].map((stat, i) => (
                    <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl">
                        <p className="text-zinc-500 text-sm font-medium">{stat.label}</p>
                        <p className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            <div>
                <h2 className="text-xl font-bold mb-4">
                    Ferramentas de Criação
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <button
                        onClick={() => setActiveTab('twitter')}
                        className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-blue-500/50 hover:bg-zinc-800/50 transition-all group flex flex-col items-start text-left w-full"
                    >
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Twitter className="w-6 h-6 text-blue-400" />
                        </div>
                        <h3 className="font-bold text-lg mb-2">Post Twitter</h3>
                        <p className="text-sm text-zinc-500">Crie posts com visual autêntico de tweet</p>
                    </button>

                    <button
                        onClick={() => setActiveTab('quote')}
                        className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-sky-400/50 hover:bg-zinc-800/50 transition-all group flex flex-col items-start text-left w-full"
                    >
                        <div className="w-12 h-12 rounded-xl bg-sky-400/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <MessageSquareQuote className="w-6 h-6 text-sky-400" />
                        </div>
                        <h3 className="font-bold text-lg mb-2">Frase de Efeito</h3>
                        <p className="text-sm text-zinc-500">Transforme pensamentos em imagens impactantes</p>
                    </button>

                    <button
                        onClick={() => setActiveTab('reels')}
                        className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-sky-400/50 hover:bg-zinc-800/50 transition-all group flex flex-col items-start text-left w-full"
                    >
                        <div className="w-12 h-12 rounded-xl bg-sky-400/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Clapperboard className="w-6 h-6 text-sky-400" />
                        </div>
                        <h3 className="font-bold text-lg mb-2">Criador de Reels AI</h3>
                        <p className="text-sm text-zinc-500">Criação automatizada de Reels com IA</p>
                    </button>
                </div>
            </div>
        </div>
    );
}
