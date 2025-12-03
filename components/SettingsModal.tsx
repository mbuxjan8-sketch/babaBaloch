
import React from 'react';
import { X, Smartphone, Download, Check, Moon, Sun, Monitor, Volume2, Trash2, LogOut, HardDrive, Zap, CloudLightning, Wind, Feather, Mountain, Sparkles, Globe, Film, Trees, Waves, Tent } from 'lucide-react';
import { Theme, VideoResolution } from '../types';

interface Voice {
  id: string;
  name: string;
  desc: string;
  icon: React.ReactNode;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  voices: Voice[];
  currentVoice: string;
  onVoiceChange: (id: string) => void;
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  videoResolution: VideoResolution;
  onVideoResolutionChange: (res: VideoResolution) => void;
  onInstall: () => void;
  onDownloadApk: () => void;
  onClearHistory: () => void;
  onDeleteAccount: () => void;
  onLogout: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  voices,
  currentVoice,
  onVoiceChange,
  currentTheme,
  onThemeChange,
  videoResolution,
  onVideoResolutionChange,
  onInstall,
  onDownloadApk,
  onClearHistory,
  onDeleteAccount,
  onLogout
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#151925] border border-gray-700/80 rounded-3xl w-full max-w-2xl h-[85vh] md:h-auto shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800 bg-[#0B1120]">
          <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
            <Monitor className="text-amber-500" size={20} />
            Settings & Preferences
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* Voice Settings */}
          <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Volume2 size={16} /> Voice Selection
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {voices.map((voice) => (
                <button
                  key={voice.id}
                  onClick={() => onVoiceChange(voice.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                    currentVoice === voice.id
                      ? 'bg-amber-500/10 border-amber-500/50 text-amber-100'
                      : 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${currentVoice === voice.id ? 'bg-amber-500 text-black' : 'bg-gray-700 text-gray-400'}`}>
                    {voice.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{voice.name}</div>
                    <div className="text-[10px] opacity-70">{voice.desc}</div>
                  </div>
                  {currentVoice === voice.id && <Check size={16} className="text-amber-500" />}
                </button>
              ))}
            </div>
          </section>

          {/* Video Quality Settings */}
          <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Film size={16} /> Video Quality
            </h3>
            <div className="grid grid-cols-2 gap-3">
               <button
                  onClick={() => onVideoResolutionChange('720p')}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    videoResolution === '720p'
                      ? 'bg-amber-500/10 border-amber-500/50 text-amber-100'
                      : 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <div>
                    <div className="font-medium text-sm">HD 720p</div>
                    <div className="text-[10px] opacity-70">Faster generation</div>
                  </div>
                  {videoResolution === '720p' && <Check size={16} className="text-amber-500" />}
                </button>

                <button
                  onClick={() => onVideoResolutionChange('1080p')}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    videoResolution === '1080p'
                      ? 'bg-amber-500/10 border-amber-500/50 text-amber-100'
                      : 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <div>
                    <div className="font-medium text-sm">Full HD 1080p</div>
                    <div className="text-[10px] opacity-70">High quality</div>
                  </div>
                  {videoResolution === '1080p' && <Check size={16} className="text-amber-500" />}
                </button>
            </div>
          </section>

          {/* Theme Settings */}
          <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sun size={16} /> Visual Theme
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <button
                onClick={() => onThemeChange('midnight')}
                className={`relative group rounded-xl overflow-hidden border-2 transition-all ${
                  currentTheme === 'midnight' ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-transparent hover:border-gray-600'
                }`}
              >
                <div className="h-16 bg-[#0B1120] flex items-center justify-center">
                   <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 shadow-lg"></div>
                </div>
                <div className="bg-gray-800 p-2 text-center flex items-center justify-center gap-2">
                  <Moon size={12} className="text-indigo-400"/>
                  <span className="text-xs font-medium text-gray-300">Midnight</span>
                </div>
                {currentTheme === 'midnight' && <div className="absolute top-2 right-2 bg-indigo-500 text-white rounded-full p-0.5"><Check size={10} /></div>}
              </button>

              <button
                onClick={() => onThemeChange('forest')}
                className={`relative group rounded-xl overflow-hidden border-2 transition-all ${
                  currentTheme === 'forest' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-transparent hover:border-gray-600'
                }`}
              >
                <div className="h-16 bg-[#05110b] flex items-center justify-center">
                   <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-green-700 shadow-lg"></div>
                </div>
                <div className="bg-gray-800 p-2 text-center flex items-center justify-center gap-2">
                  <Trees size={12} className="text-emerald-400"/>
                  <span className="text-xs font-medium text-gray-300">Forest</span>
                </div>
                {currentTheme === 'forest' && <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-0.5"><Check size={10} /></div>}
              </button>

              <button
                onClick={() => onThemeChange('ocean')}
                className={`relative group rounded-xl overflow-hidden border-2 transition-all ${
                  currentTheme === 'ocean' ? 'border-cyan-500 ring-2 ring-cyan-500/20' : 'border-transparent hover:border-gray-600'
                }`}
              >
                <div className="h-16 bg-[#0b1221] flex items-center justify-center">
                   <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 shadow-lg"></div>
                </div>
                <div className="bg-gray-800 p-2 text-center flex items-center justify-center gap-2">
                  <Waves size={12} className="text-cyan-400"/>
                  <span className="text-xs font-medium text-gray-300">Ocean</span>
                </div>
                {currentTheme === 'ocean' && <div className="absolute top-2 right-2 bg-cyan-500 text-white rounded-full p-0.5"><Check size={10} /></div>}
              </button>

              <button
                onClick={() => onThemeChange('desert')}
                className={`relative group rounded-xl overflow-hidden border-2 transition-all ${
                  currentTheme === 'desert' ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-transparent hover:border-gray-600'
                }`}
              >
                <div className="h-16 bg-[#1a0f0a] flex items-center justify-center">
                   <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-600 to-red-700 shadow-lg"></div>
                </div>
                <div className="bg-gray-800 p-2 text-center flex items-center justify-center gap-2">
                  <Tent size={12} className="text-orange-400"/>
                  <span className="text-xs font-medium text-gray-300">Desert</span>
                </div>
                {currentTheme === 'desert' && <div className="absolute top-2 right-2 bg-orange-500 text-white rounded-full p-0.5"><Check size={10} /></div>}
              </button>
              
              <button
                onClick={() => onThemeChange('obsidian')}
                className={`relative group rounded-xl overflow-hidden border-2 transition-all ${
                  currentTheme === 'obsidian' ? 'border-gray-500 ring-2 ring-gray-500/20' : 'border-transparent hover:border-gray-600'
                }`}
              >
                <div className="h-16 bg-[#000000] flex items-center justify-center">
                   <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-800 to-gray-600 border border-gray-600 shadow-lg"></div>
                </div>
                <div className="bg-gray-800 p-2 text-center flex items-center justify-center gap-2">
                  <Moon size={12} className="text-gray-400"/>
                  <span className="text-xs font-medium text-gray-300">Obsidian</span>
                </div>
                {currentTheme === 'obsidian' && <div className="absolute top-2 right-2 bg-gray-500 text-white rounded-full p-0.5"><Check size={10} /></div>}
              </button>
            </div>
          </section>

          {/* Install & Download */}
          <section className="bg-gray-800/30 rounded-2xl p-4 border border-gray-700/50">
             <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Smartphone size={16} /> App Installation
            </h3>
            
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-3">
              <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
                <Globe size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-blue-300 uppercase">Web Version Active</h4>
                <p className="text-[10px] text-gray-400">You are currently using the website version.</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
               <button 
                 onClick={onInstall}
                 className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
               >
                 <Download size={18} />
                 Install Application
               </button>
               <button 
                 onClick={onDownloadApk}
                 className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
               >
                 <HardDrive size={18} />
                 Download APK
               </button>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Install Baba Baloch on your home screen for the best full-screen experience and faster access.
            </p>
          </section>

          {/* Danger Zone */}
          <section className="pt-4 border-t border-gray-800">
             <h3 className="text-sm font-bold text-red-400/70 uppercase tracking-wider mb-4">
              Data & Session
            </h3>
            <div className="space-y-2">
               <button 
                 onClick={onClearHistory}
                 className="w-full flex items-center justify-between p-3 rounded-xl bg-red-500/5 hover:bg-red-500/10 text-red-300 border border-red-500/10 transition-colors"
               >
                 <span className="flex items-center gap-2"><Trash2 size={16} /> Clear Conversation History</span>
               </button>
               
               <button 
                 onClick={onLogout}
                 className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-800 text-gray-400 transition-colors"
               >
                 <span className="flex items-center gap-2"><LogOut size={16} /> Logout</span>
               </button>
               
               <button 
                 onClick={onDeleteAccount}
                 className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-red-900/20 text-gray-500 hover:text-red-400 transition-colors"
               >
                 <span className="flex items-center gap-2 text-xs uppercase font-bold tracking-wider">Reset App (Devolute)</span>
               </button>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0B1120] border-t border-gray-800 text-center">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest">
            babaBaloch.com v1.1.0 • Build 2025
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
