export type ItemType = 'weapon' | 'armor' | 'material' | 'consumable';
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface ItemTemplate {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  attack: number;
  defense: number;
  value: number;
}

export interface InventoryItem extends ItemTemplate {
  instanceId: string;
}

export type HeroClass = 'warrior' | 'rogue' | 'mage';

export interface Hero {
  id: string;
  name: string;
  heroClass: HeroClass;
  level: number;
  xp: number;
  maxHp: number;
  currentHp: number;
  baseAttack: number;
  baseDefense: number;
  equipment: {
    weapon: InventoryItem | null;
    armor: InventoryItem | null;
  };
  status: 'idle' | 'questing' | 'dead';
  activeQuestId: string | null;
  questStartTime: number | null;
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  levelReq: number;
  durationMs: number;
  difficulty: number;
  rewards: {
    xp: number;
    gold: number;
    materials: number;
    itemDropChance: number;
    possibleLootIds: string[];
  };
}

export interface LogEntry {
  id: string;
  message: string;
  timestamp: number;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface CompletedQuest {
  id: string;
  questId: string;
  questName: string;
  heroId: string;
  heroName: string;
  completedAt: number;
  success: boolean;
  xpEarned: number;
  goldEarned: number;
  materialsEarned: number;
  lootItem?: InventoryItem;
}

export interface GameState {
  gold: number;
  materials: number;
  heroes: Hero[];
  inventory: InventoryItem[];
  availableQuests: Quest[];
  logs: LogEntry[];
  completedQuests: CompletedQuest[];
}
