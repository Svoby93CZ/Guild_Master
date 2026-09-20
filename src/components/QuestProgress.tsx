import React, { useEffect, useState } from 'react';

interface Props {
  /** Kdy výprava začala. */
  startedAt: number;
  /** Jak dlouho trvá, včetně zkrácení od vylepšení gildy. */
  durationMs: number;
}

/**
 * Ukazatel postupu výpravy, který si čas měří sám.
 *
 * Dřív tikal časovač v `App` a překresloval tím celý herní strom desetkrát za
 * sekundu. Tady se překresluje jen tenhle jeden pruh, takže zbytek rozhraní
 * zůstává v klidu.
 */
export default function QuestProgress({ startedAt, durationMs }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  const elapsed = Math.max(0, now - startedAt);
  const percent = durationMs > 0 ? Math.min(100, (elapsed / durationMs) * 100) : 100;
  const remainingMs = Math.max(0, durationMs - elapsed);

  return (
    <div className="mt-3 relative z-10">
      <div className="flex justify-between text-[10px] uppercase font-bold mb-1 text-indigo-300">
        <span>Výprava</span>
        <span>{Math.ceil(remainingMs / 1000)}s</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-400 rounded-full transition-[width] duration-200 ease-linear"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
