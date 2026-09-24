import React from 'react';
import { GameEngine } from '../game/GameEngine.ts';
import { Trophy, Rocket, RotateCcw, Sparkles } from 'lucide-react';
import { sound } from '../audio/SoundManager.ts';

interface VictoryModalProps {
  engine: GameEngine;
  onContinue: () => void;
  onNewGame: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  engine,
  onContinue,
  onNewGame,
}) => {
  const mins = Math.floor(engine.stats.timePlayedSec / 60);
  const secs = Math.floor(engine.stats.timePlayedSec % 60);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-lg flex items-center justify-center p-4 select-none animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-purple-500/50 rounded-3xl shadow-2xl shadow-purple-950/90 max-w-lg w-full p-8 text-center flex flex-col items-center">
        {/* Glow Trophy Icon */}
        <div className="w-20 h-20 rounded-full bg-purple-500/20 border-2 border-purple-400 flex items-center justify-center shadow-lg shadow-purple-500/40 mb-5 animate-bounce">
          <Trophy className="w-10 h-10 text-amber-400" />
        </div>

        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 tracking-wide uppercase mb-2">
          МИССИЯ ВЫПОЛНЕНА!
        </h1>
        <p className="text-sm text-purple-200/80 mb-6">
          Омега-Оверлорд повержен! Космос спасен от разрушительной сингулярности. Вы стали легендарным покорителем галактики!
        </p>

        {/* Stats Grid */}
        <div className="w-full bg-slate-950/80 border border-purple-500/30 rounded-2xl p-4 mb-6 grid grid-cols-2 gap-3 text-left font-mono text-xs">
          <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px]">ВРЕМЯ ЭКСПЕДИЦИИ</span>
            <span className="text-cyan-300 font-bold text-sm">
              {mins}м {secs}с
            </span>
          </div>
          <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px]">БОССОВ УНИЧТОЖЕНО</span>
            <span className="text-amber-400 font-bold text-sm">
              {engine.stats.bossesKilled} / 3
            </span>
          </div>
          <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px]">БЛОКОВ ДОБЫТО</span>
            <span className="text-emerald-400 font-bold text-sm">
              {engine.stats.blocksMined}
            </span>
          </div>
          <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px]">ВРАГОВ ЛИКВИДИРОВАНО</span>
            <span className="text-rose-400 font-bold text-sm">
              {engine.stats.enemiesKilled}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={() => {
              sound.playClick();
              onContinue();
            }}
            className="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-purple-600/30 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            Продолжить песочницу
          </button>
          <button
            onClick={() => {
              sound.playClick();
              onNewGame();
            }}
            className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-bold transition-all border border-slate-700 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Новая игра
          </button>
        </div>
      </div>
    </div>
  );
};
