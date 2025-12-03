
import React, { useState, useEffect, useRef } from 'react';
import { geminiService } from './services/geminiService';
import MessageBubble from './components/MessageBubble';
import ChatInput, { InputMode } from './components/ChatInput';
import LoginScreen from './components/LoginScreen';
import SettingsModal from './components/SettingsModal';
import { HackerTerminal } from './components/HackerTerminal';
import { Message, VideoResolution, Theme } from './types';
import { MessageSquare, Info, Trash2, LogOut, Download, Mountain, AlertTriangle, Share2, Smartphone, CheckCircle, X, Link as LinkIcon, Settings2, Sparkles, CloudLightning, Wind, Feather, Play, Loader2 } from 'lucide-react';
import { playPCM } from './utils/audioUtils';

const VOICES = [
  { id: 'Charon', name: 'Deep Wisdom', desc: 'Authoritative & Warm (Default)', icon: <Mountain size={14} /> },
  { id: 'Fenrir', name: 'Mountain Thunder', desc: 'Intense & Low', icon: <CloudLightning size={14} /> },
  { id: 'Puck', name: 'Storyteller Wit', desc: 'Lighter & Playful', icon: <Sparkles size={14} /> },
  { id: 'Kore', name: 'Calm Narrator', desc: 'Soft & Gentle', icon: <Wind size={14} /> },
  { id: 'Zephyr', name: 'Kind Spirit', desc: 'Warm & Soothing', icon: <Feather size={14} /> },
];

const App: React.FC = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showAbout, setShowAbout] = useState(false);
  
  // Settings & Theme - Lazy initialization ensures preferences are applied immediately on first render
  const [showSettings, setShowSettings] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(() => localStorage.getItem('baba_baloch_voice') || 'Charon');
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => (localStorage.getItem('baba_baloch_theme') as Theme) || 'midnight');
  const [videoResolution, setVideoResolution] = useState<VideoResolution>(() => (localStorage.getItem('baba_baloch_video_res') as VideoResolution) || '720p');
  
  // Install / Modal State
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  // Initialize banner based on user preference (localStorage)
  const [showApkBanner, setShowApkBanner] = useState(() => {
    return !localStorage.getItem('baba_baloch_dismiss_apk_banner');
  });
  
  // Download Simulation States
  const [isPlayStoreDownloading, setIsPlayStoreDownloading] = useState(false);
  const [playStoreStatus, setPlayStoreStatus] = useState<'idle' | 'connecting' | 'downloading' | 'installed'>('idle');
  const [isApkDownloading, setIsApkDownloading] = useState(false);

  // Hacker Terminal State
  const [showHackerTerminal, setShowHackerTerminal] = useState(false);

  // Check for existing session and install prompt
  useEffect(() => {
    const savedName = localStorage.getItem('baba_baloch_user');
    if (savedName) {
      initializeSession(savedName);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Save chat history
  useEffect(() => {
    if (username && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (!lastMsg.isStreaming) {
        try {
          const key = `baba_baloch_history_${username}`;
          localStorage.setItem(key, JSON.stringify(messages));
        } catch (error) {
          // Fallback save logic omitted for brevity, handled similarly to prev
          try {
             const textOnlyMessages = messages.map(m => {
               const { image, video, audio, ...rest } = m;
               return { ...rest, image: m.role === 'user' ? image : undefined };
             });
             localStorage.setItem(`baba_baloch_history_${username}`, JSON.stringify(textOnlyMessages));
          } catch (e) {}
        }
      }
    }
  }, [messages, username]);

  const initializeSession = (name: string) => {
    setUsername(name);
    
    // Load history
    const historyKey = `baba_baloch_history_${name}`;
    let loadedMessages: Message[] = [];
    try {
        const saved = localStorage.getItem(historyKey);
        if (saved) {
            loadedMessages = JSON.parse(saved);
        }
    } catch (e) {
        console.error("Failed to load history", e);
    }

    geminiService.initChat('gemini-2.5-flash', name, loadedMessages);
    
    if (loadedMessages.length > 0) {
      setMessages(loadedMessages);
    } else {
      const greeting: Message = {
        id: 'init-1',
        role: 'model',
        text: `Wash aatey (Welcome), **${name}**! I am **Baba Baloch**.\n\nI speak the language of the mountains and the city. You may speak to me in English, Urdu, Balochi, or any tongue you prefer.\n\nAsk for a story, show me a picture to animate ("Tasveer se video"), or seek advice. I am listening.`,
        timestamp: Date.now(),
      };
      setMessages([greeting]);
    }
  };

  const handleLogin = (name: string) => {
    localStorage.setItem('baba_baloch_user', name);
    initializeSession(name);
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to leave the Diwan?")) {
      localStorage.removeItem('baba_baloch_user');
      setUsername(null);
      setMessages([]);
      setShowSettings(false);
    }
  };

  const handleDeleteApp = () => {
    if (window.confirm("WARNING (DELETE APP): This will delete all your chats, your name, and reset the app completely.\n\nAre you sure you want to 'Devolute' (Reset)?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleVoiceChange = (voiceId: string) => {
    setSelectedVoice(voiceId);
    localStorage.setItem('baba_baloch_voice', voiceId);
  };

  const handleThemeChange = (theme: Theme) => {
    setCurrentTheme(theme);
    localStorage.setItem('baba_baloch_theme', theme);
  };
  
  const handleVideoResolutionChange = (res: VideoResolution) => {
    setVideoResolution(res);
    localStorage.setItem('baba_baloch_video_res', res);
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      runSimulatedInstall();
    }
  };

  const runSimulatedInstall = () => {
    setShowInstallModal(true);
    setInstallProgress(0);
    setPlayStoreStatus('idle');
    setIsPlayStoreDownloading(false);
    setIsApkDownloading(false);
    
    // Simulate install progress
    const interval = setInterval(() => {
      setInstallProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setShowInstallModal(false), 1500);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  const handleDownloadAPK = (source: 'direct' | 'playstore' = 'direct') => {
    try {
      const apkSize = 1024 * 1024 * 30; // 30MB dummy APK
      const apkContent = new Uint8Array(apkSize);
      const blob = new Blob([apkContent], { type: 'application/vnd.android.package-archive' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `babaBaloch.com_App_v1.1.0_${source}.apk`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return true;
    } catch (e) {
      alert("Download failed. Please check your connection.");
      return false;
    }
  };

  const handleDismissBanner = () => {
    setShowApkBanner(false);
    localStorage.setItem('baba_baloch_dismiss_apk_banner', 'true');
  };

  const handlePlayStoreClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isPlayStoreDownloading || playStoreStatus === 'installed') return;

    setIsPlayStoreDownloading(true);
    setPlayStoreStatus('connecting');

    setTimeout(() => {
        setPlayStoreStatus('downloading');
        setTimeout(() => {
            const success = handleDownloadAPK('playstore');
            setPlayStoreStatus(success ? 'installed' : 'idle');
            setIsPlayStoreDownloading(false);
        }, 1500);
    }, 1500);
  };

  const handleDirectDownloadClick = () => {
    if (isApkDownloading) return;
    setIsApkDownloading(true);
    setTimeout(() => {
        handleDownloadAPK('direct');
        setIsApkDownloading(false);
    }, 800);
  };

  const handleShareLink = async () => {
    const shareUrl = window.location.href;
    const shareData = {
      title: 'babaBaloch.com',
      text: 'Chat with Baba Baloch, a wise and friendly AI companion.',
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return; 
      } catch (err) {}
    }

    try {
        await navigator.clipboard.writeText(shareUrl);
        alert("Link Copied!");
    } catch (err) {
        prompt("Copy link:", shareUrl);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleGenerate3DMap = (locationName: string) => {
    handleSendMessage(`Isometric 3D map of ${locationName}, highly detailed, game art style`, '3d');
  };

  const handleHackerComplete = (result: string) => {
    setShowHackerTerminal(false);
    
    // Parse result: "Network: XYZ, Password: 'abc'"
    const passwordMatch = result.match(/Password: '([^']+)'/);
    const networkMatch = result.match(/Network: (.*?),/);
    
    const password = passwordMatch ? passwordMatch[1] : result;
    const network = networkMatch ? networkMatch[1] : "Unknown Network";
    
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: `Hack WiFi: ${network}`,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);

    const prompt = `[HACK SIMULATION COMPLETE]
    The user ran the 'WiFi Hacker Prank' tool on network "${network}".
    The simulated tool returned this funny password result: "${password}".
    
    Respond as Baba Baloch. 
    1. Acknowledge the "hack" of "${network}" with humor (e.g., "Ah, the spirits of the internet have spoken!").
    2. Share a wise, sarcastic, or funny comment about this specific password ("${password}").
    3. Remind them gently that stealing WiFi is not the Baloch way (Honor/Ghairat), but borrowing with a smile is okay.
    `;

    handleSendMessage(prompt, 'chat'); // Process as a normal chat response essentially
  };

  const handleSendMessage = async (text: string, mode: InputMode, attachment?: string) => {
    if (mode === 'hack') {
      setShowHackerTerminal(true);
      return;
    }

    // Logic to distinguish between internal system prompts and user text
    // If it starts with [HACK SIMULATION], it's an internal prompt, don't show as user message
    const isInternalSystemPrompt = text.includes("[HACK SIMULATION COMPLETE]");

    if (!isInternalSystemPrompt) {
      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        text: text,
        image: ((mode === 'video' || mode === 'math' || mode === 'image' || mode === '3d' || mode === 'draw') && attachment) ? attachment : undefined, 
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
    }
    
    setIsLoading(true);

    const aiMsgId = (Date.now() + 1).toString();
    const aiMsgPlaceholder: Message = {
      id: aiMsgId,
      role: 'model',
      text: '', 
      timestamp: Date.now(),
      isStreaming: true,
      isStory: mode === 'story'
    };
    setMessages((prev) => [...prev, aiMsgPlaceholder]);

    try {
      if (mode === 'image' || mode === 'draw') {
        const imagePrompt = text.trim() || (mode === 'draw' ? "Turn this sketch into a masterpiece art" : "A creative surprise image");
        // Reuse generateImage for drawing/sketch-to-image
        const imageBase64 = await geminiService.generateImage(imagePrompt, attachment);
        if (imageBase64) {
           setMessages((prev) => prev.map((msg) => msg.id === aiMsgId ? { 
             ...msg, 
             isStreaming: false, 
             image: imageBase64, 
             text: mode === 'draw' ? `AI Art from Sketch: ${text || 'My Masterpiece'}` : (attachment ? `Edited Image: ${text}` : `Generated Image: ${text || 'Surprise'}`)
           } : msg));
        } else { 
            throw new Error("I could not generate an image at this moment."); 
        }
      } else if (mode === '3d') {
        const prompt3D = `High-quality 3D render of ${text}, isometric view, photorealistic, 4k, unreal engine 5, 3d modeling style, white background, cinematic lighting`;
        const imageBase64 = await geminiService.generateImage(prompt3D, attachment);
        if (imageBase64) {
           setMessages((prev) => prev.map((msg) => msg.id === aiMsgId ? { ...msg, isStreaming: false, image: imageBase64, text: `3D Render: ${text}` } : msg));
        } else { throw new Error("No 3D data"); }
      } else if (mode === 'map') {
        const { text: responseText, mapData } = await geminiService.generateMapContent(text);
        setMessages((prev) => prev.map((msg) => msg.id === aiMsgId ? { ...msg, isStreaming: false, text: responseText, mapData: mapData } : msg));
      } else if (mode === 'video') {
         const videoUri = await geminiService.generateVideo(text, videoResolution, attachment);
         if (videoUri) {
            setMessages((prev) => prev.map((msg) => msg.id === aiMsgId ? { ...msg, isStreaming: false, video: videoUri, text: `Video generated (${videoResolution}).` } : msg));
         } else { throw new Error("No video data"); }
      } else if (mode === 'story') {
        const storyPrompt = `[STORYTELLER MODE] Tell a story about: "${text}".`;
        const imagePrompt = `Illustration: ${text}, balochistan folklore style`;
        const textStreamPromise = (async () => {
          let fullText = '';
          const stream = geminiService.sendMessageStream(storyPrompt);
          for await (const chunk of stream) {
            fullText += chunk;
            setMessages((prev) => prev.map((msg) => msg.id === aiMsgId ? { ...msg, text: fullText } : msg));
          }
        })();
        geminiService.generateImage(imagePrompt).then((imageBase64) => {
           if (imageBase64) setMessages((prev) => prev.map((msg) => msg.id === aiMsgId ? { ...msg, image: imageBase64 } : msg));
        });
        await textStreamPromise;
        setMessages((prev) => prev.map((msg) => msg.id === aiMsgId ? { ...msg, isStreaming: false } : msg));
      } else if (mode === 'math') {
        let fullText = '';
        const stream = geminiService.streamMathSolution(text, attachment);
        for await (const chunk of stream) {
          fullText += chunk;
          setMessages((prev) => prev.map((msg) => msg.id === aiMsgId ? { ...msg, text: fullText } : msg));
        }
        setMessages((prev) => prev.map((msg) => msg.id === aiMsgId ? { ...msg, isStreaming: false } : msg));
      } else if (mode === 'audio') {
        const audioBase64 = await geminiService.generateSpeech(text, selectedVoice);
        if (audioBase64) {
           setMessages((prev) => prev.map((msg) => msg.id === aiMsgId ? { 
             ...msg, 
             isStreaming: false, 
             audio: audioBase64,
             isAudio: true,
             text: `Speaker Generated: "${text}"`
           } : msg));
        } else {
           throw new Error("Audio generation failed");
        }
      } else if (mode === 'game') {
        // Handle Game Mode with explicit instruction to act as a Game Master
        const gamePrompt = `[GAME SESSION START] The user wants to play: "${text}".
        \n**Your Role:** You are Baba Baloch, acting as a wise and fun Game Master.
        \n**Instructions:**
        \n1. If playing Chess/Tic-Tac-Toe/Board Games: Render the current state using ASCII art or Emojis clearly.
        \n2. If playing Riddles: Ask one hard riddle at a time.
        \n3. If playing 20 Questions: Answer Yes/No/Maybe in character.
        \n4. If playing a Text Adventure: Describe the scene vividly and offer choices.
        \n5. Always maintain your persona (wise elder).
        \n6. Keep it interactive.`;

        let fullText = '';
        const stream = geminiService.sendMessageStream(gamePrompt);
        for await (const chunk of stream) {
          fullText += chunk;
          setMessages((prev) => prev.map((msg) => msg.id === aiMsgId ? { ...msg, text: fullText } : msg));
        }
        setMessages((prev) => prev.map((msg) => msg.id === aiMsgId ? { ...msg, isStreaming: false } : msg));
      } else {
        let fullText = '';
        const stream = geminiService.sendMessageStream(text);
        for await (const chunk of stream) {
          fullText += chunk;
          setMessages((prev) => prev.map((msg) => msg.id === aiMsgId ? { ...msg, text: fullText } : msg));
        }
        setMessages((prev) => prev.map((msg) => msg.id === aiMsgId ? { ...msg, isStreaming: false } : msg));
      }
    } catch (error) {
      setMessages((prev) => prev.map((msg) => msg.id === aiMsgId ? { ...msg, isStreaming: false, isError: true, text: "My connection is weak. Please try again." } : msg));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayAudio = async (messageId: string, text: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return null;
    const message = messages[messageIndex];
    let audioData = message.audio;

    if (!audioData) {
      try {
        const result = await geminiService.generateSpeech(text, selectedVoice);
        if (result) {
          audioData = result;
          setMessages(prev => prev.map(m => m.id === messageId ? { ...m, audio: result } : m));
        }
      } catch (err) { return null; }
    }
    return audioData ? playPCM(audioData) : null;
  };

  const handleClearChat = () => {
    if (window.confirm("Start a new conversation?")) {
      const greeting: Message = { id: Date.now().toString(), role: 'model', text: `Wash aatey, **${username}**! Let us start fresh.`, timestamp: Date.now() };
      setMessages([greeting]);
      geminiService.initChat('gemini-2.5-flash', username || undefined);
    }
  };

  const getThemeClasses = () => {
    switch(currentTheme) {
      case 'obsidian': return 'bg-black text-gray-200';
      case 'dune': return 'bg-[#1a0f0a] text-[#e8dcc8]';
      case 'forest': return 'bg-[#05110b] text-emerald-50';
      case 'desert': return 'bg-[#1a0f0a] text-orange-50';
      case 'ocean': return 'bg-[#0b1221] text-cyan-50';
      case 'midnight': default: return 'bg-[#0B1120] text-gray-100';
    }
  };

  if (!username) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className={`flex flex-col h-full relative overflow-hidden transition-colors duration-500 ${getThemeClasses()}`}>
      
      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <h1 className="text-[10vw] font-extrabold text-current opacity-[0.03] -rotate-12 whitespace-nowrap select-none tracking-tighter">
          babaBaloch.com
        </h1>
      </div>
      
      {/* Background Texture */}
      <div className="absolute inset-0 opacity-5 pointer-events-none z-0" 
           style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      </div>

      {/* Header */}
      <header className={`flex-none h-18 backdrop-blur-md border-b flex items-center justify-between px-4 md:px-8 z-20 shadow-sm relative transition-colors duration-500 ${
        currentTheme === 'obsidian' ? 'bg-black/80 border-gray-800' :
        currentTheme === 'dune' ? 'bg-[#1a0f0a]/80 border-orange-900/30' :
        currentTheme === 'forest' ? 'bg-[#05110b]/80 border-emerald-900/30' :
        currentTheme === 'desert' ? 'bg-[#1a0f0a]/80 border-orange-900/30' :
        currentTheme === 'ocean' ? 'bg-[#0b1221]/80 border-cyan-900/30' :
        'bg-[#0B1120]/80 border-gray-800/60'
      }`}>
        <div 
          className="flex items-center gap-3 group cursor-pointer select-none"
          onClick={() => window.location.reload()}
          title="Reload App"
        >
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-transform duration-500 ease-out group-hover:rotate-12 group-hover:scale-105 ${
            currentTheme === 'dune' || currentTheme === 'desert' ? 'bg-orange-950/50 border-orange-900/50' :
            currentTheme === 'obsidian' ? 'bg-gray-900 border-gray-800' :
            currentTheme === 'forest' ? 'bg-emerald-950/50 border-emerald-900/50' :
            currentTheme === 'ocean' ? 'bg-cyan-950/50 border-cyan-900/50' :
            'bg-gray-800 border-gray-700'
          }`}>
            <Mountain className={`transition-colors duration-300 ${
              currentTheme === 'dune' || currentTheme === 'desert' ? 'text-orange-500 group-hover:text-orange-400' : 
              currentTheme === 'obsidian' ? 'text-gray-400 group-hover:text-white' : 
              currentTheme === 'forest' ? 'text-emerald-500 group-hover:text-emerald-400' :
              currentTheme === 'ocean' ? 'text-cyan-500 group-hover:text-cyan-400' :
              'text-amber-500 group-hover:text-amber-400'
            }`} size={20} />
          </div>
          <div>
            <h1 className={`text-xl font-bold tracking-tight transition-all duration-300 group-hover:scale-105 origin-left ${
              currentTheme === 'dune' || currentTheme === 'desert' ? 'group-hover:text-orange-400' :
              currentTheme === 'obsidian' ? 'group-hover:text-white' :
              currentTheme === 'forest' ? 'group-hover:text-emerald-400' :
              currentTheme === 'ocean' ? 'group-hover:text-cyan-400' :
              'group-hover:text-amber-500'
            }`}>
              babaBaloch.com
            </h1>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${
                  currentTheme === 'dune' || currentTheme === 'desert' ? 'bg-orange-500' : 
                  currentTheme === 'obsidian' ? 'bg-white' : 
                  currentTheme === 'forest' ? 'bg-emerald-500' : 
                  currentTheme === 'ocean' ? 'bg-cyan-500' : 
                  'bg-emerald-500'
              } animate-pulse`}></span>
              <span className={`text-[10px] font-medium uppercase tracking-widest ${
                  currentTheme === 'dune' || currentTheme === 'desert' ? 'text-orange-500/80' : 
                  currentTheme === 'obsidian' ? 'text-gray-400' : 
                  currentTheme === 'forest' ? 'text-emerald-500/80' : 
                  currentTheme === 'ocean' ? 'text-cyan-500/80' : 
                  'text-emerald-500/80'
              }`}>Online</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Responsive Download APK Button */}
          <button
             onClick={handleDirectDownloadClick}
             className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl font-bold text-sm shadow-lg transition-all transform hover:scale-105 ${
               currentTheme === 'dune' || currentTheme === 'desert'
                 ? 'bg-gradient-to-r from-orange-600 to-red-700 text-white shadow-orange-900/20' 
                 : currentTheme === 'obsidian'
                 ? 'bg-white text-black hover:bg-gray-200 shadow-white/10'
                 : currentTheme === 'forest'
                 ? 'bg-gradient-to-r from-emerald-600 to-green-700 text-white shadow-emerald-900/20'
                 : currentTheme === 'ocean'
                 ? 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-cyan-900/20'
                 : 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-blue-900/20'
             }`}
          >
             {isApkDownloading ? <Loader2 size={18} className="animate-spin" /> : <Smartphone size={18} />}
             <span className="hidden sm:inline">Download APK</span>
             <span className="inline sm:hidden">APK</span>
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className={`p-2.5 rounded-xl transition-all duration-300 ${
              currentTheme === 'dune' || currentTheme === 'desert' ? 'bg-orange-950/30 hover:bg-orange-900/50 text-orange-400 border border-orange-900/30' :
              currentTheme === 'obsidian' ? 'bg-gray-900 hover:bg-gray-800 text-gray-400 border border-gray-800' :
              currentTheme === 'forest' ? 'bg-emerald-950/30 hover:bg-emerald-900/50 text-emerald-400 border border-emerald-900/30' :
              currentTheme === 'ocean' ? 'bg-cyan-950/30 hover:bg-cyan-900/50 text-cyan-400 border border-cyan-900/30' :
              'bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white border border-gray-700/50'
            }`}
          >
            <Settings2 size={20} />
          </button>
        </div>
      </header>

      {/* APK Banner */}
      {showApkBanner && (
        <div className="flex-none bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-4 py-2.5 flex items-center justify-between shadow-lg relative z-10 animate-in slide-in-from-top-full duration-500">
           <div className="flex items-center gap-3">
              <div className="bg-white/20 p-1.5 rounded-lg hidden sm:block">
                 <Smartphone size={16} />
              </div>
              <p className="text-xs sm:text-sm font-medium">
                 <span className="font-bold opacity-100">Get the full experience!</span> Download the Android App.
              </p>
           </div>
           <div className="flex items-center gap-2">
              <button 
                 onClick={handleDismissBanner}
                 className="text-[10px] sm:text-xs font-medium text-emerald-100 hover:text-white px-2 py-1"
              >
                Use Website
              </button>
              <button 
                 onClick={handleDirectDownloadClick}
                 className="bg-white text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                 <Download size={12} />
                 Download
              </button>
           </div>
        </div>
      )}

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto px-4 md:px-0 py-6 custom-scrollbar scroll-smooth relative z-10">
        <div className="max-w-3xl mx-auto flex flex-col justify-end min-h-full">
          {messages.map((msg) => (
            <MessageBubble 
               key={msg.id} 
               message={msg} 
               theme={currentTheme} 
               onPlayAudio={handlePlayAudio}
               onGenerate3DMap={handleGenerate3DMap}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className={`flex-none p-4 pb-2 md:pb-6 relative z-20 ${
         currentTheme === 'obsidian' ? 'bg-black/90' : 
         currentTheme === 'dune' || currentTheme === 'desert' ? 'bg-[#1a0f0a]/90' : 
         currentTheme === 'forest' ? 'bg-[#05110b]/90' :
         currentTheme === 'ocean' ? 'bg-[#0b1221]/90' :
         'bg-[#0B1120]/90'
      }`}>
         <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-700/50 to-transparent"></div>
        <ChatInput onSend={handleSendMessage} disabled={isLoading} theme={currentTheme} />
        <p className="text-center text-[10px] text-gray-600 mt-2">
          Baba Baloch may make mistakes. Consider checking important information.
        </p>
      </footer>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        voices={VOICES}
        currentVoice={selectedVoice}
        onVoiceChange={handleVoiceChange}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
        videoResolution={videoResolution}
        onVideoResolutionChange={handleVideoResolutionChange}
        onInstall={handleInstallClick}
        onDownloadApk={handleDirectDownloadClick}
        onClearHistory={handleClearChat}
        onDeleteAccount={handleDeleteApp}
        onLogout={handleLogout}
      />
      
      {/* Hacker Terminal Simulation */}
      {showHackerTerminal && (
        <HackerTerminal 
          onComplete={handleHackerComplete}
          onClose={() => setShowHackerTerminal(false)}
        />
      )}

      {/* Simulated Install Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in">
           <div className="bg-[#151925] rounded-3xl p-8 max-w-sm w-full border border-gray-700 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col items-center text-center">
                 <div className="w-20 h-20 rounded-2xl bg-gray-800 flex items-center justify-center mb-6 shadow-xl border border-gray-700">
                    <Mountain size={40} className="text-amber-500" />
                 </div>
                 
                 <h3 className="text-xl font-bold text-white mb-2">Installing App...</h3>
                 <p className="text-sm text-gray-400 mb-8">Adding babaBaloch.com to your device</p>
                 
                 <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden mb-4">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-600 transition-all duration-300 ease-out"
                      style={{ width: `${installProgress}%` }}
                    ></div>
                 </div>
                 
                 <span className="text-xs text-emerald-400 font-medium">
                    {installProgress === 100 ? 'Installation Complete!' : `${installProgress}%`}
                 </span>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
