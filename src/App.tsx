import React, { useEffect, useState } from 'react';
import GuildMaster from './components/GuildMaster';
import { useGameEngine } from './hooks/useGameEngine';

export default function App() {
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
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
      <div className="@container relative w-full h-screen overflow-hidden bg-[#0f172a]">
        <GuildMaster {...engine} />
      </div>
    </div>
  );
}
