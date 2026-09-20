/**
 * Vyhodnocení výprav a generování nekonečné nabídky úkolů.
 *
 * Stejně jako `rules.ts` je tenhle modul bez Reactu a bez vedlejších účinků –
 * výsledek výpravy je jen popis toho, co se má se stavem stát. Díky tomu může
 * offline dopočet přehrát stovky výprav úplně stejnou logikou jako běžící hra.
 */
import { Hero, Quest, InventoryItem, MaterialsInventory, GuildUpgrades } from '../types';
import { ITEM_TEMPLATES, INITIAL_QUESTS } from '../data/constants';
import {
  Rng,
  defaultRng,
  successChance,
  rollRawMaterials,
  RawMaterialAward,
  goldMultiplier,
  materialMultiplier,
  renownBonus,
  totalXpForLevel,
  LEVEL_UP_GAINS
} from './rules';

/** Co se stalo při jedné výpravě. */
export interface QuestOutcome {
  success: boolean;
  /** Stav hrdiny po výpravě (úroveň, HP, XP už započítané). */
  hero: Hero;
  goldEarned: number;
  xpEarned: number;
  materials: RawMaterialAward;
  materialsEarned: number;
  loot?: InventoryItem;
  hpLost: number;
  levelsGained: number;
}

export interface RewardContext {
  upgrades: GuildUpgrades;
  renown: number;
}

const makeItemId = (rng: Rng) => Math.floor(rng() * 1e12).toString(36) + Math.floor(rng() * 1e12).toString(36);

/**
 * Přidá hrdinovi XP a zvýší mu úroveň, dokud na to XP stačí.
 * Používá vzorec z `rules.ts`, takže hranice úrovní nikde nekončí.
 */
const applyXp = (hero: Hero, xp: number) => {
  let level = hero.level;
  let maxHp = hero.maxHp;
  let baseAttack = hero.baseAttack;
  let baseDefense = hero.baseDefense;
  const newXp = hero.xp + xp;

  while (newXp >= totalXpForLevel(level + 1)) {
    level++;
    maxHp += LEVEL_UP_GAINS.maxHp;
    baseAttack += LEVEL_UP_GAINS.baseAttack;
    baseDefense += LEVEL_UP_GAINS.baseDefense;
  }

  return { xp: newXp, level, maxHp, baseAttack, baseDefense, levelsGained: level - hero.level };
};

/**
 * Vyhodnotí jednu výpravu. Vrací nový stav hrdiny a odměny; volající si je
 * zanese do herního stavu (viz `applyOutcome` v useGameEngine).
 */
export const resolveQuest = (
  hero: Hero,
  quest: Quest,
  ctx: RewardContext,
  rng: Rng = defaultRng
): QuestOutcome => {
  const success = rng() < successChance(hero, quest);

  if (!success) {
    const hpLost = Math.floor(hero.maxHp * 0.5);
    const currentHp = Math.max(0, hero.currentHp - hpLost);
    return {
      success: false,
      hero: {
        ...hero,
        status: currentHp === 0 ? 'dead' : 'idle',
        activeQuestId: null,
        questStartTime: null,
        currentHp
      },
      goldEarned: 0,
      xpEarned: 0,
      materials: { ironOre: 0, rawHide: 0, oakWood: 0, manaCrystal: 0 },
      materialsEarned: 0,
      hpLost,
      levelsGained: 0
    };
  }

  const bonus = renownBonus(ctx.renown);
  const goldEarned = Math.round(quest.rewards.gold * goldMultiplier(ctx.upgrades, bonus));
  const xpEarned = Math.round(quest.rewards.xp * (1 + bonus));
  const materialCount = Math.round(quest.rewards.materials * materialMultiplier(ctx.upgrades));
  const materials = rollRawMaterials(materialCount, rng);

  let loot: InventoryItem | undefined;
  if (rng() < quest.rewards.itemDropChance && quest.rewards.possibleLootIds.length > 0) {
    const lootId = quest.rewards.possibleLootIds[Math.floor(rng() * quest.rewards.possibleLootIds.length)];
    const template = ITEM_TEMPLATES[lootId];
    if (template) loot = { ...template, instanceId: makeItemId(rng) };
  }

  const progressed = applyXp(hero, xpEarned);
  // Po postupu na úroveň se hrdina plně vyléčí, jinak si spraví desetinu zdraví.
  const currentHp = progressed.levelsGained > 0
    ? progressed.maxHp
    : Math.min(progressed.maxHp, hero.currentHp + Math.floor(progressed.maxHp * 0.1));

  return {
    success: true,
    hero: {
      ...hero,
      status: 'idle',
      activeQuestId: null,
      questStartTime: null,
      xp: progressed.xp,
      level: progressed.level,
      maxHp: progressed.maxHp,
      baseAttack: progressed.baseAttack,
      baseDefense: progressed.baseDefense,
      currentHp
    },
    goldEarned,
    xpEarned,
    materials,
    materialsEarned: materialCount,
    loot,
    hpLost: 0,
    levelsGained: progressed.levelsGained
  };
};

/** Přičte získané suroviny do truhly. */
export const addMaterials = (inv: MaterialsInventory, award: RawMaterialAward): MaterialsInventory => ({
  ...inv,
  ironOre: inv.ironOre + award.ironOre,
  rawHide: inv.rawHide + award.rawHide,
  oakWood: inv.oakWood + award.oakWood,
  manaCrystal: inv.manaCrystal + award.manaCrystal
});

// ---------------------------------------------------------------------------
// Nekonečná nabídka úkolů
// ---------------------------------------------------------------------------

const ENDLESS_PLACES = [
  'Zmrzlé pláně', 'Propadlé doly', 'Šeptající bažina', 'Rozvaliny Kar Tharu', 'Obsidiánová věž',
  'Sluneční katakomby', 'Soutěska nářků', 'Zrádné mělčiny', 'Popelavý hvozd', 'Spáry podsvětí'
];

const ENDLESS_FOES = [
  'ledoví obři', 'kamenní golemové', 'bahenní přízraky', 'kultisté zapomnění', 'stínoví draci',
  'nemrtví strážci', 'harpyje', 'mořští hadi', 'ohniví elementálové', 'démoničtí lovci'
];

const LEGENDARY_LOOT = ['sword_4', 'armor_4', 'staff_3'];

/**
 * Vyrobí úkol pro zadanou úroveň. Obtížnost i odměny rostou geometricky,
 * takže nabídka nikdy nedojde a drží krok s rostoucí silou hrdinů.
 */
export const generateQuest = (level: number): Quest => {
  const tier = level - 5; // navazuje na poslední ručně psaný úkol (úroveň 5)
  const place = ENDLESS_PLACES[tier % ENDLESS_PLACES.length];
  const foe = ENDLESS_FOES[(tier * 3) % ENDLESS_FOES.length];
  const scale = Math.pow(1.35, tier);

  return {
    id: `endless_${level}`,
    name: `${place}: ${foe}`,
    description: `Gilda přijala smlouvu na úrovni ${level}. Lokalitu ${place.toLowerCase()} ovládli ${foe} a nikdo jiný si na ně netroufá.`,
    generated: true,
    levelReq: level,
    durationMs: Math.round(160000 * Math.pow(1.08, tier)),
    difficulty: Math.round(85 * scale),
    rewards: {
      xp: Math.round(750 * scale),
      gold: Math.round(550 * scale),
      materials: Math.round(60 * Math.pow(1.2, tier)),
      itemDropChance: 1.0,
      possibleLootIds: LEGENDARY_LOOT
    }
  };
};

/** Nejvyšší úroveň mezi hrdiny gildy. */
export const highestLevel = (heroes: Hero[]): number =>
  heroes.reduce((max, h) => Math.max(max, h.level), 1);

/**
 * Aktuální vývěska: ručně psané úkoly plus generované smlouvy až kousek nad
 * úroveň nejlepšího hrdiny, aby bylo pořád na co sahat.
 */
export const questBoard = (heroes: Hero[]): Quest[] => {
  const top = highestLevel(heroes);
  const generated: Quest[] = [];
  for (let level = 6; level <= top + 2; level++) {
    generated.push(generateQuest(level));
  }
  return [...INITIAL_QUESTS, ...generated];
};
