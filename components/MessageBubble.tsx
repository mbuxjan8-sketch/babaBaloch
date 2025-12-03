
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Mountain, Download, Film, Volume2, Loader2, BookOpen, Image as ImageIcon, FileText, Share2, Play, Pause, Music, Map as MapIcon, Box, ExternalLink } from 'lucide-react';
import { Message, Theme } from '../types';
import { decode, pcmToWav } from '../utils/audioUtils';
import { geminiService } from '../services/geminiService';

interface MessageBubbleProps {
  message: Message;
  theme?: Theme;
  onPlayAudio?: (messageId: string, text: string) => Promise<AudioBufferSourceNode | null>;
  onGenerate3DMap?: (locationName: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, theme = 'midnight', onPlayAudio, onGenerate3DMap }) => {
  const isUser = message.role === 'user';
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const handlePlayClick = async () => {
    if (isPlaying || isLoadingAudio || !onPlayAudio) return;
    setIsLoadingAudio(true);
    try {
      const source = await onPlayAudio(message.id, message.text);
      if (source) {
        setIsPlaying(true);
        setIsLoadingAudio(false);
        source.onended = () => setIsPlaying(false);
      } else {
        setIsLoadingAudio(false);
      }
    } catch (error) {
      console.error("Audio playback error:", error);
      setIsLoadingAudio(false);
      setIsPlaying(false);
    }
  };

  const handleDownload = (type: 'text' | 'image' | 'video' | 'audio') => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const link = document.createElement('a');

    if (type === 'image' && message.image) {
      link.href = `data:image/png;base64,${message.image}`;
      link.download = `baba-baloch-image-${timestamp}.png`;
      link.click();
    } else if (type === 'video' && message.video) {
      link.href = message.video;
      link.download = `baba-baloch-video-${timestamp}.mp4`;
      link.click();
    } else if (type === 'text' && message.text) {
      const blob = new Blob([message.text], { type: 'text/plain' });
      link.href = URL.createObjectURL(blob);
      link.download = `baba-baloch-response-${timestamp}.txt`;
      link.click();
    } else if (type === 'audio' && message.audio) {
      try {
          const rawBytes = decode(message.audio);
          const wavBlob = pcmToWav(rawBytes);
          link.href = URL.createObjectURL(wavBlob);
          link.download = `baba-baloch-speech-${timestamp}.wav`;
          link.click();
      } catch (e) {
          console.error("Audio download failed", e);
      }
    }
  };

  const handleShare = async (type: 'text' | 'image' | 'video' | 'audio') => {
    if (isSharing) return;
    setIsSharing(true);

    try {
      const shareData: ShareData = {
        title: 'babaBaloch.com',
        text: message.text || 'Check this out from Baba Baloch!',
        url: window.location.href
      };

      if (type === 'image' && message.image) {
        try {
          const response = await fetch(`data:image/png;base64,${message.image}`);
          const blob = await response.blob();
          const file = new File([blob], 'baba-baloch-image.png', { type: 'image/png' });

          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ ...shareData, files: [file] });
            setIsSharing(false);
            return;
          }
        } catch (e) { console.warn("File sharing failed", e); }
      } else if (type === 'video' && message.video) {
        try {
          const response = await fetch(message.video);
          const blob = await response.blob();
          const file = new File([blob], 'baba-baloch-video.mp4', { type: 'video/mp4' });

          if (navigator.canShare && navigator.canShare({ files: [file] })) {
             await navigator.share({ ...shareData, files: [file] });
             setIsSharing(false);
             return;
          }
        } catch (e) { console.warn("File sharing failed", e); }
      } else if (type === 'audio' && message.audio) {
          try {
            const rawBytes = decode(message.audio);
            const wavBlob = pcmToWav(rawBytes);
            const file = new File([wavBlob], 'baba-baloch-audio.wav', { type: 'audio/wav' });
             if (navigator.canShare && navigator.canShare({ files: [file] })) {
                 await navigator.share({ ...shareData, files: [file] });
                 setIsSharing(false);
                 return;
             }
          } catch(e) { console.warn("Audio sharing failed", e); }
      }

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text}\n\n${shareData.url}`);
        alert('Copied to clipboard!');
      }

    } catch (error) {
      console.error('Error sharing:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const displayText = message.text + (message.isStreaming && message.text ? ' ▍' : '');
  const isStory = message.isStory && !isUser;
  // If explicitly flagged as audio or just has audio but little text
  const isAudioCard = message.isAudio || (!isUser && !message.isStreaming && message.audio && (!message.text || message.text.startsWith('Generated Speech') || message.text.startsWith('Speaker Generated')));
  
  const hasMapData = message.mapData && message.mapData.length > 0;

  // Theme Helpers
  const getUserBubbleColor = () => {
    switch(theme) {
      case 'obsidian': return 'bg-gray-200 text-black';
      case 'dune': case 'desert': return 'bg-gradient-to-br from-orange-700 to-red-800 text-white';
      case 'forest': return 'bg-gradient-to-br from-emerald-600 to-green-700 text-white';
      case 'ocean': return 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white';
      default: return 'bg-gradient-to-br from-indigo-600 to-violet-700 text-white';
    }
  };

  const getBotBubbleColor = () => {
    if (isStory) return 'bg-[#1e1a20]/95 border-rose-500 text-rose-50';
    if (isAudioCard) return 'bg-[#1c1917]/95 border-amber-500 text-amber-50';
    if (hasMapData) return 'bg-[#0f1d15]/95 border-green-500 text-green-50';
    
    switch(theme) {
      case 'obsidian': return 'bg-gray-800/90 border-gray-500 text-gray-200';
      case 'dune': case 'desert': return 'bg-[#2a1b15]/90 border-orange-500 text-orange-50';
      case 'forest': return 'bg-[#0a1f15]/90 border-emerald-500 text-emerald-50';
      case 'ocean': return 'bg-[#0e172a]/90 border-cyan-500 text-cyan-50';
      default: return 'bg-gray-800/90 border-amber-500 text-gray-200';
    }
  };

  const getBotIconColor = () => {
    if (isStory) return 'bg-rose-900 text-rose-300';
    if (isAudioCard) return 'bg-amber-900 text-amber-300';
    if (hasMapData) return 'bg-green-900 text-green-300';
    switch(theme) {
      case 'obsidian': return 'bg-gray-800 text-gray-300 border-gray-600';
      case 'dune': case 'desert': return 'bg-orange-950 text-orange-400 border-orange-900';
      case 'forest': return 'bg-emerald-950 text-emerald-400 border-emerald-900';
      case 'ocean': return 'bg-cyan-950 text-cyan-400 border-cyan-900';
      default: return 'bg-gray-800 text-amber-500 border-white/5';
    }
  };

  const getAccentTextColor = () => {
    if (isStory) return 'text-rose-400';
    if (isAudioCard) return 'text-amber-400';
    if (hasMapData) return 'text-green-400';
    switch(theme) {
      case 'obsidian': return 'text-gray-400';
      case 'dune': case 'desert': return 'text-orange-400';
      case 'forest': return 'text-emerald-400';
      case 'ocean': return 'text-cyan-400';
      default: return 'text-amber-500';
    }
  };

  return (
    <div className={`flex w-full mb-8 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className={`flex max-w-[90%] md:max-w-[75%] gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        <div className={`flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center shadow-lg border ${
          isUser 
            ? (theme === 'obsidian' ? 'bg-white text-black' 
              : theme === 'dune' || theme === 'desert' ? 'bg-orange-600 text-white' 
              : theme === 'forest' ? 'bg-emerald-600 text-white'
              : theme === 'ocean' ? 'bg-cyan-600 text-white'
              : 'bg-indigo-600 text-white') 
            : getBotIconColor()
        }`}>
          {isUser ? <User size={16} /> : isStory ? <BookOpen size={16} /> : isAudioCard ? <Volume2 size={16} /> : hasMapData ? <MapIcon size={16} /> : <Mountain size={16} />}
        </div>

        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} w-full`}>
          <div className={`relative px-6 py-4 shadow-xl text-[15px] leading-7 overflow-hidden ${
            isUser
              ? `${getUserBubbleColor()} rounded-2xl rounded-tr-sm`
              : `${getBotBubbleColor()} backdrop-blur-sm border-l-4 rounded-r-2xl rounded-bl-2xl rounded-tl-sm w-full min-h-[3.5rem]`
          }`}>
             
             {message.isError ? (
               <span className="text-red-300 block">{message.text}</span>
             ) : (
               <>
                 {isStory && <div className="mb-3 flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-rose-400 opacity-80 border-b border-rose-500/20 pb-2"><BookOpen size={12} /><span>Story from the Diwan</span></div>}
                 
                 {hasMapData && (
                    <div className="mb-3">
                       <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-green-400 opacity-80 border-b border-green-500/20 pb-2 mb-2">
                         <MapIcon size={12} /><span>Location Found</span>
                       </div>
                       <div className="flex flex-col gap-2">
                           {message.mapData?.map((chunk, idx) => (
                             (chunk.web?.uri || chunk.maps?.uri) && (
                               <div key={idx} className="bg-black/20 p-3 rounded-xl border border-white/5 hover:bg-black/30 transition-colors">
                                  <div className="flex items-center justify-between mb-2">
                                     <h4 className="font-bold text-sm text-green-200">{chunk.web?.title || chunk.maps?.title || "View on Map"}</h4>
                                     <a 
                                       href={chunk.web?.uri || chunk.maps?.uri} 
                                       target="_blank" 
                                       rel="noopener noreferrer"
                                       className="p-1.5 bg-green-500/20 hover:bg-green-500/40 text-green-300 rounded-full transition-colors"
                                     >
                                        <ExternalLink size={14} />
                                     </a>
                                  </div>
                                  
                                  {onGenerate3DMap && (
                                    <button
                                      onClick={() => onGenerate3DMap(chunk.web?.title || "map location")}
                                      className="w-full mt-1 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-indigo-500/20"
                                    >
                                      <Box size={12} />
                                      Generate 3D View
                                    </button>
                                  )}
                               </div>
                             )
                           ))}
                       </div>
                    </div>
                 )}

                 {isAudioCard && message.audio && (
                    <div className="mb-2">
                        <div className="flex items-center gap-3 bg-black/30 p-3 rounded-xl border border-white/5 shadow-inner">
                            <button 
                                onClick={handlePlayClick}
                                disabled={isPlaying || isLoadingAudio}
                                className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                                    isPlaying ? 'bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'bg-white/10 hover:bg-white/20 text-amber-500'
                                }`}
                            >
                                {isLoadingAudio ? <Loader2 size={24} className="animate-spin" /> : isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                            </button>
                            <div className="flex-1 flex flex-col justify-center gap-1 overflow-hidden">
                                <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Audio Generated</span>
                                <div className="h-6 flex items-center gap-0.5 opacity-50">
                                   {[...Array(20)].map((_, i) => (
                                      <div key={i} className={`w-1 rounded-full bg-amber-400 ${isPlaying ? 'animate-pulse' : 'h-1.5'}`} style={{ 
                                          height: isPlaying ? `${Math.random() * 16 + 4}px` : '4px',
                                          animationDelay: `${i * 0.05}s`
                                      }}></div>
                                   ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-2">
                             <button 
                                onClick={() => handleDownload('audio')}
                                className="text-xs flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-gray-300"
                             >
                                <Download size={12} /> Save Audio
                             </button>
                             <button 
                                onClick={() => handleShare('audio')}
                                disabled={isSharing}
                                className="text-xs flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-gray-300"
                             >
                                {isSharing ? <Loader2 size={12} className="animate-spin" /> : <Share2 size={12} />} Share
                             </button>
                        </div>
                    </div>
                 )}

                 {message.image && (
                   <div className="mb-4 relative group rounded-xl overflow-hidden border border-white/10 shadow-lg">
                      <img src={`data:image/png;base64,${message.image}`} alt="AI Generated" className="w-full h-auto object-cover" />
                      {!isUser && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleDownload('image')}
                            className="px-3 py-2 bg-white/10 backdrop-blur-md text-white rounded-full flex items-center gap-2 hover:bg-white/20 transition-colors"
                          >
                            <Download size={14} /><span className="text-xs">Save</span>
                          </button>
                          <button 
                            onClick={() => handleShare('image')}
                            disabled={isSharing}
                            className="px-3 py-2 bg-white/10 backdrop-blur-md text-white rounded-full flex items-center gap-2 hover:bg-white/20 transition-colors"
                          >
                            {isSharing ? <Loader2 size={14} className="animate-spin"/> : <Share2 size={14} />}
                            <span className="text-xs">Share</span>
                          </button>
                        </div>
                      )}
                   </div>
                 )}
                 {message.video && (
                   <div className="mb-4 relative group rounded-xl overflow-hidden border border-white/10 shadow-lg bg-black">
                      <video src={message.video} controls className="w-full h-auto max-h-[400px]" />
                      {!isUser && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                            <button 
                                onClick={() => handleDownload('video')} 
                                className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md transition-colors"
                                title="Download Video"
                            >
                                <Film size={16} />
                            </button>
                            <button 
                                onClick={() => handleShare('video')} 
                                disabled={isSharing}
                                className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md transition-colors"
                                title="Share Video"
                            >
                                {isSharing ? <Loader2 size={16} className="animate-spin"/> : <Share2 size={16} />}
                            </button>
                        </div>
                      )}
                   </div>
                 )}

                 {(message.text || message.isStreaming) && (
                    <div className={message.text ? "markdown-content" : ""}>
                       {message.text ? (
                          <ReactMarkdown 
                            className={`markdown-content ${isStory ? 'font-serif text-[1.05em] leading-loose' : ''}`}
                            components={{
                              p: ({node, ...props}) => <p className="mb-3 last:mb-0" {...props} />,
                              strong: ({node, ...props}) => <strong className={`font-bold ${
                                isStory ? 'text-rose-300' 
                                : theme === 'obsidian' ? 'text-white' 
                                : theme === 'forest' ? 'text-emerald-400'
                                : theme === 'ocean' ? 'text-cyan-400'
                                : theme === 'dune' || theme === 'desert' ? 'text-orange-400'
                                : 'text-amber-400'}`} {...props} />,
                              code: ({node, ...props}) => <code className="bg-black/30 px-1.5 py-0.5 rounded text-xs font-mono" {...props} />,
                            }}
                          >
                            {displayText}
                          </ReactMarkdown>
                       ) : (
                          <div className="flex space-x-1.5 items-center py-1 h-6 pl-1">
                             <div className={`w-2 h-2 rounded-full animate-bounce ${isStory ? 'bg-rose-500' : hasMapData ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                             <div className={`w-2 h-2 rounded-full animate-bounce [animation-delay:0.1s] ${isStory ? 'bg-rose-500' : hasMapData ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                             <div className={`w-2 h-2 rounded-full animate-bounce [animation-delay:0.2s] ${isStory ? 'bg-rose-500' : hasMapData ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          </div>
                       )}
                    </div>
                 )}
               </>
             )}
          </div>
          
          <div className="mt-2 flex items-center justify-between w-full text-[11px] font-medium tracking-wide opacity-60 px-1">
            <div className="flex items-center gap-2">
              {message.isStreaming && !isUser && <span className={`${getAccentTextColor()} animate-pulse`}>Thinking...</span>}
              {!message.isStreaming && <span className="text-current opacity-70">{isUser ? 'You' : 'Baba Baloch'} • {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
            </div>
            
            <div className="flex items-center gap-1">
              {!isUser && !message.isStreaming && message.text && !isAudioCard && (
                <>
                  <button 
                      onClick={() => handleDownload('text')} 
                      className="flex items-center gap-1.5 px-2 py-1 rounded-full hover:bg-white/10 transition-colors"
                      title="Download as .txt"
                  >
                      <FileText size={14} />
                      <span className="hidden sm:inline">Save</span>
                  </button>

                  <button 
                      onClick={() => handleShare('text')} 
                      className="flex items-center gap-1.5 px-2 py-1 rounded-full hover:bg-white/10 transition-colors"
                      title="Share"
                  >
                      <Share2 size={14} />
                      <span className="hidden sm:inline">Share</span>
                  </button>

                  {/* LISTEN BUTTON ADDITION */}
                  {onPlayAudio && (
                     <button 
                        onClick={handlePlayClick} 
                        disabled={isPlaying || isLoadingAudio} 
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors ${isPlaying ? 'text-emerald-400 bg-emerald-500/10' : 'hover:bg-white/10'}`}
                        title="Read aloud"
                     >
                       {isLoadingAudio ? <Loader2 size={14} className="animate-spin" /> : <Volume2 size={14} />}
                       <span className="hidden sm:inline">{isPlaying ? 'Speaking' : 'Listen'}</span>
                       <span className="inline sm:hidden">{isPlaying ? 'Stop' : 'Listen'}</span>
                     </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
