import React from 'react';
import GuildMaster from './components/GuildMaster';
import { useGameEngine } from './hooks/useGameEngine';

export default function App() {
  // Žádný globální časovač: postup výprav si tiká `QuestProgress` sám, takže
  // se překresluje jen ten pruh, a ne celé rozhraní desetkrát za sekundu.
  const engine = useGameEngine();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
      <div className="@container relative w-full h-screen overflow-hidden bg-[#0f172a]">
        <GuildMaster {...engine} />
      </div>
    </div>
  );
}
