import React from 'react';
import { GameEngine } from '../game/GameEngine.ts';
import { PLANETS } from '../world/Planets.ts';
import { PlanetId } from '../types.ts';
import { sound } from '../audio/SoundManager.ts';
import { X, Rocket, Lock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { getItemCount } from '../systems/Crafting.ts';

interface StarMapModalProps {
  engine: GameEngine;
  onClose: () => void;
  onTravel: (planet: PlanetId) => void;
}

export const StarMapModal: React.FC<StarMapModalProps> = ({
  engine,
  onClose,
  onTravel,
}) => {
  const hasWarpDrive =
    engine.defeatedBosses.includes('nova') ||
    getItemCount('warp_drive', engine.inventory, engine.hotbar) > 0;

  const hasHyperCore =
    engine.defeatedBosses.includes('ares') ||
    getItemCount('hyper_core', engine.inventory, engine.hotbar) > 0;

  const planetsList: { id: PlanetId; unlocked: boolean; reqText?: string }[] = [
    {
      id: 'nova',
      unlocked: true,
    },
    {
      id: 'ares',
      unlocked: hasWarpDrive,
      reqText: 'Требуется: Варп-Двигатель (победите Древнего Стража на Новой)',
    },
    {
      id: 'void',
      unlocked: hasHyperCore,
      reqText: 'Требуется: Квантовое Гиперядро (победите Левиафана на Красной)',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl shadow-2xl shadow-indigo-950/80 max-w-2xl w-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <Rocket className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-100">Навигационная консоль Шаттла</h2>
              <p className="text-[11px] text-slate-400">Выберите координаты гиперпрыжка</p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Planet Selection Cards */}
        <div className="p-6 flex flex-col gap-3.5">
          {planetsList.map(({ id, unlocked, reqText }) => {
            const cfg = PLANETS[id];
            const isCurrent = engine.world.planet === id;

            return (
              <div
                key={id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                  isCurrent
                    ? 'bg-indigo-950/50 border-indigo-400 shadow-md shadow-indigo-950/50'
                    : unlocked
                    ? 'bg-slate-950/70 border-slate-700/80 hover:border-slate-500 hover:bg-slate-950/90'
                    : 'bg-slate-950/30 border-slate-800/40 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  {/* Planet Icon sphere */}
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-lg"
                    style={{
                      backgroundColor: cfg.themeColor,
                      boxShadow: `0 0 16px ${cfg.themeColor}80`,
                    }}
                  >
                    {isCurrent ? (
                      <CheckCircle2 className="w-6 h-6 text-slate-950" />
                    ) : !unlocked ? (
                      <Lock className="w-5 h-5 text-slate-950" />
                    ) : (
                      <Rocket className="w-5 h-5 text-slate-950" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-100">{cfg.russianName}</span>
                      <span className="text-[10px] font-mono text-slate-400">({cfg.name})</span>
                      {isCurrent && (
                        <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full">
                          Текущая позиция
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 max-w-md">{cfg.description}</p>
                    {!unlocked && reqText && (
                      <div className="flex items-center gap-1.5 text-xs text-amber-400 mt-1.5 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{reqText}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Travel Button */}
                <div>
                  {isCurrent ? (
                    <span className="text-xs font-mono text-indigo-300 px-3 py-1.5 rounded-lg bg-indigo-950/80 border border-indigo-500/30">
                      На орбите
                    </span>
                  ) : unlocked ? (
                    <button
                      onClick={() => onTravel(id)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 active:scale-95 cursor-pointer whitespace-nowrap"
                    >
                      Совершить прыжок
                    </button>
                  ) : (
                    <span className="text-xs font-mono text-slate-500 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                      Заблокировано
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
