import React from 'react';
import { GameEngine } from '../game/GameEngine.ts';
import { PLANETS } from '../world/Planets.ts';
import { sound } from '../audio/SoundManager.ts';
import { Volume2, VolumeX, Pause, Backpack, Rocket, Shield, Pickaxe, Zap, RotateCcw } from 'lucide-react';

interface HUDProps {
  engine: GameEngine;
  onOpenInventory: () => void;
  onOpenStarMap: () => void;
  onTogglePause: () => void;
  onRequestNewGame: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  engine,
  onOpenInventory,
  onOpenStarMap,
  onTogglePause,
  onRequestNewGame,
  isMuted,
  onToggleMute,
}) => {
  const planetConfig = PLANETS[engine.world.planet];
  const stats = engine.player.getStats(engine.equipment);
  const hpPercent = Math.max(0, Math.min(100, (engine.player.hp / stats.maxHp) * 100));
  const energyPercent = Math.max(0, Math.min(100, (engine.player.energy / stats.maxEnergy) * 100));

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 select-none">
      {/* Top Header Row */}
      <div className="flex justify-between items-start w-full">
        {/* Left: Player Status & Planet Info */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          {/* Health & Energy Panel */}
          <div className="bg-slate-950/80 backdrop-blur-md border border-cyan-500/30 rounded-xl p-3 shadow-lg shadow-cyan-950/50 min-w-[280px]">
            {/* Health Bar */}
            <div className="mb-2">
              <div className="flex justify-between text-xs font-mono font-bold mb-1">
                <span className="text-rose-400 flex items-center gap-1">
                  ❤️ HP
                </span>
                <span className="text-rose-200">
                  {Math.round(engine.player.hp)} / {Math.round(stats.maxHp)}
                </span>
              </div>
              <div className="w-full bg-slate-800/80 h-3.5 rounded-full overflow-hidden border border-rose-500/30 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-rose-600 to-red-400 rounded-full transition-all duration-150 shadow-sm shadow-rose-500"
                  style={{ width: `${hpPercent}%` }}
                />
              </div>
            </div>

            {/* Energy Bar */}
            <div>
              <div className="flex justify-between text-xs font-mono font-bold mb-1">
                <span className="text-cyan-400 flex items-center gap-1">
                  ⚡ ЭНЕРГИЯ
                </span>
                <span className="text-cyan-200">
                  {Math.round(engine.player.energy)} / {Math.round(stats.maxEnergy)}
                </span>
              </div>
              <div className="w-full bg-slate-800/80 h-2.5 rounded-full overflow-hidden border border-cyan-500/30 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-cyan-600 to-sky-400 rounded-full transition-all duration-150 shadow-sm shadow-cyan-400"
                  style={{ width: `${energyPercent}%` }}
                />
              </div>
            </div>

            {/* Sub-stats Row */}
            <div className="mt-2.5 pt-2 border-t border-slate-800 flex justify-between text-[11px] font-mono text-slate-300">
              <span className="flex items-center gap-1 text-slate-400" title="Защита скафандра">
                <Shield className="w-3.5 h-3.5 text-sky-400" />
                {stats.defense}
              </span>
              <span className="flex items-center gap-1 text-slate-400" title="Мощность бурения">
                <Pickaxe className="w-3.5 h-3.5 text-amber-400" />
                x{stats.miningPower.toFixed(1)}
              </span>
              <span className="flex items-center gap-1 text-slate-400" title="Урон оружия">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                {stats.damage}
              </span>
            </div>
          </div>

          {/* Active Buffs (Drinks & Stimulants) */}
          {(engine.player.shieldHp > 0 ||
            engine.player.speedBuffTime > 0 ||
            engine.player.defenseBuffTime > 0) && (
            <div className="flex flex-wrap gap-1.5 max-w-[280px]">
              {engine.player.shieldHp > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-950/90 border border-cyan-400/50 rounded-lg text-xs font-mono text-cyan-200 shadow-md animate-pulse">
                  <span>🛡️ Щит:</span>
                  <span className="font-bold">+{engine.player.shieldHp} HP</span>
                </div>
              )}
              {engine.player.speedBuffTime > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-950/90 border border-amber-400/50 rounded-lg text-xs font-mono text-amber-200 shadow-md">
                  <span>⚡ Ускорение:</span>
                  <span className="font-bold">{Math.ceil(engine.player.speedBuffTime)}с</span>
                </div>
              )}
              {engine.player.defenseBuffTime > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-950/90 border border-orange-400/50 rounded-lg text-xs font-mono text-orange-200 shadow-md">
                  <span>🛡️ Магма-броня:</span>
                  <span className="font-bold">{Math.ceil(engine.player.defenseBuffTime)}с</span>
                </div>
              )}
            </div>
          )}

          {/* Current Planet Badge */}
          <div
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border backdrop-blur-md shadow-md text-xs font-medium w-fit"
            style={{
              backgroundColor: `${planetConfig.themeColor}15`,
              borderColor: `${planetConfig.themeColor}50`,
              color: '#f8fafc',
            }}
          >
            <div
              className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: planetConfig.themeColor }}
            />
            <span className="font-semibold">{planetConfig.russianName}</span>
            <span className="text-slate-400 text-[10px]">({planetConfig.tagline})</span>
          </div>
        </div>

        {/* Center: Boss Health Bar (if active) */}
        {engine.boss && (
          <div className="pointer-events-auto flex flex-col items-center max-w-lg w-full px-4">
            <div className="bg-slate-950/90 backdrop-blur-md border border-red-500/50 rounded-xl px-5 py-2.5 shadow-2xl shadow-red-950/80 w-full animate-pulse">
              <div className="flex justify-between items-center text-xs font-mono font-bold mb-1.5">
                <span className="text-red-400 text-sm tracking-wide flex items-center gap-2">
                  ☠️ {engine.boss.name}
                </span>
                <span className="text-red-200">
                  {Math.round(engine.boss.hp)} / {engine.boss.maxHp}
                </span>
              </div>
              <div className="w-full bg-slate-900 h-4 rounded-full overflow-hidden border border-red-500/40 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-rose-400 rounded-full transition-all duration-100 shadow-md shadow-red-500"
                  style={{ width: `${Math.max(0, (engine.boss.hp / engine.boss.maxHp) * 100)}%` }}
                />
              </div>
              {engine.boss.phase > 1 && (
                <div className="text-[10px] text-center text-amber-400 font-mono mt-1 font-semibold">
                  ФАЗА {engine.boss.phase}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Audio Mute Button */}
          <button
            onClick={onToggleMute}
            className="p-2.5 bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 rounded-xl backdrop-blur-md transition-all shadow-md active:scale-95"
            title={isMuted ? 'Включить звук' : 'Выключить звук'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* Star Map Button */}
          <button
            onClick={onOpenStarMap}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 border border-indigo-500/40 rounded-xl backdrop-blur-md transition-all shadow-md active:scale-95 text-xs font-semibold"
            title="Карта галактики (Шаттл)"
          >
            <Rocket className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Шаттл</span>
          </button>

          {/* Inventory Button */}
          <button
            onClick={onOpenInventory}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900/80 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 rounded-xl backdrop-blur-md transition-all shadow-md active:scale-95 text-xs font-semibold"
            title="Открыть инвентарь и крафт [I]"
          >
            <Backpack className="w-4 h-4 text-cyan-400" />
            <span>Инвентарь [I]</span>
          </button>

          {/* New Game Button */}
          <button
            onClick={onRequestNewGame}
            className="flex items-center gap-1.5 px-2.5 py-2 bg-slate-900/80 hover:bg-amber-950/60 text-slate-300 hover:text-amber-300 border border-slate-700 hover:border-amber-500/50 rounded-xl backdrop-blur-md transition-all shadow-md active:scale-95 text-xs font-semibold"
            title="Начать новую игру (сброс)"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">Новая игра</span>
          </button>

          {/* Pause Button */}
          <button
            onClick={onTogglePause}
            className="p-2.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl backdrop-blur-md transition-all shadow-md active:scale-95"
            title="Пауза [ESC]"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
