/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/GameEngine.ts';
import { SaveSystem } from './systems/SaveSystem.ts';
import { HUD } from './components/HUD.tsx';
import { Hotbar } from './components/Hotbar.tsx';
import { InventoryModal } from './components/InventoryModal.tsx';
import { StarMapModal } from './components/StarMapModal.tsx';
import { DialogModal } from './components/DialogModal.tsx';
import { VictoryModal } from './components/VictoryModal.tsx';
import { PauseMenu } from './components/PauseMenu.tsx';
import { MainMenu } from './components/MainMenu.tsx';
import { ConfirmNewGameModal } from './components/ConfirmNewGameModal.tsx';
import { sound } from './audio/SoundManager.ts';
import { PlanetId } from './types.ts';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [inMainMenu, setInMainMenu] = useState<boolean>(true);
  const [hasExistingSave, setHasExistingSave] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showConfirmNewGame, setShowConfirmNewGame] = useState<boolean>(false);
  const [, setRenderTrigger] = useState<number>(0);

  // Notifications Toast
  const [toast, setToast] = useState<{ msg: string; color: string } | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const showNotification = useCallback((msg: string, color: string = '#38bdf8') => {
    setToast({ msg, color });
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToast(null);
    }, 2800);
  }, []);

  // Sync state between canvas engine and React
  const refreshUI = useCallback(() => {
    setRenderTrigger((prev) => prev + 1);
  }, []);

  // Initialize Canvas & Engine
  useEffect(() => {
    setHasExistingSave(SaveSystem.hasSave());

    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const engine = new GameEngine(canvas);
    engineRef.current = engine;

    engine.onStateChange = refreshUI;
    engine.onNotification = showNotification;

    const handleResize = () => {
      if (canvas && engineRef.current) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        engineRef.current.resize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.stop();
    };
  }, [refreshUI, showNotification]);

  // Start / Continue handlers
  const handleContinue = () => {
    const save = SaveSystem.load();
    if (save && engineRef.current) {
      engineRef.current.loadSave(save);
      showNotification('СОХРАНЕНИЕ ЗАГРУЖЕНО', '#10b981');
    }
    setInMainMenu(false);
    engineRef.current?.start();
  };

  const handleNewGame = () => {
    if (engineRef.current) {
      engineRef.current.startNewGame();
      showNotification('НОВАЯ ЭКСПЕДИЦИЯ НАЧАТА', '#38bdf8');
    }
    setHasExistingSave(true);
    setInMainMenu(false);
    setShowConfirmNewGame(false);
    engineRef.current?.start();
  };

  const handleManualSave = () => {
    if (engineRef.current) {
      engineRef.current.saveGame();
      setHasExistingSave(true);
      showNotification('ПРОГРЕСС СОХРАНЕН В ПАМЯТЬ БАЗЫ', '#10b981');
    }
  };

  const handleExitToMenu = () => {
    if (engineRef.current) {
      engineRef.current.saveGame();
      engineRef.current.stop();
      engineRef.current.isPaused = false;
    }
    setHasExistingSave(SaveSystem.hasSave());
    setInMainMenu(true);
  };

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
    showNotification(muted ? 'ЗВУК ОТКЛЮЧЕН' : 'ЗВУК ВКЛЮЧЕН', '#94a3b8');
  };

  const engine = engineRef.current;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* Game Rendering Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair"
      />

      {/* Main Start Menu */}
      {inMainMenu && (
        <MainMenu
          hasSave={hasExistingSave}
          onContinue={handleContinue}
          onNewGame={handleNewGame}
        />
      )}

      {/* In-Game HUD & Modals */}
      {!inMainMenu && engine && (
        <>
          <HUD
            engine={engine}
            onOpenInventory={() => {
              engine.isInventoryOpen = true;
              refreshUI();
            }}
            onOpenStarMap={() => {
              engine.isStarMapOpen = true;
              refreshUI();
            }}
            onTogglePause={() => {
              engine.isPaused = !engine.isPaused;
              refreshUI();
            }}
            onRequestNewGame={() => {
              setShowConfirmNewGame(true);
            }}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
          />

          <Hotbar
            engine={engine}
            selectedIndex={engine.selectedHotbarIndex}
            onSelectSlot={(idx) => {
              engine.selectedHotbarIndex = idx;
              refreshUI();
            }}
          />

          {/* Inventory & Crafting Modal */}
          {engine.isInventoryOpen && (
            <InventoryModal
              engine={engine}
              onClose={() => {
                engine.isInventoryOpen = false;
                refreshUI();
              }}
              onRefresh={refreshUI}
            />
          )}

          {/* Interplanetary Travel Star Map */}
          {engine.isStarMapOpen && (
            <StarMapModal
              engine={engine}
              onClose={() => {
                engine.isStarMapOpen = false;
                refreshUI();
              }}
              onTravel={(targetPlanet: PlanetId) => {
                engine.switchPlanet(targetPlanet, true);
                refreshUI();
              }}
            />
          )}

          {/* NPC Dialogue & Shop Modal */}
          {engine.activeNPC && (
            <DialogModal
              npc={engine.activeNPC}
              engine={engine}
              onClose={() => {
                engine.activeNPC = null;
                refreshUI();
              }}
              onRefresh={refreshUI}
            />
          )}

          {/* Victory Modal */}
          {engine.showVictory && (
            <VictoryModal
              engine={engine}
              onContinue={() => {
                engine.showVictory = false;
                refreshUI();
              }}
              onNewGame={() => {
                engine.showVictory = false;
                handleNewGame();
              }}
            />
          )}

          {/* Pause Menu */}
          {engine.isPaused && (
            <PauseMenu
              onResume={() => {
                engine.isPaused = false;
                refreshUI();
              }}
              onSave={handleManualSave}
              onRestart={() => {
                engine.isPaused = false;
                handleNewGame();
              }}
              onExitToMenu={handleExitToMenu}
              isMuted={isMuted}
              onToggleMute={handleToggleMute}
            />
          )}

          {/* Quick HUD New Game Confirmation Modal */}
          {showConfirmNewGame && (
            <ConfirmNewGameModal
              onConfirm={() => {
                handleNewGame();
              }}
              onCancel={() => {
                setShowConfirmNewGame(false);
              }}
            />
          )}
        </>
      )}

      {/* Floating Notification Toast */}
      {toast && (
        <div
          className="absolute top-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-slate-950/90 border backdrop-blur-md shadow-xl text-xs font-mono font-bold animate-in fade-in slide-in-from-top-4 duration-200 pointer-events-none z-50 flex items-center gap-2"
          style={{ borderColor: `${toast.color}80`, color: toast.color }}
        >
          <div className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: toast.color }} />
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
