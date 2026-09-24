import React, { useState } from 'react';
import { Play, Save, RotateCcw, Volume2, VolumeX, Home, Keyboard } from 'lucide-react';
import { sound } from '../audio/SoundManager.ts';
import { ConfirmNewGameModal } from './ConfirmNewGameModal.tsx';

interface PauseMenuProps {
  onResume: () => void;
  onSave: () => void;
  onRestart: () => void;
  onExitToMenu: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  onResume,
  onSave,
  onRestart,
  onExitToMenu,
  isMuted,
  onToggleMute,
}) => {
  const [showConfirmRestart, setShowConfirmRestart] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl max-w-md w-full p-6 text-center flex flex-col items-center">
        <h2 className="text-xl font-black text-cyan-400 uppercase tracking-widest mb-1">
          ПАУЗА
        </h2>
        <p className="text-xs text-slate-400 mb-6">Экспедиция временно приостановлена</p>

        {/* Buttons List */}
        <div className="flex flex-col gap-2.5 w-full mb-6">
          <button
            onClick={() => {
              sound.playClick();
              onResume();
            }}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-cyan-600/30 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            Продолжить игру
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onSave();
            }}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Сохранить прогресс
          </button>

          <button
            onClick={() => {
              onToggleMute();
            }}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            {isMuted ? 'Включить звук' : 'Выключить звук'}
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setShowConfirmRestart(true);
            }}
            className="w-full py-2.5 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 hover:text-amber-200 border border-amber-600/40 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Новая игра (сброс)
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onExitToMenu();
            }}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            Главное меню
          </button>
        </div>

        {/* Controls Cheatsheet */}
        <div className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-left">
          <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-slate-400 mb-2">
            <Keyboard className="w-3.5 h-3.5 text-cyan-400" /> Управление:
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] font-mono text-slate-300">
            <div><span className="text-cyan-400 font-bold">W / Пробел</span> — Прыжок / Ранец</div>
            <div><span className="text-cyan-400 font-bold">A / D</span> — Ходьба</div>
            <div><span className="text-cyan-400 font-bold">ЛКМ</span> — Копать / Атака</div>
            <div><span className="text-cyan-400 font-bold">ПКМ</span> — Строить / Лечить</div>
            <div><span className="text-cyan-400 font-bold">E</span> — Действие (Корабль/NPC)</div>
            <div><span className="text-cyan-400 font-bold">I</span> — Инвентарь / Крафт</div>
            <div><span className="text-cyan-400 font-bold">1-8</span> — Выбор слота</div>
            <div><span className="text-cyan-400 font-bold">ESC</span> — Пауза / Закрыть</div>
          </div>
        </div>
      </div>

      {showConfirmRestart && (
        <ConfirmNewGameModal
          onConfirm={() => {
            setShowConfirmRestart(false);
            onRestart();
          }}
          onCancel={() => setShowConfirmRestart(false)}
        />
      )}
    </div>
  );
};
