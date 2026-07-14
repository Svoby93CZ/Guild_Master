import { ItemTemplate, Quest, Hero } from '../types';

export const ITEM_TEMPLATES: Record<string, ItemTemplate> = {
  'sword_1': { id: 'sword_1', name: 'Rezavý meč', type: 'weapon', rarity: 'common', attack: 5, defense: 0, value: 10 },
  'sword_2': { id: 'sword_2', name: 'Železný dlouhý meč', type: 'weapon', rarity: 'uncommon', attack: 12, defense: 0, value: 35 },
  'sword_3': { id: 'sword_3', name: 'Ocelový obouruční meč', type: 'weapon', rarity: 'rare', attack: 25, defense: -2, value: 100 },
  'dagger_1': { id: 'dagger_1', name: 'Oštípaná dýka', type: 'weapon', rarity: 'common', attack: 3, defense: 0, value: 8 },
  'dagger_2': { id: 'dagger_2', name: "Čepel vraha", type: 'weapon', rarity: 'rare', attack: 18, defense: 0, value: 120 },
  'staff_1': { id: 'staff_1', name: 'Dřevěná hůl', type: 'weapon', rarity: 'common', attack: 4, defense: 1, value: 12 },
  'staff_2': { id: 'staff_2', name: 'Hůlka učedníka', type: 'weapon', rarity: 'uncommon', attack: 10, defense: 0, value: 40 },
  'armor_1': { id: 'armor_1', name: 'Roztrhaná tunika', type: 'armor', rarity: 'common', attack: 0, defense: 2, value: 5 },
  'armor_2': { id: 'armor_2', name: 'Kožená vesta', type: 'armor', rarity: 'uncommon', attack: 0, defense: 8, value: 30 },
  'armor_3': { id: 'armor_3', name: 'Železný kyrys', type: 'armor', rarity: 'rare', attack: 0, defense: 15, value: 150 },
  'robe_1': { id: 'robe_1', name: 'Róba nováčka', type: 'armor', rarity: 'common', attack: 1, defense: 3, value: 15 },
  'robe_2': { id: 'robe_2', name: 'Magické hedvábí', type: 'armor', rarity: 'uncommon', attack: 3, defense: 6, value: 50 },
};

export const INITIAL_QUESTS: Quest[] = [
  {
    id: 'quest_1',
    name: 'Vyhubení krys',
    description: 'Sklep místního hostince je zamořen obřími krysami.',
    levelReq: 1,
    durationMs: 5000, // 5 seconds for testing
    difficulty: 5,
    rewards: {
      xp: 20,
      gold: 15,
      materials: 2,
      itemDropChance: 0.3,
      possibleLootIds: ['sword_1', 'dagger_1', 'armor_1']
    }
  },
  {
    id: 'quest_2',
    name: 'Přepadení goblinů',
    description: 'Skupina goblinů útočí na obchodníky na cestě.',
    levelReq: 2,
    durationMs: 15000,
    difficulty: 15,
    rewards: {
      xp: 50,
      gold: 40,
      materials: 5,
      itemDropChance: 0.5,
      possibleLootIds: ['sword_2', 'dagger_1', 'armor_2', 'staff_1']
    }
  },
  {
    id: 'quest_3',
    name: 'Krypta nemrtvých',
    description: 'Ze staré krypty povstávají kostlivci.',
    levelReq: 3,
    durationMs: 30000,
    difficulty: 30,
    rewards: {
      xp: 120,
      gold: 100,
      materials: 12,
      itemDropChance: 0.8,
      possibleLootIds: ['sword_3', 'dagger_2', 'armor_3', 'robe_2']
    }
  }
];

export const INITIAL_HEROES: Hero[] = [
  {
    id: 'hero_1',
    name: 'Grom',
    heroClass: 'warrior',
    level: 1,
    xp: 0,
    maxHp: 50,
    currentHp: 50,
    baseAttack: 8,
    baseDefense: 5,
    equipment: { weapon: null, armor: null },
    status: 'idle',
    activeQuestId: null,
    questStartTime: null
  },
  {
    id: 'hero_2',
    name: 'Elara',
    heroClass: 'mage',
    level: 1,
    xp: 0,
    maxHp: 30,
    currentHp: 30,
    baseAttack: 12,
    baseDefense: 2,
    equipment: { weapon: null, armor: null },
    status: 'idle',
    activeQuestId: null,
    questStartTime: null
  }
];
