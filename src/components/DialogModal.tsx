import React from 'react';
import { NPC } from '../entities/NPC.ts';
import { GameEngine } from '../game/GameEngine.ts';
import { ITEMS } from '../items/ItemDefinitions.ts';
import { getItemCount } from '../systems/Crafting.ts';
import { sound } from '../audio/SoundManager.ts';
import { X, MessageSquare, ShoppingBag, Lightbulb } from 'lucide-react';

interface DialogModalProps {
  npc: NPC;
  engine: GameEngine;
  onClose: () => void;
  onRefresh: () => void;
}

export const DialogModal: React.FC<DialogModalProps> = ({
  npc,
  engine,
  onClose,
  onRefresh,
}) => {
  const data = npc.data;

  const handleBuy = (trade: NonNullable<typeof data.trades>[number]) => {
    const owned = getItemCount(trade.priceItemId, engine.inventory, engine.hotbar);
    if (owned < trade.priceCount) return;

    sound.playClick();

    // Deduct cost items
    let needed = trade.priceCount;
    for (let i = 0; i < engine.hotbar.length; i++) {
      const slot = engine.hotbar[i];
      if (slot && slot.id === trade.priceItemId) {
        const take = Math.min(needed, slot.count);
        slot.count -= take;
        needed -= take;
        if (slot.count <= 0) engine.hotbar[i] = null;
        if (needed <= 0) break;
      }
    }
    if (needed > 0) {
      for (let i = 0; i < engine.inventory.length; i++) {
        const slot = engine.inventory[i];
        if (slot && slot.id === trade.priceItemId) {
          const take = Math.min(needed, slot.count);
          slot.count -= take;
          needed -= take;
          if (slot.count <= 0) engine.inventory[i] = null;
          if (needed <= 0) break;
        }
      }
    }

    // Add purchased item
    engine.addItem(trade.itemId, trade.count);
    sound.playPickup();
    onRefresh();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl max-w-xl w-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shadow-md font-bold text-white text-sm"
              style={{ backgroundColor: data.color }}
            >
              {data.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">{data.name}</h2>
              <p className="text-[11px] text-cyan-400 font-mono">{data.role}</p>
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

        {/* Dialog Content */}
        <div className="p-6 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
          {/* NPC Dialogue text bubble */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex gap-3">
            <MessageSquare className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
              {data.dialogue.map((line, idx) => (
                <p key={idx}>{line}</p>
              ))}
            </div>
          </div>

          {/* Useful Tips */}
          {data.tips && data.tips.length > 0 && (
            <div className="bg-cyan-950/30 border border-cyan-500/30 rounded-xl p-3 flex gap-2.5 items-center">
              <Lightbulb className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="text-[11px] text-cyan-200">
                {data.tips.map((tip, idx) => (
                  <p key={idx}>{tip}</p>
                ))}
              </div>
            </div>
          )}

          {/* Merchant Shop Trades (if merchant) */}
          {data.trades && (
            <div>
              <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-amber-400" /> Товары и обмен
              </h3>
              <div className="flex flex-col gap-2">
                {data.trades.map((trade) => {
                  const buyItem = ITEMS[trade.itemId];
                  const costItem = ITEMS[trade.priceItemId];
                  const ownedCost = getItemCount(
                    trade.priceItemId,
                    engine.inventory,
                    engine.hotbar
                  );
                  const canBuy = ownedCost >= trade.priceCount;

                  return (
                    <div
                      key={trade.id}
                      className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{
                            backgroundColor: `${buyItem?.iconColor}25`,
                            borderColor: buyItem?.iconColor,
                            borderWidth: 1.5,
                          }}
                        >
                          <div
                            className="w-4 h-4 rounded-sm"
                            style={{ backgroundColor: buyItem?.iconColor }}
                          />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-slate-200">
                            {buyItem?.name} {trade.count > 1 && `x${trade.count}`}
                          </span>
                          <p className="text-[10px] text-slate-400">{buyItem?.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs font-mono font-bold ${
                            canBuy ? 'text-amber-400' : 'text-rose-400'
                          }`}
                        >
                          {costItem?.name}: {ownedCost}/{trade.priceCount}
                        </span>
                        <button
                          disabled={!canBuy}
                          onClick={() => handleBuy(trade)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            canBuy
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md cursor-pointer active:scale-95'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                          }`}
                        >
                          Купить
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
