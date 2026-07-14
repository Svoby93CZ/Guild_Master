import React, { useState, useMemo } from 'react';
import { GameState, ItemRarity, MaterialsInventory } from '../types';
import { cn } from '../lib/utils';
import { 
  Hammer, 
  Coins, 
  Pickaxe, 
  Shield, 
  Sword, 
  Sparkles, 
  Gem, 
  BookOpen, 
  Info, 
  CheckCircle2, 
  Flame,
  Wrench, Zap,
  Search,
  Filter
} from 'lucide-react';

interface Props {
  gameState: GameState;
  craftItem: (
    name: string, 
    type: 'weapon' | 'armor', 
    rarity: ItemRarity, 
    attack: number, 
    defense: number, 
    value: number, 
    costMaterials: Partial<MaterialsInventory>, 
    costGold: number
  ) => void;
  craftMaterial: (
    materialKey: keyof MaterialsInventory, 
    costRaw: Partial<MaterialsInventory>, 
    costGold: number, 
    yieldCount: number
  ) => void;
}

interface CraftingRecipe {
  id: string;
  name: string;
  type: 'weapon' | 'armor';
  rarity: ItemRarity;
  attack: number;
  defense: number;
  value: number;
  costMaterials: Partial<MaterialsInventory>;
  costGold: number;
  description: string;
}

interface IntermediateMaterialRecipe {
  id: string;
  name: string;
  key: keyof MaterialsInventory;
  costRaw: Partial<MaterialsInventory>;
  costGold: number;
  yieldCount: number;
  icon: string;
  description: string;
}

const INTERMEDIATE_RECIPES: IntermediateMaterialRecipe[] = [
  {
    id: 'mat_iron_bar',
    name: 'Železný prut',
    key: 'ironBar',
    costRaw: { ironOre: 2 },
    costGold: 2,
    yieldCount: 1,
    icon: '🔩',
    description: 'Tavený kovový ingot vhodný k tvoření čepelí a pevné výztuhy.'
  },
  {
    id: 'mat_leather_strap',
    name: 'Kožený pásek',
    key: 'leatherStrap',
    costRaw: { rawHide: 2 },
    costGold: 1,
    yieldCount: 1,
    icon: '🎗️',
    description: 'Pevně stažený pruh kůže pro rukojeti zbraní a řemení zbrojí.'
  },
  {
    id: 'mat_steel_nails',
    name: 'Ocelové hřebíky',
    key: 'steelNail',
    costRaw: { ironOre: 1 },
    costGold: 1,
    yieldCount: 4,
    icon: '📌',
    description: 'Sada drobných ocelových hřebíků k upevňování plátů k dřevu či kůži.'
  },
  {
    id: 'mat_processed_plank',
    name: 'Zpracované prkno',
    key: 'processedPlank',
    costRaw: { oakWood: 2 },
    costGold: 1,
    yieldCount: 1,
    icon: '🪵',
    description: 'Ohoblované a zpevněné dubové prkno pro štíty a pevné násady.'
  }
];

const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    id: 'recipe_shield_1',
    name: 'Dubový pukléř',
    type: 'armor',
    rarity: 'common',
    attack: 0,
    defense: 4,
    value: 15,
    costMaterials: { processedPlank: 2, steelNail: 4, leatherStrap: 1 },
    costGold: 10,
    description: 'Jednoduchý, ale pevný dřevěný štít pobitý surovým železem.'
  },
  {
    id: 'recipe_sword_1',
    name: 'Lovecký ocelový tesák',
    type: 'weapon',
    rarity: 'uncommon',
    attack: 10,
    defense: 0,
    value: 40,
    costMaterials: { ironBar: 3, leatherStrap: 2, steelNail: 2 },
    costGold: 20,
    description: 'Pevná jednoruční čepel vhodná pro přežití v divočině.'
  },
  {
    id: 'recipe_armor_1',
    name: 'Zpevněná kožená vesta',
    type: 'armor',
    rarity: 'uncommon',
    attack: 0,
    defense: 10,
    value: 45,
    costMaterials: { leatherStrap: 6, ironBar: 1, steelNail: 8 },
    costGold: 25,
    description: 'Lehká kožená zbroj vyztužená kovovými pláty v klíčových místech.'
  },
  {
    id: 'recipe_staff_1',
    name: 'Hůl blesků',
    type: 'weapon',
    rarity: 'rare',
    attack: 22,
    defense: 1,
    value: 110,
    costMaterials: { processedPlank: 3, manaCrystal: 5, leatherStrap: 2 },
    costGold: 60,
    description: 'Jasanová hůl zakončená rezonujícím elementálním krystalem.'
  },
  {
    id: 'recipe_armor_2',
    name: 'Kroužková košile',
    type: 'armor',
    rarity: 'rare',
    attack: 0,
    defense: 18,
    value: 140,
    costMaterials: { ironBar: 10, steelNail: 16, leatherStrap: 4 },
    costGold: 80,
    description: 'Tisíce ručně nýtovaných ocelových kroužků chránících tělo před seky.'
  },
  {
    id: 'recipe_sword_2',
    name: 'Zubatá čepel stínů',
    type: 'weapon',
    rarity: 'epic',
    attack: 34,
    defense: -1,
    value: 220,
    costMaterials: { ironBar: 12, manaCrystal: 6, leatherStrap: 4 },
    costGold: 140,
    description: 'Temná čepel vykovaná z meteorické rudy obdařená dravou magií.'
  },
  {
    id: 'recipe_armor_3',
    name: 'Plátový krunýř paladina',
    type: 'armor',
    rarity: 'epic',
    attack: 2,
    defense: 28,
    value: 260,
    costMaterials: { ironBar: 15, steelNail: 12, processedPlank: 2, manaCrystal: 3 },
    costGold: 170,
    description: 'Těžký leštěný krunýř, který odráží sluneční svit i nejtvrdší rány.'
  },
  {
    id: 'recipe_sword_3',
    name: 'Sluneční meč krále',
    type: 'weapon',
    rarity: 'legendary',
    attack: 60,
    defense: 5,
    value: 500,
    costMaterials: { ironBar: 20, manaCrystal: 12, leatherStrap: 6, steelNail: 10 },
    costGold: 300,
    description: 'Legendární zbraň nesoucí plameny dávného fénixe. Vůle králů.'
  },
  {
    id: 'recipe_armor_4',
    name: 'Aegis padlých bohů',
    type: 'armor',
    rarity: 'legendary',
    attack: 5,
    defense: 45,
    value: 550,
    costMaterials: { ironBar: 22, manaCrystal: 15, leatherStrap: 8, steelNail: 20 },
    costGold: 350,
    description: 'Štít vykovaný ze zbytků nebeské brány. Chrání nositele před osudem.'
  }
];

const RarityLabels: Record<ItemRarity, string> = {
  common: 'Běžné',
  uncommon: 'Neobvyklé',
  rare: 'Vzácné',
  epic: 'Epické',
  legendary: 'Legendární'
};

const RarityColors: Record<ItemRarity, string> = {
  common: 'border-slate-700 text-slate-400 bg-slate-900/60',
  uncommon: 'border-emerald-900/60 text-emerald-400 bg-emerald-950/10',
  rare: 'border-blue-900/60 text-blue-400 bg-blue-950/10',
  epic: 'border-purple-900/60 text-purple-400 bg-purple-950/10',
  legendary: 'border-amber-900 text-amber-400 bg-amber-950/10 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
};

export default function GuildForge({ gameState, craftItem, craftMaterial }: Props) {
  const [activeSubTab, setActiveSubTab] = useState<'equipment' | 'processing'>('equipment');
  const [filterType, setFilterType] = useState<'all' | 'weapon' | 'armor'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Equipment selection and progress
  const [selectedRecipe, setSelectedRecipe] = useState<CraftingRecipe | null>(CRAFTING_RECIPES[0]);
  const [craftingProgress, setCraftingProgress] = useState<number | null>(null);
  const [showSuccessTick, setShowSuccessTick] = useState(false);

  // Material processing selection and progress
  const [selectedIntermediate, setSelectedIntermediate] = useState<IntermediateMaterialRecipe | null>(INTERMEDIATE_RECIPES[0]);
  const [processingProgress, setProcessingProgress] = useState<number | null>(null);
  const [showProcessingSuccess, setShowProcessingSuccess] = useState(false);
  const [processMultiplier, setProcessMultiplier] = useState<number>(1);

  const materialsInventory = gameState.materialsInventory || {
    ironOre: 0, rawHide: 0, oakWood: 0, manaCrystal: 0,
    ironBar: 0, leatherStrap: 0, steelNail: 0, processedPlank: 0
  };

  // Helper to calculate total count of specific resources
  const totalSurovin = Object.values(materialsInventory).reduce((a, b) => a + b, 0);

  // Filter recipes
  const filteredRecipes = useMemo(() => {
    return CRAFTING_RECIPES.filter(recipe => {
      if (filterType !== 'all' && recipe.type !== filterType) return false;
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const nameMatch = recipe.name.toLowerCase().includes(query);
        const descMatch = recipe.description.toLowerCase().includes(query);
        const rarityMatch = RarityLabels[recipe.rarity].toLowerCase().includes(query);
        if (!nameMatch && !descMatch && !rarityMatch) return false;
      }
      return true;
    });
  }, [filterType, searchQuery]);

  const canAffordRecipe = (recipe: CraftingRecipe) => {
    if (gameState.gold < recipe.costGold) return false;
    for (const [key, amount] of Object.entries(recipe.costMaterials)) {
      const mKey = key as keyof MaterialsInventory;
      if ((materialsInventory[mKey] || 0) < (amount || 0)) {
        return false;
      }
    }
    return true;
  };

  const canAffordIntermediate = (recipe: IntermediateMaterialRecipe, multiplier: number = 1) => {
    if (gameState.gold < recipe.costGold * multiplier) return false;
    for (const [key, amount] of Object.entries(recipe.costRaw)) {
      const mKey = key as keyof MaterialsInventory;
      if ((materialsInventory[mKey] || 0) < (amount || 0) * multiplier) {
        return false;
      }
    }
    return true;
  };


  const getMissingMaterials = (recipe: CraftingRecipe) => {
    const missing: Partial<MaterialsInventory> = {};
    for (const [key, amount] of Object.entries(recipe.costMaterials)) {
      const mKey = key as keyof MaterialsInventory;
      const have = materialsInventory[mKey] || 0;
      if (have < (amount || 0)) {
        missing[mKey] = (amount || 0) - have;
      }
    }
    return missing;
  };

  const getQuickCraftPlan = (recipe: CraftingRecipe) => {
    const missing = getMissingMaterials(recipe);
    if (Object.keys(missing).length === 0) return null;

    let extraGoldNeeded = 0;
    const extraRawNeeded: Partial<MaterialsInventory> = {};
    const craftActions: { recipe: IntermediateMaterialRecipe, multiplier: number }[] = [];

    let possible = true;

    for (const [key, amountStr] of Object.entries(missing)) {
      const mKey = key as keyof MaterialsInventory;
      const amount = amountStr || 0;
      if (amount <= 0) continue;

      const intRecipe = INTERMEDIATE_RECIPES.find(r => r.key === mKey);
      if (!intRecipe) {
        possible = false;
        break;
      }

      const multiplier = Math.ceil(amount / intRecipe.yieldCount);
      
      extraGoldNeeded += intRecipe.costGold * multiplier;
      craftActions.push({ recipe: intRecipe, multiplier });

      for (const [rawKey, rawAmount] of Object.entries(intRecipe.costRaw)) {
        const rKey = rawKey as keyof MaterialsInventory;
        extraRawNeeded[rKey] = (extraRawNeeded[rKey] || 0) + (rawAmount || 0) * multiplier;
      }
    }

    if (!possible) return null;

    for (const [rawKey, amount] of Object.entries(extraRawNeeded)) {
       const rKey = rawKey as keyof MaterialsInventory;
       if ((materialsInventory[rKey] || 0) < (amount || 0)) {
           possible = false;
           break;
       }
    }

    if (gameState.gold < recipe.costGold + extraGoldNeeded) {
        possible = false;
    }

    if (!possible) return null;

    return {
      craftActions,
      extraGoldNeeded,
      extraRawNeeded
    };
  };

  const handleQuickCraft = (recipe: CraftingRecipe, plan: ReturnType<typeof getQuickCraftPlan>) => {
    if (!plan) return;
    if (craftingProgress !== null) return;
    setCraftingProgress(0);
    const interval = setInterval(() => {
      setCraftingProgress(prev => {
        if (prev === null) {
          clearInterval(interval);
          return null;
        }
        if (prev >= 100) {
          clearInterval(interval);
          
          for (const action of plan.craftActions) {
            const multipliedCostRaw = Object.fromEntries(
              Object.entries(action.recipe.costRaw).map(([k, v]) => [k, (v as number) * action.multiplier])
            ) as Partial<MaterialsInventory>;

            craftMaterial(
              action.recipe.key,
              multipliedCostRaw,
              action.recipe.costGold * action.multiplier,
              action.recipe.yieldCount * action.multiplier
            );
          }

          craftItem(
            recipe.name,
            recipe.type,
            recipe.rarity,
            recipe.attack,
            recipe.defense,
            recipe.value,
            recipe.costMaterials,
            recipe.costGold
          );
          setShowSuccessTick(true);
          setTimeout(() => setShowSuccessTick(false), 2000);
          return null;
        }
        return prev + 10;
      });
    }, 100);
  };

  const handleCraft = (recipe: CraftingRecipe) => {
    if (!canAffordRecipe(recipe)) return;
    if (craftingProgress !== null) return;

    setCraftingProgress(0);
    const interval = setInterval(() => {
      setCraftingProgress(prev => {
        if (prev === null) {
          clearInterval(interval);
          return null;
        }
        if (prev >= 100) {
          clearInterval(interval);
          craftItem(
            recipe.name,
            recipe.type,
            recipe.rarity,
            recipe.attack,
            recipe.defense,
            recipe.value,
            recipe.costMaterials,
            recipe.costGold
          );
          setShowSuccessTick(true);
          setTimeout(() => setShowSuccessTick(false), 2000);
          return null;
        }
        return prev + 10;
      });
    }, 100);
  };

  const handleProcess = (recipe: IntermediateMaterialRecipe) => {
    if (!canAffordIntermediate(recipe, processMultiplier)) return;
    if (processingProgress !== null) return;

    setProcessingProgress(0);
    const interval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev === null) {
          clearInterval(interval);
          return null;
        }
        if (prev >= 100) {
          clearInterval(interval);
          const multipliedCostRaw = Object.fromEntries(
            Object.entries(recipe.costRaw).map(([k, v]) => [k, (v || 0) * processMultiplier])
          ) as Partial<MaterialsInventory>;
          
          craftMaterial(recipe.key, multipliedCostRaw, recipe.costGold * processMultiplier, recipe.yieldCount * processMultiplier);
          setShowProcessingSuccess(true);
          setProcessMultiplier(1);
          setTimeout(() => setShowProcessingSuccess(false), 1500);
          return null;
        }
        return prev + 20; // Crisp animation
      });
    }, 80);
  };


  const isAffordable = selectedRecipe ? canAffordRecipe(selectedRecipe) : false;
  const quickCraftPlan = (selectedRecipe && !isAffordable) ? getQuickCraftPlan(selectedRecipe) : null;

  return (

    <div className="bg-slate-800/40 rounded-2xl border border-slate-700 p-5 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4 shrink-0">
        <div>
          <h2 className="text-sm font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
            <Hammer size={16} className="text-amber-500 animate-pulse" /> Kovářská dílna gildy
          </h2>
          <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase">
            Zpracovávejte suroviny na polotovary a kovejte z nich mocnou hrdinskou výzbroj.
          </p>
        </div>

        {/* Total Gold & Suroviny */}
        <div className="flex gap-2 text-xs font-mono font-bold">
          <div className="bg-slate-900/80 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-amber-400">
            <Coins size={14} className="text-amber-500" />
            <span>{gameState.gold}g</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-blue-400">
            <Pickaxe size={14} className="text-blue-500" />
            <span>{totalSurovin} ks celkem</span>
          </div>
        </div>
      </div>

      {/* Materials Stock Grid */}
      <div className="bg-slate-900/40 rounded-xl border border-slate-800 p-3 mb-4 shrink-0">
        <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2 flex items-center gap-1">
          📦 Sklad surovin a polotovarů
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
          {/* Raw */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-lg p-1.5 flex flex-col items-center justify-center text-center">
            <span className="text-lg">⛏️</span>
            <span className="text-[9px] font-bold text-slate-400 mt-1 truncate w-full">Žel. ruda</span>
            <span className="text-xs font-mono font-black text-blue-400">{materialsInventory.ironOre}</span>
          </div>
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-lg p-1.5 flex flex-col items-center justify-center text-center">
            <span className="text-lg">🐾</span>
            <span className="text-[9px] font-bold text-slate-400 mt-1 truncate w-full">Sur. kůže</span>
            <span className="text-xs font-mono font-black text-emerald-400">{materialsInventory.rawHide}</span>
          </div>
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-lg p-1.5 flex flex-col items-center justify-center text-center">
            <span className="text-lg">🌲</span>
            <span className="text-[9px] font-bold text-slate-400 mt-1 truncate w-full">Dub. dřevo</span>
            <span className="text-xs font-mono font-black text-amber-500">{materialsInventory.oakWood}</span>
          </div>
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-lg p-1.5 flex flex-col items-center justify-center text-center">
            <span className="text-lg">🔮</span>
            <span className="text-[9px] font-bold text-slate-400 mt-1 truncate w-full">Krystal</span>
            <span className="text-xs font-mono font-black text-purple-400">{materialsInventory.manaCrystal}</span>
          </div>
          
          {/* Crafted */}
          <div className="bg-slate-950/60 border border-slate-700/40 rounded-lg p-1.5 flex flex-col items-center justify-center text-center">
            <span className="text-lg">🔩</span>
            <span className="text-[9px] font-bold text-slate-300 mt-1 truncate w-full">Žel. prut</span>
            <span className="text-xs font-mono font-black text-blue-300">{materialsInventory.ironBar}</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-700/40 rounded-lg p-1.5 flex flex-col items-center justify-center text-center">
            <span className="text-lg">🎗️</span>
            <span className="text-[9px] font-bold text-slate-300 mt-1 truncate w-full">Kož. pásek</span>
            <span className="text-xs font-mono font-black text-emerald-300">{materialsInventory.leatherStrap}</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-700/40 rounded-lg p-1.5 flex flex-col items-center justify-center text-center">
            <span className="text-lg">📌</span>
            <span className="text-[9px] font-bold text-slate-300 mt-1 truncate w-full">Hřebíky</span>
            <span className="text-xs font-mono font-black text-amber-300">{materialsInventory.steelNail}</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-700/40 rounded-lg p-1.5 flex flex-col items-center justify-center text-center">
            <span className="text-lg">🪵</span>
            <span className="text-[9px] font-bold text-slate-300 mt-1 truncate w-full">Prkno</span>
            <span className="text-xs font-mono font-black text-amber-400">{materialsInventory.processedPlank}</span>
          </div>
        </div>
      </div>

      {/* Sub tabs selector */}
      <div className="flex bg-slate-900/60 border border-slate-800 p-1 rounded-xl mb-4 shrink-0">
        <button
          onClick={() => setActiveSubTab('equipment')}
          className={cn(
            "flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5",
            activeSubTab === 'equipment' 
              ? "bg-amber-500 text-slate-950 shadow-md" 
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          <Hammer size={14} /> Kování výbavy (Zbraně & Zbroje)
        </button>
        <button
          onClick={() => setActiveSubTab('processing')}
          className={cn(
            "flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5",
            activeSubTab === 'processing' 
              ? "bg-amber-500 text-slate-950 shadow-md" 
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          <Wrench size={14} /> Zpracování surovin (Polotovary)
        </button>
      </div>

      {/* Main split: Left list, Right detail */}
      <div className="flex-1 flex flex-col md:flex-row gap-5 overflow-hidden">
        
        {/* Left pane: Seznam */}
        <div className="flex-1 flex flex-col gap-3 overflow-hidden">
          {activeSubTab === 'equipment' ? (
            /* EQUIPMENT TAB LEFT SIDE */
            <>
              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                {/* Search */}
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Hledat nákres, raritu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all"
                  />
                </div>

                {/* Type filter */}
                <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-700/80 shrink-0">
                  <button
                    onClick={() => setFilterType('all')}
                    className={cn(
                      "px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer",
                      filterType === 'all' ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-slate-200"
                    )}
                  >
                    Vše
                  </button>
                  <button
                    onClick={() => setFilterType('weapon')}
                    className={cn(
                      "px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center gap-1",
                      filterType === 'weapon' ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-slate-200"
                    )}
                  >
                    <Sword size={10} /> Zbraně
                  </button>
                  <button
                    onClick={() => setFilterType('armor')}
                    className={cn(
                      "px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center gap-1",
                      filterType === 'armor' ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-slate-200"
                    )}
                  >
                    <Shield size={10} /> Zbroje
                  </button>
                </div>
              </div>

              {/* List of recipes */}
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                {filteredRecipes.length === 0 ? (
                  <div className="text-center text-slate-600 text-xs italic py-12">
                    Nebyly nalezeny žádné nákresy odpovídající hledání.
                  </div>
                ) : (
                  filteredRecipes.map(recipe => {
                    const isSelected = selectedRecipe?.id === recipe.id;
                    const affordable = canAffordRecipe(recipe);

                    return (
                      <div
                        key={recipe.id}
                        onClick={() => setSelectedRecipe(recipe)}
                        className={cn(
                          "p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between group",
                          isSelected 
                            ? "border-amber-500 bg-amber-500/10" 
                            : "border-slate-800/80 bg-slate-900/40 hover:border-slate-700/80 hover:bg-slate-900/60"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {/* Icon */}
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border-2",
                            RarityColors[recipe.rarity]
                          )}>
                            {recipe.type === 'weapon' ? <Sword size={18} /> : <Shield size={18} />}
                          </div>
                          
                          <div>
                            <h4 className="font-bold text-white text-xs group-hover:text-amber-300 transition-colors">{recipe.name}</h4>
                            <div className="flex gap-2 text-[9px] font-mono font-black mt-0.5 text-slate-400">
                              <span className={cn(
                                "px-1 rounded text-[8px] uppercase",
                                recipe.rarity === 'common' ? "bg-slate-800 text-slate-400" :
                                recipe.rarity === 'uncommon' ? "bg-emerald-500/10 text-emerald-400" :
                                recipe.rarity === 'rare' ? "bg-blue-500/10 text-blue-400" :
                                recipe.rarity === 'epic' ? "bg-purple-500/10 text-purple-400" :
                                "bg-amber-500/10 text-amber-400"
                              )}>
                                {RarityLabels[recipe.rarity]}
                              </span>
                              {recipe.attack > 0 && <span className="text-red-400">Útok +{recipe.attack}</span>}
                              {recipe.defense > 0 && <span className="text-emerald-400">Obrana +{recipe.defense}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Cost Quick info */}
                        <div className="text-right text-[10px] font-mono font-bold shrink-0">
                          <p className={affordable ? "text-emerald-400" : "text-slate-500"}>
                            {affordable ? "Dostupné kování" : "Chybí materiály"}
                          </p>
                          <p className="text-amber-400">{recipe.costGold}g</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            /* PROCESSING TAB LEFT SIDE */
            <div className="flex-1 flex flex-col gap-3 overflow-hidden">
              <p className="text-[10px] text-slate-500 font-bold uppercase shrink-0 mb-1">
                Vyberte polotovar, který chcete vyrobit ze základních surovin:
              </p>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                {INTERMEDIATE_RECIPES.map(recipe => {
                  const isSelected = selectedIntermediate?.id === recipe.id;
                  const affordable = canAffordIntermediate(recipe);

                  return (
                    <div
                      key={recipe.id}
                      onClick={() => setSelectedIntermediate(recipe)}
                      className={cn(
                        "p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between group",
                        isSelected 
                          ? "border-amber-500 bg-amber-500/10" 
                          : "border-slate-800/80 bg-slate-900/40 hover:border-slate-700/80 hover:bg-slate-900/60"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-slate-700 bg-slate-900/60 text-lg">
                          {recipe.icon}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-xs group-hover:text-amber-300 transition-colors">
                            {recipe.name} <span className="text-[10px] text-slate-500 font-normal">(Výnos: {recipe.yieldCount}x)</span>
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">{recipe.description}</p>
                        </div>
                      </div>
                      
                      <div className="text-right text-[10px] font-mono font-bold shrink-0">
                        {Object.entries(recipe.costRaw).map(([rawKey, rawAmount]) => {
                          const rKey = rawKey as keyof MaterialsInventory;
                          const rawNames: Record<string, string> = {
                            ironOre: 'Žel. ruda',
                            rawHide: 'Sur. kůže',
                            oakWood: 'Dub. dřevo',
                            manaCrystal: 'Krystal'
                          };
                          const hasEnough = (materialsInventory[rKey] || 0) >= (rawAmount || 0);
                          return (
                            <p key={rawKey} className={hasEnough ? "text-blue-400" : "text-rose-400"}>
                              {rawAmount}x {rawNames[rawKey] || rawKey}
                            </p>
                          );
                        })}
                        <p className={gameState.gold >= recipe.costGold ? "text-amber-400" : "text-rose-400"}>
                          {recipe.costGold}g
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right pane: Detail a zahájení výroby */}
        <div className="w-full md:w-80 shrink-0 bg-slate-900/60 rounded-xl border border-slate-800 p-4 flex flex-col justify-between overflow-hidden">
          {activeSubTab === 'equipment' ? (
            /* EQUIPMENT DETAIL PANEL */
            selectedRecipe ? (
              <div className="flex flex-col h-full justify-between gap-4">
                
                <div className="space-y-4">
                  
                  {/* Visual Banner */}
                  <div className={cn(
                    "p-4 rounded-xl border-2 flex flex-col items-center text-center gap-2",
                    RarityColors[selectedRecipe.rarity]
                  )}>
                    {(selectedRecipe.rarity === 'epic' || selectedRecipe.rarity === 'legendary') && (
                      <Sparkles className="text-amber-400 animate-spin absolute w-24 h-24 opacity-5 pointer-events-none" />
                    )}
                    
                    <div className="w-14 h-14 bg-slate-950/50 rounded-xl border border-slate-700/40 flex items-center justify-center text-white shrink-0 shadow-inner">
                      {selectedRecipe.type === 'weapon' ? <Sword size={28} /> : <Shield size={28} />}
                    </div>

                    <div>
                      <h3 className="font-black text-sm uppercase text-white tracking-wider">{selectedRecipe.name}</h3>
                      <p className="text-[9px] font-mono font-black uppercase tracking-widest text-slate-400 mt-0.5">
                        {RarityLabels[selectedRecipe.rarity]} {selectedRecipe.type === 'weapon' ? 'Zbraň' : 'Zbroj'}
                      </p>
                    </div>

                    {/* Attributes */}
                    <div className="flex justify-center gap-4 border-t border-slate-800 w-full pt-2.5 mt-1 text-xs font-mono font-black">
                      {selectedRecipe.attack > 0 && (
                        <div className="text-center">
                          <p className="text-[8px] text-slate-500 uppercase">Útok</p>
                          <p className="text-red-400 font-black">+{selectedRecipe.attack}</p>
                        </div>
                      )}
                      {selectedRecipe.defense > 0 && (
                        <div className="text-center">
                          <p className="text-[8px] text-slate-500 uppercase">Obrana</p>
                          <p className="text-emerald-400 font-black">+{selectedRecipe.defense}</p>
                        </div>
                      )}
                      <div className="text-center">
                        <p className="text-[8px] text-slate-500 uppercase">Prodej</p>
                        <p className="text-amber-400 font-black">{selectedRecipe.value}g</p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <p className="text-[11px] text-slate-400 italic leading-relaxed text-center font-medium bg-slate-950/40 px-3 py-2 rounded-lg border border-slate-950">
                      "{selectedRecipe.description}"
                    </p>
                  </div>

                  {/* Materials Breakdown Details */}
                  <div className="bg-slate-950/20 p-3 rounded-lg border border-slate-800/80">
                    <h5 className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-2">Potřebné materiály</h5>
                    
                    <div className="space-y-1.5 font-mono text-xs font-bold">
                      {/* Gold requirement */}
                      <div className="flex justify-between items-center text-slate-300">
                        <span className="flex items-center gap-1.5"><Coins size={12} className="text-amber-400" /> Poplatek kováři:</span>
                        <span className={cn(
                          gameState.gold >= selectedRecipe.costGold ? "text-emerald-400" : "text-rose-400"
                        )}>
                          {selectedRecipe.costGold} / {gameState.gold}g
                        </span>
                      </div>

                      {/* Processed Material Ingredients */}
                      <div className="border-t border-slate-800/80 pt-2 space-y-1">
                        <p className="text-[9px] font-black uppercase text-slate-500 tracking-wider mb-1.5">Polotovary ze skladu:</p>
                        {Object.entries(selectedRecipe.costMaterials).map(([key, amount]) => {
                          const mKey = key as keyof MaterialsInventory;
                          const hasAmount = (materialsInventory[mKey] || 0);
                          const isEnough = hasAmount >= ((amount as number) || 0);
                          
                          const matNames: Record<keyof MaterialsInventory, string> = {
                            ironOre: '⛏️ Železná ruda',
                            rawHide: '🐾 Surová kůže',
                            oakWood: '🌲 Dubové dřevo',
                            manaCrystal: '🔮 Magický krystal',
                            ironBar: '🔩 Železný prut',
                            leatherStrap: '🎗️ Kožený pásek',
                            steelNail: '📌 Ocelový hřebík',
                            processedPlank: '🪵 Zpracované prkno'
                          };
                          
                          return (
                            <div key={key} className="flex justify-between items-center text-slate-300">
                              <span>{matNames[mKey] || mKey}:</span>
                              <span className={isEnough ? "text-emerald-400" : "text-rose-400"}>
                                {amount} / {hasAmount} ks
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Crafting Button or Progress bar */}
                <div className="space-y-2 mt-auto">
                  {craftingProgress !== null ? (
                    <div className="bg-slate-950 p-3 rounded-xl border border-amber-500/20 text-center space-y-2">
                      <p className="text-[10px] font-black uppercase text-amber-400 tracking-widest animate-pulse flex items-center justify-center gap-1.5">
                        <Flame size={12} className="animate-bounce" /> Kovám výbavu...
                      </p>
                      <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-100 rounded-full"
                          style={{ width: `${craftingProgress}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">{craftingProgress}% dokončeno</span>
                    </div>
                  ) : showSuccessTick ? (
                    <div className="bg-emerald-950/20 p-3 rounded-xl border border-emerald-500/40 text-center flex flex-col items-center gap-1">
                      <CheckCircle2 size={24} className="text-emerald-400 animate-bounce" />
                      <p className="text-[11px] font-black uppercase text-emerald-400 tracking-wider">Úspěšně Vykováno!</p>
                      <span className="text-[9px] text-slate-500 font-mono">Předmět vložen do truhly gildy</span>
                    </div>
                  ) : (
                    <>
                      {isAffordable ? (
                        <button
                          onClick={() => handleCraft(selectedRecipe)}
                          className="w-full py-3 px-4 font-black uppercase tracking-wider text-xs rounded-xl border transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-600 active:translate-y-0.5 active:shadow-none shadow-[0_4px_0_#b45309]"
                        >
                          <Wrench size={14} /> Vykovat výbavu
                        </button>
                      ) : quickCraftPlan ? (
                        <button
                          onClick={() => handleQuickCraft(selectedRecipe, quickCraftPlan)}
                          className="w-full py-3 px-4 font-black uppercase tracking-wider text-xs rounded-xl border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer shadow-md bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-700 active:translate-y-0.5 active:shadow-none shadow-[0_4px_0_#4338ca]"
                        >
                          <div className="flex items-center gap-2">
                            <Zap size={14} className="text-amber-300" /> Rychlé vykování
                          </div>
                          <div className="text-[9px] font-normal opacity-80 normal-case flex items-center gap-1 text-indigo-200">
                            (Vyrobí chybějící suroviny: celkem +{quickCraftPlan.extraGoldNeeded}g)
                          </div>
                        </button>
                      ) : (
                        <button
                          disabled
                          className="w-full py-3 px-4 font-black uppercase tracking-wider text-xs rounded-xl border transition-all flex items-center justify-center gap-2 cursor-not-allowed shadow-md bg-slate-800 text-slate-600 border-slate-800 opacity-50"
                        >
                          <Wrench size={14} /> Vykovat výbavu
                        </button>
                      )}
                    </>
                  )}

                  <div className="flex gap-2 items-center justify-center text-[10px] font-bold text-slate-500 text-center">
                    <Info size={11} className="text-slate-500 shrink-0" />
                    <span>Nové předměty najdete ve Skladu Gildy.</span>
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-20 text-slate-500 gap-2 h-full italic">
                <BookOpen size={32} className="text-slate-600 animate-pulse" />
                <p className="text-xs font-bold">Vyberte si nákres ze seznamu vlevo k zobrazení podrobností.</p>
              </div>
            )
          ) : (
            /* PROCESSING DETAIL PANEL */
            selectedIntermediate ? (
              <div className="flex flex-col h-full justify-between gap-4">
                
                <div className="space-y-4">
                  
                  {/* Visual Banner */}
                  <div className="p-4 rounded-xl border-2 border-slate-700 bg-slate-900/40 flex flex-col items-center text-center gap-2">
                    <div className="w-14 h-14 bg-slate-950/50 rounded-xl border border-slate-700/40 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                      {selectedIntermediate.icon}
                    </div>
                    <div>
                      <h3 className="font-black text-sm uppercase text-white tracking-wider">{selectedIntermediate.name}</h3>
                      <p className="text-[9px] font-mono font-black uppercase tracking-widest text-slate-400 mt-0.5">
                        Zpracování surovin (Zisk: {selectedIntermediate.yieldCount}x)
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <p className="text-[11px] text-slate-400 italic leading-relaxed text-center font-medium bg-slate-950/40 px-3 py-2 rounded-lg border border-slate-950">
                      "{selectedIntermediate.description}"
                    </p>
                  </div>

                  {/* Materials Breakdown Details */}
                  <div className="bg-slate-950/20 p-3 rounded-lg border border-slate-800/80">
                    <div className="flex justify-between items-center mb-2">
                      <h5 className="text-[9px] font-black uppercase tracking-wider text-slate-400">Potřebné suroviny</h5>
                      <div className="flex items-center gap-1 bg-slate-900 rounded p-0.5 border border-slate-700">
                        <button 
                          onClick={() => setProcessMultiplier(Math.max(1, processMultiplier - 1))}
                          className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-[10px] text-slate-300 transition-colors"
                        >-</button>
                        <span className="text-[10px] font-mono font-bold text-amber-400 px-1">{processMultiplier}x</span>
                        <button 
                          onClick={() => setProcessMultiplier(processMultiplier + 1)}
                          className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-[10px] text-slate-300 transition-colors"
                        >+</button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 font-mono text-xs font-bold">
                      {/* Gold requirement */}
                      <div className="flex justify-between items-center text-slate-300">
                        <span className="flex items-center gap-1.5"><Coins size={12} className="text-amber-400" /> Poplatek kováři:</span>
                        <span className={cn(
                          gameState.gold >= selectedIntermediate.costGold * processMultiplier ? "text-emerald-400" : "text-rose-400"
                        )}>
                          {selectedIntermediate.costGold * processMultiplier} / {gameState.gold}g
                        </span>
                      </div>

                      {/* Raw ingredients */}
                      <div className="border-t border-slate-800/80 pt-2 space-y-1">
                        {Object.entries(selectedIntermediate.costRaw).map(([rawKey, amount]) => {
                          const rKey = rawKey as keyof MaterialsInventory;
                          const hasAmount = (materialsInventory[rKey] || 0);
                          const totalNeeded = ((amount as number) || 0) * processMultiplier;
                          const isEnough = hasAmount >= totalNeeded;
                          
                          const rawFullNames: Record<string, string> = {
                            ironOre: '⛏️ Železná ruda',
                            rawHide: '🐾 Surová kůže',
                            oakWood: '🌲 Dubové dřevo',
                            manaCrystal: '🔮 Magický krystal'
                          };
                          
                          return (
                            <div key={rawKey} className="flex justify-between items-center text-slate-300">
                              <span>{rawFullNames[rawKey] || rawKey}:</span>
                              <span className={isEnough ? "text-emerald-400" : "text-rose-400"}>
                                {totalNeeded} / {hasAmount} ks
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action button or Progress bar */}
                <div className="space-y-2 mt-auto">
                  {processingProgress !== null ? (
                    <div className="bg-slate-950 p-3 rounded-xl border border-amber-500/20 text-center space-y-2">
                      <p className="text-[10px] font-black uppercase text-amber-400 tracking-widest animate-pulse flex items-center justify-center gap-1.5">
                        <Flame size={12} className="animate-bounce" /> Zpracovávám suroviny...
                      </p>
                      <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-100 rounded-full"
                          style={{ width: `${processingProgress}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">{processingProgress}% dokončeno</span>
                    </div>
                  ) : showProcessingSuccess ? (
                    <div className="bg-emerald-950/20 p-3 rounded-xl border border-emerald-500/40 text-center flex flex-col items-center gap-1">
                      <CheckCircle2 size={24} className="text-emerald-400 animate-bounce" />
                      <p className="text-[11px] font-black uppercase text-emerald-400 tracking-wider">Úspěšně Vyrobeno!</p>
                      <span className="text-[9px] text-slate-500 font-mono">Polotovary vloženy do skladu</span>
                    </div>
                  ) : (
                    <button
                      disabled={!canAffordIntermediate(selectedIntermediate, processMultiplier)}
                      onClick={() => handleProcess(selectedIntermediate)}
                      className={cn(
                        "w-full py-3 px-4 font-black uppercase tracking-wider text-xs rounded-xl border transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md",
                        canAffordIntermediate(selectedIntermediate, processMultiplier)
                          ? "bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-600 active:translate-y-0.5 active:shadow-none shadow-[0_4px_0_#b45309]"
                          : "bg-slate-800 text-slate-600 border-slate-800 cursor-not-allowed opacity-50"
                      )}
                    >
                      <Wrench size={14} /> Vyrobit {selectedIntermediate.yieldCount * processMultiplier}x {selectedIntermediate.name}
                    </button>
                  )}

                  <div className="flex gap-2 items-center justify-center text-[10px] font-bold text-slate-500 text-center">
                    <Info size={11} className="text-slate-500 shrink-0" />
                    <span>Zpracováním surovin získáte polotovary pro kování výstroje.</span>
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-20 text-slate-500 gap-2 h-full italic">
                <BookOpen size={32} className="text-slate-600 animate-pulse" />
                <p className="text-xs font-bold">Vyberte si polotovar ze seznamu vlevo k zobrazení podrobností.</p>
              </div>
            )
          )}
        </div>

      </div>
    </div>
  );
}
