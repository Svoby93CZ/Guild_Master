import React from 'react';
import { GameState, GuildUpgrades } from '../types';
import { cn } from '../lib/utils';
import { guildUpgradeCost, GUILD_UPGRADE_MAX_LEVEL, renownBonus, renownFromRun } from '../game/rules';
import { Coins, Landmark, Warehouse, Swords, Crown, Sparkles, Info } from 'lucide-react';

interface Props {
  gameState: GameState;
  buyUpgrade: (key: keyof GuildUpgrades) => void;
  prestige: () => void;
}

interface UpgradeInfo {
  key: keyof GuildUpgrades;
  name: string;
  icon: React.ElementType;
  description: string;
  /** Co dá další stupeň – text do tlačítka. */
  effect: (level: number) => string;
  accent: string;
}

const UPGRADES: UpgradeInfo[] = [
  {
    key: 'treasury',
    name: 'Pokladnice',
    icon: Landmark,
    description: 'Lepší účetnictví a vyjednané smlouvy zvyšují výnos zlata ze všech výprav.',
    effect: level => `+${(level + 1) * 15} % zlata`,
    accent: 'text-amber-400 border-amber-500/40 bg-amber-950/20'
  },
  {
    key: 'warehouse',
    name: 'Sklad',
    icon: Warehouse,
    description: 'Prostornější truhly znamenají, že se z výprav donese víc surovin.',
    effect: level => `+${(level + 1) * 15} % surovin`,
    accent: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20'
  },
  {
    key: 'trainingGround',
    name: 'Cvičiště',
    icon: Swords,
    description: 'Vycvičení hrdinové zvládnou výpravu rychleji. Nejvýš však o polovinu času.',
    effect: level => `−${Math.min(50, (level + 1) * 6)} % délky výprav`,
    accent: 'text-indigo-400 border-indigo-500/40 bg-indigo-950/20'
  }
];

export default function GuildHall({ gameState, buyUpgrade, prestige }: Props) {
  const pendingRenown = renownFromRun(gameState.heroes);
  const currentBonus = Math.round(renownBonus(gameState.renown) * 100);
  const nextBonus = Math.round(renownBonus(gameState.renown + pendingRenown) * 100);

  return (
    <div className="flex-1 gothic-panel rounded-xl border border-[#2a2420] p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
      <div>
        <h2 className="text-sm font-black uppercase text-slate-400 tracking-widest mb-1">Síň gildy</h2>
        <p className="text-xs text-slate-500 font-medium">
          Trvalá vylepšení zůstávají i po rozpuštění gildy.
        </p>
      </div>

      {/* Sláva */}
      <div className="bg-slate-900/60 border border-amber-500/30 rounded-xl p-5 flex flex-col @xl:flex-row gap-5 items-start @xl:items-center justify-between">
        <div className="flex gap-4 items-center">
          <div className="w-12 h-12 rounded-lg bg-amber-950/40 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <Crown size={24} />
          </div>
          <div>
            <h3 className="font-gothic font-bold text-amber-100 text-lg tracking-wide">Sláva gildy</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {gameState.renown} slávy · všechny výnosy +{currentBonus} %
              {gameState.prestigeCount > 0 && ` · ${gameState.prestigeCount}. období`}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 w-full @xl:w-auto">
          <button
            onClick={prestige}
            disabled={pendingRenown <= 0}
            title={pendingRenown <= 0 ? 'Hrdinové musí nasbírat aspoň 1000 XP.' : undefined}
            className="px-5 py-2.5 rounded-lg font-black uppercase text-xs tracking-widest bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 transition-all shadow-[0_4px_0_#b45309] active:translate-y-1 active:shadow-none disabled:shadow-none disabled:active:translate-y-0 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles size={14} />
            {pendingRenown > 0 ? `Rozpustit za ${pendingRenown} slávy` : 'Zatím není za co'}
          </button>
          {pendingRenown > 0 && (
            <p className="text-[10px] text-slate-500 font-bold uppercase text-center">
              Výnosy by stouply na +{nextBonus} %
            </p>
          )}
        </div>
      </div>

      {/* Vylepšení */}
      <div className="grid grid-cols-1 @xl:grid-cols-3 gap-4">
        {UPGRADES.map(({ key, name, icon: Icon, description, effect, accent }) => {
          const level = gameState.upgrades[key];
          const maxed = level >= GUILD_UPGRADE_MAX_LEVEL;
          const cost = guildUpgradeCost(level);
          const affordable = gameState.gold >= cost;

          return (
            <div key={key} className="gothic-card rounded-xl p-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className={cn('w-10 h-10 rounded-lg border flex items-center justify-center shrink-0', accent)}>
                  <Icon size={20} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-xs text-white uppercase truncate">{name}</h4>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">
                    Stupeň {level} / {GUILD_UPGRADE_MAX_LEVEL}
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 font-medium leading-relaxed flex-1">{description}</p>

              <div className="text-[11px] font-black uppercase text-slate-300">
                {maxed ? 'Plně vylepšeno' : `Další stupeň: ${effect(level)}`}
              </div>

              <button
                onClick={() => buyUpgrade(key)}
                disabled={maxed || !affordable}
                className="w-full py-2 rounded-lg font-black uppercase text-[11px] tracking-widest bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 text-slate-200 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {maxed ? (
                  'Hotovo'
                ) : (
                  <>
                    <Coins size={12} className={affordable ? 'text-amber-400' : 'text-slate-500'} />
                    {cost} zlata
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 leading-relaxed flex gap-3">
        <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white">Jak funguje rozpuštění gildy.</span> Sláva se počítá
          z celkových zkušeností všech hrdinů – čím dál gilda došla, tím víc slávy odejde do další.
          Přijdete o hrdiny, vybavení, suroviny i zlato, ale vylepšení síně a nasbíraná sláva
          zůstávají, takže další gilda roste znatelně rychleji.
        </div>
      </div>
    </div>
  );
}
