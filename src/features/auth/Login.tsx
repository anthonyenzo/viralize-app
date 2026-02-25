import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { LogIn, UserPlus, Mail, Lock, User as UserIcon, AlertCircle, Rocket, CheckCircle2 } from 'lucide-react';

export function Login() {
    const [isLoginFlow, setIsLoginFlow] = useState(true);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);
        setIsLoading(true);

        if (!email || !password || (!isLoginFlow && !name)) {
            setError('Por favor, preencha todos os campos.');
            setIsLoading(false);
            return;
        }

        try {
            if (isLoginFlow) {
                // LOGIN
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });

                if (signInError) {
                    if (signInError.message.includes('Invalid login credentials')) {
                        setError('Email ou senha inválidos.');
                    } else {
                        setError(signInError.message);
                    }
                }
            } else {
                // REGISTER
                if (password.length < 6) {
                    setError('A senha deve ter no mínimo 6 caracteres.');
                    setIsLoading(false);
                    return;
                }

                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            name,
                            plan: 'Free'
                        }
                    }
                });

                if (signUpError) {
                    setError(signUpError.message);
                } else {
                    setSuccessMessage('Conta criada! Por favor, verifique a caixa de entrada do seu e-mail para confirmar o cadastro antes de fazer login.');
                    setIsLoginFlow(true); // Switch to login view visually
                    setPassword(''); // Clear password field for safety
                }
            }
        } catch (err: any) {
            setError('Ocorreu um erro inesperado. Tente novamente.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black relative p-4">
            {/* Background elements */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-500/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-8 relative z-10 shadow-2xl">

                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <div className="p-2 bg-sky-500/10 rounded-xl">
                            <Rocket className="w-8 h-8 text-sky-400" />
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-300 to-sky-500 bg-clip-text text-transparent leading-none">
                            Viralize AI
                        </h1>
                    </div>
                    <p className="text-zinc-400 text-sm">
                        {isLoginFlow ? 'Bem-vindo de volta! Acesse sua conta.' : 'Crie sua conta para começar a viralizar.'}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                {successMessage && (
                    <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-emerald-400 text-sm">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <p>{successMessage}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">

                    {!isLoginFlow && (
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1.5 ml-1">Nome Completo</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <UserIcon className="h-4 w-4 text-zinc-500" />
                                </div>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-100 focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400/50 transition-all sm:text-sm"
                                    placeholder="Ex: João Silva"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1.5 ml-1">Email</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-4 w-4 text-zinc-500" />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-100 focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400/50 transition-all sm:text-sm"
                                placeholder="seu@email.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1.5 ml-1">Senha</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-4 w-4 text-zinc-500" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-100 focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400/50 transition-all sm:text-sm"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-zinc-950 bg-gradient-to-r from-sky-400 to-sky-400 hover:from-sky-300 hover:to-sky-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-400 focus:ring-offset-zinc-950 transition-all"
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>{isLoginFlow ? 'Entrando...' : 'Criando Conta...'}</span>
                                </div>
                            ) : isLoginFlow ? (
                                <>
                                    <LogIn className="w-4 h-4" />
                                    Entrar
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-4 h-4" />
                                    Criar Conta
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-8 text-center text-sm">
                    <button
                        onClick={() => {
                            setIsLoginFlow(!isLoginFlow);
                            setError(null);
                        }}
                        className="text-zinc-400 hover:text-white transition-colors"
                    >
                        {isLoginFlow
                            ? "Não tem uma conta? Cadastre-se agora"
                            : "Já tem uma conta? Faça login"}
                    </button>
                </div>
            </div>
        </div>
    );
}
