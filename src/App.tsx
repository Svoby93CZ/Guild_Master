import React, { useEffect, useState } from 'react';
import GuildMaster from './components/GuildMaster';
import { useGameEngine } from './hooks/useGameEngine';

import { Smartphone, Monitor } from 'lucide-react';
import { cn } from './lib/utils';

export default function App() {
  const [isMobileMode, setIsMobileMode] = useState(false);

  const engine = useGameEngine();
  
  // Force a re-render to animate progress bars smoothly
  const [_, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 100); // 100ms for smooth progress bar updates
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={cn("min-h-screen bg-slate-950 flex flex-col items-center justify-center transition-all", isMobileMode ? "py-4 md:py-8" : "")}>
      <div className={cn(
        "@container relative transition-all duration-300 bg-[#0f172a]",
        isMobileMode 
          ? "w-full max-w-[414px] h-[896px] border-[12px] border-slate-900 rounded-[3rem] shadow-2xl flex-shrink-0 overflow-hidden ring-1 ring-slate-800" 
          : "w-full h-screen overflow-hidden"
      )}>
        <GuildMaster {...engine} />
      </div>
      
      {/* Toggle Button */}
      <button
        onClick={() => setIsMobileMode(!isMobileMode)}
        className="fixed bottom-4 right-4 z-[100] p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-2xl transition-all active:scale-95 flex items-center justify-center ring-4 ring-indigo-500/30"
        title={isMobileMode ? "Přepnout na Desktop" : "Přepnout na Mobil"}
      >
        {isMobileMode ? <Monitor size={24} /> : <Smartphone size={24} />}
      </button>
    </div>
  );
}
