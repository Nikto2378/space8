import React from 'react';
import { GameEngine } from '../game/GameEngine.ts';
import { ITEMS } from '../items/ItemDefinitions.ts';
import { sound } from '../audio/SoundManager.ts';

interface HotbarProps {
  engine: GameEngine;
  selectedIndex: number;
  onSelectSlot: (index: number) => void;
}

export const Hotbar: React.FC<HotbarProps> = ({
  engine,
  selectedIndex,
  onSelectSlot,
}) => {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto select-none">
      <div className="flex items-center gap-1.5 p-2 bg-slate-950/85 backdrop-blur-md border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950/50">
        {engine.hotbar.map((slot, idx) => {
          const isSelected = selectedIndex === idx;
          const itemDef = slot ? ITEMS[slot.id] : null;

          return (
            <button
              key={idx}
              onClick={() => {
                onSelectSlot(idx);
                sound.playClick();
              }}
              className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-150 border text-left ${
                isSelected
                  ? 'bg-cyan-950/70 border-cyan-400 shadow-lg shadow-cyan-500/30 scale-105'
                  : 'bg-slate-900/60 border-slate-700/60 hover:border-slate-500 hover:bg-slate-800/60'
              }`}
              title={itemDef ? `${itemDef.name} - ${itemDef.description}` : `Слот ${idx + 1}`}
            >
              {/* Slot Number Badge */}
              <span className="absolute top-1 left-1.5 text-[9px] font-mono font-bold text-slate-400">
                {idx + 1}
              </span>

              {/* Item Visual Icon */}
              {itemDef && (
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center shadow-sm"
                  style={{
                    backgroundColor: `${itemDef.iconColor}25`,
                    borderColor: itemDef.iconColor,
                    borderWidth: 1.5,
                  }}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-sm shadow-sm"
                    style={{ backgroundColor: itemDef.iconColor }}
                  />
                </div>
              )}

              {/* Stack Count Badge */}
              {slot && slot.count > 1 && (
                <span className="absolute bottom-1 right-1 text-[10px] font-mono font-bold text-slate-100 bg-slate-950/80 px-1 rounded-sm border border-slate-700/60">
                  {slot.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
