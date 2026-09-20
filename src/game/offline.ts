/**
 * Dopočet postupu, který proběhl, když hráč hru neměl otevřenou.
 *
 * Přehrává stejnou logiku jako běžící hra (`resolveQuest`), jen zrychleně:
 * pro každého hrdinu posouvá jeho hodiny dopředu a dokončuje jednu výpravu za
 * druhou, dokud se do uplynulého času vejdou. Hrdina bez zapnutého opakování
 * dokončí nejvýš tu jednu výpravu, na které byl.
 */
import { GameState, Hero, Quest, OfflineReport } from '../types';
import { Rng, defaultRng, effectiveQuestDuration, totalMaterials } from './rules';
import { resolveQuest, addMaterials } from './quests';

/** Nejvíc 8 hodin – delší nepřítomnost se dál nesčítá. */
export const OFFLINE_CAP_MS = 8 * 60 * 60 * 1000;

/** Pojistka proti zacyklení u velmi krátkých výprav. */
const MAX_QUESTS_PER_HERO = 500;

const emptyReport = (elapsedMs: number, cappedMs: number): OfflineReport => ({
  elapsedMs,
  cappedMs,
  questsCompleted: 0,
  questsFailed: 0,
  goldEarned: 0,
  xpEarned: 0,
  materialsEarned: 0,
  itemsFound: 0
});

export interface OfflineResult {
  state: GameState;
  report: OfflineReport | null;
}

/**
 * Posune stav hry o dobu strávenou mimo hru.
 *
 * @param state  stav načtený ze savu
 * @param now    současný čas
 * @param savedAt kdy byl save zapsán
 */
export const applyOfflineProgress = (
  state: GameState,
  now: number,
  savedAt: number,
  rng: Rng = defaultRng
): OfflineResult => {
  const elapsedMs = Math.max(0, now - savedAt);
  // Krátká pauza (přepnutí záložky, reload) se neřeší jako offline postup.
  if (elapsedMs < 60_000) return { state, report: null };

  const cappedMs = Math.min(elapsedMs, OFFLINE_CAP_MS);
  const report = emptyReport(elapsedMs, cappedMs);
  const questById = new Map<string, Quest>(state.availableQuests.map(q => [q.id, q]));

  let gold = state.gold;
  let materialsInventory = state.materialsInventory;
  const inventory = [...state.inventory];

  // Hrdina se mohl změnit i bez dokončené výpravy (např. když jeho výprava ze
  // hry zmizela), proto se to sleduje zvlášť od výsledků v přehledu.
  let heroesChanged = false;

  const heroes = state.heroes.map<Hero>(hero => {
    // Pozor na `questStartTime === 0`: nulový čas je platný, proto porovnání s null.
    if (hero.status !== 'questing' || !hero.activeQuestId || hero.questStartTime == null) return hero;

    const quest = questById.get(hero.activeQuestId);
    if (!quest) {
      heroesChanged = true;
      return { ...hero, status: 'idle', activeQuestId: null, questStartTime: null };
    }

    let current = hero;
    let clock = hero.questStartTime;
    // Hranice, za kterou se už výpravy nedopočítávají.
    const deadline = savedAt + cappedMs;
    let iterations = 0;

    while (iterations < MAX_QUESTS_PER_HERO) {
      const activeQuest = questById.get(current.activeQuestId ?? '') ?? quest;
      const duration = effectiveQuestDuration(activeQuest, state.upgrades);
      const finishesAt = clock + duration;
      if (finishesAt > deadline) break;

      const outcome = resolveQuest(
        { ...current, status: 'questing' },
        activeQuest,
        { upgrades: state.upgrades, renown: state.renown },
        rng
      );

      gold += outcome.goldEarned;
      materialsInventory = addMaterials(materialsInventory, outcome.materials);
      if (outcome.loot) {
        inventory.push(outcome.loot);
        report.itemsFound++;
      }
      report.goldEarned += outcome.goldEarned;
      report.xpEarned += outcome.xpEarned;
      report.materialsEarned += outcome.materialsEarned;
      if (outcome.success) report.questsCompleted++;
      else report.questsFailed++;

      current = outcome.hero;
      clock = finishesAt;
      iterations++;
      heroesChanged = true;

      // Dál pokračuje jen hrdina s opakováním, který je naživu.
      const canContinue = current.autoRepeat && current.status === 'idle';
      if (!canContinue) break;

      current = {
        ...current,
        status: 'questing',
        activeQuestId: activeQuest.id,
        questStartTime: clock
      };
    }

    return current;
  });

  if (!heroesChanged) return { state, report: null };

  const questsResolved = report.questsCompleted > 0 || report.questsFailed > 0;
  const nextState: GameState = { ...state, gold, materialsInventory, inventory, heroes };
  // Přehled se ukazuje jen tehdy, když se opravdu odehrála nějaká výprava.
  return { state: nextState, report: questsResolved ? report : null };
};

/** Souhrnná věta do deníku gildy. */
export const describeOfflineReport = (r: OfflineReport): string => {
  const hours = Math.floor(r.cappedMs / 3_600_000);
  const minutes = Math.floor((r.cappedMs % 3_600_000) / 60_000);
  const away = hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
  const parts = [`Během vaší nepřítomnosti (${away}) gilda dokončila ${r.questsCompleted} výprav`];
  if (r.questsFailed > 0) parts.push(`${r.questsFailed} selhalo`);
  parts.push(`vyděláno ${r.goldEarned} zlata`);
  if (r.materialsEarned > 0) parts.push(`nasbíráno ${r.materialsEarned} surovin`);
  if (r.itemsFound > 0) parts.push(`nalezeno ${r.itemsFound} předmětů`);
  return parts.join(', ') + '.';
};

export { totalMaterials };
