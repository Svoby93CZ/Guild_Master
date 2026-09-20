import { ItemTemplate, Quest, Hero } from '../types';

export const ITEM_TEMPLATES: Record<string, ItemTemplate> = {
  'sword_1': { id: 'sword_1', name: 'Rezavý meč', type: 'weapon', rarity: 'common', attack: 5, defense: 0, value: 10 },
  'sword_2': { id: 'sword_2', name: 'Železný dlouhý meč', type: 'weapon', rarity: 'uncommon', attack: 12, defense: 0, value: 35 },
  'sword_3': { id: 'sword_3', name: 'Ocelový obouruční meč', type: 'weapon', rarity: 'rare', attack: 25, defense: -2, value: 100 },
  'sword_4': { id: 'sword_4', name: 'Královský drahokamový meč', type: 'weapon', rarity: 'epic', attack: 42, defense: 3, value: 320 },
  'dagger_1': { id: 'dagger_1', name: 'Oštípaná dýka', type: 'weapon', rarity: 'common', attack: 3, defense: 0, value: 8 },
  'dagger_2': { id: 'dagger_2', name: "Čepel vraha", type: 'weapon', rarity: 'rare', attack: 18, defense: 0, value: 120 },
  'staff_1': { id: 'staff_1', name: 'Dřevěná hůl', type: 'weapon', rarity: 'common', attack: 4, defense: 1, value: 12 },
  'staff_2': { id: 'staff_2', name: 'Hůlka učedníka', type: 'weapon', rarity: 'uncommon', attack: 10, defense: 0, value: 40 },
  'staff_3': { id: 'staff_3', name: 'Arcimágova křišťálová hůl', type: 'weapon', rarity: 'epic', attack: 38, defense: 4, value: 350 },
  'armor_1': { id: 'armor_1', name: 'Roztrhaná tunika', type: 'armor', rarity: 'common', attack: 0, defense: 2, value: 5 },
  'armor_2': { id: 'armor_2', name: 'Kožená vesta', type: 'armor', rarity: 'uncommon', attack: 0, defense: 8, value: 30 },
  'armor_3': { id: 'armor_3', name: 'Železný kyrys', type: 'armor', rarity: 'rare', attack: 0, defense: 15, value: 150 },
  'armor_4': { id: 'armor_4', name: 'Dračí šupinové pláty', type: 'armor', rarity: 'epic', attack: 4, defense: 32, value: 420 },
  'robe_1': { id: 'robe_1', name: 'Róba nováčka', type: 'armor', rarity: 'common', attack: 1, defense: 3, value: 15 },
  'robe_2': { id: 'robe_2', name: 'Magické hedvábí', type: 'armor', rarity: 'uncommon', attack: 3, defense: 6, value: 50 },
};

export const INITIAL_QUESTS: Quest[] = [
  {
    id: 'quest_1',
    name: 'Vyhubení krys v hostinci',
    description: 'Sklep místního hostince "U Spícího Draka" je zamořen agresivními obřími krysami.',
    levelReq: 1,
    durationMs: 6000,
    difficulty: 4,
    rewards: {
      xp: 15,
      gold: 12,
      materials: 2,
      itemDropChance: 0.25,
      possibleLootIds: ['sword_1', 'dagger_1', 'armor_1']
    }
  },
  {
    id: 'quest_harvest',
    name: 'Sběr léčivých hub v mlžném lese',
    description: 'Bylinkářka z trhu potřebuje vzácné svítící houby pro přípravu lektvarů zdraví.',
    levelReq: 1,
    durationMs: 12000,
    difficulty: 6,
    rewards: {
      xp: 25,
      gold: 24,
      materials: 5,
      itemDropChance: 0.15,
      possibleLootIds: ['robe_1', 'staff_1']
    }
  },
  {
    id: 'quest_2',
    name: 'Přepadení gobliních nájezdníků',
    description: 'Banda zákeřných goblinů přepadává obchodní karavany na západní obchodní stezce.',
    levelReq: 2,
    durationMs: 20000,
    difficulty: 16,
    rewards: {
      xp: 60,
      gold: 45,
      materials: 7,
      itemDropChance: 0.45,
      possibleLootIds: ['sword_2', 'armor_2', 'staff_2']
    }
  },
  {
    id: 'quest_save_smith',
    name: 'Záchrana uneseného kováře',
    description: 'Loupežníci ze stínových skal zajali královského kovářského učně. Dostaň ho ven!',
    levelReq: 2,
    durationMs: 35000,
    difficulty: 22,
    rewards: {
      xp: 90,
      gold: 70,
      materials: 12,
      itemDropChance: 0.6,
      possibleLootIds: ['sword_2', 'armor_2', 'dagger_2']
    }
  },
  {
    id: 'quest_3',
    name: 'Temná krypta nemrtvých',
    description: 'Ze starého zapomenutého hřbitova uniká černá magie a kostlivci povstávají z hrobů.',
    levelReq: 3,
    durationMs: 45000,
    difficulty: 32,
    rewards: {
      xp: 140,
      gold: 110,
      materials: 15,
      itemDropChance: 0.75,
      possibleLootIds: ['sword_3', 'dagger_2', 'armor_3', 'robe_2']
    }
  },
  {
    id: 'quest_boar_hunt',
    name: 'Lov na divočáka zhouby',
    description: 'Obří zmutovaný divočák s kamennou kůží pustoší úrodu v jižním údolí.',
    levelReq: 3,
    durationMs: 60000,
    difficulty: 42,
    rewards: {
      xp: 200,
      gold: 160,
      materials: 22,
      itemDropChance: 0.5,
      possibleLootIds: ['armor_3', 'sword_3']
    }
  },
  {
    id: 'quest_bandits',
    name: 'Vyčištění tábora banditů',
    description: 'Bandité si postavili opevněnou palisádu v průsmyku a vydírají celé široké okolí.',
    levelReq: 4,
    durationMs: 90000,
    difficulty: 54,
    rewards: {
      xp: 320,
      gold: 240,
      materials: 30,
      itemDropChance: 0.85,
      possibleLootIds: ['sword_4', 'armor_4', 'staff_3']
    }
  },
  {
    id: 'quest_dragon_lair',
    name: 'Legendární bitva: Dračí hnízdo',
    description: 'Starobylý rudý drak ohrožuje celé království. Pouze ti nejstatečnější hrdinové mají šanci přežít.',
    levelReq: 5,
    durationMs: 160000,
    difficulty: 85,
    rewards: {
      xp: 750,
      gold: 550,
      materials: 60,
      itemDropChance: 1.0,
      possibleLootIds: ['sword_4', 'armor_4', 'staff_3']
    }
  }
];

/**
 * @deprecated Hranice úrovní už nejsou tabulkou – používej `totalXpForLevel`
 * z `game/rules`, která pokračuje donekonečna. Ponecháno jen pro zpětnou
 * kompatibilitu importů.
 */
export const XP_TO_LEVEL = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];

export const INITIAL_HEROES: Hero[] = [
  {
    id: 'hero_1',
    name: 'Grom',
    heroClass: 'warrior',
    icon: 'flame',
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
  }
];
