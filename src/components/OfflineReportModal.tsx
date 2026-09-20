import React from 'react';
import { OfflineReport } from '../types';
import { motion } from 'motion/react';
import { Coins, Pickaxe, Sword, Star, CheckCircle2, XCircle, Moon } from 'lucide-react';

interface Props {
  report: OfflineReport;
  onClose: () => void;
}

const formatAway = (ms: number) => {
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  if (hours > 0) return `${hours} h ${minutes} min`;
  return `${minutes} min`;
};

/** Uvítací přehled toho, co gilda stihla, zatímco hru nikdo nesledoval. */
export default function OfflineReportModal({ report, onClose }: Props) {
  const wasCapped = report.elapsedMs > report.cappedMs;

  const rows = [
    { icon: CheckCircle2, label: 'Dokončené výpravy', value: report.questsCompleted, className: 'text-emerald-400' },
    { icon: XCircle, label: 'Neúspěšné výpravy', value: report.questsFailed, className: 'text-rose-400' },
    { icon: Coins, label: 'Vydělané zlato', value: report.goldEarned, className: 'text-amber-400' },
    { icon: Star, label: 'Získané XP', value: report.xpEarned, className: 'text-indigo-400' },
    { icon: Pickaxe, label: 'Nasbírané suroviny', value: report.materialsEarned, className: 'text-blue-400' },
    { icon: Sword, label: 'Nalezené předměty', value: report.itemsFound, className: 'text-purple-400' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md gothic-panel rounded-2xl border border-amber-500/30 p-6 flex flex-col gap-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-950/50 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0">
            <Moon size={24} />
          </div>
          <div>
            <h2 className="font-gothic font-bold text-amber-100 text-xl tracking-wide">Vítejte zpět</h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Gilda pracovala {formatAway(report.cappedMs)} bez vás.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          {rows.map(({ icon: Icon, label, value, className }) => (
            <div
              key={label}
              className="flex items-center justify-between bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2"
            >
              <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <Icon size={13} className={className} />
                {label}
              </span>
              <span className={`text-sm font-mono font-black ${value > 0 ? className : 'text-slate-600'}`}>
                {value}
              </span>
            </div>
          ))}
        </div>

        {wasCapped && (
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed border-l-2 border-slate-700 pl-3">
            Byli jste pryč {formatAway(report.elapsedMs)}, ale gilda dopočítává nejvýš 8 hodin.
            Delší nepřítomnost už se nesčítá.
          </p>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-lg font-black uppercase text-xs tracking-widest bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-[0_4px_0_#b45309] active:translate-y-1 active:shadow-none cursor-pointer"
        >
          Pokračovat
        </button>
      </motion.div>
    </div>
  );
}
