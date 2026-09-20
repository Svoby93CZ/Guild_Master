# Guild Master

Idle/manažerská RPG hra v češtině. Spravuješ gildu dobrodruhů: najímáš hrdiny,
vybavuješ je, posíláš na výpravy, zpracováváš suroviny a v kovárně kuješ lepší
výbavu.

## Spuštění

Potřebuješ Node.js 20 nebo novější.

```bash
npm install
npm run dev      # vývojový server na http://localhost:3000
```

Další příkazy:

```bash
npm run lint     # typová kontrola (tsc --noEmit)
npm run build    # produkční build do dist/
npm run preview  # náhled produkčního buildu
```

## Struktura

| Cesta | Obsah |
| --- | --- |
| `src/hooks/useGameEngine.ts` | herní stav, smyčka, ukládání a všechny herní akce |
| `src/data/constants.ts` | herní obsah – úkoly, předměty, XP tabulka, počáteční hrdinové |
| `src/components/` | uživatelské rozhraní (gilda, kovárna, truhla, detail hrdiny) |
| `src/types.ts` | datové typy včetně podoby uloženého postupu |

## Uložený postup

Hra se ukládá do `localStorage` pod klíčem `guild_master_save`. Do savu jde
pouze postup hráče – katalog úkolů a předmětů se vždy načítá z
`src/data/constants.ts`, takže nově přidaný obsah se objeví i rozehraným
gildám. Starší savy převádí funkce `migrateSave` v `useGameEngine.ts`; když
budeš měnit podobu stavu, doplň migraci tam a zvyš `SAVE_VERSION`.
