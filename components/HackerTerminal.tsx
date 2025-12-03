
import React, { useEffect, useState, useRef } from 'react';
import { Wifi, Unlock, ShieldAlert, Terminal, Lock, RefreshCw, Signal, CheckCircle } from 'lucide-react';

interface HackerTerminalProps {
  onComplete: (result: string) => void;
  onClose: () => void;
}

const NETWORKS = [
  { ssid: "PTCL-BB-Home", strength: 90, secured: true },
  { ssid: "FiberLink_5G_User", strength: 85, secured: true },
  { ssid: "FBI_Surveillance_Van_42", strength: 95, secured: true },
  { ssid: "Baba_Jaan_Hujra", strength: 60, secured: true },
  { ssid: "Virus_Download_Link", strength: 99, secured: true },
  { ssid: "Nayatel_Spot", strength: 45, secured: true },
];

const LOG_LINES = [
  "Initializing network interface...",
  "Scanning local ports [80, 443, 8080]...",
  "Handshake detected...",
  "Capturing packets...",
  "Decrypting WPA2-PSK handshake...",
  "Brute forcing credentials...",
  "Bypassing firewall rules...",
  "Injecting wise_elder_protocol.exe...",
  "Accessing mainframe...",
  "Retrieving security keys..."
];

const SUCCESS_MESSAGES = [
  "GoReadABook",
  "AskYourMother",
  "RespectYourElders",
  "Bismillah123",
  "NoFreeInternet",
  "TeaIsReady",
  "IncorrectPassword",
  "TryAgainLater",
  "12345678",
  "PakistanZindabad"
];

export const HackerTerminal: React.FC<HackerTerminalProps> = ({ onComplete, onClose }) => {
  const [stage, setStage] = useState<'scan' | 'list' | 'crack' | 'success'>('scan');
  const [selectedSsid, setSelectedSsid] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [password, setPassword] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Stage 1: Auto Scan Simulation
  useEffect(() => {
    if (stage === 'scan') {
      const timer = setTimeout(() => setStage('list'), 2500);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  // Stage 3: Cracking Simulation
  useEffect(() => {
    if (stage === 'crack') {
      let currentLogIndex = 0;
      const logInterval = setInterval(() => {
        if (currentLogIndex < LOG_LINES.length) {
          setLogs(prev => [...prev, LOG_LINES[currentLogIndex]]);
          currentLogIndex++;
        }
      }, 400);

      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            clearInterval(logInterval);
            const pass = SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)];
            setPassword(pass);
            setStage('success');
            return 100;
          }
          // Accelerate progress towards the end for dramatic effect
          const increment = prev > 80 ? 1 : prev > 50 ? 2 : 5;
          return Math.min(prev + Math.random() * increment, 100);
        });
      }, 100);

      return () => {
        clearInterval(logInterval);
        clearInterval(progressInterval);
      };
    }
  }, [stage]);

  // Auto scroll logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleNetworkSelect = (ssid: string) => {
    setSelectedSsid(ssid);
    setLogs([]);
    setProgress(0);
    setStage('crack');
  };

  const handleConnect = () => {
    // Pass formatted string for parent parsing
    onComplete(`Network: ${selectedSsid}, Password: '${password}'`);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black font-mono text-green-500 p-4 flex flex-col items-center justify-center animate-in fade-in duration-300">
      <div className="w-full max-w-md border border-green-500/30 bg-black/90 rounded-xl shadow-[0_0_50px_rgba(34,197,94,0.15)] relative overflow-hidden flex flex-col h-[600px] max-h-[85vh]">
        
        {/* Retro CRT Effects */}
        <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] z-10"></div>
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-green-500/5 to-transparent animate-pulse z-10"></div>
        
        {/* Header */}
        <div className="bg-green-900/20 border-b border-green-500/30 p-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Terminal size={16} />
            <span className="text-xs font-bold tracking-widest uppercase">WiFi_Breaker_v2.0</span>
          </div>
          <button onClick={onClose} className="hover:text-white transition-colors p-1"><ShieldAlert size={16} /></button>
        </div>

        {/* Content Area */}
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar relative flex flex-col">
          
          {stage === 'scan' && (
            <div className="h-full flex flex-col items-center justify-center gap-6">
              <div className="relative">
                <div className="absolute inset-0 rounded-full border-2 border-green-500/30 animate-ping"></div>
                <div className="absolute inset-0 rounded-full border border-green-500/50 animate-[ping_1.5s_ease-in-out_infinite]"></div>
                <div className="w-24 h-24 rounded-full border-2 border-green-500 flex items-center justify-center bg-black relative z-10">
                   <Wifi size={48} className="animate-pulse" />
                </div>
              </div>
              <div className="text-center space-y-2">
                 <p className="text-sm font-bold tracking-widest animate-pulse">SCANNING FREQUENCIES...</p>
                 <p className="text-xs opacity-60">Detecting local access points</p>
              </div>
            </div>
          )}

          {stage === 'list' && (
            <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
               <div className="flex items-center justify-between border-b border-green-500/20 pb-2">
                   <h3 className="text-xs font-bold text-green-400 uppercase">Select Target Network</h3>
                   <span className="text-[10px] bg-green-900/40 px-2 py-0.5 rounded text-green-300">{NETWORKS.length} Found</span>
               </div>
               
               <div className="space-y-2">
                 {NETWORKS.map((net, i) => (
                   <button 
                    key={i}
                    onClick={() => handleNetworkSelect(net.ssid)}
                    className="w-full flex items-center justify-between p-3 border border-green-500/20 hover:bg-green-500/10 hover:border-green-500/50 hover:shadow-[0_0_10px_rgba(34,197,94,0.1)] rounded transition-all group text-left relative overflow-hidden"
                    style={{ animationDelay: `${i * 50}ms` }}
                   >
                      <div className="flex items-center gap-3 relative z-10">
                        <Lock size={14} className="text-green-600 group-hover:text-green-400" />
                        <span className="font-bold text-sm">{net.ssid}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs opacity-70 relative z-10">
                         <Signal size={12} /> {net.strength}%
                      </div>
                      <div className="absolute inset-0 bg-green-500/5 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                   </button>
                 ))}
               </div>
               
               <div className="mt-6 pt-4 border-t border-green-500/20 text-center">
                  <button onClick={() => setStage('scan')} className="text-xs flex items-center justify-center gap-2 mx-auto hover:text-white transition-colors opacity-70 hover:opacity-100">
                     <RefreshCw size={12} /> Rescan Area
                  </button>
               </div>
            </div>
          )}

          {stage === 'crack' && (
            <div className="flex flex-col h-full animate-in zoom-in-95 duration-300">
              <div className="flex items-center justify-center mb-6 shrink-0">
                  <div className="relative">
                      <div className="w-20 h-20 rounded-full border-2 border-green-500 flex items-center justify-center animate-spin [animation-duration:3s]"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                          <Lock size={24} className="animate-pulse" />
                      </div>
                  </div>
              </div>
              
              <div className="space-y-2 mb-4 shrink-0 bg-green-900/10 p-3 rounded border border-green-500/20">
                <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider">
                  <span className="text-green-300">Targeting: {selectedSsid}</span>
                  <span className="text-white">{Math.floor(progress)}%</span>
                </div>
                <div className="h-1.5 bg-black rounded-full overflow-hidden">
                   <div className="h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)] transition-all duration-100" style={{ width: `${progress}%` }}></div>
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 bg-black border border-green-500/20 p-3 font-mono text-[10px] leading-relaxed overflow-y-auto shadow-inner">
                {logs.map((log, i) => (
                  <div key={i} className="mb-1 opacity-80 whitespace-nowrap">
                    <span className="text-green-700 mr-2">root@baba:~#</span>
                    <span className="text-green-400">{log}</span>
                  </div>
                ))}
                <div className="animate-pulse text-green-500">_</div>
              </div>
            </div>
          )}

          {stage === 'success' && (
            <div className="h-full flex flex-col items-center justify-center text-center gap-6 animate-in zoom-in duration-500">
               <div className="relative">
                 <div className="absolute inset-0 bg-green-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                 <div className="w-24 h-24 rounded-full bg-green-600 text-black flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.5)] relative z-10">
                    <Unlock size={48} />
                 </div>
                 <div className="absolute -bottom-2 -right-2 bg-black rounded-full p-1 border border-green-500 z-20">
                    <CheckCircle size={20} className="text-green-500" fill="currentColor" />
                 </div>
               </div>

               <div>
                 <h2 className="text-2xl font-bold tracking-[0.2em] text-white mb-1 text-shadow-green">ACCESS GRANTED</h2>
                 <p className="text-xs text-green-400 uppercase tracking-widest opacity-80">Security Protocol Bypassed</p>
               </div>
               
               <div className="bg-green-900/20 border border-green-500/50 p-6 rounded-xl w-full max-w-xs relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
                  <p className="text-[10px] uppercase text-green-400 mb-2 font-bold tracking-wider">WiFi Password</p>
                  <p className="text-2xl font-bold text-white tracking-widest select-all drop-shadow-md font-mono">{password}</p>
               </div>

               <div className="w-full max-w-xs space-y-3">
                   <button 
                      onClick={handleConnect}
                      className="w-full py-3.5 bg-green-600 hover:bg-green-500 text-black font-bold uppercase tracking-widest rounded-lg transition-all hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:-translate-y-1"
                   >
                      Connect Now
                   </button>
                   <button onClick={onClose} className="text-xs text-green-600 hover:text-green-400 underline decoration-green-600/30 underline-offset-4">
                      Close Terminal
                   </button>
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
