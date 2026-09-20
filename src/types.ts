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
  icon?: string;
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
  story?: string;
  /** Po dokončení výpravy se hrdina sám vydá na stejnou znovu. */
  autoRepeat?: boolean;
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  /** Úkoly dopočítané podle úrovně gildy, ne ručně napsané v constants. */
  generated?: boolean;
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
  manaCrystalsEarned?: number;
  lootItem?: InventoryItem;
}

export interface MaterialsInventory {
  ironOre: number;
  rawHide: number;
  oakWood: number;
  manaCrystal: number;
  ironBar: number;
  leatherStrap: number;
  steelNail: number;
  processedPlank: number;
}

/** Trvalá vylepšení gildy kupovaná za zlato. */
export interface GuildUpgrades {
  /** Pokladnice – zvyšuje výnos zlata. */
  treasury: number;
  /** Sklad – zvyšuje množství surovin z výprav. */
  warehouse: number;
  /** Cvičiště – zkracuje dobu trvání výprav. */
  trainingGround: number;
}

/** Souhrn toho, co se ve hře stalo, když u ní hráč nebyl. */
export interface OfflineReport {
  elapsedMs: number;
  cappedMs: number;
  questsCompleted: number;
  questsFailed: number;
  goldEarned: number;
  xpEarned: number;
  materialsEarned: number;
  itemsFound: number;
}

/**
 * Běhový stav hry.
 *
 * `availableQuests` je katalog z `data/constants` – do savu se neukládá, aby se
 * nově přidané úkoly dostaly i k hráčům se starým uloženým postupem.
 * Celkový počet surovin se neukládá jako pole, ale počítá se z
 * `materialsInventory` (viz `totalMaterials`), aby nešly rozsynchronizovat.
 */
export interface GameState {
  gold: number;
  materialsInventory: MaterialsInventory;
  heroes: Hero[];
  inventory: InventoryItem[];
  availableQuests: Quest[];
  logs: LogEntry[];
  completedQuests: CompletedQuest[];
  upgrades: GuildUpgrades;
  /** Sláva nasbíraná předchozími gildami – trvalý bonus k výnosům. */
  renown: number;
  /** Kolikrát už hráč gildu rozpustil. */
  prestigeCount: number;
  /** Souhrn posledního offline postupu, dokud ho hráč neodklikne. */
  offlineReport?: OfflineReport | null;
}

/** Podoba dat v localStorage. Statický obsah (úkoly) se sem záměrně neukládá. */
export interface SaveData extends Omit<GameState, 'availableQuests' | 'offlineReport'> {
  version: number;
  savedAt: number;
}
