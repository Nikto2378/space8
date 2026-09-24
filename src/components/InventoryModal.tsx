import React, { useState } from 'react';
import { GameEngine } from '../game/GameEngine.ts';
import { ITEMS } from '../items/ItemDefinitions.ts';
import { RECIPES, canCraft, getItemCount } from '../systems/Crafting.ts';
import { Recipe, InventoryItem } from '../types.ts';
import { DropItem } from '../entities/DropItem.ts';
import { sound } from '../audio/SoundManager.ts';
import {
  X,
  Shield,
  Pickaxe,
  Swords,
  Rocket,
  Backpack,
  Hammer,
  Zap,
  Sparkles,
} from 'lucide-react';

interface InventoryModalProps {
  engine: GameEngine;
  onClose: () => void;
  onRefresh: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  engine,
  onClose,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'crafting'>('inventory');
  const [craftCategory, setCraftCategory] = useState<string>('all');
  const [selectedSlot, setSelectedSlot] = useState<{
    type: 'inventory' | 'hotbar' | 'equipment';
    index: number | string;
    item: InventoryItem | null;
  } | null>(null);

  const stats = engine.player.getStats(engine.equipment);

  // Equip handler
  const handleEquip = (item: InventoryItem, source: 'inventory' | 'hotbar', idx: number) => {
    const itemDef = ITEMS[item.id];
    if (!itemDef) return;

    sound.playClick();

    if (itemDef.category === 'weapon') {
      const prev = engine.equipment.weapon;
      engine.equipment.weapon = { id: item.id, count: 1 };
      replaceOrClearSource(source, idx, prev);
    } else if (itemDef.category === 'tool') {
      const prev = engine.equipment.tool;
      engine.equipment.tool = { id: item.id, count: 1 };
      replaceOrClearSource(source, idx, prev);
    } else if (itemDef.category === 'armor') {
      if (item.id.startsWith('jetpack')) {
        const prev = engine.equipment.booster;
        engine.equipment.booster = { id: item.id, count: 1 };
        replaceOrClearSource(source, idx, prev);
      } else {
        const prev = engine.equipment.armor;
        engine.equipment.armor = { id: item.id, count: 1 };
        replaceOrClearSource(source, idx, prev);
      }
    }
    setSelectedSlot(null);
    onRefresh();
  };

  const handleUnequip = (slotKey: 'weapon' | 'tool' | 'armor' | 'booster') => {
    const equipped = engine.equipment[slotKey];
    if (!equipped) return;

    sound.playClick();
    const added = engine.addItem(equipped.id, equipped.count);
    if (added) {
      engine.equipment[slotKey] = null;
    }
    setSelectedSlot(null);
    onRefresh();
  };

  const replaceOrClearSource = (
    source: 'inventory' | 'hotbar',
    idx: number,
    replacement: InventoryItem | null
  ) => {
    if (source === 'inventory') {
      engine.inventory[idx] = replacement;
    } else {
      engine.hotbar[idx] = replacement;
    }
  };

  const handleDropItem = (item: InventoryItem, source: 'inventory' | 'hotbar', idx: number) => {
    sound.playClick();
    engine.dropItems.push(
      new DropItem(
        engine.player.x + (engine.player.facing > 0 ? 30 : -30),
        engine.player.y,
        item.id,
        item.count
      )
    );
    if (source === 'inventory') engine.inventory[idx] = null;
    else engine.hotbar[idx] = null;
    setSelectedSlot(null);
    onRefresh();
  };

  const handleMoveToHotbar = (item: InventoryItem, invIdx: number) => {
    // Find empty hotbar slot
    const emptyIdx = engine.hotbar.findIndex((s) => s === null);
    if (emptyIdx !== -1) {
      sound.playClick();
      engine.hotbar[emptyIdx] = item;
      engine.inventory[invIdx] = null;
      setSelectedSlot(null);
      onRefresh();
    }
  };

  const handleDrink = (
    item: InventoryItem,
    source: 'inventory' | 'hotbar',
    idx: number
  ) => {
    const success = engine.drinkOrUseConsumable(item, source, idx);
    if (success) {
      const updatedItem = source === 'inventory' ? engine.inventory[idx] : engine.hotbar[idx];
      if (updatedItem) {
        setSelectedSlot({ type: source, index: idx, item: updatedItem });
      } else {
        setSelectedSlot(null);
      }
      onRefresh();
    }
  };

  // Filtered recipes
  const filteredRecipes = RECIPES.filter((r) => {
    if (craftCategory === 'all') return true;
    return r.category === craftCategory;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-950/80 max-w-4xl w-full flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header Tabs */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setActiveTab('inventory');
                sound.playClick();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'inventory'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-950'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Backpack className="w-4 h-4 text-cyan-400" />
              Инвентарь и Снаряжение
            </button>
            <button
              onClick={() => {
                setActiveTab('crafting');
                sound.playClick();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'crafting'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-md shadow-amber-950'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Hammer className="w-4 h-4 text-amber-400" />
              Верстак и Крафт
            </button>
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'inventory' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Equipment & Stats */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col gap-4">
                <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-4 h-4" /> Экипировка скафандра
                </h3>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* Weapon Slot */}
                  <div
                    onClick={() =>
                      engine.equipment.weapon &&
                      setSelectedSlot({
                        type: 'equipment',
                        index: 'weapon',
                        item: engine.equipment.weapon,
                      })
                    }
                    className="p-3 bg-slate-900 border border-slate-700/80 rounded-xl flex flex-col items-center justify-center min-h-[76px] cursor-pointer hover:border-cyan-400 transition-all text-center relative"
                  >
                    <span className="text-[10px] font-mono text-slate-400 mb-1 flex items-center gap-1">
                      <Swords className="w-3 h-3 text-cyan-400" /> Оружие
                    </span>
                    {engine.equipment.weapon ? (
                      <span className="text-xs font-bold text-cyan-200">
                        {ITEMS[engine.equipment.weapon.id]?.name}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-600">Пусто</span>
                    )}
                  </div>

                  {/* Tool Slot */}
                  <div
                    onClick={() =>
                      engine.equipment.tool &&
                      setSelectedSlot({
                        type: 'equipment',
                        index: 'tool',
                        item: engine.equipment.tool,
                      })
                    }
                    className="p-3 bg-slate-900 border border-slate-700/80 rounded-xl flex flex-col items-center justify-center min-h-[76px] cursor-pointer hover:border-amber-400 transition-all text-center relative"
                  >
                    <span className="text-[10px] font-mono text-slate-400 mb-1 flex items-center gap-1">
                      <Pickaxe className="w-3 h-3 text-amber-400" /> Бур / Кирка
                    </span>
                    {engine.equipment.tool ? (
                      <span className="text-xs font-bold text-amber-200">
                        {ITEMS[engine.equipment.tool.id]?.name}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-600">Пусто</span>
                    )}
                  </div>

                  {/* Armor Slot */}
                  <div
                    onClick={() =>
                      engine.equipment.armor &&
                      setSelectedSlot({
                        type: 'equipment',
                        index: 'armor',
                        item: engine.equipment.armor,
                      })
                    }
                    className="p-3 bg-slate-900 border border-slate-700/80 rounded-xl flex flex-col items-center justify-center min-h-[76px] cursor-pointer hover:border-emerald-400 transition-all text-center relative"
                  >
                    <span className="text-[10px] font-mono text-slate-400 mb-1 flex items-center gap-1">
                      <Shield className="w-3 h-3 text-emerald-400" /> Скафандр
                    </span>
                    {engine.equipment.armor ? (
                      <span className="text-xs font-bold text-emerald-200">
                        {ITEMS[engine.equipment.armor.id]?.name}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-600">Базовый</span>
                    )}
                  </div>

                  {/* Booster Slot */}
                  <div
                    onClick={() =>
                      engine.equipment.booster &&
                      setSelectedSlot({
                        type: 'equipment',
                        index: 'booster',
                        item: engine.equipment.booster,
                      })
                    }
                    className="p-3 bg-slate-900 border border-slate-700/80 rounded-xl flex flex-col items-center justify-center min-h-[76px] cursor-pointer hover:border-purple-400 transition-all text-center relative"
                  >
                    <span className="text-[10px] font-mono text-slate-400 mb-1 flex items-center gap-1">
                      <Rocket className="w-3 h-3 text-purple-400" /> Джетпак
                    </span>
                    {engine.equipment.booster ? (
                      <span className="text-xs font-bold text-purple-200">
                        {ITEMS[engine.equipment.booster.id]?.name}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-600">Пусто</span>
                    )}
                  </div>
                </div>

                {/* Exosuit Stats */}
                <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 text-xs font-mono space-y-1.5">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Макс. здоровье:</span>
                    <span className="text-rose-400 font-bold">{Math.round(stats.maxHp)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Броня и защита:</span>
                    <span className="text-sky-400 font-bold">{stats.defense}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Скорость бурения:</span>
                    <span className="text-amber-400 font-bold">x{stats.miningPower.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Скорость бега:</span>
                    <span className="text-emerald-400 font-bold">{(stats.speed * 10).toFixed(0)} км/ч</span>
                  </div>

                  {/* Active Drink Buff Indicators */}
                  {engine.player.shieldHp > 0 && (
                    <div className="flex justify-between text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2 py-1 rounded-lg">
                      <span className="flex items-center gap-1 font-bold">🛡️ Энергощит:</span>
                      <span className="text-cyan-300 font-bold">+{engine.player.shieldHp} HP</span>
                    </div>
                  )}
                  {engine.player.speedBuffTime > 0 && (
                    <div className="flex justify-between text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2 py-1 rounded-lg">
                      <span className="flex items-center gap-1 font-bold">⚡ Тоник скорости:</span>
                      <span className="text-amber-300 font-bold">{Math.ceil(engine.player.speedBuffTime)}с</span>
                    </div>
                  )}
                  {engine.player.defenseBuffTime > 0 && (
                    <div className="flex justify-between text-orange-300 bg-orange-950/60 border border-orange-500/30 px-2 py-1 rounded-lg">
                      <span className="flex items-center gap-1 font-bold">🛡️ Магма-броня:</span>
                      <span className="text-orange-300 font-bold">{Math.ceil(engine.player.defenseBuffTime)}с</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Center Column: Grids */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                {/* Hotbar Row */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                      Быстрый доступ (Hotbar 1-8)
                    </h4>
                    <span className="text-[10px] text-cyan-400/80 font-mono">
                      (Двойной клик или ПКМ на напиток = выпить)
                    </span>
                  </div>
                  <div className="grid grid-cols-8 gap-2">
                    {engine.hotbar.map((slot, idx) => {
                      const itemDef = slot ? ITEMS[slot.id] : null;
                      const isSelected =
                        selectedSlot?.type === 'hotbar' && selectedSlot?.index === idx;
                      const isDrink = itemDef?.category === 'consumable' || itemDef?.isDrinkable;

                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            if (slot) {
                              setSelectedSlot({ type: 'hotbar', index: idx, item: slot });
                              sound.playClick();
                            }
                          }}
                          onDoubleClick={() => {
                            if (slot && isDrink) {
                              handleDrink(slot, 'hotbar', idx);
                            }
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            if (slot && isDrink) {
                              handleDrink(slot, 'hotbar', idx);
                            }
                          }}
                          title={slot ? `${itemDef?.name || ''}${isDrink ? ' (Двойной клик или ПКМ чтобы выпить)' : ''}` : ''}
                          className={`w-12 h-12 bg-slate-950 border rounded-xl flex items-center justify-center cursor-pointer transition-all relative ${
                            isSelected
                              ? 'border-cyan-400 bg-cyan-950/50 shadow-md ring-2 ring-cyan-500/30'
                              : isDrink
                              ? 'border-emerald-500/50 hover:border-emerald-400 bg-emerald-950/15'
                              : 'border-slate-800 hover:border-slate-600'
                          }`}
                        >
                          <span className="absolute top-1 left-1.5 text-[8px] font-mono text-slate-500 font-bold">
                            {idx + 1}
                          </span>
                          {itemDef && (
                            isDrink ? (
                              <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center relative shadow-sm border border-emerald-400/40 bg-emerald-950/50"
                              >
                                <span className="text-xs">🥤</span>
                                <div
                                  className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full"
                                  style={{ backgroundColor: itemDef.iconColor }}
                                />
                              </div>
                            ) : (
                              <div
                                className="w-6 h-6 rounded-md flex items-center justify-center"
                                style={{ backgroundColor: `${itemDef.iconColor}30`, borderColor: itemDef.iconColor, borderWidth: 1 }}
                              >
                                <div className="w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: itemDef.iconColor }} />
                              </div>
                            )
                          )}
                          {slot && slot.count > 1 && (
                            <span className="absolute bottom-1 right-1 text-[9px] font-mono font-bold text-slate-200">
                              {slot.count}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Main Inventory 24 Slots */}
                <div>
                  <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Отсеки рюкзака (24 слота)
                  </h4>
                  <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                    {engine.inventory.map((slot, idx) => {
                      const itemDef = slot ? ITEMS[slot.id] : null;
                      const isSelected =
                        selectedSlot?.type === 'inventory' && selectedSlot?.index === idx;
                      const isDrink = itemDef?.category === 'consumable' || itemDef?.isDrinkable;

                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            if (slot) {
                              setSelectedSlot({ type: 'inventory', index: idx, item: slot });
                              sound.playClick();
                            }
                          }}
                          onDoubleClick={() => {
                            if (slot && isDrink) {
                              handleDrink(slot, 'inventory', idx);
                            }
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            if (slot && isDrink) {
                              handleDrink(slot, 'inventory', idx);
                            }
                          }}
                          title={slot ? `${itemDef?.name || ''}${isDrink ? ' (Двойной клик или ПКМ чтобы выпить)' : ''}` : ''}
                          className={`w-12 h-12 bg-slate-900 border rounded-xl flex items-center justify-center cursor-pointer transition-all relative ${
                            isSelected
                              ? 'border-cyan-400 bg-cyan-950/50 shadow-md ring-2 ring-cyan-500/30'
                              : isDrink
                              ? 'border-emerald-500/50 hover:border-emerald-400 bg-emerald-950/20'
                              : 'border-slate-800 hover:border-slate-600 hover:bg-slate-800/50'
                          }`}
                        >
                          {itemDef && (
                            isDrink ? (
                              <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center relative shadow-sm border border-emerald-400/40 bg-emerald-950/50"
                              >
                                <span className="text-xs">🥤</span>
                                <div
                                  className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full"
                                  style={{ backgroundColor: itemDef.iconColor }}
                                />
                              </div>
                            ) : (
                              <div
                                className="w-6 h-6 rounded-md flex items-center justify-center"
                                style={{ backgroundColor: `${itemDef.iconColor}30`, borderColor: itemDef.iconColor, borderWidth: 1 }}
                              >
                                <div className="w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: itemDef.iconColor }} />
                              </div>
                            )
                          )}
                          {slot && slot.count > 1 && (
                            <span className="absolute bottom-1 right-1 text-[9px] font-mono font-bold text-slate-200">
                              {slot.count}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-2 text-[11px] font-mono text-cyan-400/90 flex items-center gap-1.5 bg-cyan-950/30 px-3 py-1.5 rounded-lg border border-cyan-800/30">
                    <span>🥤</span>
                    <span>Можно пить прямо из инвентаря: выберите напиток и нажмите <b>«Выпить»</b>, либо сделайте <b>двойной клик / ПКМ</b>.</span>
                  </div>
                </div>

                {/* Item Details Panel & Actions */}
                {selectedSlot && selectedSlot.item && (
                  <div className="bg-slate-950 border border-cyan-500/40 rounded-xl p-4 mt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      {(() => {
                        const def = ITEMS[selectedSlot.item.id];
                        if (!def) return null;
                        return (
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-cyan-200">{def.name}</span>
                              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                                {def.category === 'consumable' ? 'Напиток / Стимулятор' : def.category}
                              </span>
                              {def.rarity && (
                                <span className="text-[10px] font-mono text-amber-400 capitalize">
                                  [{def.rarity}]
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-1 max-w-md">{def.description}</p>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="flex items-center flex-wrap gap-2">
                      {/* Drink / Consume button */}
                      {selectedSlot.type !== 'equipment' &&
                        (ITEMS[selectedSlot.item.id]?.category === 'consumable' ||
                          ITEMS[selectedSlot.item.id]?.isDrinkable) && (
                          <button
                            onClick={() =>
                              handleDrink(
                                selectedSlot.item!,
                                selectedSlot.type as 'inventory' | 'hotbar',
                                selectedSlot.index as number
                              )
                            }
                            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/30 flex items-center gap-2 active:scale-95 transition-all cursor-pointer border border-emerald-400/40"
                          >
                            <span className="text-sm">🥤</span>
                            <span>Выпить</span>
                          </button>
                        )}

                      {selectedSlot.type === 'equipment' ? (
                        <button
                          onClick={() => handleUnequip(selectedSlot.index as any)}
                          className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Снять
                        </button>
                      ) : (
                        <>
                          {['weapon', 'tool', 'armor'].includes(
                            ITEMS[selectedSlot.item.id]?.category || ''
                          ) && (
                            <button
                              onClick={() =>
                                handleEquip(
                                  selectedSlot.item!,
                                  selectedSlot.type as any,
                                  selectedSlot.index as any
                                )
                              }
                              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                            >
                              Экипировать
                            </button>
                          )}
                          {selectedSlot.type === 'inventory' && (
                            <button
                              onClick={() =>
                                handleMoveToHotbar(selectedSlot.item!, selectedSlot.index as number)
                              }
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
                            >
                              В Hotbar
                            </button>
                          )}
                          <button
                            onClick={() =>
                              handleDropItem(
                                selectedSlot.item!,
                                selectedSlot.type as any,
                                selectedSlot.index as any
                              )
                            }
                            className="px-3 py-1.5 bg-slate-800/80 hover:bg-rose-950 text-slate-400 hover:text-rose-300 rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            Выбросить
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Crafting Tab */
            <div className="flex flex-col gap-4">
              {/* Category Pills */}
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'Все чертежи' },
                  { id: 'consumables', label: '🥤 Напитки & Тоники' },
                  { id: 'tools', label: 'Инструменты' },
                  { id: 'weapons', label: 'Оружие' },
                  { id: 'armor', label: 'Скафандры & Ранцы' },
                  { id: 'blocks', label: 'Строительные блоки' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setCraftCategory(cat.id);
                      sound.playClick();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      craftCategory === cat.id
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                        : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Recipe Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredRecipes.map((recipe) => {
                  const targetItem = ITEMS[recipe.resultId];
                  const affordable = canCraft(recipe, engine.inventory, engine.hotbar);

                  return (
                    <div
                      key={recipe.id}
                      className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                        affordable
                          ? 'bg-slate-950/80 border-slate-700/80 hover:border-amber-400/80 shadow-md'
                          : 'bg-slate-950/40 border-slate-800/50 opacity-75'
                      }`}
                    >
                      <div>
                        {/* Title and Result Count */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center"
                              style={{
                                backgroundColor: `${targetItem?.iconColor}25`,
                                borderColor: targetItem?.iconColor,
                                borderWidth: 1.5,
                              }}
                            >
                              <div
                                className="w-4 h-4 rounded-sm"
                                style={{ backgroundColor: targetItem?.iconColor }}
                              />
                            </div>
                            <span className="font-bold text-sm text-slate-200">
                              {targetItem?.name} {recipe.resultCount > 1 && `x${recipe.resultCount}`}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-400 mb-3">{recipe.description}</p>

                        {/* Ingredients List */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {recipe.ingredients.map((ing) => {
                            const ingItem = ITEMS[ing.itemId];
                            const current = getItemCount(ing.itemId, engine.inventory, engine.hotbar);
                            const hasEnough = current >= ing.count;

                            return (
                              <div
                                key={ing.itemId}
                                className={`text-[11px] font-mono px-2 py-1 rounded-md border flex items-center gap-1.5 ${
                                  hasEnough
                                    ? 'bg-slate-900 border-emerald-500/40 text-emerald-300'
                                    : 'bg-slate-900 border-rose-500/40 text-rose-300'
                                }`}
                              >
                                <span>{ingItem?.name}:</span>
                                <span className="font-bold">
                                  {current}/{ing.count}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Craft Action Button */}
                      <button
                        disabled={!affordable}
                        onClick={() => {
                          engine.craftRecipe(recipe);
                          onRefresh();
                        }}
                        className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          affordable
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/40'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {affordable ? 'Создать предмет' : 'Недостаточно материалов'}
                      </button>
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
