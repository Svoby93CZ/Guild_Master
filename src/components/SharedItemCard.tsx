import React from 'react';
import { InventoryItem } from '../types';
import { cn } from '../lib/utils';
import { Sword, Shield } from 'lucide-react';

export const RarityClasses = {
  common: 'bg-slate-800 border-2 border-slate-700 text-slate-300',
  uncommon: 'bg-slate-800 border-2 border-emerald-500/50 ring-2 ring-emerald-500/10 shadow-[inset_0_0_12px_rgba(16,185,129,0.1)] text-emerald-300',
  rare: 'bg-slate-800 border-2 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.3)] text-blue-300',
  epic: 'bg-slate-800 border-2 border-purple-500/50 ring-2 ring-purple-500/10 shadow-[inset_0_0_12px_rgba(168,85,247,0.1)] text-purple-300',
  legendary: 'bg-slate-800 border-2 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] text-amber-300'
};

export const ItemCard = ({ item, draggable = true, onDragStart, onClick }: { item: InventoryItem, draggable?: boolean, onDragStart?: (e: React.DragEvent) => void, onClick?: () => void }) => {
  return (
    <div 
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onClick}
      className={cn(
        "p-2 rounded-lg flex flex-col justify-center cursor-grab active:cursor-grabbing hover:brightness-110 transition-all select-none w-full h-full min-h-[4rem]",
        RarityClasses[item.rarity],
        onClick ? "cursor-pointer" : ""
      )}
      title={`${item.name}\nÚtok: ${item.attack}\nObrana: ${item.defense}\nCena: ${item.value}`}
    >
      <div className="font-bold truncate text-[11px] uppercase tracking-wider">{item.name}</div>
      <div className="flex gap-2 mt-1 text-[10px] font-bold">
        {item.attack > 0 && <span className="flex items-center gap-0.5"><Sword size={10} /> {item.attack}</span>}
        {item.defense > 0 && <span className="flex items-center gap-0.5"><Shield size={10} /> {item.defense}</span>}
      </div>
    </div>
  );
};
