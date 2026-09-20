import { describe, it, expect } from 'vitest';
import { applyOfflineProgress, describeOfflineReport, OFFLINE_CAP_MS } from '../offline';
import { GameState, Hero } from '../../types';
import { INITIAL_QUESTS } from '../../data/constants';

const quest = INITIAL_QUESTS[0]; // 6 s, obtížnost 4

const hero = (over: Partial<Hero> = {}): Hero => ({
  id: 'h1', name: 'Grom', heroClass: 'warrior', level: 1, xp: 0,
  maxHp: 50, currentHp: 50, baseAttack: 8, baseDefense: 5,
  equipment: { weapon: null, armor: null },
  status: 'questing', activeQuestId: quest.id, questStartTime: 0, ...over
});

const state = (heroes: Hero[]): GameState => ({
  gold: 0,
  materialsInventory: { ironOre: 0, rawHide: 0, oakWood: 0, manaCrystal: 0, ironBar: 0, leatherStrap: 0, steelNail: 0, processedPlank: 0 },
  heroes,
  inventory: [],
  availableQuests: INITIAL_QUESTS,
  logs: [],
  completedQuests: [],
  upgrades: { treasury: 0, warehouse: 0, trainingGround: 0 },
  renown: 0,
  prestigeCount: 0
});

/** Vždy uspěje, nikdy nenajde kořist. */
const alwaysWin = () => 0.01;

describe('offline postup', () => {
  it('krátká pauza se neřeší', () => {
    const { report } = applyOfflineProgress(state([hero()]), 30_000, 0, alwaysWin);
    expect(report).toBeNull();
  });

  it('hrdina bez opakování dokončí jen rozdělanou výpravu', () => {
    const { state: next, report } = applyOfflineProgress(state([hero()]), 3_600_000, 0, alwaysWin);
    expect(report?.questsCompleted).toBe(1);
    expect(next.heroes[0].status).toBe('idle');
    expect(next.gold).toBe(quest.rewards.gold);
  });

  it('hrdina s opakováním plní výpravy po celou dobu nepřítomnosti', () => {
    const { state: next, report } = applyOfflineProgress(
      state([hero({ autoRepeat: true })]), 600_000, 0, alwaysWin
    );
    // 10 minut děleno šestisekundovou výpravou
    expect(report?.questsCompleted).toBe(100);
    expect(next.gold).toBe(quest.rewards.gold * 100);
    expect(next.heroes[0].status).toBe('questing');
  });

  it('delší nepřítomnost než strop se dál nesčítá', () => {
    const long = applyOfflineProgress(state([hero({ autoRepeat: true })]), OFFLINE_CAP_MS * 5, 0, alwaysWin);
    const capped = applyOfflineProgress(state([hero({ autoRepeat: true })]), OFFLINE_CAP_MS, 0, alwaysWin);
    expect(long.report?.questsCompleted).toBe(capped.report?.questsCompleted);
    expect(long.report?.cappedMs).toBe(OFFLINE_CAP_MS);
    expect(long.report?.elapsedMs).toBe(OFFLINE_CAP_MS * 5);
  });

  it('padlý hrdina přestane opakovat', () => {
    const alwaysLose = () => 0.99;
    const { state: next, report } = applyOfflineProgress(
      state([hero({ autoRepeat: true, currentHp: 10 })]), 3_600_000, 0, alwaysLose
    );
    expect(next.heroes[0].status).toBe('dead');
    expect(report?.questsFailed).toBe(1);
    expect(report?.questsCompleted).toBe(0);
  });

  it('nečinný hrdina se offline nehne', () => {
    const idle = hero({ status: 'idle', activeQuestId: null, questStartTime: null });
    const { state: next, report } = applyOfflineProgress(state([idle]), 3_600_000, 0, alwaysWin);
    expect(report).toBeNull();
    expect(next.heroes[0]).toEqual(idle);
  });

  it('počet výprav je omezený, i kdyby byly nekonečně krátké', () => {
    const instant = { ...quest, id: 'instant', durationMs: 1 };
    const s: GameState = { ...state([hero({ autoRepeat: true, activeQuestId: 'instant' })]), availableQuests: [instant] };
    const { report } = applyOfflineProgress(s, OFFLINE_CAP_MS, 0, alwaysWin);
    expect(report!.questsCompleted).toBeLessThanOrEqual(500);
  });

  it('výprava, která ze hry zmizela, hrdinu uvolní', () => {
    const s = state([hero({ activeQuestId: 'neexistuje' })]);
    const { state: next } = applyOfflineProgress(s, 3_600_000, 0, alwaysWin);
    expect(next.heroes[0].status).toBe('idle');
  });

  it('cvičiště zkrátí výpravy, takže jich offline proběhne víc', () => {
    const base = applyOfflineProgress(state([hero({ autoRepeat: true })]), 600_000, 0, alwaysWin);
    const fast = applyOfflineProgress(
      { ...state([hero({ autoRepeat: true })]), upgrades: { treasury: 0, warehouse: 0, trainingGround: 5 } },
      600_000, 0, alwaysWin
    );
    expect(fast.report!.questsCompleted).toBeGreaterThan(base.report!.questsCompleted);
  });

  it('souhrn zmíní dobu i výdělek', () => {
    const { report } = applyOfflineProgress(state([hero({ autoRepeat: true })]), 7_200_000, 0, alwaysWin);
    const text = describeOfflineReport(report!);
    expect(text).toContain('2 h');
    expect(text).toContain('zlata');
  });
});
