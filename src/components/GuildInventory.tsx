import React, { useState, useMemo } from 'react';
import { InventoryItem, ItemRarity, GameState } from '../types';
import { cn } from '../lib/utils';
import { 
  Sword, 
  Shield, 
  Pickaxe, 
  Coins, 
  Search, 
  ArrowUpDown, 
  Grid, 
  List, 
  Trash2, 
  Sparkles, 
  Info,
  Gem,
  Hammer,
  Filter,
  X,
  ShieldAlert
} from 'lucide-react';

interface Props {
  gameState: GameState;
  sellItem: (itemInstanceId: string) => void;
  onDragStart: (e: React.DragEvent, id: string, source: 'inventory' | 'hero', heroId?: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  handleInventoryDrop: (e: React.DragEvent) => void;
  ItemCard: React.ComponentType<{
    item: InventoryItem;
    draggable?: boolean;
    onDragStart?: (e: React.DragEvent) => void;
  }>;
  equipItem?: (heroId: string, itemInstanceId: string, slot: 'weapon' | 'armor') => void;
}

const HeroClassLabels: Record<string, string> = {
  warrior: 'Válečník',
  mage: 'Mág',
  rogue: 'Tulák'
};

type TabType = 'all' | 'weapons' | 'armor' | 'materials';
type SortKey = 'name' | 'value' | 'rarity' | 'attack' | 'defense';
type SortOrder = 'asc' | 'desc';

const RarityLabels: Record<ItemRarity, string> = {
  common: 'Běžné',
  uncommon: 'Neobvyklé',
  rare: 'Vzácné',
  epic: 'Epické',
  legendary: 'Legendární'
};

const RarityColors: Record<ItemRarity, string> = {
  common: 'text-slate-400 border-slate-700 bg-slate-900',
  uncommon: 'text-emerald-400 border-emerald-900 bg-emerald-950/20',
  rare: 'text-blue-400 border-blue-900 bg-blue-950/20',
  epic: 'text-purple-400 border-purple-900 bg-purple-950/20',
  legendary: 'text-amber-400 border-amber-900 bg-amber-950/20 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
};

const RarityWeight: Record<ItemRarity, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 4,
  legendary: 5
};

export default function GuildInventory({ 
  gameState, 
  sellItem, 
  onDragStart, 
  onDragOver, 
  handleInventoryDrop,
  ItemCard,
  equipItem
}: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState<ItemRarity | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortKey>('rarity');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [equippingItemId, setEquippingItemId] = useState<string | null>(null);

  // Computed materials breakdown to make things highly immersive
  const materialsBreakdown = useMemo(() => {
    const total = gameState.materials;
    return {
      wood: Math.floor(total * 0.4),
      iron: Math.floor(total * 0.35),
      herbs: Math.floor(total * 0.15),
      manaCrystals: total - Math.floor(total * 0.4) - Math.floor(total * 0.35) - Math.floor(total * 0.15)
    };
  }, [gameState.materials]);

  // Filter items
  const filteredItems = useMemo(() => {
    return gameState.inventory.filter(item => {
      // Tab filter
      if (activeTab === 'weapons' && item.type !== 'weapon') return false;
      if (activeTab === 'armor' && item.type !== 'armor') return false;
      
      // Search filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesType = (item.type === 'weapon' ? 'zbraň' : 'zbroj').includes(query);
        const matchesRarity = RarityLabels[item.rarity].toLowerCase().includes(query);
        if (!matchesName && !matchesType && !matchesRarity) return false;
      }

      // Rarity filter
      if (rarityFilter !== 'all' && item.rarity !== rarityFilter) return false;

      return true;
    });
  }, [gameState.inventory, activeTab, searchQuery, rarityFilter]);

  // Sort items
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'value') {
        comparison = a.value - b.value;
      } else if (sortBy === 'rarity') {
        comparison = RarityWeight[a.rarity] - RarityWeight[b.rarity];
      } else if (sortBy === 'attack') {
        comparison = a.attack - b.attack;
      } else if (sortBy === 'defense') {
        comparison = a.defense - b.defense;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredItems, sortBy, sortOrder]);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('desc');
    }
  };

  // Bulk sell common items
  const commonItemsCount = useMemo(() => {
    return gameState.inventory.filter(i => i.rarity === 'common').length;
  }, [gameState.inventory]);

  const handleBulkSellCommon = () => {
    const commons = gameState.inventory.filter(i => i.rarity === 'common');
    if (commons.length === 0) return;
    if (window.confirm(`Opravdu chcete prodat všechny běžné předměty (${commons.length} ks)?`)) {
      commons.forEach(item => {
        sellItem(item.instanceId);
      });
    }
  };

  const totalValue = useMemo(() => {
    return gameState.inventory.reduce((sum, item) => sum + item.value, 0);
  }, [gameState.inventory]);

  return (
    <div className="bg-slate-800/40 rounded-2xl border border-slate-700 p-5 flex flex-col h-full overflow-hidden">
      {/* Header and Quick Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4 shrink-0">
        <div>
          <h2 className="text-sm font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
            <Gem size={16} className="text-amber-500 animate-pulse" /> Sklad a Suroviny Gildy
          </h2>
          <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase">
            Správa veškerého bohatství, zbraní a magických zásob vaší gildy.
          </p>
        </div>
        
        {/* Quick info badges */}
        <div className="flex gap-2 text-xs font-mono font-bold">
          <div className="bg-slate-900/80 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-amber-400">
            <Coins size={14} className="text-amber-500" />
            <span>{gameState.gold}g</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-blue-400">
            <Pickaxe size={14} className="text-blue-500" />
            <span>{gameState.materials} ks</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-slate-300">
            <Info size={14} className="text-slate-400" />
            <span>Hodnota: {totalValue}g</span>
          </div>
        </div>
      </div>

      {/* Tabs & Controls */}
      <div className="flex flex-col gap-3 shrink-0 mb-4">
        {/* Category Tabs */}
        <div className="flex border-b border-slate-800 gap-1 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              "px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap",
              activeTab === 'all' 
                ? "text-amber-400 border-amber-400" 
                : "text-slate-500 border-transparent hover:text-slate-300"
            )}
          >
            Vše ({gameState.inventory.length})
          </button>
          <button
            onClick={() => setActiveTab('weapons')}
            className={cn(
              "px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap",
              activeTab === 'weapons' 
                ? "text-amber-400 border-amber-400" 
                : "text-slate-500 border-transparent hover:text-slate-300"
            )}
          >
            <Sword size={12} /> Zbraně ({gameState.inventory.filter(i => i.type === 'weapon').length})
          </button>
          <button
            onClick={() => setActiveTab('armor')}
            className={cn(
              "px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap",
              activeTab === 'armor' 
                ? "text-amber-400 border-amber-400" 
                : "text-slate-500 border-transparent hover:text-slate-300"
            )}
          >
            <Shield size={12} /> Zbroj ({gameState.inventory.filter(i => i.type === 'armor').length})
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={cn(
              "px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap",
              activeTab === 'materials' 
                ? "text-amber-400 border-amber-400" 
                : "text-slate-500 border-transparent hover:text-slate-300"
            )}
          >
            <Pickaxe size={12} /> Suroviny ({gameState.materials})
          </button>
        </div>

        {/* Filters and search (hidden for materials tab) */}
        {activeTab !== 'materials' && (
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Hledat předmět, raritu, typ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all"
              />
            </div>

            {/* Rarity filter */}
            <div className="flex gap-2">
              <div className="relative flex items-center">
                <Filter size={12} className="absolute left-2.5 text-slate-500" />
                <select
                  value={rarityFilter}
                  onChange={(e) => setRarityFilter(e.target.value as ItemRarity | 'all')}
                  className="bg-slate-900 border border-slate-700/80 rounded-xl pl-8 pr-2 py-2 text-[11px] font-bold text-white focus:outline-none focus:border-amber-500 transition-all cursor-pointer appearance-none"
                >
                  <option value="all">Všechny rarity</option>
                  <option value="common">Běžné</option>
                  <option value="uncommon">Neobvyklé</option>
                  <option value="rare">Vzácné</option>
                  <option value="epic">Epické</option>
                  <option value="legendary">Legendární</option>
                </select>
              </div>

              {/* View mode toggle */}
              <div className="flex border border-slate-700/80 bg-slate-900 rounded-xl p-1 shrink-0">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-1 rounded cursor-pointer transition-colors",
                    viewMode === 'grid' ? "bg-amber-500 text-slate-950 font-black" : "text-slate-400 hover:text-slate-200"
                  )}
                  title="Mřížka"
                >
                  <Grid size={14} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-1 rounded cursor-pointer transition-colors",
                    viewMode === 'list' ? "bg-amber-500 text-slate-950 font-black" : "text-slate-400 hover:text-slate-200"
                  )}
                  title="Seznam"
                >
                  <List size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sorting header controls (hidden for materials tab) */}
        {activeTab !== 'materials' && sortedItems.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 bg-slate-950/20 px-3 py-1.5 rounded-lg border border-slate-800/80 text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">
            <span className="flex items-center gap-1 text-[9px]"><ArrowUpDown size={10} /> Seřadit dle:</span>
            <button 
              onClick={() => handleSort('rarity')}
              className={cn("px-2 py-0.5 rounded cursor-pointer hover:bg-slate-800", sortBy === 'rarity' ? "bg-slate-800 text-amber-400" : "text-slate-400")}
            >
              Rarity
            </button>
            <button 
              onClick={() => handleSort('value')}
              className={cn("px-2 py-0.5 rounded cursor-pointer hover:bg-slate-800", sortBy === 'value' ? "bg-slate-800 text-amber-400" : "text-slate-400")}
            >
              Ceny
            </button>
            <button 
              onClick={() => handleSort('name')}
              className={cn("px-2 py-0.5 rounded cursor-pointer hover:bg-slate-800", sortBy === 'name' ? "bg-slate-800 text-amber-400" : "text-slate-400")}
            >
              Název
            </button>
            <button 
              onClick={() => handleSort('attack')}
              className={cn("px-2 py-0.5 rounded cursor-pointer hover:bg-slate-800", sortBy === 'attack' ? "bg-slate-800 text-amber-400" : "text-slate-400")}
            >
              Útok
            </button>
            <button 
              onClick={() => handleSort('defense')}
              className={cn("px-2 py-0.5 rounded cursor-pointer hover:bg-slate-800", sortBy === 'defense' ? "bg-slate-800 text-amber-400" : "text-slate-400")}
            >
              Obrana
            </button>

            {/* Quick action: Bulk Sell */}
            {commonItemsCount > 0 && (
              <button
                onClick={handleBulkSellCommon}
                className="ml-auto text-[9px] bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2 py-0.5 rounded hover:bg-rose-500/20 cursor-pointer flex items-center gap-1 font-black"
              >
                <Trash2 size={10} /> Prodat běžné ({commonItemsCount} ks)
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'materials' ? (
          /* Materials View */
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Construction wood */}
              <div className="bg-slate-900/60 border border-slate-700/60 p-4 rounded-xl flex gap-4 items-center">
                <div className="w-12 h-12 rounded-lg bg-amber-950/30 border border-amber-900/40 flex items-center justify-center text-amber-500 shrink-0">
                  <Hammer size={24} />
                </div>
                <div>
                  <h4 className="font-black text-xs text-white uppercase">Stavební dříví</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Používá se pro rozšiřování cechovních budov.</p>
                  <p className="text-lg font-mono font-black text-amber-400 mt-1">{materialsBreakdown.wood} ks</p>
                </div>
              </div>

              {/* Iron ore */}
              <div className="bg-slate-900/60 border border-slate-700/60 p-4 rounded-xl flex gap-4 items-center">
                <div className="w-12 h-12 rounded-lg bg-slate-950/40 border border-slate-700/40 flex items-center justify-center text-slate-300 shrink-0">
                  <Pickaxe size={24} />
                </div>
                <div>
                  <h4 className="font-black text-xs text-white uppercase">Železná ruda</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Materiál kovářů pro kování zbraní a brnění.</p>
                  <p className="text-lg font-mono font-black text-slate-300 mt-1">{materialsBreakdown.iron} ks</p>
                </div>
              </div>

              {/* Herbs */}
              <div className="bg-slate-900/60 border border-slate-700/60 p-4 rounded-xl flex gap-4 items-center">
                <div className="w-12 h-12 rounded-lg bg-emerald-950/30 border border-emerald-900/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h4 className="font-black text-xs text-white uppercase">Léčivé byliny</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Uplatnění při vaření hojivých lektvarů.</p>
                  <p className="text-lg font-mono font-black text-emerald-400 mt-1">{materialsBreakdown.herbs} ks</p>
                </div>
              </div>

              {/* Mana Crystals */}
              <div className="bg-slate-900/60 border border-slate-700/60 p-4 rounded-xl flex gap-4 items-center">
                <div className="w-12 h-12 rounded-lg bg-blue-950/30 border border-blue-900/40 flex items-center justify-center text-blue-400 shrink-0">
                  <Gem size={24} />
                </div>
                <div>
                  <h4 className="font-black text-xs text-white uppercase">Elementální krystaly</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Koncentrovaná magie k očarování předmětů.</p>
                  <p className="text-lg font-mono font-black text-blue-400 mt-1">{materialsBreakdown.manaCrystals} ks</p>
                </div>
              </div>

            </div>

            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 leading-relaxed flex gap-3">
              <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white">Suroviny jsou uloženy společně v truhle gildy.</span> S přibývajícím množstvím vylepšujících surovin získávají vaši hrdinové lepší vyhlídky na kování a vaření budoucích bájných lektvarů a předmětů. Suroviny získáváte primárně jako odměnu za plnění nebezpečných výprav na tabuli úkolů.
              </div>
            </div>
          </div>
        ) : (
          /* Items List / Grid View */
          <>
            {sortedItems.length === 0 ? (
              <div className="text-center text-slate-600 text-xs py-16 italic flex flex-col items-center justify-center gap-2">
                <Sword size={32} className="text-slate-700 animate-bounce" />
                <span>Nebyly nalezeny žádné předměty odpovídající filtrům.</span>
                <span className="text-[10px]">Vysílejte hrdiny na úkoly, abyste získali vzácnou kořist!</span>
              </div>
            ) : viewMode === 'grid' ? (
              /* Grid Layout */
              <div 
                className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 content-start pb-4"
                onDragOver={onDragOver}
                onDrop={handleInventoryDrop}
              >
                {sortedItems.map(item => (
                  <div key={item.instanceId} className="group relative aspect-square">
                    <ItemCard 
                      item={item} 
                      onDragStart={(e) => onDragStart(e, item.instanceId, 'inventory')}
                    />
                    <button
                      onClick={() => sellItem(item.instanceId)}
                      className="absolute -top-2 -right-2 bg-rose-500 text-white font-black text-[9px] w-6 h-6 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 active:scale-95 z-20 cursor-pointer"
                      title={`Prodat za ${item.value}g`}
                    >
                      <Trash2 size={10} />
                    </button>
                    {equipItem && (
                      <button
                        onClick={() => setEquippingItemId(item.instanceId)}
                        className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[8px] px-2 py-0.5 rounded shadow-[0_2px_0_#4f46e5] opacity-0 group-hover:opacity-100 transition-opacity active:translate-y-0.5 active:shadow-none z-20 cursor-pointer uppercase tracking-wider whitespace-nowrap"
                        title="Nasadit hrdinovi"
                      >
                        Nasadit
                      </button>
                    )}
                  </div>
                ))}
                {/* Empty slots placeholders up to 16 */}
                {gameState.inventory.length < 16 && Array.from({ length: Math.max(0, 16 - sortedItems.length) }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square bg-slate-900/40 rounded-lg border-2 border-dashed border-slate-800"></div>
                ))}
              </div>
            ) : (
              /* List Layout */
              <div 
                className="space-y-2 pb-4"
                onDragOver={onDragOver}
                onDrop={handleInventoryDrop}
              >
                {sortedItems.map(item => (
                  <div 
                    key={item.instanceId}
                    draggable
                    onDragStart={(e) => onDragStart(e, item.instanceId, 'inventory')}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border-2 cursor-grab active:cursor-grabbing transition-all group",
                      item.rarity === 'common' ? "border-slate-700 bg-slate-900 text-slate-300" :
                      item.rarity === 'uncommon' ? "border-emerald-600/30 bg-emerald-950/15 text-emerald-300" :
                      item.rarity === 'rare' ? "border-blue-600/30 bg-blue-950/15 text-blue-300" :
                      item.rarity === 'epic' ? "border-purple-600/30 bg-purple-950/15 text-purple-300" :
                      "border-amber-600/40 bg-amber-950/15 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.05)]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded bg-slate-950/40 border border-slate-800 flex items-center justify-center shrink-0">
                        {item.type === 'weapon' ? <Sword size={16} /> : <Shield size={16} />}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-xs">{item.name}</h4>
                        <div className="flex gap-2 text-[9px] font-mono font-bold text-slate-400 mt-0.5">
                          <span className={cn(
                            "px-1 rounded text-[8px] uppercase",
                            item.rarity === 'common' ? "bg-slate-800 text-slate-400" :
                            item.rarity === 'uncommon' ? "bg-emerald-500/10 text-emerald-400" :
                            item.rarity === 'rare' ? "bg-blue-500/10 text-blue-400" :
                            item.rarity === 'epic' ? "bg-purple-500/10 text-purple-400" :
                            "bg-amber-500/10 text-amber-400"
                          )}>
                            {RarityLabels[item.rarity]}
                          </span>
                          <span>Typ: {item.type === 'weapon' ? 'Zbraň' : 'Zbroj'}</span>
                          {item.attack > 0 && <span className="text-red-400">Útok: +{item.attack}</span>}
                          {item.defense > 0 && <span className="text-emerald-400">Obrana: +{item.defense}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right mr-2">
                        <p className="text-xs font-mono font-black text-amber-400 flex items-center gap-0.5 justify-end">
                          <Coins size={10} /> {item.value}g
                        </p>
                        <p className="text-[8px] text-slate-500 uppercase font-black tracking-wider">Prodejní cena</p>
                      </div>
                      {equipItem && (
                        <button
                          onClick={() => setEquippingItemId(item.instanceId)}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded-lg border border-indigo-700/30 shadow-[0_2px_0_#4f46e5] active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1 cursor-pointer text-[10px] font-black uppercase tracking-wider whitespace-nowrap"
                          title="Nasadit hrdinovi"
                        >
                          <ShieldAlert size={12} /> Nasadit
                        </button>
                      )}
                      <button
                        onClick={() => sellItem(item.instanceId)}
                        className="bg-rose-500 hover:bg-rose-600 text-white p-1.5 rounded-lg border border-rose-600/30 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Prodat předmět"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Equip Hero Selector Modal */}
      {equippingItemId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setEquippingItemId(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
            
            <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 mb-1 flex items-center gap-1.5">
              <Sparkles size={16} /> Nasadit výbavu
            </h3>
            <p className="text-[10px] text-slate-400 font-bold mb-4 uppercase">
              Vyberte hrdinu, kterému chcete nasadit předmět:
            </p>
            
            {/* Item Preview */}
            {(() => {
              const item = gameState.inventory.find(i => i.instanceId === equippingItemId);
              if (!item) return null;
              return (
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 mb-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-center text-white text-lg">
                    {item.type === 'weapon' ? <Sword size={20} /> : <Shield size={20} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs">{item.name}</h4>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {item.type === 'weapon' ? `Útok +${item.attack}` : `Obrana +${item.defense}`}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Heroes List */}
            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
              {gameState.heroes.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-4">Nemáte žádné naverbované hrdiny.</p>
              ) : (
                gameState.heroes.map(hero => {
                  const item = gameState.inventory.find(i => i.instanceId === equippingItemId);
                  if (!item) return null;
                  const currentlyEquipped = item.type === 'weapon' ? hero.equipment.weapon : hero.equipment.armor;
                  
                  return (
                    <button
                      key={hero.id}
                      onClick={() => {
                        if (equipItem) {
                          equipItem(hero.id, item.instanceId, item.type as 'weapon' | 'armor');
                        }
                        setEquippingItemId(null);
                      }}
                      className="w-full text-left p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-500 transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-950 flex items-center justify-center font-bold text-xs text-amber-400">
                          {hero.level}
                        </div>
                        <div>
                          <h5 className="font-bold text-xs text-white group-hover:text-amber-400 transition-colors">{hero.name}</h5>
                          <p className="text-[10px] text-slate-400">
                            {HeroClassLabels[hero.heroClass] || hero.heroClass} • {hero.status === 'idle' ? 'Doma' : 'Na výpravě'}
                          </p>
                        </div>
                      </div>
                      
                      {currentlyEquipped ? (
                        <div className="text-[9px] text-right font-mono text-slate-400 max-w-[120px] truncate">
                          <p className="text-slate-500 text-[8px] uppercase font-bold">Nahradí:</p>
                          <p className="truncate font-black text-rose-400">{currentlyEquipped.name}</p>
                        </div>
                      ) : (
                        <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          Volný slot
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
