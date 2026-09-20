import { describe, it, expect } from 'vitest';
import {
  totalXpForLevel, xpForNextLevel, levelForXp, levelProgressPercent,
  successChance, heroPower, recruitCost, healCost, guildUpgradeCost,
  goldMultiplier, materialMultiplier, questDurationMultiplier, effectiveQuestDuration,
  renownFromRun, renownBonus, rollRawMaterials, totalMaterials
} from '../rules';
import { Hero, Quest, GuildUpgrades, MaterialsInventory } from '../../types';

/** Původní ručně psaná tabulka – vzorec ji musí přesně reprodukovat. */
const LEGACY_XP_TABLE = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];

const hero = (over: Partial<Hero> = {}): Hero => ({
  id: 'h1', name: 'Grom', heroClass: 'warrior', level: 1, xp: 0,
  maxHp: 50, currentHp: 50, baseAttack: 8, baseDefense: 5,
  equipment: { weapon: null, armor: null },
  status: 'idle', activeQuestId: null, questStartTime: null, ...over
});

const quest = (over: Partial<Quest> = {}): Quest => ({
  id: 'q1', name: 'Krysy', description: '', levelReq: 1, durationMs: 6000, difficulty: 20,
  rewards: { xp: 15, gold: 12, materials: 2, itemDropChance: 0.25, possibleLootIds: [] }, ...over
});

const upgrades = (over: Partial<GuildUpgrades> = {}): GuildUpgrades =>
  ({ treasury: 0, warehouse: 0, trainingGround: 0, ...over });

describe('postup úrovní', () => {
  it('vzorec dává stejná čísla jako původní tabulka', () => {
    LEGACY_XP_TABLE.forEach((xp, index) => {
      expect(totalXpForLevel(index + 1)).toBe(xp);
    });
  });

  it('pokračuje i za hranicí původní tabulky', () => {
    expect(totalXpForLevel(11)).toBeGreaterThan(LEGACY_XP_TABLE[9]);
    expect(totalXpForLevel(50)).toBe(50 * 49 * 50);
    expect(xpForNextLevel(30)).toBeGreaterThan(xpForNextLevel(10));
  });

  it('levelForXp je inverzní k totalXpForLevel', () => {
    for (const level of [1, 2, 5, 10, 25, 100]) {
      expect(levelForXp(totalXpForLevel(level))).toBe(level);
      expect(levelForXp(totalXpForLevel(level) - 1)).toBe(level - 1 || 1);
    }
  });

  it('postup k další úrovni zůstává v rozmezí 0–100 %', () => {
    expect(levelProgressPercent({ level: 1, xp: 0 })).toBe(0);
    expect(levelProgressPercent({ level: 1, xp: 50 })).toBe(50);
    expect(levelProgressPercent({ level: 99, xp: 0 })).toBe(0);
  });
});

describe('souboj', () => {
  it('bojová síla počítá se zbraní i zbrojí', () => {
    const armed = hero({
      equipment: {
        weapon: { id: 'w', instanceId: 'w1', name: 'Meč', type: 'weapon', rarity: 'common', attack: 10, defense: 0, value: 1 },
        armor: { id: 'a', instanceId: 'a1', name: 'Zbroj', type: 'armor', rarity: 'common', attack: 0, defense: 6, value: 1 }
      }
    });
    const power = heroPower(armed);
    expect(power.attack).toBe(18);
    expect(power.defense).toBe(11);
    expect(power.combat).toBe(18 + 5.5);
  });

  it('šance na úspěch nikdy neopustí rozmezí 10–95 %', () => {
    expect(successChance(hero(), quest({ difficulty: 1 }))).toBe(0.95);
    expect(successChance(hero(), quest({ difficulty: 100000 }))).toBe(0.1);
  });

  it('silnější hrdina má vyšší šanci', () => {
    const weak = successChance(hero({ baseAttack: 5 }), quest({ difficulty: 40 }));
    const strong = successChance(hero({ baseAttack: 25 }), quest({ difficulty: 40 }));
    expect(strong).toBeGreaterThan(weak);
  });
});

describe('ceny', () => {
  it('nábor zdraží s každým dalším hrdinou', () => {
    expect(recruitCost(0)).toBe(50);
    const costs = [0, 1, 2, 3, 4, 5].map(recruitCost);
    for (let i = 1; i < costs.length; i++) {
      expect(costs[i]).toBeGreaterThan(costs[i - 1]);
    }
    // Desátý hrdina musí stát řádově víc než první, jinak jde zlato farmit donekonečna.
    expect(recruitCost(10)).toBeGreaterThan(recruitCost(0) * 50);
  });

  it('léčení roste s úrovní a chybějícím zdravím', () => {
    const lightlyHurt = healCost(hero({ level: 5, maxHp: 100, currentHp: 90 }));
    const nearlyDead = healCost(hero({ level: 5, maxHp: 100, currentHp: 5 }));
    expect(nearlyDead).toBeGreaterThan(lightlyHurt);

    const lowLevel = healCost(hero({ level: 1, maxHp: 50, currentHp: 10 }));
    const highLevel = healCost(hero({ level: 30, maxHp: 50, currentHp: 10 }));
    expect(highLevel).toBeGreaterThan(lowLevel);
  });

  it('zdravý hrdina se neléčí, oživení padlého stojí dvojnásobek', () => {
    expect(healCost(hero({ maxHp: 50, currentHp: 50 }))).toBe(0);
    const dead = healCost(hero({ level: 5, maxHp: 100, currentHp: 0, status: 'dead' }));
    const alive = healCost(hero({ level: 5, maxHp: 100, currentHp: 0 }));
    expect(dead).toBe(alive * 2);
  });

  it('vylepšení gildy zdražuje geometricky', () => {
    expect(guildUpgradeCost(0)).toBe(200);
    expect(guildUpgradeCost(5)).toBeGreaterThan(guildUpgradeCost(4));
  });
});

describe('vylepšení a sláva', () => {
  it('pokladnice a sklad zvyšují výnosy', () => {
    expect(goldMultiplier(upgrades())).toBe(1);
    expect(goldMultiplier(upgrades({ treasury: 4 }))).toBeCloseTo(1.6);
    expect(materialMultiplier(upgrades({ warehouse: 2 }))).toBeCloseTo(1.3);
  });

  it('cvičiště zkracuje výpravy nejvýš na polovinu', () => {
    expect(questDurationMultiplier(upgrades())).toBe(1);
    expect(questDurationMultiplier(upgrades({ trainingGround: 100 }))).toBe(0.5);
    expect(effectiveQuestDuration(quest({ durationMs: 10000 }), upgrades({ trainingGround: 5 }))).toBe(7000);
  });

  it('sláva se počítá až od tisíce XP a roste odmocninou', () => {
    expect(renownFromRun([hero({ xp: 500 })])).toBe(0);
    expect(renownFromRun([hero({ xp: 1000 })])).toBe(1);
    expect(renownFromRun([hero({ xp: 9000 })])).toBe(3);
    expect(renownBonus(3)).toBeCloseTo(0.24);
  });

  it('sláva sčítá XP napříč hrdiny', () => {
    expect(renownFromRun([hero({ xp: 2000 }), hero({ xp: 2000 })])).toBe(2);
  });
});

describe('suroviny', () => {
  it('rozdělí přesně zadaný počet surovin', () => {
    const rolls = [0.1, 0.5, 0.7, 0.95, 0.2];
    let i = 0;
    const award = rollRawMaterials(5, () => rolls[i++]);
    expect(award.ironOre + award.oakWood + award.rawHide + award.manaCrystal).toBe(5);
    expect(award.ironOre).toBe(2);
    expect(award.oakWood).toBe(1);
    expect(award.rawHide).toBe(1);
    expect(award.manaCrystal).toBe(1);
  });

  it('celkový počet je součtem všech druhů', () => {
    const inv: MaterialsInventory = {
      ironOre: 8, rawHide: 6, oakWood: 10, manaCrystal: 3,
      ironBar: 2, leatherStrap: 2, steelNail: 4, processedPlank: 2
    };
    expect(totalMaterials(inv)).toBe(37);
  });
});
