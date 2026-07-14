import React, { useState } from 'react';
import { Hero, InventoryItem, Quest, GameState } from '../types';
import { cn } from '../lib/utils';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { Shield, Sword, Heart, Star, Backpack, Pickaxe, Coins, Beaker, Zap, ShieldAlert, Crosshair, Map, Activity, Coins as CoinsIcon, Tent, UserRound, CheckCircle2, XCircle, Trophy, Sparkles } from 'lucide-react';

interface Props {
  gameState: GameState;
  equipItem: (heroId: string, itemInstanceId: string, slot: 'weapon' | 'armor') => void;
  unequipItem: (heroId: string, slot: 'weapon' | 'armor') => void;
  startQuest: (heroId: string, questId: string) => void;
  healHero: (heroId: string) => void;
  sellItem: (itemInstanceId: string) => void;
}

const RarityClasses = {
  common: 'bg-slate-800 border-2 border-slate-700 text-slate-300',
  uncommon: 'bg-slate-800 border-2 border-emerald-500/50 ring-2 ring-emerald-500/10 shadow-[inset_0_0_12px_rgba(16,185,129,0.1)] text-emerald-300',
  rare: 'bg-slate-800 border-2 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.3)] text-blue-300',
  epic: 'bg-slate-800 border-2 border-purple-500/50 ring-2 ring-purple-500/10 shadow-[inset_0_0_12px_rgba(168,85,247,0.1)] text-purple-300',
  legendary: 'bg-slate-800 border-2 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] text-amber-300'
};

const HeroClassLabels: Record<string, string> = {
  warrior: 'Válečník',
  mage: 'Mág',
  rogue: 'Tulák'
};

const ItemCard = ({ item, draggable = true, onDragStart }: { item: InventoryItem, draggable?: boolean, onDragStart?: (e: React.DragEvent) => void }) => {
  return (
    <div 
      draggable={draggable}
      onDragStart={onDragStart}
      className={cn(
        "p-2 rounded-lg flex flex-col justify-center cursor-grab active:cursor-grabbing hover:brightness-110 transition-all select-none w-full h-full min-h-[4rem]",
        RarityClasses[item.rarity]
      )}
      title={`${item.name}
Útok: ${item.attack}
Obrana: ${item.defense}
Cena: ${item.value}`}
    >
      <div className="font-bold truncate text-[11px] uppercase tracking-wider">{item.name}</div>
      <div className="flex gap-2 mt-1 text-[10px] font-bold">
        {item.attack > 0 && <span className="flex items-center gap-0.5"><Sword size={10} /> {item.attack}</span>}
        {item.defense > 0 && <span className="flex items-center gap-0.5"><Shield size={10} /> {item.defense}</span>}
      </div>
    </div>
  );
};

export default function GuildMaster({ gameState, equipItem, unequipItem, startQuest, healHero, sellItem }: Props) {
  const { onDragStart, onDragOver } = useDragAndDrop();
  const [activeLogTab, setActiveLogTab] = useState<'journal' | 'questHistory'>('journal');

  const handleEquipDrop = (e: React.DragEvent, heroId: string, slot: 'weapon' | 'armor') => {
    e.preventDefault();
    const itemInstanceId = e.dataTransfer.getData('itemInstanceId');
    const source = e.dataTransfer.getData('source');
    
    if (source === 'inventory') {
      equipItem(heroId, itemInstanceId, slot);
    }
  };

  const handleInventoryDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const source = e.dataTransfer.getData('source');
    const heroId = e.dataTransfer.getData('heroId');
    
    if (source === 'hero' && heroId) {
      // We don't know the slot from dragging unfortunately with simple html5 if we don't pass it.
      // Let's assume if it's dropped in inventory, we unequip whatever it is.
      // Better: we pass slot in drag data.
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-8 bg-[#1e293b] border-b border-slate-700 shadow-xl shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.4)]">
            <Tent className="w-6 h-6 text-slate-900" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter uppercase text-amber-400">Guild Master</h1>
        </div>
        <div className="flex gap-6 items-center">
          <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-1.5 rounded-full border border-slate-700">
            <span className="text-amber-400 font-bold">{gameState.gold}</span>
            <span className="text-xs uppercase text-slate-400 font-bold">Zlato</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-1.5 rounded-full border border-slate-700">
            <span className="text-blue-400 font-bold">{gameState.materials}</span>
            <span className="text-xs uppercase text-slate-400 font-bold">Suroviny</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden p-6 gap-6">
        
        {/* Left Column: Heroes */}
        <aside className="w-80 flex flex-col gap-4 overflow-hidden shrink-0">
          <div className="flex justify-between items-end mb-2 shrink-0">
            <h2 className="text-sm font-black uppercase text-slate-400 tracking-widest">Aktivní Hrdinové</h2>
            <span className="text-xs text-amber-500 font-bold">{gameState.heroes.length} / 5 Slotů</span>
          </div>
          
          <div className="flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2 pb-4">
            {gameState.heroes.map(hero => {
              const isQuesting = hero.status === 'questing';
              const isDead = hero.status === 'dead';
              let progress = 0;
              let timeRemaining = "";
              if (isQuesting && hero.questStartTime && hero.activeQuestId) {
                const quest = gameState.availableQuests.find(q => q.id === hero.activeQuestId);
                if (quest) {
                  progress = Math.min(100, Math.max(0, ((Date.now() - hero.questStartTime) / quest.durationMs) * 100));
                  const remainingMs = Math.max(0, quest.durationMs - (Date.now() - hero.questStartTime));
                  timeRemaining = `${Math.ceil(remainingMs / 1000)}s`;
                }
              }

              const totalAttack = hero.baseAttack + (hero.equipment.weapon?.attack || 0) + (hero.equipment.armor?.attack || 0);
              const totalDefense = hero.baseDefense + (hero.equipment.weapon?.defense || 0) + (hero.equipment.armor?.defense || 0);

              const bgClass = isDead ? "bg-rose-600/20 border-rose-500/30 opacity-80" : 
                              isQuesting ? "bg-indigo-600/20 border-indigo-500" : 
                              "bg-emerald-600/20 border-emerald-500/30 opacity-80";
              const textNameClass = isDead ? "text-rose-100" : isQuesting ? "text-indigo-100" : "text-emerald-100";
              const textSubClass = isDead ? "text-rose-300" : isQuesting ? "text-indigo-300" : "text-emerald-300";
              const borderAvatarClass = isDead ? "border-rose-500/50" : isQuesting ? "border-indigo-400" : "border-emerald-500/50";

              return (
                <div key={hero.id} className={cn("border-2 p-4 rounded-xl relative overflow-hidden shrink-0", bgClass)}>
                  <div className="flex items-center gap-3 relative z-10 mb-3">
                    <div className={cn("w-12 h-12 bg-slate-700 rounded-lg border-2 flex items-center justify-center", borderAvatarClass)}>
                       <UserRound className={cn("w-6 h-6", isDead ? "text-rose-400" : isQuesting ? "text-indigo-400" : "text-emerald-400")} />
                    </div>
                    <div className="flex-1">
                      <p className={cn("font-bold", textNameClass)}>{hero.name}</p>
                      <p className={cn("text-[10px] font-medium uppercase tracking-wider", textSubClass)}>
                        {HeroClassLabels[hero.heroClass] || hero.heroClass} • Úroveň {hero.level}
                      </p>
                    </div>
                    <div className="text-right">
                       <div className={cn("text-xs font-bold", isDead ? "text-rose-400" : "text-white")}>
                         {hero.currentHp} / {hero.maxHp}
                       </div>
                       {(hero.currentHp < hero.maxHp || isDead) && !isQuesting && (
                         <button 
                           onClick={() => healHero(hero.id)}
                           disabled={gameState.gold < 20}
                           className="text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/50 hover:bg-rose-500/40 mt-1 disabled:opacity-50"
                         >
                           Léčit 20g
                         </button>
                       )}
                    </div>
                  </div>

                  {isQuesting && (
                    <div className="mt-3 relative z-10">
                      <div className="flex justify-between text-[10px] uppercase font-bold mb-1 text-indigo-300">
                        <span>Výprava</span>
                        <span>{timeRemaining}</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>
                  )}

                  {/* Equipment Slots */}
                  <div className="grid grid-cols-2 gap-2 mt-4 relative z-10">
                    <div 
                      onDragOver={onDragOver}
                      onDrop={(e) => handleEquipDrop(e, hero.id, 'weapon')}
                      className={cn(
                        "h-14 rounded-lg flex flex-col items-center justify-center relative group transition-colors",
                        hero.equipment.weapon ? "" : "border-2 border-dashed border-slate-700 bg-slate-900/50 text-slate-500",
                        isQuesting ? "pointer-events-none opacity-50" : ""
                      )}
                    >
                      {hero.equipment.weapon ? (
                        <>
                          <ItemCard item={hero.equipment.weapon} draggable={false} />
                          <button onClick={() => unequipItem(hero.id, 'weapon')} className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Zap size={10} />
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] uppercase tracking-widest font-black">Zbraň</span>
                      )}
                    </div>
                    <div 
                      onDragOver={onDragOver}
                      onDrop={(e) => handleEquipDrop(e, hero.id, 'armor')}
                      className={cn(
                        "h-14 rounded-lg flex flex-col items-center justify-center relative group transition-colors",
                        hero.equipment.armor ? "" : "border-2 border-dashed border-slate-700 bg-slate-900/50 text-slate-500",
                        isQuesting ? "pointer-events-none opacity-50" : ""
                      )}
                    >
                      {hero.equipment.armor ? (
                        <>
                          <ItemCard item={hero.equipment.armor} draggable={false} />
                          <button onClick={() => unequipItem(hero.id, 'armor')} className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Zap size={10} />
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] uppercase tracking-widest font-black">Zbroj</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {gameState.heroes.length < 5 && (
              <div className="border-2 border-dashed border-slate-700 p-4 rounded-xl flex items-center justify-center text-slate-500 font-bold uppercase text-xs h-24 shrink-0">
                + Naverbovat Hrdinu
              </div>
            )}
          </div>
        </aside>

        {/* Center/Right Area: Quests & Inventory */}
        <div className="flex-1 flex flex-col xl:flex-row gap-6 overflow-hidden">
          
          {/* Center: Quests */}
          <section className="flex-[2] bg-slate-800/40 rounded-2xl border border-slate-700 p-6 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <span className="px-3 py-1 bg-indigo-500 text-white text-[10px] font-black tracking-widest uppercase rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]">Vývěska</span>
            </div>
            
            <h2 className="text-sm font-black uppercase text-slate-400 tracking-widest mb-6 mt-1">Dostupné Úkoly</h2>
            
            <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2 pb-4">
              {gameState.availableQuests.map(quest => (
                <div key={quest.id} className="bg-slate-900/80 p-5 rounded-xl border border-slate-700 flex flex-col xl:flex-row gap-6 justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-black text-white text-xl uppercase italic tracking-tighter flex items-center gap-3">
                      {quest.name}
                      <span className="text-[10px] not-italic tracking-widest bg-slate-800 text-amber-500 px-2 py-0.5 rounded border border-amber-500/30">
                        Úroveň {quest.levelReq}
                      </span>
                    </h4>
                    <p className="text-slate-400 text-sm mt-2 font-medium">{quest.description}</p>
                    <div className="grid grid-cols-3 gap-2 mt-4">
                       <div className="bg-slate-800/50 p-2 rounded-lg border border-slate-700 text-center">
                         <p className="text-[9px] uppercase font-black text-slate-500">Obtížnost</p>
                         <p className="text-sm font-black text-rose-400">{quest.difficulty}</p>
                       </div>
                       <div className="bg-slate-800/50 p-2 rounded-lg border border-slate-700 text-center">
                         <p className="text-[9px] uppercase font-black text-slate-500">Odměna</p>
                         <p className="text-sm font-black text-amber-400">{quest.rewards.gold}g</p>
                       </div>
                       <div className="bg-slate-800/50 p-2 rounded-lg border border-slate-700 text-center">
                         <p className="text-[9px] uppercase font-black text-slate-500">Trvání</p>
                         <p className="text-sm font-black text-blue-400">{quest.durationMs / 1000}s</p>
                       </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 min-w-[140px] xl:w-48">
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1 text-center xl:text-left">Vyslat Hrdinu</p>
                    {gameState.heroes.filter(h => h.status === 'idle' && h.level >= quest.levelReq).map(hero => (
                      <button
                        key={hero.id}
                        onClick={() => startQuest(hero.id, quest.id)}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-black uppercase py-2.5 rounded-lg transition-all shadow-[0_4px_0_#b45309] active:translate-y-1 active:shadow-none text-xs w-full truncate px-2"
                      >
                        {hero.name}
                      </button>
                    ))}
                    {gameState.heroes.filter(h => h.status === 'idle' && h.level >= quest.levelReq).length === 0 && (
                      <div className="text-xs text-slate-600 font-bold uppercase text-center xl:text-left border-2 border-dashed border-slate-700 p-2 rounded-lg">
                        Žádný hrdina
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Right: Inventory & Logs */}
          <aside className="flex-1 flex flex-col gap-6 overflow-hidden min-w-[300px]">
            {/* Inventory */}
            <div className="flex flex-col overflow-hidden h-1/2">
              <div className="flex justify-between items-end mb-2 shrink-0">
                <h2 className="text-sm font-black uppercase text-slate-400 tracking-widest">Sklad Gildy</h2>
                <span className="text-xs text-slate-500 font-bold">{gameState.inventory.length} Předmětů</span>
              </div>
              <div className="bg-slate-900/80 rounded-2xl border border-slate-700 p-4 flex-1 overflow-y-auto custom-scrollbar">
                <div 
                  className="grid grid-cols-4 gap-3 content-start min-h-full"
                  onDragOver={onDragOver}
                  onDrop={handleInventoryDrop}
                >
                  {gameState.inventory.map(item => (
                    <div key={item.instanceId} className="group relative aspect-square">
                      <ItemCard 
                        item={item} 
                        onDragStart={(e) => onDragStart(e, item.instanceId, 'inventory')}
                      />
                      <button
                        onClick={() => sellItem(item.instanceId)}
                        className="absolute -top-2 -right-2 bg-amber-500 text-slate-900 font-black text-[10px] px-2 py-0.5 rounded shadow-[0_2px_0_#b45309] opacity-0 group-hover:opacity-100 transition-opacity active:translate-y-0.5 active:shadow-none z-20"
                        title={`Prodat za ${item.value}g`}
                      >
                        ${item.value}
                      </button>
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, 16 - gameState.inventory.length) }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square bg-slate-800 rounded-lg border-2 border-slate-700"></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Logs & Quest History */}
            <div className="flex flex-col overflow-hidden h-1/2">
              <div className="flex items-center justify-between border-b border-slate-800 mb-3 pb-1 shrink-0">
                <div className="flex gap-4">
                  <button 
                    onClick={() => setActiveLogTab('journal')}
                    className={cn(
                      "text-xs font-black uppercase tracking-widest pb-1.5 border-b-2 transition-all cursor-pointer",
                      activeLogTab === 'journal' ? "text-amber-400 border-amber-400 font-black" : "text-slate-500 border-transparent hover:text-slate-300"
                    )}
                  >
                    Deník Gildy
                  </button>
                  <button 
                    onClick={() => setActiveLogTab('questHistory')}
                    className={cn(
                      "text-xs font-black uppercase tracking-widest pb-1.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5",
                      activeLogTab === 'questHistory' ? "text-amber-400 border-amber-400 font-black" : "text-slate-500 border-transparent hover:text-slate-300"
                    )}
                  >
                    Kniha Výprav
                    {gameState.completedQuests && gameState.completedQuests.length > 0 && (
                      <span className="bg-amber-500/20 text-amber-400 text-[9px] px-1.5 py-0.5 rounded-full border border-amber-500/30 font-bold">
                        {gameState.completedQuests.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {activeLogTab === 'journal' ? (
                <div className="bg-slate-900/80 rounded-2xl border border-slate-700 p-4 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2">
                  {gameState.logs.length === 0 ? (
                    <div className="text-center text-slate-600 text-xs py-8 italic">Zatím žádné záznamy.</div>
                  ) : (
                    gameState.logs.map(log => (
                      <div key={log.id} className="text-xs font-medium bg-slate-800/50 p-2 rounded-lg border border-slate-700/50 flex gap-3 items-start">
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5 shrink-0">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <span className={cn(
                          "flex-1",
                          log.type === 'info' ? "text-slate-300" :
                          log.type === 'success' ? "text-emerald-400 font-bold" :
                          log.type === 'warning' ? "text-amber-400" :
                          "text-rose-400 font-bold"
                        )}>
                          {log.message}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="bg-slate-900/80 rounded-2xl border border-slate-700 p-4 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3">
                  {/* Quest Stats Summary */}
                  {gameState.completedQuests && gameState.completedQuests.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80 shrink-0 mb-1">
                      <div className="text-center">
                        <p className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Celkem</p>
                        <p className="text-sm font-black text-white">{gameState.completedQuests.length}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Úspěšnost</p>
                        <p className="text-sm font-black text-emerald-400">
                          {Math.round((gameState.completedQuests.filter(q => q.success).length / gameState.completedQuests.length) * 100)}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Kořist</p>
                        <p className="text-sm font-black text-amber-400">
                          {gameState.completedQuests.reduce((sum, q) => sum + q.goldEarned, 0)}g
                        </p>
                      </div>
                    </div>
                  )}

                  {(!gameState.completedQuests || gameState.completedQuests.length === 0) ? (
                    <div className="text-center text-slate-600 text-xs py-12 italic flex flex-col items-center justify-center gap-2">
                      <Trophy size={24} className="text-slate-700" />
                      <span>Zatím nebyly dokončeny žádné výpravy.</span>
                    </div>
                  ) : (
                    gameState.completedQuests.map(completed => (
                      <div 
                        key={completed.id} 
                        className={cn(
                          "p-3 rounded-xl border flex flex-col gap-2 transition-all",
                          completed.success 
                            ? "bg-emerald-950/15 border-emerald-900/30 hover:border-emerald-800/40" 
                            : "bg-rose-950/15 border-rose-900/30 hover:border-rose-800/40"
                        )}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-black text-white text-xs uppercase tracking-tight flex items-center gap-1.5">
                              {completed.success ? (
                                <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                              ) : (
                                <XCircle size={12} className="text-rose-400 shrink-0" />
                              )}
                              {completed.questName}
                            </h4>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                              Hrdina: <span className="text-slate-200 font-bold">{completed.heroName}</span> • {new Date(completed.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <span className={cn(
                            "text-[9px] uppercase font-black px-1.5 py-0.5 rounded border",
                            completed.success 
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                              : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                          )}>
                            {completed.success ? "Úspěch" : "Neúspěch"}
                          </span>
                        </div>

                        {completed.success ? (
                          <div className="flex flex-wrap gap-2 text-[10px] font-mono font-bold mt-1">
                            {completed.goldEarned > 0 && (
                              <span className="flex items-center gap-0.5 bg-slate-950/40 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/10">
                                <Coins size={10} className="shrink-0 text-amber-500" /> +{completed.goldEarned}g
                              </span>
                            )}
                            {completed.materialsEarned > 0 && (
                              <span className="flex items-center gap-0.5 bg-slate-950/40 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/10">
                                <Pickaxe size={10} className="shrink-0 text-blue-400" /> +{completed.materialsEarned}
                              </span>
                            )}
                            {completed.xpEarned > 0 && (
                              <span className="flex items-center gap-0.5 bg-slate-950/40 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/10">
                                <Sparkles size={10} className="shrink-0 text-indigo-400" /> +{completed.xpEarned} XP
                              </span>
                            )}
                            {completed.lootItem && (
                              <div 
                                className={cn(
                                  "flex items-center gap-1 px-1.5 py-0.5 rounded border shadow-sm text-[10px] uppercase font-black cursor-help",
                                  completed.lootItem.rarity === 'common' ? "border-slate-700 bg-slate-900 text-slate-300" :
                                  completed.lootItem.rarity === 'uncommon' ? "border-emerald-600/30 bg-emerald-950/30 text-emerald-300" :
                                  completed.lootItem.rarity === 'rare' ? "border-blue-600/30 bg-blue-950/30 text-blue-300" :
                                  completed.lootItem.rarity === 'epic' ? "border-purple-600/30 bg-purple-950/30 text-purple-300" :
                                  "border-amber-600/50 bg-amber-950/30 text-amber-300 animate-pulse"
                                )}
                                title={`Kořist: ${completed.lootItem.name}\nÚtok: ${completed.lootItem.attack}\nObrana: ${completed.lootItem.defense}`}
                              >
                                🎁 {completed.lootItem.name}
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-[10px] text-rose-300 italic">
                            Hrdina selhal, ztratil HP a musel se vrátit do gildy k ošetření.
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
