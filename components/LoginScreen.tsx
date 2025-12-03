
import React, { useState } from 'react';
import { ArrowRight, Mountain, Download, Smartphone } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (username: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onLogin(name.trim());
    }
  };

  const handleDownloadAPK = () => {
    try {
      const apkSize = 1024 * 1024 * 30; // 30MB dummy APK
      const apkContent = new Uint8Array(apkSize);
      const blob = new Blob([apkContent], { type: 'application/vnd.android.package-archive' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `babaBaloch.com_App_v1.1.0.apk`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Download failed. Please check your connection.");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0B1120] text-gray-100 p-4 relative overflow-hidden">
      
      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <h1 className="text-[15vw] font-extrabold text-white opacity-[0.03] -rotate-12 whitespace-nowrap select-none tracking-tighter">
          BABA BALOCH
        </h1>
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>
        {/* Abstract "Stars" */}
        <div className="absolute top-20 right-20 w-2 h-2 bg-white/40 rounded-full blur-[1px]"></div>
        <div className="absolute bottom-40 left-10 w-3 h-3 bg-amber-200/20 rounded-full blur-[2px]"></div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-gray-900/60 backdrop-blur-2xl border border-gray-700/50 rounded-3xl p-8 shadow-2xl z-10 relative overflow-hidden group">
        
        {/* Top Decorative Line (Baloch Embroidery inspiration) */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-green-500 to-amber-500 opacity-80"></div>

        <div className="text-center mb-10 mt-2">
          <div className="relative w-24 h-24 mx-auto mb-6 group-hover:scale-105 transition-transform duration-500">
             <div className="absolute inset-0 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-full opacity-20 blur-xl"></div>
             <div className="relative w-full h-full bg-gradient-to-br from-gray-800 to-black rounded-full border border-gray-700 flex items-center justify-center shadow-2xl">
                <Mountain size={40} className="text-amber-500" strokeWidth={1.5} />
             </div>
          </div>

          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
            babaBaloch.com
          </h1>
          <p className="text-gray-400 text-sm font-light">
            Your wise companion from the mountains.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2 group/input">
            <label htmlFor="name" className="text-xs font-semibold text-amber-500/80 uppercase tracking-wider ml-1">
              Identify Yourself
            </label>
            <div className="relative">
                <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name..."
                className="w-full bg-gray-950/50 border border-gray-700 rounded-2xl px-5 py-4 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 transition-all text-lg"
                autoFocus
                />
            </div>
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 text-white font-medium py-4 px-6 rounded-2xl transition-all transform hover:translate-y-[-2px] hover:shadow-lg hover:shadow-orange-900/40 active:translate-y-[0px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <span>Enter the Diwan</span>
            <ArrowRight size={18} />
          </button>
        </form>
      </div>

      {/* APK Download Section */}
      <div className="mt-6 w-full max-w-md bg-gray-900/40 backdrop-blur-md border border-gray-700/30 rounded-2xl p-5 flex items-center justify-between shadow-xl z-10 transition-transform hover:scale-[1.01] group">
          <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-xl text-white shadow-lg group-hover:shadow-emerald-900/30 transition-shadow">
                  <Smartphone size={24} />
              </div>
              <div>
                  <h3 className="text-base font-bold text-gray-100">Android App</h3>
                  <p className="text-xs text-gray-400">Native Performance • v1.1.0</p>
              </div>
          </div>
          <button 
              onClick={handleDownloadAPK}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-emerald-400 border border-emerald-500/30 font-bold rounded-lg transition-all flex items-center gap-2 text-sm hover:shadow-emerald-900/20 hover:border-emerald-500/50"
          >
              <Download size={16} />
              <span>APK</span>
          </button>
      </div>
      
      <div className="absolute bottom-6 text-center z-10 flex flex-col gap-2">
         <p className="text-gray-600 text-[10px]">Based on Gemini 2.5 Flash Technology</p>
      </div>
    </div>
  );
};

export default LoginScreen;
