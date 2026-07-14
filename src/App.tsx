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

  return <GuildMaster {...engine} />;
}
