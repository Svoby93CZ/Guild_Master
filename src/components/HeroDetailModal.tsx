import React from 'react';
import { Hero, GameState, InventoryItem } from '../types';
import { XP_TO_LEVEL } from '../data/constants';
import { cn } from '../lib/utils';
import { X, Sword, Shield, Heart, Star, Backpack, Map, Activity, Trophy, Clock } from 'lucide-react';
import { ItemCard } from './SharedItemCard';

interface Props {
  hero: Hero;
  gameState: GameState;
  onClose: () => void;
  unequipItem: (heroId: string, slot: 'weapon' | 'armor') => void;
}

const HeroClassLabels: Record<string, string> = {
  warrior: 'Válečník',
  mage: 'Mág',
  rogue: 'Tulák'
};

export default function HeroDetailModal({ hero, gameState, onClose, unequipItem }: Props) {
  const currentLevelXp = XP_TO_LEVEL[hero.level - 1] || 0;
  const nextLevelXp = XP_TO_LEVEL[hero.level] || hero.xp;
  const xpProgress = nextLevelXp > currentLevelXp ? Math.min(100, Math.max(0, ((hero.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100)) : 100;

  const totalAttack = hero.baseAttack + (hero.equipment.weapon?.attack || 0) + (hero.equipment.armor?.attack || 0);
  const totalDefense = hero.baseDefense + (hero.equipment.weapon?.defense || 0) + (hero.equipment.armor?.defense || 0);

  const history = gameState.completedQuests.filter(q => q.heroId === hero.id).sort((a, b) => b.completedAt - a.completedAt);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-slate-800 rounded-xl border-2 border-slate-600 flex items-center justify-center text-3xl">
              {/* Fallback to emoji if no icon */}
              {hero.icon === 'flame' ? '🔥' : hero.icon === 'bird' ? '🦅' : hero.icon === 'skull' ? '💀' : '👤'}
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-wider text-white">{hero.name}</h2>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
                <span>{HeroClassLabels[hero.heroClass]}</span>
                <span>•</span>
                <span className="text-amber-400">Úroveň {hero.level}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 flex flex-col md:flex-row gap-6">
          
          {/* Left Column: Stats & Inventory */}
          <div className="flex flex-col gap-6 w-full md:w-1/3">
            
            {/* Stats Card */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 space-y-4">
              <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                <Activity size={14} /> Statistiky
              </h3>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-emerald-400">Zdraví (HP)</span>
                    <span className="text-emerald-400">{hero.currentHp} / {hero.maxHp}</span>
                  </div>
                  <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${(hero.currentHp / hero.maxHp) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-blue-400">Zkušenosti (XP)</span>
                    <span className="text-blue-400">{hero.xp} / {nextLevelXp}</span>
                  </div>
                  <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${xpProgress}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex flex-col items-center">
                    <Sword size={16} className="text-rose-400 mb-1" />
                    <span className="text-xs font-black text-slate-400 uppercase">Útok</span>
                    <span className="text-lg font-black text-white">{totalAttack}</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex flex-col items-center">
                    <Shield size={16} className="text-blue-400 mb-1" />
                    <span className="text-xs font-black text-slate-400 uppercase">Obrana</span>
                    <span className="text-lg font-black text-white">{totalDefense}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Inventory / Equipment */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex-1">
              <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2 mb-4">
                <Backpack size={14} /> Vybavení hrdiny
              </h3>
              
              <div className="space-y-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Zbraň</span>
                  <div className="h-24">
                    {hero.equipment.weapon ? (
                      <div className="relative h-full group">
                        <ItemCard item={hero.equipment.weapon} draggable={false} />
                        <button 
                          onClick={() => unequipItem(hero.id, 'weapon')}
                          className="absolute inset-0 bg-slate-950/80 hidden group-hover:flex items-center justify-center text-xs font-bold uppercase tracking-wider text-white transition-all cursor-pointer rounded-lg backdrop-blur-sm"
                        >
                          Sundat
                        </button>
                      </div>
                    ) : (
                      <div className="h-full rounded-lg border-2 border-dashed border-slate-700 bg-slate-900/50 flex items-center justify-center text-slate-600">
                        <Sword size={24} className="opacity-50" />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Zbroj</span>
                  <div className="h-24">
                    {hero.equipment.armor ? (
                      <div className="relative h-full group">
                        <ItemCard item={hero.equipment.armor} draggable={false} />
                        <button 
                          onClick={() => unequipItem(hero.id, 'armor')}
                          className="absolute inset-0 bg-slate-950/80 hidden group-hover:flex items-center justify-center text-xs font-bold uppercase tracking-wider text-white transition-all cursor-pointer rounded-lg backdrop-blur-sm"
                        >
                          Sundat
                        </button>
                      </div>
                    ) : (
                      <div className="h-full rounded-lg border-2 border-dashed border-slate-700 bg-slate-900/50 flex items-center justify-center text-slate-600">
                        <Shield size={24} className="opacity-50" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: History */}
          <div className="flex-1 bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 flex flex-col">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2 mb-4 shrink-0">
              <Clock size={14} /> Historie výprav
            </h3>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
              {history.length > 0 ? (
                history.map(entry => (
                  <div key={entry.id} className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg shrink-0",
                      entry.success ? "bg-emerald-950/30 text-emerald-400" : "bg-rose-950/30 text-rose-400"
                    )}>
                      <Trophy size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-sm text-slate-200 truncate">{entry.questName}</span>
                        <span className="text-[10px] font-mono text-slate-500 shrink-0">
                          {new Date(entry.completedAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs font-bold">
                        <span className={entry.success ? "text-emerald-500" : "text-rose-500"}>
                          {entry.success ? 'Úspěch' : 'Neúspěch'}
                        </span>
                        {entry.success && (
                          <>
                            <span className="text-slate-600">•</span>
                            <span className="text-blue-400">+{entry.xpEarned} XP</span>
                            <span className="text-slate-600">•</span>
                            <span className="text-amber-400">+{entry.goldEarned}g</span>
                          </>
                        )}
                        {entry.lootItem && (
                          <>
                            <span className="text-slate-600">•</span>
                            <span className="text-purple-400">Nalezeno: {entry.lootItem.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50 space-y-2">
                  <Map size={32} />
                  <p className="text-xs font-bold uppercase tracking-wider">Zatím žádné výpravy</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
