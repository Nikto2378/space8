import React, { useState } from 'react';
import { Rocket, Play, RotateCcw, Compass, Hammer, Skull } from 'lucide-react';
import { sound } from '../audio/SoundManager.ts';
import { ConfirmNewGameModal } from './ConfirmNewGameModal.tsx';

interface MainMenuProps {
  hasSave: boolean;
  onContinue: () => void;
  onNewGame: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  hasSave,
  onContinue,
  onNewGame,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleNewGameClick = () => {
    sound.playClick();
    if (hasSave) {
      setShowConfirm(true);
    } else {
      onNewGame();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 select-none overflow-y-auto">
      <div className="max-w-xl w-full flex flex-col items-center text-center my-auto py-8">
        {/* Glowing Logo Icon */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-cyan-500/50 border border-cyan-400/40 animate-pulse">
            <Rocket className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-slate-950 animate-ping" />
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 tracking-wider uppercase mb-2">
          КОСМИЧЕСКАЯ ИГРА
        </h1>
        <p className="text-xs sm:text-sm text-cyan-200/80 font-mono tracking-wide mb-8 uppercase">
          2D Sandbox Survival Adventure
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-full max-w-xs mb-10">
          {hasSave && (
            <button
              onClick={() => {
                sound.playClick();
                onContinue();
              }}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-sky-500 hover:from-cyan-500 hover:to-sky-400 text-white rounded-2xl text-sm font-bold transition-all shadow-xl shadow-cyan-600/40 active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-cyan-300/30"
            >
              <Play className="w-4 h-4 fill-white" />
              Продолжить экспедицию
            </button>
          )}

          <button
            onClick={handleNewGameClick}
            className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer border ${
              !hasSave
                ? 'bg-gradient-to-r from-cyan-600 to-sky-500 hover:from-cyan-500 hover:to-sky-400 text-white shadow-xl shadow-cyan-600/40 border-cyan-300/30'
                : 'bg-slate-900/80 hover:bg-slate-800 text-cyan-200 border-cyan-500/30 hover:border-cyan-400'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            {hasSave ? 'Новая игра (сбросить)' : 'Начать новую игру'}
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full text-left font-mono text-xs">
          <div className="p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl backdrop-blur-md">
            <Compass className="w-5 h-5 text-cyan-400 mb-2" />
            <h4 className="font-bold text-slate-200 mb-1">3 Планеты</h4>
            <p className="text-[11px] text-slate-400 leading-tight">
              Новая, Красная и Пустошь с процедурными биомами и пещерами.
            </p>
          </div>

          <div className="p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl backdrop-blur-md">
            <Hammer className="w-5 h-5 text-amber-400 mb-2" />
            <h4 className="font-bold text-slate-200 mb-1">Добыча & Крафт</h4>
            <p className="text-[11px] text-slate-400 leading-tight">
              Бурите породу, стройте базы, создавайте плазменные клинки и джетпаки.
            </p>
          </div>

          <div className="p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl backdrop-blur-md">
            <Skull className="w-5 h-5 text-rose-400 mb-2" />
            <h4 className="font-bold text-slate-200 mb-1">3 Босса</h4>
            <p className="text-[11px] text-slate-400 leading-tight">
              Сразите Стража, Левиафана и 3-фазного Омега-Оверлорда.
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <ConfirmNewGameModal
          onConfirm={() => {
            setShowConfirm(false);
            onNewGame();
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
};
