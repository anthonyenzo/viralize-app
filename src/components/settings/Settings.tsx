import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { User, Mail, Lock, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

export function Settings() {
    const { user, updateUser } = useAuthStore();

    // Profile State
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileMessage(null);

        if (!name || !email) {
            setProfileMessage({ type: 'error', text: 'Preencha todos os campos do perfil.' });
            return;
        }

        try {
            setIsSavingProfile(true);
            const { error: updateError } = await supabase.auth.updateUser({
                email: email,
                data: { name: name }
            });

            if (updateError) throw updateError;

            // Update Auth Store locally
            updateUser({ name, email });

            setProfileMessage({ type: 'success', text: 'Perfil atualizado com sucesso! (Se alterou o e-mail, confirme no link recebido)' });
        } catch (error: any) {
            setProfileMessage({ type: 'error', text: error.message || 'Erro ao atualizar o perfil. Tente novamente.' });
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage(null);

        if (!newPassword || !confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'Preencha a nova senha.' });
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'A nova senha e a confirmação não coincidem.' });
            return;
        }

        if (newPassword.length < 6) {
            setPasswordMessage({ type: 'error', text: 'A nova senha deve ter no mínimo 6 caracteres.' });
            return;
        }

        try {
            setIsSavingPassword(true);
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (updateError) throw updateError;

            setPasswordMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            setPasswordMessage({ type: 'error', text: error.message || 'Erro ao atualizar a senha. Tente novamente.' });
        } finally {
            setIsSavingPassword(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">Configurações</h1>
                <p className="text-zinc-500 mt-2">Gerencie as informações da sua conta e preferências</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Profile Card */}
                <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 shadow-xl">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <User className="text-sky-400" />
                        Seu Perfil
                    </h2>

                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        {profileMessage && (
                            <div className={`p-4 rounded-xl flex items-center gap-3 text-sm ${profileMessage.type === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                                {profileMessage.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
                                {profileMessage.text}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1.5">Nome</label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 w-5 h-5 text-zinc-500" />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all"
                                    placeholder="Seu nome"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1.5">E-mail de Login</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 w-5 h-5 text-zinc-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all"
                                    placeholder="seu@email.com"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSavingProfile}
                            className="mt-4 w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50"
                        >
                            {isSavingProfile ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {isSavingProfile ? 'Salvando...' : 'Salvar Perfil'}
                        </button>
                    </form>
                </div>

                {/* Password Card */}
                <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 shadow-xl">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Lock className="text-sky-400" />
                        Segurança e Senha
                    </h2>

                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        {passwordMessage && (
                            <div className={`p-4 rounded-xl flex items-center gap-3 text-sm ${passwordMessage.type === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                                {passwordMessage.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
                                {passwordMessage.text}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1.5">Senha Atual</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 w-5 h-5 text-zinc-500" />
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1.5">Nova Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 w-5 h-5 text-zinc-500" />
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all"
                                    placeholder="Mínimo 6 caracteres"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1.5">Confirmar Nova Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 w-5 h-5 text-zinc-500" />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all"
                                    placeholder="Digite novamente a nova senha"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSavingPassword}
                            className="mt-4 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500/10 to-orange-500/10 hover:from-red-500/20 hover:to-orange-500/20 text-red-400 border border-red-500/20 hover:border-red-500/30 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50"
                        >
                            {isSavingPassword ? (
                                <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {isSavingPassword ? 'Alterando...' : 'Alterar Senha'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
