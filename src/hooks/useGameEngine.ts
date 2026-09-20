import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  GameState, SaveData, Hero, InventoryItem, LogEntry, CompletedQuest, HeroClass,
  ItemRarity, MaterialsInventory, GuildUpgrades, OfflineReport
} from '../types';
import { INITIAL_HEROES } from '../data/constants';
import { generateId } from '../lib/utils';
import {
  totalMaterials, recruitCost, healCost, guildUpgradeCost, GUILD_UPGRADE_MAX_LEVEL,
  effectiveQuestDuration, renownFromRun, renownBonus
} from '../game/rules';
import { resolveQuest, addMaterials, questBoard } from '../game/quests';
import { applyOfflineProgress, describeOfflineReport } from '../game/offline';

const SAVE_KEY = 'guild_master_save';
const SAVE_VERSION = 3;

const DEFAULT_MATERIALS_INVENTORY: MaterialsInventory = {
  ironOre: 8,
  rawHide: 6,
  oakWood: 10,
  manaCrystal: 3,
  ironBar: 2,
  leatherStrap: 2,
  steelNail: 4,
  processedPlank: 2
};

const DEFAULT_UPGRADES: GuildUpgrades = { treasury: 0, warehouse: 0, trainingGround: 0 };

export { totalMaterials, recruitCost, healCost, guildUpgradeCost, GUILD_UPGRADE_MAX_LEVEL, effectiveQuestDuration };

const log = (message: string, type: LogEntry['type'] = 'info'): LogEntry => ({
  id: generateId(), message, timestamp: Date.now(), type
});

/**
 * Sladí vývěsku s aktuálními úrovněmi hrdinů.
 *
 * Nabídka úkolů je odvozená od nejlepšího hrdiny, takže se musí přepočítat
 * pokaždé, když někdo povýší – ať už za běhu hry, nebo při offline dopočtu.
 */
const withQuestBoard = (state: GameState): GameState => ({
  ...state,
  availableQuests: questBoard(state.heroes)
});

/** Zaloguje zprávu do deníku a ořízne historii na posledních 50 záznamů. */
const withLog = (state: GameState, message: string, type: LogEntry['type'] = 'info'): GameState => ({
  ...state,
  logs: [log(message, type), ...state.logs].slice(0, 50)
});

const createNewGame = (): GameState => {
  const heroes = INITIAL_HEROES.map(h => ({ ...h, equipment: { ...h.equipment } }));
  return {
    gold: 150,
    materialsInventory: { ...DEFAULT_MATERIALS_INVENTORY },
    heroes,
    inventory: [],
    availableQuests: questBoard(heroes),
    logs: [log('Vítejte v Guild Master! Vaše gilda je otevřena. Kovářská dílna je připravena k práci!')],
    completedQuests: [],
    upgrades: { ...DEFAULT_UPGRADES },
    renown: 0,
    prestigeCount: 0,
    offlineReport: null
  };
};

/**
 * Převede libovolný starší save na aktuální podobu. Každý krok migrace je
 * aditivní – chybějící pole se doplní z výchozích hodnot, neznámá se zahodí.
 * Díky tomu jde do hry přidávat obsah, aniž by se rozbil dosavadní postup.
 */
const migrateSave = (raw: unknown): GameState => {
  const fresh = createNewGame();
  if (!raw || typeof raw !== 'object') return fresh;
  const parsed = raw as Partial<SaveData> & { materials?: number };

  const materialsInventory: MaterialsInventory = {
    ...DEFAULT_MATERIALS_INVENTORY,
    ...(parsed.materialsInventory || {})
  };

  // Elara (hero_2) byla z hry odebrána – vyřadit ji i ze starých savů.
  const heroes: Hero[] = Array.isArray(parsed.heroes)
    ? parsed.heroes.filter(h => h && h.id !== 'hero_2').map(h => ({ ...h, autoRepeat: h.autoRepeat ?? false }))
    : fresh.heroes;

  return {
    gold: typeof parsed.gold === 'number' ? parsed.gold : fresh.gold,
    materialsInventory,
    heroes,
    inventory: Array.isArray(parsed.inventory) ? parsed.inventory : [],
    // Katalog úkolů se záměrně nebere ze savu, ale skládá se z konstant a
    // generovaných smluv, aby se nový obsah objevil i rozehraným gildám.
    availableQuests: questBoard(heroes),
    logs: Array.isArray(parsed.logs) ? parsed.logs : fresh.logs,
    completedQuests: Array.isArray(parsed.completedQuests) ? parsed.completedQuests : [],
    upgrades: { ...DEFAULT_UPGRADES, ...(parsed.upgrades || {}) },
    renown: typeof parsed.renown === 'number' ? parsed.renown : 0,
    prestigeCount: typeof parsed.prestigeCount === 'number' ? parsed.prestigeCount : 0,
    offlineReport: null
  };
};

const loadGame = (): GameState => {
  const saved = localStorage.getItem(SAVE_KEY);
  if (!saved) return createNewGame();
  try {
    const raw = JSON.parse(saved);
    const migrated = migrateSave(raw);
    // Dopočítat, co se stihlo odehrát, než hráč hru zase otevřel.
    const savedAt = typeof raw?.savedAt === 'number' ? raw.savedAt : Date.now();
    const { state, report } = applyOfflineProgress(migrated, Date.now(), savedAt);
    // Hrdinové mohli mezitím povýšit, takže vývěska potřebuje přepočítat.
    const synced = withQuestBoard(state);
    if (!report) return synced;
    return withLog({ ...synced, offlineReport: report }, describeOfflineReport(report), 'success');
  } catch (e) {
    console.error('Uložený postup se nepodařilo načíst, začínáme znovu.', e);
    return createNewGame();
  }
};

const persist = (state: GameState) => {
  const { availableQuests: _quests, offlineReport: _report, ...persisted } = state;
  const payload: SaveData = { ...persisted, version: SAVE_VERSION, savedAt: Date.now() };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    return true;
  } catch (e) {
    console.error('Uložení postupu selhalo.', e);
    return false;
  }
};

export function useGameEngine() {
  const [gameState, setGameState] = useState<GameState>(loadGame);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    setGameState(prev => ({
      ...prev,
      logs: [{ id: generateId(), message, timestamp: Date.now(), type }, ...prev.logs].slice(0, 50)
    }));
  }, []);

  // Save game
  useEffect(() => {
    persist(gameState);
  }, [gameState]);

  const equipItem = useCallback((heroId: string, itemInstanceId: string, slot: 'weapon' | 'armor') => {
    setGameState(prev => {
      const hero = prev.heroes.find(h => h.id === heroId);
      const itemIndex = prev.inventory.findIndex(i => i.instanceId === itemInstanceId);
      if (!hero || itemIndex === -1 || hero.status !== 'idle') return prev;

      const item = prev.inventory[itemIndex];
      if (item.type !== slot) return prev; // Type mismatch

      const newInventory = [...prev.inventory];
      newInventory.splice(itemIndex, 1);

      const currentlyEquipped = hero.equipment[slot];
      if (currentlyEquipped) {
        newInventory.push(currentlyEquipped);
      }

      const newHeroes = prev.heroes.map(h => {
        if (h.id === heroId) {
          return {
            ...h,
            equipment: {
              ...h.equipment,
              [slot]: item
            }
          };
        }
        return h;
      });

      return {
        ...prev,
        inventory: newInventory,
        heroes: newHeroes,
        logs: [{ id: generateId(), message: `${hero.name} vybavil(a) ${item.name}.`, timestamp: Date.now(), type: 'info' }, ...prev.logs].slice(0, 50)
      };
    });
  }, []);

  const unequipItem = useCallback((heroId: string, slot: 'weapon' | 'armor') => {
    setGameState(prev => {
      const hero = prev.heroes.find(h => h.id === heroId);
      if (!hero || hero.status !== 'idle') return prev;

      const item = hero.equipment[slot];
      if (!item) return prev;

      const newHeroes = prev.heroes.map(h => {
        if (h.id === heroId) {
          return { ...h, equipment: { ...h.equipment, [slot]: null } };
        }
        return h;
      });

      return {
        ...prev,
        inventory: [...prev.inventory, item],
        heroes: newHeroes,
        logs: [{ id: generateId(), message: `${hero.name} sundal(a) ${item.name}.`, timestamp: Date.now(), type: 'info' }, ...prev.logs].slice(0, 50)
      };
    });
  }, []);

  const startQuest = useCallback((heroId: string, questId: string) => {
    setGameState(prev => {
      const hero = prev.heroes.find(h => h.id === heroId);
      const quest = prev.availableQuests.find(q => q.id === questId);
      
      if (!hero || !quest || hero.status !== 'idle') return prev;

      const newHeroes = prev.heroes.map(h => 
        h.id === heroId 
          ? { ...h, status: 'questing' as const, activeQuestId: questId, questStartTime: Date.now() } 
          : h
      );

      return {
        ...prev,
        heroes: newHeroes,
        logs: [{ id: generateId(), message: `${hero.name} vyrazil(a) na úkol: ${quest.name}.`, timestamp: Date.now(), type: 'info' }, ...prev.logs].slice(0, 50)
      };
    });
  }, []);

  /**
   * Dokončí výpravu hrdiny. Samotný výpočet dělá čistá `resolveQuest`, tady se
   * výsledek jen zanese do stavu gildy – a hrdina se zapnutým opakováním
   * rovnou vyráží na stejnou výpravu znovu.
   */
  const completeQuest = useCallback((heroId: string) => {
    setGameState(prev => {
      const hero = prev.heroes.find(h => h.id === heroId);
      if (!hero || hero.status !== 'questing' || !hero.activeQuestId) return prev;

      const quest = prev.availableQuests.find(q => q.id === hero.activeQuestId);
      if (!quest) return prev;

      const outcome = resolveQuest(hero, quest, { upgrades: prev.upgrades, renown: prev.renown });

      const record: CompletedQuest = {
        id: generateId(),
        questId: quest.id,
        questName: quest.name,
        heroId: hero.id,
        heroName: hero.name,
        completedAt: Date.now(),
        success: outcome.success,
        xpEarned: outcome.xpEarned,
        goldEarned: outcome.goldEarned,
        materialsEarned: outcome.materialsEarned,
        manaCrystalsEarned: outcome.materials.manaCrystal,
        lootItem: outcome.loot
      };

      let updatedHero = outcome.hero;
      // Automatické opakování: živý hrdina se sám vrací na stejnou výpravu.
      const repeats = Boolean(hero.autoRepeat) && updatedHero.status === 'idle';
      if (repeats) {
        updatedHero = {
          ...updatedHero,
          status: 'questing',
          activeQuestId: quest.id,
          questStartTime: Date.now()
        };
      }

      const heroes = prev.heroes.map(h => (h.id === heroId ? updatedHero : h));
      // Vývěska se přepočítá, aby po postupu na úroveň přibyly nové smlouvy.
      const next: GameState = withQuestBoard({
        ...prev,
        heroes,
        completedQuests: [record, ...(prev.completedQuests || [])].slice(0, 50)
      });

      if (!outcome.success) {
        return withLog(
          next,
          `${hero.name} selhal(a) při plnění úkolu ${quest.name} a ztratil(a) ${outcome.hpLost} HP.`,
          'warning'
        );
      }

      const materialNames: string[] = [];
      if (outcome.materials.ironOre > 0) materialNames.push(`${outcome.materials.ironOre}x Železná ruda`);
      if (outcome.materials.rawHide > 0) materialNames.push(`${outcome.materials.rawHide}x Surová kůže`);
      if (outcome.materials.oakWood > 0) materialNames.push(`${outcome.materials.oakWood}x Dubové dřevo`);
      if (outcome.materials.manaCrystal > 0) materialNames.push(`${outcome.materials.manaCrystal}x Magický krystal`);

      const materialsText = materialNames.length > 0 ? ` a suroviny (${materialNames.join(', ')})` : '';
      const lootText = outcome.loot ? ` a našel(a) ${outcome.loot.name}` : '';
      const levelText = outcome.levelsGained > 0 ? ` ${hero.name} dosáhl(a) úrovně ${updatedHero.level}!` : '';

      return withLog(
        {
          ...next,
          gold: prev.gold + outcome.goldEarned,
          materialsInventory: addMaterials(prev.materialsInventory, outcome.materials),
          inventory: outcome.loot ? [...prev.inventory, outcome.loot] : prev.inventory
        },
        `${hero.name} úspěšně dokončil(a) úkol ${quest.name}! Získal(a) ${outcome.goldEarned} zlata, ${outcome.xpEarned} XP${materialsText}${lootText}.${levelText}`,
        'success'
      );
    });
  }, []);

  /** Zapne/vypne automatické opakování výpravy u hrdiny. */
  const toggleAutoRepeat = useCallback((heroId: string) => {
    setGameState(prev => {
      const hero = prev.heroes.find(h => h.id === heroId);
      if (!hero) return prev;
      const enabled = !hero.autoRepeat;
      return withLog(
        { ...prev, heroes: prev.heroes.map(h => (h.id === heroId ? { ...h, autoRepeat: enabled } : h)) },
        enabled
          ? `${hero.name} bude výpravy opakovat automaticky.`
          : `${hero.name} se po návratu z výpravy ohlásí v gildě.`
      );
    });
  }, []);

  const healHero = useCallback((heroId: string) => {
    setGameState(prev => {
      const hero = prev.heroes.find(h => h.id === heroId);
      if (!hero || hero.status === 'questing') return prev;
      if (hero.currentHp === hero.maxHp && hero.status !== 'dead') return prev;

      const cost = healCost(hero);
      if (prev.gold < cost) return prev;

      return withLog(
        {
          ...prev,
          gold: prev.gold - cost,
          heroes: prev.heroes.map(h =>
            h.id === heroId ? { ...h, currentHp: h.maxHp, status: h.status === 'dead' ? 'idle' : h.status } : h
          )
        },
        hero.status === 'dead'
          ? `${hero.name} byl(a) přiveden(a) zpět mezi živé za ${cost} zlata.`
          : `${hero.name} byl(a) vyléčen(a) za ${cost} zlata.`
      );
    });
  }, []);

  const sellItem = useCallback((itemInstanceId: string) => {
    setGameState(prev => {
      const itemIndex = prev.inventory.findIndex(i => i.instanceId === itemInstanceId);
      if (itemIndex === -1) return prev;
      const item = prev.inventory[itemIndex];
      const newInventory = [...prev.inventory];
      newInventory.splice(itemIndex, 1);
      return {
        ...prev,
        inventory: newInventory,
        gold: prev.gold + item.value,
        logs: [{ id: generateId(), message: `Předmět ${item.name} byl prodán za ${item.value} zlata.`, timestamp: Date.now(), type: 'info' }, ...prev.logs].slice(0, 50)
      };
    });
  }, []);

  const createHero = useCallback((name: string, heroClass: HeroClass, icon: string) => {
    setGameState(prev => {
      const cost = recruitCost(prev.heroes.length);
      if (prev.gold < cost) return prev;
      let maxHp = 40;
      let baseAttack = 10;
      let baseDefense = 3;
      let classLabel = 'Hrdina';
      if (heroClass === 'warrior') {
        maxHp = 50; baseAttack = 8; baseDefense = 5; classLabel = 'Válečník';
      } else if (heroClass === 'mage') {
        maxHp = 30; baseAttack = 12; baseDefense = 2; classLabel = 'Mág';
      } else if (heroClass === 'rogue') {
        maxHp = 40; baseAttack = 10; baseDefense = 3; classLabel = 'Tulák';
      }
      const newHero: Hero = {
        id: generateId(),
        name,
        heroClass,
        icon,
        level: 1,
        xp: 0,
        maxHp,
        currentHp: maxHp,
        baseAttack,
        baseDefense,
        equipment: { weapon: null, armor: null },
        status: 'idle',
        activeQuestId: null,
        questStartTime: null,
        autoRepeat: false
      };
      return withLog(
        { ...prev, gold: prev.gold - cost, heroes: [...prev.heroes, newHero] },
        `Do gildy byl najat nový hrdina: ${name} (${classLabel}) za ${cost} zlata.`,
        'success'
      );
    });
  }, []);

  const deleteHero = useCallback((heroId: string) => {
    setGameState(prev => {
      const hero = prev.heroes.find(h => h.id === heroId);
      if (!hero) return prev;
      if (hero.status === 'questing') return prev; // Cannot delete a hero on active quest

      const returnedItems: InventoryItem[] = [];
      if (hero.equipment.weapon) returnedItems.push(hero.equipment.weapon);
      if (hero.equipment.armor) returnedItems.push(hero.equipment.armor);

      return {
        ...prev,
        heroes: prev.heroes.filter(h => h.id !== heroId),
        inventory: [...prev.inventory, ...returnedItems],
        logs: [{ id: generateId(), message: `Hrdina ${hero.name} opustil gildu.${returnedItems.length > 0 ? ' Jeho vybavení bylo vráceno do truhly.' : ''}`, timestamp: Date.now(), type: 'warning' }, ...prev.logs].slice(0, 50)
      };
    });
  }, []);

  const renameHero = useCallback((heroId: string, newName: string) => {
    setGameState(prev => {
      const hero = prev.heroes.find(h => h.id === heroId);
      if (!hero || !newName.trim()) return prev;
      const oldName = hero.name;
      return {
        ...prev,
        heroes: prev.heroes.map(h => h.id === heroId ? { ...h, name: newName.trim() } : h),
        logs: [{ id: generateId(), message: `Hrdina ${oldName} byl přejmenován na ${newName.trim()}.`, timestamp: Date.now(), type: 'info' }, ...prev.logs].slice(0, 50)
      };
    });
  }, []);

  const updateHeroStory = useCallback((heroId: string, story: string) => {
    setGameState(prev => {
      return {
        ...prev,
        heroes: prev.heroes.map(h => h.id === heroId ? { ...h, story } : h)
      };
    });
  }, []);

  const craftItem = useCallback((
    name: string, 
    type: 'weapon' | 'armor', 
    rarity: ItemRarity, 
    attack: number, 
    defense: number, 
    value: number, 
    costMaterials: Partial<MaterialsInventory>, 
    costGold: number
  ) => {
    setGameState(prev => {
      if (prev.gold < costGold) return prev;
      
      const newMaterialsInventory = { ...prev.materialsInventory };
      for (const [key, amount] of Object.entries(costMaterials)) {
        const mKey = key as keyof MaterialsInventory;
        const val = amount as number;
        if ((newMaterialsInventory[mKey] || 0) < (val || 0)) {
          return prev;
        }
        newMaterialsInventory[mKey] -= (val || 0);
      }
      
      const isMasterwork = Math.random() < 0.15;
      const finalAttack = isMasterwork && type === 'weapon' ? attack + Math.floor(attack * 0.25) + 3 : attack;
      const finalDefense = isMasterwork && type === 'armor' ? defense + Math.floor(defense * 0.25) + 3 : defense;
      const finalValue = isMasterwork ? value * 2 : value;
      const finalName = isMasterwork ? `✨ Mistrovský: ${name}` : name;

      const newItem: InventoryItem = {
        id: `crafted_${generateId()}`,
        instanceId: generateId(),
        name: finalName,
        type,
        rarity,
        attack: finalAttack,
        defense: finalDefense,
        value: finalValue
      };
      
      return {
        ...prev,
        materialsInventory: newMaterialsInventory,
        gold: prev.gold - costGold,
        inventory: [newItem, ...prev.inventory],
        logs: [{
          id: generateId(),
          message: isMasterwork ? `✨ Kritický úspěch! Kovář vykoval '${finalName}' za ${costGold} zlata!` : `🔨 Kovář: Předmět '${name}' byl úspěšně vykován v dílně za ${costGold} zlata!`,
          timestamp: Date.now(),
          type: 'success'
        }, ...prev.logs].slice(0, 50)
      };
    });
  }, []);

  const craftMaterial = useCallback((
    materialKey: keyof MaterialsInventory, 
    costRaw: Partial<MaterialsInventory>, 
    costGold: number, 
    yieldCount: number
  ) => {
    setGameState(prev => {
      if (prev.gold < costGold) return prev;
      
      const newMaterialsInventory = { ...prev.materialsInventory };
      for (const [key, amount] of Object.entries(costRaw)) {
        const mKey = key as keyof MaterialsInventory;
        const val = amount as number;
        if ((newMaterialsInventory[mKey] || 0) < (val || 0)) {
          return prev;
        }
        newMaterialsInventory[mKey] -= (val || 0);
      }
      
      newMaterialsInventory[materialKey] += yieldCount;

      const matNames: Record<keyof MaterialsInventory, string> = {
        ironOre: 'Železná ruda',
        rawHide: 'Surová kůže',
        oakWood: 'Dubové dřevo',
        manaCrystal: 'Magický krystal',
        ironBar: 'Železný prut',
        leatherStrap: 'Kožený pásek',
        steelNail: 'Ocelový hřebík',
        processedPlank: 'Zpracované prkno'
      };
      
      return {
        ...prev,
        gold: prev.gold - costGold,
        materialsInventory: newMaterialsInventory,
        logs: [{
          id: generateId(),
          message: `⚒️ Kovář zpracoval suroviny a vyrobil: ${yieldCount}x ${matNames[materialKey]}!`,
          timestamp: Date.now(),
          type: 'success'
        }, ...prev.logs].slice(0, 50)
      };
    });
  }, []);

  /** Koupí další stupeň vylepšení gildy – hlavní odběr zlata v pozdní hře. */
  const buyUpgrade = useCallback((key: keyof GuildUpgrades) => {
    setGameState(prev => {
      const level = prev.upgrades[key];
      if (level >= GUILD_UPGRADE_MAX_LEVEL) return prev;
      const cost = guildUpgradeCost(level);
      if (prev.gold < cost) return prev;

      const labels: Record<keyof GuildUpgrades, string> = {
        treasury: 'Pokladnice',
        warehouse: 'Sklad',
        trainingGround: 'Cvičiště'
      };

      return withLog(
        {
          ...prev,
          gold: prev.gold - cost,
          upgrades: { ...prev.upgrades, [key]: level + 1 }
        },
        `🏛️ ${labels[key]} gildy povýšena na stupeň ${level + 1} za ${cost} zlata.`,
        'success'
      );
    });
  }, []);

  /**
   * Rozpustí gildu výměnou za slávu. Hrdinové, truhla i zlato se ztratí,
   * sláva ale trvale zvyšuje výnosy všech budoucích gild.
   */
  const prestige = useCallback(() => {
    setGameState(prev => {
      const gained = renownFromRun(prev.heroes);
      if (gained <= 0) return prev;
      if (!window.confirm(
        `Rozpustit gildu a získat ${gained} slávy?\n\n` +
        'Přijdete o hrdiny, vybavení, suroviny i zlato. Vylepšení gildy zůstávají. ' +
        `Sláva trvale zvýší všechny výnosy (nově celkem +${Math.round(renownBonus(prev.renown + gained) * 100)} %).`
      )) return prev;

      const fresh = createNewGame();
      return withLog(
        {
          ...fresh,
          upgrades: prev.upgrades,
          renown: prev.renown + gained,
          prestigeCount: prev.prestigeCount + 1,
          logs: prev.logs
        },
        `👑 Gilda byla rozpuštěna po ${prev.prestigeCount + 1}. období. Získáno ${gained} slávy – nové výnosy +${Math.round(renownBonus(prev.renown + gained) * 100)} %.`,
        'success'
      );
    });
  }, []);

  /** Zavře uvítací přehled offline postupu. */
  const dismissOfflineReport = useCallback(() => {
    setGameState(prev => (prev.offlineReport ? { ...prev, offlineReport: null } : prev));
  }, []);

  // Herní smyčka – dokončuje výpravy, kterým vypršela doba trvání.
  // Porovnává se s reálným časem, takže výprava doběhne i po znovunačtení
  // stránky nebo když prohlížeč zpomalí časovače na pozadí.
  const stateRef = useRef(gameState);
  stateRef.current = gameState;

  useEffect(() => {
    const interval = setInterval(() => {
      const state = stateRef.current;
      const now = Date.now();
      state.heroes.forEach(hero => {
        if (hero.status !== 'questing' || !hero.activeQuestId || hero.questStartTime == null) return;
        const quest = state.availableQuests.find(q => q.id === hero.activeQuestId);
        if (quest && now - hero.questStartTime >= effectiveQuestDuration(quest, state.upgrades)) {
          completeQuest(hero.id);
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [completeQuest]);


  const resetGame = useCallback(() => {
    if (window.confirm("Opravdu chcete vymazat veškerý postup? Hra se restartuje do výchozího nastavení.")) {
      localStorage.removeItem(SAVE_KEY);
      window.location.reload();
    }
  }, []);

  const forceSave = useCallback(() => {
    alert(persist(gameState)
      ? 'Hra byla úspěšně uložena!'
      : 'Hru se nepodařilo uložit – úložiště prohlížeče je plné nebo nedostupné.');
  }, [gameState]);

  /** Odvozené hodnoty, které potřebuje rozhraní na víc místech. */
  const derived = useMemo(() => ({
    materialCount: totalMaterials(gameState.materialsInventory),
    nextRecruitCost: recruitCost(gameState.heroes.length),
    renownBonusPercent: Math.round(renownBonus(gameState.renown) * 100),
    pendingRenown: renownFromRun(gameState.heroes)
  }), [gameState.materialsInventory, gameState.heroes, gameState.renown]);

  return {
    gameState,
    derived,
    equipItem,
    unequipItem,
    resetGame,
    forceSave,
    startQuest,
    healHero,
    sellItem,
    createHero,
    deleteHero,
    renameHero,
    updateHeroStory,
    craftItem,
    craftMaterial,
    toggleAutoRepeat,
    buyUpgrade,
    prestige,
    dismissOfflineReport
  };
}

export type GameEngine = ReturnType<typeof useGameEngine>;
