import React from 'react';
import { Hero, GameState, InventoryItem } from '../types';
import { totalXpForLevel, levelProgressPercent } from '../game/rules';
import { cn } from '../lib/utils';
import { X, Sword, Shield, Heart, Star, Backpack, Map, Activity, Trophy, Clock, Edit3, BookOpen, Wand2, Check } from 'lucide-react';
import { useState } from 'react';
import { ItemCard } from './SharedItemCard';

interface Props {
  hero: Hero;
  gameState: GameState;
  onClose: () => void;
  unequipItem: (heroId: string, slot: 'weapon' | 'armor') => void;
  updateHeroStory: (heroId: string, story: string) => void;
}

const HeroClassLabels: Record<string, string> = {
  warrior: 'Válečník',
  mage: 'Mág',
  rogue: 'Tulák'
};

export default function HeroDetailModal({ hero, gameState, onClose, unequipItem, updateHeroStory }: Props) {
  const nextLevelXp = totalXpForLevel(hero.level + 1);
  const xpProgress = levelProgressPercent(hero);

  const totalAttack = hero.baseAttack + (hero.equipment.weapon?.attack || 0) + (hero.equipment.armor?.attack || 0);
  const totalDefense = hero.baseDefense + (hero.equipment.weapon?.defense || 0) + (hero.equipment.armor?.defense || 0);

  const history = gameState.completedQuests.filter(q => q.heroId === hero.id).sort((a, b) => b.completedAt - a.completedAt);
  const [isEditingStory, setIsEditingStory] = useState(false);
  const [storyText, setStoryText] = useState(hero.story || "");

  const handleSaveStory = () => {
    updateHeroStory(hero.id, storyText.trim());
    setIsEditingStory(false);
  };

  const generateRandomStory = () => {
    const stories = {
        warrior: [
            "Bývalý žoldák z východních plání, který hledá vykoupení v řadách naší gildy. Jeho meč už prolil příliš mnoho nevinné krve, nyní ho vede touha chránit slabé.",
            "Poslední přeživší z elitní královské gardy. Přísahal pomstu temnému kultu, který zničil jeho pány.",
            "Tento zjizvený válečník toho moc nenamluví. Raději nechává za sebe mluvit svou zbraň a činy na bojišti."
        ],
        mage: [
            "Vyloučený student arkánní univerzity kvůli nebezpečným experimentům s temnou magií. Nyní hledá starobylé artefakty pro svůj tajný výzkum.",
            "Génius mezi mágy. Sepsal již několik svitků, které změnily chápání elementální magie. Stále však hledá ultimátní pravdu.",
            "Jeho mysl je napojena na sféru duchů. Často mluví s neviditelnými bytostmi, což ostatní znepokojuje."
        ],
        rogue: [
            "Vyrůstal v sirotčinci ve stínech velkoměsta. Rychle se naučil, že jediný způsob, jak přežít, je být rychlejší a chytřejší než ostatní.",
            "Bývalý nájemný vrah s vlastním kodexem cti. Nikdy nezabije nikoho, kdo si to nezaslouží.",
            "Mistr v otevírání zámků a pastí. Tvrdí o sobě, že dokáže ukrást i měsíc z oblohy, kdyby mu za to někdo dobře zaplatil."
        ]
    };
    
    const classStories = stories[hero.heroClass as keyof typeof stories] || stories.warrior;
    const randomStory = classStories[Math.floor(Math.random() * classStories.length)];
    setStoryText(randomStory);
    updateHeroStory(hero.id, randomStory);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
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
        <div className="flex-1 overflow-auto p-6 flex flex-col @md:flex-row gap-6">
          
          {/* Left Column: Stats & Inventory */}
          <div className="flex flex-col gap-6 w-full @md:w-1/3">
            
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

            {/* Story */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                  <BookOpen size={14} /> Příběh hrdiny
                </h3>
                <div className="flex gap-2">
                  {isEditingStory ? (
                    <button onClick={handleSaveStory} className="text-emerald-400 hover:text-emerald-300 transition-colors" title="Uložit">
                      <Check size={14} />
                    </button>
                  ) : (
                    <>
                      <button onClick={generateRandomStory} className="text-blue-400 hover:text-blue-300 transition-colors" title="Generovat náhodný příběh">
                        <Wand2 size={14} />
                      </button>
                      <button onClick={() => setIsEditingStory(true)} className="text-amber-400 hover:text-amber-300 transition-colors" title="Upravit příběh">
                        <Edit3 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {isEditingStory ? (
                <textarea
                  value={storyText}
                  onChange={(e) => setStoryText(e.target.value)}
                  placeholder="Napište příběh hrdiny..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500/50 transition-colors min-h-[80px] resize-none"
                  autoFocus
                />
              ) : (
                <div className="text-xs text-slate-400 italic bg-slate-900/50 p-3 rounded-lg min-h-[80px] border border-slate-800 flex items-center justify-center">
                  {hero.story ? (
                    <span className="w-full h-full text-left not-italic text-slate-300 leading-relaxed">{hero.story}</span>
                  ) : (
                    "Hrdina zatím nemá žádný příběh..."
                  )}
                </div>
              )}
            </div>

            {/* Inventory / Equipment */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
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
