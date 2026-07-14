import { useState, useEffect, useCallback } from 'react';
import { GameState, Hero, InventoryItem, LogEntry, Quest, CompletedQuest, HeroClass, ItemRarity, MaterialsInventory } from '../types';
import { INITIAL_HEROES, INITIAL_QUESTS, ITEM_TEMPLATES, XP_TO_LEVEL } from '../data/constants';
import { generateId } from '../lib/utils';

const DEFAULT_MATERIALS_INVENTORY = {
  ironOre: 8,
  rawHide: 6,
  oakWood: 10,
  manaCrystal: 3,
  ironBar: 2,
  leatherStrap: 2,
  steelNail: 4,
  processedPlank: 2
};

const awardRawMaterials = (count: number) => {
  const awarded = { ironOre: 0, rawHide: 0, oakWood: 0, manaCrystal: 0 };
  for (let i = 0; i < count; i++) {
    const r = Math.random();
    if (r < 0.35) {
      awarded.ironOre++;
    } else if (r < 0.65) {
      awarded.oakWood++;
    } else if (r < 0.90) {
      awarded.rawHide++;
    } else {
      awarded.manaCrystal++;
    }
  }
  return awarded;
};

export function useGameEngine() {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem('guild_master_save');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.completedQuests) {
          parsed.completedQuests = [];
        }
        if (!parsed.materialsInventory) {
          parsed.materialsInventory = { ...DEFAULT_MATERIALS_INVENTORY };
        }
        
        // Remove hero_2 (Elara) from existing saves if present
        if (parsed.heroes && Array.isArray(parsed.heroes)) {
          parsed.heroes = parsed.heroes.filter((h: any) => h.id !== 'hero_2');
        }

        return parsed;
      } catch (e) {
        console.error("Failed to load save", e);
      }
    }
    return {
      gold: 150,
      materials: 34,
      materialsInventory: { ...DEFAULT_MATERIALS_INVENTORY },
      heroes: INITIAL_HEROES,
      inventory: [],
      availableQuests: INITIAL_QUESTS,
      logs: [{ id: generateId(), message: 'Vítejte v Guild Master! Vaše gilda je otevřena. Kovářská dílna je připravena k práci!', timestamp: Date.now(), type: 'info' }],
      completedQuests: []
    };
  });

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    setGameState(prev => ({
      ...prev,
      logs: [{ id: generateId(), message, timestamp: Date.now(), type }, ...prev.logs].slice(0, 50)
    }));
  }, []);

  // Save game
  useEffect(() => {
    localStorage.setItem('guild_master_save', JSON.stringify(gameState));
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

  const completeQuest = useCallback((heroId: string) => {
    setGameState(prev => {
      const hero = prev.heroes.find(h => h.id === heroId);
      if (!hero || hero.status !== 'questing' || !hero.activeQuestId) return prev;

      const quest = prev.availableQuests.find(q => q.id === hero.activeQuestId);
      if (!quest) return prev;

      // Calculate total stats
      const totalAttack = hero.baseAttack + (hero.equipment.weapon?.attack || 0) + (hero.equipment.armor?.attack || 0);
      const totalDefense = hero.baseDefense + (hero.equipment.weapon?.defense || 0) + (hero.equipment.armor?.defense || 0);
      
      // Simple combat calculation
      const combatPower = totalAttack + (totalDefense * 0.5);
      const successChance = Math.min(0.95, Math.max(0.1, combatPower / quest.difficulty));
      
      const isSuccess = Math.random() < successChance;
      
      if (!isSuccess) {
         // Failure
         const hpLoss = Math.floor(hero.maxHp * 0.5);
         const newHp = Math.max(0, hero.currentHp - hpLoss);
         
         const failedQuestLog: CompletedQuest = {
           id: generateId(),
           questId: quest.id,
           questName: quest.name,
           heroId: hero.id,
           heroName: hero.name,
           completedAt: Date.now(),
           success: false,
           xpEarned: 0,
           goldEarned: 0,
           materialsEarned: 0
         };

         return {
           ...prev,
           heroes: prev.heroes.map(h => h.id === heroId ? {
             ...h, status: newHp === 0 ? 'dead' : 'idle', activeQuestId: null, questStartTime: null, currentHp: newHp
           } : h),
           completedQuests: [failedQuestLog, ...(prev.completedQuests || [])].slice(0, 50),
           logs: [{ id: generateId(), message: `${hero.name} selhal(a) při plnění úkolu ${quest.name} a ztratil(a) ${hpLoss} HP.`, timestamp: Date.now(), type: 'warning' }, ...prev.logs].slice(0, 50)
         };
      }

      // Success
      let newInventory = [...prev.inventory];
      let droppedItemName = '';
      let lootItem: InventoryItem | undefined = undefined;
      if (Math.random() < quest.rewards.itemDropChance && quest.rewards.possibleLootIds.length > 0) {
        const lootId = quest.rewards.possibleLootIds[Math.floor(Math.random() * quest.rewards.possibleLootIds.length)];
        const template = ITEM_TEMPLATES[lootId];
        if (template) {
          const newItem: InventoryItem = { ...template, instanceId: generateId() };
          newInventory.push(newItem);
          droppedItemName = ` a našel(a) ${template.name}`;
          lootItem = newItem;
        }
      }

      let newXp = hero.xp + quest.rewards.xp;
      let newLevel = hero.level;
      let newMaxHp = hero.maxHp;
      let newBaseAttack = hero.baseAttack;
      let newBaseDefense = hero.baseDefense;
      let levelUpMsg = '';

      if (newLevel < XP_TO_LEVEL.length - 1 && newXp >= XP_TO_LEVEL[newLevel]) {
        newLevel++;
        newMaxHp += 10;
        newBaseAttack += 3;
        newBaseDefense += 2;
        levelUpMsg = ` ${hero.name} dosáhl(a) úrovně ${newLevel}!`;
      }

      const rawMatRewards = awardRawMaterials(quest.rewards.materials);
      const materialsList: string[] = [];
      if (rawMatRewards.ironOre > 0) materialsList.push(`${rawMatRewards.ironOre}x Železná ruda`);
      if (rawMatRewards.rawHide > 0) materialsList.push(`${rawMatRewards.rawHide}x Surová kůže`);
      if (rawMatRewards.oakWood > 0) materialsList.push(`${rawMatRewards.oakWood}x Dubové dřevo`);
      if (rawMatRewards.manaCrystal > 0) materialsList.push(`${rawMatRewards.manaCrystal}x Magický krystal`);
      const materialsString = materialsList.length > 0 ? ` a suroviny (${materialsList.join(', ')})` : '';

      const successfulQuestLog: CompletedQuest = {
        id: generateId(),
        questId: quest.id,
        questName: quest.name,
        heroId: hero.id,
        heroName: hero.name,
        completedAt: Date.now(),
        success: true,
        xpEarned: quest.rewards.xp,
        goldEarned: quest.rewards.gold,
        materialsEarned: quest.rewards.materials,
        manaCrystalsEarned: rawMatRewards.manaCrystal,
        lootItem
      };

      const newMaterialsInventory = { ...prev.materialsInventory };
      newMaterialsInventory.ironOre += rawMatRewards.ironOre;
      newMaterialsInventory.rawHide += rawMatRewards.rawHide;
      newMaterialsInventory.oakWood += rawMatRewards.oakWood;
      newMaterialsInventory.manaCrystal += rawMatRewards.manaCrystal;

      const totalMaterialsSum = (Object.keys(newMaterialsInventory) as Array<keyof MaterialsInventory>).reduce((acc, key) => acc + newMaterialsInventory[key], 0);

      return {
        ...prev,
        gold: prev.gold + quest.rewards.gold,
        materials: totalMaterialsSum,
        materialsInventory: newMaterialsInventory,
        inventory: newInventory,
        heroes: prev.heroes.map(h => h.id === heroId ? {
          ...h, 
          status: 'idle', 
          activeQuestId: null, 
          questStartTime: null,
          xp: newXp,
          level: newLevel,
          maxHp: newMaxHp,
          currentHp: levelUpMsg ? newMaxHp : Math.min(newMaxHp, hero.currentHp + Math.floor(newMaxHp * 0.1)),
          baseAttack: newBaseAttack,
          baseDefense: newBaseDefense
        } : h),
        completedQuests: [successfulQuestLog, ...(prev.completedQuests || [])].slice(0, 50),
        logs: [{ 
          id: generateId(), 
          message: `${hero.name} úspěšně dokončil(a) úkol ${quest.name}! Získal(a) ${quest.rewards.gold} zlata, ${quest.rewards.xp} XP${materialsString}${droppedItemName}.${levelUpMsg}`, 
          timestamp: Date.now(), 
          type: 'success' 
        }, ...prev.logs].slice(0, 50)
      };
    });
  }, []);

  const healHero = useCallback((heroId: string) => {
    const healCost = 20;
    setGameState(prev => {
      const hero = prev.heroes.find(h => h.id === heroId);
      if (!hero || prev.gold < healCost || hero.currentHp === hero.maxHp || hero.status === 'questing') return prev;

      return {
        ...prev,
        gold: prev.gold - healCost,
        heroes: prev.heroes.map(h => h.id === heroId ? { ...h, currentHp: h.maxHp, status: h.status === 'dead' ? 'idle' : h.status } : h),
        logs: [{ id: generateId(), message: `${hero.name} byl(a) vyléčen(a) za ${healCost} zlata.`, timestamp: Date.now(), type: 'info' }, ...prev.logs].slice(0, 50)
      };
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
    const recruitCost = 50;
    setGameState(prev => {
      if (prev.gold < recruitCost) return prev;
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
        questStartTime: null
      };
      return {
        ...prev,
        gold: prev.gold - recruitCost,
        heroes: [...prev.heroes, newHero],
        logs: [{ id: generateId(), message: `Do gildy byl najat nový hrdina: ${name} (${classLabel}) za ${recruitCost} zlata.`, timestamp: Date.now(), type: 'success' }, ...prev.logs].slice(0, 50)
      };
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
      
      const totalMaterialsSum = (Object.keys(newMaterialsInventory) as Array<keyof MaterialsInventory>).reduce((acc, key) => acc + newMaterialsInventory[key], 0);
      
      return {
        ...prev,
        materials: totalMaterialsSum,
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
      
      const totalMaterialsSum = (Object.keys(newMaterialsInventory) as Array<keyof MaterialsInventory>).reduce((acc, key) => acc + newMaterialsInventory[key], 0);
      
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
        materials: totalMaterialsSum,
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

  // Game loop
  useEffect(() => {
    const interval = setInterval(() => {
      setGameState(prev => {
        let hasChanges = false;
        const now = Date.now();
        
        prev.heroes.forEach(hero => {
          if (hero.status === 'questing' && hero.activeQuestId && hero.questStartTime) {
            const quest = prev.availableQuests.find(q => q.id === hero.activeQuestId);
            if (quest && now - hero.questStartTime >= quest.durationMs) {
              hasChanges = true;
            }
          }
        });

        if (hasChanges) {
          // Instead of modifying state here, we'll queue completions
          // We can't easily call completeQuest inside this setGameState safely if we are modifying it.
          // Better approach: just return prev and let a timeout handle it or trigger a ref.
          // For simplicity in React, we'll just return prev and use a separate effect to call completeQuest.
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Check completions
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      gameState.heroes.forEach(hero => {
        if (hero.status === 'questing' && hero.activeQuestId && hero.questStartTime) {
          const quest = gameState.availableQuests.find(q => q.id === hero.activeQuestId);
          if (quest && now - hero.questStartTime >= quest.durationMs) {
            completeQuest(hero.id);
          }
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState.heroes, gameState.availableQuests, completeQuest]);

  return {
    gameState,
    equipItem,
    unequipItem,
    startQuest,
    healHero,
    sellItem,
    createHero,
    deleteHero,
    renameHero,
    craftItem,
    craftMaterial
  };
}
