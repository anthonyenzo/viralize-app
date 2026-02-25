import { useState, useRef, useEffect, useCallback } from "react";
import { Upload, Video, Clapperboard, Download, Sparkles, AlertCircle, Play, Pause, Loader2, Terminal } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { cn } from "../../lib/utils";
import { useAppStore } from "../../store/useAppStore";
import { useAuthStore } from "../../store/useAuthStore";

// --- WebCodecs Type Definitions (Polyfill for TS) ---
// These are standard in modern browsers but may be missing from current TS lib
declare class MediaStreamTrackProcessor {
    constructor(init: { track: MediaStreamTrack });
    readable: ReadableStream;
}
declare class VideoEncoder {
    constructor(init: { output: (chunk: any, meta: any) => void, error: (e: any) => void });
    configure(config: any): void;
    encode(frame: VideoFrame, options?: { keyFrame: boolean }): void;
    flush(): Promise<void>;
    state: string;
}
declare class AudioEncoder {
    constructor(init: { output: (chunk: any, meta: any) => void, error: (e: any) => void });
    configure(config: any): void;
    encode(data: any): void;
    flush(): Promise<void>;
    state: string;
}
declare class VideoFrame {
    constructor(image: CanvasImageSource, init?: { timestamp: number, duration?: number });
    close(): void;
}
// ----------------------------------------------------

interface Headline {
    tone: string;
    text: string;
}

export function ReelsCreator() {
    const { incrementReels } = useAppStore();
    const { user } = useAuthStore();
    // State management
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [name, setName] = useState("Nome do Usuário");
    const [username, setUsername] = useState("usuario");
    const [logo, setLogo] = useState<string | null>(null);
    const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'analyzing' | 'success' | 'error'>('idle');
    const [headlines, setHeadlines] = useState<Headline[]>([]);
    const [selectedHeadline, setSelectedHeadline] = useState<string>("");
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [renderStats, setRenderStats] = useState({ frame: 0, time: 0, duration: 0, fps: 0 });
    const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
    const [aiContext, setAiContext] = useState("");

    // Video Positioning State (Pan & Scale)
    const [videoPosition, setVideoPosition] = useState({ x: 0, y: 0, scale: 1 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [touchDistance, setTouchDistance] = useState<number | null>(null);
    const [exportedBlob, setExportedBlob] = useState<Blob | null>(null);

    // Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null); // Export Canvas
    const previewCanvasRef = useRef<HTMLCanvasElement>(null); // Preview Canvas (Interactive)
    const isRenderingRef = useRef(false); // Ref for sync state checking inside loops
    const [isRendering, setIsRendering] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Load Data
    useEffect(() => {
        const savedProfile = localStorage.getItem("viralize-reels-profile");
        if (savedProfile) {
            try {
                const p = JSON.parse(savedProfile);
                if (p.logo) setLogo(p.logo);
                if (p.name) setName(p.name);
                if (p.username) setUsername(p.username);
            } catch (e) { }
        }
    }, [videoFile]);

    const saveProfile = (newName: string, newUsername: string, newLogo: string | null) => {
        const profile = { name: newName, username: newUsername, logo: newLogo };
        localStorage.setItem("viralize-reels-profile", JSON.stringify(profile));
    };

    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 100 * 1024 * 1024) { // 100MB limit check
                alert("O vídeo deve ter menos de 100MB.");
                return;
            }
            setVideoFile(file);
            const url = URL.createObjectURL(file);
            setVideoUrl(url);
            setAnalysisStatus('idle');
            setHeadlines([]);
            setSelectedHeadline("");
        }
    };

    // Prepare Badge Image (Verified Badge SVG) - Preload once
    const badgeImgRef = useRef<HTMLImageElement | null>(null);
    const layoutCacheRef = useRef<{ text: string, width: number, lines: string[] } | null>(null);

    useEffect(() => {
        const badgeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 22" fill="#1d9bf0"><g><path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.687.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.215 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.589 2.589 5.828-5.829 1.386 1.28-7.667 6.69z"></path></g></svg>`;
        const img = new Image();
        img.src = 'data:image/svg+xml;base64,' + btoa(badgeSvg);
        badgeImgRef.current = img;
    }, []);


    // --- UNIFIED DRAWING LOGIC ---
    // This is the core function that guarantees 100% fidelity between Preview and Export
    // Using useCallback so we can call it from both loops
    const drawReelFrame = useCallback((
        ctx: CanvasRenderingContext2D,
        canvasWidth: number,
        canvasHeight: number,
        videoElement: HTMLVideoElement
    ) => {
        // Clear background
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Constants - Scaled by ratio to Reference (720p)
        const referenceWidth = 720;
        const scaleM = canvasWidth / referenceWidth;

        // Safe Zone (Top) - Keep this large as requested
        const safeZoneTop = 220 * scaleM;

        // Font Sizes (Scaled) - Adjusted to match Twitter layout natively
        const nameSize = 25 * scaleM;
        const usernameSize = 24 * scaleM;
        const bodySize = 32 * scaleM; // Closer to standard tweet text relative size
        const lineHeight = 42 * scaleM;

        // Font Family
        const fontBase = '"TwitterChirp", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

        // 1. Calculate Text Layout (With Caching for Performance)
        ctx.font = `400 ${bodySize}px ${fontBase}`;
        const text = selectedHeadline || "Sua headline vai aparecer aqui...";
        // Padding: 50px left + 50px right = 100px total
        const maxTextWidth = canvasWidth - (100 * scaleM);

        let lines: string[] = [];

        // Check Cache
        if (
            layoutCacheRef.current &&
            layoutCacheRef.current.text === text &&
            layoutCacheRef.current.width === canvasWidth
        ) {
            lines = layoutCacheRef.current.lines;
        } else {
            // Recalculate (Expensive Operation)
            const words = text.split(' ');
            let line = '';

            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = ctx.measureText(testLine);
                const testWidth = metrics.width;
                if (testWidth > maxTextWidth && n > 0) {
                    lines.push(line);
                    line = words[n] + ' ';
                } else {
                    line = testLine;
                }
            }
            lines.push(line);

            // Update Cache
            layoutCacheRef.current = { text, width: canvasWidth, lines };
        }

        const textBlockHeight = lines.length * lineHeight;
        const headerContentHeight = 120 * scaleM;
        // Reduced bottom padding as requested (from 60 -> 20)
        const totalContentHeight = headerContentHeight + textBlockHeight + (20 * scaleM);

        // Top Bar Height covering entire UI area
        const topBarHeight = safeZoneTop + totalContentHeight;

        // 2. Draw Video
        const videoY = topBarHeight;
        const videoAvailableHeight = canvasHeight - videoY;

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, videoY, canvasWidth, videoAvailableHeight);
        ctx.clip();

        // Calculate Video Dimensions (Cover)
        const vRatio = videoElement.videoWidth / videoElement.videoHeight;
        const targetRatio = canvasWidth / videoAvailableHeight;
        let drawW, drawH, startX, startY;

        if (vRatio > targetRatio) {
            drawH = videoAvailableHeight;
            drawW = drawH * vRatio;
            startX = (canvasWidth - drawW) / 2;
            startY = videoY;
        } else {
            drawW = canvasWidth;
            drawH = drawW / vRatio;
            startX = 0;
            startY = videoY + (videoAvailableHeight - drawH) / 2;
        }

        // Apply User Transform
        // We normalize the position based on a 360px width assumption for interaction
        const positionalScale = canvasWidth / 360;

        ctx.drawImage(
            videoElement,
            startX + (videoPosition.x * positionalScale),
            startY + (videoPosition.y * positionalScale),
            drawW * videoPosition.scale,
            drawH * videoPosition.scale
        );

        ctx.restore();

        // 3. Draw Top Bar Background
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvasWidth, topBarHeight);

        // 4. Draw Header Content
        // Padding: 50px from left
        const contentStartX = 50 * scaleM;
        const contentStartY = safeZoneTop + (20 * scaleM);

        // Avatar
        const avatarSize = 80 * scaleM;
        const avatarY = contentStartY;

        if (logo) {
            const logoImg = new Image();
            logoImg.src = logo;
            ctx.save();
            ctx.beginPath();
            ctx.arc(contentStartX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            try {
                // Ensure image is loaded usually, but simplified here
                ctx.drawImage(logoImg, contentStartX, avatarY, avatarSize, avatarSize);
            } catch (e) { }
            ctx.restore();
        } else {
            ctx.fillStyle = "#333";
            ctx.beginPath();
            ctx.arc(contentStartX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
            ctx.fill();
        }

        // Name
        const textStartX = contentStartX + avatarSize + (16 * scaleM);
        const textStartY = avatarY + (12 * scaleM); // Start text lower to vertically center with the 80px avatar

        ctx.fillStyle = "white";
        ctx.font = `bold ${nameSize}px ${fontBase}`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        const nameMetrics = ctx.measureText(name);
        ctx.fillText(name, textStartX, textStartY);

        // Verified Badge (Larger relative to the name)
        const badgeSize = 28 * scaleM;
        const badgeX = textStartX + nameMetrics.width + (6 * scaleM);
        const badgeY = textStartY - (1 * scaleM); // Aligned visually with the name text
        if (badgeImgRef.current && badgeImgRef.current.complete) {
            ctx.drawImage(badgeImgRef.current, badgeX, badgeY, badgeSize, badgeSize);
        }

        // Handle
        ctx.fillStyle = "#71717a";
        ctx.font = `${usernameSize}px ${fontBase}`;
        ctx.fillText("@" + username.replace('@', ''), textStartX, textStartY + (32 * scaleM));

        // Body Text
        ctx.fillStyle = "white";
        ctx.font = `400 ${bodySize}px ${fontBase}`;

        const bodyY = avatarY + avatarSize + (30 * scaleM);
        lines.forEach((l, i) => {
            ctx.fillText(l, 50 * scaleM, bodyY + (i * lineHeight));
        });

    }, [videoPosition, selectedHeadline, name, username, logo]);


    // --- PREVIEW DRAW LOOP ---
    useEffect(() => {
        if (!videoFile || isRendering) return;
        const video = videoRef.current;
        const canvas = previewCanvasRef.current;
        if (!video || !canvas) return;

        // Force 360x640 resolution (9:16)
        canvas.width = 360;
        canvas.height = 640;

        let animationFrameId: number;

        const loop = () => {
            if (video.paused && !video.ended) {
                // Even if paused, we might want to redraw if position changes
            }
            const ctx = canvas.getContext('2d');
            if (ctx) {
                drawReelFrame(ctx, canvas.width, canvas.height, video);
            }
            animationFrameId = requestAnimationFrame(loop);
        };
        loop();

        return () => cancelAnimationFrame(animationFrameId);
    }, [videoFile, isRendering, drawReelFrame, videoPosition]);


    // AI Analysis Logic
    const analyzeVideo = async () => {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            setError("Erro interno: Chave API do Servidor não configurada (.env).");
            return;
        }
        if (!videoFile) return;

        try {
            setAnalysisStatus('analyzing');
            setError(null);

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            // Convert file to base64 for Gemini
            const base64Data = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(videoFile);
                reader.onload = () => {
                    const result = reader.result as string;
                    const base64 = result.split(',')[1];
                    resolve(base64);
                };
                reader.onerror = reject;
            });

            const prompt = `Analise este vídeo para Instagram Reels/TikTok. ${aiContext ? `Considere este contexto adicional: ${aiContext}. ` : ""}Gere 3 headlines virais em JSON com os campos 'tone' e 'text'. Os tons devem ser: 'Polêmico', 'Educativo', 'Hype'. O texto das headlines deve ser em PORTUGUÊS DO BRASIL (PT-BR), informal e engajador. Retorne APENAS o JSON.`;

            const result = await model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: videoFile.type
                    }
                }
            ]);

            const responseText = result.response.text();
            const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(jsonStr);

            if (Array.isArray(data)) {
                setHeadlines(data);
                setAnalysisStatus('success');
            } else if (data.headlines) {
                setHeadlines(data.headlines);
                setAnalysisStatus('success');
            } else {
                throw new Error("Formato de resposta inválido da IA");
            }

        } catch (err: any) {
            console.error("Analysis failed", err);
            setError(err instanceof Error ? err.message : "Falha na análise. Verifique se sua API Key é válida.");
            setAnalysisStatus('error');
        }
    };

    // Video Rendering Logic (Refactored for 30fps Synchronization & Audio Fidelity)
    const renderVideo = async () => {
        if (!videoRef.current || !canvasRef.current || !selectedHeadline) return;

        isRenderingRef.current = true;
        setIsRendering(true);
        const video = videoRef.current;
        const canvas = canvasRef.current;
        // Watchdog removed as requested

        try {
            console.log("Render: Starting...");

            // --- 0. STATUS INIT & SAFETY CHECKS ---
            console.log("Render: Waiting for metadata...");
            // Wait for Metadata (Duration)
            if (video.readyState < 1) {
                await new Promise(r => {
                    video.onloadedmetadata = () => r(null);
                    setTimeout(r, 2000); // 2s timeout
                });
            }

            console.log("Render: Metadata loaded. Duration:", video.duration);
            if (!video.duration || isNaN(video.duration)) {
                throw new Error("Duração do vídeo inválida/zerada.");
            }

            // Update stats with real duration immediately so user sees it
            setRenderStats({ frame: 0, time: 0, duration: video.duration, fps: -1 });

            const ctx = canvas.getContext('2d', { willReadFrequently: true }); // Optimized
            if (!ctx) throw new Error("Falha ao criar contexto 2D");

            // Resolution Config
            const targetWidth = resolution === '1080p' ? 1080 : 720;
            const targetHeight = resolution === '1080p' ? 1920 : 1280;

            console.log(`Render: Configured for ${resolution} (${targetWidth}x${targetHeight}) @ 12Mbps`);

            canvas.width = targetWidth;
            canvas.height = targetHeight;

            // --- Audio Context Setup (Offline Processing) ---
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            const audioCtx = audioContextRef.current;
            if (audioCtx.state === 'suspended') await audioCtx.resume();

            console.log("Render: extracting audio track...");
            let audioBuffer: AudioBuffer | null = null;
            try {
                if (!videoFile) throw new Error("Video File unavailable");
                const arrayBuffer = await videoFile.arrayBuffer();
                audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
                console.log("Render: Audio decoded", { channels: audioBuffer.numberOfChannels, rate: audioBuffer.sampleRate });
            } catch (e: any) {
                console.error("Audio extraction failed:", e);
                alert("Aviso: Falha ao carregar o áudio original. O vídeo ficará mudo. (" + e.message + ")");
            }



            // --- Muxer & Encoder Setup ---
            console.log("Render: Importing Muxer...");
            const { Muxer, ArrayBufferTarget } = await import('mp4-muxer');
            console.log("Render: Muxer loaded.");
            // Fixed Frame Rate: 60fps (CapCut Standard)
            const FPS = 60;

            // Video Codec Resolution & Selection (H.265 / HEVC)
            let selectedCodec = 'hev1.1.6.L120.90'; // HEVC Main Profile Level 4.0
            let muxerVideoCodec: 'hevc' | 'avc' = 'hevc';

            if ('isConfigSupported' in VideoEncoder) {
                try {
                    const support = await (VideoEncoder as any).isConfigSupported({
                        codec: selectedCodec,
                        width: targetWidth,
                        height: targetHeight,
                        bitrate: 12_000_000,
                        framerate: FPS,
                    });
                    if (!support.supported) {
                        console.warn("H.265 (HEVC) not supported on this browser, falling back to H.264 (AVC)");
                        selectedCodec = 'avc1.4D4028';
                        muxerVideoCodec = 'avc';
                    } else {
                        console.log("H.265 (HEVC) support confirmed!");
                    }
                } catch (e) { }
            }

            const muxerOptions: any = {
                target: new ArrayBufferTarget(),
                video: {
                    codec: muxerVideoCodec,
                    width: targetWidth,
                    height: targetHeight,
                    frameRate: FPS
                },
                fastStart: 'in-memory', // Critical for WhatsApp
                firstTimestampBehavior: 'offset'
            };

            // Only configure muxer audio if we successfully decoded an audio buffer
            if (audioBuffer) {
                muxerOptions.audio = {
                    codec: 'aac',
                    numberOfChannels: audioBuffer.numberOfChannels,
                    sampleRate: audioBuffer.sampleRate
                };
            }

            const muxer = new Muxer(muxerOptions);
            console.log("Render: Muxer initialized.");

            let encodedFramesCount = 0;
            const videoEncoder = new VideoEncoder({
                output: (chunk, meta) => {
                    try {
                        muxer.addVideoChunk(chunk, meta);
                        encodedFramesCount++;
                    } catch (e: any) {
                        console.error("Muxer error adding video chunk:", e);
                        if (chunk.type === 'key') {
                            isRenderingRef.current = false;
                            setIsRendering(false);
                            alert(`Erro fatal no codificador: ${e.message}`);
                        }
                    }
                },
                error: (e) => {
                    const msg = e.message || String(e);
                    console.error("VideoEncoder error:", e);
                    alert(`Erro no codificador de vídeo: ${msg}`);
                    isRenderingRef.current = false;
                    setIsRendering(false);
                }
            });

            const videoConfig: VideoEncoderConfig = {
                codec: selectedCodec,
                width: targetWidth,
                height: targetHeight,
                bitrate: 12_000_000, // 12 Mbps (User Requested)
                framerate: FPS,
                hardwareAcceleration: 'prefer-hardware',
                latencyMode: 'realtime',
            };

            // Check support before configuring (Safe check)
            if ('isConfigSupported' in VideoEncoder) {
                (VideoEncoder as any).isConfigSupported(videoConfig).then((support: any) => {
                    console.log(`Video Config Supported: ${support.supported}`, support);
                    if (!support.supported) {
                        alert(`Aviso: Seu navegador não suporta exportar em H.265 nativamente ou nesta resolução. Tente usar o Chrome atualizado.`);
                    }
                }).catch((e: any) => console.error("Check support error", e));
            }

            videoEncoder.configure(videoConfig);
            console.log("Render: VideoEncoder configured.");

            let audioEncoder: AudioEncoder | null = null;

            if (audioBuffer) {
                audioEncoder = new AudioEncoder({
                    output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
                    error: (e) => {
                        const msg = e.message || String(e);
                        if (msg.includes('Flushing error')) {
                            console.warn("AudioEncoder flushing error (ignored):", e);
                            return;
                        }
                        console.error("AudioEncoder error:", e);
                        alert(`Erro no codificador de áudio: ${msg}`);
                    }
                });

                audioEncoder.configure({
                    codec: 'mp4a.40.2', // AAC LC
                    numberOfChannels: audioBuffer.numberOfChannels,
                    sampleRate: audioBuffer.sampleRate,
                    bitrate: Math.max(128_000, audioBuffer.numberOfChannels * 64_000), // Scale bitrate safely
                });
                console.log("Render: AudioEncoder configured.");

                // --- 1. Process Audio Offline (Max Compatibility) ---
                const processAudio = async () => {
                    if (!audioEncoder || !audioBuffer) return;
                    console.log("Render: encoding audio track (Manual Chunking)...");
                    try {
                        const targetSampleRate = audioBuffer.sampleRate;
                        const targetChannels = audioBuffer.numberOfChannels;
                        const totalFrames = audioBuffer.length;

                        // Use a larger chunk size to ensure AAC gets enough frames per request (1024 frames is standard)
                        const chunkSize = 1024;
                        let offset = 0;

                        while (offset < totalFrames) {
                            const size = Math.min(chunkSize, totalFrames - offset);

                            // AAC Encoders on Safari strictly expect 'f32-planar' for multi-channel AudioData
                            const planarData = new Float32Array(size * targetChannels);
                            for (let ch = 0; ch < targetChannels; ch++) {
                                // .getChannelData returns the full float32 array for that channel
                                const bufferChannelData = audioBuffer.getChannelData(ch);
                                for (let i = 0; i < size; i++) {
                                    // Interleave planar: All Ch0 first, then all Ch1, etc.
                                    planarData[ch * size + i] = bufferChannelData[offset + i];
                                }
                            }

                            const audioData = new AudioData({
                                format: 'f32-planar',
                                sampleRate: targetSampleRate,
                                numberOfFrames: size,
                                numberOfChannels: targetChannels,
                                timestamp: Math.round((offset / targetSampleRate) * 1_000_000), // in microseconds
                                data: planarData
                            });

                            if (audioEncoder.state === 'configured') {
                                audioEncoder.encode(audioData);
                            }
                            audioData.close();
                            offset += size;

                            // Yield to main thread briefly every few chunks to prevent freezing
                            if (offset % (chunkSize * 50) === 0) {
                                await new Promise(r => setTimeout(r, 0));
                            }
                        }

                        console.log("Render: Audio track encoded successfully.");
                    } catch (e: any) {
                        console.error("Audio encoding failed:", e);
                        alert("Não foi possível processar o áudio (" + e.message + "). O vídeo pode ficar mudo.");
                    }
                };

                await processAudio();
            }

            // --- Prep Playback (Visual Only) ---
            video.currentTime = 0;
            video.loop = false;
            video.muted = true; // Mute to allow fast playback without distorting system audio

            // Timestamps are based on video time, so output speed is correct.
            // 720p is fast enough for 1.0x (Real-time).
            // 1080p is heavy (2.25x pixels), so we slow down to 0.75x to give the renderer time to capture every frame smoothly.
            const playbackSpeed = resolution === '1080p' ? 0.75 : 1.0;
            video.playbackRate = playbackSpeed;

            console.log(`Render: Starting playback (Visuals) at ${playbackSpeed}x speed...`);
            try {
                await video.play();
            } catch (e: any) {
                throw new Error("Falha ao iniciar reprodução: " + e.message);
            }

            // --- Capture Loop (Visuals) ---

            // --- Render Loop (With Gating) ---
            let frameCount = 0;
            const targetFrameInterval = 1 / FPS; // 1/60s
            let nextFrameTime = 0;

            const processFrame = async () => {
                const isRunning = isRenderingRef.current;
                if (!isRunning) return;

                // Sync with Video Time (Critical Fix for Speed Mismatch)
                const currentVideoTime = video.currentTime;

                // Exit Condition: Check real time, not frame count
                if (video.ended || (video.duration && currentVideoTime >= video.duration - 0.1)) {
                    console.log("Render: Finished (Duration/Ended condition met)");
                    await finalizeExport();
                    return;
                }

                // FPS Gating: Ensure strict 60fps output regardless of playback speed
                // If we are at 0.5x speed, video time advances slower than real time (rAF), so we skip frames to match 60fps target.
                if (currentVideoTime < nextFrameTime) {
                    if (isRenderingRef.current) requestAnimationFrame(processFrame);
                    return; // Too early for next frame
                }

                // Advance target time for next frame
                // We use nextFrameTime as the base to keep perfect cadence, but clamp to current time if we fell behind significantly
                if (currentVideoTime > nextFrameTime + targetFrameInterval * 2) {
                    nextFrameTime = currentVideoTime; // Resync if major lag
                } else {
                    nextFrameTime += targetFrameInterval;
                }

                const timestamp = Math.round(currentVideoTime * 1_000_000);
                const frameDuration = Math.round(1_000_000 / FPS);

                // Debug Stats (Update UI every ~0.5s)
                if (frameCount % 30 === 0) {
                    setRenderStats({
                        frame: frameCount,
                        time: currentVideoTime,
                        duration: video.duration || 0,
                        fps: FPS
                    });
                }

                // Flow Control: Prevent Encoder Saturation (Video + Audio)
                const vQueue = (videoEncoder as any).encodeQueueSize;
                const aQueue = audioEncoder ? (audioEncoder as any).encodeQueueSize : 0;

                if (vQueue > 10 || aQueue > 10) {
                    // Only pause if actually moving
                    if (!video.paused) video.pause();

                    // Wait for queues to drain
                    while (isRenderingRef.current && ((videoEncoder as any).encodeQueueSize > 2 || (audioEncoder ? (audioEncoder as any).encodeQueueSize : 0) > 2)) {
                        await new Promise(r => setTimeout(r, 10));
                    }
                    if (isRenderingRef.current && video.paused) await video.play();
                }

                try {
                    // Draw
                    drawReelFrame(ctx, canvas.width, canvas.height, video);

                    // Optimization: Snapshot canvas directly
                    const frame = new VideoFrame(canvas, {
                        timestamp: timestamp,
                        duration: frameDuration,
                        alpha: 'discard'
                    } as any);

                    if (videoEncoder.state === 'configured') {
                        // Keyframe every 2 seconds (approx 120 frames at 60fps)
                        videoEncoder.encode(frame, { keyFrame: frameCount % 120 === 0 });
                    }

                    frame.close();
                    frameCount++;

                    if (isRenderingRef.current) {
                        requestAnimationFrame(processFrame);
                    }
                } catch (e) {
                    console.error("Frame processing error:", e);
                    isRenderingRef.current = false;
                    setIsRendering(false);
                    alert("Erro durante processamento: " + String(e));
                }
            };

            const finalizeExport = async () => {
                try {
                    // 1. Stop Loop
                    isRenderingRef.current = false;

                    // 2. Flush Encoders
                    try {
                        if (videoEncoder.state === 'configured') await videoEncoder.flush();
                    } catch (e) {
                        console.error("Video flush error:", e);
                        throw e; // Video is critical
                    }

                    try {
                        if (audioEncoder && (audioEncoder as any).state === 'configured') await audioEncoder.flush();
                    } catch (e) {
                        console.warn("Audio flush error (ignoring):", e);
                        // Non-fatal, proceed to save video (silent)
                    }

                    // 3. Finalize Container
                    if (encodedFramesCount === 0) {
                        throw new Error("Nenhum frame processado. Tente recarregar a página.");
                    }

                    try {
                        muxer.finalize();
                    } catch (e: any) {
                        // Specific handler for colorSpace crash
                        if (e.message?.includes('colorSpace')) {
                            throw new Error("Erro de metadados do vídeo. Tente um vídeo diferente ou outro navegador.");
                        }
                        throw e;
                    }

                    const buffer = (muxer.target as any).buffer;
                    const blob = new Blob([buffer], { type: 'video/mp4' });
                    setExportedBlob(blob); // Save to state for manual download trigger

                    if (user) {
                        incrementReels(user.id);
                    }

                } catch (err) {
                    console.error("Export Error", err);
                    const msg = err instanceof Error ? err.message : String(err);
                    alert(`Erro ao finalizar vídeo: ${msg}. Tente recarregar a página.`);
                    setIsRendering(false);
                } finally {
                    isRenderingRef.current = false;

                    // Cleanup
                    video.currentTime = 0;
                    video.playbackRate = 1.0;
                    video.loop = true;
                    video.play();

                    setIsPlaying(true);
                }
            };

            // --- START LOOP ROBUSTLY ---
            // We use a failsafe to ensure the loop kicks off even if requestVideoFrameCallback hangs

            let loopActive = false;
            const startLoop = () => {
                if (loopActive) return;
                loopActive = true;
                console.log("DEBUG: Starting render loop (Forced rAF for 60fps)...");
                requestAnimationFrame(processFrame);
            };

            startLoop();

            // WATCHDOG: If frame 0 hasn't processed in 1.5s, force fallback to rAF
            setTimeout(() => {
                if (isRendering && frameCount === 0) {
                    console.warn("⚠️ Watchdog: Loop stalled at 0. Forcing requestAnimationFrame...");
                    console.log("DEBUG: Watchdog triggered. Current frame count:", frameCount);
                    requestAnimationFrame(processFrame);
                    // Also kick video play again just in case
                    video.play().catch(console.error);
                }
            }, 1500);

        } catch (err: any) {
            console.error("Render Fatal Error:", err);
            isRenderingRef.current = false;
            setIsRendering(false);
            alert("Erro ao iniciar renderização: " + (err instanceof Error ? err.message : String(err)));
        }
    };

    const handleDownload = async () => {
        if (!exportedBlob) return;
        const file = new File([exportedBlob], `viralize-reel-${Date.now()}.mp4`, { type: 'video/mp4' });

        try {
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Viralize Reel',
                    text: 'Confira este reel gerado no Viralize AI'
                });
            } else {
                throw new Error("Web Share failed/unsupported");
            }
        } catch (shareError) {
            console.log("Fallback to legacy download:", shareError);
            const url = URL.createObjectURL(exportedBlob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        }
    };

    return (
        <div className="flex flex-col-reverse lg:flex-row gap-6 min-h-full">
            {/* Left Panel: Inputs */}
            <div className="w-full lg:flex-1 lg:overflow-y-auto space-y-6 pr-2">

                {/* Upload Section */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Video className="w-5 h-5 text-sky-400" />
                        Vídeo Original
                    </h2>

                    {
                        !videoFile ? (
                            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-zinc-700 rounded-lg hover:border-sky-400 hover:bg-zinc-800/50 transition-colors cursor-pointer group">
                                <Upload className="w-10 h-10 text-zinc-500 mb-2 group-hover:text-sky-400" />
                                <p className="text-sm text-zinc-400">Arraste seu vídeo (MP4/MOV)</p>
                                <p className="text-xs text-zinc-600 mt-1">Máx 60 segundos</p>
                                <input type="file" className="hidden" accept="video/mp4,video/quicktime,video/webm" onChange={handleVideoUpload} />
                            </label>
                        ) : (
                            <div className="flex items-center justify-between bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                                <span className="text-sm text-zinc-300 truncate max-w-[200px]">{videoFile.name}</span>
                                <button onClick={() => { setVideoFile(null); setVideoUrl(null); }} className="text-xs text-red-400 hover:text-red-300">Remover</button>
                            </div>
                        )
                    }

                    {/* Profile Section */}
                    <div className="mt-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Nome</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        saveProfile(e.target.value, username, logo);
                                    }}
                                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-sm text-zinc-100"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Usuário (@)</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => {
                                        setUsername(e.target.value);
                                        saveProfile(name, e.target.value, logo);
                                    }}
                                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-sm text-zinc-100"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-2">Foto de Perfil</label>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700">
                                    {logo ? <img src={logo} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-zinc-800" />}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                const result = reader.result as string;
                                                setLogo(result);
                                                saveProfile(name, username, result);
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                    className="text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-sky-400/10 file:text-sky-400 hover:file:bg-sky-400/20 cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>
                </div >

                {/* Analysis Section */}
                {
                    videoFile && (
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-sky-400" />
                                Geração de Headlines
                            </h2>

                            <div className="mb-4">
                                <label className="block text-xs font-medium text-zinc-400 mb-2 flex items-center gap-1">
                                    Contexto para a IA (Opcional)
                                    <span className="text-[10px] opacity-50 bg-zinc-800 px-1 rounded">Dê um direcionamento</span>
                                </label>
                                <textarea
                                    value={aiContext}
                                    onChange={(e) => setAiContext(e.target.value)}
                                    placeholder="Ex: Este vídeo é sobre dicas de React. Use um tom divertido e focado em iniciantes."
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-400/50 min-h-[80px] aria-disabled:opacity-50"
                                    disabled={analysisStatus === 'analyzing'}
                                />
                            </div>

                            {analysisStatus === 'idle' && (
                                <>
                                    <button
                                        onClick={analyzeVideo}
                                        className="w-full py-3 bg-gradient-to-r from-sky-400 to-sky-400 rounded-lg font-bold text-zinc-950 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        Analisar Vídeo com IA
                                    </button>
                                    <button
                                        onClick={() => {
                                            setHeadlines([
                                                { tone: 'Teste', text: 'Esta é uma headline de teste para validar a renderização rápida.' },
                                                { tone: 'Teste', text: 'Headline curta.' },
                                                { tone: 'Teste', text: 'Headline longa para testar a quebra de linha automática e verificar se o cache de layout está funcionando corretamente.' }
                                            ]);
                                            setAnalysisStatus('success');
                                            setSelectedHeadline('Esta é uma headline de teste para validar a renderização rápida.');
                                        }}
                                        className="w-full py-3 bg-zinc-800 border border-zinc-700 rounded-lg font-medium text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2 mt-2"
                                    >
                                        <Terminal className="w-4 h-4" />
                                        Modo Teste (Sem IA)
                                    </button>
                                </>
                            )}

                            {analysisStatus === 'analyzing' && (
                                <div className="text-center py-6">
                                    <Loader2 className="w-8 h-8 text-sky-400 animate-spin mx-auto mb-2" />
                                    <p className="text-sm text-zinc-400">A IA está assistindo seu vídeo...</p>
                                </div>
                            )}

                            {analysisStatus === 'error' && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-start gap-2">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <div>
                                        <p className="font-bold">Erro na análise</p>
                                        <p>{error}</p>
                                    </div>
                                </div>
                            )}

                            {analysisStatus === 'success' && (
                                <div className="space-y-3">
                                    <p className="text-xs text-zinc-500 mb-2">Selecione uma headline gerada:</p>
                                    {headlines.map((h, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedHeadline(h.text)}
                                            className={cn(
                                                "w-full text-left p-3 rounded-lg border transition-all hover:bg-zinc-800",
                                                selectedHeadline === h.text
                                                    ? "bg-sky-400/20 border-sky-400/50 text-sky-100"
                                                    : "bg-zinc-950 border-zinc-800 text-zinc-300"
                                            )}
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[10px] uppercase tracking-wider font-bold opacity-70 bg-black/30 px-2 py-0.5 rounded">{h.tone}</span>
                                            </div>
                                            <p className="font-medium text-sm">{h.text}</p>
                                        </button>
                                    ))}

                                    {selectedHeadline && (
                                        <div className="mt-6 pt-6 border-t border-zinc-800 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <label className="block text-xs font-medium text-sky-400 mb-2 flex items-center gap-2">
                                                <Terminal className="w-3.0 h-3.0" />
                                                Editar Headline Selecionada
                                            </label>
                                            <textarea
                                                value={selectedHeadline}
                                                onChange={(e) => setSelectedHeadline(e.target.value)}
                                                className="w-full bg-zinc-950 border border-sky-400/30 rounded-lg p-4 text-base font-bold text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-400/50 min-h-[100px] shadow-inner"
                                                placeholder="Edite sua headline aqui..."
                                            />
                                            <p className="text-[10px] text-zinc-500 mt-2 italic">
                                                * Mudanças aqui refletem instantaneamente no preview do Reel.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                }
            </div>

            {/* Right Panel: Preview & Download */}
            <div className="w-full lg:flex-1 flex flex-col items-center lg:justify-center bg-zinc-950/50 border border-zinc-800 rounded-xl relative p-4 lg:sticky lg:top-0 lg:h-[calc(100vh-8rem)]">
                <div className="w-full pb-4 flex flex-col items-center justify-center">

                    {/* Hidden Source Elements */}
                    <canvas ref={canvasRef} className="hidden" />
                    <video
                        ref={videoRef}
                        src={videoUrl || undefined}
                        className="hidden"
                        playsInline
                        loop
                        muted={false} // Ensure audio is allowed
                        crossOrigin="anonymous"
                    />

                    {/* VISUAL PREVIEW: UNIFIED CANVAS */}
                    {
                        videoUrl ? (
                            <div
                                className="relative rounded-xl overflow-hidden shadow-2xl border border-zinc-800 group cursor-move select-none shrink-0 w-[85%] sm:w-[360px] aspect-[9/16] touch-none"
                                onMouseDown={(e) => {
                                    setIsDragging(true);
                                    setDragStart({ x: e.clientX - videoPosition.x, y: e.clientY - videoPosition.y });
                                }}
                                onMouseMove={(e) => {
                                    if (isDragging) {
                                        setVideoPosition(prev => ({
                                            ...prev,
                                            x: e.clientX - dragStart.x,
                                            y: e.clientY - dragStart.y
                                        }));
                                    }
                                }}
                                onMouseUp={() => setIsDragging(false)}
                                onMouseLeave={() => setIsDragging(false)}
                                onWheel={(e) => {
                                    // Desktop scroll-to-zoom
                                    e.preventDefault();
                                    setVideoPosition(prev => {
                                        const zoomAmount = e.deltaY * -0.005;
                                        return { ...prev, scale: Math.max(0.1, Math.min(prev.scale + zoomAmount, 10)) };
                                    });
                                }}
                                onTouchStart={(e) => {
                                    if (e.touches.length === 2) {
                                        const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
                                        setTouchDistance(dist);
                                    } else {
                                        const touch = e.touches[0];
                                        setIsDragging(true);
                                        setDragStart({ x: touch.clientX - videoPosition.x, y: touch.clientY - videoPosition.y });
                                    }
                                }}
                                onTouchMove={(e) => {
                                    if (e.touches.length === 2 && touchDistance !== null) {
                                        const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
                                        setVideoPosition(prev => {
                                            const scaleChange = (dist - touchDistance) * 0.01;
                                            return { ...prev, scale: Math.max(0.1, Math.min(prev.scale + scaleChange, 10)) };
                                        });
                                        setTouchDistance(dist);
                                    } else if (isDragging) {
                                        const touch = e.touches[0];
                                        setVideoPosition(prev => ({
                                            ...prev,
                                            x: touch.clientX - dragStart.x,
                                            y: touch.clientY - dragStart.y
                                        }));
                                    }
                                }}
                                onTouchEnd={() => {
                                    setIsDragging(false);
                                    setTouchDistance(null);
                                }}
                            >
                                <canvas
                                    ref={previewCanvasRef}
                                    className="w-full h-full block"
                                    width={360}
                                    height={640}
                                />

                                {/* Controls Overlay */}
                                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-20">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (videoRef.current?.paused) {
                                                videoRef.current.play();
                                                setIsPlaying(true);
                                            } else {
                                                videoRef.current?.pause();
                                                setIsPlaying(false);
                                            }
                                        }}
                                        className="bg-white/20 hover:bg-white/30 backdrop-blur-md p-3 rounded-full text-white"
                                    >
                                        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                                    </button>
                                </div>

                                {/* Rendering Overlay */}
                                {isRendering && (
                                    <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center z-50 text-white backdrop-blur-md p-6 text-center">
                                        {exportedBlob ? (
                                            <div className="w-full max-w-[280px] flex flex-col items-center gap-6 animate-in zoom-in-95 duration-500">
                                                <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)] mb-2">
                                                    <svg className="w-10 h-10 text-zinc-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                                <h3 className="text-2xl font-bold text-white tracking-tight">Pronto!</h3>

                                                <button
                                                    onClick={handleDownload}
                                                    className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-zinc-950 rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Download className="w-5 h-5" />
                                                    Salvar Reel / Compartilhar
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        setExportedBlob(null);
                                                        setIsRendering(false);
                                                    }}
                                                    className="text-zinc-400 hover:text-white transition-colors font-medium underline underline-offset-4 mt-2"
                                                >
                                                    Fechar
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="w-full max-w-[240px] mb-6">
                                                <div className="flex justify-between items-end mb-2">
                                                    <span className="text-sm font-bold text-sky-400">Renderizando</span>
                                                    <span className="text-xs font-mono text-zinc-400">
                                                        {Math.min(100, Math.max(0, (renderStats.time / (renderStats.duration || 1)) * 100)).toFixed(0)}%
                                                    </span>
                                                </div>
                                                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-sky-500 to-sky-400 transition-all duration-300 ease-out rounded-full"
                                                        style={{ width: `${Math.min(100, Math.max(0, (renderStats.time / (renderStats.duration || 1)) * 100))}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="w-[85%] sm:w-full max-w-[360px] aspect-[9/16] bg-black rounded-xl flex flex-col items-center justify-center text-zinc-600 border border-zinc-800">
                                <Clapperboard className="w-16 h-16 mb-4 opacity-50" />
                                <p className="text-center px-4">Faça upload de um vídeo para começar</p>
                            </div>
                        )
                    }

                    {/* Resize Hint - Only show when editing, not rendering */}
                    {videoUrl && !isRendering && (
                        <div className="mt-4 px-4 text-center max-w-[320px]">
                            <p className="text-xs text-zinc-400 bg-zinc-900/50 p-2 rounded-lg border border-zinc-800/50">
                                💡 <span className="text-sky-400 font-medium">Dica:</span> Arraste o vídeo com o dedo para reposicionar ou use <span className="text-zinc-300">dois dedos para dar zoom</span> (movimento de pinça).
                            </p>
                        </div>
                    )}

                    <div className="mt-6 w-full max-w-[400px]">
                        {/* Resolution Selector */}
                        <div className="bg-zinc-900/50 p-1 rounded-lg flex mb-4 border border-zinc-800">
                            {(['720p', '1080p'] as const).map((res) => (
                                <button
                                    key={res}
                                    onClick={() => setResolution(res)}
                                    className={cn(
                                        "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                                        resolution === res
                                            ? "bg-zinc-800 text-white shadow-sm border border-zinc-700"
                                            : "text-zinc-500 hover:text-zinc-300"
                                    )}
                                >
                                    <span className="mr-1">{res === '1080p' ? 'Full HD' : 'HD'}</span>
                                    {res}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={renderVideo}
                            disabled={!selectedHeadline || isRendering || !videoUrl || exportedBlob !== null}
                            className="w-full py-4 bg-gradient-to-r from-sky-400 to-sky-400 hover:from-sky-300 hover:to-sky-300 text-zinc-950 rounded-xl font-bold shadow-lg shadow-sky-400/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Play className="w-5 h-5" />
                            Gerar Reel
                        </button>

                        <p className="text-center text-xs text-zinc-500 mt-2">
                            Exportação em {resolution} • 60fps • 12Mbps • AAC
                        </p>
                    </div>
                </div>
            </div>
        </div >
    );
}
