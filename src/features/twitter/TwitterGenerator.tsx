import { useState, useRef, useEffect } from "react";
import { Download, Upload, Moon, Sun, Settings as SettingsIcon, MessageCircle, Repeat2, Heart, Bookmark } from "lucide-react";
import { toPng } from "html-to-image";
import { cn } from "../../lib/utils";
import { useAppStore } from "../../store/useAppStore";
import { useAuthStore } from "../../store/useAuthStore";

export function TwitterGenerator() {
    const { incrementTwitter } = useAppStore();
    const { user } = useAuthStore();
    const previewRef = useRef<HTMLDivElement>(null);
    const [name, setName] = useState("Antigravity");
    const [username, setUsername] = useState("antigravity_ai");
    const [text, setText] = useState("Digite seu tweet aqui...");
    const [avatar, setAvatar] = useState<string | null>(null);
    const [isVerified, setIsVerified] = useState(true);
    const [isDark, setIsDark] = useState(false);
    const [date, setDate] = useState("08:32 · 23/02/2026");
    const [views, setViews] = useState("1,5M");
    const [replies, setReplies] = useState("1,1k");
    const [retweets, setRetweets] = useState("1k");
    const [likes, setLikes] = useState("21,9k");
    const [bookmarks, setBookmarks] = useState("701");
    const [showDate, setShowDate] = useState(true);
    const [showMetrics, setShowMetrics] = useState(true);
    const [showBorder, setShowBorder] = useState(true);
    const [fontSize, setFontSize] = useState(20);

    const [aspectRatio, setAspectRatio] = useState<"auto" | "1/1" | "9/16" | "3/4">("auto");
    const [exportBg, setExportBg] = useState("#000000"); // default black background for export

    // Load profile from localStorage on mount
    useEffect(() => {
        const savedProfile = localStorage.getItem("viralize-twitter-profile");
        if (savedProfile) {
            try {
                const { avatar, name, username, isVerified } = JSON.parse(savedProfile);
                if (avatar) setAvatar(avatar);
                if (name) setName(name);
                if (username) setUsername(username);
                if (typeof isVerified === 'boolean') setIsVerified(isVerified);
            } catch (e) {
                console.error("Failed to load profile", e);
            }
        }
    }, []);

    const saveProfile = () => {
        const profile = { avatar, name, username, isVerified };
        localStorage.setItem("viralize-twitter-profile", JSON.stringify(profile));
        alert("Perfil salvo como padrão!");
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setAvatar(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        if (!previewRef.current) return;

        try {
            setIsDownloading(true);

            // Use html-to-image which supports modern CSS (oklch, varies, etc)
            const dataUrl = await toPng(previewRef.current, {
                pixelRatio: 4, // Ultra high resolution
                backgroundColor: undefined, // Transparent background if not set
            });

            const link = document.createElement("a");
            link.download = `tweet-${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
            if (user) {
                incrementTwitter(user.id);
            }
        } catch (error) {
            console.error("Export failed:", error);
            alert("Erro ao baixar a imagem. Tente novamente.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="flex flex-col-reverse lg:flex-row gap-6 min-h-full">
            {/* Inputs - Scrollable */}
            <div className="w-full lg:flex-1 lg:overflow-y-auto pr-2 space-y-6">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <SettingsIcon className="w-5 h-5 text-sky-400" />
                            Configuração do Perfil
                        </h2>
                        <button
                            onClick={saveProfile}
                            className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-md transition-colors border border-zinc-700"
                            title="Salvar como padrão para próximas visitas"
                        >
                            Salvar Perfil
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1">Avatar</label>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700">
                                    {avatar ? (
                                        <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-zinc-500">
                                            <Upload className="w-5 h-5" />
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-sky-400/10 file:text-sky-400 hover:file:bg-sky-400/20 cursor-pointer"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Nome" value={name} onChange={setName} />
                            <Input label="@Usuario" value={username} onChange={setUsername} prefix="@" />
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" checked={isVerified} onChange={(e) => setIsVerified(e.target.checked)} className="rounded border-zinc-700 bg-zinc-800 text-sky-400 focus:ring-sky-400/20" />
                                <span className="text-sm text-zinc-300">Mostrar Verificado</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-4">Conteúdo do Tweet</h2>

                    <div className="p-3 bg-zinc-950/50 border border-zinc-500/30 rounded-lg text-sm text-zinc-400 mb-2">
                        💡 Dica: Use <strong>*asteriscos*</strong> para deixar o texto em <strong>negrito</strong>.
                    </div>

                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-400/50 min-h-[120px] resize-y"
                        placeholder="O que está acontecendo?"
                    />
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-4">Aparência</h2>
                    <div className="mb-4 space-y-4">
                        {/* Aspect Ratio */}
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-2">Formato de Exportação</label>
                            <div className="flex bg-zinc-950 rounded-lg border border-zinc-800 p-1">
                                <button
                                    onClick={() => setAspectRatio("auto")}
                                    className={cn("flex-1 py-1.5 text-xs rounded transition", aspectRatio === "auto" ? "bg-zinc-800 text-white font-medium" : "text-zinc-500 hover:text-zinc-300")}
                                >
                                    Twitter (Auto)
                                </button>
                                <button
                                    onClick={() => setAspectRatio("1/1")}
                                    className={cn("flex-1 py-1.5 text-xs rounded transition", aspectRatio === "1/1" ? "bg-zinc-800 text-white font-medium" : "text-zinc-500 hover:text-zinc-300")}
                                >
                                    Post (1:1)
                                </button>
                                <button
                                    onClick={() => setAspectRatio("3/4")}
                                    className={cn("flex-1 py-1.5 text-xs rounded transition", aspectRatio === "3/4" ? "bg-zinc-800 text-white font-medium" : "text-zinc-500 hover:text-zinc-300")}
                                >
                                    Portrait (3:4)
                                </button>
                                <button
                                    onClick={() => setAspectRatio("9/16")}
                                    className={cn("flex-1 py-1.5 text-xs rounded transition", aspectRatio === "9/16" ? "bg-zinc-800 text-white font-medium" : "text-zinc-500 hover:text-zinc-300")}
                                >
                                    Story (9:16)
                                </button>
                            </div>
                        </div>

                        {/* Font Size Control */}
                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-xs font-medium text-zinc-400">Tamanho da Fonte</label>
                                <span className="text-xs text-zinc-500">{fontSize}px</span>
                            </div>
                            <input
                                type="range"
                                min="12"
                                max="32"
                                value={fontSize}
                                onChange={(e) => setFontSize(Number(e.target.value))}
                                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                            />
                        </div>

                        {aspectRatio !== "auto" && (
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-2">Cor de Fundo (Exportação)</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={exportBg}
                                        onChange={(e) => setExportBg(e.target.value)}
                                        className="w-8 h-8 p-0 border-0 rounded bg-transparent cursor-pointer"
                                    />
                                    <span className="text-xs text-zinc-500 uppercase">{exportBg}</span>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between mb-4">
                            <Input label="Data e Hora" value={date} onChange={setDate} />
                            <Input label="Views" value={views} onChange={setViews} />
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <Input label="Respostas" value={replies} onChange={setReplies} />
                            <Input label="Reposts" value={retweets} onChange={setRetweets} />
                            <Input label="Curtidas" value={likes} onChange={setLikes} />
                            <Input label="Salvos" value={bookmarks} onChange={setBookmarks} />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" checked={showDate} onChange={(e) => setShowDate(e.target.checked)} className="rounded border-zinc-700 bg-zinc-800 text-sky-400 focus:ring-sky-400/20" />
                                <span className="text-sm text-zinc-300">Exibir Data e Views</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" checked={showMetrics} onChange={(e) => setShowMetrics(e.target.checked)} className="rounded border-zinc-700 bg-zinc-800 text-sky-400 focus:ring-sky-400/20" />
                                <span className="text-sm text-zinc-300">Exibir Engajamento (Footer)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" checked={showBorder} onChange={(e) => setShowBorder(e.target.checked)} className="rounded border-zinc-700 bg-zinc-800 text-sky-400 focus:ring-sky-400/20" />
                                <span className="text-sm text-zinc-300">Exibir Borda</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => setIsDark(true)}
                            className={cn("flex-1 py-2 rounded-lg border flex items-center justify-center gap-2 text-sm transition-all", isDark ? "bg-black border-zinc-700 text-white" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800")}
                        >
                            <Moon className="w-4 h-4" /> Dark
                        </button>
                        <button
                            onClick={() => setIsDark(false)}
                            className={cn("flex-1 py-2 rounded-lg border flex items-center justify-center gap-2 text-sm transition-all", !isDark ? "bg-white border-zinc-200 text-black" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800")}
                        >
                            <Sun className="w-4 h-4" /> Light
                        </button>
                    </div>
                </div>
            </div>

            {/* Preview - Sticky */}
            <div className="w-full lg:flex-1 flex flex-col items-center justify-center gap-8 bg-zinc-950/50 border border-zinc-800/50 rounded-xl relative p-6 lg:p-10 lg:sticky lg:top-0 lg:h-[calc(100vh-8rem)] overflow-x-auto">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none rounded-xl" />

                <div className="flex-1 min-h-0 w-full flex items-center justify-center relative group">
                    {/* The Capture Node logic */}
                    <div
                        ref={previewRef}
                        data-export-id="twitter-preview"
                        className={cn(
                            "transition-all duration-300 flex items-center justify-center shadow-2xl",
                            // Common responsive constraints
                            "max-h-full max-w-full object-contain",
                            aspectRatio === "1/1" && "aspect-square w-full max-w-[600px]",
                            aspectRatio === "3/4" && "aspect-[3/4] h-auto w-auto",
                            aspectRatio === "9/16" && "aspect-[9/16] h-auto w-auto",
                            // If not auto, apply background color to container
                            aspectRatio !== "auto" && "p-8",
                        )}
                        style={{
                            backgroundColor: aspectRatio !== "auto" ? exportBg : 'transparent'
                        }}
                    >
                        {/* The Tweet Card */}
                        <div
                            className={cn(
                                "p-6 rounded-xl",
                                "relative max-w-full", // Ensure it handles stacking context correctly
                                showBorder ? "border" : "border-0",
                                // Width logic: Twitter (Auto) and Post (1:1) fixed at 400px maximum but can scale down, others at 500px maximum
                                (aspectRatio === "auto" || aspectRatio === "1/1") ? "w-[400px]" : "w-[500px]",
                            )}
                            style={{
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                                backgroundColor: isDark ? '#000000' : '#ffffff',
                                color: isDark ? '#ffffff' : '#000000',
                                borderColor: isDark ? '#27272a' : '#e4e4e7',
                                fontFamily: '"TwitterChirp", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                            }}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4 relative">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-12 h-12 rounded-full overflow-hidden"
                                        style={{ backgroundColor: '#e4e4e7' }}
                                    >
                                        {avatar ? (
                                            <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <div
                                                className="w-full h-full"
                                                style={{ background: 'linear-gradient(to top right, #a855f7, #3b82f6)' }}
                                            />
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1">
                                            <span className="font-bold text-[15px] leading-5">{name}</span>
                                            {isVerified && <VerifiedBadge />}
                                        </div>
                                        <div className="text-[15px] leading-5" style={{ color: '#71717a' }}>@{username}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div
                                className="leading-normal whitespace-pre-wrap mb-4 font-normal"
                                style={{ fontSize: `${fontSize}px` }}
                            >
                                {text.split(/(\*[^*]+\*)/g).map((part, index) => {
                                    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
                                        return <span key={index} className="font-bold">{part.slice(1, -1)}</span>;
                                    }
                                    return <span key={index}>{part}</span>;
                                })}
                            </div>

                            {/* Date Elements */}
                            {showDate && (
                                <div
                                    className="text-[15px] pb-4"
                                    style={{
                                        color: '#71717a',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                >
                                    <span>{date}</span>
                                    <span>·</span>
                                    <span style={{ color: isDark ? '#ffffff' : '#000000', fontWeight: 'bold' }}>{views}</span>
                                    <span>visualizações</span>
                                </div>
                            )}

                            {/* Action Metrics Footer */}
                            {showMetrics && (
                                <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${isDark ? '#2f3336' : '#eff3f4'}`, color: '#71717a' }}>
                                    <div className="flex items-center gap-2 group cursor-pointer">
                                        <MessageCircle className="w-5 h-5 fill-transparent group-hover:text-sky-500 group-hover:bg-sky-500/10 rounded-full transition-colors" />
                                        <span className="text-[13px]">{replies}</span>
                                    </div>
                                    <div className="flex items-center gap-2 group cursor-pointer">
                                        <Repeat2 className="w-5 h-5 group-hover:text-green-500 group-hover:bg-green-500/10 rounded-full transition-colors" />
                                        <span className="text-[13px]">{retweets}</span>
                                    </div>
                                    <div className="flex items-center gap-2 group cursor-pointer">
                                        <Heart className="w-5 h-5 fill-transparent group-hover:text-pink-500 group-hover:bg-pink-500/10 rounded-full transition-colors" />
                                        <span className="text-[13px]">{likes}</span>
                                    </div>
                                    <div className="flex items-center gap-2 group cursor-pointer">
                                        <Bookmark className="w-5 h-5 fill-transparent group-hover:text-sky-500 group-hover:bg-sky-500/10 rounded-full transition-colors" />
                                        <span className="text-[13px]">{bookmarks}</span>
                                    </div>
                                    <div className="flex items-center group cursor-pointer">
                                        <Upload className="w-5 h-5 group-hover:text-sky-500 group-hover:bg-sky-500/10 rounded-full transition-colors" />
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                    <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                        <span className="text-xs text-zinc-500 bg-black/80 px-2 py-1 rounded">Preview</span>
                    </div>
                </div>

                <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="flex items-center gap-2 bg-gradient-to-r from-sky-400 to-sky-500 hover:from-sky-300 hover:to-sky-400 text-zinc-950 px-8 py-3 rounded-full font-bold shadow-lg shadow-sky-400/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                    {isDownloading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Gerando...
                        </>
                    ) : (
                        <>
                            <Download className="w-5 h-5" />
                            Baixar Imagem
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

const Input = ({ label, value, onChange, prefix }: { label: string, value: string, onChange: (v: string) => void, prefix?: string }) => (
    <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">{label}</label>
        <div className="relative">
            {prefix && <span className="absolute left-3 top-2.5 text-zinc-500 text-sm">{prefix}</span>}
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={cn(
                    "w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-400/50",
                    prefix && "pl-8"
                )}
            />
        </div>
    </div>
);

const VerifiedBadge = () => (
    <svg viewBox="0 0 22 22" className="w-[18px] h-[18px] fill-current" style={{ color: '#1d9bf0' }}>
        <g><path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.687.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.215 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.589 2.589 5.828-5.829 1.386 1.28-7.667 6.69z"></path></g>
    </svg>
);
