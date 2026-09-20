# Guild Master

Idle/manažerská RPG hra v češtině. Spravuješ gildu dobrodruhů: najímáš hrdiny,
vybavuješ je, posíláš na výpravy, zpracováváš suroviny a v kovárně kuješ lepší
výbavu.

Hra běží i bez tebe: hrdinové se dají přepnout na automatické opakování výpravy
a po návratu do hry se dopočítá až osm hodin nepřítomnosti.

## Spuštění

Potřebuješ Node.js 20 nebo novější.

```bash
npm install
npm run dev
```

Hra pak běží na <http://localhost:3000>. Vývojový server poslouchá i na
síti, takže si ji rovnou otevřeš v mobilu na adrese `http://<IP-počítače>:3000`
(Vite ji po spuštění vypíše jako „Network"). Na Pop!_OS zjistíš IP příkazem
`hostname -I`.

Další příkazy:

```bash
npm run lint     # typová kontrola (tsc --noEmit)
npm test         # testy herních pravidel (vitest)
npm run build    # produkční build do dist/
npm run preview  # náhled produkčního buildu
```

## Sdílení

Hra je čistě statická – nepotřebuje žádný server ani databázi a postup si
ukládá do prohlížeče. Dá se proto vystavit kdekoli.

**GitHub Pages** je nastavená v `.github/workflows/deploy.yml`. Stačí
jednorázově zapnout Settings → Pages → Source: **GitHub Actions**. Potom se
hra nasadí při každém pushi do `main` (nebo ručně tlačítkem *Run workflow*)
na adresu `https://<uživatel>.github.io/Guild_Master/`.

**Jiný hosting** (Netlify, Vercel, vlastní web): stačí nahrát obsah složky
`dist` po `npm run build`. Pokud hra poběží v podadresáři, nastav při buildu
cestu proměnnou `BASE_PATH`, například `BASE_PATH=/hry/guild-master/ npm run build`.

## Struktura

| Cesta | Obsah |
| --- | --- |
| `src/game/rules.ts` | čisté výpočty: úrovně, souboj, ceny, vylepšení, sláva |
| `src/game/quests.ts` | vyhodnocení výpravy a generování nekonečné vývěsky |
| `src/game/offline.ts` | dopočet postupu, který proběhl mimo hru |
| `src/game/__tests__/` | testy herních pravidel |
| `src/hooks/useGameEngine.ts` | herní stav, smyčka, ukládání a herní akce |
| `src/data/constants.ts` | herní obsah – ručně psané úkoly, předměty, počáteční hrdinové |
| `src/components/` | uživatelské rozhraní (gilda, kovárna, truhla, síň gildy) |
| `src/types.ts` | datové typy včetně podoby uloženého postupu |

### Kde co přidávat

Všechny výpočty patří do `src/game/` jako čisté funkce s předávaným
generátorem náhody (`rng`). Stejnou logikou se pak vyhodnocuje běžící hra
i offline dopočet a dá se otestovat bez prohlížeče.

Nový ručně psaný úkol nebo předmět stačí dopsat do `src/data/constants.ts` –
vývěska se skládá z těchto úkolů plus generovaných smluv podle úrovně
nejlepšího hrdiny, takže se nový obsah objeví i rozehraným gildám.

## Uložený postup

Hra se ukládá do `localStorage` pod klíčem `guild_master_save`. Do savu jde
pouze postup hráče – katalog úkolů a předmětů se vždy načítá z
`src/data/constants.ts`, takže nově přidaný obsah se objeví i rozehraným
gildám. Starší savy převádí funkce `migrateSave` v `useGameEngine.ts`; když
budeš měnit podobu stavu, doplň migraci tam a zvyš `SAVE_VERSION`.

Součástí savu je i čas zápisu (`savedAt`), ze kterého se při načtení počítá
offline postup (`src/game/offline.ts`, strop osm hodin).
