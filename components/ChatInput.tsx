
import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Image as ImageIcon, Video, Paperclip, X, BookOpen, Calculator, Volume2, Box, Map, Palette, Gamepad2, Wifi } from 'lucide-react';
import { Theme } from '../types';
import ImageEditor from './ImageEditor';
import { DrawingBoard } from './DrawingBoard';

export type InputMode = 'chat' | 'image' | 'video' | 'story' | 'math' | 'audio' | '3d' | 'map' | 'draw' | 'game' | 'hack';

interface ChatInputProps {
  onSend: (text: string, mode: InputMode, attachment?: string) => void;
  disabled: boolean;
  theme?: Theme;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled, theme = 'midnight' }) => {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<InputMode>('chat');
  const [attachment, setAttachment] = useState<string | null>(null);
  const [editingImage, setEditingImage] = useState<string | null>(null); 
  const [showDrawingBoard, setShowDrawingBoard] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!text.trim() && !attachment && mode !== 'hack') || disabled) return;
    const promptToSend = text.trim();
    onSend(promptToSend, mode, attachment || undefined);
    setText('');
    setAttachment(null);
    if (mode !== 'hack') setMode('chat'); // Keep hack mode active or reset? Let's reset to chat usually.
    else setMode('chat');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setEditingImage(result);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleEditorSave = (dataUrl: string) => {
    const base64 = dataUrl.split(',')[1];
    setAttachment(base64);
    setEditingImage(null);
  };

  const handleDrawingSave = (dataUrl: string) => {
    const base64 = dataUrl.split(',')[1];
    setAttachment(base64);
    setShowDrawingBoard(false);
  };

  const getContainerStyles = () => {
    if (mode === 'image') return 'shadow-[0_0_15px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/20 border-purple-500/50';
    if (mode === '3d') return 'shadow-[0_0_15px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/20 border-indigo-500/50';
    if (mode === 'map') return 'shadow-[0_0_15px_rgba(34,197,94,0.15)] ring-1 ring-green-500/20 border-green-500/50';
    if (mode === 'video') return 'shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/20 border-cyan-500/50';
    if (mode === 'story') return 'shadow-[0_0_15px_rgba(244,63,94,0.15)] ring-1 ring-rose-500/20 border-rose-500/50';
    if (mode === 'math') return 'shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20 border-emerald-500/50';
    if (mode === 'audio') return 'shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/20 border-amber-500/50';
    if (mode === 'draw') return 'shadow-[0_0_15px_rgba(236,72,153,0.15)] ring-1 ring-pink-500/20 border-pink-500/50';
    if (mode === 'game') return 'shadow-[0_0_15px_rgba(139,92,246,0.15)] ring-1 ring-violet-500/20 border-violet-500/50';
    if (mode === 'hack') return 'shadow-[0_0_15px_rgba(34,197,94,0.15)] ring-1 ring-green-500/20 border-green-500/50 bg-black/80';

    switch(theme) {
      case 'obsidian': return 'bg-gray-900 border-gray-700 focus-within:border-gray-500 shadow-xl';
      case 'dune': case 'desert': return 'bg-[#2a1b15]/90 border-orange-900/50 focus-within:border-orange-700 shadow-xl';
      case 'forest': return 'bg-[#0a1f15]/90 border-emerald-900/50 focus-within:border-emerald-700 shadow-xl';
      case 'ocean': return 'bg-[#0e172a]/90 border-cyan-900/50 focus-within:border-cyan-700 shadow-xl';
      default: return 'bg-[#1A1F2E]/80 border-gray-700/50 focus-within:border-amber-500/30 shadow-2xl';
    }
  };

  const getSendButtonStyles = () => {
    if (mode === 'hack') return 'bg-green-600 text-white animate-pulse';
    if ((!text.trim() && !attachment) || disabled) return 'bg-gray-800 text-gray-600 cursor-not-allowed';
    
    if (mode === 'image') return 'bg-gradient-to-br from-purple-600 to-pink-600 text-white';
    if (mode === '3d') return 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white';
    if (mode === 'map') return 'bg-gradient-to-br from-green-600 to-emerald-600 text-white';
    if (mode === 'video') return 'bg-gradient-to-br from-cyan-600 to-blue-600 text-white';
    if (mode === 'story') return 'bg-gradient-to-br from-rose-600 to-orange-600 text-white';
    if (mode === 'math') return 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white';
    if (mode === 'audio') return 'bg-gradient-to-br from-amber-500 to-orange-600 text-white';
    if (mode === 'draw') return 'bg-gradient-to-br from-pink-500 to-rose-600 text-white';
    if (mode === 'game') return 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white';

    switch(theme) {
      case 'obsidian': return 'bg-gray-200 text-black hover:bg-white';
      case 'dune': case 'desert': return 'bg-gradient-to-br from-orange-600 to-red-700 text-white';
      case 'forest': return 'bg-gradient-to-br from-emerald-600 to-green-700 text-white';
      case 'ocean': return 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white';
      default: return 'bg-gradient-to-br from-amber-500 to-orange-600 text-white';
    }
  };

  const activeTabClass = (isActive: boolean) => {
    if (!isActive) return 'text-gray-500 hover:text-gray-300';
    
    if (mode === 'image') return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
    if (mode === '3d') return 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30';
    if (mode === 'map') return 'bg-green-500/20 text-green-400 border border-green-500/30';
    if (mode === 'video') return 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30';
    if (mode === 'story') return 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
    if (mode === 'math') return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    if (mode === 'audio') return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
    if (mode === 'draw') return 'bg-pink-500/20 text-pink-400 border border-pink-500/30';
    if (mode === 'game') return 'bg-violet-500/20 text-violet-400 border border-violet-500/30';
    if (mode === 'hack') return 'bg-green-500/20 text-green-400 border border-green-500/30';

    switch(theme) {
      case 'dune': case 'desert': return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
      case 'obsidian': return 'bg-gray-700 text-gray-200 border border-gray-600';
      case 'forest': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      case 'ocean': return 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30';
      default: return 'bg-amber-500/20 text-amber-500 border border-amber-500/30';
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-6">
      
      {editingImage && (
        <ImageEditor 
          imageSrc={editingImage} 
          onSave={handleEditorSave} 
          onCancel={() => setEditingImage(null)} 
        />
      )}

      {showDrawingBoard && (
        <DrawingBoard 
          onSave={handleDrawingSave}
          onCancel={() => setShowDrawingBoard(false)}
        />
      )}

      {/* Mode Selection Tabs */}
      <div className="flex justify-center gap-2 mb-2 overflow-x-auto no-scrollbar py-1">
        <button onClick={() => setMode('chat')} className={`px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider transition-all whitespace-nowrap ${activeTabClass(mode === 'chat')}`}>Chat</button>
        <button onClick={() => setMode('hack')} className={`px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1 ${activeTabClass(mode === 'hack')}`}><Wifi size={10} /> WiFi</button>
        <button onClick={() => setMode('game')} className={`px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1 ${activeTabClass(mode === 'game')}`}><Gamepad2 size={10} /> Game</button>
        <button onClick={() => setMode('draw')} className={`px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1 ${activeTabClass(mode === 'draw')}`}><Palette size={10} /> Draw</button>
        <button onClick={() => setMode('map')} className={`px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1 ${activeTabClass(mode === 'map')}`}><Map size={10} /> Map</button>
        <button onClick={() => setMode('3d')} className={`px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1 ${activeTabClass(mode === '3d')}`}><Box size={10} /> 3D</button>
        <button onClick={() => setMode('image')} className={`px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider transition-all whitespace-nowrap ${activeTabClass(mode === 'image')}`}>Image</button>
        <button onClick={() => setMode('video')} className={`px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider transition-all whitespace-nowrap ${activeTabClass(mode === 'video')}`}>Video</button>
        <button onClick={() => setMode('audio')} className={`px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1 ${activeTabClass(mode === 'audio')}`}><Volume2 size={10} /> Speaker</button>
        <button onClick={() => setMode('math')} className={`px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1 ${activeTabClass(mode === 'math')}`}><Calculator size={10} /> Math</button>
        <button onClick={() => setMode('story')} className={`px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider transition-all whitespace-nowrap ${activeTabClass(mode === 'story')}`}>Story</button>
      </div>

      <div className={`relative flex flex-col gap-2 backdrop-blur-xl border rounded-[1.5rem] p-2 transition-all duration-300 ${getContainerStyles()}`}>
        
        {attachment && (
          <div className="mx-2 mt-2 p-2 bg-gray-800/50 rounded-lg flex items-center justify-between border border-gray-700 animate-in slide-in-from-bottom-2">
             <div className="flex items-center gap-2">
               <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center overflow-hidden">
                 <img src={`data:image/png;base64,${attachment}`} alt="Upload" className="w-full h-full object-cover" />
               </div>
               <span className="text-xs text-gray-300">
                   {mode === 'draw' ? 'Sketch attached' : 'Image attached'}
               </span>
             </div>
             <button onClick={() => setAttachment(null)} className="p-1 hover:bg-gray-700 rounded-full text-gray-400">
               <X size={14} />
             </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* File Upload Button (Hidden for Draw/Game/Hack mode) */}
          {(mode === 'video' || mode === 'math' || mode === 'image' || mode === '3d' || mode === 'draw') && (
             <div className="mb-1.5 ml-1.5">
               <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
               <button
                 onClick={() => fileInputRef.current?.click()}
                 className={`p-2.5 rounded-full transition-all duration-300 flex items-center justify-center ${
                    attachment
                    ? (mode === 'math' ? 'bg-emerald-500/20 text-emerald-400' : mode === 'image' ? 'bg-purple-500/20 text-purple-400' : mode === '3d' ? 'bg-indigo-500/20 text-indigo-400' : mode === 'draw' ? 'bg-pink-500/20 text-pink-400' : 'bg-cyan-500/20 text-cyan-400')
                    : 'text-gray-400 hover:bg-white/10'
                 }`}
                 title="Upload image"
               >
                 <Paperclip size={20} />
               </button>
            </div>
          )}

          {/* Draw Button */}
          {mode === 'draw' && (
            <div className="mb-1.5 ml-1.5">
              <button
                onClick={() => setShowDrawingBoard(true)}
                className={`p-2.5 rounded-full transition-all duration-300 flex items-center justify-center ${
                   attachment 
                   ? 'bg-pink-500/20 text-pink-400' 
                   : 'text-pink-400 bg-pink-500/10 hover:bg-pink-500/20'
                }`}
                title="Open Drawing Board"
              >
                <Palette size={20} />
              </button>
            </div>
          )}

          {mode !== 'video' && mode !== 'math' && mode !== 'image' && mode !== '3d' && mode !== 'draw' && (
            <div className="mb-1.5 ml-1.5 p-2.5 text-gray-500">
               {mode === 'story' ? <BookOpen size={20} className="text-rose-500" /> :
                mode === 'audio' ? <Volume2 size={20} className="text-amber-500" /> :
                mode === 'map' ? <Map size={20} className="text-green-500" /> :
                mode === 'game' ? <Gamepad2 size={20} className="text-violet-500" /> :
                mode === 'hack' ? <Wifi size={20} className="text-green-500 animate-pulse" /> :
                <Send size={20} className="opacity-0" />} 
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={
                mode === 'image' ? "Describe an image (or upload to edit)..." : 
                mode === '3d' ? "Describe 3D object to render..." :
                mode === 'map' ? "Enter location or asking for directions..." :
                mode === 'video' ? "Describe video..." : 
                mode === 'story' ? "What story shall I tell?" : 
                mode === 'math' ? "Enter math problem or upload photo..." : 
                mode === 'audio' ? "What should I say?" :
                mode === 'draw' ? "Describe what to generate from your sketch..." :
                mode === 'game' ? "Play Chess, Riddles, or 20 Questions..." :
                mode === 'hack' ? "Initialize WiFi Scan..." :
                "Ask Baba..."
            }
            className={`w-full bg-transparent placeholder-white/30 px-2 py-4 max-h-[150px] min-h-[56px] resize-none focus:outline-none text-[16px] leading-relaxed disabled:opacity-50 text-white ${mode === 'hack' ? 'font-mono text-green-500' : ''}`}
            rows={1}
          />

          <button
            onClick={() => handleSubmit()}
            disabled={(!text.trim() && !attachment && mode !== 'hack') || disabled}
            className={`mb-1.5 mr-1.5 p-3.5 rounded-full flex items-center justify-center transition-all duration-300 transform ${getSendButtonStyles()}`}
          >
            {disabled ? <Sparkles className="animate-spin" size={20} /> : (mode === 'image' || mode === 'draw' ? <Sparkles size={20} /> : mode === 'map' ? <Map size={20} /> : mode === '3d' ? <Box size={20} /> : mode === 'video' ? <Video size={20} /> : mode === 'story' ? <BookOpen size={20} /> : mode === 'math' ? <Calculator size={20} /> : mode === 'audio' ? <Volume2 size={20} /> : mode === 'game' ? <Gamepad2 size={20} /> : mode === 'hack' ? <Wifi size={20} /> : <Send size={20} />)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
