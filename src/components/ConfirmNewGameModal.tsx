import React from 'react';
import { RotateCcw, X, AlertTriangle } from 'lucide-react';
import { sound } from '../audio/SoundManager.ts';

interface ConfirmNewGameModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmNewGameModal: React.FC<ConfirmNewGameModalProps> = ({
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl shadow-amber-950/50 max-w-md w-full p-6 text-center relative flex flex-col items-center">
        {/* Close Button */}
        <button
          onClick={() => {
            sound.playClick();
            onCancel();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Отмена"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Icon */}
        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 mb-4 shadow-lg shadow-amber-500/20">
          <AlertTriangle className="w-7 h-7" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-black text-slate-100 uppercase tracking-wide mb-2">
          Начать новую игру?
        </h3>

        <p className="text-xs text-slate-300 mb-6 leading-relaxed">
          Текущий прогресс экспедиции, исследованные планеты, добытая руда и снаряжение будут сброшены. Вы начнете заново с посадочной базы на планете <span className="text-cyan-400 font-bold">Новая</span>.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={() => {
              sound.playClick();
              onConfirm();
            }}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-900/40 active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-amber-400/30"
          >
            <RotateCcw className="w-4 h-4" />
            Да, начать заново
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onCancel();
            }}
            className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-700 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
};
