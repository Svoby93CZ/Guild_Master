import { describe, it, expect } from 'vitest';
import { resolveQuest, addMaterials, generateQuest, questBoard, highestLevel } from '../quests';
import { totalXpForLevel } from '../rules';
import { Hero, Quest, GuildUpgrades, MaterialsInventory } from '../../types';
import { INITIAL_QUESTS } from '../../data/constants';

const hero = (over: Partial<Hero> = {}): Hero => ({
  id: 'h1', name: 'Grom', heroClass: 'warrior', level: 1, xp: 0,
  maxHp: 50, currentHp: 50, baseAttack: 8, baseDefense: 5,
  equipment: { weapon: null, armor: null },
  status: 'questing', activeQuestId: 'q1', questStartTime: 0, ...over
});

const quest = (over: Partial<Quest> = {}): Quest => ({
  id: 'q1', name: 'Krysy', description: '', levelReq: 1, durationMs: 6000, difficulty: 20,
  rewards: { xp: 100, gold: 50, materials: 4, itemDropChance: 0, possibleLootIds: [] }, ...over
});

const ctx = (over: Partial<GuildUpgrades> = {}, renown = 0) => ({
  upgrades: { treasury: 0, warehouse: 0, trainingGround: 0, ...over },
  renown
});

/** Generátor, který vrací předem danou posloupnost hodnot. */
const seq = (values: number[]) => {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
};

describe('vyhodnocení výpravy', () => {
  it('úspěch připíše zlato, XP i suroviny a vrátí hrdinu do gildy', () => {
    // první hod = úspěch, další hody rozdělují suroviny, poslední řeší kořist
    const out = resolveQuest(hero(), quest(), ctx(), seq([0.01, 0.1, 0.1, 0.1, 0.1, 0.99]));
    expect(out.success).toBe(true);
    expect(out.goldEarned).toBe(50);
    expect(out.xpEarned).toBe(100);
    expect(out.materialsEarned).toBe(4);
    expect(out.hero.status).toBe('idle');
    expect(out.hero.activeQuestId).toBeNull();
  });

  it('neúspěch bere polovinu maxima HP a nedává odměny', () => {
    const out = resolveQuest(hero({ currentHp: 50, maxHp: 50 }), quest(), ctx(), seq([0.99]));
    expect(out.success).toBe(false);
    expect(out.goldEarned).toBe(0);
    expect(out.hpLost).toBe(25);
    expect(out.hero.currentHp).toBe(25);
    expect(out.hero.status).toBe('idle');
  });

  it('hrdina padne, když mu zdraví klesne na nulu', () => {
    const out = resolveQuest(hero({ currentHp: 20, maxHp: 50 }), quest(), ctx(), seq([0.99]));
    expect(out.hero.currentHp).toBe(0);
    expect(out.hero.status).toBe('dead');
  });

  it('postup na úroveň zvýší statistiky a plně vyléčí', () => {
    // 100 XP stačí přesně na druhou úroveň
    const out = resolveQuest(hero({ currentHp: 10 }), quest({ rewards: { ...quest().rewards, xp: 100 } }), ctx(), seq([0.01, 0.5, 0.5, 0.5, 0.5, 0.99]));
    expect(out.levelsGained).toBe(1);
    expect(out.hero.level).toBe(2);
    expect(out.hero.maxHp).toBe(60);
    expect(out.hero.baseAttack).toBe(11);
    expect(out.hero.currentHp).toBe(60);
  });

  it('zvládne přeskočit víc úrovní najednou', () => {
    const out = resolveQuest(hero(), quest({ rewards: { ...quest().rewards, xp: totalXpForLevel(5) } }), ctx(), seq([0.01, 0.5, 0.5, 0.5, 0.5, 0.99]));
    expect(out.hero.level).toBe(5);
    expect(out.levelsGained).toBe(4);
  });

  it('vylepšení gildy a sláva zvyšují odměny', () => {
    const plain = resolveQuest(hero(), quest(), ctx(), seq([0.01, 0.5, 0.5, 0.5, 0.5, 0.99]));
    const boosted = resolveQuest(hero(), quest(), ctx({ treasury: 4, warehouse: 2 }, 3), seq([0.01, 0.5, 0.5, 0.5, 0.5, 0.99]));
    expect(boosted.goldEarned).toBeGreaterThan(plain.goldEarned);
    expect(boosted.xpEarned).toBeGreaterThan(plain.xpEarned);
    expect(boosted.materialsEarned).toBeGreaterThan(plain.materialsEarned);
  });

  it('kořist padne, jen když to hod dovolí', () => {
    const q = quest({ rewards: { ...quest().rewards, itemDropChance: 1, possibleLootIds: ['sword_1'] } });
    const withLoot = resolveQuest(hero(), q, ctx(), seq([0.01, 0.5, 0.5, 0.5, 0.5, 0.0, 0.0]));
    expect(withLoot.loot?.name).toBeTruthy();

    const noDrop = quest({ rewards: { ...quest().rewards, itemDropChance: 0, possibleLootIds: ['sword_1'] } });
    expect(resolveQuest(hero(), noDrop, ctx(), seq([0.01, 0.5, 0.5, 0.5, 0.5, 0.99])).loot).toBeUndefined();
  });
});

describe('truhla', () => {
  it('přičte suroviny a nechá zpracované beze změny', () => {
    const inv: MaterialsInventory = {
      ironOre: 1, rawHide: 1, oakWood: 1, manaCrystal: 1,
      ironBar: 5, leatherStrap: 5, steelNail: 5, processedPlank: 5
    };
    const next = addMaterials(inv, { ironOre: 2, rawHide: 0, oakWood: 3, manaCrystal: 1 });
    expect(next.ironOre).toBe(3);
    expect(next.oakWood).toBe(4);
    expect(next.manaCrystal).toBe(2);
    expect(next.ironBar).toBe(5);
  });
});

describe('nekonečná nabídka úkolů', () => {
  it('generovaný úkol roste s úrovní', () => {
    const low = generateQuest(6);
    const high = generateQuest(20);
    expect(high.difficulty).toBeGreaterThan(low.difficulty);
    expect(high.rewards.gold).toBeGreaterThan(low.rewards.gold);
    expect(high.levelReq).toBe(20);
    expect(low.generated).toBe(true);
  });

  it('vývěska obsahuje ruční úkoly a smlouvy nad úroveň nejlepšího hrdiny', () => {
    const board = questBoard([hero({ level: 7 })]);
    INITIAL_QUESTS.forEach(q => {
      expect(board.some(b => b.id === q.id)).toBe(true);
    });
    const top = Math.max(...board.map(q => q.levelReq));
    expect(top).toBe(9);
  });

  it('vývěska nikdy nemá dvakrát stejné id', () => {
    const board = questBoard([hero({ level: 30 })]);
    expect(new Set(board.map(q => q.id)).size).toBe(board.length);
  });

  it('nejvyšší úroveň bere maximum z gildy', () => {
    expect(highestLevel([hero({ level: 3 }), hero({ level: 11 })])).toBe(11);
    expect(highestLevel([])).toBe(1);
  });
});
