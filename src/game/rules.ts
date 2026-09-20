/**
 * Herní pravidla jako čisté funkce.
 *
 * Všechno, co počítá čísla (postup úrovní, souboj, ceny, odměny), žije tady a
 * nesahá na React ani na `localStorage`. Díky tomu jde stejná logika použít
 * jak pro běžící hru, tak pro dopočet postupu, který proběhl mimo hru, a jde
 * ji testovat bez prohlížeče. Náhoda se předává jako parametr `rng`, takže
 * test může dosadit předvídatelný generátor.
 */
import { Hero, Quest, MaterialsInventory, GuildUpgrades } from '../types';

/** Zdroj náhody. Výchozí je `Math.random`, test dosadí vlastní. */
export type Rng = () => number;

export const defaultRng: Rng = Math.random;

// ---------------------------------------------------------------------------
// Postup úrovní
// ---------------------------------------------------------------------------

/**
 * Celkové XP potřebné k dosažení dané úrovně.
 *
 * Vzorec 50*(n-1)*n dává přesně stejná čísla jako původní ručně psaná tabulka
 * (0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500), ale na rozdíl od ní
 * nikde nekončí. Rozehrané gildy tak žádné XP neztratí.
 */
export const totalXpForLevel = (level: number): number => {
  if (level <= 1) return 0;
  return 50 * (level - 1) * level;
};

/** XP potřebné na přechod z `level` na `level + 1`. */
export const xpForNextLevel = (level: number): number =>
  totalXpForLevel(level + 1) - totalXpForLevel(level);

/** Úroveň odpovídající danému množství nasbíraných XP. */
export const levelForXp = (xp: number): number => {
  let level = 1;
  while (xp >= totalXpForLevel(level + 1)) level++;
  return level;
};

/** Postup k další úrovni v procentech (0–100). */
export const levelProgressPercent = (hero: Pick<Hero, 'level' | 'xp'>): number => {
  const current = totalXpForLevel(hero.level);
  const next = totalXpForLevel(hero.level + 1);
  if (next <= current) return 100;
  return Math.min(100, Math.max(0, ((hero.xp - current) / (next - current)) * 100));
};

/** Přírůstky statistik za každou získanou úroveň. */
export const LEVEL_UP_GAINS = { maxHp: 10, baseAttack: 3, baseDefense: 2 } as const;

// ---------------------------------------------------------------------------
// Souboj
// ---------------------------------------------------------------------------

/** Bojová síla hrdiny včetně vybavení. */
export const heroPower = (hero: Hero) => {
  const attack = hero.baseAttack + (hero.equipment.weapon?.attack || 0) + (hero.equipment.armor?.attack || 0);
  const defense = hero.baseDefense + (hero.equipment.weapon?.defense || 0) + (hero.equipment.armor?.defense || 0);
  return { attack, defense, combat: attack + defense * 0.5 };
};

/** Šance na úspěch výpravy, vždy v rozmezí 10–95 %. */
export const successChance = (hero: Hero, quest: Quest): number => {
  const { combat } = heroPower(hero);
  return Math.min(0.95, Math.max(0.1, combat / quest.difficulty));
};

// ---------------------------------------------------------------------------
// Ceny
// ---------------------------------------------------------------------------

/**
 * Cena náboru dalšího hrdiny. Roste geometricky s velikostí gildy – jinak by
 * stačilo jednou zbohatnout a nakoupit libovolný počet hrdinů, kteří by pak
 * zlato vydělávali bez omezení.
 */
export const recruitCost = (heroCount: number): number =>
  Math.round(50 * Math.pow(1.55, Math.max(0, heroCount)));

/**
 * Cena vyléčení. Škáluje s úrovní hrdiny i s tím, kolik zdraví mu chybí, aby
 * léčení zůstalo citelné i v pozdní hře.
 */
export const healCost = (hero: Pick<Hero, 'level' | 'maxHp' | 'currentHp' | 'status'>): number => {
  const missing = Math.max(0, hero.maxHp - hero.currentHp);
  if (missing === 0 && hero.status !== 'dead') return 0;
  const missingRatio = hero.maxHp > 0 ? missing / hero.maxHp : 1;
  const base = 10 + 8 * hero.level;
  const cost = base * Math.max(0.35, missingRatio);
  // Oživení padlého hrdiny stojí dvojnásobek.
  return Math.max(5, Math.round(cost * (hero.status === 'dead' ? 2 : 1)));
};

// ---------------------------------------------------------------------------
// Vylepšení gildy
// ---------------------------------------------------------------------------

export const GUILD_UPGRADE_MAX_LEVEL = 20;

/** Cena dalšího stupně vylepšení gildy. */
export const guildUpgradeCost = (level: number): number =>
  Math.round(200 * Math.pow(1.8, Math.max(0, level)));

/** Násobič výnosu zlata ze všech zdrojů. */
export const goldMultiplier = (upgrades: GuildUpgrades, renownBonus = 0): number =>
  (1 + 0.15 * upgrades.treasury) * (1 + renownBonus);

/** Násobič množství surovin z výprav. */
export const materialMultiplier = (upgrades: GuildUpgrades): number => 1 + 0.15 * upgrades.warehouse;

/**
 * Násobič doby trvání výpravy. Každý stupeň cvičiště zkracuje výpravy o 6 %,
 * nejvýš však na polovinu původní doby.
 */
export const questDurationMultiplier = (upgrades: GuildUpgrades): number =>
  Math.max(0.5, 1 - 0.06 * upgrades.trainingGround);

/** Doba trvání výpravy po započtení vylepšení gildy. */
export const effectiveQuestDuration = (quest: Quest, upgrades: GuildUpgrades): number =>
  Math.max(1000, Math.round(quest.durationMs * questDurationMultiplier(upgrades)));

// ---------------------------------------------------------------------------
// Prestige
// ---------------------------------------------------------------------------

/**
 * Sláva získaná za rozpuštění gildy. Odvozuje se z celkových XP všech hrdinů,
 * odmocnina drží křivku v rozumných mezích i po mnoha resetech.
 */
export const renownFromRun = (heroes: Hero[]): number => {
  const totalXp = heroes.reduce((acc, h) => acc + h.xp, 0);
  if (totalXp < 1000) return 0;
  return Math.floor(Math.sqrt(totalXp / 1000));
};

/** Trvalý bonus k výnosům za nasbíranou slávu (0.08 = +8 % za bod). */
export const renownBonus = (renown: number): number => 0.08 * Math.max(0, renown);

// ---------------------------------------------------------------------------
// Odměny za výpravu
// ---------------------------------------------------------------------------

export type RawMaterialAward = Pick<MaterialsInventory, 'ironOre' | 'rawHide' | 'oakWood' | 'manaCrystal'>;

/** Rozdělí daný počet surovin mezi čtyři základní druhy. */
export const rollRawMaterials = (count: number, rng: Rng = defaultRng): RawMaterialAward => {
  const awarded: RawMaterialAward = { ironOre: 0, rawHide: 0, oakWood: 0, manaCrystal: 0 };
  for (let i = 0; i < count; i++) {
    const r = rng();
    if (r < 0.35) awarded.ironOre++;
    else if (r < 0.65) awarded.oakWood++;
    else if (r < 0.9) awarded.rawHide++;
    else awarded.manaCrystal++;
  }
  return awarded;
};

/** Součet všech surovin v truhle – jediný zdroj pravdy pro celkový počet. */
export const totalMaterials = (inv: MaterialsInventory): number =>
  (Object.keys(inv) as Array<keyof MaterialsInventory>).reduce((acc, key) => acc + (inv[key] || 0), 0);
