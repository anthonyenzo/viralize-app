import { useState, useRef, useEffect } from "react";
import { Download, Upload, Image as ImageIcon, AlignLeft, AlignCenter, AlignRight, Type } from "lucide-react";
import { toPng } from "html-to-image";
import { cn } from "../../lib/utils";
import { useAppStore } from "../../store/useAppStore";
import { useAuthStore } from "../../store/useAuthStore";

export function QuoteGenerator() {
    const { incrementQuote } = useAppStore();
    const { user } = useAuthStore();
    const previewRef = useRef<HTMLDivElement>(null);
    const [text, setText] = useState("O futuro pertence àqueles que [acreditam] na beleza de seus sonhos.");
    const [author, setAuthor] = useState("Eleanor Roosevelt");
    const [bgImage, setBgImage] = useState<string | null>(null);
    const [overlayOpacity, setOverlayOpacity] = useState(60);
    const [highlightColor, setHighlightColor] = useState("#38bdf8"); // sky-400
    const [alignment, setAlignment] = useState<"left" | "center" | "right">("center");
    const [fontSize, setFontSize] = useState(30);
    const [usernameSize, setUsernameSize] = useState(15);
    const [aspectRatio, setAspectRatio] = useState<"1/1" | "9/16" | "3/4">("9/16");

    useEffect(() => {
        const savedState = localStorage.getItem("viralize-quote-state");
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                if (state.text) setText(state.text);
                if (state.author) setAuthor(state.author);
                if (state.bgImage !== undefined) setBgImage(state.bgImage);
                if (state.overlayOpacity !== undefined) setOverlayOpacity(state.overlayOpacity);
                if (state.highlightColor) setHighlightColor(state.highlightColor);
                if (state.alignment) setAlignment(state.alignment);
                if (state.fontSize !== undefined) setFontSize(state.fontSize);
                if (state.usernameSize !== undefined) setUsernameSize(state.usernameSize);
                if (state.aspectRatio) setAspectRatio(state.aspectRatio);
            } catch (e) {
                console.error("Failed to load quote state", e);
            }
        }
    }, []);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setBgImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const [isDownloading, setIsDownloading] = useState(false);

    // ...

    const handleDownload = async () => {
        // ... implementation
        if (!previewRef.current) return;

        try {
            setIsDownloading(true);
            const dataUrl = await toPng(previewRef.current, {
                pixelRatio: 4, // Ultra high resolution
                backgroundColor: "#000000",
            });

            const link = document.createElement("a");
            link.download = `quote-${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
            if (user) {
                incrementQuote(user.id);
            }

            const currentState = {
                text, author, bgImage, overlayOpacity, highlightColor, alignment, fontSize, usernameSize, aspectRatio
            };
            localStorage.setItem("viralize-quote-state", JSON.stringify(currentState));
        } catch (error) {
            console.error("Export failed:", error);
            alert("Erro ao baixar a quote. Tente novamente.");
        } finally {
            setIsDownloading(false);
        }
    };

    // Text Parsing Logic
    const renderText = () => {
        const parts = text.split(/(\[.*?\])/g);
        return parts.map((part, index) => {
            if (part.startsWith("[") && part.endsWith("]")) {
                const content = part.slice(1, -1);
                return (
                    <span key={index} style={{ color: highlightColor }} className="font-bold">
                        {content}
                    </span>
                );
            }
            return <span key={index}>{part}</span>;
        });
    };

    return (
        <div className="flex flex-col-reverse lg:flex-row gap-6 min-h-full">
            {/* Inputs */}
            <div className="w-full lg:flex-1 lg:overflow-y-auto pr-2 space-y-6">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Type className="w-5 h-5 text-sky-300" />
                        Texto & Destaque
                    </h2>

                    <div className="space-y-4">
                        <div className="p-3 bg-zinc-950/50 border border-zinc-500/30 rounded-lg text-sm text-zinc-400 mb-2">
                            💡 Dica: Use <strong>[colchetes]</strong> para destacar palavras.
                        </div>

                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-400/50 min-h-[120px] resize-y font-serif italic"
                            placeholder="Sua frase inspiradora..."
                        />

                        <Input label="Seu @" value={author} onChange={setAuthor} prefix="@" />
                    </div>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-blue-400" />
                        Estilo Visual
                    </h2>

                    <div className="space-y-6">
                        {/* Aspect Ratio */}
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-2">Formato</label>
                            <div className="flex bg-zinc-950 rounded-lg border border-zinc-800 p-1">
                                <button
                                    onClick={() => setAspectRatio("1/1")}
                                    className={cn("flex-1 py-1.5 text-sm rounded transition", aspectRatio === "1/1" ? "bg-zinc-800 text-white font-medium" : "text-zinc-500 hover:text-zinc-300")}
                                >
                                    Quadrado (1:1)
                                </button>
                                <button
                                    onClick={() => setAspectRatio("3/4")}
                                    className={cn("flex-1 py-1.5 text-sm rounded transition", aspectRatio === "3/4" ? "bg-zinc-800 text-white font-medium" : "text-zinc-500 hover:text-zinc-300")}
                                >
                                    Portrait (3:4)
                                </button>
                                <button
                                    onClick={() => setAspectRatio("9/16")}
                                    className={cn("flex-1 py-1.5 text-sm rounded transition", aspectRatio === "9/16" ? "bg-zinc-800 text-white font-medium" : "text-zinc-500 hover:text-zinc-300")}
                                >
                                    Story (9:16)
                                </button>
                            </div>
                        </div>

                        {/* Background Upload */}
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-2">Imagem de Fundo</label>
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-700 rounded-lg hover:border-zinc-500 hover:bg-zinc-800/50 transition-colors cursor-pointer group">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    {bgImage ? (
                                        <div className="relative w-full h-24 overflow-hidden rounded group/image">
                                            <img src={bgImage} className="w-full h-full object-cover opacity-50" />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs text-white">Trocar Imagem</div>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setBgImage(null);
                                                }}
                                                className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity"
                                                title="Remover imagem"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="w-8 h-8 text-zinc-500 mb-2 group-hover:text-zinc-400" />
                                            <p className="text-sm text-zinc-500 group-hover:text-zinc-400">Clique para upload</p>
                                        </>
                                    )}
                                </div>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </label>
                        </div>

                        {/* Overlay Slider */}
                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-xs font-medium text-zinc-400">Escurecer Fundo (Overlay)</label>
                                <span className="text-xs text-zinc-500">{overlayOpacity}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="95"
                                value={overlayOpacity}
                                onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                            />
                        </div>

                        {/* Controls Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-2">Cor de Destaque</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={highlightColor}
                                        onChange={(e) => setHighlightColor(e.target.value)}
                                        className="w-10 h-10 p-0 border-0 rounded bg-transparent cursor-pointer"
                                    />
                                    <span className="text-xs text-zinc-500 uppercase">{highlightColor}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-2">Alinhamento</label>
                                <div className="flex bg-zinc-950 rounded-lg border border-zinc-800 p-1">
                                    <button onClick={() => setAlignment('left')} className={cn("flex-1 p-1.5 rounded hover:bg-zinc-800 transition", alignment === 'left' && "bg-zinc-800 text-white")}><AlignLeft className="w-4 h-4 mx-auto" /></button>
                                    <button onClick={() => setAlignment('center')} className={cn("flex-1 p-1.5 rounded hover:bg-zinc-800 transition", alignment === 'center' && "bg-zinc-800 text-white")}><AlignCenter className="w-4 h-4 mx-auto" /></button>
                                    <button onClick={() => setAlignment('right')} className={cn("flex-1 p-1.5 rounded hover:bg-zinc-800 transition", alignment === 'right' && "bg-zinc-800 text-white")}><AlignRight className="w-4 h-4 mx-auto" /></button>
                                </div>
                            </div>
                        </div>

                        {/* Font Size */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="flex justify-between mb-1">
                                    <label className="text-xs font-medium text-zinc-400">Tam. Texto</label>
                                    <span className="text-xs text-zinc-500">{fontSize}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="24"
                                    max="96"
                                    value={fontSize}
                                    onChange={(e) => setFontSize(Number(e.target.value))}
                                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                            </div>
                            <div>
                                <div className="flex justify-between mb-1">
                                    <label className="text-xs font-medium text-zinc-400">Tam. @</label>
                                    <span className="text-xs text-zinc-500">{usernameSize}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="14"
                                    max="48"
                                    value={usernameSize}
                                    onChange={(e) => setUsernameSize(Number(e.target.value))}
                                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Preview */}
            <div className="w-full lg:flex-1 flex flex-col items-center justify-center bg-zinc-950/50 border border-zinc-800/50 rounded-xl relative p-4 sm:p-8 bg-[url('https://transparenttextures.com/patterns/carbon-fibre.png')] lg:sticky lg:top-0 lg:h-[calc(100vh-8rem)]">
                <div className="flex-1 w-full flex items-center justify-center py-4">
                    <div
                        ref={previewRef}
                        className={cn(
                            "relative bg-black overflow-hidden flex flex-col justify-center p-8 sm:p-12 text-white shadow-2xl",
                            aspectRatio === "1/1" && "aspect-square w-full max-w-[500px]",
                            aspectRatio === "3/4" && "aspect-[3/4] w-full max-w-[450px]",
                            aspectRatio === "9/16" && "aspect-[9/16] w-[85%] sm:w-full max-w-[380px]",
                        )}
                        style={{
                            backgroundImage: bgImage ? `url(${bgImage})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            textAlign: alignment,
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                        }}
                    >
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black transition-opacity duration-300 pointer-events-none" style={{ opacity: overlayOpacity / 100 }} />

                        {/* Content Container */}
                        <div className="relative z-10 flex-1 flex flex-col justify-center">
                            <h1
                                className="font-bold leading-tight tracking-tight"
                                style={{
                                    fontSize: `${fontSize}px`,
                                    textShadow: '0 10px 15px rgba(0,0,0,0.3)'
                                }}
                            >
                                {renderText()}
                            </h1>

                            {author && (
                                <p className="mt-8 font-medium text-[#d4d4d8] border-t border-[rgba(255,255,255,0.2)] pt-4 w-max mx-auto" style={{
                                    marginRight: alignment === 'right' ? '0' : 'auto',
                                    marginLeft: alignment === 'left' ? '0' : 'auto',
                                    fontSize: `${usernameSize}px`,
                                    textShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                }}>
                                    @{author.replace(/^@/, '')}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="mt-8 flex items-center gap-2 bg-gradient-to-r from-sky-400 to-sky-500 hover:from-sky-300 hover:to-sky-400 text-zinc-950 px-8 py-3 rounded-full font-bold shadow-lg shadow-sky-400/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                    {isDownloading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Gerando...
                        </>
                    ) : (
                        <>
                            <Download className="w-5 h-5" />
                            Baixar Quote
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
